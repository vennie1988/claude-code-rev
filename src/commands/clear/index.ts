/**
 * @fileoverview index.ts — Clear command entry point
 * 清除命令入口
 *
 * 功能说明：
 * - 清除对话历史，释放上下文空间
 * - 提供 reset、new 别名
 * - 延迟加载实际实现以减少启动时间
 *
 * Utility functions:
 * - clearSessionCaches: import from './clear/caches.js'
 * - clearConversation: import from './clear/conversation.js'
 */
import type { Command } from '../../commands.js'

const clear = {
  type: 'local',
  name: 'clear',
  description: 'Clear conversation history and free up context', // 中文：清除对话历史，释放上下文
  aliases: ['reset', 'new'],
  supportsNonInteractive: false, // Should just create a new session
  load: () => import('./clear.js'),
} satisfies Command

export default clear
