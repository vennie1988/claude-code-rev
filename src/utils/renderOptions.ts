/**
 * @fileoverview renderOptions.ts — Ink TUI 渲染选项工具函数
 *
 * 提供 getBaseRenderOptions() 获取 Ink 渲染的基础选项，包括 stdin override。
 * 当 stdin 是管道时，尝试打开 /dev/tty 作为替代输入源，使交互式渲染正常工作。
 *
 * 设计决策：
 * - 缓存 stdin override 计算结果（每个进程只计算一次）
 * - CI 环境、MCP 模式、Windows 平台不尝试 /dev/tty fallback
 *
 * @note Windows 不支持 /dev/tty；CI 环境下跳过以避免不必要操作
 */
import { openSync } from 'fs'
import { ReadStream } from 'tty'
import type { RenderOptions } from '../ink.js'
import { isEnvTruthy } from './envUtils.js'
import { logError } from './log.js'

// Cached stdin override - computed once per process
let cachedStdinOverride: ReadStream | undefined | null = null

/**
 * getStdinOverride — 获取 /dev/tty ReadStream（当 stdin 是管道时）
 *
 * 当 stdin 被管道时，打开 /dev/tty 作为替代输入源，实现交互式 Ink 渲染。
 * 结果缓存于进程生命周期内（每个进程只计算一次）。
 *
 * @returns /dev/tty 的 ReadStream，或 undefined（stdin 已是 TTY/CI 环境/MCP/Windows）
 */
function getStdinOverride(): ReadStream | undefined {
  // Return cached result if already computed
  if (cachedStdinOverride !== null) {
    return cachedStdinOverride
  }

  // No override needed if stdin is already a TTY
  if (process.stdin.isTTY) {
    cachedStdinOverride = undefined
    return undefined
  }

  // Skip in CI environments
  if (isEnvTruthy(process.env.CI)) {
    cachedStdinOverride = undefined
    return undefined
  }

  // Skip if running MCP (input hijacking breaks MCP)
  if (process.argv.includes('mcp')) {
    cachedStdinOverride = undefined
    return undefined
  }

  // No /dev/tty on Windows
  if (process.platform === 'win32') {
    cachedStdinOverride = undefined
    return undefined
  }

  // Try to open /dev/tty as an alternative input source
  try {
    const ttyFd = openSync('/dev/tty', 'r')
    const ttyStream = new ReadStream(ttyFd)
    // Explicitly set isTTY to true since we know /dev/tty is a TTY.
    // This is needed because some runtimes (like Bun's compiled binaries)
    // may not correctly detect isTTY on ReadStream created from a file descriptor.
    ttyStream.isTTY = true
    cachedStdinOverride = ttyStream
    return cachedStdinOverride
  } catch (err) {
    logError(err as Error)
    cachedStdinOverride = undefined
    return undefined
  }
}

/**
 * getBaseRenderOptions — 获取 Ink 渲染基础选项（含 stdin override）
 *
 * 返回 Ink render() 的基础选项，包括需要时的 stdin override。
 * 所有 render() 调用都应使用此函数确保管道输入正常工作。
 *
 * @param exitOnCtrlC - 是否在 Ctrl+C 时退出（对话框通常为 false）
 * @returns RenderOptions 对象
 */
export function getBaseRenderOptions(
  exitOnCtrlC: boolean = false,
): RenderOptions {
  const stdin = getStdinOverride()
  const options: RenderOptions = { exitOnCtrlC }
  if (stdin) {
    options.stdin = stdin
  }
  return options
}
