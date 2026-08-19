/**
 * Bootstrap: find the roots, build the scene, wire the UI modules and input together, start the
 * loop. Logic belongs in engine/, ui/ and data/ — this file only wires their public APIs.
 *
 * Longer than PLAN.md §0's ~80-line guideline for this file now that Phase 2 wires in
 * tooltip/card/breadcrumb/guide: every function here is 1-5 lines of orchestration (view-state
 * transition + a camera.flyTo + a UI-module call), not logic, which is what that rule is
 * actually guarding against. Still well under the 300-line hard cap.
 */

import { BG, ZOOM_MAX, ZOOM_MIN } from './engine/constants.ts';
import { createCanvas, startLoop } from './engine/canvas.ts';
import { Camera } from './engine/camera.ts';
import { bodyTabOrder, buildScene, motionTimeScale, updateScene } from './engine/scene.ts';
import { Picking } from './engine/picking.ts';
import { hashFor, parseHash } from './engine/deep-link.ts';
import { attachInput } from './engine/input.ts';
import { createStarfield } from './render/starfield.ts';
import type { Highlight } from './render/draw.ts';
import { drawScene } from './render/draw.ts';
import { createLabelLayer } from './render/labels.ts';
import { createTooltip } from './ui/tooltip.ts';
import { createCard } from './ui/card.ts';
import { createBreadcrumb } from './ui/breadcrumb.ts';
import { createToolbar } from './ui/toolbar.ts';
import { createGuide } from './ui/guide.ts';
import { createSearch } from './ui/search.ts';
import { createAdvisor } from './ui/advisor.ts';
import { createStatusAnnouncer, populateSummary } from './ui/a11y-status.ts';
import { buildIndex } from './data/search-index.ts';
import { entries } from './data/registry.ts';

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Expected ${selector} in index.html, but it is missing`);
  return el;
}

// Last-resort error boundary for the entirely-synchronous setup below: everything here runs
// top-to-bottom with no data to await, so if any of it throws, index.html's #loading element
// (see its own comment) would otherwise be left reading "Loading…" forever with no explanation.
// Stops reacting once the app is actually up (appReady) — a later runtime error from user
// interaction shouldn't retroactively take over the whole page with a fatal-error screen.
let appReady = false;
function showFatalError(reason: unknown): void {
  if (appReady) return;
  const loading = document.getElementById('loading');
  if (!loading) return;
  const message = reason instanceof ErrorEvent ? reason.message : reason instanceof Error ? reason.message : String(reason);
  loading.textContent = `DS Universe failed to load: ${message}`;
}
window.addEventListener('error', (e) => showFatalError(e));
window.addEventListener('unhandledrejection', (e) => showFatalError(e.reason));

const canvas = mustFind<HTMLCanvasElement>('#scene');
const overlay = mustFind<HTMLDivElement>('#overlay');
const { ctx, vw, vh, onResize } = createCanvas(canvas);

const camera = new Camera(vw, vh);
onResize((newVw, newVh) => {
  camera.vw = newVw;
  camera.vh = newVh;
});

const starfield = createStarfield();
const bodies = buildScene();
const bodyById = new Map(bodies.map((b) => [b.id, b]));
const tabOrder = bodyTabOrder(bodies);
const picking = new Picking();

const tooltip = createTooltip();
const statusAnnouncer = createStatusAnnouncer(mustFind('#a11y-status'));
populateSummary(mustFind('#a11y-summary'), bodies);

// Single source of truth for "what's currently pointed at", whether by a real mouse hover or a
// keyboard focus/cursor move (render/labels.ts's focus/blur, or engine/input.ts's Left/Right moon
// cursor) — feeds the tooltip, the on-canvas glow (render/draw.ts's Highlight) and the screen
// reader live region together, so all three always agree.
let highlight: Highlight = {};

// Orbital motion holds as soon as anything is highlighted (desktop hover, mobile first tap, or
// keyboard focus) and stays held even once the hover/focus moves off — deliberately *not* tied
// to `highlight` itself, which clears on every ordinary hover-off. Only an explicit "away" action
// (click/tap on empty space, zoom out, Esc/back to the universe) releases it — see
// clearMotionHold and its call sites below.
let motionHeld = false;

function clearMotionHold(): void {
  motionHeld = false;
}

function setHighlight(
  bodyId: string | null,
  entryId: string | undefined,
  clientX?: number,
  clientY?: number,
  source: 'mouse' | 'touch' = 'mouse',
): void {
  highlight = bodyId ? { bodyId, ...(entryId !== undefined ? { entryId } : {}) } : {};
  if (bodyId && clientX !== undefined && clientY !== undefined) {
    tooltip.show(bodyId, entryId, clientX, clientY, source);
  } else if (!bodyId) {
    tooltip.hide();
  }
  if (bodyId) motionHeld = true;
  statusAnnouncer.update(bodyId, entryId);
}

const labels = createLabelLayer(overlay, {
  onActivate: (id) => goToBody(id),
  onFocusChange: (id, anchor) => {
    if (id && anchor) {
      setHighlight(id, undefined, anchor.left + anchor.width / 2, anchor.bottom);
    } else {
      setHighlight(null, undefined);
      // A blur with no `id` means keyboard focus left this label; if nothing else claims focus
      // right after (the usual case is Tab landing on the *next* label, which re-holds via
      // setHighlight above before this fires), the user has Tabbed out of the map entirely. With
      // no highlight left on screen and no mouse-driven "click empty space" available to a
      // keyboard-only user, releasing here is the only way the hold doesn't stay stuck forever.
      window.setTimeout(() => {
        if (!(document.activeElement instanceof HTMLElement && document.activeElement.classList.contains('body-label'))) {
          clearMotionHold();
        }
      }, 0);
    }
  },
  isEntered: (id) => picking.view.level !== 'universe' && picking.view.bodyId === id,
});
const breadcrumb = createBreadcrumb({ onRoot: goHome, onBody: goToBody });
const guide = createGuide(mustFind('#guide'), { onGoToBody: goToBody, onGoToEntry: focusEntry });
const card = createCard(mustFind('#card'), {
  onRelated: focusEntry,
  onClose: goBack,
});

// Search and the advisor (Phase 4) take turns rendering into the shared `#modal` element — see
// ui/search.ts's header for why that's safe. toggleSearch/toggleAdvisor below make sure only
// one is ever open by closing the other first.
const searchIndex = buildIndex(entries.values());
const search = createSearch(mustFind('#modal'), searchIndex, { onSelect: focusEntry });
const advisor = createAdvisor(mustFind('#modal'), searchIndex, { onSelect: focusEntry });

function toggleSearch(): void {
  advisor.close();
  search.toggle();
}
function toggleAdvisor(): void {
  search.close();
  advisor.toggle();
}

// ui/toolbar.ts's search box/button always *opens* the palette (never toggles it closed) — a
// second click on a visible toolbar control reads as "open this", not "close whatever's open".
function openSearchFromToolbar(): void {
  advisor.close();
  search.open();
}

createToolbar({ onSearch: openSearchFromToolbar, onAdvisor: toggleAdvisor, onGuide: () => guide.toggle() });

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

function findMoon(entryId: string) {
  for (const body of bodies) {
    const moon = body.moons.find((m) => m.id === entryId);
    if (moon) return { body, moon };
  }
  return undefined;
}

/** Reflects the current ViewState in both the breadcrumb and the URL hash (deep links —
 *  PLAN.md Phase 5), so every navigation function below stays shareable/bookmarkable for free.
 *  Only pushes a new history entry when the hash actually changes: restoreFromHash() below calls
 *  the same navigation functions to apply a hash the browser already navigated to (a fresh load,
 *  or back/forward), and re-pushing an identical hash would create a redundant history entry. */
function syncView(): void {
  breadcrumb.update(picking.view);
  const next = hashFor(picking.view);
  if (location.hash !== next) history.pushState(null, '', next);
}

function goHome(): void {
  picking.reset();
  card.close();
  flyHome();
  clearMotionHold();
  syncView();
}

function goToBody(bodyId: string): void {
  const body = bodyById.get(bodyId);
  if (!body) return;
  picking.enterBody(bodyId);
  card.close();
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, 140 / Math.max(body.radius, 10)));
  camera.flyTo(body.wx, body.wy, zoom, reduceMotion ? 0 : undefined);
  syncView();
}

function goBack(): void {
  if (guide.isOpen()) {
    guide.close();
    return;
  }
  picking.back();
  if (picking.view.level === 'universe') {
    card.close();
    flyHome();
    clearMotionHold();
  } else if (picking.view.level === 'body') {
    card.close();
  }
  syncView();
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
  syncView();
}

/** Applies whatever `location.hash` currently says — a fresh page load with a deep link, or the
 *  browser's back/forward buttons (popstate). A body id that doesn't resolve falls back to the
 *  full map; an entry id that doesn't resolve falls back to just its body — both are announced
 *  via the screen-reader live region (ui/a11y-status.ts) rather than failing silently, since
 *  there's no dedicated toast UI for a one-off bad/stale link. */
function restoreFromHash(): void {
  const parsed = parseHash(location.hash);
  if (!parsed) {
    goHome();
    return;
  }

  const body = bodyById.get(parsed.bodyId);
  if (!body) {
    statusAnnouncer.announce("That link wasn't found — showing the full map instead.");
    goHome();
    return;
  }

  if (parsed.entryId) {
    const moon = findMoon(parsed.entryId);
    if (moon && moon.body.id === body.id) {
      focusEntry(parsed.entryId);
      return;
    }
    statusAnnouncer.announce(`That algorithm wasn't found — showing ${body.name} instead.`);
  }
  goToBody(body.id);
}

attachInput(canvas, camera, bodies, {
  onSelectBody: goToBody,
  onSelectEntry: (_bodyId, entryId) => focusEntry(entryId),
  onBack: goBack,
  onReset: goHome,
  onToggleSearch: toggleSearch,
  onToggleAdvisor: toggleAdvisor,
  onToggleHelp: () => guide.toggle(),
  onHover: setHighlight,
  onClearHighlight: clearMotionHold,
  getFocusBodyId: () => (picking.view.level === 'universe' ? undefined : picking.view.bodyId),
  getFocusEntryId: () => (picking.view.level === 'detail' ? picking.view.entryId : undefined),
});

// Instant baseline framing, then restoreFromHash() flies from there to a deep link if the URL
// has one — for the common no-hash case this is a no-op tween (same target both times), so a
// fresh load still lands instantly, but a shared link gets a brief "here's the whole map, now
// here's what was linked" flight instead of teleporting straight into a deep zoom with no context.
flyHome(0);
restoreFromHash();
window.addEventListener('popstate', restoreFromHash);

let clock = 0; // elapsed time fed to time-driven visuals (twinkle, pulse, gas drift) — frozen
// under reduced motion, and while the card is open, instead of advancing every frame.

startLoop((dt, t) => {
  // Positions (orbital motion) additionally freeze while anything is highlighted — a desktop
  // hover or a mobile first tap — so the target a tooltip is pointing at doesn't drift out from
  // under a second click/tap. Visuals (twinkle, star pulse, gas drift) keep going regardless:
  // gating them on highlight too would make the whole scene read as dead the moment something is
  // hovered, which is not the ask — only orbital drift is the problem. See setHighlight/
  // clearHighlightHold below for what sets/releases motionHeld.
  const visualsMoving = !reduceMotion && !card.isOpen();
  const positionsMoving = visualsMoving && !motionHeld;
  camera.update(reduceMotion ? 0 : dt);
  // Zoomed-in bodies/moons ease toward near-stationary (motionTimeScale) so they don't drift out
  // of frame before they can be clicked; the card-open/reduced-motion/highlight freezes above
  // still win outright via `paused` regardless of zoom.
  updateScene(bodies, dt * motionTimeScale(camera.zoom), !positionsMoving);
  if (visualsMoving) clock = t;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, camera.vw, camera.vh);
  starfield.draw(ctx, camera, clock);
  drawScene(ctx, camera, bodies, clock, highlight);

  labels.update(
    camera,
    bodies.map((body) => ({
      id: body.id,
      name: body.name,
      wx: body.wx,
      wy: body.wy,
      priority: body.type === 'star' ? 1000 : body.radius,
      tabIndex: tabOrder.get(body.id) ?? 0,
    })),
  );

  if (!appReady) {
    appReady = true;
    document.getElementById('loading')?.remove();
  }
});
