/**
 * Sol and Nova: three layered additive radial gradients (core/mid/outer corona) plus four
 * flare spikes, pulsing on a ~4s sine. See docs/ENGINE_SPEC.md §2. Warm vs. cool falls out of
 * `hue` (Sol 42, Nova 194 in content/system.ts) rather than special-casing either star by id.
 */

import type { Camera } from '../engine/camera.ts';
import { hashSeed } from '../engine/rng.ts';

export interface StarVisual {
  id: string;
  wx: number;
  wy: number;
  radius: number;
  hue: number;
}

interface StarCache {
  radiusBucket: number;
  hue: number;
  core: CanvasGradient;
  mid: CanvasGradient;
  outer: CanvasGradient;
  flare: CanvasGradient;
  pulsePhase: number;
}

const cache = new Map<string, StarCache>();
const PULSE_PERIOD_S = 4;

function bucketRadius(r: number): number {
  return Math.max(1, Math.round(r / 2) * 2);
}

function buildCache(ctx: CanvasRenderingContext2D, star: StarVisual, radiusBucket: number): StarCache {
  const r = radiusBucket;
  const hue = star.hue;

  // Saturation and mid/outer alpha nudged up from the original 85-90%/0.18-0.5 so Sol and Nova
  // read as more vivid against the starfield (docs/ENGINE_SPEC.md §2's "additive radial
  // gradients"), rather than the softer, easily-lost-in-the-starfield version this replaced.
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, `hsl(${hue}, 95%, 95%)`);
  core.addColorStop(0.65, `hsl(${hue}, 100%, 78%)`);
  core.addColorStop(1, `hsla(${hue}, 100%, 65%, 0)`);

  // Widened and strengthened further still (docs/UX_PASS_PLAN.md Task 2b), on top of the dimmer
  // background starfield from Task 2a — Sol and Nova should read as the map's two anchors, not
  // just avoid being lost in the background.
  const mid = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
  mid.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.7)`);
  mid.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);

  const outer = ctx.createRadialGradient(0, 0, r * 1.5, 0, 0, r * 6.0);
  outer.addColorStop(0, `hsla(${hue}, 95%, 65%, 0.34)`);
  outer.addColorStop(1, `hsla(${hue}, 95%, 65%, 0)`);

  const flare = ctx.createLinearGradient(0, 0, r * 4.2, 0);
  flare.addColorStop(0, `hsla(${hue}, 90%, 92%, 0.6)`);
  flare.addColorStop(1, `hsla(${hue}, 90%, 92%, 0)`);

  return {
    radiusBucket,
    hue,
    core,
    mid,
    outer,
    flare,
    pulsePhase: (hashSeed(star.id) % 1000) / 1000 * Math.PI * 2,
  };
}

function getCache(ctx: CanvasRenderingContext2D, star: StarVisual, screenRadius: number): StarCache {
  const radiusBucket = bucketRadius(screenRadius);
  const existing = cache.get(star.id);
  if (existing && existing.radiusBucket === radiusBucket && existing.hue === star.hue) {
    return existing;
  }
  const built = buildCache(ctx, star, radiusBucket);
  cache.set(star.id, built);
  return built;
}

function drawFlareSpikes(ctx: CanvasRenderingContext2D, r: number, gradient: CanvasGradient, alpha: number): void {
  const length = r * 4.2; // matches buildCache's flare gradient extent
  const width = Math.max(1.5, r * 0.12);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;

  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * i);
    ctx.beginPath();
    ctx.moveTo(0, -width / 2);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawStar(ctx: CanvasRenderingContext2D, camera: Camera, star: StarVisual, t: number): void {
  const { sx, sy } = camera.worldToScreen(star.wx, star.wy);
  const r = star.radius * camera.zoom;
  if (r < 0.5) return;

  const visuals = getCache(ctx, star, r);
  const pulse = 0.85 + 0.15 * Math.sin((t * Math.PI * 2) / PULSE_PERIOD_S + visuals.pulsePhase);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.globalCompositeOperation = 'lighter';

  ctx.globalAlpha = pulse;
  ctx.fillStyle = visuals.outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 6.0, 0, Math.PI * 2); // matches buildCache's outer gradient extent
  ctx.fill();

  ctx.fillStyle = visuals.mid;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  drawFlareSpikes(ctx, r, visuals.flare, pulse);

  // Back to normal compositing for the core: 'lighter' only ever adds light to what's already
  // there, it never occludes it, so a background starfield star sitting under the disc stayed
  // visible right through a "solid", full-alpha core. The corona/flare layers above are additive
  // on purpose (that's the glow), but the core disc itself needs to actually paint over anything
  // behind it.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = visuals.core;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** A very soft, wide wash in the star's hue, drawn *before* everything else in the frame — the
 *  background starfield first, this halo second, then the star itself and all bodies — so the
 *  starfield visibly recedes near Sol and Nova instead of competing with them for attention
 *  (docs/UX_PASS_PLAN.md Task 2c). Deliberately almost imperceptible as a shape (a huge radius,
 *  a low peak alpha) and `source-over`, not `lighter` like the corona above — this is meant to
 *  read as "this region is the centre of something", not as another glow layer. Built fresh each
 *  call rather than cached like buildCache's gradients: with only two stars on screen, the cost
 *  of one extra createRadialGradient per star per frame is negligible next to the starfield's
 *  hundreds of tiled stars, which is what the OffscreenCanvas caching in render/starfield.ts
 *  actually exists to amortize. */
export function drawStarHalo(ctx: CanvasRenderingContext2D, camera: Camera, star: StarVisual): void {
  const { sx, sy } = camera.worldToScreen(star.wx, star.wy);
  const r = star.radius * camera.zoom;
  if (r < 0.5) return;

  const haloRadius = r * 14;
  const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
  halo.addColorStop(0, `hsla(${star.hue}, 70%, 60%, 0.1)`);
  halo.addColorStop(1, `hsla(${star.hue}, 70%, 60%, 0)`);

  ctx.save();
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sx, sy, haloRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
