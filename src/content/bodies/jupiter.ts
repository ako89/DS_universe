/**
 * Jupiter — Clustering, Density & Anomaly. See PLAN.md §3 for the full moon list.
 *
 * Complete: all 10 moons from PLAN.md §3 are written here at their marked tiers — 6 Tier 1
 * (k-means, hierarchical-clustering, dbscan, hdbscan, gaussian-mixture-models, isolation-forest)
 * and 4 Tier 2 stubs (optics-and-mean-shift, spectral-clustering, one-class-detection-and-lof,
 * association-rules). `dbscan` is the Phase 2 schema pressure-test entry (docs/CONTENT_GUIDE.md
 * §2's gold-standard example) and is unchanged apart from its `related` array, which was a
 * deliberate placeholder pointing at linear-regression/self-attention and now points at dbscan's
 * real neighbours: hdbscan, k-means, isolation-forest, and optics-and-mean-shift (the taxonomy
 * bundles OPTICS with mean shift under one id rather than a standalone `optics`).
 *
 * `eraRange` spans 1957 (Lloyd's Bell Labs technical report proposing what is now called Lloyd's
 * algorithm — not published until 1982, but the origin date every source gives for the method)
 * to 2013 (Campello, Moulavi & Sander's HDBSCAN paper), the earliest and latest moon on this body.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * Two PDF fetches were caught failing honestly rather than hallucinating (Columbia's Apriori PDF
 * mirror and the Northeastern DBSCAN-Revisited-Revisited PDF both returned "cannot extract text"
 * instead of inventing content) — see the batch report for details. Where a PDF would not yield
 * text, the claim was sourced from an HTML page or search-corroborated metadata instead, per the
 * PDF-fetch warning in CONTENT_GUIDE §3.
 *
 * Deliberate cross-body links: k-means → distance-metrics (Venus) and isolation-forest →
 * random-forest/bagging (Mars) are genuine mechanical links, not decoration — isolation-forest's
 * own scikit-learn documentation states it uses `ExtraTreeRegressor` as its base estimator, i.e.
 * it IS an ensemble of random trees, exactly like the Mars ensembles it links to.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'jupiter',
  name: 'Jupiter',
  segment: 'Clustering, Density & Anomaly',
  hook: "Finds structure nobody labelled: groups, densities, and the points that don't belong to any of them.",
  summary:
    'Jupiter groups the unsupervised methods that discover structure in unlabeled data — where the clusters ' +
    "are, how dense they are, and which points don't fit any cluster at all.",
  eraRange: [1957, 2013],
  moons: [
    {
      id: 'k-means',
      name: 'k-Means & k-Means++',
      aliases: ["Lloyd's algorithm", 'k-means clustering'],
      tier: 1,
      year: 1957,
      difficulty: 2,
      hook: 'Assigns each point to its nearest of k centroids, then moves each centroid to the mean of its points, and repeats.',
      intuition:
        'Picture handing out k flags and asking every point to walk to whichever flag is closest, then moving ' +
        'each flag to the average position of the points that chose it, and repeating until nobody switches. ' +
        'That is the whole algorithm: alternate between two simple steps until they stop changing anything. ' +
        'Because every point joins whichever centroid is nearest, the clusters it finds are always convex ' +
        'regions cut apart by straight boundaries, roughly equal in spread — there is no notion of noise, ' +
        'every point belongs to some cluster whether it fits well or not. You have to say k up front, and a ' +
        'bad random start can strand a centroid in an empty region or split one real cluster into two. ' +
        'k-means++ fixes the second problem by spacing the initial centroids out, choosing each new one with ' +
        'probability proportional to its squared distance from the centroids already picked, which alone makes ' +
        'the fit both faster and more reliable.',
      howItWorks: {
        summary:
          'Pick k initial centroids, assign every point to its nearest one, recompute each centroid as the ' +
          'mean of its assigned points, and repeat until assignments stop changing.',
        steps: [
          'Choose k, the number of clusters, and initialize k centroids (k-means++ by default, spaced apart by squared distance).',
          'Assign every point to the nearest centroid by Euclidean distance.',
          'Recompute each centroid as the mean of the points currently assigned to it.',
          'Repeat the assign and update steps until no point changes cluster, or a max iteration count is hit.',
          'Restart from several different initializations and keep the run with the lowest total within-cluster squared distance (inertia).',
        ],
      },
      hyperparameters: [
        {
          name: 'n_clusters',
          what: 'Number of clusters k — the algorithm cannot infer it.',
          tuning:
            'Sweep k and plot inertia (elbow method) or use the silhouette score. scikit-learn defaults to 8, ' +
            'which is rarely right for your data and should always be set explicitly.',
        },
        {
          name: 'init / n_init',
          what: 'Centroid initialization strategy, and how many independent random restarts to run.',
          tuning:
            "Default init is 'k-means++'. scikit-learn's default n_init is 'auto', which runs 10 restarts for " +
            "random init but only 1 for k-means++ since it is already well spread out. Raise n_init if results " +
            'vary noticeably between runs.',
        },
      ],
      whenToUse: [
        'Clusters are roughly spherical, similarly sized, and separated well enough that centroids can tell them apart',
        'You know, or can estimate, the number of clusters in advance, or can afford to search over a small range of k',
        'The dataset is large and you need a fast, simple baseline — k-means scales to far more rows than hierarchical or density methods',
        'You want a compact summary of the data as k representative points, e.g. for vector quantization or initializing another method',
      ],
      whenNotToUse: [
        'Clusters are elongated, nested, or of very different sizes and densities — k-means cuts them apart with straight-line boundaries regardless',
        'You expect outliers and want them flagged rather than forced into whichever cluster is nearest',
        'The number of clusters is genuinely unknown and hard to estimate — use DBSCAN or HDBSCAN instead',
        'Features are on different scales and cannot be standardized — Euclidean distance will be dominated by whichever feature has the largest range',
      ],
      facets: {
        task: ['clustering'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'cluster-labels',
      },
      math: {
        latex: [
          '\\arg\\min_{S} \\sum_{i=1}^{k} \\sum_{x \\in S_i} \\lVert x - \\mu_i \\rVert^2',
          '\\mu_i = \\frac{1}{|S_i|} \\sum_{x \\in S_i} x',
        ],
        notes:
          "The objective (inertia, or within-cluster sum of squares) is not convex, so Lloyd's algorithm only " +
          'guarantees convergence to a local optimum — a different random start can land on a different, worse ' +
          'partition, which is the entire reason multiple restarts and k-means++ seeding exist. k-means++ does ' +
          'not change what the algorithm converges to; it only changes where it starts, and Arthur & ' +
          'Vassilvitskii proved that alone gives an expected approximation guarantee ordinary random ' +
          'initialization lacks.',
      },
      complexity: {
        train: 'O(n·k·d·i) for n points, k clusters, d dimensions and i iterations to convergence',
        predict: 'O(k·d) per point — distance to each centroid',
      },
      code: [
        'from sklearn.cluster import KMeans',
        'from sklearn.preprocessing import StandardScaler',
        '',
        'X = StandardScaler().fit_transform(X_raw)   # Euclidean distance needs comparable scales',
        '',
        'km = KMeans(n_clusters=4, init="k-means++", n_init="auto", random_state=0)',
        'labels = km.fit_predict(X)',
        '',
        'inertia = km.inertia_             # within-cluster sum of squares — lower is tighter',
        'centroids = km.cluster_centers_',
      ].join('\n'),
      // distance-metrics is the genuine cross-body link: k-means' "nearest centroid" step is
      // exactly the Euclidean-distance comparison catalogued on Venus.
      related: ['hierarchical-clustering', 'dbscan', 'gaussian-mixture-models', 'distance-metrics'],
      references: {
        free: [{ title: 'scikit-learn user guide — K-means', url: 'https://scikit-learn.org/stable/modules/clustering.html#k-means' }],
        papers: [
          {
            title: 'Least Squares Quantization in PCM',
            url: 'https://doi.org/10.1109/TIT.1982.1056489',
            year: 1982,
          },
          {
            title: 'k-Means++: The Advantages of Careful Seeding',
            url: 'https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf',
            year: 2007,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14 — Unsupervised Learning',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'hierarchical-clustering',
      name: 'Hierarchical clustering (agglomerative)',
      aliases: ['agglomerative clustering', 'dendrogram clustering'],
      tier: 1,
      year: 1963,
      difficulty: 2,
      hook: 'Merges the two closest clusters over and over, building one tree you can cut at any number of clusters.',
      intuition:
        'Start by treating every point as its own cluster, then repeatedly merge whichever two clusters are ' +
        'closest, until only one giant cluster remains. Undo any number of those merges and you get however ' +
        'many clusters you want — the whole process builds one tree, called a dendrogram, and a flat ' +
        'clustering falls out wherever you slice it. Unlike k-means, you never commit to a number of clusters ' +
        'before running the algorithm; unlike DBSCAN, every point ends up somewhere, nested inside larger and ' +
        'larger groups. What changes the shape of the result is the rule for measuring distance between two ' +
        'clusters, not just between two points: linkage. Single linkage looks at the closest pair of points and ' +
        'can trace out long, snaking clusters; complete linkage looks at the farthest pair and produces tight, ' +
        "compact ones; Ward's method merges whichever pair increases the total within-cluster variance the " +
        'least, which tends to produce clusters of similar size.',
      howItWorks: {
        summary:
          'Start with every point in its own cluster, repeatedly merge the two closest clusters according to a ' +
          'chosen linkage rule, and stop when one cluster remains — recording every merge as a dendrogram.',
        steps: [
          'Start with n singleton clusters, one per data point.',
          'Compute the distance between every pair of clusters, using the chosen linkage criterion.',
          'Merge the two closest clusters into one; record the merge and the distance it happened at.',
          'Recompute distances from the newly merged cluster to every other cluster.',
          'Repeat merging until a single cluster containing all points remains.',
          'Cut the resulting dendrogram at a chosen height, or ask for a fixed number of clusters, to get a flat labeling.',
        ],
      },
      hyperparameters: [
        {
          name: 'linkage',
          what: "Rule for measuring distance between two clusters: 'ward', 'complete', 'average', or 'single'.",
          tuning:
            'Ward minimizes the increase in total within-cluster variance and gives the most evenly sized ' +
            "clusters — scikit-learn's default and usually the first thing to try, but it requires Euclidean " +
            'distance. Use average or complete linkage with non-Euclidean metrics; single linkage is cheapest ' +
            'but chains together through the single closest pair, which is fragile to a few connecting points ' +
            'of noise.',
        },
        {
          name: 'n_clusters / distance_threshold',
          what: 'Where to cut the dendrogram: a fixed number of clusters, or a maximum linkage distance.',
          tuning:
            'Pass exactly one of the two — scikit-learn requires n_clusters=None when distance_threshold is ' +
            'set. Read the dendrogram for a natural gap before picking either.',
        },
      ],
      whenToUse: [
        'You want to inspect the whole hierarchy of groupings, not commit to one flat partition, e.g. via a dendrogram',
        'You do not know k and would rather choose it after seeing the merge structure than guess it beforehand',
        'The dataset is small enough that an O(n^2) distance matrix and O(n^2 log n) merge search are affordable — a few thousand points, not millions',
        'Clusters are plausibly nested at multiple scales, sub-groups within groups, which a flat method cannot represent at all',
      ],
      whenNotToUse: [
        'The dataset is large — the full distance matrix does not fit in memory past roughly 10,000–20,000 points without a connectivity constraint',
        'A merge is permanent: once two clusters are joined, no later step can undo it, so one bad early merge can propagate, unlike k-means which reassigns points every iteration',
        'You need a fixed noise category for genuine outliers — every point ends up inside some cluster of the dendrogram, however poor the fit',
        'You need predictions on new points after fitting — hierarchical clustering has no natural out-of-sample extension',
      ],
      facets: {
        task: ['clustering'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'dendrogram-and-cluster-labels',
      },
      math: {
        latex: [
          '\\Delta(A, B) = \\mathrm{ESS}(A \\cup B) - \\mathrm{ESS}(A) - \\mathrm{ESS}(B)',
          'd_{\\text{single}}(A,B) = \\min_{a \\in A,\\, b \\in B} d(a,b), \\qquad d_{\\text{complete}}(A,B) = \\max_{a \\in A,\\, b \\in B} d(a,b)',
        ],
        notes:
          "Ward's criterion is the agglomerative analogue of k-means' objective — both minimize within-cluster " +
          'squared distance — which is why Ward tends to produce k-means-like round, evenly sized clusters, ' +
          'while single and complete linkage optimize nothing global and can produce very different shapes ' +
          'from the same data.',
      },
      complexity: {
        train:
          'O(n^2 log n) time and O(n^2) memory for the standard priority-queue implementation; connectivity ' +
          'constraints restricting merges to a nearest-neighbour graph speed this up substantially',
        predict: 'n/a — no incremental predict; new points require refitting or a separate nearest-cluster assignment rule',
      },
      code: [
        'from sklearn.cluster import AgglomerativeClustering',
        'from scipy.cluster.hierarchy import dendrogram, linkage',
        '',
        '# scikit-learn: get a flat labeling directly',
        'model = AgglomerativeClustering(n_clusters=4, linkage="ward")',
        'labels = model.fit_predict(X)',
        '',
        '# scipy: get the full merge tree to plot as a dendrogram',
        'Z = linkage(X, method="ward")',
        'dendrogram(Z, truncate_mode="lastp", p=12)',
      ].join('\n'),
      related: ['k-means', 'dbscan', 'distance-metrics'],
      references: {
        free: [{ title: 'scikit-learn user guide — Hierarchical clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html#hierarchical-clustering' }],
        papers: [
          {
            title: 'Hierarchical Grouping to Optimize an Objective Function',
            url: 'https://doi.org/10.1080/01621459.1963.10500845',
            year: 1963,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14 — Unsupervised Learning',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'dbscan',
      name: 'DBSCAN',
      aliases: ['density-based spatial clustering of applications with noise'],
      tier: 1,
      year: 1996,
      difficulty: 3,
      hook: 'Finds clusters of any shape by following density — and calls the leftovers noise.',
      intuition:
        'Imagine dropping onto a city at night and trying to identify neighbourhoods from the lights. You ' +
        'would not assume neighbourhoods are circular, and you would not insist every light belongs to one. ' +
        'You would look for regions where lights are packed closely together and treat the isolated ones as ' +
        'farmhouses. DBSCAN does exactly this. It defines a point as "core" if at least minPts other points ' +
        'lie within distance eps of it, then grows a cluster outward from each core point through its ' +
        'neighbours. Points that are near a cluster but not themselves dense get absorbed at the border; ' +
        'points near nothing are labelled noise. Because clusters grow by contact rather than by distance to a ' +
        'centre, they can be long, curved or interlocking — shapes k-means fundamentally cannot represent. You ' +
        'never specify the number of clusters; it falls out of the density structure.',
      howItWorks: {
        summary:
          'Label points as core, border or noise by counting neighbours within a radius, then connect core ' +
          "points that fall within each other's radius into clusters.",
        steps: [
          'For each point, count how many points lie within distance eps of it.',
          'Mark a point as a core point if that count is at least minPts.',
          "Connect any two core points that are within eps of each other.",
          'Each connected group of core points becomes one cluster.',
          'Assign each non-core point within eps of a core point to that cluster as a border point.',
          'Label every remaining point as noise (cluster -1).',
        ],
      },
      hyperparameters: [
        {
          name: 'eps',
          what: "Radius defining a point's neighbourhood.",
          tuning:
            "Plot the sorted distance to each point's k-th nearest neighbour (k = minPts) and look for the " +
            'elbow. Too small fragments clusters into noise; too large merges everything into one.',
        },
        {
          name: 'minPts',
          what: 'Neighbours required within eps for a point to be a core point.',
          tuning: 'Start at 2 * n_features (dimensionality). Raise it for noisy data. Values below 3 rarely behave.',
        },
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
          'Clusters are the equivalence classes of the transitive closure of density-reachability over core ' +
          'points. There is no objective function being minimised — DBSCAN is a construction, not an ' +
          'optimisation, which is why it has no random restarts and is deterministic apart from border-point ' +
          'tie-breaking.',
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
      related: ['hdbscan', 'k-means', 'isolation-forest', 'optics-and-mean-shift', 'approximate-nearest-neighbors'],
      references: {
        free: [{ title: 'scikit-learn user guide — DBSCAN', url: 'https://scikit-learn.org/stable/modules/clustering.html#dbscan' }],
        papers: [
          {
            title: 'A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise',
            url: 'http://cdn.aaai.org/KDD/1996/KDD96-037.pdf',
            year: 1996,
          },
          {
            title: 'DBSCAN Revisited, Revisited: Why and How You Should (Still) Use DBSCAN',
            url: 'https://doi.org/10.1145/3068335',
            year: 2017,
          },
        ],
        books: [
          {
            title: 'Introduction to Data Mining',
            author: 'Tan, Steinbach, Karpatne & Kumar',
            chapter: 'Ch. 8 — Cluster Analysis',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'hdbscan',
      name: 'HDBSCAN',
      aliases: ['hierarchical DBSCAN', 'density-based clustering based on hierarchical density estimates'],
      tier: 1,
      year: 2013,
      difficulty: 4,
      hook: 'Runs DBSCAN across every density threshold at once and keeps whichever clusters hold together the longest.',
      intuition:
        "DBSCAN's biggest weakness is that it needs one eps for the whole dataset, so a dense cluster and a " +
        'sparse one can never both be found correctly — whatever eps rescues the sparse cluster will merge the ' +
        'dense one into a blob, and vice versa. HDBSCAN removes that single knob by first stretching distances ' +
        'so that points in sparse regions look farther apart than points in dense ones (their "mutual ' +
        'reachability distance"), then building a minimum spanning tree over that reshaped space and cutting it ' +
        'from the top down, one edge at a time. Every cut produces a slightly different set of clusters, ' +
        'splitting or shrinking as you go — recording all of them gives a full hierarchy, condensed into a tree ' +
        'of nested candidate clusters. Instead of you choosing where to cut, HDBSCAN scores every candidate ' +
        'cluster by how long it persists relative to its size and keeps whichever set is the most stable ' +
        'overall, so it can genuinely handle clusters of different densities in the same pass.',
      howItWorks: {
        summary:
          'Reshape distances so sparse regions look farther apart (mutual reachability distance), build a ' +
          'minimum spanning tree over that graph, condense it into a hierarchy of candidate clusters, and keep ' +
          'whichever clusters are most stable across the hierarchy.',
        steps: [
          "For each point, compute its core distance: the distance to its min_samples-th nearest neighbour.",
          'Define the mutual reachability distance between two points as the maximum of their two core distances and their actual distance.',
          'Build a minimum spanning tree over the complete graph of mutual reachability distances.',
          'Convert the tree into a hierarchy by repeatedly removing its heaviest edge and tracking how each resulting component shrinks or splits.',
          'Condense that hierarchy by discarding splits that produce components smaller than min_cluster_size.',
          'Score every surviving cluster by its stability — how much density range it persists over — and select the set of clusters that maximizes total stability.',
        ],
      },
      hyperparameters: [
        {
          name: 'min_cluster_size',
          what: 'Smallest grouping of points that HDBSCAN will call a cluster rather than noise.',
          tuning:
            "Default is 5 in scikit-learn's HDBSCAN. Raise it if your data is fine-grained and you only want " +
            'substantial groupings — this is the parameter with the most direct effect on the final result.',
        },
        {
          name: 'min_samples',
          what: "The k used for each point's core distance — how conservative the notion of 'dense' is.",
          tuning:
            'Defaults to min_cluster_size when left unset. Raising it independently makes more points get ' +
            "classified as noise and pulls clusters toward denser cores, similar to DBSCAN's minPts.",
        },
      ],
      whenToUse: [
        'Clusters genuinely differ in density and a single DBSCAN eps demonstrably cannot fit both without merging one and fragmenting the other',
        'You want a noise category like DBSCAN gives you, but without hand-tuning eps by trial and error',
        'You want to inspect the condensed cluster hierarchy itself, not just the final flat labeling, to judge how confidently each cluster holds together',
        "You can afford the O(n^2) memory of the mutual reachability graph — moderate dataset sizes rather than tens of millions of points",
      ],
      whenNotToUse: [
        "The dataset is too large for O(n^2) memory and OPTICS's better memory scaling matters more than HDBSCAN's cleaner cluster extraction",
        'Density really is uniform across the data — plain DBSCAN with a single eps is simpler, cheaper, and gives an equivalent answer',
        'You need every point assigned to a cluster with no noise category at all',
        'Dimensionality is high enough that distances concentrate — mutual reachability distance is still built from an underlying metric that stops discriminating well past a few dozen dimensions',
      ],
      facets: {
        task: ['clustering', 'anomaly-detection'],
        dataType: ['tabular', 'spatial'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'cluster-labels-with-noise',
      },
      math: {
        latex: [
          'd_c(x) = \\text{distance to the min\\_samples-th nearest neighbour of } x',
          'd_m(a,b) = \\max\\{\\, d_c(a),\\, d_c(b),\\, d(a,b) \\,\\}',
        ],
        notes:
          'Mutual reachability distance never shrinks a distance, only inflates it — a point in a sparse region ' +
          'gets an inflated distance to everything, including its true neighbours, which is what lets a single ' +
          'minimum spanning tree encode every density threshold at once instead of committing to one eps. ' +
          'Stability, the score used to pick the final clusters, is the "excess of mass": roughly, the area a ' +
          'cluster occupies in the condensed tree, summed over the range of densities where it exists as a ' +
          'distinct component — favouring clusters that persist over many thresholds rather than ones that ' +
          'appear briefly then immediately split.',
      },
      complexity: {
        train:
          'O(n log n) for the minimum spanning tree with a spatial index, but O(n^2) memory for the mutual ' +
          'reachability graph — worse than OPTICS on memory though faster in practice',
        predict: 'n/a for the core fit; new points need a separate approximate-prediction step against the fitted hierarchy, not a native predict',
      },
      code: [
        'from sklearn.cluster import HDBSCAN',
        'from sklearn.preprocessing import StandardScaler',
        '',
        'X = StandardScaler().fit_transform(X_raw)',
        '',
        'hdb = HDBSCAN(min_cluster_size=10, min_samples=5).fit(X)',
        'labels = hdb.labels_                     # -1 marks noise, same convention as DBSCAN',
        '',
        '# unlike DBSCAN, no eps to tune — density scale is handled internally',
        'n_clusters = len(set(labels)) - (1 if -1 in labels else 0)',
      ].join('\n'),
      related: ['dbscan', 'k-means', 'optics-and-mean-shift', 'distance-metrics'],
      references: {
        free: [
          { title: 'scikit-learn user guide — HDBSCAN', url: 'https://scikit-learn.org/stable/modules/clustering.html#hdbscan' },
          { title: 'scikit-learn API — HDBSCAN', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.cluster.HDBSCAN.html' },
        ],
        papers: [
          {
            title: 'Density-Based Clustering Based on Hierarchical Density Estimates',
            url: 'https://doi.org/10.1007/978-3-642-37456-2_14',
            year: 2013,
          },
          {
            title: 'hdbscan: Hierarchical density based clustering',
            url: 'https://joss.theoj.org/papers/10.21105/joss.00205',
            year: 2017,
          },
        ],
        books: [
          {
            title: 'Introduction to Data Mining',
            author: 'Tan, Steinbach, Karpatne & Kumar',
            chapter: 'Ch. 8 — Cluster Analysis',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'optics-and-mean-shift',
      name: 'OPTICS & mean shift',
      tier: 2,
      year: 1999,
      difficulty: 3,
      hook: "Two ways to drop DBSCAN's fixed radius: order points by reachability, or climb uphill toward a density peak.",
      intuition:
        'OPTICS and mean shift both relax something DBSCAN insists on, but in different directions. OPTICS ' +
        "keeps DBSCAN's core-and-neighbourhood idea but stops fixing eps: it orders every point by how easy it " +
        'is to reach from a dense area, producing a reachability plot whose valleys are clusters and whose ' +
        'peaks are noise — you can extract a DBSCAN-equivalent clustering at any eps from that single ordering, ' +
        'cheaply, instead of rerunning DBSCAN per value. Mean shift throws away eps and neighbour-counting ' +
        'entirely. Treat every point as a hill-climber: repeatedly step each point toward the average position ' +
        'of its neighbours within a fixed bandwidth, and it slides uphill on the estimated density surface ' +
        'until it settles at a local peak (a mode). Points that converge to the same peak form one cluster. ' +
        'Like DBSCAN, neither needs the number of clusters specified in advance; unlike DBSCAN, mean shift has ' +
        'no noise category at all — every point converges somewhere.',
      howItWorks: {
        summary:
          'OPTICS orders points by reachability distance to expose density-based clusters at every eps at ' +
          'once; mean shift iteratively moves each point toward the mean of its neighbours until it converges ' +
          'on a density mode.',
        steps: [
          'OPTICS: for each point, compute a reachability distance to the nearest denser point already processed, building an ordering.',
          'OPTICS: read clusters off the resulting reachability plot as valleys, or extract a DBSCAN-style flat clustering at any eps directly from the ordering.',
          'Mean shift: for each point, repeatedly recompute it as the mean of all points within bandwidth distance, moving it uphill.',
          'Mean shift: stop each point when it stops moving; points that converge to the same location form a cluster.',
        ],
      },
      whenToUse: [
        'You want to explore clustering structure across a whole range of density thresholds without rerunning DBSCAN for every eps (OPTICS)',
        'Clusters are blob-shaped and roughly equal in size, and you want cluster centres estimated automatically as density modes rather than specified as k (mean shift)',
      ],
      whenNotToUse: [
        'The dataset is large — mean shift needs repeated neighbour searches per point per iteration and scales poorly past a few tens of thousands of rows',
        'You need a single fast answer at one known eps — plain DBSCAN is faster than OPTICS for a single density threshold',
      ],
      facets: {
        task: ['clustering'],
        dataType: ['tabular', 'spatial'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'cluster-labels',
      },
      related: ['dbscan', 'k-means', 'kernel-density-estimation'],
      references: {
        free: [
          { title: 'scikit-learn user guide — OPTICS', url: 'https://scikit-learn.org/stable/modules/clustering.html#optics' },
          { title: 'scikit-learn user guide — Mean Shift', url: 'https://scikit-learn.org/stable/modules/clustering.html#mean-shift' },
        ],
        papers: [
          {
            title: 'OPTICS: Ordering Points To Identify the Clustering Structure',
            url: 'https://doi.org/10.1145/304182.304187',
            year: 1999,
          },
          {
            title: 'Mean Shift: A Robust Approach Toward Feature Space Analysis',
            url: 'https://doi.org/10.1109/34.1000236',
            year: 2002,
          },
        ],
      },
    },
    {
      id: 'gaussian-mixture-models',
      name: 'Gaussian mixture models & EM',
      aliases: ['GMM', 'mixture of Gaussians', 'expectation-maximization clustering'],
      tier: 1,
      year: 1977,
      difficulty: 3,
      hook: 'Fits several overlapping Gaussian bells at once and gives every point a probability of belonging to each.',
      intuition:
        'k-means forces a hard choice: every point belongs to exactly one cluster, decided by which centroid is ' +
        'nearest. A Gaussian mixture model relaxes that. Assume the data was generated by a handful of Gaussian ' +
        'bells, each with its own centre, spread, and orientation, mixed together in some proportion — then ' +
        'ask, for each point, how likely each bell was to have produced it. Because a point can sit in the ' +
        'overlap between two bells, it gets a soft assignment: a probability for each cluster instead of a ' +
        "single label, and clusters can be stretched ellipses rather than k-means' implicit spheres. Fitting " +
        'alternates between two steps: guess how responsible each cluster is for each point given the current ' +
        "bells (expectation), then re-fit each bell's centre and spread using those responsibility-weighted " +
        'points (maximization). This is a specific case of the EM algorithm, a general recipe for ' +
        'maximum-likelihood fitting when part of the data — here, which cluster generated which point — is ' +
        'unobserved.',
      howItWorks: {
        summary:
          "Alternate between computing each point's probability of belonging to each Gaussian component " +
          "(E-step) and re-estimating each component's mean, covariance and weight from those probabilities " +
          '(M-step) until the log-likelihood stops improving.',
        steps: [
          'Choose the number of components k and initialize their means, covariances and mixing weights (scikit-learn initializes with k-means by default).',
          "E-step: for each point, compute the posterior probability (\"responsibility\") that each component generated it, via Bayes' rule.",
          "M-step: re-estimate each component's mean, covariance and mixing weight as the responsibility-weighted average over all points.",
          'Repeat E and M steps; the log-likelihood of the data is guaranteed to never decrease at each step.',
          'Stop when the log-likelihood improvement falls below a tolerance, or max_iter is reached.',
          'Assign each point either softly (its full probability vector) or hard (its most likely component) as the final clustering.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_components',
          what: 'Number of Gaussian components in the mixture — analogous to k in k-means.',
          tuning:
            'Not chosen by cross-validation on accuracy, since there is no label; fit several values and ' +
            'compare BIC or AIC instead, and pick the elbow — scikit-learn exposes gmm.bic(X) and gmm.aic(X) directly.',
        },
        {
          name: 'covariance_type',
          what: "Shape each component's covariance is allowed to take: 'spherical', 'diag', 'tied', or 'full' (default).",
          tuning:
            "'full' is the most flexible, an arbitrary ellipse per component, but has the most parameters to " +
            "estimate and is prone to singular covariances with few points per component; drop to 'diag' or " +
            "'tied' when data per component is scarce relative to dimensionality.",
        },
        {
          name: 'n_init',
          what: 'Number of random EM restarts; the run with the best log-likelihood is kept.',
          tuning:
            "Default is 1, unlike k-means's several restarts by default — EM is more sensitive to a bad start " +
            "than Lloyd's algorithm, so raise this whenever results seem unstable across runs.",
        },
      ],
      whenToUse: [
        'You want soft, probabilistic cluster membership rather than a single hard label per point',
        "Clusters are plausibly elliptical, differently sized, or oriented at an angle — GMM's covariance can represent that where k-means' spheres cannot",
        'You want a generative model of the data, e.g. to sample new points or compute a likelihood for anomaly scoring',
        'You have a principled way to compare candidate numbers of components, such as BIC or AIC, rather than eyeballing an elbow',
      ],
      whenNotToUse: [
        'The data is not well described by a mixture of Gaussians at all — irregular, non-convex or manifold-shaped clusters; use DBSCAN or spectral clustering instead',
        'Dimensionality is high relative to the number of points — full covariance matrices need O(d^2) parameters per component and quickly overfit or become singular',
        'You need a globally optimal fit — EM converges only to a local optimum of the likelihood, and different initializations can land on different answers',
        'Some components could genuinely have very few points — covariance estimates for sparsely populated components can collapse toward singular, inflating their likelihood unrealistically',
      ],
      facets: {
        task: ['clustering', 'anomaly-detection'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'soft-cluster-probabilities',
      },
      math: {
        latex: [
          'p(x) = \\sum_{k=1}^{K} \\pi_k \\, \\mathcal{N}(x \\mid \\mu_k, \\Sigma_k)',
          '\\gamma_{ik} = \\frac{\\pi_k \\, \\mathcal{N}(x_i \\mid \\mu_k, \\Sigma_k)}{\\sum_{j=1}^{K} \\pi_j \\, \\mathcal{N}(x_i \\mid \\mu_j, \\Sigma_j)}',
        ],
        notes:
          'gamma_ik, the responsibility, is exactly the E-step; the M-step re-estimates mu_k, Sigma_k and pi_k ' +
          'as the gamma-weighted mean, covariance and share of the data. Dempster, Laird and Rubin\'s 1977 ' +
          'paper proved the general result GMM fitting relies on: each EM iteration never decreases the ' +
          'observed-data log-likelihood, which guarantees convergence to a stationary point — but says nothing ' +
          'about which one, so a bad initialization can converge to a poor local optimum, exactly as with k-means.',
      },
      complexity: {
        train: 'O(n·k·d^2) per iteration for full covariance (dominated by inverting each component\'s d×d covariance), run until convergence',
        predict: 'O(k·d^2) per point to evaluate its probability under each component',
      },
      code: [
        'from sklearn.mixture import GaussianMixture',
        'import numpy as np',
        '',
        'bics = []',
        'for k in range(1, 8):',
        '    gmm = GaussianMixture(n_components=k, covariance_type="full", n_init=5, random_state=0)',
        '    gmm.fit(X)',
        '    bics.append(gmm.bic(X))            # lower BIC is better',
        '',
        'best_k = np.argmin(bics) + 1',
        'gmm = GaussianMixture(n_components=best_k, n_init=5, random_state=0).fit(X)',
        'proba = gmm.predict_proba(X)           # soft assignment, one row per point',
      ].join('\n'),
      related: ['k-means', 'hierarchical-clustering', 'one-class-detection-and-lof', 'maximum-likelihood-and-map'],
      references: {
        free: [{ title: 'scikit-learn user guide — Gaussian mixture models', url: 'https://scikit-learn.org/stable/modules/mixture.html' }],
        papers: [
          {
            title: 'Maximum Likelihood from Incomplete Data via the EM Algorithm',
            url: 'https://doi.org/10.1111/j.2517-6161.1977.tb01600.x',
            year: 1977,
          },
        ],
        books: [
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Bishop',
            chapter: 'Ch. 9 — Mixture Models and EM',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'spectral-clustering',
      name: 'Spectral clustering',
      tier: 2,
      year: 2000,
      difficulty: 4,
      hook: 'Turns clustering into a graph-cutting problem, solved by finding the smallest eigenvectors of a similarity graph.',
      intuition:
        'Some clusters are not separated by distance to a centre at all — think two concentric rings, or two ' +
        'interleaved crescents — and k-means, which only ever draws straight-line boundaries between ' +
        "centroids, cannot separate them no matter how it's initialized. Spectral clustering sidesteps the " +
        'shape problem by not clustering the points directly. First build a graph connecting nearby points, ' +
        'weighted by similarity. Cutting that graph into k pieces so that the total weight of cut edges is ' +
        'small — leaving tightly connected pieces intact — is what you actually want, and it turns out the ' +
        "eigenvectors of the graph's Laplacian matrix corresponding to its smallest eigenvalues give a new, " +
        'low-dimensional coordinate for every point in which that graph-cutting problem becomes easy. Compute ' +
        "those eigenvectors, treat each point's row across them as a new feature vector, and run ordinary " +
        'k-means in that transformed space — clusters that were tangled or non-convex in the original space ' +
        'often become simple round blobs in the spectral embedding.',
      howItWorks: {
        summary:
          "Build a similarity graph between points, compute the eigenvectors of its Laplacian with the " +
          'smallest eigenvalues, and run k-means on the resulting low-dimensional embedding.',
        steps: [
          'Build an affinity (similarity) matrix between points — a Gaussian/RBF kernel on distance, or a k-nearest-neighbours graph.',
          'Compute the graph Laplacian from that affinity matrix.',
          'Extract the k eigenvectors with the smallest eigenvalues; stack them as columns to give each point a new k-dimensional coordinate.',
          'Run k-means (or a discretization step) on those new coordinates to produce the final flat cluster labels.',
        ],
      },
      whenToUse: [
        'Clusters are non-convex, nested, or otherwise not separable by straight-line boundaries between centroids — spiral or ring-shaped groups',
        "You already have a natural similarity graph, e.g. an adjacency matrix, rather than points in a vector space, and can pass affinity='precomputed'",
      ],
      whenNotToUse: [
        'The number of clusters is large, or the dataset has more than a few thousand points — eigendecomposition of the n×n graph Laplacian is the bottleneck and does not scale the way k-means does',
        'The affinity matrix is not well-behaved, e.g. built from raw signed distances rather than a proper similarity/kernel — results become unstable without a kernel transform first',
      ],
      facets: {
        task: ['clustering'],
        dataType: ['tabular', 'graph', 'spatial'],
        dataSize: ['tiny', 'small'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'cluster-labels',
      },
      related: ['k-means', 'hierarchical-clustering', 'graph-convolutional-networks'],
      references: {
        free: [{ title: 'scikit-learn user guide — Spectral clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html#spectral-clustering' }],
        papers: [
          {
            title: 'Normalized Cuts and Image Segmentation',
            url: 'https://doi.org/10.1109/34.868688',
            year: 2000,
          },
          {
            title: 'On Spectral Clustering: Analysis and an Algorithm',
            url: 'https://proceedings.neurips.cc/paper/2001/hash/801272ee79cfde7fa5960571fee36b9b-Abstract.html',
            year: 2001,
          },
        ],
      },
    },
    {
      id: 'isolation-forest',
      name: 'Isolation Forest',
      aliases: ['iForest'],
      tier: 1,
      year: 2008,
      difficulty: 3,
      hook: 'Randomly splits data apart; points that take only a few splits to isolate are the anomalies.',
      intuition:
        'Most anomaly detectors ask how far a point is from its neighbours, or how dense the region around it ' +
        'is. Isolation Forest asks a different question: how easy is this point to isolate? Build a tree by ' +
        'repeatedly picking a random feature and a random split value between its min and max, partitioning ' +
        'the data in two, and recursing. A point sitting in a dense, unremarkable region takes many such random ' +
        'splits to separate from everything else, because it looks like its neighbours along most features. A ' +
        'genuine outlier — far from the bulk of the data, or an unusual combination of feature values — tends ' +
        'to get isolated in just a handful of splits, since almost any random cut somewhere separates it from ' +
        'the crowd. Average that path length over a whole forest of random trees, and short average paths mean ' +
        'anomalous; long ones mean normal. Nothing here computes a distance or a density — the entire signal is ' +
        'how few random cuts it takes to cut a point off.',
      howItWorks: {
        summary:
          'Grow many trees that split the data on a random feature and random threshold at each node, and ' +
          'score each point by its average path length to isolation across the forest — short paths are anomalies.',
        steps: [
          'Draw a small random subsample of the data (256 points by default) for each tree — isolation forests do not need the full dataset per tree.',
          'Build an isolation tree: at each node, pick a random feature and a random split value between its current min and max, and partition the points.',
          'Recurse until every point is alone in its own leaf, or a height limit is reached.',
          'Repeat for n_estimators independent trees.',
          'Score each point by its path length from root to leaf, averaged across all trees, and normalize against the expected path length for the sample size.',
          'Flag points with the shortest average path length, below a threshold set by contamination, as anomalies.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_estimators',
          what: 'Number of isolation trees in the forest.',
          tuning:
            'Default is 100 in scikit-learn. The score stabilizes with more trees; 100 is usually already ' +
            'enough for path length averages to converge.',
        },
        {
          name: 'max_samples',
          what: 'Number of points randomly drawn to build each tree.',
          tuning:
            'Default "auto" uses min(256, n_samples) — the original paper found 256 sufficient to distinguish ' +
            'anomalies from normal points regardless of total dataset size, and larger subsamples can hurt by ' +
            'making trees deeper and normal points harder to tell apart ("swamping" and "masking").',
        },
        {
          name: 'contamination',
          what: "Expected proportion of outliers, used to set the score threshold for predict()'s label.",
          tuning:
            "Default 'auto' uses a threshold derived in the original paper. Set it explicitly to your best " +
            'estimate of the true anomaly rate if you know it — decision_function and score_samples give the ' +
            'raw, threshold-independent score regardless.',
        },
      ],
      whenToUse: [
        'You need anomaly detection in tabular data with many features — isolation forest is linear in n_estimators × max_samples and does not degrade like distance-based methods in high dimensions',
        'You have little or no idea what anomalies look like in advance — the method needs no profile of normal or abnormal points, only random splits',
        'You want a model that scales to large datasets — each tree only touches a small subsample, so training is fast even when n is large',
        'Anomalies are a minority of points that are genuinely easier to separate from the rest, not points embedded within a dense cluster of similar anomalies',
      ],
      whenNotToUse: [
        'Anomalies form their own dense cluster rather than being scattered outliers — isolating a small dense cluster of similar points takes about as many splits as isolating a normal one, so the score will not flag it',
        'You need a local notion of outlier-ness — a point normal in one region of feature space but anomalous relative to its neighbours in another; use Local Outlier Factor instead',
        'You need to explain why a specific point was flagged in terms of feature contributions — path length is not directly attributable to individual features without extra work',
        'The feature space is dominated by a few irrelevant high-variance features — random splits waste most of their partitioning power on features that carry no anomaly signal',
      ],
      facets: {
        task: ['anomaly-detection'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'anomaly-score',
      },
      math: {
        latex: [
          'c(n) = 2H(n-1) - \\frac{2(n-1)}{n}, \\qquad H(i) \\approx \\ln(i) + 0.5772156649',
          's(x, n) = 2^{-\\frac{E[h(x)]}{c(n)}}',
        ],
        notes:
          'c(n) is the average path length of an unsuccessful search in a binary search tree of n points, used ' +
          'to normalize a raw path length E[h(x)] into the score s(x,n) in the second line. s approaches 1 for ' +
          'points isolated in very few splits (anomalies) and drops toward 0.5 or below for points that need ' +
          'close to c(n) splits (normal). Because the score is built purely from split counts, it carries no ' +
          'explicit density or distance computation anywhere in it — the detail most often blurred when ' +
          'isolation forest gets compared to LOF or one-class SVM, which are density- and boundary-based respectively.',
      },
      complexity: {
        train:
          'O(n_estimators · max_samples · log(max_samples)) — each tree only touches its subsample, so ' +
          'training cost does not grow with the full dataset size the way distance-based methods do',
        predict: 'O(n_estimators · log(max_samples)) per point',
      },
      code: [
        'from sklearn.ensemble import IsolationForest',
        '',
        'clf = IsolationForest(n_estimators=100, contamination=0.02, random_state=0)',
        'clf.fit(X_train)',
        '',
        'labels = clf.predict(X_test)           # 1 = normal, -1 = anomaly',
        'scores = clf.score_samples(X_test)     # higher = more normal; threshold-independent',
      ].join('\n'),
      // random-forest / bagging is the genuine cross-body link, not decoration: scikit-learn's own
      // IsolationForest uses ExtraTreeRegressor as its base estimator, i.e. it IS a random-tree
      // ensemble, built the same way as the Mars ensembles it links to — just scored by path length
      // instead of averaged predictions.
      related: ['random-forest', 'bagging', 'one-class-detection-and-lof'],
      references: {
        free: [{ title: 'scikit-learn user guide — Isolation Forest', url: 'https://scikit-learn.org/stable/modules/outlier_detection.html#isolation-forest' }],
        papers: [
          {
            title: 'Isolation Forest',
            url: 'https://doi.org/10.1109/ICDM.2008.17',
            year: 2008,
          },
          {
            title: 'Isolation-Based Anomaly Detection',
            url: 'https://doi.org/10.1145/2133360.2133363',
            year: 2012,
          },
        ],
        books: [
          {
            title: 'Introduction to Data Mining',
            author: 'Tan, Steinbach, Karpatne & Kumar',
            chapter: 'Ch. 9 — Anomaly Detection',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'one-class-detection-and-lof',
      name: 'One-class detection & LOF',
      aliases: ['Local Outlier Factor', 'one-class SVM'],
      tier: 2,
      year: 2000,
      difficulty: 3,
      hook: 'Two ways to flag outliers unsupervised: enclose the normal data in a boundary, or compare local density to neighbours.',
      intuition:
        'Both methods here answer the same question — is this point unlike the rest? — with unlabeled data and ' +
        "no examples of what 'abnormal' looks like, but they answer it differently. One-Class SVM draws a " +
        'boundary, in a possibly kernel-transformed space, that tightly encloses the bulk of the normal data; ' +
        'anything that falls outside the boundary is flagged, and how much of the training data is allowed to ' +
        'fall outside is a parameter you set directly (nu). Local Outlier Factor instead compares densities: ' +
        'for each point, look at how far away its k nearest neighbours are, then compare that to how far away ' +
        "its neighbours' neighbours are. A point whose local neighbourhood is much sparser than its " +
        'neighbours\' own neighbourhoods gets a high LOF score, even if it sits right next to a much denser ' +
        'cluster elsewhere in the data — which is why LOF catches local outliers that a single global density ' +
        'threshold, or a single enclosing boundary, would miss.',
      howItWorks: {
        summary:
          'One-Class SVM fits a boundary enclosing the normal data in feature space; Local Outlier Factor ' +
          "scores each point by how much sparser its neighbourhood is than its neighbours' neighbourhoods.",
        steps: [
          'One-Class SVM: map points into a (possibly kernel-transformed) feature space and find the maximum-margin boundary separating the data from the origin, controlled by nu.',
          'One-Class SVM: score new points by which side of that boundary they fall on.',
          'LOF: for each point, find its k nearest neighbours and compute its local reachability density from the distance to them.',
          "LOF: compare that density to the average local reachability density of its own neighbours — a ratio near 1 is normal, well above 1 is an outlier.",
        ],
      },
      whenToUse: [
        'Outliers are local — sparse relative to their own neighbourhood even though that neighbourhood might be denser than some other, entirely normal region elsewhere in the data (LOF)',
        'The normal data is expected to form one contiguous region and you want a single boundary you can score new points against directly (One-Class SVM)',
      ],
      whenNotToUse: [
        "The dataset is large — LOF needs a k-nearest-neighbour query per point and One-Class SVM's kernelized form is quadratic in the number of training points, both far slower than Isolation Forest at scale",
        'You need a fast, roughly-tuned baseline — One-Class SVM is known to be sensitive to outliers in its own training set and needs careful tuning of nu to perform well',
      ],
      facets: {
        task: ['anomaly-detection'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'anomaly-score',
      },
      // k-nearest-neighbors is the genuine cross-body link: LOF's local reachability density is
      // built directly on top of the Venus k-NN machinery.
      related: ['isolation-forest', 'dbscan', 'k-nearest-neighbors'],
      references: {
        free: [{ title: 'scikit-learn user guide — Novelty and Outlier Detection', url: 'https://scikit-learn.org/stable/modules/outlier_detection.html' }],
        papers: [
          {
            title: 'LOF: Identifying Density-Based Local Outliers',
            url: 'https://doi.org/10.1145/335191.335388',
            year: 2000,
          },
          {
            title: 'Estimating the Support of a High-Dimensional Distribution',
            url: 'https://doi.org/10.1162/089976601750264965',
            year: 2001,
          },
        ],
      },
    },
    {
      id: 'association-rules',
      name: 'Association rules (Apriori, FP-Growth)',
      aliases: ['market basket analysis', 'frequent itemset mining'],
      tier: 2,
      year: 1994,
      difficulty: 2,
      hook: 'Finds "if you bought X, you also bought Y" patterns by counting how often item sets occur together.',
      intuition:
        'Given a pile of transactions — each one a set of items bought together — association rule mining ' +
        "looks for rules of the form 'if a transaction contains X, it tends to also contain Y', scored by how " +
        'often the rule fires (support) and how reliable it is when its condition holds (confidence). The ' +
        'naive approach, checking every possible combination of items, is hopeless: with a few thousand ' +
        'distinct items there are more possible itemsets than atoms in reach. Apriori prunes that search with ' +
        'one simple, provably correct fact: a set of items can only occur frequently if every subset of it ' +
        'also occurs frequently, so it builds itemsets one item at a time and throws away any candidate with ' +
        'an infrequent subset before even counting it. FP-Growth skips candidate generation entirely — it ' +
        'compresses the whole transaction database into a tree structure and mines frequent patterns directly ' +
        'out of that tree, which is why it typically outperforms Apriori by a wide margin on the same data.',
      howItWorks: {
        summary:
          'Count how often item combinations co-occur in transactions, keep the ones above a support ' +
          'threshold as frequent itemsets, then turn those into rules scored by confidence and lift.',
        steps: [
          'Apriori: count single items, keep those above min_support, then extend surviving itemsets by one item at a time, pruning any candidate whose subset was already infrequent.',
          'FP-Growth: build a compressed FP-tree of the transaction database once, then recursively mine frequent itemsets from the tree without ever generating and testing candidates.',
          'From the final frequent itemsets, generate rules (antecedent → consequent) and keep those meeting a minimum confidence or lift threshold.',
        ],
      },
      whenToUse: [
        'Data is naturally a collection of transactions or baskets — retail purchases, browsing sessions, prescriptions filled together — and you want human-readable "if X then Y" rules, not a predictive model',
        "You need FP-Growth specifically because the dataset is large or has many frequent items — it avoids Apriori's repeated database scans and candidate explosion",
      ],
      whenNotToUse: [
        'You want to predict a specific target variable — this is unsupervised pattern discovery, not classification; a supervised model will do that job better',
        'The item catalogue is huge with very low per-item frequency — support thresholds low enough to find anything meaningful can still leave you with an unmanageable number of rules to sift through',
      ],
      facets: {
        task: ['clustering'],
        dataType: ['tabular'],
        dataSize: ['medium', 'large'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'rule-list',
      },
      related: ['k-means', 'dbscan', 'rule-induction'],
      references: {
        free: [
          { title: 'mlxtend user guide — Apriori', url: 'http://rasbt.github.io/mlxtend/user_guide/frequent_patterns/apriori/' },
          { title: 'mlxtend user guide — Association Rules', url: 'http://rasbt.github.io/mlxtend/user_guide/frequent_patterns/association_rules/' },
        ],
        papers: [
          {
            title: 'Fast Algorithms for Mining Association Rules in Large Databases',
            url: 'https://dl.acm.org/doi/10.5555/645920.672836',
            year: 1994,
          },
          {
            title: 'Mining Frequent Patterns without Candidate Generation',
            url: 'https://doi.org/10.1145/335191.335372',
            year: 2000,
          },
        ],
      },
    },
  ],
} satisfies Body;
