/**
 * @fileoverview CtrlOToExpand.tsx — Expand hint component with keyboard shortcut display
 * CtrlOToExpand.tsx — 带键盘快捷键显示的展开提示组件
 *
 * @description
 * - Displays "(Ctrl+O to expand)" hint text
 * - Used for collapsible message content
 * - SubAgentProvider context prevents duplicate hints in sub-agent output
 * - 显示"(Ctrl+O to expand)"提示文本
 * - 用于可折叠的消息内容
 * - SubAgentProvider上下文防止子代理输出中重复提示
 */
import { c as _c } from "react/compiler-runtime";
import chalk from 'chalk';
import React, { useContext } from 'react';
import { Text } from '../ink.js';
import { getShortcutDisplay } from '../keybindings/shortcutFormat.js';
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { InVirtualListContext } from './messageActions.js';

/**
 * Context to track if we're inside a sub agent
 * Similar to MessageResponseContext, this helps us avoid showing
 * too many "(ctrl+o to expand)" hints in sub agent output
 * 上下文来跟踪我们是否在子代理内
 * 类似于MessageResponseContext，这帮助我们避免在子代理输出中显示
 * 太多"(ctrl+o to expand)"提示
 */
const SubAgentContext = React.createContext(false);
/**
 * SubAgentProvider — Context provider for sub-agent output
 * SubAgentProvider — 子代理输出的上下文提供者
 *
 * @description
 * - Sets SubAgentContext to true for all children
 * - Prevents duplicate expand hints in nested agent output
 * - 为所有子元素设置SubAgentContext为true
 * - 防止嵌套代理输出中重复的展开提示
 */
export function SubAgentProvider(t0) {
  const $ = _c(2);
  const {
    children
  } = t0;
  let t1;
  if ($[0] !== children) {
    t1 = <SubAgentContext.Provider value={true}>{children}</SubAgentContext.Provider>;
    $[0] = children;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
/**
 * CtrlOToExpand — Renders "(Ctrl+O to expand)" hint text
 * CtrlOToExpand — 渲染"(Ctrl+O to expand)"提示文本
 *
 * @description
 * - Shows expand hint when not in sub-agent or virtual list context
 * - Uses user-configured shortcut if available
 * - Returns null when hint should be suppressed
 * - 当不在子代理或虚拟列表上下文时显示展开提示
 * - 如果可用，使用用户配置的快捷键
 * - 当应该抑制提示时返回null
 *
 * @returns Text with keyboard shortcut hint or null / 带键盘快捷键提示的文本或null
 */
export function CtrlOToExpand() {
  const $ = _c(2);
  const isInSubAgent = useContext(SubAgentContext);
  const inVirtualList = useContext(InVirtualListContext);
  const expandShortcut = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  if (isInSubAgent || inVirtualList) {
    return null;
  }
  let t0;
  if ($[0] !== expandShortcut) {
    t0 = <Text dimColor={true}><KeyboardShortcutHint shortcut={expandShortcut} action="expand" parens={true} /></Text>;
    $[0] = expandShortcut;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
/**
 * ctrlOToExpand — Returns plain text expand hint string
 * ctrlOToExpand — 返回纯文本展开提示字符串
 *
 * @description
 * - Returns chalk-dimmed "(Ctrl+O to expand)" string
 * - Used for plain text output (not React components)
 * - 返回chalk-dimmed的"(Ctrl+O to expand)"字符串
 * - 用于纯文本输出（不是React组件）
 *
 * @returns Dimmed expand hint string / 变暗的展开提示字符串
 */
export function ctrlOToExpand(): string {
  const shortcut = getShortcutDisplay('app:toggleTranscript', 'Global', 'ctrl+o');
  return chalk.dim(`(${shortcut} to expand)`);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlJlYWN0IiwidXNlQ29udGV4dCIsIlRleHQiLCJnZXRTaG9ydGN1dERpc3BsYXkiLCJ1c2VTaG9ydGN1dERpc3BsYXkiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIkluVmlydHVhbExpc3RDb250ZXh0IiwiU3ViQWdlbnRDb250ZXh0IiwiY3JlYXRlQ29udGV4dCIsIlN1YkFnZW50UHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsImNoaWxkcmVuIiwidDEiLCJDdHJsT1RvRXhwYW5kIiwiaXNJblN1YkFnZW50IiwiaW5WaXJ0dWFsTGlzdCIsImV4cGFuZFNob3J0Y3V0IiwiY3RybE9Ub0V4cGFuZCIsInNob3J0Y3V0IiwiZGltIl0sInNvdXJjZXMiOlsiQ3RybE9Ub0V4cGFuZC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBnZXRTaG9ydGN1dERpc3BsYXkgfSBmcm9tICcuLi9rZXliaW5kaW5ncy9zaG9ydGN1dEZvcm1hdC5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgSW5WaXJ0dWFsTGlzdENvbnRleHQgfSBmcm9tICcuL21lc3NhZ2VBY3Rpb25zLmpzJ1xuXG4vLyBDb250ZXh0IHRvIHRyYWNrIGlmIHdlJ3JlIGluc2lkZSBhIHN1YiBhZ2VudFxuLy8gU2ltaWxhciB0byBNZXNzYWdlUmVzcG9uc2VDb250ZXh0LCB0aGlzIGhlbHBzIHVzIGF2b2lkIHNob3dpbmdcbi8vIHRvbyBtYW55IFwiKGN0cmwrbyB0byBleHBhbmQpXCIgaGludHMgaW4gc3ViIGFnZW50IG91dHB1dFxuY29uc3QgU3ViQWdlbnRDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dChmYWxzZSlcblxuZXhwb3J0IGZ1bmN0aW9uIFN1YkFnZW50UHJvdmlkZXIoe1xuICBjaGlsZHJlbixcbn06IHtcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPFN1YkFnZW50Q29udGV4dC5Qcm92aWRlciB2YWx1ZT17dHJ1ZX0+e2NoaWxkcmVufTwvU3ViQWdlbnRDb250ZXh0LlByb3ZpZGVyPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDdHJsT1RvRXhwYW5kKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlzSW5TdWJBZ2VudCA9IHVzZUNvbnRleHQoU3ViQWdlbnRDb250ZXh0KVxuICBjb25zdCBpblZpcnR1YWxMaXN0ID0gdXNlQ29udGV4dChJblZpcnR1YWxMaXN0Q29udGV4dClcbiAgY29uc3QgZXhwYW5kU2hvcnRjdXQgPSB1c2VTaG9ydGN1dERpc3BsYXkoXG4gICAgJ2FwcDp0b2dnbGVUcmFuc2NyaXB0JyxcbiAgICAnR2xvYmFsJyxcbiAgICAnY3RybCtvJyxcbiAgKVxuICBpZiAoaXNJblN1YkFnZW50IHx8IGluVmlydHVhbExpc3QpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiAoXG4gICAgPFRleHQgZGltQ29sb3I+XG4gICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9e2V4cGFuZFNob3J0Y3V0fSBhY3Rpb249XCJleHBhbmRcIiBwYXJlbnMgLz5cbiAgICA8L1RleHQ+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN0cmxPVG9FeHBhbmQoKTogc3RyaW5nIHtcbiAgY29uc3Qgc2hvcnRjdXQgPSBnZXRTaG9ydGN1dERpc3BsYXkoXG4gICAgJ2FwcDp0b2dnbGVUcmFuc2NyaXB0JyxcbiAgICAnR2xvYmFsJyxcbiAgICAnY3RybCtvJyxcbiAgKVxuICByZXR1cm4gY2hhbGsuZGltKGAoJHtzaG9ydGN1dH0gdG8gZXhwYW5kKWApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixPQUFPQyxLQUFLLElBQUlDLFVBQVUsUUFBUSxPQUFPO0FBQ3pDLFNBQVNDLElBQUksUUFBUSxXQUFXO0FBQ2hDLFNBQVNDLGtCQUFrQixRQUFRLGtDQUFrQztBQUNyRSxTQUFTQyxrQkFBa0IsUUFBUSxzQ0FBc0M7QUFDekUsU0FBU0Msb0JBQW9CLFFBQVEseUNBQXlDO0FBQzlFLFNBQVNDLG9CQUFvQixRQUFRLHFCQUFxQjs7QUFFMUQ7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsZUFBZSxHQUFHUCxLQUFLLENBQUNRLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFFbEQsT0FBTyxTQUFBQyxpQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUEwQjtJQUFBQztFQUFBLElBQUFILEVBSWhDO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUUsUUFBQTtJQUVHQyxFQUFBLDZCQUFpQyxLQUFJLENBQUosS0FBRyxDQUFDLENBQUdELFNBQU8sQ0FBRSwyQkFBMkI7SUFBQUYsQ0FBQSxNQUFBRSxRQUFBO0lBQUFGLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQUEsT0FBNUVHLEVBQTRFO0FBQUE7QUFJaEYsT0FBTyxTQUFBQyxjQUFBO0VBQUEsTUFBQUosQ0FBQSxHQUFBQyxFQUFBO0VBQ0wsTUFBQUksWUFBQSxHQUFxQmYsVUFBVSxDQUFDTSxlQUFlLENBQUM7RUFDaEQsTUFBQVUsYUFBQSxHQUFzQmhCLFVBQVUsQ0FBQ0ssb0JBQW9CLENBQUM7RUFDdEQsTUFBQVksY0FBQSxHQUF1QmQsa0JBQWtCLENBQ3ZDLHNCQUFzQixFQUN0QixRQUFRLEVBQ1IsUUFDRixDQUFDO0VBQ0QsSUFBSVksWUFBNkIsSUFBN0JDLGFBQTZCO0lBQUEsT0FDeEIsSUFBSTtFQUFBO0VBQ1osSUFBQVAsRUFBQTtFQUFBLElBQUFDLENBQUEsUUFBQU8sY0FBQTtJQUVDUixFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLG9CQUFvQixDQUFXUSxRQUFjLENBQWRBLGVBQWEsQ0FBQyxDQUFTLE1BQVEsQ0FBUixRQUFRLENBQUMsTUFBTSxDQUFOLEtBQUssQ0FBQyxHQUN4RSxFQUZDLElBQUksQ0FFRTtJQUFBUCxDQUFBLE1BQUFPLGNBQUE7SUFBQVAsQ0FBQSxNQUFBRCxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBQyxDQUFBO0VBQUE7RUFBQSxPQUZQRCxFQUVPO0FBQUE7QUFJWCxPQUFPLFNBQVNTLGFBQWFBLENBQUEsQ0FBRSxFQUFFLE1BQU0sQ0FBQztFQUN0QyxNQUFNQyxRQUFRLEdBQUdqQixrQkFBa0IsQ0FDakMsc0JBQXNCLEVBQ3RCLFFBQVEsRUFDUixRQUNGLENBQUM7RUFDRCxPQUFPSixLQUFLLENBQUNzQixHQUFHLENBQUMsSUFBSUQsUUFBUSxhQUFhLENBQUM7QUFDN0MiLCJpZ25vcmVMaXN0IjpbXX0=