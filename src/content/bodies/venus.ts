/**
 * Venus — Similarity & Instance-Based. See PLAN.md §3 for the moon list (6 moons, all written
 * here). Tiers follow PLAN.md: ★ = Tier 1 (k-nearest-neighbors, distance-metrics,
 * approximate-nearest-neighbors, hnsw), unstarred = Tier 2 (kernel-density-estimation, loess).
 *
 * Every entry was researched before it was written, per docs/CONTENT_GUIDE.md §3. Sources
 * actually opened this session, per entry:
 *   kNN            — scikit-learn neighbors user guide + KNeighborsClassifier API page (defaults),
 *                    Cornell CS4780 lecture notes 03 (Cover–Hart bound, the (k/n)^(1/d) curse-of-
 *                    dimensionality argument), Cover & Hart 1967 DOI (verified to resolve).
 *   distance       — scikit-learn DistanceMetric page (the metric table and its formulae),
 *                    Cornell CS4780 notes 03 (Minkowski p = 1, 2, ∞), Beyer et al. 1999 and
 *                    Salton, Wong & Yang 1975 DOIs (both verified to resolve).
 *   KDE            — scikit-learn density estimation user guide (kernel list, bandwidth,
 *                    binning-artefact motivation), scipy.stats.gaussian_kde API page (Scott is
 *                    the default rule; the documented over-smoothing of multimodal data),
 *                    Rosenblatt 1956 and Parzen 1962 on Project Euclid.
 *   LOESS          — Cleveland (1979) JASA 74(368):829–836 PDF, NIST/SEMATECH Engineering
 *                    Statistics Handbook §4.1.4.4, statsmodels lowess API page (frac=0.667, it=3).
 *   ANN            — scikit-learn neighbors user guide (the O[DN] / O[D log(N)] table, the D > 15
 *                    'auto' switch, leaf_size), BallTree API page (leaf_size=40), Princeton COS
 *                    lec10 notes (the LSH (r, cr, p1, p2) definition and the O(n^ρ) / O(n^{1+ρ})
 *                    bounds), Bentley 1975 and Indyk & Motwani 1998 DOIs (verified to resolve),
 *                    Spotify Annoy README.
 *   HNSW           — Malkov & Yashunin arXiv:1603.09320 (abstract + v4 PDF: M, Mmax, Mmax0,
 *                    efConstruction, ef, mL, the exponential level assignment, the skip-list
 *                    analogy), hnswlib README and ALGO_PARAMS.md (defaults M=16,
 *                    ef_construction=200; the memory rule of thumb), FAISS "Guidelines to choose
 *                    an index" wiki (memory formula, no-deletion limitation), Pinecone's HNSW
 *                    explainer.
 *
 * Two judgement calls worth flagging, per PLAN.md §0's "say so rather than silently pick one":
 *
 * 1. `distance-metrics.year` is 1936 (Mahalanobis). The entry has no single origin — Euclidean
 *    and Manhattan distance are inherited geometry with no paper to point at, the cosine measure
 *    reaches machine learning through Salton, Wong & Yang's 1975 vector space model, and Jaccard's
 *    coefficient is older still. 1936 is used as an anchor, not as a claim that distance metrics
 *    were invented then. No date is asserted in the entry prose itself.
 * 2. `hnsw.year` is 2016 — the arXiv preprint. The peer-reviewed version is IEEE TPAMI 42(4):
 *    824–836, 2020 (DOI 10.1109/TPAMI.2018.2889473, early access 2018); that is stated in
 *    `math.notes` rather than folded into `year`.
 *
 * Claims deliberately left out because they could not be verified from a source opened this
 * session: the "10–15 dimensions" empirical threshold in Beyer et al. (the PDF would not extract),
 * the exact value of HNSW's mL normalisation constant, and any publication date for the Jaccard
 * index or the Mahalanobis paper beyond secondary citation databases.
 *
 * `eraRange` is [1936, 2016] — distance-metrics' anchor year through HNSW's preprint.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'venus',
  name: 'Venus',
  segment: 'Similarity & Instance-Based',
  hook: 'Methods with no model to fit: the answer comes from whichever stored examples the new point most resembles.',
  summary:
    'Venus holds the methods that reason by resemblance rather than by fitted parameters — nearest neighbours, ' +
    'local smoothers, density estimates, and the metrics and indexes that make "find me the closest things" ' +
    'fast enough to be useful at scale.',
  eraRange: [1936, 2016],
  moons: [
    {
      id: 'k-nearest-neighbors',
      name: 'k-Nearest Neighbors',
      aliases: ['kNN', 'k-NN', 'nearest neighbour classification'],
      tier: 1,
      year: 1951,
      difficulty: 1,
      hook: 'Predicts a new point by looking up the k most similar training points and letting them vote.',
      intuition:
        'Ask an estate agent what a house is worth and you will not get an equation. You will get the five most ' +
        'similar houses sold nearby, and roughly what those went for. k-nearest neighbours is that procedure ' +
        'made exact. There is no fitting step at all — the training set is the model. To predict for a new ' +
        'point, measure its distance to every stored point, keep the k closest, then take a majority vote of ' +
        'their labels or an average of their values. Because each prediction is assembled locally from whatever ' +
        'happens to be nearby, the decision boundary can be arbitrarily wiggly without anyone specifying its ' +
        'shape, and adding a new training example changes the model instantly. The price is paid at prediction ' +
        'time: every query re-reads the training set, and "nearby" has to mean something, which depends entirely ' +
        'on the distance metric you picked and on whether your features are on comparable scales.',
      howItWorks: {
        summary:
          'Store the training set unchanged; to predict, rank every stored point by its distance to the query, ' +
          'keep the k closest, and combine their labels.',
        steps: [
          'Standardise the features so no single one dominates the distance calculation.',
          'Store the training set — there is no parameter to fit.',
          'For a query point, compute its distance to every stored point under the chosen metric.',
          'Keep the k smallest distances.',
          'Classify by majority vote of those k labels, or regress by averaging their target values.',
          'Optionally weight each neighbour by the inverse of its distance so closer points count for more.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_neighbors',
          what: 'How many neighbours vote on each prediction. scikit-learn defaults to 5.',
          tuning:
            'Small k tracks the data closely and is sensitive to mislabelled points; large k smooths the ' +
            'boundary towards the overall majority. Tune by cross-validation, and prefer odd values in binary ' +
            'classification so votes cannot tie.',
        },
        {
          name: 'weights',
          what:
            "Whether the k neighbours count equally ('uniform', the default) or in proportion to the inverse " +
            "of their distance ('distance').",
          tuning:
            "Switch to 'distance' when the k neighbours are at very different distances — it stops a far-away " +
            'k-th neighbour carrying the same weight as one sitting on top of the query.',
        },
        {
          name: 'metric',
          what: "The distance function. scikit-learn defaults to 'minkowski' with p=2, i.e. Euclidean distance.",
          tuning:
            'p=1 gives Manhattan distance, which sums per-feature gaps instead of squaring them. Use cosine ' +
            'for text or embedding vectors, where direction carries the meaning and vector length does not.',
        },
        {
          name: 'algorithm',
          what: "Which index computes the neighbours: 'brute', 'kd_tree', 'ball_tree' or 'auto' (the default).",
          tuning:
            "Leave it on 'auto'. scikit-learn falls back to brute force when the input is sparse, when there " +
            'are more than 15 features, or when k is at least half the training set — all cases where the ' +
            'trees stop paying for themselves.',
        },
      ],
      whenToUse: [
        'The decision boundary is irregular and you have no parametric form in mind for it',
        'You need to justify a prediction by pointing at the specific stored examples that produced it',
        'Features are numeric and on comparable scales after standardising, so Euclidean distance is meaningful',
        'The training set is small enough that scanning it — or an index over it — fits your latency budget',
        'You want a no-training baseline to check a more complicated model against',
      ],
      whenNotToUse: [
        'Dimensionality is high (roughly beyond 15–20 features) — distances concentrate and the nearest neighbours stop being meaningfully nearer than the rest',
        'Prediction latency matters over a large training set: brute-force search costs O(n·d) per query and trees degrade to that in high dimensions',
        'Many features are irrelevant — kNN has no way to down-weight them, so they add noise to every distance',
        'Features are mostly categorical or values are missing — there is no natural distance and kNN cannot skip gaps',
        'Classes are heavily imbalanced, so the majority class wins most neighbourhood votes regardless of the query',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular', 'spatial'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-label-or-continuous-value',
      },
      math: {
        latex: [
          'N_k(x) = \\text{the } k \\text{ training points minimising } d(x, x_i)',
          '\\hat{y}(x) = \\frac{1}{k} \\sum_{x_i \\in N_k(x)} y_i',
          'R^{*} \\le R_{\\mathrm{NN}} \\le 2 R^{*}',
        ],
        notes:
          'The third line is Cover & Hart (1967): as the training set grows without bound, the 1-nearest-' +
          'neighbour error rate is at most twice the Bayes error — a remarkable guarantee for a rule that fits ' +
          'nothing. Read the "as n grows without bound" carefully, though. The rate at which it takes hold is ' +
          'the problem: to keep the k nearest neighbours inside a hypercube of side ℓ you need roughly k·(1/ℓ)^d ' +
          'points, which is exponential in the number of features. In high dimensions the neighbours the ' +
          'asymptotic bound assumes are close simply are not close.',
      },
      complexity: {
        train: 'O(1) — the data is stored, not fitted; building a KD-tree or ball tree index instead costs O(n log n)',
        predict:
          'O(n·d) per query by brute force; about O(d log n) with a ball tree, or a KD-tree under roughly 20 ' +
          'features, after which a KD-tree degrades to nearly O(d·n)',
      },
      code: [
        'from sklearn.neighbors import KNeighborsClassifier',
        'from sklearn.pipeline import make_pipeline',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.model_selection import GridSearchCV',
        '',
        '# scale inside the pipeline: kNN compares raw distances, so units matter',
        'knn = make_pipeline(StandardScaler(), KNeighborsClassifier())',
        '',
        'grid = GridSearchCV(',
        '    knn,',
        "    {'kneighborsclassifier__n_neighbors': [1, 3, 5, 11, 25],",
        "     'kneighborsclassifier__weights': ['uniform', 'distance']},",
        '    cv=5,',
        ').fit(X_train, y_train)',
        '',
        'print(grid.best_params_)',
        'y_pred = grid.predict(X_test)',
      ].join('\n'),
      related: ['distance-metrics', 'approximate-nearest-neighbors', 'kernel-density-estimation', 'decision-trees'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Nearest Neighbors', url: 'https://scikit-learn.org/stable/modules/neighbors.html' },
          {
            title: 'Cornell CS4780 — k-Nearest Neighbors and the Curse of Dimensionality',
            url: 'https://www.cs.cornell.edu/courses/cs4780/2022sp/notes/LectureNotes03.html',
          },
        ],
        papers: [
          {
            title: 'Nearest Neighbor Pattern Classification',
            url: 'https://doi.org/10.1109/TIT.1967.1053964',
            year: 1967,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 13 — Prototype Methods and Nearest-Neighbors',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    {
      id: 'distance-metrics',
      name: 'Distance Metrics',
      aliases: [
        'Euclidean distance',
        'Manhattan distance',
        'Minkowski distance',
        'cosine similarity',
        'Mahalanobis distance',
        'Jaccard index',
      ],
      tier: 1,
      // See the file header: no single origin year fits this entry. 1936 (Mahalanobis) is an
      // anchor, not a claim — and no date is asserted anywhere in the entry's prose.
      year: 1936,
      difficulty: 2,
      hook: 'The choice of what "close" means — and it quietly decides what every similarity-based method finds.',
      intuition:
        'Every method that talks about similar points is really talking about a distance function, and swapping ' +
        'that function usually changes the answer more than swapping the algorithm would. Euclidean distance is ' +
        'straight-line distance and treats all directions alike. Manhattan distance adds up the per-feature ' +
        'gaps, as though you could only travel along streets on a grid, so one enormous discrepancy does not ' +
        'swamp the rest the way squaring makes it. Cosine similarity discards length entirely and compares only ' +
        'direction — what you want for documents or embeddings, where a long text should not count as far from ' +
        'a short one on the same subject. Mahalanobis distance first asks how the data actually varies, ' +
        'stretching directions the data barely uses and shrinking the ones it uses heavily, so a point can look ' +
        'far in raw units yet be unremarkable given the correlations. Jaccard compares sets instead of ' +
        'coordinates: what share of the union the two sets have in common.',
      howItWorks: {
        summary:
          'Pick a function that turns a pair of objects into one non-negative number, then check that it means ' +
          'what you intend on your features, at your scales, in your dimensionality.',
        steps: [
          'Decide what the objects are: coordinates in a real space, direction-only vectors, sets, or binary indicators.',
          'For real coordinates, standardise first — otherwise whichever feature has the largest units dominates every distance.',
          'Pick the Minkowski exponent: p=2 is Euclidean, p=1 is Manhattan, p→∞ is Chebyshev, the single largest per-feature gap.',
          'Use cosine when only direction carries meaning and vector length is an artefact of size.',
          'Use Mahalanobis when features are correlated and you want the covariance structure to define "far".',
          'Use Jaccard or Hamming when the objects are sets or binary attribute vectors rather than points.',
          'Sanity-check by listing the nearest neighbours of a few points you know well and confirming the list looks right.',
        ],
      },
      hyperparameters: [
        {
          name: 'p (Minkowski exponent)',
          what: "The exponent in the Minkowski family. scikit-learn's default metric is 'minkowski' with p=2, i.e. Euclidean.",
          tuning:
            'p=1 sums per-feature gaps and so is less dominated by one large discrepancy than p=2; p→∞ reduces ' +
            'to that largest gap alone. Choose by the downstream metric on held-out data, never in isolation.',
        },
        {
          name: 'V (covariance matrix)',
          what: "Mahalanobis distance's covariance argument — scikit-learn takes either V or its inverse VI.",
          tuning:
            'Estimate it on the training data. It has to be invertible, which fails with collinear features or ' +
            "fewer rows than features; scikit-learn's standardised Euclidean ('seuclidean'), which divides each " +
            'feature by its own variance, is the diagonal-only fallback.',
        },
      ],
      whenToUse: [
        'You are about to run kNN, k-means, DBSCAN, hierarchical clustering or a vector index and have not yet decided what "close" means',
        'Features are on wildly different scales or in different units and the neighbour lists you get back look wrong',
        'The objects are text, embeddings or set-valued attributes rather than points in a physical space',
        'Features are strongly correlated, so Euclidean distance double-counts whatever the correlated directions encode',
      ],
      whenNotToUse: [
        'Data is mostly categorical with no meaningful ordering — one-hot encoding plus Euclidean distance imposes an arbitrary geometry on it',
        'Dimensionality is high and untreated: distances concentrate, so every metric returns near-identical values and the neighbour ranking becomes unstable',
        'The notion of similarity is task-specific and subtle — a fixed metric cannot adapt, and a trained embedding or metric-learning approach will beat it',
        'The objects are variable-length sequences or graphs, where coordinate-wise metrics do not apply and an edit or graph distance is needed',
      ],
      facets: {
        task: ['retrieval', 'clustering', 'classification'],
        dataType: ['tabular', 'text', 'spatial'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'scalar-distance',
      },
      math: {
        latex: [
          'd_p(x,y) = \\left( \\sum_{i=1}^{d} |x_i - y_i|^p \\right)^{1/p}',
          '\\cos(x,y) = \\frac{x^{\\top} y}{\\lVert x \\rVert_2 \\, \\lVert y \\rVert_2}',
          'd_M(x,y) = \\sqrt{(x-y)^{\\top} V^{-1} (x-y)}',
          'J(A,B) = \\frac{|A \\cap B|}{|A \\cup B|}',
        ],
        notes:
          'Two consequences that are easy to miss. First, the metric constrains the index: scikit-learn only ' +
          'routes a query to a KD tree or ball tree when the chosen metric is on that structure\'s list of valid ' +
          'metrics, and silently falls back to brute force otherwise — so an exotic metric can cost you orders ' +
          'of magnitude in query time. Second, Beyer et al. (1999) showed that under broad conditions the ' +
          'distance from a query to its nearest stored point converges to the distance to its farthest one as ' +
          'dimensionality grows. When that happens the ranking a metric produces is close to meaningless, and ' +
          'no substitution of one metric for another fixes it.',
      },
      complexity: {
        train:
          'n/a — a metric is a choice, not a fitted object. Mahalanobis is the exception: it needs a covariance ' +
          'estimate, O(n·d²), plus an O(d³) inverse',
        predict: 'O(d) per pair for Minkowski and cosine; O(d²) per pair for Mahalanobis',
      },
      code: [
        'import numpy as np',
        'from sklearn.metrics import pairwise_distances',
        'from sklearn.preprocessing import StandardScaler, normalize',
        '',
        'Xs = StandardScaler().fit_transform(X)    # do this before any Minkowski distance',
        '',
        "d_euclid = pairwise_distances(Xs, metric='euclidean')",
        "d_manhat = pairwise_distances(Xs, metric='manhattan')",
        '',
        '# cosine ignores length; normalising first makes that explicit',
        "d_cosine = pairwise_distances(normalize(X), metric='cosine')",
        '',
        '# Mahalanobis needs the inverse covariance of the *training* data',
        'VI = np.linalg.pinv(np.cov(X, rowvar=False))',
        "d_mahal = pairwise_distances(X, metric='mahalanobis', VI=VI)",
      ].join('\n'),
      related: ['k-nearest-neighbors', 'approximate-nearest-neighbors', 'kernel-density-estimation', 'dbscan'],
      references: {
        free: [
          {
            title: 'scikit-learn API — DistanceMetric (the full metric table)',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.metrics.DistanceMetric.html',
          },
          {
            title: 'Cornell CS4780 — Minkowski distances and the curse of dimensionality',
            url: 'https://www.cs.cornell.edu/courses/cs4780/2022sp/notes/LectureNotes03.html',
          },
        ],
        papers: [
          {
            title: 'When Is "Nearest Neighbor" Meaningful?',
            url: 'https://doi.org/10.1007/3-540-49257-7_15',
            year: 1999,
          },
          {
            title: 'A Vector Space Model for Automatic Indexing',
            url: 'https://doi.org/10.1145/361219.361220',
            year: 1975,
          },
        ],
        books: [
          {
            title: 'Mathematics for Machine Learning',
            author: 'Deisenroth, Faisal & Ong',
            chapter: 'Ch. 3 — Analytic Geometry (norms, inner products, angles and distances)',
            url: 'https://mml-book.github.io/',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    {
      id: 'kernel-density-estimation',
      name: 'Kernel Density Estimation',
      aliases: ['KDE', 'Parzen–Rosenblatt window', 'Parzen window'],
      tier: 2,
      year: 1956,
      difficulty: 3,
      hook: 'Estimates a smooth probability density by dropping a small bump on every data point and adding them up.',
      intuition:
        'A histogram answers "how much of the data lands here?", but its answer depends on where you happened ' +
        'to put the bin edges — nudge them and a bimodal picture can flatten into a unimodal one. Kernel ' +
        'density estimation removes that arbitrariness by refusing to bin at all. It centres a small smooth ' +
        'bump, the kernel, on each observation and adds all the bumps together, giving a continuous curve whose ' +
        'height anywhere reflects how many observations are near that point and how near they are. The real ' +
        'decision left is the bandwidth: how wide each bump is. Wide bumps overlap heavily and can smooth away ' +
        'genuine modes; narrow bumps leave a spiky curve tracking sampling noise. The kernel shape matters far ' +
        'less than the bandwidth does. It is the same neighbourhood-counting instinct as k-nearest neighbours, ' +
        'turned to estimating a distribution rather than a label.',
      howItWorks: {
        summary:
          'Place one copy of a kernel function, scaled by a bandwidth, on every observation, and sum them into ' +
          'a continuous density estimate.',
        steps: [
          'Choose a kernel shape — Gaussian by default, with tophat, Epanechnikov, exponential, linear and cosine also available in scikit-learn.',
          'Choose a bandwidth h, either directly or via a rule of thumb such as Scott or Silverman.',
          'Sum the kernels over all observations and normalise so the result integrates to one.',
        ],
      },
      whenToUse: [
        'You want a smooth estimate of a distribution without assuming it is Gaussian or any other parametric family',
        'A histogram of the same data changes shape when you move the bin edges and you need a picture that does not',
        'You want an unsupervised outlier score: points in low-density regions of the fitted estimate',
      ],
      whenNotToUse: [
        'More than a few features — the data needed to fill space grows exponentially, and the estimate becomes mostly bandwidth',
        'The distribution is strongly multimodal and you are stuck with one global bandwidth, which tends to over-smooth the modes',
        'You need an interpretable parametric description of the distribution to report or reason about',
      ],
      facets: {
        task: ['inference', 'anomaly-detection'],
        dataType: ['tabular', 'spatial'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'probability-density',
      },
      related: ['k-nearest-neighbors', 'loess', 'dbscan'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Density Estimation', url: 'https://scikit-learn.org/stable/modules/density.html' },
          {
            title: 'SciPy API — gaussian_kde (Scott and Silverman bandwidth rules)',
            url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.gaussian_kde.html',
          },
        ],
        papers: [
          {
            title: 'Remarks on Some Nonparametric Estimates of a Density Function',
            url: 'https://projecteuclid.org/euclid.aoms/1177728190',
            year: 1956,
          },
          {
            title: 'On Estimation of a Probability Density Function and Mode',
            url: 'https://projecteuclid.org/euclid.aoms/1177704472',
            year: 1962,
          },
        ],
      },
    },

    {
      id: 'loess',
      name: 'LOESS',
      aliases: ['LOWESS', 'locally weighted scatterplot smoothing', 'local regression'],
      tier: 2,
      year: 1979,
      difficulty: 3,
      hook: 'Draws a curve through a scatterplot by fitting a small weighted regression around every point in turn.',
      intuition:
        'Suppose you want the trend in a scatterplot but do not believe any single equation describes the whole ' +
        'thing. LOESS declines to commit to one. To get the fitted value at some x it takes only the nearest ' +
        'fraction of the data, weights those points so the closest count most and the weight falls smoothly to ' +
        'zero at the edge of the neighbourhood, and fits a plain straight line or parabola to that little ' +
        'window. Slide the window along and the fitted values trace out a curve. Nothing global is ever ' +
        'estimated, which is exactly why the result can bend however the data bends. Cleveland\'s robust ' +
        'variant then repeats the whole pass a few times, shrinking the weight of points whose residuals came ' +
        'out large, so a handful of outliers cannot drag the curve. Note the difference from kernel density ' +
        'estimation: KDE describes how x itself is distributed, whereas LOESS estimates the average y given x.',
      howItWorks: {
        summary:
          'For each x, fit a low-degree polynomial to the nearest fraction of the data with distance-based ' +
          "weights, and take that local fit's value as the smoothed y.",
        steps: [
          'Take the fraction of observations nearest the target x — that fraction is the smoothing parameter.',
          'Weight them with the tricube function, so weight falls smoothly to zero at the edge of the neighbourhood, and fit a degree-1 or degree-2 polynomial by weighted least squares.',
          'Repeat across the range of x, then optionally re-run the whole pass with bisquare weights on the residuals to down-weight outliers.',
        ],
      },
      whenToUse: [
        'You want to see the trend in a scatterplot without committing to a functional form',
        'The relationship visibly changes shape across the range of x, so a single global polynomial fits badly somewhere',
        'The data contain outliers you want the curve to resist rather than chase',
      ],
      whenNotToUse: [
        'You need a compact equation to report, transfer or extrapolate beyond the data — LOESS yields fitted values, not coefficients',
        'The data are sparse or unevenly sampled, so some windows contain too few points to fit',
        'There are many predictors: local neighbourhoods empty out as dimensionality rises, and LOESS is used almost entirely with one or two',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'smoothed-continuous-values',
      },
      related: ['kernel-density-estimation', 'k-nearest-neighbors', 'linear-regression'],
      references: {
        free: [
          {
            title: 'NIST/SEMATECH e-Handbook of Statistical Methods — LOESS',
            url: 'https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd144.htm',
          },
          {
            title: 'statsmodels API — lowess (frac=0.667, it=3 by default)',
            url: 'https://www.statsmodels.org/stable/generated/statsmodels.nonparametric.smoothers_lowess.lowess.html',
          },
        ],
        papers: [
          {
            title: 'Robust Locally Weighted Regression and Smoothing Scatterplots',
            url: 'https://sites.stat.washington.edu/courses/stat527/s13/readings/Cleveland_JASA_1979.pdf',
            year: 1979,
          },
        ],
      },
    },

    {
      id: 'approximate-nearest-neighbors',
      name: 'Approximate Nearest Neighbour Search',
      aliases: ['ANN', 'KD-tree', 'k-d tree', 'ball tree', 'locality-sensitive hashing', 'LSH'],
      tier: 1,
      // Anchored on Bentley's KD-tree (1975); the ball tree (Omohundro, 1989) and LSH (Indyk &
      // Motwani, 1998) arrive later and are covered in math.notes rather than in `year`.
      year: 1975,
      difficulty: 4,
      hook: 'Trades exact neighbour lists for much faster ones by indexing the data with trees or hashes.',
      intuition:
        'Finding the nearest point among a million stored ones by measuring a million distances is correct and ' +
        'slow. Every method here buys speed by organising the data beforehand so that most of it can be ' +
        'skipped. A KD-tree cuts space with axis-aligned planes, one feature at a time, so a query descends to ' +
        'a small region and then only has to check the branches that could still hold something closer. A ball ' +
        'tree does the same with nested spheres instead of boxes, which lets it work with any metric obeying ' +
        'the triangle inequality. Both return exact answers — but both stop helping once there are many ' +
        'features, because the query region touches so many cells that nothing gets pruned and the tree ends up ' +
        'slower than a straight scan. Locality-sensitive hashing gives up exactness instead: it hashes points so ' +
        'near ones collide often and far ones rarely, then compares the query only against its own buckets.',
      howItWorks: {
        summary:
          'Build an index that groups nearby points together, then answer a query by examining only the parts ' +
          'of the index that could plausibly contain a close point.',
        steps: [
          'Pick a structure: a KD-tree for low-dimensional data, a ball tree for a general metric, hashing or a graph for high dimensions.',
          'Build the index once — recursively split on one feature at a time (KD-tree) or into nested bounding spheres (ball tree), stopping at leaves of a fixed size.',
          'For a query, descend to the leaf containing it and collect those points as candidates.',
          'Backtrack into sibling branches only while their bounding box or sphere could still hold something closer than the current best.',
          'For hashing instead, apply several locality-sensitive hash functions, look up the buckets the query lands in, and rank only the points that collided with it.',
          'Tune leaf size, or the number of hash tables and functions per table, to trade recall against query time.',
        ],
      },
      hyperparameters: [
        {
          name: 'leaf_size',
          what:
            'The point count at which a KD-tree or ball tree stops splitting and switches to brute force. ' +
            "scikit-learn's neighbour estimators default to 30; the standalone KDTree and BallTree classes " +
            'default to 40.',
          tuning:
            'Larger values build faster and use less memory — tree memory scales roughly as n_samples / ' +
            'leaf_size — but scan more points per leaf. Both extremes are suboptimal; the defaults are a ' +
            'deliberate compromise and rarely worth moving far.',
        },
        {
          name: 'algorithm',
          what: "Which index scikit-learn uses: 'kd_tree', 'ball_tree', 'brute', or 'auto' (the default).",
          tuning:
            "'auto' falls back to brute force when the input is sparse, the metric is precomputed, there are " +
            'more than 15 features, or k is at least half the training set. Treat that fallback as a signal ' +
            'that trees have stopped paying off, not as something to override.',
        },
        {
          name: 'hash functions per table / number of tables (LSH)',
          what:
            'LSH concatenates several hash functions into one key, and then repeats the whole scheme over ' +
            'several independent tables.',
          tuning:
            'More functions per table makes collisions rarer and more selective, which raises precision and ' +
            'costs recall; more tables gives the true neighbour more chances to collide somewhere, restoring ' +
            'recall at a linear cost in memory and query time.',
        },
      ],
      whenToUse: [
        'The stored set is large enough that an exact O(n·d) scan per query misses your latency budget',
        'Data is low-dimensional (roughly under 15 features) and axis-aligned splits are meaningful — use a KD-tree',
        'You need a non-Euclidean metric that still obeys the triangle inequality — use a ball tree, which supports more metrics than a KD-tree does',
        'Dimensionality is high and you can accept occasionally missing the true nearest neighbour — use hashing or a graph index',
      ],
      whenNotToUse: [
        'The stored set is small (a few thousand points), where index build time and per-node overhead exceed the scan they replace',
        'You need exact neighbours with a hard guarantee and the data is high-dimensional — brute force is then the honest option, and scikit-learn picks it for you above 15 features',
        'k is large relative to n — above k = n/2 the search walks most of the structure anyway',
        'Vectors are hundreds of dimensions and recall matters: trees have degraded to brute force by then, and a graph index such as HNSW is the better trade',
      ],
      facets: {
        task: ['retrieval'],
        dataType: ['tabular', 'text', 'spatial', 'multimodal'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ranked-neighbour-ids',
      },
      math: {
        latex: [
          '\\Pr[h(x)=h(y)] \\ge p_1 \\;\\text{ if }\\; d(x,y) \\le r',
          '\\Pr[h(x)=h(y)] \\le p_2 \\;\\text{ if }\\; d(x,y) > c\\,r',
          '\\text{query } O(n^{\\rho}), \\quad \\text{space } O(n^{1+\\rho}), \\quad \\rho < 1',
        ],
        notes:
          'A locality-sensitive hash family is defined by that pair of collision probabilities, with p₁ > p₂ ' +
          'and an approximation factor c > 1; the exponent ρ that sets the query and space bounds is determined ' +
          'by the gap between p₁ and p₂, and the whole construction only helps because ρ comes out below 1. ' +
          'Worth keeping the labels straight: KD-trees and ball trees are exact structures that merely become ' +
          'useless in high dimensions, whereas LSH is approximate by construction and returns a point within a ' +
          'factor c of the true nearest. Lineage: Bentley introduced the KD-tree in 1975, Omohundro described ' +
          'balltree construction in an ICSI technical report in 1989, and Indyk & Motwani introduced LSH at ' +
          'STOC 1998. Libraries split along the same lines — scikit-learn ships KD-tree and ball tree and no ' +
          "LSH index; Spotify's Annoy uses random-projection trees; FAISS and hnswlib centre on graphs and " +
          'quantisation.',
      },
      complexity: {
        train: 'O(n log n) to build a balanced KD-tree or ball tree; for LSH, O(n·d) per hash table',
        predict:
          'About O(d log n) per query for a ball tree, and for a KD-tree under roughly 20 features, after which ' +
          'a KD-tree degrades to nearly O(d·n) — slower than the O(d·n) brute-force scan once tree overhead is ' +
          'counted. LSH is O(n^ρ) with ρ < 1',
      },
      code: [
        'from sklearn.neighbors import NearestNeighbors',
        '',
        '# ball_tree handles more metrics than kd_tree and is not restricted to axis-aligned splits',
        "nn = NearestNeighbors(n_neighbors=10, algorithm='ball_tree', leaf_size=40, metric='manhattan')",
        'nn.fit(X_train)',
        '',
        'distances, indices = nn.kneighbors(X_query)',
        '',
        "# 'auto' is the honest default: it drops to brute force above 15 features,",
        '# when the input is sparse, or when k >= n / 2',
        "auto = NearestNeighbors(n_neighbors=10, algorithm='auto').fit(X_train)",
        'print(auto._fit_method)          # which structure it actually chose',
      ].join('\n'),
      related: ['k-nearest-neighbors', 'hnsw', 'distance-metrics', 'dbscan'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Nearest Neighbor Algorithms (KD tree vs ball tree complexity)',
            url: 'https://scikit-learn.org/stable/modules/neighbors.html',
          },
          {
            title: 'Princeton COS 521 — Nearest Neighbor Search and Locality Sensitive Hashing',
            url: 'https://www.cs.princeton.edu/~smattw/Teaching/Fa19Lectures/lec10/lec10.pdf',
          },
        ],
        papers: [
          {
            title: 'Multidimensional Binary Search Trees Used for Associative Searching',
            url: 'https://doi.org/10.1145/361002.361007',
            year: 1975,
          },
          {
            title: 'Approximate Nearest Neighbors: Towards Removing the Curse of Dimensionality',
            url: 'https://doi.org/10.1145/276698.276876',
            year: 1998,
          },
        ],
        books: [
          {
            title: 'Foundations of Vector Retrieval',
            author: 'Sebastian Bruch',
            url: 'https://arxiv.org/abs/2401.09350',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    {
      id: 'hnsw',
      name: 'HNSW',
      aliases: ['Hierarchical Navigable Small World', 'hierarchical navigable small world graphs'],
      tier: 1,
      // 2016 is the arXiv preprint; the journal version is IEEE TPAMI 42(4):824–836, 2020. See
      // math.notes and the file header.
      year: 2016,
      difficulty: 4,
      hook: 'Searches billions of vectors by walking a layered proximity graph, zooming in one layer at a time.',
      intuition:
        'Imagine finding one specific house in a country you have never visited. You would not walk. You would ' +
        'fly to the right region, drive to the right town, then walk the last few streets. HNSW builds exactly ' +
        'that: a stack of graphs over the same points, where the top layer holds a sparse handful of nodes ' +
        'joined by long links, and each layer down adds more points and shorter links until the bottom layer ' +
        'contains everything. A search enters at the top, repeatedly hops to whichever neighbour is closer to ' +
        'the query, and when no neighbour improves on where it stands, drops a layer and carries on at finer ' +
        'granularity. Each element\'s highest layer is drawn at random with exponentially decaying probability ' +
        '— the same device a skip list uses to get logarithmic lookup out of a linked list. Nothing is ' +
        'guaranteed, since a greedy walk can stall in a local minimum, but in practice recall is high and ' +
        'search time grows logarithmically with the number of stored vectors.',
      howItWorks: {
        summary:
          'Build a multi-layer proximity graph in which higher layers hold exponentially fewer points joined by ' +
          'longer-range links, then answer a query by greedy descent from the top layer down to the bottom.',
        steps: [
          'Assign each incoming element a maximum layer drawn from an exponentially decaying distribution.',
          'Insert it into every layer from that maximum down to layer 0.',
          'At each layer, search the existing graph for efConstruction candidates and connect the new element to at most M of them, picked by a heuristic that favours neighbours in diverse directions rather than simply the closest.',
          'Trim any neighbour whose own connection count now exceeds its limit — Mmax, or Mmax0 at the bottom layer.',
          'To query, start from the entry point in the top layer and greedily move to whichever neighbour is closer to the query.',
          'When no neighbour improves, descend one layer and repeat; at layer 0 run a best-first search holding ef candidates and return the closest k.',
        ],
      },
      hyperparameters: [
        {
          name: 'M',
          what:
            'Number of bidirectional links created per element per layer. hnswlib defaults to 16; FAISS ' +
            'documents a usable range of 4–64 and hnswlib suggests 2–100, with 12–48 covering most cases.',
          tuning:
            'Raise M for data with high intrinsic dimensionality or when you need high recall; lower it for ' +
            'low-dimensional data. Memory grows with it — hnswlib estimates roughly M × 8–10 bytes per stored ' +
            'element, and FAISS gives (d × 4 + M × 2 × 4) bytes per vector for its HNSW index.',
        },
        {
          name: 'efConstruction',
          what: 'Size of the dynamic candidate list held while inserting an element. hnswlib defaults to 200.',
          tuning:
            'Larger values build a better graph at the cost of build time, with clear diminishing returns. ' +
            "hnswlib's own check: measure recall for an M-nearest-neighbour search with ef set equal to " +
            'efConstruction; if it comes out below 0.9 there is headroom left.',
        },
        {
          name: 'ef (efSearch)',
          what: 'Size of the dynamic candidate list at query time — the main recall-versus-latency dial.',
          tuning:
            'Must be larger than k. Raise it until recall on a held-out sample plateaus. Because it is a query-' +
            'time setting you can tune it without rebuilding the index, but note that hnswlib does not save it ' +
            'with the index — set it again after loading.',
        },
      ],
      whenToUse: [
        'You are serving nearest-neighbour queries over embedding vectors of hundreds to thousands of dimensions, where KD-trees and ball trees have degraded to brute force',
        'Query latency matters more than a guarantee of exactness, and you can accept occasionally missing a true neighbour',
        'The index fits in RAM — HNSW stores full vectors plus the graph and is not designed to page from disk',
        'You are building retrieval for a vector database or a RAG pipeline, where HNSW is the common default index',
      ],
      whenNotToUse: [
        'The corpus churns with deletions — HNSW has no real delete; the FAISS implementation cannot remove vectors, and periodic rebuilds are the usual answer',
        'Memory is the binding constraint: HNSW keeps uncompressed vectors plus M links per element per layer, where a quantised index (IVF-PQ and relatives) is far smaller',
        'The corpus is small — tens of thousands of vectors — where a brute-force scan already meets your latency target and is exact',
        'You need a hard correctness guarantee: greedy graph traversal gives no worst-case bound on recall, only measured recall on your data',
      ],
      facets: {
        task: ['retrieval', 'ranking'],
        dataType: ['text', 'image', 'multimodal'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ranked-neighbour-ids',
      },
      math: {
        latex: [
          'l = \\lfloor -\\ln(\\mathrm{unif}(0,1)) \\cdot m_L \\rfloor',
          '\\Pr[\\text{element reaches layer } l] \\;\\propto\\; e^{-l/m_L}',
        ],
        notes:
          'The level rule is the whole trick: because layer membership decays exponentially, the top layers ' +
          'hold few nodes with long links and the bottom holds everything with short ones, so a greedy walk ' +
          'covers distance cheaply before refining — the same reason a skip list achieves logarithmic lookup, ' +
          'and the analogy the authors draw themselves. m_L is a normalisation constant set at build time. ' +
          'Note what is not here: there is no proof that greedy descent finds the true nearest neighbour. HNSW ' +
          'is an empirical structure whose recall you measure rather than derive, which is why ef exists as a ' +
          'dial. Lineage: it builds directly on the same authors\' earlier flat Navigable Small World graph ' +
          '(Malkov, Ponomarenko, Logvinov & Krylov, Information Systems 45, 2014); the hierarchy and the ' +
          'neighbour-selection heuristic are what HNSW adds. Preprint 2016, journal version IEEE TPAMI ' +
          '42(4):824–836, 2020.',
      },
      complexity: {
        train: 'O(n log n) to build — each of n elements is inserted through a logarithmic-cost graph search',
        predict:
          'O(log n) per query at fixed recall, as claimed in the paper; the constant scales with ef and M, and ' +
          'each hop costs a distance computation of O(d)',
      },
      code: [
        'import hnswlib',
        'import numpy as np',
        '',
        'dim, n = 384, 100_000',
        "vectors = np.random.rand(n, dim).astype('float32')",
        '',
        "index = hnswlib.Index(space='cosine', dim=dim)",
        'index.init_index(max_elements=n, M=16, ef_construction=200)   # library defaults',
        'index.add_items(vectors, np.arange(n))',
        '',
        'index.set_ef(64)              # must exceed k; not persisted with the index',
        'labels, distances = index.knn_query(vectors[:5], k=10)',
        '',
        '# recall is measured, never guaranteed — check it against a brute-force sample',
      ].join('\n'),
      // Cross-body link pending: HNSW is the index behind vector databases, so
      // `retrieval-augmented-generation` and `vector-databases-and-ann-indexes` (Athenaeum, see
      // PLAN.md §3) belong here. Athenaeum is not written yet — the Phase 3 cross-link pass adds
      // them. `dbscan` is the honest cross-body link available now: DBSCAN's O(n log n) depends on
      // exactly this kind of neighbour index.
      related: ['approximate-nearest-neighbors', 'distance-metrics', 'k-nearest-neighbors', 'dbscan'],
      references: {
        free: [
          { title: 'hnswlib — README and ALGO_PARAMS (M, ef_construction, ef)', url: 'https://github.com/nmslib/hnswlib' },
          {
            title: 'FAISS wiki — Guidelines to choose an index',
            url: 'https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index',
          },
          { title: 'Pinecone — Hierarchical Navigable Small Worlds (HNSW)', url: 'https://www.pinecone.io/learn/series/faiss/hnsw/' },
        ],
        papers: [
          {
            title:
              'Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs',
            url: 'https://arxiv.org/abs/1603.09320',
            year: 2016,
          },
          {
            title: 'Approximate nearest neighbor algorithm based on navigable small world graphs',
            url: 'https://doi.org/10.1016/j.is.2013.10.006',
            year: 2014,
          },
        ],
        books: [
          {
            title: 'Foundations of Vector Retrieval',
            author: 'Sebastian Bruch',
            url: 'https://arxiv.org/abs/2401.09350',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
  ],
} satisfies Body;
