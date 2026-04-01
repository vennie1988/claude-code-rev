/**
 * Early Input Capture / 早期输入捕获
 *
 * This module captures terminal input that is typed before the REPL is fully
 * initialized. Users often type `claude` and immediately start typing their
 * prompt, but those early keystrokes would otherwise be lost during startup.
 * 此模块捕获在 REPL 完全初始化之前输入的终端输入。
 * 用户经常在输入 `claude` 后立即开始输入提示，但这些早期按键会在启动过程中丢失。
 *
 * Usage / 用法:
 * 1. Call startCapturingEarlyInput() as early as possible in cli.tsx
 *    在 cli.tsx 中尽早调用 startCapturingEarlyInput()
 * 2. When REPL is ready, call consumeEarlyInput() to get any buffered text
 *    当 REPL 就绪时，调用 consumeEarlyInput() 获取缓冲的文本
 * 3. stopCapturingEarlyInput() is called automatically when input is consumed
 *    当输入被消耗时自动调用 stopCapturingEarlyInput()
 */

import { lastGrapheme } from './intl.js'

// Buffer for early input characters / 早期输入字符的缓冲区
let earlyInputBuffer = ''
// Flag to track if we're currently capturing / 标志：跟踪我们是否正在捕获
let isCapturing = false
// Reference to the readable handler so we can remove it later / 可读处理器的引用，以便后续移除
let readableHandler: (() => void) | null = null

/**
 * Start capturing stdin data early, before the REPL is initialized.
 * Should be called as early as possible in the startup sequence.
 * 在 REPL 初始化之前尽早开始捕获 stdin 数据。应在启动序列中尽早调用。
 *
 * Only captures if stdin is a TTY (interactive terminal).
 * 仅在 stdin 是 TTY（交互式终端）时捕获。
 */
export function startCapturingEarlyInput(): void {
  // Only capture in interactive mode: stdin must be a TTY, and we must not
  // be in print mode. Raw mode disables ISIG (terminal Ctrl+C → SIGINT),
  // which would make -p uninterruptible.
  if (
    !process.stdin.isTTY ||
    isCapturing ||
    process.argv.includes('-p') ||
    process.argv.includes('--print')
  ) {
    return
  }

  isCapturing = true
  earlyInputBuffer = ''

  // Set stdin to raw mode and use 'readable' event like Ink does
  // This ensures compatibility with how the REPL will handle stdin later
  try {
    process.stdin.setEncoding('utf8')
    process.stdin.setRawMode(true)
    process.stdin.ref()

    readableHandler = () => {
      let chunk = process.stdin.read()
      while (chunk !== null) {
        if (typeof chunk === 'string') {
          processChunk(chunk)
        }
        chunk = process.stdin.read()
      }
    }

    process.stdin.on('readable', readableHandler)
  } catch {
    // If we can't set raw mode, just silently continue without early capture
    isCapturing = false
  }
}

/**
 * Process a chunk of input data / 处理一块输入数据
 *
 * Parses raw input chunks, handling control characters, escape sequences,
 * backspace, and printable characters. Converts carriage returns to newlines.
 * 解析原始输入块，处理控制字符、转义序列、退格键和可打印字符。
 * 将回车符转换为换行符。
 */
function processChunk(str: string): void {
  let i = 0
  while (i < str.length) {
    const char = str[i]!
    const code = char.charCodeAt(0)

    // Ctrl+C (code 3) - stop capturing and exit immediately.
    // We use process.exit here instead of gracefulShutdown because at this
    // early stage of startup, the shutdown machinery isn't initialized yet.
    if (code === 3) {
      stopCapturingEarlyInput()
      // eslint-disable-next-line custom-rules/no-process-exit
      process.exit(130) // Standard exit code for Ctrl+C
      return
    }

    // Ctrl+D (code 4) - EOF, stop capturing
    if (code === 4) {
      stopCapturingEarlyInput()
      return
    }

    // Backspace (code 127 or 8) - remove last grapheme cluster
    if (code === 127 || code === 8) {
      if (earlyInputBuffer.length > 0) {
        const last = lastGrapheme(earlyInputBuffer)
        earlyInputBuffer = earlyInputBuffer.slice(0, -(last.length || 1))
      }
      i++
      continue
    }

    // Skip escape sequences (arrow keys, function keys, focus events, etc.)
    // All escape sequences start with ESC (0x1B) and end with a byte in 0x40-0x7E
    if (code === 27) {
      i++ // Skip the ESC character
      // Skip until the terminating byte (@ to ~) or end of string
      while (
        i < str.length &&
        !(str.charCodeAt(i) >= 64 && str.charCodeAt(i) <= 126)
      ) {
        i++
      }
      if (i < str.length) i++ // Skip the terminating byte
      continue
    }

    // Skip other control characters (except tab and newline)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      i++
      continue
    }

    // Convert carriage return to newline
    if (code === 13) {
      earlyInputBuffer += '\n'
      i++
      continue
    }

    // Add printable characters and allowed control chars to buffer
    earlyInputBuffer += char
    i++
  }
}

/**
 * Stop capturing early input.
 * Called automatically when input is consumed, or can be called manually.
 * 停止捕获早期输入。在输入被消耗时自动调用，也可手动调用。
 */
export function stopCapturingEarlyInput(): void {
  if (!isCapturing) {
    return
  }

  isCapturing = false

  if (readableHandler) {
    process.stdin.removeListener('readable', readableHandler)
    readableHandler = null
  }

  // Don't reset stdin state - the REPL's Ink App will manage stdin state.
  // If we call setRawMode(false) here, it can interfere with the REPL's
  // own stdin setup which happens around the same time.
}

/**
 * Consume any early input that was captured.
 * Returns the captured input and clears the buffer.
 * Automatically stops capturing when called.
 * 消耗任何已捕获的早期输入。返回捕获的输入并清除缓冲区。
 * 调用时自动停止捕获。
 */
export function consumeEarlyInput(): string {
  stopCapturingEarlyInput()
  const input = earlyInputBuffer.trim()
  earlyInputBuffer = ''
  return input
}

/**
 * Check if there is any early input available without consuming it.
 * 检查是否有任何早期输入可用而不消耗它。
 */
export function hasEarlyInput(): boolean {
  return earlyInputBuffer.trim().length > 0
}

/**
 * Seed the early input buffer with text that will appear pre-filled
 * in the prompt input when the REPL renders. Does not auto-submit.
 * 使用文本填充早期输入缓冲区，当 REPL 渲染时将预填充在提示输入中。不会自动提交。
 */
export function seedEarlyInput(text: string): void {
  earlyInputBuffer = text
}

/**
 * Check if early input capture is currently active.
 * 检查早期输入捕获是否处于活动状态。
 */
export function isCapturingEarlyInput(): boolean {
  return isCapturing
}
