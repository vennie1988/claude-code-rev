/**
 * @fileoverview FilePathLink - Renders file paths as clickable OSC 8 hyperlinks
 * @fileoverview FilePathLink - 将文件路径渲染为可点击的 OSC 8 超链接
 *
 * @remarks
 * This component converts a file path to a file:// URL and renders it as an OSC 8 hyperlink.
 * This enables proper clickability in terminals like iTerm, even when the path appears
 * inside parentheses or other text that would otherwise break path detection.
 *
 * 此组件将文件路径转换为 file:// URL 并将其渲染为 OSC 8 超链接。
 * 这使得在 iTerm 等终端中能够正确点击，即使路径出现在括号内
 * 或其他可能破坏路径检测的文本中。
 *
 * @param Props.filePath - The absolute file path to render as a link / 要渲染为链接的绝对文件路径
 * @param Props.children - Optional custom display text (defaults to filePath) / 可选的自定义显示文本（默认为 filePath）
 */
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { pathToFileURL } from 'url';
import Link from '../ink/components/Link.js';
type Props = {
  /** The absolute file path */
  filePath: string;
  /** Optional display text (defaults to filePath) */
  children?: React.ReactNode;
};

/**
 * Renders a file path as an OSC 8 hyperlink.
 * This helps terminals like iTerm correctly identify file paths
 * even when they appear inside parentheses or other text.
 */
export function FilePathLink(t0) {
  const $ = _c(5);
  const {
    filePath,
    children
  } = t0;
  let t1;
  if ($[0] !== filePath) {
    t1 = pathToFileURL(filePath);
    $[0] = filePath;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = children ?? filePath;
  let t3;
  if ($[2] !== t1.href || $[3] !== t2) {
    t3 = <Link url={t1.href}>{t2}</Link>;
    $[2] = t1.href;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInBhdGhUb0ZpbGVVUkwiLCJMaW5rIiwiUHJvcHMiLCJmaWxlUGF0aCIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwiRmlsZVBhdGhMaW5rIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiLCJocmVmIl0sInNvdXJjZXMiOlsiRmlsZVBhdGhMaW5rLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBwYXRoVG9GaWxlVVJMIH0gZnJvbSAndXJsJ1xuaW1wb3J0IExpbmsgZnJvbSAnLi4vaW5rL2NvbXBvbmVudHMvTGluay5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgLyoqIFRoZSBhYnNvbHV0ZSBmaWxlIHBhdGggKi9cbiAgZmlsZVBhdGg6IHN0cmluZ1xuICAvKiogT3B0aW9uYWwgZGlzcGxheSB0ZXh0IChkZWZhdWx0cyB0byBmaWxlUGF0aCkgKi9cbiAgY2hpbGRyZW4/OiBSZWFjdC5SZWFjdE5vZGVcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgZmlsZSBwYXRoIGFzIGFuIE9TQyA4IGh5cGVybGluay5cbiAqIFRoaXMgaGVscHMgdGVybWluYWxzIGxpa2UgaVRlcm0gY29ycmVjdGx5IGlkZW50aWZ5IGZpbGUgcGF0aHNcbiAqIGV2ZW4gd2hlbiB0aGV5IGFwcGVhciBpbnNpZGUgcGFyZW50aGVzZXMgb3Igb3RoZXIgdGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZpbGVQYXRoTGluayh7IGZpbGVQYXRoLCBjaGlsZHJlbiB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiA8TGluayB1cmw9e3BhdGhUb0ZpbGVVUkwoZmlsZVBhdGgpLmhyZWZ9PntjaGlsZHJlbiA/PyBmaWxlUGF0aH08L0xpbms+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxhQUFhLFFBQVEsS0FBSztBQUNuQyxPQUFPQyxJQUFJLE1BQU0sMkJBQTJCO0FBRTVDLEtBQUtDLEtBQUssR0FBRztFQUNYO0VBQ0FDLFFBQVEsRUFBRSxNQUFNO0VBQ2hCO0VBQ0FDLFFBQVEsQ0FBQyxFQUFFTCxLQUFLLENBQUNNLFNBQVM7QUFDNUIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxhQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXNCO0lBQUFOLFFBQUE7SUFBQUM7RUFBQSxJQUFBRyxFQUE2QjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFMLFFBQUE7SUFDdENPLEVBQUEsR0FBQVYsYUFBYSxDQUFDRyxRQUFRLENBQUM7SUFBQUssQ0FBQSxNQUFBTCxRQUFBO0lBQUFLLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQVEsTUFBQUcsRUFBQSxHQUFBUCxRQUFvQixJQUFwQkQsUUFBb0I7RUFBQSxJQUFBUyxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBRSxFQUFBLENBQUFHLElBQUEsSUFBQUwsQ0FBQSxRQUFBRyxFQUFBO0lBQTlEQyxFQUFBLElBQUMsSUFBSSxDQUFNLEdBQTRCLENBQTVCLENBQUFGLEVBQXVCLENBQUFHLElBQUksQ0FBQyxDQUFHLENBQUFGLEVBQW1CLENBQUUsRUFBOUQsSUFBSSxDQUFpRTtJQUFBSCxDQUFBLE1BQUFFLEVBQUEsQ0FBQUcsSUFBQTtJQUFBTCxDQUFBLE1BQUFHLEVBQUE7SUFBQUgsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxPQUF0RUksRUFBc0U7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==