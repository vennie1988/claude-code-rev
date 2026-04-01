/**
 * @fileoverview sleep.ts — Command specification for bash sleep builtin
 *
 * 定义 sleep 命令的规范。
 * sleep 用于暂停执行指定时间。
 */

import type { CommandSpec } from '../registry.js'

const sleep: CommandSpec = {
  name: 'sleep',
  description: 'Delay for a specified amount of time',
  args: {
    name: 'duration',
    description: 'Duration to sleep (seconds or with suffix like 5s, 2m, 1h)',
    isOptional: false,
  },
}

export default sleep
