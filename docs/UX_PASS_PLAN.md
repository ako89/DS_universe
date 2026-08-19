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
| 3 | Where the family name goes | **Tooltip only**, in parentheses after the body name — `Jupiter (Clustering, Density & Anomaly)`. **Map labels stay name-only.** |
| 3b | Body hooks | **Trimmed, not removed** — only a leading positional clause ("The inner star:") comes off, as a content edit to five modules. Everything after it stays. |
| 3c | A star's moons | Tooltip gains one authored line saying these are foundations/building blocks, **not models** — the reason a moon of a sun isn't just a planet. |
| 4 | Guide location & shape | **Expand the existing `?` overlay into a "Guide"**. The family list is an **expand/collapse accordion** — one caret row per family, opening to its algorithms. Shortcut table last. |
| 4b | Star naming | Clicking Sol or Nova shows the **system** name in parentheses: `Sol (Classical Statistical Learning)`, `Nova (Attention & Scale)`. |
| 5 | Search affordance | **Always-visible search input on desktop; magnifier icon on mobile.** Advisor and Guide get icon buttons alongside. |
| 6 | Motion | **Freezes as soon as anything is highlighted** (desktop hover / mobile first tap). Resumes only on click-away or zoom-out — not on hover-off. |

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

1. **Freeze the scene while anything is highlighted** — this is now **Task 6**, which covers
   desktop hover and mobile first-tap under one mechanism. Do Task 6 before this one; it removes
   most of this failure on its own, because the target stops moving the instant it is previewed.
2. **Make the second tap forgiving**, which is still needed for a finger that lands a few pixels
   off on the second tap even against a stationary target. Instead of requiring an exact re-hit, treat a second tap
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

## Task 3 — Put the algorithm family in the tooltip

**Revised decision (supersedes the earlier two-line-label plan): the map label stays name-only.**
Do not add a second line to `render/labels.ts`. The family name goes in the **tooltip**, in
parentheses after the body name, and the tooltip's hook line is removed.

This is a much smaller change than the superseded version and it removes the collision-thinning
risk entirely — `labels.ts` and `main.css`'s `.body-label` are untouched by this task.

### Where the family name appears, all together

`segment` already renders in three places, all of them downstream of a click — which is the
complaint. This task adds the one surface that comes *before* the click.

| Surface | Today | After |
|---|---|---|
| Tooltip (hover / first-tap preview) | name, hook, meta | **name (family), meta — hook removed** |
| Map label | name only | **unchanged — name only** |
| Guide family list | — | **new, Task 4** |
| Card eyebrow | segment (`card-sections.ts:38`) | unchanged |
| Advisor result eyebrow | segment (`advisor.ts:51`) | unchanged |
| Screen-reader map summary | segment (`a11y-status.ts:41`) | unchanged |
| Breadcrumb | name only | unchanged — a short nav trail, not a description |

### 3a. Stars need two new fields

`src/content/system.ts`'s `BodyPlacement` has `segment`; `StarPlacement` does **not**, so Sol and
Nova — the two most important objects on the map — currently cannot show a family at all.

Add **two** fields to `StarPlacement`, because a star means two different things and overloading
one field would make the Guide wrong:

```ts
export interface StarPlacement {
  // …existing fields…
  segment: string;      // the star's OWN moons  — 'The Objective' / 'Attention & Scale'
  systemName: string;   // everything orbiting it — see below
}
```

- `segment` — transcribe from the star's own content module: `sol.ts` has
  `segment: 'The Objective'` (its 6 moons are ERM, loss functions, MLE/MAP, gradient descent,
  bias–variance, convexity/no-free-lunch); `nova.ts` has `segment: 'Attention & Scale'`.
- `systemName` — names **the whole system orbiting that star**, which is what the user asked for.
  Use PLAN.md §3's own wording, which is already in exactly this parenthetical form: *"**Sol**
  (classical statistical learning) at the origin, **Nova** (attention and scale) far out."*
  So: Sol → `'Classical Statistical Learning'`, Nova → `'Attention & Scale'`.

  Both are transcribed, not invented. Note Nova's two values coincide; Sol's do not, which is
  exactly why the two fields are separate.

Then `src/engine/scene.ts`'s `buildScene()` must carry both onto the star branch of the scene
push (it currently sets `segment` only in `buildBody`). Add `systemName?: string` to `SceneBody`.

### 3b. Rewrite the tooltip

`src/ui/tooltip.ts`, `describe()`. Three changes, and no others.

**1. Parenthesise the family in the title.** For a planet/belt, `Jupiter (Clustering, Density &
Anomaly)`. For a star, use `systemName`, not `segment`: `Sol (Classical Statistical Learning)`,
`Nova (Attention & Scale)`.

Keep the parenthetical as its own field rather than concatenating into `title`, so the renderer
can style it (lighter weight / `--text-dim`) and so `a11y-status.ts` can join it cleanly:

```ts
export interface TooltipContent {
  title: string;
  family?: string;   // rendered as "Title (family)"
  hook?: string;     // entries only now — see below
  meta: string;
}
```

**2. Trim the positional preamble off body and star hooks — keep the rest.** The hook stays in
the tooltip; only the scene-setting clause that names the thing's *place in the orrery* comes off,
because that is what reads as confusing next to a concrete family name.

**Do NOT implement this as a runtime `split(':')`.** Only a minority of the 27 body hooks open
with a positional preamble, and most hooks that contain a colon are using it substantively — a
blanket strip destroys them. Verified against the actual content:

| Body | Hook opens with | Strip? |
|---|---|---|
| Sol | `The inner star:` | **yes** |
| Nova | `The outer star:` | **yes** |
| Mercury | `The starting point:` | **yes** |
| Prometheus | `The first body of the transit:` | **yes** |
| Vulcan | `The forge of computer vision:` | **yes** |
| Terra | `Models you read as a flowchart:` | **no** — that clause *is* the explanation |
| Venus | `Methods with no model to fit:` | **no** — same |
| Genesis | `How raw text becomes a base model:` | **no** — same |
| Athenaeum | `Connects a language model to facts it never memorized:` | **no** — same |
| Daedalus | `Turns a language model into something that acts:` | **no** — same |
| Velocity | `Makes a trained model fast and cheap to actually run:` | **no** — same |

Stripping Terra's would leave *"a chain of yes/no questions, and the pruning that says where to
stop"* — a sentence with no subject. The remaining ~16 hooks contain no colon at all.

**So: do it as a one-time authoring edit**, not a transform. Hand-edit the five hooks in the table
above in their `content/bodies/*.ts` modules, dropping the leading clause and re-capitalising.
Sol becomes *"Pick a model, define a loss, minimize it over data — the objective every planet
runs on."* Nova becomes *"Attention as the sole primitive, and what happens once you scale it
up."* Leave every other hook untouched, and leave `describe()` alone — it keeps returning `hook`
for bodies as it does today.

Re-read every one of the 27 hooks before deciding; the five above are this pass's reading, not a
closed list. If a sixth reads as positional preamble, strip it and say which.

A **moon's** `Entry.hook` is untouched throughout — those have no positional preamble and are the
entire payload of the mobile first-tap preview.

**3. Update `render()`** to emit the parenthetical and to stop emitting `.tooltip-hook` when
there is no hook. The `↵ enter` suffix on the meta line still needs the touch-aware treatment
from Task 1d.

`src/styles/overlay.css`: add `.tooltip-family` (inline after the title, `--text-dim`, normal
weight against the title's 600). `.tooltip-hook` stays for the moon case.

### 3c. Explain what a star's moons are

A planet's moons are algorithms. **A star's moons are not**, and nothing on screen says so — which
is why a moon of a sun reads as "why isn't this just a planet?".

What they actually are, verified against the content modules:

- **Sol's six** — Empirical Risk Minimization, Loss Functions, Maximum Likelihood & MAP, Gradient
  Descent, Bias–Variance Decomposition, Convexity & the No-Free-Lunch Theorem. `sol.ts`'s own file
  header states the relationship outright: *"Every other Tier 1 entry already written elsewhere in
  the map (OLS, ridge, lasso, logistic regression, naive Bayes, every tree ensemble, gradient
  boosting...) is a specific instance of one of these six ideas."* Use that; it is sourced, in-repo
  and exactly the point.
- **Nova's six** — Self-Attention, Multi-Head Attention, Transformer Block, Positional Encoding,
  Scaling Laws, Encoder-Only vs. Decoder-Only vs. Encoder-Decoder. These are the architectural
  primitives every body in the Nova system is built out of, not models you would train.

**Implementation.** Add one authored sentence per star to `StarPlacement` in `system.ts`,
alongside `systemName` from 3a:

```ts
moonNote: string;   // shown in the tooltip of any moon belonging to this star
```

Sol: *"A foundation every algorithm on every planet is an instance of — not a model in itself."*
Nova: *"A building block the models in this system are assembled from — not a model in itself."*

In `describe()`'s entry branch, when the entry's parent body is a star, append `moonNote` as a
distinct line (its own field on `TooltipContent`, styled like `.tooltip-meta` but not mono, so it
reads as a note rather than as the hook). Resolve the parent via `registry.ts`'s `entryBody()`
and check its id against `system.stars` — do not hard-code `'sol'`/`'nova'` at the call site.

This is navigational copy about how the map is organised, not a pedagogical claim, so it is inside
PLAN.md §0's rules. Keep it to one sentence and do not assert anything about the algorithms
themselves.

### 3d. Keep the screen reader in sync

`src/ui/a11y-status.ts`'s `createStatusAnnouncer` reuses `describe()` and joins
`[title, hook, meta]`. Update the join to include `family` and to tolerate the now-absent body
hook, so a screen reader hears "Jupiter, Clustering, Density and Anomaly, 10 moons, 1996 to 2017"
rather than dropping the family silently.

### Acceptance

Hovering Jupiter shows `Jupiter (Clustering, Density & Anomaly)` above its hook. Hovering Sol
shows `Sol (Classical Statistical Learning)` and a hook that now starts *"Pick a model, define a
loss…"* with no "The inner star:" preamble. Hovering one of Sol's moons additionally shows the
note explaining it is a foundation rather than a model. Hovering a planet's moon is unchanged. Map
labels are visually unchanged from today. The live region announces the family.

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
   them, and bodies past the midpoint render lit from Nova rather than Sol.

   **Do not quote the stars' `hook` strings here** — the same "confusing" text being removed from
   the tooltip in Task 3b should not reappear in the Guide. Use the `systemName` from Task 3a plus
   plain prose about what each system holds. Do say, in one line each, that a star also has its
   own six moons (Sol: the objective every model minimizes; Nova: attention itself), since that is
   otherwise surprising when a star is clicked.
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
4. **Reading a tooltip and a card.** Explain the three values that appear on every algorithm —
   they currently show up with no key anywhere in the app. See its own section below.
5. **The family accordion.** The wayfinding payload, and the direct answer to "I'm just guessing
   what body is what algorithm family." See its own section below — this is the centrepiece of the
   Guide, not a footnote.
6. **Keyboard shortcuts.** The existing `<dl>`, unchanged, last. Add the new toolbar buttons' own
   affordances if any shortcut changes.

### Reading a tooltip and a card: tier, difficulty, year

`ui/tooltip.ts` renders `Tier 1 · difficulty 3/5 · 1996` for every algorithm and the app never
says what any of it means. Add a short key to the Guide.

**Tier — documented, write it confidently.** From PLAN.md §2 and CONTENT_GUIDE §"Tier 2 stubs":
Tier 1 is a full card; Tier 2 is *short, not partial* — a real entry with the same quality bar on
hook, intuition, how-it-works, when-to-use and references, which skips exactly four optional
fields (`math`, `code`, `hyperparameters`, `complexity`). Say that plainly, because a Tier 2 card
otherwise reads as unfinished. Also worth saying: Tier 2 moons render smaller and dimmer on
purpose (PLAN.md §2), so the visual hierarchy is legible rather than looking like a rendering bug.

**Year — documented, write it carefully.** The convention is the year of the single most
load-bearing, independently verified originating publication, not "the year it became popular".
`sol.ts`'s file header documents this and several deliberate edge cases (Gradient Descent is dated
1847 to Cauchy, with SGD's separate 1951 Robbins–Monro root explained in the entry rather than
folded into one invented date). One sentence in the Guide, plus "where a date was a judgement
call, the entry says so" — which is true and sets the right expectation.

**Difficulty — STOP AND ASK. There is no rubric anywhere in this repo.** `types/content.ts` and
ENGINE_SPEC §7 define only `difficulty: 1 | 2 | 3 | 4 | 5`, and ENGINE_SPEC §4 says it renders as
1–5 dots. Nothing states what a 3 means (DBSCAN is one). Writing "difficulty rates the maths
background an entry assumes" would be **inventing a definition for 195 already-authored values**
— precisely what PLAN.md §0 rule 14 forbids.

Do this instead, in order:

1. Read the actual distribution — sample the 1s and the 5s across `content/bodies/*.ts` and see
   what separates them.
2. Propose one sentence to the user, with the evidence, and get sign-off.
3. Only then write it into the Guide.

Until it is signed off, ship the Guide with tier and year explained and difficulty described
purely mechanically ("a 1–5 rating shown as filled dots, comparable across entries") — accurate,
and asserting nothing about what the scale measures.

### The family accordion

One collapsed row per family, each expanding to the algorithms inside it. Use native
`<details>`/`<summary>` — it gives the caret marker, keyboard operation, and correct
`aria-expanded` semantics for free, and `ui/card.ts` already uses the same element for the math
and code sections, so the Guide matches the card.

Collapsed, one row per family:

```
▸ Mercury — Linear & Probabilistic Foundations              9
▸ Venus — Similarity & Instance-Based                       6
▾ Jupiter — Clustering, Density & Anomaly                  10
     k-Means & k-Means++                            Tier 1
     Hierarchical clustering                        Tier 1
     DBSCAN                                         Tier 1
     …
▸ Saturn — Dimensionality Reduction & Representation        9
```

Rules:

- **Build it at runtime**, never hand-written, or it drifts the moment content changes. Families
  and their order come from `content/system.ts`; the algorithm names inside come from
  `data/registry.ts` (`bodies.get(id)?.moons` → `entry.name`, `entry.tier`), which is already the
  declaration order the moons orbit in.
- **Group into three sections** matching the map: the Sol system, the transit, and the Nova
  system. `litBy` alone does not give this — Echo onward is `litBy: 'nova'` while still being
  transit — so derive the transit from the `prometheus`…`odyssey` run in `system.ts`'s declaration
  order, and leave a comment saying so. The Belt sits in the Sol section.
- **Both stars get a row too**, at the top of their section, labelled with `systemName` and
  listing their own six moons.
- **Every row is navigable.** The `<summary>` carries a "go there" button that closes the Guide
  and calls `goToBody`; each algorithm inside is a button calling `focusEntry`. Pass both in
  through the handlers object, the way `createCard` takes `onRelated` — the Guide must not import
  navigation directly.
- **Do not put a button inside `<summary>`'s clickable area** in a way that makes the caret
  unclickable. Put the family name in the `<summary>` (click = expand/collapse) and a small
  separate "fly here" affordance beside it, or make the algorithm rows the only navigation and
  leave `<summary>` purely for expansion. Either is fine; pick one and be consistent.
- Style `<summary>` with `list-style: none` + a custom `::marker`/`::before` caret only if the
  native marker looks wrong against the panel — prefer the native one.
- With 27 families and ~195 algorithms, everything collapsed by default. The panel keeps its
  internal `overflow-y: auto`.

### Structure and styles

Keep it under the 300-line file cap — if the section builders push past it, split them into
`src/ui/guide-sections.ts`, mirroring the `card.ts` / `card-sections.ts` split.

`src/styles/overlay.css`: `.help-panel` is `width: min(480px, 90vw); max-height: 80vh`. The Guide
is much longer — widen to `min(640px, 92vw)` and keep the internal `overflow-y: auto`. The
accordion is a single column at every width; a two-column layout would break the scan-down-the-
carets reading the list is for.

Focus trapping, Esc-to-close and the scrim click already work via `trapFocus` — preserve them.
`goBack` in `main.ts` closes help before popping the view level; keep that behaviour.

### Acceptance

`?` opens a Guide that answers, without leaving the panel: what am I looking at, what is Sol vs
Nova, what family is each body, and what does clicking do. Every family expands and collapses by
click and by keyboard; every algorithm row navigates to that algorithm's card. The list is
generated — adding an entry to a content module makes it appear with no edit to the Guide.
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

---

## Task 6 — Freeze orbital motion while something is highlighted

**Behaviour asked for.** As soon as a tooltip appears — desktop hover, or mobile first tap — the
bodies stop moving. They start again only when the user **clicks/taps away** or **zooms out**.

Today `main.ts`'s loop freezes motion only for `prefers-reduced-motion` and while the card is
open:

```ts
const motionActive = !reduceMotion && !card.isOpen();
```

This task adds a third condition, and it subsumes Task 1c's preview hold — one mechanism serving
both platforms. Do it **before** Task 1c.

### 6a. Hold state

`main.ts` already owns the single source of truth for what is pointed at: `highlight`, set by
`setHighlight()` from mouse hover, label focus, the Left/Right moon cursor and touch alike. Gate
on that.

```ts
const motionHeld = highlight.bodyId !== undefined;
```

**Freeze positions only — let `clock` keep advancing.** The existing `motionActive` flag gates
both `updateScene` *and* the `clock` that drives twinkle, star pulse and gas drift. Reusing it
wholesale would make the whole scene look dead on hover. Split them:

```ts
const positionsMoving = !reduceMotion && !card.isOpen() && !motionHeld;
const visualsMoving   = !reduceMotion && !card.isOpen();
updateScene(bodies, dt * motionTimeScale(camera.zoom), !positionsMoving);
if (visualsMoving) clock = t;
```

Leave `motionTimeScale`'s zoom easing alone — it is orthogonal and still wanted.

### 6b. Release conditions

Per the instruction, hovering *off* does **not** resume — that would make the scene stutter as the
cursor crosses bodies on its way somewhere. The hold releases on:

- **A click or tap on empty space.** `input.ts`'s `onPointerUp` already computes `hit`; when it is
  `null` and the gesture was not a drag, clear the highlight (`setHighlight(null, undefined)`),
  which releases the hold for free.
- **Zooming out.** In `onWheel` and the pinch branch of `onTouchMove`, when the applied factor is
  `< 1`, clear the highlight. Zooming *in* must not release it — zooming in is what someone does
  to read or click the thing they just hovered.
- **Esc / going back to the universe view**, since `goHome`/`goBack` already reset the view.

Add an `onClearHighlight?()` handler to `InputHandlers` rather than having `input.ts` reach into
`main.ts`'s state — it stays a pure event translator, per its own file header.

### 6c. Watch for

- **The hold must not survive a card opening and closing.** `card.close()` restores focus to the
  label, which re-fires `onFocusChange` and re-highlights. That is correct (you are back looking
  at that body) but verify it does not leave the scene frozen with no visible tooltip.
- **Keyboard users** get the hold via label focus, which is a real improvement — Tabbing to a body
  stops it drifting. Make sure blurring the last label releases it, or a keyboard user who Tabs
  out of the map leaves the scene frozen forever.
- **Do not freeze during a drag.** Panning with a body under the cursor should still feel live;
  check `dragging` before applying the hold, or just accept it — decide by feel and say which.

### Acceptance

Desktop: hovering a planet stops all orbital motion immediately; the starfield twinkle and star
pulse keep going; moving the cursor to empty space does *not* resume; clicking empty space does;
scrolling to zoom out does; zooming in does not. Mobile: the same, driven by first tap and
tap-away. Nothing resumes while a card is open.

## Sequencing and commits

Do them in this order. Task 6 lands first because Task 1c's mobile fix depends on it, and Task 3's
new `StarPlacement` fields are what Task 4's accordion labels the two stars with.

1. `Freeze orbital motion while a body is highlighted` (Task 6 — Task 1 depends on it)
2. `Fix mobile tap handling: cumulative drag threshold, no double-pan, forgiving second tap` (Task 1)
3. `Dim the background starfield; strengthen Sol and Nova` (Task 2)
4. `Name each body's algorithm family in the tooltip; trim positional hook preambles` (Task 3)
5. `Expand the ? overlay into a Guide with an expandable family list` (Task 4)
6. `Add a visible search box (desktop) and search button (mobile)` (Task 5)

Each commit must leave `npm test && npm run validate && npm run build` green. Branch:
`claude/ds-universe-mobile-ux-64z7j3`, push with `git push -u origin <branch>`. **Do not open a
pull request** unless the user asks for one.

Update `README.md`'s status paragraph and PLAN.md's checklist at the end if these tasks close
anything tracked there.

## Things to flag back rather than guess

- If dimming the starfield to the values above makes the map feel empty rather than calm, say so
  and propose numbers, rather than silently splitting the difference.
- **The moon-tooltip hook.** Task 3b removes the hook from body and star tooltips only, and keeps
  it for individual algorithms. That is an interpretation of "get rid of the hook in the tooltip"
  — both of the user's mentions were about bodies and stars. If they meant *all* tooltips, it is a
  one-line change, but say so first: on mobile the first-tap preview would then show only a name
  and `Tier 2 · difficulty 3/5 · 1996`, which is close to useless for deciding whether to tap
  again.
- **Sol's two names.** `segment` ('The Objective', its own six moons) and `systemName`
  ('Classical Statistical Learning', everything orbiting it) are deliberately different, and the
  tooltip shows the latter. If clicking Sol and reading "Classical Statistical Learning" over a
  set of moons that are actually loss functions and gradient descent reads wrong on screen, report
  it — the fix is a wording call the user should make, not a silent swap to `segment`.
- Long family names in the tooltip title (`Saturn (Dimensionality Reduction & Representation)`)
  push against `.tooltip`'s `max-width: 280px`. Let it wrap; if it wraps to three lines and looks
  bad, report it rather than truncating a family name.
- **The difficulty scale is undefined in this repo** and the Guide is being asked to explain it.
  This is a hard stop, not a judgement call — see Task 4's section. Propose wording with evidence
  and get sign-off before writing a definition for 195 existing values.
- **The colon rule is not mechanical.** Task 3b lists the five hooks whose leading clause is
  genuinely positional. If your own read of the 27 disagrees, say which and why rather than
  widening or narrowing the list silently.
- **Motion resuming only on click-away/zoom-out** means a user who hovers a body and then does
  nothing leaves the scene frozen indefinitely. That is what was asked for and it is defensible.
  If it feels wrong in the hand, report it — adding "resume on pan-drag" is the obvious next
  candidate, but it is the user's call.
- Any place these tasks would require asserting a fact about an algorithm that is not already
  written in the repo: stop and ask. PLAN.md §0 rule 14.
