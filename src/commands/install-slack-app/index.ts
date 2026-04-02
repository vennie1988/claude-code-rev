/**
 * @fileoverview index.ts — Install Slack app command entry
 * 安装 Slack 应用命令入口
 *
 * 功能说明：
 * - 提供 /install-slack-app 命令
 * - 在浏览器中打开 Slack 应用市场页面
 * - 仅在 claude-ai 平台可用
 */
import type { Command } from '../../commands.js'

const installSlackApp = {
  type: 'local',
  name: 'install-slack-app',
  description: 'Install the Claude Slack app', // 中文：安装 Claude Slack 应用
  availability: ['claude-ai'],
  supportsNonInteractive: false,
  load: () => import('./install-slack-app.js'),
} satisfies Command

export default installSlackApp
