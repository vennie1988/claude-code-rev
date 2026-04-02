/**
 * @fileoverview postSamplingHooks.ts — 后采样 Hook / Post-sampling hooks
 *
 * ## 功能说明 (Description)
 * 后采样 Hook 在模型采样完成后调用。
 * 这是内部 API，不通过 settings.json 配置暴露，仅通过编程方式使用。
 *
 * Post-sampling hooks called after model sampling completes.
 * Internal API not exposed through settings.json, used programmatically only.
 */

import type { QuerySource } from '../../constants/querySource.js'
import type { ToolUseContext } from '../../Tool.js'
import type { Message } from '../../types/message.js'
import { toError } from '../errors.js'
import { logError } from '../log.js'
import type { SystemPrompt } from '../systemPromptType.js'

// Post-sampling hook - not exposed in settings.json config (yet), only used programmatically

// Generic context for REPL hooks (both post-sampling and stop hooks)
export type REPLHookContext = {
  messages: Message[] // Full message history including assistant responses
  systemPrompt: SystemPrompt
  userContext: { [k: string]: string }
  systemContext: { [k: string]: string }
  toolUseContext: ToolUseContext
  querySource?: QuerySource
}

export type PostSamplingHook = (
  context: REPLHookContext,
) => Promise<void> | void

// Internal registry for post-sampling hooks
const postSamplingHooks: PostSamplingHook[] = []

/**
 * Register a post-sampling hook that will be called after model sampling completes
 * This is an internal API not exposed through settings
 */
export function registerPostSamplingHook(hook: PostSamplingHook): void {
  postSamplingHooks.push(hook)
}

/**
 * Clear all registered post-sampling hooks (for testing)
 */
export function clearPostSamplingHooks(): void {
  postSamplingHooks.length = 0
}

/**
 * Execute all registered post-sampling hooks
 */
export async function executePostSamplingHooks(
  messages: Message[],
  systemPrompt: SystemPrompt,
  userContext: { [k: string]: string },
  systemContext: { [k: string]: string },
  toolUseContext: ToolUseContext,
  querySource?: QuerySource,
): Promise<void> {
  const context: REPLHookContext = {
    messages,
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext,
    querySource,
  }

  for (const hook of postSamplingHooks) {
    try {
      await hook(context)
    } catch (error) {
      // Log but don't fail on hook errors
      logError(toError(error))
    }
  }
}
