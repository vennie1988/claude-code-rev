/**
 * @fileoverview prompt.ts — ReadMcpResourceTool 常量定义
 * Defines constants for the ReadMcpResource tool.
 *
 * 常量说明：
 * - DESCRIPTION: 工具描述
 * - PROMPT: 工具提示词
 */

/**
 * Tool description — 工具描述
 */
export const DESCRIPTION = `
Reads a specific resource from an MCP server.
- server: The name of the MCP server to read from
- uri: The URI of the resource to read

Usage examples:
- Read a resource from a server: \`readMcpResource({ server: "myserver", uri: "my-resource-uri" })\`
`

/**
 * Tool prompt — 工具提示词
 */
export const PROMPT = `
Reads a specific resource from an MCP server, identified by server name and resource URI.

Parameters:
- server (required): The name of the MCP server from which to read the resource
- uri (required): The URI of the resource to read
`
