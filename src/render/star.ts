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

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, `hsl(${hue}, 85%, 95%)`);
  core.addColorStop(0.65, `hsl(${hue}, 90%, 78%)`);
  core.addColorStop(1, `hsla(${hue}, 90%, 65%, 0)`);

  const mid = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
  mid.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.5)`);
  mid.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`);

  const outer = ctx.createRadialGradient(0, 0, r * 1.5, 0, 0, r * 4.5);
  outer.addColorStop(0, `hsla(${hue}, 85%, 65%, 0.18)`);
  outer.addColorStop(1, `hsla(${hue}, 85%, 65%, 0)`);

  const flare = ctx.createLinearGradient(0, 0, r * 3.2, 0);
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
  const length = r * 3.2;
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
  ctx.arc(0, 0, r * 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = visuals.mid;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  drawFlareSpikes(ctx, r, visuals.flare, pulse);

  ctx.globalAlpha = 1;
  ctx.fillStyle = visuals.core;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
