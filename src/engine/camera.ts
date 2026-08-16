/**
 * World <-> screen transforms and the fly-to tween. See docs/ENGINE_SPEC.md §8 — the transforms
 * and zoomAt are implemented exactly as specified there, not re-derived.
 */

import { CAM_TWEEN_MS, ZOOM_MAX, ZOOM_MIN } from './constants.ts';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Evaluates a CSS-style cubic-bezier(p1x, p1y, p2x, p2y) easing curve at progress `x` in
 *  [0, 1], via Newton-Raphson on the bezier's parametric `t`. Used so flyTo matches
 *  var(--ease-fly) rather than a JS approximation of it. */
function cubicBezierEase(p1x: number, p1y: number, p2x: number, p2y: number) {
  const bezier = (t: number, a: number, b: number): number => {
    const mt = 1 - t;
    return 3 * mt * mt * t * a + 3 * mt * t * t * b + t * t * t;
  };
  const bezierDerivative = (t: number, a: number, b: number): number => {
    const mt = 1 - t;
    return 3 * mt * mt * a + 6 * mt * t * (b - a) + 3 * t * t * (1 - b);
  };
  return function ease(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = bezier(t, p1x, p2x) - x;
      const d = bezierDerivative(t, p1x, p2x);
      if (Math.abs(d) < 1e-6) break;
      t = clamp(t - dx / d, 0, 1);
    }
    return bezier(t, p1y, p2y);
  };
}

/** var(--ease-fly): cubic-bezier(0.22, 1, 0.36, 1). */
const easeFly = cubicBezierEase(0.22, 1, 0.36, 1);

interface Tween {
  fromX: number;
  fromY: number;
  fromZoom: number;
  toX: number;
  toY: number;
  toZoom: number;
  elapsed: number;
  duration: number; // seconds
}

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  vw: number;
  vh: number;

  private tween: Tween | null = null;

  constructor(vw: number, vh: number) {
    this.vw = vw;
    this.vh = vh;
  }

  worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return { sx: (wx - this.x) * this.zoom + this.vw / 2, sy: (wy - this.y) * this.zoom + this.vh / 2 };
  }

  screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
    return { wx: (sx - this.vw / 2) / this.zoom + this.x, wy: (sy - this.vh / 2) / this.zoom + this.y };
  }

  zoomAt(sx: number, sy: number, factor: number): void {
    const before = this.screenToWorld(sx, sy);
    this.zoom = clamp(this.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    const after = this.screenToWorld(sx, sy);
    this.x += before.wx - after.wx;
    this.y += before.wy - after.wy;
  }

  /** Drag-pan: the world point under the cursor follows the drag by the same screen delta. */
  panBy(dxScreen: number, dyScreen: number): void {
    this.x -= dxScreen / this.zoom;
    this.y -= dyScreen / this.zoom;
  }

  /** Starts (or replaces) a tween to the given world point and zoom. Cancels any tween in
   *  flight — the new flight starts from the camera's current, possibly mid-tween, position.
   *  `ms <= 0` snaps immediately instead of starting a zero-duration tween, which would divide
   *  elapsed/duration by zero on the first update(). */
  flyTo(wx: number, wy: number, zoom: number, ms: number = CAM_TWEEN_MS): void {
    const clampedZoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    if (ms <= 0) {
      this.x = wx;
      this.y = wy;
      this.zoom = clampedZoom;
      this.tween = null;
      return;
    }
    this.tween = {
      fromX: this.x,
      fromY: this.y,
      fromZoom: this.zoom,
      toX: wx,
      toY: wy,
      toZoom: clampedZoom,
      elapsed: 0,
      duration: ms / 1000,
    };
  }

  /** Advances the active tween, if any, by `dt` seconds. */
  update(dt: number): void {
    if (!this.tween) return;
    this.tween.elapsed += dt;
    const t = clamp(this.tween.elapsed / this.tween.duration, 0, 1);
    const e = easeFly(t);
    this.x = lerp(this.tween.fromX, this.tween.toX, e);
    this.y = lerp(this.tween.fromY, this.tween.toY, e);
    this.zoom = lerp(this.tween.fromZoom, this.tween.toZoom, e);
    if (t >= 1) this.tween = null;
  }

  get isTweening(): boolean {
    return this.tween !== null;
  }
}
