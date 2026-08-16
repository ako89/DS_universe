/**
 * User input: drag-pan, cursor-anchored wheel zoom, touch (drag + pinch), and the keyboard map
 * from docs/ENGINE_SPEC.md §3. This module only translates raw events into camera moves and
 * handler calls — it holds no view state of its own. `?`/`A`/`/` open UI that doesn't exist
 * until Phase 2/4; callers simply don't pass those handlers yet.
 *
 * `←/→` (previous/next sibling moon) is not wired yet: it needs a "currently selected moon",
 * and moons have no stable id until Phase 2/3 gives them one (see engine/picking.ts's file
 * comment for why). Wire it once that exists rather than working around it here.
 */

import type { Camera } from './camera.ts';
import type { SceneBody } from './scene.ts';
import { hitTest } from './picking.ts';
import { ZOOM_STEP } from './constants.ts';

export interface InputHandlers {
  onSelectBody?(bodyId: string): void;
  onBack?(): void;
  onReset?(): void;
  onToggleSearch?(): void;
  onToggleAdvisor?(): void;
  onToggleHelp?(): void;
  onToggleDevOverlay?(): void;
  onHover?(bodyId: string | null): void;
}

const CLICK_DRAG_THRESHOLD_PX = 4;

function canvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

/** Bodies in increasing distance from their host star — a stable, deterministic order for
 *  Tab-cycling regardless of screen position. Stars and the belt aren't Tab targets. */
function orbitalOrder(bodies: SceneBody[]): SceneBody[] {
  return bodies
    .filter((b) => b.type === 'planet')
    .slice()
    .sort((a, b) => a.orbitRadius - b.orbitRadius);
}

export function attachInput(canvas: HTMLCanvasElement, camera: Camera, bodies: SceneBody[], handlers: InputHandlers): () => void {
  let dragging = false;
  let dragMoved = false;
  let lastX = 0;
  let lastY = 0;
  let hoveredId: string | null = null;

  function setHovered(id: string | null): void {
    if (id === hoveredId) return;
    hoveredId = id;
    canvas.classList.toggle('is-over-body', id !== null);
    handlers.onHover?.(id);
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
    setHovered(hitTest(bodies, camera, p.x, p.y)?.bodyId ?? null);
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    canvas.releasePointerCapture(e.pointerId);

    if (!dragMoved) {
      const p = canvasPoint(canvas, e.clientX, e.clientY);
      const hit = hitTest(bodies, camera, p.x, p.y);
      if (hit) handlers.onSelectBody?.(hit.bodyId);
    }
  }

  function onDoubleClick(e: MouseEvent): void {
    const p = canvasPoint(canvas, e.clientX, e.clientY);
    if (!hitTest(bodies, camera, p.x, p.y)) handlers.onReset?.();
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
      case 'Tab': {
        const order = orbitalOrder(bodies);
        if (order.length === 0) break;
        e.preventDefault();
        const currentIndex = hoveredId ? order.findIndex((b) => b.id === hoveredId) : -1;
        const nextIndex = e.shiftKey ? (currentIndex - 1 + order.length) % order.length : (currentIndex + 1) % order.length;
        const next = order[nextIndex];
        if (next) setHovered(next.id);
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
