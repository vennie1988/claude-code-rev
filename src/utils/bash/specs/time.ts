/**
 * @fileoverview time.ts — Command specification for bash time builtin
 *
 * 定义 bash time 命令的规范。
 * time 用于测量命令执行时间。
 */

import type { CommandSpec } from '../registry.js'

const time: CommandSpec = {
  name: 'time',
  description: 'Time a command',
  args: {
    name: 'command',
    description: 'Command to time',
    isCommand: true,
  },
}

export default time
