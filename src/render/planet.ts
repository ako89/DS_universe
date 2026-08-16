/**
 * Planet bodies: lit sphere, rim light, glow, optional gas banding. Procedural, no image assets.
 * See docs/ENGINE_SPEC.md §2.
 *
 * Lighting trick: the sphere/glow/rim gradients are created once in a *local*, unrotated frame
 * (focus offset along local +x) and cached. Each frame we translate to the body's screen
 * position and rotate the context so local +x points at the illuminating star — the CTM in
 * effect when a gradient is painted transforms its coordinates same as any path, so one cached
 * gradient correctly tracks a body orbiting a fixed star without ever being rebuilt for it.
 * Gas bands are axis-aligned and drawn in a separate, unrotated pass so they read as horizontal
 * stripes rather than rotating with the body.
 */

import type { Camera } from '../engine/camera.ts';
import { mulberry32 } from '../engine/rng.ts';

export interface PlanetVisual {
  id: string;
  wx: number;
  wy: number;
  radius: number; // world-space
  hue: number;
  /** World position of the star illuminating this body, so the gradient focus can point at it. */
  litByPos: { wx: number; wy: number };
  gasGiant?: boolean;
}

const RIM_ALPHA = 0.25;
const GLOW_ALPHA_REST = 0.12;
const GLOW_ALPHA_HOVER = 0.3;
const GLOW_PEAK_ALPHA = 0.3; // baked into the cached gradient; rest/hover scale it via globalAlpha

function hashSeed(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

interface PlanetCache {
  radiusBucket: number;
  hue: number;
  sphere: CanvasGradient;
  glow: CanvasGradient;
  bandNoise: number[] | null;
}

const cache = new Map<string, PlanetCache>();

function bucketRadius(r: number): number {
  return Math.max(1, Math.round(r / 2) * 2);
}

function buildGasBandNoise(seed: number, bandCount: number): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length: bandCount }, () => rand());
}

function buildCache(ctx: CanvasRenderingContext2D, planet: PlanetVisual, radiusBucket: number): PlanetCache {
  const r = radiusBucket;
  const hue = planet.hue;

  const sphere = ctx.createRadialGradient(r * 0.35, 0, r * 0.05, 0, 0, r * 1.05);
  sphere.addColorStop(0, `hsl(${hue}, 65%, 78%)`);
  sphere.addColorStop(0.55, `hsl(${hue}, 55%, 42%)`);
  sphere.addColorStop(1, `hsl(${hue}, 45%, 6%)`);

  const glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.8);
  glow.addColorStop(0, `hsla(${hue}, 80%, 70%, ${GLOW_PEAK_ALPHA})`);
  glow.addColorStop(1, `hsla(${hue}, 80%, 70%, 0)`);

  return {
    radiusBucket,
    hue,
    sphere,
    glow,
    bandNoise: planet.gasGiant ? buildGasBandNoise(hashSeed(planet.id), 4) : null,
  };
}

function getCache(ctx: CanvasRenderingContext2D, planet: PlanetVisual, screenRadius: number): PlanetCache {
  const radiusBucket = bucketRadius(screenRadius);
  const existing = cache.get(planet.id);
  if (existing && existing.radiusBucket === radiusBucket && existing.hue === planet.hue) {
    return existing;
  }
  const built = buildCache(ctx, planet, radiusBucket);
  cache.set(planet.id, built);
  return built;
}

function drawGasBands(ctx: CanvasRenderingContext2D, r: number, hue: number, noise: number[], t: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  const bandH = (2 * r) / noise.length;
  const drift = (t * 3) % bandH; // slow vertical drift, wraps within one band height
  for (let i = -1; i <= noise.length; i++) {
    const y = -r + i * bandH + drift;
    const n = noise[((i % noise.length) + noise.length) % noise.length] ?? 0.5;
    const lightness = 32 + n * 28;
    ctx.fillStyle = `hsla(${hue}, 40%, ${lightness}%, 0.35)`;
    ctx.fillRect(-r, y, 2 * r, bandH + 1);
  }
  ctx.restore();
}

function drawRimLight(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  // Local +x points at the star (see file comment), so the lit limb is centered on angle 0.
  ctx.arc(0, 0, r - 1, -Math.PI / 3, Math.PI / 3);
  ctx.strokeStyle = `rgba(255, 255, 255, ${RIM_ALPHA})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  planet: PlanetVisual,
  hovered: boolean,
  t: number,
): void {
  const { sx, sy } = camera.worldToScreen(planet.wx, planet.wy);
  const r = planet.radius * camera.zoom;
  if (r < 0.5) return; // culled: not worth painting

  const angleToStar = Math.atan2(planet.litByPos.wy - planet.wy, planet.litByPos.wx - planet.wx);
  const visuals = getCache(ctx, planet, r);

  // Glow first, underneath the disc, additive so overlapping glows brighten rather than occlude.
  ctx.save();
  ctx.translate(sx, sy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = hovered ? GLOW_ALPHA_HOVER / GLOW_PEAK_ALPHA : GLOW_ALPHA_REST / GLOW_PEAK_ALPHA;
  ctx.fillStyle = visuals.glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sphere + rim light, rotated so the gradient/limb face the illuminating star.
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angleToStar);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = visuals.sphere;
  ctx.fill();
  drawRimLight(ctx, r);
  ctx.restore();

  // Gas bands: axis-aligned, drawn unrotated so they read as horizontal stripes.
  if (visuals.bandNoise) {
    ctx.save();
    ctx.translate(sx, sy);
    drawGasBands(ctx, r, planet.hue, visuals.bandNoise, t);
    ctx.restore();
  }
}
