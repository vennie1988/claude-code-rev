/**
 * @fileoverview index.ts — Status command definition
 * 状态命令定义文件：/status 命令，显示 Claude Code 状态信息
 * Defines the /status slash command that displays version, model, account,
 * API connectivity, and tool status information.
 *
 * @note 设置为 immediate: true，表示立即执行无需等待
 */
import type { Command } from '../../commands.js'

const status = {
  type: 'local-jsx',
  name: 'status',
  description:
    'Show Claude Code status including version, model, account, API connectivity, and tool statuses',
  immediate: true,
  load: () => import('./status.js'),
} satisfies Command

export default status
