/**
 * Mercury — Linear & Probabilistic Foundations. See PLAN.md §3 for the full moon list.
 *
 * Complete: all 9 moons from PLAN.md §3 are written here at their marked tiers — 7 Tier 1
 * (linear-regression, ridge-regression, lasso, logistic-regression, generalized-linear-models,
 * naive-bayes, discriminant-analysis) and 2 Tier 2 stubs (elastic-net, polynomial-regression).
 * `linear-regression` is the Phase 2 schema pressure-test entry and is unchanged apart from its
 * `related` array, which was a deliberate placeholder pointing at dbscan/self-attention and now
 * points at real Mercury neighbours.
 *
 * `eraRange` spans 1805 (Legendre's publication of least squares) to 2005 (Zou & Hastie's
 * elastic net), the earliest and latest moon on this body.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * Unlike the Phase 2 session, WebFetch worked in this environment, so every reference URL below
 * was loaded before it was cited, and every date/attribution was checked against Crossref
 * metadata for the DOI actually cited. Hyperparameter names and defaults come from the
 * scikit-learn pages linked in each entry, read at authoring time.
 *
 * Two cross-body `related` links are deliberate and genuine rather than decorative:
 * discriminant-analysis → distance-metrics (scikit-learn's LDA/QDA guide notes LDA's rule
 * reduces to a Mahalanobis distance to the class means) and naive-bayes →
 * kernel-density-estimation (naive Bayes needs one univariate conditional density per feature;
 * KDE is one way to estimate them), plus polynomial-regression → loess (LOESS fits local
 * polynomials where this fits one global polynomial).
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'mercury',
  name: 'Mercury',
  segment: 'Linear & Probabilistic Foundations',
  hook: 'The starting point: fit a line, a probability, or a boundary directly from the data, in closed form.',
  summary:
    'Mercury holds the linear and probabilistic foundations of the field — models simple enough to solve in ' +
    'closed form or with a short, well-understood fit, and the baseline every fancier model downstream is ' +
    'implicitly measured against.',
  eraRange: [1805, 2005],
  moons: [
    {
      id: 'linear-regression',
      name: 'Ordinary Least Squares',
      aliases: ['linear regression', 'OLS'],
      tier: 1,
      year: 1805,
      difficulty: 1,
      hook: 'Draws the straight line through your data that makes the total squared error as small as possible.',
      intuition:
        'Picture scattering a handful of points on a graph and trying to draw one straight line through them ' +
        'that stays as close as possible to all of them at once. You cannot hit every point exactly, so you ' +
        'need a rule for what "close" means and a way to trade off overshooting some points against ' +
        'undershooting others. Ordinary least squares picks the line that minimizes the sum of the squared ' +
        'vertical distances between the line and each point — squaring so a point twice as far off counts four ' +
        'times as heavily, which punishes big misses far more than small ones. Because that objective is a ' +
        "smooth, bowl-shaped function of the line's slope and intercept, it has exactly one lowest point, and " +
        'calculus hands you its location directly, in one step, with no trial and error. Ridge, lasso and ' +
        'logistic regression all start from this same squared-error idea and modify it.',
      howItWorks: {
        summary:
          'Stack the features into a matrix, minimize the sum of squared residuals between predicted and ' +
          'observed values, and solve the resulting equations directly with linear algebra.',
        steps: [
          'Stack the features into a design matrix X, one row per observation, plus a column of 1s for the intercept.',
          'Define the residual sum of squares as the sum of squared differences between observed y and predicted Xβ.',
          'Differentiate the residual sum of squares with respect to β and set the gradient to zero.',
          'Solve the resulting normal equations for the coefficient vector β.',
          'In practice, factor X with QR or SVD instead of explicitly inverting XᵀX, for numerical stability.',
          'Predict new points as Xβ using the fitted coefficients.',
        ],
      },
      whenToUse: [
        'The relationship between features and target is approximately linear, or can be made so with a simple transform',
        'You need an interpretable model where each coefficient has a direct, additive meaning',
        'You want a closed-form fit with no hyperparameters to tune and no iterative convergence to babysit',
        'The number of features is small relative to the number of observations',
      ],
      whenNotToUse: [
        'Features are highly correlated with each other, which makes coefficients unstable and hard to interpret — use ridge regression instead',
        'The number of features approaches or exceeds the number of observations, where XᵀX becomes singular or near-singular',
        'The relationship is fundamentally non-linear and no transform captures it',
        'Influential outliers are expected — squared error weights large errors heavily; consider a robust loss instead',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      math: {
        latex: [
          '\\hat{y} = X\\beta',
          '\\mathrm{RSS}(\\beta) = \\lVert y - X\\beta \\rVert_2^2',
          '\\hat{\\beta} = (X^\\top X)^{-1} X^\\top y',
        ],
        notes:
          'The closed-form solution assumes XᵀX is invertible, i.e. X has full column rank; when it does not ' +
          '(near-collinear features, or more features than rows), the inverse is unstable or does not exist — ' +
          "the direct motivation for ridge regression's added penalty term.",
      },
      complexity: {
        train: 'O(n·p²) via the singular value decomposition of X, for n observations and p features (n ≥ p)',
        predict: 'O(p) per prediction',
      },
      code: [
        'from sklearn.linear_model import LinearRegression',
        'from sklearn.model_selection import train_test_split',
        '',
        'X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)',
        '',
        'model = LinearRegression()',
        'model.fit(X_train, y_train)',
        '',
        'y_pred = model.predict(X_test)',
        '',
        'print(model.coef_)        # one weight per feature',
        'print(model.intercept_)   # the constant term',
      ].join('\n'),
      // Phase 3: the Phase 2 placeholder (dbscan, self-attention) is replaced with Mercury's real
      // neighbours — the two penalised versions of this exact objective, the basis-expansion
      // version, and the generalisation that keeps the linear predictor but drops the Normal
      // error assumption. nova.ts's self-attention still links here, so that edge survives.
      related: ['ridge-regression', 'lasso', 'polynomial-regression', 'generalized-linear-models'],
      references: {
        free: [{ title: 'scikit-learn user guide — Linear Models', url: 'https://scikit-learn.org/stable/modules/linear_model.html' }],
        papers: [
          {
            title: 'Gauss and the Invention of Least Squares',
            url: 'https://doi.org/10.1214/aos/1176345451',
            year: 1981,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 3 — Linear Methods for Regression',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'ridge-regression',
      name: 'Ridge Regression',
      aliases: ['L2 regularization', 'Tikhonov regularization'],
      tier: 1,
      year: 1970,
      difficulty: 2,
      hook: 'Adds a penalty on squared coefficient size to least squares, so correlated features stop fighting.',
      intuition:
        'Ordinary least squares has one job: make the residuals small. If two features carry almost the same ' +
        'information, it can do that with an enormous positive weight on one and an enormous negative weight ' +
        'on the other, because the two nearly cancel. The fit looks fine and the coefficients are nonsense — ' +
        'nudge the data slightly and they swing wildly or flip sign. Ridge regression gives the fit a second ' +
        'job: keep the coefficients small, measured by the sum of their squares. Now every unit of coefficient ' +
        'size has to be earned, and the cheapest way to use two near-duplicate features is to split the weight ' +
        'between them rather than run a tug-of-war. The strength of that second job is a dial you set. Turn it ' +
        'up and every coefficient is pulled toward zero without any of them ever reaching it; turn it down to ' +
        'zero and you are back to ordinary least squares exactly.',
      howItWorks: {
        summary:
          'Minimize squared error plus a constant times the sum of squared coefficients. Algebraically the ' +
          'penalty adds that constant down the diagonal of XᵀX, which restores a unique and stable solution ' +
          'even when the features are collinear.',
        steps: [
          'Standardize the features first — the penalty compares coefficients on whatever scale you hand it.',
          'Write the objective as the residual sum of squares plus alpha times the sum of squared coefficients.',
          'Leave the intercept out of the penalty, so shifting the target up or down does not change the shrinkage.',
          'Differentiate and set to zero, giving normal equations with alpha added along the diagonal of XᵀX.',
          'Solve that system — it is invertible for every alpha above zero, even where XᵀX alone is not.',
          'Choose alpha by cross-validation over a log-spaced grid rather than by eye.',
        ],
      },
      hyperparameters: [
        {
          name: 'alpha',
          what: 'Strength of the L2 penalty. Zero reproduces ordinary least squares; large values pull every coefficient toward zero.',
          tuning:
            "scikit-learn's default is 1.0, which is already meaningful regularization — do not treat it as " +
            '"off". Search a log-spaced grid such as 1e-3 to 1e3 with RidgeCV, which uses an efficient ' +
            'leave-one-out path by default. Under that default path alpha cannot be 0.',
        },
        {
          name: 'solver',
          what: 'Numerical routine used to solve the penalized system.',
          tuning:
            'Leave at "auto", which picks cholesky for dense input and falls back to sparse_cg otherwise. ' +
            'Force "svd" when the design is close to singular and you want the most numerically stable answer; ' +
            'prefer "sparse_cg" or "lsqr" for large sparse matrices.',
        },
      ],
      whenToUse: [
        'Features are strongly correlated with each other and OLS coefficients swing or flip sign between resamples',
        'There are more features than observations, where XᵀX is singular and OLS has no unique solution at all',
        'You want to keep every feature in the model rather than select a subset — ridge shrinks, it never drops',
        'Prediction accuracy matters more to you than ending up with a short list of non-zero coefficients',
      ],
      whenNotToUse: [
        'You need automatic feature selection — ridge never sets a coefficient exactly to zero; use lasso',
        'Only a handful of features are genuinely relevant and the rest are noise, where lasso or elastic net do better',
        'Coefficients must be read as unbiased effect estimates — the penalty deliberately trades bias for variance',
        'Features are on wildly different scales and you cannot standardize them; the L2 penalty is not scale-invariant',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      math: {
        latex: [
          '\\hat{\\beta}^{\\,\\mathrm{ridge}} = \\arg\\min_{\\beta} \\; \\lVert y - X\\beta \\rVert_2^2 + \\alpha \\lVert \\beta \\rVert_2^2',
          '\\hat{\\beta}^{\\,\\mathrm{ridge}} = (X^\\top X + \\alpha I)^{-1} X^\\top y',
        ],
        notes:
          'The second line is the whole trick: adding alpha down the diagonal makes the matrix invertible for ' +
          'any alpha above zero, so ridge always has a unique solution where OLS may have none. The shrinkage ' +
          'is not uniform — written in the singular value decomposition of X, directions with large singular ' +
          'values are barely touched and directions with small ones are shrunk hard, so the penalty ' +
          'preferentially suppresses the low-variance directions of the data, which are exactly the ones ' +
          'collinearity makes unreliable.',
      },
      complexity: {
        train: 'O(n·p²) for n ≥ p — the same order as ordinary least squares, per the scikit-learn user guide',
        predict: 'O(p) per prediction',
      },
      code: [
        'import numpy as np',
        'from sklearn.linear_model import RidgeCV',
        'from sklearn.pipeline import make_pipeline',
        'from sklearn.preprocessing import StandardScaler',
        '',
        '# Scale inside the pipeline: the penalty is not scale-invariant, and scaling',
        '# fitted on the full data before splitting would leak.',
        'alphas = np.logspace(-3, 3, 25)',
        'model = make_pipeline(StandardScaler(), RidgeCV(alphas=alphas))',
        'model.fit(X_train, y_train)',
        '',
        'ridge = model[-1]',
        'print(ridge.alpha_)   # alpha chosen by leave-one-out CV',
        'print(ridge.coef_)    # shrunk toward zero — but none exactly zero',
      ].join('\n'),
      related: ['linear-regression', 'lasso', 'elastic-net', 'logistic-regression'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Ridge regression and classification', url: 'https://scikit-learn.org/stable/modules/linear_model.html' },
          { title: 'scikit-learn API — Ridge', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Ridge.html' },
        ],
        papers: [
          {
            title: 'Ridge Regression: Biased Estimation for Nonorthogonal Problems',
            url: 'https://doi.org/10.1080/00401706.1970.10488634',
            year: 1970,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 3 — Linear Methods for Regression',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
          {
            title: 'An Introduction to Statistical Learning',
            author: 'James, Witten, Hastie & Tibshirani',
            chapter: 'Linear Model Selection and Regularization',
            url: 'https://www.statlearning.com/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'lasso',
      name: 'Lasso',
      aliases: ['L1 regularization', 'least absolute shrinkage and selection operator'],
      tier: 1,
      year: 1996,
      difficulty: 2,
      hook: 'Penalises coefficients by absolute size, which drives the useless ones to exactly zero.',
      intuition:
        'Ridge regression asks you to keep coefficients small by penalising their squares. Lasso asks the same ' +
        'thing but measures size by absolute value instead, and that single change alters the answer ' +
        'qualitatively rather than just quantitatively. Squaring makes the penalty almost flat near zero, so a ' +
        'coefficient that is already tiny gains nothing by going the last step; absolute value keeps a ' +
        'constant pull all the way in, so any coefficient that earns less than that pull gets pushed to ' +
        'exactly zero and stays there. The result is a model that fits and selects at the same time: turn the ' +
        'dial up and features drop out of the model one by one until only the intercept survives. ' +
        'Geometrically, the region the coefficients are confined to is a diamond rather than a ball, and the ' +
        'corners of a diamond sit on the axes — and sitting on an axis is what it means for a coefficient to ' +
        'be zero.',
      howItWorks: {
        summary:
          'Minimize squared error plus a constant times the sum of absolute coefficients. The absolute value ' +
          'has no derivative at zero, so there is no closed form; scikit-learn optimizes it by cycling through ' +
          'the coefficients one at a time and soft-thresholding each.',
        steps: [
          'Standardize the features so a single shared penalty means the same thing in every column.',
          'Write the objective as mean squared error plus alpha times the sum of absolute coefficients.',
          'Fix all coefficients but one, and solve that single-variable problem against the current residual.',
          'Soft-threshold the answer: shrink it toward zero by alpha, and clamp it to exactly zero if it does not survive.',
          'Move to the next coefficient and repeat, sweeping cyclically through all of them.',
          'Stop when the duality gap falls below tol, or when max_iter sweeps have been used.',
        ],
      },
      hyperparameters: [
        {
          name: 'alpha',
          what: 'Strength of the L1 penalty; controls how many coefficients survive at non-zero.',
          tuning:
            'Default is 1.0. Use LassoCV, which builds a descending path of alphas automatically and picks by ' +
            'cross-validation. For small samples, LassoLarsCV explores a more relevant set of alphas; ' +
            'LassoLarsIC picks by AIC or BIC from a single path fit and is cheaper still.',
        },
        {
          name: 'max_iter',
          what: 'Maximum number of coordinate-descent sweeps before the fit gives up.',
          tuning:
            'Default is 1000, with tol at 1e-4. A ConvergenceWarning almost always means the features are ' +
            'unscaled or alpha is very small — fix the scaling before raising this.',
        },
      ],
      whenToUse: [
        'You expect only a small fraction of the features to matter and want the rest driven to exactly zero',
        'There are far more features than observations and you need a model with fewer coefficients than rows',
        'You want fitting and feature selection to happen in one step rather than as a separate screening pass',
        'The deliverable is a short, readable list of drivers rather than the best possible prediction',
      ],
      whenNotToUse: [
        'Features come in correlated groups and you need every member kept — lasso keeps one and zeros the rest; use elastic net',
        'You need more than n non-zero coefficients when p > n: the lasso saturates at n selected variables',
        'Every feature is weakly but genuinely predictive, where zeroing most of them throws away signal; ridge does better',
        'Surviving coefficients must be read as unbiased effects — L1 shrinks the ones it keeps as well as zeroing the others',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      math: {
        latex: [
          '\\min_{\\beta} \\; \\frac{1}{2n} \\lVert y - X\\beta \\rVert_2^2 + \\alpha \\lVert \\beta \\rVert_1',
          'S(z, \\gamma) = \\operatorname{sign}(z)\\,\\max\\!\\left(|z| - \\gamma,\\; 0\\right)',
        ],
        notes:
          'The second expression is the soft-thresholding operator each coordinate update applies, and it is ' +
          'the mechanical source of the exact zeros — ridge has no equivalent, because its update never ' +
          'reaches zero. Watch the 1/(2n) factor: scikit-learn divides the squared-error term by 2·n_samples ' +
          'for Lasso and ElasticNet but not for Ridge, so an alpha tuned for one is not on the same scale as ' +
          'an alpha for the other. Zou & Hastie catalogue the two structural limits — saturation at n selected ' +
          'variables when p > n, and arbitrary choice within a correlated group — that motivated elastic net.',
      },
      complexity: {
        train:
          'Coordinate descent: each single-coefficient update costs O(n), so a full sweep over p features is ' +
          'O(n·p), repeated until the duality gap falls below tol',
        predict: 'O(k) per prediction, for the k surviving non-zero coefficients',
      },
      code: [
        'import numpy as np',
        'from sklearn.linear_model import LassoCV',
        'from sklearn.pipeline import make_pipeline',
        'from sklearn.preprocessing import StandardScaler',
        '',
        'model = make_pipeline(StandardScaler(), LassoCV(cv=5, random_state=0))',
        'model.fit(X_train, y_train)',
        '',
        'lasso = model[-1]',
        'print(lasso.alpha_)                     # alpha picked by cross-validation',
        'print(np.sum(lasso.coef_ != 0), "of", lasso.coef_.size, "features kept")',
        '',
        'kept = np.flatnonzero(lasso.coef_)      # indices of the surviving features',
      ].join('\n'),
      related: ['linear-regression', 'ridge-regression', 'elastic-net', 'logistic-regression'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Lasso', url: 'https://scikit-learn.org/stable/modules/linear_model.html' },
          { title: 'scikit-learn API — Lasso', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Lasso.html' },
        ],
        papers: [
          {
            title: 'Regression Shrinkage and Selection via the Lasso',
            url: 'https://doi.org/10.1111/j.2517-6161.1996.tb02080.x',
            year: 1996,
          },
          {
            title: 'Regularization Paths for Generalized Linear Models via Coordinate Descent',
            url: 'https://doi.org/10.18637/jss.v033.i01',
            year: 2010,
          },
          {
            title: 'Least Angle Regression',
            url: 'https://doi.org/10.1214/009053604000000067',
            year: 2004,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 3 — Linear Methods for Regression',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'elastic-net',
      name: 'Elastic Net',
      tier: 2,
      year: 2005,
      difficulty: 2,
      hook: 'Mixes the lasso and ridge penalties so correlated features are kept or dropped together, not arbitrarily.',
      intuition:
        'Lasso has a habit that looks like decisiveness and is really a coin flip: given a group of features ' +
        'that say almost the same thing, it keeps one and zeros the others, and which one it keeps can change ' +
        'if you resample the data. It also cannot select more features than you have rows. Elastic net adds ' +
        "ridge's squared penalty on top of lasso's absolute one. The absolute part still produces exact zeros, " +
        'so you still get a sparse model; the squared part still spreads weight across near-duplicate ' +
        'features, so a correlated group tends to enter or leave the model as a block instead of one arbitrary ' +
        'representative. Zou and Hastie call that the grouping effect, and it is the reason elastic net is the ' +
        'usual default when features are both numerous and correlated.',
      howItWorks: {
        summary:
          'Penalize a convex mixture of the L1 and L2 norms of the coefficients, with one knob for total ' +
          'penalty strength and a second for the mix.',
        steps: [
          'Standardize the features, as for lasso and ridge.',
          'Add alpha · l1_ratio times the sum of absolute coefficients, plus alpha · (1 − l1_ratio)/2 times the sum of squares.',
          'Fit by coordinate descent, then tune alpha and l1_ratio together with ElasticNetCV.',
        ],
      },
      whenToUse: [
        'Features are numerous and arrive in correlated groups, and you want the whole group selected or dropped together',
        'p > n and you need more than n non-zero coefficients, which lasso alone cannot give you',
      ],
      whenNotToUse: [
        'Features are close to uncorrelated, where plain lasso is simpler and gives the same answer',
        'You want a single penalty to tune — elastic net has two, and the cross-validated search is correspondingly slower',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      related: ['lasso', 'ridge-regression', 'linear-regression'],
      references: {
        free: [
          { title: 'scikit-learn API — ElasticNet', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.ElasticNet.html' },
          { title: 'scikit-learn user guide — Elastic-Net', url: 'https://scikit-learn.org/stable/modules/linear_model.html' },
        ],
        papers: [
          {
            title: 'Regularization and Variable Selection via the Elastic Net',
            url: 'https://doi.org/10.1111/j.1467-9868.2005.00503.x',
            year: 2005,
          },
        ],
      },
    },
    {
      id: 'polynomial-regression',
      name: 'Polynomial Regression',
      aliases: ['basis expansion', 'polynomial features'],
      tier: 2,
      year: 1815,
      difficulty: 1,
      hook: 'Feeds powers and products of your features to a linear model, fitting curves with straight-line machinery.',
      intuition:
        'A linear model is linear in its coefficients, not in your data. That distinction is the whole idea ' +
        'here: if a straight line will not do, invent new columns — the square of a feature, the cube, the ' +
        'product of two features — and hand those to ordinary least squares as if they were measurements you ' +
        'had collected. The fit stays a linear-algebra problem with a closed-form solution, but the curve it ' +
        'traces through the original space bends. The cost is that the number of new columns grows fast with ' +
        'the degree and with the number of original features, and high-degree fits wave violently between the ' +
        'points they are anchored to, especially near the edges of the data.',
      howItWorks: {
        summary:
          'Expand the features into all monomials up to a chosen degree, then fit an ordinary (usually ' +
          'penalized) linear model on the expanded matrix.',
        steps: [
          'Choose a degree — scikit-learn\'s PolynomialFeatures defaults to 2.',
          'Generate every product of features up to that degree, including squares and a bias column.',
          'Fit a linear model on the expanded design, typically with a ridge penalty since the new columns are strongly correlated.',
        ],
      },
      whenToUse: [
        'A scatter plot shows smooth curvature that a straight line clearly misses, and you have only a handful of features',
        'You want to add a specific interaction or squared term you have a substantive reason to expect',
      ],
      whenNotToUse: [
        'You have many features — the expanded column count grows combinatorially with degree and feature count',
        'You need to extrapolate beyond the range of the training data, where high-degree polynomials diverge fast',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      // loess is the local counterpart: it fits low-degree polynomials in a sliding neighbourhood
      // rather than one global polynomial over the whole range.
      related: ['linear-regression', 'ridge-regression', 'loess'],
      references: {
        free: [
          { title: 'scikit-learn API — PolynomialFeatures', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PolynomialFeatures.html' },
          { title: 'scikit-learn user guide — Polynomial regression: extending linear models with basis functions', url: 'https://scikit-learn.org/stable/modules/linear_model.html' },
        ],
        papers: [
          {
            title: "Gergonne's 1815 paper on the design and analysis of polynomial regression experiments",
            url: 'https://doi.org/10.1016/0315-0860(74)90033-0',
            year: 1974,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 5 — Basis Expansions and Regularization',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
      },
    },
    {
      id: 'logistic-regression',
      name: 'Logistic Regression',
      aliases: ['logit model', 'maximum entropy classifier'],
      tier: 1,
      year: 1958,
      difficulty: 2,
      hook: 'Fits a linear score, then bends it through the logistic curve to turn it into a class probability.',
      intuition:
        'You want a probability, and a straight line will not give you one: extend it far enough and it ' +
        'predicts 140% chance of rain. So compute the straight-line score anyway — a weighted sum of the ' +
        'features — and then pass it through a curve that squashes any number, however extreme, into the range ' +
        'zero to one. The curve is S-shaped: near the middle a small change in the score moves the probability ' +
        'a lot, and far out at either end it barely moves it, which matches how evidence actually behaves. ' +
        'Read backwards, the model says something clean: the log-odds of the positive class are a linear ' +
        'function of the features, so each coefficient is the change in log-odds per unit of that feature, and ' +
        'exponentiating it gives an odds ratio you can quote in a sentence. Fitting maximizes the likelihood ' +
        'of the labels you observed, which unlike least squares has no algebraic answer and is solved ' +
        'numerically.',
      howItWorks: {
        summary:
          'Model the log-odds of the positive class as a linear function of the features, then choose the ' +
          'coefficients that make the observed labels most likely, by numerical optimization.',
        steps: [
          'Compute a linear score for each observation: an intercept plus a weighted sum of the features.',
          'Map that score to a probability with the logistic function, which is bounded between 0 and 1.',
          'Write the log-likelihood of the observed labels under those probabilities — equivalently, the negative log loss.',
          'Add a regularization term; scikit-learn applies an L2 penalty by default, at C = 1.0.',
          'Maximize numerically — lbfgs by default, for up to max_iter = 100 iterations.',
          'Predict probabilities, then convert to labels at a threshold chosen from the costs of each error type.',
        ],
      },
      hyperparameters: [
        {
          name: 'C',
          what: 'Inverse regularization strength — smaller C means stronger shrinkage of the coefficients.',
          tuning:
            'Default is 1.0, and the docs are explicit that regularization is applied by default, so an ' +
            'untuned fit is already penalized. Search a log-spaced grid; set C to infinity for a genuinely ' +
            'unpenalized fit, but only when the classes are not separable.',
        },
        {
          name: 'penalty',
          what: 'Which norm to penalize: "l2" (default), "l1" for sparsity, or "elasticnet".',
          tuning:
            'Keep "l2" unless you want feature selection. "l1" needs the liblinear or saga solver, and ' +
            '"elasticnet" needs saga plus an l1_ratio. Recent scikit-learn versions are deprecating the ' +
            'penalty argument in favour of specifying l1_ratio directly, so check the version you are on.',
        },
        {
          name: 'solver',
          what: 'The numerical optimizer used to maximize the penalized likelihood.',
          tuning:
            '"lbfgs" is the default and is fine for most problems. Use "liblinear" for small datasets, ' +
            '"newton-cholesky" when n_samples greatly exceeds n_features, "saga" for large data or when you ' +
            'need L1 or elastic-net penalties.',
        },
        {
          name: 'class_weight',
          what: 'Per-class weights applied to the loss.',
          tuning:
            'Default None weights every observation equally. Set "balanced" when the positive class is rare ' +
            'and the default threshold produces an all-negative classifier — but re-check calibration afterwards.',
        },
      ],
      whenToUse: [
        'You need a probability rather than a bare label, so you can set the threshold from the cost of a false positive versus a false negative',
        'You have to explain each feature\'s effect as an odds ratio to a stakeholder, an auditor or a regulator',
        'Classes are close to linearly separable in the features you have, or become so after adding a few interaction terms by hand',
        'You want a fast, low-variance baseline to measure a gradient-boosted or neural model against',
      ],
      whenNotToUse: [
        'The decision boundary is genuinely curved and you are not willing to hand-engineer the interaction and polynomial terms that would straighten it',
        'The classes are perfectly (or quasi-perfectly) separable and you have turned regularization off — the maximum likelihood estimate is then infinite and non-unique',
        'Features vastly outnumber observations and you have not tuned C, where the fit will overfit even with the default penalty',
        'You need to model a target that is not a category — a count, a rate or a positive skewed amount; use the matching generalized linear model',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular', 'text'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities',
      },
      math: {
        latex: [
          '\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad z = \\beta_0 + x^\\top \\beta',
          '\\log \\frac{P(y=1 \\mid x)}{1 - P(y=1 \\mid x)} = \\beta_0 + x^\\top \\beta',
          '-\\log \\mathcal{L}(\\beta) = -\\sum_{i} \\left[ y_i \\log p_i + (1 - y_i) \\log (1 - p_i) \\right]',
        ],
        notes:
          'The middle line is the one worth memorising: the model is linear in the log-odds, not in the ' +
          'probability, which is why coefficients are quoted as odds ratios after exponentiating. The ' +
          'log-likelihood is concave, so there is a single optimum and no local-minimum problem, but the score ' +
          'equations have no algebraic solution — hence lbfgs and friends. Berkson coined "logit" in 1944 ' +
          'while fitting the logistic curve to bio-assay data; Cox (1958) set out the regression treatment of ' +
          'binary responses that the modern method follows.',
      },
      complexity: {
        train: 'O(n·p) per solver iteration, run until convergence or max_iter (default 100)',
        predict: 'O(p) per prediction per class',
      },
      code: [
        'from sklearn.linear_model import LogisticRegression',
        'from sklearn.pipeline import make_pipeline',
        'from sklearn.preprocessing import StandardScaler',
        'import numpy as np',
        '',
        'clf = make_pipeline(',
        '    StandardScaler(),',
        '    LogisticRegression(C=1.0, penalty="l2", solver="lbfgs", max_iter=1000),',
        ')',
        'clf.fit(X_train, y_train)',
        '',
        'proba = clf.predict_proba(X_test)[:, 1]   # probability of the positive class',
        'labels = (proba > 0.25).astype(int)       # threshold set by cost, not by default 0.5',
        '',
        'odds_ratios = np.exp(clf[-1].coef_[0])    # per standardized-unit odds ratio',
      ].join('\n'),
      related: ['linear-regression', 'generalized-linear-models', 'discriminant-analysis', 'naive-bayes'],
      references: {
        free: [
          { title: 'scikit-learn API — LogisticRegression', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html' },
          { title: 'Speech and Language Processing (3rd ed. draft), Ch. 4 — Logistic Regression and Text Classification', url: 'https://web.stanford.edu/~jurafsky/slp3/4.pdf' },
        ],
        papers: [
          {
            title: 'The Regression Analysis of Binary Sequences',
            url: 'https://doi.org/10.1111/j.2517-6161.1958.tb00292.x',
            year: 1958,
          },
          {
            title: 'Application of the Logistic Function to Bio-Assay',
            url: 'https://doi.org/10.1080/01621459.1944.10500699',
            year: 1944,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 4 — Linear Methods for Classification',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'generalized-linear-models',
      name: 'Generalized Linear Models',
      aliases: ['GLM', 'Poisson regression', 'Gamma regression', 'Tweedie regression'],
      tier: 1,
      year: 1972,
      difficulty: 3,
      hook: 'Keeps the linear predictor but swaps the error distribution and link, so counts and rates fit too.',
      intuition:
        'Least squares carries two assumptions that have nothing to do with linearity: that the target can be ' +
        'any real number, and that its spread is the same everywhere. Count a number of insurance claims, or ' +
        'the size of each one, and both assumptions break — counts cannot go negative, and big means come with ' +
        'big variance. Generalized linear models keep the part that works, a weighted sum of the features, and ' +
        'make the other two parts adjustable. A link function sits between the weighted sum and the predicted ' +
        'average, so a log link guarantees predictions stay positive. A choice of distribution says how the ' +
        'variance grows with the mean, which changes what counts as a big error and therefore what the fit ' +
        'chases. Pick identity and Normal and you get ordinary least squares back; pick logit and Bernoulli ' +
        'and you get logistic regression. Everything in between is the same machinery.',
      howItWorks: {
        summary:
          'Specify three things — a linear predictor, a link function connecting it to the mean, and a ' +
          'distribution from the exponential family — then fit by minimizing that distribution\'s deviance ' +
          'instead of squared error.',
        steps: [
          'Choose a distribution that matches the target: Poisson for counts, Gamma for positive skewed amounts, Bernoulli for yes/no.',
          'Choose a link function g mapping the mean onto the whole real line — log for Poisson and Gamma, logit for Bernoulli.',
          'Write the linear predictor as an intercept plus a weighted sum of the features.',
          'Replace squared error with the unit deviance of the chosen distribution as the loss.',
          'Minimize it numerically — iteratively reweighted least squares in statsmodels, lbfgs in scikit-learn.',
          'Back-transform with the inverse link to read predictions on the original scale.',
        ],
      },
      hyperparameters: [
        {
          name: 'power (TweedieRegressor)',
          what: 'Selects the distribution: 0 Normal, 1 Poisson, between 1 and 2 compound Poisson-Gamma, 2 Gamma, 3 inverse Gaussian.',
          tuning:
            'Default is 0.0, i.e. Normal — set it deliberately. Values strictly between 0 and 1 correspond to ' +
            'no distribution and are invalid. If you cross-validate over power, pass an explicit scoring ' +
            'function, because the default score changes meaning with the distribution.',
        },
        {
          name: 'link',
          what: 'Function connecting the linear predictor to the mean.',
          tuning:
            'Default "auto" chooses identity for power ≤ 0 and log for power > 0, which is what you want ' +
            'almost always. Override only when a specific link is required by the domain.',
        },
        {
          name: 'alpha',
          what: 'Strength of the L2 penalty on the coefficients.',
          tuning:
            'Default is 1.0 in scikit-learn — again, not "off". Standardize the features first, since the ' +
            'penalty is scale-dependent, and tune on a log grid.',
        },
      ],
      whenToUse: [
        'The target is a count that cannot be negative — model it with Poisson and a log link rather than regressing on the raw count',
        'The target is a positive, right-skewed amount such as a claim size, a duration or a spend — Gamma with a log link',
        'The target is a rate, events per unit of exposure, and you want exposure entered as a sample weight or offset rather than as a feature',
        'Residual plots show the spread of errors growing with the fitted value, breaking the constant-variance assumption of OLS',
      ],
      whenNotToUse: [
        'Counts are far more dispersed than Poisson allows — variance well above the mean; use negative binomial, or a Tweedie power between 1 and 2',
        'The relationship between the linear predictor and the mean is not monotone, so no link function can straighten it',
        'A large fraction of observations are exact zeros mixed with positive amounts and you need them modelled separately — a hurdle or zero-inflated model fits that structure, a plain GLM does not',
        'You want the automatic non-linear interactions a boosted tree finds, and interpretability is not a requirement',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      math: {
        latex: [
          'g\\!\\left(\\mathbb{E}[y \\mid x]\\right) = \\beta_0 + x^\\top \\beta',
          '\\mathbb{E}[y \\mid x] = h\\!\\left(\\beta_0 + x^\\top \\beta\\right), \\qquad h = g^{-1}',
          '\\min_{\\beta} \\; \\frac{1}{2n} \\sum_{i} d\\!\\left(y_i, \\hat{y}_i\\right) + \\frac{\\alpha}{2} \\lVert \\beta \\rVert_2^2',
        ],
        notes:
          'A GLM is three separable choices, not one model: a random component (the distribution), a linear ' +
          'predictor, and a link connecting them. Separating them is what makes the family a family — you can ' +
          'change the distribution without rewriting the fit. The loss d is the unit deviance, which reduces ' +
          'to squared error for the Normal case, so ordinary least squares is not analogous to a GLM, it is ' +
          'one. Note the link is applied to the mean, not to y itself: log-linking a Poisson GLM is not the ' +
          'same as taking log(y) and running OLS, and the difference is not cosmetic when y contains zeros.',
      },
      complexity: {
        train:
          'O(n·p²) per iteration when fitted by iteratively reweighted least squares (statsmodels), or O(n·p) ' +
          'per iteration with the lbfgs solver scikit-learn uses, up to max_iter = 100',
        predict: 'O(p) per prediction, plus the inverse link',
      },
      code: [
        'from sklearn.linear_model import PoissonRegressor',
        'from sklearn.pipeline import make_pipeline',
        'from sklearn.preprocessing import StandardScaler',
        '',
        '# Claim counts per policy; `exposure` is the fraction of a year each policy was in force.',
        'model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1e-3, max_iter=300))',
        'model.fit(X_train, y_train / exposure_train,',
        '          poissonregressor__sample_weight=exposure_train)',
        '',
        'rate = model.predict(X_test)          # expected claims per unit of exposure',
        'expected = rate * exposure_test       # back to expected claim counts',
        '',
        '# TweedieRegressor(power=2, link="log") gives Gamma; power=0 gives Ridge.',
      ].join('\n'),
      related: ['linear-regression', 'logistic-regression', 'ridge-regression'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Generalized Linear Models', url: 'https://scikit-learn.org/stable/modules/linear_model.html#generalized-linear-models' },
          { title: 'statsmodels — Generalized Linear Models', url: 'https://www.statsmodels.org/stable/glm.html' },
        ],
        papers: [
          {
            title: 'Generalized Linear Models',
            url: 'https://doi.org/10.2307/2344614',
            year: 1972,
          },
        ],
        books: [
          {
            title: 'Generalized Linear Models',
            author: 'McCullagh & Nelder',
            chapter: '2nd edition',
            url: 'https://doi.org/10.1007/978-1-4899-3242-6',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'naive-bayes',
      name: 'Naive Bayes',
      aliases: ['idiot Bayes', 'simple Bayesian classifier'],
      tier: 1,
      year: 1961,
      difficulty: 1,
      hook: 'Pretends features are independent given the class, so training collapses into counting.',
      intuition:
        'Deciding whether an email is spam really means asking which is more likely to have produced this ' +
        'exact combination of words, a spam writer or a normal correspondent. Estimating that for whole ' +
        'combinations is hopeless — you would need to have seen this exact combination before. So naive Bayes ' +
        'makes an assumption it knows is false: given the class, every word appears independently of every ' +
        'other. That collapses one impossible joint question into thousands of easy separate ones. How often ' +
        'does "invoice" show up in spam? How often in real mail? Multiply the per-word answers together with ' +
        'the base rate of spam, do the same for the other class, and take whichever is larger. Training is one ' +
        'pass of counting, with no optimization at all. The assumption is wrong, and the resulting ' +
        'probabilities are badly wrong with it, but the ranking between classes survives often enough that the ' +
        'classifier works.',
      howItWorks: {
        summary:
          'Estimate each class prior and each per-feature conditional distribution independently from counts, ' +
          'then pick the class maximizing the prior times the product of the conditionals.',
        steps: [
          'Estimate each class prior as its relative frequency in the training set.',
          'For each feature and each class, estimate the one-dimensional conditional distribution on its own.',
          'Add smoothing so a feature value never seen with a class does not zero out the entire product.',
          'At prediction time, sum the logs of the prior and the conditionals rather than multiplying, to avoid underflow.',
          'Return the class with the largest total — the maximum a posteriori choice.',
        ],
      },
      hyperparameters: [
        {
          name: 'alpha (MultinomialNB, ComplementNB, CategoricalNB)',
          what: 'Additive smoothing added to every count, so unseen feature/class pairs get non-zero probability.',
          tuning:
            'Default 1.0 is Laplace smoothing; values below 1 are Lidstone smoothing and let the data speak ' +
            'more. Tune on a log grid — for large vocabularies the best value is often well under 1. ' +
            'force_alpha defaults to True, so an alpha you set near zero is used as given.',
        },
        {
          name: 'var_smoothing (GaussianNB)',
          what: 'Fraction of the largest feature variance added to every variance, for numerical stability.',
          tuning:
            'Default 1e-9. Raise it when a feature is nearly constant within a class and you see numerical ' +
            'warnings or absurdly confident predictions.',
        },
        {
          name: 'fit_prior',
          what: 'Whether class priors are learned from the data or held uniform.',
          tuning:
            'Default True learns them from class frequencies. Set False, or pass class_prior explicitly, when ' +
            'the training set was sampled at a different class balance than production.',
        },
      ],
      whenToUse: [
        'Text or other high-dimensional count data where features number in the thousands and rows are comparatively few',
        'You need a working classifier from a single pass over the data, with no iterative fit and no learning rate',
        'Training data per class is scarce — each conditional is estimated from a one-dimensional slice, not from the joint distribution',
        'You want a cheap baseline to sanity-check whether a heavier classifier is earning its cost',
      ],
      whenNotToUse: [
        'You need the predicted probabilities themselves — scikit-learn states plainly that naive Bayes is a bad probability estimator and predict_proba should not be trusted',
        'Features are strongly redundant: duplicated or near-duplicated columns are counted as independent evidence and the winning class becomes wildly over-confident',
        'The signal lives in interactions between features, which the independence assumption erases by construction',
        'Continuous features are strongly non-Gaussian and you are reaching for GaussianNB — discretize them or model the density properly first',
      ],
      facets: {
        task: ['classification'],
        dataType: ['text', 'tabular'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'class-probabilities',
      },
      math: {
        latex: [
          '\\hat{y} = \\arg\\max_{y} \\; P(y) \\prod_{i=1}^{p} P(x_i \\mid y)',
          '\\hat{y} = \\arg\\max_{y} \\; \\log P(y) + \\sum_{i=1}^{p} \\log P(x_i \\mid y)',
          '\\hat{\\theta}_{yi} = \\frac{N_{yi} + \\alpha}{N_y + \\alpha p}',
        ],
        notes:
          'The product in the first line is exactly where the independence assumption enters, and it is almost ' +
          'always false. What saves the method is that classification only needs the argmax to be right, which ' +
          'is a much weaker requirement than the probabilities being right — Domingos and Pazzani showed the ' +
          'rule can be optimal under zero-one loss well outside the region where the independence assumption ' +
          'holds. The second line is the same thing in logs, which is how it is always implemented: sums do ' +
          'not underflow where products of thousands of small probabilities do.',
      },
      complexity: {
        train: 'O(n·p) — a single pass accumulating per-class sufficient statistics, with no iteration',
        predict: 'O(p·K) per sample, for K classes',
      },
      code: [
        'from sklearn.feature_extraction.text import TfidfVectorizer',
        'from sklearn.naive_bayes import MultinomialNB',
        'from sklearn.pipeline import make_pipeline',
        '',
        'clf = make_pipeline(',
        '    TfidfVectorizer(sublinear_tf=True),',
        '    MultinomialNB(alpha=0.1),        # 1.0 is Laplace; smaller often wins on big vocabularies',
        ')',
        'clf.fit(docs_train, y_train)',
        '',
        'print(clf.score(docs_test, y_test))',
        '',
        '# Use predict / decision ranking, not predict_proba: the probabilities are not trustworthy.',
      ].join('\n'),
      // kernel-density-estimation is the honest cross-body link: naive Bayes needs one univariate
      // conditional density per feature, and KDE is a non-parametric way to supply them instead of
      // assuming a Gaussian.
      related: ['logistic-regression', 'discriminant-analysis', 'kernel-density-estimation'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Naive Bayes', url: 'https://scikit-learn.org/stable/modules/naive_bayes.html' },
          { title: 'scikit-learn API — GaussianNB', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.GaussianNB.html' },
        ],
        papers: [
          {
            title: 'Automatic Indexing: An Experimental Inquiry',
            url: 'https://doi.org/10.1145/321075.321084',
            year: 1961,
          },
          {
            title: 'On the Optimality of the Simple Bayesian Classifier under Zero-One Loss',
            url: 'https://doi.org/10.1023/A:1007413511361',
            year: 1997,
          },
          {
            title: 'Naive (Bayes) at Forty: The Independence Assumption in Information Retrieval',
            url: 'https://doi.org/10.1007/BFb0026666',
            year: 1998,
          },
        ],
        books: [
          {
            title: 'Speech and Language Processing (3rd ed. draft)',
            author: 'Jurafsky & Martin',
            chapter: 'Appendix B — Naive Bayes Classification',
            url: 'https://web.stanford.edu/~jurafsky/slp3/B.pdf',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'discriminant-analysis',
      name: 'Linear & Quadratic Discriminant Analysis',
      aliases: ['LDA', 'QDA', "Fisher's linear discriminant"],
      tier: 1,
      year: 1936,
      difficulty: 2,
      hook: 'Fits a Gaussian bell to each class and puts the boundary where two bells meet.',
      intuition:
        'Instead of drawing a boundary directly, describe each class and let the boundary fall out. Assume ' +
        'every class is a cloud of points shaped like a multivariate bell: a centre, and a spread that can be ' +
        'stretched and tilted. Fit one bell per class, then for a new point ask which bell was more likely to ' +
        'have produced it, weighted by how common each class is. Where two bells are equally likely, you have ' +
        'your boundary. One modelling choice decides everything downstream: whether the classes share a single ' +
        'shape or each keeps its own. Share it, and the curved parts of the two bells cancel exactly, leaving ' +
        'a flat boundary — that is linear discriminant analysis. Let each class keep its own shape, and they ' +
        'do not cancel, leaving a curved boundary — quadratic discriminant analysis. Sharing costs you ' +
        'flexibility and buys you far fewer parameters to estimate, which is the whole trade.',
      howItWorks: {
        summary:
          'Model each class as a multivariate Gaussian, estimate its mean and covariance from the training ' +
          'data, and assign new points by Bayes rule to whichever class density, times its prior, is largest.',
        steps: [
          'Estimate each class prior from its frequency, or supply priors explicitly.',
          'Estimate each class mean from its training points.',
          'Estimate covariance: one pooled matrix shared across classes for LDA, one per class for QDA.',
          'Combine prior and Gaussian density through Bayes rule to get a discriminant score per class.',
          'Assign each new point to the class with the highest score.',
          'For LDA only, optionally project the data onto at most n_classes − 1 discriminant directions for plotting or downstream models.',
        ],
      },
      hyperparameters: [
        {
          name: 'solver',
          what: 'How the discriminant is computed: "svd" (default), "lsqr" or "eigen".',
          tuning:
            '"svd" never forms the covariance matrix explicitly, so it is the right choice when there are many ' +
            'features — but it cannot use shrinkage. Switch to "lsqr" or "eigen" when you need shrinkage; ' +
            '"eigen" is also the one that supports the dimensionality-reduction transform with shrinkage.',
        },
        {
          name: 'shrinkage',
          what: 'Pulls the covariance estimate toward a scaled identity matrix, stabilizing it when n is small.',
          tuning:
            'Default None. "auto" applies the Ledoit-Wolf estimate and is the sane starting point whenever ' +
            'observations per class are not comfortably above the number of features. Only "lsqr" and "eigen" ' +
            'support it — pairing it with the default "svd" solver silently does nothing.',
        },
        {
          name: 'n_components (LDA)',
          what: 'Number of discriminant directions kept by transform(); does not affect fit or predict.',
          tuning:
            'Capped at n_classes − 1, because K class means span an affine subspace of at most K − 1 ' +
            'dimensions. Use 2 for a scatter plot of a multi-class problem.',
        },
        {
          name: 'reg_param (QDA)',
          what: 'Regularizes each per-class covariance toward the identity matrix.',
          tuning:
            'Default 0.0. Raise it as soon as any class has few observations relative to the number of ' +
            'features, which is where QDA falls over first — a singular per-class covariance.',
        },
      ],
      whenToUse: [
        'Classes look like roughly Gaussian blobs and you have few observations per class, where LDA is stable and logistic regression is noisy',
        'You want a supervised projection to at most n_classes − 1 dimensions, for a plot or as input to another model',
        'Observations per class are not much larger than the number of features, and you can lean on shrinkage="auto" to stabilize the covariance',
        'You need a closed-form classifier with no iterative optimization and no convergence to monitor',
      ],
      whenNotToUse: [
        'Features are strongly non-Gaussian within a class — heavy skew, hard bounds, or one-hot dummy columns',
        'A class has fewer observations than features, where its covariance estimate is singular; this hits QDA first and hardest',
        'The true boundary is more complex than linear or quadratic, e.g. multi-modal classes or a checkerboard structure',
        'Outliers are present: both the means and the covariances are non-robust, and one extreme point moves the boundary',
      ],
      facets: {
        task: ['classification', 'dimensionality-reduction'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities',
      },
      math: {
        latex: [
          'P(y = k \\mid x) \\;\\propto\\; \\pi_k \\, \\mathcal{N}\\!\\left(x \\mid \\mu_k, \\Sigma_k\\right)',
          '\\delta_k(x) = x^\\top \\Sigma^{-1} \\mu_k - \\tfrac{1}{2} \\mu_k^\\top \\Sigma^{-1} \\mu_k + \\log \\pi_k',
          '(x - \\mu_k)^\\top \\Sigma^{-1} (x - \\mu_k)',
        ],
        notes:
          'The second line only exists because of the shared-covariance assumption: with one common Σ the ' +
          'quadratic term in x is identical for every class and cancels when you compare two of them, leaving ' +
          'a score that is linear in x. Drop the assumption and it does not cancel, which is precisely why QDA ' +
          'boundaries curve. The third line is the Mahalanobis distance — scikit-learn notes that LDA amounts ' +
          'to assigning a point to the closest class mean under that distance, after adjusting for the class ' +
          'priors. The cost side of the trade is parameter count: a shared Σ has p(p+1)/2 free parameters, ' +
          'while QDA needs that many for every one of the K classes.',
      },
      complexity: {
        train:
          'O(n·p² + p³) — accumulating scatter matrices and factorizing them; scikit-learn\'s default "svd" ' +
          'solver avoids forming the covariance matrix explicitly, which helps when p is large',
        predict: 'O(p·K) per sample for LDA with precomputed discriminants; O(K·p²) for QDA',
      },
      code: [
        'from sklearn.discriminant_analysis import (',
        '    LinearDiscriminantAnalysis,',
        '    QuadraticDiscriminantAnalysis,',
        ')',
        '',
        '# Shrinkage needs the lsqr or eigen solver — it is silently ignored with svd.',
        'lda = LinearDiscriminantAnalysis(solver="lsqr", shrinkage="auto")',
        'lda.fit(X_train, y_train)',
        'print(lda.score(X_test, y_test))',
        '',
        '# Supervised 2-D projection for plotting (at most n_classes - 1 components).',
        'proj = LinearDiscriminantAnalysis(n_components=2).fit_transform(X_train, y_train)',
        '',
        '# Per-class covariances instead of one shared one; regularize when classes are small.',
        'qda = QuadraticDiscriminantAnalysis(reg_param=0.1).fit(X_train, y_train)',
      ].join('\n'),
      // distance-metrics is the genuine cross-body link: scikit-learn's LDA/QDA guide points out
      // that LDA's decision rule reduces to a Mahalanobis distance to each class mean, which is
      // one of the metrics catalogued on Venus.
      related: ['logistic-regression', 'naive-bayes', 'distance-metrics'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Linear and Quadratic Discriminant Analysis', url: 'https://scikit-learn.org/stable/modules/lda_qda.html' },
          { title: 'scikit-learn API — QuadraticDiscriminantAnalysis', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.discriminant_analysis.QuadraticDiscriminantAnalysis.html' },
        ],
        papers: [
          {
            title: 'The Use of Multiple Measurements in Taxonomic Problems',
            url: 'https://doi.org/10.1111/j.1469-1809.1936.tb02137.x',
            year: 1936,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 4 — Linear Methods for Classification',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
  ],
} satisfies Body;
