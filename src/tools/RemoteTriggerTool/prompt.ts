/**
 * @fileoverview prompt.ts — RemoteTriggerTool 常量定义
 * Defines constants for the RemoteTrigger tool.
 *
 * 常量说明：
 * - REMOTE_TRIGGER_TOOL_NAME: 工具唯一标识名称
 * - DESCRIPTION: 工具描述
 * - PROMPT: 工具提示词
 */

/**
 * RemoteTrigger tool name — 远程触发器工具名称
 */
export const REMOTE_TRIGGER_TOOL_NAME = 'RemoteTrigger'

/**
 * Tool description — 工具描述
 */
export const DESCRIPTION =
  'Manage scheduled remote Claude Code agents (triggers) via the claude.ai CCR API. Auth is handled in-process — the token never reaches the shell.'

/**
 * Tool prompt — 工具提示词
 */
export const PROMPT = `Call the claude.ai remote-trigger API. Use this instead of curl — the OAuth token is added automatically in-process and never exposed.

Actions:
- list: GET /v1/code/triggers
- get: GET /v1/code/triggers/{trigger_id}
- create: POST /v1/code/triggers (requires body)
- update: POST /v1/code/triggers/{trigger_id} (requires body, partial update)
- run: POST /v1/code/triggers/{trigger_id}/run

The response is the raw JSON from the API.`
