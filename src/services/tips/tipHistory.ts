/**
 * @fileoverview tips/tipHistory.ts — Tip display history tracking
 *
 * Tracks which tips have been shown to users and when,
 * to prevent repeatedly showing the same tips across sessions.
 *
 * 跟踪已向用户显示的提示及其时间,以防止跨会话重复显示相同提示。
 */

import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

export function recordTipShown(tipId: string): void {
  const numStartups = getGlobalConfig().numStartups
  saveGlobalConfig(c => {
    const history = c.tipsHistory ?? {}
    if (history[tipId] === numStartups) return c
    return { ...c, tipsHistory: { ...history, [tipId]: numStartups } }
  })
}

export function getSessionsSinceLastShown(tipId: string): number {
  const config = getGlobalConfig()
  const lastShown = config.tipsHistory?.[tipId]
  if (!lastShown) return Infinity
  return config.numStartups - lastShown
}
