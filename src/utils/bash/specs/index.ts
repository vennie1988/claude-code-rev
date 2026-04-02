/**
 * @fileoverview specs/index.ts — Built-in command specifications registry
 *
 * 汇总所有内置命令规范的索引文件。
 * 提供命令名称到规范对象的映射，供 registry.ts 使用。
 */

import type { CommandSpec } from '../registry.js'
import alias from './alias.js'
import nohup from './nohup.js'
import pyright from './pyright.js'
import sleep from './sleep.js'
import srun from './srun.js'
import time from './time.js'
import timeout from './timeout.js'

export default [
  pyright,
  timeout,
  sleep,
  alias,
  nohup,
  time,
  srun,
] satisfies CommandSpec[]
