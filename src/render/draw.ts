/**
 * Composes one frame of body rendering: dispatches each SceneBody to the right render/*.ts
 * function by type, and sandwiches Saturn's rings around its disc for correct occlusion
 * (render/rings.ts §2). Kept out of main.ts so the bootstrap stays thin (PLAN.md §0 rule 9).
 */

import type { Camera } from '../engine/camera.ts';
import type { SceneBody } from '../engine/scene.ts';
import { drawOrbit } from './orbit.ts';
import { drawPlanet } from './planet.ts';
import { drawStar, drawStarHalo } from './star.ts';
import { drawRingsBack, drawRingsFront } from './rings.ts';
import { drawBelt } from './belt.ts';

/** Which body/moon is currently hovered *or* keyboard-focused — main.ts's single source of truth
 *  for both (a real DOM `focus` on a body label and a mouse `hover` drive the same tooltip and
 *  should drive the same on-canvas highlight). `entryId` set means a moon of `bodyId`; `bodyId`
 *  alone means the body itself. Both undefined means nothing is highlighted. */
export interface Highlight {
  bodyId?: string;
  entryId?: string;
}

const NO_HIGHLIGHT: Highlight = {};

/** Moons are placeholder geometry (no Entry content until Phase 3 — see engine/scene.ts's file
 *  comment), drawn as small discs lit from the same star as their parent. drawPlanet's own
 *  `r < 0.5` screen-radius cull does the "moons appear once you're zoomed into a body" work for
 *  free: at the default whole-system view a moon's screen radius rounds to nothing, and at the
 *  zoom level a click-to-select flight lands on, it's comfortably visible. */
function drawMoons(ctx: CanvasRenderingContext2D, camera: Camera, body: SceneBody, t: number, highlight: Highlight): void {
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
      moon.id !== undefined && moon.id === highlight.entryId,
      t,
    );
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, camera: Camera, bodies: SceneBody[], t: number, highlight: Highlight = NO_HIGHLIGHT): void {
  // A first pass draws each star's halo (render/star.ts's drawStarHalo) before anything else in
  // the frame, so it sits over the background starfield (already drawn by main.ts's loop before
  // calling drawScene) and under every star/body/moon drawn below (docs/UX_PASS_PLAN.md Task 2c).
  for (const body of bodies) {
    if (body.type === 'star') drawStarHalo(ctx, camera, { id: body.id, wx: body.wx, wy: body.wy, radius: body.radius, hue: body.hue });
  }

  for (const body of bodies) {
    if (body.type === 'star') {
      drawStar(ctx, camera, { id: body.id, wx: body.wx, wy: body.wy, radius: body.radius, hue: body.hue }, t);
      drawMoons(ctx, camera, body, t, highlight);
      continue;
    }

    // Hovering/focusing a moon dims its parent's own highlight back to rest — the moon is the
    // more specific target, and both glowing at once reads as two things being pointed at.
    const bodyHovered = highlight.bodyId === body.id && highlight.entryId === undefined;
    drawOrbit(ctx, camera, body.centerX, body.centerY, body.orbitRadius, bodyHovered);

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
      drawPlanet(ctx, camera, planetVisual, bodyHovered, t);
      drawRingsFront(ctx, camera, ring);
    } else {
      drawPlanet(ctx, camera, planetVisual, bodyHovered, t);
    }

    drawMoons(ctx, camera, body, t, highlight);
  }
}
