/**
 * @fileoverview index.ts — Branch command entry point
 * Entry point for /branch command. Lazily loads the branch implementation.
 *
 * 功能说明：
 * - 命令入口，延迟加载实际实现
 * - 提供 fork 别名（当 /fork 命令不存在时）
 */
import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'

const branch = {
  type: 'local-jsx',
  name: 'branch',
  // 'fork' alias only when /fork doesn't exist as its own command
  // fork 别名：仅在 /fork 命令不存在时启用
  aliases: feature('FORK_SUBAGENT') ? [] : ['fork'],
  description: 'Create a branch of the current conversation at this point',
  argumentHint: '[name]',
  load: () => import('./branch.js'),
} satisfies Command

export default branch
