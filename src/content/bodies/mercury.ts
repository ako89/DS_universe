/**
 * Mercury — Linear & Probabilistic Foundations. See PLAN.md §3 for the full moon list.
 *
 * Phase 2 pressure-test content: only `linear-regression` is written here, to exercise
 * types/content.ts before it's frozen (PLAN.md Phase 2). The other 8 moons listed for Mercury
 * in PLAN.md §3 are Phase 3 work — this file is not complete, by design.
 *
 * `related` points at the only other two entries that exist yet (dbscan, self-attention) so
 * `tools/validate-content.ts`'s "every related id resolves" check has something real to check
 * against. That is not a genuine algorithmic relationship in dbscan's case — see the comment
 * above `related` below. Phase 3's cross-link pass (PLAN.md Phase 3) replaces these with real
 * neighbours (ridge, gradient descent, generalized linear models, ...) once they exist.
 *
 * `eraRange` is [1805, 1805] — degenerate on purpose. It should span Mercury's earliest to
 * latest moon, but only one moon has been researched and written so far; widen it as Phase 3
 * adds the rest rather than guessing an end date now.
 *
 * Researched via web search (Legendre's 1805 priority, Gauss's earlier private use and 1809
 * publication, the resulting priority dispute; scikit-learn's documented solver and complexity)
 * — see the commit message for the sources consulted. This session's WebFetch tool could not
 * reach any external host (network egress policy for this environment), so sources were read
 * through search-result excerpts rather than full page fetches; re-verify with `npm run
 * check-links` and a spot read once that tool exists (Phase 3) and in an environment with full
 * web access.
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
  eraRange: [1805, 1805],
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
      // Only two other entries exist yet (Phase 2 pressure test) — see file header. dbscan is
      // an honest contrast (parametric closed-form regression vs. non-parametric density-based
      // clustering); self-attention is a genuine pedagogical link (its output is also a linear
      // combination of value vectors, just with data-dependent rather than fixed weights).
      related: ['dbscan', 'self-attention'],
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
  ],
} satisfies Body;
