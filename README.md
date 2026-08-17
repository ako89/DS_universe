# DS Universe

An explorable map of the data science algorithm universe — from ordinary least squares through
every classical method, into neural nets and deep learning, all the way to large language
models — rendered as a solar system you fly through.

Each major segment of the field is a planetary body. Hover for a one-line hook; click to fly in,
reveal the individual algorithms as moons, and open a card that goes as deep as you want: plain
intuition first, the maths behind a fold, and links to real books, papers and lectures.

> **Status: content-complete and polished, not yet deployed.** Phases 0–5 are complete — the
> orrery renders, animates, and is fully navigable by mouse, touch or keyboard alone (every body
> is a real focusable control with a visible focus ring; orbital motion eases off as you zoom in
> so a body doesn't drift out from under you); all 195 written entries across all 27 star/body
> placements are in place; pressing `/` opens a fuzzy search palette and `A` opens a
> problem→algorithm advisor, both lexical (BM25 + facet-boosted ranking); a screen reader gets a
> real description of the map and live updates as you navigate; `#/jupiter/dbscan`-style deep
> links are shareable and restore the camera and card, including via the browser's back/forward
> buttons. Not yet done: the deployment workflow, the semantic advisor upgrade, and the Oort
> cloud's 22 adjacent-territory entries (Phases 6–8). See [PLAN.md](PLAN.md) for the phase
> checklist.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open **<http://localhost:5173/DS_universe/>** — the `/DS_universe/` path is part of the URL,
because `base` is configured for GitHub Pages.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run validate` | Check content integrity (ids, cross-links, tier completeness) |
| `npm run check-links` | Verify every reference URL resolves |
| `npm test` | Run the test suite |

## Documentation

| Document | Read it when |
|---|---|
| **[PLAN.md](PLAN.md)** | Always first. Ground rules, the full taxonomy, the phase checklist. |
| **[docs/ENGINE_SPEC.md](docs/ENGINE_SPEC.md)** | Before touching `src/engine/`. Coordinate systems, module contracts, canvas pitfalls. |
| **[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)** | Before writing content. Register, length targets, a gold-standard entry, vetted sources. |
| **[docs/ORCHESTRATION.md](docs/ORCHESTRATION.md)** | Before running multiple agents. What parallelizes (Phase 3 only), the agent brief, the batch plan. |

## Adding an algorithm

Content is authored as TypeScript rather than JSON, so your editor autocompletes the valid facet
values and the compiler catches a typo'd tag or a missing field as you write.

1. Open the relevant body module in `src/content/bodies/` — for example `jupiter.ts` for
   clustering methods.
2. **Research it before writing it.** Search for the algorithm, open a real source — the original
   paper, a canonical text, or the library's own documentation — and open every reference URL
   before citing it. Entries are written from sources, not from recall. See
   [CONTENT_GUIDE §3](docs/CONTENT_GUIDE.md#3-research-first-authoring).
3. Add an entry to its `moons` array, following the schema in
   [ENGINE_SPEC §7](docs/ENGINE_SPEC.md#7-the-content-schema) and the gold-standard example in
   [CONTENT_GUIDE §2](docs/CONTENT_GUIDE.md#2-gold-standard-entry--match-this).
4. Point `related` at real entry ids elsewhere in the map — cross-body links especially.
5. Run `npm run validate` and `npm run check-links`.
6. Run `npm run dev` and read the card on screen. Prose that reads fine in an editor is often too
   long in a 480px panel.

Adding a whole new *body* means a new module in `src/content/bodies/` plus an entry in
`src/content/system.ts`. Discovery is automatic — no registry to update.

## Architecture in one paragraph

Vite + TypeScript, no framework. The scene is a single 2D canvas driven by one
`requestAnimationFrame` loop; labels and cards are HTML overlaid on top, so text stays crisp at
any pixel ratio and reaches the accessibility tree. There is no backend — search and the
problem-to-algorithm advisor both run in the browser against content bundled at build time.

## A note on references

Content here is written from sources, not from recall — every entry is researched as it is
written, and every reference URL is opened before it is cited. Prefer the vetted sources in
[CONTENT_GUIDE §5](docs/CONTENT_GUIDE.md#5-vetted-reference-sources).

Nothing factual is invented: not a date, an author, a complexity bound, a hyperparameter default,
or a link. If something cannot be sourced it is left out and reported, never filled in with
plausible prose.

`npm run check-links` enforces the part that can be automated and runs in CI before deploy. It is
worth being clear about its limit: it catches a dead URL, but it cannot catch a confidently wrong
complexity bound or a date that belongs to the follow-up paper. Those pass every check in this
repo except a person reading them against a source — which is why the research happens up front
rather than as verification afterwards.

## Development notes

- **Node** is at `C:\Program Files\nodejs\`. If a shell reports `node: not recognized`, that
  shell predates the install — run `$env:Path = "C:\Program Files\nodejs;$env:Path"` rather than
  reinstalling anything.
- `.claude/launch.json` currently points at the absolute path to `npm.cmd` for the same reason.
  Once shells pick up the machine PATH, it can go back to plain `"npm"`.
