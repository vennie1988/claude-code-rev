/**
 * Widest Line Finder / 最宽行查找器
 *
 * Finds the maximum line width in a multi-line string.
 * 查找多行字符串中的最大行宽。
 */

import { lineWidth } from './line-width-cache.js'

/**
 * Get the width of the widest line in a string.
 * 获取字符串中最宽行的宽度。
 */
export function widestLine(string: string): number {
  let maxWidth = 0
  let start = 0

  while (start <= string.length) {
    const end = string.indexOf('\n', start)
    const line =
      end === -1 ? string.substring(start) : string.substring(start, end)

    maxWidth = Math.max(maxWidth, lineWidth(line))

    if (end === -1) break
    start = end + 1
  }

  return maxWidth
}
