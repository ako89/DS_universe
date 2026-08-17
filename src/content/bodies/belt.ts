/**
 * The Belt — Evaluation, Validation & the Craft. See PLAN.md §3 for the moon list (8 moons, all
 * written here). PLAN.md's own words: "the most-skipped and most-important region."
 *
 * Two of the eight are deliberately compound entries, each built to read as one idea rather than
 * two glued together:
 *
 *   train-val-test-and-data-leakage   the three-way split defines the boundary between "the model
 *                                      may see this" and "the model may not"; data leakage is what
 *                                      happens when information crosses that boundary. One entry,
 *                                      because leakage cannot be explained without the split it
 *                                      violates, and the split is only worth having if you also
 *                                      know how it gets silently broken.
 *   overfitting-and-regularization    overfitting is the diagnosis (variance winning the
 *                                      bias-variance trade); regularization is the fix (penalize
 *                                      complexity directly in the objective). Same trade-off,
 *                                      looked at from either side of it.
 *
 * The other six own one distinction each: cross-validation rotates the held-out slice so the
 * score doesn't depend on one split; classification-metrics and regression-metrics are the two
 * scoring vocabularies (discrete-label confusion-matrix metrics vs. continuous-residual error
 * metrics); class-imbalance is what happens when a metric's implicit assumption of roughly equal
 * classes is wrong; hyperparameter-search is how you choose settings that aren't learned from
 * data; calibration (Tier 2 stub) is what happens *after* a classifier already ranks well and its
 * raw scores still aren't honest probabilities.
 *
 * `year` — several of these are craft/methodology topics practiced long before any single paper
 * formalized them (holdout testing traces to the 1930s per Stone 1974's own historical sketch;
 * precision/recall predate machine learning entirely, in information retrieval). Rather than
 * assert an invented "date of invention" for a folk practice, each entry's `year` is pinned to the
 * single most load-bearing, independently-verified paper actually cited in that entry — the one
 * that supplies its central, non-obvious claim — and the file comments below say so per entry.
 * This mirrors mars.ts's precedent of documenting a deliberate dating choice rather than hiding it.
 *
 * Research trail (every entry read from an opened source, per docs/CONTENT_GUIDE.md §3):
 *   - scikit-learn user guide, opened directly: cross_validation.html, grid_search.html,
 *     calibration.html, model_evaluation.html, common_pitfalls.html, linear_model.html,
 *     plot_underfitting_overfitting.html — for mechanism, defaults and terminology throughout.
 *   - imbalanced-learn user guide (over_sampling.html) for SMOTE variants — see the SMOTE note
 *     below for where this page's own summary needed correcting against the primary source.
 *   - Primary papers verified via CrossRef (https://api.crossref.org/works/<doi>) for every DOI
 *     cited: SMOTE (10.1613/jair.953), Zadrozny & Elkan (10.1145/775047.775151), Geman/Bienenstock
 *     /Doursat (10.1162/neco.1992.4.1.1), Davis & Goadrich (10.1145/1143844.1143874), Stone
 *     (10.1111/j.2517-6161.1974.tb00994.x), He & Garcia (10.1109/TKDE.2008.239), Hyndman & Koehler
 *     (10.1016/j.ijforecast.2006.03.001).
 *   - Kohavi (1995): the IJCAI proceedings PDF (ijcai.org/Proceedings/95-2/Papers/016.pdf) would
 *     not yield extractable text via WebFetch — it said so plainly rather than inventing an
 *     answer, which is the *correct* failure mode CONTENT_GUIDE §3 warns to watch for, not the
 *     dangerous one. The "ten-fold stratified cross-validation, even if computation power allows
 *     using more folds" quote used in cross-validation's hyperparameter guidance was instead
 *     confirmed by directly fetching an HTML (non-PDF) secondary source quoting it verbatim
 *     (gabormelli.com/RKB/1995_AStudyOfCrossValidAndBoostrap), corroborated by scikit-learn's own
 *     prose recommendation of "5 or 10-fold ... over LOO." The paper is still cited for
 *     title/authors/year (reliable bibliographic metadata, per CONTENT_GUIDE §3), not for a number
 *     pulled from its PDF body.
 *   - SMOTE correction: imbalanced-learn's over_sampling.html, fetched first, summarized SMOTE as
 *     interpolating with a neighbour "which may be from any class in basic SMOTE." That is wrong
 *     for the original method and is exactly the subtle-recall error this batch was warned about.
 *     Fetching the actual paper text (the JAIR LaTeX source, chawla02a.tex — plain text, not a
 *     PDF) confirms neighbours are drawn from the minority class only: "introducing synthetic
 *     examples along the line segments joining any/all of the k minority class nearest
 *     neighbors." class-imbalance's math.notes calls this out explicitly.
 *   - Platt (1999): cited with the PDF URL scikit-learn's own calibration.html references section
 *     uses (cs.colorado.edu/~mozer/.../Platt1999.pdf) — not the similarly-named Lin & Lin "A note
 *     on Platt's probabilistic outputs" (a different, later paper) that dominates search results
 *     for this topic and would have been an easy mis-citation.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'belt',
  name: 'The Belt',
  segment: 'Evaluation, Validation & the Craft',
  hook: 'Where a reported score either earns its trust or turns out to be fiction.',
  summary:
    'The Belt is not a family of models — it is the discipline that decides whether any other body\'s models can be ' +
    'trusted. How you split data, what you measure, how you search for settings, and how you guard against the ' +
    'score quietly lying to you: skip this and every algorithm elsewhere in the system is reporting a number that ' +
    'means less than it looks like it means.',
  eraRange: [1974, 2012],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'train-val-test-and-data-leakage',
      name: 'Train/Val/Test Split & Data Leakage',
      aliases: ['holdout method', 'train/validation/test split', 'leakage'],
      tier: 1,
      year: 2012,
      difficulty: 2,
      hook: 'Keeps fitting, tuning and judging on separate data — leakage is what happens when they mix.',
      intuition:
        'Treat model-building like a three-part exam. The training set is the textbook — study it as hard as you ' +
        'like. The validation set is a practice exam you can retake, used to decide which chapter to review or ' +
        'which model to pick; because you look at it repeatedly while making decisions, some of that practice-exam ' +
        'knowledge leaks into your choices. The test set is the real exam, taken exactly once, after every ' +
        'decision is frozen. Data leakage is what happens when material from the practice or real exam quietly ' +
        'ends up in the textbook — a scaler fit on the whole dataset before splitting, a feature built from future ' +
        'rows, a duplicate row appearing in both train and test. The model does not need to be told the answer ' +
        'directly; it only needs the split rows to share information that will not exist at prediction time, and ' +
        'the reported score becomes fiction.',
      howItWorks: {
        summary:
          'Partition the data before touching it — fit everything, including preprocessing, only on the training ' +
          'portion, use validation to make decisions, and touch the test set exactly once.',
        steps: [
          'Split the raw data into train, validation and test before any preprocessing step runs.',
          'Fit scalers, imputers, feature selectors and the model itself only on the training rows.',
          'Apply that same fitted transform (never refit) to the validation and test rows.',
          'Use the validation score to choose between models and hyperparameters, iterating freely.',
          'Evaluate on the test set exactly once, after every choice is frozen, and report that number.',
          'Check for leakage sources specific to the data: shared groups, duplicated rows, or information from the future.',
        ],
      },
      hyperparameters: [
        {
          name: 'split sizes',
          what: 'Fraction of rows assigned to train / validation / test.',
          tuning:
            'A common default is 60/20/20 or 70/15/15. Shrink the held-out fractions as the dataset grows — a ' +
            'validation set of a few thousand rows is already a stable estimate, and every row held out is a row ' +
            'not available for training.',
        },
      ],
      whenToUse: [
        'You need to select among several models or tune hyperparameters and then report one trustworthy number afterward',
        'The dataset is large enough that carving out held-out rows does not starve training (roughly tens of thousands of rows or more)',
      ],
      whenNotToUse: [
        'Data is small enough that a single held-out split has too much variance in its score — use k-fold cross-validation for the tuning step instead of a fixed validation set',
        'Rows are grouped (repeated patients, sessions, users) or ordered in time — a plain random split leaks information across the boundary; use a group-aware or time-based split instead',
      ],
      facets: {
        task: ['classification', 'regression', 'forecasting'],
        dataType: ['tabular', 'timeseries', 'text', 'image'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'train/validation/test row partition',
      },
      code: [
        'from sklearn.model_selection import train_test_split',
        'from sklearn.pipeline import make_pipeline',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.linear_model import LogisticRegression',
        '',
        '# split FIRST, before any preprocessing touches the data',
        'X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=0)',
        'X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=0)',
        '',
        '# a Pipeline fits the scaler on X_train only, then just transforms X_val / X_test',
        'pipe = make_pipeline(StandardScaler(), LogisticRegression())',
        'pipe.fit(X_train, y_train)',
        '',
        'val_score = pipe.score(X_val, y_val)      # used freely while iterating',
        'test_score = pipe.score(X_test, y_test)   # touched exactly once, at the end',
      ].join('\n'),
      // Cross-body: leakage through preprocessing applies to every estimator in the system; called
      // out generically here rather than per-algorithm.
      related: ['cross-validation', 'hyperparameter-search', 'overfitting-and-regularization', 'empirical-risk-minimization'],
      references: {
        free: [
          {
            title: 'scikit-learn — Common pitfalls and recommended practices (data leakage)',
            url: 'https://scikit-learn.org/stable/common_pitfalls.html',
          },
          {
            title: 'scikit-learn user guide — Cross-validation: evaluating estimator performance',
            url: 'https://scikit-learn.org/stable/modules/cross_validation.html',
          },
        ],
        papers: [
          {
            title: 'Leakage in Data Mining: Formulation, Detection, and Avoidance',
            url: 'https://doi.org/10.1145/2382577.2382579',
            year: 2012,
          },
        ],
        books: [
          {
            title: 'An Introduction to Statistical Learning',
            author: 'James, Witten, Hastie & Tibshirani',
            chapter: 'Ch. 5 — Resampling Methods',
            url: 'https://www.statlearning.com/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'cross-validation',
      name: 'Cross-Validation',
      aliases: ['k-fold cross-validation', 'CV', 'leave-one-out cross-validation'],
      tier: 1,
      year: 1974,
      difficulty: 2,
      hook: 'Rotates which slice of data is held out, so the score does not depend on which split you happened to draw.',
      intuition:
        'A single train/test split gives you one score, and that score depends partly on which rows happened to ' +
        'land in the test set — an unlucky split can make a good model look mediocre, or a mediocre model look ' +
        'good. Cross-validation removes that luck by rotating the role of "test set" through the whole dataset. ' +
        'Split the data into k roughly equal folds; train on k-1 of them and evaluate on the fold left out; repeat ' +
        'until every fold has been the test set exactly once; then average the k scores. Every row contributes to ' +
        'training in most rounds and to evaluation in exactly one, so the final number reflects the data as a ' +
        'whole rather than one arbitrary partition. The price is k times the training cost, and a genuine choice: ' +
        'more folds means each training set is closer to the full data (lower bias), but the k estimates overlap ' +
        'and correlate more with each other (higher variance).',
      howItWorks: {
        summary:
          'Split the data into k folds, train k times leaving out a different fold each round, and average the k ' +
          'held-out scores into one estimate.',
        steps: [
          'Shuffle the data (unless it is ordered in time) and split it into k roughly equal folds.',
          'For each fold, train on the other k-1 folds and evaluate on that fold.',
          'Record the score from each of the k rounds.',
          'Average the k scores into a single estimate, and optionally report their spread.',
          'For classification, use stratified folds so each fold keeps the overall class ratio.',
        ],
      },
      hyperparameters: [
        {
          name: 'n_splits (k)',
          what: 'Number of folds.',
          tuning:
            'Kohavi\'s large-scale 1995 study found ten-fold stratified cross-validation gave the best bias-variance ' +
            'tradeoff for model selection on real-world data, and scikit-learn\'s own guidance follows the same rule ' +
            'of thumb: prefer 5 or 10 over leave-one-out.',
        },
        {
          name: 'shuffle / random_state',
          what: 'Whether folds are drawn from a shuffled order, and the seed controlling it.',
          tuning:
            'Always shuffle unless row order is meaningful (time series), and fix random_state so the split is ' +
            'reproducible across runs.',
        },
      ],
      whenToUse: [
        'The dataset is small or medium enough that holding out a single validation set would waste too much training data or give a noisy estimate',
        'You are comparing several models or hyperparameter settings and need a more stable score than one split provides',
      ],
      whenNotToUse: [
        'Rows are ordered in time and future information would leak backward — use a forward-chaining / time-series split instead of shuffled k-fold',
        'The dataset is large enough that a single held-out split is already a stable estimate, where k-fold only multiplies training cost for little extra precision',
        'Rows share structure (repeated subjects, sessions) that a naive fold split would break across train and test — use GroupKFold instead',
      ],
      facets: {
        task: ['classification', 'regression', 'forecasting'],
        dataType: ['tabular', 'timeseries', 'text', 'image'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'averaged-holdout-score-with-spread',
      },
      math: {
        latex: [
          'CV_{(k)} = \\frac{1}{k} \\sum_{i=1}^{k} \\mathrm{err}_i',
          '\\text{LOOCV: } k = n \\;\\Rightarrow\\; \\text{near-unbiased, high variance, } n \\text{ fits}',
        ],
        notes:
          'The bias-variance trade-off in k is real, not folklore: more folds means each training fold is closer ' +
          'in size to the full dataset (lower bias), but the k training sets overlap almost entirely, so the k ' +
          'error estimates become highly correlated and their average has higher variance. Leave-one-out sits at ' +
          'the bias-free extreme and pays for it with both cost (n fits) and variance; 5- or 10-fold sit in the ' +
          'middle, which is why they are the default recommendation rather than a computational shortcut.',
      },
      complexity: {
        train: 'k times the cost of one fit (k-fold); n times for leave-one-out',
        predict: 'n/a — a resampling procedure, not a fitted model',
      },
      code: [
        'from sklearn.model_selection import cross_val_score, StratifiedKFold',
        'from sklearn.linear_model import LogisticRegression',
        '',
        "cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=0)",
        "scores = cross_val_score(LogisticRegression(max_iter=1000), X, y, cv=cv, scoring='roc_auc')",
        '',
        'print(scores.mean(), scores.std())   # the estimate and its spread across folds',
      ].join('\n'),
      // Cross-body: bagging's out-of-bag score is the rival free-lunch estimate mars.ts's bagging
      // entry already points back here for.
      related: ['train-val-test-and-data-leakage', 'hyperparameter-search', 'bagging'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Cross-validation: evaluating estimator performance',
            url: 'https://scikit-learn.org/stable/modules/cross_validation.html',
          },
        ],
        papers: [
          {
            title: 'Cross-Validatory Choice and Assessment of Statistical Predictions',
            url: 'https://doi.org/10.1111/j.2517-6161.1974.tb00994.x',
            year: 1974,
          },
          {
            title: 'A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection',
            url: 'https://www.ijcai.org/Proceedings/95-2/Papers/016.pdf',
            year: 1995,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 7 — Model Assessment and Selection',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'classification-metrics',
      name: 'Classification Metrics',
      aliases: ['precision', 'recall', 'F1 score', 'ROC-AUC', 'PR-AUC', 'confusion matrix'],
      tier: 1,
      year: 2006,
      difficulty: 2,
      hook: 'Turns a confusion matrix into the one number that matches what a wrong prediction actually costs.',
      intuition:
        'Accuracy answers one question — what fraction of predictions were right — and that question is often the ' +
        'wrong one. If 99% of transactions are legitimate, a classifier that always predicts "legitimate" is 99% ' +
        'accurate and catches zero fraud. Precision and recall split the confusion matrix into two more honest ' +
        'questions: of the cases you flagged, how many were real (precision), and of the real cases, how many did ' +
        'you catch (recall)? Raising the decision threshold trades one for the other, so F1 collapses them into a ' +
        'single harmonic mean when you need one number. ROC-AUC and PR-AUC summarize that trade-off across every ' +
        'possible threshold at once, but they answer different questions: ROC-AUC compares true-positive rate ' +
        'against false-positive rate, and stays deceptively high even when a classifier is nearly useless, because ' +
        'the negative class is so large that a flood of false positives barely moves the false-positive *rate*. ' +
        'PR-AUC, built from precision and recall directly, does not have that blind spot.',
      howItWorks: {
        summary:
          'Build the confusion matrix at a chosen threshold, derive precision/recall/F1 from it, then sweep the ' +
          'threshold to trace ROC and precision-recall curves and summarize each with its area.',
        steps: [
          'Count true positives, false positives, true negatives and false negatives at a chosen decision threshold.',
          'Compute precision = TP/(TP+FP) and recall = TP/(TP+FN) from those counts.',
          'Combine them into F-beta (F1 when beta=1), the weighted harmonic mean of precision and recall.',
          'Sweep the threshold from 0 to 1, plotting true-positive rate against false-positive rate for ROC, or precision against recall for PR.',
          'Summarize each curve with its area: ROC-AUC, or average precision (PR-AUC).',
        ],
      },
      hyperparameters: [
        {
          name: 'decision threshold',
          what: 'The score cutoff above which a prediction counts as positive. Defaults to 0.5 for most classifiers.',
          tuning:
            'Move it toward recall when missing a positive is expensive (fraud, disease); toward precision when a ' +
            'false alarm is expensive. Choose it by reading the operating point off the PR curve, not by leaving ' +
            'the default.',
        },
        {
          name: 'average (multiclass)',
          what: 'How per-class precision/recall/F1 are combined into one number: macro, micro or weighted.',
          tuning:
            'Macro treats every class equally regardless of size, exposing poor performance on rare classes; ' +
            'weighted matches accuracy\'s emphasis on the frequent classes. Pick macro when the rare classes matter ' +
            'as much as the common ones.',
        },
      ],
      whenToUse: [
        'Classes are imbalanced, or the cost of a false positive differs from the cost of a false negative, where accuracy hides the failure mode entirely',
        'You need to compare classifiers across every possible threshold rather than committing to one — use the AUC summary of ROC or PR',
        'The positive class is what you actually care about (fraud, disease, churn) — precision and recall are defined around it directly',
      ],
      whenNotToUse: [
        'Classes are roughly balanced and every error costs the same — accuracy is simpler to explain and already tells the whole story',
        'The positive class is rare and you are reporting ROC-AUC as your headline number — it can look excellent while precision-recall shows the model is barely usable',
        'Stakeholders need one operating point for a deployed threshold, not a threshold-free summary — report precision/recall/F1 at the chosen threshold, not just the AUC',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular', 'text', 'image', 'audio'],
        dataSize: ['tiny', 'small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'scalar-score-or-curve',
      },
      math: {
        latex: [
          'P = \\frac{TP}{TP+FP}, \\quad R = \\frac{TP}{TP+FN}',
          'F_\\beta = (1+\\beta^2)\\,\\frac{P \\cdot R}{\\beta^2 P + R}',
          'TPR = \\frac{TP}{TP+FN}, \\quad FPR = \\frac{FP}{FP+TN}',
        ],
        notes:
          'The blind spot in ROC-AUC under imbalance is visible directly in FPR\'s denominator: TN dominates when ' +
          'negatives vastly outnumber positives, so even a large increase in false positives moves FPR very little. ' +
          'The same false positives are a much larger fraction of everything flagged positive — exactly ' +
          'precision\'s denominator — which is why Davis and Goadrich showed a curve dominating in ROC space does ' +
          'not necessarily dominate in PR space, and recommended reading PR curves on skewed data instead.',
      },
      complexity: {
        train: 'n/a — a scoring procedure, not a model',
        predict: 'O(n log n) to sort scores for a full ROC/PR sweep; O(n) for a fixed threshold',
      },
      code: [
        'from sklearn.metrics import (precision_recall_fscore_support,',
        '                              roc_auc_score, average_precision_score)',
        '',
        "y_score = clf.predict_proba(X_test)[:, 1]",
        'y_pred = (y_score >= 0.5).astype(int)',
        '',
        "precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')",
        '',
        '# threshold-free summaries: prefer average_precision on imbalanced data',
        'roc_auc = roc_auc_score(y_test, y_score)',
        'pr_auc = average_precision_score(y_test, y_score)',
      ].join('\n'),
      related: ['class-imbalance', 'calibration', 'logistic-regression'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Precision, recall and F-measures',
            url: 'https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-and-f-measures',
          },
        ],
        papers: [
          {
            title: 'The Relationship Between Precision-Recall and ROC Curves',
            url: 'https://doi.org/10.1145/1143844.1143874',
            year: 2006,
          },
        ],
        books: [
          {
            title: 'Introduction to Data Mining',
            author: 'Tan, Steinbach, Karpatne & Kumar',
            chapter: 'Ch. 4 — Classification: Basic Concepts and Techniques',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'regression-metrics',
      name: 'Regression Metrics',
      aliases: ['MAE', 'MSE', 'RMSE', 'R-squared', 'MAPE'],
      tier: 1,
      year: 2006,
      difficulty: 2,
      hook: 'Scores continuous predictions by how far off they are — and the choice of "how far" changes which model wins.',
      intuition:
        'There is no single right way to measure "how wrong" a continuous prediction is, and the metric you pick ' +
        'quietly chooses which errors you care about. Mean absolute error treats every unit of error the same, so ' +
        'a model optimizing it aims for the median. Mean squared error punishes large errors disproportionately — ' +
        'a single terrible prediction can dominate the score — so a model optimizing it aims for the mean, which ' +
        'is why it is the natural partner to a Gaussian-noise assumption. RMSE is the same quantity back in the ' +
        'original units, which makes it readable but keeps the outlier sensitivity. R-squared rescales error ' +
        'against a naive baseline (always predict the mean), so it answers "better than guessing the average, and ' +
        'by how much" rather than giving an absolute error size. Percentage-based metrics like MAPE seem intuitive ' +
        'but break down whenever the true value is near zero, where a tiny denominator turns a small error into an ' +
        'enormous percentage.',
      howItWorks: {
        summary:
          'Compute the residual for every prediction, then summarize the residuals with an absolute, squared, or ' +
          'scaled aggregate depending on which kind of error should dominate the score.',
        steps: [
          'Compute the residual y_i - ŷ_i for every prediction.',
          'For MAE, average the absolute residuals; for MSE, average the squared residuals.',
          'Take the square root of MSE to get RMSE, back in the original units.',
          'For R-squared, compare the model\'s squared error against the squared error of always predicting the mean.',
          'For MAPE, divide each residual by the true value before averaging — and check for values near zero first.',
        ],
      },
      whenToUse: [
        'Outliers in the target are genuine and should be penalized heavily — use MSE/RMSE, which weight large errors more',
        'Errors should be judged in the original units and interpreted directly by a non-technical stakeholder — RMSE or MAE, not R-squared',
        'You need a scale-free sense of "better than a naive baseline" to compare across different targets — R-squared',
      ],
      whenNotToUse: [
        'The target can be zero or near-zero, or crosses zero — MAPE is undefined or explodes there; use MAE, RMSE, or a scaled error like MASE instead',
        'A handful of extreme outliers are data errors rather than real signal — MSE/RMSE will let a few bad rows dominate the score; use MAE or a robust loss instead',
        'You are comparing raw error values across datasets with very different target scales — MAE/RMSE are not comparable across targets; use R-squared or a scaled error instead',
      ],
      facets: {
        task: ['regression', 'forecasting'],
        dataType: ['tabular', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'scalar-error-score',
      },
      math: {
        latex: [
          '\\mathrm{MAE} = \\frac{1}{n}\\sum_{i=1}^n |y_i - \\hat{y}_i|',
          '\\mathrm{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{i=1}^n (y_i - \\hat{y}_i)^2}',
          'R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2}',
        ],
        notes:
          'MAPE is undefined whenever y_i = 0 and unstable whenever y_i is close to zero, since the error is ' +
          'divided by y_i itself rather than by a fixed quantity. Hyndman and Koehler\'s review of forecast ' +
          'accuracy measures documents this and several related degeneracies (including in the "symmetric" MAPE ' +
          'variant meant to fix it), which is why forecasting practice increasingly favors scaled errors like MASE ' +
          'over percentage errors.',
      },
      complexity: {
        train: 'n/a — a scoring procedure, not a model',
        predict: 'O(n) — one pass over the residuals',
      },
      code: [
        'from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score',
        '',
        'mae = mean_absolute_error(y_test, y_pred)',
        'rmse = mean_squared_error(y_test, y_pred) ** 0.5   # or root_mean_squared_error in sklearn >= 1.4',
        'r2 = r2_score(y_test, y_pred)',
        '',
        '# skip MAPE if y_test can be zero or near-zero -- it will blow up',
        'import numpy as np',
        'safe = np.abs(y_test) > 1e-6',
        'mape = np.mean(np.abs((y_test[safe] - y_pred[safe]) / y_test[safe]))',
      ].join('\n'),
      related: ['classification-metrics', 'overfitting-and-regularization', 'linear-regression'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Regression metrics',
            url: 'https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics',
          },
          {
            title: 'Forecasting: Principles and Practice — 5.8 Evaluating point forecast accuracy',
            url: 'https://otexts.com/fpp3/accuracy.html',
          },
        ],
        papers: [
          {
            title: 'Another Look at Measures of Forecast Accuracy',
            url: 'https://doi.org/10.1016/j.ijforecast.2006.03.001',
            year: 2006,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 7 — Model Assessment and Selection',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'overfitting-and-regularization',
      name: 'Overfitting & Regularization',
      aliases: ['bias-variance tradeoff', 'model complexity', 'L1/L2 regularization'],
      tier: 1,
      year: 1992,
      difficulty: 3,
      hook: 'A model that memorizes training noise is punished for its own complexity until it settles for signal.',
      intuition:
        'Every prediction error can be split into two very different sources. Bias is error from a model too ' +
        'simple to represent the true pattern — a straight line fit to a curve, wrong no matter how much data you ' +
        'feed it. Variance is error from a model so flexible that it fits the particular noise in this training ' +
        'set, and would fit a different noise pattern if you resampled the data — right on average, wrong on any ' +
        'one draw. Overfitting is variance winning: training error keeps falling while validation error turns ' +
        'around and rises, because the model has started memorizing quirks that do not generalize. Regularization ' +
        'fights this by adding a cost for complexity directly into what the model optimizes — an L2 penalty ' +
        'shrinks every weight toward zero and spreads influence across correlated features, an L1 penalty pushes ' +
        'weights to exactly zero and performs feature selection as a side effect, and early stopping simply halts ' +
        'training before the memorization phase begins. All three trade a little bias for a lot less variance.',
      howItWorks: {
        summary:
          'Track training and validation error as model complexity grows: overfitting is the gap opening between ' +
          'them, and regularization closes it by penalizing complexity in the objective.',
        steps: [
          'Fit models of increasing complexity (more features, deeper trees, more epochs) and record both training and validation error at each point.',
          'Watch for the point where training error keeps falling but validation error stops falling and turns upward — that gap is overfitting.',
          'Add a penalty term to the loss that grows with model complexity (sum of squared weights for L2, sum of absolute weights for L1).',
          'Re-fit with the penalty and re-check the training/validation gap; increase the penalty strength if the gap is still open.',
          'Alternatively, stop training early — at the epoch or iteration where validation error is lowest — rather than penalizing the objective directly.',
        ],
      },
      hyperparameters: [
        {
          name: 'regularization strength (alpha / lambda / C)',
          what: 'How heavily the complexity penalty is weighted against the original loss.',
          tuning:
            'Search it on a log scale (e.g. 1e-4 to 1e2) against validation error, not training error — training ' +
            'error is monotonically worse as the penalty grows, by construction.',
        },
        {
          name: 'penalty type (L1 vs L2 vs elastic net)',
          what: 'Which norm of the weights is penalized.',
          tuning:
            'Use L2 when most features are likely relevant and you want to shrink without eliminating; use L1 when ' +
            'you expect many features to be irrelevant and want automatic selection; elastic net blends both when ' +
            'features are also correlated.',
        },
      ],
      whenToUse: [
        'Validation error is visibly worse than training error and the gap grows as you add capacity — the textbook overfitting signature',
        'The number of features is large relative to the number of rows, where an unpenalized model has more freedom than the data can constrain',
        'You want built-in feature selection alongside fitting — L1 zeroes out irrelevant weights automatically',
      ],
      whenNotToUse: [
        'Training error itself is already high (underfitting) — regularization makes a high-bias model worse; add capacity or features instead',
        'Features are on very different scales and have not been standardized — the penalty is applied per coefficient, so unscaled features get penalized unevenly',
        'The gap between training and validation error is already small and stable — added regularization only trades away accuracy you were not losing',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'penalized-model-fit',
      },
      math: {
        latex: [
          '\\mathrm{Err}(x) = \\sigma^2 + \\mathrm{Bias}^2(x) + \\mathrm{Var}(x)',
          '\\mathcal{L}_{\\text{ridge}} = \\mathcal{L}_{\\text{orig}} + \\lambda \\sum_j w_j^2',
          '\\mathcal{L}_{\\text{lasso}} = \\mathcal{L}_{\\text{orig}} + \\lambda \\sum_j |w_j|',
        ],
        notes:
          'Geman, Bienenstock and Doursat\'s formal decomposition is what makes "overfitting" a precise claim ' +
          'rather than a vibe: expected error at a point splits exactly into irreducible noise, squared bias, and ' +
          'variance, and nothing else. Complexity moves bias and variance in opposite directions, which is why ' +
          'there is a trade-off rather than a knob you can just turn up — regularization is one specific way to ' +
          'move along that trade-off, by constraining the weights rather than the model family itself.',
      },
      code: [
        'from sklearn.linear_model import Ridge',
        'from sklearn.model_selection import validation_curve',
        'import numpy as np',
        '',
        'alphas = np.logspace(-4, 2, 20)',
        'train_scores, val_scores = validation_curve(',
        "    Ridge(), X, y, param_name='alpha', param_range=alphas, cv=5, scoring='r2')",
        '',
        '# pick alpha from the VALIDATION curve, never the training curve --',
        '# training score only gets worse as alpha grows, by construction',
        'best_alpha = alphas[val_scores.mean(axis=1).argmax()]',
      ].join('\n'),
      related: ['cross-validation', 'hyperparameter-search', 'ridge-regression', 'lasso'],
      references: {
        free: [
          {
            title: 'scikit-learn — Underfitting vs. Overfitting',
            url: 'https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html',
          },
          {
            title: 'scikit-learn user guide — Linear Models (Ridge, Lasso and regularization)',
            url: 'https://scikit-learn.org/stable/modules/linear_model.html',
          },
        ],
        papers: [
          {
            title: 'Neural Networks and the Bias/Variance Dilemma',
            url: 'https://doi.org/10.1162/neco.1992.4.1.1',
            year: 1992,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 7 — Model Assessment and Selection',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'class-imbalance',
      name: 'Class Imbalance',
      aliases: ['imbalanced classification', 'imbalanced learning', 'SMOTE'],
      tier: 1,
      year: 2002,
      difficulty: 3,
      hook: 'When one class is rare, accuracy stops meaning anything — these are the fixes, in training and in scoring.',
      intuition:
        'A classifier trained on 995 negative examples and 5 positive ones can hit 99.5% accuracy by never ' +
        'predicting positive at all, and the loss it optimizes agrees: getting the 5 rare examples right barely ' +
        'moves the average, so there is little incentive to bother. Class imbalance is this mismatch between what ' +
        'the data is like and what the loss function silently assumes — roughly equal classes. The fixes attack ' +
        'either side. Resampling changes the data the model sees: undersample the majority, oversample the ' +
        'minority by duplicating it, or synthesize new minority examples by interpolating between real minority ' +
        'points and their nearest same-class neighbours (SMOTE), so the model encounters the rare class often ' +
        'enough to learn its boundary. Reweighting instead changes the loss directly, without touching a single ' +
        'row — misclassifying a minority example is made to cost more, so gradient descent finally has a reason to ' +
        'care. Both need to be paired with a metric that does not share accuracy\'s blind spot.',
      howItWorks: {
        summary:
          'Rebalance what the model sees or what it is penalized for — by resampling the training rows, ' +
          'reweighting the loss, or both — then evaluate with a metric that does not collapse under imbalance.',
        steps: [
          'Check the class ratio and decide whether it is severe enough to need intervention (rules of thumb start around 1:10 and get more urgent past 1:100).',
          'Resample the training set: undersample the majority, oversample the minority, or generate synthetic minority examples with SMOTE.',
          'Or reweight the loss so misclassifying the minority class costs more, without changing the row counts at all.',
          'Re-fit the model and evaluate on the original, untouched class distribution — never resample the validation or test set.',
          'Score with precision/recall/F1 or PR-AUC rather than accuracy or plain ROC-AUC, which both understate the failure.',
        ],
      },
      hyperparameters: [
        {
          name: 'sampling_strategy',
          what: 'Target class ratio after resampling (e.g. bring the minority up to 50% of the majority count).',
          tuning:
            'Full 1:1 balance is a starting point, not a rule — over-oversampling a very rare class can just ' +
            'relocate the problem into overfitting on synthetic points. Sweep it against validation PR-AUC rather ' +
            'than assuming 1:1 is best.',
        },
        {
          name: 'k_neighbors (SMOTE)',
          what: 'How many same-class nearest neighbours SMOTE draws the interpolation partner from. Defaults to 5.',
          tuning:
            'Lower it if the minority class is very small (fewer than k neighbours will error); raising it smooths ' +
            'the synthetic points further from any single noisy example.',
        },
        {
          name: 'class_weight',
          what:
            'Per-class multiplier on the loss, used instead of or alongside resampling. "balanced" sets weights ' +
            'inversely proportional to class frequency.',
          tuning:
            'Try "balanced" first — it is free (no synthetic data, no dropped rows) and often competitive with ' +
            'resampling on linear models and trees.',
        },
      ],
      whenToUse: [
        'The minority class is the one that actually matters (fraud, disease, defect) and missing it is far more costly than a false alarm',
        'The class ratio is severe enough that a naive classifier can win on accuracy by ignoring the minority class entirely',
        'Features are continuous and moderate-dimensional, where SMOTE\'s nearest-neighbour interpolation produces plausible synthetic points',
      ],
      whenNotToUse: [
        'The imbalance reflects the real deployment distribution and you will judge the model with a threshold-appropriate metric anyway — sometimes class_weight alone, or no intervention, is enough',
        'Features are high-cardinality categorical or very high-dimensional and sparse (e.g. raw text counts), where SMOTE\'s Euclidean interpolation between neighbours stops being meaningful',
        'The minority class has very few examples (a few dozen or fewer) — synthetic interpolation there mostly amplifies noise rather than signal',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'rebalanced-training-set-or-reweighted-loss',
      },
      math: {
        latex: [
          'x_{\\text{new}} = x_i + \\lambda \\,(x_{\\text{nn}} - x_i), \\quad \\lambda \\sim U(0,1)',
          'w_c = \\frac{n_{\\text{samples}}}{n_{\\text{classes}} \\cdot n_c}',
        ],
        notes:
          'The SMOTE formula interpolates strictly between a minority example x_i and one of its k nearest ' +
          'neighbours from the same minority class, x_nn — not any nearby point regardless of label. That ' +
          'constraint is easy to lose in casual descriptions of the method (the original paper is explicit: ' +
          '"synthetic examples along the line segments joining any/all of the k minority class nearest ' +
          'neighbors") but is exactly what keeps synthetic points inside the minority region instead of drifting ' +
          'toward the majority class. class_weight\'s "balanced" formula is scikit-learn\'s literal implementation: ' +
          'each class is weighted inversely to how often it appears, so together the class weights sum to the ' +
          'same total loss mass a balanced dataset would produce.',
      },
      complexity: {
        train: 'SMOTE: O(n_minority · k) for the neighbour search, then a normal fit on the enlarged set; class_weight: no added cost',
        predict: 'n/a — both techniques affect training only',
      },
      code: [
        'from imblearn.over_sampling import SMOTE',
        'from imblearn.pipeline import Pipeline as ImbPipeline',
        'from sklearn.linear_model import LogisticRegression',
        '',
        '# SMOTE must live inside the pipeline / CV loop -- fit it on the training fold only,',
        '# never on data that also appears in validation or test',
        'pipe = ImbPipeline([',
        "    ('smote', SMOTE(k_neighbors=5, random_state=0)),",
        "    ('clf', LogisticRegression(max_iter=1000)),",
        '])',
        'pipe.fit(X_train, y_train)',
        '',
        '# the cheaper first move: no synthetic data, no dropped rows',
        "clf_weighted = LogisticRegression(class_weight='balanced', max_iter=1000)",
      ].join('\n'),
      related: ['classification-metrics', 'cross-validation', 'logistic-regression', 'random-forest'],
      references: {
        free: [
          {
            title: 'imbalanced-learn user guide — Over-sampling (SMOTE and variants)',
            url: 'https://imbalanced-learn.org/stable/over_sampling.html',
          },
          {
            title: 'scikit-learn API — compute_class_weight',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.utils.class_weight.compute_class_weight.html',
          },
        ],
        papers: [
          {
            title: 'SMOTE: Synthetic Minority Over-sampling Technique',
            url: 'https://doi.org/10.1613/jair.953',
            year: 2002,
          },
          {
            title: 'Learning from Imbalanced Data',
            url: 'https://doi.org/10.1109/TKDE.2008.239',
            year: 2009,
          },
        ],
        books: [
          {
            title: 'Introduction to Data Mining',
            author: 'Tan, Steinbach, Karpatne & Kumar',
            chapter: 'Ch. 4 — Classification: Alternative Techniques (class imbalance)',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'hyperparameter-search',
      name: 'Hyperparameter Search',
      aliases: ['hyperparameter tuning', 'grid search', 'random search', 'HPO'],
      tier: 1,
      year: 2012,
      difficulty: 2,
      hook: 'Automates the knob-turning: try every combination, sample randomly, or let a model guess the next one.',
      intuition:
        'Most models have a handful of settings that are not learned from data — how many trees, how strong a ' +
        'penalty, how deep a tree — and picking them well can matter as much as picking the model. Grid search is ' +
        'the obvious approach: lay out a few candidate values per knob and try every combination. It is exhaustive ' +
        'and easy to reason about, but the number of combinations multiplies across knobs, so it wastes most of ' +
        'its budget on knobs that barely matter. Random search fixes exactly that: sample each knob independently ' +
        'from a distribution, for as many trials as you can afford. Because only a few knobs usually matter for ' +
        'any given problem, and which ones matter changes from problem to problem, random search explores every ' +
        'knob\'s full range instead of a grid\'s fixed, coarse steps — Bergstra and Bengio showed it finds equally ' +
        'good or better settings than grid search in a fraction of the trials. Bayesian optimization goes further ' +
        'still, using earlier trials to choose where to look next instead of sampling blindly.',
      howItWorks: {
        summary:
          'Score a candidate hyperparameter setting by cross-validated performance, choose the next candidate to ' +
          'try, and repeat within a fixed budget of trials.',
        steps: [
          'Define the search space: a discrete grid of values (grid search) or a distribution per hyperparameter (random search).',
          'For each candidate setting, fit the model with cross-validation and record the mean validation score.',
          'Grid search tries every combination; random search draws n_iter independent samples from the space instead.',
          'Keep the setting with the best cross-validated score.',
          'Refit the model on the full training set with that setting, and evaluate once on the held-out test set.',
        ],
      },
      hyperparameters: [
        {
          name: 'search space',
          what: 'The grid or distribution defined per hyperparameter.',
          tuning:
            'For random search, prefer a log-uniform distribution for scale parameters (learning rate, ' +
            'regularization strength) so trials cover orders of magnitude rather than clustering near one end.',
        },
        {
          name: 'n_iter (random search)',
          what: 'Number of settings sampled. Grid search has no equivalent — its trial count is fixed by the grid size.',
          tuning:
            'Set it as high as the compute budget allows; Bergstra and Bengio found random search competitive with ' +
            'grid search using a small fraction of the grid\'s trial count.',
        },
        {
          name: 'cv',
          what: 'The cross-validation scheme used to score each candidate.',
          tuning:
            'Use the same CV strategy you would use for model evaluation (stratified k-fold for classification, ' +
            'group- or time-aware splits where rows are grouped or ordered) — the search is only as honest as the ' +
            'score it optimizes.',
        },
      ],
      whenToUse: [
        'The search space is small (two or three hyperparameters, each with a handful of sensible values) — grid search is exhaustive and easy to reason about there',
        'The search space is larger or its important dimensions are unknown in advance — random search covers it far more efficiently per trial',
        'You can afford dozens to hundreds of cross-validated fits; each candidate re-trains the model from scratch',
      ],
      whenNotToUse: [
        'A single training run is already expensive (large neural networks, huge ensembles) — plain grid or random search wastes most trials on clearly-bad settings; use a more sample-efficient method instead',
        'Hyperparameters interact strongly and the space is high-dimensional — grid search\'s combinatorial cost becomes infeasible well before it covers the space',
        'You have not fixed the evaluation metric and CV scheme first — tuning against the wrong score just finds the setting that best games that score',
      ],
      facets: {
        task: ['classification', 'regression', 'clustering', 'forecasting'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'selected-hyperparameter-setting',
      },
      math: {
        latex: ['|\\text{grid}| = \\prod_{j=1}^{d} |\\text{values}_j|'],
        notes:
          'The combinatorial blow-up is the whole argument for random search: a grid with d hyperparameters and m ' +
          'values each costs m^d trials, so adding a knob multiplies cost rather than adding to it. Random search ' +
          'pays a fixed, chosen number of trials regardless of d, at the cost of no longer guaranteeing every ' +
          'combination is tried — a trade Bergstra and Bengio justify empirically by showing that for typical ' +
          'problems only a handful of hyperparameters actually matter, so most of a grid\'s trials were wasted on ' +
          'dimensions that never moved the score.',
      },
      complexity: {
        train: 'grid: O(m^d) fits for d hyperparameters with m values each; random: O(n_iter) fits, fixed by budget',
        predict: 'n/a — a search procedure, not a model',
      },
      code: [
        'from sklearn.model_selection import RandomizedSearchCV',
        'from scipy.stats import loguniform',
        'from sklearn.ensemble import GradientBoostingClassifier',
        '',
        'param_dist = {',
        "    'learning_rate': loguniform(1e-3, 3e-1),",
        "    'max_depth': [2, 3, 4, 5, 6],",
        "    'subsample': [0.6, 0.8, 1.0],",
        '}',
        '',
        'search = RandomizedSearchCV(',
        '    GradientBoostingClassifier(random_state=0),',
        '    param_distributions=param_dist,',
        "    n_iter=60, cv=5, scoring='roc_auc', random_state=0, n_jobs=-1,",
        ')',
        'search.fit(X_train, y_train)',
        'print(search.best_params_, search.best_score_)',
      ].join('\n'),
      // Cross-link pass: add `bayesian-optimization` (Uranus) once written -- the natural next step
      // past random search, referenced by name only in the intuition above.
      related: ['cross-validation', 'overfitting-and-regularization', 'ridge-regression', 'xgboost'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Tuning the hyper-parameters of an estimator',
            url: 'https://scikit-learn.org/stable/modules/grid_search.html',
          },
        ],
        papers: [
          {
            title: 'Random Search for Hyper-Parameter Optimization',
            url: 'https://jmlr.org/papers/v13/bergstra12a.html',
            year: 2012,
          },
        ],
        books: [
          {
            title: 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow',
            author: 'Géron',
            chapter: 'Ch. 2 — Fine-Tune Your Model (grid search and randomized search)',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'calibration',
      name: 'Calibration (Platt Scaling, Isotonic)',
      aliases: ['probability calibration', 'Platt scaling', 'isotonic regression', 'reliability diagram'],
      tier: 2,
      year: 1999,
      difficulty: 3,
      hook: 'Reshapes a model\'s raw scores so "the model said 70%" actually happens about 70% of the time.',
      intuition:
        'A classifier\'s predict_proba output is not automatically a real probability — it is whatever number the ' +
        'training procedure happens to produce, and for many models (SVMs, boosted trees, naive Bayes) that number ' +
        'is systematically too extreme or too timid. A model can be perfectly accurate at ranking examples (it ' +
        'always scores the true positives higher than the true negatives) while being badly calibrated (the ' +
        'numbers it attaches to them are meaningless as probabilities). Calibration fixes the numbers without ' +
        'touching the ranking: fit a second, small model that maps raw scores to corrected probabilities, using ' +
        'held-out data the original model did not train on. Platt scaling fits a logistic curve through the scores ' +
        '— cheap, stable on small data, but can only stretch or squash the curve into an S shape. Isotonic ' +
        'regression instead fits any non-decreasing step function, which is more flexible and fixes more exotic ' +
        'miscalibration, but needs enough held-out data to avoid just memorizing it.',
      howItWorks: {
        summary:
          'Hold out a slice of data the classifier never trained on, then fit a second, simple model that maps its ' +
          'raw scores to corrected probabilities.',
        steps: [
          'Train the base classifier as usual, then set aside a calibration set it has not seen (or use cross-validated out-of-fold predictions).',
          'Get the base classifier\'s raw scores on that held-out set.',
          'Fit Platt scaling (a 1-D logistic regression from score to label) or isotonic regression (a non-decreasing step function) on those (score, label) pairs.',
          'At prediction time, pass new raw scores through the fitted calibrator to get corrected probabilities.',
        ],
      },
      whenToUse: [
        'Predicted probabilities feed into a downstream decision that depends on their actual value, not just the ranking — expected-cost thresholds, risk scores shown to a person',
        'The base classifier is known to be poorly calibrated by construction (SVM margins, naive Bayes\'s often-too-extreme posteriors, boosted trees before calibration)',
      ],
      whenNotToUse: [
        'Only the ranking of predictions matters (top-k selection, AUC-style evaluation) — calibration cannot improve a ranking metric, it only rescales the scores',
        'There is not enough held-out data to fit the calibrator without overfitting it — isotonic regression in particular needs on the order of 1,000+ calibration samples',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'calibrated-class-probabilities',
      },
      related: ['classification-metrics', 'class-imbalance', 'logistic-regression'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Probability calibration',
            url: 'https://scikit-learn.org/stable/modules/calibration.html',
          },
        ],
        papers: [
          {
            title: 'Probabilistic Outputs for Support Vector Machines and Comparisons to Regularized Likelihood Methods',
            url: 'https://www.cs.colorado.edu/~mozer/Teaching/syllabi/6622/papers/Platt1999.pdf',
            year: 1999,
          },
          {
            title: 'Transforming Classifier Scores into Accurate Multiclass Probability Estimates',
            url: 'https://doi.org/10.1145/775047.775151',
            year: 2002,
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
  ],
} satisfies Body;
