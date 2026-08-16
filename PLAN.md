# DS Universe — Plan

An explorable map of the data science algorithm universe, rendered as a solar system.

> **Implementing agent: read §0 and §1 in full before writing any code.** Then read only the
> section for the phase you are on.
>
> Two companion documents hold the detail — consult them while working, don't try to hold them
> in your head:
> - **[docs/ENGINE_SPEC.md](docs/ENGINE_SPEC.md)** — constants, visual language, interaction
>   model, coordinate systems, module contracts, canvas pitfalls. Read before Phase 1.
> - **[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)** — register, length targets, a
>   gold-standard entry, vetted reference sources. Read before Phase 3.
>
> This document is the source of truth for *what* and *when*. Check off `- [ ]` items as you go.

---

## 0. Ground rules

Hard constraints, not suggestions. Each is a mistake that is cheap to avoid now and expensive
to unwind later.

### Process

1. **Read before you write.** Before editing a file, read it. Before writing a new module, read
   its contract in [ENGINE_SPEC §9](docs/ENGINE_SPEC.md#9-module-contracts) — the exported
   signatures are specified. Implement *those*. Do not invent a different API and wire it up.
2. **One task at a time.** The checklists in §4 are sized to be one unit of work each. Complete
   one, verify it against its acceptance criterion, commit, then move on. Do not batch five
   engine modules and then debug them together.
3. **Verify visually, not just logically.** Every Phase 1 task ends with "run `npm run dev` and
   look at it." Canvas code that typechecks and throws no errors is routinely, completely wrong
   on screen. Looking is the test.
4. **Stuck twice on the same thing → stop and ask.** If two attempts at the same bug fail, do
   not try a third variation. Write down what you observed, what you expected, and ask.
5. **Never mark a task complete that you have not verified.** If something is partly working,
   say so explicitly and describe what is missing.

### Code

6. **No new dependencies** beyond those already installed (see §4 Phase 0) without asking first.
   Not for easing curves, not for fuzzy matching, not for colour manipulation, not for a tiny
   utility. Write the ~20 lines.
7. **No `any`. No `@ts-ignore`. No non-null `!`** unless you add a comment explaining why the
   value cannot be null. If types are fighting you, the model is probably wrong — fix the model.
8. **No empty or swallowing `catch` blocks.** Either handle it meaningfully or `console.error`
   with context and re-throw. Silent failure inside a render loop is invisible and costs hours.
9. **File size cap: 300 lines.** Over it means the module does more than one thing — split it.
   `src/main.ts` in particular stays a thin bootstrap (~80 lines). It is not where logic lives.
10. **No premature abstraction.** No plugin system, no event bus, no entity-component framework,
    no generic "renderer registry". There are 27 bodies and 5 render functions. Call them.
11. **Delete dead code rather than commenting it out.** Git has the history.
12. **Match the surrounding style** once files exist. Same naming, same comment density, same
    import ordering. Do not reformat files you are only partly editing.

### Content

13. **Research first — write from sources, not from recall.** Every Phase 3 entry is built from
    web and reference searches performed *while writing it*, with no exceptions, including
    algorithms you are confident you know. Look it up, read the primary source or a canonical
    text, then write. Do not draft from memory and search afterwards to confirm — that inverts
    the process into hunting for support for text you have already committed to, which is
    exactly the failure this rule exists to prevent. Workflow in
    [CONTENT_GUIDE §3](docs/CONTENT_GUIDE.md#3-research-first-authoring).
14. **Never invent anything.** No invented URL, DOI, arXiv ID, or YouTube video ID — and equally
    no invented year, author, complexity bound, hyperparameter default, or historical claim.
    Use the vetted sources in
    [CONTENT_GUIDE §5](docs/CONTENT_GUIDE.md#5-vetted-reference-sources) or something you have
    actually opened. **Never guess a YouTube video ID** — link a channel or playlist instead.
    A fabricated detail is worse than an absent one, because nothing distinguishes it from a
    real one.
15. **Never write placeholder content.** No `intuition: 'TODO'`, no lorem ipsum, no "this
    algorithm is used for various tasks". If you cannot write a real entry, leave it out and say
    which ones you skipped.
16. **Follow the gold-standard entry** in
    [CONTENT_GUIDE §2](docs/CONTENT_GUIDE.md#2-gold-standard-entry--match-this) exactly for
    structure, length and register. It is calibrated. Match it.

### When to stop and ask

- A design decision in §3 or in ENGINE_SPEC seems wrong → say so, don't silently change it.
- The schema doesn't fit an entry you're writing → ask before extending it.
- You want to add a dependency, a build step, or a framework.
- A phase's acceptance criterion can't be met as written.

---

## 1. Context

**What we're building.** A browser-based, zero-backend webapp that teaches the entire data
science algorithm landscape — from ordinary least squares through every classical method, into
neural nets and deep learning, all the way to modern LLMs — rendered as an explorable solar
system. Each major segment of the field is a planetary body. Hovering gives a one-line hook;
clicking flies the camera in, reveals the individual algorithms as moons, and opens a detail
card that goes as deep as the reader wants.

**Why.** Algorithm taxonomies are normally flat lists or dry decision trees. They give you names
but not *relationships* — what's foundational, what's a variant of what, what era something came
from, what replaced it. A spatial metaphor makes the structure of the field legible at a glance
and makes exploring it feel like discovery rather than revision.

**Intended outcome.** A reader lands on the page, sees the whole field at once, and can either
wander freely or type "I have 50k rows of tabular customer data and need to predict churn, and my
boss wants to know why" and get a ranked shortlist with honest pros and cons. Every card leaves
them genuinely informed and points them at real books, papers, free texts and lectures.

**Environment (verified 2026-08-15):**
- **Repo path: `C:\Users\akoda\Projects\DS_universe`.** Windows 11, PowerShell primary.
  Git on `main` tracking `origin/main` at `https://github.com/ako89/DS_universe.git`.
- **GitHub Pages is already enabled** on the repo. Phase 6 only needs the workflow file and a
  correct `base` path — do not re-enable or reconfigure Pages.
- **Node v24.19.0 / npm 11.17.0** at `C:\Program Files\nodejs\`. Python 3.14.7 also present.
- ⚠️ **If `node` is "not recognized"**, your shell predates the Node install. Fix with
  `$env:Path = "C:\Program Files\nodejs;$env:Path"`. Do **not** conclude Node is missing and do
  **not** install anything.

---

## 2. Locked decisions

Confirmed with the user. Do not relitigate.

| Decision | Choice |
|---|---|
| Rendering | **2D canvas orrery.** No Three.js, no WebGL, no image assets. |
| Build | **Vite** — dev server, HMR, production build. |
| Framework | **None.** Vanilla DOM for UI chrome. |
| Language | **TypeScript**, `strict: true`. |
| Audience | **Layered cards** — intuition always visible, math collapsed. |
| Coverage | **Comprehensive**, tiered (§3). |
| Drill-down | **Zoom in → moons appear.** |
| Layout metaphor | **Distance = conceptual complexity.** |
| References | **All four kinds** per Tier 1 card. |
| Extra features | Search · problem→algorithm advisor · GitHub Pages. |
| *Not* building | Visited-state tracking, guided tour. User deselected both — **do not add**. |

**Judgment calls made during planning** (flag if you disagree, don't silently override):

1. **Scope tiering.** The honest taxonomy is ~222 entries, above the ~90–120 originally
   discussed. Rather than cut the map, entries are **Tier 1** (full card, ~115) or **Tier 2**
   (stub: hook, intuition, 2 refs). Tier 2 moons render smaller and dimmer — deliberate visual
   hierarchy, not a gap.
2. **Content authored as `.ts`, not `.json`.** This is what cashes in the TypeScript decision —
   see [ENGINE_SPEC §7](docs/ENGINE_SPEC.md#7-the-content-schema).
3. **KaTeX via npm**, tree-shaken by Vite. No vendored blobs.

---

## 3. The taxonomy

**The binary-star conceit.** Two gravitational centers, an honest reflection of the field:
**Sol** (classical statistical learning) at the origin, **Nova** (attention and scale) far out.
Deep-learning bodies sit in the transit between them. Bodies past the midpoint render lit from
Nova's direction rather than Sol's.

Legend: `★` = Tier 1 (full card). Unmarked = Tier 2 (stub).

### ☉ SOL — *The Objective* (inner star, 6)
The energy source every planet runs on: pick a model, define a loss, minimize it over data.
★Empirical risk minimization · ★Loss functions (MSE, cross-entropy, hinge, Huber) · ★Maximum
likelihood & MAP · ★Gradient descent (batch/SGD/mini-batch) · ★Bias–variance decomposition ·
Convexity & the no-free-lunch theorem

### ☿ Mercury — *Linear & Probabilistic Foundations* (9)
★Ordinary least squares · ★Ridge (L2) · ★Lasso (L1) · Elastic Net · Polynomial regression ·
★Logistic regression · ★Generalized linear models · ★Naive Bayes · Linear & quadratic
discriminant analysis

### ♀ Venus — *Similarity & Instance-Based* (6)
★k-Nearest Neighbors · ★Distance metrics (Euclidean, Manhattan, cosine, Mahalanobis, Jaccard) ·
Kernel density estimation · LOESS · ★Approximate nearest neighbour (KD-tree, ball tree, LSH) ·
★HNSW *(bridges to Athenaeum/RAG)*

### ⊕ Terra — *Trees & Rules* (5)
★Decision trees (CART) · ID3 / C4.5 · ★Regression trees · ★Pruning & cost-complexity · Rule
induction (RIPPER)

### ♂ Mars — *Ensembles* (8)
★Bagging · ★Random Forest · Extremely randomized trees · ★AdaBoost · ★Gradient boosting
machines · ★XGBoost · LightGBM & CatBoost · ★Stacking & blending

### ⬡ The Belt — *Evaluation, Validation & the Craft* (8, asteroid field)
The most-skipped and most-important region. Boundary of the inner system.
★Train/val/test & data leakage · ★Cross-validation · ★Classification metrics · ★Regression
metrics · ★Overfitting & regularization · ★Class imbalance · ★Hyperparameter search ·
Calibration (Platt, isotonic)

### ⯛ Pallas — *Interpretability & Trust* (6)
★SHAP · ★LIME · ★Permutation & impurity feature importance · Partial dependence & ICE ·
Counterfactual explanations · Fairness metrics & bias auditing

### ♃ Jupiter — *Clustering, Density & Anomaly* (10)
★k-Means & k-Means++ · ★Hierarchical clustering · ★DBSCAN · ★HDBSCAN · OPTICS & mean shift ·
★Gaussian mixture models & EM · Spectral clustering · ★Isolation Forest · One-class detection
& LOF · Association rules (Apriori, FP-Growth)

### ♄ Saturn — *Dimensionality Reduction & Representation* (9, rings = the manifold)
★PCA · Kernel PCA · ★SVD & truncated SVD · ★NMF · ICA & factor analysis · MDS / Isomap / LLE ·
★t-SNE · ★UMAP · Random projection & self-organizing maps

### ♅ Uranus — *Kernels, Margins & Gaussian Processes* (6)
★Support vector machines · ★The kernel trick · Support vector regression · One-class SVM ·
★Gaussian processes · Bayesian optimization

### ♆ Neptune — *Bayesian Inference & Graphical Models* (8)
★Bayes' theorem & conjugate priors · ★Bayesian linear/logistic regression · ★MCMC · ★Variational
inference · Bayesian networks · ★Hidden Markov models · Conditional random fields · ★Latent
Dirichlet allocation

### ⯰ Chronos — *Time Series & Forecasting* (8)
★ARIMA / SARIMA · ★Exponential smoothing & Holt–Winters · STL decomposition · ★Kalman filters &
state space models · Prophet · VAR · GARCH · ★Dynamic time warping & changepoint detection

### 🜂 Prometheus — *Neural Network Foundations* (9) — *first body of the transit*
★The perceptron · ★Multilayer perceptron · ★Backpropagation & autodiff · ★Activation functions ·
★Weight initialization · ★Batch & layer normalization · ★Dropout & weight decay · ★Optimizers
(momentum, RMSProp, Adam, AdamW) · Vanishing gradients & universal approximation

### 🜃 Vulcan — *Convolutional Networks & Vision* (8)
★Convolution & pooling · ★LeNet → AlexNet → VGG · ★ResNet & skip connections · Inception &
EfficientNet · ★Transfer learning · ★Object detection (R-CNN family, YOLO) · ★U-Net &
segmentation · ★Vision Transformer

### 🜄 Echo — *Recurrent Networks & Sequences* (6)
★Vanilla RNN & BPTT · ★LSTM · ★GRU · ★Seq2seq encoder–decoder · ★Bahdanau/Luong attention
*(the direct ancestor of Nova)* · TCNs & WaveNet

### 🜁 Chimera — *Generative Models* (8)
★Autoencoders · ★Variational autoencoders · ★GANs · DCGAN / StyleGAN / CycleGAN · Normalizing
flows · ★Autoregressive generation · ★Diffusion models (DDPM) · ★Latent & score-based diffusion

### ⬢ Arachne — *Graph Learning* (6)
★Graph representation & message passing · ★Graph convolutional networks · GraphSAGE · ★Graph
attention networks · ★node2vec / DeepWalk · Link prediction & graph pooling

### ⚵ Odyssey — *Reinforcement Learning* (10)
★MDPs & the Bellman equation · ★Value & policy iteration · ★Q-learning & SARSA · ★DQN · ★Policy
gradients / REINFORCE · ★Actor–critic · ★PPO *(the bridge to RLHF)* · TRPO / SAC / DDPG ·
★MCTS & AlphaZero · ★Multi-armed bandits

### ☆ NOVA — *Attention & Scale* (outer star, 6)
★Self-attention · ★Multi-head attention · ★The transformer block · ★Positional encoding (RoPE,
ALiBi) · ★Scaling laws · Encoder vs decoder vs encoder–decoder

### ⬣ Babel — *Tokenization & Embeddings* (6)
★Byte-pair encoding · WordPiece & SentencePiece · ★word2vec & GloVe · ★Contextual embeddings ·
★Sentence embedding models · Tokenizer pathologies

### ⬣ Genesis — *Pretraining & Model Families* (8)
★Causal vs masked language modelling · ★BERT lineage · ★GPT lineage · T5 & encoder–decoder ·
★Data curation & deduplication · ★Mixture of experts · ★State space models (Mamba) · Long-context
architectures

### ⬣ Forge — *Fine-tuning & Alignment* (7)
★Supervised fine-tuning · ★LoRA & QLoRA · Adapters & prefix tuning · ★RLHF · ★DPO ·
★Instruction tuning · Constitutional AI & RLAIF

### ⬣ Velocity — *Inference & Efficiency* (7)
★KV cache · ★FlashAttention · ★Quantization · ★Knowledge distillation · ★Speculative decoding ·
Continuous batching & paged attention · ★Sampling (temperature, top-k, top-p)

### ⬣ Athenaeum — *Retrieval, Memory & RAG* (6)
★Retrieval-augmented generation · ★Vector databases & ANN indexes *(links back to Venus/HNSW)* ·
★Chunking strategies · ★Hybrid search & BM25 · ★Rerankers & cross-encoders · Long-context vs
retrieval

### ⬣ Daedalus — *Agents & Tool Use* (6)
★Function/tool calling · ★ReAct loops · ★Planning & decomposition · Model Context Protocol ·
Multi-agent systems · Computer use & browser agents

### ⬣ Iris — *Multimodal* (5)
★CLIP & contrastive pretraining · ★Vision-language models · Audio models · Video & world models ·
Unified any-to-any architectures

### ⬣ Aegis — *Evaluation, Safety & Interpretability* (8)
★LLM benchmarks & their limits · ★LLM-as-judge · ★Hallucination & grounding · ★Red teaming &
jailbreaks · Guardrails · ★Mechanistic interpretability · Sparse autoencoders · Chain-of-thought
faithfulness

### ☄ The Oort Cloud — *Adjacent territories* (4 comet clusters, 22) — **Phase 8 only**
- **Causality** (7): potential outcomes · do-calculus & DAGs · propensity scores · diff-in-diff · instrumental variables · uplift modelling · synthetic control
- **Recommenders** (6): collaborative filtering · matrix factorization · implicit ALS · two-tower retrieval · sequential recommenders · cold start
- **Survival** (4): Kaplan–Meier · Cox proportional hazards · accelerated failure time · competing risks
- **Derivative-free optimization** (5): genetic algorithms · simulated annealing · particle swarm · CMA-ES · linear/integer programming

**Totals:** 2 stars + 25 bodies + 4 comet clusters ≈ **222 entries**, **~115 Tier 1**.

---

## 4. Task list

Complete one item, verify against its acceptance criterion, commit, move on.
Phases 0–2 are sequential. Phase 3 (content) can run parallel with 4–5 once the schema is frozen.

### Phase 0 — Scaffold ✅ complete

- [x] Project config: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`
- [x] Dependencies installed — `katex`; dev: `vite`, `typescript`, `vitest`, `@types/katex`, `@types/node`
- [x] `vite.config.ts` — `base: '/DS_universe/'`, alias `@` → `src`
- [x] `tsconfig.json` — strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noUnusedLocals`
- [x] `index.html` — canvas + `#overlay` `#card` `#modal` roots, a11y summary region, noscript
- [x] `src/styles/tokens.css` + `src/styles/main.css`
- [x] `src/engine/constants.ts`
- [x] `src/main.ts` placeholder bootstrap
- [x] Plan split into `PLAN.md` + `docs/ENGINE_SPEC.md` + `docs/CONTENT_GUIDE.md`
- [x] `README.md`
- [x] `.claude/launch.json` for the dev server
- **Verified:** `npm run build` typechecks and builds clean; `npm run dev` serves a black
  full-viewport page at `http://localhost:5173/DS_universe/`; canvas paints `rgb(5,6,13)` with a
  correctly DPR-scaled backing store; zero console errors.

**Gotchas already hit and resolved — don't rediscover these:**
- TypeScript 7 **removed `baseUrl`**. `paths` targets must be relative (`"./src/*"`).
- `@types/node` is required for `vite.config.ts` and `tools/`; `types` is `["vite/client", "node"]`.
- The dev server URL includes the base path: **`http://localhost:5173/DS_universe/`**, not `/`.
- `.claude/launch.json` uses the absolute path to `npm.cmd` because tool subprocesses inherit a
  PATH that predates the Node install. Once shells refresh, this can go back to plain `"npm"`.
- ✅ **The repo was moved out of iCloud Drive** at the end of Phase 0, to
  `C:\Users\akoda\Projects\DS_universe`. iCloud had silently renamed `tsconfig.json` to
  `tsconfig 2.json`, leaving no `tsconfig.json` at all, and the symptom was badly misleading:
  `tsc --noEmit` printed its *help text* rather than an error, because with no config and no
  input files it has nothing to do. **Work only in the new path.** The old
  `iCloudDrive\Documents\Projects\DS_universe` folder is a stale mirror containing a `MOVED.md`
  marker and is safe to delete.

### Phase 1 — Engine

Read [ENGINE_SPEC](docs/ENGINE_SPEC.md) §8 (coordinate systems) and §9 (module contracts) first.
Each item ends with: run `npm run dev` and confirm on screen.

- [x] `engine/rng.ts` — `mulberry32`. *Done when:* the same seed gives the same sequence twice.
- [x] `engine/canvas.ts` — DPR sizing per ENGINE_SPEC §8, resize observer, RAF loop with
      `DT_CLAMP`. Delete the placeholder `resize()` in `main.ts` when this lands.
      *Done when:* a test rect stays sharp on a HiDPI display and correct after window resize.
- [x] `engine/camera.ts` — per the §9 contract; `zoomAt` exactly as ENGINE_SPEC §8.
      *Done when:* `tests/camera.test.ts` proves the world point under the cursor is invariant
      across a zoom, and pan+zoom round-trips through `screenToWorld`/`worldToScreen`.
- [x] `render/starfield.ts` — 3 offscreen layers, blit with parallax + wrap, per-layer twinkle.
      *Done when:* panning shows clear depth separation and no seams at the wrap.
- [x] `render/orbit.ts` — tilted ellipse hairlines, hover brightening.
- [x] `render/planet.ts` — lit sphere, rim light, glow, gas banding, cached gradients.
      *Done when:* discs are **circular** (not squashed) and lighting points at the right star.
- [x] `render/star.ts` — corona, flare spikes, pulse; Sol warm, Nova cool.
- [x] `render/rings.ts` (Saturn, correct occlusion) · `render/belt.ts` (seeded rocks)
- [x] `engine/scene.ts` — build from `system.ts`, orbital motion, moon sub-orbits, pause flag.
- [x] `render/labels.ts` — HTML overlay, `transform` only, collision-priority thinning.
- [x] `engine/picking.ts` — world-space hit-test with `MIN_PICK_PX`, `ViewState` machine.
- [x] `engine/input.ts` — drag-pan, cursor-anchored wheel zoom (`{ passive: false }`), touch,
      keyboard map from ENGINE_SPEC §3.
- **Done when:** 60fps at 1440p; zoom into any body and back out with no drift; labels don't
  jitter; `prefers-reduced-motion` freezes all motion. ✅ **Verified** — see the Phase 1 completion
  note below.

**Phase 1 complete.** `src/types/content.ts` and `src/content/system.ts` (nominally Phase 2, §2
below) were pulled forward because `engine/scene.ts` needs them to build the scene — see those
files' header comments and PLAN.md's commit history for the reasoning. One deliberate deviation
from the ENGINE_SPEC §9 contract: `SceneBody` does not carry `data: Body`, since no Entry content
exists until Phase 3 and fabricating placeholder content to satisfy the type would violate §0's
no-invention rules. `engine/scene.ts` and `engine/picking.ts`'s file comments explain the
decoupling and what Phase 2/3 needs to wire up once real content/moon ids exist. `render/draw.ts`
(not in the original file list) was added to keep `main.ts` a thin bootstrap rather than growing a
branching per-body-type render loop inline — it composes the render/*.ts functions PLAN.md and
ENGINE_SPEC already call for.

Verified end-to-end with headless Playwright against the real dev server: 59–60fps sustained at
2560×1440 both at the default view and zoomed into Jupiter with all 10 moons rendered; clicking a
body flies the camera in, Escape flies back to a pixel-identical home framing across repeated
cycles (no drift); a body's label moves ~0.025px/frame (no jitter); and under emulated
`prefers-reduced-motion`, the canvas is byte-identical across a 2-second window and camera flights
snap instantly instead of tweening. A real bug (a negative-radius `ctx.arc()` call that silently
killed the render loop for any body under 1px on screen — i.e. every moon at the default zoom) was
found and fixed in the course of this verification.

### Phase 2 — UI shell, then freeze the schema ✅ complete

- [x] `types/content.ts` — verbatim from [ENGINE_SPEC §7](docs/ENGINE_SPEC.md#7-the-content-schema).
      **Pulled forward into Phase 1** — engine/scene.ts needed it; see the Phase 1 completion note
      above. Pressure-tested against the 3 sample entries below with no field changes needed —
      **frozen**, see the file's header comment.
- [x] `data/registry.ts` — `import.meta.glob` discovery, flat entry map, dev-time duplicate check
- [x] `tools/validate-content.ts` — unique ids, `related` resolves, tier completeness,
      system↔content parity (one-directional — see the file's header comment for why)
- [x] `ui/tooltip.ts` — hover delays, viewport-edge flipping
- [x] `ui/card.ts` — all 8 sections, collapse state, 180ms crossfade, focus trap, Esc to close
      (section markup split into `ui/card-sections.ts` to hold the 300-line file cap)
- [x] Wire KaTeX to render `math.latex` lazily (only when the section is expanded) — `ui/math.ts`
- [x] `ui/breadcrumb.ts` · `ui/help.ts` (`?` overlay)
- [x] Mobile: bottom sheet, tap-to-hover-then-select, breakpoints
- [x] **Write 3 complete entries** — `linear-regression`, `dbscan`, `self-attention` — to
      pressure-test the schema against a simple, a mid and a modern case. Written from sources
      per CONTENT_GUIDE §3; see `src/content/bodies/{mercury,jupiter,nova}.ts` file headers for
      what was checked and a network-access caveat for this session (below).
- [x] **Freeze `types/content.ts`.** Any change after this requires asking first.
- **Done when:** all three cards render fully, math renders, cross-links fly the camera, and
  `npm run validate` exits 0. ✅ **Verified** — see the Phase 2 completion note below.

**Phase 2 complete.** Verified end-to-end with headless Playwright against the real dev server,
desktop (1440×900) and mobile (390×844) viewports: clicking a body label flies the camera and
enters its 'body' state; hovering a moon with real content shows a tooltip and clicking it opens
the card with all sections rendering (header chips, intuition, how-it-works with hyperparameter
table, when-to-use/when-it-fails two-column layout); expanding "The math" lazy-loads KaTeX and
renders it (confirmed 2 `.katex` elements for DBSCAN's two expressions); expanding "In code" shows
the code block; clicking a related chip flies the camera to a different body and crossfades the
card to that entry, with the breadcrumb and accent-hue border updating correctly; the `?` overlay
opens and traps focus, and Escape closes it before falling through to view-state back-navigation;
on a narrow mobile viewport the card renders as a bottom sheet with a drag handle, and a first tap
on a moon shows its tooltip without navigating while a second tap on the same moon opens the card
(confirmed with real `touchscreen.tap()`, not mouse events). `npm run validate`, `npm run build`
and `npm test` all pass; zero console errors across the whole flow.

Two real bugs were found and fixed in the course of this verification, consistent with the Phase 1
note that canvas/UI code which typechecks cleanly is routinely wrong on screen: (1) body labels had
`cursor: pointer` in CSS but no click handler wired to them at all — clicking a label did nothing;
`render/labels.ts` now takes an `onClick` callback. (2) the card's sticky header used the
intentionally-translucent `--bg-raised` token, so content scrolling underneath showed through it;
`card.css`'s `.card-header` now uses an opaque flattened color.

**A tooling constraint hit during content research, worth flagging for future phases:** this
session's `WebFetch` tool returned `EGRESS_BLOCKED` for every external domain tried (scikit-learn.org,
arxiv.org, en.wikipedia.org, york.ac.uk), and a raw `curl` through the session's own configured
proxy to the same host got a `403` from the proxy — a genuine environment/network policy for this
session, not a bug to route around. `WebSearch` still worked and returns real crawled excerpts
with real URLs, so research proceeded on that alone; every fact in the 3 entries was corroborated
that way (see each content file's header for specifics), but CONTENT_GUIDE §3's "verify every URL
by opening it" step could not be done literally. Re-run `npm run check-links` (Phase 3) in an
environment with unrestricted web access before shipping these three entries, and expect the same
constraint to affect Phase 3's much larger research load unless the policy differs there.

Two further engine/input changes landed alongside the UI shell, both anticipated by Phase 1's own
file comments rather than scope creep: `engine/scene.ts`'s `SceneMoon` now carries a real `id`
where a moon's content module exists (anonymous otherwise — nothing invented for unwritten moons),
and `engine/picking.ts`'s `hitTest` resolves a moon's `entryId` for the currently focused body. That
in turn let `←/→` (previous/next sibling moon) get wired in `engine/input.ts`, which Phase 1 had
explicitly left unwired pending exactly this.

### Phase 3 — Content (the long pole)

> **Every entry in this phase is written from sources, not from recall.** Search for the
> algorithm, read a primary source or canonical text, then write — for all 222 entries, with no
> exceptions for ones you are confident you know. Nothing factual gets invented: not a year, not
> an author, not a complexity bound, not a hyperparameter default, not a URL. If it cannot be
> sourced, leave it out and report it (§0 rules 13–15).
>
> **This means content agents need web search and fetch tools available.** An agent without them
> cannot do this phase correctly — check before launching a batch.

Read [CONTENT_GUIDE](docs/CONTENT_GUIDE.md) first. One checkbox = every moon in that body written
at its §3 tier, with `npm run validate` clean.

- [ ] `sol.ts` · [ ] `mercury.ts` · [ ] `venus.ts` · [ ] `terra.ts` · [ ] `mars.ts`
- [ ] `belt.ts` · [ ] `pallas.ts` · [ ] `jupiter.ts` · [ ] `saturn.ts`
- [ ] `uranus.ts` · [ ] `neptune.ts` · [ ] `chronos.ts`
- [ ] `prometheus.ts` · [ ] `vulcan.ts` · [ ] `echo.ts` · [ ] `chimera.ts`
- [ ] `arachne.ts` · [ ] `odyssey.ts`
- [ ] `nova.ts` · [ ] `babel.ts` · [ ] `genesis.ts` · [ ] `forge.ts`
- [ ] `velocity.ts` · [ ] `athenaeum.ts` · [ ] `daedalus.ts` · [ ] `iris.ts` · [ ] `aegis.ts`
- [ ] **Re-verify the 3 Phase 2 entries** — `linear-regression`, `dbscan` and `self-attention`
      were written in a session whose `WebFetch` returned `EGRESS_BLOCKED` for every external host
      (see the Phase 2 note above), so they were sourced from search-result excerpts rather than
      opened pages and never got CONTENT_GUIDE §3's "open every URL" step. **WebFetch works in
      this environment** — verified against scikit-learn.org, 2026-08-16. Open every cited URL and
      re-check years, authors, complexity bounds and hyperparameter defaults against real sources.
      Highest risk: `linear-regression`'s 1805 Legendre attribution and `O(n·p²)` SVD bound;
      `dbscan`'s `O(n log n)` / `O(n²)` bounds and its two cited papers; `self-attention`'s
      citations and any lineage claim.
- [ ] Cross-link pass — every entry has ≥2 resolving `related`, ≥1 crossing bodies where sensible
- [ ] `npm run check-links` — fix or drop every dead URL

### Phase 4 — Search & advisor (lexical)

- [ ] `data/search-index.ts` — BM25 + fuzzy name match, per the §9 contract
- [ ] `ui/search.ts` — `/` palette, grouped, keyboard nav, flies camera on select
- [ ] `data/lexicon.ts` — ~150 synonym/intent terms to start
- [ ] `ui/advisor.ts` — modal, facet-boosted ranking, authored pros/cons, "why this matched"
- [ ] `tests/advisor.test.ts` — ≥20 realistic problem statements with expected top-3; tune
      weights against it so ranking cannot silently regress
- **Done when:** the §5 acceptance query returns gradient boosting, logistic regression and
  random forest, each with cons.

### Phase 5 — Polish & accessibility

- [ ] Full keyboard traversal; visible focus rings; no focus traps
- [ ] Screen reader: labels and cards in the a11y tree; populate `#a11y-summary`
- [ ] Contrast audit — body copy ≥ 4.5:1 against the panel fill
- [ ] `prefers-reduced-motion` honoured everywhere (orbits, tweens, twinkle, pulse)
- [ ] Loading skeleton; graceful error if content fails to resolve
- [ ] Deep links — `#/jupiter/dbscan` restores camera and card; shareable
- [ ] Bundle size vs the ENGINE_SPEC §11 budget; go lazy if over
- [ ] Chrome, Firefox, Edge + one real mobile device

### Phase 6 — Deploy

GitHub Pages is **already enabled** — do not reconfigure it.

- [ ] `.github/workflows/deploy.yml` — `npm ci` → `validate` → `test` → `build` → deploy to Pages
- [ ] Confirm the Pages source is set to GitHub Actions (it may currently be branch-based)
- [ ] Verify `base: '/DS_universe/'` — assets must resolve under the subpath, not `/`
- [ ] OG/Twitter meta + preview image
- [ ] Load the live URL and confirm KaTeX, content and deep links all work

### Phase 7 — Semantic advisor

- [ ] `tools/build-embeddings.ts` — embed each entry's search doc offline, quantized output
- [ ] `npm i @huggingface/transformers`; confirm Vite handles the WASM/ONNX assets
- [ ] `data/semantic.ts` — lazy-load on first advisor use, embed query, rerank top-30 lexical
- [ ] **Verify degradation:** delete the model asset; the advisor must still work at full speed

### Phase 8 — Oort cloud

- [ ] Comet-cluster rendering (elongated orbits, tails pointing away from Sol)
- [ ] `oort-causality.ts` · [ ] `oort-recommenders.ts` · [ ] `oort-survival.ts` · [ ] `oort-optimization.ts`
- [ ] Promote selected Tier 2 stubs to Tier 1

---

## 5. Verification

**Per task:** `npm run dev` and look at it · `npm run validate` and `npm test` exit 0 ·
`npm run build` typechecks clean · browser console clean (no errors, no 404s) · frame counter
(`D` toggles the dev overlay) holds 60fps zooming into Jupiter with all moons visible.

**End-to-end acceptance — the app is done when a reader can:**

1. Land on the page and see the whole system, both stars, every labelled body.
2. Hover any body and get a hook that says what that region of the field is for.
3. Click Jupiter, fly in, see its moons, click DBSCAN, and read a card that takes them from zero
   to genuinely informed — maths there if they want it, hidden if they don't.
4. Follow a `related` chip from DBSCAN to HDBSCAN and watch the camera move with them.
5. Press `/`, type "gradient boost", land on XGBoost.
6. Press `A`, type *"I have 50k rows of tabular customer data and need to predict churn, and my
   boss wants to know why"*, and get gradient boosting, logistic regression and random forest —
   each with honest cons — not a generic list.
7. Click through to a real, working book/paper/lecture link.
8. Do all of the above on a phone, and with a keyboard only.

---

## 6. Notes for future agents

- **§3 taxonomy is decided.** If something seems missing or misplaced, note it here and raise it
  with the user — don't silently reorganize the map.
- **Freeze `types/content.ts` at the end of Phase 2.** A schema change after 50 entries exist is
  a very bad day.
- **"When to use / when it fails" is the advisor's entire source of truth.** Concrete conditions,
  never platitudes. Re-read [CONTENT_GUIDE §1](docs/CONTENT_GUIDE.md#1-register-and-length)
  before writing any body.
- **Phase 3 is research-first.** Every entry is written from sources, not recall — search, open a
  real source, verify each URL, then write. Never invent a citation, a date, a complexity bound
  or a default. Never guess a YouTube video ID. Run `npm run check-links` before deploying, and
  remember it only catches dead links — a confidently wrong fact passes every check in this repo
  except a human reading it.
- **Content parallelizes; engine does not.** Multiple agents can each own a body module safely.
  Two agents in `engine/` at once will conflict. If you are running several agents, read
  [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) first — it has the agent brief and batch plan.
- **If `node` isn't recognised**, the shell predates the install — see §1. Don't install anything.
