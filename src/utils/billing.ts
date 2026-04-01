/**
 * @fileoverview billing.ts — 计费访问权限判断 / Billing access permission utilities
 *
 * Provides utilities for checking whether the current user has access to billing features.
 * Supports both Claude Code Console billing and Claude AI (Max/Pro) subscription billing.
 *
 * 访问判断 / Access determination:
 * - Console billing: Based on org/workspace roles (admin, billing) or subscription status
 * - Claude AI billing: Based on subscription type (Max/Pro have access, free tier does not)
 * - DISABLE_COST_WARNINGS env var can disable cost warnings entirely
 *
 * 设计决策 / Design decisions:
 * - Mock override support: setMockBillingAccessOverride() allows testing without real subscriptions
 * - Graceful degradation: Returns false for grandfathered users without OAuth roles
 * - Separation of concerns: Console billing vs AI billing checked independently
 *
 * @see auth.ts — authentication and subscription type utilities
 */

import {
  getAnthropicApiKey,
  getAuthTokenSource,
  getSubscriptionType,
  isClaudeAISubscriber,
} from './auth.js'
import { getGlobalConfig } from './config.js'
import { isEnvTruthy } from './envUtils.js'

/**
 * hasConsoleBillingAccess — Check if user has access to Console billing features
 *
 * @returns true if user can view/manage billing in Claude Code Console
 *
 * Console 用户计费访问权限检查 / Console billing access check:
 * - Returns false if DISABLE_COST_WARNINGS is set
 * - Returns false for Claude AI subscribers (they use their own billing)
 * - Returns false for unauthenticated users (no token and no API key)
 * - Returns false for grandfathered users without org/workspace roles
 * - Returns true for admin or billing roles at org or workspace level
 */
export function hasConsoleBillingAccess(): boolean {
  // Check if cost reporting is disabled via environment variable
  if (isEnvTruthy(process.env.DISABLE_COST_WARNINGS)) {
    return false
  }

  const isSubscriber = isClaudeAISubscriber()

  // This might be wrong if user is signed into Max but also using an API key, but
  // we already show a warning on launch in that case
  if (isSubscriber) return false

  // Check if user has any form of authentication
  const authSource = getAuthTokenSource()
  const hasApiKey = getAnthropicApiKey() !== null

  // If user has no authentication at all (logged out), don't show costs
  if (!authSource.hasToken && !hasApiKey) {
    return false
  }

  const config = getGlobalConfig()
  const orgRole = config.oauthAccount?.organizationRole
  const workspaceRole = config.oauthAccount?.workspaceRole

  if (!orgRole || !workspaceRole) {
    return false // hide cost for grandfathered users who have not re-authed since we've added roles
  }

  // Users have billing access if they are admins or billing roles at either workspace or organization level
  return (
    ['admin', 'billing'].includes(orgRole) ||
    ['workspace_admin', 'workspace_billing'].includes(workspaceRole)
  )
}

/**
 * Mock billing access override for /mock-limits testing
 * @internal
 */
// Mock billing access for /mock-limits testing (set by mockRateLimits.ts)
let mockBillingAccessOverride: boolean | null = null

/**
 * setMockBillingAccessOverride — Set mock billing access for testing
 *
 * @param value - Mock value to return, or null to use real billing check
 *
 * 测试用模拟计费访问 / Mock override for testing:
 * Allows /mock-limits testing to override billing access without real subscription.
 */
export function setMockBillingAccessOverride(value: boolean | null): void {
  mockBillingAccessOverride = value
}

/**
 * hasClaudeAiBillingAccess — Check if Claude AI subscriber has billing access
 *
 * @returns true if user has access to Claude AI Max/Pro billing features
 *
 * Claude AI 计费访问检查 / Claude AI billing access check:
 * - Returns mock override value if set (for /mock-limits testing)
 * - Returns false for non-subscribers
 * - Returns true for Max/Pro individual plans
 * - Returns true for Team/Enterprise users with admin/billing/owner roles
 */
export function hasClaudeAiBillingAccess(): boolean {
  // Check for mock billing access first (for /mock-limits testing)
  if (mockBillingAccessOverride !== null) {
    return mockBillingAccessOverride
  }

  if (!isClaudeAISubscriber()) {
    return false
  }

  const subscriptionType = getSubscriptionType()

  // Consumer plans (Max/Pro) - individual users always have billing access
  if (subscriptionType === 'max' || subscriptionType === 'pro') {
    return true
  }

  // Team/Enterprise - check for admin or billing roles
  const config = getGlobalConfig()
  const orgRole = config.oauthAccount?.organizationRole

  return (
    !!orgRole &&
    ['admin', 'billing', 'owner', 'primary_owner'].includes(orgRole)
  )
}
