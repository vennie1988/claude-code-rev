import memoize from 'lodash-es/memoize.js'
import { homedir } from 'os'
import { join } from 'path'

// Memoized: 150+ callers, many on hot paths. Keyed off CLAUDE_CONFIG_DIR so
// tests that change the env var get a fresh value without explicit cache.clear.
// 记忆化：150+ 调用者，许多在热路径上。以 CLAUDE_CONFIG_DIR 为键，
// 以便更改环境变量的测试无需显式清除缓存即可获取新值。
export const getClaudeConfigHomeDir = memoize(
  (): string => {
    return (
      process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
    ).normalize('NFC')
  },
  () => process.env.CLAUDE_CONFIG_DIR,
)

export function getTeamsDir(): string {
  return join(getClaudeConfigHomeDir(), 'teams')
}

/**
 * Check if NODE_OPTIONS contains a specific flag.
 * Splits on whitespace and checks for exact match to avoid false positives.
 * 检查 NODE_OPTIONS 是否包含特定标志。按空白符分割并检查精确匹配以避免误报。
 */
export function hasNodeOption(flag: string): boolean {
  const nodeOptions = process.env.NODE_OPTIONS
  if (!nodeOptions) {
    return false
  }
  return nodeOptions.split(/\s+/).includes(flag)
}

export function isEnvTruthy(envVar: string | boolean | undefined): boolean {
  if (!envVar) return false
  if (typeof envVar === 'boolean') return envVar
  const normalizedValue = envVar.toLowerCase().trim()
  return ['1', 'true', 'yes', 'on'].includes(normalizedValue)
}

export function isEnvDefinedFalsy(
  envVar: string | boolean | undefined,
): boolean {
  if (envVar === undefined) return false
  if (typeof envVar === 'boolean') return !envVar
  if (!envVar) return false
  const normalizedValue = envVar.toLowerCase().trim()
  return ['0', 'false', 'no', 'off'].includes(normalizedValue)
}

/**
 * --bare / CLAUDE_CODE_SIMPLE — skip hooks, LSP, plugin sync, skill dir-walk,
 * attribution, background prefetches, and ALL keychain/credential reads.
 * Auth is strictly ANTHROPIC_API_KEY env or apiKeyHelper from --settings.
 * Explicit CLI flags (--plugin-dir, --add-dir, --mcp-config) still honored.
 * ~30 gates across the codebase.
 * --bare / CLAUDE_CODE_SIMPLE — 跳过 hooks、LSP、插件同步、skill 目录遍历、
 * attribution、后台预取和所有 keychain/凭证读取。认证严格限于 ANTHROPIC_API_KEY
 * 环境变量或 --settings 中的 apiKeyHelper。仍然遵循显式 CLI 标志（--plugin-dir、
 * --add-dir、--mcp-config）。整个代码库中约有 30 个门控。
 *
 * Checks argv directly (in addition to the env var) because several gates
 * run before main.tsx's action handler sets CLAUDE_CODE_SIMPLE=1 from --bare
 * — notably startKeychainPrefetch() at main.tsx top-level.
 * 直接检查 argv（除了环境变量），因为几个门控在 main.tsx 的动作处理器从
 * --bare 设置 CLAUDE_CODE_SIMPLE=1 之前运行——特别是 main.tsx 顶层的
 * startKeychainPrefetch()。
 */
export function isBareMode(): boolean {
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE) ||
    process.argv.includes('--bare')
  )
}

/**
 * Parses an array of environment variable strings into a key-value object
 * @param envVars Array of strings in KEY=VALUE format
 * @returns Object with key-value pairs
 * 将环境变量字符串数组解析为键值对象
 * @param envVars KEY=VALUE 格式的字符串数组
 * @returns 键值对对象
 */
export function parseEnvVars(
  rawEnvArgs: string[] | undefined,
): Record<string, string> {
  const parsedEnv: Record<string, string> = {}

  // Parse individual env vars
  if (rawEnvArgs) {
    for (const envStr of rawEnvArgs) {
      const [key, ...valueParts] = envStr.split('=')
      if (!key || valueParts.length === 0) {
        throw new Error(
          `Invalid environment variable format: ${envStr}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`,
        )
      }
      parsedEnv[key] = valueParts.join('=')
    }
  }
  return parsedEnv
}

/**
 * Get the AWS region with fallback to default
 * Matches the Anthropic Bedrock SDK's region behavior
 * 获取 AWS 区域，回退到默认值。匹配 Anthropic Bedrock SDK 的区域行为。
 */
export function getAWSRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
}

/**
 * Get the default Vertex AI region
 * 获取默认的 Vertex AI 区域
 */
export function getDefaultVertexRegion(): string {
  return process.env.CLOUD_ML_REGION || 'us-east5'
}

/**
 * Check if bash commands should maintain project working directory (reset to original after each command)
 * @returns true if CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR is set to a truthy value
 * 检查 bash 命令是否应维护项目工作目录（每个命令后重置为原始目录）
 * @returns 如果 CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR 设置为真值则返回 true
 */
export function shouldMaintainProjectWorkingDir(): boolean {
  return isEnvTruthy(process.env.CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR)
}

/**
 * Check if running on Homespace (ant-internal cloud environment)
 * 检查是否在 Homespace（ant 内部云环境）上运行
 */
export function isRunningOnHomespace(): boolean {
  return (
    process.env.USER_TYPE === 'ant' &&
    isEnvTruthy(process.env.COO_RUNNING_ON_HOMESPACE)
  )
}

/**
 * Conservative check for whether Claude Code is running inside a protected
 * (privileged or ASL3+) COO namespace or cluster.
 * 保守检查 Claude Code 是否在受保护的（特权或 ASL3+）COO 命名空间或集群中运行。
 *
 * Conservative means: when signals are ambiguous, assume protected. We would
 * rather over-report protected usage than miss it. Unprotected environments
 * are homespace, namespaces on the open allowlist, and no k8s/COO signals
 * at all (laptop/local dev).
 * 保守意味着：当信号不明确时，假定为受保护的。我们宁愿过度报告受保护的用法，
 * 也不愿遗漏它。非保护环境是 homespace、开放允许列表上的命名空间，
 * 以及完全没有 k8s/COO 信号的环境（笔记本/本地开发）。
 *
 * Used for telemetry to measure auto-mode usage in sensitive environments.
 * 用于遥测以测量敏感环境中的自动模式使用情况。
 */
export function isInProtectedNamespace(): boolean {
  // USER_TYPE is build-time --define'd; in external builds this block is
  // DCE'd so the require() and namespace allowlist never appear in the bundle.
  if (process.env.USER_TYPE === 'ant') {
    /* eslint-disable @typescript-eslint/no-require-imports */
    return (
      require('./protectedNamespace.js') as typeof import('./protectedNamespace.js')
    ).checkProtectedNamespace()
    /* eslint-enable @typescript-eslint/no-require-imports */
  }
  return false
}

// @[MODEL LAUNCH]: Add a Vertex region override env var for the new model.
/**
 * Model prefix → env var for Vertex region overrides.
 * Order matters: more specific prefixes must come before less specific ones
 * (e.g., 'claude-opus-4-1' before 'claude-opus-4').
 * 模型前缀 → Vertex 区域覆盖的环境变量。
 * 顺序很重要：更具体的前缀必须放在不太具体的前缀之前（例如 'claude-opus-4-1' 在 'claude-opus-4' 之前）。
 */
const VERTEX_REGION_OVERRIDES: ReadonlyArray<[string, string]> = [
  ['claude-haiku-4-5', 'VERTEX_REGION_CLAUDE_HAIKU_4_5'],
  ['claude-3-5-haiku', 'VERTEX_REGION_CLAUDE_3_5_HAIKU'],
  ['claude-3-5-sonnet', 'VERTEX_REGION_CLAUDE_3_5_SONNET'],
  ['claude-3-7-sonnet', 'VERTEX_REGION_CLAUDE_3_7_SONNET'],
  ['claude-opus-4-1', 'VERTEX_REGION_CLAUDE_4_1_OPUS'],
  ['claude-opus-4', 'VERTEX_REGION_CLAUDE_4_0_OPUS'],
  ['claude-sonnet-4-6', 'VERTEX_REGION_CLAUDE_4_6_SONNET'],
  ['claude-sonnet-4-5', 'VERTEX_REGION_CLAUDE_4_5_SONNET'],
  ['claude-sonnet-4', 'VERTEX_REGION_CLAUDE_4_0_SONNET'],
]

/**
 * Get the Vertex AI region for a specific model.
 * Different models may be available in different regions.
 * 获取特定模型的 Vertex AI 区域。不同的模型可能在不同的区域可用。
 */
export function getVertexRegionForModel(
  model: string | undefined,
): string | undefined {
  if (model) {
    const match = VERTEX_REGION_OVERRIDES.find(([prefix]) =>
      model.startsWith(prefix),
    )
    if (match) {
      return process.env[match[1]] || getDefaultVertexRegion()
    }
  }
  return getDefaultVertexRegion()
}
