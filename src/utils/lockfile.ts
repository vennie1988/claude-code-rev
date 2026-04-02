/**
 * @fileoverview lockfile.ts — proper-lockfile 惰性加载器
 * Lazy Accessor for proper-lockfile
 *
 * 设计意图：
 * - proper-lockfile 依赖 graceful-fs，后者在首次 require 时会 monkey-patch 所有 fs 方法（约 8ms 开销）
 * - 静态导入 proper-lockfile 会将这笔开销计入启动路径，即使实际上不需要锁定（如 `claude --help`）
 * - 通过此模块导入可延迟加载：只在首次调用锁函数时才实际加载底层包
 *
 * Design intent:
 * - proper-lockfile depends on graceful-fs, which monkey-patches every fs method on first require (~8ms)
 * - Static imports of proper-lockfile pull this cost into the startup path even when no locking happens (e.g. `--help`)
 * - Import this module instead of `proper-lockfile` directly - the underlying package is only loaded on first lock function call
 */

import type { CheckOptions, LockOptions, UnlockOptions } from 'proper-lockfile'

type Lockfile = typeof import('proper-lockfile')

let _lockfile: Lockfile | undefined

function getLockfile(): Lockfile {
  if (!_lockfile) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _lockfile = require('proper-lockfile') as Lockfile
  }
  return _lockfile
}

export function lock(
  file: string,
  options?: LockOptions,
): Promise<() => Promise<void>> {
  return getLockfile().lock(file, options)
}

export function lockSync(file: string, options?: LockOptions): () => void {
  return getLockfile().lockSync(file, options)
}

export function unlock(file: string, options?: UnlockOptions): Promise<void> {
  return getLockfile().unlock(file, options)
}

export function check(file: string, options?: CheckOptions): Promise<boolean> {
  return getLockfile().check(file, options)
}
