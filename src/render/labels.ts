/**
 * Body name labels: HTML overlay divs in #overlay, positioned with `transform: translate3d`
 * only — never top/left, which trigger layout. See docs/ENGINE_SPEC.md §2/§11. Keeps text crisp
 * at any DPR, selectable, and in the accessibility tree, unlike ctx.fillText.
 *
 * Collision thinning: labels are placed in priority order (caller decides priority — e.g. stars
 * over planets, larger radius over smaller); a label that would overlap an already-placed,
 * higher-priority label is hidden rather than drawn overlapping.
 */

import type { Camera } from '../engine/camera.ts';

export interface LabelTarget {
  id: string;
  name: string;
  wx: number;
  wy: number;
  priority: number; // higher wins collisions
}

interface LabelEntry {
  el: HTMLDivElement;
  width: number;
  height: number;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const LABEL_GAP_PX = 6; // vertical gap between a body's screen position and its label

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

export interface LabelLayer {
  update(camera: Camera, targets: LabelTarget[]): void;
  destroy(): void;
}

export function createLabelLayer(container: HTMLElement, onClick?: (id: string) => void): LabelLayer {
  const entries = new Map<string, LabelEntry>();

  function ensure(target: LabelTarget): LabelEntry {
    const existing = entries.get(target.id);
    if (existing) return existing;

    const el = document.createElement('div');
    el.className = 'body-label';
    el.textContent = target.name;
    // The label has its own CSS cursor: pointer (main.css), so it needs its own click handler —
    // clicking it doesn't reach the canvas underneath (`#overlay` sits above `#scene`).
    if (onClick) el.addEventListener('click', () => onClick(target.id));
    container.appendChild(el);

    // Measured once at creation time (text never changes after) so per-frame updates only
    // ever touch `transform`.
    const rect = el.getBoundingClientRect();
    const entry: LabelEntry = { el, width: rect.width, height: rect.height };
    entries.set(target.id, entry);
    return entry;
  }

  function update(camera: Camera, targets: LabelTarget[]): void {
    const sorted = [...targets].sort((a, b) => b.priority - a.priority);
    const placed: Box[] = [];
    const seen = new Set<string>();

    for (const target of sorted) {
      seen.add(target.id);
      const entry = ensure(target);
      const { sx, sy } = camera.worldToScreen(target.wx, target.wy);

      const box: Box = {
        x0: sx - entry.width / 2,
        y0: sy + LABEL_GAP_PX,
        x1: sx + entry.width / 2,
        y1: sy + LABEL_GAP_PX + entry.height,
      };

      const offscreen = box.x1 < 0 || box.x0 > camera.vw || box.y1 < 0 || box.y0 > camera.vh;
      const collides = !offscreen && placed.some((p) => overlaps(box, p));

      if (offscreen || collides) {
        entry.el.style.display = 'none';
        continue;
      }

      placed.push(box);
      entry.el.style.display = '';
      entry.el.style.transform = `translate3d(${box.x0}px, ${box.y0}px, 0)`;
    }

    for (const [id, entry] of entries) {
      if (!seen.has(id)) {
        entry.el.remove();
        entries.delete(id);
      }
    }
  }

  function destroy(): void {
    for (const entry of entries.values()) entry.el.remove();
    entries.clear();
  }

  return { update, destroy };
}
