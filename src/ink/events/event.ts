/**
 * Base Event Class / 基础事件类
 *
 * Base class for all terminal events with propagation control.
 * 所有带传播控制终端事件的基础类。
 */

export class Event {
  private _didStopImmediatePropagation = false

  didStopImmediatePropagation(): boolean {
    return this._didStopImmediatePropagation
  }

  stopImmediatePropagation(): void {
    this._didStopImmediatePropagation = true
  }
}
