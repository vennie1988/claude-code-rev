/**
 * Ink Instance Registry / Ink 实例注册表
 *
 * Store all instances of Ink to ensure that consecutive render() calls
 * use the same instance of Ink and don't create a new one.
 * 存储所有 Ink 实例以确保连续的 render() 调用使用相同的 Ink 实例，
 * 而不会创建新实例。
 *
 * This map has to be stored in a separate file, because render.js creates instances,
 * but instance.js should delete itself from the map on unmount.
 * 此映射必须存储在单独的文件中，因为 render.js 创建实例，
 * 但 instance.js 应该在卸载时从映射中删除自身。
 */

import type Ink from './ink.js'

const instances = new Map<NodeJS.WriteStream, Ink>()
export default instances
