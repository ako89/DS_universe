/**
 * Nova — Attention & Scale, the outer star. See PLAN.md §3 for the full moon list.
 *
 * Phase 2 pressure-test content: only `self-attention` is written here, to pressure-test
 * types/content.ts against content attached to a *star* (not a planet) before the schema is
 * frozen. The other 5 moons listed for Nova in PLAN.md §3 are Phase 3 work.
 *
 * `related` points at the other two Phase 2 entries — see mercury.ts's file comment. The
 * linear-regression link here is a genuine one, not just a placeholder: see the entry's
 * `related` comment below.
 *
 * `year` is 2017 (Vaswani et al., "Attention Is All You Need") rather than 2016, even though
 * self-attention under the name "intra-attention" was introduced a year earlier by Cheng, Dong &
 * Lapata for machine reading and used again by Parikh et al. the same year — both confirmed by
 * search. 2017 is used because this entry describes the specific scaled dot-product formulation
 * used throughout modern Transformers (the one the sibling `multi-head-attention` and
 * `transformer-block` moons build on, per PLAN.md's grouping), and because the 2016 works are
 * cited honestly as prior art in `math.notes` rather than folded into the primary claim. Flagging
 * this explicitly per PLAN.md §0's rule to say so rather than silently pick one.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'nova',
  name: 'Nova',
  segment: 'Attention & Scale',
  hook: 'The outer star: attention as the sole primitive, and what happens once you scale it up.',
  summary:
    "Nova is the map's second gravitational centre, opposite Sol. Where Sol's bodies are built around an " +
    "explicit loss minimised over parameters, Nova's energy source is a single mechanism — attention — scaled " +
    'up until it started behaving like something qualitatively new.',
  eraRange: [2017, 2017],
  moons: [
    {
      id: 'self-attention',
      name: 'Self-Attention',
      aliases: ['scaled dot-product self-attention', 'intra-attention'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Lets every position in a sequence weigh every other position and decide how much attention to pay it.',
      intuition:
        "Imagine editing a sentence and needing to resolve what 'it' refers to a few words back — you don't " +
        'process the sentence strictly left to right, you glance at every other word at once and weigh how ' +
        'relevant each one is to the word you\'re currently working on. Self-attention gives a network the ' +
        'same ability. Every position in a sequence produces three vectors: a query (what am I looking for), ' +
        'a key (what do I contain), and a value (what do I offer). A position\'s output is a weighted average ' +
        "of every other position's value vector, where the weight comes from comparing that position's query " +
        "against every other position's key — closely matching pairs get more weight. Because every position " +
        'attends directly to every other position in a single step, information does not need to be relayed ' +
        'word by word through a chain of hidden states the way a recurrent network relays it — which is what ' +
        'let the Transformer drop recurrence entirely.',
      howItWorks: {
        summary:
          'Project each input into a query, key and value; score every pair of positions by comparing queries ' +
          'against keys; turn scores into weights and use them to average the value vectors.',
        steps: [
          'Project each input embedding into a query (Q), key (K) and value (V) vector using three learned weight matrices.',
          "Score every pair of positions as the dot product of one position's query with another's key.",
          'Scale the scores by the square root of the key dimension to keep gradients stable as dimensionality grows.',
          'Apply softmax across each row of scores so the weights for one position sum to one.',
          'Compute each output as the weighted sum of all value vectors, using those softmax weights.',
          'Stack Q, K and V for every position into matrices so the whole operation runs as matrix multiplications.',
        ],
      },
      whenToUse: [
        'The task needs to relate elements across a whole sequence regardless of how far apart they are — e.g. coreference or long-range dependencies in text',
        'You can afford the quadratic-in-sequence-length compute and memory cost of comparing every position to every other one',
        'You want representations for all positions computed in parallel rather than one step at a time',
        'You are building on or fine-tuning an existing Transformer-based architecture, where self-attention is the core building block',
      ],
      whenNotToUse: [
        'Sequences are very long (tens of thousands of tokens or more), where the quadratic memory cost of standard self-attention becomes prohibitive',
        'The data has no meaningful pairwise relationship worth modelling — e.g. i.i.d. tabular rows',
        'Training data is small — self-attention carries less built-in inductive bias than convolution or recurrence and tends to need more data to learn well',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'contextual-embeddings',
      },
      math: {
        latex: [
          'Q = XW^Q,\\quad K = XW^K,\\quad V = XW^V',
          '\\mathrm{Attention}(Q,K,V) = \\mathrm{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V',
        ],
        notes:
          'The 1/√d_k scaling keeps the dot products from growing large in magnitude as the key dimension d_k ' +
          'increases, which would otherwise push softmax into regions with vanishingly small gradients. The ' +
          'mechanism itself predates the Transformer: Cheng, Dong & Lapata (2016) introduced it as ' +
          '"intra-attention" inside an LSTM for machine reading, and Parikh et al. (2016) used it in a ' +
          'feedforward network the same year. Vaswani et al. (2017) is credited for showing that self-attention ' +
          'alone, with no recurrence or convolution at all, was sufficient for a state-of-the-art sequence model.',
      },
      complexity: {
        train: 'O(n²·d) per layer, for sequence length n and representation dimension d',
        predict: 'O(n²·d) per layer — the same all-pairs comparison runs on the sequence being processed',
      },
      code: [
        'import torch',
        'import torch.nn.functional as F',
        '',
        'def self_attention(x, Wq, Wk, Wv):',
        '    # x: (seq_len, d_model)',
        '    Q = x @ Wq                          # (seq_len, d_k)',
        '    K = x @ Wk                          # (seq_len, d_k)',
        '    V = x @ Wv                          # (seq_len, d_v)',
        '',
        '    d_k = Q.shape[-1]',
        '    scores = Q @ K.T / d_k ** 0.5        # (seq_len, seq_len)',
        '    weights = F.softmax(scores, dim=-1)',
        '',
        '    return weights @ V                   # (seq_len, d_v)',
      ].join('\n'),
      // Only two other entries exist yet (Phase 2 pressure test) — see file header. The
      // linear-regression link is a real one: self-attention's output is also a linear
      // combination of value vectors, just with data-dependent rather than fixed weights.
      related: ['linear-regression', 'dbscan'],
      references: {
        free: [
          { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
          { title: "Lil'Log — Attention? Attention!", url: 'https://lilianweng.github.io/posts/2018-06-24-attention/' },
        ],
        papers: [
          { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', year: 2017 },
          { title: 'Long Short-Term Memory-Networks for Machine Reading', url: 'https://arxiv.org/abs/1601.06733', year: 2016 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.6 — Self-Attention and Positional Encoding',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/index.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
  ],
} satisfies Body;
