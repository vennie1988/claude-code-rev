/**
 * @fileoverview jsonRead.ts — UTF-8 BOM 剥离工具
 * UTF-8 BOM Stripping Utility
 *
 * 设计意图：
 * - 从 JSON/文本内容中剥离 UTF-8 BOM (U+FEFF)
 * - PowerShell 5.x 默认以 UTF-8 BOM 写入文件（Out-File, Set-Content）
 * - 此模块作为叶子模块存在，以打破循环依赖：settings → json → log → types/logs → … → settings
 *
 * 设计决策：
 * - 此模块是叶子模块，被 json.ts 导入用于 memoized+logging safeParseJSON
 * - 叶子调用方（如 syncCacheState）无法导入 json.ts 时，直接使用 stripBOM + jsonParse
 *
 * Design intent:
 * - Strips UTF-8 BOM (U+FEFF) from JSON/text content
 * - PowerShell 5.x writes UTF-8 with BOM by default (Out-File, Set-Content)
 * - This is a leaf module to break circular dependency: settings → json → log → types/logs → … → settings
 *
 * Design decisions:
 * - Leaf module imported by json.ts for memoized+logging safeParseJSON
 * - Leaf callers that can't import json.ts use stripBOM + jsonParse inline (e.g. syncCacheState)
 */

const UTF8_BOM = '\uFEFF'

/**
 * stripBOM — 剥离 UTF-8 BOM
 * Removes UTF-8 BOM (U+FEFF) from the beginning of a string if present.
 *
 * @param content - 原始内容
 * @returns 剥离 BOM 后的内容
 */
export function stripBOM(content: string): string {
  return content.startsWith(UTF8_BOM) ? content.slice(1) : content
}
