/**
 * @fileoverview useIdeConnectionStatus.ts — IDE connection status hook
 * IDE连接状态hook：通过MCP客户端列表查询当前IDE的连接状态。
 * Queries IDE connection status from the MCP client list.
 *
 * @design
 * - 查找名为'ide'的MCP客户端
 * - 返回connected/pending/disconnected/null状态
 * - 提取SSE/WS类型IDE的配置中的IDE名称
 *
 * @design Finds MCP client named 'ide'
 * @design Returns connected/pending/disconnected/null status
 * @design Extracts IDE name from SSE/WS type config
 */
import { useMemo } from 'react'
import type { MCPServerConnection } from '../services/mcp/types.js'

export type IdeStatus = 'connected' | 'disconnected' | 'pending' | null

type IdeConnectionResult = {
  status: IdeStatus
  ideName: string | null
}

export function useIdeConnectionStatus(
  mcpClients?: MCPServerConnection[],
): IdeConnectionResult {
  return useMemo(() => {
    const ideClient = mcpClients?.find(client => client.name === 'ide')
    if (!ideClient) {
      return { status: null, ideName: null }
    }
    // Extract IDE name from config if available
    const config = ideClient.config
    const ideName =
      config.type === 'sse-ide' || config.type === 'ws-ide'
        ? config.ideName
        : null
    if (ideClient.type === 'connected') {
      return { status: 'connected', ideName }
    }
    if (ideClient.type === 'pending') {
      return { status: 'pending', ideName }
    }
    return { status: 'disconnected', ideName }
  }, [mcpClients])
}
