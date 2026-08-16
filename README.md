# DS Universe

An explorable map of the data science algorithm universe — from ordinary least squares through
every classical method, into neural nets and deep learning, all the way to large language
models — rendered as a solar system you fly through.

Each major segment of the field is a planetary body. Hover for a one-line hook; click to fly in,
reveal the individual algorithms as moons, and open a card that goes as deep as you want: plain
intuition first, the maths behind a fold, and links to real books, papers and lectures.

> **Status: early.** Phase 0 (scaffold) is complete. The engine, content and search are not built
> yet. See [PLAN.md](PLAN.md) for the phase checklist.

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

## Adding an algorithm

Content is authored as TypeScript rather than JSON, so your editor autocompletes the valid facet
values and the compiler catches a typo'd tag or a missing field as you write.

1. Open the relevant body module in `src/content/bodies/` — for example `jupiter.ts` for
   clustering methods.
2. Add an entry to its `moons` array, following the schema in
   [ENGINE_SPEC §7](docs/ENGINE_SPEC.md#7-the-content-schema) and the gold-standard example in
   [CONTENT_GUIDE §2](docs/CONTENT_GUIDE.md#2-gold-standard-entry--match-this).
3. Point `related` at real entry ids elsewhere in the map — cross-body links especially.
4. Run `npm run validate` and `npm run check-links`.
5. Run `npm run dev` and read the card on screen. Prose that reads fine in an editor is often too
   long in a 480px panel.

Adding a whole new *body* means a new module in `src/content/bodies/` plus an entry in
`src/content/system.ts`. Discovery is automatic — no registry to update.

## Architecture in one paragraph

Vite + TypeScript, no framework. The scene is a single 2D canvas driven by one
`requestAnimationFrame` loop; labels and cards are HTML overlaid on top, so text stays crisp at
any pixel ratio and reaches the accessibility tree. There is no backend — search and the
problem-to-algorithm advisor both run in the browser against content bundled at build time.

## A note on references

Every citation in this project should be real and reachable. `npm run check-links` exists to
enforce that, and it runs in CI before deploy. If you are adding references, prefer the vetted
sources in [CONTENT_GUIDE §4](docs/CONTENT_GUIDE.md#4-vetted-reference-sources), and never guess
at an identifier — an invented arXiv ID or YouTube link looks entirely authentic, which is
exactly what makes it worse than no citation at all.

## Development notes

- **Node** is at `C:\Program Files\nodejs\`. If a shell reports `node: not recognized`, that
  shell predates the install — run `$env:Path = "C:\Program Files\nodejs;$env:Path"` rather than
  reinstalling anything.
- `.claude/launch.json` currently points at the absolute path to `npm.cmd` for the same reason.
  Once shells pick up the machine PATH, it can go back to plain `"npm"`.
