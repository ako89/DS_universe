/**
 * Chronos — Time Series & Forecasting. See PLAN.md §3 for the full moon list.
 *
 * Complete: all 8 moons from PLAN.md §3 are written here at their marked tiers — 4 Tier 1
 * (arima-and-sarima, exponential-smoothing-and-holt-winters, kalman-filters-and-state-space-models,
 * dynamic-time-warping-and-changepoint-detection) and 4 Tier 2 stubs (stl-decomposition, prophet,
 * vector-autoregression, garch).
 *
 * `eraRange` spans 1957 (Holt's ONR memorandum introducing exponential smoothing with a trend
 * term — reprinted 2004, International Journal of Forecasting) to 2017 (Prophet open-sourced by
 * Facebook; its peer-reviewed paper followed in 2018 in The American Statistician).
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * `otexts.com/fpp3` (Hyndman & Athanasopoulos, vetted in CONTENT_GUIDE §5) was used heavily, as
 * suggested, and directly settled several nuances the task flagged as easy to get wrong:
 *   - ARIMA/SARIMA: fpp3's own ARIMA chapter does not attribute a single invention date to
 *     Box & Jenkins; the entry instead cites Yule (1927) as the real origin of the AR component
 *     (verified via Crossref DOI 10.1098/rsta.1927.0007) and Box & Jenkins (1970) as the book that
 *     fused AR+I+MA(+S) into one estimable methodology — not one clean "invented in 1970" claim.
 *   - GARCH: kept strictly to modeling conditional variance, not the series level, per the `arch`
 *     package's own documentation (mean model + volatility model as separate, combinable pieces),
 *     and Engle (1982, ARCH) and Bollerslev (1986, GARCH) are cited as two separate, separately
 *     verified Crossref DOIs rather than conflated into one contribution.
 *   - Kalman filters: framed as recursive Bayesian state estimation under linear-Gaussian
 *     assumptions specifically (statsmodels' state-space docs, Murphy's PML book), with `related`
 *     pointing at Neptune's mcmc/variational-inference/bayesian-linear-logistic-regression as the
 *     general-purpose inference machinery this is the closed-form special case of.
 *   - Dynamic time warping & changepoint detection: kept honest as two distinct problems under one
 *     id per PLAN.md's bundling — DTW is framed throughout as an elastic *distance/alignment*
 *     measure (facets.task is clustering/anomaly-detection, never forecasting; tslearn's own docs
 *     were used to confirm DTW is not even a true metric, since it fails the triangle inequality),
 *     and changepoint detection's literature is described as genuinely diffuse rather than
 *     attributed to one origin paper — Truong, Oudre & Vayatis (2020) call their own paper a
 *     "selective review" of a field with many independent contributions, which is exactly the
 *     honest framing the task asked for instead of picking one paper to stand in for a subfield.
 *   - Prophet: fpp3's Prophet chapter was used specifically to source the claim that Prophet
 *     "rarely gives better forecast accuracy than the alternative approaches" in Hyndman &
 *     Athanasopoulos's own comparisons against ARIMA/ETS — deliberately not the accuracy framing
 *     on Prophet's own marketing docs, which claim the opposite. The paper's actual stated design
 *     goal (fast, automated, analyst-adjustable business forecasting, not maximal accuracy) is
 *     what the entry leads with.
 *
 * One PDF fetch was caught and discarded rather than trusted: `WebFetch` on
 * lethalletham.com/ForecastingAtScale.pdf (the Prophet paper's author-hosted PDF) returned a
 * connection error rather than content; no claim was sourced from it. A second PDF — UMN's
 * Introduction to Data Mining chapter 2 slides, being checked for a Dynamic Time Warping mention —
 * came back explicitly as "I cannot extract real text from this PDF... raw PDF binary/encoded
 * data," an honest failure rather than an invented quote, so that source was dropped; the
 * `dynamic-time-warping-and-changepoint-detection` book reference cites Aggarwal's *Data Mining:
 * The Textbook* instead, corroborated by independent search-index snippets (KDnuggets review,
 * dokumen.pub TOC) rather than a directly opened primary page, consistent with the "search-
 * corroborated metadata" fallback CONTENT_GUIDE §3 and the Jupiter batch report both use for a
 * PDF that won't yield text.
 *
 * Deliberate cross-body links, verified rather than assumed: linear-regression (Mercury) →
 * arima-and-sarima and vector-autoregression, because autoregression and VAR's per-equation
 * structure literally are least-squares linear regression on lagged values (statsmodels' VAR
 * docs give the exact y_t = A_1 y_{t-1} + ... + A_p y_{t-p} + u_t form). distance-metrics (Venus)
 * → dynamic-time-warping-and-changepoint-detection, since DTW is an elastic variant of exactly
 * that distance-measure catalogue. loess (Venus) → stl-decomposition, since STL's name is
 * literally "seasonal-trend decomposition using loess" and the smoother it repeatedly applies is
 * that same loess entry. cross-validation (Belt) → prophet, because Prophet ships its own
 * rolling-origin `cross_validation` utility (confirmed via facebook.github.io/prophet's
 * diagnostics docs) specifically because naive k-fold assumes exchangeable data, which is the
 * wrong assumption for a time series — this is called out explicitly rather than implied.
 * maximum-likelihood-and-map (Sol, this batch) → garch, since GARCH parameters are fit by exactly
 * that MLE machinery. bayesian-linear-logistic-regression / mcmc / variational-inference
 * (Neptune, this batch) → kalman-filters-and-state-space-models, as described above.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'chronos',
  name: 'Chronos',
  segment: 'Time Series & Forecasting',
  hook: "Models built for data ordered in time — trend, seasonality, memory, and where a series's behaviour changes.",
  summary:
    'Chronos gathers the methods built specifically for sequential data — forecasting a series from its own past, decomposing ' +
    "trend and seasonality, tracking a hidden state through noisy measurements, and comparing or segmenting sequences by " +
    'shape rather than predicting their future at all.',
  eraRange: [1957, 2017],
  moons: [
    {
      id: 'arima-and-sarima',
      name: 'ARIMA / SARIMA',
      aliases: ['autoregressive integrated moving average', 'Box-Jenkins method', 'seasonal ARIMA'],
      tier: 1,
      year: 1970,
      difficulty: 3,
      hook: "Forecasts a series from its own lagged values and lagged forecast errors, after differencing it stationary.",
      intuition:
        'Three separate ideas are stacked into one model. Autoregression (AR) says the next value is a weighted sum of ' +
        'recent past values — momentum, roughly. Moving average (MA) says the next value is a weighted sum of recent ' +
        "forecast errors, a correction term that admits the last few predictions were off and adjusts. Integration (I) " +
        "handles a series that trends or drifts: instead of modeling the level directly, difference it (subtract each " +
        "value from the one before) until what's left looks stationary, then fit AR and MA to that. Seasonal ARIMA " +
        'repeats the whole recipe at the seasonal lag — an extra AR, MA and differencing term operating on values one ' +
        "full cycle apart, so a monthly series gets a seasonal component built from values 12 months back. Neither AR " +
        "nor MA is new by itself — autoregression dates to Yule's 1927 sunspot paper. What Box and Jenkins contributed " +
        'in 1970 was a complete, repeatable methodology for choosing p, d and q from the data instead of guessing.',
      howItWorks: {
        summary:
          'Difference the series until stationary, identify AR and MA orders from its autocorrelation structure, fit by ' +
          'maximum likelihood, then check the residuals are left as white noise.',
        steps: [
          'Test the series for stationarity (e.g. an augmented Dickey-Fuller test) and difference it d times, and D times at the seasonal lag, until trends and seasonal drift are removed.',
          'Inspect the ACF and PACF of the differenced series to propose candidate orders p and q (and seasonal P and Q).',
          'Estimate the AR and MA coefficients by maximum likelihood.',
          'Check the residuals for leftover autocorrelation (e.g. the Ljung-Box test) — a well-fit model leaves white noise.',
          'Compare candidate models by AICc and pick the smallest, refitting if diagnostics fail.',
          "Forecast forward by recursively applying the fitted AR and MA equations, undoing the differencing to return to the original scale.",
        ],
      },
      hyperparameters: [
        {
          name: 'order (p, d, q)',
          what: 'Non-seasonal AR order, differencing order, and MA order.',
          tuning:
            'd is set by how many differences are needed for stationarity (rarely more than 2); p and q are read off ' +
            "where the ACF/PACF cut off or decay, or chosen by minimizing AICc over a small grid — tools built on top " +
            "of this (e.g. pmdarima's auto_arima) automate that search.",
        },
        {
          name: 'seasonal_order (P, D, Q, m)',
          what: 'Seasonal AR order, seasonal differencing, seasonal MA order, and the seasonal period m.',
          tuning:
            "m is fixed by the data's known cycle (12 for monthly, 4 for quarterly); P, D and Q are chosen the same " +
            'way as their non-seasonal counterparts, but by inspecting the ACF/PACF at multiples of m.',
        },
      ],
      whenToUse: [
        "The series is univariate and its own past values and errors are informative — no other predictor series is required or available",
        'The series can be made stationary by a small number of differences (typically d, D <= 2), not by a structural break',
        'You need calibrated prediction intervals from a well-understood likelihood-based model, not just a point forecast',
        'The historical pattern of trend, seasonality and autocorrelation is expected to continue, not shift into a regime the series has not shown before',
      ],
      whenNotToUse: [
        'You have several related series and want their cross-dependencies modeled jointly — use VAR instead',
        'The series has strong, evolving seasonality a fixed seasonal order does not capture, or more than one seasonal period at once — consider STL first, or Prophet',
        'You need a fast, automatic baseline over thousands of series — the order-selection search is comparatively slow per series',
        "Volatility, not the level, is what you need to forecast — ARIMA models the mean; pair it with a GARCH model for the variance",
      ],
      facets: {
        task: ['forecasting'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'point-forecast-with-intervals',
      },
      math: {
        latex: [
          '(1-\\phi_1 B - \\cdots - \\phi_p B^p)(1-B)^d y_t = c + (1+\\theta_1 B + \\cdots + \\theta_q B^q)\\varepsilon_t',
          'B^k y_t = y_{t-k} \\quad \\text{(the backshift operator)}',
        ],
        notes:
          'Writing the model with the backshift operator B folds AR, differencing and MA into one expression: the ' +
          'left side is the AR polynomial applied to the d-times-differenced series, the right side is the MA ' +
          'polynomial applied to white noise; seasonal ARIMA multiplies in a second pair of polynomials in $B^m$. ' +
          "Each piece predates Box and Jenkins — Yule used an AR term in 1927, and Wold's 1938 decomposition theorem " +
          'showed any stationary process has an MA representation. Their contribution was fusing both into one ' +
          'estimable model with a repeatable procedure for choosing its orders from data.',
      },
      complexity: {
        train:
          "Maximum-likelihood fitting is iterative; each likelihood evaluation costs O(n) via the state-space/" +
          "innovations recursion, repeated over the optimizer's iterations",
        predict: 'O(h) to generate an h-step forecast recursively',
      },
      code: [
        'import statsmodels.api as sm',
        '',
        'model = sm.tsa.arima.ARIMA(',
        '    y_train,',
        '    order=(1, 1, 1),                 # p, d, q',
        '    seasonal_order=(1, 1, 1, 12),     # P, D, Q, m (m=12 for monthly data)',
        ')',
        'res = model.fit()',
        'print(res.summary())                  # coefficients, AIC, Ljung-Box test',
        '',
        'forecast = res.get_forecast(steps=12)',
        'mean, ci = forecast.predicted_mean, forecast.conf_int()',
      ].join('\n'),
      // linear-regression cross-body link (Mercury): autoregression IS linear regression on
      // lagged values of the series itself.
      related: ['linear-regression', 'exponential-smoothing-and-holt-winters', 'vector-autoregression'],
      references: {
        free: [
          { title: 'Forecasting: Principles and Practice — ARIMA models', url: 'https://otexts.com/fpp3/arima.html' },
          { title: 'statsmodels — ARIMA', url: 'https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html' },
        ],
        papers: [
          {
            title: "On a Method of Investigating Periodicities in Disturbed Series, with Special Reference to Wolfer's Sunspot Numbers",
            url: 'https://doi.org/10.1098/rsta.1927.0007',
            year: 1927,
          },
        ],
        books: [
          {
            title: 'Time Series Analysis: Forecasting and Control',
            author: 'Box, Jenkins, Reinsel & Ljung',
            chapter: 'the original Box-Jenkins model identification, estimation and diagnostic-checking methodology',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'exponential-smoothing-and-holt-winters',
      name: 'Exponential smoothing & Holt-Winters',
      aliases: ['ETS', 'Holt-Winters seasonal method', "Holt's linear trend method"],
      tier: 1,
      year: 1957,
      difficulty: 2,
      hook: 'Forecasts as a weighted average of the past that decays exponentially, extended to track trend and season.',
      intuition:
        'Simple exponential smoothing forecasts tomorrow as a running average of everything seen so far, but one that ' +
        "trusts recent points more: each new observation updates the estimate with weight alpha, and every older " +
        "observation's influence decays by a further factor of (1 minus alpha) with every step back in time — hence " +
        '"exponential." That alone cannot track a trending series, so Holt added a second running average for the ' +
        'slope, updated the same way, and forecasts by projecting the current level forward along the current trend. ' +
        'Winters then added a third: one running average per season that gets updated once per cycle and adds onto ' +
        'or multiplies the trended forecast. Level, trend and season are all just smoothed exponential averages ' +
        'chasing a moving target, with one smoothing weight per component controlling how fast it forgets the past.',
      howItWorks: {
        summary:
          'Maintain one smoothed estimate for the level, and update it (optionally alongside smoothed trend and ' +
          'seasonal estimates) as a weighted blend of the newest observation and the previous forecast, each weight ' +
          'controlled by its own smoothing parameter.',
        steps: [
          'Initialize the level (and trend, and one seasonal index per period, if used) from the first few observations.',
          'At each new observation, update the level as alpha times the (seasonally adjusted) observation plus (1-alpha) times the previous level-plus-trend forecast.',
          'If modeling trend, update it as beta* times the change in level plus (1-beta*) times the previous trend estimate.',
          'If modeling seasonality, update the relevant seasonal index as gamma times the current deviation from level plus (1-gamma) times its own previous value.',
          'Forecast h steps ahead by extending the level and trend linearly and reapplying the appropriate seasonal index.',
        ],
      },
      hyperparameters: [
        {
          name: 'smoothing parameters (alpha, beta*, gamma)',
          what: 'Weights in [0,1] controlling how fast the level, trend and seasonal estimates forget older data.',
          tuning:
            'Typically estimated by maximizing the likelihood (equivalently, minimizing the sum of squared one-step ' +
            'errors) rather than set by hand; values near 1 track recent changes closely, values near 0 smooth heavily.',
        },
        {
          name: 'trend/seasonal form and damping',
          what: 'Whether trend and seasonality enter additively or multiplicatively, and whether the trend is damped.',
          tuning:
            'Use multiplicative seasonality when the size of seasonal swings grows with the level of the series; ' +
            'damp the trend (a damping parameter phi, typically 0.8-0.98) when long-horizon forecasts should flatten ' +
            'rather than extrapolate a trend indefinitely.',
        },
      ],
      whenToUse: [
        'You need a fast, robust univariate baseline that already extrapolates trend and seasonality with almost no tuning',
        'You are forecasting many series automatically (e.g. per-SKU retail demand) where a per-series ARIMA order search is too slow',
        'The series has a single, stable seasonal period and no other predictor variables to bring in',
        'You want a model whose forecasts and updates are easy to explain as a moving weighted average, not a black box',
      ],
      whenNotToUse: [
        'The series has autocorrelation structure beyond trend+season+noise — ARIMA fits that structure explicitly, Holt-Winters cannot',
        'There are multiple seasonal periods at once, e.g. daily data with both weekly and yearly cycles — plain Holt-Winters only tracks one period m',
        'You need external regressors (price, promotions, weather) driving the forecast — Holt-Winters has no mechanism for exogenous inputs',
        'The series shows structural breaks the exponential-decay weighting cannot adapt to quickly enough',
      ],
      facets: {
        task: ['forecasting'],
        dataType: ['timeseries'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'point-forecast-with-intervals',
      },
      math: {
        latex: [
          '\\ell_t = \\alpha y_t + (1-\\alpha)(\\ell_{t-1} + b_{t-1})',
          'b_t = \\beta^*(\\ell_t - \\ell_{t-1}) + (1-\\beta^*) b_{t-1}',
          's_t = \\gamma (y_t - \\ell_t) + (1-\\gamma) s_{t-m}',
        ],
        notes:
          'These are the additive-trend, additive-seasonal Holt-Winters update equations for level, trend and ' +
          'season; the h-step forecast extends the level by h times the trend and reapplies the matching seasonal ' +
          'index. Every exponential smoothing method, including plain SES, is a special case of a linear Gaussian ' +
          "state space model, which is what lets statsmodels fit them by maximum likelihood and produce prediction " +
          'intervals rather than just point forecasts.',
      },
      complexity: {
        train: 'O(n) — one pass over the data per likelihood evaluation, repeated over a small optimization for alpha/beta*/gamma',
        predict: 'O(h) to extend the level and trend linearly and reapply seasonal indices',
      },
      code: [
        'from statsmodels.tsa.holtwinters import ExponentialSmoothing',
        '',
        'model = ExponentialSmoothing(',
        '    y_train,',
        '    trend="add",',
        '    damped_trend=True,',
        '    seasonal="mul",',
        '    seasonal_periods=12,',
        ').fit()',
        '',
        'forecast = model.forecast(12)',
        'print(model.params)            # fitted alpha, beta*, gamma, phi',
      ].join('\n'),
      // kalman-filters-and-state-space-models cross-link: statsmodels implements ETS as a linear
      // Gaussian state-space model, fit via the same Kalman-filter recursion as SARIMAX.
      related: ['arima-and-sarima', 'stl-decomposition', 'kalman-filters-and-state-space-models'],
      references: {
        free: [
          { title: 'Forecasting: Principles and Practice — Exponential smoothing', url: 'https://otexts.com/fpp3/expsmooth.html' },
          { title: 'statsmodels — ExponentialSmoothing', url: 'https://www.statsmodels.org/stable/generated/statsmodels.tsa.holtwinters.ExponentialSmoothing.html' },
        ],
        papers: [
          {
            title: 'Forecasting Seasonals and Trends by Exponentially Weighted Moving Averages (reprint of the 1957 ONR memorandum)',
            url: 'https://doi.org/10.1016/j.ijforecast.2003.09.015',
            year: 2004,
          },
          {
            title: 'Forecasting Sales by Exponentially Weighted Moving Averages',
            url: 'https://doi.org/10.1287/mnsc.6.3.324',
            year: 1960,
          },
        ],
        books: [
          {
            title: 'Forecasting: Principles and Practice',
            author: 'Hyndman & Athanasopoulos',
            chapter: 'Ch. 8 — Exponential smoothing',
            url: 'https://otexts.com/fpp3/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'stl-decomposition',
      name: 'STL decomposition',
      aliases: ['Seasonal-Trend decomposition using Loess'],
      tier: 2,
      year: 1990,
      difficulty: 2,
      hook: "Splits a series into trend, season and remainder with local regression — robust to outliers, any season length.",
      intuition:
        'Classical and X-11/SEATS decomposition assume a fixed, unchanging seasonal pattern and struggle outside ' +
        'monthly or quarterly data. STL replaces that machinery with loess — locally weighted linear regression — ' +
        'applied repeatedly. An inner loop alternates between estimating the seasonal component, by smoothing each ' +
        'point against the same point in neighbouring cycles, and the trend component, by smoothing the ' +
        'deseasonalized series, refining both a few times until they stabilize. An outer loop then downweights ' +
        'points with unusually large remainders, so a handful of outliers cannot drag the trend or seasonal ' +
        'estimate around, and reruns the inner loop with those weights applied. The result is three additive ' +
        'pieces — trend, seasonal, remainder — and unlike classical decomposition, the seasonal shape is allowed ' +
        "to drift slowly over time instead of being locked to one repeating pattern, with how fast it's allowed to " +
        'drift set directly by a parameter.',
      howItWorks: {
        summary:
          'Alternate loess smoothing of the seasonal and trend components (inner loop) with outlier-robust ' +
          'reweighting of both (outer loop) until the decomposition stabilizes.',
        steps: [
          'Detrend the series and smooth each detrended cycle-subseries (e.g. all Januaries) with loess to estimate a slowly-evolving seasonal component.',
          'Subtract that seasonal estimate and smooth the remainder with loess to estimate the trend.',
          "Repeat the seasonal/trend smoothing (inner loop) until both stabilize, then compute robustness weights from the size of the remainder and rerun with outliers downweighted (outer loop).",
        ],
      },
      whenToUse: [
        "You want to inspect or remove seasonality and trend from a series whose seasonal pattern is not perfectly fixed, e.g. it strengthens or drifts slowly over years",
        "The series has outliers or one-off shocks you don't want distorting the estimated trend or seasonal component",
      ],
      whenNotToUse: [
        'The series has multiple, non-nested seasonal periods you need decomposed at once (e.g. daily data with both weekly and yearly cycles) — plain STL takes only one period at a time',
        'You need a multiplicative decomposition directly — STL is additive only; multiplicative seasonality requires log-transforming the series first',
      ],
      facets: {
        task: ['forecasting'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'trend-seasonal-remainder-decomposition',
      },
      // loess cross-body link (Venus): STL's name is literally "seasonal-trend decomposition
      // using loess" — the smoother it repeatedly applies is that same loess entry.
      related: ['loess', 'exponential-smoothing-and-holt-winters'],
      references: {
        free: [
          { title: 'Forecasting: Principles and Practice — STL decomposition', url: 'https://otexts.com/fpp3/stl.html' },
          { title: 'statsmodels — STL', url: 'https://www.statsmodels.org/stable/generated/statsmodels.tsa.seasonal.STL.html' },
        ],
        books: [
          {
            title: 'STL: A Seasonal-Trend Decomposition Procedure Based on Loess (Journal of Official Statistics 6(1), 1990, pp. 3-33)',
            author: 'Cleveland, R.B., Cleveland, W.S., McRae, J.E. & Terpenning, I.J.',
          },
        ],
      },
    },
    {
      id: 'kalman-filters-and-state-space-models',
      name: 'Kalman filters & state space models',
      aliases: ['Kalman filtering', 'linear-Gaussian state space model', 'recursive Bayesian filtering'],
      tier: 1,
      year: 1960,
      difficulty: 4,
      hook: 'Tracks a hidden state through noisy observations by alternating a predict step and a correct-with-evidence step.',
      intuition:
        'A state space model splits a system into two layers: a hidden state that evolves on its own (a true ' +
        "position and velocity, an economy's true trend) and noisy observations that only partially reveal it (a " +
        'radar ping, a noisy survey). The Kalman filter is the exact solution for estimating that hidden state when ' +
        'both layers are linear and every noise term is Gaussian. It alternates two steps: predict, where it ' +
        'advances the previous state estimate forward using the known dynamics and inflates its uncertainty by the ' +
        'process noise; and update, where a new observation arrives and the estimate is pulled toward it by an ' +
        'amount, the Kalman gain, that depends on how much to trust the observation versus the prediction. Where a ' +
        'sensor is noisy, updates barely move the estimate; where the model itself is uncertain, an observation ' +
        'moves it a lot. This is the provably optimal filter for the linear-Gaussian case.',
      howItWorks: {
        summary:
          'Alternate a predict step, which propagates the state estimate and its uncertainty forward via the ' +
          "system's dynamics, with an update step, which corrects that prediction toward a new observation weighted " +
          'by the relative uncertainty of model versus measurement.',
        steps: [
          'Write the system as a state equation (how the hidden state evolves) and an observation equation (how noisy measurements relate to that state).',
          'Predict: propagate the previous state estimate forward through the state equation, and grow its covariance by the process noise.',
          "Compute the Kalman gain: the weight given to the new observation, set by comparing the predicted uncertainty to the observation noise.",
          'Update: blend the predicted state with the new observation, weighted by the Kalman gain, to get the corrected estimate and a shrunk covariance.',
          "Repeat predict and update as each new observation arrives; the byproduct log-likelihood lets the same recursion fit unknown model parameters by maximum likelihood.",
        ],
      },
      hyperparameters: [
        {
          name: 'process noise covariance Q',
          what: 'How much the hidden state is assumed to drift on its own between steps, beyond what the dynamics predict.',
          tuning:
            'A larger Q makes the filter trust new observations more and adapt faster to real change, at the cost ' +
            'of noisier estimates; too small a Q makes the filter slow to react to genuine shifts.',
        },
        {
          name: 'measurement noise covariance R',
          what: 'How noisy the observations are assumed to be.',
          tuning: "Set from known sensor precision where available; otherwise estimated jointly with Q by maximizing the filter's own likelihood.",
        },
      ],
      whenToUse: [
        'The system genuinely has a hidden state evolving over time that noisy measurements only partially reveal — tracking, navigation, or a signal buried in noise',
        'The dynamics and observation model are linear, or close enough after a chosen approximation, and noise is reasonably Gaussian',
        'You need estimates updated online, one observation at a time, rather than refitting on the whole history at every step',
        'You want exponential smoothing, ARIMA or another linear time series model expressed and fit in one unified state-space framework, e.g. to handle missing observations naturally',
      ],
      whenNotToUse: [
        'The dynamics or observation model are strongly nonlinear and non-Gaussian in a way no local linearization captures — use MCMC or variational inference instead',
        "Noise is heavy-tailed or multimodal — the Kalman filter's Gaussian assumption underweights outliers and can be badly misled by them",
        'You only need a one-off batch fit with no sequential/online updating requirement — a directly optimized regression or ARIMA fit may be simpler',
        'State dimension is very large and the O(state_dim^3) cost of the covariance update per step is prohibitive without a reduced-rank or ensemble approximation',
      ],
      facets: {
        task: ['forecasting', 'inference'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: false,
        outputType: 'filtered-state-estimate-with-uncertainty',
      },
      math: {
        latex: [
          'x_t = F_t x_{t-1} + w_t, \\quad w_t \\sim \\mathcal{N}(0, Q_t) \\qquad \\text{(state equation)}',
          'z_t = H_t x_t + v_t, \\quad v_t \\sim \\mathcal{N}(0, R_t) \\qquad \\text{(observation equation)}',
          'K_t = P_t^- H_t^\\top (H_t P_t^- H_t^\\top + R_t)^{-1} \\qquad \\text{(Kalman gain)}',
        ],
        notes:
          'The Kalman gain K_t is exactly the ratio the intuition describes: it weighs the predicted covariance ' +
          'P_t^- against the observation noise R_t to decide how far the update moves the estimate. Because every ' +
          "step's posterior is Gaussian and computed in closed form, the whole recursion is a special, exact case " +
          'of recursive Bayesian filtering — the same predict/update structure that particle filters and ' +
          'MCMC/variational state-space methods only approximate for models where linear-Gaussian assumptions do not hold.',
      },
      complexity: {
        train:
          "O(state_dim^3) per time step, dominated by the covariance update and the Kalman gain's matrix inverse; " +
          'O(n * state_dim^3) to filter a length-n series',
        predict: 'O(state_dim^3) per predicted step ahead (or O(state_dim^2) if only propagating the mean without a fresh covariance inversion)',
      },
      code: [
        'from filterpy.kalman import KalmanFilter',
        'from filterpy.common import Q_discrete_white_noise',
        'import numpy as np',
        '',
        'f = KalmanFilter(dim_x=2, dim_z=1)       # state: [position, velocity]; observe position only',
        'f.x = np.array([0., 0.])',
        'f.F = np.array([[1., 1.], [0., 1.]])     # constant-velocity dynamics',
        'f.H = np.array([[1., 0.]])               # observation picks out position',
        'f.P *= 10.',
        'f.R = 5.                                  # measurement noise',
        'f.Q = Q_discrete_white_noise(dim=2, dt=1., var=0.1)',
        '',
        'for z in observations:',
        '    f.predict()',
        '    f.update(z)',
        '    print(f.x)                            # filtered [position, velocity] estimate',
      ].join('\n'),
      // bayesian-linear-logistic-regression / mcmc / variational-inference cross-body link
      // (Neptune, same batch): Kalman filtering is recursive Bayesian inference for the
      // linear-Gaussian special case; those Neptune entries are the general-purpose inference
      // machinery this is a closed-form shortcut for.
      related: ['bayesian-linear-logistic-regression', 'mcmc', 'variational-inference', 'arima-and-sarima'],
      references: {
        free: [
          { title: 'statsmodels — State space models', url: 'https://www.statsmodels.org/stable/statespace.html' },
          { title: 'Kalman and Bayesian Filters in Python', url: 'https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python' },
        ],
        papers: [
          {
            title: 'A New Approach to Linear Filtering and Prediction Problems',
            url: 'https://doi.org/10.1115/1.3662552',
            year: 1960,
          },
        ],
        books: [
          {
            title: 'Probabilistic Machine Learning: Advanced Topics',
            author: 'Murphy',
            chapter: 'Ch. 29 — State-Space Models',
            url: 'https://probml.github.io/pml-book/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'prophet',
      name: 'Prophet',
      tier: 2,
      year: 2017,
      difficulty: 3,
      hook: 'An automated additive model of trend, seasonality and holidays, built for fast business forecasting.',
      intuition:
        'Prophet decomposes a series into pieces an analyst would recognize: a trend, made of straight-line ' +
        'segments joined at automatically detected changepoints; one or more seasonal patterns, represented as a ' +
        'sum of sine and cosine terms (a Fourier series) rather than fixed per-period indices; and holiday or ' +
        'one-off event effects, added as extra terms on their known dates. All three are summed and fit together ' +
        'by Bayesian curve fitting in Stan. The design goal was not the highest possible accuracy on any one ' +
        'series, but a model a non-specialist analyst could fit automatically on thousands of business time ' +
        'series, then adjust by hand through interpretable knobs — trend flexibility, which holidays matter, how ' +
        'strong the seasonality is — instead of picking ARIMA orders. It works best on series with strong ' +
        'seasonality and several full seasonal cycles of history; on series without that structure it does not ' +
        'reliably beat a well-fit ARIMA or ETS model.',
      howItWorks: {
        summary:
          'Fit an additive model of a piecewise-linear (or logistic) trend, Fourier-series seasonal terms, and ' +
          'holiday indicators, estimated together by Bayesian curve fitting.',
        steps: [
          'Specify the trend as piecewise-linear, or logistic growth toward a saturating capacity, with changepoints placed automatically or by hand.',
          'Represent each seasonal pattern (weekly, yearly, ...) as a truncated Fourier series rather than one parameter per period.',
          'Add indicator terms for known holidays or one-off events on their specific dates.',
          'Fit trend, seasonality and holiday terms jointly via MAP estimation (or full Bayesian sampling) in Stan, and sum them for the final forecast.',
        ],
      },
      whenToUse: [
        'The series has strong, possibly multiple seasonalities (daily, weekly, yearly) and several full seasonal cycles of history, e.g. a daily business metric',
        'You need many series fit automatically with minimal manual order-selection, but want interpretable knobs an analyst can adjust (changepoints, holidays) when the automatic fit misses something',
      ],
      whenNotToUse: [
        "You need the most accurate forecast available for a single, carefully studied series — independent comparisons (e.g. Hyndman & Athanasopoulos's own fpp3 examples) find Prophet often does not beat a well-fit ARIMA or ETS model",
        'The series has short history, weak or no seasonality, or autocorrelation structure a trend+season+holiday decomposition does not capture — a residual-fitting model like ARIMA is a better match',
      ],
      facets: {
        task: ['forecasting'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: true,
        handlesCategorical: false,
        outputType: 'point-forecast-with-intervals',
      },
      // cross-validation cross-body link (Belt, batch 2): Prophet ships its own rolling-origin
      // cross_validation utility precisely because naive k-fold CV assumes exchangeable data,
      // which is the wrong assumption for a time series — see cross-validation's own
      // whenNotToUse rather than treating this as a plain reuse of standard CV.
      related: ['arima-and-sarima', 'exponential-smoothing-and-holt-winters', 'cross-validation'],
      references: {
        free: [
          { title: 'Forecasting: Principles and Practice — The Prophet model', url: 'https://otexts.com/fpp3/prophet.html' },
          { title: 'Prophet documentation — Quick start', url: 'https://facebook.github.io/prophet/docs/quick_start.html' },
        ],
        papers: [{ title: 'Forecasting at Scale', url: 'https://doi.org/10.1080/00031305.2017.1380080', year: 2018 }],
      },
    },
    {
      id: 'vector-autoregression',
      name: 'Vector Autoregression (VAR)',
      aliases: ['VAR'],
      tier: 2,
      year: 1980,
      difficulty: 3,
      hook: "Models several series together, letting each variable's future depend on every variable's past, not just its own.",
      intuition:
        "Univariate models like ARIMA assume a forecast variable is explained only by its own history, or by other " +
        'variables that are themselves untouched by it — a one-way street. Many real systems are not like that: ' +
        'GDP growth affects interest rates and interest rates affect GDP growth, simultaneously. Vector ' +
        'autoregression treats every variable in the system symmetrically. It writes one equation per variable, ' +
        'and every equation regresses that variable on lagged values of itself and lagged values of every other ' +
        'variable in the system — nothing is assumed exogenous. Sims proposed VAR as an alternative to the large, ' +
        'heavily-restricted structural macroeconomic models of the 1970s, arguing their identifying assumptions ' +
        'were not credible; a VAR needs far fewer assumptions, at the cost of being harder to interpret causally ' +
        "without extra structure. Once fit, a VAR forecasts every series at once, tests whether one variable's " +
        "past helps predict another (Granger causality), and traces how a shock ripples through the rest.",
      howItWorks: {
        summary: 'Regress each variable in the system on lagged values of itself and every other variable, estimated equation-by-equation by least squares.',
        steps: [
          'Choose a lag order p, often via an information criterion (AIC/BIC) over a grid of candidate lags.',
          'Difference any non-stationary series first, or fit the VAR in levels if the system is cointegrated and that structure matters.',
          "Estimate each variable's equation — its own lags plus every other variable's lags, up to order p — by ordinary least squares.",
          'Use the fitted system to forecast all variables jointly, test Granger causality between pairs, or compute impulse responses to a shock.',
        ],
      },
      whenToUse: [
        'You have several time series that plausibly influence each other and want them forecast jointly rather than one at a time',
        'You want to test or quantify lead-lag relationships between series (Granger causality) or trace how a shock propagates (impulse response)',
      ],
      whenNotToUse: [
        'You only have one series, or the other series genuinely do not feed back on it — a univariate ARIMA is simpler and needs far fewer parameters',
        "You have many variables relative to your sample size — a VAR's parameter count grows with the square of the number of variables times the lag order, and overfits fast",
      ],
      facets: {
        task: ['forecasting'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'multivariate-point-forecast',
      },
      // linear-regression cross-body link (Mercury): each VAR equation is literally OLS linear
      // regression of one variable on lagged values of the whole system.
      related: ['linear-regression', 'arima-and-sarima'],
      references: {
        free: [
          { title: 'Forecasting: Principles and Practice — Vector autoregressions', url: 'https://otexts.com/fpp3/VAR.html' },
          { title: 'statsmodels — VAR', url: 'https://www.statsmodels.org/stable/generated/statsmodels.tsa.vector_ar.var_model.VAR.html' },
        ],
        papers: [{ title: 'Macroeconomics and Reality', url: 'https://doi.org/10.2307/1912017', year: 1980 }],
      },
    },
    {
      id: 'garch',
      name: 'GARCH',
      aliases: ['generalized autoregressive conditional heteroskedasticity'],
      tier: 2,
      year: 1986,
      difficulty: 3,
      hook: "Models how a series' volatility clusters and evolves over time — not the series' level itself.",
      intuition:
        "Financial returns are famously hard to forecast in level — tomorrow's price change is close to " +
        'unpredictable — but their volatility is not: calm and turbulent periods cluster together, a fact ARIMA ' +
        'has no way to represent, since ARIMA models the conditional mean, not the conditional variance. ' +
        "Engle's ARCH model was the first to treat variance itself as autoregressive: today's variance is a " +
        'weighted function of recent squared surprises, so a large shock leaves the model expecting a ' +
        "larger-than-usual shock tomorrow too, and volatility clustering emerges naturally. Bollerslev's GARCH " +
        "generalized this by also feeding yesterday's variance estimate back into today's, the way an ARMA model " +
        'feeds back both past errors and past values, capturing the same clustering with far fewer parameters. In ' +
        "practice GARCH is fit on the residuals of a mean model, often a simple ARMA, giving a combined model " +
        'where ARIMA supplies the mean and GARCH supplies the time-varying variance around it.',
      howItWorks: {
        summary:
          "Model the conditional variance of a series' shocks as a weighted function of recent squared shocks and " +
          'recent variance estimates, typically layered underneath an ARMA model for the mean.',
        steps: [
          "Fit a mean model to the series (often ARMA or a constant) and take its residuals.",
          'Model the conditional variance of those residuals as a constant plus a weighted sum of recent squared residuals (the ARCH term) and recent variance estimates (the GARCH term).',
          'Estimate all parameters jointly by maximum likelihood, assuming a distribution (often Student-t, to capture fat tails) for the standardized residuals.',
          'Use the fitted variance process to forecast volatility forward, or to standardize residuals for risk metrics like value-at-risk.',
        ],
      },
      whenToUse: [
        "You need to forecast or explain volatility itself, e.g. for options pricing or value-at-risk, not the level of the series",
        'The series shows visible volatility clustering — calm and turbulent periods that persist, common in financial returns',
      ],
      whenNotToUse: [
        "You need a point forecast of the series' level — GARCH says nothing about that; pair it with an ARMA/ARIMA mean model instead",
        'The series is not return-like and shows no volatility clustering — a constant-variance model is simpler and adequate',
      ],
      facets: {
        task: ['forecasting'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'conditional-variance-forecast',
      },
      // maximum-likelihood-and-map cross-body link (Sol, same batch): GARCH parameters are fit
      // by exactly that MLE machinery, over a Student-t or Gaussian likelihood.
      related: ['arima-and-sarima', 'maximum-likelihood-and-map'],
      references: {
        free: [{ title: 'arch package — Univariate volatility models', url: 'https://arch.readthedocs.io/en/latest/univariate/introduction.html' }],
        papers: [
          {
            title: 'Autoregressive Conditional Heteroscedasticity with Estimates of the Variance of United Kingdom Inflation',
            url: 'https://doi.org/10.2307/1912773',
            year: 1982,
          },
          {
            title: 'Generalized Autoregressive Conditional Heteroskedasticity',
            url: 'https://doi.org/10.1016/0304-4076(86)90063-1',
            year: 1986,
          },
        ],
      },
    },
    {
      id: 'dynamic-time-warping-and-changepoint-detection',
      name: 'Dynamic time warping & changepoint detection',
      aliases: ['DTW', 'elastic distance measure', 'structural break detection'],
      tier: 1,
      year: 1978,
      difficulty: 3,
      hook: "Aligns two sequences that drift in speed by warping time, and separately flags where a series's statistics shift.",
      intuition:
        'Two different problems share this entry because both compare a time series to itself or another one, not ' +
        'forecast its future. Dynamic time warping measures how similar two sequences are when they can be ' +
        'stretched or compressed in time — a slow version of a gesture and a fast version of the same gesture look ' +
        "identical to a human but very different to Euclidean, point-by-point distance. DTW instead finds the " +
        "cheapest way to stretch one sequence's time axis onto the other's, searching every possible point-to-point " +
        'pairing with dynamic programming, and reports the cost of the best alignment as a distance. Changepoint ' +
        'detection asks something else: given one series, where does its behaviour change — a shift in mean, ' +
        'variance or trend, not a comparison to another sequence at all. The two are bundled together here because ' +
        'both operate on raw sequence shape rather than producing a forecast.',
      howItWorks: {
        summary:
          'DTW finds the lowest-cost alignment path between two sequences through dynamic programming over a ' +
          "pairwise distance grid; changepoint detection scans a single series for points where a cost function's " +
          'optimal fit changes sharply enough to justify a break.',
        steps: [
          'DTW: build a grid of pairwise distances between every point in sequence A and every point in sequence B.',
          "DTW: find the lowest-cost monotonic, continuous path through that grid from corner to corner via dynamic programming; its cost is the DTW distance.",
          'DTW: optionally restrict the path to a band around the diagonal (a Sakoe-Chiba band) to cut cost and stop pathological warps.',
          'Changepoint detection: define a cost function that fits a segment well when its statistics are stable (e.g. squared error to the segment mean).',
          "Changepoint detection: search over candidate split points — exhaustively, via binary segmentation, or via PELT's pruned dynamic program — for the segmentation minimizing total cost plus a penalty per added changepoint.",
        ],
      },
      hyperparameters: [
        {
          name: 'window / Sakoe-Chiba band width',
          what: 'Maximum allowed offset between aligned indices in DTW, restricting how far the warping path can stray from the diagonal.',
          tuning:
            "Sakoe and Chiba's own experiments found a moderate slope constraint improved discrimination between " +
            'words; too narrow a band prevents genuine alignment, too wide (or none) lets DTW warp pathologically ' +
            'and gives up the speedup a band provides over the full O(nm) search.',
        },
        {
          name: 'penalty (changepoint detection)',
          what: 'Cost charged per additional changepoint, trading off sensitivity against overfitting to noise.',
          tuning:
            'A common default is a BIC-style penalty (k * log n); raise it to detect only large, well-supported ' +
            'shifts, lower it to catch subtler ones at the risk of false positives.',
        },
      ],
      whenToUse: [
        'You are comparing or clustering sequences that share a shape but are shifted or stretched in time — gait cycles, speech, gestures, sensor traces at different speeds (DTW)',
        'You need a similarity measure for k-NN classification or clustering of time series where Euclidean distance is thrown off by small time shifts (DTW)',
        "You need to find where a series's mean, variance or trend genuinely shifts — a sensor drifting out of calibration, a regime change in a financial series (changepoint detection)",
        'You want to explain the past shape of a series, not predict its future',
      ],
      whenNotToUse: [
        'You need a forecast of future values — neither DTW nor changepoint detection produces one; pair with ARIMA/ETS/Prophet for that',
        'Your sequences are already time-aligned and the same length — plain Euclidean distance is cheaper and, unlike DTW, is a true metric (DTW violates the triangle inequality)',
        'You need pairwise DTW across a large dataset of sequences — unconstrained DTW is O(nm) per pair, expensive at scale without a lower-bound pruning technique or a banded window',
        'You need changepoints online as data arrives rather than after the fact — offline algorithms like PELT and binary segmentation assume the whole series is already in hand',
      ],
      facets: {
        task: ['clustering', 'anomaly-detection'],
        dataType: ['timeseries'],
        dataSize: ['small', 'medium'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'alignment-distance-or-changepoint-locations',
      },
      math: {
        latex: [
          'D(i,j) = d(x_i, y_j) + \\min\\{D(i-1,j),\\, D(i,j-1),\\, D(i-1,j-1)\\}',
          '\\min_{m,\\, \\tau_1 < \\cdots < \\tau_m} \\left[ \\sum_{k=0}^{m} C(y_{\\tau_k:\\tau_{k+1}}) + \\beta m \\right]',
        ],
        notes:
          'The first line is the DTW recursion: the cumulative cost to align the first i points of one series ' +
          'with the first j of another, built from a pointwise distance d and the cheapest of the three preceding ' +
          "cells — exactly the dynamic program Sakoe and Chiba solved for speech recognition, with a slope-" +
          'constrained neighbourhood. The second line is the generic changepoint objective PELT and binary ' +
          'segmentation both minimize: total within-segment cost across m changepoints plus a penalty beta per ' +
          'changepoint, which is what keeps the search from placing a changepoint at every point.',
      },
      complexity: {
        train:
          'DTW: O(nm) time and space for two sequences of length n and m, or O(n * w) with a band of width w. ' +
          'Changepoint detection: O(n) for PELT under mild conditions, versus O(n log n) for binary segmentation ' +
          'and O(n^2) or worse for exhaustive search.',
        predict: 'n/a — both are one-shot computations over the given sequence(s), not fitted models that predict on new data',
      },
      code: [
        'from dtaidistance import dtw',
        'import ruptures as rpt',
        '',
        '# DTW distance between two sequences of possibly different length',
        'd = dtw.distance(sequence_a, sequence_b)',
        '',
        '# Offline changepoint detection with PELT',
        'algo = rpt.Pelt(model="l2").fit(signal)',
        'changepoints = algo.predict(pen=10)   # indices where the series\' statistics shift',
      ].join('\n'),
      // distance-metrics cross-body link (Venus): DTW is an elastic variant of exactly the
      // distance-measure catalogue there.
      related: ['distance-metrics', 'k-nearest-neighbors', 'hierarchical-clustering'],
      references: {
        free: [
          { title: 'tslearn user guide — Dynamic Time Warping', url: 'https://tslearn.readthedocs.io/en/stable/user_guide/dtw.html' },
          { title: 'ruptures documentation', url: 'https://centre-borelli.github.io/ruptures-docs/' },
        ],
        papers: [
          {
            title: 'Dynamic Programming Algorithm Optimization for Spoken Word Recognition',
            url: 'https://doi.org/10.1109/TASSP.1978.1163055',
            year: 1978,
          },
          {
            title: 'Selective Review of Offline Change Point Detection Methods',
            url: 'https://doi.org/10.1016/j.sigpro.2019.107299',
            year: 2020,
          },
        ],
        books: [
          {
            title: 'Data Mining: The Textbook',
            author: 'Aggarwal',
            chapter: 'Ch. 3 — Similarity and Distance Measures (time-series similarity, including dynamic time warping)',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
  ],
} satisfies Body;
