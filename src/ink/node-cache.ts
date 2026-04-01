import type { DOMElement } from './dom.js'
import type { Rectangle } from './layout/geometry.js'

/**
 * Node Cache / 节点缓存
 *
 * Cached layout bounds for each rendered node (used for blit + clearing).
 * 每个渲染节点的缓存布局边界（用于 blit + 清除）。
 *
 * `top` is the yoga-local getComputedTop() — stored so ScrollBox viewport
 * culling can skip yoga reads for clean children whose position hasn't
 * shifted (O(dirty) instead of O(mounted) first-pass).
 * `top` 是 yoga 本地的 getComputedTop()——存储它是为了让 ScrollBox 视口
 * 剔除可以跳过位置未移动的干净子节点的 yoga 读取
 * （O(dirty) 而非 O(mounted) 首次遍历）。
 */
export type CachedLayout = {
  x: number
  y: number
  width: number
  height: number
  top?: number
}

export const nodeCache = new WeakMap<DOMElement, CachedLayout>()

/** Rects of removed children that need clearing on next render */
export const pendingClears = new WeakMap<DOMElement, Rectangle[]>()

/**
 * Set when a pendingClear is added for an absolute-positioned node.
 * Signals renderer to disable blit for the next frame: the removed node
 * may have painted over non-siblings (e.g. an overlay over a ScrollBox
 * earlier in tree order), so their blits from prevScreen would restore
 * the overlay's pixels. Normal-flow removals are already handled by
 * hasRemovedChild at the parent level; only absolute positioning paints
 * cross-subtree. Reset at the start of each render.
 */
let absoluteNodeRemoved = false

export function addPendingClear(
  parent: DOMElement,
  rect: Rectangle,
  isAbsolute: boolean,
): void {
  const existing = pendingClears.get(parent)
  if (existing) {
    existing.push(rect)
  } else {
    pendingClears.set(parent, [rect])
  }
  if (isAbsolute) {
    absoluteNodeRemoved = true
  }
}

export function consumeAbsoluteRemovedFlag(): boolean {
  const had = absoluteNodeRemoved
  absoluteNodeRemoved = false
  return had
}
