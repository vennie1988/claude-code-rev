/**
 * @fileoverview ultrareviewEnabled.ts — Feature gate for ultrareview command
 * /ultrareview 功能开关，通过 GrowthBook 配置控制
 *
 * @note Controls visibility via getCommands() filtering — ungated users
 * won't see the command at all when disabled
 */
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'

/**
 * Runtime gate for /ultrareview. GB config's `enabled` field controls
 * visibility — isEnabled() on the command filters it from getCommands()
 * when false, so ungated users don't see the command at all.
 */
export function isUltrareviewEnabled(): boolean {
  const cfg = getFeatureValue_CACHED_MAY_BE_STALE<Record<
    string,
    unknown
  > | null>('tengu_review_bughunter_config', null)
  return cfg?.enabled === true
}
