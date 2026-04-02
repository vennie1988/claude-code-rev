/**
 * @fileoverview queueProcessor.ts — 命令队列处理器，支持优先级感知的批量处理
 *
 * Processes queued user commands from the REPL input queue. Distinguishes between
 * slash commands (e.g. /commit) and bash-mode commands (individual per-command
 * isolation), which are processed one-at-a-time, versus other commands which are
 * batched by mode for efficient downstream processing.
 *
 * 设计意图：命令队列的出队处理器。根据命令类型（slash/bash/普通）决定是逐条处理还是批量处理，
 * 确保 bash 命令保留各自独立的错误隔离、退出码和进度 UI。
 *
 * @note 批量处理按 mode 分组，同一 mode 内的所有命令作为单一数组传给 executeInput，
 * 每条命令成为独立的用户消息（拥有独立 UUID）。不同 mode 不会混合处理。
 */
import type { QueuedCommand } from '../types/textInputTypes.js'
import {
  dequeue,
  dequeueAllMatching,
  hasCommandsInQueue,
  peek,
} from './messageQueueManager.js'

type ProcessQueueParams = {
  executeInput: (commands: QueuedCommand[]) => Promise<void>
}

type ProcessQueueResult = {
  processed: boolean
}

/**
 * isSlashCommand — 判断命令是否为 slash 命令（以 '/' 开头）
 *
 * 检查命令值是否为以 '/' 开头的字符串，用于区分 slash 命令和其他命令类型。
 * 也会检查 ContentBlockParam[] 格式的第一个文本块。
 *
 * @param cmd - 待检查的队列命令
 * @returns 是否为 slash 命令
 */
function isSlashCommand(cmd: QueuedCommand): boolean {
  if (typeof cmd.value === 'string') {
    return cmd.value.trim().startsWith('/')
  }
  // For ContentBlockParam[], check the first text block
  for (const block of cmd.value) {
    if (block.type === 'text') {
      return block.text.trim().startsWith('/')
    }
  }
  return false
}

/**
 * processQueueIfReady — 从队列中处理待执行的命令
 *
 * 处理逻辑：
 * - Slash 命令（以 '/' 开头）和 bash-mode 命令：逐条处理，确保每个命令独立的错误隔离、退出码和进度 UI
 * - 其他非 slash 命令：按 mode 批量处理，将同一 mode 的所有命令作为单一数组传给 executeInput
 * - 每条命令成为独立用户消息，拥有独立 UUID
 * - 不同 mode 不会混合处理
 *
 * 调用方负责确保当前没有查询正在运行，并在每个命令完成后再次调用此函数，直到队列为空。
 *
 * @param executeInput - 执行命令数组的回调函数
 * @returns 包含 processed 状态的结果对象
 *
 * @note 子代理通知（agentId !== undefined）会被跳过，避免 peek() 返回子代理通知
 * 导致队列永久停滞。
 */
export function processQueueIfReady({
  executeInput,
}: ProcessQueueParams): ProcessQueueResult {
  // This processor runs on the REPL main thread between turns. Skip anything
  // addressed to a subagent — an unfiltered peek() returning a subagent
  // notification would set targetMode, dequeueAllMatching would find nothing
  // matching that mode with agentId===undefined, and we'd return processed:
  // false with the queue unchanged → the React effect never re-fires and any
  // queued user prompt stalls permanently.
  const isMainThread = (cmd: QueuedCommand) => cmd.agentId === undefined

  const next = peek(isMainThread)
  if (!next) {
    return { processed: false }
  }

  // Slash commands and bash-mode commands are processed individually.
  // Bash commands need per-command error isolation, exit codes, and progress UI.
  if (isSlashCommand(next) || next.mode === 'bash') {
    const cmd = dequeue(isMainThread)!
    void executeInput([cmd])
    return { processed: true }
  }

  // Drain all non-slash-command items with the same mode at once.
  const targetMode = next.mode
  const commands = dequeueAllMatching(
    cmd => isMainThread(cmd) && !isSlashCommand(cmd) && cmd.mode === targetMode,
  )
  if (commands.length === 0) {
    return { processed: false }
  }

  void executeInput(commands)
  return { processed: true }
}

/**
 * hasQueuedCommands — 检查队列是否有待处理的命令
 *
 * 用于判断是否应该触发队列处理。委托给 messageQueueManager 的 hasCommandsInQueue。
 *
 * @returns 队列是否包含待处理命令
 */
export function hasQueuedCommands(): boolean {
  return hasCommandsInQueue()
}
