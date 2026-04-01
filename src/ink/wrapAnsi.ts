/**
 * ANSI-aware Text Wrapping / ANSI感知的文本换行
 *
 * Wraps text while preserving ANSI escape sequences.
 * 在保留 ANSI 转义序列的同时换行文本。
 *
 * Uses Bun.wrapAnsi when available, falls back to wrap-ansi npm package.
 * 可用时使用 Bun.wrapAnsi，回退到 wrap-ansi npm 包。
 */

import wrapAnsiNpm from 'wrap-ansi'

type WrapAnsiOptions = {
  hard?: boolean
  wordWrap?: boolean
  trim?: boolean
}

const wrapAnsiBun =
  typeof Bun !== 'undefined' && typeof Bun.wrapAnsi === 'function'
    ? Bun.wrapAnsi
    : null

const wrapAnsi: (
  input: string,
  columns: number,
  options?: WrapAnsiOptions,
) => string = wrapAnsiBun ?? wrapAnsiNpm

export { wrapAnsi }
