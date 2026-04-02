/**
 * @fileoverview useMailboxBridge.ts — Mailbox poll-to-submit bridge hook
 * Mailbox轮询-提交桥接hook：将邮箱消息桥接到会话提交。
 * Bridges mailbox messages to session submission via useSyncExternalStore.
 *
 * @design
 * - 使用useSyncExternalStore订阅mailbox.revision变化
 * - 非加载状态时立即提交mailbox中的消息
 * - poll返回消息后通过onSubmitMessage提交
 *
 * @design useSyncExternalStore subscription to mailbox.revision changes
 * @design When not loading, immediately submits mailbox messages
 * @design Poll returns message via onSubmitMessage
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useMailbox } from '../context/mailbox.js'

type Props = {
  isLoading: boolean
  onSubmitMessage: (content: string) => boolean
}

export function useMailboxBridge({ isLoading, onSubmitMessage }: Props): void {
  const mailbox = useMailbox()

  const subscribe = useMemo(() => mailbox.subscribe.bind(mailbox), [mailbox])
  const getSnapshot = useCallback(() => mailbox.revision, [mailbox])
  const revision = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    if (isLoading) return
    const msg = mailbox.poll()
    if (msg) onSubmitMessage(msg.content)
  }, [isLoading, revision, mailbox, onSubmitMessage])
}
