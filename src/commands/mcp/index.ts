/**
 * @fileoverview index.ts — MCP command loader entry point
 * /mcp 命令的入口文件，负责注册本地JSX命令处理器
 * Loads the MCP management UI component when user runs /mcp
 */
import type { Command } from '../../commands.js'

const mcp = {
  type: 'local-jsx',
  name: 'mcp',
  description: 'Manage MCP servers',
  immediate: true,
  argumentHint: '[enable|disable [server-name]]',
  load: () => import('./mcp.js'),
} satisfies Command

export default mcp
