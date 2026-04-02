/**
 * @fileoverview index.ts — Doctor command definition
 * 命令定义文件：/doctor 命令，用于诊断和验证 Claude Code 安装及设置状态
 * Defines the /doctor slash command that diagnoses Claude Code installation issues.
 * Can be disabled via DISABLE_DOCTOR_COMMAND environment variable.
 *
 * @note 仅在非 ant 用户类型时可用，通过环境变量禁用
 */
import type { Command } from '../../commands.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

const doctor: Command = {
  name: 'doctor',
  description: 'Diagnose and verify your Claude Code installation and settings',
  // 诊断命令可通过环境变量禁用
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_DOCTOR_COMMAND),
  type: 'local-jsx',
  load: () => import('./doctor.js'),
}

export default doctor
