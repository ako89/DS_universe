/**
 * Composes one frame of body rendering: dispatches each SceneBody to the right render/*.ts
 * function by type, and sandwiches Saturn's rings around its disc for correct occlusion
 * (render/rings.ts §2). Kept out of main.ts so the bootstrap stays thin (PLAN.md §0 rule 9).
 */

import type { Camera } from '../engine/camera.ts';
import type { SceneBody } from '../engine/scene.ts';
import { drawOrbit } from './orbit.ts';
import { drawPlanet } from './planet.ts';
import { drawStar } from './star.ts';
import { drawRingsBack, drawRingsFront } from './rings.ts';
import { drawBelt } from './belt.ts';

/** Moons are placeholder geometry (no Entry content until Phase 3 — see engine/scene.ts's file
 *  comment), drawn as small discs lit from the same star as their parent. drawPlanet's own
 *  `r < 0.5` screen-radius cull does the "moons appear once you're zoomed into a body" work for
 *  free: at the default whole-system view a moon's screen radius rounds to nothing, and at the
 *  zoom level a click-to-select flight lands on, it's comfortably visible. */
function drawMoons(ctx: CanvasRenderingContext2D, camera: Camera, body: SceneBody, t: number): void {
  for (const moon of body.moons) {
    drawPlanet(
      ctx,
      camera,
      {
        id: `${body.id}-moon-${moon.index}`,
        wx: moon.wx,
        wy: moon.wy,
        radius: moon.radius,
        hue: body.hue,
        litByPos: { wx: body.centerX, wy: body.centerY },
      },
      false,
      t,
    );
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, camera: Camera, bodies: SceneBody[], t: number): void {
  for (const body of bodies) {
    if (body.type === 'star') {
      drawStar(ctx, camera, { id: body.id, wx: body.wx, wy: body.wy, radius: body.radius, hue: body.hue }, t);
      drawMoons(ctx, camera, body, t);
      continue;
    }

    drawOrbit(ctx, camera, body.centerX, body.centerY, body.orbitRadius, false);

    if (body.type === 'belt') {
      drawBelt(ctx, camera, {
        id: body.id,
        wx: body.centerX,
        wy: body.centerY,
        orbitRadius: body.orbitRadius,
        hue: body.hue,
        rockCount: body.rockCount ?? 0,
      });
      continue;
    }

    const planetVisual = {
      id: body.id,
      wx: body.wx,
      wy: body.wy,
      radius: body.radius,
      hue: body.hue,
      litByPos: { wx: body.centerX, wy: body.centerY },
      gasGiant: body.id === 'jupiter' || body.id === 'genesis',
    };

    if (body.id === 'saturn') {
      const ring = { wx: body.wx, wy: body.wy, radius: body.radius, hue: body.hue };
      drawRingsBack(ctx, camera, ring);
      drawPlanet(ctx, camera, planetVisual, false, t);
      drawRingsFront(ctx, camera, ring);
    } else {
      drawPlanet(ctx, camera, planetVisual, false, t);
    }

    drawMoons(ctx, camera, body, t);
  }
}
