/**
 * @fileoverview prompt.ts — LSPTool 常量定义
 * Defines constants for the LSP (Language Server Protocol) tool.
 *
 * 功能说明：
 * - LSP_TOOL_NAME: 工具唯一标识名称
 * - DESCRIPTION: 工具描述，支持的 LSP 操作列表
 */

/**
 * LSP tool name — 语言服务器协议工具名称
 */
export const LSP_TOOL_NAME = 'LSP' as const

/**
 * Tool description — 工具描述
 */
export const DESCRIPTION = `Interact with Language Server Protocol (LSP) servers to get code intelligence features.

Supported operations:
- goToDefinition: Find where a symbol is defined
- findReferences: Find all references to a symbol
- hover: Get hover information (documentation, type info) for a symbol
- documentSymbol: Get all symbols (functions, classes, variables) in a document
- workspaceSymbol: Search for symbols across the entire workspace
- goToImplementation: Find implementations of an interface or abstract method
- prepareCallHierarchy: Get call hierarchy item at a position (functions/methods)
- incomingCalls: Find all functions/methods that call the function at a position
- outgoingCalls: Find all functions/methods called by the function at a position

All operations require:
- filePath: The file to operate on
- line: The line number (1-based, as shown in editors)
- character: The character offset (1-based, as shown in editors)

Note: LSP servers must be configured for the file type. If no server is available, an error will be returned.`
