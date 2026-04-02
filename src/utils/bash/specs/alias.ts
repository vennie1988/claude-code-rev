/**
 * @fileoverview alias.ts — Command specification for bash alias
 *
 * 定义 bash alias 命令的规范。
 * alias 用于创建或列出命令别名。
 */

import type { CommandSpec } from '../registry.js'

const alias: CommandSpec = {
  name: 'alias',
  description: 'Create or list command aliases',
  args: {
    name: 'definition',
    description: 'Alias definition in the form name=value',
    isOptional: true,
    isVariadic: true,
  },
}

export default alias
