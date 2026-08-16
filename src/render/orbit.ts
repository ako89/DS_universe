/**
 * Orbit path hairlines. The tilt is baked into the path itself (world-space ellipse), not the
 * camera transform — see docs/ENGINE_SPEC.md §8. The camera's uniform world->screen scale turns
 * a world-space ellipse into a screen-space ellipse with the same squash, so bodies moving along
 * it stay round.
 */

import type { Camera } from '../engine/camera.ts';
import { TILT } from '../engine/constants.ts';

const ORBIT = 'rgba(255, 255, 255, 0.08)';
const ORBIT_HOVER = 'rgba(255, 255, 255, 0.25)';

/** Draws the tilted-ellipse orbit path for a body at world-space orbit center (cx, cy) with
 *  the given world-space orbit radius. */
export function drawOrbit(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  cx: number,
  cy: number,
  orbitRadius: number,
  hovered: boolean,
): void {
  const { sx, sy } = camera.worldToScreen(cx, cy);
  const rx = orbitRadius * camera.zoom;
  const ry = orbitRadius * TILT * camera.zoom;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = hovered ? ORBIT_HOVER : ORBIT;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
