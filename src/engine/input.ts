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
import { MIN_PICK_PX, ZOOM_STEP } from './constants.ts';

export interface InputHandlers {
  onSelectBody?(bodyId: string): void;
  onSelectEntry?(bodyId: string, entryId: string): void;
  onBack?(): void;
  onReset?(): void;
  onToggleSearch?(): void;
  onToggleAdvisor?(): void;
  onToggleHelp?(): void;
  onToggleDevOverlay?(): void;
  onHover?(bodyId: string | null, entryId: string | undefined, clientX: number, clientY: number, source?: 'mouse' | 'touch'): void;
  /** A click/tap on empty space, or a zoom-out gesture (wheel, pinch) — the two actions that
   *  release main.ts's orbital-motion hold once something has been highlighted. Deliberately
   *  separate from onHover: hovering off a target must NOT release the hold (see main.ts's
   *  motionHeld comment), only these two explicit "step away" gestures do. */
  onClearHighlight?(): void;
  /** Which body is currently focused ('body'/'detail' ViewState level), so hitTest knows whose
   *  moons are eligible to be hit. Absent/undefined in the 'universe' state, where no moon is
   *  visible yet. */
  getFocusBodyId?(): string | undefined;
  /** The entry currently open in the card ('detail' ViewState level only), so ←/→ knows which
   *  sibling moon to move to. */
  getFocusEntryId?(): string | undefined;
}

export const CLICK_DRAG_THRESHOLD_PX = 4;
// A finger is noisier than a mouse — a touch tap reliably jitters a few px, which the mouse
// threshold would misread as a drag and discard the tap. See onPointerDown/onPointerMove.
export const TOUCH_DRAG_THRESHOLD_PX = 10;
// How close a second tap needs to land to the still-previewed target to count as hitting it,
// when the strict hitTest misses (the target has moved, or a finger is a few px off). Looser
// than the drag threshold on purpose — this is forgiveness for a *second*, more hurried tap.
export const TOUCH_RETAP_RADIUS_PX = MIN_PICK_PX * 1.5;

/** Pure tap-vs-drag classifier, pulled out of onPointerMove's closure so it's unit-testable in
 *  isolation (see tests/input-gestures.test.ts) without driving the whole pointer-event/DOM
 *  soup. Cumulative distance from the pointerdown origin, not a per-frame delta — see
 *  onPointerMove's comment for why a per-frame check misclassifies both a slow drag and a
 *  stationary tap's jitter. */
export function isDrag(travelledPx: number, pointerType: string): boolean {
  const threshold = pointerType === 'touch' ? TOUCH_DRAG_THRESHOLD_PX : CLICK_DRAG_THRESHOLD_PX;
  return travelledPx > threshold;
}

/** Pure proximity check for the second-tap forgiveness fallback (onPointerUp's touch branch):
 *  is `screenDistPx` (a tap's on-screen distance from the still-previewed target) close enough
 *  to count as hitting it, when the strict pixel-perfect hitTest missed? */
export function withinRetapRadius(screenDistPx: number): boolean {
  return screenDistPx <= TOUCH_RETAP_RADIUS_PX;
}

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
  let startX = 0; // pointerdown origin — dragMoved is the *cumulative* distance from here, not
  let startY = 0; // a per-frame delta (see onPointerMove's file-header rationale)
  let lastX = 0;
  let lastY = 0;
  let hoveredId: string | null = null;
  let hoveredEntryId: string | null = null;
  let lastClientX = 0;
  let lastClientY = 0;
  // True for the duration of a two-finger touch gesture — see onTouchStart. Guards the
  // pointer-drag path so a pinch doesn't also register as a one-finger pan (§1a).
  let pinching = false;

  function setHovered(
    hit: { bodyId: string; entryId?: string } | null,
    clientX = lastClientX,
    clientY = lastClientY,
    source: 'mouse' | 'touch' = 'mouse',
  ): void {
    const id = hit?.bodyId ?? null;
    const entryId = hit?.entryId ?? null;
    if (id === hoveredId && entryId === hoveredEntryId) return;
    hoveredId = id;
    hoveredEntryId = entryId;
    canvas.classList.toggle('is-over-body', id !== null);
    handlers.onHover?.(id, entryId ?? undefined, clientX, clientY, source);
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    if (pinching) return; // a pinch owns this gesture — see onTouchStart
    dragging = true;
    dragMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    if (pinching) return;

    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      // Classify tap-vs-drag from the *cumulative* distance travelled since pointerdown, not
      // this frame's delta — a per-frame threshold both misses a slow drag delivered in small
      // steps and, worse, is tripped by ordinary finger jitter during a stationary tap, which is
      // why taps kept failing on touch (see docs/UX_PASS_PLAN.md Task 1b). Panning itself still
      // follows the per-frame delta below, unchanged.
      const travelled = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (isDrag(travelled, e.pointerType)) dragMoved = true;
      if (dragMoved) camera.panBy(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }

    const p = canvasPoint(canvas, e.clientX, e.clientY);
    setHovered(hitTest(bodies, camera, p.x, p.y, handlers.getFocusBodyId?.()), e.clientX, e.clientY);
  }

  function releasePointer(pointerId: number): void {
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  }

  function onPointerUp(e: PointerEvent): void {
    if (pinching) return;
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    releasePointer(e.pointerId);

    if (dragMoved) return;

    const p = canvasPoint(canvas, e.clientX, e.clientY);
    let hit = hitTest(bodies, camera, p.x, p.y, handlers.getFocusBodyId?.());

    // Touch has no hover, so the first tap on a new target shows its tooltip (ENGINE_SPEC §3's
    // "first tap shows tooltip, second enters") instead of selecting immediately; a second tap
    // on the same still-hovered target falls through to select below.
    if (e.pointerType === 'touch') {
      let alreadyHovered = hit !== null && hit.bodyId === hoveredId && (hit.entryId ?? null) === hoveredEntryId;

      // The strict hit missed, but something is already previewed (Task 6 freezes it in place
      // while previewed, so it hasn't moved) — a second tap landing a few px off its centre is
      // a mis-tap, not a change of mind. Re-resolve against the previewed target specifically,
      // within a looser radius, rather than whatever hitTest happened to find instead (or
      // nothing at all).
      if (!alreadyHovered && hoveredId) {
        const target = hoveredEntryId
          ? bodies.find((b) => b.id === hoveredId)?.moons.find((m) => m.id === hoveredEntryId)
          : bodies.find((b) => b.id === hoveredId);
        if (target) {
          const { wx, wy } = target;
          const { sx, sy } = camera.worldToScreen(wx, wy);
          const screenDist = Math.hypot(p.x - sx, p.y - sy);
          if (withinRetapRadius(screenDist)) {
            hit = hoveredEntryId ? { bodyId: hoveredId, entryId: hoveredEntryId } : { bodyId: hoveredId };
            alreadyHovered = true;
          }
        }
      }

      if (!alreadyHovered) {
        // A tap that resolves to nothing, or to a different target than the live preview, is
        // "stepping away" from whatever was previewed — release the motion hold (§Task 6) the
        // same way a mouse click on empty space does, then show whatever (if anything) this tap
        // actually landed on.
        handlers.onClearHighlight?.();
        setHovered(hit, e.clientX, e.clientY, 'touch');
        return;
      }
    } else if (hit === null) {
      // Mouse: a click that lands on nothing is "stepping away" — releases the motion hold.
      handlers.onClearHighlight?.();
    }

    if (hit?.entryId) {
      handlers.onSelectEntry?.(hit.bodyId, hit.entryId);
    } else if (hit) {
      handlers.onSelectBody?.(hit.bodyId);
    }
  }

  function onPointerCancel(e: PointerEvent): void {
    // iOS Safari reclaims a touch (e.g. mid-scroll-gesture arbitration) by firing this instead of
    // pointerup, leaving `dragging` stuck true and the canvas stuck in `.is-dragging` forever.
    if (!dragging) return;
    dragging = false;
    dragMoved = false;
    canvas.classList.remove('is-dragging');
    releasePointer(e.pointerId);
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
    // Zooming in is what someone does to read/click a thing they just hovered — it must not
    // release the hold. Only zooming out ("stepping back") does.
    if (factor < 1) handlers.onClearHighlight?.();
  }

  function touchDist(t0: Touch, t1: Touch): number {
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  }

  function touchMid(t0: Touch, t1: Touch): { x: number; y: number } {
    return canvasPoint(canvas, (t0.clientX + t1.clientX) / 2, (t0.clientY + t1.clientY) / 2);
  }

  // Single-finger pan is handled by the pointer-event path above (Pointer Events unify mouse and
  // one-finger touch) — these touch handlers now do pinch-zoom only. Handling single-finger pan
  // in *both* places used to run it at double speed and, worse, gave `onTouchMove`'s pan branch
  // no drag threshold of its own, so a stationary tap's finger jitter alone would pan the scene
  // before the tap could be classified (docs/UX_PASS_PLAN.md Task 1a).
  let pinchDist: number | null = null;

  function onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      const t0 = e.touches.item(0);
      const t1 = e.touches.item(1);
      pinchDist = t0 && t1 ? touchDist(t0, t1) : null;
      // A second finger landing — including mid-gesture, after the pointer-drag path already
      // started from the first — means this is a pinch, not a one-finger pan. Cancel whatever
      // the pointer path thinks is happening so the two input systems don't fight over the same
      // gesture (this is what stopped a pinch from also dragging).
      pinching = true;
      dragging = false;
      dragMoved = false;
      canvas.classList.remove('is-dragging');
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
      // Same in/out asymmetry as onWheel: pinching apart (zooming in) must not release the hold.
      if (dist < pinchDist) handlers.onClearHighlight?.();
      camera.zoomAt(mid.x, mid.y, dist / pinchDist);
      pinchDist = dist;
    }
  }

  function onTouchEnd(e: TouchEvent): void {
    if (e.touches.length < 2) {
      pinchDist = null;
      pinching = false;
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
  window.addEventListener('pointercancel', onPointerCancel);
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
    window.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('dblclick', onDoubleClick);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
  };
}
