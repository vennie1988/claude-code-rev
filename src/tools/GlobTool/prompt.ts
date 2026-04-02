/**
 * @fileoverview prompt.ts — GlobTool name and description
 * Tool description and name constants for the Glob file pattern matching tool.
 *
 * 设计说明:
 * - 基于 glob 模式匹配，支持任意代码库规模
 * - 结果按修改时间排序，便于找到最新文件
 * - 复杂搜索场景建议使用 Agent 工具
 *
 * @see GlobTool — 主工具实现
 */
export const GLOB_TOOL_NAME = 'Glob'

/**
 * Tool description guiding model usage of the Glob tool.
 * @see GlobTool
 */
export const DESCRIPTION = `- Fast file pattern matching tool that works with any codebase size
- Supports glob patterns like "**/*.js" or "src/**/*.ts"
- Returns matching file paths sorted by modification time
- Use this tool when you need to find files by name patterns
- When you are doing an open ended search that may require multiple rounds of globbing and grepping, use the Agent tool instead`
