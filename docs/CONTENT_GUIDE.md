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

A Tier 2 entry is a real, short entry — not a placeholder. It needs `hook`, `intuition`,
`facets`, ≥1 `related`, and ≥2 references. Skip `howItWorks`, `math`, `code` and
`hyperparameters`. A good Tier 2 entry tells the reader what the thing is, how it differs from
the Tier 1 entry next to it, and where to read more. If you cannot manage that, leave it out and
report it rather than writing filler.

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
