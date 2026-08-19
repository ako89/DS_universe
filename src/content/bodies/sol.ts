/**
 * Sol — The Objective, the inner star. See PLAN.md §3 for the full moon list (6 moons, all
 * written here: 5 Tier 1, 1 Tier 2).
 *
 * PLAN.md's own framing is the reason this body exists at all: "pick a model, define a loss,
 * minimize it over data." Every other Tier 1 entry already written elsewhere in the map (OLS,
 * ridge, lasso, logistic regression, naive Bayes, every tree ensemble, gradient boosting...) is a
 * specific instance of one of these six ideas. `related` links throughout favour genuine
 * mechanical instances over decoration — see each entry's inline comment for the specific claim
 * being made.
 *
 * The five Tier 1 entries are tightly coupled by design (PLAN.md asks for this) but each owns one
 * distinct question:
 *   empirical-risk-minimization   the general framework — average a loss over a hypothesis class
 *   loss-functions                the menu of what "wrong" means, and how each choice behaves
 *                                  differently (outlier sensitivity, margin sparsity, calibration)
 *   maximum-likelihood-and-map    the probabilistic *justification* for why a loss is the "right"
 *                                  one — squared error <-> Gaussian likelihood, cross-entropy <->
 *                                  Bernoulli/categorical likelihood, and MAP's prior <->
 *                                  regularization
 *   gradient-descent              the optimization algorithm that finds the minimizer when ERM's
 *                                  objective has no closed form
 *   bias-variance-decomposition   the diagnostic lens for *why* a fitted model over- or
 *                                  underperforms
 *
 * bias-variance-decomposition deliberately does NOT duplicate belt.ts's overfitting-and-
 * regularization, which already cites the same Geman/Bienenstock/Doursat (1992) paper. belt.ts's
 * entry is framed around the train/validation curve and the fix (penalize complexity); this entry
 * is framed around the formal decomposition itself — Err(x) = noise + bias^2 + variance, derived
 * by imagining refitting on many resampled training sets — used as a diagnostic lens rather than a
 * prescription. The two entries cross-link to each other rather than restate one another.
 *
 * `year` dating choices, documented per PLAN.md/CONTENT_GUIDE precedent of stating a deliberate
 * choice rather than silently picking one:
 *   - empirical-risk-minimization: 1991 (Vapnik's NIPS paper "Principles of Risk Minimization for
 *     Learning Theory" — confirmed as NIPS-4/1991 via the NeurIPS proceedings page itself, not the
 *     1992 date some secondary sources give for its later journal/book treatment).
 *   - loss-functions: 1964 (Huber's "Robust Estimation of a Location Parameter"). This entry
 *     covers four losses with four different origins — MSE has no single inventor (classical
 *     least-squares estimation), cross-entropy's information-theoretic root is Shannon (1948) but
 *     it was never introduced as an ML *loss function* per se, and hinge loss is Cortes & Vapnik
 *     (1995). Huber (1964) is the one genuinely novel, individually-authored construction among
 *     the four — a purpose-built loss function, not a repurposed statistical or information-
 *     theoretic quantity — so it is the year pinned, per belt.ts's precedent of pinning to the
 *     single most load-bearing, independently verified paper rather than asserting an invented
 *     "date of invention" for the group.
 *   - maximum-likelihood-and-map: 1922 (Fisher, "On the Mathematical Foundations of Theoretical
 *     Statistics" — confirmed via CrossRef for the DOI). MAP itself has no comparably clean single
 *     origin (it is MLE plus a Bayesian prior, a combination rather than one paper's invention),
 *     so the entry is dated to MLE's origin and MAP's relationship to it is explained in prose.
 *   - gradient-descent: 1847 (Cauchy — general steepest descent, confirmed via Wikipedia's
 *     gradient descent article, which is explicit that Cauchy first suggested it in 1847).
 *     Stochastic gradient descent has a SEPARATE, later root: Robbins & Monro's 1951 stochastic
 *     approximation (Annals of Mathematical Statistics 22(3):400-407, confirmed via Project
 *     Euclid) is the standard citation for SGD's convergence theory, fully fifteen years before
 *     backpropagation or any specific ML paper used it — this is stated explicitly in the entry's
 *     math notes rather than folded into a single invented "SGD was invented in year X" claim.
 *   - bias-variance-decomposition: 1992 (Geman, Bienenstock & Doursat — same paper belt.ts cites,
 *     confirmed via CrossRef, deliberately reused since it is the correct primary source for both
 *     entries' different angles on the same formal result).
 *   - convexity-and-no-free-lunch: 1997 (Wolpert & Macready, "No Free Lunch Theorems for
 *     Optimization", IEEE Trans. Evolutionary Computation 1(1):67-82, confirmed via CrossRef).
 *     Convexity itself is a mathematical property with no single dated "invention" (convex
 *     analysis as a field traces to the early-to-mid 20th century); the entry is dated to the
 *     more surprising, individually-authored claim it bundles with, and convexity's much older
 *     provenance is described in prose rather than assigned an invented year of its own.
 *
 * Research trail (every claim read from an opened source, per CONTENT_GUIDE §3):
 *   - Vapnik's ERM paper verified via the NeurIPS proceedings abstract page (proceedings.neurips.cc)
 *     and Wikipedia's empirical risk minimization article for the plain-language framing.
 *   - Huber (1964) and Cortes & Vapnik (1995) verified via CrossRef DOI lookups
 *     (10.1214/aoms/1177703732, 10.1007/BF00994018) plus scikit-learn's own linear_model.html and
 *     sgd.html pages for the practical loss definitions and defaults.
 *   - Fisher (1922) verified via CrossRef (10.1098/rsta.1922.0009). The Gaussian-prior<->L2/ridge
 *     and Laplace-prior<->L1/lasso equivalences were cross-checked against three independent
 *     sources (a Berkeley stats-151a lecture page, a "Bayesian connection to LASSO and ridge"
 *     write-up, and search-corroborated coverage of Murphy's Probabilistic Machine Learning §11)
 *     because CONTENT_GUIDE flagged this exact equivalence as commonly stated backwards — all
 *     three agree on the same direction used here (Gaussian -> L2, Laplace -> L1). The Elements of
 *     Statistical Learning's own §3.4.1 Bayesian treatment of ridge regression was independently
 *     confirmed via search results quoting it directly.
 *   - Robbins & Monro (1951) verified via Project Euclid's own citation page for the paper; Cauchy
 *     (1847) verified via Wikipedia's gradient descent article rather than Cauchy's original 1847
 *     Comptes Rendus note (French, no accessible English full text found) or Lemaréchal's 2012
 *     historical essay (only found as a PDF mirror, not fetched, per the PDF-fetch policy below).
 *   - Geman, Bienenstock & Doursat (1992) verified via CrossRef (10.1162/neco.1992.4.1.1) — same
 *     DOI belt.ts already cites — plus scikit-learn's own worked bias-variance decomposition
 *     example (auto_examples/ensemble/plot_bias_variance.html) for the practical bagging
 *     comparison used in this entry's whenToUse.
 *   - Wolpert & Macready (1997) verified via CrossRef (10.1109/4235.585893); Boyd & Vandenberghe's
 *     Convex Optimization homepage (stanford.edu/~boyd/cvxbook/) confirmed as the free, official,
 *     currently-hosted PDF.
 *   - d2l.ai's "12. Optimization Algorithms" chapter fetched directly and confirmed to have
 *     sections 12.3 Gradient Descent, 12.4 Stochastic Gradient Descent and 12.5 Minibatch
 *     Stochastic Gradient Descent — cited as the book reference for gradient-descent.
 *
 * ⚠️ PDF-fetch caught failing honestly, per CONTENT_GUIDE §3's warning: fetching
 * https://probml.github.io/pml-book/toc1.pdf (Murphy's Probabilistic Machine Learning table of
 * contents, intended to verify an exact chapter/section number for the MAP-estimation-as-
 * regularization material) returned raw, unparsed PDF binary structure and an explicit statement
 * that no readable text could be extracted — the correct failure mode, not a fabricated chapter
 * number. That book is NOT cited in this file as a result; the equivalences it would have
 * supported are instead sourced from the independently corroborated pages listed above, and ESL
 * §3.4.1 (whose content WAS independently confirmed via search-quoted text, not a PDF fetch) is
 * used for the book reference instead.
 *
 * Cross-linking: loss-functions -> support-vector-machines (Uranus, this batch) is a genuine
 * mechanical link, not decoration — hinge loss IS the SVM training objective, per Cortes & Vapnik
 * (1995) itself. maximum-likelihood-and-map -> bayesian-linear-logistic-regression (Neptune, this
 * batch) is likewise genuine: MAP estimation with a fixed prior is exactly the point estimate that
 * entry's fuller Bayesian treatment generalizes. Every other `related` id is a batch-1/batch-2 id
 * confirmed against the id list supplied for this task.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'sol',
  name: 'Sol',
  segment: 'The Objective',
  hook: 'Pick a model, define a loss, minimize it over data — the objective every planet runs on.',
  summary:
    "Sol is the map's first gravitational centre. Every supervised algorithm elsewhere in the system is, underneath " +
    'its particular name, an instance of the same five-part recipe collected here: a hypothesis class, a loss that ' +
    'defines "wrong", a probabilistic reason that loss is the right one, an algorithm to minimize it, and a lens for ' +
    'diagnosing why the result over- or underperforms.',
  eraRange: [1847, 1997],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'empirical-risk-minimization',
      name: 'Empirical Risk Minimization',
      aliases: ['ERM', 'risk minimization principle'],
      tier: 1,
      year: 1991,
      difficulty: 3,
      hook: "Turns 'pick a good model' into 'minimize the average loss over your training data.'",
      intuition:
        'What you actually care about is how a model performs on data it has never seen — its true risk, averaged ' +
        'over every input the real world might hand it. You cannot compute that directly, because you do not have ' +
        'every input the real world might hand you; you have one finite training sample. Empirical risk minimization ' +
        'is the leap of faith that makes learning possible anyway: assume your training sample is a fair draw from ' +
        'the same distribution as the future, so the average loss on that sample — the empirical risk — is a ' +
        'reasonable stand-in for the true risk you cannot see. Pick a hypothesis class (linear functions, trees of a ' +
        'given depth, a fixed neural network architecture), pick a loss that scores how wrong a single prediction ' +
        'is, and search the class for whichever hypothesis makes the average loss over your training rows as small ' +
        'as possible. Nearly every supervised algorithm is this recipe with a specific class and a specific loss ' +
        'plugged in.',
      howItWorks: {
        summary:
          'Choose a hypothesis class and a loss function, then search within that class for the hypothesis that ' +
          'minimizes the average loss over the training sample.',
        steps: [
          'Choose a hypothesis class H of candidate functions — e.g. linear functions, decision trees of bounded depth, or a fixed neural network architecture.',
          'Choose a loss function that scores how wrong one prediction is against its true label.',
          'Define the empirical risk as the average of that loss over every training example.',
          'Search within H — typically via an iterative optimizer or a closed-form solve — for the hypothesis minimizing empirical risk.',
          'Optionally add a complexity penalty to the objective (structural risk minimization), trading a little training fit for a hypothesis expected to generalize better.',
        ],
      },
      whenToUse: [
        'Your problem can be cast as choosing a function from a fixed hypothesis class to fit labeled training examples — the operating assumption behind nearly every supervised learning algorithm',
        'You have, or can define, a loss function that genuinely reflects what a wrong prediction costs, so minimizing it in training aligns with what you actually want at deployment',
        "You want a principled account of why an algorithm's training objective is what it is — e.g. to recognize that two differently-named algorithms are actually the same idea with a different loss plugged in",
      ],
      whenNotToUse: [
        'The hypothesis class is large relative to the amount of training data — minimizing empirical risk with no complexity penalty invites overfitting, since a large enough class can drive training loss to zero by memorizing noise',
        'Training examples are not representative of the deployment distribution — the whole justification rests on train and future data being drawn from the same distribution, and it says nothing about performance under distribution shift',
        'There is no natural per-example loss to average — some structured, sequential or interactive decision problems have no single label to compare a prediction against, and need a different objective entirely',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'fitted-hypothesis-minimizing-average-loss',
      },
      math: {
        latex: [
          'R(h) = \\mathbb{E}_{(x,y)\\sim \\mathcal{D}}\\left[\\ell(h(x), y)\\right]',
          '\\hat{R}(h) = \\frac{1}{n}\\sum_{i=1}^{n} \\ell(h(x_i), y_i)',
          '\\hat{h} = \\arg\\min_{h \\in \\mathcal{H}} \\hat{R}(h)',
        ],
        notes:
          'R(h), the true risk, depends on the unknown data-generating distribution D and cannot be computed; ' +
          '\\hat{R}(h), the empirical risk, substitutes the sample average, justified by the law of large numbers as ' +
          'the sample size grows. The gap between the two is exactly what VC-dimension-based generalization bounds ' +
          'quantify: Vapnik\'s 1991 paper contrasts plain ERM, which minimizes \\hat{R} over a single fixed H, with ' +
          'structural risk minimization, which minimizes over a nested sequence of classes of growing complexity and ' +
          'picks the one with the best bound on the true risk — the theoretical justification for penalizing ' +
          'complexity directly rather than only fitting the training sample.',
      },
      code: [
        'import numpy as np',
        '',
        'def empirical_risk(loss, predict_fn, X, y):',
        '    """Average loss of a hypothesis over a labeled sample (X, y)."""',
        '    preds = predict_fn(X)',
        '    return np.mean([loss(p, true) for p, true in zip(preds, y)])',
        '',
        "# plugging in squared loss recovers OLS's objective;",
        "# plugging in hinge loss recovers the (unregularized) linear SVM's objective --",
        '# same recipe, different loss',
        'squared_loss = lambda pred, true: (pred - true) ** 2',
        'risk = empirical_risk(squared_loss, model.predict, X_train, y_train)',
      ].join('\n'),
      // loss-functions and maximum-likelihood-and-map are the two other pieces of the same
      // recipe (what "wrong" means, and why); linear-regression/logistic-regression/naive-bayes
      // are genuine instances (a specific H + a specific loss); overfitting-and-regularization is
      // the direct extension (structural risk minimization in practice).
      related: [
        'loss-functions',
        'maximum-likelihood-and-map',
        'gradient-descent',
        'linear-regression',
        'logistic-regression',
        'overfitting-and-regularization',
      ],
      references: {
        free: [
          {
            title: 'Wikipedia — Empirical risk minimization',
            url: 'https://en.wikipedia.org/wiki/Empirical_risk_minimization',
          },
          {
            title: 'MIT 9.520 — Statistical Learning Theory and Applications, Class 8 (ERM and generalization)',
            url: 'https://www.mit.edu/~9.520/spring03/Classes/class08.html',
          },
        ],
        papers: [
          {
            title: 'Principles of Risk Minimization for Learning Theory',
            url: 'https://proceedings.neurips.cc/paper/1991/hash/ff4d5fbbafdf976cfdc032e3bde78de5-Abstract.html',
            year: 1991,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 2 — Overview of Supervised Learning (statistical decision theory, squared error and expected prediction error)',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'loss-functions',
      name: 'Loss Functions (MSE, Cross-Entropy, Hinge, Huber)',
      aliases: ['cost functions', 'objective functions'],
      tier: 1,
      year: 1964,
      difficulty: 2,
      hook: "Defines what 'wrong' costs — squared, robust, margin or probabilistic — and that choice shapes every fit.",
      intuition:
        'A loss function is the ruler that turns "how wrong was this prediction" into a single number a model can be ' +
        'fit to minimize, and the choice of ruler quietly decides which mistakes the model will care about most. ' +
        'Squared error (MSE) punishes large errors much more than small ones, so a model fit to it works hard to ' +
        'avoid the occasional huge miss — great when big misses really are worse, disastrous when a handful of bad ' +
        'data points can drag the whole fit toward them. Huber loss hedges: quadratic for small errors, linear ' +
        'beyond a threshold, so a few outliers can no longer dominate the gradient. Cross-entropy scores how ' +
        'surprised the model should be by the true label given its predicted probabilities, so it rewards ' +
        'confident, correct predictions and punishes confident, wrong ones severely. Hinge loss, used for margin ' +
        'classifiers, does not even penalize points that are already correctly and confidently classified — only ' +
        'the points sitting inside or on the wrong side of the margin contribute anything at all.',
      howItWorks: {
        summary:
          "Score each training example's error with the chosen function of its residual or margin, then average " +
          'those per-example scores into the single scalar objective an optimizer minimizes.',
        steps: [
          'For regression, compute the residual (true value minus prediction) for every example.',
          'Apply the chosen loss to each residual: square it for MSE, or blend quadratic-near-zero with linear-beyond-a-threshold for Huber.',
          "For classification, compute the model's margin (raw score) or predicted probability of the true class for every example.",
          "Apply the chosen loss: penalize by how far inside the margin a point falls for hinge, or by the negative log of the true class's predicted probability for cross-entropy.",
          'Average the per-example losses into one scalar training objective, which the fitting procedure (typically gradient descent) then minimizes.',
        ],
      },
      hyperparameters: [
        {
          name: 'delta / epsilon (Huber)',
          what: 'The residual size at which Huber loss switches from quadratic to linear.',
          tuning:
            "scikit-learn's HuberRegressor documents 1.35 as the value giving 95% statistical efficiency relative " +
            'to ordinary least squares under normally distributed errors; lower it if outliers are more frequent or ' +
            'severe than that.',
        },
      ],
      whenToUse: [
        'Outliers in the target are genuine signal that should be penalized heavily and smoothly — squared error (MSE)',
        "Outliers exist but shouldn't be allowed to dominate the fit — Huber loss, quadratic near zero and linear beyond a threshold",
        'You need calibrated class probabilities, not just a decision boundary — cross-entropy, which is minimized exactly by the true conditional class probabilities',
        'Only the decision boundary matters and a sparse solution driven by the hardest, boundary-adjacent points is wanted — hinge loss',
      ],
      whenNotToUse: [
        'The target has heavy-tailed noise or frequent gross outliers and you are using plain MSE — a single bad point can dominate the gradient and pull the whole fit toward it',
        'Downstream decisions need probability estimates and you are using hinge loss — hinge produces an uncalibrated margin by construction, not a probability',
        'Classes are severely imbalanced and cross-entropy is unweighted — the average loss is dominated by the majority class unless it is reweighted (see class-imbalance)',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'scalar-training-objective',
      },
      math: {
        latex: [
          '\\mathrm{MSE} = \\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2',
          'L_\\delta(r) = \\tfrac{1}{2} r^2 \\ \\text{if} \\ |r| \\le \\delta, \\quad \\delta\\!\\left(|r| - \\tfrac{1}{2}\\delta\\right) \\ \\text{otherwise}',
          '\\mathrm{hinge}(y, f(x)) = \\max\\left(0,\\ 1 - y\\,f(x)\\right)',
          '\\mathrm{CE} = -\\sum_{k} y_k \\log \\hat{p}_k',
        ],
        notes:
          "Each loss's gradient explains its behaviour: MSE's gradient is linear in the residual, so a residual " +
          "twice as large pulls twice as hard — the source of its outlier sensitivity. Huber's gradient is capped " +
          'at delta beyond the threshold, bounding any single point\'s influence. Hinge\'s gradient is exactly zero ' +
          'for any point already correctly classified beyond the margin, which is why only "support vectors" — the ' +
          'points on or inside the margin — end up affecting an SVM\'s solution at all. Cross-entropy paired with a ' +
          'softmax output has a famously clean gradient, predicted-probability minus true-one-hot-label, which is ' +
          'part of why the pairing is close to universal for classification.',
      },
      code: [
        'import numpy as np',
        '',
        'def mse(y_true, y_pred):',
        '    return np.mean((y_true - y_pred) ** 2)',
        '',
        'def huber(y_true, y_pred, delta=1.35):',
        '    r = y_true - y_pred',
        '    small = np.abs(r) <= delta',
        '    return np.mean(np.where(small, 0.5 * r**2, delta * (np.abs(r) - 0.5 * delta)))',
        '',
        'def hinge(y_true_pm1, scores):',
        '    return np.mean(np.maximum(0, 1 - y_true_pm1 * scores))',
        '',
        'def cross_entropy(y_true_onehot, probs, eps=1e-12):',
        '    probs = np.clip(probs, eps, 1 - eps)',
        '    return -np.mean(np.sum(y_true_onehot * np.log(probs), axis=1))',
      ].join('\n'),
      // support-vector-machines (Uranus, this batch) is a genuine link: hinge loss IS the SVM
      // training objective, not an analogy, per Cortes & Vapnik (1995) itself.
      related: [
        'empirical-risk-minimization',
        'maximum-likelihood-and-map',
        'linear-regression',
        'logistic-regression',
        'support-vector-machines',
        'gradient-boosting',
      ],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Stochastic Gradient Descent (loss functions)',
            url: 'https://scikit-learn.org/stable/modules/sgd.html',
          },
          {
            title: 'scikit-learn user guide — Linear Models (Huber Regression)',
            url: 'https://scikit-learn.org/stable/modules/linear_model.html#huber-regression',
          },
        ],
        papers: [
          {
            title: 'Robust Estimation of a Location Parameter',
            url: 'https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-35/issue-1/Robust-Estimation-of-a-Location-Parameter/10.1214/aoms/1177703732.full',
            year: 1964,
          },
          {
            title: 'Support-Vector Networks',
            url: 'https://doi.org/10.1007/BF00994018',
            year: 1995,
          },
        ],
        books: [
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Bishop',
            chapter: 'Ch. 1 — Decision Theory (loss functions for regression and classification)',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'maximum-likelihood-and-map',
      name: 'Maximum Likelihood & MAP',
      aliases: ['MLE', 'maximum a posteriori estimation', 'MAP estimation'],
      tier: 1,
      year: 1922,
      difficulty: 3,
      hook: "Why squared error and cross-entropy are the 'right' losses — and how adding a prior gives you regularization.",
      intuition:
        'Loss functions look like arbitrary design choices until you ask what probability model they are secretly ' +
        'assuming. Maximum likelihood estimation picks the parameters that make the data you actually observed as ' +
        'probable as possible under some assumed distribution. Assume prediction errors are Gaussian, and the ' +
        'parameters that maximize that likelihood are exactly the ones that minimize squared error — MSE is not an ' +
        'arbitrary penalty, it is what Gaussian-noise maximum likelihood demands. Assume a Bernoulli or categorical ' +
        'label distribution instead, and maximizing likelihood becomes minimizing cross-entropy. Maximum a ' +
        'posteriori estimation (MAP) goes one step further: multiply the likelihood by a prior belief about ' +
        'plausible parameter values before maximizing, so the estimate balances what the data says against what you ' +
        'believed beforehand. A Gaussian prior that plausible weights are small, worked through the same maximizing ' +
        'process, turns out to be exactly ridge regression\'s L2 penalty; a Laplace prior turns out to be lasso\'s L1 ' +
        'penalty. Regularization is MAP wearing an optimization costume.',
      howItWorks: {
        summary:
          'Assume a probability distribution for how the data was generated given the parameters, then find the ' +
          'parameters that make the observed data most probable — optionally weighted by a prior belief over those ' +
          'parameters.',
        steps: [
          'Choose a probability distribution for the data given parameters theta — e.g. Gaussian noise around a linear prediction, or Bernoulli for a binary label.',
          'Write the likelihood: the probability of the observed training data as a function of theta.',
          'For MLE, find the theta that maximizes that likelihood, equivalently minimizes its negative log.',
          'For MAP, multiply the likelihood by a prior distribution over theta that encodes belief before seeing the data.',
          'Find the theta maximizing the resulting posterior (likelihood times prior) — equivalently minimizing negative log-likelihood plus negative log-prior.',
          'Read off the familiar objectives this recovers: negative-log-Gaussian-likelihood is squared error; negative-log-Bernoulli-likelihood is cross-entropy; a Gaussian prior\'s negative log is an L2 penalty, a Laplace prior\'s is an L1 penalty.',
        ],
      },
      hyperparameters: [
        {
          name: 'prior strength (tau, or the regularization weight it induces)',
          what: "How concentrated the prior is around its mean — a tighter prior pulls the MAP estimate harder toward it.",
          tuning:
            'A tighter (smaller-variance) Gaussian prior on the weights corresponds to a larger ridge penalty ' +
            'lambda; there is a direct, derivable mapping between the two, so this is the same search as tuning a ' +
            "regularization strength — sweep it against held-out likelihood or a validation metric, not training " +
            'likelihood, which only improves as the prior weakens.',
        },
      ],
      whenToUse: [
        "You want to know why a particular loss function is the principled choice for a task, not just that it works empirically",
        'You want regularization with a stated probabilistic meaning rather than an arbitrary penalty — e.g. justifying ridge as a Gaussian belief that weights are small',
        'You have genuine prior knowledge about plausible parameter values, from domain expertise or earlier data, that should be folded into the objective rather than ignored',
      ],
      whenNotToUse: [
        'The assumed noise or output distribution is a poor match for the data — e.g. assuming Gaussian noise for heavy-tailed or count data — MLE under the wrong distribution silently optimizes the wrong thing',
        'There is no real basis for a prior and one would just be picked to make the model behave a certain way — an unjustified prior is regularization wearing a probabilistic costume, and is better described plainly as the latter',
        'The goal is a full posterior distribution over parameters, not one point estimate — MAP only returns the mode; use full Bayesian inference (MCMC, variational inference) for the shape of the posterior itself',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'point-estimate-of-parameters',
      },
      math: {
        latex: [
          '\\hat\\theta_{\\mathrm{MLE}} = \\arg\\max_\\theta \\prod_{i=1}^{n} p(x_i \\mid \\theta) = \\arg\\min_\\theta \\left(-\\sum_{i=1}^{n} \\log p(x_i \\mid \\theta)\\right)',
          '\\hat\\theta_{\\mathrm{MAP}} = \\arg\\max_\\theta \\; p(\\theta)\\prod_{i=1}^{n} p(x_i \\mid \\theta) = \\arg\\min_\\theta \\left(-\\sum_{i=1}^{n} \\log p(x_i\\mid\\theta) - \\log p(\\theta)\\right)',
        ],
        notes:
          'With Gaussian noise, -log p(x|theta) reduces to a constant plus a term proportional to the squared ' +
          "residual, so MLE under that assumption IS least squares. With a zero-mean Gaussian prior on the weights, " +
          '-log p(theta) is a constant plus a term proportional to the sum of squared weights — exactly ridge\'s L2 ' +
          'penalty; a zero-mean Laplace prior instead contributes a term proportional to the sum of absolute ' +
          "weights — exactly lasso's L1 penalty. This direction (Gaussian -> L2/ridge, Laplace -> L1/lasso) is easy " +
          'to state backwards and was cross-checked against three independent sources for this entry, since it is ' +
          'commonly garbled in casual explanations.',
      },
      code: [
        'import numpy as np',
        'from scipy.optimize import minimize',
        '',
        '# Gaussian likelihood: negative log-likelihood is (up to constants) squared error',
        'def neg_log_likelihood_gaussian(w, X, y):',
        '    resid = y - X @ w',
        '    return np.sum(resid ** 2)          # minimizing this IS ordinary least squares',
        '',
        '# adding a Gaussian prior on w turns MLE into MAP -- and into ridge regression',
        'def neg_log_posterior_gaussian_prior(w, X, y, lam=1.0):',
        '    return neg_log_likelihood_gaussian(w, X, y) + lam * np.sum(w ** 2)',
        '',
        'w_map = minimize(neg_log_posterior_gaussian_prior, x0=np.zeros(X.shape[1]), args=(X, y)).x',
      ].join('\n'),
      // ridge-regression / lasso are the direct MAP-with-a-specific-prior instances; naive-bayes
      // is MLE of class-conditional distributions; bayesian-linear-logistic-regression (Neptune,
      // this batch) is the genuine forward link -- MAP with a fixed prior is exactly the point
      // estimate that entry's fuller Bayesian treatment generalizes.
      related: [
        'empirical-risk-minimization',
        'loss-functions',
        'ridge-regression',
        'lasso',
        'naive-bayes',
        'logistic-regression',
        'bayesian-linear-logistic-regression',
      ],
      references: {
        free: [
          {
            title: 'A Bayesian perspective on ridge or "L2" regression (Berkeley Stat 151A lecture notes)',
            url: 'https://stat151a.berkeley.edu/spring-2026/lectures/unit3/bayes_and_L2.html',
          },
        ],
        papers: [
          {
            title: 'On the Mathematical Foundations of Theoretical Statistics',
            url: 'https://royalsocietypublishing.org/doi/10.1098/rsta.1922.0009',
            year: 1922,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 3 — Linear Methods for Regression, §3.4.1 (the Bayesian/MAP interpretation of ridge regression)',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'gradient-descent',
      name: 'Gradient Descent (Batch, SGD, Mini-Batch)',
      aliases: ['steepest descent', 'stochastic gradient descent', 'SGD'],
      tier: 1,
      year: 1847,
      difficulty: 2,
      hook: "Finds a loss's minimum by repeatedly stepping downhill along its steepest slope.",
      intuition:
        'Picture standing on a foggy hillside, trying to reach the lowest point, able to feel only the slope right ' +
        'under your feet. The obvious strategy is to take a step in whatever direction feels steepest downhill, ' +
        'then feel the slope again and repeat. Gradient descent is exactly this, applied to a loss function instead ' +
        'of a hillside: compute the gradient (the direction of steepest increase) at the current parameters, step a ' +
        'small distance in the opposite direction, and repeat until the steps stop helping. Batch gradient descent ' +
        'feels the slope using every training example each step — accurate, but slow per step on large data. ' +
        'Stochastic gradient descent (SGD) feels the slope using just one random example — cheap and noisy, but the ' +
        'noise averages out over many steps. Mini-batch splits the difference, averaging the slope over a small ' +
        'random handful of examples, and is what almost everything in practice actually runs. This is the workhorse ' +
        'behind ERM whenever the minimizer has no closed-form solution.',
      howItWorks: {
        summary:
          'Repeatedly compute the gradient of the loss with respect to the parameters and step the parameters a ' +
          'small distance in the opposite direction, until the loss stops improving.',
        steps: [
          'Initialize the parameters, typically randomly or at zero.',
          'Compute the gradient of the loss with respect to the parameters: over the whole training set for batch, one random example for stochastic, or a small random subset for mini-batch.',
          'Update the parameters by subtracting the learning rate times that gradient.',
          'Repeat for many passes (epochs) over the data, reshuffling before each pass for the stochastic and mini-batch variants.',
          'Stop when the loss on a held-out set stops improving, or after a fixed number of iterations.',
        ],
      },
      hyperparameters: [
        {
          name: 'learning rate',
          what: 'Scales the size of every step taken along the negative gradient.',
          tuning:
            'Too large diverges or oscillates around the minimum; too small converges reliably but very slowly. ' +
            'Commonly searched on a log scale, or scheduled to decay over training so early steps are large and ' +
            'later steps are fine-grained.',
        },
        {
          name: 'batch size',
          what: 'Number of examples used to estimate the gradient at each step.',
          tuning:
            'Larger batches give a lower-variance gradient estimate at higher per-step cost; smaller batches are ' +
            'cheaper per step and their noise can help escape shallow local minima. 32–256 is a common practical ' +
            'range for mini-batch training.',
        },
      ],
      whenToUse: [
        "The objective has no closed-form minimizer -- e.g. logistic regression's cross-entropy loss, or any neural network's loss surface -- gradient descent is the general-purpose fallback whenever ERM's minimizer must be found iteratively",
        'The dataset is too large to compute the full gradient cheaply and repeatedly -- mini-batch or stochastic variants trade exactness of each step for many more, cheaper steps',
        'The loss is differentiable, or at least sub-differentiable as with hinge loss, so a usable gradient can be computed at all',
      ],
      whenNotToUse: [
        "The objective has a closed-form solution -- e.g. ordinary least squares' normal equations -- where gradient descent is strictly worse: slower, and only approximately converging to what a direct solve gets exactly",
        'The objective is non-differentiable with no useful subgradient, e.g. optimizing accuracy or 0-1 loss directly',
        "The loss surface is badly ill-conditioned because features are unscaled -- scale features first, or use an adaptive method (e.g. Adam) that resolves per-parameter step sizes instead",
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'optimized-parameter-vector',
      },
      math: {
        latex: [
          '\\theta_{t+1} = \\theta_t - \\eta \\, \\nabla_\\theta \\mathcal{L}(\\theta_t)',
          '\\text{batch:}\\quad \\nabla_\\theta \\mathcal{L} = \\frac{1}{n}\\sum_{i=1}^{n} \\nabla_\\theta \\ell(\\theta; x_i, y_i)',
          '\\text{stochastic:}\\quad \\nabla_\\theta \\mathcal{L} \\approx \\nabla_\\theta \\ell(\\theta; x_{i_t}, y_{i_t}), \\ \\ i_t \\text{ drawn at random}',
        ],
        notes:
          'The general steepest-descent method is credited to Cauchy (1847), applied to solving systems of ' +
          'equations, well before any statistical or learning context existed. Stochastic gradient descent has a ' +
          'separate root: Robbins and Monro\'s 1951 stochastic approximation proved that a noisy, single-sample ' +
          'gradient estimate still converges to the true minimizer under a decaying step-size schedule -- fifteen ' +
          'years before backpropagation and well before any specific machine learning paper used the idea. ' +
          'Mini-batch is a later, purely practical compromise, adopted once hardware made small-batch matrix ' +
          'operations cheap to parallelize.',
      },
      complexity: {
        train: 'O(n·d) per epoch for batch gradient descent (n examples, d parameters), scanning the full dataset every step; O(d) per step for pure stochastic, with n steps per epoch',
        predict: 'n/a -- an optimization procedure, not a fitted model by itself',
      },
      code: [
        'import numpy as np',
        '',
        'def gradient_descent(grad_fn, theta0, X, y, lr=0.01, batch_size=None, epochs=50):',
        '    theta = theta0.copy()',
        '    n = len(y)',
        '    for _ in range(epochs):',
        '        idx = np.random.permutation(n)',
        '        step = batch_size or n              # None = full-batch',
        '        for start in range(0, n, step):',
        '            batch = idx[start:start + step]',
        '            g = grad_fn(theta, X[batch], y[batch])   # gradient on this (mini-)batch',
        '            theta -= lr * g',
        '    return theta',
      ].join('\n'),
      related: [
        'empirical-risk-minimization',
        'loss-functions',
        'linear-regression',
        'logistic-regression',
        'gradient-boosting',
        'hyperparameter-search',
      ],
      references: {
        free: [
          {
            title: 'scikit-learn user guide — Stochastic Gradient Descent',
            url: 'https://scikit-learn.org/stable/modules/sgd.html',
          },
          {
            title: 'Wikipedia — Gradient descent (history: Cauchy, 1847)',
            url: 'https://en.wikipedia.org/wiki/Gradient_descent',
          },
        ],
        papers: [
          {
            title: 'A Stochastic Approximation Method',
            url: 'https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-22/issue-3/A-Stochastic-Approximation-Method/10.1214/aoms/1177729586.full',
            year: 1951,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '12. Optimization Algorithms (12.3 Gradient Descent, 12.4 Stochastic Gradient Descent, 12.5 Minibatch SGD)',
            url: 'https://d2l.ai/chapter_optimization/index.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'bias-variance-decomposition',
      name: 'Bias–Variance Decomposition',
      aliases: ['bias-variance tradeoff', 'expected prediction error decomposition'],
      tier: 1,
      year: 1992,
      difficulty: 3,
      hook: 'Splits prediction error into noise, bias and variance — the formula behind why models over- or underfit.',
      intuition:
        'Imagine rerunning your whole experiment many times: draw a new training set of the same size from the same ' +
        'source, refit the same procedure, and ask what it predicts at one fixed test point. Do this over and over ' +
        'and two very different quantities emerge. Average all those predictions together and compare the average ' +
        'to the true value: any gap is bias, error from a procedure too rigid to represent the real pattern no ' +
        "matter how much data it sees. Look instead at how much the individual predictions bounce around their own " +
        'average: that spread is variance, error from a procedure sensitive to exactly which training set it ' +
        "happened to get. Add irreducible noise in the data itself, and expected squared prediction error at that " +
        'point splits exactly into those three additive pieces. Nothing else contributes. This is what makes ' +
        '"overfitting" a precise, decomposable claim rather than a vibe, and it is the lens for reading why bagging ' +
        '(attacks variance) and boosting (attacks bias) work by fundamentally different mechanisms.',
      howItWorks: {
        summary:
          'At a fixed test point, expected squared prediction error decomposes exactly into irreducible noise, the ' +
          "squared bias of the fitted procedure's average prediction, and the variance of that prediction across " +
          'different training samples.',
        steps: [
          'Imagine drawing many different training sets of the same size from the same distribution.',
          'Fit the same learning procedure to each one and record its prediction at a fixed test point x.',
          'Average those predictions across all the resampled fits -- the gap between that average and the true function is the bias.',
          "Measure how much the individual predictions spread out around their own average -- that spread is the variance.",
          "Add the two together with the data's own irreducible noise variance to get the expected squared prediction error at x.",
        ],
      },
      whenToUse: [
        'A model does well on training data but poorly on held-out data, and you want to know whether the gap is a variance problem -- an unstable fit across resamples -- before reaching for a specific fix',
        'You are choosing between models of different complexity and want a principled reason for the choice beyond "try both and see"',
        'You want to explain why an ensembling technique works -- bagging reduces variance without touching bias; boosting reduces bias by combining weak, high-bias learners',
      ],
      whenNotToUse: [
        'There is only one training set with no way to resample or bootstrap it -- the decomposition is a property of a procedure averaged over hypothetical resamples, not something read directly off a single fit without approximating that resampling',
        'The loss is not squared error -- this clean, additive noise + bias^2 + variance decomposition is derived specifically for squared loss; other losses (0-1 loss, cross-entropy) have analogous but messier, non-additive decompositions',
        'The real problem is data quality or leakage rather than model complexity -- no amount of reasoning about bias and variance fixes a mislabeled or leaked feature',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'error-decomposition-diagnostic',
      },
      math: {
        latex: [
          '\\mathrm{Err}(x) = \\sigma^2 + \\mathrm{Bias}^2(x) + \\mathrm{Var}(x)',
          '\\mathrm{Bias}(x) = \\mathbb{E}_{\\mathcal{T}}\\!\\left[\\hat f_{\\mathcal{T}}(x)\\right] - f(x)',
          '\\mathrm{Var}(x) = \\mathbb{E}_{\\mathcal{T}}\\!\\left[\\left(\\hat f_{\\mathcal{T}}(x) - \\mathbb{E}_{\\mathcal{T}}[\\hat f_{\\mathcal{T}}(x)]\\right)^2\\right]',
        ],
        notes:
          'Geman, Bienenstock and Doursat (1992) is the standard citation for this formal result -- the same paper ' +
          "belt.ts's overfitting-and-regularization cites, for the same underlying decomposition viewed from a " +
          'different angle: that entry uses it to motivate penalizing complexity; this entry treats the ' +
          'decomposition itself as the diagnostic. The expectation runs over T, hypothetical resampled training ' +
          'sets -- an idealization approximated in practice by bootstrap resampling, exactly as scikit-learn\'s own ' +
          'worked single-estimator-vs-bagging example does.',
      },
      code: [
        'import numpy as np',
        '',
        'def bias_variance_decompose(fit_predict, X_train, y_train, X_test, y_true, n_resamples=200):',
        '    """Estimate mean squared bias and variance at test points via bootstrap resampling."""',
        '    n = len(X_train)',
        '    preds = np.zeros((n_resamples, len(X_test)))',
        '    for b in range(n_resamples):',
        '        idx = np.random.choice(n, size=n, replace=True)     # bootstrap resample',
        '        preds[b] = fit_predict(X_train[idx], y_train[idx], X_test)',
        '',
        '    avg_pred = preds.mean(axis=0)',
        '    bias_sq = (avg_pred - y_true) ** 2',
        '    variance = preds.var(axis=0)',
        '    return bias_sq.mean(), variance.mean()',
      ].join('\n'),
      // overfitting-and-regularization is the direct sibling (same paper, the fix rather than the
      // diagnosis); bagging/random-forest attack variance specifically; gradient-boosting attacks
      // bias specifically -- the genuine mechanical distinction this entry sets up.
      related: ['overfitting-and-regularization', 'cross-validation', 'bagging', 'random-forest', 'gradient-boosting'],
      references: {
        free: [
          {
            title: 'scikit-learn example — Single estimator versus bagging: bias-variance decomposition',
            url: 'https://scikit-learn.org/stable/auto_examples/ensemble/plot_bias_variance.html',
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
            chapter: 'Ch. 7 — Model Assessment and Selection (7.3 Bias-Variance Decomposition)',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'convexity-and-no-free-lunch',
      name: 'Convexity & the No-Free-Lunch Theorem',
      aliases: ['no free lunch theorem', 'NFL theorem'],
      tier: 2,
      year: 1997,
      difficulty: 3,
      hook: 'A convex loss has one minimum to find; no-free-lunch says no algorithm is best across every possible problem.',
      intuition:
        'Two separate, unrelated-sounding facts about optimization and learning turn out to shape nearly everything ' +
        'else on this map. A function is convex if a straight line between any two points on its graph never dips ' +
        "below the graph itself -- practically, that means no false valleys: any local minimum an optimizer finds " +
        'is automatically the global one. This is why OLS, ridge, lasso, logistic regression and linear SVMs can be ' +
        'solved reliably, and why a neural network, whose loss surface is riddled with saddle points, offers no ' +
        'such guarantee. The no-free-lunch theorem is a separate, more provocative claim: averaged uniformly over ' +
        'every conceivable problem an algorithm might face, no learner or optimizer outperforms any other -- not ' +
        'even random search. An algorithm\'s real-world edge never comes from being intrinsically better; it comes ' +
        'entirely from its inductive bias matching the structure of the problems it is actually used on.',
      howItWorks: {
        summary:
          'Convexity is a geometric property of the loss surface that guarantees any local minimum is the global ' +
          'one; the no-free-lunch theorem is a separate result about performance averaged uniformly over every ' +
          'possible problem.',
        steps: [
          'Check convexity: a function is convex if a straight line between any two points on its graph never dips below the graph itself.',
          'If both the loss and the hypothesis class are convex, any algorithm that finds a local minimum has found the global one -- why OLS, ridge/lasso and logistic regression have reliable, unique solutions.',
          'No-free-lunch instead averages an algorithm\'s performance over every possible problem, weighted uniformly -- under that averaging, every algorithm ties.',
          "The practical reading: an algorithm's real edge comes from its inductive bias matching the structure of the problems it is actually applied to, not from universal superiority.",
        ],
      },
      whenToUse: [
        'You need to know in advance whether an optimization is guaranteed to reach the best possible fit, not just a locally good one -- check whether the loss and the hypothesis class are both convex',
        "You're evaluating a claim that one algorithm is 'the best' in general -- the no-free-lunch theorem is the formal reason to ask 'best on what class of problems, specifically?'",
      ],
      whenNotToUse: [
        'The model is a neural network or any other non-convex hypothesis class -- convexity\'s global-optimum guarantee simply does not apply, regardless of how the loss itself is shaped',
        "The 'all possible problems, uniformly weighted' averaging behind no-free-lunch does not describe your situation -- real-world problems are not drawn uniformly from the space of all functions, so an algorithm's practical superiority on the structured problems you actually face is a real, useful fact rather than a contradiction of the theorem",
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['tiny', 'small', 'medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'theoretical-property-of-optimization-and-algorithm-selection',
      },
      related: ['empirical-risk-minimization', 'gradient-descent', 'hyperparameter-search'],
      references: {
        free: [
          {
            title: 'Convex Optimization (Boyd & Vandenberghe) — free PDF and course materials',
            url: 'https://web.stanford.edu/~boyd/cvxbook/',
          },
        ],
        papers: [
          {
            title: 'No Free Lunch Theorems for Optimization',
            url: 'https://doi.org/10.1109/4235.585893',
            year: 1997,
          },
        ],
      },
    },
  ],
} satisfies Body;
