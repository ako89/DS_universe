/**
 * Bootstrap. This file stays thin (~80 lines): find the roots, build the scene, wire input,
 * start the loop. Logic belongs in engine/, ui/ and data/ — not here.
 *
 * Phase 1 in progress: modules plug in here as they land (see PLAN.md §4 Phase 1 and
 * docs/ENGINE_SPEC.md §9 for the contracts). Until camera/scene/render exist, this paints the
 * background plus a fixed debug rect so engine/canvas.ts's DPR handling is visually verifiable.
 */

import { BG } from './engine/constants.ts';
import { createCanvas, startLoop } from './engine/canvas.ts';
import { Camera } from './engine/camera.ts';
import { createStarfield } from './render/starfield.ts';
import { drawOrbit } from './render/orbit.ts';
import { drawPlanet } from './render/planet.ts';
import { drawStar } from './render/star.ts';
import { drawRingsBack, drawRingsFront } from './render/rings.ts';
import { drawBelt } from './render/belt.ts';
import { system } from './content/system.ts';
import { TILT } from './engine/constants.ts';

// TEMP: engine/scene.ts (Task 10) owns real orbital position/motion. Inlined here only so
// render/planet.ts is visually verifiable before scene.ts lands.
function tempOrbitPos(cx: number, cy: number, r: number, theta: number): { wx: number; wy: number } {
  return { wx: cx + r * Math.cos(theta), wy: cy + r * Math.sin(theta) * TILT };
}

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Expected ${selector} in index.html, but it is missing`);
  return el;
}

const canvas = mustFind<HTMLCanvasElement>('#scene');
const { ctx, vw, vh, onResize } = createCanvas(canvas);

const camera = new Camera(vw, vh);
onResize((newVw, newVh) => {
  camera.vw = newVw;
  camera.vh = newVh;
});

const starfield = createStarfield();
const starById = new Map(system.stars.map((s) => [s.id, s]));

startLoop((dt, t) => {
  camera.update(dt);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, camera.vw, camera.vh);
  starfield.draw(ctx, camera, t);

  for (const star of system.stars) {
    drawStar(ctx, camera, { id: star.id, wx: star.at[0], wy: star.at[1], radius: star.radius, hue: star.hue }, t);
  }

  for (const body of system.bodies) {
    const star = starById.get(body.litBy);
    if (!star) continue;
    drawOrbit(ctx, camera, star.at[0], star.at[1], body.orbitRadius, false);

    if (body.type === 'belt') {
      drawBelt(ctx, camera, {
        id: body.id,
        wx: star.at[0],
        wy: star.at[1],
        orbitRadius: body.orbitRadius,
        hue: body.hue,
        rockCount: body.rockCount ?? 0,
      });
      continue;
    }

    const theta = body.phase * Math.PI * 2;
    const pos = tempOrbitPos(star.at[0], star.at[1], body.orbitRadius, theta);
    const planetVisual = {
      id: body.id,
      wx: pos.wx,
      wy: pos.wy,
      radius: body.radius,
      hue: body.hue,
      litByPos: { wx: star.at[0], wy: star.at[1] },
      gasGiant: body.id === 'jupiter' || body.id === 'genesis',
    };

    if (body.id === 'saturn') {
      const ring = { wx: pos.wx, wy: pos.wy, radius: body.radius, hue: body.hue };
      drawRingsBack(ctx, camera, ring);
      drawPlanet(ctx, camera, planetVisual, false, t);
      drawRingsFront(ctx, camera, ring);
    } else {
      drawPlanet(ctx, camera, planetVisual, false, t);
    }
  }
});

// Remaining Phase 1 wiring goes here as modules land:
//   const bodies = buildScene();
//   attachInput(canvas, camera, bodies);
//   startLoop((dt, t) => { camera.update(dt); updateScene(bodies, dt, paused); render(...); });
