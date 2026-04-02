/**
 * @fileoverview caCerts.ts — CA 证书加载模块 / CA certificates loader for TLS connections
 *
 * Provides CA (Certificate Authority) certificate loading for HTTPS/TLS connections.
 * Since setting `ca` on an HTTPS agent replaces the default certificate store, we must always
 * include base CAs (either system or bundled Mozilla) when returning custom certificates.
 *
 * 设计决策 / Design decisions:
 * - Memoized for performance — call clearCACertsCache() to invalidate after env var changes
 * - Reads ONLY `process.env.NODE_EXTRA_CA_CERTS` — config-free to avoid circular dependencies
 * - `caCertsConfig.ts` populates the env var from settings.json at CLI init
 *
 * 行为 / Behavior:
 * - Neither NODE_EXTRA_CA_CERTS nor --use-system-ca/--use-openssl-ca set: undefined (runtime defaults)
 * - NODE_EXTRA_CA_CERTS only: bundled Mozilla CAs + extra cert file contents
 * - --use-system-ca or --use-openssl-ca only: system CAs
 * - --use-system-ca + NODE_EXTRA_CA_CERTS: system CAs + extra cert file contents
 *
 * @note Bun's node:tls module eagerly materializes ~150 Mozilla root certificates (~750KB heap)
 * on import. Most users hit the early return, so we defer this cost until custom CA handling
 * is actually needed.
 */

import memoize from 'lodash-es/memoize.js'
import { logForDebugging } from './debug.js'
import { hasNodeOption } from './envUtils.js'
import { getFsImplementation } from './fsOperations.js'
export const getCACertificates = memoize((): string[] | undefined => {
  const useSystemCA =
    hasNodeOption('--use-system-ca') || hasNodeOption('--use-openssl-ca')

  const extraCertsPath = process.env.NODE_EXTRA_CA_CERTS

  logForDebugging(
    `CA certs: useSystemCA=${useSystemCA}, extraCertsPath=${extraCertsPath}`,
  )

  // If neither is set, return undefined (use runtime defaults, no override)
  if (!useSystemCA && !extraCertsPath) {
    return undefined
  }

  // Deferred load: Bun's node:tls module eagerly materializes ~150 Mozilla
  // root certificates (~750KB heap) on import, even if tls.rootCertificates
  // is never accessed. Most users hit the early return above, so we only
  // pay this cost when custom CA handling is actually needed.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const tls = require('tls') as typeof import('tls')
  /* eslint-enable @typescript-eslint/no-require-imports */

  const certs: string[] = []

  if (useSystemCA) {
    // Load system CA store (Bun API)
    const getCACerts = (
      tls as typeof tls & { getCACertificates?: (type: string) => string[] }
    ).getCACertificates
    const systemCAs = getCACerts?.('system')
    if (systemCAs && systemCAs.length > 0) {
      certs.push(...systemCAs)
      logForDebugging(
        `CA certs: Loaded ${certs.length} system CA certificates (--use-system-ca)`,
      )
    } else if (!getCACerts && !extraCertsPath) {
      // Under Node.js where getCACertificates doesn't exist and no extra certs,
      // return undefined to let Node.js handle --use-system-ca natively.
      logForDebugging(
        'CA certs: --use-system-ca set but system CA API unavailable, deferring to runtime',
      )
      return undefined
    } else {
      // System CA API returned empty or unavailable; fall back to bundled root certs
      certs.push(...tls.rootCertificates)
      logForDebugging(
        `CA certs: Loaded ${certs.length} bundled root certificates as base (--use-system-ca fallback)`,
      )
    }
  } else {
    // Must include bundled Mozilla CAs as base since ca replaces defaults
    certs.push(...tls.rootCertificates)
    logForDebugging(
      `CA certs: Loaded ${certs.length} bundled root certificates as base`,
    )
  }

  // Append extra certs from file
  if (extraCertsPath) {
    try {
      const extraCert = getFsImplementation().readFileSync(extraCertsPath, {
        encoding: 'utf8',
      })
      certs.push(extraCert)
      logForDebugging(
        `CA certs: Appended extra certificates from NODE_EXTRA_CA_CERTS (${extraCertsPath})`,
      )
    } catch (error) {
      logForDebugging(
        `CA certs: Failed to read NODE_EXTRA_CA_CERTS file (${extraCertsPath}): ${error}`,
        { level: 'error' },
      )
    }
  }

  return certs.length > 0 ? certs : undefined
})

/**
 * clearCACertsCache — 清除 CA 证书缓存 / Clear the CA certificates memoization cache
 *
 * Call this when environment variables that affect CA certs may have changed,
 * such as after the trust dialog applies settings.json changes.
 *
 * @note This only clears the memoized result. The actual TLS certificate store
 * is cached by Bun/Node at process boot and cannot be invalidated at runtime.
 *
 * @see getCACerts() — the memoized function this clears
 */
export function clearCACertsCache(): void {
  getCACertificates.cache.clear?.()
  logForDebugging('Cleared CA certificates cache')
}
