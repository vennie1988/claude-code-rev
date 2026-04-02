/**
 * Line Width Cache / 行宽缓存
 *
 * Caches stringWidth results per line to avoid redundant measurements.
 * 缓存每行的 stringWidth 结果以避免冗余测量。
 *
 * During streaming, text grows but completed lines are immutable.
 * Caching stringWidth per-line avoids re-measuring hundreds of
 * unchanged lines on every token (~50x reduction in stringWidth calls).
 * 在流式传输期间，文本增长但已完成的行是不可变的。
 * 每行缓存 stringWidth 可避免在每个标记上重新测量数百个未更改的行
 * （约减少 50 倍的 stringWidth 调用）。
 */

import { stringWidth } from './stringWidth.js'

// During streaming, text grows but completed lines are immutable.
// Caching stringWidth per-line avoids re-measuring hundreds of
// unchanged lines on every token (~50x reduction in stringWidth calls).
const cache = new Map<string, number>()

const MAX_CACHE_SIZE = 4096

export function lineWidth(line: string): number {
  const cached = cache.get(line)
  if (cached !== undefined) return cached

  const width = stringWidth(line)

  // Evict when cache grows too large (e.g. after many different responses).
  // Simple full-clear is fine — the cache repopulates in one frame.
  if (cache.size >= MAX_CACHE_SIZE) {
    cache.clear()
  }

  cache.set(line, width)
  return width
}
