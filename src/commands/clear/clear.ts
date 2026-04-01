/**
 * @fileoverview clear.ts — Clear command implementation
 * 清除命令实现
 *
 * 功能说明：
 * - 调用 clearConversation 清除对话
 * - 返回空文本结果
 */
import type { LocalCommandCall } from '../../types/command.js'
import { clearConversation } from './conversation.js'

/**
 * Clear command call handler
 * 清除命令调用处理函数
 */
export const call: LocalCommandCall = async (_, context) => {
  await clearConversation(context)
  return { type: 'text', value: '' }
}
