/**
 * Prometheus — Neural Network Foundations. See PLAN.md §3 for the full moon list (9 moons, all
 * written here: 8 Tier 1, 1 Tier 2). PLAN.md marks Prometheus "the first body of the transit" —
 * litBy 'sol' in src/content/system.ts is a rendering placement only and carries no pedagogical
 * weight; every moon here is dated and sourced independently of that.
 *
 * This body is the foundation Vulcan (CNNs), Echo (RNNs) and Chimera (generative models) build
 * on directly, and it is also the direct successor to Sol: backpropagation IS gradient descent
 * (Sol's `gradient-descent`) applied via the chain rule through a computational graph, and every
 * optimizer here (momentum, RMSProp, Adam, AdamW) is a specific variant of that same idea —
 * `related` links throughout make this explicit rather than leaving it implied.
 *
 * The eight Tier 1 entries are tightly coupled by design (PLAN.md asks for this) but each owns
 * one distinct question:
 *   perceptron                     the single linear-threshold unit, and its precise limitation
 *   multilayer-perceptron          composing units into layers with nonlinearities between them
 *   backpropagation-and-autodiff   the mechanism that computes gradients through that composition
 *   activation-functions           the menu of nonlinearities and their distinct failure modes
 *   weight-initialization          the variance-scaling schemes that keep deep nets trainable
 *   batch-and-layer-normalization  stabilizing the *distribution* of activations during training
 *   dropout-and-weight-decay       two distinct regularizers bundled under one moon
 *   optimizers                     update-rule variants beyond plain SGD
 * vanishing-gradients-and-universal-approximation (Tier 2) pairs a capacity result with a
 * trainability obstacle — deliberately not duplicating multilayer-perceptron's brief mention of
 * universal approximation, which only notes the connection and defers the proof/theorem here.
 *
 * `year` dating choices, several genuinely contested and documented here rather than silently
 * picked, per CONTENT_GUIDE/PLAN.md precedent (see sol.ts for the same practice):
 *   - perceptron: 1958 (Rosenblatt, "The Perceptron: A Probabilistic Model for Information
 *     Storage and Organization in the Brain", Psychological Review 65(6):386-408). Unambiguous —
 *     this entry's whole subject is that specific paper's model.
 *   - multilayer-perceptron: 1986 (Rumelhart, Hinton & Williams, Nature 323:533-536). Genuinely
 *     contested: some secondary sources credit Rosenblatt's 1962 book with early multilayer
 *     variants, and others credit Ivakhnenko & Lapa's 1965 Group Method of Data Handling with
 *     the first deep (multi-hidden-layer) network — but both claims were found only in
 *     lower-quality secondary sources (a LinkedIn post, a tutorial-hub page) during this
 *     research pass, not in anything citable. 1986 is pinned instead as the point a
 *     backprop-trainable, multi-hidden-layer, nonlinear feedforward network became a practical,
 *     standard architecture — the specific object this entry actually describes — with the
 *     murkier earlier claims deliberately left uncited rather than repeated on weak sourcing.
 *   - backpropagation-and-autodiff: 1986 (same Rumelhart/Hinton/Williams paper, different
 *     angle — the mechanism itself, not the architecture it trains). The real, earlier lineage
 *     is stated in prose rather than pinned as the year, mirroring sol.ts's gradient-descent
 *     entry's treatment of SGD's separate root: Linnainmaa's 1970 MSc thesis first described
 *     reverse-mode automatic differentiation (confirmed via Wikipedia's Seppo Linnainmaa
 *     article), which he later published, with a real DOI, as Linnainmaa (1976) "Taylor
 *     expansion of the accumulated rounding error", BIT 16:146-160 (10.1007/BF01931367) —
 *     confirmed via CrossRef. Werbos's 1974 Harvard PhD thesis first proposed applying the
 *     technique to train neural networks specifically, but per Wikipedia's Paul Werbos article
 *     it went unpublished until his 1994 book "The Roots of Backpropagation". 1986 is pinned
 *     because it is the well-documented, directly-verified (Nature, DOI-bearing) paper that
 *     actually popularized backpropagation within the neural-network community and triggered
 *     its adoption — not a claim that it was the mathematical technique's origin.
 *   - activation-functions: 2010 (Nair & Hinton, "Rectified Linear Units Improve Restricted
 *     Boltzmann Machines", ICML, confirmed via DBLP). Sigmoid/tanh have no single inventor
 *     (generic mathematical functions); ReLU's popularization is the one genuinely dated,
 *     individually-authored turning point among the functions this entry covers (GELU 2016,
 *     Swish 2017 postdate it) — the same "pin to the one novel, individually-authored
 *     construction" logic sol.ts's loss-functions entry used for Huber (1964) among MSE/
 *     cross-entropy/hinge. An even earlier antecedent, Hahnloser et al.'s 2000 Nature paper on
 *     rectification in a biologically-inspired circuit, is noted in prose, not pinned, since it
 *     was not a neural-network training paper.
 *   - weight-initialization: 2010 (Glorot & Bengio, AISTATS, "Understanding the Difficulty of
 *     Training Deep Feedforward Neural Networks" — confirmed via the PMLR proceedings page),
 *     the earlier of the two variance-scaling schemes this entry covers; He et al.'s 2015
 *     Kaiming initialization is the later, ReLU-specific refinement, described in the entry
 *     itself rather than repinning the year.
 *   - batch-and-layer-normalization: 2015 (Ioffe & Szegedy, arXiv:1502.03167 — confirmed by
 *     opening the abs page directly), the earlier of the two normalization papers this entry
 *     covers; Ba/Kiros/Hinton's 2016 layer normalization (arXiv:1607.06450, also confirmed
 *     directly) is the later, batch-independent variant.
 *   - dropout-and-weight-decay: 2014 (Srivastava, Hinton, Krizhevsky, Sutskever & Salakhutdinov,
 *     JMLR 15:1929-1958 — confirmed by opening jmlr.org/papers/v15/srivastava14a.html directly).
 *     Weight decay's own citable source, Krogh & Hertz (1991, NeurIPS, confirmed via the NeurIPS
 *     proceedings page), is older, but weight decay/L2 penalization is a generic statistical
 *     technique with no single clean inventor the way dropout is a purpose-built, individually-
 *     authored mechanism — the same Huber-over-MSE reasoning sol.ts already established.
 *   - optimizers: 1964 (Polyak, "Some Methods of Speeding up the Convergence of Iteration
 *     Methods", USSR Computational Mathematics and Mathematical Physics 4:1-17, DOI
 *     10.1016/0041-5553(64)90137-5, confirmed via CrossRef), the individually-authored origin of
 *     momentum specifically — the same "date to the earliest true origin, describe later
 *     refinements in prose" pattern sol.ts's gradient-descent entry used for Cauchy (1847) with
 *     SGD's separate, later root. RMSProp (Tieleman & Hinton, 2012, Coursera lecture 6e — never
 *     formally published), Adam (Kingma & Ba, arXiv:1412.6980, confirmed directly) and AdamW
 *     (Loshchilov & Hutter, arXiv:1711.05101, confirmed directly) are the later methods this
 *     entry bundles, described in the entry body rather than repinning the year.
 *   - vanishing-gradients-and-universal-approximation: 1989 (Hornik, Stinchcombe & White,
 *     Neural Networks 2:359-366, DOI 10.1016/0893-6080(89)90020-8; and independently Cybenko,
 *     Mathematics of Control, Signals and Systems 2:303-314, DOI 10.1007/BF02551274 — both
 *     confirmed via CrossRef), the two clean, independently-authored, accessible proofs. The
 *     vanishing-gradient half is chronologically later and its true origin is genuinely hard to
 *     access: Hochreiter's 1991 diploma thesis (Technical University of Munich, in German) is
 *     confirmed only via secondary corroboration (Wikipedia's vanishing gradient problem
 *     article, which was opened directly) rather than an opened primary; Bengio, Simard &
 *     Frasconi (1994), IEEE Trans. Neural Networks 5:157-166 (DOI 10.1109/72.279181, confirmed
 *     via CrossRef) is the actual citable, accessible, English-language paper used as this
 *     entry's reference for that half.
 *
 * Research trail beyond the year-dating notes above (every claim read from an opened source):
 *   - Minsky & Papert's precise XOR/linear-separability claim, and the widely-repeated
 *     misconception about it, verified via Wikipedia's "Perceptrons (book)" and "Perceptron"
 *     articles (both opened directly): a single-layer perceptron cannot represent XOR because it
 *     is not linearly separable, and — contrary to a common oversimplification — Minsky and
 *     Papert already knew multi-layer perceptrons could compute XOR; their book's core result
 *     concerned single-layer networks under a locality restriction.
 *   - Novikoff's 1962 perceptron convergence theorem and its R^2/gamma^2 mistake bound verified
 *     across multiple independently-opened academic lecture-note sources (CMU, NYU) rather than
 *     a single source, since a precise theorem bound is exactly the kind of claim easy to get
 *     subtly wrong.
 *   - scikit-learn's Perceptron documentation (opened directly) confirmed it is implemented as
 *     SGDClassifier(loss="perceptron", learning_rate="constant") with eta0=1.0, max_iter=1000,
 *     penalty=None as defaults.
 *   - GELU (Hendrycks & Gimpel, arXiv:1606.08415) and Swish (Ramachandran, Zoph & Le,
 *     arXiv:1710.05941) both confirmed by opening their arXiv abs pages directly.
 *   - d2l.ai fetched directly for: chapter_multilayer-perceptrons/mlp.html (MLP motivation,
 *     activation function formulas and derivatives), chapter_multilayer-perceptrons/backprop.html
 *     (forward/backward computational-graph mechanics and memory cost),
 *     chapter_multilayer-perceptrons/numerical-stability-and-init.html (vanishing/exploding
 *     gradients and the Xavier variance derivation), chapter_convolutional-modern/batch-norm.html
 *     (batch norm formula and its own coverage of the internal-covariate-shift critique),
 *     chapter_optimization/momentum.html and chapter_optimization/adam.html (momentum and Adam
 *     mechanics, confirmed Adam combines momentum + RMSProp-style scaling).
 *   - The internal-covariate-shift critique is a genuine, still-discussed empirical finding, not
 *     an offhand aside: Santurkar, Tsipras, Ilyas & Madry, "How Does Batch Normalization Help
 *     Optimization? (No, It Is Not About Internal Covariate Shift)", arXiv:1805.11604 (NeurIPS
 *     2018), confirmed by opening the abs page directly — its own abstract states that
 *     "distributional stability of layer inputs has little to do with the success of BatchNorm"
 *     and identifies loss-landscape smoothness as the actual mechanism instead. d2l.ai's own
 *     batch-norm chapter independently corroborates this critique.
 *   - The L2-regularization-vs-weight-decay distinction for Adam — the specific nuance
 *     CONTENT_GUIDE flagged as commonly garbled — verified by opening Loshchilov & Hutter's
 *     "Decoupled Weight Decay Regularization" (arXiv:1711.05101) abs page directly: its abstract
 *     states the two are equivalent for plain SGD (up to rescaling by the learning rate) but NOT
 *     equivalent for adaptive gradient methods like Adam, and that AdamW fixes this by applying
 *     weight decay directly to the weights rather than folding it into the adaptively-scaled
 *     gradient.
 *   - PyTorch documentation defaults (nn.Dropout p=0.5 with 1/(1-p) train-time rescaling,
 *     nn.BatchNorm1d eps=1e-5/momentum=0.1, optim.Adam betas=(0.9,0.999)/eps=1e-8,
 *     optim.AdamW weight_decay=0.01, nn.Linear's kaiming_uniform_ default with the
 *     well-documented, community-discussed a=sqrt(5) quirk) were corroborated via multiple
 *     independent search results including PyTorch's own GitHub issue tracker, rather than
 *     recalled, since docs.pytorch.org pages did not return readable text to the fetch tool.
 *   - Goodfellow, Bengio & Courville's "Deep Learning" chapter/section numbers (6.3 Hidden
 *     Units, 6.5 Back-Propagation, 7.12 Dropout, 8.3-8.5 momentum/AdaGrad/RMSProp/Adam, 8.4
 *     Parameter Initialization Strategies) confirmed via multiple independent table-of-contents-
 *     bearing search results rather than a single source, since the book's own PDF does not
 *     yield extractable text (see the PDF-fetch note below).
 *
 * PDF-fetch caught failing honestly, per CONTENT_GUIDE §3's warning: fetching
 * https://www.gbv.de/dms/weimar/toc/1866090402_toc.pdf (intended to get Understanding Deep
 * Learning's full table of contents in one shot) and http://www.jmlr.org/papers/volume18/17-468/
 * 17-468.pdf (Baydin et al.'s automatic-differentiation survey, intended to pin down Linnainmaa/
 * Werbos historical claims from a single strong source) both returned explicit statements that no
 * readable text could be extracted from the encoded PDF stream — the correct failure mode, not
 * fabricated content. Neither is cited here as a result; the claims they would have supported are
 * instead sourced from the independently-opened HTML pages listed above (Wikipedia's Seppo
 * Linnainmaa and Paul Werbos articles for the autodiff history; search-confirmed chapter titles,
 * not content, for Understanding Deep Learning's TOC).
 *
 * Cross-linking: gradient-descent (Sol) -> backpropagation-and-autodiff and -> optimizers are
 * direct, not decorative — backprop computes exactly the gradient gradient-descent then steps
 * along, and every optimizer here is a reshaping of that same step. ridge-regression (Mercury)
 * and overfitting-and-regularization (Belt) -> dropout-and-weight-decay is likewise direct: weight
 * decay literally is L2/ridge's penalty applied per SGD step, not merely analogous to it (with the
 * Adam/AdamW nuance above being precisely why "literally" needs the AdamW qualifier). Forward
 * links into Vulcan/Echo/Chimera-specific uses of these building blocks are left as `//` comments
 * rather than fabricated ids, per the task's instruction, since those bodies' entries were being
 * written in parallel and are not guaranteed ids at the time this file was written.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'prometheus',
  name: 'Prometheus',
  segment: 'Neural Network Foundations',
  hook: 'The first body of the transit: single units become layers, layers become trainable, and training becomes a craft of its own.',
  summary:
    'Prometheus collects the load-bearing ideas every deep network downstream of it depends on — the single trainable ' +
    'unit, the mechanism that computes its gradient, the menu of nonlinearities and initialization schemes that keep ' +
    'deep stacks trainable at all, and the regularizers and optimizers that make training practical rather than merely ' +
    'possible.',
  eraRange: [1958, 2015],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'perceptron',
      name: 'Perceptron',
      aliases: ["Rosenblatt's perceptron", 'linear threshold unit'],
      tier: 1,
      year: 1958,
      difficulty: 2,
      hook: 'Sums weighted inputs, thresholds them, and nudges its weights toward whatever it just got wrong.',
      intuition:
        'A perceptron is a single artificial neuron: multiply each input by a weight, add a bias, and check whether ' +
        'the sum clears zero. If it does, predict one class; if not, predict the other. That decision boundary is a ' +
        'straight line, or a flat hyperplane in higher dimensions — a perceptron can only ever cut the input space in ' +
        'two with one straight cut. Training is almost embarrassingly simple: run through the data, and whenever the ' +
        'current weights misclassify a point, shift the weights a little in the direction that would have gotten it ' +
        'right. Rosenblatt proved that if the two classes really can be separated by a straight line, this procedure ' +
        'is guaranteed to find one in a finite number of corrections. But "if" is doing real work in that sentence — ' +
        "Minsky and Papert's 1969 book showed a single-layer perceptron cannot represent a function like XOR, since " +
        'no straight line separates its positive and negative cases, though they already knew a network with a ' +
        'hidden layer could.',
      howItWorks: {
        summary:
          'Compute a weighted sum of the inputs plus a bias, pass it through a step function, and nudge the weights ' +
          'toward misclassified points until every point is classified correctly or a maximum number of passes is reached.',
        steps: [
          'Initialize the weights and bias to zero or small random values.',
          'For each training example, compute the weighted sum of its inputs plus the bias.',
          'Apply the step function: predict one class if the sum is above zero, the other if not.',
          "If the prediction is wrong, update the weights toward the example: w <- w + eta * y * x (the perceptron learning rule).",
          'Repeat over the training set for multiple passes (epochs) until an entire pass makes no mistakes, or a max epoch count is hit.',
        ],
      },
      hyperparameters: [
        {
          name: 'eta0 (learning rate)',
          what: 'Scales the size of each mistake-driven weight update.',
          tuning:
            "scikit-learn's Perceptron defaults eta0=1.0. Unlike gradient descent on a smooth loss, the perceptron " +
            "rule's convergence (on separable data) does not depend on this value's magnitude, only its sign and the " +
            'update direction, so it rarely needs tuning.',
        },
        {
          name: 'max_iter',
          what: 'Maximum number of passes over the training data.',
          tuning:
            'scikit-learn defaults to 1000. On separable data the algorithm stops early once a pass makes zero ' +
            'mistakes; on non-separable data it never stops improving and simply runs until this cap.',
        },
      ],
      whenToUse: [
        'The classes are linearly separable, or close enough that a single straight decision boundary is an acceptable approximation',
        'You need an extremely fast, simple, low-memory online linear classifier that updates one example at a time',
        'You want the simplest possible illustration of a trainable model with a hard decision rule, e.g. as a teaching baseline before logistic regression or SVMs',
      ],
      whenNotToUse: [
        'The classes are not linearly separable — the perceptron rule does not converge and its weights can oscillate indefinitely (XOR is the standard example)',
        'You need class probabilities, not just a label — the hard step function has no smooth link to a probability the way logistic regression\'s sigmoid does',
        "You need a maximum-margin boundary for good generalization — the perceptron stops at the first separating hyperplane it finds, not the best one (see support-vector-machines)",
      ],
      facets: {
        task: ['classification'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'binary-class-label',
      },
      math: {
        latex: [
          '\\hat{y} = \\mathrm{sign}\\!\\left(\\mathbf{w}^\\top \\mathbf{x} + b\\right)',
          '\\mathbf{w} \\leftarrow \\mathbf{w} + \\eta\\, y\\, \\mathbf{x} \\quad \\text{whenever } y\\left(\\mathbf{w}^\\top\\mathbf{x}+b\\right) \\le 0',
        ],
        notes:
          "Novikoff's 1962 convergence proof bounds the number of mistakes the algorithm can make, on linearly " +
          'separable data, by R^2/gamma^2, where R is the radius of the smallest ball containing the data and gamma ' +
          'is the margin of the best separating hyperplane — one of the first margin-based bounds in learning theory, ' +
          'and the same margin quantity support-vector-machines later optimizes directly rather than merely bounding.',
      },
      code: [
        'from sklearn.linear_model import Perceptron',
        'from sklearn.preprocessing import StandardScaler',
        '',
        'X = StandardScaler().fit_transform(X_raw)',
        '',
        'clf = Perceptron(eta0=1.0, max_iter=1000, penalty=None, random_state=0)',
        'clf.fit(X, y)                       # y in {-1, +1} or {0, 1}',
        '',
        'preds = clf.predict(X)',
        'mistakes = (preds != y).sum()       # guaranteed to reach 0 only if X, y are linearly separable',
      ].join('\n'),
      // support-vector-machines (Uranus) is the direct forward link: both fit a linear boundary,
      // but SVM optimizes the margin the perceptron's convergence proof only bounds.
      related: ['multilayer-perceptron', 'logistic-regression', 'support-vector-machines'],
      references: {
        free: [
          { title: 'Wikipedia — Perceptron', url: 'https://en.wikipedia.org/wiki/Perceptron' },
          { title: 'scikit-learn user guide — Perceptron', url: 'https://scikit-learn.org/stable/modules/linear_model.html#perceptron' },
        ],
        papers: [
          {
            title: 'The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain',
            url: 'https://doi.org/10.1037/h0042519',
            year: 1958,
          },
        ],
        books: [
          {
            title: 'Perceptrons: An Introduction to Computational Geometry',
            author: 'Minsky & Papert',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'multilayer-perceptron',
      name: 'Multilayer Perceptron',
      aliases: ['MLP', 'feedforward neural network', 'fully connected network'],
      tier: 1,
      year: 1986,
      difficulty: 2,
      hook: 'Stacks layers with nonlinearities between them, turning straight cuts into curved decision boundaries.',
      intuition:
        'Stack two linear layers directly on top of each other and you have gained nothing: an affine function of an ' +
        'affine function is itself just one affine function, so a "deep" stack of pure linear layers can only ever ' +
        "represent what a single linear layer already could. A multilayer perceptron's actual trick is putting a " +
        'nonlinear activation function between every pair of layers, which breaks that collapse — each hidden layer ' +
        'now transforms its input into a genuinely new representation the next layer builds on, rather than just a ' +
        'rescaled version of the same one. This is what actually fixes the single perceptron\'s XOR limitation: a ' +
        'hidden layer can bend the decision boundary into curves and disjoint regions no single straight cut could ' +
        'produce. How much this composition can represent in principle is a separate, formal question — universal ' +
        'approximation, covered in its own entry — but the practical MLP recipe is exactly this: linear transform, ' +
        'nonlinearity, repeat, then train the whole stack with backpropagation.',
      howItWorks: {
        summary:
          "Feed the input through a chain of layers, each a linear transform followed by a nonlinear activation, " +
          'until a final output layer produces the prediction.',
        steps: [
          'Feed the input vector into the first layer: multiply by a weight matrix and add a bias vector.',
          "Apply a nonlinear activation function elementwise to that layer's output.",
          'Pass the resulting vector into the next layer, repeating the linear-transform-then-activation step for every hidden layer.',
          "At the final layer, apply whatever output transform the task needs — softmax for multiclass classification, a sigmoid for binary, or the identity for regression.",
          'Compare the output to the true label with a loss function, then update every weight in every layer via backpropagation to reduce that loss.',
        ],
      },
      hyperparameters: [
        {
          name: 'number of hidden layers and width',
          what: "Depth (number of layers) and width (units per layer) control the network's representational capacity.",
          tuning:
            'Start shallow and widen or deepen only if the model is underfitting. Depth is generally more parameter-' +
            'efficient than width for representing compositional functions, but deeper networks are harder to train ' +
            'well without the tools covered elsewhere on this body (careful initialization, normalization, residual paths).',
        },
        {
          name: 'activation function',
          what: 'Which nonlinearity sits between layers.',
          tuning: 'ReLU or a smooth variant (GELU, Swish) is the standard default; see activation-functions.',
        },
      ],
      whenToUse: [
        'The relationship between inputs and outputs is nonlinear in a way a single linear layer provably cannot represent (e.g. XOR-like interactions between features)',
        'You have enough labeled data and compute to train multiple layers without immediately overfitting',
        'You want a general-purpose function approximator over tabular or already-embedded input, without hand-designing features',
      ],
      whenNotToUse: [
        'The true relationship is close to linear — a linear or logistic regression fits nearly as well with far less data, compute and tuning',
        'Individual weights need to be interpretable — an MLP\'s weights do not correspond to a single, readable effect the way a linear model\'s coefficients do',
        'The input has strong spatial or sequential structure (images, sequences) that a plain MLP ignores entirely — convolutional or recurrent architectures exploit that structure directly instead',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'learned-nonlinear-function',
      },
      math: {
        latex: [
          '\\mathbf{h}^{(1)} = \\sigma\\!\\left(\\mathbf{W}^{(1)}\\mathbf{x} + \\mathbf{b}^{(1)}\\right)',
          '\\mathbf{h}^{(l)} = \\sigma\\!\\left(\\mathbf{W}^{(l)}\\mathbf{h}^{(l-1)} + \\mathbf{b}^{(l)}\\right), \\quad l = 2, \\dots, L',
        ],
        notes:
          'Without sigma, composing layers collapses algebraically to a single linear map, which is why a stack of ' +
          'purely linear layers is exactly as expressive as one layer. Whether a shallow-but-wide network or a ' +
          'narrow-but-deep one is the more efficient way to represent a given function is precisely the question the ' +
          'universal approximation results (a separate entry) speak to, and part of why depth is generally preferred ' +
          'in practice over width alone.',
      },
      code: [
        'import torch.nn as nn',
        '',
        'model = nn.Sequential(',
        '    nn.Linear(784, 256),',
        '    nn.ReLU(),',
        '    nn.Linear(256, 128),',
        '    nn.ReLU(),',
        '    nn.Linear(128, 10),          # raw logits -- softmax is applied inside the loss below',
        ')',
        '',
        '# nn.CrossEntropyLoss expects raw logits and integer class labels',
        'loss_fn = nn.CrossEntropyLoss()',
        'logits = model(x_batch)',
        'loss = loss_fn(logits, y_batch)',
        'loss.backward()',
      ].join('\n'),
      // convolution-and-pooling (Vulcan) and vanilla-rnn-and-bptt (Echo) are the genuine forward
      // links -- both are this exact linear-then-nonlinearity recipe plus a structural weight-
      // sharing constraint (across space, or across time) that a plain MLP does not have.
      related: ['perceptron', 'backpropagation-and-autodiff', 'activation-functions', 'vanishing-gradients-and-universal-approximation'],
      references: {
        free: [{ title: 'Dive into Deep Learning — 5.1. Multilayer Perceptrons', url: 'https://d2l.ai/chapter_multilayer-perceptrons/mlp.html' }],
        papers: [
          {
            title: 'Learning representations by back-propagating errors',
            url: 'https://doi.org/10.1038/323533a0',
            year: 1986,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 3 — Shallow Neural Networks',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'backpropagation-and-autodiff',
      name: 'Backpropagation & Autodiff',
      aliases: ['backprop', 'reverse-mode automatic differentiation'],
      tier: 1,
      year: 1986,
      difficulty: 4,
      hook: "Computes every weight's gradient in one backward pass by running the chain rule through the network's computation graph.",
      intuition:
        'Think of a network as a graph of simple operations chained together, each one differentiable on its own. ' +
        'Backpropagation runs that graph forward once, caching every intermediate value, then walks it backward from ' +
        "the loss to the inputs, applying the chain rule at each operation using those cached values. The result is " +
        "every parameter's exact gradient, computed in roughly the same amount of work as one extra forward pass — " +
        "not one evaluation per parameter, which is what naive finite-difference differentiation would cost on a " +
        'network with millions of weights. This general technique, reverse-mode automatic differentiation, predates ' +
        'its use in neural networks: Linnainmaa described it in 1970, and Werbos proposed applying it to train neural ' +
        'nets in his unpublished 1974 thesis. What made it stick was Rumelhart, Hinton and Williams\'s 1986 Nature ' +
        "paper, which popularized it within the field and showed hidden layers could learn genuinely useful internal features.",
      howItWorks: {
        summary:
          'Run the network forward while caching every intermediate value, then walk backward from the loss applying ' +
          'the chain rule at each operation to accumulate the gradient with respect to every parameter.',
        steps: [
          'Treat the network as a computational graph of operations from the inputs to a single scalar loss.',
          'Run a forward pass, computing and storing every intermediate value the backward pass will need.',
          'Initialize the gradient of the loss with respect to itself as 1.',
          "Walk the graph in reverse; at each operation, multiply the incoming gradient by that operation's local derivative (evaluated using the cached forward values) via the chain rule.",
          'Accumulate gradients at each parameter from every path through the graph that uses it.',
          "Pass each parameter's accumulated gradient to the optimizer, which uses it to update the weights.",
        ],
      },
      whenToUse: [
        'Training any model built from differentiable operations — every layer and elementwise function has a known local derivative to chain together',
        'You need exact gradients for a large number of parameters cheaply — reverse mode costs roughly one extra forward pass total, not one pass per parameter the way forward-mode or finite differences would',
        "You're using any modern deep learning framework — this is the mechanism actually running underneath every call to .backward() or grad()",
      ],
      whenNotToUse: [
        'A step in the computation is genuinely non-differentiable with no usable subgradient or relaxation (e.g. a hard argmax or a discrete sampling step) — the chain rule has nothing to propagate through',
        "Memory is the binding constraint — every cached intermediate activation costs memory proportional to depth times batch size, which is exactly what motivates gradient checkpointing when a model doesn't fit",
        'Only a handful of parameters exist and their gradients are easy to derive by hand — plain numerical (finite-difference) differentiation can be simpler to implement correctly, if much slower at scale',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'audio', 'timeseries'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'parameter-gradients',
      },
      math: {
        latex: [
          '\\frac{\\partial L}{\\partial w^{(l)}_{ij}} = \\frac{\\partial L}{\\partial h^{(l)}} \\cdot \\frac{\\partial h^{(l)}}{\\partial z^{(l)}} \\cdot \\frac{\\partial z^{(l)}}{\\partial w^{(l)}_{ij}}',
        ],
        notes:
          'Reverse mode is specifically efficient when a graph has many inputs (parameters) and one scalar output ' +
          '(the loss) — exactly the shape of a training step — because the cost of one backward pass does not grow ' +
          'with the number of parameters, unlike forward-mode automatic differentiation or finite differences, whose ' +
          'cost scales with it directly. This is why every deep learning framework implements reverse mode as the ' +
          'default, not forward mode.',
      },
      code: [
        'import torch',
        '',
        'x = torch.randn(4, 3, requires_grad=True)',
        'w = torch.randn(3, 2, requires_grad=True)',
        'b = torch.randn(2, requires_grad=True)',
        '',
        'z = x @ w + b               # forward pass builds the computation graph automatically',
        'loss = z.pow(2).mean()',
        '',
        'loss.backward()             # reverse-mode autodiff walks the graph backward',
        'print(w.grad)               # dL/dw, exact, via the chain rule -- no manual derivative written',
      ].join('\n'),
      // gradient-descent (Sol) is the direct link: backprop computes exactly the gradient that
      // gradient descent then steps along -- the two entries describe one training step together.
      related: ['gradient-descent', 'multilayer-perceptron', 'optimizers'],
      references: {
        free: [
          { title: 'Dive into Deep Learning — 5.3. Forward Propagation, Backward Propagation, and Computational Graphs', url: 'https://d2l.ai/chapter_multilayer-perceptrons/backprop.html' },
          { title: 'Wikipedia — Automatic differentiation', url: 'https://en.wikipedia.org/wiki/Automatic_differentiation' },
        ],
        papers: [
          {
            title: 'Learning representations by back-propagating errors',
            url: 'https://doi.org/10.1038/323533a0',
            year: 1986,
          },
          {
            title: 'Taylor expansion of the accumulated rounding error',
            url: 'https://doi.org/10.1007/BF01931367',
            year: 1976,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 6.5 — Back-Propagation and Other Differentiation Algorithms',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'activation-functions',
      name: 'Activation Functions',
      aliases: ['nonlinearities'],
      tier: 1,
      year: 2010,
      difficulty: 2,
      hook: 'Picks the nonlinearity between layers — the choice that decides whether gradients survive or die.',
      intuition:
        'An activation function is what turns a stack of linear layers into something that can represent curved, ' +
        'non-linear relationships at all, but the specific choice has real consequences for training. Sigmoid and ' +
        'tanh squash their input into a bounded range, and their derivative shrinks toward zero the further the input ' +
        "gets from the middle, so a deep stack of them chains many small numbers together and the gradient reaching " +
        'early layers can vanish almost entirely. ReLU fixes that for positive inputs — its derivative is a clean 1 ' +
        'with no shrinkage — but it is exactly 0 for negative inputs, so a unit that lands in the negative region for ' +
        'its entire training set stops receiving any gradient and "dies". GELU and Swish are smoother, non-monotonic ' +
        'alternatives, weighting the input by roughly how likely it is to be "kept" rather than hard-clipping at ' +
        'zero, at a bit more compute cost per call.',
      howItWorks: {
        summary:
          "Apply a fixed, elementwise nonlinear function to each unit's pre-activation value, chosen for how it " +
          'behaves in its saturating and non-saturating regions.',
        steps: [
          "Compute each unit's pre-activation: the weighted sum of its inputs plus a bias.",
          'Pass it through the chosen nonlinearity: sigmoid/tanh squash it to a bounded range; ReLU zeroes negative values and passes positive ones through unchanged; GELU/Swish smoothly interpolate near zero based on sign and magnitude.',
          'Pass the resulting activation on as input to the next layer.',
          "During backpropagation, multiply the incoming gradient by the activation function's local derivative at that point — this is exactly what differs most between choices.",
        ],
      },
      hyperparameters: [
        {
          name: 'GELU exact vs. tanh approximation',
          what: "Whether to compute GELU's exact erf-based form or a faster tanh-based approximation.",
          tuning:
            "PyTorch's nn.GELU defaults to the exact form; the tanh approximation trades a small numerical " +
            'difference for speed and is used in some implementations where the exact form is a bottleneck.',
        },
      ],
      whenToUse: [
        'Deep networks (many layers), where gradient flow through the nonlinearity matters — use ReLU or a smooth variant (GELU/Swish), not sigmoid/tanh, which saturate and choke gradients as depth grows',
        'You need a fast, cheap default with essentially no drawback for most feedforward or convolutional architectures — ReLU',
        'Very deep or wide modern architectures (transformers) where a smoother, non-monotonic activation measurably improves optimization in practice — GELU or Swish',
      ],
      whenNotToUse: [
        'The output layer needs a bounded probability or gate value — use sigmoid (binary) or softmax (multiclass) specifically there, not as a general hidden-layer choice',
        'A large fraction of ReLU units have gone permanently inactive ("dying ReLU", stuck at zero for every input) — switch to a variant with a small negative slope (Leaky ReLU) or a smooth alternative that has no fully flat, zero-gradient region',
        "Compute budget is extremely tight, e.g. edge or embedded inference — GELU/Swish's exponential or error-function terms cost more per call than ReLU's single comparison",
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'audio'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'elementwise-nonlinear-transform',
      },
      math: {
        latex: [
          '\\sigma(x) = \\frac{1}{1+e^{-x}}, \\qquad \\mathrm{ReLU}(x) = \\max(0, x)',
          '\\mathrm{GELU}(x) = x\\,\\Phi(x), \\qquad \\mathrm{Swish}_\\beta(x) = x\\,\\sigma(\\beta x)',
        ],
        notes:
          "Sigmoid's derivative, sigma(x)(1-sigma(x)), peaks at only 0.25 (at x=0) and shrinks toward zero at both " +
          'extremes; chained across many layers this repeatedly shrinks the gradient, which is the mechanism the ' +
          'vanishing-gradients entry names directly. GELU and Swish were both found partly via automated or empirical ' +
          'search over candidate functions rather than derived from one first principle, and both approach ReLU-like ' +
          'behaviour for large |x| while staying smooth and slightly negative just below zero, which is what avoids ' +
          "ReLU's hard, flat zero-gradient region.",
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        'import torch.nn.functional as F',
        '',
        'x = torch.randn(8, 16)',
        '',
        'relu_out  = F.relu(x)    # max(0, x) -- cheap, can "die" on negative inputs',
        'gelu_out  = F.gelu(x)    # x * Phi(x) -- smooth, default in many transformer architectures',
        'swish_out = F.silu(x)    # x * sigmoid(x) -- Swish with beta=1, also called SiLU',
        '',
        'block = nn.Sequential(nn.Linear(16, 32), nn.GELU(), nn.Linear(32, 8))',
      ].join('\n'),
      related: ['multilayer-perceptron', 'weight-initialization', 'vanishing-gradients-and-universal-approximation'],
      references: {
        free: [{ title: 'Dive into Deep Learning — 5.1. Multilayer Perceptrons (activation functions)', url: 'https://d2l.ai/chapter_multilayer-perceptrons/mlp.html' }],
        papers: [
          { title: 'Rectified Linear Units Improve Restricted Boltzmann Machines', url: 'https://dblp.org/rec/conf/icml/NairH10.html', year: 2010 },
          { title: 'Gaussian Error Linear Units (GELUs)', url: 'https://arxiv.org/abs/1606.08415', year: 2016 },
          { title: 'Searching for Activation Functions', url: 'https://arxiv.org/abs/1710.05941', year: 2017 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 6.3 — Hidden Units',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'weight-initialization',
      name: 'Weight Initialization',
      aliases: ['Xavier/Glorot initialization', 'He/Kaiming initialization'],
      tier: 1,
      year: 2010,
      difficulty: 3,
      hook: "Scales each layer's starting weights by its fan-in and fan-out so signals neither explode nor vanish.",
      intuition:
        "A network's starting weights are not a detail to skip past. Each layer's output variance is roughly the " +
        "input variance multiplied by the number of inputs times the weights' own variance, so with the wrong scale " +
        "that variance compounds every layer — shrinking activations toward zero, or blowing them up, well before " +
        "training even begins, taking gradients with them either way. Glorot and Bengio derived a variance, roughly " +
        "2/(fan-in + fan-out), that keeps activations and gradients stable through many layers of a linear or tanh " +
        "network. He and colleagues later found ReLU changes the math: since it zeroes out roughly half its inputs, " +
        "it halves the variance passing through each layer, so they derived a compensating scale, roughly 2/fan-in, " +
        "specifically for ReLU-family networks. Neither is a universal constant — both are a variance matched to a " +
        "specific activation function's behaviour.",
      howItWorks: {
        summary:
          "Pick each layer's initial weight variance from its fan-in (and fan-out), matched to the activation " +
          'function that layer feeds into, so signal variance stays roughly constant across many layers.',
        steps: [
          'Determine the fan-in (number of inputs) and fan-out (number of outputs) of the layer being initialized.',
          'For tanh/sigmoid-family activations: draw weights with variance roughly 2/(fan-in + fan-out) (Xavier/Glorot).',
          "For ReLU-family activations: draw weights with variance roughly 2/fan-in (He/Kaiming), compensating for ReLU zeroing out about half the pre-activations.",
          'Sample from either a uniform or a Gaussian distribution scaled to that target variance — both are used in practice for the same target.',
          "Initialize biases to zero by default, since they don't multiply the signal the way weights do.",
        ],
      },
      hyperparameters: [
        {
          name: 'distribution shape',
          what: 'Uniform vs. Gaussian sampling at the target variance.',
          tuning:
            "Either is standard; PyTorch's nn.Linear default (kaiming_uniform_ with a well-known, community-" +
            "discussed a=sqrt(5) quirk inherited from Torch) is not exactly either paper's original prescription -- " +
            'call nn.init.kaiming_normal_ or nn.init.xavier_normal_ explicitly to match a specific paper\'s scheme.',
        },
      ],
      whenToUse: [
        'A network has more than a handful of layers, where naive fixed-variance initialization would compound into vanishing or exploding activations and gradients before training starts',
        'The network uses ReLU or a ReLU-family activation — use He/Kaiming initialization, matched to that specific variance-halving behaviour',
        'The network uses tanh/sigmoid/linear activations — use Xavier/Glorot instead, matched to that different assumption',
      ],
      whenNotToUse: [
        'The architecture has its own specialized, empirically-tuned initialization recipe (e.g. specific transformer or residual-network schemes) — a generic variance-scaling rule is a reasonable default, not a strict requirement over a better-tested alternative',
        'All weights in a layer are set to the same value, including all zero — every unit then computes an identical function and receives an identical gradient and never differentiates, regardless of how well-chosen the variance is (the symmetry problem, distinct from the scale problem these schemes solve)',
        'The network is shallow enough (a handful of layers) that the compounding effect these schemes address barely accumulates — the specific choice matters far less',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'initial-parameter-values',
      },
      math: {
        latex: [
          '\\mathrm{Var}(W) \\approx \\frac{2}{n_{in} + n_{out}} \\quad \\text{(Xavier/Glorot, tanh/sigmoid)}',
          '\\mathrm{Var}(W) \\approx \\frac{2}{n_{in}} \\quad \\text{(He/Kaiming, ReLU)}',
        ],
        notes:
          "He's extra factor of 2 relative to a naive 1/n_in scaling exactly compensates for a zero-centered input " +
          'distribution passed through ReLU, which sets roughly half of all pre-activations to zero and so halves the ' +
          'variance a plain linear-network analysis would predict.',
      },
      code: [
        'import torch.nn as nn',
        '',
        'relu_layer = nn.Linear(256, 256)',
        "nn.init.kaiming_normal_(relu_layer.weight, nonlinearity='relu')   # He/Kaiming: pairs with ReLU",
        'nn.init.zeros_(relu_layer.bias)',
        '',
        'tanh_layer = nn.Linear(256, 256)',
        'nn.init.xavier_normal_(tanh_layer.weight)                        # Xavier/Glorot: pairs with tanh/sigmoid',
      ].join('\n'),
      related: ['activation-functions', 'batch-and-layer-normalization', 'vanishing-gradients-and-universal-approximation'],
      references: {
        free: [{ title: 'Dive into Deep Learning — 5.4. Numerical Stability and Initialization', url: 'https://d2l.ai/chapter_multilayer-perceptrons/numerical-stability-and-init.html' }],
        papers: [
          {
            title: 'Understanding the Difficulty of Training Deep Feedforward Neural Networks',
            url: 'https://proceedings.mlr.press/v9/glorot10a.html',
            year: 2010,
          },
          {
            title: 'Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification',
            url: 'https://arxiv.org/abs/1502.01852',
            year: 2015,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 8.4 — Parameter Initialization Strategies',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'batch-and-layer-normalization',
      name: 'Batch & Layer Normalization',
      aliases: ['BatchNorm', 'LayerNorm'],
      tier: 1,
      year: 2015,
      difficulty: 3,
      hook: "Re-centers and rescales a layer's activations mid-network, computed over the batch or over each example.",
      intuition:
        "As a deep network trains, every layer's input distribution keeps shifting, because it depends on every " +
        'earlier layer\'s weights, which are themselves changing — the original batch normalization paper called this ' +
        '"internal covariate shift" and proposed fixing it directly: force each activation to zero mean and unit ' +
        'variance across the current mini-batch, then let a learned scale and shift undo that if the network decides ' +
        "it needs to. In practice this allows much higher learning rates and less careful initialization. What's " +
        "genuinely still debated is why it works — later research found batch norm's benefit has little to do with " +
        'reducing internal covariate shift at all, and comes instead from making the loss landscape measurably ' +
        'smoother. Layer normalization solves a related but different problem: instead of normalizing across the ' +
        'batch, it normalizes across a single example\'s own features, which makes it independent of batch size and ' +
        'composition — exactly what recurrent networks and transformers need.',
      howItWorks: {
        summary:
          'Compute a mean and variance over some slice of the current activations — the mini-batch, per feature, for ' +
          'BatchNorm, or the features of one example, for LayerNorm — normalize to zero mean and unit variance, then ' +
          'apply a learned per-channel scale and shift.',
        steps: [
          'Compute the mean and variance of the pre-activation values over the chosen slice: across the mini-batch per feature (BatchNorm), or across features per example (LayerNorm).',
          'Normalize: subtract the mean and divide by the standard deviation, plus a small epsilon for numerical stability.',
          'Apply a learned scale (gamma) and shift (beta) per channel, so the layer can undo the normalization if that turns out to help the loss.',
          '(BatchNorm only) Maintain a running average of the mean and variance during training, and use those running statistics, not the current batch\'s, at inference time.',
          'Pass the result on to the next layer or activation function.',
        ],
      },
      hyperparameters: [
        {
          name: 'momentum (BatchNorm running-statistic update rate)',
          what: 'How quickly the running mean/variance used at inference tracks new mini-batches.',
          tuning:
            "PyTorch's nn.BatchNorm defaults to 0.1. Lower it if per-batch statistics are noisy, e.g. with small batch sizes.",
        },
        {
          name: 'eps',
          what: 'Small constant added to the variance before the square root, avoiding division by zero.',
          tuning: "PyTorch defaults to 1e-5 for both BatchNorm and LayerNorm; rarely needs changing.",
        },
      ],
      whenToUse: [
        'Training deep feedforward or convolutional networks with reasonably large, consistent batch sizes — BatchNorm, to allow higher learning rates and reduce sensitivity to initialization',
        'Training RNNs, transformers, or anything with variable-length sequences or very small/single-example batches — LayerNorm, since its statistics do not depend on batch size or composition',
        'Training is unstable or unusually sensitive to the learning rate and initialization chosen — either form of normalization typically smooths the loss landscape enough to help',
      ],
      whenNotToUse: [
        'Batch size is very small (e.g. 1-2) or varies at inference in a way that makes running-batch statistics unreliable — BatchNorm specifically degrades badly here; prefer LayerNorm or GroupNorm',
        'The model must behave identically between training and inference with no extra state — BatchNorm\'s behaviour genuinely differs between the two (batch statistics vs. running statistics), a common source of bugs when train/eval mode is set incorrectly',
        'Inference is extremely latency-critical — even LayerNorm\'s per-example mean/variance computation is a cost worth avoiding at the margin',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'image', 'text', 'timeseries'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'normalized-activations',
      },
      math: {
        latex: [
          '\\hat{x} = \\frac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}}, \\qquad y = \\gamma \\hat{x} + \\beta',
        ],
        notes:
          'BatchNorm computes mu, sigma^2 over the mini-batch, per feature; LayerNorm computes them over the ' +
          "features, per example. Santurkar et al. (2018) directly challenged the original paper's own explanation " +
          'for why batch norm helps: their experiments found "distributional stability of layer inputs has little to ' +
          'do with the success of BatchNorm," and identified a smoother, more predictable loss landscape as the ' +
          'actual mechanism — a genuine, still-cited empirical correction to the 2015 paper\'s stated motivation, not ' +
          'a settled textbook fact.',
      },
      code: [
        'import torch.nn as nn',
        '',
        '# BatchNorm: statistics over the batch, per feature -- typical for conv/feedforward nets',
        'conv_block = nn.Sequential(',
        '    nn.Conv2d(3, 64, kernel_size=3),',
        '    nn.BatchNorm2d(64),         # normalizes each of the 64 channels across the batch',
        '    nn.ReLU(),',
        ')',
        '',
        '# LayerNorm: statistics over the features, per example -- typical for transformers/RNNs',
        'transformer_block = nn.Sequential(',
        '    nn.Linear(512, 512),',
        '    nn.LayerNorm(512),          # normalizes each example\'s 512 features independently',
        '    nn.GELU(),',
        ')',
      ].join('\n'),
      related: ['weight-initialization', 'dropout-and-weight-decay', 'optimizers'],
      references: {
        free: [{ title: 'Dive into Deep Learning — 8.5. Batch Normalization', url: 'https://d2l.ai/chapter_convolutional-modern/batch-norm.html' }],
        papers: [
          {
            title: 'Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift',
            url: 'https://arxiv.org/abs/1502.03167',
            year: 2015,
          },
          {
            title: 'Layer Normalization',
            url: 'https://arxiv.org/abs/1607.06450',
            year: 2016,
          },
          {
            title: 'How Does Batch Normalization Help Optimization?',
            url: 'https://arxiv.org/abs/1805.11604',
            year: 2018,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 8.7.1 — Batch Normalization',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'dropout-and-weight-decay',
      name: 'Dropout & Weight Decay',
      aliases: ['L2 regularization for neural networks'],
      tier: 1,
      year: 2014,
      difficulty: 2,
      hook: 'Two different brakes on overfitting: randomly silence units during training, or shrink every weight a little each step.',
      intuition:
        'Dropout and weight decay are genuinely different mechanisms, bundled together here only because both are the ' +
        'standard first regularizers reached for in a neural network. Dropout randomly zeroes a fraction of units on ' +
        'every training forward pass, so no unit can rely on any particular co-adapted partner always being present — ' +
        "at test time every unit is used, with no zeroing at all. Weight decay instead adds a penalty proportional to " +
        'the sum of squared weights, continuously shrinking every weight toward zero on every optimizer step unless ' +
        "the data's own gradient pushes back — the same shrinkage ridge regression's L2 penalty produces in closed " +
        "form, just applied incrementally during training instead. For plain SGD these two ways of writing an L2 " +
        'penalty (in the loss, or as a direct weight update) are mathematically identical. For Adam they are not — ' +
        "which is exactly why AdamW exists as its own, separately-published fix.",
      howItWorks: {
        summary:
          'Dropout randomly zeroes a fraction of units on each training forward pass and rescales the survivors; ' +
          "weight decay adds a penalty on the weights' squared magnitude, shrinking every weight toward zero on every update.",
        steps: [
          'Dropout: on each training forward pass, independently zero out each unit\'s activation with probability p, then rescale the survivors by 1/(1-p) so their expected sum stays unchanged.',
          'Dropout: at inference, use every unit with no zeroing and no rescaling at all — the network is effectively different from any single training-time sample.',
          "Weight decay: add lambda times the sum of squared weights to the training loss (an L2 penalty), or subtract lambda times the weight directly from the parameter each update (decoupled weight decay) -- the two coincide for plain SGD.",
          'Weight decay: apply that shrinkage on every optimizer step, so weights not being actively reinforced by the data-fit gradient are continually pulled toward zero.',
        ],
      },
      hyperparameters: [
        {
          name: 'dropout p',
          what: 'Fraction of units zeroed per forward pass.',
          tuning:
            "Srivastava et al. found p around 0.5 for hidden layers and closer to 0.2 for input layers worked well " +
            "across their experiments; PyTorch's nn.Dropout defaults to p=0.5.",
        },
        {
          name: 'weight_decay (lambda)',
          what: 'Strength of the shrinkage penalty applied to the weights.',
          tuning:
            "Commonly swept on a log scale (roughly 1e-5 to 1e-1). PyTorch's AdamW defaults weight_decay=0.01; " +
            "because AdamW decouples it from the adaptive gradient step, it can be tuned largely independently of " +
            'the learning rate, which is not true for L2-regularized Adam.',
        },
      ],
      whenToUse: [
        'Dropout: a large, overparameterized network (many units per layer) is fitting the training set noticeably better than a held-out validation set',
        'Weight decay: as a near-default, low-cost regularizer on almost any network — it rarely hurts noticeably and often measurably improves generalization',
        "Using Adam or another adaptive optimizer with a weight-decay-style penalty — use AdamW's decoupled weight decay specifically, since naive L2 added to the loss is not equivalent for adaptive methods (see math notes)",
      ],
      whenNotToUse: [
        'Dropout: the network is already small relative to the data and underfitting — dropout adds noise that makes an already-struggling fit worse',
        "Dropout: applied carelessly to convolutional feature maps or alongside normalization layers — dropping individual, spatially-correlated pixels achieves much less than dropping whole channels, and combining dropout with batch normalization can have the two techniques' noise sources fight each other",
        'Weight decay: the model is already well regularized by a large dataset and heavy data augmentation, and additional shrinkage measurably hurts training fit without a validation gain — worth ablating rather than assuming it always helps',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'image', 'text', 'audio'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'regularized-training-procedure',
      },
      math: {
        latex: [
          '\\tilde{h}_i = \\frac{m_i}{1-p}\\, h_i, \\quad m_i \\sim \\mathrm{Bernoulli}(1-p) \\quad \\text{(dropout, training only)}',
          '\\mathcal{L}_{\\text{reg}} = \\mathcal{L} + \\frac{\\lambda}{2}\\lVert \\mathbf{w} \\rVert_2^2 \\quad \\text{(L2 penalty)}',
        ],
        notes:
          "For plain SGD, adding (lambda/2)*||w||^2 to the loss and directly subtracting eta*lambda*w from the " +
          'weights every step are the same update — L2 regularization and weight decay coincide exactly. For Adam ' +
          "they do not: Adam divides each parameter's gradient, including the L2 penalty's own contribution to it, " +
          "by that parameter's own running estimate of gradient magnitude, so weights with large past gradients get " +
          'proportionally less penalty applied — an effect essentially nobody intends. Loshchilov & Hutter\'s AdamW ' +
          "applies the shrinkage directly to the weights, outside that adaptive-denominator step, restoring the " +
          'plain-SGD equivalence and, per their results, improving generalization measurably over Adam-with-L2 on ' +
          'image classification. This is a real, precise, commonly-garbled distinction, not a rebranding of the same idea.',
      },
      code: [
        'import torch.nn as nn',
        'import torch.optim as optim',
        '',
        'model = nn.Sequential(',
        '    nn.Linear(784, 256), nn.ReLU(), nn.Dropout(p=0.5),   # zero ~half the units per forward pass',
        '    nn.Linear(256, 10),',
        ')',
        '',
        '# AdamW: weight decay applied directly to the weights, decoupled from the adaptive gradient step --',
        '# NOT the same as Adam(weight_decay=...), which folds it into the L2-penalized gradient instead',
        'optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)',
      ].join('\n'),
      // overfitting-and-regularization (Belt) and ridge-regression (Mercury) are the direct
      // cross-body links -- weight decay literally is L2/ridge's penalty applied per SGD step,
      // not merely analogous to it (with the AdamW nuance above being exactly why "literally"
      // needs that qualifier for adaptive optimizers).
      related: ['overfitting-and-regularization', 'ridge-regression', 'optimizers'],
      references: {
        free: [
          { title: 'PyTorch docs — torch.nn.Dropout', url: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.Dropout.html' },
          { title: 'PyTorch docs — torch.optim.AdamW', url: 'https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html' },
        ],
        papers: [
          {
            title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
            url: 'https://jmlr.org/papers/v15/srivastava14a.html',
            year: 2014,
          },
          {
            title: 'A Simple Weight Decay Can Improve Generalization',
            url: 'https://proceedings.neurips.cc/paper/1991/hash/8eefcfdf5990e441f0fb6f3fad709e21-Abstract.html',
            year: 1991,
          },
          {
            title: 'Decoupled Weight Decay Regularization',
            url: 'https://arxiv.org/abs/1711.05101',
            year: 2017,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 7.12 — Dropout',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'optimizers',
      name: 'Optimizers (Momentum, RMSProp, Adam, AdamW)',
      aliases: ['adaptive gradient methods'],
      tier: 1,
      year: 1964,
      difficulty: 3,
      hook: "Reshapes SGD's raw step using past gradients — momentum smooths it, RMSProp and Adam scale it per parameter.",
      intuition:
        'Plain gradient descent takes each step using only the current gradient, which can be slow or oscillate badly ' +
        'on an ill-conditioned loss surface (steep in one direction, nearly flat in another). Momentum, the oldest ' +
        'idea here, accumulates a running average of past gradients — a velocity — so a consistent downhill direction ' +
        'accelerates while an oscillating one partly cancels out, like a heavy ball retaining inertia through a narrow ' +
        "valley. RMSProp instead divides each parameter's own gradient by a running average of that same parameter's " +
        'recent squared gradient magnitude, giving every parameter its own effective step size — frequently-updated ' +
        'parameters get dampened, rarely-updated ones get amplified. Adam combines both ideas at once, tracking a ' +
        'momentum-like first moment and an RMSProp-like second moment together. AdamW then fixes a specific, subtle ' +
        "flaw in how Adam interacts with weight decay, by applying that shrinkage directly to the weights instead of " +
        "folding it into the adaptively-scaled gradient.",
      howItWorks: {
        summary:
          "Replace plain SGD's raw per-step gradient with a running combination of past gradients (momentum), a " +
          'per-parameter adaptive scale (RMSProp), or both together (Adam/AdamW).',
        steps: [
          'Momentum: maintain a velocity v, updated each step as v = beta*v + gradient, and step the parameters by -eta*v instead of -eta*gradient directly.',
          "RMSProp: maintain a running average s of each parameter's squared gradient, s = beta*s + (1-beta)*gradient^2, and divide the step by sqrt(s) + epsilon.",
          'Adam: maintain both a first-moment estimate (momentum-like) and a second-moment estimate (RMSProp-like), bias-correct each early in training since both start at zero, and combine them into the update.',
          'AdamW: compute the Adam update as usual, then apply weight decay as a separate, direct shrinkage of the weights rather than folding it into the gradient before the adaptive-scaling step.',
          'Repeat every training step, carrying each running statistic forward from the previous step.',
        ],
      },
      hyperparameters: [
        {
          name: 'beta1, beta2 (Adam/AdamW)',
          what: 'Decay rates for the first- and second-moment running averages.',
          tuning: "Kingma & Ba's defaults, beta1=0.9 and beta2=0.999, are used almost universally and rarely need changing.",
        },
        {
          name: 'weight_decay (AdamW)',
          what: 'The decoupled shrinkage coefficient applied directly to the weights.',
          tuning:
            "PyTorch's default is 0.01. Sweep on a log scale, largely independently of the learning rate -- that " +
            "independence is exactly what AdamW's decoupling makes possible.",
        },
      ],
      whenToUse: [
        'Training is slow or visibly oscillating on an ill-conditioned loss surface (steep in one direction, flat in another) — momentum directly targets this',
        'Different parameters need very different effective step sizes, e.g. sparse embeddings alongside dense layers — RMSProp or Adam\'s per-parameter scaling handles this without hand-tuning per-layer learning rates',
        'Training a large modern network with no strong reason to hand-tune plain SGD — Adam or AdamW is the standard, robust default that needs little tuning to get a reasonable result quickly',
      ],
      whenNotToUse: [
        'Final generalization matters more than fast initial convergence and careful tuning is affordable — well-tuned SGD with momentum sometimes generalizes slightly better than Adam-family optimizers on some vision benchmarks, at the cost of more learning-rate-schedule tuning',
        'You are applying weight decay with plain Adam rather than AdamW — the L2-style penalty interacts unpredictably with Adam\'s adaptive denominator (see dropout-and-weight-decay); prefer AdamW whenever weight decay matters',
        'Optimizer memory is a hard constraint — Adam/AdamW store two extra moment tensors per parameter, roughly tripling optimizer state versus plain SGD, which matters at very large model scale',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'audio', 'timeseries'],
        dataSize: ['small', 'medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'optimized-parameter-vector',
      },
      math: {
        latex: [
          'v_t = \\beta_1 v_{t-1} + (1-\\beta_1) g_t, \\qquad s_t = \\beta_2 s_{t-1} + (1-\\beta_2) g_t^2',
          '\\theta_t = \\theta_{t-1} - \\eta\\, \\frac{\\hat{v}_t}{\\sqrt{\\hat{s}_t} + \\epsilon} \\quad \\text{(Adam, } \\hat v_t, \\hat s_t \\text{ bias-corrected)}',
        ],
        notes:
          "RMSProp was never formally published — it comes from lecture 6e of Geoffrey Hinton's 2012 Coursera " +
          "course, and Kingma & Ba's Adam paper itself credits RMSProp and momentum as its two direct ancestors. " +
          "Adam's bias correction specifically compensates for v and s both being initialized at zero, which would " +
          'otherwise bias early-training estimates toward zero exactly when the running averages have had the fewest ' +
          'steps to accumulate real signal.',
      },
      code: [
        'import torch.optim as optim',
        '',
        '# momentum: SGD with a velocity term',
        'opt_sgd = optim.SGD(model.parameters(), lr=0.01, momentum=0.9)',
        '',
        '# RMSProp: per-parameter adaptive scaling via a running squared-gradient average',
        'opt_rmsprop = optim.RMSprop(model.parameters(), lr=0.001, alpha=0.99)',
        '',
        '# Adam: momentum + RMSProp combined',
        'opt_adam = optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999))',
        '',
        '# AdamW: same as Adam, but weight decay is decoupled from the adaptive step',
        'opt_adamw = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)',
      ].join('\n'),
      // gradient-descent (Sol) is the direct parent -- every method here still follows the
      // negative-gradient direction that entry establishes, just reshaping the step itself.
      related: ['gradient-descent', 'backpropagation-and-autodiff', 'dropout-and-weight-decay'],
      references: {
        free: [
          { title: 'Dive into Deep Learning — 12.6. Momentum', url: 'https://d2l.ai/chapter_optimization/momentum.html' },
          { title: 'Dive into Deep Learning — 12.10. Adam', url: 'https://d2l.ai/chapter_optimization/adam.html' },
        ],
        papers: [
          {
            title: 'Some Methods of Speeding up the Convergence of Iteration Methods',
            url: 'https://doi.org/10.1016/0041-5553(64)90137-5',
            year: 1964,
          },
          {
            title: 'Adam: A Method for Stochastic Optimization',
            url: 'https://arxiv.org/abs/1412.6980',
            year: 2014,
          },
          {
            title: 'Decoupled Weight Decay Regularization',
            url: 'https://arxiv.org/abs/1711.05101',
            year: 2017,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 8.3-8.5 — Momentum, AdaGrad, RMSProp and Adam',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'vanishing-gradients-and-universal-approximation',
      name: 'Vanishing Gradients & Universal Approximation',
      tier: 2,
      year: 1989,
      difficulty: 3,
      hook: 'One theorem says a big enough network can approximate anything; another explains why training it can still fail.',
      intuition:
        'The universal approximation theorem is a purely existential guarantee: a feedforward network with a single ' +
        'hidden layer, given enough units, can approximate any continuous function on a bounded input region to any ' +
        'desired accuracy — proved independently by Cybenko (1989) for sigmoidal units and by Hornik, Stinchcombe and ' +
        'White (1989) for a broader class of activations. It says nothing about how many units that takes, or whether ' +
        'gradient descent can actually find the right weights, which is where the vanishing gradient problem enters. ' +
        'In a deep network, the gradient reaching an early layer is a product of many per-layer derivatives; with ' +
        'saturating activations like sigmoid or tanh, each factor is a fraction less than one, so the product shrinks ' +
        'toward zero roughly exponentially with depth, and early layers stop learning almost entirely — a problem ' +
        "first rigorously identified by Hochreiter in 1991. Together the two results explain both why deep networks " +
        'are theoretically powerful and why training them was, for decades, genuinely difficult in practice.',
      howItWorks: {
        summary:
          "Universal approximation is an existence proof about a network's representational capacity; the vanishing " +
          'gradient problem is a separate, practical obstacle to actually finding good weights by gradient descent in ' +
          'a deep or recurrent network.',
        steps: [
          'Universal approximation: for any continuous target function on a bounded domain and any accuracy tolerance, there exists a single-hidden-layer network with enough units whose output stays within that tolerance everywhere.',
          'That guarantee is silent on how many units are needed, and on whether an optimizer can actually find them — it establishes what is representable, not what is learnable in practice.',
          "Vanishing gradients: during backpropagation, the gradient reaching an early layer is the product of every later layer's local derivative.",
          'If those per-layer derivatives are consistently below one, as with saturating sigmoid/tanh activations or many steps of backpropagation-through-time, the product shrinks exponentially with depth, and early-layer weights receive almost no gradient signal.',
        ],
      },
      whenToUse: [
        'You want a theoretical justification for using a neural network on a problem at all — universal approximation guarantees the right answer is representable, in principle, by some network in the class',
        'Training loss stalls with near-zero gradients reaching a network\'s early layers, and you want to name the underlying mechanism before reaching for a fix (better activations, normalization, initialization, or residual connections)',
      ],
      whenNotToUse: [
        'You want a concrete architecture recipe — universal approximation guarantees existence, not a practical, appropriately-sized, actually-learnable network; treat it as motivation, not an engineering method',
        'The training problem you\'re diagnosing is exploding, not vanishing, gradients — the same product-of-derivatives mechanism can also grow without bound rather than shrink, and needs a different diagnosis (and different fixes, like gradient clipping) than vanishing gradients does',
      ],
      facets: {
        task: ['regression', 'classification'],
        dataType: ['tabular', 'text', 'image', 'timeseries'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'theoretical-property-of-network-capacity-and-trainability',
      },
      related: ['multilayer-perceptron', 'activation-functions', 'weight-initialization', 'batch-and-layer-normalization'],
      references: {
        free: [{ title: 'Wikipedia — Vanishing gradient problem', url: 'https://en.wikipedia.org/wiki/Vanishing_gradient_problem' }],
        papers: [
          {
            title: 'Multilayer Feedforward Networks are Universal Approximators',
            url: 'https://doi.org/10.1016/0893-6080(89)90020-8',
            year: 1989,
          },
          {
            title: 'Approximation by Superpositions of a Sigmoidal Function',
            url: 'https://doi.org/10.1007/BF02551274',
            year: 1989,
          },
          {
            title: 'Learning Long-Term Dependencies with Gradient Descent is Difficult',
            url: 'https://doi.org/10.1109/72.279181',
            year: 1994,
          },
        ],
      },
    },
  ],
} satisfies Body;
