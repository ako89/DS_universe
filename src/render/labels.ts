/**
 * Body name labels: HTML overlay divs in #overlay, positioned with `transform: translate3d`
 * only — never top/left, which trigger layout. See docs/ENGINE_SPEC.md §2/§11. Keeps text crisp
 * at any DPR, selectable, and in the accessibility tree, unlike ctx.fillText.
 *
 * Collision thinning: labels are placed in priority order (caller decides priority — e.g. stars
 * over planets, larger radius over smaller); a label that would overlap an already-placed,
 * higher-priority label is hidden rather than drawn overlapping. The currently keyboard-focused
 * label (if any) is exempted and always placed first: `display: none` on a focused element blurs
 * it (browsers move focus to `<body>` when its target disappears), so without this exemption,
 * simply sitting on a focused body could silently lose focus the moment some unrelated,
 * higher-priority label's orbit happened to drift across it that frame — found empirically while
 * testing keyboard navigation, not something a user would have any reason to expect.
 *
 * Phase 5: each label is a real keyboard control (`tabindex`, `role="button"`, Enter/Space to
 * activate), not just a click target — this is what lets native Tab order reach every body
 * without engine/input.ts simulating focus on the canvas. `tabIndex` is caller-supplied per
 * target (main.ts uses engine/scene.ts's `bodyTabOrder`, since "orbital order" has nothing to do
 * with this module's own collision-priority sort) and applied once, at creation. `onFocusChange`
 * fires on real DOM focus/blur so main.ts can drive the same tooltip + on-canvas glow that mouse
 * hover does — see main.ts and render/draw.ts's `Highlight`.
 */

import type { Camera } from '../engine/camera.ts';

export interface LabelTarget {
  id: string;
  name: string;
  wx: number;
  wy: number;
  priority: number; // higher wins collisions
  tabIndex: number; // 1-based Tab order; see engine/scene.ts's bodyTabOrder
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

export interface LabelHandlers {
  onActivate(id: string): void; // click, or Enter/Space while focused, the *first* time
  /** Real DOM focus/blur, mirroring the mouse-hover signal — `anchor` is the label's own
   *  position, for positioning a tooltip the same way a cursor position would. */
  onFocusChange(id: string | null, anchor?: DOMRect): void;
  /** True once `id`'s body is already the one entered in the app's view state. A body's label
   *  keeps real DOM focus for as long as the user is browsing its moons (they have no focusable
   *  element of their own — see engine/input.ts's Left/Right "moon cursor"), so a *second* Enter
   *  on the same still-focused label means "open the highlighted moon", not "re-enter this
   *  body" — that keydown is left to bubble to engine/input.ts's own Enter handling instead of
   *  being claimed here. */
  isEntered(id: string): boolean;
}

export interface LabelLayer {
  update(camera: Camera, targets: LabelTarget[]): void;
  destroy(): void;
}

export function createLabelLayer(container: HTMLElement, handlers: LabelHandlers): LabelLayer {
  const entries = new Map<string, LabelEntry>();
  let focusedId: string | null = null;

  function ensure(target: LabelTarget): LabelEntry {
    const existing = entries.get(target.id);
    if (existing) return existing;

    const el = document.createElement('div');
    el.className = 'body-label';
    el.textContent = target.name;
    el.setAttribute('role', 'button');
    el.tabIndex = target.tabIndex;

    // The label has its own CSS cursor: pointer (main.css), so it needs its own click handler —
    // clicking it doesn't reach the canvas underneath (`#overlay` sits above `#scene`).
    el.addEventListener('click', () => handlers.onActivate(target.id));
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Space's default is page scroll; native <button> suppresses it too
      if (handlers.isEntered(target.id)) return; // let it bubble — see isEntered's doc comment
      // Otherwise stop it here: engine/input.ts's own Enter handling reads *mouse*-hover state,
      // which can point at a different body than whatever the keyboard has actually focused —
      // this label already knows unambiguously which body a first Enter means.
      e.stopPropagation();
      handlers.onActivate(target.id);
    });
    el.addEventListener('focus', () => {
      focusedId = target.id;
      handlers.onFocusChange(target.id, el.getBoundingClientRect());
    });
    el.addEventListener('blur', () => {
      if (focusedId === target.id) focusedId = null;
      handlers.onFocusChange(null);
    });

    container.appendChild(el);

    // Measured once at creation time (text never changes after) so per-frame updates only
    // ever touch `transform`.
    const rect = el.getBoundingClientRect();
    const entry: LabelEntry = { el, width: rect.width, height: rect.height };
    entries.set(target.id, entry);
    return entry;
  }

  function update(camera: Camera, targets: LabelTarget[]): void {
    const sorted = [...targets].sort((a, b) => {
      if (a.id === focusedId) return -1;
      if (b.id === focusedId) return 1;
      return b.priority - a.priority;
    });
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

      // The focused label is exempt from both checks, not just collision: worldToScreen can put
      // it transiently outside the viewport mid-flight (e.g. right after Enter starts flying the
      // camera to it — zoom and position don't animate in perfect lockstep, so a real, if brief,
      // offscreen frame is possible before it lands centered). `display: none` would blur it to
      // `<body>`, and unlike a hover state, focus does not come back on its own once the flight
      // finishes and it's on-screen again — the user would just be silently dropped out of
      // keyboard navigation. #overlay's own `overflow: hidden` (main.css) already clips an
      // off-bounds position with no visible seam, so simply not hiding it costs nothing.
      const offscreen = box.x1 < 0 || box.x0 > camera.vw || box.y1 < 0 || box.y0 > camera.vh;
      const collides = !offscreen && placed.some((p) => overlaps(box, p));

      if (target.id !== focusedId && (offscreen || collides)) {
        entry.el.style.display = 'none';
        continue;
      }

      if (!offscreen) placed.push(box);
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
