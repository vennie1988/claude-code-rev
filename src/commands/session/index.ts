import { getIsRemoteMode } from '../../bootstrap/state.js'
/**
 * @fileoverview index.ts — Remote session display command
 * /session 命令入口，显示远程会话URL和二维码
 * 仅在远程模式下可用（getIsRemoteMode()返回true时）
 */
import type { Command } from '../../commands.js'

const session = {
  type: 'local-jsx',
  name: 'session',
  aliases: ['remote'],
  description: 'Show remote session URL and QR code',
  isEnabled: () => getIsRemoteMode(),
  get isHidden() {
    return !getIsRemoteMode()
  },
  load: () => import('./session.js'),
} satisfies Command

export default session
