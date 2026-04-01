/**
 * @fileoverview oauth/crypto.ts — OAuth cryptographic utilities
 *
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0 authorization.
 * Provides code verifier and challenge generation per RFC 7636.
 *
 * OAuth 2.0 PKCE规范的加密工具,提供代码验证器和挑战生成。
 */

import { createHash, randomBytes } from 'crypto'

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32))
}

export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256')
  hash.update(verifier)
  return base64URLEncode(hash.digest())
}

export function generateState(): string {
  return base64URLEncode(randomBytes(32))
}
