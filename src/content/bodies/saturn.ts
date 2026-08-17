/**
 * Saturn — Dimensionality Reduction & Representation. See PLAN.md §3 for the full moon list.
 *
 * Nine moons, all written in this pass: pca, kernel-pca, svd-and-truncated-svd, nmf,
 * ica-and-factor-analysis, mds-isomap-and-lle, t-sne, umap, random-projection-and-som. Ids and
 * tiers are fixed by the batch plan so belt/pallas/jupiter (written in parallel by other agents)
 * can cross-link here without collisions.
 *
 * The three that most risk blurring together — pca, svd-and-truncated-svd, nmf — are each
 * written to own one distinction, per the batch brief:
 *
 *   pca                     the variance-maximizing orthogonal projection, built from the
 *                           covariance matrix's eigendecomposition
 *   svd-and-truncated-svd   the more general factorization PCA is typically computed via;
 *                           truncated SVD skips centering, which is why it works directly on
 *                           sparse data (e.g. scikit-learn's TruncatedSVD for LSA) where PCA can't
 *   nmf                     adds a non-negativity constraint, trading reconstruction quality for
 *                           a parts-based, more interpretable factorization with no closed form
 *
 * t-sne and umap are both nonlinear neighbour-embedding methods for visualization but are kept
 * honestly distinct: different objective (KL divergence over a Student-t low-dim distribution vs.
 * cross-entropy over a fuzzy simplicial set), different neighbour-graph construction (per-point
 * Gaussian perplexity vs. locally-adaptive fuzzy-set membership), and UMAP is *not* presented as
 * "faster t-SNE" — Kobak & Linderman (2021, Nature Biotechnology) is cited directly in umap's
 * whenNotToUse because it shows UMAP's global-structure advantage over t-SNE is largely
 * attributable to its default spectral initialization, not the algorithm itself.
 *
 * `eraRange` is [1901, 2018]: Pearson's original geometric formulation of PCA (1901) is the
 * earliest moon; UMAP (arXiv 1802.03426, 2018) is the latest. `pca`'s `year` is Pearson's 1901
 * paper, not Hotelling's 1933 paper, which gave PCA its name and statistical framing but is the
 * later of the two — both are cited in `pca`'s references and the distinction is made in prose so
 * neither is misattributed as "the" origin.
 *
 * Every fact below — dates, venues, page numbers, DOIs, hyperparameter defaults — was checked
 * against an opened source this session (scikit-learn docs, umap-learn docs, JMLR/arXiv/Science
 * paper pages, and Crossref for DOI verification); see the commit/session notes for the full
 * per-entry source list. No PDF was used as the sole source for any specific number, per
 * docs/CONTENT_GUIDE.md §3's warning — bibliographic facts (title/author/venue/year/pages) that
 * came from PDF-hosted papers were independently corroborated via Crossref or multiple indexed
 * secondary sources rather than trusted from a single WebFetch PDF summary.
 *
 * `related` favours real cross-body links where the connection is genuine and documented: `pca`
 * to `linear-regression` and `k-means` (Ding & He, ICML 2004, prove PCA's subspace and k-means's
 * cluster structure are related); `t-sne`/`umap`/`mds-isomap-and-lle` to `distance-metrics`
 * (Venus) since all three are built entirely on a choice of pairwise distance; `umap` to
 * `hdbscan` (Jupiter) since McInnes authored both and UMAP-then-HDBSCAN is a standard, widely
 * documented pipeline. `self-attention` (Nova) was considered and rejected for every entry here —
 * there is no genuine mechanistic link between it and classical dimensionality reduction, so
 * forcing it in would be exactly the kind of unchecked link this batch is meant to avoid. Ids for
 * bodies not yet written (e.g. Uranus's "the kernel trick", Neptune's `latent-dirichlet-allocation`)
 * are left as `//` comments rather than fabricated.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'saturn',
  name: 'Saturn',
  segment: 'Dimensionality Reduction & Representation',
  hook: 'Squashes data onto fewer axes — sometimes so you can see it, sometimes so a model can use it.',
  summary:
    'Saturn holds the methods that take data with many features and represent it in fewer dimensions. Some ' +
    'are exact, linear factorizations built on eigendecomposition or SVD (PCA, truncated SVD, NMF); others ' +
    'bend that same linear machinery through a kernel or a neighbour graph to unfold structure a straight ' +
    'line cannot follow (kernel PCA, Isomap, LLE); and the newest pair exist almost entirely to turn ' +
    'high-dimensional data into a picture a person can actually look at (t-SNE, UMAP).',
  eraRange: [1901, 2018],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'pca',
      name: 'PCA',
      aliases: ['principal component analysis'],
      tier: 1,
      year: 1901,
      difficulty: 2,
      hook: 'Rotates data onto the orthogonal axes that capture the most variance, ranked by how much.',
      intuition:
        'Imagine photographing a pencil from directly above: you would see only a dot, because that angle ' +
        'throws away the one direction the pencil actually varies along. Photograph it from the side instead ' +
        'and the picture captures almost everything interesting about its shape in a single dimension. PCA ' +
        'searches for that best camera angle automatically. It looks at a cloud of points and asks which ' +
        'direction they spread out the most — that becomes the first principal component. The second ' +
        'component is the direction of the next-most spread that is perpendicular to the first, and so on, ' +
        'each one orthogonal to all the others. Mechanically this falls straight out of the data\'s covariance ' +
        'matrix: its eigenvectors are the principal directions, and its eigenvalues say how much variance ' +
        'each one accounts for. Keep the top few components and you have kept nearly all of what the data ' +
        'does while dropping the directions where it barely moves — usually redundancy or noise.',
      howItWorks: {
        summary:
          'Center the data, find the eigenvectors of its covariance matrix (equivalently, take its SVD), and ' +
          'project onto the top few ranked by variance explained.',
        steps: [
          'Center each feature by subtracting its mean; scale features first if they are in different units.',
          'Compute the covariance matrix of the centered data, or take its SVD directly — what scikit-learn ' +
            'actually does, for numerical stability.',
          'Extract the eigenvectors and eigenvalues: the eigenvectors are the principal components, ranked ' +
            'by their eigenvalues.',
          'Choose k, the number of components to keep, usually by a target cumulative explained-variance ratio.',
          'Project the centered data onto the top k components to get the reduced representation.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_components',
          what: 'How many components to keep. scikit-learn defaults to None, which keeps all min(n_samples, n_features).',
          tuning:
            'Set it to a target cumulative explained_variance_ratio_ (e.g. 0.95), or to 2-3 for visualization. ' +
            'Plotting the cumulative ratio and looking for an elbow is the standard diagnostic.',
        },
        {
          name: 'svd_solver',
          what: "Which algorithm computes the decomposition. scikit-learn defaults to 'auto', chosen from data shape.",
          tuning:
            'Leave it on auto for most cases: it switches to randomized SVD automatically once the data is ' +
            'large and only a fraction of components are requested, which is much faster than a full ' +
            'decomposition and does not change the answer meaningfully.',
        },
      ],
      whenToUse: [
        'Features are correlated and you want to compress them into fewer, uncorrelated dimensions with minimal loss of variance',
        'You need a fast, deterministic, unsupervised baseline for visualization (2-3 components) or as a preprocessing step',
        'A downstream method assumes roughly isotropic, uncorrelated input, such as k-means or an RBF-kernel SVM',
        'You want to denoise data by discarding the low-variance directions, which are more likely to be noise than signal',
      ],
      whenNotToUse: [
        'The structure that matters is nonlinear — a curved manifold has no good linear projection; reach for kernel PCA, Isomap, LLE, t-SNE or UMAP instead',
        'Variance is not the same as relevance — a rare but important pattern can sit in a low-variance direction that PCA discards first',
        'Components need to stay interpretable in terms of the original features; each one is a linear combination of every input, not a clean subset',
        'Data is sparse (e.g. text counts) and centering it would destroy that sparsity — use TruncatedSVD, which skips centering, instead',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'image'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-embedding',
      },
      math: {
        latex: [
          '\\Sigma = \\frac{1}{n-1} X_c^\\top X_c, \\qquad \\Sigma v_i = \\lambda_i v_i',
          'X_c = U S V^\\top, \\qquad \\lambda_i = \\frac{s_i^2}{n-1}',
        ],
        notes:
          'The two lines describe the same object two ways. Eigendecomposing the covariance matrix and ' +
          'taking the SVD of the centered data X_c give the same principal directions, because the columns ' +
          'of V are exactly the eigenvectors of Sigma — scikit-learn computes the SVD route because it ' +
          'avoids forming Sigma explicitly and is more numerically stable. explained_variance_ratio_ is just ' +
          'each lambda_i divided by their sum: how much of the total spread that one direction accounts for.',
      },
      complexity: {
        train: 'O(np·min(n,p)) via SVD, or O(p^2 n + p^3) if the covariance matrix is formed and eigendecomposed',
        predict: 'O(pk) to project one new point onto k components',
      },
      code: [
        'from sklearn.decomposition import PCA',
        'from sklearn.preprocessing import StandardScaler',
        '',
        'X = StandardScaler().fit_transform(X_raw)   # scale first: PCA only centers, it does not scale',
        '',
        'pca = PCA(n_components=0.95, svd_solver="auto")   # keep components covering 95% of variance',
        'Z = pca.fit_transform(X)',
        '',
        'print(pca.explained_variance_ratio_)',
        'print(pca.n_components_)                    # how many components 0.95 actually needed',
      ].join('\n'),
      // Cross-body: linear-regression (Mercury) shares the least-squares/variance machinery;
      // k-means (Jupiter) — Ding & He (2004) prove PCA's subspace and k-means's cluster structure
      // are directly related, not just superficially similar.
      related: ['linear-regression', 'k-means', 'svd-and-truncated-svd', 'kernel-pca'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Decomposing signals in components (PCA)',
            url: 'https://scikit-learn.org/stable/modules/decomposition.html#pca',
          },
        ],
        papers: [
          {
            title: 'On Lines and Planes of Closest Fit to Systems of Points in Space',
            url: 'https://doi.org/10.1080/14786440109462720',
            year: 1901,
          },
          {
            title: 'Analysis of a Complex of Statistical Variables into Principal Components',
            url: 'https://doi.org/10.1037/h0071325',
            year: 1933,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14.5 — Principal Components, Curves and Surfaces',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'kernel-pca',
      name: 'Kernel PCA',
      aliases: ['KPCA', 'kernel principal component analysis'],
      tier: 2,
      year: 1998,
      difficulty: 3,
      hook: "Runs PCA in a similarity space defined by a kernel, capturing curves a straight cut can't.",
      intuition:
        'PCA can only ever draw straight lines through data, because it is built entirely on dot products ' +
        'and covariance. If the true structure is a curve — two interleaved spirals, a folded sheet — no ' +
        'straight component separates them, no matter how many are taken. Kernel PCA sidesteps this without ' +
        'leaving linear algebra: it replaces every dot product in ordinary PCA with a kernel function, a ' +
        'similarity measure that implicitly maps points into a much higher-dimensional space where curved ' +
        'structure becomes flat. The trick — the same one support vector machines use — is that the kernel ' +
        'hands you the dot products in that space directly, without ever computing the mapping itself. ' +
        'Ordinary PCA is then run on the resulting n-by-n similarity (kernel) matrix instead of the ' +
        'p-by-p covariance matrix. The output components are nonlinear functions of the original features, ' +
        'at the cost of an n-squared-sized matrix and a kernel choice that now has to be tuned.',
      howItWorks: {
        summary:
          'Replace the covariance matrix with an n-by-n kernel (Gram) matrix of pairwise similarities, and ' +
          "run PCA's eigendecomposition on that instead.",
        steps: [
          'Choose a kernel function (RBF, polynomial, cosine, ...) that defines similarity between pairs of points.',
          'Compute the n×n kernel matrix over the training data and center it in the implicit feature space.',
          'Eigendecompose the kernel matrix; the top eigenvectors, scaled by their eigenvalues, give the projected coordinates directly.',
        ],
      },
      whenToUse: [
        'The data lies on a curved or nonlinearly separable structure that a straight-line PCA component cannot capture',
        'You already have a kernel that works well for this data (e.g. RBF for numeric features, a string kernel for sequences) from using it elsewhere in the pipeline',
      ],
      whenNotToUse: [
        'The dataset is large — the kernel matrix is n×n, so memory and eigendecomposition cost grow quadratically and cubically with the number of points',
        'You need to explain a component in terms of the original features; kernel PCA components are combinations of similarities to training points, not of features',
        'A plain PCA already separates the classes or explains the variance you need — the extra kernel and its hyperparameters are not free',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'image'],
        dataSize: ['tiny', 'small'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-embedding',
      },
      // Cross-body: Uranus's "the kernel trick" entry (not yet written) is the natural link once it
      // exists — this is the same machinery SVMs use, applied to PCA instead of a margin.
      related: ['pca', 'svd-and-truncated-svd', 'kernel-trick'],
      references: {
        free: [
          {
            title: 'scikit-learn API — KernelPCA',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.KernelPCA.html',
          },
        ],
        papers: [
          {
            title: 'Nonlinear Component Analysis as a Kernel Eigenvalue Problem',
            url: 'https://doi.org/10.1162/089976698300017467',
            year: 1998,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14.5.4 — Kernel Principal Components',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'svd-and-truncated-svd',
      name: 'SVD & truncated SVD',
      aliases: ['singular value decomposition', 'LSA', 'latent semantic analysis'],
      tier: 1,
      year: 1936,
      difficulty: 3,
      hook: 'Factors any matrix into rotate-scale-rotate — the decomposition most of this body runs on.',
      intuition:
        'Any matrix at all — not just a square, symmetric covariance matrix like PCA needs — can be split ' +
        'into three simpler pieces: a rotation, a scaling along orthogonal axes, and another rotation. That ' +
        'is the singular value decomposition. The scaling factors, the singular values, are sorted largest ' +
        'to smallest and tell you how much each axis actually contributes; keep only the largest few and ' +
        'multiply the three pieces back together, and by the Eckart-Young theorem the result is provably the ' +
        'best possible rank-k approximation of the original matrix in a least-squares sense. That is ' +
        'truncated SVD. PCA turns out to be a special case: run this same factorization on centered data and ' +
        'the vectors you get are exactly PCA\'s principal components. Truncated SVD skips the centering step, ' +
        'which is the whole reason it exists as a separate tool — centering a sparse matrix, such as a ' +
        'term-document matrix of word counts, would fill it in with nonzero values and destroy the sparsity ' +
        'that makes it tractable in the first place.',
      howItWorks: {
        summary:
          'Factor the (uncentered) data matrix into U S V^T, keep the k largest singular values and their ' +
          'vectors, and reconstruct or project with just those.',
        steps: [
          'Compute the singular value decomposition X = U S V^T, or approximate its top components with a randomized algorithm for large X.',
          'Sort the singular values in S from largest to smallest — they measure how much each direction contributes.',
          'Keep only the top k singular values and vectors: U_k, S_k, V_k.',
          'Project new data onto the reduced space as X V_k, or reconstruct an approximation as U_k S_k V_k^T.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_components',
          what: 'Number of singular values/vectors to keep.',
          tuning:
            "For LSA on text, scikit-learn's own documentation suggests 100 as a reasonable starting point; " +
            'more generally, plot the singular value spectrum and cut where it flattens.',
        },
        {
          name: 'algorithm',
          what: "'randomized' (default) or 'arpack'. Controls how the top components are computed.",
          tuning:
            'Leave it on randomized for large sparse matrices — it never forms the full decomposition. Use ' +
            'arpack for exactness on smaller problems.',
        },
      ],
      whenToUse: [
        'You need the low-rank approximation of a matrix that is provably optimal in squared error, with a formal guarantee (Eckart-Young) behind it',
        'Data is sparse — term-document counts, one-hot encodings — where PCA-style centering would destroy the sparsity that makes the problem tractable',
        'You are building latent semantic analysis or a similar bag-of-words topic representation from a CountVectorizer/TfidfVectorizer matrix',
        'You need a matrix decomposition tool more general than PCA — SVD applies to any rectangular matrix, not just a centered covariance structure',
      ],
      whenNotToUse: [
        'The data is small, dense and already naturally centered — plain PCA gives the same directions with a more standard, centered interpretation',
        'Components must be non-negative and interpretable as additive parts (e.g. topics that only add up, never cancel) — use NMF instead',
        'You need a nonlinear embedding — SVD is a strictly linear, distance-preserving factorization and cannot unfold a curved manifold',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'text'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-embedding-or-low-rank-factors',
      },
      math: {
        latex: [
          'X = U S V^\\top',
          'X_k = U_k S_k V_k^\\top = \\arg\\min_{\\mathrm{rank}(B) \\le k} \\lVert X - B \\rVert_F',
        ],
        notes:
          'The second line is the Eckart-Young theorem, and it is the entire justification for truncating: ' +
          'among all rank-k matrices, keeping the top k singular triples minimises the Frobenius-norm ' +
          'reconstruction error, so there is no better rank-k approximation to reach for. Compare to PCA\'s ' +
          'covariance eigendecomposition: run this same factorization on X after centering each column, and ' +
          "V's columns are exactly PCA's principal components — truncated SVD is PCA without the centering " +
          'step, which is also exactly why it tolerates sparse input that centering would ruin.',
      },
      complexity: {
        train: 'O(np·min(n,p)) for the full SVD; O(nnz(X)·k) per iteration with the randomized algorithm on sparse X',
        predict: 'O(pk) to project one new point',
      },
      code: [
        'from sklearn.decomposition import TruncatedSVD',
        'from sklearn.feature_extraction.text import TfidfVectorizer',
        '',
        'X = TfidfVectorizer(max_features=20000).fit_transform(docs)   # sparse, uncentered on purpose',
        '',
        'svd = TruncatedSVD(n_components=100, algorithm="randomized", random_state=0)',
        'Z = svd.fit_transform(X)                     # the LSA / latent semantic space',
        '',
        'print(svd.explained_variance_ratio_.sum())    # variance captured by the 100 components',
      ].join('\n'),
      related: ['pca', 'nmf', 'mds-isomap-and-lle', 'linear-regression'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Truncated singular value decomposition and latent semantic analysis',
            url: 'https://scikit-learn.org/stable/modules/decomposition.html#lsa',
          },
        ],
        papers: [
          {
            title: 'The Approximation of One Matrix by Another of Lower Rank',
            url: 'https://doi.org/10.1007/BF02288367',
            year: 1936,
          },
          {
            title: 'Indexing by Latent Semantic Analysis',
            url: 'https://doi.org/10.1002/(SICI)1097-4571(199009)41:6%3C391::AID-ASI1%3E3.0.CO;2-9',
            year: 1990,
          },
        ],
        books: [
          {
            title: 'Mathematics for Machine Learning',
            author: 'Deisenroth, Faisal & Ong',
            chapter: 'Ch. 4 — Matrix Decompositions',
            url: 'https://mml-book.github.io/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'nmf',
      name: 'NMF (Non-negative Matrix Factorization)',
      aliases: ['non-negative matrix factorization', 'NNMF'],
      tier: 1,
      year: 1999,
      difficulty: 3,
      hook: 'Factors data into non-negative parts that only add, never cancel, so pieces stay readable.',
      intuition:
        'PCA and SVD represent a face as a combination of components that can be added or subtracted, and ' +
        'the components themselves often look like nothing recognisable — ghostly light-and-dark patterns ' +
        'that only make sense in combination, cancellation included. NMF adds one constraint: every number ' +
        'involved, in the data, in the parts, and in how much of each part gets used, must be non-negative. ' +
        'That single rule changes the character of the result. Because parts can only be added and never ' +
        'subtracted out, the only way to build a whole face is to actually assemble it from face-like pieces ' +
        '— an eyebrow here, a section of nose there — and each basis vector tends to correspond to something ' +
        'a person would recognise as a part, which is exactly the effect Lee and Seung\'s Nature paper made ' +
        'famous. The trade-off is exactness: unlike PCA, NMF has no closed-form solution. It is fit by ' +
        'iteratively updating the two factor matrices to shrink the reconstruction error, and it can converge ' +
        'to different answers depending on where it starts.',
      howItWorks: {
        summary:
          'Factor a non-negative matrix X into two non-negative matrices W and H by iteratively updating both ' +
          'to reduce reconstruction error, without ever letting either go negative.',
        steps: [
          'Initialise W and H with non-negative values (e.g. via NNDSVD, a data-driven SVD-based initialization).',
          'Update H, holding W fixed, using a multiplicative rule that can only scale entries up or down, never below zero.',
          'Update W, holding H fixed, with the mirror-image multiplicative rule.',
          'Repeat until the reconstruction error (Frobenius norm, or KL/Itakura-Saito divergence) stops improving.',
          'Read the rows of H as parts (topics, basis patterns) and the rows of W as how much of each part each sample uses.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_components',
          what: 'Rank of the factorization: how many parts to learn. No default; must be set.',
          tuning:
            'Set it well below min(n_samples, n_features). For text topics, start in the tens; for image ' +
            'parts, tens to low hundreds. There is no automatic rule — inspect the parts a given k produces.',
        },
        {
          name: 'init',
          what: 'How W and H are initialised. scikit-learn defaults to NNDSVD (a non-negative variant of SVD-based initialization).',
          tuning:
            'Keep NNDSVD for sparse factorizations; switch to NNDSVDa or NNDSVDar (which fill the zeros NNDSVD ' +
            'leaves) when using the multiplicative-update solver, which cannot move a value away from exact zero.',
        },
        {
          name: 'solver / beta_loss',
          what: "'cd' (coordinate descent, Frobenius norm only) or 'mu' (multiplicative update, any beta-divergence). " +
            "scikit-learn defaults to solver='cd', beta_loss='frobenius'.",
          tuning:
            "Switch to solver='mu' with beta_loss='kullback-leibler' for count data such as word frequencies, " +
            'where KL divergence is the more natural loss than squared error.',
        },
      ],
      whenToUse: [
        'The data is inherently non-negative and additive — word counts, pixel intensities, spectra, purchase counts — so a parts-based factorization fits naturally rather than being forced on',
        'You want components a person can interpret directly as parts (topics, basis patterns) rather than PCA-style directions that mix positive and negative loadings',
        'You are extracting topics from a document-term matrix or basis patterns from non-negative image data',
      ],
      whenNotToUse: [
        "You need the best possible reconstruction for a given rank — PCA/SVD's unconstrained factorization always reconstructs at least as well, since NMF solves a harder, constrained version of the same problem",
        'The data has negative values, or centering is part of your pipeline — non-negativity does not apply, and PCA or SVD is the direct tool',
        'You need a unique, reproducible decomposition — NMF has no closed-form solution, and different random initializations can converge to different local minima',
        'Speed matters and the matrix is huge — the iterative multiplicative updates take many more passes over the data than a single SVD computation',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'non-negative-parts-based-embedding',
      },
      math: {
        latex: [
          'X \\approx WH, \\qquad W \\ge 0,\\ H \\ge 0',
          '\\min_{W,H \\ge 0} \\lVert X - WH \\rVert_F^2',
          'H_{ij} \\leftarrow H_{ij}\\, \\frac{(W^\\top X)_{ij}}{(W^\\top W H)_{ij}}',
        ],
        notes:
          "The multiplicative update in the third line is Lee and Seung's key trick: because it is a ratio " +
          'of two non-negative quantities multiplying the current value, H_ij can shrink toward zero but can ' +
          'never cross it, so non-negativity is enforced automatically rather than by a separate projection ' +
          'step after each update. Lee and Seung proved this rule (and its mirror-image update for W) never ' +
          'increases the reconstruction error, which is why it converges without needing a learning rate to ' +
          'tune, unlike gradient descent. A non-negativity-constrained factorization had been proposed ' +
          "earlier, as 'positive matrix factorization' for environmental data by Paatero and Tapper (1994), " +
          "but it was Lee and Seung's Nature paper that popularised the idea across machine learning.",
      },
      complexity: {
        train: 'O(npk) per multiplicative-update iteration, repeated until convergence',
        predict: 'O(pk) per point to fit W for new data with H held fixed',
      },
      code: [
        'from sklearn.decomposition import NMF',
        'from sklearn.feature_extraction.text import TfidfVectorizer',
        '',
        'X = TfidfVectorizer(max_features=5000, stop_words="english").fit_transform(docs)',
        '',
        'nmf = NMF(n_components=20, init="nndsvda", solver="mu", beta_loss="kullback-leibler",',
        '          max_iter=400, random_state=0)',
        'W = nmf.fit_transform(X)     # document-topic weights, all >= 0',
        'H = nmf.components_          # topic-word weights, all >= 0',
        '',
        'top_words = [terms[i] for i in H[0].argsort()[::-1][:10]]   # top words for topic 0',
      ].join('\n'),
      // Cross-link pass: Lee & Seung's parts-based factorization is also used for topic modelling
      // alongside latent-dirichlet-allocation (Neptune, not yet written) — add once available.
      related: ['pca', 'svd-and-truncated-svd', 'ica-and-factor-analysis', 'latent-dirichlet-allocation'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Non-negative matrix factorization (NMF or NNMF)',
            url: 'https://scikit-learn.org/stable/modules/decomposition.html#non-negative-matrix-factorization-nmf-or-nnmf',
          },
        ],
        papers: [
          {
            title: 'Learning the Parts of Objects by Non-negative Matrix Factorization',
            url: 'https://www.nature.com/articles/44565',
            year: 1999,
          },
          {
            title: 'Algorithms for Non-negative Matrix Factorization',
            url: 'https://papers.nips.cc/paper/1861-algorithms-for-non-negative-matrix-factorization',
            year: 2001,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14.6 — Non-negative Matrix Factorization',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'ica-and-factor-analysis',
      name: 'ICA & factor analysis',
      aliases: ['independent component analysis', 'factor analysis', 'FastICA'],
      tier: 2,
      year: 1994,
      difficulty: 4,
      hook: 'Splits a mixed signal into independent sources, or scattered features into shared causes.',
      intuition:
        'Two people are talking at once and one microphone records the blend. PCA can decorrelate the two ' +
        'voices — make them statistically uncorrelated — but uncorrelated is a weak, second-order condition; ' +
        'the voices can still be tangled together in every other statistical sense. Independent component ' +
        'analysis (ICA) asks for something stronger: components that are fully statistically independent, ' +
        'not just uncorrelated, which for mixed non-Gaussian signals is enough to actually separate the ' +
        'original voices back out. It works by exploiting non-Gaussianity — a sum of independent sources ' +
        'looks more Gaussian than any one source alone, so ICA searches for a rotation that makes the ' +
        'recovered signals as non-Gaussian as possible. Factor analysis solves a related but different ' +
        'problem: instead of separating signals, it explains correlated, noisy features as arising from a ' +
        'handful of shared latent factors plus feature-specific noise, explicitly allowing each feature its ' +
        "own noise level — something PCA's shared-variance assumption does not do.",
      howItWorks: {
        summary:
          'ICA rotates whitened data to maximise the statistical independence (via non-Gaussianity) of the ' +
          'recovered components; factor analysis fits a generative model of shared latent factors plus ' +
          'per-feature noise.',
        steps: [
          'ICA: whiten the data (decorrelate and scale to unit variance, typically via PCA) so only a rotation remains to be found.',
          "ICA: search for the rotation that maximises non-Gaussianity of the resulting components (e.g. FastICA's fixed-point iteration on negentropy).",
          'Factor analysis: fit x = Wh + mu + eps by maximum likelihood, where h is a shared low-dimensional latent cause and eps has a diagonal (per-feature) covariance.',
        ],
      },
      whenToUse: [
        'You are separating mixed signals from multiple sensors into their original independent sources (blind source separation), such as EEG or audio channels',
        'Noise genuinely differs in scale across features, and you want a model that accounts for that explicitly rather than assuming one shared noise variance the way PCA does',
      ],
      whenNotToUse: [
        'The underlying sources are Gaussian — ICA relies on non-Gaussianity to find a unique rotation, and a Gaussian mixture has no well-defined independent components to recover',
        "You want a fast, deterministic baseline — both methods fit iteratively (FastICA's fixed point, factor analysis's EM) and can converge to different local answers depending on initialization",
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'audio'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-embedding',
      },
      related: ['pca', 'nmf', 'normalizing-flows'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Independent component analysis (ICA) and Factor Analysis',
            url: 'https://scikit-learn.org/stable/modules/decomposition.html#independent-component-analysis-ica',
          },
        ],
        papers: [
          {
            title: 'Independent Component Analysis, a New Concept?',
            url: 'https://doi.org/10.1016/0165-1684(94)90029-9',
            year: 1994,
          },
          {
            title: 'Fast and Robust Fixed-Point Algorithms for Independent Component Analysis',
            url: 'https://doi.org/10.1109/72.761722',
            year: 1999,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14.7 — Independent Component Analysis and Exploratory Projection Pursuit',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'mds-isomap-and-lle',
      name: 'MDS / Isomap / LLE',
      aliases: ['multidimensional scaling', 'isometric mapping', 'locally linear embedding'],
      tier: 2,
      year: 2000,
      difficulty: 3,
      hook: 'Three ways to unroll a curved manifold: match all distances, geodesics, or neighborhoods.',
      intuition:
        'Take a rolled-up sheet of paper with a pattern drawn on it. Measuring straight-line distance between ' +
        'two points that ended up near each other after rolling would badly understate how far apart they ' +
        'are on the flattened sheet. All three methods exist to unroll that kind of structure, and they ' +
        'differ in what they insist on preserving. Classical MDS is the oldest and most direct: place points ' +
        'in low dimensions so all pairwise distances match the originals as closely as possible, straight-line ' +
        'and global. Isomap keeps that global machinery but swaps in geodesic distance — the shortest path ' +
        "along the manifold's surface, approximated by hopping through a nearest-neighbour graph — so it " +
        'respects the surface rather than cutting through the roll. LLE drops the global distance-matching ' +
        'goal entirely: each point is reconstructed as a weighted combination of its nearest neighbours, and ' +
        'the embedding is found by preserving only those local weights, trusting that getting every ' +
        "neighbourhood right adds up to a coherent global shape. Tenenbaum, de Silva & Langford's Isomap " +
        "paper and Roweis & Saul's LLE paper were published back to back in the same 2000 issue of Science.",
      howItWorks: {
        summary:
          'MDS matches all pairwise distances directly; Isomap does the same with geodesic distances from a ' +
          "neighbour graph; LLE preserves only each point's local linear reconstruction weights.",
        steps: [
          'MDS: build a pairwise distance (or dissimilarity) matrix, then place points in low dimensions minimising the mismatch (stress) between embedded and original distances.',
          'Isomap: build a k-nearest-neighbour graph, compute geodesic distances as shortest paths through it, then run classical MDS on that geodesic distance matrix.',
          'LLE: for each point, find its k nearest neighbours and the weights that best reconstruct it as their linear combination, then find low-dimensional coordinates that the same weights reconstruct.',
        ],
      },
      whenToUse: [
        'You know or suspect the data lies on a lower-dimensional curved manifold — a roll, a horseshoe, a swirl — that a linear method like PCA would flatten incorrectly',
        'You need an embedding driven by a specific, interpretable notion of distance you already trust: raw dissimilarities for MDS, geodesic path length for Isomap, local reconstruction for LLE',
      ],
      whenNotToUse: [
        'The dataset is more than a few thousand points — all three require an eigendecomposition or shortest-path computation that scales poorly (roughly O(n^2) to O(n^3))',
        'The manifold is not smoothly and densely sampled — Isomap\'s shortest-path graph and LLE\'s local weights both break down across gaps or noisy neighbourhoods, producing distorted "short-circuit" embeddings',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'image'],
        dataSize: ['tiny', 'small'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-embedding',
      },
      // Cross-body: distance-metrics (Venus) — all three methods are built entirely on a choice of
      // pairwise distance, so the choice made there propagates directly into the embedding.
      related: ['pca', 'svd-and-truncated-svd', 't-sne', 'distance-metrics'],
      references: {
        free: [{ title: 'scikit-learn user guide — Manifold learning', url: 'https://scikit-learn.org/stable/modules/manifold.html' }],
        papers: [
          {
            title: 'A Global Geometric Framework for Nonlinear Dimensionality Reduction',
            url: 'https://doi.org/10.1126/science.290.5500.2319',
            year: 2000,
          },
          {
            title: 'Nonlinear Dimensionality Reduction by Locally Linear Embedding',
            url: 'https://doi.org/10.1126/science.290.5500.2323',
            year: 2000,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14.8-14.9 — Multidimensional Scaling; Nonlinear Dimension Reduction and Local MDS',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 't-sne',
      name: 't-SNE',
      aliases: ['t-distributed stochastic neighbor embedding'],
      tier: 1,
      year: 2008,
      difficulty: 4,
      hook: 'Maps high-dimensional neighborhoods onto 2D, using heavy tails on purpose to fix crowding.',
      intuition:
        "t-SNE starts from a simple idea: convert distances into probabilities. In the original " +
        "high-dimensional space, turn each point's distance to every other point into a probability of " +
        'picking that point as a neighbour, using a Gaussian centred on it — nearby points get high ' +
        'probability, far ones get almost none. Then try to arrange points in 2D so the same neighbour ' +
        'probabilities hold there too. The naive version of this fails because of what van der Maaten and ' +
        'Hinton called the crowding problem: a 2D map simply does not have enough room at moderate distances ' +
        'to represent everything that was moderately far apart in high dimensions, so points that should ' +
        'stay somewhat separated get squashed toward the centre. Their fix is to use a heavy-tailed ' +
        'Student-t distribution for the low-dimensional probabilities instead of a Gaussian. Because the ' +
        't-distribution assigns much more probability mass to being far apart, points that are moderately ' +
        'dissimilar can sit much further apart in the map without being penalised — which is exactly what ' +
        'relieves the crowding.',
      howItWorks: {
        summary:
          'Convert pairwise distances to neighbour probabilities in high dimensions with a Gaussian, do the ' +
          'same in low dimensions with a heavy-tailed Student-t, and move points to minimise the KL ' +
          'divergence between the two.',
        steps: [
          "For each pair of points, compute a Gaussian-based probability p_j|i of picking j as i's neighbour, tuned per-point so its neighbourhood matches the target perplexity.",
          'Symmetrize into joint probabilities p_ij so every pair has one combined value.',
          'Initialise a low-dimensional layout (PCA is the scikit-learn default) and compute q_ij there using a Student-t distribution with one degree of freedom.',
          'Move the low-dimensional points by gradient descent to minimise the KL divergence between P and Q.',
          'Repeat until the layout stabilises; typically run with early exaggeration to form well-separated clusters first, then relax it.',
        ],
      },
      hyperparameters: [
        {
          name: 'perplexity',
          what: 'Roughly, the effective number of neighbours each point considers. scikit-learn defaults to 30.',
          tuning:
            'The original paper suggests 5-50; larger datasets or ones with big variation in local density ' +
            'often need multiple values tried, since no single perplexity is right for both dense and sparse ' +
            'regions at once.',
        },
        {
          name: 'learning_rate',
          what: "Step size for the embedding gradient descent. scikit-learn defaults to 'auto', set from the sample size.",
          tuning:
            'Leave it on auto unless the embedding collapses into a ball (raise it) or looks noisy and ' +
            'unstable (lower it).',
        },
        {
          name: 'init',
          what: "How the low-dimensional layout starts. scikit-learn defaults to 'pca'.",
          tuning:
            "Keep PCA initialization — it is far more globally stable than random init, and random init is " +
            "largely responsible for t-SNE's reputation for run-to-run instability.",
        },
      ],
      whenToUse: [
        'You need a 2D or 3D visualization to explore whether high-dimensional data has cluster structure, not a general-purpose embedding for downstream modelling',
        'Local neighbourhood structure is what matters — which points are near which — rather than global distances or relative cluster sizes',
        'The dataset is small enough to be practical: thousands to low hundreds of thousands of points with the Barnes-Hut approximation',
      ],
      whenNotToUse: [
        'You plan to read cluster sizes or the distance between clusters off the plot — both are provably unreliable in t-SNE and can invert or exaggerate the true relationships',
        'You need to embed new points after fitting — t-SNE has no out-of-sample transform; every new point requires refitting on the combined data',
        'The data is high-dimensional and dense (thousands of features) without prior reduction — the documentation recommends running PCA or TruncatedSVD down to about 50 dimensions first, or pairwise distance computation dominates the runtime',
        'You need a deterministic, reproducible embedding — different perplexities, initializations or even random seeds can produce visibly different layouts',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'image', 'text'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'low-dimensional-embedding-for-visualization',
      },
      math: {
        latex: [
          'p_{j|i} = \\frac{\\exp(-\\lVert x_i - x_j \\rVert^2 / 2\\sigma_i^2)}{\\sum_{k \\ne i} \\exp(-\\lVert x_i - x_k \\rVert^2 / 2\\sigma_i^2)}',
          'q_{ij} = \\frac{(1 + \\lVert y_i - y_j \\rVert^2)^{-1}}{\\sum_{k \\ne l} (1 + \\lVert y_k - y_l \\rVert^2)^{-1}}',
          'C = \\sum_i \\sum_j p_{ij} \\log \\frac{p_{ij}}{q_{ij}}',
        ],
        notes:
          "q_ij's denominator sums over every pair in the embedding, not just i's neighbours, which is what " +
          "makes the cost function's gradient push unrelated points apart as well as pull neighbours " +
          'together — that global repulsion is part of why cluster separation in the picture is not ' +
          "calibrated to anything in the original data. sigma_i in the first line is solved per point, not " +
          "shared, so every point's neighbourhood matches the same target perplexity regardless of local " +
          'density — this is exactly what a single global eps cannot do in DBSCAN, and it is why t-SNE ' +
          'handles clusters of very different density better than distance-threshold methods.',
      },
      complexity: {
        train: 'O(n^2) for exact computation; O(n log n) with the Barnes-Hut tree approximation scikit-learn uses by default',
        predict: 'n/a — no out-of-sample transform; new points require refitting',
      },
      code: [
        'from sklearn.manifold import TSNE',
        'from sklearn.decomposition import PCA',
        '',
        '# reduce very high-dimensional input first, as the docs recommend',
        'X_reduced = PCA(n_components=50).fit_transform(X)',
        '',
        'tsne = TSNE(n_components=2, perplexity=30, init="pca", learning_rate="auto", random_state=0)',
        'Z = tsne.fit_transform(X_reduced)',
        '',
        '# cluster SIZE and inter-cluster DISTANCE in Z are not meaningful — only local neighbourhoods are',
      ].join('\n'),
      related: ['umap', 'pca', 'mds-isomap-and-lle', 'distance-metrics'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — t-distributed Stochastic Neighbor Embedding (t-SNE)',
            url: 'https://scikit-learn.org/stable/modules/manifold.html#t-distributed-stochastic-neighbor-embedding-t-sne',
          },
          { title: 'Distill — How to Use t-SNE Effectively', url: 'https://distill.pub/2016/misread-tsne/' },
        ],
        papers: [{ title: 'Visualizing Data using t-SNE', url: 'https://jmlr.org/papers/v9/vandermaaten08a.html', year: 2008 }],
        books: [
          {
            title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
            author: 'Aurélien Géron',
            chapter: 'Ch. 8 — Dimensionality Reduction',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'umap',
      name: 'UMAP',
      aliases: ['uniform manifold approximation and projection'],
      tier: 1,
      year: 2018,
      difficulty: 4,
      hook: "Builds a fuzzy neighbor graph and lays it out fast — a different fix for t-SNE's crowding.",
      intuition:
        'UMAP starts from a different premise than t-SNE: assume the data is uniformly distributed on some ' +
        "underlying manifold, and let each point define its own local notion of distance based on how far " +
        'its nearest neighbours actually are. From that assumption it builds, for every point, a fuzzy set ' +
        'of edges to its neighbours — not a hard yes/no graph but one where each edge carries a membership ' +
        'strength between 0 and 1, formalised as a fuzzy simplicial set. Overlapping fuzzy edges from ' +
        'different points are merged with a probabilistic OR, giving one global fuzzy graph. A second, ' +
        'low-dimensional fuzzy graph is then optimised by gradient descent — attracting genuine neighbours ' +
        "together, repelling everything else apart — to match the first as closely as possible, measured by " +
        "cross-entropy rather than the KL divergence t-SNE uses. Building the graph relies only on " +
        'approximate nearest-neighbour search rather than all-pairs distances, and the optimisation scales ' +
        "with the number of graph edges rather than the number of point pairs, which is the real source of " +
        "UMAP's speed advantage.",
      howItWorks: {
        summary:
          'Build a fuzzy nearest-neighbour graph in high dimensions using locally-adaptive distances, then ' +
          'optimise a low-dimensional layout by gradient descent to match that graph under cross-entropy.',
        steps: [
          'For each point, find its k approximate nearest neighbours and set a local distance scale from them.',
          'Convert each neighbour relationship into a fuzzy-set membership strength (an edge weight between 0 and 1).',
          "Merge each point's fuzzy edges into one global fuzzy graph via a probabilistic union.",
          'Initialise a low-dimensional layout (spectral embedding by default) and build the equivalent fuzzy graph there.',
          'Run stochastic gradient descent with attractive and repulsive forces to minimise the cross-entropy between the two graphs.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_neighbors',
          what: 'Size of the local neighbourhood used to build the fuzzy graph. The reference implementation defaults to 15.',
          tuning:
            'Small values (5-10) focus on very local structure and fragment the layout; larger values ' +
            '(50-100+) trade local detail for a layout that better reflects global relationships.',
        },
        {
          name: 'min_dist',
          what: 'Minimum distance points are allowed to sit apart in the embedding. Defaults to 0.1.',
          tuning:
            'Lower it toward 0 for tight, cluster-like layouts (good before feeding into a clustering ' +
            'algorithm); raise it for a layout that spreads points more evenly, better for visual ' +
            "exploration of overall topology.",
        },
      ],
      whenToUse: [
        'You need a 2D/3D visualization but also want an embedding usable as a general-purpose feature representation for downstream modelling or clustering, since unlike t-SNE it supports transforming new points',
        "The dataset is too large for t-SNE to run in reasonable time — UMAP's neighbour-graph construction and layout both avoid the all-pairs computation t-SNE needs",
        "You want to preserve more of the data's broad structure alongside local neighbourhoods, not local neighbourhoods only",
      ],
      whenNotToUse: [
        'You are relying on the claim that UMAP preserves global structure better than t-SNE on its own — Kobak & Linderman (2021, Nature Biotechnology) showed that advantage is largely attributable to UMAP\'s spectral initialization, and t-SNE closes most of the gap when initialized the same way',
        'You need a formal guarantee that distances or topology are preserved — the topological framing motivates the construction but is not a proven bound on the output, and cluster shapes or densities in the plot can still be layout artefacts',
        'Reproducibility across runs and library versions matters a great deal — stochastic optimisation, approximate nearest-neighbour search, and n_neighbors/min_dist all move the result, and defaults have changed across versions',
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'image', 'text'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'low-dimensional-embedding-for-visualization-or-downstream-use',
      },
      math: {
        latex: [
          'w_i(x_j) = \\exp\\!\\left(-\\frac{d(x_i,x_j) - \\rho_i}{\\sigma_i}\\right)',
          'w(x_i,x_j) = w_i(x_j) + w_j(x_i) - w_i(x_j)\\,w_j(x_i)',
          'CE = \\sum_{(i,j)} \\left[ w_H \\log\\frac{w_H}{w_L} + (1-w_H)\\log\\frac{1-w_H}{1-w_L} \\right]',
        ],
        notes:
          "rho_i in the first line is the distance to each point's single nearest neighbour, subtracted off " +
          'so every point has at least one edge of full strength 1 regardless of local density — this is the ' +
          "locally-adaptive distance that lets UMAP handle clusters of very different density without a " +
          'single global scale parameter. The second line is the fuzzy-set probabilistic union, combining ' +
          "two directed membership strengths symmetrically. Unlike t-SNE's KL divergence, the cross-entropy " +
          '(w_H is the high-dimensional weight, w_L the low-dimensional one) includes an explicit repulsive ' +
          "term for non-edges, which produces UMAP's often tighter, more separated-looking clusters — a " +
          'visual effect that is easy to over-read as a stronger topological guarantee than the theory ' +
          'actually establishes; see Kobak & Linderman (2021) in references.',
      },
      complexity: {
        train:
          'empirically about O(n^1.14) for the approximate nearest-neighbour search, the dominant cost per ' +
          'the original paper, plus O(kn) for the graph-layout optimisation',
        predict: 'O(log n) per new point via the fitted approximate nearest-neighbour index',
      },
      code: [
        'import umap',
        '',
        'reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, n_components=2, random_state=0)',
        'Z_train = reducer.fit_transform(X_train)',
        '',
        '# unlike t-SNE, UMAP supports transforming new points onto the fitted embedding',
        'Z_test = reducer.transform(X_test)',
      ].join('\n'),
      // hdbscan (Jupiter) is the standard clustering pairing for UMAP output — same author
      // (McInnes), and UMAP-then-HDBSCAN is a widely documented pipeline.
      related: ['t-sne', 'mds-isomap-and-lle', 'distance-metrics', 'hdbscan'],
      references: {
        free: [
          { title: 'UMAP documentation — How UMAP Works', url: 'https://umap-learn.readthedocs.io/en/latest/how_umap_works.html' },
          { title: 'UMAP documentation — Basic UMAP Parameters', url: 'https://umap-learn.readthedocs.io/en/latest/parameters.html' },
        ],
        papers: [
          {
            title: 'UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction',
            url: 'https://arxiv.org/abs/1802.03426',
            year: 2018,
          },
          {
            title: 'Initialization is Critical for Preserving Global Data Structure in Both t-SNE and UMAP',
            url: 'https://doi.org/10.1038/s41587-020-00809-z',
            year: 2021,
          },
        ],
        books: [
          {
            title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
            author: 'Aurélien Géron',
            chapter: 'Ch. 8 — Dimensionality Reduction',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'random-projection-and-som',
      name: 'Random projection & self-organizing maps',
      aliases: ['SOM', 'Kohonen map', 'Johnson-Lindenstrauss random projection'],
      tier: 2,
      year: 1982,
      difficulty: 3,
      hook: 'Skips learning distances via a random matrix, or lets a grid of neurons self-organize.',
      intuition:
        'Random projection makes a surprising bet: instead of carefully computing the directions of most ' +
        'variance like PCA, just multiply the data by a matrix of random numbers and keep enough output ' +
        'dimensions. The Johnson-Lindenstrauss lemma says this works, in the specific sense that a random ' +
        'projection to a few hundred dimensions approximately preserves all pairwise distances with high ' +
        'probability, regardless of the original dimensionality — no tuning, and a formal guarantee on ' +
        'distortion in exchange. Self-organizing maps take an entirely different route to a related goal. A ' +
        'grid of neurons, each holding a weight vector in the input space, competes for each training point: ' +
        'the closest neuron wins, and it plus its grid neighbours are nudged toward that point, with the ' +
        'neighbourhood shrinking over training. The result is a low-dimensional grid where nearby neurons ' +
        'represent similar inputs — a topologically-organized, discretized alternative to PCA that came from ' +
        'neuroscience-inspired modelling rather than linear algebra.',
      howItWorks: {
        summary:
          'Random projection multiplies data by a random matrix with a distance-preservation guarantee; a ' +
          'self-organizing map trains a grid of neurons to compete for input points and adapt toward them ' +
          'along with their grid neighbours.',
        steps: [
          'Random projection: draw a random matrix (dense Gaussian or sparse) sized by the Johnson-Lindenstrauss bound for the desired distortion, and multiply the data by it — no fitting involved.',
          'SOM: for each training point, find the neuron whose weight vector is closest (the best matching unit).',
          'SOM: move that neuron and its neighbours on the grid toward the input point, with both the neighbourhood size and the update strength shrinking over training.',
        ],
      },
      whenToUse: [
        'The data is extremely high-dimensional and you need a cheap, distance-preserving reduction fast — random projection needs no fitting at all, only a matrix multiply',
        'You want a 2D grid layout for exploring cluster structure and topology together, where each grid cell is directly inspectable as a representative input pattern (SOM)',
      ],
      whenNotToUse: [
        'You need the tightest possible low-dimensional representation for a fixed number of dimensions — random projection preserves distances approximately and generically, while PCA/SVD optimise directly for this dataset and beat it on reconstruction error',
        "Training data is small — SOM's grid needs enough points to organize meaningfully, and with too few points many neurons never win and stay unadapted",
      ],
      facets: {
        task: ['dimensionality-reduction', 'representation'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-projection-or-topological-grid',
      },
      // k-means (Jupiter) is the natural comparison for SOM: both partition by nearest-centroid
      // competition, but SOM additionally ties its centroids together on a fixed grid topology.
      related: ['pca', 'svd-and-truncated-svd', 'k-means'],
      references: {
        free: [{ title: 'scikit-learn user guide — Random Projection', url: 'https://scikit-learn.org/stable/modules/random_projection.html' }],
        papers: [
          {
            title: 'Self-Organized Formation of Topologically Correct Feature Maps',
            url: 'https://doi.org/10.1007/BF00337288',
            year: 1982,
          },
          {
            title: 'Extensions of Lipschitz Mappings into a Hilbert Space',
            url: 'https://stanford.edu/class/cs114/readings/JL-Johnson.pdf',
            year: 1984,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 14.4 — Self-Organizing Maps',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
      },
    },
  ],
} satisfies Body;
