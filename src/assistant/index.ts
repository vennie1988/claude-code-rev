/**
 * @fileoverview index.ts — Assistant mode utilities
 *
 * Utilities for checking and managing assistant mode.
 * Assistant mode is a special mode where Claude Code acts as an assistant.
 *
 * 设计说明：
 * - index.ts 提供助手模式的检查和管理工具
 * - 助手模式是 Claude Code 作为助手运行的特殊模式
 */

function readAssistantModeFlag(): boolean {
  return (
    process.env.CLAUDE_CODE_ASSISTANT_MODE === '1' ||
    process.env.CLAUDE_CODE_ASSISTANT_MODE === 'true'
  )
}

export function isAssistantMode(): boolean {
  return readAssistantModeFlag()
}

export function isAssistantModeEnabled(): boolean {
  return readAssistantModeFlag()
}
