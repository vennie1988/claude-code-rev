/**
 * @fileoverview useMergedCommands.ts — Command list merging hook
 * 命令列表合并hook：将初始命令与MCP动态发现的命令合并去重。
 * Merges initial commands with dynamically discovered MCP commands, deduplicating by name.
 *
 * @design
 * - 使用uniqBy按name去重
 * - 如果mcpCommands为空则直接返回initialCommands
 *
 * @design uniqBy deduplicates by name
 * @design Returns initialCommands directly if mcpCommands is empty
 */
import uniqBy from 'lodash-es/uniqBy.js'
import { useMemo } from 'react'
import type { Command } from '../commands.js'

export function useMergedCommands(
  initialCommands: Command[],
  mcpCommands: Command[],
): Command[] {
  return useMemo(() => {
    if (mcpCommands.length > 0) {
      return uniqBy([...initialCommands, ...mcpCommands], 'name')
    }
    return initialCommands
  }, [initialCommands, mcpCommands])
}
