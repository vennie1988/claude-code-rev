/**
 * @fileoverview store.ts — Minimal reactive store implementation
 *
 * A minimal reactive store with getState, setState, and subscribe.
 * Used as the foundation for application state management.
 *
 * 设计说明：
 * - store.ts 提供最小化的响应式存储实现
 * - 支持 getState、setState 和 subscribe 操作
 * - 用作应用程序状态管理的基础
 */

type Listener = () => void
type OnChange<T> = (args: { newState: T; oldState: T }) => void

export type Store<T> = {
  getState: () => T
  setState: (updater: (prev: T) => T) => void
  subscribe: (listener: Listener) => () => void
}

export function createStore<T>(
  initialState: T,
  onChange?: OnChange<T>,
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: () => state,

    setState: (updater: (prev: T) => T) => {
      const prev = state
      const next = updater(prev)
      if (Object.is(next, prev)) return
      state = next
      onChange?.({ newState: next, oldState: prev })
      for (const listener of listeners) listener()
    },

    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
