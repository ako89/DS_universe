/**
 * Bootstrap: find the roots, build the scene, wire the UI modules and input together, start the
 * loop. Logic belongs in engine/, ui/ and data/ — this file only wires their public APIs.
 *
 * Longer than PLAN.md §0's ~80-line guideline for this file now that Phase 2 wires in
 * tooltip/card/breadcrumb/help: every function here is 1-5 lines of orchestration (view-state
 * transition + a camera.flyTo + a UI-module call), not logic, which is what that rule is
 * actually guarding against. Still well under the 300-line hard cap.
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
import { createTooltip } from './ui/tooltip.ts';
import { createCard } from './ui/card.ts';
import { createBreadcrumb } from './ui/breadcrumb.ts';
import { createHelp } from './ui/help.ts';

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
const labels = createLabelLayer(overlay, (id) => goToBody(id));
const bodies = buildScene();
const bodyById = new Map(bodies.map((b) => [b.id, b]));
const picking = new Picking();

const tooltip = createTooltip();
const breadcrumb = createBreadcrumb({ onRoot: goHome, onBody: goToBody });
const help = createHelp(mustFind('#help'));
const card = createCard(mustFind('#card'), {
  onRelated: focusEntry,
  onClose: goBack,
});

// Orbital motion, twinkle/pulse and camera flights all freeze under prefers-reduced-motion
// (ENGINE_SPEC §2) and, additionally, whenever the card is open (ENGINE_SPEC §4).
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = reduceMotionQuery.matches;
reduceMotionQuery.addEventListener('change', (e) => {
  reduceMotion = e.matches;
});

// Midpoint between Sol (0,0) and Nova (4200,0) — a placeholder "see the whole system" framing.
// Phase 5 can fit this to the actual system bounds and viewport once search/advisor exist.
const HOME_X = 2100;

function flyHome(ms?: number): void {
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.vh / 6000));
  camera.flyTo(HOME_X, 0, zoom, reduceMotion ? 0 : ms);
}
flyHome(0);

function findMoon(entryId: string) {
  for (const body of bodies) {
    const moon = body.moons.find((m) => m.id === entryId);
    if (moon) return { body, moon };
  }
  return undefined;
}

function goHome(): void {
  picking.reset();
  card.close();
  flyHome();
  breadcrumb.update(picking.view);
}

function goToBody(bodyId: string): void {
  const body = bodyById.get(bodyId);
  if (!body) return;
  picking.enterBody(bodyId);
  card.close();
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, 140 / Math.max(body.radius, 10)));
  camera.flyTo(body.wx, body.wy, zoom, reduceMotion ? 0 : undefined);
  breadcrumb.update(picking.view);
}

function goBack(): void {
  if (help.isOpen()) {
    help.close();
    return;
  }
  picking.back();
  if (picking.view.level === 'universe') {
    card.close();
    flyHome();
  } else if (picking.view.level === 'body') {
    card.close();
  }
  breadcrumb.update(picking.view);
}

/** Opens (or crossfades to) `entryId`'s card. Flies the camera to frame its body first, but only
 *  if that body isn't already the one in view — a direct moon click while its body is already
 *  focused shouldn't re-trigger the body-framing flight. */
function focusEntry(entryId: string): void {
  const found = findMoon(entryId);
  if (!found) return;
  const currentBodyId = picking.view.level === 'universe' ? undefined : picking.view.bodyId;

  picking.enterDetail(found.body.id, entryId);
  if (found.body.id !== currentBodyId) {
    const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, 140 / Math.max(found.body.radius, 10)));
    camera.flyTo(found.body.wx, found.body.wy, zoom, reduceMotion ? 0 : undefined);
  }
  card.open(entryId);
  breadcrumb.update(picking.view);
}

attachInput(canvas, camera, bodies, {
  onSelectBody: goToBody,
  onSelectEntry: (_bodyId, entryId) => focusEntry(entryId),
  onBack: goBack,
  onReset: goHome,
  onToggleHelp: () => help.toggle(),
  onHover(bodyId, entryId, clientX, clientY) {
    if (bodyId) {
      tooltip.show(bodyId, entryId, clientX, clientY);
    } else {
      tooltip.hide();
    }
  },
  getFocusBodyId: () => (picking.view.level === 'universe' ? undefined : picking.view.bodyId),
  getFocusEntryId: () => (picking.view.level === 'detail' ? picking.view.entryId : undefined),
});

let clock = 0; // elapsed time fed to time-driven visuals (twinkle, pulse, gas drift) — frozen
// under reduced motion, and while the card is open, instead of advancing every frame.

startLoop((dt, t) => {
  const motionActive = !reduceMotion && !card.isOpen();
  camera.update(reduceMotion ? 0 : dt);
  updateScene(bodies, dt, !motionActive);
  if (motionActive) clock = t;

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
