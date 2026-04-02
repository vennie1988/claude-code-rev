/**
 * @fileoverview useSettingsChange.ts — Settings change detection hook
 * 设置变更检测hook：订阅配置文件变更并触发回调。
 * Hook that subscribes to settings file changes and triggers callback.
 *
 * @design
 * - 通过settingsChangeDetector订阅变更
 * - 变更时获取最新设置（缓存由notifier重置）
 * - 避免N路震荡：每个订阅者重置缓存导致重复磁盘读取
 *
 * @design Subscribes to changes via settingsChangeDetector
 * @design Gets fresh settings on change (cache reset by notifier)
 * @design Prevents N-way thrashing from repeated cache invalidation
 */
import { useCallback, useEffect } from 'react'
import { settingsChangeDetector } from '../utils/settings/changeDetector.js'
import type { SettingSource } from '../utils/settings/constants.js'
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'
import type { SettingsJson } from '../utils/settings/types.js'

export function useSettingsChange(
  onChange: (source: SettingSource, settings: SettingsJson) => void,
): void {
  const handleChange = useCallback(
    (source: SettingSource) => {
      // Cache is already reset by the notifier (changeDetector.fanOut) —
      // resetting here caused N-way thrashing with N subscribers: each
      // cleared the cache, re-read from disk, then the next cleared again.
      const newSettings = getSettings_DEPRECATED()
      onChange(source, newSettings)
    },
    [onChange],
  )

  useEffect(
    () => settingsChangeDetector.subscribe(handleChange),
    [handleChange],
  )
}
