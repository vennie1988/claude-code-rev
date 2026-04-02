import type { Diff } from './frame.js'

/**
 * Diff Optimizer / 差异优化器
 *
 * Optimize a diff by applying all optimization rules in a single pass.
 * 通过单次遍历应用所有优化规则来优化差异。
 *
 * This reduces the number of patches that need to be written to the terminal.
 * 这减少了需要写入终端的补丁数量。
 *
 * Rules applied:
 * 应用规则：
 * - Remove empty stdout patches / 删除空的 stdout 补丁
 * - Merge consecutive cursorMove patches / 合并连续的 cursorMove 补丁
 * - Remove no-op cursorMove (0,0) patches / 删除无操作的 cursorMove (0,0) 补丁
 * - Concat adjacent style patches (transition diffs — can't drop either)
 *   / 连接相邻的样式补丁（转换差异——不能丢弃任何一个）
 * - Dedupe consecutive hyperlinks with same URI / 对相同 URI 的连续超链接去重
 * - Cancel cursor hide/show pairs / 取消光标隐藏/显示配对
 * - Remove clear patches with count 0 / 删除计数为 0 的清除补丁
 */
export function optimize(diff: Diff): Diff {
  if (diff.length <= 1) {
    return diff
  }

  const result: Diff = []
  let len = 0

  for (const patch of diff) {
    const type = patch.type

    // Skip no-ops
    if (type === 'stdout') {
      if (patch.content === '') continue
    } else if (type === 'cursorMove') {
      if (patch.x === 0 && patch.y === 0) continue
    } else if (type === 'clear') {
      if (patch.count === 0) continue
    }

    // Try to merge with previous patch
    if (len > 0) {
      const lastIdx = len - 1
      const last = result[lastIdx]!
      const lastType = last.type

      // Merge consecutive cursorMove
      if (type === 'cursorMove' && lastType === 'cursorMove') {
        result[lastIdx] = {
          type: 'cursorMove',
          x: last.x + patch.x,
          y: last.y + patch.y,
        }
        continue
      }

      // Collapse consecutive cursorTo (only the last one matters)
      if (type === 'cursorTo' && lastType === 'cursorTo') {
        result[lastIdx] = patch
        continue
      }

      // Concat adjacent style patches. styleStr is a transition diff
      // (computed by diffAnsiCodes(from, to)), not a setter — dropping
      // the first is only sound if its undo-codes are a subset of the
      // second's, which is NOT guaranteed. e.g. [\e[49m, \e[2m]: dropping
      // the bg reset leaks it into the next \e[2J/\e[2K via BCE.
      if (type === 'styleStr' && lastType === 'styleStr') {
        result[lastIdx] = { type: 'styleStr', str: last.str + patch.str }
        continue
      }

      // Dedupe hyperlinks
      if (
        type === 'hyperlink' &&
        lastType === 'hyperlink' &&
        patch.uri === last.uri
      ) {
        continue
      }

      // Cancel cursor hide/show pairs
      if (
        (type === 'cursorShow' && lastType === 'cursorHide') ||
        (type === 'cursorHide' && lastType === 'cursorShow')
      ) {
        result.pop()
        len--
        continue
      }
    }

    result.push(patch)
    len++
  }

  return result
}
