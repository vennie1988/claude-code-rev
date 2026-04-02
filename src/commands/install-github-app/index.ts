/**
 * @fileoverview index.ts — Install GitHub App command entry point
 * 安装 GitHub App 命令入口
 *
 * 功能说明：
 * - 提供 /install-github-app 命令
 * - 设置 GitHub Actions 工作流
 * - 仅在 claude-ai 和 console 平台可用
 * - 可通过环境变量 DISABLE_INSTALL_GITHUB_APP_COMMAND 禁用
 */
import type { Command } from '../../commands.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

const installGitHubApp = {
  type: 'local-jsx',
  name: 'install-github-app',
  description: 'Set up Claude GitHub Actions for a repository', // 中文：为仓库设置 Claude GitHub Actions
  availability: ['claude-ai', 'console'],
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_INSTALL_GITHUB_APP_COMMAND),
  load: () => import('./install-github-app.js'),
} satisfies Command

export default installGitHubApp
