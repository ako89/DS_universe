/**
 * Echo — Recurrent Networks & Sequences. See PLAN.md §3 for the full moon list.
 *
 * All 6 moons from PLAN.md §3, at their marked tiers: 5 Tier 1 (vanilla-rnn-and-bptt, lstm, gru,
 * seq2seq-encoder-decoder, bahdanau-luong-attention) and 1 Tier 2 stub (tcns-and-wavenet).
 *
 * `eraRange` spans 1990 (Elman's "Finding Structure in Time" and, independently the same year,
 * Werbos's "Backpropagation Through Time" paper formalizing the training algorithm) to 2016
 * (van den Oord et al.'s WaveNet, the earlier of the two works bundled into tcns-and-wavenet —
 * Bai, Kolter & Koltun's paper coining "TCN" as a general term follows in 2018 and is cited
 * inside that entry, matching jupiter.ts's optics-and-mean-shift precedent of dating a bundled
 * entry to the earlier of its two techniques).
 *
 * `bahdanau-luong-attention` is written as two distinct, separately-citable papers — Bahdanau,
 * Cho & Bengio (arXiv 1409.0473, ICLR 2015) introducing additive attention, and Luong, Pham &
 * Manning (arXiv 1508.04025, 2015) proposing simplified dot-product/general/concat variants a
 * few months later — not folded into one. `year: 2014` is used because that is Bahdanau's arXiv
 * submission year (the earlier of the two), with Luong's 2015 date stated explicitly in its own
 * reference entry and in the intuition prose.
 *
 * The self-attention lineage claim in that entry's `math.notes` was written after reading
 * nova.ts's `self-attention` entry and cross-checking the mechanical distinction against D2L's
 * attention-scoring-functions and self-attention chapters (both fetched directly, see the batch
 * report): Bahdanau/Luong attention is cross-attention — a decoder state (query) attends over a
 * *different* sequence's encoder states (keys/values), computed as one extra alignment step
 * bolted onto an otherwise ordinary RNN. Vaswani et al. (2017), already `self-attention` in
 * nova.ts, generalizes the same query/key/value scoring but lets a sequence attend to *itself*
 * and discards the recurrence entirely, making attention the whole computation of a layer rather
 * than a small add-on. Luong's plain dot-product score is mechanically the un-scaled special case
 * of the Transformer's score function — the real basis for "direct ancestor," not just shared
 * vocabulary.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source (arXiv /abs/ HTML pages and D2L
 * chapters throughout, never a PDF summary for a specific claim), verify every URL, then write.
 * DOIs for the two LSTM papers (Hochreiter & Schmidhuber 1997; Gers, Schmidhuber & Cummins 2000)
 * were confirmed via https://api.crossref.org/works/<doi>, not the publisher, per the PDF-fetch
 * warning. No PDF-derived numeric claim appears anywhere in this file.
 *
 * Cross-body links: vanilla-rnn-and-bptt → vanishing-gradients-and-universal-approximation
 * (Prometheus, same batch) is the direct forward reference to the general phenomenon this
 * architecture first surfaces concretely. vanilla-rnn-and-bptt and lstm → hidden-markov-models
 * (Neptune) is a genuine "older alternative for sequence modeling" contrast, not decoration.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'echo',
  name: 'Echo',
  segment: 'Recurrent Networks & Sequences',
  hook: 'Sequences processed one step at a time, carrying a memory forward — and the gates, bottlenecks and fixes that history produced.',
  summary:
    'Echo covers the architectures built to model order and memory in data: plain recurrence and its training algorithm, the ' +
    'gated cells that made long sequences learnable, the encoder-decoder pattern for translating one sequence into another, ' +
    "the attention mechanism bolted onto it to fix that pattern's bottleneck, and a non-recurrent convolutional alternative.",
  eraRange: [1990, 2016],
  moons: [
    {
      id: 'vanilla-rnn-and-bptt',
      name: 'Vanilla RNN & BPTT',
      aliases: ['simple recurrent network', 'Elman network', 'backpropagation through time'],
      tier: 1,
      year: 1990,
      difficulty: 3,
      hook: 'Carries a hidden state through a sequence, then trains by unrolling every step into one feedforward graph.',
      intuition:
        'Imagine reading a sentence one word at a time while keeping a running note of what you have understood so far, ' +
        'updating that note after every word rather than starting fresh each time. A vanilla RNN does exactly this: at ' +
        'each time step it combines the current input with its previous hidden state, through the same shared weights, ' +
        'to produce a new hidden state. That shared-weight recurrence is what lets it handle sequences of any length ' +
        'with a fixed number of parameters. Training it means unrolling the recurrence for the whole sequence into one ' +
        'long feedforward computation graph — the same weight matrix appears once per time step — then backpropagating ' +
        'through that unrolled graph and summing the gradient contributions from every step where each weight appears. ' +
        'This is backpropagation through time (BPTT). Because the same matrix is multiplied in in every step, its ' +
        'gradient contribution compounds multiplicatively with sequence length, which is the central weakness: over ' +
        'long sequences the gradient tends to vanish or explode before training can use it.',
      howItWorks: {
        summary:
          'Update a hidden state at each time step from the previous hidden state and the current input through a ' +
          'shared weight matrix, then train by unrolling the whole sequence into one graph and backpropagating through it.',
        steps: [
          'Initialize a hidden state vector, typically zero, before the first time step.',
          'At each time step, compute a new hidden state from the previous hidden state and the current input via a shared weight matrix and a tanh nonlinearity.',
          'Optionally produce an output at each time step as a function of the current hidden state.',
          'To train, unroll the recurrence across the full sequence length into one computational graph that reuses the same weights at every step.',
          'Backpropagate the loss through this unrolled graph (BPTT), summing the gradient for each shared weight across every time step it occurs in.',
          'Update the weights with the summed gradient; for very long sequences, truncate the unrolling window (truncated BPTT) to bound memory and compute.',
        ],
      },
      hyperparameters: [
        {
          name: 'hidden_size',
          what: 'Dimensionality of the hidden state vector carried between time steps.',
          tuning:
            'No architectural default — larger hidden states hold more information per step but cost more compute ' +
            'and are more prone to overfitting on small datasets. Start small and grow while validation loss keeps improving.',
        },
        {
          name: 'truncation length (BPTT window)',
          what: 'How many time steps gradients are backpropagated through before being cut off.',
          tuning:
            'Shorter windows bound memory and compute and stabilize training, at the cost of not learning dependencies ' +
            'longer than the window. Set it to at least the longest dependency the task plausibly needs, if that is known.',
        },
      ],
      whenToUse: [
        'The sequence is short to moderate in length (roughly under a hundred steps), so gradients do not have to travel far to stay useful',
        'You need a lightweight, low-parameter baseline recurrent model before reaching for LSTM or GRU',
        'The task genuinely depends on order — the same values in a different order should produce a different output — not just an unordered set of features',
        'Compute or memory is tightly constrained and a much smaller parameter count than a gated architecture matters',
      ],
      whenNotToUse: [
        'The sequence is long (roughly beyond a hundred steps) — vanishing or exploding gradients through BPTT make it fail to learn dependencies that far back; use LSTM or GRU instead',
        'Training needs to be stable without careful weight initialization, gradient clipping, and a small learning rate — vanilla RNNs are unusually sensitive to all three',
        'The task needs a well-calibrated probabilistic model of discrete states over time — a hidden Markov model offers that directly, with tractable exact inference a vanilla RNN does not',
        'You need the sequence processed in parallel rather than one step at a time — the recurrence is inherently sequential and cannot be parallelized across time during training',
      ],
      facets: {
        task: ['representation', 'forecasting', 'generation'],
        dataType: ['text', 'timeseries', 'audio'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'sequential-hidden-states',
      },
      math: {
        latex: [
          'h_t = \\tanh(W_{hh} h_{t-1} + W_{xh} x_t + b_h)',
          '\\frac{\\partial L}{\\partial W_{hh}} = \\sum_{t=1}^{T} \\frac{\\partial L_t}{\\partial h_t} \\prod_{k=t}^{2} \\frac{\\partial h_k}{\\partial h_{k-1}}',
        ],
        notes:
          'The product of Jacobians in the second line is the source of the vanishing/exploding gradient problem: each ' +
          'factor is dominated by W_hh, so the product shrinks toward zero or grows without bound roughly geometrically ' +
          'in sequence length T, depending on whether the spectral radius of W_hh is below or above 1. This is the same ' +
          'weight matrix reused at every step, which is what makes BPTT parameter-efficient and what makes long-range ' +
          'credit assignment fail — LSTM and GRU exist specifically to give the gradient a path that does not compound this way.',
      },
      complexity: {
        train: 'O(T · d^2) per sequence for hidden size d and length T, dominated by the shared weight-matrix multiply at each of the T steps',
        predict: 'O(d^2) per time step',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        '# batch_first=True: input is (batch, seq_len, input_size)',
        'rnn = nn.RNN(input_size=32, hidden_size=64, num_layers=1, batch_first=True)',
        '',
        'x = torch.randn(16, 50, 32)              # 16 sequences, 50 steps, 32 features',
        'outputs, h_n = rnn(x)                    # outputs: (16, 50, 64) — hidden state at every step',
        '                                           # h_n: (1, 16, 64) — final hidden state only',
        '',
        '# gradient clipping is standard practice, guarding against the exploding-gradient side of BPTT',
        'torch.nn.utils.clip_grad_norm_(rnn.parameters(), max_norm=5.0)',
      ].join('\n'),
      // vanishing-gradients-and-universal-approximation (Prometheus, same batch) is the direct
      // forward link: this entry's math.notes derives exactly the phenomenon that entry names.
      related: ['lstm', 'gru', 'vanishing-gradients-and-universal-approximation', 'hidden-markov-models'],
      references: {
        free: [
          { title: 'Dive into Deep Learning — Recurrent Neural Networks', url: 'https://d2l.ai/chapter_recurrent-neural-networks/rnn.html' },
          { title: 'Dive into Deep Learning — Backpropagation Through Time', url: 'https://d2l.ai/chapter_recurrent-neural-networks/bptt.html' },
        ],
        papers: [
          { title: 'Finding Structure in Time', url: 'https://doi.org/10.1207/s15516709cog1402_1', year: 1990 },
          { title: 'Backpropagation Through Time: What It Does and How to Do It', url: 'https://doi.org/10.1109/5.58337', year: 1990 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 10 — Sequence Modeling: Recurrent and Recursive Nets',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'lstm',
      name: 'LSTM',
      aliases: ['Long Short-Term Memory'],
      tier: 1,
      year: 1997,
      difficulty: 4,
      hook: 'Adds a separate cell state and learned gates that decide what to keep, add, and expose at every step.',
      intuition:
        "A vanilla RNN's hidden state gets overwritten at every step, which is exactly why gradients compound and " +
        'vanish over long sequences. LSTM adds a second, separate piece of memory — the cell state — that is updated ' +
        "additively rather than overwritten, giving gradients a path that does not have to pass through the squashed, " +
        "repeatedly-multiplied hidden-state update. Three sigmoid gates control that path: a forget gate decides what " +
        'fraction of the old cell state to keep, an input gate decides how much of a new candidate value to add, and ' +
        'an output gate decides how much of the (squashed) cell state to expose as the hidden state used at that step. ' +
        "Each gate is its own small neural network learned from the current input and previous hidden state, so the " +
        "network learns when to remember and when to let go, rather than following a fixed rule. One historical " +
        'wrinkle worth knowing: the original 1997 LSTM had no forget gate at all — cell state only ever grew — and the ' +
        'forget gate was added three years later by Gers, Schmidhuber and Cummins (2000) to fix exactly that problem.',
      howItWorks: {
        summary:
          'Maintain a separate cell state alongside the hidden state, and use three learned gates — forget, input, ' +
          'output — to control what enters, leaves, and gets exposed from that cell state at each time step.',
        steps: [
          'Compute the forget gate: a sigmoid over the previous hidden state and current input, giving a fraction of the old cell state to keep.',
          'Compute the input gate and a candidate update (tanh), giving what new information to add and how much of it to use.',
          'Update the cell state as forget-gated old state plus input-gated candidate — an additive update, not an overwrite.',
          'Compute the output gate: a sigmoid deciding how much of the (tanh-squashed) new cell state to expose.',
          "Emit the new hidden state as the output gate's fraction of the squashed cell state.",
          'Pass both the hidden state and the cell state to the next time step; train the whole unrolled sequence via BPTT as with a vanilla RNN.',
        ],
      },
      hyperparameters: [
        {
          name: 'hidden_size',
          what: 'Dimensionality shared by the hidden state and the cell state.',
          tuning:
            'No built-in default (PyTorch requires it explicitly). Each of the four gate/candidate weight matrices ' +
            'scales with hidden_size squared, so raising it costs roughly four times what the same increase costs a vanilla RNN.',
        },
        {
          name: 'num_layers',
          what: 'Number of stacked LSTM layers, each feeding its hidden-state sequence into the next.',
          tuning: "PyTorch's nn.LSTM defaults to 1. Stack 2–3 for more capacity on large datasets; watch for overfitting and slower training beyond that.",
        },
      ],
      whenToUse: [
        'Sequences have long-range dependencies where information from many steps back must still influence the current output',
        'You want a mature, extensively battle-tested default for recurrent sequence modeling rather than a newer or simpler alternative',
        'The data is genuinely sequential and order-dependent — language, time series, sensor streams, symbolic music',
        'You can afford roughly four times the per-step parameters and compute of a vanilla RNN for the same hidden size',
      ],
      whenNotToUse: [
        'Sequences run into the thousands of steps or more — even LSTM struggles at that range; consider attention-based or convolutional (TCN/WaveNet) alternatives instead',
        'Compute or parameter budget is tight and GRU has been shown comparable on your task family — GRU gives similar performance with about three-quarters the gate parameters',
        'Training throughput matters most and the sequence is long — the recurrence is inherently sequential and cannot be parallelized across time the way self-attention can',
        'The task needs an interpretable, explicit model of discrete states and transition probabilities — a hidden Markov model gives that directly, which an LSTM does not',
      ],
      facets: {
        task: ['representation', 'forecasting', 'generation'],
        dataType: ['text', 'timeseries', 'audio'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'sequential-hidden-states',
      },
      math: {
        latex: [
          'f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f), \\quad i_t = \\sigma(W_i [h_{t-1}, x_t] + b_i), \\quad o_t = \\sigma(W_o [h_{t-1}, x_t] + b_o)',
          '\\tilde{C}_t = \\tanh(W_C [h_{t-1}, x_t] + b_C), \\qquad C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t',
          'h_t = o_t \\odot \\tanh(C_t)',
        ],
        notes:
          'The additive update to C_t in the second line — rather than a repeated matrix multiply, as in a vanilla ' +
          "RNN's hidden state — is what Hochreiter & Schmidhuber called the \"constant error carousel\": when f_t is " +
          'close to 1, gradients flowing back through C_t are neither squashed nor amplified at that step, giving them ' +
          'a much longer path before vanishing. The forget gate f_t is not in the 1997 original — Gers, Schmidhuber & ' +
          'Cummins added it in 2000 after finding that without it, cell state in continuously-running networks could ' +
          'grow unboundedly and eventually saturate the output gate.',
      },
      complexity: {
        train: 'O(T · d^2) per sequence, with roughly 4x the per-step weight-matrix compute of a vanilla RNN of the same hidden size d (four gate/candidate matrices instead of one)',
        predict: 'O(d^2) per time step',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        'lstm = nn.LSTM(input_size=32, hidden_size=64, num_layers=1, batch_first=True)',
        '',
        'x = torch.randn(16, 50, 32)                    # 16 sequences, 50 steps, 32 features',
        'outputs, (h_n, c_n) = lstm(x)',
        '# outputs: (16, 50, 64) hidden state at every step',
        '# h_n, c_n: (1, 16, 64) final hidden state and final cell state',
        '',
        'torch.nn.utils.clip_grad_norm_(lstm.parameters(), max_norm=5.0)',
      ].join('\n'),
      related: ['gru', 'vanilla-rnn-and-bptt', 'seq2seq-encoder-decoder', 'hidden-markov-models'],
      references: {
        free: [{ title: 'Dive into Deep Learning — Long Short-Term Memory (LSTM)', url: 'https://d2l.ai/chapter_recurrent-modern/lstm.html' }],
        papers: [
          { title: 'Long Short-Term Memory', url: 'https://doi.org/10.1162/neco.1997.9.8.1735', year: 1997 },
          { title: 'Learning to Forget: Continual Prediction with LSTM', url: 'https://doi.org/10.1162/089976600300015015', year: 2000 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 10 — Sequence Modeling: Recurrent and Recursive Nets',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'gru',
      name: 'GRU',
      aliases: ['Gated Recurrent Unit'],
      tier: 1,
      year: 2014,
      difficulty: 3,
      hook: "Folds LSTM's forget-and-input logic into one update gate and drops the separate cell state entirely.",
      intuition:
        "GRU asks whether LSTM's separate cell state and three gates are more machinery than most sequences need. It " +
        'keeps a single hidden state — no separate cell state to carry — and controls it with two gates instead of ' +
        'three. A reset gate decides how much of the previous hidden state to use when forming a candidate for the ' +
        'new state; an update gate then decides the blend between the old hidden state and that candidate, taking on ' +
        "the combined job LSTM splits across its forget and input gates. The result has fewer weight matrices than " +
        'an LSTM of the same hidden size and is cheaper to compute per step. GRU was not introduced as a standalone ' +
        'idea — Cho et al. (2014) proposed it as the recurrent unit inside their RNN encoder-decoder paper for machine ' +
        'translation. Whether it actually beats LSTM is genuinely unsettled: Chung et al.\'s (2014) empirical ' +
        'comparison on music and speech modeling found GRU broadly comparable to LSTM, not a clean winner either way — ' +
        'the honest answer is "it depends on the task," not a universal ranking.',
      howItWorks: {
        summary:
          "Combine LSTM's forget and input decisions into a single update gate, use a reset gate to control how much " +
          'past state feeds a new candidate, and drop the separate cell state.',
        steps: [
          'Compute the reset gate: a sigmoid deciding how much of the previous hidden state to use when forming the candidate update.',
          'Compute the update gate: a sigmoid deciding the blend between the previous hidden state and the new candidate.',
          'Form the candidate hidden state (tanh) from the current input and the reset-gated previous hidden state.',
          'Compute the new hidden state as a blend of the previous hidden state and the candidate, weighted by the update gate.',
          'Pass the single hidden state to the next time step — there is no cell state to carry alongside it.',
        ],
      },
      hyperparameters: [
        {
          name: 'hidden_size',
          what: 'Dimensionality of the single hidden state.',
          tuning:
            'No built-in default. Three gate/candidate weight matrices scale with hidden_size squared — roughly ' +
            "three-quarters of an LSTM's four matrices at the same hidden size, so GRU is somewhat cheaper to grow.",
        },
        {
          name: 'num_layers',
          what: 'Number of stacked GRU layers.',
          tuning: "PyTorch's nn.GRU defaults to 1. Stack for more capacity on larger datasets, same tradeoffs as stacking LSTM layers.",
        },
      ],
      whenToUse: [
        'Compute or memory budget is tighter than an LSTM comfortably allows — GRU has fewer gate parameters per hidden unit',
        'Sequences are short to moderate and the extra long-range control an explicit cell state offers is not clearly needed',
        'Fast iteration matters and GRU trains faster per step than an LSTM of the same hidden size',
        'Prior empirical comparisons on a similar task family (e.g. Chung et al. 2014) showed GRU roughly matching LSTM, so the simpler unit costs nothing in practice',
      ],
      whenNotToUse: [
        "You need a guaranteed accuracy edge over LSTM to justify the switch — the literature does not support a universal winner between the two, only 'often comparable'",
        'The task is known to hinge on very fine-grained long-range control that some studies have found favors the separate cell state — verify on your own data rather than assuming either wins',
        'You are already committed to an LSTM-based pipeline or pretrained weights and there is no clear compute constraint pushing toward GRU',
      ],
      facets: {
        task: ['representation', 'forecasting', 'generation'],
        dataType: ['text', 'timeseries', 'audio'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'sequential-hidden-states',
      },
      math: {
        latex: [
          'z_t = \\sigma(W_z [h_{t-1}, x_t]), \\qquad r_t = \\sigma(W_r [h_{t-1}, x_t])',
          '\\tilde{h}_t = \\tanh(W [r_t \\odot h_{t-1}, x_t])',
          'h_t = (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t',
        ],
        notes:
          'The update gate z_t plays a role similar to LSTM\'s forget-and-input pair combined, but acts directly on ' +
          'the single hidden state rather than on a protected, separately-updated cell state — there is no additive ' +
          'C_t pathway here, only this convex blend. That is the real architectural difference from LSTM, not merely ' +
          '"fewer gates": GRU trusts the hidden state itself to carry long-range information, where LSTM keeps that ' +
          'job structurally separate from the state used for output at every step.',
      },
      complexity: {
        train: 'O(T · d^2) per sequence, with roughly 3/4 the per-step weight-matrix compute of an LSTM of the same hidden size d (three gate/candidate matrices instead of four)',
        predict: 'O(d^2) per time step',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        'gru = nn.GRU(input_size=32, hidden_size=64, num_layers=1, batch_first=True)',
        '',
        'x = torch.randn(16, 50, 32)              # 16 sequences, 50 steps, 32 features',
        'outputs, h_n = gru(x)                    # outputs: (16, 50, 64); h_n: (1, 16, 64)',
        '                                           # no cell state — one hidden state only',
      ].join('\n'),
      related: ['lstm', 'vanilla-rnn-and-bptt', 'seq2seq-encoder-decoder', 'vanishing-gradients-and-universal-approximation'],
      references: {
        free: [{ title: 'Dive into Deep Learning — Gated Recurrent Units (GRU)', url: 'https://d2l.ai/chapter_recurrent-modern/gru.html' }],
        papers: [
          { title: 'Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation', url: 'https://arxiv.org/abs/1406.1078', year: 2014 },
          { title: 'Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling', url: 'https://arxiv.org/abs/1412.3555', year: 2014 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 10 — Sequence Modeling: Recurrent and Recursive Nets',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'seq2seq-encoder-decoder',
      name: 'Seq2seq encoder-decoder',
      aliases: ['sequence to sequence', 'RNN encoder-decoder'],
      tier: 1,
      year: 2014,
      difficulty: 3,
      hook: 'Encodes a whole input sequence into one fixed vector, then decodes that vector into an output of a different length.',
      intuition:
        'Classification and tagging models assume input and output are the same length, aligned position by position. ' +
        'Translation, summarization and speech transcription are not like that — the output is a different length than ' +
        'the input, and the alignment between them is not fixed in advance. Seq2seq solves this with two RNNs (usually ' +
        'LSTMs or GRUs). An encoder reads the entire input sequence and compresses everything it saw into one ' +
        "fixed-length vector — its final hidden state. A decoder is initialized from that vector and generates the " +
        'output sequence one token at a time, feeding each token it produces back in as the input to the next step, ' +
        "until it emits an end-of-sequence marker. This decouples input length from output length completely: the " +
        "encoder can read a ten-word sentence or a thousand-word document, and either way the decoder starts from a " +
        'vector of the same fixed size. That fixed size is also the architecture\'s central weakness — a single vector ' +
        'has to carry everything about the input, however long it was, and quality degrades sharply as sequences ' +
        'grow, which is exactly the problem attention was invented to fix.',
      howItWorks: {
        summary:
          'Run one RNN over the input to produce a fixed-size context vector summarizing it, then run a second RNN, ' +
          'initialized from that vector, to generate the output sequence one token at a time.',
        steps: [
          'Feed the input sequence into an encoder RNN (commonly an LSTM or GRU) one token at a time.',
          "Take the encoder's final hidden state (and cell state, for an LSTM) as the fixed-length context vector summarizing the whole input.",
          "Initialize the decoder RNN's hidden state from that context vector.",
          'At each decoder step, feed in the previous output token — the ground truth during training (teacher forcing) or the model\'s own prediction at inference — and produce a distribution over the next token.',
          'Continue decoding until an end-of-sequence token is produced or a maximum length is reached.',
          'Train end-to-end with a token-level loss (typically cross-entropy) backpropagated through both decoder and encoder via BPTT.',
        ],
      },
      hyperparameters: [
        {
          name: 'context vector size (encoder hidden_size)',
          what: 'Dimensionality of the fixed-length vector the encoder compresses the whole input into.',
          tuning:
            'A larger vector gives more capacity to summarize longer inputs, but the fixed-size bottleneck itself ' +
            'remains no matter how large it is — this is a mitigation, not a fix, which is why attention exists.',
        },
        {
          name: 'teacher forcing ratio',
          what: "How often the decoder is fed the ground-truth previous token during training versus its own prediction.",
          tuning:
            'Full teacher forcing (ratio 1.0) trains fastest but creates a train/inference mismatch (exposure bias), ' +
            'since at inference the decoder only ever sees its own predictions; scheduled sampling lowers the ratio over training to narrow that gap.',
        },
      ],
      whenToUse: [
        'Input and output are both variable-length sequences that need not match in length — translation, summarization, speech-to-text',
        'The output must be generated token by token, each one depending on every token generated before it',
        'You want the canonical starting architecture before deciding whether a fixed bottleneck is actually hurting performance on your data',
        'Sequences are short to moderate in practice, where a single vector can plausibly retain what matters from the input',
      ],
      whenNotToUse: [
        'Sequences are long — a single fixed-length vector cannot retain all the relevant information from a long input, and translation quality has been shown to degrade sharply as source length grows; use attention instead',
        'Input and output are the same length and aligned position by position — a simpler per-step sequence tagger fits better than compressing to a bottleneck and decoding back out',
        'You need to inspect which parts of the input influenced which parts of the output — the single context vector gives no such view; attention weights do',
        'Training throughput matters and the decoder length is long — autoregressive decoding is inherently sequential and cannot be parallelized across output steps',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-sequence',
      },
      math: {
        latex: [
          'c = h_T^{\\text{enc}}',
          'p(y_t \\mid y_{<t}, x) = \\mathrm{softmax}(W_o\\, s_t + b_o), \\qquad s_t = f(s_{t-1}, y_{t-1}, c)',
        ],
        notes:
          'c, the context vector, is a function only of the input x — it is computed once and reused unchanged at ' +
          'every decoder step. Nothing in this formulation lets c vary with which output token is currently being ' +
          'generated; that is precisely the fixed-length bottleneck, and precisely what bahdanau-luong-attention ' +
          'replaces with a context vector recomputed fresh at each decoder step.',
      },
      complexity: {
        train: 'O((T_in + T_out) · d^2) per sequence pair, for encoder length T_in, decoder length T_out and hidden size d',
        predict: 'O(T_out · d^2), generated sequentially one token at a time — cannot be parallelized across decoder steps',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        'class Seq2Seq(nn.Module):',
        '    def __init__(self, vocab_size, d=256):',
        '        super().__init__()',
        '        self.embed = nn.Embedding(vocab_size, d)',
        '        self.encoder = nn.LSTM(d, d, batch_first=True)',
        '        self.decoder = nn.LSTM(d, d, batch_first=True)',
        '        self.out = nn.Linear(d, vocab_size)',
        '',
        '    def forward(self, src, tgt_in):',
        '        _, (h, c) = self.encoder(self.embed(src))   # fixed-length context: (h, c)',
        '        dec_out, _ = self.decoder(self.embed(tgt_in), (h, c))',
        '        return self.out(dec_out)                     # per-step logits over the vocabulary',
      ].join('\n'),
      related: ['bahdanau-luong-attention', 'lstm', 'gru', 'encoder-decoder-architectures'],
      references: {
        free: [
          { title: 'Dive into Deep Learning — The Encoder-Decoder Architecture', url: 'https://d2l.ai/chapter_recurrent-modern/encoder-decoder.html' },
          { title: 'Dive into Deep Learning — Sequence-to-Sequence Learning for Machine Translation', url: 'https://d2l.ai/chapter_recurrent-modern/seq2seq.html' },
        ],
        papers: [
          { title: 'Sequence to Sequence Learning with Neural Networks', url: 'https://arxiv.org/abs/1409.3215', year: 2014 },
          { title: 'Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation', url: 'https://arxiv.org/abs/1406.1078', year: 2014 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 10 — Sequence Modeling: Recurrent and Recursive Nets',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'bahdanau-luong-attention',
      name: 'Bahdanau/Luong attention',
      aliases: ['additive attention', 'multiplicative attention', 'alignment model', 'RNN cross-attention'],
      tier: 1,
      year: 2014,
      difficulty: 4,
      hook: "Lets the decoder score and weigh every encoder state at each step, instead of relying on one fixed summary vector.",
      intuition:
        "Plain seq2seq forces the whole input through a single vector that never changes once computed. Attention " +
        "fixes this by letting the decoder look back at every encoder hidden state, at every decoder step, and decide " +
        "freshly each time which ones matter. Bahdanau, Cho & Bengio (2014/2015) introduced this first: at each " +
        "decoder step, score the decoder's current state against every encoder state using a small feedforward " +
        "network (additive attention), turn the scores into weights with softmax, and take a weighted sum of encoder " +
        "states as a new, step-specific context vector. Luong, Pham & Manning (2015) simplified the scoring function " +
        "shortly after, replacing the small network with a plain dot product or bilinear form (multiplicative " +
        "attention) — cheaper to compute and, on their benchmarks, at least as effective. Both connect two different " +
        "sequences: the decoder attends over the encoder's states, an extra alignment step layered onto an otherwise " +
        "ordinary RNN. That is the detail that distinguishes it from self-attention, where a sequence attends to " +
        "itself and the recurrence disappears entirely — see math.notes.",
      howItWorks: {
        summary:
          "At each decoder step, score the decoder's current hidden state against every encoder hidden state, turn " +
          "the scores into weights with softmax, and take a weighted sum of encoder states as a per-step context vector.",
        steps: [
          'Run the encoder RNN over the input, keeping every time step\'s hidden state rather than only the final one.',
          "Score the decoder's current hidden state against each encoder hidden state (Bahdanau: a small feedforward network; Luong: a dot product, or a bilinear \"general\" form).",
          'Turn those scores into a probability distribution over encoder positions with softmax — the alignment weights.',
          'Compute the context vector as the alignment-weighted sum of encoder hidden states.',
          "Combine that context vector with the decoder's hidden state (Bahdanau: concatenated before computing the next hidden state; Luong: concatenated after, then projected) to produce the output distribution.",
          'Repeat at every decoder step — a fresh context vector and a fresh alignment over the whole input are computed each time, not reused.',
        ],
      },
      hyperparameters: [
        {
          name: 'attention score function',
          what: "How the decoder state is compared against each encoder state: Bahdanau's additive form, or Luong's dot / general / concat forms.",
          tuning:
            'Dot product is cheapest and works when encoder and decoder hidden sizes match; the bilinear "general" ' +
            'form handles mismatched sizes; the additive form has more parameters and cost but can be more expressive when the simpler scores underperform.',
        },
        {
          name: 'attention/alignment hidden size (Bahdanau only)',
          what: "Dimensionality of the small feedforward network's hidden layer used to score decoder/encoder state pairs.",
          tuning: 'Usually matched to the encoder/decoder hidden size as a starting point; raise it only if alignment quality visibly suffers, since it adds parameters recomputed at every decoder step.',
        },
      ],
      whenToUse: [
        'Encoder and decoder are two different sequences (e.g. source and target language) and the decoder needs to focus on different input positions at each output step',
        'Input sequences are long enough that a single fixed context vector from plain seq2seq visibly loses information',
        'You want interpretable, inspectable alignment weights — attention heatmaps showing which input positions drove each output token',
        'You are extending an existing RNN-based encoder-decoder rather than starting a new architecture from scratch',
      ],
      whenNotToUse: [
        'You are designing a new model with no other reason to keep an RNN — self-attention/Transformer architectures have superseded this for most current sequence-to-sequence work',
        'The relationship you need is within a single sequence rather than between two distinct sequences — that is self-attention, not this',
        'Training throughput matters most — the underlying RNN still processes the sequence step by step and cannot parallelize across time the way self-attention layers can',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-sequence-with-alignment-weights',
      },
      math: {
        latex: [
          'e_{t,i} = v^\\top \\tanh(W_1 s_{t-1} + W_2 h_i) \\quad \\text{(Bahdanau, additive)}',
          '\\mathrm{score}(s_t, h_i) = s_t^\\top h_i \\ \\text{or}\\ s_t^\\top W h_i \\quad \\text{(Luong, dot / general)}',
          '\\alpha_{t,i} = \\mathrm{softmax}_i(e_{t,i}), \\qquad c_t = \\sum_i \\alpha_{t,i}\\, h_i',
        ],
        notes:
          "Both scoring functions above are what modern terminology calls cross-attention: the decoder state s_t is a " +
          "query, and the encoder states h_i are keys and values from a different sequence, with the alignment " +
          "computed as one extra step layered on top of an otherwise ordinary RNN encoder-decoder — the recurrence " +
          "does the sequence processing, attention only reweights what the decoder reads from it. Self-attention " +
          "(Vaswani et al., 2017; the self-attention entry on Nova) reuses the same query/key/value scoring idea — " +
          "Luong's plain dot-product score above is mechanically the un-scaled special case of the Transformer's " +
          "score, before the 1/sqrt(d_k) stabilizer — but changes what attends to what: a sequence attends to itself, " +
          "encoder positions to other encoder positions and decoder positions to other decoder positions, with no " +
          "recurrence left underneath at all. That is the real basis for calling this the direct ancestor of " +
          "self-attention rather than the same mechanism under an old name: the scoring math generalizes, but the " +
          "role attention plays does not — here it is a small correction bolted onto an RNN; there it is the entire computation of a layer.",
      },
      complexity: {
        train: 'O(T_out · T_in · d) additional over plain seq2seq per sequence pair, for computing and softmaxing alignment scores against every encoder position at every decoder step',
        predict: 'Same O(T_in) extra work per decoder step, on top of the underlying RNN\'s per-step cost',
      },
      code: [
        'import torch, torch.nn.functional as F',
        '',
        'def luong_dot_attention(decoder_state, encoder_states):',
        '    # decoder_state: (batch, d)   encoder_states: (batch, T_in, d)',
        '    scores = torch.bmm(encoder_states, decoder_state.unsqueeze(2)).squeeze(2)   # (batch, T_in)',
        '    alpha = F.softmax(scores, dim=-1)                                            # alignment weights',
        '    context = torch.bmm(alpha.unsqueeze(1), encoder_states).squeeze(1)           # (batch, d)',
        '    return context, alpha                # alpha is the per-step attention heatmap',
      ].join('\n'),
      // self-attention is the mandatory, central link — see the file header and math.notes above
      // for the actual mechanical relationship, not just the name.
      related: ['self-attention', 'seq2seq-encoder-decoder', 'lstm'],
      references: {
        free: [
          { title: 'Dive into Deep Learning — The Bahdanau Attention Mechanism', url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html' },
          { title: 'Dive into Deep Learning — Attention Scoring Functions', url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/attention-scoring-functions.html' },
        ],
        papers: [
          { title: 'Neural Machine Translation by Jointly Learning to Align and Translate', url: 'https://arxiv.org/abs/1409.0473', year: 2014 },
          { title: 'Effective Approaches to Attention-based Neural Machine Translation', url: 'https://arxiv.org/abs/1508.04025', year: 2015 },
        ],
        books: [
          {
            title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
            author: 'Géron',
            chapter: 'Ch. 16 — Natural Language Processing with RNNs and Attention',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'tcns-and-wavenet',
      name: 'TCNs & WaveNet',
      aliases: ['temporal convolutional network', 'causal dilated convolutions'],
      tier: 2,
      year: 2016,
      difficulty: 4,
      hook: 'Swaps recurrence for stacked causal, dilated convolutions — no hidden state, and the whole sequence trains in parallel.',
      intuition:
        'Recurrence is not the only way to model a sequence. A causal convolution restricts each output position to ' +
        "see only its own position and earlier ones, never the future — that alone gives a valid sequence model. " +
        "Stack several such layers with dilation that grows exponentially with depth (skipping 1, then 2, then 4, " +
        "then 8 steps between the positions each filter reads), and the receptive field covering how far back a " +
        "layer can see grows exponentially too, without needing more parameters per layer. Van den Oord et al.'s " +
        "WaveNet (2016) applied exactly this to raw audio generation, covering thousands of timesteps of receptive " +
        "field this way. Bai, Kolter & Koltun (2018) later ran a systematic empirical comparison across many sequence " +
        "tasks under the general name TCN (temporal convolutional network) and found this kind of architecture " +
        "matching or outperforming canonical LSTMs on several benchmarks, with a longer effective memory. The " +
        "practical payoff: because a convolution has no hidden state depending on the previous step's output during " +
        "training, the whole sequence can be processed in parallel — unlike a recurrent network, which must finish " +
        "step t before starting step t+1.",
      howItWorks: {
        summary:
          "Stack causal 1-D convolutions with exponentially increasing dilation so each layer's receptive field " +
          "grows exponentially with depth, covering a long history with no recurrence or hidden state.",
        steps: [
          'Apply a 1-D convolution that only looks at the current and past time steps (causal padding) — never the future.',
          'Stack multiple such layers with dilation rates that double each layer (1, 2, 4, 8, …), so the receptive field grows exponentially with depth instead of linearly.',
          'Train on the whole sequence in parallel across all positions at once, unlike a recurrent network, which must process one step at a time.',
        ],
      },
      whenToUse: [
        'You want a sequence model that trains in parallel across time rather than one step at a time, and a fixed, architecture-determined context window is acceptable',
        'The task resembles ones convolutional sequence models have been benchmarked well on — raw audio generation (WaveNet), or general sequence modeling tasks in Bai et al.\'s (2018) comparison against canonical LSTMs',
      ],
      whenNotToUse: [
        "The task needs open-ended memory of everything seen so far — a TCN's receptive field is fixed at design time by depth and dilation, unlike a recurrent hidden state that can in principle carry information forward indefinitely",
        'You need low-latency, step-by-step generation and the receptive field is large — naive autoregressive sampling, as in the original WaveNet, requires a full forward pass per generated sample and is slow at inference',
      ],
      facets: {
        task: ['generation', 'forecasting'],
        dataType: ['audio', 'timeseries', 'text'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-sequence',
      },
      related: ['vanilla-rnn-and-bptt', 'seq2seq-encoder-decoder', 'audio-models'],
      references: {
        free: [{ title: 'DeepMind — WaveNet: A Generative Model for Raw Audio', url: 'https://deepmind.google/discover/blog/wavenet-a-generative-model-for-raw-audio/' }],
        papers: [
          { title: 'WaveNet: A Generative Model for Raw Audio', url: 'https://arxiv.org/abs/1609.03499', year: 2016 },
          { title: 'An Empirical Evaluation of Generic Convolutional and Recurrent Networks for Sequence Modeling', url: 'https://arxiv.org/abs/1803.01271', year: 2018 },
        ],
      },
    },
  ],
} satisfies Body;
