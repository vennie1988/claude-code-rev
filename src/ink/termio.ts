/**
 * ANSI Parser Module / ANSI 解析器模块
 *
 * A semantic ANSI escape sequence parser inspired by ghostty, tmux, and iTerm2.
 * 灵感来自 ghostty、tmux 和 iTerm2 的语义 ANSI 转义序列解析器。
 *
 * Key features:
 * - Semantic output: produces structured actions, not string tokens
 * - Streaming: can parse input incrementally via Parser class
 * - Style tracking: maintains text style state across parse calls
 * - Comprehensive: supports SGR, CSI, OSC, ESC sequences
 *
 * 主要特性：
 * - 语义输出：生成结构化动作，而非字符串标记
 * - 流式处理：可通过 Parser 类增量解析输入
 * - 样式跟踪：在解析调用之间维护文本样式状态
 * - 全面支持：SGR、CSI、OSC、ESC 序列
 *
 * Usage:
 *
 * ```typescript
 * import { Parser } from './termio.js'
 *
 * const parser = new Parser()
 * const actions = parser.feed('\x1b[31mred\x1b[0m')
 * // => [{ type: 'text', graphemes: [...], style: { fg: { type: 'named', name: 'red' }, ... } }]
 * ```
 */

// Parser
export { Parser } from './termio/parser.js'
// Types
export type {
  Action,
  Color,
  CursorAction,
  CursorDirection,
  EraseAction,
  Grapheme,
  LinkAction,
  ModeAction,
  NamedColor,
  ScrollAction,
  TextSegment,
  TextStyle,
  TitleAction,
  UnderlineStyle,
} from './termio/types.js'
export { colorsEqual, defaultStyle, stylesEqual } from './termio/types.js'
