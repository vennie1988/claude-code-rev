/**
 * @fileoverview prompt.ts — TaskStopTool 常量定义
 * Defines constants for TaskStopTool.
 *
 * 常量说明：
 * - TASK_STOP_TOOL_NAME: 工具名称
 * - DESCRIPTION: 工具描述
 */

export const TASK_STOP_TOOL_NAME = 'TaskStop'

export const DESCRIPTION = `
- Stops a running background task by its ID
- Takes a task_id parameter identifying the task to stop
- Returns a success or failure status
- Use this tool when you need to terminate a long-running task
`
