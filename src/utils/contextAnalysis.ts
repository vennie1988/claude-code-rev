/**
 * @fileoverview contextAnalysis.ts — Context window token accounting and attribution
 *
 * Analyzes a message history to produce per-category token counts: human vs assistant
 * messages, tool requests/results, local command outputs, and duplicate file reads.
 * The duplicate-read detector identifies files read more than once and estimates
 * wasted tokens from redundant reads — useful for context window optimization.
 *
 * @note Token counts are estimates via roughTokenCountEstimation, not exact API counts.
 *       Duplicate detection uses a Map keyed by file path, so repeated reads of
 *       different paths are not deduplicated.
 */

/**
 * 文件概述: contextAnalysis.ts — 上下文窗口 Token 统计与归属分析
 *
 * 对消息历史进行分类 Token 计数统计：人类消息 vs 助手消息、工具调用/结果、
 * 本地命令输出、重复文件读取。通过识别同一文件的多次读取来估算冗余 Token 开销，
 * 为上下文窗口优化提供依据。
 *
 * @note Token 计数使用 roughTokenCountEstimation 估算，而非精确 API 计数。
 *       重复检测以文件路径为 key Map，因此不同路径的重复读取不会去重。
 */

import type { BetaContentBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type {
  ContentBlock,
  ContentBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
import { roughTokenCountEstimation as countTokens } from '../services/tokenEstimation.js'
import type {
  AssistantMessage,
  Message,
  UserMessage,
} from '../types/message.js'
import { normalizeMessagesForAPI } from './messages.js'
import { jsonStringify } from './slowOperations.js'

type TokenStats = {
  toolRequests: Map<string, number>
  toolResults: Map<string, number>
  humanMessages: number
  assistantMessages: number
  localCommandOutputs: number
  other: number
  attachments: Map<string, number>
  duplicateFileReads: Map<string, { count: number; tokens: number }>
  total: number
}

/**
 * analyzeContext — Token accounting for a message history
 *
 * Walks every message in the array, normalizes to API format, and accumulates
 * token estimates per category. Duplicate file reads (same path read multiple
 * times) are tracked separately to surface wasted context tokens.
 *
 * @param messages - Full message history to analyze
 * @returns TokenStats with per-category breakdowns
 *
 * analyzeContext — 消息历史的 Token 统计
 *
 * 遍历数组中每条消息，标准化为 API 格式，并按类别累积 token 估算值。
 * 重复文件读取（同一路径多次读取）单独跟踪，以揭示浪费的上下文 token。
 */
export function analyzeContext(messages: Message[]): TokenStats {
  const stats: TokenStats = {
    toolRequests: new Map(),
    toolResults: new Map(),
    humanMessages: 0,
    assistantMessages: 0,
    localCommandOutputs: 0,
    other: 0,
    attachments: new Map(),
    duplicateFileReads: new Map(),
    total: 0,
  }

  const toolIdsToToolNames = new Map<string, string>()
  const readToolIdToFilePath = new Map<string, string>()
  const fileReadStats = new Map<
    string,
    { count: number; totalTokens: number }
  >()

  messages.forEach(msg => {
    if (msg.type === 'attachment') {
      const type = msg.attachment.type || 'unknown'
      stats.attachments.set(type, (stats.attachments.get(type) || 0) + 1)
    }
  })

  const normalizedMessages = normalizeMessagesForAPI(messages)
  normalizedMessages.forEach(msg => {
    const { content } = msg.message

    // Not sure if this path is still used, but adding as a fallback
    if (typeof content === 'string') {
      const tokens = countTokens(content)
      stats.total += tokens
      // Check if this is a local command output
      if (msg.type === 'user' && content.includes('local-command-stdout')) {
        stats.localCommandOutputs += tokens
      } else {
        stats[msg.type === 'user' ? 'humanMessages' : 'assistantMessages'] +=
          tokens
      }
    } else {
      content.forEach(block =>
        processBlock(
          block,
          msg,
          stats,
          toolIdsToToolNames,
          readToolIdToFilePath,
          fileReadStats,
        ),
      )
    }
  })

  // Calculate duplicate file reads
  fileReadStats.forEach((data, path) => {
    if (data.count > 1) {
      const averageTokensPerRead = Math.floor(data.totalTokens / data.count)
      const duplicateTokens = averageTokensPerRead * (data.count - 1)

      stats.duplicateFileReads.set(path, {
        count: data.count,
        tokens: duplicateTokens,
      })
    }
  })

  return stats
}

/**
 * processBlock — Classify and accumulate token counts for a single content block
 *
 * Dispatches on block type and increments the appropriate counter in stats.
 * For tool_use blocks, also tracks the tool name → tool-id mapping so that
 * subsequent tool_result blocks can attribute tokens correctly.
 *
 * @param block - The content block to process
 * @param message - The parent message containing this block
 * @param stats - TokenStats accumulator (mutated in place)
 * @param toolIds - Map from tool-use ID to tool name (populated as side effect)
 * @param readToolPaths - Map from tool-use ID to file path for Read tools
 * @param fileReads - Map from file path to read count/tokens (populated as side effect)
 *
 * processBlock — 对单个内容块进行分类并累积 token 计数
 *
 * 根据块类型分发并增加 stats 中相应的计数器。对于 tool_use 块，
 * 还跟踪 tool name → tool-id 映射，以便后续 tool_result 块正确归因 token。
 */
function processBlock(
  const tokens = countTokens(jsonStringify(block))
  stats.total += tokens

  switch (block.type) {
    case 'text':
      // Check if this is a local command output
      if (
        message.type === 'user' &&
        'text' in block &&
        block.text.includes('local-command-stdout')
      ) {
        stats.localCommandOutputs += tokens
      } else {
        stats[
          message.type === 'user' ? 'humanMessages' : 'assistantMessages'
        ] += tokens
      }
      break

    case 'tool_use': {
      if ('name' in block && 'id' in block) {
        const toolName = block.name || 'unknown'
        increment(stats.toolRequests, toolName, tokens)
        toolIds.set(block.id, toolName)

        // Track Read tool file paths
        if (
          toolName === 'Read' &&
          'input' in block &&
          block.input &&
          typeof block.input === 'object' &&
          'file_path' in block.input
        ) {
          const path = String(
            (block.input as Record<string, unknown>).file_path,
          )
          readToolPaths.set(block.id, path)
        }
      }
      break
    }

    case 'tool_result': {
      if ('tool_use_id' in block) {
        const toolName = toolIds.get(block.tool_use_id) || 'unknown'
        increment(stats.toolResults, toolName, tokens)

        // Track file read tokens
        if (toolName === 'Read') {
          const path = readToolPaths.get(block.tool_use_id)
          if (path) {
            const current = fileReads.get(path) || { count: 0, totalTokens: 0 }
            fileReads.set(path, {
              count: current.count + 1,
              totalTokens: current.totalTokens + tokens,
            })
          }
        }
      }
      break
    }

    case 'image':
    case 'server_tool_use':
    case 'web_search_tool_result':
    case 'search_result':
    case 'document':
    case 'thinking':
    case 'redacted_thinking':
    case 'code_execution_tool_result':
    case 'mcp_tool_use':
    case 'mcp_tool_result':
    case 'container_upload':
    case 'web_fetch_tool_result':
    case 'bash_code_execution_tool_result':
    case 'text_editor_code_execution_tool_result':
    case 'tool_search_tool_result':
    case 'compaction':
      // Don't care about these for now..
      stats['other'] += tokens
      break
  }
}

/**
 * increment — Increment a counter in a Map, creating the key if absent.
 * 原子增加 Map 中的计数器，如不存在则创建键。
 */
function increment(map: Map<string, number>, key: string, value: number): void {
  map.set(key, (map.get(key) || 0) + value)
}

/**
 * tokenStatsToStatsigMetrics — Convert TokenStats to a flat key/value object for Statsig
 *
 * Converts per-tool, per-attachment, and aggregate metrics into a flat Record
 * suitable for Statsig logging. Percentages are only computed when total > 0.
 *
 * @param stats - TokenStats from analyzeContext()
 * @returns Flat object with metric names as keys and numeric values
 *
 * tokenStatsToStatsigMetrics — 将 TokenStats 转换为适合 Statsig 的扁平键值对象
 *
 * 将每工具、每附件和汇总指标转换为扁平 Record，适合 Statsig 记录。
 * 仅在 total > 0 时计算百分比。
 */
export function tokenStatsToStatsigMetrics(
  stats: TokenStats,
): Record<string, number> {
  const metrics: Record<string, number> = {
    total_tokens: stats.total,
    human_message_tokens: stats.humanMessages,
    assistant_message_tokens: stats.assistantMessages,
    local_command_output_tokens: stats.localCommandOutputs,
    other_tokens: stats.other,
  }

  stats.attachments.forEach((count, type) => {
    metrics[`attachment_${type}_count`] = count
  })

  stats.toolRequests.forEach((tokens, tool) => {
    metrics[`tool_request_${tool}_tokens`] = tokens
  })

  stats.toolResults.forEach((tokens, tool) => {
    metrics[`tool_result_${tool}_tokens`] = tokens
  })

  const duplicateTotal = [...stats.duplicateFileReads.values()].reduce(
    (sum, d) => sum + d.tokens,
    0,
  )

  metrics.duplicate_read_tokens = duplicateTotal
  metrics.duplicate_read_file_count = stats.duplicateFileReads.size

  if (stats.total > 0) {
    metrics.human_message_percent = Math.round(
      (stats.humanMessages / stats.total) * 100,
    )
    metrics.assistant_message_percent = Math.round(
      (stats.assistantMessages / stats.total) * 100,
    )
    metrics.local_command_output_percent = Math.round(
      (stats.localCommandOutputs / stats.total) * 100,
    )
    metrics.duplicate_read_percent = Math.round(
      (duplicateTotal / stats.total) * 100,
    )

    const toolRequestTotal = [...stats.toolRequests.values()].reduce(
      (sum, v) => sum + v,
      0,
    )
    const toolResultTotal = [...stats.toolResults.values()].reduce(
      (sum, v) => sum + v,
      0,
    )

    metrics.tool_request_percent = Math.round(
      (toolRequestTotal / stats.total) * 100,
    )
    metrics.tool_result_percent = Math.round(
      (toolResultTotal / stats.total) * 100,
    )

    // Add individual tool request percentages
    stats.toolRequests.forEach((tokens, tool) => {
      metrics[`tool_request_${tool}_percent`] = Math.round(
        (tokens / stats.total) * 100,
      )
    })

    // Add individual tool result percentages
    stats.toolResults.forEach((tokens, tool) => {
      metrics[`tool_result_${tool}_percent`] = Math.round(
        (tokens / stats.total) * 100,
      )
    })
  }

  return metrics
}
