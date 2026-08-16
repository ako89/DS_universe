/**
 * Pallas — Interpretability & Trust. See PLAN.md §3 for the full moon list (6 moons, all written
 * here in this Phase 3 batch).
 *
 * Every entry was written from opened sources — see the per-entry comments below for what was
 * checked. Two items worth flagging up front:
 *
 * - `partial-dependence-ice` bundles two distinct contributions under one Tier 2 entry: Friedman's
 *   original partial dependence plot (Annals of Statistics, 2001 — the same paper cited for
 *   gradient boosting in mars.ts) and Goldstein, Kapelner, Bleich & Pitkin's individual conditional
 *   expectation plot (JCGS, print year 2015; the arXiv preprint is dated 2013). `year: 2001` is
 *   used for the entry because PDP is the foundational technique the entry is anchored to; ICE is
 *   presented in the prose as the later refinement it is, with its own paper cited.
 * - `counterfactual-explanations` and `fairness-and-bias-auditing` both cite Wachter, Mittelstadt &
 *   Russell (2018) and Hardt, Price & Srebro (2016) respectively by their journal/proceedings year,
 *   not the arXiv preprint year, matching the bagging/adaboost convention already established in
 *   mars.ts of citing the archival publication over the earlier preprint.
 *
 * `eraRange` is [2001, 2018]: Friedman's PDP paper (2001) is the earliest moon; Wachter et al.'s
 * Harvard JOLT counterfactual-explanations paper (Spring 2018 issue) is the latest.
 *
 * A note on `facets.task`: the schema's Task union has no "explanation" or "auditing" value, so
 * every moon here is tagged with the tasks its underlying model is normally solving
 * (`classification`, `regression`) rather than a task of its own — same convention self-attention
 * uses in nova.ts for a building block rather than a full model.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'pallas',
  name: 'Pallas',
  segment: 'Interpretability & Trust',
  hook: "Doesn't build predictions — opens up models that already exist and asks them to justify themselves.",
  summary:
    'Pallas holds the methods you reach for after a model is already trained and you need to answer a harder ' +
    'question than "how accurate is it" — which features actually drove this one prediction, what would have ' +
    'had to be different for the outcome to change, and whether the model treats some groups worse than ' +
    "others. None of these methods make a model more accurate; they make it accountable.",
  eraRange: [2001, 2018],
  moons: [
    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/1705.07874 (SHAP paper, verified title/authors/year — "To appear
    // in NIPS 2017" in the submission history); crossref DOI record for 10.1038/s42256-019-0138-9
    // (TreeSHAP paper metadata); shap.readthedocs.io TreeExplainer page ("a fast and exact method to
    // estimate SHAP values for tree models and ensembles of trees"); arxiv.org/abs/1905.04610
    // (TreeSHAP arXiv preprint, confirms "first polynomial time algorithm"); PMC9044362 (GPUTreeShap
    // paper, HTML, quotes the O(TLD^2) bound with explicit attribution to Lundberg et al. 2020) —
    // used instead of pulling that number from the Nature-paywalled or Berkeley PDF versions.
    {
      id: 'shap',
      name: 'SHAP',
      aliases: ['SHapley Additive exPlanations', 'Shapley additive explanations'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Splits a prediction fairly among its features using Shapley values from cooperative game theory.',
      intuition:
        'Imagine a prediction as the payout of a game, and the features as players who cooperated to produce ' +
        'it. Game theory already has an answer for how to split a payout fairly among cooperating players: ' +
        "the Shapley value, which credits each player with its average marginal contribution across every " +
        "possible order the players could have joined in. SHAP applies exactly this to a model. Start from a " +
        "baseline prediction (the model's average output over some background data), then ask, for every " +
        'possible subset of features already "in the game", how much adding this one feature changes the ' +
        "prediction. Average that change over all subsets and you get the feature's SHAP value. Sum every " +
        "feature's SHAP value plus the baseline and you land exactly back on the model's actual prediction — " +
        'that guarantee, not just intuition, is why SHAP displaced ad hoc attribution scores.',
      howItWorks: {
        summary:
          'Treat features as players in a cooperative game whose payout is the model output, and assign each ' +
          "feature its Shapley value — its average marginal contribution across every ordering of features " +
          'entering the prediction.',
        steps: [
          "Fix a baseline: the model's expected output over a background dataset.",
          'For a given instance, consider a subset S of features already "present"; the rest are held at their baseline values.',
          "Measure the marginal contribution of adding one more feature to S: the model's output with it minus without it.",
          'Average that marginal contribution over every possible subset S and every ordering, weighted per the Shapley formula.',
          'That average is the feature\'s SHAP value; by construction, baseline plus all SHAP values equals the actual prediction.',
          'Because exact enumeration is exponential, use an approximation: KernelSHAP samples coalitions and fits a weighted linear model; TreeSHAP computes the exact values in polynomial time by walking tree paths.',
        ],
      },
      hyperparameters: [
        {
          name: 'background / reference dataset',
          what: 'The data used to define the baseline ("absent") value of each feature.',
          tuning:
            'Use a representative sample of the training distribution, typically 50-200 rows for KernelSHAP ' +
            '(more is more accurate but slower). TreeSHAP can use the whole training set efficiently.',
        },
        {
          name: 'nsamples (KernelSHAP)',
          what: 'Number of feature-coalition samples drawn to fit the weighted linear approximation.',
          tuning:
            'Higher reduces variance in the estimate at the cost of runtime; the library default scales with ' +
            'the number of features. Prefer TreeSHAP outright for tree ensembles instead of raising this.',
        },
      ],
      whenToUse: [
        "You need per-prediction attributions that provably sum to the model's actual output (local accuracy), not just a heuristic score",
        'The model is a tree ensemble — random forest, gradient boosting, XGBoost, LightGBM — where TreeSHAP computes exact values in polynomial time',
        "Stakeholders need explanations that satisfy consistency: a feature that helps the prediction more in one model version can't get a lower attribution",
      ],
      whenNotToUse: [
        'The model is not tree-based and has many features — KernelSHAP falls back to sampling coalitions and gets slow and noisy as feature count grows',
        'Features are strongly correlated — the game-theoretic split can attribute credit to a feature that is really just standing in for its correlated partner',
        'You only need a fast, one-shot global ranking of feature importance rather than per-prediction attributions — permutation importance is far cheaper',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'per-feature-shapley-attributions',
      },
      math: {
        latex: [
          '\\phi_i = \\sum_{S \\subseteq F \\setminus \\{i\\}} \\frac{|S|!\\,(|F| - |S| - 1)!}{|F|!} \\left[ f(S \\cup \\{i\\}) - f(S) \\right]',
          'f(x) = \\phi_0 + \\sum_{i=1}^{M} \\phi_i',
        ],
        notes:
          'Lundberg and Lee show this is the unique attribution satisfying three properties together — local ' +
          'accuracy (the second line above), missingness (an absent feature gets zero credit) and consistency ' +
          '(a feature\'s attribution cannot drop if its marginal contribution rises in every possible ' +
          "coalition). Computing the sum exactly is exponential in the number of features, which is exactly " +
          'why KernelSHAP and TreeSHAP exist as approximations rather than optional conveniences. TreeSHAP is ' +
          "not an approximation in the usual sense — Lundberg et al.'s 2020 algorithm computes the exact same " +
          'Shapley values in O(T·L·D^2) by exploiting tree structure instead of enumerating coalitions, where ' +
          'T is the number of trees, L the max leaves per tree and D the max depth.',
      },
      complexity: {
        train: 'n/a — SHAP explains an already-fitted model, it does not fit one',
        predict:
          'TreeSHAP: O(T·L·D^2) per explained instance, exact. KernelSHAP: exponential in the worst case, ' +
          'approximated by sampling a fixed number of coalitions per instance.',
      },
      code: [
        'import shap',
        '',
        'explainer = shap.TreeExplainer(model)      # exact and fast for tree ensembles',
        'shap_values = explainer(X_test)',
        '',
        'shap.plots.waterfall(shap_values[0])       # one prediction, feature by feature',
        'shap.plots.beeswarm(shap_values)           # global summary across all rows',
        '',
        '# non-tree model: fall back to the general-purpose, slower explainer',
        'kernel_explainer = shap.KernelExplainer(model.predict, background_data)',
        'kernel_shap_values = kernel_explainer.shap_values(X_test.iloc[:50])',
      ].join('\n'),
      // Cross-link pass: add a neural-network-specific attribution method (integrated gradients /
      // saliency, Aegis) once that body exists — SHAP's DeepExplainer sits in the same space.
      related: ['lime', 'feature-importance', 'random-forest', 'xgboost', 'gradient-boosting'],
      references: {
        free: [
          {
            title: 'SHAP documentation — shap.TreeExplainer',
            url: 'https://shap.readthedocs.io/en/latest/generated/shap.TreeExplainer.html',
          },
          { title: 'SHAP documentation — overview', url: 'https://shap.readthedocs.io/en/latest/' },
        ],
        papers: [
          { title: 'A Unified Approach to Interpreting Model Predictions', url: 'https://arxiv.org/abs/1705.07874', year: 2017 },
          {
            title: 'From Local Explanations to Global Understanding with Explainable AI for Trees',
            url: 'https://doi.org/10.1038/s42256-019-0138-9',
            year: 2020,
          },
        ],
        books: [
          {
            title: 'Interpretable Machine Learning',
            author: 'Christoph Molnar',
            chapter: 'Ch. 18 — SHAP',
            url: 'https://christophm.github.io/interpretable-ml-book/shap.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/1602.04938 (LIME paper abs page, verified title/authors/date);
    // ar5iv.labs.arxiv.org/html/1602.04938 (full HTML rendering of the actual paper text — used to
    // quote Equation 1, xi(x) = argmin_g L(f,g,pi_x) + Omega(g), and its term definitions verbatim
    // from the source rather than from memory); github.com/marcotcr/lime README (perturbation +
    // proximity weighting + sparse linear surrogate description, and confirmed categorical tabular
    // data support).
    {
      id: 'lime',
      name: 'LIME',
      aliases: ['Local Interpretable Model-agnostic Explanations'],
      tier: 1,
      year: 2016,
      difficulty: 3,
      hook: 'Explains one prediction by fitting a simple, honest model only in the neighbourhood around it.',
      intuition:
        'A complicated model can still look almost linear if you zoom in close enough to one point — the way ' +
        'a curved road looks straight from a few metres away. LIME exploits exactly that. To explain a single ' +
        'prediction, it does not touch the real model\'s internals at all; it perturbs the instance — masking ' +
        'words, blanking image patches, jittering tabular feature values — and asks the real model for a ' +
        "prediction on each perturbed version. It then fits a simple, sparse model (usually linear) to those " +
        "perturbed samples, weighting each one by how close it is to the original instance, so points nearby " +
        'matter more than points far away. That local surrogate is not meant to be a good model globally — it ' +
        'is meant to be locally faithful, and its handful of coefficients become the explanation for that one ' +
        'prediction.',
      howItWorks: {
        summary:
          'Perturb the instance being explained, query the black-box model on each perturbation, weight the ' +
          'perturbations by proximity, and fit a sparse local surrogate whose coefficients are the explanation.',
        steps: [
          'Pick the instance x whose prediction needs explaining.',
          'Generate perturbed samples around x in an interpretable representation (turn words or superpixels on/off, jitter tabular features).',
          "Get the black-box model's prediction (or class probability) for every perturbed sample.",
          'Weight each perturbed sample by a proximity kernel pi_x, so samples closer to x count more.',
          'Fit an interpretable model g (typically sparse linear regression) that minimises weighted loss against the black-box predictions, plus a complexity penalty.',
          "Read g's coefficients as the explanation: which features pushed this one prediction up or down, locally.",
        ],
      },
      hyperparameters: [
        {
          name: 'kernel width',
          what: 'Controls how quickly the proximity weight pi_x falls off with distance from x.',
          tuning:
            'Narrower focuses the surrogate on a tighter neighbourhood (more locally faithful, noisier fit); ' +
            'wider smooths over more of the model and risks the surrogate no longer matching local behaviour.',
        },
        {
          name: 'num_features',
          what: 'How many features the sparse surrogate is allowed to use (its complexity budget).',
          tuning:
            'Keep small (5-10) — the entire point is a human-readable explanation. Raising it trades ' +
            'readability for fidelity to the black-box model in that neighbourhood.',
        },
        {
          name: 'num_samples',
          what: 'Number of perturbed samples generated to fit the local surrogate.',
          tuning: 'More samples reduce the variance of the explanation between repeated runs; the library default is 5000 for tabular data.',
        },
      ],
      whenToUse: [
        'You need one specific, local explanation for a single prediction rather than a global summary of the model',
        'The model has no tree- or gradient-specific explainer available — LIME only needs black-box prediction access',
        'The input is unstructured (text, images) where perturbing words or superpixels is more natural than defining feature coalitions',
      ],
      whenNotToUse: [
        "You need attributions that provably sum to the model's actual output — LIME has no such guarantee, unlike SHAP's local accuracy property",
        'You need stable, reproducible explanations — LIME is sensitive to the sampled perturbations and kernel width, and can give different explanations for the same instance across runs',
        'Features are strongly correlated, since random perturbation can generate off-manifold combinations the model never saw during training, and the surrogate is fit on those',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'local-linear-feature-weights',
      },
      math: {
        latex: ['\\xi(x) = \\arg\\min_{g \\in G} \\; \\mathcal{L}(f, g, \\pi_x) + \\Omega(g)'],
        notes:
          'f is the original black-box model, g ranges over an interpretable model class G (linear models, ' +
          'shallow trees), pi_x is the proximity kernel defining locality around x, and L measures how ' +
          "unfaithful g is to f within that locality. Omega(g) penalises g's complexity so the returned " +
          'explanation stays small enough to actually read — LIME explicitly trades fidelity for ' +
          "interpretability rather than trying to maximise the former alone.",
      },
      complexity: {
        train: 'n/a — LIME explains an already-fitted model',
        predict:
          'O(num_samples) black-box predictions plus one small linear fit, per explained instance — cheap ' +
          "per instance but does not amortise across instances the way a tree-specific explainer does",
      },
      code: [
        'from lime.lime_tabular import LimeTabularExplainer',
        '',
        'explainer = LimeTabularExplainer(',
        '    X_train.values,',
        '    feature_names=X_train.columns,',
        "    class_names=['no', 'yes'],",
        "    mode='classification',",
        ')',
        '',
        'exp = explainer.explain_instance(',
        '    X_test.iloc[0].values, model.predict_proba, num_features=8,',
        ')',
        'exp.as_list()          # [(feature condition, weight), ...] for this one prediction',
      ].join('\n'),
      // Cross-link pass: add a saliency-map / integrated-gradients entry (Aegis) once that body
      // exists — LIME's image mode does the same job as those methods for non-tree models.
      related: ['shap', 'logistic-regression', 'decision-trees'],
      references: {
        free: [
          { title: 'LIME — GitHub repository and README', url: 'https://github.com/marcotcr/lime' },
        ],
        papers: [
          {
            title: '"Why Should I Trust You?": Explaining the Predictions of Any Classifier',
            url: 'https://arxiv.org/abs/1602.04938',
            year: 2016,
          },
        ],
        books: [
          {
            title: 'Interpretable Machine Learning',
            author: 'Christoph Molnar',
            chapter: 'Ch. 14 — LIME',
            url: 'https://christophm.github.io/interpretable-ml-book/lime.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: scikit-learn.org/stable/modules/permutation_importance.html (mechanism,
    // high-cardinality bias claim quoted directly, correlated-feature caveat); crossref DOI record
    // for 10.1023/A:1010933404324 (Breiman's Random Forests paper metadata — the paper itself is a
    // scanned/compressed PDF that WebFetch could not extract text from, so no number was pulled
    // from it directly; the permutation-importance attribution is instead sourced from sklearn's
    // own citation of that paper); scikit-learn.org/stable/modules/generated/
    // sklearn.inspection.permutation_importance.html (function signature and defaults).
    {
      id: 'feature-importance',
      name: 'Permutation & impurity feature importance',
      aliases: ['mean decrease in impurity', 'MDI', 'Gini importance', 'permutation importance'],
      tier: 1,
      year: 2001,
      difficulty: 2,
      hook: "Ranks features by how much shuffling each one hurts the model — impurity's free alternative is biased.",
      intuition:
        'The cheapest way to ask "does this feature matter" is to look inside a tree model at how much each ' +
        'feature reduced impurity every time it was used for a split, and add that up — this is impurity-based ' +
        'or MDI importance, and it is essentially free because training already computes it. But it has a ' +
        'documented flaw: it is computed on the training data the tree already memorised, and it is biased ' +
        'toward features with many distinct values, because a feature with more possible split points has ' +
        'more chances to look useful even if it is pure noise. Permutation importance fixes both problems by ' +
        'ignoring the model\'s internals entirely: shuffle one feature\'s column on held-out data, breaking its ' +
        'relationship to the target, and measure how much the score drops. A feature the model actually relies ' +
        'on hurts a lot when scrambled; a decorative one barely moves the score.',
      howItWorks: {
        summary:
          "Impurity importance sums each feature's impurity reduction across every split that used it; " +
          'permutation importance instead shuffles one feature at a time on held-out data and measures the ' +
          "drop in the model's score.",
        steps: [
          'Impurity (MDI): during training, at every split, record how much that split reduced impurity (Gini, entropy, or MSE).',
          "Impurity (MDI): sum a feature's impurity reductions across all splits that used it, weighted by the fraction of samples reaching each split.",
          'Permutation: compute the reference score of the fitted model on held-out data.',
          "Permutation: for each feature, randomly shuffle that column's values, keeping every other column fixed, and recompute the score.",
          "Permutation: importance is the average drop in score across n_repeats shuffles; repeat per feature independently.",
        ],
      },
      hyperparameters: [
        {
          name: 'n_repeats',
          what: 'Number of times each feature is independently shuffled and rescored. sklearn defaults to 5.',
          tuning: 'Raise it (10-30) to shrink the variance of the importance estimate, at a proportional cost in scoring time.',
        },
        {
          name: 'scoring metric',
          what: 'The score whose drop defines importance — accuracy, R^2, log loss, or any scorer.',
          tuning:
            'Match it to what actually matters for the deployment: importance under accuracy and importance ' +
            'under log loss can rank features differently for the same model.',
        },
      ],
      whenToUse: [
        'You need a feature ranking that is not biased toward high-cardinality or continuous features — use permutation importance',
        'The model is not tree-based, so impurity importance does not exist and permutation importance is the model-agnostic option',
        'You already trained tree ensembles and want a free, first-pass ranking to prioritise which features to investigate further with impurity importance, then confirm with permutation on held-out data',
      ],
      whenNotToUse: [
        'Features are strongly correlated — permuting one feature barely changes the score because the model still reads the same signal through its correlated partner, understating both',
        'You are reading impurity importance (feature_importances_) as if it reflects generalisation — it is computed on training data and is documented to overstate high-cardinality features',
        'You need per-prediction explanations rather than one global ranking — this method only tells you what matters on average, not why any single prediction came out the way it did',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ranked-feature-importance-scores',
      },
      math: {
        latex: [
          'i_j = s - \\frac{1}{K} \\sum_{k=1}^{K} s_{k,j}',
          '\\Delta \\mathrm{imp}(t) = i(t) - p_L\\, i(t_L) - p_R\\, i(t_R)',
        ],
        notes:
          'The first line is permutation importance: s is the reference score, s_{k,j} the score after the ' +
          "k-th shuffle of feature j, so i_j is the average score drop. The second is the impurity decrease " +
          "at a single split t (weighted by the fraction of samples going left/right); MDI importance sums " +
          "this over every split that used feature j. Neither formula involves the target's causal structure — " +
          "both describe how much the model leans on a feature, which is not the same claim as how much that " +
          'feature actually drives the outcome in the world.',
      },
      complexity: {
        train: 'n/a — computed after a model is already fit',
        predict:
          "Impurity: O(1), already accumulated during training. Permutation: O(n_repeats · n_features · " +
          'cost of scoring the held-out set)',
      },
      code: [
        'from sklearn.inspection import permutation_importance',
        '',
        'result = permutation_importance(',
        "    model, X_val, y_val, n_repeats=10, random_state=0, scoring='accuracy',",
        ')',
        'order = result.importances_mean.argsort()[::-1]',
        'for i in order[:10]:',
        "    print(X_val.columns[i], result.importances_mean[i], '+/-', result.importances_std[i])",
        '',
        '# beware: model.feature_importances_ (impurity-based, MDI) is biased toward',
        '# high-cardinality features and computed on training data — prefer the above',
      ].join('\n'),
      related: ['shap', 'random-forest', 'gradient-boosting', 'decision-trees'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Permutation feature importance',
            url: 'https://scikit-learn.org/stable/modules/permutation_importance.html',
          },
          {
            title: 'scikit-learn API — permutation_importance',
            url: 'https://scikit-learn.org/stable/modules/generated/sklearn.inspection.permutation_importance.html',
          },
        ],
        papers: [{ title: 'Random Forests (Machine Learning 45:5-32)', url: 'https://doi.org/10.1023/A:1010933404324', year: 2001 }],
        books: [
          {
            title: 'Interpretable Machine Learning',
            author: 'Christoph Molnar',
            chapter: 'Ch. 23 — Permutation Feature Importance',
            url: 'https://christophm.github.io/interpretable-ml-book/feature-importance.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: projecteuclid.org Friedman (2001) landing page (already verified in mars.ts
    // for gradient-boosting, reused here — PDP is defined in the same paper); arxiv.org/abs/1309.6392
    // and crossref DOI 10.1080/10618600.2014.907095 (ICE paper — arXiv submission 2013, JCGS print
    // year 2015, both confirmed); scikit-learn.org/stable/modules/partial_dependence.html (PDP vs
    // ICE distinction, brute vs recursion computation, and the correlated-feature caveat quoted
    // directly: unrealistic combinations get "a very low probability mass").
    {
      id: 'partial-dependence-ice',
      name: 'Partial dependence & ICE',
      aliases: ['PDP', 'partial dependence plot', 'individual conditional expectation'],
      tier: 2,
      year: 2001,
      difficulty: 2,
      hook: 'Shows how a prediction moves as one feature changes, averaged across the data or traced per row.',
      intuition:
        "A partial dependence plot answers one question: if every other feature stayed exactly as observed, " +
        'how would the prediction change as this one feature swept across its range? Compute the prediction ' +
        "at each value of that feature for every row, averaging over everyone else's values, and plot the " +
        'result. Friedman introduced this alongside gradient boosting as a way to read a black-box model\'s ' +
        'shape one feature at a time. Its blind spot is averaging: if the feature\'s effect is positive for ' +
        'half the rows and negative for the other half, the average can look flat even though nothing about ' +
        'the model is actually flat. Goldstein et al.\'s individual conditional expectation (ICE) plot fixes ' +
        'this by not averaging at all — it draws one line per row, so the fan of curves you get back shows ' +
        'exactly where rows agree and where they diverge; the PDP is just the average of every ICE line.',
      howItWorks: {
        summary:
          "Vary one feature across a grid of values while holding every other feature at each row's observed " +
          'values, predict at each grid point, and either average across rows (PDP) or plot every row (ICE).',
        steps: [
          "For a chosen feature, pick a grid of values spanning its observed range.",
          "For every grid value, set every row's copy of that feature to it, leaving all other features unchanged, and get the model's prediction for each row.",
          'Individual conditional expectation (ICE): plot each row\'s predictions across the grid as its own line.',
          'Partial dependence (PDP): average the predictions across all rows at each grid value and plot that single curve.',
        ],
      },
      whenToUse: [
        "You need to see the shape of a black-box model's response to one or two features — monotonic, thresholded, non-monotonic — without reading its internals",
        "You suspect the feature's effect differs across subgroups of rows rather than being uniform — plot ICE, not just the PDP average, to reveal that heterogeneity",
      ],
      whenNotToUse: [
        'Features of interest are strongly correlated with the others being held fixed — averaging over unseen, unrealistic feature combinations can produce a curve describing behaviour the model was never trained on',
        'You need a single number attributing credit to a feature for one specific prediction — PDP and ICE describe a trend across many rows, not a per-prediction explanation; use SHAP or LIME for that',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'partial-dependence-or-ice-curve',
      },
      related: ['feature-importance', 'shap', 'gradient-boosting'],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Partial Dependence and Individual Conditional Expectation plots',
            url: 'https://scikit-learn.org/stable/modules/partial_dependence.html',
          },
        ],
        papers: [
          {
            title: 'Greedy Function Approximation: A Gradient Boosting Machine (Annals of Statistics 29(5):1189-1232)',
            url: 'https://projecteuclid.org/journals/annals-of-statistics/volume-29/issue-5/Greedy-function-approximation-A-gradient-boosting-machine/10.1214/aos/1013203451.full',
            year: 2001,
          },
          {
            title: 'Peeking Inside the Black Box: Visualizing Statistical Learning With Plots of Individual Conditional Expectation (JCGS 24(1):44-65)',
            url: 'https://doi.org/10.1080/10618600.2014.907095',
            year: 2015,
          },
        ],
        books: [
          {
            title: 'Interpretable Machine Learning',
            author: 'Christoph Molnar',
            chapter: 'Ch. 19 — Partial Dependence Plot',
            url: 'https://christophm.github.io/interpretable-ml-book/pdp.html',
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/1711.00399 (Wachter et al. abs page — verified title, authors,
    // and the "smallest change to the world" core definition directly from the abstract text);
    // jolt.law.harvard.edu volume-31 index (confirmed Harvard JOLT Vol. 31 No. 2, Spring 2018 print
    // venue for the journal-year citation); the article PDF itself
    // (jolt.law.harvard.edu/assets/articlePDFs/v31/...) returned only raw, non-extractable PDF
    // stream data when fetched — no claim in this entry was sourced from that PDF, everything came
    // from the arXiv HTML abstract instead; christophm.github.io/interpretable-ml-book/
    // counterfactual.html (validity/proximity/sparsity/plausibility properties, and the caveat that
    // Wachter et al.'s original formulation only optimises the first two of those four).
    {
      id: 'counterfactual-explanations',
      name: 'Counterfactual explanations',
      tier: 2,
      year: 2018,
      difficulty: 3,
      hook: 'Finds the smallest change to your inputs that would have flipped the model\'s decision.',
      intuition:
        'Instead of explaining why a model decided what it did, a counterfactual explanation tells someone ' +
        'what would have had to be different for it to decide otherwise: "your loan would have been approved ' +
        'if your income were $4,000 higher." Wachter, Mittelstadt and Russell proposed this as a way to give ' +
        'people grounds to understand and contest automated decisions without ever opening the model up — the ' +
        'explanation is a nearby alternative world, not a description of internal logic. Finding one means ' +
        'searching for the closest possible input, by some distance measure, whose prediction crosses the ' +
        "decision boundary to the desired outcome. The hard part is what \"closest\" should mean: a change " +
        "that is mathematically small can still be practically meaningless (age cannot decrease) or wildly " +
        'unrealistic (a feature combination outside anything the model saw in training).',
      howItWorks: {
        summary:
          'Search for a nearby input that the model would classify differently, by minimising a loss that ' +
          "trades off how close the counterfactual's prediction is to the desired outcome against how far the " +
          'counterfactual input is from the original.',
        steps: [
          'Start from the original instance x and its (undesired) prediction.',
          'Define a distance measure between candidate inputs and x (e.g. Manhattan distance, scaled by each feature\'s variability).',
          'Search for a candidate x\' that minimises a weighted combination of prediction distance to the target outcome and input distance to x.',
          'Return x\' as the counterfactual: "had these features been x\' instead, the prediction would have been the desired outcome."',
        ],
      },
      whenToUse: [
        'A person affected by a decision needs an actionable answer — what would need to change — rather than a feature-attribution score',
        'You want a explanation format that works without exposing the model\'s internals, which matters when the model is proprietary or under legal disclosure limits',
      ],
      whenNotToUse: [
        'The naive minimal-distance counterfactual is likely to suggest an unrealistic or impossible change (a combination of features never seen together, or an immutable attribute like age or a protected characteristic) — you need a plausibility- or actionability-constrained variant, not the plain method',
        'You need one attribution that explains the actual prediction that was made — a counterfactual describes a different, hypothetical prediction, not the one that occurred',
      ],
      facets: {
        task: ['classification', 'regression'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'counterfactual-instance',
      },
      // Cross-link pass: add DiCE / actionable-recourse (Aegis or a future Pallas addition) once
      // written — the direct successor addressing the plausibility gap noted above.
      related: ['shap', 'lime', 'logistic-regression'],
      references: {
        free: [
          {
            title: 'Interpretable Machine Learning — Counterfactual Explanations',
            url: 'https://christophm.github.io/interpretable-ml-book/counterfactual.html',
          },
        ],
        papers: [
          {
            title: 'Counterfactual Explanations without Opening the Black Box: Automated Decisions and the GDPR (Harvard Journal of Law & Technology 31(2):841-887)',
            url: 'https://arxiv.org/abs/1711.00399',
            year: 2018,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/1610.02413 (Hardt, Price & Srebro abs page — verified title,
    // authors, year, and the equalized-odds/equality-of-opportunity criterion described relative to
    // demographic parity); fairlearn.org/main/user_guide/assessment/common_fairness_metrics.html
    // (definitions of demographic parity and equalized odds, and the documented guidance on when to
    // prefer one over the other); arxiv.org/abs/1811.05577 (Aequitas toolkit paper abs page —
    // verified title, authors, year).
    {
      id: 'fairness-and-bias-auditing',
      name: 'Fairness metrics & bias auditing',
      aliases: ['demographic parity', 'equalized odds', 'disparate impact'],
      tier: 2,
      year: 2016,
      difficulty: 3,
      hook: 'Checks whether a model errs, or predicts positively, at different rates across protected groups.',
      intuition:
        'Overall accuracy can hide a model that works well for most people and badly for a minority of them. ' +
        'Fairness auditing makes that visible by splitting every prediction metric by a protected attribute — ' +
        'race, sex, age group — and comparing the numbers group by group instead of pooling them into one ' +
        'score. But "fair" is not one thing to measure. Demographic parity asks whether the positive-decision ' +
        'rate is equal across groups, regardless of whether the decision was correct. Equalized odds asks a ' +
        'stricter question: are the true-positive and false-positive rates equal across groups, so the model ' +
        'is equally accurate for everyone, not just equally generous. Hardt, Price and Srebro formalised this ' +
        'second criterion and showed it can be enforced by adjusting a trained model\'s decision thresholds ' +
        'per group. The two criteria can conflict — satisfying one can require violating the other whenever ' +
        'the base rates of the outcome genuinely differ between groups.',
      howItWorks: {
        summary:
          "Slice the model's predictions by a protected attribute, compute the same performance metrics " +
          '(selection rate, true/false positive rate) within each group, and compare the results against a ' +
          'fairness criterion rather than a single pooled number.',
        steps: [
          'Choose the protected attribute(s) to audit against (e.g. sex, race, age group).',
          "Compute the metric of interest — selection rate for demographic parity, true/false positive rate for equalized odds — separately within each group.",
          "Compare the per-group numbers: demographic parity wants equal selection rates; equalized odds wants equal error rates.",
          'Flag groups whose metric falls outside an acceptable gap (a common rule of thumb is a selection-rate ratio below four-fifths of the highest group\'s rate) for further investigation.',
        ],
      },
      whenToUse: [
        'The model makes decisions with real consequences for people — lending, hiring, criminal justice risk scoring — and a regulator, stakeholder, or internal policy requires group-level accountability',
        'You suspect the training data encodes historical bias and want to know whether the model reproduces or amplifies it before deployment',
      ],
      whenNotToUse: [
        'You need to pick a single fairness definition without checking whether the base rate of the true outcome actually differs across groups — demographic parity and equalized odds provably cannot both be satisfied exactly whenever it does',
        'Protected group labels are unavailable or cannot legally be collected for the analysis — none of these metrics can be computed without them, and proxies for the attribute introduce their own error',
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'per-group-fairness-metrics',
      },
      // Cross-link pass: `class-imbalance` and `classification-metrics` (Belt) are the direct
      // building blocks these per-group metrics are computed from.
      related: ['classification-metrics', 'class-imbalance', 'logistic-regression'],
      references: {
        free: [
          {
            title: 'Fairlearn user guide — Common fairness metrics',
            url: 'https://fairlearn.org/main/user_guide/assessment/common_fairness_metrics.html',
          },
        ],
        papers: [
          { title: 'Equality of Opportunity in Supervised Learning', url: 'https://arxiv.org/abs/1610.02413', year: 2016 },
          { title: 'Aequitas: A Bias and Fairness Audit Toolkit', url: 'https://arxiv.org/abs/1811.05577', year: 2018 },
        ],
      },
    },
  ],
} satisfies Body;
