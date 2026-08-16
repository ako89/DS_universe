/**
 * Jupiter — Clustering, Density & Anomaly. See PLAN.md §3 for the full moon list.
 *
 * Phase 2 pressure-test content: only `dbscan` is written here — it is docs/CONTENT_GUIDE.md
 * §2's gold-standard entry, included essentially as given there (that text was already
 * calibrated as the register/length/structure example every other entry is meant to match), with
 * its facts independently re-confirmed by this session's own web research rather than trusted
 * blindly — see the commit message for what was checked. The other 9 moons listed for Jupiter in
 * PLAN.md §3 are Phase 3 work.
 *
 * `related` is overridden from the gold-standard text's (hdbscan, optics, k-means,
 * isolation-forest — none of which exist yet) to the only two other entries that exist yet. See
 * mercury.ts's file comment for why, and Phase 3's cross-link pass for the real fix.
 *
 * `eraRange` is [1996, 1996] — degenerate on purpose, for the same reason as mercury.ts's:
 * only one moon exists so far. Widen it as Phase 3 adds the rest.
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
  eraRange: [1996, 1996],
  moons: [
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
      related: ['linear-regression', 'self-attention'],
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
  ],
} satisfies Body;
