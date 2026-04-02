import { isEnvTruthy } from './envUtils.js'

/**
 * Whether this build has bfs/ugrep embedded in the bun binary (ant-native only).
 * 此构建是否在 bun 二进制文件中嵌入了 bfs/ugrep（仅限 ant-native）。
 *
 * When true:
 * - `find` and `grep` in Claude's Bash shell are shadowed by shell functions
 *   that invoke the bun binary with argv0='bfs' / argv0='ugrep' (same trick
 *   as embedded ripgrep)
 * 当为 true 时：
 * - Claude 的 Bash shell 中的 `find` 和 `grep` 被 shell 函数遮蔽，
 *   这些函数使用 argv0='bfs' / argv0='ugrep' 调用 bun 二进制文件
 *   （与嵌入式 ripgrep 相同的技巧）
 * - 专用的 Glob/Grep 工具从工具注册表中移除
 * - 省略引导 Claude 避免使用 find/grep 的提示指导
 *
 * Set as a build-time define in scripts/build-with-plugins.ts for ant-native builds.
 * 在 ant-native 构建中设置为构建时定义。
 */
export function hasEmbeddedSearchTools(): boolean {
  if (!isEnvTruthy(process.env.EMBEDDED_SEARCH_TOOLS)) return false
  const e = process.env.CLAUDE_CODE_ENTRYPOINT
  return (
    e !== 'sdk-ts' && e !== 'sdk-py' && e !== 'sdk-cli' && e !== 'local-agent'
  )
}

/**
 * Path to the bun binary that contains the embedded search tools.
 * Only meaningful when hasEmbeddedSearchTools() is true.
 * 包含嵌入式搜索工具的 bun 二进制文件的路径。
 * 仅在 hasEmbeddedSearchTools() 为 true 时有意义。
 */
export function embeddedSearchToolsBinaryPath(): string {
  return process.execPath
}
