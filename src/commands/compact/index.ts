/**
 * @fileoverview index.ts — Compact command entry point
 * 上下文压缩命令入口
 *
 * 功能说明：
 * - 对话上下文压缩命令，通过摘要减少 token 使用
 * - 支持自定义压缩指令
 * - 可通过环境变量 DISABLE_COMPACT 禁用
 */
import type { Command } from '../../commands.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

const compact = {
  type: 'local',
  name: 'compact',
  description:
    // 中文：清除对话历史但保留摘要，支持自定义压缩指令
    'Clear conversation history but keep a summary in context. Optional: /compact [instructions for summarization]',
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_COMPACT),
  supportsNonInteractive: true,
  argumentHint: '<optional custom summarization instructions>',
  load: () => import('./compact.js'),
} satisfies Command

export default compact
