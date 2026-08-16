/**
 * Bootstrap. This file stays thin (~80 lines): find the roots, build the scene, wire input,
 * start the loop. Logic belongs in engine/, ui/ and data/ — not here.
 *
 * Phase 1 in progress: modules plug in here as they land (see PLAN.md §4 Phase 1 and
 * docs/ENGINE_SPEC.md §9 for the contracts).
 */

import { BG } from './engine/constants.ts';
import { createCanvas, startLoop } from './engine/canvas.ts';
import { Camera } from './engine/camera.ts';
import { buildScene, updateScene } from './engine/scene.ts';
import { createStarfield } from './render/starfield.ts';
import { drawOrbit } from './render/orbit.ts';
import { drawPlanet } from './render/planet.ts';
import { drawStar } from './render/star.ts';
import { drawRingsBack, drawRingsFront } from './render/rings.ts';
import { drawBelt } from './render/belt.ts';

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
const bodies = buildScene();
const paused = false; // Phase 5 wires prefers-reduced-motion and card-open into this.

startLoop((dt, t) => {
  camera.update(dt);
  updateScene(bodies, dt, paused);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, camera.vw, camera.vh);
  starfield.draw(ctx, camera, t);

  for (const body of bodies) {
    if (body.type === 'star') {
      drawStar(ctx, camera, { id: body.id, wx: body.wx, wy: body.wy, radius: body.radius, hue: body.hue }, t);
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
  }
});

// Remaining Phase 1 wiring goes here as modules land:
//   attachInput(canvas, camera, bodies);
