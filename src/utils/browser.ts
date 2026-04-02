/**
 * @fileoverview browser.ts — 浏览器/路径打开工具 / Browser and path opening utilities
 *
 * Provides utilities for opening URLs and file paths in the system's default handler.
 * Platform-aware: Uses `open` on macOS, `explorer` on Windows, `xdg-open` on Linux.
 *
 * 平台支持 / Platform support:
 * - macOS: Uses `open` command
 * - Windows: Uses `explorer` for paths, `rundll32 url,OpenURL` for URLs
 * - Linux: Uses `xdg-open` command
 *
 * 设计决策 / Design decisions:
 * - Browser env var: Respects BROWSER environment variable for custom browser selection
 * - Security: Validates URL protocol (only http/https allowed)
 * - Graceful degradation: Returns false on any error rather than throwing
 *
 * @see execFileNoThrow.ts — for the underlying execution utility
 */

import { execFileNoThrow } from './execFileNoThrow.js'

/**
 * validateUrl — Validate URL format and protocol for security
 *
 * @param url - URL string to validate
 * @throws Error if URL is invalid or uses non-HTTP protocol
 *
 * 安全验证 / Security validation:
 * - Only http: and https: protocols are allowed
 * - Throws on invalid URL format
 */
function validateUrl(url: string): void {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch (_error) {
    throw new Error(`Invalid URL format: ${url}`)
  }

  // Validate URL protocol for security
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `Invalid URL protocol: must use http:// or https://, got ${parsedUrl.protocol}`,
    )
  }
}

/**
 * Open a file or folder path using the system's default handler.
 * Uses `open` on macOS, `explorer` on Windows, `xdg-open` on Linux.
 *
 * 打开文件或文件夹 / Open a file or folder path:
 * - macOS: Uses `open` command
 * - Windows: Uses `explorer` command
 * - Linux: Uses `xdg-open` command
 */
export async function openPath(path: string): Promise<boolean> {
  try {
    const platform = process.platform
    if (platform === 'win32') {
      const { code } = await execFileNoThrow('explorer', [path])
      return code === 0
    }
    const command = platform === 'darwin' ? 'open' : 'xdg-open'
    const { code } = await execFileNoThrow(command, [path])
    return code === 0
  } catch (_) {
    return false
  }
}

/**
 * openBrowser — 在浏览器中打开 URL / Open a URL in the default browser
 *
 * @param url - 要打开的 URL / URL to open
 * @returns true if successful, false otherwise
 *
 * 浏览器选择 / Browser selection:
 * - Respects BROWSER environment variable if set
 * - Falls back to platform default: `open` (macOS), `xdg-open` (Linux)
 * - Windows: Uses `rundll32 url,OpenURL` or BROWSER env var
 *
 * 安全验证 / Security:
 * - Only http:// and https:// URLs are allowed
 * - Invalid protocols throw an error
 */
export async function openBrowser(url: string): Promise<boolean> {
  try {
    // Parse and validate the URL
    validateUrl(url)

    const browserEnv = process.env.BROWSER
    const platform = process.platform

    if (platform === 'win32') {
      if (browserEnv) {
        // browsers require shell, else they will treat this as a file:/// handle
        const { code } = await execFileNoThrow(browserEnv, [`"${url}"`])
        return code === 0
      }
      const { code } = await execFileNoThrow(
        'rundll32',
        ['url,OpenURL', url],
        {},
      )
      return code === 0
    } else {
      const command =
        browserEnv || (platform === 'darwin' ? 'open' : 'xdg-open')
      const { code } = await execFileNoThrow(command, [url])
      return code === 0
    }
  } catch (_) {
    return false
  }
}
