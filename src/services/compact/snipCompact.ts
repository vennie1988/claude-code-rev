/**
 * @fileoverview snipCompact.ts — Snip-based context compaction
 *
 * Performs snip-based compaction to reduce message context size.
 * This is a stub that returns messages unchanged — full implementation
 * was not recovered.
 *
 * @note This module is part of the degraded/restored source tree.
 *
 * 执行基于剪切的压缩以减小消息上下文大小。
 * 这是存根,原样返回消息 — 完整实现未恢复。
 */

export function snipCompactIfNeeded<T>(messages: T, _options?: unknown): {
  messages: T
  changed: boolean
} {
  return { messages, changed: false }
}

export function isSnipBoundaryMessage(): boolean {
  return false
}
