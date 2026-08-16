/**
 * Mars — Ensembles. See PLAN.md §3 for the moon list (8 moons, all written here).
 *
 * These eight entries are the ones most at risk of blurring together, since every one of them is
 * some flavour of "combine many trees". Each was written to own exactly one distinction:
 *
 *   bagging            variance reduction by resampling the rows
 *   random-forest      bagging PLUS a random feature subset at every split
 *   extra-trees        random split thresholds too, and the whole training set instead of a bootstrap
 *   adaboost           reweighting misclassified examples; greedily minimises exponential loss
 *   gradient-boosting  fitting each learner to the negative gradient of an arbitrary differentiable loss
 *   xgboost            the regularised, second-order, sparsity-aware implementation of that idea
 *   lightgbm-catboost  histogram binning + leaf-wise growth; ordered target statistics for categoricals
 *   stacking           a meta-learner trained on out-of-fold predictions of heterogeneous models
 *
 * `eraRange` is [1992, 2017]: Wolpert's stacked generalization (Neural Networks 5(2), 1992) is the
 * earliest moon; LightGBM (NIPS 2017) and CatBoost (arXiv 1706.09516, 2017) are the latest.
 *
 * Dates deliberately attribute the *journal* publication, not the earlier technical report or
 * conference preprint, and both are cited where they differ:
 *   - bagging: 1996 (Machine Learning 24(2):123-140), though Berkeley TR 421 is dated Sept 1994.
 *   - adaboost: 1997 (JCSS 55(1):119-139); a preliminary version appeared at EuroCOLT 1995.
 *   - extra-trees: 2006 (Machine Learning 63:3-42); accepted Nov 2005, published online Mar 2006.
 *
 * Facets for `handlesMissing` / `handlesCategorical` describe the *canonical* implementation of
 * each method, which is why gradient-boosting is false/false (sklearn's classic
 * GradientBoostingClassifier) while xgboost and lightgbm-catboost are true/true (documented native
 * support). sklearn's HistGradientBoosting* estimators do have both, and that is said in prose
 * rather than smuggled into the classic entry's facets, where it would mislead the advisor.
 *
 * `related` uses only ids that exist in this content batch (Mercury/Venus/Terra/Mars + the two
 * Phase 2 entries). Links wanted but not yet writable are left as `//` comments for the cross-link
 * pass.
 *
 * Every entry was written from opened sources — Breiman's own PDFs for bagging and random forests,
 * Geurts et al. for extra-trees, Schapire's "Explaining AdaBoost" for the AdaBoost algorithm box,
 * the XGBoost paper and docs for the regularised objective and complexity, and current library
 * documentation for every hyperparameter default quoted. Defaults are as documented at the time of
 * writing; re-check them, since several (RandomForest `max_features`, AdaBoost's `algorithm`) have
 * changed across library versions.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'mars',
  name: 'Mars',
  segment: 'Ensembles',
  hook: 'Many mediocre models, combined on purpose, beating any single model you could have tuned instead.',
  summary:
    'Mars is where prediction stops being about finding the one right model. Every method here builds a ' +
    'committee out of weak or unstable learners — usually trees — and the interesting question becomes how ' +
    'you make the members disagree: resample the rows, hide features at each split, randomise the split ' +
    'itself, reweight the mistakes, or chase the residual. The two families split cleanly. Bagging-style ' +
    'methods build members in parallel and average away variance; boosting builds them in sequence, each one ' +
    'correcting the last, and drives down bias at the cost of being able to overfit.',
  eraRange: [1992, 2017],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'bagging',
      name: 'Bagging',
      aliases: ['bootstrap aggregating'],
      tier: 1,
      year: 1996,
      difficulty: 2,
      hook: 'Refits one unstable model on many bootstrap resamples and averages them, cancelling the noise.',
      intuition:
        'A single deep decision tree is jumpy. Move a handful of training rows and the top split can change, ' +
        'and everything below it changes with it. That jumpiness is not bias — the tree is not systematically ' +
        'wrong — it is variance, error that comes from the particular sample you happened to collect. Bagging ' +
        'exploits that. Draw a new training set the same size as the original by sampling rows with ' +
        'replacement, fit a tree to it, and repeat a few hundred times. Each tree sees a slightly different ' +
        'world and makes slightly different mistakes, so averaging their predictions (or taking a majority ' +
        'vote) lets the mistakes cancel while the signal they agree on survives. The catch is that this only ' +
        'works if the base learner is unstable. Breiman showed that bagging nearest neighbours changes almost ' +
        'nothing, because resampling barely moves a stable predictor, and that bagging an already-stable ' +
        'method can make it slightly worse.',
      howItWorks: {
        summary:
          'Draw many bootstrap resamples of the training set, fit an independent copy of the base learner to ' +
          'each, and aggregate their predictions by averaging or plurality vote.',
        steps: [
          'Draw a bootstrap sample: n rows sampled with replacement from the n-row training set.',
          'Fit the base learner — typically a fully grown, unpruned tree — on that sample alone.',
          'Repeat for B independent bootstrap samples; the fits are mutually independent, so run them in parallel.',
          'For regression, average the B predictions; for classification, take the plurality vote or average the class probabilities.',
          'Estimate generalisation error out-of-bag: score each row using only the trees whose bootstrap sample excluded it.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_estimators',
          what: 'Number of bootstrap replicates, and so of base models fitted. Defaults to 10 in sklearn.',
          tuning:
            'More is never worse for accuracy, only for time and memory — the averaged prediction converges ' +
            'rather than overfitting. Raise it until the validation score flattens; the default of 10 is ' +
            'usually too low for trees.',
        },
        {
          name: 'estimator',
          what: 'The base learner being bagged. Defaults to an unpruned DecisionTreeClassifier in sklearn.',
          tuning:
            'Choose something deliberately high-variance and low-bias — a fully grown tree. Do not prune it: ' +
            'pruning trades variance for bias, and the averaging is already handling the variance.',
        },
        {
          name: 'max_samples',
          what: 'Size of each resample, as a count or a fraction of the training set.',
          tuning:
            'Leave at the full size for the classic method. Shrink it only to cut training time on large ' +
            'data, accepting weaker individual models in exchange.',
        },
      ],
      whenToUse: [
        'Your base learner is high-variance — a deep unpruned tree whose structure changes when you resample the data',
        'A single tree already gets close to the accuracy you need and you want the same model with less run-to-run instability',
        'You want a held-out error estimate without giving up rows to a validation split — use the out-of-bag score',
        'You have cores to spare: every member is fitted independently, so wall-clock cost is near-flat in the number of trees',
      ],
      whenNotToUse: [
        'The base learner is stable — k-nearest neighbours, linear or ridge regression — where resampling barely perturbs the fit and bagging buys nothing',
        'The error is dominated by bias rather than variance; averaging many similarly-wrong models leaves them wrong, so boost instead',
        'You need to show a stakeholder the actual decision rule — a bag of 200 trees has no single readable structure',
        'You are already reaching for random forest, which is bagging plus per-split feature sampling and is strictly the better default for trees',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'averaged-prediction-or-majority-vote',
      },
      math: {
        latex: [
          '\\varphi_A(x) = \\mathbb{E}_{\\mathcal{L}}\\, \\varphi(x, \\mathcal{L})',
          '\\left[ \\mathbb{E}_{\\mathcal{L}}\\, \\varphi(x, \\mathcal{L}) \\right]^2 \\le \\mathbb{E}_{\\mathcal{L}}\\, \\varphi^2(x, \\mathcal{L})',
          '\\Pr(\\text{row } n \\text{ appears in a bootstrap sample}) \\to 1 - e^{-1} \\approx 0.632',
        ],
        notes:
          'The gap between the two sides of the inequality is the variance of the predictor, and it is exactly ' +
          'what aggregation recovers — which is why instability is the precondition, not a nice-to-have. Note ' +
          'the bait-and-switch in the second line of the argument: the ideal aggregate averages over the true ' +
          'distribution, while bagging averages over the empirical one. For an unstable learner the variance ' +
          'reduction dominates that substitution; for a stable one it does not, and bagging can lose. The ' +
          '0.632 figure is why out-of-bag scoring works: each tree misses about 37% of the rows, and those ' +
          'rows are a free validation set for it.',
      },
      complexity: {
        train: 'B times the cost of one base fit, and embarrassingly parallel; for trees, O(B · p · n log n)',
        predict: 'O(B · depth) — every member must be evaluated and combined',
      },
      code: [
        'from sklearn.ensemble import BaggingClassifier',
        'from sklearn.tree import DecisionTreeClassifier',
        '',
        'bag = BaggingClassifier(',
        '    estimator=DecisionTreeClassifier(),   # deliberately unpruned: high variance is the point',
        '    n_estimators=200,                     # sklearn defaults to only 10',
        '    bootstrap=True,',
        '    oob_score=True,                       # free held-out estimate, no validation split needed',
        '    n_jobs=-1,',
        '    random_state=0,',
        ')',
        'bag.fit(X_train, y_train)',
        '',
        'print(bag.oob_score_)                     # scored on the ~37% of rows each tree never saw',
      ].join('\n'),
      // Cross-body: decision-trees is the base learner this is built on; k-nearest-neighbors is the
      // honest negative result — Breiman's own paper shows bagging kNN changes essentially nothing.
      // Cross-link pass: add `cross-validation` (Belt) once written — the OOB estimate is its rival.
      related: ['random-forest', 'decision-trees', 'k-nearest-neighbors', 'stacking'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Bagging meta-estimator',
            url: 'https://scikit-learn.org/stable/modules/ensemble.html',
          },
          {
            title: 'scikit-learn API — BaggingClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.BaggingClassifier.html',
          },
        ],
        papers: [
          {
            title: 'Bagging Predictors (Machine Learning 24(2):123-140)',
            url: 'https://doi.org/10.1007/BF00058655',
            year: 1996,
          },
          {
            title: 'Bagging Predictors — Berkeley Technical Report No. 421',
            url: 'https://www.stat.berkeley.edu/~breiman/bagging.pdf',
            year: 1994,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 8 — Model Inference and Averaging',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'random-forest',
      name: 'Random Forest',
      aliases: ['random forests', 'Forest-RI'],
      tier: 1,
      year: 2001,
      difficulty: 2,
      hook: 'Bagged trees that also hide most features at each split, so they disagree enough for averaging to pay.',
      intuition:
        'Bagging trees has a ceiling, and the reason is correlation. If one feature is strongly predictive, ' +
        'every tree in the bag picks it for the root split no matter which rows it was handed. The trees end ' +
        'up looking alike, make the same mistakes, and averaging near-identical mistakes does not remove them. ' +
        'Random forests break that agreement with a second, cheaper source of randomness: at every split, the ' +
        'tree may only consider a small random subset of the features. The dominant feature is simply absent ' +
        'from many splits, so weaker features get their turn, and the trees end up structurally different. ' +
        'Each individual tree is a little worse than it would have been — you took away its best option — but ' +
        'the forest is better, because the errors now cancel instead of reinforcing. Breiman made that ' +
        'trade-off explicit: the error bound depends on the strength of the individual trees and on the ' +
        'correlation between them, and you can pay a little strength for a lot of decorrelation.',
      howItWorks: {
        summary:
          'Grow many unpruned trees, each on its own bootstrap sample, and at every node restrict the split ' +
          'search to a fresh random subset of the features; average the resulting predictions.',
        steps: [
          'Draw a bootstrap sample of the training rows for this tree.',
          'At each node, select a random subset of max_features candidate features — freshly, per node.',
          'Find the best split among only those candidates and split on it.',
          'Grow the tree fully, without pruning; repeat for n_estimators trees.',
          'Predict by averaging class probabilities (sklearn) or by plurality vote (Breiman) across trees.',
          'Read the out-of-bag error and feature importances off the trees that excluded each row.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_estimators',
          what: 'Number of trees in the forest. sklearn defaults to 100.',
          tuning:
            'Monotone: more trees never hurt accuracy, they cost time. Increase until the OOB or validation ' +
            'score stops moving, then stop. This is not a regularisation knob.',
        },
        {
          name: 'max_features',
          what:
            'How many features are considered at each split. sklearn defaults to "sqrt" for classification ' +
            'and 1.0 (all features) for regression.',
          tuning:
            'This is the real knob — it sets the strength/correlation trade-off. Lower it when features are ' +
            'many and correlated, raise it when only a few features carry signal and restricting the search ' +
            'starves the trees. Note the default changed from "auto" to "sqrt" in scikit-learn 1.1.',
        },
        {
          name: 'max_depth / min_samples_leaf',
          what: 'Limits on tree growth. Both are unrestricted by default (max_depth=None, min_samples_leaf=1).',
          tuning:
            'Usually leave them off — averaging handles the variance that pruning would. Constrain them only ' +
            'when memory or prediction latency forces it, or when labels are very noisy.',
        },
        {
          name: 'oob_score',
          what: 'Whether to compute the out-of-bag estimate of generalisation error. Defaults to False.',
          tuning:
            'Turn it on. It costs one extra pass and gives a held-out score without spending rows on a ' +
            'validation split — worth most when data is scarce.',
        },
      ],
      whenToUse: [
        'You want a strong tabular baseline in one fit with almost no tuning — the defaults are usually within a few points of tuned performance',
        'Features are a mix of scales and units and you do not want to build a scaling pipeline',
        'You need a ranked list of which features matter more than you need per-prediction explanations',
        'Rows number in the thousands to low millions and you have multiple cores — trees are fitted independently, so n_jobs=-1 scales nearly linearly',
      ],
      whenNotToUse: [
        'You need the last point of accuracy on tabular data — gradient boosting usually wins there, at the cost of tuning',
        'Prediction latency or model size is constrained: 500 unpruned trees is tens of megabytes and every one must be evaluated per prediction',
        'You must extrapolate beyond the range of the training targets — a forest can only ever predict an average of values it has already seen, so trends in time series get flattened',
        'Features are very high-dimensional and sparse, such as raw text counts, where a linear model is both faster and more accurate',
        'You need a model whose decision rule a regulator can read line by line — use a single pruned tree or logistic regression',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities-or-continuous-value',
      },
      math: {
        latex: [
          'PE^{*} \\le \\bar{\\rho}\\,(1 - s^{2}) / s^{2}',
          '\\text{max\\_features} = \\lfloor \\sqrt{p} \\rfloor \\quad (\\text{classification default})',
        ],
        notes:
          'The bound is loose, and Breiman says so, but it is the design document for the whole method: ' +
          'generalisation error is controlled by the mean correlation between trees and by their individual ' +
          'strength. Every knob in a random forest moves one of those two quantities. Lowering max_features ' +
          'drives the correlation down faster than it drives strength down, which is the entire reason ' +
          'per-split feature sampling exists and why a forest beats a plain bag of trees. Note also what the ' +
          'bound does not contain: the number of trees. Adding trees makes the estimate converge, it does not ' +
          'make it overfit.',
      },
      complexity: {
        train: 'O(n_estimators · max_features · n log n) for n rows, parallel across trees',
        predict: 'O(n_estimators · depth) per row, roughly O(n_estimators · log n) for balanced trees',
      },
      code: [
        'from sklearn.ensemble import RandomForestClassifier',
        '',
        'rf = RandomForestClassifier(',
        '    n_estimators=500,        # more trees only converge, they do not overfit',
        '    max_features="sqrt",     # the decorrelation knob; the actual default for classification',
        '    oob_score=True,          # held-out score without spending rows on a split',
        '    n_jobs=-1,',
        '    random_state=0,',
        ')',
        'rf.fit(X_train, y_train)',
        '',
        'print(rf.oob_score_)',
        '',
        '# impurity-based importances are biased toward high-cardinality features;',
        '# prefer permutation importance on held-out data when the ranking matters',
        'print(sorted(zip(rf.feature_importances_, X_train.columns), reverse=True)[:10])',
      ].join('\n'),
      // Cross-body: decision-trees / tree-pruning are what a forest deliberately declines to do
      // (grow fully, never prune, because averaging replaces pruning as the variance control).
      // Cross-link pass: add `permutation-importance` and `shap` (Pallas) — both are the standard
      // fix for the biased impurity importances noted in `code`.
      related: ['bagging', 'extra-trees', 'decision-trees', 'tree-pruning', 'gradient-boosting'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Random forests and other randomized tree ensembles',
            url: 'https://scikit-learn.org/stable/modules/ensemble.html#random-forests-and-other-randomized-tree-ensembles',
          },
          {
            title: 'scikit-learn API — RandomForestClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html',
          },
        ],
        papers: [
          {
            title: 'Random Forests (Machine Learning 45:5-32)',
            url: 'https://doi.org/10.1023/A:1010933404324',
            year: 2001,
          },
          {
            title: 'Random Forests — author manuscript, Berkeley Statistics',
            url: 'https://www.stat.berkeley.edu/~breiman/randomforest2001.pdf',
            year: 2001,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 15 — Random Forests',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'extra-trees',
      name: 'Extremely randomized trees',
      aliases: ['extra-trees', 'ExtraTrees'],
      tier: 2,
      year: 2006,
      difficulty: 3,
      hook: 'Takes the randomness one step past a random forest: the split threshold itself is drawn at random.',
      intuition:
        'A random forest still optimises. Having picked its random shortlist of features at a node, it scans ' +
        'every candidate threshold on each of them and keeps the best. That scan is where most of the training ' +
        'time goes, and it is also a place the tree can chase noise. Extra-trees stop optimising: for each ' +
        'candidate feature they draw a single cut-point uniformly at random between that feature\'s smallest ' +
        'and largest value in the node, and simply keep whichever of those random splits scores best. Two ' +
        'differences from a random forest follow, and Geurts, Ernst and Wehenkel name both: cut-points are ' +
        'chosen fully at random, and each tree is grown on the whole training set rather than a bootstrap ' +
        'replica. The result is trees that are individually weaker and mutually much less correlated, fitted ' +
        'considerably faster because nothing is sorted or scanned. Variance drops further than in a forest; ' +
        'bias rises a little.',
      howItWorks: {
        summary:
          'Grow unpruned trees on the full training set, and at each node draw one random cut-point per ' +
          'candidate feature, keeping the best of those random splits.',
        steps: [
          'At each node, select K candidate features at random from those that are not constant in the node.',
          'For each candidate, draw one cut-point uniformly between its minimum and maximum value within that node.',
          'Keep whichever of those K random splits scores best, and recurse until a node holds fewer than n_min samples.',
        ],
      },
      whenToUse: [
        'Training time on a random forest is the bottleneck and you want the same shape of model for less compute',
        'Features are numeric and continuous, where drawing a random threshold is meaningful',
        'The target is noisy enough that exhaustively optimising each threshold is fitting noise rather than signal',
      ],
      whenNotToUse: [
        'Only a few features carry signal, where random thresholds mostly waste splits and a forest\'s optimised cut-points earn their cost',
        'You need out-of-bag error estimates — sklearn sets bootstrap=False by default, so there are no out-of-bag rows',
        'Individual trees must stand up on their own; extra-trees are typically larger and individually weaker than forest trees',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities-or-continuous-value',
      },
      // The paper's own default for K is sqrt(p) in classification and p (all features) in
      // regression; sklearn instead defaults max_features to "sqrt" for both, and n_min corresponds
      // to min_samples_split (2 for classification, 5 for regression in the paper's experiments).
      related: ['random-forest', 'bagging', 'decision-trees'],
      references: {
        free: [
          {
            title: 'scikit-learn API — ExtraTreesClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.ExtraTreesClassifier.html',
          },
          {
            title: 'scikit-learn user guide — Extremely Randomized Trees',
            url: 'https://scikit-learn.org/stable/modules/ensemble.html#random-forests-and-other-randomized-tree-ensembles',
          },
        ],
        papers: [
          {
            title: 'Extremely randomized trees (Machine Learning 63:3-42)',
            url: 'https://doi.org/10.1007/s10994-006-6226-1',
            year: 2006,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'adaboost',
      name: 'AdaBoost',
      aliases: ['adaptive boosting'],
      tier: 1,
      year: 1997,
      difficulty: 3,
      hook: 'Trains weak learners in sequence, each one re-weighting the examples the previous ones got wrong.',
      intuition:
        'Bagging builds its members in parallel and in ignorance of each other. AdaBoost builds them in a ' +
        'queue, and each new member is told where the queue has been failing. Start by giving every training ' +
        'example equal weight and fit a deliberately feeble model — classically a decision stump, a tree with ' +
        'exactly one split. It gets much of the data right and some of it wrong. Now increase the weight on ' +
        'the examples it got wrong, decrease the weight on the ones it got right, and fit the next stump to ' +
        'that reweighted problem. It is forced to attend to what the first one could not do. Repeat. At the ' +
        'end the stumps vote, but not equally: each one\'s vote is scaled by how accurate it was on the ' +
        'distribution it was trained against. The ensemble is built by bias reduction, not variance ' +
        'reduction, which is why boosting can turn learners barely better than coin flips into a strong ' +
        'classifier — and why it can also chase label noise into the ground.',
      howItWorks: {
        summary:
          'Maintain a weight distribution over training examples; each round, fit a weak learner to that ' +
          'distribution, score it, up-weight what it misclassified, and add it to a weighted vote.',
        steps: [
          'Initialise the distribution D₁ uniformly: every one of the m examples gets weight 1/m.',
          'Fit a weak learner h_t to the training set under the current distribution D_t.',
          'Measure its weighted error ε_t — the total weight of the examples it misclassifies.',
          'Set its vote α_t = ½·ln((1 − ε_t)/ε_t): near zero for a coin-flip learner, large for an accurate one.',
          'Reweight: multiply each example\'s weight by exp(−α_t·y_i·h_t(x_i)) and renormalise, so misclassified examples gain weight.',
          'Repeat for T rounds and output the sign of the α-weighted sum of the weak hypotheses.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_estimators',
          what: 'Number of boosting rounds. sklearn defaults to 50.',
          tuning:
            'Unlike bagging this can overfit, so tune it against a validation curve rather than pushing it up. ' +
            'AdaBoost often keeps improving test error long after training error hits zero, so stop on the ' +
            'validation score, not the training one.',
        },
        {
          name: 'learning_rate',
          what: 'Shrinkage applied to each learner\'s contribution. sklearn defaults to 1.0.',
          tuning:
            'Trades off directly against n_estimators: halve it and you need roughly twice the rounds. Drop ' +
            'below 1.0 when the ensemble is overfitting or the boosting path looks unstable.',
        },
        {
          name: 'estimator',
          what: 'The weak learner. sklearn defaults to a DecisionTreeClassifier with max_depth=1 — a stump.',
          tuning:
            'Keep it weak; that is structural, not a shortcut. Going to depth 2 or 3 lets the ensemble model ' +
            'feature interactions but converges in fewer rounds and overfits sooner.',
        },
      ],
      whenToUse: [
        'You have a fast, weak, high-bias learner and want to raise its accuracy without inventing a better one',
        'The dataset is small to medium and clean, with labels you trust',
        'You want a boosted model with essentially two knobs, and gradient boosting\'s parameter surface is more than the problem warrants',
        'Interactions between features are limited, so depth-1 or depth-2 base learners are expressive enough',
      ],
      whenNotToUse: [
        'Labels are noisy or contain mislabelled rows — exponential loss makes the weight on a persistently misclassified example grow without bound, so the ensemble spends its capacity on the errors',
        'There are strong outliers in the features for the same reason; use a boosting method with a robust loss such as Huber instead',
        'You want a specific objective — ranking, Poisson counts, quantiles — since AdaBoost is tied to exponential loss where gradient boosting takes any differentiable one',
        'Training must be parallelised across the ensemble: rounds are strictly sequential, each depending on the previous round\'s weights',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'weighted-vote-class-label',
      },
      math: {
        latex: [
          '\\varepsilon_t = \\Pr_{i \\sim D_t}\\left[ h_t(x_i) \\ne y_i \\right]',
          '\\alpha_t = \\tfrac{1}{2} \\ln\\!\\left( \\frac{1 - \\varepsilon_t}{\\varepsilon_t} \\right)',
          'D_{t+1}(i) = \\frac{D_t(i) \\exp\\!\\left( -\\alpha_t\\, y_i\\, h_t(x_i) \\right)}{Z_t}',
          'H(x) = \\mathrm{sign}\\!\\left( \\sum_{t=1}^{T} \\alpha_t\\, h_t(x) \\right)',
        ],
        notes:
          'Nothing in the original derivation mentions a loss function, yet AdaBoost turns out to greedily ' +
          'minimise the exponential loss (1/m)·Σ exp(−y_i·F(x_i)) — a connection first observed by Breiman ' +
          'and developed by Friedman, Hastie and Tibshirani, and the bridge to gradient boosting, which ' +
          'generalises the same move to any differentiable loss. That framing also explains the failure mode: ' +
          'exponential loss grows without bound on a persistently misclassified point, so a mislabelled row ' +
          'accumulates weight indefinitely. It does not, however, explain why AdaBoost so often keeps ' +
          'improving test error after training error reaches zero; minimising exponential loss is not by ' +
          'itself sufficient for good generalisation, and the standard account of that behaviour is the ' +
          'margins theory rather than the loss.',
      },
      complexity: {
        train: 'O(T · cost of one weak fit); strictly sequential in T, so no parallelism across rounds',
        predict: 'O(T) — every weak hypothesis is evaluated and summed',
      },
      code: [
        'from sklearn.ensemble import AdaBoostClassifier',
        'from sklearn.tree import DecisionTreeClassifier',
        '',
        'ada = AdaBoostClassifier(',
        '    estimator=DecisionTreeClassifier(max_depth=1),   # a stump: weak on purpose',
        '    n_estimators=200,',
        '    learning_rate=0.5,      # lower rate needs more rounds; they trade off directly',
        '    random_state=0,',
        ')',
        'ada.fit(X_train, y_train)',
        '',
        '# boosting CAN overfit — read the staged scores rather than trusting the last one',
        'import numpy as np',
        'scores = [s for s in ada.staged_score(X_val, y_val)]',
        'print(np.argmax(scores) + 1, max(scores))          # best round, best validation score',
      ].join('\n'),
      // Cross-body: decision-trees supplies the stump; logistic-regression is the honest contrast —
      // exponential loss vs. log loss on the same margin y·F(x).
      // Cross-link pass: add `class-imbalance` (Belt) — reweighting interacts badly with it.
      related: ['gradient-boosting', 'decision-trees', 'logistic-regression', 'random-forest'],
      references: {
        free: [
          {
            title: 'scikit-learn API — AdaBoostClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.AdaBoostClassifier.html',
          },
          {
            title: 'Explaining AdaBoost (Schapire) — algorithm box, exponential loss and the margins account',
            url: 'https://www.schapire.net/papers/explaining-adaboost.pdf',
          },
        ],
        papers: [
          {
            title:
              'A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting (JCSS 55(1):119-139)',
            url: 'https://doi.org/10.1006/jcss.1997.1504',
            year: 1997,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 10 — Boosting and Additive Trees',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'gradient-boosting',
      name: 'Gradient boosting machines',
      aliases: ['GBM', 'gradient boosted trees', 'GBDT', 'MART'],
      tier: 1,
      year: 2001,
      difficulty: 4,
      hook: 'Fits each new tree to the negative gradient of the loss, so any differentiable objective can be boosted.',
      intuition:
        'AdaBoost works, but it is welded to one loss function and one way of expressing "what went wrong" — ' +
        'example weights. Friedman\'s reframing is that boosting is gradient descent, performed in the space ' +
        'of functions rather than the space of parameters. Start with a constant prediction. Ask the loss ' +
        'function, for each training row, which direction the prediction should move to reduce the loss ' +
        'fastest — that is the negative gradient at that row, and for squared error it is exactly the ' +
        'residual. Fit a small regression tree to those numbers. That tree is an approximation of the descent ' +
        'direction, expressible on data you have not seen yet. Take a fraction of a step along it, then ' +
        'recompute the gradients and do it again. Because the only thing the loss needs to supply is a ' +
        'derivative, the same machinery boosts squared error, absolute error, Huber, log loss, Poisson counts ' +
        'or a ranking objective without changing the algorithm.',
      howItWorks: {
        summary:
          'Repeatedly compute the negative gradient of the loss at the current predictions, fit a small ' +
          'regression tree to it, and add a shrunken version of that tree to the running model.',
        steps: [
          'Initialise the model with the constant that minimises the loss over all training rows.',
          'For each row, compute the pseudo-residual: the negative gradient of the loss with respect to the current prediction.',
          'Fit a shallow regression tree to those pseudo-residuals — it is regression even for classification.',
          'Solve for the value in each leaf that minimises the actual loss for the rows landing there.',
          'Add the tree to the model scaled by the learning rate ν, so each step is deliberately partial.',
          'Repeat for n_estimators rounds, watching a validation score to decide when to stop.',
        ],
      },
      hyperparameters: [
        {
          name: 'learning_rate',
          what: 'Shrinkage ν applied to each tree\'s contribution. sklearn defaults to 0.1.',
          tuning:
            'Interacts strongly with n_estimators — smaller values need more trees for the same training ' +
            'error. The scikit-learn guide follows Hastie et al. in recommending a small constant ' +
            '(learning_rate ≤ 0.1) with n_estimators set large enough that early stopping decides the count.',
        },
        {
          name: 'n_estimators',
          what: 'Number of boosting rounds. sklearn defaults to 100.',
          tuning:
            'This is the main overfitting knob, unlike in a random forest. Set it high and control it with ' +
            'n_iter_no_change and validation_fraction (default 0.1) so early stopping picks the round.',
        },
        {
          name: 'max_depth',
          what: 'Depth of each regression tree. sklearn defaults to 3.',
          tuning:
            'A tree of depth h can capture interactions of order h, so this is an interaction-order knob, ' +
            'not a capacity knob. Stay in the 2-8 range; deeper trees converge in fewer rounds and overfit ' +
            'sooner. max_leaf_nodes=k gives comparable results to max_depth=k−1 and trains faster.',
        },
        {
          name: 'subsample',
          what: 'Fraction of rows drawn without replacement for each round. Defaults to 1.0 (no subsampling).',
          tuning:
            'Setting it below 1.0 gives stochastic gradient boosting, which adds bagging-style variance ' +
            'reduction on top; 0.5 is a typical value. Pair it with a lower learning rate.',
        },
      ],
      whenToUse: [
        'Tabular data with mixed numeric and categorical features where you need better accuracy than a random forest and are willing to tune three or four parameters to get it',
        'Your objective is not plain accuracy — you need log loss, quantiles, Poisson counts, ranking, or a robust regression loss like Huber',
        'Well-calibrated probabilities matter (churn scoring, risk models), since log loss is optimised directly rather than obtained by voting',
        'Rows number in the thousands to hundreds of thousands: at more than roughly ten thousand rows, use sklearn\'s HistGradientBoosting* estimators, which bin features and are orders of magnitude faster',
        'You can explain the model with global tools — feature importances, partial dependence and permutation importance are all standard here',
      ],
      whenNotToUse: [
        'You need to justify individual predictions as a readable rule chain; hundreds of shallow trees are not readable, and post-hoc attributions are an approximation, not the model',
        'You cannot run a proper validation loop — with no early stopping this model will happily overfit, where a random forest would not',
        'Training must be parallel across the ensemble: rounds are sequential by construction, so unlike a forest you cannot buy speed with cores alone',
        'The signal is largely linear and extrapolation matters — trees predict a constant outside the training range, so a linear or regularised linear model is both more accurate and simpler',
        'The dataset is small and noisy relative to the number of features, where boosting fits the noise and a regularised linear model or a random forest is the safer default',
      ],
      facets: {
        task: ['classification', 'regression', 'ranking'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities-or-continuous-value',
      },
      math: {
        latex: [
          'r_{im} = -\\left[ \\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)} \\right]_{F = F_{m-1}}',
          'F_m(x) = F_{m-1}(x) + \\nu \\sum_{j=1}^{J} \\gamma_{jm}\\, \\mathbf{1}(x \\in R_{jm})',
          'L(y, F) = (y - F)^2 \\;\\Rightarrow\\; r_{im} \\propto y_i - F_{m-1}(x_i)',
        ],
        notes:
          'The third line is the sanity check worth carrying: under squared error the negative gradient *is* ' +
          'the ordinary residual, so "fit the next tree to the residuals" is the special case, not the ' +
          'definition. Swap in exponential loss and the procedure reproduces AdaBoost; swap in log loss and ' +
          'you get a properly calibrated classifier. Two consequences follow from ν being a step size rather ' +
          'than a weight. Each tree is fitted to a target that only exists relative to the current model, so ' +
          'rounds cannot be reordered or parallelised. And because the gradients are recomputed every round, ' +
          'nothing stops the model driving training loss toward zero — early stopping is a required part of ' +
          'the method, not a tuning nicety.',
      },
      complexity: {
        train: 'O(n_estimators · p · n log n) for exact split search, strictly sequential in n_estimators',
        predict: 'O(n_estimators · max_depth) per row',
      },
      code: [
        'from sklearn.ensemble import HistGradientBoostingClassifier',
        '',
        '# Hist* bins each feature into ~256 integer bins: orders of magnitude faster',
        '# above ~10k rows, and it handles NaNs and categoricals natively.',
        'gb = HistGradientBoostingClassifier(',
        '    learning_rate=0.05,          # small rate + early stopping beats guessing n_estimators',
        '    max_iter=2000,',
        '    early_stopping=True,',
        '    validation_fraction=0.1,',
        '    n_iter_no_change=25,',
        '    categorical_features="from_dtype",',
        '    random_state=0,',
        ')',
        'gb.fit(X_train, y_train)',
        '',
        'print(gb.n_iter_)                # rounds actually used, chosen by early stopping',
        'proba = gb.predict_proba(X_test)[:, 1]',
      ].join('\n'),
      // Cross-body: regression-trees is the base learner (regression even in classification);
      // logistic-regression is the interpretable baseline you should always fit alongside this, and
      // the loss it optimises is the same log loss.
      // Cross-link pass: add `shap` and `partial-dependence` (Pallas) — the standard way to explain
      // this model — and `cross-validation` / `hyperparameter-search` (Belt).
      related: ['xgboost', 'adaboost', 'lightgbm-catboost', 'regression-trees', 'logistic-regression', 'random-forest'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Gradient Boosting',
            url: 'https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting',
          },
          {
            title: 'scikit-learn API — GradientBoostingClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.GradientBoostingClassifier.html',
          },
        ],
        papers: [
          {
            title: 'Greedy Function Approximation: A Gradient Boosting Machine (Annals of Statistics 29(5):1189-1232)',
            url: 'https://projecteuclid.org/journals/annals-of-statistics/volume-29/issue-5/Greedy-function-approximation-A-gradient-boosting-machine/10.1214/aos/1013203451.full',
            year: 2001,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 10 — Boosting and Additive Trees',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'xgboost',
      name: 'XGBoost',
      aliases: ['extreme gradient boosting'],
      tier: 1,
      year: 2016,
      difficulty: 4,
      hook: 'Gradient boosting rebuilt around a regularised second-order objective and a systems stack for sparse data.',
      intuition:
        'XGBoost is not a new learning idea; it is gradient boosting taken seriously as an engineering and ' +
        'statistics problem, and the two changes it makes are what everyone actually uses today. First, the ' +
        'tree is no longer chosen by a generic impurity rule and then bolted onto the loss. The objective ' +
        'written down includes both the loss and an explicit penalty on the tree — a cost per leaf and a ' +
        'ridge penalty on leaf values — and is approximated to second order, so gradients and curvature ' +
        'together produce a closed-form score for any candidate tree structure. Splits are then chosen to ' +
        'improve that score, which means regularisation is part of split selection rather than an ' +
        'afterthought. Second, missing values are not imputed: each node learns a default direction, so a row ' +
        'with a gap is routed the way that helped most during training. Around those sit sorted column ' +
        'blocks, cache-aware access and out-of-core storage, which is why it runs on data that will not fit ' +
        'in memory.',
      howItWorks: {
        summary:
          'Take a second-order Taylor expansion of any differentiable loss plus an explicit tree penalty, ' +
          'which yields a closed-form optimal leaf weight and a structure score; grow trees by greedily ' +
          'maximising the gain in that score.',
        steps: [
          'At each round, compute the first and second derivatives g_i and h_i of the loss at the current prediction for every row.',
          'Write the round\'s objective as a second-order approximation plus Ω(f) = γT + ½λ‖w‖², penalising leaf count and leaf magnitude.',
          'For a fixed tree structure, the optimal weight of leaf j is −G_j/(H_j + λ) in closed form.',
          'Score any structure by the resulting objective, and score a candidate split by the gain it produces minus γ.',
          'Grow greedily on that gain, using the weighted quantile sketch to propose candidate split points when exact enumeration is too slow.',
          'Send rows with missing values down each node\'s learned default direction, and shrink the finished tree by eta before adding it.',
        ],
      },
      hyperparameters: [
        {
          name: 'eta (learning_rate)',
          what: 'Shrinkage applied to each new tree. The XGBoost default is 0.3.',
          tuning:
            'The library default is high because it is tuned for fast demos, not for accuracy. Drop it to ' +
            '0.01-0.1 for a real model and let early stopping choose the number of rounds.',
        },
        {
          name: 'max_depth',
          what: 'Maximum depth of each tree. Default 6.',
          tuning:
            'Depth 6 is already a lot of interaction order for most tabular problems and is a common source ' +
            'of overfitting. Try 3-8 and treat it as the second parameter to tune after eta.',
        },
        {
          name: 'lambda (reg_lambda) and alpha (reg_alpha)',
          what: 'L2 and L1 penalties on leaf weights. Defaults are lambda=1 and alpha=0.',
          tuning:
            'lambda appears directly in the leaf-weight denominator, so raising it shrinks every leaf toward ' +
            'zero and damps noisy leaves. Reach for it before reducing depth when the model overfits.',
        },
        {
          name: 'gamma (min_split_loss)',
          what: 'Minimum gain in the structure score required to accept a split. Default 0.',
          tuning:
            'A direct pre-pruning knob: with γ > 0 a split must earn its own cost. Raise it on noisy data as ' +
            'an alternative to capping depth.',
        },
        {
          name: 'subsample and colsample_bytree',
          what: 'Row and column sampling fractions per tree. Both default to 1 (no sampling).',
          tuning:
            'Set both to roughly 0.5-0.8 to add bagging-style decorrelation to the boosting. Column sampling ' +
            'is often the more effective of the two on wide tabular data.',
        },
      ],
      whenToUse: [
        'Tabular data of tens of thousands to hundreds of millions of rows where accuracy is the priority and you have a validation set to tune against',
        'Features have missing values you would rather not impute — each node learns a default direction for them from the data',
        'The feature matrix is sparse (one-hot encodings, count data), which the sparsity-aware split finder skips over rather than scanning',
        'You need a specific differentiable objective — log loss, Poisson, Tweedie, pairwise ranking — with regularisation you can actually tune',
        'Training data exceeds memory: block structure and out-of-core storage are designed for exactly that case',
      ],
      whenNotToUse: [
        'You must present the decision rule itself to a regulator or clinician — this is a black box, and SHAP or partial dependence describe it rather than being it',
        'The dataset is small (a few thousand rows) and noisy, where the parameter surface is large enough to overfit through your validation set as you tune',
        'You have no time or infrastructure to tune: the library defaults (eta 0.3, depth 6, no subsampling) are not good defaults for accuracy, unlike a random forest\'s',
        'Data is images, audio or raw text, where a neural network learns the representation instead of you engineering features',
        'You need to extrapolate outside the training range of the target — like all tree ensembles it predicts a constant beyond the data it has seen',
        'The team can only maintain one model and a logistic regression is within a point or two — the accuracy gain rarely justifies the operational cost',
      ],
      facets: {
        task: ['classification', 'regression', 'ranking'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: true,
        outputType: 'class-probabilities-or-continuous-value',
      },
      math: {
        latex: [
          '\\mathcal{L}^{(t)} \\simeq \\sum_{i} \\left[ g_i f_t(x_i) + \\tfrac{1}{2} h_i f_t^2(x_i) \\right] + \\Omega(f_t)',
          '\\Omega(f) = \\gamma T + \\tfrac{1}{2}\\lambda \\lVert w \\rVert^2',
          'w_j^{*} = -\\frac{G_j}{H_j + \\lambda}',
          '\\tilde{\\mathcal{L}}^{*} = -\\frac{1}{2}\\sum_{j=1}^{T} \\frac{G_j^2}{H_j + \\lambda} + \\gamma T',
        ],
        notes:
          'The last expression is the structure score, and it is what separates XGBoost from a generic GBM: ' +
          'it assigns a single number to a whole candidate tree, so split selection optimises the actual ' +
          'regularised objective instead of a proxy impurity. Two things fall straight out of it. λ sits in ' +
          'the denominator, so a leaf holding few or low-curvature rows is automatically shrunk toward zero. ' +
          'And γ is subtracted per leaf, so a split whose gain does not exceed γ is simply never taken — ' +
          'pre-pruning expressed in the objective rather than as a separate pass. Using second derivatives ' +
          'also means the step size adapts to local curvature, which is why XGBoost typically needs fewer ' +
          'rounds than first-order boosting at the same learning rate.',
      },
      complexity: {
        train:
          'O(K·d·‖x‖₀·log n) for the exact greedy algorithm; O(K·d·‖x‖₀ + ‖x‖₀·log n) with the sorted ' +
          'column blocks, where ‖x‖₀ counts non-missing entries, K trees and depth d',
        predict: 'O(K · d) per row',
      },
      code: [
        'import xgboost as xgb',
        '',
        'clf = xgb.XGBClassifier(',
        '    n_estimators=3000,',
        '    learning_rate=0.03,        # the 0.3 default is for speed, not accuracy',
        '    max_depth=4,',
        '    subsample=0.8,',
        '    colsample_bytree=0.8,',
        '    reg_lambda=2.0,            # shrinks leaf weights: -G_j / (H_j + lambda)',
        '    eval_metric="logloss",',
        '    early_stopping_rounds=100,',
        '    enable_categorical=True,   # needs pandas "category" dtype; tree_method hist or approx',
        ')',
        '',
        '# NaNs are left in place on purpose: each node learns a default direction for them',
        'clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)',
        'print(clf.best_iteration)',
      ].join('\n'),
      // Cross-body: regression-trees is the base learner; logistic-regression is the baseline this
      // must beat by enough to justify its operational cost.
      // Cross-link pass: add `shap` (Pallas) — TreeSHAP was built for exactly these models and is
      // the honest answer to "explain it" — plus `hyperparameter-search` (Belt).
      related: ['gradient-boosting', 'lightgbm-catboost', 'regression-trees', 'logistic-regression', 'random-forest'],
      references: {
        free: [
          {
            title: 'XGBoost docs — Introduction to Boosted Trees (the regularised objective and structure score)',
            url: 'https://xgboost.readthedocs.io/en/stable/tutorials/model.html',
          },
          {
            title: 'XGBoost docs — Parameters',
            url: 'https://xgboost.readthedocs.io/en/stable/parameter.html',
          },
          {
            title: 'XGBoost docs — Categorical Data',
            url: 'https://xgboost.readthedocs.io/en/stable/tutorials/categorical.html',
          },
        ],
        papers: [
          {
            title: 'XGBoost: A Scalable Tree Boosting System',
            url: 'https://arxiv.org/abs/1603.02754',
            year: 2016,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 10 — Boosting and Additive Trees',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'lightgbm-catboost',
      name: 'LightGBM & CatBoost',
      aliases: ['LightGBM', 'CatBoost', 'GOSS', 'ordered boosting'],
      tier: 2,
      year: 2017,
      difficulty: 4,
      hook: 'Two boosters that specialised: one for speed on wide data, one for high-cardinality categoricals.',
      intuition:
        'Both start from gradient boosted trees and each picks a different bottleneck. LightGBM attacks ' +
        'speed. It bins every feature into a few hundred integer bins so a split search becomes a histogram ' +
        'scan, and then grows leaf-wise — always splitting whichever leaf promises the largest loss ' +
        'reduction — rather than filling each level evenly. That reaches a lower loss for the same number of ' +
        'leaves, and overfits readily on small data, which is why num_leaves and min_data_in_leaf matter more ' +
        'here than anywhere else. CatBoost attacks categorical features. Encoding a category by its mean ' +
        'target leaks the label, so CatBoost shuffles the rows and computes each row\'s statistic using only ' +
        'the rows before it in that permutation — an ordered target statistic — and applies the same ordering ' +
        'idea to the boosting itself. It also grows symmetric (oblivious) trees, which are far faster to ' +
        'evaluate at prediction time.',
      howItWorks: {
        summary:
          'Both bin features into histograms and boost gradient-fitted trees; LightGBM adds leaf-wise growth ' +
          'and gradient-based sampling, while CatBoost adds permutation-ordered target statistics and ' +
          'symmetric trees.',
        steps: [
          'Bin each feature into a fixed number of integer bins so split search scans a histogram instead of sorted values.',
          'LightGBM: grow leaf-wise, always expanding the leaf with the largest loss reduction, bounded by num_leaves and min_data_in_leaf.',
          'CatBoost: encode each categorical value from a random permutation using only preceding rows, so the encoding cannot see its own label.',
        ],
      },
      whenToUse: [
        'Training time on XGBoost is the binding constraint and the data is wide or has millions of rows — histogram binning plus leaf-wise growth is the specific fix',
        'Categorical features have high cardinality (postcodes, product ids, user ids) where one-hot encoding explodes and naive target encoding leaks',
        'Prediction latency matters at serving time, where CatBoost\'s symmetric trees evaluate substantially faster than arbitrary-structure trees',
      ],
      whenNotToUse: [
        'The dataset is small — leaf-wise growth overfits readily there unless num_leaves and min_data_in_leaf are tuned carefully',
        'A plain gradient boosting or XGBoost model already meets the accuracy and time budget; these are optimisations, not a different class of model',
        'You need the model to be readable rather than fast; nothing here improves interpretability over any other boosted ensemble',
      ],
      facets: {
        task: ['classification', 'regression', 'ranking'],
        dataType: ['tabular'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: true,
        outputType: 'class-probabilities-or-continuous-value',
      },
      // Deliberately no hyperparameter list (tier 2), and the two libraries' defaults differ enough
      // that a merged table would mislead — CatBoost sets learning_rate automatically from the
      // dataset and iteration count, LightGBM does not.
      related: ['xgboost', 'gradient-boosting', 'decision-trees'],
      references: {
        free: [
          {
            title: 'LightGBM docs — Features (histogram binning, leaf-wise growth, categorical splits)',
            url: 'https://lightgbm.readthedocs.io/en/stable/Features.html',
          },
          {
            title: 'LightGBM docs — Parameters Tuning (num_leaves, min_data_in_leaf, overfitting)',
            url: 'https://lightgbm.readthedocs.io/en/stable/Parameters-Tuning.html',
          },
          {
            title: 'CatBoost docs — Transforming categorical features to numerical features',
            url: 'https://catboost.ai/docs/en/concepts/algorithm-main-stages_cat-to-numberic',
          },
          {
            title: 'CatBoost docs — Parameter tuning (symmetric trees, one_hot_max_size, depth)',
            url: 'https://catboost.ai/docs/en/concepts/parameter-tuning',
          },
        ],
        papers: [
          {
            title: 'LightGBM: A Highly Efficient Gradient Boosting Decision Tree (NIPS 2017)',
            url: 'https://proceedings.neurips.cc/paper_files/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html',
            year: 2017,
          },
          {
            title: 'CatBoost: unbiased boosting with categorical features',
            url: 'https://arxiv.org/abs/1706.09516',
            year: 2017,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'stacking',
      name: 'Stacking & blending',
      aliases: ['stacked generalization', 'stacked regression', 'blending'],
      tier: 1,
      year: 1992,
      difficulty: 3,
      hook: 'Trains a second model to combine the out-of-fold predictions of several different first-stage models.',
      intuition:
        'Every other ensemble here combines copies of one algorithm, and combines them by a fixed rule — an ' +
        'average, a majority, a weighted sum. Stacking changes both. The members are deliberately different ' +
        'algorithms: a boosted tree, a regularised linear model, a nearest-neighbour model, whatever brings a ' +
        'different bias. And the combining rule is not fixed, it is learned — a second model is trained to ' +
        'map their predictions to the answer, and it can discover that one member is reliable in one region ' +
        'and useless in another. The one thing you cannot do is train that combiner on predictions the base ' +
        'models made about rows they were fitted on. Those predictions are optimistically wrong, and the ' +
        'combiner would learn to trust whichever member overfits hardest. So the base predictions are ' +
        'produced out-of-fold, by cross-validation. Blending is the cheap version: one held-out slice instead ' +
        'of K folds, simpler and faster, on less data.',
      howItWorks: {
        summary:
          'Generate out-of-fold predictions from each base model by cross-validation, train a meta-learner on ' +
          'those predictions as its features, and refit the base models on all the data for inference.',
        steps: [
          'Choose a set of base models that fail differently — different algorithm families, not different seeds.',
          'Split the training set into K folds.',
          'For each fold, fit every base model on the other K−1 folds and predict the held-out fold, giving one out-of-fold prediction per model per row.',
          'Train the meta-learner on that matrix of out-of-fold predictions, with the original targets as labels.',
          'Refit each base model on the full training set for use at prediction time.',
          'At inference, feed a new row through the base models and pass their outputs to the meta-learner.',
        ],
      },
      hyperparameters: [
        {
          name: 'final_estimator',
          what: 'The meta-learner. sklearn defaults to LogisticRegression for classification.',
          tuning:
            'Keep it simple — it is fitted on very few features (one column per base model) and is the ' +
            'easiest place in the whole design to overfit. A regularised linear model is the standard ' +
            'choice; a second boosted ensemble here usually costs more than it returns.',
        },
        {
          name: 'cv',
          what: 'The cross-validation splitter used to generate out-of-fold predictions. Defaults to 5-fold.',
          tuning:
            'More folds means more training data behind each out-of-fold prediction and K times the cost. ' +
            'Use a stratified splitter for imbalanced classes and a grouped or time-ordered one whenever ' +
            'rows are not independent, or the leak you were avoiding comes straight back.',
        },
        {
          name: 'stack_method',
          what: 'What each base model contributes — predict_proba, decision_function, or predict. Defaults to "auto".',
          tuning:
            'Prefer probabilities or decision scores over hard labels: they carry the model\'s confidence, ' +
            'which is most of what the meta-learner has to work with.',
        },
        {
          name: 'passthrough',
          what: 'Whether the original features are appended to the meta-learner\'s input. Defaults to False.',
          tuning:
            'Turning it on lets the meta-learner learn which base model to trust in which region of feature ' +
            'space, at the cost of a much wider and more overfittable meta-problem. Try it only with a ' +
            'strongly regularised meta-learner.',
        },
      ],
      whenToUse: [
        'You already have several tuned models with genuinely different error patterns — a boosted ensemble, a linear model, a neighbour-based model — and their errors are only weakly correlated',
        'Accuracy is the objective and you can afford K+1 times the training cost and a multi-model serving path — competition submissions, offline scoring',
        'Different models are each strongest on a different slice of the data, so a learned combiner can beat any fixed average',
        'You have enough rows that a 5-fold split still leaves each base model well-trained',
      ],
      whenNotToUse: [
        'The base models are variations of one algorithm; their errors are correlated and a simple average captures nearly all of the available gain',
        'Serving is latency- or ops-constrained — every base model must be trained, deployed, versioned and evaluated at inference',
        'Data is small, where out-of-fold estimates are noisy and the meta-learner fits that noise',
        'Rows are grouped or ordered (repeated customers, time series) and you cannot construct a leak-free splitter — with a naive K-fold the meta-learner is trained on leaked predictions and every offline score is inflated',
        'The gain over the single best base model is inside the noise band of your validation estimate, which for a well-tuned boosted model it very often is',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'meta-learner-prediction',
      },
      math: {
        latex: [
          'z_i = \\left( \\hat{f}^{(1)}_{-k(i)}(x_i), \\; \\ldots, \\; \\hat{f}^{(M)}_{-k(i)}(x_i) \\right)',
          '\\hat{y}(x) = g\\!\\left( \\hat{f}^{(1)}(x), \\; \\ldots, \\; \\hat{f}^{(M)}(x) \\right)',
        ],
        notes:
          'The subscript −k(i) is the whole method: row i\'s meta-features come from base models fitted ' +
          'without the fold containing row i. Drop it and the construction still runs, still produces a ' +
          'plausible meta-model, and silently reports a validation score that cannot be reproduced in ' +
          'production — the failure is invisible rather than loud. Note also the asymmetry between the two ' +
          'lines: the meta-learner g is trained on out-of-fold predictions but applied to predictions from ' +
          'base models refitted on all the data, which are systematically sharper. That mismatch is why the ' +
          'meta-learner should be simple and heavily regularised.',
      },
      complexity: {
        train: '(K + 1) × the cost of fitting every base model, plus one cheap meta-fit',
        predict: 'The sum of all M base models\' prediction costs, plus the meta-model\'s',
      },
      code: [
        'from sklearn.ensemble import StackingClassifier, RandomForestClassifier',
        'from sklearn.linear_model import LogisticRegression',
        'from sklearn.neighbors import KNeighborsClassifier',
        'from sklearn.model_selection import StratifiedKFold',
        '',
        'stack = StackingClassifier(',
        '    estimators=[                       # different families, not different seeds',
        '        ("rf", RandomForestClassifier(n_estimators=300, random_state=0)),',
        '        ("lr", LogisticRegression(max_iter=1000)),',
        '        ("knn", KNeighborsClassifier(n_neighbors=25)),',
        '    ],',
        '    final_estimator=LogisticRegression(),   # keep the combiner simple',
        '    cv=StratifiedKFold(5, shuffle=True, random_state=0),',
        '    stack_method="predict_proba",           # confidences beat hard labels',
        '    n_jobs=-1,',
        ')',
        'stack.fit(X_train, y_train)   # meta-learner sees cross_val_predict output, never in-fold',
      ].join('\n'),
      // Cross-body: logistic-regression is the canonical meta-learner and the default in sklearn;
      // k-nearest-neighbors is the classic third member, because it fails in different places than
      // a tree ensemble does.
      // Cross-link pass: add `cross-validation` and `data-leakage` (Belt) — the out-of-fold
      // requirement is the single thing that makes this work, and leakage is how it fails.
      related: ['bagging', 'random-forest', 'xgboost', 'logistic-regression', 'k-nearest-neighbors'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Stacked generalization',
            url: 'https://scikit-learn.org/stable/modules/ensemble.html',
          },
          {
            title: 'scikit-learn API — StackingClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.StackingClassifier.html',
          },
          {
            title: 'Blending versus stacking: the holdout variant and its Netflix Prize origin',
            url: 'https://machinelearningmastery.com/blending-ensemble-machine-learning-with-python/',
          },
        ],
        papers: [
          {
            title: 'Stacked Generalization (Neural Networks 5(2):241-259)',
            url: 'https://doi.org/10.1016/S0893-6080(05)80023-1',
            year: 1992,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 16 — Ensemble Learning',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
  ],
} satisfies Body;
