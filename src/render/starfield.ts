/**
 * Starfield background: three parallax layers, each pre-rendered once into an OffscreenCanvas
 * tile and blitted (tiled, wrapping) every frame — never redrawn star-by-star. Per
 * docs/ENGINE_SPEC.md §2. Twinkle modulates each layer's overall alpha, not per-star alpha.
 */

import type { Camera } from '../engine/camera.ts';
import { SEED_STARFIELD, STAR_LAYERS } from '../engine/constants.ts';
import { mulberry32 } from '../engine/rng.ts';

const TILE_W = 1600;
const TILE_H = 1000;

interface StarLayerTile {
  canvas: OffscreenCanvas;
  parallax: number;
  twinkleRate: number;
  twinklePhase: number;
}

export interface Starfield {
  draw(ctx: CanvasRenderingContext2D, camera: Camera, t: number): void;
}

function renderTile(layer: (typeof STAR_LAYERS)[number], seed: number): OffscreenCanvas {
  const canvas = new OffscreenCanvas(TILE_W, TILE_H);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D OffscreenCanvas context unavailable');

  const rand = mulberry32(seed);
  const [sizeMin, sizeMax] = layer.size;
  const [alphaMin, alphaMax] = layer.alpha;

  for (let i = 0; i < layer.count; i++) {
    const x = rand() * TILE_W;
    const y = rand() * TILE_H;
    const r = sizeMin + rand() * (sizeMax - sizeMin);
    const alpha = alphaMin + rand() * (alphaMax - alphaMin);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

/** Tiles `tile` across the viewport, wrapping seamlessly, with its world origin placed at
 *  screen position (originX, originY) mod tile size. */
function blitTiled(
  ctx: CanvasRenderingContext2D,
  tile: OffscreenCanvas,
  originX: number,
  originY: number,
  vw: number,
  vh: number,
  alpha: number,
): void {
  const w = tile.width;
  const h = tile.height;
  const x0 = (((originX % w) + w) % w) - w;
  const y0 = (((originY % h) + h) % h) - h;

  ctx.save();
  ctx.globalAlpha = alpha;
  for (let x = x0; x < vw + w; x += w) {
    for (let y = y0; y < vh + h; y += h) {
      ctx.drawImage(tile, x, y);
    }
  }
  ctx.restore();
}

export function createStarfield(): Starfield {
  const tiles: StarLayerTile[] = STAR_LAYERS.map((layer, i) => ({
    canvas: renderTile(layer, SEED_STARFIELD + i * 0x1000),
    parallax: layer.parallax,
    // Distinct rate/phase per layer so the three don't pulse in lockstep.
    twinkleRate: 0.5 + i * 0.2,
    twinklePhase: i * 1.7,
  }));

  return {
    draw(ctx: CanvasRenderingContext2D, camera: Camera, t: number): void {
      for (const tile of tiles) {
        // Amplitude reduced from Phase 0's ±0.1 (docs/UX_PASS_PLAN.md Task 2a) — motion in the
        // periphery reads as distracting independent of brightness, so on top of the dimmer base
        // alpha above, the twinkle itself is calmed down too.
        const alpha = 0.96 + 0.04 * Math.sin(t * tile.twinkleRate + tile.twinklePhase);
        blitTiled(ctx, tile.canvas, -camera.x * tile.parallax, -camera.y * tile.parallax, camera.vw, camera.vh, alpha);
      }
    },
  };
}
