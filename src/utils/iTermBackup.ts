/**
 * @fileoverview iTermBackup.ts — iTerm2 配置备份与恢复工具
 * iTerm2 Configuration Backup and Restoration Utilities
 *
 * 设计意图：
 * - 在 iTerm2 安装前备份其配置文件
 * - 安装完成后自动恢复备份
 * - 使用全局配置跟踪备份状态
 *
 * 设计决策：
 * - 备份路径存储在全局配置中（iterm2BackupPath）
 * - 使用 iterm2SetupInProgress 标志跟踪安装状态
 * - 恢复失败时记录错误但不阻塞启动
 *
 * Design intent:
 * - Backup iTerm2 configuration before installation
 * - Automatically restore backup after installation completes
 * - Uses global config to track backup state
 *
 * Design decisions:
 * - Backup path stored in global config (iterm2BackupPath)
 * - Uses iterm2SetupInProgress flag to track installation state
 * - Restore failures are logged but do not block startup
 */

import { copyFile, stat } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import { getGlobalConfig, saveGlobalConfig } from './config.js'
import { logError } from './log.js'

/**
 * markITerm2SetupComplete — 标记 iTerm2 安装完成
 * Marks the iTerm2 setup as complete in global config.
 */
export function markITerm2SetupComplete(): void {
  saveGlobalConfig(current => ({
    ...current,
    iterm2SetupInProgress: false,
  }))
}

function getIterm2RecoveryInfo(): {
  inProgress: boolean
  backupPath: string | null
} {
  const config = getGlobalConfig()
  return {
    inProgress: config.iterm2SetupInProgress ?? false,
    backupPath: config.iterm2BackupPath || null,
  }
}

function getITerm2PlistPath(): string {
  return join(
    homedir(),
    'Library',
    'Preferences',
    'com.googlecode.iterm2.plist',
  )
}

type RestoreResult =
  | {
      status: 'restored' | 'no_backup'
    }
  | {
      status: 'failed'
      backupPath: string
    }

export async function checkAndRestoreITerm2Backup(): Promise<RestoreResult> {
  const { inProgress, backupPath } = getIterm2RecoveryInfo()
  if (!inProgress) {
    return { status: 'no_backup' }
  }

  if (!backupPath) {
    markITerm2SetupComplete()
    return { status: 'no_backup' }
  }

  try {
    await stat(backupPath)
  } catch {
    markITerm2SetupComplete()
    return { status: 'no_backup' }
  }

  try {
    await copyFile(backupPath, getITerm2PlistPath())

    markITerm2SetupComplete()
    return { status: 'restored' }
  } catch (restoreError) {
    logError(
      new Error(`Failed to restore iTerm2 settings with: ${restoreError}`),
    )
    markITerm2SetupComplete()
    return { status: 'failed', backupPath }
  }
}
