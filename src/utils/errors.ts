import { APIUserAbortError } from '@anthropic-ai/sdk'

export class ClaudeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class MalformedCommandError extends Error {}

export class AbortError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'AbortError'
  }
}

/**
 * True iff `e` is any of the abort-shaped errors the codebase encounters:
 * our AbortError class, a DOMException from AbortController.abort()
 * (.name === 'AbortError'), or the SDK's APIUserAbortError. The SDK class
 * is checked via instanceof because minified builds mangle class names —
 * constructor.name becomes something like 'nJT' and the SDK never sets
 * this.name, so string matching silently fails in production.
 * 当 `e` 是代码库遇到的任何中止形式的错误时为 true：
 * 我们的 AbortError 类、AbortController.abort() 的 DOMException
 *（.name === 'AbortError'）或 SDK 的 APIUserAbortError。
 * SDK 类通过 instanceof 检查，因为精简版本会破坏类名——constructor.name
 * 变成类似 'nJT' 的东西，SDK 从不设置 this.name，
 * 所以字符串匹配在生产环境中静默失败。
 */
export function isAbortError(e: unknown): boolean {
  return (
    e instanceof AbortError ||
    e instanceof APIUserAbortError ||
    (e instanceof Error && e.name === 'AbortError')
  )
}

/**
 * Custom error class for configuration file parsing errors
 * Includes the file path and the default configuration that should be used
 * 配置文件解析错误的自定义错误类。包括文件路径和应使用的默认配置。
 */
export class ConfigParseError extends Error {
  filePath: string
  defaultConfig: unknown

  constructor(message: string, filePath: string, defaultConfig: unknown) {
    super(message)
    this.name = 'ConfigParseError'
    this.filePath = filePath
    this.defaultConfig = defaultConfig
  }
}

export class ShellError extends Error {
  constructor(
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly code: number,
    public readonly interrupted: boolean,
  ) {
    super('Shell command failed')
    this.name = 'ShellError'
  }
}

export class TeleportOperationError extends Error {
  constructor(
    message: string,
    public readonly formattedMessage: string,
  ) {
    super(message)
    this.name = 'TeleportOperationError'
  }
}

/**
 * Error with a message that is safe to log to telemetry.
 * Use the long name to confirm you've verified the message contains no
 * sensitive data (file paths, URLs, code snippets).
 * 消息安全可记录到遥测的错误。使用长名称来确认您已验证消息不包含敏感数据
 *（文件路径、URL、代码片段）。
 *
 * Single-arg: same message for user and telemetry
 * Two-arg: different messages (e.g., full message has file path, telemetry doesn't)
 * 单参数：用户和遥测使用相同消息。双参数：不同消息（例如，完整消息包含文件路径，遥测不包含）
 *
 * @example
 * // Same message for both
 * throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
 *   'MCP server "slack" connection timed out'
 * )
 *
 * // Different messages
 * throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
 *   `MCP tool timed out after ${ms}ms`,  // Full message for logs/user
 *   'MCP tool timed out'                  // Telemetry message
 * )
 */
export class TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS extends Error {
  readonly telemetryMessage: string

  constructor(message: string, telemetryMessage?: string) {
    super(message)
    this.name = 'TelemetrySafeError'
    this.telemetryMessage = telemetryMessage ?? message
  }
}

export function hasExactErrorMessage(error: unknown, message: string): boolean {
  return error instanceof Error && error.message === message
}

/**
 * Normalize an unknown value into an Error.
 * Use at catch-site boundaries when you need an Error instance.
 * 将未知值规范化为 Error。在需要 Error 实例的捕获站点边界使用。
 */
export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e))
}

/**
 * Extract a string message from an unknown error-like value.
 * Use when you only need the message (e.g., for logging or display).
 * 从未知的错误类似值中提取字符串消息。当您只需要消息时使用（例如，用于日志或显示）。
 */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * Extract the errno code (e.g., 'ENOENT', 'EACCES') from a caught error.
 * Returns undefined if the error has no code or is not an ErrnoException.
 * Replaces the `(e as NodeJS.ErrnoException).code` cast pattern.
 * 从捕获的错误中提取 errno 代码（例如 'ENOENT'、'EACCES'）。
 * 如果错误没有代码或不是 ErrnoException，则返回 undefined。
 * 替换 `(e as NodeJS.ErrnoException).code` 类型转换模式。
 */
export function getErrnoCode(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') {
    return e.code
  }
  return undefined
}

/**
 * True if the error is ENOENT (file or directory does not exist).
 * Replaces `(e as NodeJS.ErrnoException).code === 'ENOENT'`.
 * 如果错误是 ENOENT（文件或目录不存在）则为 true。
 * 替换 `(e as NodeJS.ErrnoException).code === 'ENOENT'`。
 */
export function isENOENT(e: unknown): boolean {
  return getErrnoCode(e) === 'ENOENT'
}

/**
 * Extract the errno path (the filesystem path that triggered the error)
 * from a caught error. Returns undefined if the error has no path.
 * Replaces the `(e as NodeJS.ErrnoException).path` cast pattern.
 * 从捕获的错误中提取 errno 路径（触发错误的文件系统路径）。
 * 如果错误没有路径则返回 undefined。替换 `(e as NodeJS.ErrnoException).path` 类型转换模式。
 */
export function getErrnoPath(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'path' in e && typeof e.path === 'string') {
    return e.path
  }
  return undefined
}

/**
 * Extract error message + top N stack frames from an unknown error.
 * Use when the error flows to the model as a tool_result — full stack
 * traces are ~500-2000 chars of mostly-irrelevant internal frames and
 * waste context tokens. Keep the full stack in debug logs instead.
 * 从未知错误中提取错误消息 + 前 N 个堆栈帧。当错误作为 tool_result 流向模型时使用——
 * 完整堆栈跟踪约为 500-2000 个字符，大部分是不相关的内部帧，浪费上下文令牌。
 * 将完整堆栈保留在调试日志中。
 */
export function shortErrorStack(e: unknown, maxFrames = 5): string {
  if (!(e instanceof Error)) return String(e)
  if (!e.stack) return e.message
  // V8/Bun stack format: "Name: message\n    at frame1\n    at frame2..."
  // First line is the message; subsequent "    at " lines are frames.
  const lines = e.stack.split('\n')
  const header = lines[0] ?? e.message
  const frames = lines.slice(1).filter(l => l.trim().startsWith('at '))
  if (frames.length <= maxFrames) return e.stack
  return [header, ...frames.slice(0, maxFrames)].join('\n')
}

/**
 * True if the error means the path is missing, inaccessible, or
 * structurally unreachable — use in catch blocks after fs operations to
 * distinguish expected "nothing there / no access" from unexpected errors.
 * 如果错误表示路径缺失、不可访问或结构上无法到达，则为 true——在 fs 操作后的
 * catch 块中使用，以区分预期的"那里没有/没有访问权限"和意外错误。
 *
 * Covers:
 *  ENOENT    — path does not exist / 路径不存在
 *  EACCES    — permission denied / 权限被拒绝
 *  EPERM     — operation not permitted / 操作不允许
 *  ENOTDIR   — a path component is not a directory (e.g. a file named
 *              `.claude` exists where a directory is expected)
 *              路径组件不是目录（例如，名为 `.claude` 的文件存在于预期为目录的位置）
 *  ELOOP     — too many symlink levels (circular symlinks) / 太多符号链接级别（循环符号链接）
 */
export function isFsInaccessible(e: unknown): e is NodeJS.ErrnoException {
  const code = getErrnoCode(e)
  return (
    code === 'ENOENT' ||
    code === 'EACCES' ||
    code === 'EPERM' ||
    code === 'ENOTDIR' ||
    code === 'ELOOP'
  )
}

export type AxiosErrorKind =
  | 'auth' // 401/403 — caller typically sets skipRetry / 401/403 — 调用者通常设置 skipRetry
  | 'timeout' // ECONNABORTED
  | 'network' // ECONNREFUSED/ENOTFOUND
  | 'http' // other axios error (may have status) / 其他 axios 错误（可能有状态）
  | 'other' // not an axios error / 不是 axios 错误

/**
 * Classify a caught error from an axios request into one of a few buckets.
 * Replaces the ~20-line isAxiosError → 401/403 → ECONNABORTED → ECONNREFUSED
 * chain duplicated across sync-style services (settingsSync, policyLimits,
 * remoteManagedSettings, teamMemorySync).
 * 将捕获的 axios 请求错误分类到几个桶中。替换跨同步样式服务
 *（settingsSync、policyLimits、remoteManagedSettings、teamMemorySync）
 * 重复的约 20 行 isAxiosError → 401/403 → ECONNABORTED → ECONNREFUSED 链。
 *
 * Checks the `.isAxiosError` marker property directly (same as
 * axios.isAxiosError()) to keep this module dependency-free.
 * 直接检查 `.isAxiosError` 标记属性（与 axios.isAxiosError() 相同），
 * 以保持此模块无依赖。
 */
export function classifyAxiosError(e: unknown): {
  kind: AxiosErrorKind
  status?: number
  message: string
} {
  const message = errorMessage(e)
  if (
    !e ||
    typeof e !== 'object' ||
    !('isAxiosError' in e) ||
    !e.isAxiosError
  ) {
    return { kind: 'other', message }
  }
  const err = e as {
    response?: { status?: number }
    code?: string
  }
  const status = err.response?.status
  if (status === 401 || status === 403) return { kind: 'auth', status, message }
  if (err.code === 'ECONNABORTED') return { kind: 'timeout', status, message }
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return { kind: 'network', status, message }
  }
  return { kind: 'http', status, message }
}
