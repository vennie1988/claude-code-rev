/**
 * @fileoverview usePrStatus.ts — GitHub PR status polling hook
 * GitHub PR状态轮询hook：定期检查PR审核状态，支持空闲停止和慢速禁用。
 * Polls PR review status every 60s while the session is active.
 *
 * @design
 * - 每60秒轮询一次PR状态（通过gh命令）
 * - 空闲60分钟后自动停止轮询
 * - fetch超过4秒自动禁用轮询
 * - turn边界调度下一次轮询，避免重复触发
 * - 支持enabled开关完全禁用轮询
 *
 * @design Polls PR status every 60s via gh command
 * @design Stops polling after 60 min idle
 * @design Permanently disables if fetch exceeds 4s
 * @design Schedules next poll relative to last fetch time
 * @design Supports enabled flag to disable polling
 */
import { useEffect, useRef, useState } from 'react'
import { getLastInteractionTime } from '../bootstrap/state.js'
import { fetchPrStatus, type PrReviewState } from '../utils/ghPrStatus.js'

const POLL_INTERVAL_MS = 60_000
const SLOW_GH_THRESHOLD_MS = 4_000
const IDLE_STOP_MS = 60 * 60_000 // stop polling after 60 min idle

export type PrStatusState = {
  number: number | null
  url: string | null
  reviewState: PrReviewState | null
  lastUpdated: number
}

const INITIAL_STATE: PrStatusState = {
  number: null,
  url: null,
  reviewState: null,
  lastUpdated: 0,
}

/**
 * Polls PR review status every 60s while the session is active.
 * When no interaction is detected for 60 minutes, the loop stops — no
 * timers remain. React re-runs the effect when isLoading changes
 * (turn starts/ends), restarting the loop. Effect setup schedules
 * the next poll relative to the last fetch time so turn boundaries
 * don't spawn `gh` more than once per interval. Disables permanently
 * if a fetch exceeds 4s.
 *
 * Pass `enabled: false` to skip polling entirely (hook still must be
 * called unconditionally to satisfy the rules of hooks).
 */
export function usePrStatus(isLoading: boolean, enabled = true): PrStatusState {
  const [prStatus, setPrStatus] = useState<PrStatusState>(INITIAL_STATE)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disabledRef = useRef(false)
  const lastFetchRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    if (disabledRef.current) return

    let cancelled = false
    let lastSeenInteractionTime = -1
    let lastActivityTimestamp = Date.now()

    async function poll() {
      if (cancelled) return

      const currentInteractionTime = getLastInteractionTime()
      if (lastSeenInteractionTime !== currentInteractionTime) {
        lastSeenInteractionTime = currentInteractionTime
        lastActivityTimestamp = Date.now()
      } else if (Date.now() - lastActivityTimestamp >= IDLE_STOP_MS) {
        return
      }

      const start = Date.now()
      const result = await fetchPrStatus()
      if (cancelled) return
      lastFetchRef.current = start

      setPrStatus(prev => {
        const newNumber = result?.number ?? null
        const newReviewState = result?.reviewState ?? null
        if (prev.number === newNumber && prev.reviewState === newReviewState) {
          return prev
        }
        return {
          number: newNumber,
          url: result?.url ?? null,
          reviewState: newReviewState,
          lastUpdated: Date.now(),
        }
      })

      if (Date.now() - start > SLOW_GH_THRESHOLD_MS) {
        disabledRef.current = true
        return
      }

      if (!cancelled) {
        timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    const elapsed = Date.now() - lastFetchRef.current
    if (elapsed >= POLL_INTERVAL_MS) {
      void poll()
    } else {
      timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS - elapsed)
    }

    return () => {
      cancelled = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isLoading, enabled])

  return prStatus
}
