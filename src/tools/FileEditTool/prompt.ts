/**
 * @fileoverview prompt.ts — FileEditTool description and constants
 * Tool prompt template and formatting constants for the Edit tool.
 *
 * 设计说明:
 * - 根据 compactLinePrefix 特性标志动态调整行号格式说明
 * - 包含预读指令，要求在编辑前先读取文件
 * - 针对 Ant 用户提供最小化 old_string 唯一性提示
 *
 * @see FileEditTool — 主工具实现
 * @see FileEditTool/types.ts — 类型定义
 */
import { isCompactLinePrefixEnabled } from '../../utils/file.js'
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'

/**
 * Returns the pre-read instruction requiring model to read files before editing.
 * Ensures the model has the current file content before attempting edits.
 *
 * @returns Pre-read instruction string with FileReadTool name
 */
function getPreReadInstruction(): string {
  return `\n- You must use your \`${FILE_READ_TOOL_NAME}\` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file. `
}

/**
 * Returns the full Edit tool description for the model.
 * Entry point that delegates to the default description implementation.
 *
 * @returns Complete tool description string
 */
export function getEditToolDescription(): string {
  return getDefaultEditDescription()
}

/**
 * Generates the default Edit tool description with dynamic formatting hints.
 * Includes platform-specific line prefix format and Ant user optimizations.
 *
 * @returns Complete tool description with usage guidelines
 */
function getDefaultEditDescription(): string {
  const prefixFormat = isCompactLinePrefixEnabled()
    ? 'line number + tab'
    : 'spaces + line number + arrow'
  const minimalUniquenessHint =
    process.env.USER_TYPE === 'ant'
      ? `\n- Use the smallest old_string that's clearly unique — usually 2-4 adjacent lines is sufficient. Avoid including 10+ lines of context when less uniquely identifies the target.`
      : ''
  return `Performs exact string replacements in files.

Usage:${getPreReadInstruction()}
- When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix. The line number prefix format is: ${prefixFormat}. Everything after that is the actual file content to match. Never include any part of the line number prefix in the old_string or new_string.
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.
- The edit will FAIL if \`old_string\` is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use \`replace_all\` to change every instance of \`old_string\`.${minimalUniquenessHint}
- Use \`replace_all\` for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.`
}
