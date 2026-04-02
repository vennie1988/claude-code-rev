/**
 * @fileoverview oauth/types.ts — OAuth type definitions
 *
 * Type definitions for OAuth authentication flow including tokens,
 * subscription types, and API response shapes.
 *
 * OAuth认证流程的类型定义,包括令牌、订阅类型和API响应结构。
 */

export type OAuthTokens = {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  [key: string]: unknown
}

export type SubscriptionType = string
export type BillingType = string
export type OAuthProfileResponse = Record<string, unknown>
export type ReferralEligibilityResponse = Record<string, unknown>
export type ReferralRedemptionsResponse = Record<string, unknown>
export type ReferrerRewardInfo = Record<string, unknown>
