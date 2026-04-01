/**
 * @fileoverview index.ts — Vim mode toggle command loader
 * /vim 命令入口，切换Vim/Normal编辑模式
 */
import type { Command } from '../../commands.js'

const command = {
  name: 'vim',
  description: 'Toggle between Vim and Normal editing modes',
  supportsNonInteractive: false,
  type: 'local',
  load: () => import('./vim.js'),
} satisfies Command

export default command
