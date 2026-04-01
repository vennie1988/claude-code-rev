/**
 * SentryErrorBoundary.tsx
 * Sentry 错误边界组件 - 捕获子组件渲染错误
 *
 * Sentry Error Boundary Component - Catches rendering errors from child components
 *
 * Usage:
 * - Wrap any component tree that may throw errors
 * - When an error is caught, renders null instead of crashing
 * - Designed to work with Sentry for error reporting
 *
 * 使用方式:
 * - 包装可能抛出错误的组件树
 * - 捕获错误时渲染 null 而非崩溃
 * - 与 Sentry 配合进行错误报告
 */
import * as React from 'react'

interface Props {
  /** 子组件 - 可能抛出错误的组件树 / Child components - component tree that may throw errors */
  children: React.ReactNode
}

interface State {
  /** 是否捕获到错误 / Whether an error has been caught */
  hasError: boolean
}

/**
 * SentryErrorBoundary - React 错误边界组件
 * SentryErrorBoundary - React Error Boundary Component
 *
 * Captures rendering errors from child components and displays a fallback UI.
 * When an error is caught, hasError is set to true and children are unmounted
 * to prevent cascading failures.
 *
 * 捕获子组件的渲染错误并显示备用 UI。
 * 当捕获到错误时，hasError 被设为 true，子组件被卸载以防止级联失败。
 */
export class SentryErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    // 初始化状态，无错误 / Initialize state with no error
    this.state = { hasError: false }
  }

  /**
   * getDerivedStateFromError - 静态生命周期方法
   * getDerivedStateFromError - Static lifecycle method
   *
   * Called when a child component throws an error.
   * Updates state to trigger error UI rendering.
   *
   * 当子组件抛出错误时调用。
   * 更新状态以触发错误 UI 渲染。
   */
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  /**
   * render - 渲染方法
   * render - Render method
   *
   * Returns children if no error, otherwise returns null.
   * When hasError is true, the component tree is unmounted to prevent
   * the error from propagating further.
   *
   * 如果没有错误则返回子组件，否则返回 null。
   * 当 hasError 为 true 时，卸载组件树以防止错误进一步传播。
   */
  render(): React.ReactNode {
    if (this.state.hasError) {
      // 发生错误时返回 null，避免崩溃显示 / Return null on error to prevent crash display
      return null
    }

    // 正常情况下渲染子组件 / Render children normally when no error
    return this.props.children
  }
}
