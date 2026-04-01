/**
 * @fileoverview types.ts — 内存类型定义 / Memory type definitions
 *
 * Defines memory type values used throughout Claude Code memory features.
 * Includes: User, Project, Local, Managed, AutoMem, and TeamMem (when enabled).
 *
 * 定义 Claude Code 内存功能中使用的内存类型值。
 * 包括：User、Project、Local、Managed、AutoMem 和 TeamMem（启用时）。
 */

import { feature } from 'bun:bundle'

export const MEMORY_TYPE_VALUES = [
  'User',
  'Project',
  'Local',
  'Managed',
  'AutoMem',
  ...(feature('TEAMMEM') ? (['TeamMem'] as const) : []),
] as const

export type MemoryType = (typeof MEMORY_TYPE_VALUES)[number]
