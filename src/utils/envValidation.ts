import { logForDebugging } from './debug.js'

/**
 * EnvVarValidationResult — Result of environment variable validation
 * 环境变量验证的结果
 *
 * @property effective - The effective value after validation / 验证后的有效值
 * @property status - Validation status: 'valid', 'capped', or 'invalid' / 验证状态
 * @property message - Optional message describing the validation outcome / 描述验证结果的可选消息
 */
export type EnvVarValidationResult = {
  effective: number
  status: 'valid' | 'capped' | 'invalid'
  message?: string
}

/**
 * validateBoundedIntEnvVar — Validate and cap an integer environment variable
 * 验证并限制整数环境变量
 *
 * Parses an integer env var, returns a default if missing or invalid,
 * and caps the value at an upper limit.
 * 解析整数环境变量，如果缺失或无效则返回默认值，并将值限制在上限。
 *
 * @param name - Name of the environment variable (for logging) / 环境变量名称（用于日志）
 * @param value - Raw value from environment / 来自环境的原始值
 * @param defaultValue - Default value if missing or invalid / 缺失或无效时的默认值
 * @param upperLimit - Maximum allowed value / 最大允许值
 * @returns Validation result with effective value and status
 */
  name: string,
  value: string | undefined,
  defaultValue: number,
  upperLimit: number,
): EnvVarValidationResult {
  if (!value) {
    return { effective: defaultValue, status: 'valid' }
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed <= 0) {
    const result: EnvVarValidationResult = {
      effective: defaultValue,
      status: 'invalid',
      message: `Invalid value "${value}" (using default: ${defaultValue})`,
    }
    logForDebugging(`${name} ${result.message}`)
    return result
  }
  if (parsed > upperLimit) {
    const result: EnvVarValidationResult = {
      effective: upperLimit,
      status: 'capped',
      message: `Capped from ${parsed} to ${upperLimit}`,
    }
    logForDebugging(`${name} ${result.message}`)
    return result
  }
  return { effective: parsed, status: 'valid' }
}
