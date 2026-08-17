/**
 * User input: drag-pan, cursor-anchored wheel zoom, touch (drag + pinch), and the keyboard map
 * from docs/ENGINE_SPEC.md §3. This module only translates raw events into camera moves and
 * handler calls — it holds no view state of its own; `getFocusBodyId`/`getFocusEntryId` let it
 * query the caller's current ViewState without owning it.
 *
 * Phase 5: Tab no longer cycles bodies itself — render/labels.ts makes each body label a real,
 * focusable `tabindex` element, so native browser Tab order does that job now (correctly, with a
 * real focus ring and screen-reader support, neither of which a synthetic canvas-hover simulation
 * could give a keyboard-only user). What's left here is Left/Right, extended to work as soon as a
 * body is focused rather than only once a card is already open — moons have no DOM element of
 * their own to carry native focus, so this synthetic "moon cursor" (reusing the same hover state
 * mouse movement drives) is still how a keyboard user reaches them.
 */

import type { Camera } from './camera.ts';
import type { SceneBody } from './scene.ts';
import { hitTest } from './picking.ts';
import { ZOOM_STEP } from './constants.ts';

export interface InputHandlers {
  onSelectBody?(bodyId: string): void;
  onSelectEntry?(bodyId: string, entryId: string): void;
  onBack?(): void;
  onReset?(): void;
  onToggleSearch?(): void;
  onToggleAdvisor?(): void;
  onToggleHelp?(): void;
  onToggleDevOverlay?(): void;
  onHover?(bodyId: string | null, entryId: string | undefined, clientX: number, clientY: number): void;
  /** Which body is currently focused ('body'/'detail' ViewState level), so hitTest knows whose
   *  moons are eligible to be hit. Absent/undefined in the 'universe' state, where no moon is
   *  visible yet. */
  getFocusBodyId?(): string | undefined;
  /** The entry currently open in the card ('detail' ViewState level only), so ←/→ knows which
   *  sibling moon to move to. */
  getFocusEntryId?(): string | undefined;
}

const CLICK_DRAG_THRESHOLD_PX = 4;

function canvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

/** Inverse of canvasPoint: a world position's *client* coordinates, for positioning a tooltip the
 *  same way a real cursor position would when the "cursor" is actually the Left/Right moon
 *  cursor below, not a pointer event. */
function worldToClient(canvas: HTMLCanvasElement, camera: Camera, wx: number, wy: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const { sx, sy } = camera.worldToScreen(wx, wy);
  return { x: rect.left + sx, y: rect.top + sy };
}

export function attachInput(canvas: HTMLCanvasElement, camera: Camera, bodies: SceneBody[], handlers: InputHandlers): () => void {
  let dragging = false;
  let dragMoved = false;
  let lastX = 0;
  let lastY = 0;
  let hoveredId: string | null = null;
  let hoveredEntryId: string | null = null;
  let lastClientX = 0;
  let lastClientY = 0;

  function setHovered(hit: { bodyId: string; entryId?: string } | null, clientX = lastClientX, clientY = lastClientY): void {
    const id = hit?.bodyId ?? null;
    const entryId = hit?.entryId ?? null;
    if (id === hoveredId && entryId === hoveredEntryId) return;
    hoveredId = id;
    hoveredEntryId = entryId;
    canvas.classList.toggle('is-over-body', id !== null);
    handlers.onHover?.(id, entryId ?? undefined, clientX, clientY);
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > CLICK_DRAG_THRESHOLD_PX || Math.abs(dy) > CLICK_DRAG_THRESHOLD_PX) dragMoved = true;
      if (dragMoved) camera.panBy(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }

    const p = canvasPoint(canvas, e.clientX, e.clientY);
    setHovered(hitTest(bodies, camera, p.x, p.y, handlers.getFocusBodyId?.()), e.clientX, e.clientY);
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    canvas.releasePointerCapture(e.pointerId);

    if (dragMoved) return;

    const p = canvasPoint(canvas, e.clientX, e.clientY);
    const hit = hitTest(bodies, camera, p.x, p.y, handlers.getFocusBodyId?.());

    // Touch has no hover, so the first tap on a new target shows its tooltip (ENGINE_SPEC §3's
    // "first tap shows tooltip, second enters") instead of selecting immediately; a second tap
    // on the same still-hovered target falls through to select below.
    if (e.pointerType === 'touch') {
      const alreadyHovered = hit !== null && hit.bodyId === hoveredId && (hit.entryId ?? null) === hoveredEntryId;
      if (!alreadyHovered) {
        setHovered(hit, e.clientX, e.clientY);
        return;
      }
    }

    if (hit?.entryId) {
      handlers.onSelectEntry?.(hit.bodyId, hit.entryId);
    } else if (hit) {
      handlers.onSelectBody?.(hit.bodyId);
    }
  }

  function onDoubleClick(e: MouseEvent): void {
    const p = canvasPoint(canvas, e.clientX, e.clientY);
    if (!hitTest(bodies, camera, p.x, p.y, handlers.getFocusBodyId?.())) handlers.onReset?.();
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const p = canvasPoint(canvas, e.clientX, e.clientY);
    // deltaY of ~100 is treated as one wheel notch, so ZOOM_STEP applies proportionally to
    // both discrete mouse wheels and continuous trackpad scrolling.
    const factor = Math.pow(ZOOM_STEP, -e.deltaY / 100);
    camera.zoomAt(p.x, p.y, factor);
  }

  function touchDist(t0: Touch, t1: Touch): number {
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  }

  function touchMid(t0: Touch, t1: Touch): { x: number; y: number } {
    return canvasPoint(canvas, (t0.clientX + t1.clientX) / 2, (t0.clientY + t1.clientY) / 2);
  }

  let pinchDist: number | null = null;
  let panTouchX: number | null = null;
  let panTouchY: number | null = null;

  function onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      const t0 = e.touches.item(0);
      const t1 = e.touches.item(1);
      pinchDist = t0 && t1 ? touchDist(t0, t1) : null;
      panTouchX = null;
      panTouchY = null;
    } else if (e.touches.length === 1) {
      const t0 = e.touches.item(0);
      panTouchX = t0 ? t0.clientX : null;
      panTouchY = t0 ? t0.clientY : null;
      pinchDist = null;
    }
  }

  function onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 2 && pinchDist !== null) {
      const t0 = e.touches.item(0);
      const t1 = e.touches.item(1);
      if (!t0 || !t1) return;
      e.preventDefault();
      const dist = touchDist(t0, t1);
      const mid = touchMid(t0, t1);
      camera.zoomAt(mid.x, mid.y, dist / pinchDist);
      pinchDist = dist;
    } else if (e.touches.length === 1 && panTouchX !== null && panTouchY !== null) {
      const t0 = e.touches.item(0);
      if (!t0) return;
      e.preventDefault();
      camera.panBy(t0.clientX - panTouchX, t0.clientY - panTouchY);
      panTouchX = t0.clientX;
      panTouchY = t0.clientY;
    }
  }

  function onTouchEnd(e: TouchEvent): void {
    if (e.touches.length < 2) pinchDist = null;
    if (e.touches.length === 0) {
      panTouchX = null;
      panTouchY = null;
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    const target = e.target;
    if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    switch (e.key) {
      case '/':
        e.preventDefault();
        handlers.onToggleSearch?.();
        break;
      case 'a':
      case 'A':
        // Prevent default: the advisor opens and focuses a <textarea> synchronously below, and
        // without this the same keypress's default text-insertion action fires after that focus
        // move and types a stray "a" into it (search's '/' has the same hazard; that case already
        // guards it).
        e.preventDefault();
        handlers.onToggleAdvisor?.();
        break;
      case '?':
        handlers.onToggleHelp?.();
        break;
      case 'Escape':
        handlers.onBack?.();
        break;
      case 'd':
      case 'D':
        handlers.onToggleDevOverlay?.();
        break;
      case 'Enter':
        if (hoveredEntryId && hoveredId) {
          handlers.onSelectEntry?.(hoveredId, hoveredEntryId);
        } else if (hoveredId) {
          handlers.onSelectBody?.(hoveredId);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        // Works as soon as a body is focused (moons visible), not only once a card is already
        // open: with nothing selected yet, this is how a keyboard-only user reaches the *first*
        // moon at all, since moons (unlike bodies) have no label of their own to natively Tab to.
        const bodyId = handlers.getFocusBodyId?.();
        if (!bodyId) break;
        const body = bodies.find((b) => b.id === bodyId);
        if (!body) break;
        const siblingIds = body.moons.map((m) => m.id).filter((id): id is string => id !== undefined);
        if (siblingIds.length === 0) break;
        e.preventDefault();

        const cardEntryId = handlers.getFocusEntryId?.();
        const currentEntryId = cardEntryId ?? hoveredEntryId ?? undefined;
        const currentIndex = currentEntryId ? siblingIds.indexOf(currentEntryId) : -1;
        const delta = e.key === 'ArrowLeft' ? -1 : 1;
        // Nothing current yet: land on the first moon regardless of direction, same as Tab
        // landing on the first item of a list rather than needing a lap around it first.
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + delta + siblingIds.length) % siblingIds.length;
        const nextId = siblingIds[nextIndex];
        if (!nextId || nextId === currentEntryId) break;

        if (cardEntryId) {
          // A card is already open: swap directly to the new moon's card (existing behavior).
          handlers.onSelectEntry?.(bodyId, nextId);
        } else {
          // No card open yet: just move the cursor (glow + tooltip), matching how hovering a
          // moon doesn't open its card either — Enter does that, same as a click would.
          const moon = body.moons.find((m) => m.id === nextId);
          if (!moon) break;
          const client = worldToClient(canvas, camera, moon.wx, moon.wy);
          setHovered({ bodyId, entryId: nextId }, client.x, client.y);
        }
        break;
      }
      default:
        break;
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('dblclick', onDoubleClick);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);

  return function detach(): void {
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('dblclick', onDoubleClick);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
  };
}
