/**
 * @fileoverview contextCollapse/index.ts — Context collapse orchestration
 *
 * Orchestrates context collapse operations for managing conversation history.
 * Tracks collapse statistics, manages subscribers, and coordinates with
 * the compaction system to reduce token usage while preserving context.
 *
 * 编排上下文折叠操作以管理对话历史。
 * 跟踪折叠统计、管理订阅者,并与压缩系统协调以减少令牌使用同时保留上下文。
 */

type Stats = {
  collapsedSpans: number
  stagedSpans: number
  health: {
    totalErrors: number
    totalEmptySpawns: number
    emptySpawnWarningEmitted: boolean
  }
}

const stats: Stats = {
  collapsedSpans: 0,
  stagedSpans: 0,
  health: {
    totalErrors: 0,
    totalEmptySpawns: 0,
    emptySpawnWarningEmitted: false,
  },
}

const listeners = new Set<() => void>()

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getStats(): Stats {
  return stats
}

export function isContextCollapseEnabled(): boolean {
  return false
}

export function resetContextCollapse(): void {}

export async function applyCollapsesIfNeeded<T>(messages: T): Promise<{
  messages: T
  changed: boolean
}> {
  return { messages, changed: false }
}

export function isWithheldPromptTooLong(): boolean {
  return false
}

export function recoverFromOverflow<T>(messages: T): T {
  return messages
}
