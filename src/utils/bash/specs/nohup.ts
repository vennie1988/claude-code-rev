/**
 * @fileoverview nohup.ts — Command specification for nohup
 *
 * 定义 nohup 命令的规范。
 * nohup 使命令免疫挂起信号，常用于后台任务。
 */

import type { CommandSpec } from '../registry.js'

const nohup: CommandSpec = {
  name: 'nohup',
  description: 'Run a command immune to hangups',
  args: {
    name: 'command',
    description: 'Command to run with nohup',
    isCommand: true,
  },
}

export default nohup
