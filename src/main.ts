/**
 * Bootstrap. This file stays thin (~80 lines): find the roots, build the scene, wire input,
 * start the loop. Logic belongs in engine/, ui/ and data/ — not here.
 */

import { BG, ZOOM_MAX, ZOOM_MIN } from './engine/constants.ts';
import { createCanvas, startLoop } from './engine/canvas.ts';
import { Camera } from './engine/camera.ts';
import { buildScene, updateScene } from './engine/scene.ts';
import { Picking } from './engine/picking.ts';
import { attachInput } from './engine/input.ts';
import { createStarfield } from './render/starfield.ts';
import { drawScene } from './render/draw.ts';
import { createLabelLayer } from './render/labels.ts';

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Expected ${selector} in index.html, but it is missing`);
  return el;
}

const canvas = mustFind<HTMLCanvasElement>('#scene');
const overlay = mustFind<HTMLDivElement>('#overlay');
const { ctx, vw, vh, onResize } = createCanvas(canvas);

const camera = new Camera(vw, vh);
onResize((newVw, newVh) => {
  camera.vw = newVw;
  camera.vh = newVh;
});

const starfield = createStarfield();
const labels = createLabelLayer(overlay);
const bodies = buildScene();
const bodyById = new Map(bodies.map((b) => [b.id, b]));
const picking = new Picking();

// Orbital motion, twinkle/pulse, and camera flights all freeze under prefers-reduced-motion,
// per ENGINE_SPEC §2. Phase 2 additionally freezes motion whenever a card is open; there's no
// card yet, so that half isn't wired here.
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = reduceMotionQuery.matches;
reduceMotionQuery.addEventListener('change', (e) => {
  reduceMotion = e.matches;
});

// Midpoint between Sol (0,0) and Nova (4200,0) — a placeholder "see the whole system" framing.
// Phase 2/5 can fit this to the actual system bounds and viewport once the UI chrome (which
// eats into the usable canvas area) exists.
const HOME_X = 2100;

function flyHome(ms?: number): void {
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.vh / 6000));
  camera.flyTo(HOME_X, 0, zoom, reduceMotion ? 0 : ms);
}
flyHome(0);

attachInput(canvas, camera, bodies, {
  onSelectBody(id) {
    const body = bodyById.get(id);
    if (!body) return;
    picking.enterBody(id);
    const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, 140 / Math.max(body.radius, 10)));
    camera.flyTo(body.wx, body.wy, zoom, reduceMotion ? 0 : undefined);
  },
  onBack() {
    picking.back();
    if (picking.view.level === 'universe') flyHome();
  },
  onReset() {
    picking.reset();
    flyHome();
  },
});

let clock = 0; // elapsed time fed to time-driven visuals (twinkle, pulse, gas drift) — frozen
// under reduced motion instead of advancing every frame.

startLoop((dt, t) => {
  const active = !reduceMotion;
  camera.update(active ? dt : 0);
  updateScene(bodies, dt, !active);
  if (active) clock = t;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, camera.vw, camera.vh);
  starfield.draw(ctx, camera, clock);
  drawScene(ctx, camera, bodies, clock);

  labels.update(
    camera,
    bodies.map((body) => ({
      id: body.id,
      name: body.name,
      wx: body.wx,
      wy: body.wy,
      priority: body.type === 'star' ? 1000 : body.radius,
    })),
  );
});
