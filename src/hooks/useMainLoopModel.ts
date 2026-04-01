/**
 * @fileoverview useMainLoopModel.ts — Main loop model resolution hook
 * 主循环模型解析hook：解析并返回当前主循环模型名称，支持GrowthBook刷新后重新解析。
 * Resolves and returns the current main loop model name, re-resolving after GrowthBook refresh.
 *
 * @design
 * - 使用useReducer触发GrowthBook刷新后的强制重渲染
 * - 订阅onGrowthBookRefresh信号
 * - parseUserSpecifiedModel处理模型别名解析
 *
 * @design useReducer triggers force re-render after GrowthBook refresh
 * @design Subscribes to onGrowthBookRefresh signal
 * @design parseUserSpecifiedModel handles model alias resolution
 */
import { useEffect, useReducer } from 'react'
import { onGrowthBookRefresh } from '../services/analytics/growthbook.js'
import { useAppState } from '../state/AppState.js'
import {
  getDefaultMainLoopModelSetting,
  type ModelName,
  parseUserSpecifiedModel,
} from '../utils/model/model.js'

// The value of the selector is a full model name that can be used directly in
// API calls. Use this over getMainLoopModel() when the component needs to
// update upon a model config change.
export function useMainLoopModel(): ModelName {
  const mainLoopModel = useAppState(s => s.mainLoopModel)
  const mainLoopModelForSession = useAppState(s => s.mainLoopModelForSession)

  // parseUserSpecifiedModel reads tengu_ant_model_override via
  // _CACHED_MAY_BE_STALE (in resolveAntModel). Until GB init completes,
  // that's the stale disk cache; after, it's the in-memory remoteEval map.
  // AppState doesn't change when GB init finishes, so we subscribe to the
  // refresh signal and force a re-render to re-resolve with fresh values.
  // Without this, the alias resolution is frozen until something else
  // happens to re-render the component — the API would sample one model
  // while /model (which also re-resolves) displays another.
  const [, forceRerender] = useReducer(x => x + 1, 0)
  useEffect(() => onGrowthBookRefresh(forceRerender), [])

  const model = parseUserSpecifiedModel(
    mainLoopModelForSession ??
      mainLoopModel ??
      getDefaultMainLoopModelSetting(),
  )
  return model
}
