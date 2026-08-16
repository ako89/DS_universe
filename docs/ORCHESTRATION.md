# Running this project with multiple agents

A practical guide to parallelizing the build. Written for someone doing this for the first time.

---

## 1. The short answer

**Yes — but only one phase of this project parallelizes, and it isn't the next one.**

| Phase | Parallelizable? | Why |
|---|---|---|
| 1 — Engine | ❌ **No** | Every module depends on the one before it. `camera` needs `canvas`; `scene` needs `camera`; `picking` needs `scene`; `input` needs `picking`. Two agents here will collide and produce incompatible APIs. |
| 2 — UI shell & schema | ❌ **No** | `types/content.ts` is the foundation everything else keys off. One agent, start to finish. |
| 3 — Content | ✅ **Yes, heavily** | 27 independent files, one per body, no shared state. This is ~70% of the remaining work and the ideal parallel target. |
| 4 — Search & advisor | ❌ **No** | Small, tightly coupled, and needs content to exist first. |
| 5 — Polish | ⚠️ Partly | Accessibility, mobile and deep-links are separable, but it's only a few days of work. Not worth the coordination. |

**So: run Phases 1 and 2 with a single agent, sequentially.** Then parallelize Phase 3 hard.
Then go back to single-agent for 4 onward.

The temptation to spin up ten agents right now is the main thing this document exists to talk
you out of. On the engine it would cost you more time than it saves.

---

## 2. Why Phase 3 is different

Content is stored as one TypeScript module per planetary body:

```
src/content/bodies/mercury.ts     ← agent A
src/content/bodies/jupiter.ts     ← agent B
src/content/bodies/forge.ts       ← agent C
```

Nothing imports anything else. `registry.ts` discovers them automatically. Two agents writing
two different body files cannot conflict, because they never touch the same bytes.

That property is what makes parallelism safe here, and it's why the file layout was designed
this way in the first place.

---

## 3. The rules

Give these to every agent, every time.

1. **Each agent owns exactly one file** — `src/content/bodies/<body>.ts`. It creates that file
   and edits nothing else.
2. **Shared files are off-limits to content agents.** `src/types/content.ts`,
   `src/content/system.ts`, `src/data/registry.ts`, `PLAN.md`, anything in `src/engine/` or
   `src/ui/`. If an agent believes one of these needs changing, it reports that and stops —
   it does not edit.
3. **The orchestrator (you, or your main session) owns everything shared**, plus merging,
   validation and review.
4. **No agent commits.** You commit, after review. Parallel agents committing to the same branch
   is how you get a confusing history and half-reviewed content in `main`.
5. **Agents start cold.** A subagent does not see your conversation. Its prompt must be
   self-contained — that's what the template in §5 is for.

---

## 4. Two ways to actually run it

### Option A — one orchestrator session spawning subagents (recommended for your first time)

You stay in one Claude Code session and ask it to spawn several agents at once. It hands each a
brief, they work in parallel in the same working tree, and it reports back when they're done.

You need to **ask explicitly** — agents aren't spawned unless you request them. Something like:

> Read PLAN.md and docs/CONTENT_GUIDE.md. Then spawn 4 parallel subagents, one per body:
> mercury, venus, terra, mars. Give each the full authoring brief from
> docs/ORCHESTRATION.md §5. When they're all done, run `npm run validate`, review the output,
> and report what needs fixing before I commit.

**Pros:** simplest, one place to watch, orchestrator handles collation.
**Cons:** you can't easily intervene in a single agent mid-flight.

### Option B — several terminal sessions, one per body

Open 3–4 terminals, `cd` each to the repo, and give each session one body.

**Pros:** you can watch and steer each one; easiest to abandon a bad run.
**Cons:** you're the collation layer; more windows to babysit.

### Do you need git worktrees?

**No.** Worktrees give each agent an isolated checkout, which matters when agents edit the *same*
files. Here they don't — one file each. Worktrees would just add a merge step for no benefit.
Skip them.

---

## 5. The agent brief (copy this)

Substitute the body name. Keep it verbatim otherwise — every clause is load-bearing.

```
You are writing one content module for the DS Universe project.

Repo: C:\Users\akoda\Projects\DS_universe

READ FIRST, in this order:
  1. docs/CONTENT_GUIDE.md   — register, length targets, the gold-standard entry, vetted sources
  2. docs/ENGINE_SPEC.md §7  — the Entry/Body schema
  3. PLAN.md §3              — find the "JUPITER" section for your assigned moon list
  4. src/types/content.ts    — the authoritative types
  5. src/content/bodies/jupiter.ts if it exists, as a style reference

YOUR TASK
Create src/content/bodies/JUPITER.ts exporting a `Body` object with one `Entry` per moon
listed for that body in PLAN.md §3. Write each at the tier marked there:
  ★ = Tier 1 (full entry)   unmarked = Tier 2 (stub: hook, intuition, facets, related, 2 refs)

HARD RULES
- Edit ONLY src/content/bodies/JUPITER.ts. Do not touch types, system.ts, registry.ts,
  engine/, ui/, or any other body file. If you think one needs changing, say so and stop.
- Do not commit. Do not run git.
- Never invent a URL, DOI, arXiv ID, or YouTube video ID. Use the vetted sources in
  CONTENT_GUIDE §4, or a link you have verified. For video, link a channel — never guess a
  video ID. An invented citation is worse than no citation; omit rather than guess.
- Never write placeholder text. If you cannot write a real entry, leave it out and report
  which ones you skipped and why.
- Match the gold-standard DBSCAN entry in CONTENT_GUIDE §2 for structure, length and register.
- `whenToUse` / `whenNotToUse` must be concrete, checkable conditions. They are the advisor's
  only source of truth. "When you need good performance" is a failure; "Clusters are
  irregularly shaped or nested" is correct.
- `related` must contain real entry ids. Include at least one cross-body link where the
  connection is genuine.

BEFORE YOU REPORT DONE
- Run: npm run build      (must typecheck clean)
- Run: npm run validate   (must exit 0, if the script exists yet)
Report: entries written, entries skipped and why, any references you were unsure about,
and anything the schema could not express.
```

---

## 6. A batch plan

Group by theme rather than shuffling. Related bodies written together cross-link far better and
keep a consistent voice, because the same agent-generation is holding the same context.

Run **3–4 agents per batch**. More than that and your review queue becomes the bottleneck.

| Batch | Bodies | Entries |
|---|---|---|
| 1 | `mercury` `venus` `terra` `mars` | 28 |
| 2 | `belt` `pallas` `jupiter` `saturn` | 33 |
| 3 | `sol` `uranus` `neptune` `chronos` | 28 |
| 4 | `prometheus` `vulcan` `echo` `chimera` | 31 |
| 5 | `arachne` `odyssey` `nova` `babel` | 28 |
| 6 | `genesis` `forge` `velocity` `athenaeum` | 28 |
| 7 | `daedalus` `iris` `aegis` | 19 |

**Do batch 1 first, alone, and review it properly before launching batch 2.** The first batch is
where you find out whether the brief is calibrated. Fix the brief, then scale up.

---

## 7. After each batch — your job

```bash
npm run build
```

```bash
npm run validate
```

Then read, don't skim:

- [ ] **Spot-check three cards in the browser.** `npm run dev`, click into the new planets. Prose
      that reads fine in an editor is routinely too long in a 480px panel.
- [ ] **Check the hooks as a set.** Read all of one body's hooks in a row. If two could be
      swapped without anyone noticing, they aren't distinguishing anything.
- [ ] **Sample the references.** Open two or three per body. This is the highest-risk area —
      a fabricated arXiv ID looks completely authentic.
- [ ] **Check `whenToUse` against the bar** in CONTENT_GUIDE §1. Vague entries silently degrade
      the advisor, and you won't notice until Phase 4 gives bad answers.
- [ ] **Commit the batch** as one commit, e.g. `Content: inner system (mercury, venus, terra, mars)`.

Then run `npm run check-links` once at the end of all seven batches, not per batch.

---

## 8. Failure modes, and what actually prevents them

| Risk | What prevents it |
|---|---|
| Two agents both create an entry id like `attention` | `tools/validate-content.ts` fails on duplicate ids. Run it after every batch. |
| Voice drifts between bodies | The gold-standard entry, plus reading each body's hooks as a set. |
| Fabricated citations | The brief's hard rule, plus `npm run check-links`. Assume this *will* happen and check. |
| Schema drift | `types/content.ts` is frozen at end of Phase 2 and `tsc` rejects violations. Agents cannot quietly extend it. |
| Merge conflicts | Structurally impossible if the one-file-per-agent rule holds. |
| Cross-links pointing nowhere | The validator resolves every `related` id. Expect failures in early batches, since later bodies don't exist yet — fix in a final cross-link pass. |
| Review backlog | Cap at 4 agents per batch. |

The one that will actually bite you is **fabricated references**. Everything else is caught
mechanically. That one needs your eyes.

---

## 9. What this costs

Each agent starts with an empty context and re-reads the two guides — roughly 6–8k tokens of
reading before it writes anything. Four agents per batch, seven batches, is ~28 cold starts.

That's the real trade: you're spending tokens to buy wall-clock time. For Phase 3 it's clearly
worth it — the work is genuinely independent and there's a lot of it. For Phase 1 it would be
pure waste, because the agents would spend their context re-deriving an architecture that has to
be consistent anyway.

---

## 10. Recommended sequence from here

1. **One agent, Phase 1** (engine). Sequential, ~11 modules. Do not parallelize.
2. **Same or one agent, Phase 2** (UI shell + schema + 3 sample entries). Freeze the schema.
3. **Parallel, Phase 3** — batch 1, review hard, recalibrate the brief, then batches 2–7.
4. **One agent, Phase 4** (search + advisor).
5. **One agent, Phase 5–6** (polish + deploy).
