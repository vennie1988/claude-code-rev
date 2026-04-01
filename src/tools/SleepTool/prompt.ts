/**
 * @fileoverview prompt.ts — SleepTool 常量定义
 * Defines constants for the Sleep tool.
 *
 * 常量说明：
 * - SLEEP_TOOL_NAME: 工具唯一标识名称
 * - DESCRIPTION: 工具描述
 * - SLEEP_TOOL_PROMPT: 工具提示词
 */

import { TICK_TAG } from '../../constants/xml.js'

export const SLEEP_TOOL_NAME = 'Sleep'

export const DESCRIPTION = 'Wait for a specified duration'

export const SLEEP_TOOL_PROMPT = `Wait for a specified duration. The user can interrupt the sleep at any time.

Use this when the user tells you to sleep or rest, when you have nothing to do, or when you're waiting for something.

You may receive <${TICK_TAG}> prompts — these are periodic check-ins. Look for useful work to do before sleeping.

You can call this concurrently with other tools — it won't interfere with them.

Prefer this over \`Bash(sleep ...)\` — it doesn't hold a shell process.

Each wake-up costs an API call, but the prompt cache expires after 5 minutes of inactivity — balance accordingly.`
