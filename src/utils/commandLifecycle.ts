/**
 * @fileoverview commandLifecycle.ts — Command lifecycle event notifier
 *
 * Simple pub/sub for command start/complete events. Allows external
 * components (e.g., telemetry, UI indicators) to observe command lifecycle
 * without coupling to the command execution core.
 *
 * 设计：命令生命周期事件的发布/订阅机制，用于解耦命令执行与外部观察者。
 */

type CommandLifecycleState = 'started' | 'completed'

type CommandLifecycleListener = (
  uuid: string,
  state: CommandLifecycleState,
) => void

let listener: CommandLifecycleListener | null = null

/**
 * setCommandLifecycleListener — Register a lifecycle observer
 *
 * @param cb - Callback invoked on each command start/complete, or null to clear
 */
export function setCommandLifecycleListener(
  cb: CommandLifecycleListener | null,
): void {
  listener = cb
}

/**
 * notifyCommandLifecycle — Emit a lifecycle event
 *
 * @param uuid - Unique command identifier
 * @param state - 'started' or 'completed'
 *
 * @note Silently no-ops if no listener is registered.
 */
export function notifyCommandLifecycle(
  uuid: string,
  state: CommandLifecycleState,
): void {
  listener?.(uuid, state)
}
