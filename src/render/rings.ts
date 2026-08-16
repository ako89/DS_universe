/**
 * Saturn's rings: two bands separated by a Cassini gap. Occlusion is handled by the caller, not
 * this module — draw drawRingsBack(), then the planet disc (render/planet.ts), then
 * drawRingsFront(), so the back half of the ring reads as behind the disc and the front half as
 * in front of it. See docs/ENGINE_SPEC.md §2.
 */

import type { Camera } from '../engine/camera.ts';

export interface RingVisual {
  wx: number;
  wy: number;
  radius: number; // the planet's world-space radius; ring geometry scales from it
  hue: number;
}

// Ring band radii, as multiples of the planet's radius.
const RING_INNER = 1.35;
const RING_GAP_INNER = 1.62;
const RING_GAP_OUTER = 1.72;
const RING_OUTER = 2.05;
const RING_SQUASH = 0.32; // ring-plane tilt, steeper than the orbital TILT for a readable ring

function drawBand(ctx: CanvasRenderingContext2D, rInner: number, rOuter: number, hue: number, alpha: number): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, rOuter, rOuter * RING_SQUASH, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 0, rInner, rInner * RING_SQUASH, 0, 0, Math.PI * 2, true);
  ctx.fillStyle = `hsla(${hue}, 35%, 72%, ${alpha})`;
  ctx.fill('evenodd');
}

function drawHalf(ctx: CanvasRenderingContext2D, r: number, hue: number, half: 'back' | 'front'): void {
  const outer = r * RING_OUTER;

  ctx.save();
  ctx.beginPath();
  if (half === 'back') {
    ctx.rect(-outer, -outer, outer * 2, outer);
  } else {
    ctx.rect(-outer, 0, outer * 2, outer);
  }
  ctx.clip();

  drawBand(ctx, r * RING_INNER, r * RING_GAP_INNER, hue, 0.45);
  drawBand(ctx, r * RING_GAP_OUTER, r * RING_OUTER, hue, 0.35);

  ctx.restore();
}

export function drawRingsBack(ctx: CanvasRenderingContext2D, camera: Camera, ring: RingVisual): void {
  const { sx, sy } = camera.worldToScreen(ring.wx, ring.wy);
  const r = ring.radius * camera.zoom;
  if (r < 1) return;

  ctx.save();
  ctx.translate(sx, sy);
  drawHalf(ctx, r, ring.hue, 'back');
  ctx.restore();
}

export function drawRingsFront(ctx: CanvasRenderingContext2D, camera: Camera, ring: RingVisual): void {
  const { sx, sy } = camera.worldToScreen(ring.wx, ring.wy);
  const r = ring.radius * camera.zoom;
  if (r < 1) return;

  ctx.save();
  ctx.translate(sx, sy);
  drawHalf(ctx, r, ring.hue, 'front');
  ctx.restore();
}
