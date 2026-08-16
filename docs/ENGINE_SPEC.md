# DS Universe — Engine & Design Specification

Companion to [PLAN.md](../PLAN.md). Read **§8 (coordinate systems)** and **§9 (module
contracts)** before writing any engine code.

Values here are **starting values to implement literally**, not suggestions to interpret. Tune
them by eye later; begin with exactly these numbers.

---

## 1. Scene constants

All of these live in `src/engine/constants.ts` (already written). Import from there — do not
scatter magic numbers through render code.

```ts
export const TILT = 0.55;              // orbit y-squash for the 3/4 orrery view
export const ZOOM_MIN = 0.08;
export const ZOOM_MAX = 6.0;
export const ZOOM_STEP = 1.12;         // per wheel notch
export const CAM_TWEEN_MS = 900;
export const MIN_PICK_PX = 14;         // smallest clickable radius on screen
export const HOVER_IN_MS = 150;
export const HOVER_OUT_MS = 80;
export const DT_CLAMP = 0.05;          // max delta-time in seconds per frame
export const DPR_CAP = 2;
export const BG = '#05060d';
export const BASE_PERIOD_S = 180;      // Mercury's orbital period
export const STAR_LAYERS = [
  { count: 700, parallax: 0.15, size: [0.6, 1.2], alpha: [0.25, 0.55] },
  { count: 320, parallax: 0.40, size: [0.9, 1.8], alpha: [0.35, 0.75] },
  { count: 140, parallax: 0.80, size: [1.2, 2.6], alpha: [0.50, 0.95] },
] as const;
export const SEED_STARFIELD = 0x5eed_1a2b;
export const SEED_BELT = 0x5eed_c0de;
export const MOBILE_BREAKPOINT = 860;
```

---

## 2. Visual language

**Background.** Fill `BG`. Then two additive radial gradients at very low alpha (≤0.10): warm
amber centred on Sol, cool violet centred on Nova. They meet in a desaturated band in the transit.

**Starfield.** Three layers per `STAR_LAYERS`. Each layer is generated **once** into an
`OffscreenCanvas` and blitted per frame at `-camera.x * parallax`, wrapping modulo the tile size.
Do not re-draw individual stars every frame. Twinkle by modulating **layer** alpha with
`0.9 + 0.1 * sin(t * rate + phase)` — not per star.

**Orbits.** 1px hairline at `rgba(255,255,255,0.08)`, rising to `0.25` when its body is hovered.
The tilt is baked into the orbital *path*, not the camera transform — see §8.

**Bodies.** Procedural, no image assets:

- Radial gradient whose focus is offset ~35% of the radius toward the illuminating star
  (`litBy: 'sol' | 'nova'`), from a light tint of the body hue to a near-black shadow side.
- Rim light: a 2px arc at ~25% alpha along the lit limb.
- Glow: additive radial gradient, radius `1.8 * r`, alpha 0.12 → 0.30 on hover.
- Gas giants (Jupiter, Genesis): 3–4 horizontal bands from a cheap 1D value-noise, slowly
  drifting. Clip to the disc.
- Saturn: two ellipses with a Cassini gap; draw the back half, then the disc, then the front
  half, so occlusion reads correctly.
- Belt: `rockCount` rocks at jittered radius and phase, 1–2px, generated once with the **seeded**
  RNG so they don't jump between frames or reloads.
- Stars: 3 layered additive radial gradients + 4 flare spikes, alpha pulsing on a ~4s sine.

**Orbital motion.** Angular speed ∝ `1 / sqrt(orbitRadius)` (Kepler-ish), scaled so Mercury's
period is `BASE_PERIOD_S`. **Freeze all motion when a card is open** and when
`prefers-reduced-motion: reduce` is set.

**Colour.** Hue encodes region: inner amber→rust · Belt/Pallas slate · mid teal→green · transit
violet→magenta · Nova system cyan→white-blue. Exact values are tokens in
`src/styles/tokens.css`; renderers can build colours from the `--hue-*` numbers.

**Typography.** System stack only, no web fonts. Body copy max 68ch (`--measure`).

**Labels are HTML, not canvas text.** Absolutely positioned overlay divs in `#overlay`, moved
with `transform: translate3d(...)` only. Keeps them crisp at any DPR, selectable, and in the
accessibility tree. Never `ctx.fillText` a body label.

---

## 3. Interaction model

Three states. The state machine lives in `engine/picking.ts`; the UI reads it.

| State | Shows | Entered by |
|---|---|---|
| `universe` | Both stars, all orbits, all bodies labelled | default; `Esc` from `body`; double-click empty |
| `body` | Camera framed on one body, moons faded in, siblings dimmed | click body; search result; breadcrumb |
| `detail` | As `body`, plus card open, target moon ringed | click moon; in-card cross-link |

- **Hover:** `HOVER_IN_MS` in, `HOVER_OUT_MS` out. Body scales 1.06×, glow up, its orbit
  brightens, tooltip near cursor (name, hook, moon count, era range, `↵ enter`).
- **Click body** → camera tweens `CAM_TWEEN_MS` with `var(--ease-fly)` to frame it; moons stagger
  in over 400ms; card opens right.
- **Click moon** → card crossfades to that entry (180ms); moon gets a selection ring.
- **Pan** = drag. **Zoom** = wheel/pinch, anchored at cursor (§8 — get this exactly right).
- **Breadcrumb** top-left, each segment clickable.
- **Keyboard:** `/` search · `A` advisor · `?` help · `Esc` back one level · `Tab` cycles bodies
  in orbital order · `↵` enter · `←/→` previous/next sibling moon · `D` dev FPS overlay.
- **Mobile** (< `MOBILE_BREAKPOINT`): card becomes a bottom sheet at 85vh with a drag handle;
  first tap shows tooltip, second enters; pinch-zoom; labels thin by priority on collision.

---

## 4. The card

Right panel `--card-w` (bottom sheet on mobile). `backdrop-filter: blur(20px)` over
`--bg-raised`, 1px border tinted to the parent body hue, 2px accent bar on the top edge. Scrolls
internally, header sticky.

Sections, in this order:

0. **Header** — name, aliases, one-line definition, chips: task type, supervised/unsupervised,
   year, difficulty (1–5 dots), tier badge.
1. **Intuition** *(open)* — plain language + analogy, no notation.
2. **How it works** *(open)* — numbered steps + hyperparameter table (`what` / `how to tune`).
3. **When to use / When it fails** *(open)* — two columns. **Also the advisor's source data.**
4. **The math** *(collapsed)* — loss, update rule, complexity. KaTeX, rendered lazily on expand.
5. **In code** *(collapsed)* — ~15 lines of Python.
6. **Go deeper** — 🌐 free texts · 📄 papers · 📖 books · 🎥 video.
7. **Related** — chips; clicking flies the camera *and* swaps the card.

---

## 5. Search & advisor

**Search** (`/`): palette over all entries; fuzzy on name/aliases/hook; grouped by body;
arrow-key navigable; selecting flies the camera and opens the card.

**Advisor** (`A`): free-text "Describe your problem…" → 3–5 ranked algorithms, each with its
**authored** pros/cons and a "why this matched" line.

*Phase 4, lexical — ships first, always fast:*

1. Tokenize and normalize the query.
2. Expand via `src/data/lexicon.ts` (`churn` → `{classification, imbalanced, tabular,
   interpretable}`, `images` → `{image, vision}`, `explain to my boss` → `{interpretable}`).
3. BM25 over per-entry search docs (name + aliases + hook + intuition + whenToUse + facets).
4. Boost by facet agreement.
5. Return top-N with authored pros/cons and matched facets.

*Phase 7, semantic — an upgrade, never a dependency:* precomputed entry embeddings plus a
lazy-loaded MiniLM reranking the top 30 lexical hits. **If the model fails to load, lexical
results stand unchanged.** The advisor must never block on a ~23MB download.

The modal states plainly that this is a starting point, not a substitute for validating on your
own data. Every result carries cons.

---

## 6. File layout

```
DS_universe/
  index.html   package.json   vite.config.ts   tsconfig.json   .gitignore
  README.md    PLAN.md    docs/ENGINE_SPEC.md    docs/CONTENT_GUIDE.md
  .claude/launch.json
  .github/workflows/deploy.yml
  src/
    main.ts                     # thin bootstrap, ~80 lines
    types/content.ts            # THE schema — single source of truth
    engine/
      constants.ts  canvas.ts  camera.ts  scene.ts  picking.ts  input.ts  rng.ts
      render/ starfield.ts  star.ts  planet.ts  orbit.ts  belt.ts  rings.ts  labels.ts
    ui/  tooltip.ts  card.ts  breadcrumb.ts  search.ts  advisor.ts  help.ts
    data/ registry.ts  search-index.ts  lexicon.ts  semantic.ts
    content/
      system.ts
      bodies/ sol.ts mercury.ts venus.ts terra.ts mars.ts belt.ts pallas.ts jupiter.ts
              saturn.ts uranus.ts neptune.ts chronos.ts prometheus.ts vulcan.ts echo.ts
              chimera.ts arachne.ts odyssey.ts nova.ts babel.ts genesis.ts forge.ts
              velocity.ts athenaeum.ts daedalus.ts iris.ts aegis.ts
    styles/ tokens.css  main.css  card.css  overlay.css
  tools/ validate-content.ts  check-links.ts  build-embeddings.ts
  tests/ search-index.test.ts  advisor.test.ts  camera.test.ts
```

**One file per body** so content parallelizes: two agents can write `jupiter.ts` and `forge.ts`
with zero conflict. `registry.ts` auto-discovers via
`import.meta.glob('../content/bodies/*.ts', { eager: true })` — adding a file plus a `system.ts`
entry makes a planet appear, with HMR.

**Tooling runs bare.** Node 24 strips TypeScript types natively, so
`node tools/validate-content.ts` just works. No `tsx`, no `ts-node`. Tools import
`src/types/content.ts`, so the validator and the app cannot drift apart.

---

## 7. The content schema

**Content is authored as `.ts` modules using `satisfies`, not `.json`.** With facet values as
string-literal unions, the editor autocompletes valid facets while authoring and `tsc` catches a
typo'd tag, a missing field, or a malformed entry. Across 222 hand-written entries this is the
difference between a schema that holds and one that silently rots — and a bad facet degrades
advisor ranking *invisibly*, the worst kind of bug to find late.

```ts
// src/types/content.ts
export type Task = 'regression' | 'classification' | 'clustering' | 'dimensionality-reduction'
  | 'anomaly-detection' | 'forecasting' | 'generation' | 'ranking' | 'control'
  | 'representation' | 'inference' | 'retrieval';
export type DataType = 'tabular' | 'text' | 'image' | 'audio' | 'video' | 'graph'
  | 'timeseries' | 'spatial' | 'multimodal';
export type DataSize = 'tiny' | 'small' | 'medium' | 'large' | 'massive';
export type Level = 'low' | 'medium' | 'high';

export interface Facets {
  task: Task[];
  dataType: DataType[];
  dataSize: DataSize[];
  interpretability: Level;
  trainingCost: Level;
  needsScaling: boolean;
  handlesMissing: boolean;
  handlesCategorical: boolean;
  outputType: string;
}

export interface Ref { title: string; url: string }
export interface BookRef { title: string; author: string; chapter?: string; url?: string }

export interface Entry {
  id: string;                 // kebab-case, globally unique
  name: string;
  aliases?: string[];
  tier: 1 | 2;
  year: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  hook: string;               // ONE sentence, <=120 chars, shown on hover
  intuition: string;          // plain language, no notation
  howItWorks: { summary: string; steps: string[] };
  hyperparameters?: { name: string; what: string; tuning: string }[];
  whenToUse: string[];        // <- advisor source of truth
  whenNotToUse: string[];     // <- advisor source of truth
  facets: Facets;
  math?: { latex: string[]; notes?: string };
  complexity?: { train: string; predict: string };
  code?: string;
  related: string[];          // ids; must resolve
  references: {
    free?: Ref[]; papers?: (Ref & { year: number })[]; books?: BookRef[]; video?: Ref[];
  };
}

export interface Body {
  id: string; name: string; segment: string; hook: string;
  summary: string; eraRange: [number, number];
  moons: Entry[];
}
```

**Tier rules, enforced by `tools/validate-content.ts`:**

- **Tier 1** requires `intuition`, `howItWorks` (≥3 steps), `whenToUse` (≥2), `whenNotToUse`
  (≥2), `facets`, `related` (≥2), and **all four** reference categories with ≥1 entry each.
- **Tier 2** requires `hook`, `intuition`, `facets`, `related` (≥1), and ≥2 references total.

These are the validator's *array-length minimums*, not the full list of fields a Tier 2 entry
carries. `howItWorks`, `whenToUse` and `whenNotToUse` are required by the `Entry` type itself on
every entry regardless of tier, so `tsc` enforces their presence and the validator has nothing
left to check. A Tier 2 entry is short, not partial — see
[CONTENT_GUIDE §4 "Tier 2 stubs"](CONTENT_GUIDE.md#tier-2-stubs) for what to write in them.

`src/content/system.ts` holds *placement*, separate from pedagogy:

```ts
export const system = {
  stars: [
    { id: 'sol',  name: 'Sol',  at: [0, 0] as const,    hue: 42,  radius: 46 },
    { id: 'nova', name: 'Nova', at: [4200, 0] as const, hue: 194, radius: 38 },
  ],
  bodies: [
    { id: 'mercury', orbitRadius: 320, phase: 0.15, radius: 16, hue: 40,
      litBy: 'sol', type: 'planet' },
    { id: 'belt', orbitRadius: 1180, phase: 0, radius: 0, hue: 210,
      litBy: 'sol', type: 'belt', rockCount: 240 },
  ],
} as const;
```

**What `tsc` cannot catch — so the validator must:** duplicate ids across bodies, `related` ids
pointing at nothing, tier completeness, and every `system.ts` body having a content module.

---

## 8. Coordinate systems — read this before touching the engine

**This is the single largest source of bugs in canvas apps. Get it right once.**

Three spaces. Name variables so you always know which you're in: `wx/wy` world, `sx/sy` screen.

1. **World space** — the fictional universe. Sol at `(0,0)`, Nova at `(4200,0)`. Units arbitrary.
   Body positions, orbit radii and hit-testing all live here.
2. **Screen space** — CSS pixels within the canvas element. What the user points at.
3. **Device space** — physical pixels. **Only `canvas.ts` ever thinks about this.**

### The tilt goes in the path, not the camera

**The y-squash is baked into the orbital path, in world space. It is NOT part of the camera
transform.** Put it in the camera and every planet renders as an ellipse instead of a circle.
Orbits look tilted because their *paths* are elliptical; bodies stay round.

```ts
// engine/scene.ts — orbital position, WORLD space
export function orbitPos(cx: number, cy: number, r: number, theta: number) {
  return { wx: cx + r * Math.cos(theta), wy: cy + r * Math.sin(theta) * TILT };
}
```

### The camera transform is uniform in both axes

```ts
// engine/camera.ts
worldToScreen(wx, wy) {
  return { sx: (wx - this.x) * this.zoom + this.vw / 2,
           sy: (wy - this.y) * this.zoom + this.vh / 2 };
}
screenToWorld(sx, sy) {
  return { wx: (sx - this.vw / 2) / this.zoom + this.x,
           wy: (sy - this.vh / 2) / this.zoom + this.y };
}
```

`vw`/`vh` are the canvas size in **CSS pixels**, never device pixels.

### Zoom-to-cursor

Keep the world point under the cursor fixed. Implement exactly this — do not derive your own:

```ts
zoomAt(sx: number, sy: number, factor: number) {
  const before = this.screenToWorld(sx, sy);
  this.zoom = clamp(this.zoom * factor, ZOOM_MIN, ZOOM_MAX);
  const after = this.screenToWorld(sx, sy);
  this.x += before.wx - after.wx;
  this.y += before.wy - after.wy;
}
```

### Hit-testing

In world space, but the minimum pick radius is defined in screen pixels so tiny distant bodies
stay clickable:

```ts
const pickR = Math.max(body.radius, MIN_PICK_PX / camera.zoom);
const hit = (wx - body.wx) ** 2 + (wy - body.wy) ** 2 <= pickR ** 2;
```

### DPR handling lives only in `canvas.ts`

```ts
export function resize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // all render code now draws in CSS pixels
  return { vw: w, vh: h };
}
```

**Consequence — render code must never call `setTransform`.** It would clobber the DPR scale. If
a renderer needs a transform, `ctx.save()` → `translate/rotate/scale` → `ctx.restore()`. Every
`save()` gets a matching `restore()` on every path, including early returns.

---

## 9. Module contracts

Implement these signatures. Do not invent different ones.

```ts
// engine/canvas.ts
export function createCanvas(el: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D; vw: number; vh: number;
  onResize(cb: (vw: number, vh: number) => void): void;
};
export function startLoop(fn: (dt: number, t: number) => void): () => void;  // returns stop()

// engine/camera.ts
export class Camera {
  x: number; y: number; zoom: number; vw: number; vh: number;
  worldToScreen(wx: number, wy: number): { sx: number; sy: number };
  screenToWorld(sx: number, sy: number): { wx: number; wy: number };
  zoomAt(sx: number, sy: number, factor: number): void;
  panBy(dxScreen: number, dyScreen: number): void;
  flyTo(wx: number, wy: number, zoom: number, ms?: number): void;
  update(dt: number): void;          // advances any active tween
  get isTweening(): boolean;
}

// engine/rng.ts — seeded, so belts and starfields are stable across reloads
export function mulberry32(seed: number): () => number;

// engine/scene.ts
export interface SceneBody {
  id: string; type: 'star' | 'planet' | 'belt'; wx: number; wy: number;
  radius: number; hue: number; litBy: 'sol' | 'nova';
  orbitRadius: number; theta: number; speed: number;
  moons: SceneMoon[]; data: Body;
}
export function buildScene(): SceneBody[];
export function updateScene(bodies: SceneBody[], dt: number, paused: boolean): void;

// engine/picking.ts
export type ViewState =
  | { level: 'universe' }
  | { level: 'body'; bodyId: string }
  | { level: 'detail'; bodyId: string; entryId: string };
export function hitTest(bodies: SceneBody[], cam: Camera, sx: number, sy: number)
  : { bodyId: string; entryId?: string } | null;

// data/registry.ts
export const bodies: ReadonlyMap<string, Body>;
export const entries: ReadonlyMap<string, Entry>;     // flat, by id
export function entryBody(entryId: string): Body | undefined;

// data/search-index.ts
export function buildIndex(entries: Iterable<Entry>): SearchIndex;
export function search(idx: SearchIndex, query: string, limit?: number)
  : { entry: Entry; score: number; matched: string[] }[];
```

---

## 10. Canvas pitfalls — check these when something looks wrong

- **Unbalanced `save()`/`restore()`** → state leaks into later draws and everything downstream in
  the frame goes wrong. Check this first when rendering looks bizarre.
- **Allocating in the render loop** — `new`, object literals, array `map`/`filter` per frame.
  Causes GC stutter. Hoist buffers; mutate in place.
- **Creating gradients every frame** — `createRadialGradient` is not free. Cache per body,
  invalidate only on radius/hue/zoom-bucket change.
- **Forgetting `dt` clamping** — background the tab, return, get a 12-second `dt`, and every body
  teleports. `DT_CLAMP` exists for this.
- **Mixing CSS and device pixels** in mouse coordinates. `getBoundingClientRect()` gives CSS
  pixels; use those, since `ctx` is already DPR-scaled.
- **Not removing listeners** on teardown. Return a disposer from anything that adds one.
- **`ctx.filter = 'blur()'`** for glow — catastrophically slow. Use layered radial gradients.
- **Reading `canvas.width` expecting CSS pixels.** It's device pixels. Use `clientWidth`.
- **Wheel events without `preventDefault`** → the page scrolls behind your zoom. The listener
  must be registered `{ passive: false }`.
- **Hover flicker** — hit-testing against a body whose position moved this frame. Hit-test
  against the same positions you rendered, i.e. after `updateScene`, not before.

---

## 11. Performance budget

One canvas, one RAF loop, no per-frame allocation in hot paths. Starfield pre-rendered offscreen
and blitted. Cull bodies outside the viewport before drawing. Label overlay updates `transform`
only — never `top`/`left`/`width`, which trigger layout.

**Target: 60fps at 1440p** with all 27 bodies and one expanded planet's moons visible.

**Bundle:** 222 entries eagerly imported ≈ 450KB raw / ~120KB gzipped. Start eager. If it passes
~200KB gzipped, switch `registry.ts` to lazy `import.meta.glob` (Vite splits one chunk per body)
and generate a slim search index at build time so search still covers everything.

---

## 12. Running it

```bash
npm install
```

```bash
npm run dev
```

The dev server serves at **`http://localhost:5173/DS_universe/`** — the base path is part of the
URL, because `base` is set for GitHub Pages.

Scripts: `dev` · `build` (typecheck + build to `dist/`) · `preview` · `validate` · `check-links` ·
`test` · `test:watch`.
