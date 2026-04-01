/**
 * @fileoverview useMergedClients.ts — MCP client list merging hook
 * MCP客户端列表合并hook：将初始客户端与MCP动态发现的客户端合并去重。
 * Merges initial clients with dynamically discovered MCP clients, deduplicating by name.
 *
 * @design
 * - 使用uniqBy按name去重
 * - MCP客户端优先（mcpClients排在后面但通过uniqBy去重后位置不变）
 *
 * @design uniqBy deduplicates by name
 * @design MCP clients take precedence in deduplication
 */
import uniqBy from 'lodash-es/uniqBy.js'
import { useMemo } from 'react'
import type { MCPServerConnection } from '../services/mcp/types.js'

export function mergeClients(
  initialClients: MCPServerConnection[] | undefined,
  mcpClients: readonly MCPServerConnection[] | undefined,
): MCPServerConnection[] {
  if (initialClients && mcpClients && mcpClients.length > 0) {
    return uniqBy([...initialClients, ...mcpClients], 'name')
  }
  return initialClients || []
}

export function useMergedClients(
  initialClients: MCPServerConnection[] | undefined,
  mcpClients: MCPServerConnection[] | undefined,
): MCPServerConnection[] {
  return useMemo(
    () => mergeClients(initialClients, mcpClients),
    [initialClients, mcpClients],
  )
}
