/**
 * @fileoverview useSettings.ts — Settings state access hook
 * 设置状态访问hook：从AppState获取当前设置，支持文件变更响应式更新。
 * React hook to access current settings from AppState.
 *
 * @design
 * - 通过useAppState订阅settings状态
 * - 设置变更通过settingsChangeDetector自动通知
 * - 返回DeepImmutable封装的ReadonlySettings类型
 * - 替代已弃用的getSettings_DEPRECATED()
 *
 * @design Subscribes to settings state via useAppState
 * @design Settings changes notified via settingsChangeDetector
 * @design Returns ReadonlySettings (DeepImmutable wrapped)
 * @design Replaces deprecated getSettings_DEPRECATED()
 */
import { type AppState, useAppState } from '../state/AppState.js'

/**
 * Settings type as stored in AppState (DeepImmutable wrapped).
 * Use this type when you need to annotate variables that hold settings from useSettings().
 */
export type ReadonlySettings = AppState['settings']

/**
 * React hook to access current settings from AppState.
 * Settings automatically update when files change on disk via settingsChangeDetector.
 *
 * Use this instead of getSettings_DEPRECATED() in React components for reactive updates.
 */
export function useSettings(): ReadonlySettings {
  return useAppState(s => s.settings)
}
