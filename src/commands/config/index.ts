/**
 * @fileoverview index.ts — Config command entry point
 * 配置面板命令入口
 *
 * 功能说明：
 * - 打开 Claude Code 配置面板
 * - 提供 settings 别名
 */
import type { Command } from '../../commands.js'

const config = {
  aliases: ['settings'],
  type: 'local-jsx',
  name: 'config',
  description: 'Open config panel', // 中文：打开配置面板
  load: () => import('./config.js'),
} satisfies Command

export default config
