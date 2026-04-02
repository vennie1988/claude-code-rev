/**
 * Max Width Calculator / 最大宽度计算器
 *
 * Returns the yoga node's content width (computed width minus padding and
 * border).
 * 返回 yoga 节点的内容宽度（计算宽度减去内边距和边框）。
 *
 * Warning: can return a value WIDER than the parent container. In a
 * column-direction flex parent, width is the cross axis — align-items:
 * stretch never shrinks children below their intrinsic size, so the text
 * node overflows (standard CSS behavior). Yoga measures leaf nodes in two
 * passes: the AtMost pass determines width, the Exactly pass determines
 * height. getComputedWidth() reflects the wider AtMost result while
 * getComputedHeight() reflects the narrower Exactly result. Callers that
 * use this for wrapping should clamp to actual available screen space so
 * the rendered line count stays consistent with the layout height.
 * 警告：可能返回比父容器更宽的值。在列方向的 flex 父容器中，
 * 宽度是交叉轴——align-items: stretch 永远不会将子元素缩小到其固有尺寸以下，
 * 因此文本节点会溢出（标准 CSS 行为）。Yoga 对叶节点进行两次测量：
 * AtMost 传递决定宽度，Exactly 传递决定高度。
 * getComputedWidth() 反映较宽的 AtMost 结果，而 getComputedHeight()
 * 反映较窄的 Exactly 结果。使用此方法进行换行的调用者应限制为
 * 实际可用的屏幕空间，以使渲染的行数与布局高度保持一致。
 */

import { LayoutEdge, type LayoutNode } from './layout/node.js'
const getMaxWidth = (yogaNode: LayoutNode): number => {
  return (
    yogaNode.getComputedWidth() -
    yogaNode.getComputedPadding(LayoutEdge.Left) -
    yogaNode.getComputedPadding(LayoutEdge.Right) -
    yogaNode.getComputedBorder(LayoutEdge.Left) -
    yogaNode.getComputedBorder(LayoutEdge.Right)
  )
}

export default getMaxWidth
