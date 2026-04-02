/**
 * @fileoverview App.tsx — Root application component with error boundary
 * App.tsx — 带错误边界的根应用组件
 *
 * @description
 * - Top-level wrapper for interactive sessions
 * - Provides FPS metrics, stats context, and app state to the component tree
 * - 交互会话的顶级包装器
 * - 向组件树提供FPS指标、统计上下文和应用状态
 */
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../ink.js';
import { FpsMetricsProvider } from '../context/fpsMetrics.js';
import { StatsProvider, type StatsStore } from '../context/stats.js';
import { type AppState, AppStateProvider } from '../state/AppState.js';
import { onChangeAppState } from '../state/onChangeAppState.js';
import type { FpsMetrics } from '../utils/fpsTracker.js';

/** Props — App component properties / App 组件属性 */
type Props = {
  getFpsMetrics: () => FpsMetrics | undefined; // Function to get current FPS metrics / 获取当前FPS指标的函数
  stats?: StatsProvider;                       // Optional stats store / 可选的统计存储
  initialState: AppState;                       // Initial application state / 初始应用状态
  children: React.ReactNode;                    // Child components to render / 要渲染的子组件
};

/** BootstrapBoundary state / 启动边界状态 */
type BootstrapBoundaryState = {
  error: Error | null; // Captured error / 捕获的错误
};

/**
 * BootstrapBoundary — Error boundary that catches React render errors during bootstrap
 * BootstrapBoundary — 在启动期间捕获React渲染错误的错误边界
 *
 * @description
 * - Catches any render errors in child components
 * - Displays error message instead of crashing the entire app
 * - 捕获子组件中的任何渲染错误
 * - 显示错误信息而不是让整个应用崩溃
 */
class BootstrapBoundary extends React.Component<{
  children: React.ReactNode;
}, BootstrapBoundaryState> {
  override state: BootstrapBoundaryState = {
    error: null
  };
  // Capture error and store in state / 捕获错误并存储在状态中
  static override getDerivedStateFromError(error: Error): BootstrapBoundaryState {
    return {
      error
    };
  }
  // Log error to console / 将错误记录到控制台
  override componentDidCatch(error: Error): void {
    const message = error?.stack ?? error?.message ?? String(error);
    console.error(`[restored-app-bootstrap] ${message}`);
  }
  override render(): React.ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }
    return <Box flexDirection="column" paddingX={1}>
      <Text color="red">Failed to initialize restored app bootstrap.</Text>
      <Text dimColor>{this.state.error.message || String(this.state.error)}</Text>
    </Box>;
  }
}

/**
 * App — Top-level wrapper for interactive sessions
 * App — 交互会话的顶级包装器
 *
 * @description
 * - Wraps children with FpsMetricsProvider, StatsProvider, and AppStateProvider
 * - Provides FPS metrics, stats context, and app state to the component tree
 * - 使用 FpsMetricsProvider、StatsProvider 和 AppStateProvider 包装子组件
 * - 向组件树提供FPS指标、统计上下文和应用状态
 *
 * @returns React component tree with all providers / 返回带有所有提供商的React组件树
 */
export function App(t0) {
  const $ = _c(12);
  const {
    getFpsMetrics,
    stats,
    initialState,
    children
  } = t0;
  let t1;
  if ($[0] !== children || $[1] !== initialState) {
    t1 = <AppStateProvider initialState={initialState} onChangeAppState={onChangeAppState}>{children}</AppStateProvider>;
    $[0] = children;
    $[1] = initialState;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== stats || $[4] !== t1) {
    t2 = <StatsProvider store={stats}>{t1}</StatsProvider>;
    $[3] = stats;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== getFpsMetrics || $[7] !== t2) {
    t3 = <FpsMetricsProvider getFpsMetrics={getFpsMetrics}>{t2}</FpsMetricsProvider>;
    $[6] = getFpsMetrics;
    $[7] = t2;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  let t4;
  if ($[9] !== t3) {
    t4 = <BootstrapBoundary>{t3}</BootstrapBoundary>;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  $[11] = t4;
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkZwc01ldHJpY3NQcm92aWRlciIsIlN0YXRzUHJvdmlkZXIiLCJTdGF0c1N0b3JlIiwiQXBwU3RhdGUiLCJBcHBTdGF0ZVByb3ZpZGVyIiwib25DaGFuZ2VBcHBTdGF0ZSIsIkZwc01ldHJpY3MiLCJQcm9wcyIsImdldEZwc01ldHJpY3MiLCJzdGF0cyIsImluaXRpYWxTdGF0ZSIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwiQXBwIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiXSwic291cmNlcyI6WyJBcHAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEZwc01ldHJpY3NQcm92aWRlciB9IGZyb20gJy4uL2NvbnRleHQvZnBzTWV0cmljcy5qcydcbmltcG9ydCB7IFN0YXRzUHJvdmlkZXIsIHR5cGUgU3RhdHNTdG9yZSB9IGZyb20gJy4uL2NvbnRleHQvc3RhdHMuanMnXG5pbXBvcnQgeyB0eXBlIEFwcFN0YXRlLCBBcHBTdGF0ZVByb3ZpZGVyIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBvbkNoYW5nZUFwcFN0YXRlIH0gZnJvbSAnLi4vc3RhdGUvb25DaGFuZ2VBcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgRnBzTWV0cmljcyB9IGZyb20gJy4uL3V0aWxzL2Zwc1RyYWNrZXIuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGdldEZwc01ldHJpY3M6ICgpID0+IEZwc01ldHJpY3MgfCB1bmRlZmluZWRcbiAgc3RhdHM/OiBTdGF0c1N0b3JlXG4gIGluaXRpYWxTdGF0ZTogQXBwU3RhdGVcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufVxuXG4vKipcbiAqIFRvcC1sZXZlbCB3cmFwcGVyIGZvciBpbnRlcmFjdGl2ZSBzZXNzaW9ucy5cbiAqIFByb3ZpZGVzIEZQUyBtZXRyaWNzLCBzdGF0cyBjb250ZXh0LCBhbmQgYXBwIHN0YXRlIHRvIHRoZSBjb21wb25lbnQgdHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEFwcCh7XG4gIGdldEZwc01ldHJpY3MsXG4gIHN0YXRzLFxuICBpbml0aWFsU3RhdGUsXG4gIGNoaWxkcmVuLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxGcHNNZXRyaWNzUHJvdmlkZXIgZ2V0RnBzTWV0cmljcz17Z2V0RnBzTWV0cmljc30+XG4gICAgICA8U3RhdHNQcm92aWRlciBzdG9yZT17c3RhdHN9PlxuICAgICAgICA8QXBwU3RhdGVQcm92aWRlclxuICAgICAgICAgIGluaXRpYWxTdGF0ZT17aW5pdGlhbFN0YXRlfVxuICAgICAgICAgIG9uQ2hhbmdlQXBwU3RhdGU9e29uQ2hhbmdlQXBwU3RhdGV9XG4gICAgICAgID5cbiAgICAgICAgICB7Y2hpbGRyZW59XG4gICAgICAgIDwvQXBwU3RhdGVQcm92aWRlcj5cbiAgICAgIDwvU3RhdHNQcm92aWRlcj5cbiAgICA8L0Zwc01ldHJpY3NQcm92aWRlcj5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0Msa0JBQWtCLFFBQVEsMEJBQTBCO0FBQzdELFNBQVNDLGFBQWEsRUFBRSxLQUFLQyxVQUFVLFFBQVEscUJBQXFCO0FBQ3BFLFNBQVMsS0FBS0MsUUFBUSxFQUFFQyxnQkFBZ0IsUUFBUSxzQkFBc0I7QUFDdEUsU0FBU0MsZ0JBQWdCLFFBQVEsOEJBQThCO0FBQy9ELGNBQWNDLFVBQVUsUUFBUSx3QkFBd0I7QUFFeEQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLGFBQWEsRUFBRSxHQUFHLEdBQUdGLFVBQVUsR0FBRyxTQUFTO0VBQzNDRyxLQUFLLENBQUMsRUFBRVAsVUFBVTtFQUNsQlEsWUFBWSxFQUFFUCxRQUFRO0VBQ3RCUSxRQUFRLEVBQUVaLEtBQUssQ0FBQ2EsU0FBUztBQUMzQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxJQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWE7SUFBQVIsYUFBQTtJQUFBQyxLQUFBO0lBQUFDLFlBQUE7SUFBQUM7RUFBQSxJQUFBRyxFQUtaO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUosUUFBQSxJQUFBSSxDQUFBLFFBQUFMLFlBQUE7SUFJQU8sRUFBQSxJQUFDLGdCQUFnQixDQUNEUCxZQUFZLENBQVpBLGFBQVcsQ0FBQyxDQUNSTCxnQkFBZ0IsQ0FBaEJBLGlCQUFlLENBQUMsQ0FFakNNLFNBQU8sQ0FDVixFQUxDLGdCQUFnQixDQUtFO0lBQUFJLENBQUEsTUFBQUosUUFBQTtJQUFBSSxDQUFBLE1BQUFMLFlBQUE7SUFBQUssQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBTixLQUFBLElBQUFNLENBQUEsUUFBQUUsRUFBQTtJQU5yQkMsRUFBQSxJQUFDLGFBQWEsQ0FBUVQsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDekIsQ0FBQVEsRUFLa0IsQ0FDcEIsRUFQQyxhQUFhLENBT0U7SUFBQUYsQ0FBQSxNQUFBTixLQUFBO0lBQUFNLENBQUEsTUFBQUUsRUFBQTtJQUFBRixDQUFBLE1BQUFHLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFILENBQUE7RUFBQTtFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFQLGFBQUEsSUFBQU8sQ0FBQSxRQUFBRyxFQUFBO0lBUmxCQyxFQUFBLElBQUMsa0JBQWtCLENBQWdCWCxhQUFhLENBQWJBLGNBQVksQ0FBQyxDQUM5QyxDQUFBVSxFQU9lLENBQ2pCLEVBVEMsa0JBQWtCLENBU0U7SUFBQUgsQ0FBQSxNQUFBUCxhQUFBO0lBQUFPLENBQUEsTUFBQUcsRUFBQTtJQUFBSCxDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFBLE9BVHJCSSxFQVNxQjtBQUFBIiwiaWdub3JlTGlzdCI6W119
