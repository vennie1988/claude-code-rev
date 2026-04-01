/**
 * @fileoverview registry.ts — Command specification registry with Fig spec loader
 *
 * 命令规范注册表，提供命令参数和选项的规范定义。
 * 支持内置规范和从 @withfig/autocomplete 包动态加载的规范。
 *
 * 主要功能:
 * - 内置规范: pyright, timeout, sleep, alias, nohup, time, srun
 * - Fig 规范: 从 @withfig/autocomplete 动态加载（用于增强的命令补全）
 * - LRU 缓存: 通过 memoizeWithLRU 避免重复解析
 *
 * @security 命令名验证: 拒绝包含 /, \, .., 或以 - 开头（除了单个 -）的名称，
 *   防止路径遍历攻击和无效命令名
 */

import { memoizeWithLRU } from '../memoize.js'
import specs from './specs/index.js'

export type CommandSpec = {
  name: string
  description?: string
  subcommands?: CommandSpec[]
  args?: Argument | Argument[]
  options?: Option[]
}

export type Argument = {
  name?: string
  description?: string
  isDangerous?: boolean
  isVariadic?: boolean // repeats infinitely e.g. echo hello world
  isOptional?: boolean
  isCommand?: boolean // wrapper commands e.g. timeout, sudo
  isModule?: string | boolean // for python -m and similar module args
  isScript?: boolean // script files e.g. node script.js
}

export type Option = {
  name: string | string[]
  description?: string
  args?: Argument | Argument[]
  isRequired?: boolean
}

export async function loadFigSpec(
  command: string,
): Promise<CommandSpec | null> {
  if (!command || command.includes('/') || command.includes('\\')) return null
  if (command.includes('..')) return null
  if (command.startsWith('-') && command !== '-') return null

  try {
    const module = await import(`@withfig/autocomplete/build/${command}.js`)
    return module.default || module
  } catch {
    return null
  }
}
export const getCommandSpec = memoizeWithLRU(
  async (command: string): Promise<CommandSpec | null> => {
    const spec =
      specs.find(s => s.name === command) ||
      (await loadFigSpec(command)) ||
      null
    return spec
  },
  (command: string) => command,
)
