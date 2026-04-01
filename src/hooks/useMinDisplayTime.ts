/**
 * @fileoverview useMinDisplayTime.ts — Minimum display time throttle hook
 * 最小显示时间节流hook：确保每个值至少显示minMs毫秒才切换。
 * Ensures each distinct value stays visible for at least minMs before being replaced.
 *
 * @design
 * - 与debounce（等待安静）和throttle（限制频率）不同
 * - 保证每个值都有最小屏幕时间
 * - 用于防止快速变化的进度文本闪烁
 *
 * @design Different from debounce (wait for quiet) and throttle (limit rate)
 * @design Guarantees each value gets minimum screen time
 * @design Prevents fast-cycling progress text from flickering
 */
import { useEffect, useRef, useState } from 'react'

/**
 * Throttles a value so each distinct value stays visible for at least `minMs`.
 * Prevents fast-cycling progress text from flickering past before it's readable.
 *
 * Unlike debounce (wait for quiet) or throttle (limit rate), this guarantees
 * each value gets its minimum screen time before being replaced.
 */
export function useMinDisplayTime<T>(value: T, minMs: number): T {
  const [displayed, setDisplayed] = useState(value)
  const lastShownAtRef = useRef(0)

  useEffect(() => {
    const elapsed = Date.now() - lastShownAtRef.current
    if (elapsed >= minMs) {
      lastShownAtRef.current = Date.now()
      setDisplayed(value)
      return
    }
    const timer = setTimeout(
      (shownAtRef, setFn, v) => {
        shownAtRef.current = Date.now()
        setFn(v)
      },
      minMs - elapsed,
      lastShownAtRef,
      setDisplayed,
      value,
    )
    return () => clearTimeout(timer)
  }, [value, minMs])

  return displayed
}
