/**
 * Terra — Trees & Rules. See PLAN.md §3 for the moon list (5 moons, all written here).
 *
 * The four tree entries deliberately own disjoint territory, because they overlap badly if
 * written independently:
 *   - `decision-trees`   owns the recursive binary partition itself and the CLASSIFICATION case:
 *                        impurity (Gini/entropy), how a prediction is read off a path, axis-
 *                        parallel boxes, and the instability that motivates Mars.
 *   - `regression-trees` owns only what CHANGES when the target is continuous: squared-error
 *                        splitting, leaf = mean, the piecewise-constant step function, and the
 *                        inability to extrapolate.
 *   - `tree-pruning`     owns SIZE SELECTION: grow-then-prune vs. early stopping, the
 *                        cost-complexity functional, the nested weakest-link alpha path, and how
 *                        alpha is actually chosen.
 *   - `id3-c45`          owns the OTHER lineage — Quinlan's multiway, information-gain trees and
 *                        their rulesets — and exists mainly to stop readers assuming
 *                        scikit-learn's trees are C4.5. They are not.
 *
 * Researched via web sources opened in full this session; see the commit message / agent report
 * for the per-entry source list. Every reference URL below was fetched before being cited.
 * `eraRange` spans AID (Morgan & Sonquist 1963, the first regression tree algorithm, per Loh
 * 2011) to Cohen's RIPPER (1995).
 *
 * Phase 3 wrap-up: PLAN.md's facets convention question is resolved as (a) — `handlesMissing`/
 * `handlesCategorical` describe the common library implementation the entry's own code sample
 * demonstrates, not the abstract method, with method-level capability left to prose. That retrofit
 * changed `handlesCategorical` from true to false on `decision-trees`, `regression-trees` and
 * `tree-pruning` — all three demonstrate scikit-learn's `DecisionTreeClassifier`/`Regressor`, whose
 * docs (checked directly, scikit-learn.org/stable/modules/tree.html) still say "categorical
 * variables for now" is unsupported, even though `decision-trees`' own `whenNotToUse` already said
 * so in prose. `handlesMissing` stayed true on all three: scikit-learn's tree docs now document
 * routing NaNs to whichever child minimises impurity, a real (if recent) capability of the same
 * implementation. `id3-c45` and `rule-induction` were left at true/true — their referenced common
 * implementation is Weka (J48 / JRip), not scikit-learn (both entries already say so explicitly),
 * and J48's native multiway categorical splits and probabilistic missing-value handling are
 * genuine, already documented in `id3-c45`'s own sourced prose. `mars.ts`'s `gradient-boosting`
 * needed no change — it was already false/false, correctly describing plain
 * `GradientBoostingClassifier` rather than `HistGradientBoosting*`, per PLAN.md's own diagnosis.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'terra',
  name: 'Terra',
  segment: 'Trees & Rules',
  hook: 'Models you read as a flowchart: a chain of yes/no questions, and the pruning that says where to stop.',
  summary:
    'Terra holds the methods that carve the feature space with a sequence of simple yes/no questions — ' +
    'classification and regression trees, the rival lineage that grew out of Quinlan\'s ID3, the pruning ' +
    'machinery that decides how big a tree should be, and the rule learners that drop the tree and keep the ' +
    'if-then list. Every ensemble on Mars is built out of what lives here.',
  eraRange: [1963, 1995],
  moons: [
    // ---------------------------------------------------------------------------------------
    {
      id: 'decision-trees',
      name: 'Decision Trees (CART)',
      aliases: ['classification trees', 'CART', 'recursive partitioning'],
      tier: 1,
      year: 1984,
      difficulty: 2,
      hook: 'Splits the data one yes/no question at a time until each region is pure enough to answer with a label.',
      intuition:
        'Think about how a clinician triages someone at the door. One question, then the next question chosen ' +
        'because of the answer to the first: is the temperature above 38, and then, only for the feverish ones, ' +
        'is the white cell count high? Each answer narrows the room you are standing in. A decision tree is that ' +
        'questioning made mechanical. At every step it considers every feature and every cut point in it, scores ' +
        'each candidate question by how much purer the two resulting groups are than the group it started with, ' +
        'and keeps the best one. Then it repeats inside each group. What comes out is a partition of the feature ' +
        'space into boxes with sides parallel to the axes, each box labelled with the class that dominates it. ' +
        'Nothing is scaled, weighted or fitted in the usual sense — the model is literally the list of questions, ' +
        'which is why a tree is one of the few models a non-specialist can audit by reading it.',
      howItWorks: {
        summary:
          'Greedily pick the single feature-and-threshold split that most reduces node impurity, recurse into ' +
          'both children, and label each leaf with the majority class of the training points that land in it.',
        steps: [
          'Start with every training row at the root node.',
          'Measure the impurity of the node — Gini or entropy over its class proportions.',
          'For each feature and each candidate cut point, compute the sample-weighted impurity of the two children.',
          'Take the split with the lowest weighted child impurity and partition the node in two.',
          'Recurse into each child, stopping when it is pure, too small to split, or a depth limit is hit.',
          'Label each leaf with the majority class, and record the class proportions as predicted probabilities.',
          'Classify a new point by walking it down the tests from the root to a leaf.',
        ],
      },
      hyperparameters: [
        {
          name: 'criterion',
          what: 'Impurity measure used to score a candidate split. scikit-learn defaults to "gini"; "entropy" and "log_loss" are the alternatives.',
          tuning:
            'Rarely worth tuning — the two usually pick near-identical trees. Breiman et al. preferred Gini ' +
            'because it extends cleanly to symmetrised misclassification costs and is cheaper to compute than ' +
            'information gain. Change it only if you have a specific reason.',
        },
        {
          name: 'max_depth',
          what: 'Hard cap on how many questions deep the tree may go. Default None, which grows until leaves are pure.',
          tuning:
            'The blunt version of size control. Try 3-8 for a tree meant to be read; leave it None and use ' +
            'ccp_alpha instead if you want the size chosen by measured error rather than by decree.',
        },
        {
          name: 'min_samples_leaf',
          what: 'Minimum training rows a leaf must contain. Default 1, which permits leaves built from a single point.',
          tuning:
            'The most effective single anti-overfitting knob during growth. Raise it until leaves hold enough ' +
            'rows for their class proportions to mean something — a few dozen is a reasonable starting point on ' +
            'medium data.',
        },
        {
          name: 'class_weight',
          what: 'Per-class weights applied when computing impurity. Default None, i.e. every row counts once.',
          tuning:
            'Set to "balanced" when one class is rare, otherwise the majority class dominates every impurity ' +
            'calculation and the tree learns to predict it everywhere.',
        },
      ],
      whenToUse: [
        'A domain expert has to read the model end to end and be able to challenge it one split at a time',
        'Features mix numeric and categorical on wildly different scales and you do not want to standardise or encode them',
        'The signal involves interactions — a feature that only matters when another feature is in a particular range',
        'You want a fast, essentially tuning-free baseline before committing to an ensemble',
      ],
      whenNotToUse: [
        'The true boundary is a smooth diagonal or curve — axis-parallel cuts approximate it as a staircase and need many splits to do it',
        'You need a stable model: a small change in the training data can produce a visibly different tree',
        'Predictive accuracy matters more than reading the model — bagging, random forests and boosting almost always beat a single tree',
        'You are on scikit-learn and want native categorical splits: its implementation does not support categorical variables',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: false,
        outputType: 'class-label-with-probabilities',
      },
      math: {
        latex: [
          'H_{\\text{gini}}(Q_m) = \\sum_k p_{mk}\\,(1 - p_{mk})',
          'H_{\\text{entropy}}(Q_m) = -\\sum_k p_{mk} \\log p_{mk}',
          'G(Q_m, \\theta) = \\frac{n^{\\text{left}}_m}{n_m} H(Q^{\\text{left}}_m(\\theta)) + \\frac{n^{\\text{right}}_m}{n_m} H(Q^{\\text{right}}_m(\\theta))',
        ],
        notes:
          'The split is chosen by minimising G over every (feature, threshold) pair θ — a full exhaustive search ' +
          'at every node, with no gradient and no global objective. That greed has a consequence worth knowing: ' +
          'an ordered variable with m distinct values offers m-1 candidate splits and an unordered one with m ' +
          'levels offers 2^(m-1)-1, so all else equal, variables with more distinct values are more likely to be ' +
          'picked. This selection bias distorts what the tree structure appears to say about which variables matter.',
      },
      complexity: {
        train:
          'O(p · n log n) for a balanced tree with scikit-learn\'s sorted-index caching; O(p · n² log n) without it',
        predict: 'O(depth), which is O(log n) for a balanced tree — independent of the number of features',
      },
      code: [
        'from sklearn.tree import DecisionTreeClassifier, export_text',
        'from sklearn.model_selection import train_test_split',
        '',
        'X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)',
        '',
        'clf = DecisionTreeClassifier(',
        "    criterion='gini',      # default; 'entropy' / 'log_loss' also available",
        '    max_depth=4,           # default None grows until every leaf is pure',
        '    min_samples_leaf=20,   # default 1 — the main growth-time overfitting knob',
        '    random_state=0,',
        ').fit(X_tr, y_tr)',
        '',
        '# the model IS the printout — read it, do not just score it',
        'print(export_text(clf, feature_names=list(feature_names)))',
        'print(clf.get_depth(), clf.get_n_leaves())',
      ].join('\n'),
      // regression-trees / tree-pruning / id3-c45 are the three siblings on Terra;
      // random-forest is the cross-body link that matters most (a tree is the base learner every
      // Mars ensemble aggregates), and logistic-regression is the honest contrast: a smooth
      // linear boundary versus a staircase of axis-parallel cuts.
      related: ['regression-trees', 'tree-pruning', 'id3-c45', 'random-forest', 'logistic-regression'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Decision Trees',
            url: 'https://scikit-learn.org/stable/modules/tree.html',
          },
          {
            title: 'scikit-learn API — DecisionTreeClassifier',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeClassifier.html',
          },
        ],
        papers: [
          {
            title: 'Top 10 Algorithms in Data Mining (see §1 on C4.5 and §10 on CART)',
            url: 'https://www.cs.umd.edu/~samir/498/10Algorithms-08.pdf',
            year: 2008,
          },
          {
            title: 'Classification and Regression Trees (WIREs Data Mining Knowl. Discov. 1, 14–23)',
            url: 'https://pages.stat.wisc.edu/~loh/treeprogs/guide/wires11.pdf',
            year: 2011,
          },
        ],
        books: [
          {
            title: 'Classification and Regression Trees',
            author: 'Breiman, Friedman, Olshen & Stone',
            chapter: 'The 1984 CART monograph — the original source for binary recursive partitioning',
          },
          {
            title: 'An Introduction to Statistical Learning',
            author: 'James, Witten, Hastie & Tibshirani',
            chapter: 'Ch. 8 — Tree-Based Methods',
            url: 'https://www.statlearning.com/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------
    {
      id: 'id3-c45',
      name: 'ID3 / C4.5',
      aliases: ['Iterative Dichotomiser 3', 'C5.0', 'See5', 'J48'],
      tier: 2,
      year: 1986,
      difficulty: 2,
      hook: 'The other tree lineage: information gain, one branch per category value, and trees rewritten as rules.',
      intuition:
        'CART was not the only tree family, and if you have read a textbook that talks about "information gain" ' +
        'you have met the other one. Ross Quinlan\'s ID3 splits a node by whichever categorical attribute buys the ' +
        'largest drop in entropy, and gives that attribute one branch per value rather than a yes/no cut — a ' +
        'four-level attribute produces a four-way fan-out. That greed has a known flaw: an attribute with many ' +
        'distinct values cuts entropy simply by shattering the data, so ID3 drifts toward things like ID numbers. ' +
        'C4.5, the 1993 successor, divides information gain by the information the split itself carries — the ' +
        'gain ratio, its default — and adds the machinery ID3 lacked: thresholds on numeric attributes, cases ' +
        'with unknown values spread probabilistically across branches, and pessimistic pruning from binomial ' +
        'confidence limits. It can also rewrite the finished tree as an ordered set of if-then rules, one per ' +
        'root-to-leaf path, then simplify each rule on its own.',
      howItWorks: {
        summary:
          'Grow a multiway tree by repeatedly splitting on the attribute with the best gain ratio, then prune it ' +
          'back using a pessimistic estimate of each subtree\'s error rate.',
        steps: [
          'Rank every candidate attribute by information gain, then by gain ratio to correct the many-values bias.',
          'Split the node into one branch per outcome — one per value for a discrete attribute, or a threshold test for a numeric one.',
          'Recurse until a node is pure or too small, then prune leaves-to-root using binomial upper confidence limits on the error rate.',
        ],
      },
      whenToUse: [
        'Your features are genuinely categorical with a handful of levels and a one-branch-per-value tree reads better than nested binary cuts',
        'You want the model expressed as an ordered rule list rather than as a tree diagram',
      ],
      whenNotToUse: [
        'You are working in scikit-learn — it implements an optimised CART variant, not ID3 or C4.5, so these are not the trees you are fitting',
        'An attribute has very many distinct values (an identifier, a timestamp): plain information gain will select it for the wrong reason',
        'You need regression — this lineage predicts classes; the continuous-target case belongs to CART-style regression trees',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: true,
        outputType: 'class-label-or-ruleset',
      },
      related: ['decision-trees', 'tree-pruning', 'rule-induction'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Tree algorithms: ID3, C4.5, C5.0 and CART',
            url: 'https://scikit-learn.org/stable/modules/tree.html#tree-algorithms-id3-c4-5-c5-0-and-cart',
          },
          {
            title: 'Weka API — J48 (the open-source C4.5 revision 8 implementation)',
            url: 'https://weka.sourceforge.io/doc.dev/weka/classifiers/trees/J48.html',
          },
        ],
        papers: [
          {
            title: 'Induction of Decision Trees',
            url: 'https://doi.org/10.1007/BF00116251',
            year: 1986,
          },
          {
            title: 'Top 10 Algorithms in Data Mining — §1 "C4.5 and beyond", written by Quinlan',
            url: 'https://www.cs.umd.edu/~samir/498/10Algorithms-08.pdf',
            year: 2008,
          },
          {
            title: 'Improved Use of Continuous Attributes in C4.5 (JAIR 4, 77–90)',
            url: 'https://www.jair.org/index.php/jair/article/view/10157',
            year: 1996,
          },
        ],
        books: [
          {
            title: 'C4.5: Programs for Machine Learning',
            author: 'J. Ross Quinlan',
            chapter: 'Morgan Kaufmann, 1993 — the definitive description of C4.5 and C4.5rules',
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------
    {
      id: 'regression-trees',
      name: 'Regression Trees',
      aliases: ['CART regression', 'AID', 'piecewise-constant tree'],
      tier: 1,
      year: 1963,
      difficulty: 2,
      hook: 'Same splitting machinery, continuous target: every leaf predicts a mean, so the fit is a staircase.',
      intuition:
        'Swap the question a tree is answering from "which class?" to "how much?" and almost everything survives ' +
        'the change. You still split on one feature at a time, you still take the split that makes the two ' +
        'children more homogeneous than the parent, and you still read a prediction off a path. Only the meaning ' +
        'of homogeneous moves: instead of counting how mixed the class labels are, you measure how spread out the ' +
        'numbers are around their average, and a good split is one that leaves each side tightly bunched. Each ' +
        'leaf then answers with the average of the training values that fell into it. That single detail governs ' +
        'everything the model can and cannot do. Because a leaf emits one constant, the fitted surface is a set ' +
        'of flat plateaux with vertical drops at the split points — a staircase, not a curve. It needs no ' +
        'functional form from you, and it cannot produce a number outside the range it was trained on.',
      howItWorks: {
        summary:
          'Choose the split that minimises the total squared deviation of the response about the mean within each ' +
          'child, recurse, and let every leaf predict the mean of the training responses inside it.',
        steps: [
          'Compute the mean of the response in the node and the sum of squared deviations about it.',
          'For each feature and cut point, split the node and add up the within-child sums of squared deviations.',
          'Take the split with the smallest total, which is exactly the split that most reduces within-node variance.',
          'Recurse into each child until it is too small to split or a size limit stops growth.',
          'Store the mean response of each leaf as its prediction.',
          'Predict a new point by routing it to a leaf and returning that stored constant.',
        ],
      },
      hyperparameters: [
        {
          name: 'criterion',
          what: 'How split quality is scored. scikit-learn defaults to "squared_error"; "absolute_error" (leaf predicts the median) and "poisson" (for non-negative counts) are the alternatives.',
          tuning:
            'Keep the default unless the residuals have heavy tails or the target is a count. "absolute_error" ' +
            'is far more robust to outliers but scikit-learn documents it as 3–6× slower to fit; "poisson" ' +
            'requires y ≥ 0 and suits rates and frequencies.',
        },
        {
          name: 'min_samples_leaf',
          what: 'Minimum training rows behind each leaf mean. Default 1, so a leaf can be a single observation.',
          tuning:
            'A leaf mean computed from one point is that point. Raise this until each leaf average is estimated ' +
            'from enough rows to be stable — this matters more for regression than for classification, because ' +
            'the prediction is a number rather than a vote.',
        },
        {
          name: 'max_depth',
          what: 'Depth cap, which bounds the number of distinct values the model can output at 2^max_depth.',
          tuning:
            'Set it small (2-6) when the tree is a base learner for boosting, where each tree only has to ' +
            'capture a fragment of the signal. Leave it None and prune afterwards when the tree is the model.',
        },
      ],
      whenToUse: [
        'The response is continuous but driven by thresholds and regime changes rather than a smooth trend',
        'Interactions between predictors matter and you do not want to specify them in a formula by hand',
        'You need a base learner for gradient boosting or a random forest, where individual trees are kept deliberately small',
        'Predictors are on incomparable scales or include categorical variables and you would rather not transform them',
      ],
      whenNotToUse: [
        'The underlying relationship is smooth — a tree renders it as a staircase and needs many leaves to look continuous',
        'You must predict outside the range of the training response: every leaf returns a training mean, so the model cannot extrapolate',
        'You need a per-predictor coefficient or effect size to report — use linear regression',
        'The dataset is small and noisy, where an unpruned regression tree will fit individual observations',
      ],
      facets: {
        task: ['regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: false,
        outputType: 'continuous-value',
      },
      math: {
        latex: [
          '\\bar{y}_m = \\frac{1}{n_m} \\sum_{i \\in Q_m} y_i',
          'H(Q_m) = \\frac{1}{n_m} \\sum_{i \\in Q_m} (y_i - \\bar{y}_m)^2',
          '\\hat{f}(x) = \\sum_{m=1}^{|T|} \\bar{y}_m \\, \\mathbf{1}\\{x \\in R_m\\}',
        ],
        notes:
          'H(Q_m) is the within-node variance, so "minimise squared error in the children" and "maximise variance ' +
          'reduction" are the same instruction. The third line is the whole model: a sum of indicator functions ' +
          'over disjoint boxes, which makes explicit that the hypothesis space contains only piecewise-constant ' +
          'functions. Extensions that fit a linear model in each leaf instead of a constant (Quinlan\'s M5) exist ' +
          'precisely because that constraint is expensive when the truth is smooth.',
      },
      complexity: {
        train: 'O(p · n log n) for a balanced tree with sorted-index caching; O(p · n² log n) without it',
        predict: 'O(depth) — a walk from root to leaf, then return a stored constant',
      },
      code: [
        'import numpy as np',
        'from sklearn.tree import DecisionTreeRegressor',
        '',
        'reg = DecisionTreeRegressor(',
        "    criterion='squared_error',  # default; 'absolute_error' and 'poisson' also available",
        '    max_depth=3,                # at most 2**3 = 8 distinct predicted values',
        '    min_samples_leaf=10,',
        ').fit(X_tr, y_tr)',
        '',
        'pred = reg.predict(X_te)',
        'print(np.unique(pred).size)          # the staircase has this many steps',
        '',
        '# a leaf returns a training mean, so predictions live inside the training range',
        'print(pred.min() >= y_tr.min(), pred.max() <= y_tr.max())',
      ].join('\n'),
      // linear-regression is the intended contrast (smooth global fit with reportable coefficients
      // vs. a local staircase that needs no functional form); gradient-boosting is the cross-body
      // link — a shallow regression tree fitted to residuals is exactly what boosting stacks.
      related: ['decision-trees', 'tree-pruning', 'linear-regression', 'gradient-boosting'],
      references: {
        free: [
          {
            title: 'scikit-learn API — DecisionTreeRegressor',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeRegressor.html',
          },
          {
            title: 'scikit-learn user guide — Regression criteria',
            url: 'https://scikit-learn.org/stable/modules/tree.html',
          },
        ],
        papers: [
          {
            title: 'Classification and Regression Trees — Loh\'s survey, incl. AID (1963) as the first regression tree',
            url: 'https://pages.stat.wisc.edu/~loh/treeprogs/guide/wires11.pdf',
            year: 2011,
          },
          {
            title: 'Top 10 Algorithms in Data Mining — §10.2 on CART\'s least-squares splitting rule',
            url: 'https://www.cs.umd.edu/~samir/498/10Algorithms-08.pdf',
            year: 2008,
          },
        ],
        books: [
          {
            title: 'An Introduction to Statistical Learning',
            author: 'James, Witten, Hastie & Tibshirani',
            chapter: 'Ch. 8.1.1 — Regression Trees',
            url: 'https://www.statlearning.com/',
          },
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 9 — Additive Models, Trees, and Related Methods',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------
    {
      id: 'tree-pruning',
      name: 'Pruning & Cost-Complexity Pruning',
      aliases: ['weakest link pruning', 'minimal cost-complexity pruning', 'ccp_alpha'],
      tier: 1,
      year: 1984,
      difficulty: 3,
      hook: 'Grows the tree too big on purpose, then trades leaves for simplicity along one tuning knob.',
      intuition:
        'The obvious way to stop a tree overfitting is to stop splitting early — refuse any split that does not ' +
        'buy enough. Breiman and colleagues argued this is a trap, because a split that looks worthless can be ' +
        'the one that sets up a very good split beneath it; think of a pattern that only appears once you have ' +
        'separated two groups that individually look uninformative. So they inverted the procedure: grow the ' +
        'tree until it cannot grow further, then cut it back. The cutting is governed by one number. You charge ' +
        'the tree a fixed price for every leaf it keeps, and ask which subtree gives the best total of training ' +
        'error plus that price. Raise the price from zero and leaves start paying for themselves less and less, ' +
        'so branches fall away — the cheapest branch first, then the next. Crucially, they fall away in a nested ' +
        'order, so instead of an astronomical number of possible subtrees you get one short list of candidates ' +
        'to test.',
      howItWorks: {
        summary:
          'Grow an unrestricted tree, generate the nested sequence of subtrees produced by repeatedly cutting the ' +
          'weakest link, and pick the member of that sequence with the best cross-validated error.',
        steps: [
          'Grow the tree to full size, stopping only at a minimum node size — no early stopping on split quality.',
          'Define the cost of a subtree as its training error plus alpha times its number of leaves.',
          'For each internal node, compute the effective alpha at which collapsing it to a leaf costs the same as keeping its branch.',
          'Prune the node with the smallest effective alpha — the weakest link — and record the resulting subtree.',
          'Repeat until only the root remains, yielding a nested sequence of subtrees indexed by increasing alpha.',
          'Score each candidate alpha by K-fold cross-validation or on a held-out set, and refit the chosen alpha on all the data.',
        ],
      },
      hyperparameters: [
        {
          name: 'ccp_alpha',
          what: 'The complexity price per leaf in scikit-learn. Default 0.0, which means no pruning is performed at all.',
          tuning:
            'Do not guess it. Call cost_complexity_pruning_path on the fitted tree to get the exact alphas at ' +
            'which the tree changes, then cross-validate over that list. Drop the largest value — it prunes to a ' +
            'single node. Breiman et al. recommend the "1 SE" rule: take the smallest tree whose error is within ' +
            'one standard error of the best, rather than the outright minimum.',
        },
        {
          name: 'confidence factor (C4.5 / Weka J48 -C)',
          what: 'The rival pruning knob: the confidence level used for the binomial upper bound on a node\'s error rate. Default 0.25.',
          tuning:
            'Lower values prune harder. This family needs no held-out data at all — it prunes leaves-to-root in ' +
            'one pass from training-set statistics — which is the practical reason to reach for it when data is ' +
            'too scarce to hold any back.',
        },
        {
          name: 'max_depth / min_samples_leaf',
          what: 'Pre-pruning: constraints applied during growth instead of after it.',
          tuning:
            'Cheaper than the alpha path and often good enough, but they are the short-sighted stopping that ' +
            'cost-complexity pruning was designed to avoid. Prefer them for speed, prefer ccp_alpha when the ' +
            'tree is the deliverable and you can afford the cross-validation.',
        },
      ],
      whenToUse: [
        'You are deploying a single tree rather than an ensemble, and it currently classifies the training set perfectly',
        'You want tree size chosen by measured validation error instead of by picking a max_depth by hand',
        'The tree is too large to read and you want the smallest one whose error is still competitive',
        'Training labels are noisy, so the deepest splits are separating a handful of points each',
      ],
      whenNotToUse: [
        'The tree is a base learner in a random forest or a bagged ensemble, where trees are grown deep on purpose and variance is removed by averaging instead',
        'You have no data to spare for cross-validation or a validation set — the alpha path produces candidates but cannot choose among them',
        'The tree is already small because you constrained growth and it shows no gap between training and validation error',
        'You need pruning decided from training data alone with no resampling — that is C4.5-style pessimistic pruning, not cost-complexity pruning',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: false,
        outputType: 'pruned-subtree',
      },
      math: {
        latex: [
          'R_\\alpha(T) = R(T) + \\alpha\\,|\\tilde{T}|',
          '\\alpha_{\\text{eff}}(t) = \\frac{R(t) - R(T_t)}{|T| - 1}',
        ],
        notes:
          'R(T) is the training cost of the tree — traditionally the misclassification rate of the leaves; ' +
          'scikit-learn uses their total sample-weighted impurity instead. |T̃| is the leaf count. The second ' +
          'line is the alpha at which keeping branch T_t and collapsing it to the single node t cost exactly the ' +
          'same; the node with the smallest such value is the weakest link and goes first. The whole construction ' +
          'has the same shape as a lasso penalty — fit plus lambda times complexity — but the search space is ' +
          'discrete, and the payoff is that the minimising subtree is nested inside the previous one, so a single ' +
          'pass produces every candidate the cross-validation ever needs to score.',
      },
      code: [
        'import numpy as np',
        'from sklearn.tree import DecisionTreeClassifier',
        'from sklearn.model_selection import cross_val_score',
        '',
        'full = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr)',
        '',
        '# the exact alphas at which the tree changes — do not invent a grid',
        'alphas = full.cost_complexity_pruning_path(X_tr, y_tr).ccp_alphas[:-1]  # last one prunes to the root',
        '',
        'scores = [',
        '    cross_val_score(DecisionTreeClassifier(random_state=0, ccp_alpha=a), X_tr, y_tr, cv=5).mean()',
        '    for a in alphas',
        ']',
        '',
        'best = alphas[int(np.argmax(scores))]',
        'pruned = DecisionTreeClassifier(random_state=0, ccp_alpha=best).fit(X_tr, y_tr)',
        'print(full.get_n_leaves(), "->", pruned.get_n_leaves())',
      ].join('\n'),
      // The alpha is chosen by K-fold cross-validation, which is the Belt's `cross-validation`
      // entry — not yet written, so it is left out of `related` for the final cross-link pass.
      related: ['decision-trees', 'regression-trees', 'id3-c45', 'random-forest'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Minimal Cost-Complexity Pruning',
            url: 'https://scikit-learn.org/stable/modules/tree.html#minimal-cost-complexity-pruning',
          },
          {
            title: 'scikit-learn example — Post pruning decision trees with cost complexity pruning',
            url: 'https://scikit-learn.org/stable/auto_examples/tree/plot_cost_complexity_pruning.html',
          },
        ],
        papers: [
          {
            title: 'Top 10 Algorithms in Data Mining — §10.8 on stopping rules, pruning and the 1 SE tree',
            url: 'https://www.cs.umd.edu/~samir/498/10Algorithms-08.pdf',
            year: 2008,
          },
          {
            title: 'Classification and Regression Trees — on CART\'s 10-fold cross-validated pruning vs. C4.5\'s heuristic',
            url: 'https://pages.stat.wisc.edu/~loh/treeprogs/guide/wires11.pdf',
            year: 2011,
          },
        ],
        books: [
          {
            title: 'Classification and Regression Trees',
            author: 'Breiman, Friedman, Olshen & Stone',
            chapter: 'Ch. 3 — the source scikit-learn cites for minimal cost-complexity pruning',
          },
          {
            title: 'An Introduction to Statistical Learning',
            author: 'James, Witten, Hastie & Tibshirani',
            chapter: 'Ch. 8.1.1, Algorithm 8.1 — Tree Pruning',
            url: 'https://www.statlearning.com/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------
    {
      id: 'rule-induction',
      name: 'Rule Induction (RIPPER)',
      aliases: ['RIPPER', 'IREP', 'JRip', 'separate-and-conquer'],
      tier: 2,
      year: 1995,
      difficulty: 3,
      hook: 'Learns if-then rules one at a time, pruning each as it goes and deleting the examples it covers.',
      intuition:
        'A decision tree divides and conquers: every split partitions all the data at once, so a condition near ' +
        'the root is dragged into every rule below it. Rule learners separate and conquer instead. They build ' +
        'one rule, throw away every example that rule already explains, and start fresh on what is left — so ' +
        'each rule is free to mention only the conditions it actually needs. Cohen\'s RIPPER does this carefully. ' +
        'To learn a rule it randomly splits the remaining examples two ways, greedily piles conditions onto the ' +
        'rule using the growing portion until it admits no negatives, then immediately deletes conditions from ' +
        'the end while that improves accuracy on the portion it held back. It stops adding rules when the total ' +
        'description length of rules-plus-exceptions stops improving, and then makes optimisation passes that ' +
        'revisit each rule and try replacing it outright. The result is an ordered list you can read top to ' +
        'bottom, with a default class at the end.',
      howItWorks: {
        summary:
          'Repeatedly grow a rule on one random half of the remaining data, prune it on the other, remove the ' +
          'examples it covers, and stop when adding rules stops paying for itself under a description-length test.',
        steps: [
          'Split the uncovered examples into a growing set and a pruning set, then greedily add conditions on the growing set until the rule covers no negatives.',
          'Delete conditions from the end of the rule while doing so improves its value on the pruning set, then remove the examples the rule covers.',
          'Stop when description length stops improving, then run optimisation passes that try a replacement and a revision for each rule and keep whichever encodes most cheaply.',
        ],
      },
      whenToUse: [
        'The deliverable is a readable rule list — a policy, an eligibility check, an alert condition — rather than a score',
        'The dataset is large and noisy: RIPPER was built because C4.5\'s ruleset construction scaled roughly cubically in the number of examples',
      ],
      whenNotToUse: [
        'You need calibrated probabilities or a continuous prediction — the output is a class from the first matching rule',
        'Classes overlap heavily with no crisp conjunctive descriptions, where a margin- or probability-based classifier fits better',
        'You want a scikit-learn-native method: rule induction lives in Weka (JRip) and separate packages, not in scikit-learn',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: true,
        outputType: 'ordered-rule-list',
      },
      related: ['decision-trees', 'id3-c45'],
      references: {
        free: [
          {
            title: 'Weka API — JRip, the open-source RIPPER implementation (options and defaults)',
            url: 'https://weka.sourceforge.io/doc.dev/weka/classifiers/rules/JRip.html',
          },
        ],
        papers: [
          {
            title: 'Fast Effective Rule Induction (ICML 1995, 115–123) — the RIPPER paper',
            url: 'https://crystal.uta.edu/~gonzalez/ml/Ripper.pdf',
            year: 1995,
          },
        ],
        books: [
          {
            title: 'C4.5: Programs for Machine Learning',
            author: 'J. Ross Quinlan',
            chapter: 'Morgan Kaufmann, 1993 — C4.5rules, the tree-derived ruleset RIPPER was benchmarked against',
          },
        ],
      },
    },
  ],
} satisfies Body;
