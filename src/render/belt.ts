/**
 * The Belt: an asteroid field rendered as many tiny world-space rocks at jittered radius/phase
 * within a band around the orbit radius. Generated once with the seeded RNG (SEED_BELT) so the
 * field is stable across reloads rather than reshuffling on every refresh. See
 * docs/ENGINE_SPEC.md §2.
 */

import type { Camera } from '../engine/camera.ts';
import { SEED_BELT, TILT } from '../engine/constants.ts';
import { hashSeed, mulberry32 } from '../engine/rng.ts';

export interface BeltVisual {
  id: string;
  wx: number; // orbit center (the host star's world position)
  wy: number;
  orbitRadius: number;
  hue: number;
  rockCount: number;
}

interface Rock {
  radius: number;
  phase: number;
  size: number; // world units
}

const rockCache = new Map<string, Rock[]>();

function getRocks(belt: BeltVisual): Rock[] {
  const existing = rockCache.get(belt.id);
  if (existing) return existing;

  const rand = mulberry32(SEED_BELT ^ hashSeed(belt.id));
  const bandWidth = belt.orbitRadius * 0.12;
  const rocks: Rock[] = Array.from({ length: belt.rockCount }, () => ({
    radius: belt.orbitRadius + (rand() - 0.5) * bandWidth,
    phase: rand() * Math.PI * 2,
    size: 0.8 + rand() * 1.2,
  }));

  rockCache.set(belt.id, rocks);
  return rocks;
}

export function drawBelt(ctx: CanvasRenderingContext2D, camera: Camera, belt: BeltVisual): void {
  const rocks = getRocks(belt);

  ctx.save();
  ctx.fillStyle = `hsla(${belt.hue}, 25%, 70%, 0.6)`;
  for (const rock of rocks) {
    const wx = belt.wx + rock.radius * Math.cos(rock.phase);
    const wy = belt.wy + rock.radius * Math.sin(rock.phase) * TILT;
    const { sx, sy } = camera.worldToScreen(wx, wy);
    const r = rock.size * camera.zoom;
    if (r < 0.3) continue;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
