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
import { system } from './content/system.ts';

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

  for (const body of system.bodies) {
    const star = starById.get(body.litBy);
    if (!star) continue;
    drawOrbit(ctx, camera, star.at[0], star.at[1], body.orbitRadius, false);
  }
});

// Remaining Phase 1 wiring goes here as modules land:
//   const bodies = buildScene();
//   attachInput(canvas, camera, bodies);
//   startLoop((dt, t) => { camera.update(dt); updateScene(bodies, dt, paused); render(...); });
