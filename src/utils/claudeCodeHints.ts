/**
 * Claude Code hints protocol.
 * Claude Code 提示协议 / Claude Code hints protocol
 *
 * CLIs and SDKs running under Claude Code can emit a self-closing
 * `<claude-code-hint />` tag to stderr (merged into stdout by the shell
 * tools). The harness scans tool output for these tags, strips them before
 * the output reaches the model, and surfaces an install prompt to the
 * user — no inference, no proactive execution.
 *
 * 本文件提供解析器和模块级存储 / This file provides both the parser and a small module-level store:
 * - extractClaudeCodeHints(): 从工具输出中解析提示标签 / Parse hint tags from tool output
 * - setPendingHint()/getPendingHintSnapshot(): 单槽存储,一次只显示一个提示 / Single-slot store — at most one prompt per session
 * - React 通过 useSyncExternalStore 订阅 / React subscribes via useSyncExternalStore
 *
 * 设计决策 / Design decisions:
 * - 单槽存储: 一次只显示一个提示,无需队列 / Single slot: at most one prompt per session, no need to accumulate
 * - 整行匹配: 避免日志中的标签被误识别 / Whole-line matching prevents false positives in log statements
 * - 版本过滤: 未知版本会被丢弃 / Unknown spec versions are dropped
 *
 * @see docs/claude-code-hints.md — vendor-facing spec
 */

import { logForDebugging } from './debug.js'
import { createSignal } from './signal.js'

export type ClaudeCodeHintType = 'plugin'

export type ClaudeCodeHint = {
  /** Spec version declared by the emitter. Unknown versions are dropped. */
  v: number
  /** Hint discriminator. v1 defines only `plugin`. */
  type: ClaudeCodeHintType
  /**
   * Hint payload. For `type: 'plugin'`: a `name@marketplace` slug
   * matching the form accepted by `parsePluginIdentifier`.
   */
  value: string
  /**
   * First token of the shell command that produced this hint. Shown in the
   * install prompt so the user can spot a mismatch between the tool that
   * emitted the hint and the plugin it recommends.
   */
  sourceCommand: string
}

/** Spec versions this harness understands. */
const SUPPORTED_VERSIONS = new Set([1])

/** Hint types this harness understands at the supported versions. */
const SUPPORTED_TYPES = new Set<string>(['plugin'])

/**
 * Outer tag match. Anchored to whole lines (multiline mode) so that a
 * hint marker buried in a larger line — e.g. a log statement quoting the
 * tag — is ignored. Leading and trailing whitespace on the line is
 * tolerated since some SDKs pad stderr.
 */
const HINT_TAG_RE = /^[ \t]*<claude-code-hint\s+([^>]*?)\s*\/>[ \t]*$/gm

/**
 * Attribute matcher. Accepts `key="value"` and `key=value` (terminated by
 * whitespace or `/>` closing sequence). Values containing whitespace or `"` must use the quoted
 * form. The quoted form does not support escape sequences; raise the spec
 * version if that becomes necessary.
 */
const ATTR_RE = /(\w+)=(?:"([^"]*)"|([^\s/>]+))/g

/**
 * Scan shell tool output for hint tags, returning the parsed hints and
 * the output with hint lines removed. The stripped output is what the
 * model sees — hints are a harness-only side channel.
 * 扫描 shell 工具输出中的提示标签 / Scan shell tool output for hint tags
 *
 * @param output - Raw command output (stdout with stderr interleaved). 原始命令输出
 * @param command - The command that produced the output; its first 产生输出的命令
 *   whitespace-separated token is recorded as `sourceCommand`. 第一个词记录为 sourceCommand
 */
export function extractClaudeCodeHints(
  output: string,
  command: string,
): { hints: ClaudeCodeHint[]; stripped: string } {
  // Fast path: no tag open sequence → no work, no allocation.
  if (!output.includes('<claude-code-hint')) {
    return { hints: [], stripped: output }
  }

  const sourceCommand = firstCommandToken(command)
  const hints: ClaudeCodeHint[] = []

  const stripped = output.replace(HINT_TAG_RE, rawLine => {
    const attrs = parseAttrs(rawLine)
    const v = Number(attrs.v)
    const type = attrs.type
    const value = attrs.value

    if (!SUPPORTED_VERSIONS.has(v)) {
      logForDebugging(
        `[claudeCodeHints] dropped hint with unsupported v=${attrs.v}`,
      )
      return ''
    }
    if (!type || !SUPPORTED_TYPES.has(type)) {
      logForDebugging(
        `[claudeCodeHints] dropped hint with unsupported type=${type}`,
      )
      return ''
    }
    if (!value) {
      logForDebugging('[claudeCodeHints] dropped hint with empty value')
      return ''
    }

    hints.push({ v, type: type as ClaudeCodeHintType, value, sourceCommand })
    return ''
  })

  // Dropping a matched line leaves a blank line (the surrounding newlines
  // remain). Collapse runs of blank lines introduced by the replace so the
  // model-visible output doesn't grow vertical whitespace.
  const collapsed =
    hints.length > 0 || stripped !== output
      ? stripped.replace(/\n{3,}/g, '\n\n')
      : stripped

  return { hints, stripped: collapsed }
}

function parseAttrs(tagBody: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const m of tagBody.matchAll(ATTR_RE)) {
    attrs[m[1]!] = m[2] ?? m[3] ?? ''
  }
  return attrs
}

function firstCommandToken(command: string): string {
  const trimmed = command.trim()
  const spaceIdx = trimmed.search(/\s/)
  return spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
}

// ============================================================================
// Pending-hint store (useSyncExternalStore interface)
// 挂起提示存储 / Pending-hint store
//
// Single-slot: write wins if the slot is already full (a CLI that emits on
// every invocation would otherwise pile up). The dialog is shown at most
// once per session; after that, setPendingHint becomes a no-op.
// 单槽: 如果槽已满则覆盖(后写入优先) — CLI 每次调用都发送提示时避免堆积
// 对话框每会话最多显示一次; 之后 setPendingHint 变为空操作
//
// Callers should gate before writing (installed? already shown? cap hit?) —
// see maybeRecordPluginHint in hintRecommendation.ts for the plugin-type
// gate. This module stays plugin-agnostic so future hint types can reuse
// the same store.
// 调用者应在写入前进行门控检查(已安装? 已显示? 达到上限?) — 插件类型门控见 hintRecommendation.ts
// 本模块保持插件无关,便于未来提示类型复用同一存储
// ============================================================================

let pendingHint: ClaudeCodeHint | null = null
let shownThisSession = false
const pendingHintChanged = createSignal()
const notify = pendingHintChanged.emit

/** Raw store write. Callers should gate first (see module comment). */
/** 原始存储写入 / Raw store write. 调用者应先进行门控检查(见模块注释)。 */
export function setPendingHint(hint: ClaudeCodeHint): void {
  if (shownThisSession) return
  pendingHint = hint
  notify()
}

/** Clear the slot without flipping the session flag — for rejected hints. */
/** 清除槽位但不翻转会话标志 — 用于被拒绝的提示 / Clear slot without flipping session flag — for rejected hints */
export function clearPendingHint(): void {
  if (pendingHint !== null) {
    pendingHint = null
    notify()
  }
}

/** Flip the once-per-session flag. Call only when a dialog is actually shown. */
/** 翻转每会话一次标志 / Flip the once-per-session flag. 仅在实际显示对话框时调用。 */
export function markShownThisSession(): void {
  shownThisSession = true
}

/** 订阅挂起提示变更 / Subscribe to pending hint changes (useSyncExternalStore) */
export const subscribeToPendingHint = pendingHintChanged.subscribe

/** 获取挂起提示快照 / Get pending hint snapshot */
export function getPendingHintSnapshot(): ClaudeCodeHint | null {
  return pendingHint
}

/** 检查本会话是否已显示提示 / Check if hint has been shown this session */
export function hasShownHintThisSession(): boolean {
  return shownThisSession
}

/** Test-only reset. 测试专用重置 / Test-only reset */
export function _resetClaudeCodeHintStore(): void {
  pendingHint = null
  shownThisSession = false
}

export const _test = {
  parseAttrs,
  firstCommandToken,
}
