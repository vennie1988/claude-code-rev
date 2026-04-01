/**
 * @fileoverview mailbox.ts — 消息邮箱实现
 * Message Mailbox Implementation
 *
 * 设计意图：提供进程内的消息传递机制，支持：
 * - 消息队列存储
 * - 同步轮询（poll）
 * - 异步等待（receive）
 * - 发布-订阅模式（subscribe）
 *
 * 类似于 Actor 模型中的邮箱，用于团队成员间的消息传递。
 *
 * Design intent: Provides in-process message passing mechanism with:
 * - Message queue storage
 * - Synchronous polling (poll)
 * - Async waiting (receive)
 * - Publish-subscribe pattern (subscribe)
 *
 * Similar to an actor's mailbox for team member communication.
 */

import { createSignal } from './signal.js'

/**
 * MessageSource — 消息来源类型
 * Possible sources for a message in the mailbox.
 */
export type MessageSource = 'user' | 'teammate' | 'system' | 'tick' | 'task'

export type Message = {
  id: string
  source: MessageSource
  content: string
  from?: string
  color?: string
  timestamp: string
}

type Waiter = {
  fn: (msg: Message) => boolean
  resolve: (msg: Message) => void
}

export class Mailbox {
  private queue: Message[] = []
  private waiters: Waiter[] = []
  private changed = createSignal()
  private _revision = 0

  get length(): number {
    return this.queue.length
  }

  get revision(): number {
    return this._revision
  }

  send(msg: Message): void {
    this._revision++
    const idx = this.waiters.findIndex(w => w.fn(msg))
    if (idx !== -1) {
      const waiter = this.waiters.splice(idx, 1)[0]
      if (waiter) {
        waiter.resolve(msg)
        this.notify()
        return
      }
    }
    this.queue.push(msg)
    this.notify()
  }

  poll(fn: (msg: Message) => boolean = () => true): Message | undefined {
    const idx = this.queue.findIndex(fn)
    if (idx === -1) return undefined
    return this.queue.splice(idx, 1)[0]
  }

  receive(fn: (msg: Message) => boolean = () => true): Promise<Message> {
    const idx = this.queue.findIndex(fn)
    if (idx !== -1) {
      const msg = this.queue.splice(idx, 1)[0]
      if (msg) {
        this.notify()
        return Promise.resolve(msg)
      }
    }
    return new Promise<Message>(resolve => {
      this.waiters.push({ fn, resolve })
    })
  }

  subscribe = this.changed.subscribe

  private notify(): void {
    this.changed.emit()
  }
}
