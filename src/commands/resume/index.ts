/**
 * @fileoverview index.ts — Resume command loader
 * /resume 命令入口，恢复之前的对话会话
 * 支持通过会话ID或搜索词恢复会话
 */
import type { Command } from '../../commands.js'

const resume: Command = {
  type: 'local-jsx',
  name: 'resume',
  description: 'Resume a previous conversation',
  aliases: ['continue'],
  argumentHint: '[conversation id or search term]',
  load: () => import('./resume.js'),
}

export default resume
