/**
 * @fileoverview readEditContext.ts — 在文件中搜索指定字符串并返回上下文窗口
 *
 * 提供 readEditContext() 函数：在文件中查找 needle（目标字符串），返回包含匹配位置
 * 前后指定行数的上下文切片。采用 8KB 分块扫描，带跨块重叠区以确保跨边界匹配被找到。
 *
 * 设计决策：
 * - 使用 straddle overlap（跨越重叠）处理跨块边界匹配
 * - 无需 stat，通过 bytesRead 检测 EOF
 * - React 调用方：包裹在 useState lazy-init 中，然后使用 use() + Suspense
 *
 * @note 限流：最多扫描 MAX_SCAN_BYTES 字节。React 组件中建议用 useMemo 缓存。
 */
import { type FileHandle, open } from 'fs/promises'
import { isENOENT } from './errors.js'

export const CHUNK_SIZE = 8 * 1024
export const MAX_SCAN_BYTES = 10 * 1024 * 1024
const NL = 0x0a

export type EditContext = {
  /** 文件切片：匹配位置前后各 contextLines 行，起始位于行边界。 */
  content: string
  /** content 第一个字符在原文件中的行号（1-based）。 */
  lineOffset: number
  /** 若达到 MAX_SCAN_BYTES 仍未找到 needle，则为 true。 */
  truncated: boolean
}

/**
 * readEditContext — 在文件中查找 needle 并返回上下文窗口切片
 *
 * 在文件 path 中查找 needle（目标字符串），返回包含匹配位置前后各 contextLines 行
 * 的上下文切片。采用 8KB 分块扫描，带跨块重叠区（straddle overlap）确保跨块边界
 * 匹配被找到。限流 MAX_SCAN_BYTES。通过 bytesRead 检测 EOF，无需 stat。
 *
 * React 调用方：包裹在 useState lazy-init 中，然后使用 use() + Suspense。
 * useMemo 在调用方传入新的数组字面量时重新运行。
 *
 * @param path - 文件路径
 * @param needle - 要查找的目标字符串
 * @param contextLines - 匹配前后各显示多少行上下文（默认 3）
 * @returns 包含上下文切片的对象，或 null（文件不存在时）或 { truncated: true, content: '' }
 *   （MAX_SCAN_BYTES 内未找到 needle 时）
 */
export async function readEditContext(
  path: string,
  needle: string,
  contextLines = 3,
): Promise<EditContext | null> {
  const handle = await openForScan(path)
  if (handle === null) return null
  try {
    return await scanForContext(handle, needle, contextLines)
  } finally {
    await handle.close()
  }
}

/**
 * openForScan — 打开文件用于扫描
 *
 * 打开 path 对应的文件用于读取。返回 null（文件不存在时），调用方负责关闭文件句柄。
 *
 * @param path - 文件路径
 * @returns 文件句柄，或 null（文件不存在时）
 */
export async function openForScan(path: string): Promise<FileHandle | null> {
  try {
    return await open(path, 'r')
  } catch (e) {
    if (isENOENT(e)) return null
    throw e
  }
}

/**
 * scanForContext — readEditContext 的核心实现，调用方负责 open/close
 *
 * 打开已打开的文件句柄，扫描 needle，处理 CRLF 换行符匹配（needle 中用 LF，
 * 文件中可能是 CRLF），通过 straddle overlap 找到跨块边界匹配。
 *
 * @param handle - 已打开的文件句柄
 * @param needle - 要查找的目标字符串
 * @param contextLines - 上下文行数
 * @returns EditContext 对象
 */
export async function scanForContext(
  handle: FileHandle,
  needle: string,
  contextLines: number,
): Promise<EditContext> {
  if (needle === '') return { content: '', lineOffset: 1, truncated: false }
  const needleLF = Buffer.from(needle, 'utf8')
  // Model sends LF; files may be CRLF. Count newlines to size the overlap for
  // the longer CRLF form; defer encoding the CRLF buffer until LF scan misses.
  let nlCount = 0
  for (let i = 0; i < needleLF.length; i++) if (needleLF[i] === NL) nlCount++
  let needleCRLF: Buffer | undefined
  const overlap = needleLF.length + nlCount - 1

  const buf = Buffer.allocUnsafe(CHUNK_SIZE + overlap)
  let pos = 0
  let linesBeforePos = 0
  let prevTail = 0

  while (pos < MAX_SCAN_BYTES) {
    const { bytesRead } = await handle.read(buf, prevTail, CHUNK_SIZE, pos)
    if (bytesRead === 0) break
    const viewLen = prevTail + bytesRead

    let matchAt = indexOfWithin(buf, needleLF, viewLen)
    let matchLen = needleLF.length
    if (matchAt === -1 && nlCount > 0) {
      needleCRLF ??= Buffer.from(needle.replaceAll('\n', '\r\n'), 'utf8')
      matchAt = indexOfWithin(buf, needleCRLF, viewLen)
      matchLen = needleCRLF.length
    }
    if (matchAt !== -1) {
      const absMatch = pos - prevTail + matchAt
      return await sliceContext(
        handle,
        buf,
        absMatch,
        matchLen,
        contextLines,
        linesBeforePos + countNewlines(buf, 0, matchAt),
      )
    }
    pos += bytesRead
    // Shift the tail to the front for straddle. linesBeforePos tracks
    // newlines in bytes we've DISCARDED (not in buf) — count only the
    // non-overlap portion we're about to copyWithin over.
    const nextTail = Math.min(overlap, viewLen)
    linesBeforePos += countNewlines(buf, 0, viewLen - nextTail)
    prevTail = nextTail
    buf.copyWithin(0, viewLen - prevTail, viewLen)
  }

  return { content: '', lineOffset: 1, truncated: pos >= MAX_SCAN_BYTES }
}

/**
 * readCapped — 读取文件内容（最多 MAX_SCAN_BYTES 字节）
 *
 * 通过 handle 读取整个文件，最多 MAX_SCAN_BYTES 字节。文件超过上限时返回 null。
 * 用于 FileEditToolDiff 的多编辑路径，顺序替换需要完整字符串。
 *
 * 采用单缓冲区填充翻倍策略——~log2(size/8KB) 次分配，而非 O(n) 块 + concat。
 * 直接读取到正确偏移位置；无中间副本。
 *
 * @param handle - 已打开的文件句柄
 * @returns 文件内容字符串，或 null（文件超过上限）
 */
export async function readCapped(handle: FileHandle): Promise<string | null> {
  let buf = Buffer.allocUnsafe(CHUNK_SIZE)
  let total = 0
  for (;;) {
    if (total === buf.length) {
      const grown = Buffer.allocUnsafe(
        Math.min(buf.length * 2, MAX_SCAN_BYTES + CHUNK_SIZE),
      )
      buf.copy(grown, 0, 0, total)
      buf = grown
    }
    const { bytesRead } = await handle.read(
      buf,
      total,
      buf.length - total,
      total,
    )
    if (bytesRead === 0) break
    total += bytesRead
    if (total > MAX_SCAN_BYTES) return null
  }
  return normalizeCRLF(buf, total)
}

/** buf.indexOf bounded to [0, end) without allocating a view. */
function indexOfWithin(buf: Buffer, needle: Buffer, end: number): number {
  const at = buf.indexOf(needle)
  return at === -1 || at + needle.length > end ? -1 : at
}

function countNewlines(buf: Buffer, start: number, end: number): number {
  let n = 0
  for (let i = start; i < end; i++) if (buf[i] === NL) n++
  return n
}

/** Decode buf[0..len) to utf8, normalizing CRLF only if CR is present. */
function normalizeCRLF(buf: Buffer, len: number): string {
  const s = buf.toString('utf8', 0, len)
  return s.includes('\r') ? s.replaceAll('\r\n', '\n') : s
}

/**
 * sliceContext — 根据绝对匹配偏移量读取前后 contextLines 行
 *
 * 给定绝对匹配偏移量，读取匹配位置前后各 contextLines 行，
 * 返回解码后的切片及其起始行号。复用调用方的 scan buffer 进行前向/后向/输出读取——
 * 上下文能放入时零分配，否则仅一次分配。
 *
 * @param handle - 已打开的文件句柄
 * @param scratch - 调用方的扫描缓冲区
 * @param matchStart - 匹配开始位置（绝对偏移）
 * @param matchLen - 匹配长度
 * @param contextLines - 上下文行数
 * @param linesBeforeMatch - 匹配前的行数
 * @returns EditContext 对象
 */
async function sliceContext(
  handle: FileHandle,
  scratch: Buffer,
  matchStart: number,
  matchLen: number,
  contextLines: number,
  linesBeforeMatch: number,
): Promise<EditContext> {
  // Scan backward from matchStart to find contextLines prior newlines.
  const backChunk = Math.min(matchStart, CHUNK_SIZE)
  const { bytesRead: backRead } = await handle.read(
    scratch,
    0,
    backChunk,
    matchStart - backChunk,
  )
  let ctxStart = matchStart
  let nlSeen = 0
  for (let i = backRead - 1; i >= 0 && nlSeen <= contextLines; i--) {
    if (scratch[i] === NL) {
      nlSeen++
      if (nlSeen > contextLines) break
    }
    ctxStart--
  }
  // Compute lineOffset now, before scratch is overwritten by the forward read.
  const walkedBack = matchStart - ctxStart
  const lineOffset =
    linesBeforeMatch -
    countNewlines(scratch, backRead - walkedBack, backRead) +
    1

  // Scan forward from matchEnd to find contextLines trailing newlines.
  const matchEnd = matchStart + matchLen
  const { bytesRead: fwdRead } = await handle.read(
    scratch,
    0,
    CHUNK_SIZE,
    matchEnd,
  )
  let ctxEnd = matchEnd
  nlSeen = 0
  for (let i = 0; i < fwdRead; i++) {
    ctxEnd++
    if (scratch[i] === NL) {
      nlSeen++
      if (nlSeen >= contextLines + 1) break
    }
  }

  // Read the exact context range. Reuse scratch if it fits.
  const len = ctxEnd - ctxStart
  const out = len <= scratch.length ? scratch : Buffer.allocUnsafe(len)
  const { bytesRead: outRead } = await handle.read(out, 0, len, ctxStart)

  return { content: normalizeCRLF(out, outRead), lineOffset, truncated: false }
}
