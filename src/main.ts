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

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Expected ${selector} in index.html, but it is missing`);
  return el;
}

const canvas = mustFind<HTMLCanvasElement>('#scene');
const { ctx, onResize } = createCanvas(canvas);

let vw = canvas.clientWidth;
let vh = canvas.clientHeight;
onResize((newVw, newVh) => {
  vw = newVw;
  vh = newVh;
});

// Temporary DPR sharpness probe for engine/canvas.ts — a rect at a fixed CSS-pixel size and
// position. Remove once render/planet.ts gives the loop something real to draw.
startLoop(() => {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, vw, vh);
  ctx.fillStyle = '#e6e8f0';
  ctx.fillRect(40, 40, 120, 80);
});

// Remaining Phase 1 wiring goes here as modules land:
//   const camera = new Camera(vw, vh);
//   const bodies = buildScene();
//   attachInput(canvas, camera, bodies);
//   startLoop((dt) => { camera.update(dt); updateScene(bodies, dt, paused); render(...); });
