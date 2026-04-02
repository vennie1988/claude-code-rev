import axios from 'axios'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { coerce } from 'semver'
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
import { getGlobalConfig, saveGlobalConfig } from './config.js'
import { getClaudeConfigHomeDir } from './envUtils.js'
import { toError } from './errors.js'
import { logError } from './log.js'
import { isEssentialTrafficOnly } from './privacyLevel.js'
import { gt } from './semver.js'

const MAX_RELEASE_NOTES_SHOWN = 5

/**
 * We fetch the changelog from GitHub instead of bundling it with the build.
 *
 * This is necessary because Ink's static rendering makes it difficult to
 * dynamically update/show components after initial render. By storing the
 * changelog in config, we ensure it's available on the next startup without
 * requiring a full re-render of the current UI.
 *
 * The flow is:
 * 1. User updates to a new version
 * 2. We fetch the changelog in the background and store it in config
 * 3. Next time the user starts Claude, the cached changelog is available immediately
 */
export const CHANGELOG_URL =
  'https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md'
const RAW_CHANGELOG_URL =
  'https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md'

/**
 * getChangelogCachePath — 获取缓存的 CHANGELOG 文件路径
 *
 * CHANGELOG 存储在 ~/.claude/cache/changelog.md
 *
 * @returns CHANGELOG 缓存文件的完整路径
 */
function getChangelogCachePath(): string {
  return join(getClaudeConfigHomeDir(), 'cache', 'changelog.md')
}

// In-memory cache populated by async reads. Sync callers (React render, sync
// helpers) read from this cache after setup.ts awaits checkForReleaseNotes().
let changelogMemoryCache: string | null = null

/** @internal exported for tests */
export function _resetChangelogCacheForTesting(): void {
  changelogMemoryCache = null
}

/**
 * migrateChangelogFromConfig — 将 CHANGELOG 从旧配置存储迁移到文件存储
 *
 * 在启动时调用一次，确保迁移在任何可能重新添加已弃用字段的配置保存之前发生。
 * 将 cachedChangelog 从配置迁移到文件（~/.claude/cache/changelog.md），
 * 然后从配置中删除已弃用的 cachedChangelog 字段。
 */
export async function migrateChangelogFromConfig(): Promise<void> {
  const config = getGlobalConfig()
  if (!config.cachedChangelog) {
    return
  }

  const cachePath = getChangelogCachePath()

  // If cache file doesn't exist, create it from old config
  try {
    await mkdir(dirname(cachePath), { recursive: true })
    await writeFile(cachePath, config.cachedChangelog, {
      encoding: 'utf-8',
      flag: 'wx', // Write only if file doesn't exist
    })
  } catch {
    // File already exists, which is fine - skip silently
  }

  // Remove the deprecated field from config
  saveGlobalConfig(({ cachedChangelog: _, ...rest }) => rest)
}

/**
 * fetchAndStoreChangelog — 从 GitHub 获取 CHANGELOG 并存储到缓存文件
 *
 * 在后台运行，不阻塞 UI。若内容未变化则跳过写入。
 * 非交互式会话或禁用非必要流量时跳过。
 *
 * @note 后台运行，不阻塞 UI
 */
export async function fetchAndStoreChangelog(): Promise<void> {
  // Skip in noninteractive mode
  if (getIsNonInteractiveSession()) {
    return
  }

  // Skip network requests if nonessential traffic is disabled
  if (isEssentialTrafficOnly()) {
    return
  }

  const response = await axios.get(RAW_CHANGELOG_URL)
  if (response.status === 200) {
    const changelogContent = response.data

    // Skip write if content unchanged — writing Date.now() defeats the
    // dirty-check in saveGlobalConfig since the timestamp always differs.
    if (changelogContent === changelogMemoryCache) {
      return
    }

    const cachePath = getChangelogCachePath()

    // Ensure cache directory exists
    await mkdir(dirname(cachePath), { recursive: true })

    // Write changelog to cache file
    await writeFile(cachePath, changelogContent, { encoding: 'utf-8' })
    changelogMemoryCache = changelogContent

    // Update timestamp in config
    const changelogLastFetched = Date.now()
    saveGlobalConfig(current => ({
      ...current,
      changelogLastFetched,
    }))
  }
}

/**
 * getStoredChangelog — 从缓存文件获取存储的 CHANGELOG
 *
 * 从缓存文件读取 CHANGELOG 内容，填充内存缓存供后续同步读取使用。
 *
 * @returns 缓存的 CHANGELOG 内容，若不可用则返回空字符串
 */
export async function getStoredChangelog(): Promise<string> {
  if (changelogMemoryCache !== null) {
    return changelogMemoryCache
  }
  const cachePath = getChangelogCachePath()
  try {
    const content = await readFile(cachePath, 'utf-8')
    changelogMemoryCache = content
    return content
  } catch {
    changelogMemoryCache = ''
    return ''
  }
}

/**
 * getStoredChangelogFromMemory — 同步获取内存中缓存的 CHANGELOG
 *
 * 仅从内存缓存读取 CHANGELOG。若异步的 getStoredChangelog() 尚未调用则返回空字符串。
 * 适用于 React render 路径（不支持 async）；setup.ts 通过 await checkForReleaseNotes()
 * 确保首次渲染前缓存已填充。
 *
 * @returns 内存缓存的 CHANGELOG 内容或空字符串
 */
export function getStoredChangelogFromMemory(): string {
  return changelogMemoryCache ?? ''
}

/**
 * parseChangelog — 解析 markdown 格式的 CHANGELOG 为结构化格式
 *
 * 将 CHANGELOG 字符串按 ## 标题（版本号）分割，提取各版本的发版说明。
 * 支持 "1.2.3" 和 "1.2.3 - YYYY-MM-DD" 两种版本行格式。
 *
 * @param content - CHANGELOG 内容字符串
 * @returns 版本号到发版说明数组的映射
 */
export function parseChangelog(content: string): Record<string, string[]> {
  try {
    if (!content) return {}

    // Parse the content
    const releaseNotes: Record<string, string[]> = {}

    // Split by heading lines (## X.X.X)
    const sections = content.split(/^## /gm).slice(1) // Skip the first section which is the header

    for (const section of sections) {
      const lines = section.trim().split('\n')
      if (lines.length === 0) continue

      // Extract version from the first line
      // Handle both "1.2.3" and "1.2.3 - YYYY-MM-DD" formats
      const versionLine = lines[0]
      if (!versionLine) continue

      // First part before any dash is the version
      const version = versionLine.split(' - ')[0]?.trim() || ''
      if (!version) continue

      // Extract bullet points
      const notes = lines
        .slice(1)
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.trim().substring(2).trim())
        .filter(Boolean)

      if (notes.length > 0) {
        releaseNotes[version] = notes
      }
    }

    return releaseNotes
  } catch (error) {
    logError(toError(error))
    return {}
  }
}

/**
 * getRecentReleaseNotes — 获取相对于上一版本的最新发版说明
 *
 * 根据上一版本获取需要显示的发版说明，最多显示 MAX_RELEASE_NOTES_SHOWN 条，
 * 优先显示最新版本。
 *
 * @param currentVersion - 当前应用版本
 * @param previousVersion - 上次看到发版说明的版本（首次为 null）
 * @param changelogContent - CHANGELOG 内容（默认为内存缓存）
 * @returns 要显示的发版说明数组
 */
export function getRecentReleaseNotes(
  currentVersion: string,
  previousVersion: string | null | undefined,
  changelogContent: string = getStoredChangelogFromMemory(),
): string[] {
  try {
    const releaseNotes = parseChangelog(changelogContent)

    // Strip SHA from both versions to compare only the base versions
    const baseCurrentVersion = coerce(currentVersion)
    const basePreviousVersion = previousVersion ? coerce(previousVersion) : null

    if (
      !basePreviousVersion ||
      (baseCurrentVersion &&
        gt(baseCurrentVersion.version, basePreviousVersion.version))
    ) {
      // Get all versions that are newer than the last seen version
      return Object.entries(releaseNotes)
        .filter(
          ([version]) =>
            !basePreviousVersion || gt(version, basePreviousVersion.version),
        )
        .sort(([versionA], [versionB]) => (gt(versionA, versionB) ? -1 : 1)) // Sort newest first
        .flatMap(([_, notes]) => notes)
        .filter(Boolean)
        .slice(0, MAX_RELEASE_NOTES_SHOWN)
    }
  } catch (error) {
    logError(toError(error))
    return []
  }
  return []
}

/**
 * getAllReleaseNotes — 获取所有发版说明
 *
 * 以 [version, notes[]] 数组形式返回所有发版说明，版本按从旧到新排序。
 *
 * @param changelogContent - CHANGELOG 内容（默认为内存缓存）
 * @returns [版本号, 发版说明[]] 数组
 */
export function getAllReleaseNotes(
  changelogContent: string = getStoredChangelogFromMemory(),
): Array<[string, string[]]> {
  try {
    const releaseNotes = parseChangelog(changelogContent)

    // Sort versions with oldest first
    const sortedVersions = Object.keys(releaseNotes).sort((a, b) =>
      gt(a, b) ? 1 : -1,
    )

    // Return array of [version, notes] arrays
    return sortedVersions
      .map(version => {
        const versionNotes = releaseNotes[version]
        if (!versionNotes || versionNotes.length === 0) return null

        const notes = versionNotes.filter(Boolean)
        if (notes.length === 0) return null

        return [version, notes] as [string, string[]]
      })
      .filter((item): item is [string, string[]] => item !== null)
  } catch (error) {
    logError(toError(error))
    return []
  }
}

/**
 * checkForReleaseNotes — 检查是否有需要显示的发版说明
 *
 * 根据上次看到的版本检查是否有需要显示的发版说明。
 * 多个组件可使用此方法决定是否显示发版说明。
 * 若版本已变更，也会触发获取最新 CHANGELOG。
 *
 * @param lastSeenVersion - 用户上次看到的发版说明版本
 * @param currentVersion - 当前应用版本（默认为 MACRO.VERSION）
 * @returns 包含 hasReleaseNotes 和 releaseNotes 的对象
 */
export async function checkForReleaseNotes(
  lastSeenVersion: string | null | undefined,
  currentVersion: string = MACRO.VERSION,
): Promise<{ hasReleaseNotes: boolean; releaseNotes: string[] }> {
  // For Ant builds, use VERSION_CHANGELOG bundled at build time
  if (process.env.USER_TYPE === 'ant') {
    const changelog = MACRO.VERSION_CHANGELOG
    if (changelog) {
      const commits = changelog.trim().split('\n').filter(Boolean)
      return {
        hasReleaseNotes: commits.length > 0,
        releaseNotes: commits,
      }
    }
    return {
      hasReleaseNotes: false,
      releaseNotes: [],
    }
  }

  // Ensure the in-memory cache is populated for subsequent sync reads
  const cachedChangelog = await getStoredChangelog()

  // If the version has changed or we don't have a cached changelog, fetch a new one
  // This happens in the background and doesn't block the UI
  if (lastSeenVersion !== currentVersion || !cachedChangelog) {
    fetchAndStoreChangelog().catch(error => logError(toError(error)))
  }

  const releaseNotes = getRecentReleaseNotes(
    currentVersion,
    lastSeenVersion,
    cachedChangelog,
  )
  const hasReleaseNotes = releaseNotes.length > 0

  return {
    hasReleaseNotes,
    releaseNotes,
  }
}

/**
 * checkForReleaseNotesSync — checkForReleaseNotes 的同步版本
 *
 * 适用于 React render 路径。仅从异步版本填充的内存缓存读取。
 * setup.ts 在首次渲染前会 await checkForReleaseNotes()，
 * 因此此函数在组件 render body 中返回准确结果。
 *
 * @param lastSeenVersion - 用户上次看到的发版说明版本
 * @param currentVersion - 当前应用版本（默认为 MACRO.VERSION）
 * @returns 包含 hasReleaseNotes 和 releaseNotes 的对象
 */
export function checkForReleaseNotesSync(
  lastSeenVersion: string | null | undefined,
  currentVersion: string = MACRO.VERSION,
): { hasReleaseNotes: boolean; releaseNotes: string[] } {
  // For Ant builds, use VERSION_CHANGELOG bundled at build time
  if (process.env.USER_TYPE === 'ant') {
    const changelog = MACRO.VERSION_CHANGELOG
    if (changelog) {
      const commits = changelog.trim().split('\n').filter(Boolean)
      return {
        hasReleaseNotes: commits.length > 0,
        releaseNotes: commits,
      }
    }
    return {
      hasReleaseNotes: false,
      releaseNotes: [],
    }
  }

  const releaseNotes = getRecentReleaseNotes(currentVersion, lastSeenVersion)
  return {
    hasReleaseNotes: releaseNotes.length > 0,
    releaseNotes,
  }
}
