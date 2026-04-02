/**
 * @fileoverview ink.ts — Ink TUI 颜色转换工具
 * Ink TUI Color Conversion Utilities
 *
 * 设计意图：
 * - 将 AgentColorName 颜色值转换为 Ink 的 TextProps['color'] 格式
 * - 支持主题颜色映射，使颜色符合当前主题
 * - 对未知颜色回退到原始 ANSI 颜色格式
 *
 * Design intent:
 * - Converts AgentColorName color values to Ink's TextProps['color'] format
 * - Supports theme color mapping for theme-consistent colors
 * - Falls back to raw ANSI color format for unknown colors
 */

import type { TextProps } from '../ink.js'
import {
  AGENT_COLOR_TO_THEME_COLOR,
  type AgentColorName,
} from '../tools/AgentTool/agentColorManager.js'

const DEFAULT_AGENT_THEME_COLOR = 'cyan_FOR_SUBAGENTS_ONLY'

/**
 * toInkColor — 转换颜色为 Ink TextProps 格式
 * Converts a color string to Ink's TextProps['color'] format.
 *
 * Colors are typically AgentColorName values like 'blue', 'green', etc.
 * This converts them to theme keys so they respect the current theme.
 * Falls back to the raw ANSI color if the color is not a known agent color.
 *
 * @param color - 颜色名称或 undefined
 * @returns Ink 的 TextProps['color'] 格式颜色值
 */
export function toInkColor(color: string | undefined): TextProps['color'] {
  if (!color) {
    return DEFAULT_AGENT_THEME_COLOR
  }
  // Try to map to a theme color if it's a known agent color
  const themeColor = AGENT_COLOR_TO_THEME_COLOR[color as AgentColorName]
  if (themeColor) {
    return themeColor
  }
  // Fall back to raw ANSI color for unknown colors
  return `ansi:${color}` as TextProps['color']
}
