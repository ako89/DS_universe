/**
 * Uranus — Kernels, Margins & Gaussian Processes. See PLAN.md §3 for the moon list (6 moons, all
 * written here at their marked tiers: support-vector-machines and kernel-trick and
 * gaussian-processes at Tier 1; support-vector-regression, one-class-svm and bayesian-optimization
 * at Tier 2).
 *
 * `support-vector-machines` deliberately stays in the linear case throughout — margin, slack, C —
 * and only gestures at kernels in `math.notes` as the seam the next entry attaches to. `kernel-trick`
 * is written as the general idea (implicit feature-space mapping via a Mercer kernel), not a
 * restatement of SVMs, and links outward to kernel-pca (Saturn) and kernel-density-estimation
 * (Venus) — both real, pre-existing entries that use the same machinery for a different purpose.
 * `one-class-svm` is a separate, deeper entry from Jupiter's `one-class-detection-and-lof`, which
 * bundles One-Class SVM with LOF at survey depth; this entry goes into the actual hyperplane-from-
 * origin construction and links back to Jupiter's entry rather than duplicating it.
 *
 * `eraRange` is [1964, 2001]: Aizerman, Braverman & Rozonoer's "Theoretical Foundations of the
 * Potential Function Method in Pattern Recognition Learning" (Automation and Remote Control 25,
 * 1964) is the paper that brought Mercer-kernel machinery into pattern recognition — the earliest
 * moon here — and Schölkopf, Platt, Shawe-Taylor, Smola & Williamson's One-Class SVM paper
 * (Neural Computation 13(7), 2001) is the latest.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * One PDF-fetch trap was caught directly: fetching the scanned 1964 Aizerman et al. paper (both
 * cs.uwaterloo.ca's mirror and a Scientific Research Publishing reference page, which 403'd)
 * returned no usable text rather than inventing a page range or a false confidence — the year,
 * authors and journal used here for `kernel-trick` come from cross-corroborated search metadata
 * and an opened secondary HTML source instead, and no URL to the primary PDF is cited in
 * `references` as a result. A second near-miss: WebFetch's summary of the Rasmussen & Williams GPML
 * PDF asserted an O(n^3) complexity figure "discussed in detail" without quoting a page — that
 * claim was independently re-verified via scikit-learn's own docs (which state GP classification
 * "scales cubically with the size of the dataset") and multiple independent HTML sources (arXiv
 * abstracts, Stan's own documentation) before being used here, rather than trusted from the PDF
 * summary alone.
 *
 * Every citation below was opened directly (arXiv /abs/ pages, scikit-learn docs, NeurIPS papers.cc
 * pages, or crossref DOI metadata at api.crossref.org) except the 1964 Aizerman et al. paper, whose
 * year/authors/journal are corroborated across independent search results and one opened secondary
 * page but not cited as a `references` entry since no primary URL was verifiable.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'uranus',
  name: 'Uranus',
  segment: 'Kernels, Margins & Gaussian Processes',
  hook: 'Draws the widest possible boundary between classes, then quietly rebuilds that idea in an implicit, kernel-defined space.',
  summary:
    'Uranus is one idea worked from several angles: define a decision boundary, a regression fit, or an outlier ' +
    'frontier by its margin, and let a kernel function decide — cheaply, without ever leaving the original ' +
    'coordinates — how curved that boundary is allowed to be. Gaussian processes push the same kernel machinery ' +
    'toward a different goal: not a single best-fit function but a full, calibrated distribution over every ' +
    'function consistent with the data, which is exactly the ingredient Bayesian optimization needs to decide ' +
    'where an expensive experiment should look next.',
  eraRange: [1964, 2001],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'support-vector-machines',
      name: 'Support vector machines',
      aliases: ['SVM', 'support vector classifier', 'maximum margin classifier'],
      tier: 1,
      year: 1995,
      difficulty: 3,
      hook: 'Finds the hyperplane that separates two classes by the widest possible margin, tolerating some overlap.',
      intuition:
        'Picture two clouds of points on a table that you want to divide with a single straight line. Many ' +
        'lines would separate them, but one is best: the line sitting as far as possible from the nearest point ' +
        'of either cloud, since that leaves the most room for a slightly different draw of data to still land ' +
        'on the right side. A support vector machine looks for exactly that line — or, in higher dimensions, ' +
        'that hyperplane — by maximizing the margin to the closest points, called support vectors, because they ' +
        'alone determine where the boundary goes; every other point could move or vanish without changing the ' +
        'answer. Real data rarely separates cleanly, so a soft margin lets some points sit inside the margin or ' +
        'on the wrong side, at a cost controlled by a penalty C. This entry stays with the plain linear case; ' +
        'replacing the dot product it relies on with a kernel function turns the same margin-maximizing machine ' +
        'into one that can carve out curved boundaries too.',
      howItWorks: {
        summary:
          'Find the linear boundary between two classes that maximizes the distance to the nearest point of ' +
          'either class, allowing a controlled number of margin violations.',
        steps: [
          'Represent each labelled point as a vector and look for a hyperplane w·x + b = 0 separating the two classes.',
          "Maximize the margin — the distance from the hyperplane to the nearest point of either class — by minimizing ||w||^2 subject to every point lying on the correct side.",
          'Introduce slack variables so points inside the margin or misclassified are allowed, each incurring a cost proportional to C.',
          'Solve the resulting quadratic program; only points on or inside the margin end up with nonzero weight — the support vectors.',
          'Classify a new point by which side of the hyperplane it falls on.',
        ],
      },
      hyperparameters: [
        {
          name: 'C',
          what: 'Penalty on margin violations and misclassifications — the soft-margin trade-off.',
          tuning:
            "scikit-learn's SVC defaults to C=1.0. Lower C widens the margin and tolerates more violations " +
            '(more regularization); raise it to fit the training data more tightly, at the risk of overfitting.',
        },
        {
          name: 'kernel',
          what: 'Which similarity function replaces the plain dot product w^T x in the decision rule.',
          tuning:
            "This entry covers kernel='linear'. scikit-learn's SVC actually defaults to kernel='rbf', which is " +
            'exactly the kernel-trick extension of this same method — see that entry for how a kernel is chosen and tuned.',
        },
      ],
      whenToUse: [
        'The number of rows is small to moderate (roughly under a hundred thousand), since training scales quadratically to cubically with the sample count',
        'The feature space is high-dimensional relative to the number of examples — bag-of-words text classification is the classic case — where a wide margin generalizes well',
        'You want a boundary shaped by the hardest-to-classify points specifically, rather than by every point equally as in logistic regression',
        'Classes are separable, or nearly so, with only a comparatively small number of points actually needed to define the boundary',
      ],
      whenNotToUse: [
        'The dataset is large — quadratic-to-cubic training cost in n_samples makes plain SVC impractical past a few tens of thousands of rows; use SGDClassifier or a linear solver instead',
        'You need calibrated class probabilities directly — the raw output is a signed distance to the hyperplane, not a probability, and needs a separate Platt-scaling step',
        'Classes overlap heavily with no clean margin at any reasonable C, where a probabilistic linear model already fits about as well for less tuning',
        'You need to explain a specific prediction in terms of the original features once a nonlinear kernel replaces the dot product — only the linear kernel keeps that direct readability',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular', 'text'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-label-and-decision-score',
      },
      math: {
        latex: [
          '\\min_{w,\\,b,\\,\\xi}\\ \\tfrac{1}{2}\\lVert w \\rVert^2 + C\\sum_{i=1}^{n}\\xi_i \\quad \\text{s.t. } y_i(w^\\top x_i + b) \\ge 1-\\xi_i,\\ \\xi_i \\ge 0',
          'f(x) = \\mathrm{sign}\\Big(\\sum_{i \\in SV} \\alpha_i y_i\\, x_i^\\top x + b\\Big)',
        ],
        notes:
          'The dual form on the second line shows the decision only ever needs the dot products x_i^T x between ' +
          'the query and the support vectors — nothing else about the training data matters once fitting is ' +
          'done. That is also the seam kernels attach to: swap x_i^T x for a kernel function K(x_i, x) and the ' +
          'same margin-maximizing optimization produces a nonlinear boundary without changing the algorithm at ' +
          'all (see kernel-trick). Points with alpha_i = 0 sit strictly outside the margin and could be deleted ' +
          'without changing the fitted boundary at all.',
      },
      complexity: {
        train:
          "O(n_features · n_samples^2) to O(n_features · n_samples^3), depending on how efficiently the solver " +
          "caches the kernel matrix, per scikit-learn's own documentation for its libsvm-based implementation",
        predict: 'O(n_SV · n_features) — every support vector is evaluated against the query point',
      },
      code: [
        'from sklearn.svm import SVC',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.pipeline import make_pipeline',
        '',
        'clf = make_pipeline(',
        '    StandardScaler(),             # SVMs are not scale-invariant',
        '    SVC(kernel="linear", C=1.0),',
        ')',
        'clf.fit(X_train, y_train)',
        '',
        'preds = clf.predict(X_test)',
        'scores = clf.decision_function(X_test)   # signed distance to the hyperplane, not a probability',
        'n_support = clf.named_steps["svc"].n_support_             # support vectors per class',
      ].join('\n'),
      related: ['kernel-trick', 'support-vector-regression', 'one-class-svm', 'logistic-regression'],
      references: {
        free: [{ title: 'scikit-learn user guide — Support Vector Machines', url: 'https://scikit-learn.org/stable/modules/svm.html' }],
        papers: [
          {
            title: 'A Training Algorithm for Optimal Margin Classifiers',
            url: 'https://doi.org/10.1145/130385.130401',
            year: 1992,
          },
          {
            title: 'Support-Vector Networks',
            url: 'https://doi.org/10.1023/A:1022627411411',
            year: 1995,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 12 — Support Vector Machines and Flexible Discriminants',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'kernel-trick',
      name: 'The kernel trick',
      aliases: ['kernel method', 'kernel function'],
      tier: 1,
      year: 1964,
      difficulty: 3,
      hook: 'Lets a linear method work in a curved feature space, without ever computing coordinates in it.',
      intuition:
        'Many algorithms — support vector machines, PCA, ridge regression, nearest neighbours — only ever touch ' +
        'the data through dot products between pairs of points. That is a narrow doorway, but it means you can ' +
        'swap what walks through it. Replace the ordinary dot product with a kernel function K(x, y) that ' +
        'behaves like a dot product in some other, possibly much higher-dimensional space, and the algorithm ' +
        'runs unchanged while its answer becomes nonlinear in the original features. The trick is that you never ' +
        'have to build that higher-dimensional space or compute a point\'s coordinates in it — an RBF kernel ' +
        'implicitly maps into an infinite-dimensional space, yet K(x, y) is one cheap number to evaluate. Not ' +
        'every similarity function qualifies: Mercer\'s condition requires the kernel matrix built from any ' +
        'finite set of points to be positive semidefinite, which guarantees a valid, if implicit, feature space ' +
        'actually exists behind the function.',
      howItWorks: {
        summary:
          'Replace an algorithm\'s dot product x^T y with a kernel function K(x, y) that computes a dot product ' +
          'implicitly in a higher-dimensional feature space, without ever forming that space explicitly.',
        steps: [
          'Identify the dot products x_i^T x_j inside an algorithm expressed purely in terms of them (its dual form).',
          "Choose a kernel function K(x, y) — e.g. RBF: exp(-gamma||x-y||^2), or polynomial: (gamma·x^T y + r)^d — computing a similarity between two points.",
          "Confirm the kernel satisfies Mercer's condition — its Gram matrix over any finite sample must be positive semidefinite — so it genuinely corresponds to some feature map phi.",
          'Substitute K(x_i, x_j) for every x_i^T x_j in the algorithm; its optimization and guarantees carry over unchanged.',
          "Tune the kernel's own hyperparameters (gamma, degree), since they now control the shape of the implicit feature space.",
        ],
      },
      hyperparameters: [
        {
          name: 'gamma (RBF / polynomial / sigmoid kernels)',
          what: "Controls how far a single point's influence reaches — inversely, the length scale of the implicit feature space.",
          tuning:
            "scikit-learn's SVC and SVR default to gamma='scale', i.e. 1/(n_features · X.var()). Larger gamma " +
            'makes the boundary hug individual points more tightly (higher variance); smaller gamma smooths it out.',
        },
        {
          name: 'degree (polynomial kernel)',
          what: 'Degree d of the polynomial kernel (gamma·x^T y + r)^d.',
          tuning:
            'Higher degree captures higher-order feature interactions but grows the implicit feature space fast; ' +
            '2–3 already fits most curved boundaries in practice.',
        },
      ],
      whenToUse: [
        'A linear algorithm expressed entirely via dot products already exists and underfits — SVMs, PCA, ridge regression, and k-means/k-NN distances are all kernelizable',
        'You want a nonlinear decision boundary or embedding without hand-engineering nonlinear features yourself',
        'The dataset is small enough that an n-by-n kernel matrix is affordable to compute and store',
        'A domain-specific similarity already exists as a valid kernel (string kernels for sequences, graph kernels), letting a linear method operate on non-vector data directly',
      ],
      whenNotToUse: [
        'The dataset is large — the kernel (Gram) matrix is n-by-n, so memory and most kernel-based solvers scale quadratically to cubically with the number of points',
        'You need to read the fitted model back in terms of the original features — the implicit feature space has no explicit coordinates to inspect',
        'A plain linear model already fits well; the kernel adds a hyperparameter to tune, and a cost to pay, for curvature you do not need',
        "You cannot justify a kernel satisfying Mercer's condition for your data type — an ad hoc similarity score with no positive-semidefiniteness guarantee can break the optimization it feeds",
      ],
      facets: {
        task: ['classification', 'regression', 'dimensionality-reduction'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'implicit-feature-mapping',
      },
      math: {
        latex: [
          'K(x,y) = \\phi(x)^\\top \\phi(y)',
          'K(x,y) = \\exp(-\\gamma \\lVert x-y \\rVert^2) \\ \\text{(RBF)}, \\qquad K(x,y) = (\\gamma\\, x^\\top y + r)^d \\ \\text{(polynomial)}',
        ],
        notes:
          "Mercer's condition — every Gram matrix [K(x_i,x_j)] the kernel produces must be positive semidefinite " +
          '— is exactly the requirement for some feature map phi to exist with K(x,y) = phi(x)^T phi(y), even ' +
          'when phi maps into an infinite-dimensional space, as the RBF kernel does. That existence proof is ' +
          'what licenses swapping K in wherever a dot product appeared: you get the guarantees of the linear ' +
          'algorithm (a convex optimum for an SVM, orthogonal components for kernel PCA) applied inside a space ' +
          'you never construct.',
      },
      complexity: {
        train:
          'O(n^2 · d) to build the n-by-n kernel matrix for n points and d features; the host algorithm then ' +
          'runs on that n-by-n matrix rather than the original n-by-d one, unchanged in form but not in cost',
        predict: "O(n_ref · d) per query — a kernel evaluation against every reference point the host algorithm kept",
      },
      code: [
        'from sklearn.metrics.pairwise import rbf_kernel',
        '',
        '# the kernel trick in one line: pairwise similarities, never explicit coordinates',
        'K_train = rbf_kernel(X_train, X_train, gamma=0.1)   # n x n Gram matrix',
        'K_test = rbf_kernel(X_test, X_train, gamma=0.1)     # queries against training points',
        '',
        '# any estimator that accepts a precomputed kernel can now run on K_train/K_test',
        '# instead of X directly, e.g. SVC(kernel="precomputed").fit(K_train, y_train)',
      ].join('\n'),
      // Cross-body: kernel-pca (Saturn) and kernel-density-estimation (Venus) are the two genuine
      // pre-existing links — kernel-pca's own file already anticipates this entry by name. Cross-link
      // pass: gaussian-processes is a same-batch link — a GP's covariance function IS a kernel.
      related: ['support-vector-machines', 'kernel-pca', 'kernel-density-estimation', 'gaussian-processes'],
      references: {
        free: [{ title: 'scikit-learn user guide — SVM kernel functions', url: 'https://scikit-learn.org/stable/modules/svm.html#kernel-functions' }],
        papers: [
          {
            title: 'A Training Algorithm for Optimal Margin Classifiers',
            url: 'https://doi.org/10.1145/130385.130401',
            year: 1992,
          },
        ],
        books: [
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Bishop',
            chapter: 'Ch. 6 — Kernel Methods',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'support-vector-regression',
      name: 'Support vector regression',
      aliases: ['SVR', 'epsilon-SVR'],
      tier: 2,
      year: 1996,
      difficulty: 3,
      hook: 'Fits a function inside a tolerance tube, only penalizing predictions that land outside it.',
      intuition:
        'Ordinary regression penalizes every deviation from the fitted curve, however small. Support vector ' +
        'regression instead draws a tube of width epsilon around the fitted function and stops caring the ' +
        'moment a prediction lands inside it — errors smaller than epsilon cost nothing at all. Only points ' +
        'falling outside the tube contribute to the loss, linearly in how far outside they are, controlled by ' +
        'the same soft-margin machinery an SVM classifier uses: a penalty C trading off how wide a tube you will ' +
        'tolerate against how tightly you fit the stray points. The points that end up defining the tube\'s ' +
        'shape — sitting on its edge or beyond it — are the support vectors; everything comfortably inside ' +
        "contributes nothing to the fit. Kernels extend SVR to curved functions exactly as they do for " +
        'classification, replacing the dot product inside the same optimization.',
      howItWorks: {
        summary:
          'Fit a function so most training points land within an epsilon-wide tube around it, paying a linear ' +
          'penalty, scaled by C, only for points that fall outside.',
        steps: [
          'Choose a tolerance epsilon: predictions within epsilon of the true value incur zero loss.',
          "Fit a function — linear, or nonlinear via a kernel — minimizing C times the total distance points fall outside the tube, plus a term controlling the function's flatness.",
          "Solve the resulting quadratic program; points strictly inside the tube get zero weight, and only points on or beyond its edge — the support vectors — determine the fitted function.",
        ],
      },
      whenToUse: [
        'Small deviations from the true value are acceptable and should cost nothing, with the penalty reserved for genuinely large errors — set directly by epsilon',
        'The dataset is small to moderate and you want the same margin-based robustness and kernel flexibility as an SVM classifier, applied to a continuous target',
      ],
      whenNotToUse: [
        'The dataset is large — like SVC, training scales quadratically to cubically with the number of rows, far slower than gradient boosting or a linear model at scale',
        'You need an uncertainty estimate alongside each prediction rather than a single fitted value — use Gaussian process regression instead',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      related: ['support-vector-machines', 'kernel-trick', 'gaussian-processes', 'linear-regression'],
      references: {
        free: [{ title: 'scikit-learn user guide — Support Vector Regression', url: 'https://scikit-learn.org/stable/modules/svm.html#regression' }],
        papers: [
          {
            title: 'Support Vector Regression Machines',
            url: 'https://papers.nips.cc/paper/1238-support-vector-regression-machines',
            year: 1996,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'one-class-svm',
      name: 'One-class SVM',
      tier: 2,
      year: 2001,
      difficulty: 3,
      hook: 'Draws one boundary around normal data, in kernel space, so anything past it is flagged as an anomaly.',
      intuition:
        'Give a one-class SVM only normal examples, no labelled anomalies, and it still learns a boundary. Map ' +
        'every point into a kernel-transformed feature space, then find the hyperplane that separates the data ' +
        'from the origin by the widest margin, pushing training points to the far side of it. New points landing ' +
        "on the origin's side of that hyperplane are flagged as outliers. A parameter nu sets both an upper " +
        'bound on how much training data may fall on the wrong side and roughly the fraction of points that ' +
        'become support vectors, playing the role a contamination estimate plays elsewhere. With an RBF kernel ' +
        'this construction gives an equivalent boundary to a closely related idea, Support Vector Data ' +
        'Description, which instead encloses the data inside the smallest possible hypersphere — the same ' +
        "picture, viewed from the origin rather than from the data's own centre. Jupiter's " +
        'one-class-detection-and-lof entry introduces this at survey depth; this entry goes deeper on the SVM ' +
        'formulation specifically.',
      howItWorks: {
        summary:
          'Map the data into kernel space and find the maximum-margin hyperplane separating it from the origin; ' +
          'score new points by which side of that hyperplane they fall on.',
        steps: [
          'Map training points into a kernel-transformed feature space via a kernel function K (RBF by default).',
          "Solve for the hyperplane separating the mapped training points from the origin with the widest margin, allowing an nu-controlled fraction of points to fall on the wrong side.",
          "Score a new point by its signed distance to that hyperplane; landing on the origin's side means outlier.",
        ],
      },
      whenToUse: [
        'You have only normal examples to train on, with no labelled anomalies, and want a boundary rather than a density estimate',
        'You have a working estimate of nu, the expected fraction of outliers or borderline points, since it directly bounds the training error',
      ],
      whenNotToUse: [
        'The dataset is large — the kernelized form is quadratic in the number of training points, far slower than Isolation Forest at scale',
        "Outliers are local rather than global — unusual only relative to their own neighbourhood, not to the whole dataset — where Local Outlier Factor is the better fit",
      ],
      facets: {
        task: ['anomaly-detection'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'anomaly-score',
      },
      // Cross-body: one-class-detection-and-lof (Jupiter) is the genuine link this entry exists to
      // deepen, not duplicate — that entry bundles One-Class SVM with LOF at survey depth.
      related: ['one-class-detection-and-lof', 'isolation-forest', 'support-vector-machines'],
      references: {
        free: [{ title: 'scikit-learn user guide — Novelty and Outlier Detection', url: 'https://scikit-learn.org/stable/modules/outlier_detection.html' }],
        papers: [
          {
            title: 'Estimating the Support of a High-Dimensional Distribution',
            url: 'https://doi.org/10.1162/089976601750264965',
            year: 2001,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'gaussian-processes',
      name: 'Gaussian processes',
      aliases: ['GP regression', 'Kriging'],
      tier: 1,
      year: 1995,
      difficulty: 4,
      hook: 'Puts a probability distribution over entire functions, giving predictions with calibrated uncertainty.',
      intuition:
        'Most regression methods return one function: the curve or hyperplane they judged best. A Gaussian ' +
        'process instead keeps a whole distribution over functions consistent with the data, and returns both a ' +
        'prediction and its uncertainty at every point. Start with a prior belief that says: any finite set of ' +
        'function values is jointly Gaussian, with the covariance between two points set by a kernel function ' +
        'measuring how similar they are — typically, closer points move together more than distant ones. ' +
        'Observing training data narrows that distribution: functions that pass far from the data become ' +
        'improbable, and what remains is a posterior, still Gaussian, with a mean curve and a shrinking band of ' +
        'uncertainty around every observed point that widens again wherever data is sparse. That widening is not ' +
        'decoration — it is the same well-calibrated uncertainty a Bayesian posterior always gives, and it is ' +
        'exactly what a method like Bayesian optimization needs to decide where to look next.',
      howItWorks: {
        summary:
          'Place a Gaussian prior over functions, defined by a mean and a covariance (kernel) function, and ' +
          'condition it on the observed data to get a posterior mean and uncertainty at every point.',
        steps: [
          "Choose a kernel function K(x,x') encoding how correlated two function values should be given their inputs (RBF by default in most libraries).",
          'Treat the training targets as one noisy sample from a multivariate Gaussian over function values, with covariance built from K plus a noise term on the diagonal.',
          'Condition that joint Gaussian on the observed training targets to get the posterior mean and covariance at any new input, in closed form.',
          'Read off a prediction (the posterior mean) and an uncertainty (the posterior standard deviation) at every query point.',
          "Tune the kernel's own hyperparameters (length-scale, noise level) by maximizing the log marginal likelihood of the training data.",
        ],
      },
      hyperparameters: [
        {
          name: 'kernel (length_scale)',
          what: 'Which covariance function relates two points, and over what distance points stay correlated.',
          tuning:
            "scikit-learn's GaussianProcessRegressor defaults to ConstantKernel() * RBF(). Longer length-scales " +
            'produce smoother posterior means; shorter ones let the fit track local structure, at the cost of ' +
            'more effective parameters estimated from the same data.',
        },
        {
          name: 'alpha',
          what: 'Noise variance added to the diagonal of the kernel matrix during fitting.',
          tuning:
            'Defaults to 1e-10 in scikit-learn — enough only for numerical stability, not real observation ' +
            'noise. Raise it toward your actual measurement noise level, or add a WhiteKernel term instead, or ' +
            'the posterior will try to interpolate through noisy points exactly.',
        },
      ],
      whenToUse: [
        'The dataset is small (roughly a few thousand points or fewer) and a calibrated uncertainty estimate at every prediction matters as much as the prediction itself',
        'You are choosing where to sample next under a limited evaluation budget, e.g. as the surrogate model inside Bayesian optimization',
        'You want to encode prior structure directly through the kernel choice — periodicity, smoothness, additive structure — rather than through feature engineering',
      ],
      whenNotToUse: [
        'The dataset is large — exact inference costs O(n^3) to invert the n-by-n covariance matrix, impractical well before a hundred thousand rows without a sparse or inducing-point approximation',
        'The output is genuinely discontinuous or multimodal in a way no smooth kernel represents well, unless you engineer a matching kernel',
        'You only need a point prediction and have no use for the uncertainty band — a cheaper model reaches the same accuracy for far less compute',
      ],
      facets: {
        task: ['regression', 'inference'],
        dataType: ['tabular', 'spatial', 'timeseries'],
        dataSize: ['tiny', 'small'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'predictive-mean-and-uncertainty',
      },
      math: {
        latex: [
          "f \\sim \\mathcal{GP}(m(x), K(x,x'))",
          'f_* \\mid X, y, X_* \\sim \\mathcal{N}\\big(K_*[K+\\sigma_n^2 I]^{-1}y,\\ K_{**} - K_*[K+\\sigma_n^2 I]^{-1}K_*^\\top\\big)',
        ],
        notes:
          'The posterior mean is a weighted sum of the observed targets, with weights set entirely by the ' +
          'kernel — nearby, similar training points are weighted more heavily, the same neighbourhood-averaging ' +
          'intuition behind kernel density estimation and nearest neighbours, but derived here from a Bayesian ' +
          'prior over functions rather than a heuristic. The n-by-n matrix inversion [K+sigma_n^2 I]^{-1} is the ' +
          'entire computational cost of the method and the reason exact GPs do not scale; sparse and ' +
          'inducing-point approximations exist specifically to avoid forming or inverting it exactly.',
      },
      complexity: {
        train:
          'O(n^3) to invert (or Cholesky-factorize) the n-by-n covariance matrix for n training points, repeated ' +
          "per gradient step while optimizing the kernel's hyperparameters",
        predict: 'O(n) per query for the posterior mean; O(n^2) per query for the full posterior variance',
      },
      code: [
        'from sklearn.gaussian_process import GaussianProcessRegressor',
        'from sklearn.gaussian_process.kernels import RBF, WhiteKernel, ConstantKernel',
        '',
        'kernel = ConstantKernel(1.0) * RBF(length_scale=1.0) + WhiteKernel(noise_level=0.1)',
        'gpr = GaussianProcessRegressor(kernel=kernel, n_restarts_optimizer=5, random_state=0)',
        'gpr.fit(X_train, y_train)',
        '',
        'mean, std = gpr.predict(X_test, return_std=True)   # prediction plus calibrated uncertainty',
        'print(gpr.kernel_)                                  # the fitted length-scale and noise level',
      ].join('\n'),
      related: ['kernel-trick', 'bayesian-optimization', 'kernel-density-estimation', 'distance-metrics'],
      references: {
        free: [{ title: 'scikit-learn user guide — Gaussian Processes', url: 'https://scikit-learn.org/stable/modules/gaussian_process.html' }],
        papers: [
          {
            title: 'Gaussian Processes for Regression',
            url: 'https://papers.nips.cc/paper/1048-gaussian-processes-for-regression',
            year: 1995,
          },
        ],
        books: [
          {
            title: 'Gaussian Processes for Machine Learning',
            author: 'Rasmussen & Williams',
            url: 'https://gaussianprocess.org/gpml/',
          },
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Bishop',
            chapter: 'Ch. 6 — Kernel Methods (§6.4 Gaussian Processes)',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'bayesian-optimization',
      name: 'Bayesian optimization',
      aliases: ['sequential model-based optimization', 'SMBO'],
      tier: 2,
      year: 1978,
      difficulty: 3,
      hook: 'Uses a probabilistic surrogate of a costly function to pick the next point most worth evaluating.',
      intuition:
        'Some functions are brutally expensive to evaluate — training a neural network for one set of ' +
        'hyperparameters, running a physical experiment, a full climate simulation — so a search cannot afford ' +
        'to try thousands of points the way grid or random search does. Bayesian optimization instead fits a ' +
        'cheap probabilistic surrogate, almost always a Gaussian process, to whatever points have been evaluated ' +
        'so far, and uses its predictive mean and uncertainty to decide where to look next. An acquisition ' +
        'function turns that mean-and-uncertainty pair into one number balancing two things: exploiting points ' +
        'the surrogate already believes are good, and exploring points it is simply unsure about because they ' +
        'are far from anything tried yet. Evaluate the true function wherever the acquisition function is ' +
        'largest, feed the result back into the surrogate, and repeat. Each real evaluation lands where it is ' +
        'most informative rather than at a point fixed in advance, which is exactly why it needs far fewer ' +
        'trials than grid or random search to find a good setting.',
      howItWorks: {
        summary:
          'Fit a probabilistic surrogate (typically a Gaussian process) to the points evaluated so far, use an ' +
          'acquisition function to pick the most promising next point, evaluate the true function there, and repeat.',
        steps: [
          'Fit a Gaussian process (or another probabilistic surrogate) to the (input, output) pairs evaluated so far.',
          "Compute an acquisition function — e.g. Expected Improvement — over the input space from the surrogate's posterior mean and uncertainty.",
          'Evaluate the true, expensive function at the point maximizing the acquisition function.',
          'Add that new observation to the dataset, refit the surrogate, and repeat until the evaluation budget is spent.',
        ],
      },
      whenToUse: [
        'Each evaluation of the objective is expensive — minutes to days, as with training a large model per hyperparameter setting — so the number of trials must stay small',
        'The objective is a black box with no gradient available, and its dimensionality (a handful to a few dozen hyperparameters) is a good fit for a Gaussian process surrogate',
      ],
      whenNotToUse: [
        'Evaluations are cheap and plentiful — random search covers the space just as well per unit of engineer time, without the overhead of refitting a surrogate after every trial',
        'The search space has hundreds of dimensions or many discrete/categorical variables that a Gaussian process surrogate does not model well without extra machinery',
      ],
      facets: {
        task: ['classification', 'regression', 'forecasting'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'selected-configuration',
      },
      // Cross-body: hyperparameter-search (Belt) is the direct application this entry generalizes —
      // that entry's own intuition text already gestures forward to Bayesian optimization.
      related: ['gaussian-processes', 'hyperparameter-search', 'kernel-trick'],
      references: {
        free: [{ title: 'A Tutorial on Bayesian Optimization', url: 'https://arxiv.org/abs/1807.02811' }],
        papers: [
          {
            title: 'The Application of Bayesian Methods for Seeking the Extremum',
            url: 'https://bibbase.org/network/publication/mockus-tiesis-zilinskas-theapplicationofbayesianmethodsforseekingtheextremum-1978',
            year: 1978,
          },
          {
            title: 'Practical Bayesian Optimization of Machine Learning Algorithms',
            url: 'https://arxiv.org/abs/1206.2944',
            year: 2012,
          },
        ],
      },
    },
  ],
} satisfies Body;
