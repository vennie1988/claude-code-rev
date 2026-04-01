/**
 * @fileoverview useIdeLogging.ts — IDE log event notification hook
 * IDE日志事件通知hook：通过MCP客户端注册日志事件通知处理器。
 * Registers IDE log event notification handler via MCP client.
 *
 * @design
 * - 通过MCP客户端注册log_event通知处理器
 * - 将IDE事件转发到telemetry系统（tengu_ide_前缀）
 * - 需要IDE客户端连接才生效
 *
 * @design Registers log_event notification handler with MCP client
 * @design Forwards IDE events to telemetry with tengu_ide_ prefix
 * @design Only active when IDE client is connected
 */
import { useEffect } from 'react'
import { logEvent } from 'src/services/analytics/index.js'
import { z } from 'zod/v4'
import type { MCPServerConnection } from '../services/mcp/types.js'
import { getConnectedIdeClient } from '../utils/ide.js'
import { lazySchema } from '../utils/lazySchema.js'

const LogEventSchema = lazySchema(() =>
  z.object({
    method: z.literal('log_event'),
    params: z.object({
      eventName: z.string(),
      eventData: z.object({}).passthrough(),
    }),
  }),
)

export function useIdeLogging(mcpClients: MCPServerConnection[]): void {
  useEffect(() => {
    // Skip if there are no clients
    if (!mcpClients.length) {
      return
    }

    // Find the IDE client from the MCP clients list
    const ideClient = getConnectedIdeClient(mcpClients)
    if (ideClient) {
      // Register the log event handler
      ideClient.client.setNotificationHandler(
        LogEventSchema(),
        notification => {
          const { eventName, eventData } = notification.params
          logEvent(
            `tengu_ide_${eventName}`,
            eventData as { [key: string]: boolean | number | undefined },
          )
        },
      )
    }
  }, [mcpClients])
}
