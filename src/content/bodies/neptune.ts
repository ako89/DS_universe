/**
 * Neptune — Bayesian Inference & Graphical Models. See PLAN.md §3 for the full moon list (8
 * moons, all written here, at the tiers fixed in the batch brief so sol/uranus/chronos — written
 * in parallel by other agents — can cross-link in without id collisions).
 *
 * The eight moons have real internal structure, deliberately kept explicit rather than left to
 * infer:
 *   - bayes-theorem-and-conjugate-priors is the foundational rule and its one closed-form special
 *     case (conjugate prior families), where the posterior update is pure arithmetic.
 *   - bayesian-linear-logistic-regression applies that framework to the two workhorse models
 *     already written on Mercury (linear-regression, logistic-regression), treating coefficients
 *     as distributions instead of point estimates. Linear regression stays closed-form under a
 *     conjugate Gaussian prior; logistic regression does not, which is the entry's bridge into
 *     the next two moons.
 *   - mcmc and variational-inference are the two general families of *approximate* inference used
 *     whenever the posterior has no closed form: sampling (asymptotically exact, slow) versus
 *     optimization (fast, biased by the chosen approximating family). Both entries state this
 *     contrast explicitly and point at each other.
 *   - bayesian-networks and conditional-random-fields are graphical-model *formalisms* — directed
 *     versus undirected — distinct from the inference algorithms (MCMC, VI, exact dynamic
 *     programming) used to fit models built on them. This directed/undirected contrast is stated
 *     explicitly in both entries' intuition.
 *   - hidden-markov-models is a specific, important directed graphical model for sequences.
 *     Baum-Welch/forward-backward is named as the classical fitting algorithm (EM specialised to
 *     this structure), and the entry notes that MCMC, variational inference or exact dynamic
 *     programming can each be used to fit different aspects of an HMM-shaped problem.
 *   - latent-dirichlet-allocation is a specific generative model for text built from two stacked
 *     Dirichlet-Multinomial conjugate pairs (per bayes-theorem-and-conjugate-priors), and is
 *     itself typically fit with variational inference (the original paper's method) or collapsed
 *     Gibbs sampling (an MCMC method) — a genuine, stated link back to both.
 *
 * `eraRange` is [1763, 2003]: Bayes' posthumously published essay is the earliest moon; Blei, Ng
 * & Jordan's LDA paper (JMLR 3, 2003) is the latest.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * Every date/attribution below was checked against either a directly-opened HTML source (arXiv
 * /abs/ page, Wikipedia, a library's own docs, dblp.org, an author's own site) or, for every DOI
 * cited, against https://api.crossref.org/works/<doi> structured metadata — not against a
 * WebFetch summary of a PDF. Two 403s were hit (repository.upenn.edu, dl.acm.org for the CRF
 * paper) and treated per CONTENT_GUIDE's explicit instruction: a 403 is a refused automated fetch,
 * not evidence the citation is wrong — title/authors/venue/year for that paper were independently
 * corroborated via dblp.org (which did load) before citing it.
 *
 * One near-miss worth recording: WebFetch on a mirrored PDF of the CRF paper
 * (cs.cornell.edu/.../10-LaffertyEtAl01.pdf) *did not* fabricate a plausible answer — it correctly
 * reported that the binary PDF content wasn't extractable text and declined to guess. That is the
 * failure mode CONTENT_GUIDE §3 warns can go the other way (confident invention); here it did not,
 * but the citation was still re-verified through dblp.org's HTML page rather than trusted on that
 * basis alone.
 *
 * `related` uses ids from this batch (Mercury/Jupiter/Saturn, already merged) plus
 * `maximum-likelihood-and-map` from sol.ts, which lands in this same batch per the brief. Links to
 * bodies not yet written (e.g. a sequence-model successor on Echo) are left as `//` comments
 * rather than guessed at.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'neptune',
  name: 'Neptune',
  segment: 'Bayesian Inference & Graphical Models',
  hook: 'Treats unknowns as distributions, not numbers — then asks how evidence should update them.',
  summary:
    'Neptune holds the machinery of reasoning under uncertainty: one rule for turning a prior belief into a ' +
    'posterior belief, the two general-purpose ways to approximate that update when it has no closed form, ' +
    'and the graphical-model formalisms — directed and undirected — used to structure many unknowns at once. ' +
    'Two named models, hidden Markov models and latent Dirichlet allocation, show the framework applied to ' +
    'sequences and to text.',
  eraRange: [1763, 2003],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'bayes-theorem-and-conjugate-priors',
      name: "Bayes' Theorem & Conjugate Priors",
      aliases: ['Bayesian updating', 'inverse probability'],
      tier: 1,
      year: 1763,
      difficulty: 2,
      hook: 'One rule for turning a prior belief into a posterior once evidence arrives — sometimes just arithmetic.',
      intuition:
        'Start with a belief about how likely something is, expressed as a probability. Bayes\' theorem says ' +
        'exactly how to revise that belief once you see evidence: multiply the prior by how well the evidence ' +
        'fits each possibility, then rescale so everything still sums to one. That rescaled result is the ' +
        'posterior — your updated belief. The theorem never asks you to solve anything hard; the hard part is ' +
        'usually that multiplying an arbitrary prior by an arbitrary likelihood produces a messy, ' +
        'hard-to-normalize shape with no name. Conjugate priors sidestep that entirely. Pick a prior from the ' +
        'same family the posterior would land in anyway — a Beta prior for a coin\'s bias, a Gaussian prior for ' +
        'a Gaussian mean — and the update becomes pure bookkeeping: add counts, or blend means weighted by ' +
        'precision. No integration, no approximation, an exact answer after every new observation.',
      howItWorks: {
        summary:
          'Combine a prior distribution over an unknown with the likelihood of the observed data, then ' +
          'renormalize; for a conjugate prior the result lands back in the same distributional family with ' +
          'updated parameters.',
        steps: [
          'Write down a prior distribution P(theta) over the unknown quantity, before seeing any data.',
          'Write down the likelihood P(D | theta): how probable the observed data would be under each possible theta.',
          'Multiply prior by likelihood to get an unnormalized posterior, P(theta) times P(D | theta).',
          'Divide by the evidence P(D) — the integral of that product over all theta — so the posterior integrates to 1.',
          'If the prior is conjugate to the likelihood, skip the integral: the posterior\'s family is known in advance, only its parameters need updating.',
        ],
      },
      whenToUse: [
        'You need to update a belief or estimate as new data arrives, one point or one batch at a time',
        'The likelihood belongs to a well-known family (Bernoulli, Binomial, Poisson, Gaussian, Multinomial) with a known conjugate prior',
        'You want an exact, closed-form posterior rather than an approximation, with no sampler or optimizer to run',
        'Data is scarce and you have genuine prior knowledge worth encoding rather than starting from a flat, uninformative guess',
      ],
      whenNotToUse: [
        'The likelihood has no known conjugate prior — most models with several interacting parameters — and you need MCMC or variational inference instead',
        'You want the data to speak entirely for itself with no prior influence; a strong prior with little data can dominate the posterior',
        'The parameter of interest is high-dimensional and structured (e.g. neural network weights), where no simple conjugate family captures the right shape',
        'You need only a point estimate and have abundant data — maximum likelihood converges to the same answer with less machinery',
      ],
      facets: {
        task: ['inference'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'posterior-distribution',
      },
      math: {
        latex: [
          'P(\\theta \\mid D) = \\frac{P(D \\mid \\theta)\\,P(\\theta)}{P(D)}',
          '\\theta \\sim \\mathrm{Beta}(\\alpha,\\beta),\\ D \\mid \\theta \\sim \\mathrm{Binomial}(n,\\theta) \\;\\Rightarrow\\; \\theta \\mid D \\sim \\mathrm{Beta}(\\alpha+k,\\ \\beta+n-k)',
        ],
        notes:
          'P(D), the evidence, is the same normalizing integral that makes exact Bayesian inference hard for ' +
          'arbitrary models — it is exactly what MCMC and variational inference exist to avoid computing ' +
          'directly. Three conjugate pairs are worth memorising: Beta prior with a Binomial/Bernoulli ' +
          'likelihood, Gaussian prior with a Gaussian likelihood of known variance, and Dirichlet prior with a ' +
          'Multinomial/Categorical likelihood — the last one is exactly the machinery inside latent Dirichlet ' +
          'allocation\'s topic-word and document-topic distributions, applied twice.',
      },
      complexity: {
        train: 'O(1) parameter update per conjugate pair — add sufficient statistics to the prior\'s hyperparameters',
        predict: 'O(1) to evaluate the posterior density; the posterior itself is available in closed form',
      },
      code: [
        'from scipy.stats import beta',
        '',
        "# Beta(2, 2) prior on a coin's bias theta -- mildly favors 0.5",
        'alpha_prior, beta_prior = 2, 2',
        '',
        '# Observe 15 heads out of 20 flips',
        'heads, flips = 15, 20',
        '',
        '# Conjugacy: posterior is Beta(alpha + heads, beta + flips - heads) -- no integration needed',
        'alpha_post = alpha_prior + heads',
        'beta_post = beta_prior + (flips - heads)',
        '',
        'posterior = beta(alpha_post, beta_post)',
        'print(posterior.mean(), posterior.interval(0.95))   # point estimate + 95% credible interval',
      ].join('\n'),
      // maximum-likelihood-and-map (sol.ts, this batch) is the direct frequentist/point-estimate
      // counterpart; naive-bayes (mercury) is Bayes' theorem applied with an independence assumption.
      related: ['naive-bayes', 'maximum-likelihood-and-map', 'bayesian-linear-logistic-regression', 'mcmc'],
      references: {
        free: [
          { title: "Wikipedia — Bayes' theorem", url: 'https://en.wikipedia.org/wiki/Bayes%27_theorem' },
          { title: 'Wikipedia — Conjugate prior', url: 'https://en.wikipedia.org/wiki/Conjugate_prior' },
        ],
        papers: [
          {
            title: 'An Essay towards Solving a Problem in the Doctrine of Chances',
            url: 'https://doi.org/10.1098/rstl.1763.0053',
            year: 1763,
          },
          {
            title: "Bayes or Laplace? An examination of the origin and early applications of Bayes's theorem",
            url: 'https://doi.org/10.1007/BF00348352',
            year: 1982,
          },
        ],
        books: [
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Bishop',
            chapter: 'Ch. 2 — Probability Distributions',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'bayesian-linear-logistic-regression',
      name: 'Bayesian Linear & Logistic Regression',
      aliases: ['Bayesian ridge regression', 'Bayesian GLM'],
      tier: 1,
      year: 1972,
      difficulty: 3,
      hook: 'Fits the same line or boundary as its frequentist twin, but returns a distribution of answers.',
      intuition:
        'Ordinary least squares and logistic regression each hand you one number per coefficient: the ' +
        'best-fitting weight. Nothing in that number says how sure the model is. Bayesian linear and logistic ' +
        'regression ask the same question differently: given a prior belief and the data you actually saw, ' +
        'what is the whole range of plausible coefficient vectors, not just the single best one? Put a prior ' +
        'over the coefficients, combine it with the likelihood of the observed outcomes, and the result is a ' +
        'posterior distribution over coefficients. For linear regression with a Gaussian prior and Gaussian ' +
        'noise, that posterior has a closed form — nothing is lost going Bayesian. For logistic regression the ' +
        'posterior has no closed form, because the logistic likelihood is not conjugate to any convenient ' +
        'prior, so it must be approximated: with a Gaussian fit around the posterior\'s peak (Laplace ' +
        'approximation), or with MCMC, or with variational inference. Either way, predictions come with a real ' +
        'uncertainty band, not just a number.',
      howItWorks: {
        summary:
          'Place a prior over the regression coefficients, combine it with the likelihood of the observed ' +
          'targets, and read off (or approximate) the resulting posterior distribution over coefficients ' +
          'instead of a single fitted value.',
        steps: [
          'Choose a prior over the coefficients — typically a zero-mean Gaussian, which shrinks like ridge regression but stays a full distribution.',
          'For linear regression with Gaussian noise, combine the Gaussian prior and Gaussian likelihood analytically into a Gaussian posterior over the coefficients.',
          "For logistic regression, the Bernoulli likelihood has no closed-form conjugate: approximate the posterior with a Laplace approximation, MCMC, or variational inference.",
          'Predict for a new point by integrating over the whole posterior rather than plugging in one coefficient vector, producing a predictive interval instead of a single number.',
          'Tune the prior\'s own strength by maximizing the marginal likelihood, rather than by a separate cross-validated grid search.',
        ],
      },
      hyperparameters: [
        {
          name: 'alpha_1, alpha_2, lambda_1, lambda_2 (BayesianRidge)',
          what: 'Shape and rate hyperparameters of the Gamma priors placed on the noise precision (alpha) and coefficient precision (lambda).',
          tuning:
            'scikit-learn defaults all four to 1e-6, an almost-flat, weakly informative setting. Leave them ' +
            'there unless you have real prior knowledge about the noise or coefficient scale to encode.',
        },
        {
          name: 'prior scale (logistic case)',
          what: 'Standard deviation of the Gaussian prior placed on each coefficient.',
          tuning:
            'A tighter prior (smaller scale) shrinks coefficients harder, like a smaller C in penalized ' +
            'logistic regression; widen it as sample size grows, since the data increasingly dominates the posterior.',
        },
      ],
      whenToUse: [
        'You need a calibrated uncertainty interval on each prediction or coefficient, not just a point estimate',
        'The dataset is small and a sensible prior (e.g. shrink coefficients toward zero) meaningfully stabilizes the fit',
        'You want the regularization strength selected automatically from the data via the marginal likelihood, instead of cross-validated grid search',
        'The downstream decision depends on how confident the model is, not only on what it predicts',
      ],
      whenNotToUse: [
        'You only need a point prediction and already have plenty of data — plain least squares or logistic regression is faster with the same asymptotic answer',
        'You cannot justify or defend a reasonable choice of prior',
        'For the logistic case, you need exact inference — the posterior is always an approximation (Laplace, MCMC or variational), never closed-form',
        'Training-time cost matters a lot and the dataset is large — the Bayesian fit costs meaningfully more than the point-estimate version, especially with sampling',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'posterior-distribution-over-coefficients',
      },
      math: {
        latex: [
          'p(\\beta \\mid y, X) \\propto p(y \\mid X, \\beta)\\, p(\\beta)',
          '\\beta \\mid y, X \\sim \\mathcal{N}(\\mu_n, \\Sigma_n) \\quad \\text{(Gaussian prior + Gaussian likelihood, linear case)}',
          'p(\\beta \\mid y, X) \\approx \\mathcal{N}\\!\\left(\\hat{\\beta}_{\\mathrm{MAP}},\\, H^{-1}\\right) \\quad \\text{(Laplace approximation, logistic case)}',
        ],
        notes:
          'The Laplace approximation centers a Gaussian at the posterior mode (the MAP estimate) with ' +
          'covariance equal to the inverse Hessian of the negative log-posterior there — cheap, but only ' +
          'accurate when the true posterior really is roughly Gaussian-shaped near its peak. MCMC and ' +
          'variational inference exist precisely because that assumption fails often enough to matter.',
      },
      complexity: {
        train:
          'O(n·p^2) for the closed-form Gaussian linear case, comparable to ridge regression; O(n·p^2) per ' +
          'iteration for the logistic Laplace approximation, run to convergence',
        predict: 'O(p^2) per prediction to propagate coefficient uncertainty into a predictive interval, versus O(p) for a point estimate',
      },
      code: [
        'from sklearn.linear_model import BayesianRidge',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.pipeline import make_pipeline',
        '',
        'model = make_pipeline(StandardScaler(), BayesianRidge())',
        'model.fit(X_train, y_train)',
        '',
        'y_mean, y_std = model[-1].predict(model[:-1].transform(X_test), return_std=True)',
        '# y_std is a per-prediction uncertainty band -- not available from plain LinearRegression',
        '',
        'print(model[-1].coef_)                      # posterior mean of each coefficient',
        'print(model[-1].alpha_, model[-1].lambda_)   # fitted noise / coefficient precisions',
      ].join('\n'),
      related: ['linear-regression', 'logistic-regression', 'bayes-theorem-and-conjugate-priors', 'mcmc', 'variational-inference'],
      references: {
        free: [
          { title: 'scikit-learn user guide — Bayesian Regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html#bayesian-regression' },
          { title: 'PyMC — Introductory Overview', url: 'https://www.pymc.io/projects/docs/en/stable/learn/core_notebooks/pymc_overview.html' },
        ],
        papers: [
          {
            title: 'Bayes Estimates for the Linear Model',
            url: 'https://doi.org/10.1111/j.2517-6161.1972.tb00885.x',
            year: 1972,
          },
        ],
        books: [
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Bishop',
            chapter: 'Ch. 3 — Linear Models for Regression; Ch. 4 — Linear Models for Classification',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'mcmc',
      name: 'Markov Chain Monte Carlo (MCMC)',
      aliases: ['Metropolis-Hastings', 'Gibbs sampling'],
      tier: 1,
      year: 1953,
      difficulty: 4,
      hook: "Draws samples from a distribution you can't compute, via a random walk shaped to visit it correctly.",
      intuition:
        'A Bayesian posterior is a product of a prior and a likelihood, divided by an integral nobody can ' +
        'solve. MCMC sidesteps the integral entirely: instead of computing the posterior, it builds a random ' +
        'walk — a Markov chain — engineered so that, after enough steps, the fraction of time it spends in each ' +
        'region of parameter space matches that region\'s posterior probability, even though the normalizing ' +
        'constant was never calculated. The simplest version, Metropolis-Hastings, proposes a small random ' +
        'jump from the current position, accepts it with a probability computed from the ratio of posterior ' +
        'densities at the two points, and otherwise rejects it and stays put. That ratio\'s normalizing constant ' +
        'cancels top and bottom, so the intractable integral is never evaluated. Run the chain long enough, ' +
        'discard the early samples taken before it settles, and what remains behaves like draws from the true ' +
        'posterior — histogram them, average them, or feed them to any downstream statistic.',
      howItWorks: {
        summary:
          'Build a Markov chain whose stationary distribution equals the target posterior, then run it long ' +
          'enough that the samples it produces are approximately draws from that posterior.',
        steps: [
          'Start at some initial parameter value theta.',
          "Propose a new value theta' from a proposal distribution centered on the current state.",
          "Accept theta' with probability min(1, [prior(theta')·likelihood(theta')] / [prior(theta)·likelihood(theta)]) — the intractable normalizing constant cancels in this ratio.",
          "If accepted, move to theta'; otherwise stay at theta — either way, record the current state as one sample.",
          'Discard an initial "burn-in" stretch of samples taken before the chain has converged to its stationary distribution.',
          'Use the remaining samples as an empirical approximation to the posterior for any summary you need.',
        ],
      },
      hyperparameters: [
        {
          name: 'step size / proposal scale',
          what: 'Spread of the proposal distribution used at each step.',
          tuning:
            'Too small and the chain accepts almost everything but barely moves; too large and it proposes ' +
            'jumps the posterior rejects almost every time. Target roughly a 20-50% acceptance rate for ' +
            "random-walk Metropolis; NUTS-based samplers such as PyMC's tune this automatically.",
        },
        {
          name: 'number of chains and burn-in',
          what: 'How many independent chains to run and how many initial samples to discard before convergence.',
          tuning:
            'Run several chains from different starting points and check they agree, e.g. via the R-hat ' +
            'statistic; discard burn-in until trace plots look stationary rather than still drifting.',
        },
      ],
      whenToUse: [
        'The posterior has no closed form and no conjugate prior is available, so exact updating is not an option',
        'You need samples from the full posterior — for uncertainty intervals or posterior predictive checks — not just a point estimate',
        'The model is moderate in dimension and you can afford the compute for many sequential draws',
        "You want an asymptotically exact answer and are willing to trade speed for that guarantee, rather than accept variational inference's approximation bias",
      ],
      whenNotToUse: [
        'The parameter space is very high-dimensional without gradient information — plain random-walk MCMC mixes too slowly; consider Hamiltonian Monte Carlo/NUTS or variational inference',
        "You need a fast, repeated fit inside a tight loop, where variational inference's single optimization is far cheaper than redrawing a chain",
        'You cannot check convergence (multiple chains, trace plots, R-hat) and would be shipping a posterior nobody verified had actually converged',
        'A conjugate prior is available and the exact posterior is already in closed form — running a sampler would be solving a solved problem',
      ],
      facets: {
        task: ['inference'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'posterior-samples',
      },
      math: {
        latex: [
          "\\alpha(\\theta \\to \\theta') = \\min\\!\\left(1,\\ \\frac{p(\\theta')\\,p(D\\mid\\theta')}{p(\\theta)\\,p(D\\mid\\theta)}\\right)",
          '\\pi(\\theta) = p(\\theta \\mid D) \\quad \\text{(the chain\'s stationary distribution is the target posterior)}',
        ],
        notes:
          'The acceptance ratio is exactly why MCMC never needs the evidence P(D): it appears in both the ' +
          'numerator and denominator and cancels. Gibbs sampling (Geman & Geman, 1984) is the special case ' +
          'where each variable is updated in turn by sampling directly from its full conditional distribution, ' +
          'always accepted with probability 1 — useful whenever those conditionals are easy to sample even ' +
          'though the joint posterior is not.',
      },
      complexity: {
        train:
          'No closed-form bound — cost scales as chains × iterations × (cost of one likelihood evaluation), ' +
          'with iterations needed to mix determined empirically, not analytically',
        predict: 'O(number of retained samples) to summarize the posterior predictive, since prediction means averaging over samples',
      },
      code: [
        'import pymc as pm',
        '',
        'with pm.Model():',
        '    theta = pm.Beta("theta", alpha=2, beta=2)              # prior',
        '    pm.Binomial("obs", n=20, p=theta, observed=15)          # likelihood',
        '',
        '    trace = pm.sample(2000, tune=1000, chains=4)            # NUTS by default',
        '',
        'pm.summary(trace)          # posterior mean, sd, 94% HDI, r_hat per parameter',
      ].join('\n'),
      // gaussian-mixture-models (jupiter) is fit by EM; MCMC and variational-inference are the two
      // general alternatives when EM's exact M-step doesn't apply.
      related: ['variational-inference', 'bayesian-linear-logistic-regression', 'hidden-markov-models', 'gaussian-mixture-models'],
      references: {
        free: [{ title: 'PyMC — Introductory Overview', url: 'https://www.pymc.io/projects/docs/en/stable/learn/core_notebooks/pymc_overview.html' }],
        papers: [
          {
            title: 'Equation of State Calculations by Fast Computing Machines',
            url: 'https://doi.org/10.1063/1.1699114',
            year: 1953,
          },
          {
            title: 'Monte Carlo Sampling Methods Using Markov Chains and Their Applications',
            url: 'https://doi.org/10.1093/biomet/57.1.97',
            year: 1970,
          },
          {
            title: 'Stochastic Relaxation, Gibbs Distributions, and the Bayesian Restoration of Images',
            url: 'https://doi.org/10.1109/TPAMI.1984.4767596',
            year: 1984,
          },
        ],
        books: [{ title: 'Probabilistic Machine Learning: An Introduction', author: 'Murphy', url: 'https://probml.github.io/pml-book/book1.html' }],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'variational-inference',
      name: 'Variational Inference',
      aliases: ['VI', 'variational Bayes'],
      tier: 1,
      year: 1999,
      difficulty: 4,
      hook: 'Turns a stubborn posterior into an optimization problem: find the closest simple distribution.',
      intuition:
        'MCMC gets an asymptotically exact posterior by sampling, which can take a long time to converge. ' +
        'Variational inference makes a different trade: pick a family of simple, tractable distributions — say, ' +
        'independent Gaussians, one per parameter — and search within that family for the member closest to ' +
        'the true posterior, measured by KL divergence. That search is an optimization problem, solvable with ' +
        'the same gradient-based machinery used everywhere else in machine learning, and typically far faster ' +
        'than sampling. The price is a systematic bias: the answer is only as good as the family searched, and ' +
        'if the true posterior is multimodal or has strong correlations between parameters that the family ' +
        "cannot represent, the fit misses them — an independent-Gaussian approximation, for instance, can " +
        'never capture two parameters trading off against each other. What you get is fast and deterministic; ' +
        "what you give up is MCMC's guarantee of eventually getting it exactly right.",
      howItWorks: {
        summary:
          'Choose a tractable family of approximating distributions, then optimize its parameters to maximize ' +
          'the evidence lower bound (ELBO), which is equivalent to minimizing the KL divergence to the true posterior.',
        steps: [
          'Choose a variational family q(theta) — commonly mean-field, where q factorizes into an independent distribution per parameter.',
          "Write the evidence lower bound (ELBO): the expected log joint probability under q, plus q's entropy.",
          'Maximizing the ELBO is equivalent to minimizing KL(q || true posterior), without ever needing the intractable evidence term.',
          'Optimize the ELBO over q\'s parameters — by coordinate ascent (classical mean-field) or stochastic gradient ascent with the reparameterization trick (modern "black-box" VI).',
          'Stop when the ELBO stops improving; the optimized q is the variational approximation to the posterior.',
        ],
      },
      hyperparameters: [
        {
          name: 'variational family',
          what: 'The functional form assumed for q (mean-field Gaussian, full-covariance Gaussian, normalizing flow, etc.).',
          tuning:
            'Start mean-field for speed; move to a richer family only if diagnostics show the posterior has ' +
            'correlations or shapes mean-field cannot represent.',
        },
        {
          name: 'learning rate / number of optimization steps',
          what: 'Controls the stochastic gradient ascent used to maximize the ELBO in modern, black-box VI.',
          tuning:
            'Monitor the ELBO trace for convergence the same way you would monitor a training loss curve; an ' +
            "adaptive optimizer such as Adam is a reasonable default.",
        },
      ],
      whenToUse: [
        'You need approximate posteriors fast — inside a training loop, at production scale, or on data too large for MCMC to mix on in reasonable time',
        'You can accept a biased-but-fast approximation over a slow-but-asymptotically-exact one',
        'The posterior is plausibly close to your chosen variational family — e.g. roughly unimodal and not strongly correlated, for a mean-field Gaussian family',
        'You want a deterministic, reproducible optimization run rather than a stochastic sampler whose convergence must be separately diagnosed',
      ],
      whenNotToUse: [
        "The true posterior is multimodal or has strong parameter correlations the variational family can't represent — mean-field VI systematically underestimates uncertainty here",
        'You need the asymptotic correctness guarantee MCMC provides, e.g. for a final reported result where approximation bias itself is unacceptable',
        'The model is small enough that exact conjugate updating or a short MCMC run is already fast — the added complexity of a variational family buys nothing',
        'You cannot validate the fit against ground truth or a slower MCMC run, and would be shipping an approximation with unknown bias',
      ],
      facets: {
        task: ['inference'],
        dataType: ['tabular', 'text'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'approximate-posterior-distribution',
      },
      math: {
        latex: [
          '\\mathrm{ELBO}(q) = \\mathbb{E}_{q}[\\log p(D,\\theta)] - \\mathbb{E}_{q}[\\log q(\\theta)]',
          '\\log p(D) = \\mathrm{ELBO}(q) + \\mathrm{KL}\\!\\left(q(\\theta)\\,\\|\\,p(\\theta\\mid D)\\right)',
          'q^{*} = \\arg\\max_{q \\in \\mathcal{Q}} \\ \\mathrm{ELBO}(q)',
        ],
        notes:
          'The second line is the whole idea in one identity: since log p(D) is fixed and KL divergence is ' +
          'always non-negative, maximizing the ELBO is exactly equivalent to minimizing the KL divergence to ' +
          'the true posterior — so you never touch the intractable log p(D) directly, only a lower bound on ' +
          'it. Mean-field VI additionally assumes q factorizes across parameters, which makes the ELBO ' +
          'optimizable coordinate by coordinate but is also the source of its underestimated uncertainty: an ' +
          'independent-factor q cannot represent correlation between parameters even when the truth has plenty.',
      },
      complexity: {
        train:
          'One optimization run to convergence, typically far fewer evaluations than an MCMC chain needs to ' +
          'mix, though each ELBO gradient step costs O(n) over the data (or O(batch size) with stochastic VI)',
        predict: 'O(1) to evaluate the fitted variational distribution; no re-optimization needed per query',
      },
      code: [
        'import pymc as pm',
        '',
        'with pm.Model():',
        '    theta = pm.Beta("theta", alpha=2, beta=2)',
        '    pm.Binomial("obs", n=20, p=theta, observed=15)',
        '',
        '    approx = pm.fit(n=20000, method="advi")   # automatic differentiation VI',
        '    trace = approx.sample(2000)',
        '',
        'pm.summary(trace)   # compare against an MCMC trace for the same model',
      ].join('\n'),
      // gaussian-mixture-models (jupiter) is fit by EM; VI is a general alternative when the exact
      // M-step isn't available. nmf/latent-dirichlet-allocation are further "discover structure"
      // models that reuse this same machinery to fit.
      related: ['mcmc', 'bayesian-linear-logistic-regression', 'latent-dirichlet-allocation', 'gaussian-mixture-models'],
      references: {
        free: [
          { title: 'Variational Inference: A Review for Statisticians (arXiv)', url: 'https://arxiv.org/abs/1601.00670' },
          { title: 'PyMC — Introductory Overview', url: 'https://www.pymc.io/projects/docs/en/stable/learn/core_notebooks/pymc_overview.html' },
        ],
        papers: [
          {
            title: 'An Introduction to Variational Methods for Graphical Models',
            url: 'https://doi.org/10.1023/A:1007665907178',
            year: 1999,
          },
          {
            title: 'Variational Inference: A Review for Statisticians',
            url: 'https://arxiv.org/abs/1601.00670',
            year: 2017,
          },
        ],
        books: [{ title: 'Probabilistic Machine Learning: An Introduction', author: 'Murphy', url: 'https://probml.github.io/pml-book/book1.html' }],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'bayesian-networks',
      name: 'Bayesian Networks',
      aliases: ['belief networks', 'directed graphical models'],
      tier: 2,
      year: 1986,
      difficulty: 3,
      hook: 'Encodes what depends on what as a directed graph, so you can read off which variables inform which.',
      intuition:
        'A joint probability distribution over many variables is, in general, a table too large to write down: ' +
        'ten binary variables need over a thousand numbers. A Bayesian network avoids that by encoding ' +
        'assumptions about which variables directly influence which. Draw a directed acyclic graph where an ' +
        'arrow from A to B means "A is a direct cause or predictor of B," and attach to every node a small ' +
        'conditional probability table giving its distribution given only its direct parents. The full joint ' +
        'distribution then factors into the product of these small local pieces, with no exponential table ' +
        'required — just one manageable piece per node. The graph structure also tells you, without any ' +
        'calculation, which variables are independent of which given others, so you immediately know what ' +
        'evidence is relevant to a query. Naive Bayes is the simplest possible Bayesian network: one class node ' +
        'with an arrow to every feature, each feature otherwise independent of the rest.',
      howItWorks: {
        summary:
          'Represent variables as nodes in a directed acyclic graph, attach a conditional probability table to ' +
          'each node given its parents, and factor the joint distribution as the product of those local conditionals.',
        steps: [
          'Draw a directed acyclic graph: one node per variable, an arrow wherever one variable directly influences another.',
          "Attach each node a conditional probability distribution over its own values given its parents' values.",
          'Read the joint distribution as the product of every node\'s conditional given its parents — no arrow means no direct dependence.',
          'Answer queries by inference: exact methods (variable elimination, belief propagation) for small or tree-like graphs, MCMC or variational inference for larger ones.',
        ],
      },
      whenToUse: [
        'The variables have a plausible causal or dependency structure worth sketching as a graph and reasoning about directly',
        'You need "what if" queries — the probability of one variable given observed values of others — not a single fixed prediction task',
        'The full joint distribution over your variables would be too large to represent directly, but most variables depend on only a handful of others',
        'Domain expert knowledge about which variable influences which should be encoded directly into the model structure',
      ],
      whenNotToUse: [
        'You do not know, and cannot learn reliably, a sensible graph structure — structure learning from data alone is NP-hard and unstable with limited data',
        'Relationships are naturally undirected or symmetric — a conditional random field fits that shape better than forcing a direction',
        'The graph is dense and highly connected, where exact inference becomes intractable and even approximate inference is expensive',
      ],
      facets: {
        task: ['inference', 'classification'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: true,
        outputType: 'joint-and-conditional-probabilities',
      },
      related: ['naive-bayes', 'hidden-markov-models', 'conditional-random-fields'],
      references: {
        free: [{ title: 'pgmpy — Python library for causal and probabilistic graphical models', url: 'https://pgmpy.org/' }],
        papers: [
          {
            title: 'Fusion, Propagation, and Structuring in Belief Networks',
            url: 'https://doi.org/10.1016/0004-3702(86)90072-X',
            year: 1986,
          },
        ],
        books: [
          {
            title: 'Probabilistic Reasoning in Intelligent Systems: Networks of Plausible Inference',
            author: 'Pearl',
          },
        ],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'hidden-markov-models',
      name: 'Hidden Markov Models',
      aliases: ['HMM'],
      tier: 1,
      year: 1970,
      difficulty: 3,
      hook: "Assumes an unseen sequence of states drives what you observe, then infers the hidden path.",
      intuition:
        'Some sequences are generated by a process you cannot observe directly. A speaker\'s vocal tract moves ' +
        'through a sequence of phonemes you never see, only the audio it produces; a stretch of DNA is silently ' +
        'either coding or non-coding as you read along it. A hidden Markov model formalizes that: a chain of ' +
        'hidden states, each depending only on the state before it, where each state in turn emits an ' +
        'observable symbol drawn from a distribution specific to that state. You see only the emissions — the ' +
        'audio, the DNA letters — never the states. Three questions become answerable once you frame the ' +
        'problem this way: how likely is this whole observed sequence under the model (evaluation), what is ' +
        'the most probable hidden state sequence that produced it (decoding, via the Viterbi algorithm), and ' +
        'how do you estimate the transition and emission probabilities from data in the first place (learning, ' +
        'via Baum-Welch — expectation-maximization specialized to this exact structure).',
      howItWorks: {
        summary:
          'Model a sequence of hidden states as a Markov chain, each state emitting an observed symbol from ' +
          'its own distribution, and use dynamic programming to evaluate, decode, or fit the model efficiently.',
        steps: [
          'Define the hidden state space, a transition matrix (state to state) and an emission distribution per state.',
          'Evaluation: compute the probability of an observed sequence by summing over all hidden paths efficiently with the forward algorithm.',
          'Decoding: find the single most probable hidden state sequence with the Viterbi algorithm — the same recursion as forward, with max in place of sum.',
          'Learning: when transition and emission probabilities are unknown, estimate them with Baum-Welch, alternating forward-backward state-occupancy computation with re-estimating the parameters from it.',
          'All three tasks reuse the same forward/backward recursions, which is why they are taught and implemented together.',
        ],
      },
      hyperparameters: [
        {
          name: 'number of hidden states',
          what: 'How many discrete states the chain can occupy.',
          tuning:
            'Not learned from a single fit; compare candidate values by held-out log-likelihood or BIC, as ' +
            'with choosing k for a Gaussian mixture.',
        },
        {
          name: 'emission distribution family',
          what: 'The distribution each state uses to generate observations — categorical for discrete symbols, Gaussian (or a GMM) for continuous ones.',
          tuning:
            "Match the family to the data: a categorical HMM for discrete symbols, a Gaussian or Gaussian-mixture HMM for continuous, multivariate observations.",
        },
      ],
      whenToUse: [
        'Data is sequential and plausibly generated by an unobserved discrete state that changes over time — speech, gestures, gene regions, machine health states',
        'You need the most likely explanation for the whole sequence (decoding), not just a per-timestep prediction',
        'The Markov assumption is reasonable: the next hidden state depends mainly on the current one, not on deep history',
        'The state space is small enough (tens of states, not thousands) that the forward/Viterbi recursions stay cheap',
      ],
      whenNotToUse: [
        'Dependencies span long ranges a first-order Markov chain cannot capture — a recurrent or attention-based sequence model handles long-range structure far better',
        'You have labelled state sequences and only need to predict labels — a conditional random field, which models the labels directly, usually does better than an HMM\'s generative independence assumptions',
        'Emissions depend on more than the current hidden state alone (e.g. also the previous observation), violating the core HMM assumption',
        'The right number of hidden states or emission family is unclear and there is too little data to compare candidates reliably',
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['timeseries', 'text'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'hidden-state-sequence',
      },
      math: {
        latex: [
          'P(X_{1:T}) = \\sum_{Z_{1:T}} \\prod_{t=1}^{T} P(Z_t \\mid Z_{t-1})\\, P(X_t \\mid Z_t)',
          'Z_{1:T}^{*} = \\arg\\max_{Z_{1:T}} \\ P(Z_{1:T}, X_{1:T}) \\quad \\text{(Viterbi decoding)}',
        ],
        notes:
          "The first line's sum ranges over every possible hidden path, exponentially many — the forward " +
          'algorithm computes it in O(states^2 · T) by reusing partial sums instead of enumerating paths, and ' +
          'Viterbi replaces that sum with a max to get the single best path instead of the total probability. ' +
          'Baum-Welch is the EM algorithm specialized to this structure: the E-step runs forward-backward to ' +
          'get state-occupancy probabilities, the M-step re-estimates transition and emission parameters from them.',
      },
      complexity: {
        train: 'O(states^2 · T) per Baum-Welch iteration, for sequence length T, repeated to convergence',
        predict: 'O(states^2 · T) for both the forward algorithm and Viterbi decoding',
      },
      code: [
        'from hmmlearn.hmm import GaussianHMM',
        '',
        'model = GaussianHMM(n_components=3, covariance_type="diag", n_iter=100)',
        'model.fit(X_train)                      # Baum-Welch; X_train is (n_samples, n_features)',
        '',
        'log_likelihood, hidden_states = model.decode(X_test)   # Viterbi',
        'print(model.transmat_)                  # fitted state-to-state transition matrix',
      ].join('\n'),
      related: ['bayesian-networks', 'mcmc', 'variational-inference', 'conditional-random-fields', 'vanilla-rnn-and-bptt'],
      references: {
        free: [{ title: 'hmmlearn — Tutorial', url: 'https://hmmlearn.readthedocs.io/en/latest/tutorial.html' }],
        papers: [
          {
            title: 'A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition',
            url: 'https://doi.org/10.1109/5.18626',
            year: 1989,
          },
          {
            title: 'A Maximization Technique Occurring in the Statistical Analysis of Probabilistic Functions of Markov Chains',
            url: 'https://doi.org/10.1214/aoms/1177697196',
            year: 1970,
          },
        ],
        books: [
          {
            title: 'Speech and Language Processing (3rd ed. draft)',
            author: 'Jurafsky & Martin',
            chapter: 'Appendix A — Hidden Markov Models',
            url: 'https://web.stanford.edu/~jurafsky/slp3/A.pdf',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'conditional-random-fields',
      name: 'Conditional Random Fields',
      aliases: ['CRF', 'linear-chain CRF'],
      tier: 2,
      year: 2001,
      difficulty: 3,
      hook: 'Labels a whole sequence at once, letting neighbouring labels vote on each other, not guess alone.',
      intuition:
        'A hidden Markov model is generative: it models how the whole sequence — hidden states and observations ' +
        'together — was produced, which forces awkward independence assumptions about the observations. A ' +
        'conditional random field flips the goal. Instead of modeling how the data was generated, it models ' +
        'directly the probability of a label sequence given the observed sequence, using an undirected graph ' +
        'over the labels where each label depends on its neighbours and on features of the observations at (and ' +
        'often around) that position. Because there is no need to generate the observations, a CRF is free to ' +
        'use rich, overlapping features — the current word, the previous word, whether it is capitalized, its ' +
        "part of speech — without specifying how any of that was generated, something an HMM's clean generative " +
        'story cannot do. Training maximizes the conditional likelihood of the true label sequence directly, ' +
        'and inference finds the most likely label sequence with the same dynamic programming HMMs use.',
      howItWorks: {
        summary:
          'Model the conditional probability of a label sequence given an observation sequence directly, as a ' +
          'normalized product of feature-based potential functions over neighbouring labels.',
        steps: [
          'Define feature functions over the observations and adjacent label pairs — word identity, capitalization, part-of-speech, previous label, and so on.',
          'Weight each feature and sum them into a score for a candidate label sequence, given the fixed observations.',
          'Normalize the exponentiated score over all possible label sequences — the partition function, computed efficiently for a linear chain via dynamic programming.',
          "Train by maximizing the conditional log-likelihood of the true label sequences, typically with L-BFGS.",
          "Decode the most probable label sequence for new observations with the Viterbi algorithm, adapted to the CRF's potentials.",
        ],
      },
      whenToUse: [
        'The task is sequence labeling (POS tagging, named entity recognition, gene annotation) where neighbouring labels should influence each other',
        'You have rich, overlapping, non-independent features of the observations to use directly, without modeling how those observations were generated',
        'You have labelled training sequences and care most about label accuracy, not a generative model of the observations',
      ],
      whenNotToUse: [
        'You need a generative model — one that can sample new sequences or handle partially observed data — where an HMM is the natural fit',
        "Labelled sequence data is very scarce; a CRF's larger, feature-rich parameter set needs more supervision than an HMM's learn-from-counts approach",
        'Sequences are extremely long and the label-dependency structure is not a simple chain, where exact inference becomes expensive',
      ],
      facets: {
        task: ['classification'],
        dataType: ['text', 'timeseries'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'label-sequence',
      },
      // logistic-regression (mercury) is the genuine cross-body link: a linear-chain CRF is often
      // described as logistic regression extended to structured, sequence-shaped output.
      related: ['hidden-markov-models', 'logistic-regression', 'bayesian-networks'],
      references: {
        free: [{ title: 'sklearn-crfsuite — Tutorial (named entity recognition)', url: 'https://sklearn-crfsuite.readthedocs.io/en/latest/tutorial.html' }],
        papers: [
          {
            title: 'Conditional Random Fields: Probabilistic Models for Segmenting and Labeling Sequence Data',
            url: 'https://dblp.org/rec/conf/icml/LaffertyMP01.html',
            year: 2001,
          },
        ],
      },
    },
    // ---------------------------------------------------------------------------------------------
    {
      id: 'latent-dirichlet-allocation',
      name: 'Latent Dirichlet Allocation',
      aliases: ['LDA (topic model)'],
      tier: 1,
      year: 2003,
      difficulty: 3,
      hook: 'Reverse-engineers a set of documents into a handful of topics, each topic a distribution over words.',
      intuition:
        'Imagine writing a document by first deciding what mix of topics it will cover — say, 70% sports, 30% ' +
        'politics — then, for every word, first picking which of those topics that word comes from according to ' +
        'that mix, then picking the actual word from whatever distribution over vocabulary that topic assigns. ' +
        'Latent Dirichlet allocation is exactly that generative story, run in reverse: given a corpus of ' +
        'documents and no labels at all, find the topics (word distributions) and the per-document topic ' +
        'mixtures that most plausibly could have generated the text you actually see. "Latent" because neither ' +
        'the topics nor the mixtures are ever observed, only the words; "Dirichlet" because that is the ' +
        'distribution used as the prior over both the topic mixtures and the topic-word distributions — the ' +
        'same conjugate-to-Multinomial prior that is the natural choice whenever you need a distribution over ' +
        'distributions.',
      howItWorks: {
        summary:
          'Assume each document is a mixture of a small number of topics and each topic is a distribution over ' +
          'words, then infer both the mixtures and the topics that best explain the observed word counts.',
        steps: [
          'Fix the number of topics K in advance.',
          'For each document, draw a distribution over the K topics from a Dirichlet prior.',
          "For each word position in a document, draw a topic from that document's topic distribution, then draw the word from that topic's distribution over the vocabulary.",
          'Given only the observed words, infer the posterior over per-document topic mixtures and per-topic word distributions — the original paper uses mean-field variational inference; collapsed Gibbs sampling (an MCMC method) is a common alternative.',
          'Read off each topic as its highest-probability words, and each document as its dominant topic(s).',
        ],
      },
      hyperparameters: [
        {
          name: 'n_components (number of topics, K)',
          what: 'How many topics the model assumes exist in the corpus.',
          tuning:
            'Not learned automatically; compare candidate values by held-out perplexity or by whether the ' +
            'resulting topics are interpretable to a human reader.',
        },
        {
          name: 'doc_topic_prior / topic_word_prior (alpha, eta)',
          what: 'Concentration of the Dirichlet priors over per-document topic mixtures and per-topic word distributions.',
          tuning:
            "scikit-learn defaults both to 1/n_components. Lower values push each document/topic toward a " +
            'sparser mixture — fewer dominant topics or words.',
        },
      ],
      whenToUse: [
        'You have a large collection of text documents and want to discover thematic structure with no labels at all',
        'You want each document expressed as a mixture of interpretable topics rather than forced into one category',
        'The corpus is large enough (typically thousands of documents) that per-topic word distributions can be estimated reliably',
        'You need a generative, probabilistic model of documents — e.g. to compute a likelihood for a new document — not just a clustering',
      ],
      whenNotToUse: [
        'Documents are short (tweets, search queries) — LDA relies on word co-occurrence within a document, and short documents give it too little signal',
        'You need topics to be reproducible and stable across reruns — the fit depends on random initialization and can shift between runs on the same corpus',
        'You want a hard, deterministic clustering or matrix factors with algebraic guarantees rather than a soft probabilistic mixture — consider NMF instead',
        'The number of topics is genuinely unknown and you cannot afford to fit and compare several values of K',
      ],
      facets: {
        task: ['clustering', 'representation', 'dimensionality-reduction'],
        dataType: ['text'],
        dataSize: ['medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'topic-distributions-and-document-mixtures',
      },
      math: {
        latex: [
          '\\theta_d \\sim \\mathrm{Dirichlet}(\\alpha), \\qquad \\phi_k \\sim \\mathrm{Dirichlet}(\\eta)',
          'z_{d,n} \\mid \\theta_d \\sim \\mathrm{Categorical}(\\theta_d), \\qquad w_{d,n} \\mid z_{d,n}, \\phi \\sim \\mathrm{Categorical}(\\phi_{z_{d,n}})',
        ],
        notes:
          "theta_d is document d's topic mixture, phi_k is topic k's word distribution, and z_{d,n} is the " +
          'latent, never-observed topic assigned to the n-th word token in document d. The two Dirichlet ' +
          'priors are the Dirichlet-Multinomial conjugate pair from bayes-theorem-and-conjugate-priors, applied ' +
          'twice — once over topic mixtures, once over word distributions — which is what makes both ' +
          'variational inference and collapsed Gibbs sampling tractable to derive for this specific model.',
      },
      complexity: {
        train: 'O(corpus size × K) per pass over the data for both variational EM and collapsed Gibbs sampling, repeated for many passes until convergence',
        predict: "O(document length × K) to infer a new document's topic mixture, holding the fitted topics fixed",
      },
      code: [
        'from sklearn.feature_extraction.text import CountVectorizer',
        'from sklearn.decomposition import LatentDirichletAllocation',
        '',
        'vectorizer = CountVectorizer(max_df=0.95, min_df=2, stop_words="english")',
        'X = vectorizer.fit_transform(docs)',
        '',
        'lda = LatentDirichletAllocation(n_components=10, doc_topic_prior=0.1, random_state=0)',
        'doc_topic_mix = lda.fit_transform(X)      # (n_docs, n_topics) mixture per document',
        '',
        'vocab = vectorizer.get_feature_names_out()',
        'top_words = vocab[lda.components_[0].argsort()[-10:]]   # top words for topic 0',
      ].join('\n'),
      // nmf (saturn) is the other widely-used "discover latent topics/parts" method for the same
      // kind of data, contrasted by algebraic (NMF) versus generative-probabilistic (LDA) framing.
      related: ['variational-inference', 'mcmc', 'nmf'],
      references: {
        free: [{ title: 'scikit-learn user guide — Latent Dirichlet Allocation', url: 'https://scikit-learn.org/stable/modules/decomposition.html#latentdirichletallocation' }],
        papers: [
          {
            title: 'Latent Dirichlet Allocation',
            url: 'https://jmlr.org/papers/v3/blei03a.html',
            year: 2003,
          },
        ],
        books: [{ title: 'Probabilistic Machine Learning: An Introduction', author: 'Murphy', url: 'https://probml.github.io/pml-book/book1.html' }],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
  ],
} satisfies Body;
