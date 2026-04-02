/**
 * @fileoverview contextWindowUpgradeCheck.ts — 上下文窗口升级检测 / Context window upgrade detection
 *
 * Checks if the current model supports a 1M context upgrade path and returns
 * upgrade information (alias, name, multiplier) if available.
 *
 * @note @[MODEL LAUNCH]: Add a branch for the new model if it supports a 1M context upgrade path.
 *
 * 检查当前模型是否支持 1M 上下文升级路径，并在可用时返回升级信息（别名、名称、倍数）。
 *
 * 注意：@[MODEL LAUNCH]：如果新模型支持 1M 上下文升级路径，请为此添加分支。
 */

import { checkOpus1mAccess, checkSonnet1mAccess } from './check1mAccess.js'
import { getUserSpecifiedModelSetting } from './model.js'

// @[MODEL LAUNCH]: Add a branch for the new model if it supports a 1M context upgrade path.
/**
 * Get available model upgrade for more context
 * Returns null if no upgrade available or user already has max context
 */
function getAvailableUpgrade(): {
  alias: string
  name: string
  multiplier: number
} | null {
  const currentModelSetting = getUserSpecifiedModelSetting()
  if (currentModelSetting === 'opus' && checkOpus1mAccess()) {
    return {
      alias: 'opus[1m]',
      name: 'Opus 1M',
      multiplier: 5,
    }
  } else if (currentModelSetting === 'sonnet' && checkSonnet1mAccess()) {
    return {
      alias: 'sonnet[1m]',
      name: 'Sonnet 1M',
      multiplier: 5,
    }
  }

  return null
}

/**
 * Get upgrade message for different contexts
 */
export function getUpgradeMessage(context: 'warning' | 'tip'): string | null {
  const upgrade = getAvailableUpgrade()
  if (!upgrade) return null

  switch (context) {
    case 'warning':
      return `/model ${upgrade.alias}`
    case 'tip':
      return `Tip: You have access to ${upgrade.name} with ${upgrade.multiplier}x more context`
    default:
      return null
  }
}
