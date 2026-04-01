/**
 * @fileoverview cwd.ts — Async-local working directory override for concurrent agents
 *
 * Provides an async-context-scoped working directory that allows multiple concurrent
 * agents to each see their own effective CWD without interfering with one another.
 * Uses AsyncLocalStorage so that pwd()/getCwd() calls within a runWithCwdOverride block
 * automatically return the overridden value, even across async call boundaries.
 *
 * 文件概述: cwd.ts — 异步本地上下文工作目录覆盖，用于并发 Agent
 *
 * 提供异步上下文作用域的工作目录，允许多个并发 Agent 各自看到自己的有效 CWD，
 * 互不干扰。使用 AsyncLocalStorage，使得 runWithCwdOverride 块内的 pwd()/getCwd()
 * 调用自动返回覆盖值，即使跨越异步调用边界。
 */

import { AsyncLocalStorage } from 'async_hooks'
import { getCwdState, getOriginalCwd } from '../bootstrap/state.js'

/**
 * Async-local storage for per-context working directory overrides.
 * 每个上下文独立的工作目录覆盖存储。
 */
const cwdOverrideStorage = new AsyncLocalStorage<string>()

/**
 * Run a function with an overridden working directory for the current async context.
 * All calls to pwd()/getCwd() within the function (and its async descendants) will
 * return the overridden cwd instead of the global one. This enables concurrent
 * agents to each see their own working directory without affecting each other.
 */
export function runWithCwdOverride<T>(cwd: string, fn: () => T): T {
  return cwdOverrideStorage.run(cwd, fn)
}

/**
 * Get the current working directory.
 * Returns the async-context-overridden cwd if inside runWithCwdOverride,
 * otherwise falls back to the global CWD state.
 *
 * 获取当前工作目录。如果在 runWithCwdOverride 内则返回覆盖值，
 * 否则回退到全局 CWD 状态。
 */
export function pwd(): string {
  return cwdOverrideStorage.getStore() ?? getCwdState()
}

/**
 * Get the current working directory, with fallback to the original cwd if the
 * current one is unavailable (e.g., outside async context).
 *
 * 获取当前工作目录，如果当前值不可用（如在异步上下文外）则回退到原始 cwd。
 */
export function getCwd(): string {
  try {
    return pwd()
  } catch {
    return getOriginalCwd()
  }
}
