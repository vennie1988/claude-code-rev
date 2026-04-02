/**
 * @fileoverview messagePredicates.ts — 消息类型谓词 / Message type predicates
 *
 * Provides type guard predicates for message discrimination.
 * Key insight: tool_result messages share type:'user' with human turns —
 * discriminant is the optional toolUseResult field.
 *
 * 提供消息类型守卫谓词，用于消息类型区分。
 * 关键洞察：tool_result 消息与人类回合共享 type:'user'，
 * 区分依据是可选的 toolUseResult 字段。
 */

import type { Message, UserMessage } from '../types/message.js'

// tool_result messages share type:'user' with human turns; the discriminant
// is the optional toolUseResult field. Four PRs (#23977, #24016, #24022,
// #24025) independently fixed miscounts from checking type==='user' alone.
export function isHumanTurn(m: Message): m is UserMessage {
  return m.type === 'user' && !m.isMeta && m.toolUseResult === undefined
}
