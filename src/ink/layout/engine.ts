/**
 * Layout Node Factory / 布局节点工厂
 *
 * Creates a new layout node for the Yoga flexbox engine.
 * 为主动布局引擎（Yoga flexbox）创建新的布局节点。
 */

import type { LayoutNode } from './node.js'
import { createYogaLayoutNode } from './yoga.js'

/**
 * Create a new layout node.
 * 创建一个新的布局节点。
 *
 * @returns A new LayoutNode instance / 新的 LayoutNode 实例
 */
export function createLayoutNode(): LayoutNode {
  return createYogaLayoutNode()
}
