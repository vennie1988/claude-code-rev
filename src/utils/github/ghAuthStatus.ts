import { execa } from 'execa'
import { which } from '../which.js'

export type GhAuthStatus =
  | 'authenticated'
  | 'not_authenticated'
  | 'not_installed'

/**
 * @fileoverview ghAuthStatus.ts — GitHub CLI 认证状态检测 / GitHub CLI authentication status detection
 *
 * ## 功能说明 (Description)
 * 检测 gh CLI 是否已安装以及用户是否已认证。用于遥测数据收集。
 * - 首先使用 which() 检测安装（无子进程开销）
 * - 然后检查 `gh auth token` 的退出码检测认证状态
 * - 使用 `auth token` 而非 `auth status`，因为后者会发起网络请求
 * - stdout 设为 'ignore'，确保 token 不会进入本进程
 *
 * Returns gh CLI install + auth status for telemetry.
 * Uses which() first (Bun.which — no subprocess) to detect install, then
 * exit code of `gh auth token` to detect auth. Uses `auth token` instead of
 * `auth status` because the latter makes a network request to GitHub's API,
 * while `auth token` only reads local config/keyring. Spawns with
 * stdout: 'ignore' so the token never enters this process.
 */
export async function getGhAuthStatus(): Promise<GhAuthStatus> {
  const ghPath = await which('gh')
  if (!ghPath) {
    return 'not_installed'
  }
  const { exitCode } = await execa('gh', ['auth', 'token'], {
    stdout: 'ignore',
    stderr: 'ignore',
    timeout: 5000,
    reject: false,
  })
  return exitCode === 0 ? 'authenticated' : 'not_authenticated'
}
