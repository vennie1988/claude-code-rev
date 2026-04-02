// ---------------------------------------------------------------------------
// readFileInRange — 按行读取文件的两种实现路径
// ---------------------------------------------------------------------------
//
// 从文件中返回 lines [offset, offset + maxLines)。
//
// 快速路径（< 10 MB 的常规文件）：
//   打开文件，stat fd 句柄，用 readFile() 一次性读取整个文件，
//   然后在内存中按行分割。避免 createReadStream 的逐块异步开销，
//   对典型源文件提速约 2 倍。
//
// 流式路径（大文件、管道、设备等）：
//   使用 createReadStream 配合手动 indexOf('\n') 扫描。只累积请求范围内的行
//   —— 范围外的行只计数（用于 totalLines）但不保存，因此读取
//   100GB 文件的第 1 行也不会撑爆 RSS。
//
//   所有事件处理器（streamOnOpen/Data/End）均为模块级命名函数，无闭包。
//   状态保存在 StreamState 对象中；处理器通过 `this`（注册时绑定）访问。
//
//   生命周期：`open`、`end`、`error` 使用 .once()（自动移除）。
//   `data` 持续触发直到流结束或被销毁——两种情况下流和 state
//   会一起变得不可达并被 GC 回收。
//
//   出错时（包括超过 maxBytes），stream.destroy(err) 触发 'error' → reject
//   （直接传给 .once('error')）。
//
// 两种路径都去除 UTF-8 BOM 和 \r（CRLF → LF）。
//
// mtime 来自已打开 fd 的 fstat/stat——无需额外 open()。
//
// maxBytes 行为取决于 options.truncateOnByteLimit：
//   false（默认）：传统语义——若文件大小（快速路径）或
//     流式总字节数超过 maxBytes 则抛出 FileTooLargeError。
//   true：将输出截断至 maxBytes。在最后一个能完整放入的行停止；
//     在结果中设置 truncatedByBytes。不会抛出异常。
// ---------------------------------------------------------------------------

import { createReadStream, fstat } from 'fs'
import { stat as fsStat, readFile } from 'fs/promises'
import { formatFileSize } from './format.js'

const FAST_PATH_MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export type ReadFileRangeResult = {
  content: string
  lineCount: number
  totalLines: number
  totalBytes: number
  readBytes: number
  mtimeMs: number
  /** true when output was clipped to maxBytes under truncate mode */
  truncatedByBytes?: boolean
}

/**
 * FileTooLargeError — 文件大小超限异常
 *
 * 当文件大小超过 maxBytes 限制时抛出。使用 offset 和 limit 参数
 * 可以读取文件的特定部分，或使用搜索功能查找特定内容而非读取整个文件。
 *
 * @param sizeInBytes - 文件实际大小（字节）
 * @param maxSizeBytes - 最大允许大小（字节）
 */
export class FileTooLargeError extends Error {
  constructor(
    public sizeInBytes: number,
    public maxSizeBytes: number,
  ) {
    super(
      `File content (${formatFileSize(sizeInBytes)}) exceeds maximum allowed size (${formatFileSize(maxSizeBytes)}). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.`,
    )
    this.name = 'FileTooLargeError'
  }
}

// ---------------------------------------------------------------------------
// Public entry point / 公共入口函数
// ---------------------------------------------------------------------------

/**
 * readFileInRange — 按行范围读取文件
 *
 * 从文件中读取指定行范围 [offset, offset + maxLines)。
 * 根据文件大小自动选择快速路径（< 10MB 常规文件）或流式路径（大文件/管道/设备）。
 *
 * @param filePath - 文件路径
 * @param offset - 起始行号（默认 0）
 * @param maxLines - 最大行数（默认全部）
 * @param maxBytes - 最大字节数（可选）
 * @param signal - AbortSignal（可选）
 * @param options - 选项（如 truncateOnByteLimit）
 * @returns ReadFileRangeResult 对象
 *
 * @throws Error - 目录操作时抛出 EISDIR
 * @throws FileTooLargeError - 文件超过 maxBytes 且未设置 truncateOnByteLimit
 */

export async function readFileInRange(
  filePath: string,
  offset = 0,
  maxLines?: number,
  maxBytes?: number,
  signal?: AbortSignal,
  options?: { truncateOnByteLimit?: boolean },
): Promise<ReadFileRangeResult> {
  signal?.throwIfAborted()
  const truncateOnByteLimit = options?.truncateOnByteLimit ?? false

  // stat to decide the code path and guard against OOM.
  // For regular files under 10 MB: readFile + in-memory split (fast).
  // Everything else (large files, FIFOs, devices): streaming.
  const stats = await fsStat(filePath)

  if (stats.isDirectory()) {
    throw new Error(
      `EISDIR: illegal operation on a directory, read '${filePath}'`,
    )
  }

  if (stats.isFile() && stats.size < FAST_PATH_MAX_SIZE) {
    if (
      !truncateOnByteLimit &&
      maxBytes !== undefined &&
      stats.size > maxBytes
    ) {
      throw new FileTooLargeError(stats.size, maxBytes)
    }

    const text = await readFile(filePath, { encoding: 'utf8', signal })
    return readFileInRangeFast(
      text,
      stats.mtimeMs,
      offset,
      maxLines,
      truncateOnByteLimit ? maxBytes : undefined,
    )
  }

  return readFileInRangeStreaming(
    filePath,
    offset,
    maxLines,
    maxBytes,
    truncateOnByteLimit,
    signal,
  )
}

// ---------------------------------------------------------------------------
// Fast path — readFile + in-memory split / 快速路径
// ---------------------------------------------------------------------------

function readFileInRangeFast(
  raw: string,
  mtimeMs: number,
  offset: number,
  maxLines: number | undefined,
  truncateAtBytes: number | undefined,
): ReadFileRangeResult {
  const endLine = maxLines !== undefined ? offset + maxLines : Infinity

  // Strip BOM.
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw

  // Split lines, strip \r, select range.
  const selectedLines: string[] = []
  let lineIndex = 0
  let startPos = 0
  let newlinePos: number
  let selectedBytes = 0
  let truncatedByBytes = false

  function tryPush(line: string): boolean {
    if (truncateAtBytes !== undefined) {
      const sep = selectedLines.length > 0 ? 1 : 0
      const nextBytes = selectedBytes + sep + Buffer.byteLength(line)
      if (nextBytes > truncateAtBytes) {
        truncatedByBytes = true
        return false
      }
      selectedBytes = nextBytes
    }
    selectedLines.push(line)
    return true
  }

  while ((newlinePos = text.indexOf('\n', startPos)) !== -1) {
    if (lineIndex >= offset && lineIndex < endLine && !truncatedByBytes) {
      let line = text.slice(startPos, newlinePos)
      if (line.endsWith('\r')) {
        line = line.slice(0, -1)
      }
      tryPush(line)
    }
    lineIndex++
    startPos = newlinePos + 1
  }

  // Final fragment (no trailing newline).
  if (lineIndex >= offset && lineIndex < endLine && !truncatedByBytes) {
    let line = text.slice(startPos)
    if (line.endsWith('\r')) {
      line = line.slice(0, -1)
    }
    tryPush(line)
  }
  lineIndex++

  const content = selectedLines.join('\n')
  return {
    content,
    lineCount: selectedLines.length,
    totalLines: lineIndex,
    totalBytes: Buffer.byteLength(text, 'utf8'),
    readBytes: Buffer.byteLength(content, 'utf8'),
    mtimeMs,
    ...(truncatedByBytes ? { truncatedByBytes: true } : {}),
  }
}

// ---------------------------------------------------------------------------
// Streaming path — createReadStream + event handlers / 流式路径
// ---------------------------------------------------------------------------

type StreamState = {
  stream: ReturnType<typeof createReadStream>
  offset: number
  endLine: number
  maxBytes: number | undefined
  truncateOnByteLimit: boolean
  resolve: (value: ReadFileRangeResult) => void
  totalBytesRead: number
  selectedBytes: number
  truncatedByBytes: boolean
  currentLineIndex: number
  selectedLines: string[]
  partial: string
  isFirstChunk: boolean
  resolveMtime: (ms: number) => void
  mtimeReady: Promise<number>
}

function streamOnOpen(this: StreamState, fd: number): void {
  fstat(fd, (err, stats) => {
    this.resolveMtime(err ? 0 : stats.mtimeMs)
  })
}

function streamOnData(this: StreamState, chunk: string): void {
  if (this.isFirstChunk) {
    this.isFirstChunk = false
    if (chunk.charCodeAt(0) === 0xfeff) {
      chunk = chunk.slice(1)
    }
  }

  this.totalBytesRead += Buffer.byteLength(chunk)
  if (
    !this.truncateOnByteLimit &&
    this.maxBytes !== undefined &&
    this.totalBytesRead > this.maxBytes
  ) {
    this.stream.destroy(
      new FileTooLargeError(this.totalBytesRead, this.maxBytes),
    )
    return
  }

  const data = this.partial.length > 0 ? this.partial + chunk : chunk
  this.partial = ''

  let startPos = 0
  let newlinePos: number
  while ((newlinePos = data.indexOf('\n', startPos)) !== -1) {
    if (
      this.currentLineIndex >= this.offset &&
      this.currentLineIndex < this.endLine
    ) {
      let line = data.slice(startPos, newlinePos)
      if (line.endsWith('\r')) {
        line = line.slice(0, -1)
      }
      if (this.truncateOnByteLimit && this.maxBytes !== undefined) {
        const sep = this.selectedLines.length > 0 ? 1 : 0
        const nextBytes = this.selectedBytes + sep + Buffer.byteLength(line)
        if (nextBytes > this.maxBytes) {
          // Cap hit — collapse the selection range so nothing more is
          // accumulated.  Stream continues (to count totalLines).
          this.truncatedByBytes = true
          this.endLine = this.currentLineIndex
        } else {
          this.selectedBytes = nextBytes
          this.selectedLines.push(line)
        }
      } else {
        this.selectedLines.push(line)
      }
    }
    this.currentLineIndex++
    startPos = newlinePos + 1
  }

  // Only keep the trailing fragment when inside the selected range.
  // Outside the range we just count newlines — discarding prevents
  // unbounded memory growth on huge single-line files.
  if (startPos < data.length) {
    if (
      this.currentLineIndex >= this.offset &&
      this.currentLineIndex < this.endLine
    ) {
      const fragment = data.slice(startPos)
      // In truncate mode, `partial` can grow unboundedly if the selected
      // range contains a huge single line (no newline across many chunks).
      // Once the fragment alone would overflow the remaining budget, we know
      // the completed line can never fit — set truncated, collapse the
      // selection range, and discard the fragment to stop accumulation.
      if (this.truncateOnByteLimit && this.maxBytes !== undefined) {
        const sep = this.selectedLines.length > 0 ? 1 : 0
        const fragBytes = this.selectedBytes + sep + Buffer.byteLength(fragment)
        if (fragBytes > this.maxBytes) {
          this.truncatedByBytes = true
          this.endLine = this.currentLineIndex
          return
        }
      }
      this.partial = fragment
    }
  }
}

function streamOnEnd(this: StreamState): void {
  let line = this.partial
  if (line.endsWith('\r')) {
    line = line.slice(0, -1)
  }
  if (
    this.currentLineIndex >= this.offset &&
    this.currentLineIndex < this.endLine
  ) {
    if (this.truncateOnByteLimit && this.maxBytes !== undefined) {
      const sep = this.selectedLines.length > 0 ? 1 : 0
      const nextBytes = this.selectedBytes + sep + Buffer.byteLength(line)
      if (nextBytes > this.maxBytes) {
        this.truncatedByBytes = true
      } else {
        this.selectedLines.push(line)
      }
    } else {
      this.selectedLines.push(line)
    }
  }
  this.currentLineIndex++

  const content = this.selectedLines.join('\n')
  const truncated = this.truncatedByBytes
  this.mtimeReady.then(mtimeMs => {
    this.resolve({
      content,
      lineCount: this.selectedLines.length,
      totalLines: this.currentLineIndex,
      totalBytes: this.totalBytesRead,
      readBytes: Buffer.byteLength(content, 'utf8'),
      mtimeMs,
      ...(truncated ? { truncatedByBytes: true } : {}),
    })
  })
}

function readFileInRangeStreaming(
  filePath: string,
  offset: number,
  maxLines: number | undefined,
  maxBytes: number | undefined,
  truncateOnByteLimit: boolean,
  signal?: AbortSignal,
): Promise<ReadFileRangeResult> {
  return new Promise((resolve, reject) => {
    const state: StreamState = {
      stream: createReadStream(filePath, {
        encoding: 'utf8',
        highWaterMark: 512 * 1024,
        ...(signal ? { signal } : undefined),
      }),
      offset,
      endLine: maxLines !== undefined ? offset + maxLines : Infinity,
      maxBytes,
      truncateOnByteLimit,
      resolve,
      totalBytesRead: 0,
      selectedBytes: 0,
      truncatedByBytes: false,
      currentLineIndex: 0,
      selectedLines: [],
      partial: '',
      isFirstChunk: true,
      resolveMtime: () => {},
      mtimeReady: null as unknown as Promise<number>,
    }
    state.mtimeReady = new Promise<number>(r => {
      state.resolveMtime = r
    })

    state.stream.once('open', streamOnOpen.bind(state))
    state.stream.on('data', streamOnData.bind(state))
    state.stream.once('end', streamOnEnd.bind(state))
    state.stream.once('error', reject)
  })
}
