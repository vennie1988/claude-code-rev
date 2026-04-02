/**
 * @fileoverview idleTimeout.ts — SDK 模式空闲超时管理器 / Idle timeout manager for SDK mode
 *
 * ## 功能说明 (Description)
 * 创建计时器监控空闲状态，在 CLAUDE_CODE_EXIT_AFTER_STOP_DELAY 毫秒的连续空闲后触发优雅关闭。
 * SDK 模式客户端用于实现自动退出。
 *
 * 注意：计时器同时检查 isIdle() 和经过时间，确保短暂活动重置倒计时而非退出。
 *
 * Creates a timer that monitors idle state and exits the process after
 * CLAUDE_CODE_EXIT_AFTER_STOP_DELAY milliseconds of continuous idle time.
 * Used by SDK-mode clients to implement clean automatic shutdown.
 */

import { logForDebugging } from './debug.js'
import { gracefulShutdownSync } from './gracefulShutdown.js'

/**
 * Creates an idle timeout manager for SDK mode.
 * Automatically exits the process after the specified idle duration.
 *
 * @param isIdle Function that returns true if the system is currently idle
 * @returns Object with start/stop methods to control the idle timer
 */
export function createIdleTimeoutManager(isIdle: () => boolean): {
  start: () => void
  stop: () => void
} {
  // Parse CLAUDE_CODE_EXIT_AFTER_STOP_DELAY environment variable
  const exitAfterStopDelay = process.env.CLAUDE_CODE_EXIT_AFTER_STOP_DELAY
  const delayMs = exitAfterStopDelay ? parseInt(exitAfterStopDelay, 10) : null
  const isValidDelay = delayMs && !isNaN(delayMs) && delayMs > 0

  let timer: NodeJS.Timeout | null = null
  let lastIdleTime = 0

  return {
    start() {
      // Clear any existing timer
      if (timer) {
        clearTimeout(timer)
        timer = null
      }

      // Only start timer if delay is configured and valid
      if (isValidDelay) {
        lastIdleTime = Date.now()

        timer = setTimeout(() => {
          // Check if we've been continuously idle for the full duration
          const idleDuration = Date.now() - lastIdleTime
          if (isIdle() && idleDuration >= delayMs) {
            logForDebugging(`Exiting after ${delayMs}ms of idle time`)
            gracefulShutdownSync()
          }
        }, delayMs)
      }
    },

    stop() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}
