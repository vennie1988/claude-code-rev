/**
 * @fileoverview aliases.ts — 模型别名定义与辅助函数 / Model alias definitions and helpers
 *
 * Defines model aliases (sonnet, opus, haiku, best, sonnet[1m], opus[1m], opusplan)
 * and family aliases used as wildcards in the availableModels allowlist.
 *
 * @note Family aliases (sonnet/opus/haiku) act as wildcards — "opus" in allowlist matches ANY opus model.
 *       But if both "opus" and "opus-4-5" are in the allowlist, only opus-4-5 matches (specific takes precedence).
 *
 * 定义模型别名（sonnet、opus、haiku、best、sonnet[1m]、opus[1m]、opusplan）
 * 和在 availableModels 白名单中用作通配符的家族别名。
 *
 * 注意：家族别名（sonnet/opus/haiku）作为通配符使用 —— 白名单中的 "opus" 匹配任意 opus 模型。
 *       但如果白名单中同时有 "opus" 和 "opus-4-5"，则只匹配 opus-4-5（具体优先于通用）。
 */

export const MODEL_ALIASES = [
  'sonnet',
  'opus',
  'haiku',
  'best',
  'sonnet[1m]',
  'opus[1m]',
  'opusplan',
] as const
export type ModelAlias = (typeof MODEL_ALIASES)[number]

export function isModelAlias(modelInput: string): modelInput is ModelAlias {
  return MODEL_ALIASES.includes(modelInput as ModelAlias)
}

/**
 * Bare model family aliases that act as wildcards in the availableModels allowlist.
 * When "opus" is in the allowlist, ANY opus model is allowed (opus 4.5, 4.6, etc.).
 * When a specific model ID is in the allowlist, only that exact version is allowed.
 */
export const MODEL_FAMILY_ALIASES = ['sonnet', 'opus', 'haiku'] as const

export function isModelFamilyAlias(model: string): boolean {
  return (MODEL_FAMILY_ALIASES as readonly string[]).includes(model)
}
