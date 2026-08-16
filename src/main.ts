/**
 * Bootstrap. This file stays thin (~80 lines): find the roots, build the scene, wire input,
 * start the loop. Logic belongs in engine/, ui/ and data/ — not here.
 *
 * Phase 0 status: the engine modules do not exist yet. This currently proves the pipeline
 * end to end (TypeScript -> Vite -> a painted canvas at the right DPR) and marks where each
 * Phase 1 module plugs in. Replace the placeholder paint with the real loop as modules land;
 * see PLAN.md §7 Phase 1 and docs/ENGINE_SPEC.md §5.4 for the contracts to implement against.
 */

import { BG, DPR_CAP } from './engine/constants.ts';

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Expected ${selector} in index.html, but it is missing`);
  return el;
}

const canvas = mustFind<HTMLCanvasElement>('#scene');

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D canvas context unavailable in this browser');

/**
 * Placeholder for engine/canvas.ts. Kept only so Phase 0 has something to look at; delete it
 * once createCanvas() exists rather than letting two DPR code paths coexist.
 */
function resize(canvasEl: HTMLCanvasElement, c: CanvasRenderingContext2D): void {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const vw = canvasEl.clientWidth;
  const vh = canvasEl.clientHeight;
  canvasEl.width = Math.round(vw * dpr);
  canvasEl.height = Math.round(vh * dpr);
  // All render code from here on draws in CSS pixels.
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  c.fillStyle = BG;
  c.fillRect(0, 0, vw, vh);
}

new ResizeObserver(() => resize(canvas, ctx)).observe(canvas);
resize(canvas, ctx);

// Phase 1 wiring goes here:
//   const { ctx, vw, vh, onResize } = createCanvas(canvas);
//   const camera = new Camera(vw, vh);
//   const bodies = buildScene();
//   attachInput(canvas, camera, bodies);
//   startLoop((dt) => { camera.update(dt); updateScene(bodies, dt, paused); render(...); });
