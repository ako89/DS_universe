# DS Universe — Content Authoring Guide

Companion to [PLAN.md](../PLAN.md). Read this in full before writing any body module.

Content is roughly 70% of the work in this project and the part where quality varies most.
The schema itself lives in
[ENGINE_SPEC §7](ENGINE_SPEC.md#7-the-content-schema) — this document covers *how to write*.

---

## 1. Register and length

Write like a good teacher explaining to a smart colleague from a different field. Concrete over
abstract. Active voice. No hype — no "powerful", no "revolutionary", no "in today's fast-paced
world". Say what the thing actually does.

| Field | Target |
|---|---|
| `hook` | One sentence, ≤120 chars. Must convey what it *does*, not what category it's in. |
| `intuition` | 100–180 words. An analogy, then the mechanism in plain words. Zero notation. |
| `howItWorks.summary` | 1–2 sentences. |
| `howItWorks.steps` | 3–7 steps, each one line, imperative. |
| `whenToUse` / `whenNotToUse` | 2–5 items each, **concrete conditions**, not platitudes. |
| `math.latex` | 1–4 expressions, KaTeX syntax. Escape backslashes in TS strings. |
| `code` | 10–20 lines, runnable in spirit. Prefer scikit-learn / PyTorch idiom. |

### The `whenToUse` bar

The advisor ranks on these exact strings. Vague ones make the feature useless.

**Bad:** `'When you need good performance'` · `'For complex datasets'` · `'When accuracy matters'`

**Good:** `'Clusters are irregularly shaped or nested inside each other'` ·
`'You expect genuine outliers and want them labelled as noise rather than forced into a cluster'` ·
`'You need to explain individual predictions to a non-technical stakeholder'`

The test: could a reader check whether the condition holds for *their* problem? If not, rewrite it.

### The `hook` bar

The hook is what a reader sees on hover — often the only thing they read.

**Bad:** `'A popular clustering algorithm.'` (category, not behaviour)

**Good:** `'Finds clusters of any shape by following density — and calls the leftovers noise.'`

---

## 2. Gold-standard entry — match this

This is calibrated. Match its structure, length and register.

```ts
{
  id: 'dbscan',
  name: 'DBSCAN',
  aliases: ['density-based spatial clustering of applications with noise'],
  tier: 1,
  year: 1996,
  difficulty: 3,
  hook: 'Finds clusters of any shape by following density — and calls the leftovers noise.',
  intuition:
    'Imagine dropping onto a city at night and trying to identify neighbourhoods from the ' +
    'lights. You would not assume neighbourhoods are circular, and you would not insist every ' +
    'light belongs to one. You would look for regions where lights are packed closely together ' +
    'and treat the isolated ones as farmhouses. DBSCAN does exactly this. It defines a point as ' +
    '"core" if at least minPts other points lie within distance eps of it, then grows a cluster ' +
    'outward from each core point through its neighbours. Points that are near a cluster but not ' +
    'themselves dense get absorbed at the border; points near nothing are labelled noise. ' +
    'Because clusters grow by contact rather than by distance to a centre, they can be long, ' +
    'curved or interlocking — shapes k-means fundamentally cannot represent. You never specify ' +
    'the number of clusters; it falls out of the density structure.',
  howItWorks: {
    summary:
      'Label points as core, border or noise by counting neighbours within a radius, then ' +
      'connect core points that fall within each other\'s radius into clusters.',
    steps: [
      'For each point, count how many points lie within distance eps of it.',
      'Mark a point as a core point if that count is at least minPts.',
      'Connect any two core points that are within eps of each other.',
      'Each connected group of core points becomes one cluster.',
      'Assign each non-core point within eps of a core point to that cluster as a border point.',
      'Label every remaining point as noise (cluster -1).',
    ],
  },
  hyperparameters: [
    { name: 'eps', what: 'Radius defining a point\'s neighbourhood.',
      tuning: 'Plot the sorted distance to each point\'s k-th nearest neighbour (k = minPts) ' +
              'and look for the elbow. Too small fragments clusters into noise; too large ' +
              'merges everything into one.' },
    { name: 'minPts', what: 'Neighbours required within eps for a point to be a core point.',
      tuning: 'Start at 2 * n_features. Raise it for noisy data. Values below 3 rarely behave.' },
  ],
  whenToUse: [
    'Clusters are irregularly shaped, elongated or nested rather than roughly spherical',
    'You do not know how many clusters there are and do not want to guess',
    'You expect genuine outliers and want them labelled as noise, not forced into a cluster',
    'Data is low-dimensional (roughly under 10 features) or you have reduced it first',
  ],
  whenNotToUse: [
    'Cluster densities vary substantially — a single eps cannot fit both; use HDBSCAN',
    'Dimensionality is high, where distances concentrate and eps stops discriminating',
    'You need every point assigned to a cluster with no noise category',
    'Data is far too large for a spatial index to help and O(n^2) is unaffordable',
  ],
  facets: {
    task: ['clustering', 'anomaly-detection'],
    dataType: ['tabular', 'spatial'],
    dataSize: ['small', 'medium'],
    interpretability: 'high',
    trainingCost: 'low',
    needsScaling: true,
    handlesMissing: false,
    handlesCategorical: false,
    outputType: 'cluster-labels-with-noise',
  },
  math: {
    latex: [
      'N_\\varepsilon(p) = \\{ q \\in D : d(p,q) \\le \\varepsilon \\}',
      'p \\text{ is a core point} \\iff |N_\\varepsilon(p)| \\ge \\text{minPts}',
    ],
    notes:
      'Clusters are the equivalence classes of the transitive closure of density-reachability ' +
      'over core points. There is no objective function being minimised — DBSCAN is a ' +
      'construction, not an optimisation, which is why it has no random restarts and is ' +
      'deterministic apart from border-point tie-breaking.',
  },
  complexity: {
    train: 'O(n log n) with a spatial index; O(n^2) without',
    predict: 'n/a — no model is fitted',
  },
  code: [
    'from sklearn.cluster import DBSCAN',
    'from sklearn.preprocessing import StandardScaler',
    '',
    'X = StandardScaler().fit_transform(X_raw)   # scale first: eps is a distance',
    '',
    'db = DBSCAN(eps=0.3, min_samples=10).fit(X)',
    'labels = db.labels_                          # -1 marks noise',
    '',
    'n_clusters = len(set(labels)) - (1 if -1 in labels else 0)',
    'n_noise = list(labels).count(-1)',
  ].join('\n'),
  related: ['hdbscan', 'optics', 'k-means', 'isolation-forest'],
  references: {
    free: [
      { title: 'scikit-learn user guide — DBSCAN',
        url: 'https://scikit-learn.org/stable/modules/clustering.html#dbscan' },
    ],
    papers: [
      { title: 'A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise',
        url: 'https://cdn.aaai.org/KDD/1996/KDD96-037.pdf', year: 1996 },
      { title: 'DBSCAN Revisited, Revisited: Why and How You Should (Still) Use DBSCAN',
        url: 'https://doi.org/10.1145/3068335', year: 2017 },
    ],
    books: [
      { title: 'Introduction to Data Mining', author: 'Tan, Steinbach, Karpatne & Kumar',
        chapter: 'Ch. 8 — Cluster Analysis' },
    ],
    video: [
      { title: 'StatQuest', url: 'https://www.youtube.com/@statquest' },
    ],
  },
}
```

Note the video reference: a **channel**, not a guessed video URL. Follow that pattern unless you
have verified a specific link.

Note also `math.notes`: it says something a reader would not get from the formula alone (DBSCAN
is a construction, not an optimisation). That is what the notes field is for — not restating the
LaTeX in words.

---

## 3. Research-first authoring

**Every entry is written from sources, not from recall — all 222 of them, with no exceptions for
algorithms you are confident you know.**

### The order matters

Search → read → write. Not write → search → confirm.

The second order feels equivalent and isn't. Once you have drafted a paragraph, you go looking
for support for what you already said, and you find it, because for any plausible claim about a
well-known algorithm there is usually *something* that looks like corroboration. The errors that
survive that process are the confident, specific, subtly-wrong ones — a complexity bound that
applies to a different variant, a default that changed three library versions ago, a date that
belongs to the follow-up paper rather than the original.

Searching first costs a few minutes per entry. Fixing this class of error after 200 entries have
shipped costs a rewrite you cannot scope, because you cannot tell by reading which claims came
from a source and which came from fluency.

### Per entry

1. **Search for the algorithm** by name, plus its original paper if it has one.
2. **Open a real source.** The original paper, the relevant chapter of a canonical text from §5,
   or the library's own documentation. Prefer primary sources for claims of fact (who, when,
   what the method actually does) and documentation for practical claims (defaults, behaviour).
3. **Verify every reference URL by opening it.** Do not cite a link you have not loaded. This is
   where fabrication is most likely and most damaging.
4. **Then write**, in your own words. You are explaining what you just read, not paraphrasing it
   line by line — the register in §1 still applies, and a source does not license dense prose.
5. **Check the specifics against what you read**: year, authors, complexity, hyperparameter
   names and defaults, and any historical or lineage claim.

### ⚠️ PDFs: `WebFetch` will invent specifics rather than admit it failed

**This is the one fabrication route that survives the research-first rule, so read it before
citing any paper.**

`WebFetch` does not hand you the document. It converts the page and answers your prompt using a
small fast model. When the target is a PDF with no extractable text layer — a scan, a
fax-encoded TR, a compressed stream — that model receives little or nothing useful, and it does
not reliably say so. It answers anyway, in the same confident register as a successful fetch.

This was caught during Phase 3 batch 1. Fetching Friedman's gradient boosting paper returned
specific, plausible, correctly-formatted hyperparameter guidance — a shrinkage range and a tree
depth — that **do not appear anywhere in the actual paper.** Nothing about the response
distinguished it from a real read. Had it been trusted, two invented numbers would have shipped
inside an entry whose citation was genuine, which is precisely the failure mode this whole
section exists to prevent: real paper, real DOI, invented content.

**It is not limited to scans.** Batch 4 caught a worse case: fetching the AlexNet paper — a
normal PDF with a clean, ordinary text layer, nothing exotic about it — twice returned invented
numbers anyway (a wrong top-5/top-1 error split, a wrong neuron count, a wrong count of
fully-connected layers). There was no signal distinguishing this from a good fetch; the only
reason it was caught is that the agent downloaded the PDF and ran `pdftotext` on it directly
rather than trusting the summary. **So the "no text layer" framing above describes one way this
fails, not the boundary of the risk.** Treat every PDF this way, not just scanned ones.

**The rule:** a `WebFetch` summary of a PDF is a *lead*, never a source — for any PDF, not only
ones you suspect are scanned.

- **Prefer HTML.** The arXiv `/abs/` page (or its `ar5iv` full-text HTML rendering for an
  in-paper quote), the journal landing page, the author's own HTML version, or the library's
  documentation. Use these for title, authors and year, and for any specific number you need to
  cite — they are reliable and they are most of what you cite.
- **Never take a specific number from a `WebFetch` PDF summary, ever.** If a number only exists
  in a PDF, download it and extract the text yourself (`pdftotext -layout`, or equivalent) and
  confirm the number appears in the extracted text verbatim. If it does not, you did not read it,
  regardless of how confident or well-formatted the summary looked.
- **If a PDF will not yield text, or you cannot self-extract it, treat the claim as unsourced**
  and apply "If you cannot source it" below. Scanned papers are common among pre-2000 technical
  reports — expect this.
- **Verify a DOI through metadata, not the publisher.** `https://api.crossref.org/works/<doi>`
  returns title, authors and year as structured data, and works when the publisher blocks
  automated access. A 403 from Wiley, Springer, ACM or IEEE means the fetch was refused, **not**
  that the DOI is bad — do not drop a citation on that evidence alone.

The tell is confidence without traceability: if you cannot point at the sentence — in text you
personally pulled out of the file — that a number came from, you do not have the number.

### What must be sourced

Anything a reader could be misled by:

| Claim type | Example |
|---|---|
| Dates and attribution | `year: 1996`, "introduced by Ester et al." |
| Complexity | `'O(n log n) with a spatial index'` |
| Hyperparameter names and defaults | `min_samples`, "start at 2 × n_features" |
| Historical and lineage claims | "the direct ancestor of the transformer" |
| Every reference | title, URL, publication year |

Mechanism prose — how the algorithm actually works — is sourced too, but you are reading to get
it right rather than to quote. That is the field where good writing matters most and copying
helps least.

### If you cannot source it

**Leave it out. Do not fill the gap with plausible prose.** Omit the field if it is optional,
omit the entry if it is not, and report which ones you skipped and what you searched for. An
absent entry is a visible, fixable gap; an invented one is indistinguishable from a real one and
will not be caught by any tool in this repo.

---

## 4. Authoring workflow per body

1. Read the moon list for that body in [PLAN.md §3](../PLAN.md#3-the-taxonomy). Write every one
   at its marked tier.
2. **Write every `hook` first.** Doing all of them up front forces you to articulate what
   distinguishes each algorithm from its neighbours, which is exactly what stops entries blurring
   into each other. Hooks are claims about behaviour, so they are sourced like everything else —
   if you cannot say what a method does without guessing, research it before writing the hook.
3. Then full entries, one at a time, **running the §3 research loop for each** — search, open a
   real source, verify the URLs, then write. Work through fields in schema order.
4. Fill `related` with real ids. Prefer at least one **cross-body** link — HNSW → RAG crosses
   Venus to Athenaeum; PPO → RLHF crosses Odyssey to Forge; attention → seq2seq crosses Nova back
   to Echo. These links are what make the map feel like a map rather than 27 separate lists.
5. Run `npm run validate`. Fix everything.
6. Run `npm run check-links`. Fix or remove every dead URL.
7. Run `npm run dev`, open the planet, and **read three cards on screen**. Prose that reads fine
   in an editor is routinely too long in a 480px panel.

### Tier 2 stubs

A Tier 2 entry is a real, short entry — not a placeholder. A good one tells the reader what the
thing is, how it differs from the Tier 1 entry next to it, and where to read more. If you cannot
manage that, leave it out and report it rather than writing filler.

**What Tier 2 must contain.** `types/content.ts` is frozen, and only five fields on `Entry` are
optional. Everything else — including `howItWorks`, `whenToUse` and `whenNotToUse` — is
**required on every entry regardless of tier**, and `tsc` rejects an entry missing any of them.
So a Tier 2 stub is *short*, not *partial*. Only four fields actually get skipped:

| Field | Tier 2 |
|---|---|
| `id`, `name`, `tier`, `year`, `difficulty` | Required. Same as Tier 1. |
| `hook`, `intuition`, `facets` | Required, at full quality. Same bar as Tier 1 — these carry the entry. |
| `howItWorks` | Required. One-sentence `summary` + ~3 brief `steps`. |
| `whenToUse` / `whenNotToUse` | Required. 2 each, meeting the §1 concreteness bar. |
| `related` | Required. ≥1 (Tier 1 needs ≥2). |
| `references` | Required. ≥2 in total across any categories (Tier 1 needs all four categories). |
| `aliases` | Optional — include it whenever the thing has a real second name. Most Tier 2 entries do. |
| `math`, `code`, `hyperparameters`, `complexity` | Optional — **these are the four you skip.** |

This was settled during Phase 3 batch 1 (mercury/venus/terra/mars) and every entry from that
batch onward follows it. **Write short real content for the required fields — never filler to
satisfy the compiler.** If an algorithm does not warrant three honest steps and two honest
conditions, it does not warrant an entry; leave it out and report it. The alternative considered
and rejected was unfreezing the schema to make those three fields optional: that would ripple
through `ui/card.ts`, the validator, and the Phase 4 advisor, which reads `whenToUse` as its only
source of truth and would silently lose every Tier 2 entry from its ranking.

---

## 4.5. Facets: `handlesMissing` / `handlesCategorical` convention

Resolved during the Phase 3 wrap-up, after batches 1 and 2 encoded it two different ways
independently (`terra.ts`'s tree entries at the method level, `mars.ts`'s `gradient-boosting` at
the library level).

**These two facets describe the common library implementation the entry's own code sample
demonstrates — not the abstract method.** If the method can do something its usual implementation
cannot (or vice versa), say so in prose — typically in `whenNotToUse` or the intuition — rather
than letting the facet claim the method-level capability. The advisor and the card both present
facets as a fact about *this entry as written*, so they need to agree with the code sample and the
references, not with a more permissive variant a reader isn't being shown.

Concrete pattern: scikit-learn's `DecisionTreeClassifier`/`Regressor` do not support categorical
features natively (`handlesCategorical: false`) even though CART-the-method and Quinlan's C4.5
both can — `id3-c45` legitimately sets `handlesCategorical: true` because *its* common
implementation is Weka's J48, not scikit-learn, and the entry says so explicitly. Check the
library's own current docs before setting either facet; don't infer from the algorithm's textbook
description or from an older/newer version's behaviour than what the code sample shows.

This was applied during the wrap-up to `terra.ts`'s three scikit-learn-based entries
(`decision-trees`, `regression-trees`, `tree-pruning`); `id3-c45`, `rule-induction` and
`mars.ts`'s `gradient-boosting` already matched the convention and needed no change. It was not
re-audited across all 195 entries — apply it going forward, and fix an entry you notice violating
it while you're already touching that file for another reason.

**Separately unresolved:** `Facets.task`'s frozen union has no value for evaluation, safety or
mechanistic-interpretability activities, or for association-rule mining specifically —
`jupiter.ts`'s `association-rules` uses `task: ['clustering']` as the nearest available fit, which
is imprecise, and several `aegis.ts` entries made similar nearest-fit judgment calls (documented in
that file's own header comment). This is a schema gap, not a convention question, and fixing it
needs `types/content.ts` reopened, which requires the user's sign-off (`PLAN.md` §0 rule "the
schema doesn't fit an entry you're writing → ask before extending it") — it was not authorized as
part of this convention decision and is not fixed here.

---

## 5. Vetted reference sources

Prefer these. Anything outside this list must be verified before use.

### Free canonical texts

| Source | URL |
|---|---|
| Elements of Statistical Learning | https://hastie.su.domains/ElemStatLearn/ |
| An Introduction to Statistical Learning | https://www.statlearning.com/ |
| Dive into Deep Learning | https://d2l.ai/ |
| Deep Learning (Goodfellow, Bengio, Courville) | https://www.deeplearningbook.org/ |
| Understanding Deep Learning (Prince) | https://udlbook.github.io/udlbook/ |
| Probabilistic Machine Learning (Murphy) | https://probml.github.io/pml-book/ |
| Mathematics for Machine Learning | https://mml-book.github.io/ |
| Gaussian Processes for Machine Learning | https://gaussianprocess.org/gpml/ |
| Convex Optimization (Boyd & Vandenberghe) | https://web.stanford.edu/~boyd/cvxbook/ |
| Forecasting: Principles and Practice | https://otexts.com/fpp3/ |
| Reinforcement Learning: An Introduction | http://incompleteideas.net/book/the-book-2nd.html |
| scikit-learn user guide | https://scikit-learn.org/stable/user_guide.html |
| Distill | https://distill.pub/ |
| Lil'Log (Lilian Weng) | https://lilianweng.github.io/ |
| The Illustrated Transformer | https://jalammar.github.io/illustrated-transformer/ |
| The Annotated Transformer | https://nlp.seas.harvard.edu/annotated-transformer/ |
| CS231n notes | https://cs231n.github.io/ |

### Papers

Use arXiv `https://arxiv.org/abs/XXXX.XXXXX` or DOI `https://doi.org/10.xxxx/...`.

**Only cite an ID you are certain of.** If you are unsure of the arXiv number, cite the paper by
title with a link to a page you *have* verified, or omit the paper entirely. An invented arXiv ID
looks completely authentic and is therefore worse than nothing.

### Video

**Never guess a YouTube video ID.** Link channel or course pages:

| Source | URL |
|---|---|
| 3Blue1Brown | https://www.3blue1brown.com/ |
| StatQuest | https://www.youtube.com/@statquest |
| Karpathy — Neural Networks: Zero to Hero | https://karpathy.ai/zero-to-hero.html |

### Books

Cite title / author / chapter; `url` is optional.

Hastie, Tibshirani & Friedman · Bishop, *Pattern Recognition and Machine Learning* · Murphy,
*Probabilistic Machine Learning* · Sutton & Barto · Goodfellow, Bengio & Courville ·
Tan, Steinbach, Karpatne & Kumar · Géron, *Hands-On Machine Learning* ·
Hyndman & Athanasopoulos, *Forecasting: Principles and Practice*.

---

## 6. Writing the maths

`math.latex` is rendered by KaTeX. Two things to watch:

- **Escape backslashes** in TypeScript string literals: `'\\varepsilon'`, not `'\varepsilon'`.
- **KaTeX is not full LaTeX.** It has no `\begin{align}` without the `amsmath` extension enabled,
  and no custom macros. Keep expressions to a single line each; use several array entries rather
  than one multi-line block.

Give the loss or objective, the update rule if there is one, and anything a reader needs to
connect the intuition to the notation. Do not transcribe a full derivation — that is what the
`references` are for.
