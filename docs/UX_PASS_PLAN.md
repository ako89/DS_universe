# UX pass: mobile taps, starfield, wayfinding, guide, search

Execution plan for five user-reported issues. Written to be executed top-to-bottom; each task
lists the exact files to touch and the acceptance check that proves it done.

Ground rules from [PLAN.md §0](../PLAN.md) still apply — in particular: **no invented facts**.
Every algorithm-family name used here already exists in the repo (`system.ts`'s `segment`,
`content/bodies/*.ts`'s `Body.segment`, or PLAN.md §3). Do not author new pedagogical claims.

Setup: `npm install` first (no `node_modules` in a fresh clone). Validate with
`npm test && npm run validate && npm run build` before each commit.

---

## Decisions already made (do not re-litigate)

| # | Question | Decision |
|---|---|---|
| 1 | Mobile tap model | **Keep tap-to-preview.** First tap previews, second tap on the same target opens. Fix the reliability bugs underneath it. |
| 3 | Group names on labels | **Two lines**: body name on top, full `segment` beneath in smaller, dimmer text. |
| 4 | Guide location | **Expand the existing `?` overlay into a "Guide"**, with the keyboard-shortcut table as its final section. |
| 5 | Search affordance | **Always-visible search input on desktop; magnifier icon on mobile.** Advisor and Guide get icon buttons alongside. |

---

## Task 1 — Mobile: make the two-tap gesture actually work

**Symptom:** on a phone, tapping a planet or moon does nothing; the card never opens.

**Root cause — three independent bugs in `src/engine/input.ts`, all in the same path.** Confirm
each before fixing; do not fix by rewriting the module.

### 1a. Touch input is handled twice, so every tap pans the camera

`attachInput` registers *both* pointer handlers (`pointerdown`/`pointermove`/`pointerup`, lines
~275-283) and touch handlers (`touchstart`/`touchmove`/`touchend`). On a touchscreen a single
finger fires **both** streams. `onPointerMove`'s drag branch calls `camera.panBy(dx, dy)` and
`onTouchMove`'s single-finger branch calls `camera.panBy(...)` for the same movement — so
one-finger panning runs at 2× speed, and, worse, `onTouchMove` applies **no drag threshold at
all**: a 1-2px finger tremor during a tap pans the scene before the tap is resolved.

**Fix:** make the two streams non-overlapping. Keep `touchstart`/`touchmove`/`touchend` for
**pinch-zoom only** (the two-finger branch) and delete the single-finger pan branch from
`onTouchMove` — pointer events already handle single-finger pan. Guard the pinch path so that
while `e.touches.length === 2` the pointer-drag path is suppressed (a `pinching` flag checked at
the top of `onPointerMove`/`onPointerUp`), otherwise a two-finger pinch also drags.

### 1b. The drag/tap threshold is measured per-frame, not from the touch start

`onPointerMove` compares each *incremental* delta against `CLICK_DRAG_THRESHOLD_PX`:

```ts
if (Math.abs(dx) > CLICK_DRAG_THRESHOLD_PX || Math.abs(dy) > CLICK_DRAG_THRESHOLD_PX) dragMoved = true;
```

This is wrong in both directions. A slow 200px drag delivered in 1px steps never trips it and is
treated as a click; a single 5px jitter spike during a stationary tap trips it and the tap is
discarded at `if (dragMoved) return;` in `onPointerUp`. Touch reliably produces the second case.

**Fix:** track the pointer-down origin (`startX`/`startY`) and set `dragMoved` from the
**cumulative** distance `Math.hypot(e.clientX - startX, e.clientY - startY)`. Keep panning driven
by the per-frame delta as it is today — only the tap/drag classification changes. Raise the
threshold for touch: a finger needs roughly `10px`, a mouse `4px`. Suggested shape:

```ts
const CLICK_DRAG_THRESHOLD_PX = 4;
const TOUCH_DRAG_THRESHOLD_PX = 10;
```

selecting per `e.pointerType`.

### 1c. The second tap misses, because the target has orbited away

Even with 1a and 1b fixed, `onPointerUp`'s touch branch requires the second tap to resolve to the
*same* `{bodyId, entryId}` the first tap did:

```ts
const alreadyHovered = hit !== null && hit.bodyId === hoveredId && (hit.entryId ?? null) === hoveredEntryId;
```

Nothing freezes the scene between the two taps. At the whole-system framing `motionTimeScale` is
1.0, so bodies and (much faster, `MOON_BASE_PERIOD_S = 20`) moons keep orbiting. With
`MIN_PICK_PX = 14`, a moon can easily leave its own pick radius in the ~400ms between two taps —
the second tap resolves to `null` or a neighbour, `alreadyHovered` is false, and the code just
re-previews. Repeat forever. **This is the loop the user is stuck in.**

**Fix — two parts:**

1. **Freeze the target while a touch preview is live.** After a preview tap, hold the scene
   still so the second tap has something stationary to hit. Add a "preview hold" to `main.ts`:
   while a touch-originated highlight is active, pass `paused = true` to `updateScene` (the same
   mechanism `card.isOpen()` already uses in the `startLoop` callback). Expire the hold on a
   timeout (~4s), on the second tap, or on a tap that lands on empty space.
2. **Make the second tap forgiving.** Instead of requiring an exact re-hit, treat a second tap
   within a small screen radius (~`MIN_PICK_PX * 1.5`) of the *currently previewed* target's
   screen position as a hit on that target, even if the strict `hitTest` missed. Implement this
   as a fallback inside the touch branch of `onPointerUp`, not by loosening `hitTest` itself
   (which desktop hover shares).

### 1d. Also fix while you are in here

- **No `pointercancel` handler.** iOS Safari reclaims touches and fires `pointercancel` with no
  `pointerup`, leaving `dragging = true` and the canvas stuck in `is-dragging`. Add a
  `pointercancel` listener that resets `dragging`/`dragMoved` and removes the class. Register and
  unregister it symmetrically in `detach()`.
- **`releasePointerCapture` can throw** if the pointer is already gone. Wrap it, or guard on
  `canvas.hasPointerCapture(e.pointerId)`.
- **The tooltip says `↵ enter`** (`src/ui/tooltip.ts`, `render()`) — meaningless on touch. When
  the highlight came from a touch, render "tap again to open" instead. Thread a source flag
  through `show()` rather than sniffing the user agent.
- **Tooltip placement on touch** puts the panel under the user's finger. When the source is
  touch, offset it *above* the touch point (`clientY - height - CURSOR_OFFSET_PX`) so the target
  stays visible for the second tap.

### Acceptance

Verify in a real touch context, not by reading the diff. Use the pre-installed Chromium via
Playwright with touch emulation (`hasTouch: true`, iPhone-sized viewport), driving
`page.touchscreen.tap()`:

1. Two taps on Jupiter fly the camera in; moons become visible.
2. Two taps on a moon open the card as a bottom sheet.
3. A one-finger drag pans at the same speed the pointer delta implies (not 2×).
4. A tap with ≤8px of jitter still counts as a tap.
5. Two-finger pinch zooms and does not also pan.

Add a regression test under `tests/` for the pure logic you can isolate (the cumulative-distance
tap classifier, and the second-tap proximity fallback). Do not try to unit-test the whole
`attachInput` event soup.

---

## Task 2 — Dim the starfield, make Sol and Nova dominate

**Correction to the premise, stated plainly:** the starfield has **never been dimmed** in this
repo. `STAR_LAYERS` in `src/engine/constants.ts` still holds its original Phase 0 values. The
earlier change the user is likely remembering went the other way — commit `994fb59` made *Sol and
Nova more vivid* (see the comment in `src/render/star.ts`), it did not touch the background. So
this is the first dimming pass, and it can be aggressive.

### 2a. Dim and thin the background layers

`src/engine/constants.ts`, `STAR_LAYERS`. Current values and the target:

| Layer | Now | Target |
|---|---|---|
| far | `count: 700, alpha: [0.25, 0.55]` | `count: 520, alpha: [0.10, 0.26]` |
| mid | `count: 320, alpha: [0.35, 0.75]` | `count: 240, alpha: [0.14, 0.34]` |
| near | `count: 140, alpha: [0.50, 0.95]` | `count: 100, alpha: [0.20, 0.46]` |

Roughly a 55% cut in alpha plus a ~25% cut in density. Treat these as a starting point and tune
by eye — the goal is a background that reads as depth, never as content competing for a click.

Also reduce the twinkle amplitude in `src/render/starfield.ts`'s `draw()`: `0.9 + 0.1 * sin(...)`
→ `0.96 + 0.04 * sin(...)`. Motion in the periphery is a large part of what reads as
"distracting", independent of brightness.

### 2b. Make the two stars read as the anchors

`src/render/star.ts`, `buildCache()` / `drawStar()`. Widen and strengthen the corona rather than
growing the star radius (radius is the hit target and the layout anchor — leave
`system.ts` alone):

- `outer` gradient: extend from `r * 4.5` to `r * 6.0`, raise its alpha stop `0.26` → `0.34`.
  Update the matching `ctx.arc(0, 0, r * 4.5, ...)` in `drawStar` to the same radius.
- `mid` gradient: alpha `0.62` → `0.70`.
- `flare` spikes: length `r * 3.2` → `r * 4.2` in both `buildCache` (gradient extent) and
  `drawFlareSpikes` (`length`).

Note `getCache` keys on `radiusBucket` + `hue`; the gradients are rebuilt whenever those change,
so no cache invalidation work is needed beyond editing `buildCache` consistently.

### 2c. Add a halo wash so the starfield recedes near the stars

The single biggest lever for "Sol and Nova stand out". Draw one very soft, large radial gradient
in each star's hue *after* `starfield.draw()` and *before* `drawScene()` in `main.ts`'s loop, so
it sits over the background stars and under the bodies. Put the function in
`src/render/star.ts` (e.g. `drawStarHalo`) and call it from `drawScene` in `src/render/draw.ts`
in a first pass over `body.type === 'star'`, before the main body loop — that keeps `main.ts` a
thin bootstrap per PLAN.md §0 rule 9.

Shape: radius ~`r * 14`, `source-over` (not `lighter`), alpha ~`0.10` at the centre falling to 0,
hue matched to the star. It should be almost imperceptible as a shape and clearly perceptible as
"this region is the centre of something".

### Acceptance

Screenshot the default whole-system framing before and after, at both desktop and mobile
viewport sizes. Sol and Nova must be the first two things the eye lands on. Attach the
before/after to the commit message body or the PR description if one is opened.

---

## Task 3 — Put the algorithm family on every label

**Decision: two lines** — body name on top, full `segment` beneath, smaller and dimmer.

### Where the family name appears, all together

`segment` is *already* rendered in three places, none of them visible before the user commits to
a click — which is the whole complaint. Do not duplicate this work; extend it.

| Surface | Today | After this pass |
|---|---|---|
| Map label | name only | **name + segment (new, 3b)** |
| Tooltip (hover / first-tap preview) | name, hook, meta | **+ segment (new, 3d)** |
| Guide region list | — | **name + segment + moon count (new, Task 4)** |
| Card eyebrow | segment (`card-sections.ts:38`) | unchanged |
| Advisor result eyebrow | segment (`advisor.ts:51`) | unchanged |
| Screen-reader map summary | segment (`a11y-status.ts:41`) | unchanged |
| Breadcrumb | name only | unchanged — it is a short nav trail, not a description |

### 3a. Stars need a segment too

`src/content/system.ts`'s `BodyPlacement` has `segment`; `StarPlacement` does **not**. Both stars
already carry one in their content modules — `src/content/bodies/sol.ts` and `nova.ts` export a
`Body` whose `segment` is `'The Objective'` and `'Attention & Scale'` respectively (matching
PLAN.md §3's `☉ SOL — *The Objective*`). Add `segment: string` to `StarPlacement` and fill it
from those two values. **Transcribe, do not invent.**

Then `src/engine/scene.ts`'s `buildScene()` must set `segment` on the star branch of the scene
push (it currently only sets it in `buildBody`).

### 3b. Render the second line

`src/render/labels.ts`. `LabelTarget` gains `segment?: string`; `main.ts` passes
`body.segment` in the `labels.update(...)` mapping.

In `ensure()`, build two child elements instead of setting `el.textContent`:

```
<div class="body-label" role="button" tabindex="…">
  <span class="body-label-name">Jupiter</span>
  <span class="body-label-segment">Clustering, Density &amp; Anomaly</span>
</div>
```

Set the accessible name explicitly with `aria-label="Jupiter — Clustering, Density & Anomaly"` so
the screen reader gets one coherent string rather than two fragments. Check
`src/ui/a11y-status.ts` and `populateSummary` for whether the segment should be announced there
too; keep them consistent.

**Critical:** the label box is measured **once at creation** (`el.getBoundingClientRect()`), and
that measurement feeds the collision thinner. A two-line label is roughly twice as tall and much
wider, so with no other change the thinner will hide far more labels than it does today. Handle
it explicitly:

- Measure both lines; store `width` (the wider of the two lines) and `height` (both lines).
- **Graceful degradation:** when a label's full two-line box collides with an already-placed
  label but its *name-only* box would not, place it with the segment line hidden (a
  `.is-compact` class setting `display: none` on `.body-label-segment`) rather than hiding the
  label entirely. Store both boxes at creation time so the per-frame path stays measurement-free
  — the file's header comment commits to per-frame updates touching only `transform`, and that
  must stay true.
- The existing focused-label exemption must keep working. Re-read the `display: none` blurs
  focus comment in that file before changing the placement loop.

### 3c. Styles

`src/styles/main.css`, alongside `.body-label`:

- `.body-label` — becomes a flex column, `align-items: center`, `text-align: center`. Drop
  `white-space: nowrap` from the container and apply it per-line, or the segment will wrap
  unpredictably. Consider `max-width: 22ch` on the segment with the two-line-wrap allowed —
  decide by eye against the longest segment, `Dimensionality Reduction & Representation`.
- `.body-label-name` — as `.body-label` reads today (`--fs-xs`, `--text-dim`).
- `.body-label-segment` — smaller and fainter: `font-size: 0.6875rem` (add a `--fs-2xs` token to
  `tokens.css` if you prefer keeping every size in one file, which the file header asks for) and
  `color: var(--text-faint)`. Keep the `text-shadow` on both lines; it is what makes labels
  legible over the starfield.
- On mobile (`@media (max-width: 859px)`), hiding `.body-label-segment` outright is acceptable
  **provided 3d ships** — the first-tap tooltip then carries the family name at the moment it is
  needed, and screen width is scarce. Judge by screenshot; if the labels are legible with both
  lines, keep both.

### 3d. Put the family name in the tooltip

`src/ui/tooltip.ts`'s `describe()` builds the body case as `{title, hook, meta}` where `meta` is
`"${moonCount} moons · ${eraRange}"`. It never shows `segment`. That is the highest-value single
line in this task: on desktop the tooltip is what hover produces, and on mobile — given the
tap-to-preview model kept in Task 1 — the tooltip **is** the preview, the exact moment the user
is deciding whether to tap again.

Add the segment to the body branch. Prefer a dedicated field over stuffing it into `meta`, so the
tooltip can style it like the card's eyebrow rather than like the mono meta line:

```ts
export interface TooltipContent {
  title: string;
  eyebrow?: string;   // the body's segment — its algorithm family
  hook?: string;
  meta: string;
}
```

Read it from `contentBodies.get(bodyId)?.segment`, falling back to the `placement` once
`StarPlacement` gains the field in 3a. Render it above the title with a `.tooltip-eyebrow` class
in `overlay.css`, mirroring `.card-eyebrow`.

Leave the **entry** branch alone — a moon's tooltip already shows its own name, and its parent's
family is one level of context it does not need mid-hover.

`src/ui/a11y-status.ts`'s `createStatusAnnouncer` reuses `describe()` and joins
`[title, hook, meta]`. Add `eyebrow` to that join so the screen reader announces the family too,
or it will silently fall out of sync with what sighted users see.

### Acceptance

At default framing, every visible label shows its family and the map is not a wall of text.
Hovering a body (or first-tapping it on touch) shows its family in the tooltip.
Zoomed in on one body, its label shows both lines. No label overlaps another.

---

## Task 4 — Expand `?` into a Guide

`src/ui/help.ts` currently renders only a `<dl>` of shortcuts into `#help`. Grow it into a
sectioned Guide, keeping the shortcut table as the last section.

Rename the module to `src/ui/guide.ts` (update the import in `main.ts`, and `createHelp` →
`createGuide` / `HelpLayer` → `GuideLayer`). Keep `#help` as the element id, or rename it to
`#guide` in `index.html` — either is fine, just be consistent; `main.ts`'s `mustFind('#help')`
throws loudly if they diverge, so a mismatch cannot ship silently.

### Content — all of it sourced from what is already in the repo

1. **How to explore.** Click a body to fly in; its algorithms appear as moons; click a moon for
   the full card. Esc / the breadcrumb goes back a level. Drag to pan, scroll or pinch to zoom.
   On touch, the first tap previews and the second opens (keep this in sync with Task 1 — if the
   gesture changes later, this text changes with it).
2. **The two stars.** Straight from PLAN.md §3: *Sol* (classical statistical learning) at the
   origin, *Nova* (attention and scale) far out; deep-learning bodies sit in the transit between
   them, and bodies past the midpoint render lit from Nova rather than Sol. Add each star's own
   `hook` from `content/bodies/{sol,nova}.ts` — Nova's is
   *"The outer star: attention as the sole primitive, and what happens once you scale it up."*
   Sol's is *"The inner star: pick a model, define a loss, minimize it over data — the objective
   every planet runs on."* Quote them verbatim; both are already researched and sourced.
3. **How things are ordered.** Two honest, checkable facts, both true of the current build:
   - Bodies orbit outward roughly by increasing complexity and recency — the inner Sol system is
     classical and foundational, the Belt is the craft, the mid system is structure and
     uncertainty, the transit is deep learning, the Nova system is transformers and LLMs. This
     mirrors the colour gradient documented in `tokens.css`.
   - A body's moons are ordered outward in the order they are declared in that body's content
     module (`engine/scene.ts`'s `buildMoons`), which follows PLAN.md §3's listing —
     foundational first, then variants and successors.
   - Tier 1 entries get a full card; Tier 2 are stubs, and render smaller and dimmer (PLAN.md
     §2). Say so, so a thin card reads as intentional rather than missing.
4. **Every region and its family.** The wayfinding payload, and the direct answer to "I'm just
   guessing what body is what algorithm family." Build this list **at runtime** from
   `content/system.ts` — do not hand-write it, or it will drift. For each star and body: name,
   `segment`, and moon count. Group under three headings by `litBy` plus the belt. Each row
   should be a button that closes the Guide and flies to that body (reuse `main.ts`'s
   `goToBody`; pass it in through the handlers object the way `createCard` takes `onRelated`).
5. **Keyboard shortcuts.** The existing `<dl>`, unchanged, last. Add the new toolbar buttons' own
   affordances if any shortcut changes.

### Structure and styles

Keep it under the 300-line file cap — if the section builders push past it, split them into
`src/ui/guide-sections.ts`, mirroring the `card.ts` / `card-sections.ts` split.

`src/styles/overlay.css`: `.help-panel` is `width: min(480px, 90vw); max-height: 80vh`. The Guide
is much longer — widen to `min(640px, 92vw)`, keep the internal `overflow-y: auto`, and make the
region list a two-column grid on desktop collapsing to one below 860px.

Focus trapping, Esc-to-close and the scrim click already work via `trapFocus` — preserve them.
`goBack` in `main.ts` closes help before popping the view level; keep that behaviour.

### Acceptance

`?` opens a Guide that answers, without leaving the panel: what am I looking at, what is Sol vs
Nova, what family is each body, and what does clicking do. Every region row navigates correctly.
Keyboard-only operation and screen-reader traversal still work.

---

## Task 5 — A visible search box

**Decision: a real search input on desktop, a magnifier button on mobile**, with Advisor and
Guide as icon buttons alongside.

The engine already exists and is good — `src/data/search-index.ts` (BM25 + fuzzy name match) and
`src/ui/search.ts` (the palette). **Do not rewrite either.** This task is purely about making
them reachable without a keyboard.

### 5a. New module: `src/ui/toolbar.ts`

A single always-visible control cluster, top-right, created and appended to `document.body` the
way `createBreadcrumb` does (breadcrumb is top-left; they will not collide, but check at 860px).

Desktop (≥860px):

```
[ 🔍  Search algorithms…        ]  [◈ Advisor]  [? Guide]
```

Mobile (<860px): the input collapses to a magnifier icon button; all three become icon-only,
≥44×44px touch targets.

Handlers, mirroring the existing modules' style:

```ts
export interface ToolbarHandlers {
  onSearch(query?: string): void;   // opens the palette, optionally pre-filled
  onAdvisor(): void;
  onGuide(): void;
}
```

Wire it in `main.ts` to the existing `toggleSearch` / `toggleAdvisor` / `guide.toggle()`.

### 5b. Let the desktop input hand its query to the palette

Simplest correct behaviour, and the one to implement: the toolbar input is a **launcher**. On
focus or first keystroke it opens the palette (`#modal`) and transfers what has been typed so
far, then the palette's own input takes over — one search implementation, one result list, one
keyboard model.

`createSearch`'s `open()` currently takes no arguments. Extend it to `open(initialQuery?: string)`
which, when given a query, sets `inputEl.value` and calls `renderResults(query)` after `build()`.
Keep the no-argument call sites working.

Then clear the toolbar input when the palette closes, so the two never show different text.

### 5c. Do not break what already works

- `src/engine/input.ts`'s `onKeyDown` already bails when the event target is an `INPUT` or
  `TEXTAREA`, so typing `a`, `d` or `/` in the toolbar input will not trigger shortcuts. Confirm
  this still holds for the new element.
- `/` and `A` must keep working as shortcuts.
- The toolbar must not swallow canvas drags. It sits in its own fixed container; give the
  container `pointer-events: none` and the controls `pointer-events: auto`, the same pattern
  `#overlay` uses in `main.css`.
- On mobile the toolbar must not overlap the card's bottom sheet (85vh from the bottom) or the
  breadcrumb. Check with the card open.

### 5d. Styles

`src/styles/overlay.css`, next to the breadcrumb block. Reuse `--bg-raised`, `--hairline`,
`--radius` and the existing `--focus-ring` so it matches the palette and the card. Add a
`--z-overlay`-level container.

Update the Guide's shortcut section only if a shortcut changed (it should not).

### Acceptance

On a phone, a magnifier button is visible on first paint, opens the palette, and selecting a
result flies to and opens that algorithm. On desktop, typing directly into the toolbar input
produces results without ever pressing `/`.

---

## Sequencing and commits

Do them in this order — Task 1 is the actual bug, and Task 3 changes the same label geometry
Task 4's region list describes.

1. `Fix mobile tap handling: cumulative drag threshold, no double-pan, preview hold`
2. `Dim the background starfield; strengthen Sol and Nova`
3. `Show each body's algorithm family beneath its name`
4. `Expand the ? overlay into a full Guide`
5. `Add a visible search box (desktop) and search button (mobile)`

Each commit must leave `npm test && npm run validate && npm run build` green. Branch:
`claude/ds-universe-mobile-ux-64z7j3`, push with `git push -u origin <branch>`. **Do not open a
pull request** unless the user asks for one.

Update `README.md`'s status paragraph and PLAN.md's checklist at the end if these tasks close
anything tracked there.

## Things to flag back rather than guess

- If dimming the starfield to the values above makes the map feel empty rather than calm, say so
  and propose numbers, rather than silently splitting the difference.
- If the two-line labels still crowd the map after the compact-fallback in 3b, report it with a
  screenshot — the fix may be to show the segment line only for the focused/hovered body, which
  is a change to a decision the user already made and needs their sign-off.
- Any place these tasks would require asserting a fact about an algorithm that is not already
  written in the repo: stop and ask. PLAN.md §0 rule 14.
