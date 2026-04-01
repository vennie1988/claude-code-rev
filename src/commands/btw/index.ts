/**
 * @fileoverview index.ts — BTW command entry point
 * 侧边问题命令入口
 *
 * 功能说明：
 * - 提供 /btw 命令，用于在不中断主对话的情况下快速提问
 * - 延迟加载实际实现
 */
import type { Command } from '../../commands.js'

const btw = {
  type: 'local-jsx',
  name: 'btw',
  description:
    // 中文：在不中断主对话的情况下快速提问
    'Ask a quick side question without interrupting the main conversation',
  immediate: true,
  argumentHint: '<question>',
  load: () => import('./btw.js'),
} satisfies Command

export default btw
