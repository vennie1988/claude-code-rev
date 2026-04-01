/**
 * @fileoverview timeout.ts — Command specification for GNU timeout
 *
 * 定义 timeout 命令的规范。
 * timeout 用于在指定时间后终止命令执行。
 */

import type { CommandSpec } from '../registry.js'

const timeout: CommandSpec = {
  name: 'timeout',
  description: 'Run a command with a time limit',
  args: [
    {
      name: 'duration',
      description: 'Duration to wait before timing out (e.g., 10, 5s, 2m)',
      isOptional: false,
    },
    {
      name: 'command',
      description: 'Command to run',
      isCommand: true,
    },
  ],
}

export default timeout
