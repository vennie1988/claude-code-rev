import { useEffect, useState } from 'react'
import {
  type ClaudeAILimits,
  currentLimits,
  statusListeners,
} from './claudeAiLimits.js'

/**
 * @fileoverview claudeAiLimitsHook.ts — React hook for Claude AI quota limits
 *
 * Provides reactive access to Claude AI rate limit status via the
 * DiagnosticTrackingService singleton. Components subscribe to limit changes
 * and re-render automatically when quota status changes (e.g., warning → rejected).
 *
 * 设计: Uses a Set of listeners for cheap pub/sub; limits are stored in module
 * scope (currentLimits) and cloned on each update to prevent mutation.
 *
 * @note Apple Terminal auto-detection lazy-loads plist (~280KB) only when
 * the user is on Apple_Terminal with auto channel — a rare combination.
 */

/**
 * Claude AI 配额限制的 React Hook
 *
 * 通过 DiagnosticTrackingService 单例提供 Claude AI 配额限制的状态访问。
 * 组件订阅限额变化,当配额状态改变时自动重新渲染(如从警告升级为拒绝)。
 *
 * 设计: 使用监听器 Set 进行低开销的发布-订阅;限额存储在模块作用域(currentLimits),
 * 每次更新时克隆以防止突变。
 */

export function useClaudeAiLimits(): ClaudeAILimits {
  const [limits, setLimits] = useState<ClaudeAILimits>({ ...currentLimits })

  useEffect(() => {
    const listener = (newLimits: ClaudeAILimits) => {
      setLimits({ ...newLimits })
    }
    statusListeners.add(listener)

    return () => {
      statusListeners.delete(listener)
    }
  }, [])

  return limits
}
