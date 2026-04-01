/**
 * @fileoverview index.ts — Theme command definition
 * 主题命令定义文件：/theme 命令，用于更改 Claude Code 主题外观
 * Defines the /theme slash command for changing Claude Code's visual theme.
 */
import type { Command } from '../../commands.js'

const theme = {
  type: 'local-jsx',
  name: 'theme',
  description: 'Change the theme',
  load: () => import('./theme.js'),
} satisfies Command

export default theme
