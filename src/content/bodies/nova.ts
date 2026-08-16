/**
 * Nova — Attention & Scale, the outer star. See PLAN.md §3 for the full moon list.
 *
 * Phase 2 pressure-test content originally shipped only `self-attention`, to pressure-test
 * types/content.ts against content attached to a *star* (not a planet) before the schema was
 * frozen. That history is preserved below.
 *
 * `related` on `self-attention` points at the other two Phase 2 entries — see mercury.ts's file
 * comment. The linear-regression link there is a genuine one, not just a placeholder: see the
 * entry's `related` comment.
 *
 * `year` on `self-attention` is 2017 (Vaswani et al., "Attention Is All You Need") rather than
 * 2016, even though self-attention under the name "intra-attention" was introduced a year earlier
 * by Cheng, Dong & Lapata for machine reading and used again by Parikh et al. the same year — both
 * confirmed by search. 2017 is used because this entry describes the specific scaled dot-product
 * formulation used throughout modern Transformers (the one the sibling `multi-head-attention` and
 * `transformer-block` moons build on, per PLAN.md's grouping), and because the 2016 works are
 * cited honestly as prior art in `math.notes` rather than folded into the primary claim. Flagging
 * this explicitly per PLAN.md §0's rule to say so rather than silently pick one.
 *
 * Phase 3: `self-attention`'s citations were independently re-verified by opening every reference
 * URL with a working WebFetch (Phase 2 only had WebSearch excerpts, since WebFetch returned
 * EGRESS_BLOCKED then). Every URL resolves and matches its claim; the "intra-attention" /
 * Cheng-Dong-Lapata / Parikh claim in `math.notes` was checked against the actual paper text (via
 * ar5iv, not the PDF) and against "Attention Is All You Need"'s own related-work section, which
 * cites both by name. Nothing needed to change — see the task report for the full verification
 * trail. Parikh et al.'s arXiv id (1606.01933, "A Decomposable Attention Model for Natural
 * Language Inference") is now confirmed but intentionally not added as a formal `references` entry
 * on `self-attention`, since it is cited there only as prior art in prose, not as a primary source
 * for the entry's own content.
 *
 * The other 5 moons (`multi-head-attention`, `transformer-block`, `positional-encoding`,
 * `scaling-laws`, `encoder-decoder-architectures`) were added in Phase 3, all at their PLAN.md §3
 * marked tiers, following the same research-first loop. `positional-encoding` and
 * `encoder-decoder-architectures` are bundled entries spanning several papers each (sinusoidal /
 * RoPE / ALiBi; encoder-only / decoder-only / encoder-decoder) — each is dated to the earliest of
 * its variants, matching jupiter.ts's optics-and-mean-shift precedent, with the later works' real
 * years carried in `references` and prose instead. `scaling-laws` is dated 2020 (Kaplan et al.) on
 * the same principle, with Hoffmann et al.'s 2022 Chinchilla revision covered in the same entry.
 *
 * `eraRange` is [2017, 2022]: 2017 is the earliest confirmed year across all 6 moons (Vaswani et
 * al.), and 2022 is the latest (Hoffmann et al., "Training Compute-Optimal Large Language Models"
 * / Chinchilla) — not 2017-2017, since positional encoding's RoPE/ALiBi variants (2021) and the
 * scaling-laws line of work (2020, 2022) are meaningfully later than the original Transformer.
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
  eraRange: [2017, 2022],
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
    {
      id: 'multi-head-attention',
      name: 'Multi-Head Attention',
      aliases: ['multi-headed attention', 'MHA'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Runs several attention heads in parallel so the model can track several relationships at once, not just one.',
      intuition:
        'Picture a group of specialist readers going over the same sentence together instead of one generalist ' +
        'doing it alone: one tracks which pronoun points to which noun, another tracks verb-argument structure, ' +
        'another tracks topic. Multi-head attention gives self-attention this division of labour. Instead of ' +
        'running one scaled dot-product attention over the full-width query, key and value vectors, it splits ' +
        'them into h smaller subspaces, each with its own learned projections, and runs attention independently ' +
        'and in parallel within every subspace. A single attention head has to average over everything relevant ' +
        'to a position in one shot, and averaging blurs together relationships that would be clearer kept apart. ' +
        'Splitting into heads gives each subspace room to specialize in a different kind of relationship, and ' +
        'the reduced dimension per head keeps the total compute close to what one full-width head would have cost.',
      howItWorks: {
        summary:
          'Project Q, K and V into h smaller subspaces with separate learned weights, run scaled dot-product ' +
          'attention independently in each, then concatenate and linearly mix the results.',
        steps: [
          "Split the model dimension d_model into h heads, each with its own learned W^Q, W^K, W^V projecting into a smaller d_k = d_model/h subspace.",
          'Run scaled dot-product self-attention independently and in parallel within each head.',
          "Concatenate all h heads' outputs back into a single d_model-length vector per position.",
          'Mix the concatenated result through one more learned linear projection W^O.',
        ],
      },
      hyperparameters: [
        {
          name: 'h (number of heads)',
          what: 'How many parallel attention subspaces Q, K and V get split into.',
          tuning:
            'The base Transformer uses h=8 with d_k = d_v = 64 (d_model=512). Adding heads without growing ' +
            'd_model just shrinks each head\'s subspace -- heads and d_model are usually scaled together.',
        },
      ],
      whenToUse: [
        'Building or fine-tuning any standard Transformer block, where multi-head attention is the default attention sublayer rather than single-head',
        'Several distinct relationships in the input matter at once (e.g. short-range syntax and long-range coreference) that single-head averaging would blur together',
        "The compute budget allows h parallel narrower attention operations at roughly the same total cost as one full-width head, per the original paper's parameter-matched design",
      ],
      whenNotToUse: [
        'The sequence or task is simple enough that a single attention head already captures the needed relationship, so extra heads mainly add parameters without measurable gain',
        'Interpretability of one clean, easily-inspected attention map matters more than raw performance -- h separate per-head maps are harder to read as one coherent picture',
        'You are reusing a pretrained checkpoint -- head count is fixed by that checkpoint\'s architecture and is not something you tune independently after the fact',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'contextual-embeddings',
      },
      math: {
        latex: [
          '\\mathrm{head}_i = \\mathrm{Attention}(QW_i^Q, KW_i^K, VW_i^V)',
          '\\mathrm{MultiHead}(Q,K,V) = \\mathrm{Concat}(\\mathrm{head}_1,\\dots,\\mathrm{head}_h)W^O',
        ],
        notes:
          'Vaswani et al. (2017) motivate this as letting the model "jointly attend to information from ' +
          'different representation subspaces at different positions" -- with a single head, averaging over ' +
          'everything relevant "inhibits" exactly that. Because each head\'s d_k is reduced in proportion to h, ' +
          'the total computational cost of multi-head attention is similar to single-head attention at full ' +
          'dimensionality, not h times more expensive.',
      },
      complexity: {
        train: 'O(n²·d) per layer, same order as single-head attention -- splitting d into h heads keeps total compute roughly constant',
        predict: 'O(n²·d) per layer, for the same reason',
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        '',
        'mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)',
        '',
        'x = torch.randn(2, 10, 512)               # (batch, seq_len, d_model)',
        'out, attn = mha(x, x, x)                  # self-attention: query = key = value = x',
        '# out:  (2, 10, 512)      -- one d_model vector per position, per batch item',
        '# attn: (2, 10, 10)       -- attention weights averaged over heads by default',
        '',
        'out, attn = mha(x, x, x, average_attn_weights=False)',
        '# attn: (2, 8, 10, 10)    -- one attention matrix per head, unaveraged',
      ].join('\n'),
      // contextual-embeddings (Babel) is a direct link -- this is literally the output type
      // multi-head attention produces (see facets.outputType above), not a loose NLP association.
      related: ['self-attention', 'transformer-block', 'contextual-embeddings'],
      references: {
        free: [
          { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
        ],
        papers: [
          { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', year: 2017 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.5 — Multi-Head Attention',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/multihead-attention.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'transformer-block',
      name: 'Transformer Block',
      aliases: ['encoder block', 'decoder block', 'transformer layer'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Wraps self-attention and a feedforward layer in residual connections and layer norm, then stacks the result N times.',
      intuition:
        'Think of the block as one workstation on an assembly line that gets repeated N times. First, a ' +
        'self-attention station lets every token look at every other token and pull in whatever context it ' +
        'needs -- this is the only place information moves between positions. Then a feedforward station ' +
        "processes each token's updated representation on its own, transforming what attention just gathered. " +
        'Both stations sit inside a residual connection, a bypass wire carrying the original input around the ' +
        'station and adding it back to the output, so a station that has not yet learned anything useful cannot ' +
        'make things worse. Layer normalization after each addition keeps the running signal from growing or ' +
        'shrinking as more stations get chained together. Stack six of these blocks (the original paper\'s ' +
        "choice) and you have an encoder; add masking plus a cross-attention station that looks at the " +
        "encoder's output, and the same block becomes a decoder.",
      howItWorks: {
        summary:
          'Alternate a multi-head self-attention sublayer with a position-wise feedforward sublayer, wrapping ' +
          'each in a residual connection and layer normalization, then stack N of these identical blocks.',
        steps: [
          "Run multi-head self-attention over the block's input so every position gathers information from every other position.",
          'Add the attention sublayer\'s output back to its input (residual connection) and apply layer normalization.',
          'Feed each position independently through a two-layer feedforward network (linear, ReLU, linear).',
          "Add the feedforward sublayer's output back to its input and apply layer normalization again.",
          'Stack N identical blocks (N=6 in the original paper) to build the full encoder or decoder.',
          'In a decoder block, mask self-attention so a position cannot attend to future positions, and insert a cross-attention sublayer that attends over the encoder\'s output.',
        ],
      },
      hyperparameters: [
        {
          name: 'N (number of blocks)',
          what: 'How many identical blocks are stacked to form the encoder or decoder.',
          tuning:
            'The base Transformer uses N=6 for both stacks. Deeper stacks need the residual connections and ' +
            'layer norm in every block to stay trainable at all -- this is what makes depth safe to increase.',
        },
        {
          name: 'd_ff (feedforward inner dimension)',
          what: 'Width of the hidden layer inside the position-wise feedforward sublayer.',
          tuning:
            'The base model uses d_ff=2048 against d_model=512, a 4x expansion carried into most later ' +
            'Transformers as the default.',
        },
      ],
      whenToUse: [
        'Building any standard Transformer-based model -- encoder-only, decoder-only, or encoder-decoder -- where this block is the repeatable unit stacked N times',
        'You need a component that mixes information across positions (attention) and then transforms each position\'s representation independently (feedforward) at every stack depth',
        'Deep stacks are needed and training stability across many layers matters -- residual connections and layer norm are what make N=6, 12, 24+ layers trainable at all',
      ],
      whenNotToUse: [
        'Sequence length is large enough that the O(n²) attention sublayer dominates cost and a cheaper cross-position mixing mechanism is preferable',
        'The data has no benefit from cross-position mixing at all, e.g. i.i.d. tabular rows -- there is nothing for the attention sublayer to do',
        'Training data is small and no pretrained checkpoint is available -- the block carries less built-in inductive bias than convolution or recurrence and tends to need more data or scale to train well',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'contextual-embeddings',
      },
      math: {
        latex: [
          '\\text{output} = \\mathrm{LayerNorm}(x + \\mathrm{Sublayer}(x))',
          '\\mathrm{FFN}(x) = \\max(0, xW_1+b_1)W_2+b_2',
        ],
        notes:
          'Every sublayer -- attention or feedforward -- is wrapped in the same residual-plus-norm pattern, ' +
          'applied twice per block (once after attention, once after the feedforward network). The decoder\'s ' +
          'masked self-attention sets illegal future connections to -infinity before the softmax so a position ' +
          "can only depend on outputs already produced, preserving the model's autoregressive property.",
      },
      complexity: {
        train: 'O(n²·d + n·d²) per block -- the attention term dominates for long sequences, the feedforward term for short ones -- times N blocks',
        predict: 'Same per-block cost; one forward pass through N blocks',
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        '',
        'encoder_layer = nn.TransformerEncoderLayer(',
        '    d_model=512, nhead=8, dim_feedforward=2048,',
        "    dropout=0.1, activation='relu', batch_first=True,",
        ')',
        'encoder = nn.TransformerEncoder(encoder_layer, num_layers=6)   # N=6, per the paper',
        '',
        'x = torch.randn(2, 10, 512)          # (batch, seq_len, d_model)',
        'out = encoder(x)                      # same shape -- one block, stacked 6 times',
      ].join('\n'),
      // bahdanau-luong-attention (Echo) is the reverse of the forward link already on that
      // entry (see echo.ts) -- the transformer block replaces the RNN + attention pattern
      // entirely with attention as the only cross-position mechanism. batch-and-layer-normalization
      // (Prometheus) is a genuine link: this block specifically uses LayerNorm, not BatchNorm,
      // confirmed in the paper's own "LayerNorm(x + Sublayer(x))" formulation. byte-pair-encoding
      // (Babel) is genuine too -- the original paper's own training data was BPE-tokenized
      // (Vaswani et al., section 5.1), not just "both used in NLP".
      related: ['self-attention', 'multi-head-attention', 'bahdanau-luong-attention', 'batch-and-layer-normalization', 'byte-pair-encoding'],
      references: {
        free: [
          { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
          { title: 'The Annotated Transformer', url: 'https://nlp.seas.harvard.edu/annotated-transformer/' },
        ],
        papers: [
          { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', year: 2017 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.7 — The Transformer Architecture',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/transformer.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'positional-encoding',
      name: 'Positional Encoding',
      aliases: ['position embeddings'],
      tier: 1,
      year: 2017,
      difficulty: 3,
      hook: 'Gives attention a sense of order -- fixed sine waves, rotated queries and keys, or a straight distance penalty.',
      intuition:
        'Self-attention treats a sequence as a set: swap two tokens and, apart from which output lands where, ' +
        "the computation is identical, so without help the model cannot tell 'dog bites man' from 'man bites " +
        "dog'. Positional encoding fixes that, and three approaches have mattered. The original scheme adds a " +
        "fixed pattern of sine and cosine waves at different frequencies to each token's embedding once, before " +
        'the first layer, chosen so that a fixed offset between two positions can be recovered as a linear ' +
        'function of their encodings. RoPE instead rotates the query and key vectors by an angle proportional ' +
        'to position before every dot product, so relative position is baked into the attention score at every ' +
        'layer rather than added once at the start. ALiBi skips position embeddings entirely and just subtracts ' +
        'a penalty proportional to distance from the raw attention scores, favouring nearby tokens by ' +
        'construction -- which happens to make it generalize well to sequences longer than anything seen in training.',
      howItWorks: {
        summary:
          'Because self-attention has no notion of order on its own, inject position either by adding a fixed ' +
          'encoding to token embeddings (sinusoidal), rotating queries and keys by position (RoPE), or biasing ' +
          'attention scores by distance (ALiBi).',
        steps: [
          "Sinusoidal (original Transformer): compute a fixed sine/cosine value per embedding dimension and position, and add it to each token's input embedding once, before the first block.",
          'RoPE: rotate each query and key vector by an angle proportional to its position before the dot product, so relative position falls directly out of the attention score.',
          'ALiBi: skip position embeddings and instead subtract a fixed, head-specific penalty proportional to the distance between positions from the raw attention scores before softmax.',
          'All three feed into the same downstream scaled dot-product attention -- they only change how "where" is represented.',
        ],
      },
      whenToUse: [
        'Any self-attention-based model, since attention itself has no notion of sequence order and needs one of these injected',
        'Long-context or length-extrapolation matters (train short, deploy long) -- RoPE and especially ALiBi were built to generalize better beyond training length than the original sinusoidal scheme',
        'Relative rather than absolute position is what matters for the task (e.g. "two tokens back"), which RoPE and ALiBi both encode more directly than the original additive scheme',
      ],
      whenNotToUse: [
        'You need to recover exact absolute position for its own sake -- RoPE and ALiBi both emphasize relative position and are a worse fit if absolute position must be read out precisely',
        'A non-attention sequence architecture (RNN, 1D-CNN) is being used, where order is already implicit in the computation and none of these are needed',
        "You are working with an existing pretrained checkpoint -- swapping its positional scheme after the fact generally requires retraining, since the model's attention weights were learned around one specific encoding",
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'position-augmented-embeddings',
      },
      math: {
        latex: [
          'PE_{(pos,2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right), \\quad PE_{(pos,2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right)',
          '\\text{score}_{ij} = q_i \\cdot k_j - m\\,|i-j|',
        ],
        notes:
          'The sinusoidal formula (Vaswani et al., 2017) is chosen so that for any fixed offset k, PE(pos+k) is ' +
          'a linear function of PE(pos), which the paper argues should let the model learn to attend by relative ' +
          'position. The second expression is ALiBi\'s scoring rule (Press et al., 2021): m is a fixed, ' +
          'head-specific slope (not learned), so the penalty grows linearly with distance and no positional ' +
          'embedding is added anywhere in the network. RoPE (Su et al., 2021) instead encodes position by ' +
          'rotating Q and K by an angle proportional to absolute position before the dot product, so the score ' +
          "between two positions is provably a function of their relative offset alone -- baked into every " +
          'layer rather than added once at the input, unlike the sinusoidal scheme.',
      },
      complexity: {
        train: 'O(n·d) to compute or apply the encoding once per layer -- negligible next to the O(n²·d) attention cost it feeds into',
        predict: 'O(n·d), for the same reason',
      },
      code: [
        'import torch',
        '',
        'def sinusoidal_positional_encoding(seq_len, d_model):',
        '    pos = torch.arange(seq_len).unsqueeze(1)                # (seq_len, 1)',
        '    i = torch.arange(d_model // 2).unsqueeze(0)             # (1, d_model/2)',
        '    angle = pos / (10000 ** (2 * i / d_model))',
        '    pe = torch.zeros(seq_len, d_model)',
        '    pe[:, 0::2] = torch.sin(angle)',
        '    pe[:, 1::2] = torch.cos(angle)',
        '    return pe                                                # add this to token embeddings',
        '',
        'pe = sinusoidal_positional_encoding(seq_len=50, d_model=512)',
      ].join('\n'),
      // vision-transformer (Vulcan) is a genuine link, not just "both use attention": ViT
      // adapts positional encoding to images with a learned embedding rather than a fixed
      // sinusoidal or relative scheme -- see vulcan.ts's vision-transformer math.notes.
      related: ['self-attention', 'transformer-block', 'vision-transformer'],
      references: {
        free: [
          { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
          { title: 'EleutherAI — Rotary Embeddings: A Relative Revolution', url: 'https://blog.eleuther.ai/rotary-embeddings/' },
        ],
        papers: [
          { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', year: 2017 },
          { title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding', url: 'https://arxiv.org/abs/2104.09864', year: 2021 },
          { title: 'Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation', url: 'https://arxiv.org/abs/2108.12409', year: 2021 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.6 — Self-Attention and Positional Encoding',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/self-attention-and-positional-encoding.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'scaling-laws',
      name: 'Scaling Laws',
      aliases: ['neural scaling laws', 'compute-optimal training'],
      tier: 1,
      year: 2020,
      difficulty: 3,
      hook: 'Loss falls as a predictable power law in size, data and compute -- so you can plan a run before you pay for it.',
      intuition:
        "Imagine plotting a model's loss against how big it is, how much data it saw, or how much compute it " +
        'burned, all on log-log axes, and getting an almost straight line over several orders of magnitude. ' +
        'That line is a power law, and Kaplan et al. found it holds separately for model size, dataset size, ' +
        'and compute for Transformer language models -- letting you predict the loss of a run you have not ' +
        'done yet, or work out how to split a fixed compute budget. Their original recipe said to grow the ' +
        'model much faster than the data. A few years later, training many more models more carefully, ' +
        'Hoffmann et al. (the Chinchilla paper) found the opposite split works better: model size and training ' +
        'tokens should grow together roughly one-to-one, meaning most contemporary large models had been ' +
        'trained on far too little data for how big they were.',
      howItWorks: {
        summary:
          'Fit power-law curves to validation loss as model size, dataset size and compute vary independently, ' +
          'then use those curves to predict the loss -- or the optimal split of a compute budget -- for runs ' +
          'you have not done yet.',
        steps: [
          'Train a family of models varying one axis at a time: parameter count, dataset size, or total compute.',
          'Plot loss against each axis on log-log axes; loss follows an approximately straight line (a power law) over several orders of magnitude.',
          'Fit the power-law exponents from these curves.',
          'Use the fitted curves to solve for the compute-optimal split between model size and training tokens at a target compute budget, instead of guessing and rerunning.',
        ],
      },
      whenToUse: [
        'Planning a large pretraining run and deciding how to split a fixed compute budget between model size and number of training tokens',
        'Extrapolating expected loss for a model larger than any you have actually trained, to decide whether a run is worth the cost before starting it',
        'Comparing architectural or data changes at small scale and needing confidence the ranking will hold at the target scale',
      ],
      whenNotToUse: [
        'The model is small enough, or the budget flexible enough, that you can just try a few configurations directly instead of fitting a scaling curve',
        "Extrapolating far outside the range of scales you actually measured -- the fitted power law is an empirical regularity within a regime, not a guaranteed physical law, and Kaplan's own fit was substantially revised by Hoffmann et al. once evaluated more carefully",
        'The downstream metric you care about is not smooth in loss (e.g. a capability that emerges discontinuously) -- these fits are for the pretraining loss curve, not every downstream benchmark',
      ],
      facets: {
        task: ['inference'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'predicted-loss-vs-compute-curve',
      },
      math: {
        latex: [
          'L(N) = (N_c/N)^{\\alpha_N}, \\quad \\alpha_N \\approx 0.076 \\text{ (Kaplan et al., 2020)}',
          '\\hat{L}(N,D) = E + A/N^{\\alpha} + B/D^{\\beta}, \\quad \\alpha \\approx 0.34,\\ \\beta \\approx 0.28 \\text{ (Hoffmann et al., 2022)}',
        ],
        notes:
          'Kaplan et al. fit separate power laws in model size N, dataset size D and compute C, and concluded ' +
          "compute-optimal training means a very large model on comparatively modest data (their fit implied " +
          'model size should grow roughly as C^0.73 against data growing as C^0.27). Hoffmann et al. refit this ' +
          'more carefully across over 400 models and found roughly equal scaling instead (close to C^0.5 for ' +
          'both) -- their Chinchilla model, 4x smaller than Gopher but trained on 4x more data at the same ' +
          'compute budget, outperformed it, showing most Kaplan-era large models were undertrained for their size.',
      },
      related: ['transformer-block', 'self-attention'],
      references: {
        free: [
          {
            title: 'Google DeepMind — An Empirical Analysis of Compute-Optimal Large Language Model Training',
            url: 'https://deepmind.google/blog/an-empirical-analysis-of-compute-optimal-large-language-model-training/',
          },
        ],
        papers: [
          { title: 'Scaling Laws for Neural Language Models', url: 'https://arxiv.org/abs/2001.08361', year: 2020 },
          { title: 'Training Compute-Optimal Large Language Models', url: 'https://arxiv.org/abs/2203.15556', year: 2022 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.9 — Large-Scale Pretraining with Transformers',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/large-pretraining-transformers.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'encoder-decoder-architectures',
      name: 'Encoder-Only vs. Decoder-Only vs. Encoder-Decoder',
      tier: 2,
      year: 2017,
      difficulty: 2,
      hook: 'Same transformer block, three wirings: read bidirectionally, generate causally, or do both in sequence.',
      intuition:
        'The original Transformer paired an encoder with a decoder because it was built for translation: the ' +
        'encoder reads the whole source sentence at once, attending in both directions, and the decoder ' +
        'generates the target sentence one token at a time, attending only to what it has already produced ' +
        'plus the encoder\'s output. Once people started reusing the architecture outside translation, it ' +
        'became clear you rarely need both halves. Keep only the encoder, let every token attend to every ' +
        'other token, and pretrain by predicting masked-out tokens, and you get a model tuned for understanding ' +
        'a fixed piece of text -- BERT. Keep only the decoder, mask each token from seeing the future, and ' +
        'pretrain by predicting the next token, and you get a model tuned for open-ended generation -- GPT. ' +
        'Keep both, as originally designed, and you get a model built for turning one sequence into a ' +
        'genuinely different one -- T5, BART, machine translation.',
      howItWorks: {
        summary:
          'The same self-attention block supports three wirings depending on which half of the original ' +
          "encoder-decoder Transformer is kept and how its self-attention is masked.",
        steps: [
          'Encoder-only: keep just the encoder stack, let every position attend to every other position (bidirectional), and pretrain with a task like masked-token prediction.',
          'Decoder-only: keep just the decoder stack, mask each position so it can only attend to earlier positions (causal), and pretrain with next-token prediction.',
          "Encoder-decoder: keep both -- the encoder attends bidirectionally, and the decoder attends causally to itself plus cross-attends to the encoder's output.",
        ],
      },
      whenToUse: [
        'The task is best framed as understanding a fixed span of text (classification, extraction, similarity) -- encoder-only',
        'The task is open-ended generation with no fixed separate input to condition on beyond a prompt -- decoder-only',
        'The task genuinely transforms one sequence into a different one with distinct input/output roles (translation, summarization) -- encoder-decoder',
      ],
      whenNotToUse: [
        'Pure generation with no distinct source sequence to condition on -- a decoder-only model handles it with half the parameters and a simpler training setup than encoder-decoder',
        'Open-ended generation with an encoder-only model -- bidirectional attention has no built-in mechanism to generate autoregressively at inference',
        'Assuming the split is free -- an encoder-decoder model roughly doubles parameter count and cross-attention adds compute relative to either single-stack alternative at the same layer depth',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'token-predictions-or-embeddings',
      },
      related: ['transformer-block', 'self-attention', 'seq2seq-encoder-decoder'],
      references: {
        free: [
          { title: 'Hugging Face LLM Course — Transformer Architectures', url: 'https://huggingface.co/learn/llm-course/en/chapter1/6' },
        ],
        papers: [
          { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', url: 'https://arxiv.org/abs/1810.04805', year: 2018 },
          { title: 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', url: 'https://arxiv.org/abs/1910.10683', year: 2019 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.9 — Large-Scale Pretraining with Transformers',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/large-pretraining-transformers.html',
          },
        ],
      },
    },
  ],
} satisfies Body;
