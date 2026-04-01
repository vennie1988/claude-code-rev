/**
 * @fileoverview useMemoryUsage.ts — Node.js memory usage monitoring hook
 * Node.js内存使用监控hook：每10秒轮询进程内存使用情况。
 * Monitors Node.js process memory usage, polling every 10 seconds.
 *
 * @design
 * - 每10秒轮询process.memoryUsage().heapUsed
 * - 状态：normal (<1.5GB), high (>=1.5GB), critical (>=2.5GB)
 * - normal状态返回null避免不必要的重渲染
 *
 * @design Polls every 10 seconds for process.memoryUsage().heapUsed
 * @design Status: normal (<1.5GB), high (>=1.5GB), critical (>=2.5GB)
 * @design normal status returns null to avoid unnecessary re-renders
 */
import { useState } from 'react'
import { useInterval } from 'usehooks-ts'

export type MemoryUsageStatus = 'normal' | 'high' | 'critical'

export type MemoryUsageInfo = {
  heapUsed: number
  status: MemoryUsageStatus
}

const HIGH_MEMORY_THRESHOLD = 1.5 * 1024 * 1024 * 1024 // 1.5GB in bytes
const CRITICAL_MEMORY_THRESHOLD = 2.5 * 1024 * 1024 * 1024 // 2.5GB in bytes

/**
 * Hook to monitor Node.js process memory usage.
 * Polls every 10 seconds; returns null while status is 'normal'.
 */
export function useMemoryUsage(): MemoryUsageInfo | null {
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsageInfo | null>(null)

  useInterval(() => {
    const heapUsed = process.memoryUsage().heapUsed
    const status: MemoryUsageStatus =
      heapUsed >= CRITICAL_MEMORY_THRESHOLD
        ? 'critical'
        : heapUsed >= HIGH_MEMORY_THRESHOLD
          ? 'high'
          : 'normal'
    setMemoryUsage(prev => {
      // Bail when status is 'normal' — nothing is shown, so heapUsed is
      // irrelevant and we avoid re-rendering the whole Notifications subtree
      // every 10 seconds for the 99%+ of users who never reach 1.5GB.
      if (status === 'normal') return prev === null ? prev : null
      return { heapUsed, status }
    })
  }, 10_000)

  return memoryUsage
}
