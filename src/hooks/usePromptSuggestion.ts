/**
 * @fileoverview usePromptSuggestion.ts — Prompt suggestion tracking hook
 * 提示建议跟踪hook：管理提示建议的显示/接受/忽略并记录遥测。
 * Manages prompt suggestion display/accept/ignore and logs telemetry.
 *
 * @design
 * - 跟踪建议的显示、接受和忽略事件
 * - 记录首次击键时间、接受方法（Tab/Enter）、接受速度等遥测
 * - 提供markShown/markAccepted/logOutcomeAtSubmission接口
 *
 * @design Tracks suggestion shown/accepted/ignored events
 * @design Logs telemetry: first keystroke time, accept method (Tab/Enter), accept speed
 * @design Provides markShown/markAccepted/logOutcomeAtSubmission interface
 */
import { useCallback, useRef } from 'react'
import { useTerminalFocus } from '../ink/hooks/use-terminal-focus.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
import { abortSpeculation } from '../services/PromptSuggestion/speculation.js'
import { useAppState, useSetAppState } from '../state/AppState.js'

type Props = {
  inputValue: string
  isAssistantResponding: boolean
}

export function usePromptSuggestion({
  inputValue,
  isAssistantResponding,
}: Props): {
  suggestion: string | null
  markAccepted: () => void
  markShown: () => void
  logOutcomeAtSubmission: (
    finalInput: string,
    opts?: { skipReset: boolean },
  ) => void
} {
  const promptSuggestion = useAppState(s => s.promptSuggestion)
  const setAppState = useSetAppState()
  const isTerminalFocused = useTerminalFocus()
  const {
    text: suggestionText,
    promptId,
    shownAt,
    acceptedAt,
    generationRequestId,
  } = promptSuggestion

  const suggestion =
    isAssistantResponding || inputValue.length > 0 ? null : suggestionText

  const isValidSuggestion = suggestionText && shownAt > 0

  // Track engagement depth for telemetry
  const firstKeystrokeAt = useRef<number>(0)
  const wasFocusedWhenShown = useRef<boolean>(true)
  const prevShownAt = useRef<number>(0)

  // Capture focus state when a new suggestion appears (shownAt changes)
  if (shownAt > 0 && shownAt !== prevShownAt.current) {
    prevShownAt.current = shownAt
    wasFocusedWhenShown.current = isTerminalFocused
    firstKeystrokeAt.current = 0
  } else if (shownAt === 0) {
    prevShownAt.current = 0
  }

  // Record first keystroke while suggestion is visible
  if (
    inputValue.length > 0 &&
    firstKeystrokeAt.current === 0 &&
    isValidSuggestion
  ) {
    firstKeystrokeAt.current = Date.now()
  }

  const resetSuggestion = useCallback(() => {
    abortSpeculation(setAppState)

    setAppState(prev => ({
      ...prev,
      promptSuggestion: {
        text: null,
        promptId: null,
        shownAt: 0,
        acceptedAt: 0,
        generationRequestId: null,
      },
    }))
  }, [setAppState])

  const markAccepted = useCallback(() => {
    if (!isValidSuggestion) return
    setAppState(prev => ({
      ...prev,
      promptSuggestion: {
        ...prev.promptSuggestion,
        acceptedAt: Date.now(),
      },
    }))
  }, [isValidSuggestion, setAppState])

  const markShown = useCallback(() => {
    // Check shownAt inside setAppState callback to avoid depending on it
    // (depending on shownAt causes infinite loop when this callback is called)
    setAppState(prev => {
      // Only mark shown if not already shown and suggestion exists
      if (prev.promptSuggestion.shownAt !== 0 || !prev.promptSuggestion.text) {
        return prev
      }
      return {
        ...prev,
        promptSuggestion: {
          ...prev.promptSuggestion,
          shownAt: Date.now(),
        },
      }
    })
  }, [setAppState])

  const logOutcomeAtSubmission = useCallback(
    (finalInput: string, opts?: { skipReset: boolean }) => {
      if (!isValidSuggestion) return

      // Determine if accepted: either Tab was pressed (acceptedAt set) OR
      // final input matches suggestion (empty Enter case)
      const tabWasPressed = acceptedAt > shownAt
      const wasAccepted = tabWasPressed || finalInput === suggestionText
      const timeMs = wasAccepted ? acceptedAt || Date.now() : Date.now()

      logEvent('tengu_prompt_suggestion', {
        source:
          'cli' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        outcome: (wasAccepted
          ? 'accepted'
          : 'ignored') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        prompt_id:
          promptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...(generationRequestId && {
          generationRequestId:
            generationRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(wasAccepted && {
          acceptMethod: (tabWasPressed
            ? 'tab'
            : 'enter') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(wasAccepted && {
          timeToAcceptMs: timeMs - shownAt,
        }),
        ...(!wasAccepted && {
          timeToIgnoreMs: timeMs - shownAt,
        }),
        ...(firstKeystrokeAt.current > 0 && {
          timeToFirstKeystrokeMs: firstKeystrokeAt.current - shownAt,
        }),
        wasFocusedWhenShown: wasFocusedWhenShown.current,
        similarity:
          Math.round(
            (finalInput.length / (suggestionText?.length || 1)) * 100,
          ) / 100,
        ...(process.env.USER_TYPE === 'ant' && {
          suggestion:
            suggestionText as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          userInput:
            finalInput as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
      })
      if (!opts?.skipReset) resetSuggestion()
    },
    [
      isValidSuggestion,
      acceptedAt,
      shownAt,
      suggestionText,
      promptId,
      generationRequestId,
      resetSuggestion,
    ],
  )

  return {
    suggestion,
    markAccepted,
    markShown,
    logOutcomeAtSubmission,
  }
}
