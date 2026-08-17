/**
 * Velocity — Inference & Efficiency. See PLAN.md §3 for the full moon list.
 *
 * All 7 moons from PLAN.md §3 are written here at their marked tiers — 6 Tier 1 (kv-cache,
 * flashattention, quantization, knowledge-distillation, speculative-decoding,
 * sampling-temperature-top-k-top-p) and 1 Tier 2 stub (continuous-batching-and-paged-attention).
 *
 * `eraRange` spans 2015 (Han, Mao & Dally's "Deep Compression" — the paper that established
 * trained quantization as mainstream, and the same year as Hinton, Vinyals & Dean's knowledge
 * distillation paper) to 2022 (FlashAttention, speculative decoding's two independent papers, and
 * Orca's continuous batching all landed the same year) — the min and max of each entry's own
 * `year` field, matching the convention set in jupiter.ts.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * Two PDF-fetch traps were caught rather than trusted:
 *   1. eyeriss.mit.edu's "Efficient Processing of Deep Neural Networks" excerpt PDF — WebFetch
 *      correctly refused to summarize the raw PDF bytes rather than inventing a table of
 *      contents. Self-extracted with `pdftotext -layout` instead (Bash tool), which is how the
 *      book's real chapter/section numbers cited below (§7.2.1 Quantization, §9.3 Knowledge
 *      Distillation) were confirmed — verbatim grep hits on the extracted text, not a summary.
 *   2. All specific numbers (FlashAttention's speedup/HBM-access claims, LLM.int8()'s outlier
 *      handling, GPTQ's bit-widths and GPU-hour figures, Pope et al.'s 3TB PaLM KV-cache figure)
 *      were pulled from arXiv `/abs/` pages or `ar5iv` full-text HTML renders, never a PDF — per
 *      CONTENT_GUIDE §3's explicit preference for HTML over any PDF summary.
 *
 * `references.video` is one consistent choice across every Tier 1 entry here: the YouTube channel
 * "Umar Jamil" (youtube.com/@umarjamilai). This isn't the CONTENT_GUIDE §5 default (StatQuest),
 * but StatQuest's own video index (statquest.org/video_index.html, checked directly) confirms it
 * has no dedicated coverage of any Velocity topic — these are all 2015-2023 systems/engineering
 * techniques, mostly newer than StatQuest's usual material. Umar Jamil's own video-index page
 * (umarjamil.org/videos, checked directly) confirms dedicated videos on FlashAttention, KV-cache
 * (as part of the LLaMA/Mistral breakdowns) and quantization specifically — a real, verified,
 * topically-accurate match, used here the same way the DBSCAN gold-standard entry links a
 * channel rather than a guessed video ID.
 *
 * `references.books` leans on two sources found by verifying, not assuming, that a classic text
 * covers something this recent: Sze, Chen, Yang & Emer's "Efficient Processing of Deep Neural
 * Networks" (2020) for quantization and knowledge-distillation (confirmed via the self-extracted
 * PDF text above), and Chip Huyen's "AI Engineering" (O'Reilly, 2025) for the other four, after
 * confirming its Chapter 9 ("Inference Optimization") explicitly covers KV cache, FlashAttention,
 * quantization, distillation, speculative decoding and sampling by name.
 *
 * Deliberate cross-body links: quantization → lora-and-qlora (Forge) is genuine — QLoRA's own
 * paper is explicitly about quantizing a frozen base model for LoRA fine-tuning. knowledge-
 * distillation → transfer-learning (Vulcan) is a real conceptual link, not decoration: both
 * transfer learned capability from one model/setting to another, even though the mechanisms
 * differ. continuous-batching-and-paged-attention and speculative-decoding → gpt-lineage
 * (Genesis) are framed accurately as serving-time techniques applied to the autoregressive models
 * that entry describes, not training-time ones.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'velocity',
  name: 'Velocity',
  segment: 'Inference & Efficiency',
  hook: 'Makes a trained model fast and cheap to actually run: caching, fusing, shrinking, batching, and choosing what to generate.',
  summary:
    "Velocity groups the techniques that make a trained model's inference fast, memory-efficient and cheap to serve at " +
    'scale — caching attention state, fusing GPU kernels, shrinking weights, compressing whole models, and deciding how ' +
    "requests and tokens get generated. None of it changes what a model learned; all of it changes how quickly and how " +
    'cheaply you can get answers out of it.',
  eraRange: [2015, 2022],
  moons: [
    {
      id: 'kv-cache',
      name: 'KV Cache',
      aliases: ['KV caching', 'key-value cache'],
      tier: 1,
      year: 2019,
      difficulty: 2,
      hook: "Caches every token's attention keys and values once, so generating the next token skips recomputing them.",
      intuition:
        'Generating text one token at a time means re-running attention over the whole sequence so far for every new ' +
        "word — except almost none of that work is actually new. At each layer, self-attention needs the keys and " +
        "values it computed for every earlier token, and those never change once a token has been processed. " +
        'Recomputing them from scratch at every step is like re-reading an entire book from page one just to write ' +
        'the next sentence of your summary, when you could simply keep your notes from the pages already read. The KV ' +
        'cache keeps exactly those notes: the key and value vectors of every past token, at every layer, stored in ' +
        'GPU memory and reused. Each new step only computes the query, key and value for the one new token, attends ' +
        "over the cache plus that new pair, and appends its own key/value to the cache. The cache turns each " +
        'decoding step from work proportional to the whole sequence into work proportional to one token — at the ' +
        'cost of memory that grows with every token generated.',
      howItWorks: {
        summary:
          "Store every layer's key and value tensors for each token the first time they're computed, and reuse them " +
          'on every later decoding step instead of recomputing them.',
        steps: [
          "Process the prompt in one forward pass (prefill), computing and storing every layer's key and value " +
            'tensors for every prompt token.',
          'To generate the next token, run the model forward only on the newly generated token, not the whole sequence.',
          "Compute that new token's query, key and value at each layer.",
          'Attend the new query over the cached keys/values plus the new pair, instead of recomputing keys/values ' +
            'for every earlier token.',
          "Append the new token's key and value to the cache at each layer.",
          'Repeat one token at a time until generation stops; the cache grows by one position per step.',
        ],
      },
      hyperparameters: [
        {
          name: 'cache_implementation',
          what: 'Which cache strategy to use — dynamic, static, quantized, or offloaded.',
          tuning:
            "Hugging Face Transformers defaults to DynamicCache, which grows as needed. Switch to 'static' to enable " +
            "torch.compile on the decoding loop for a reported up to 4x speedup, or to 'offloaded'/'quantized' when " +
            'GPU memory, not latency, is the binding constraint.',
        },
        {
          name: 'max_cache_len (static cache)',
          what: 'Maximum sequence length the cache pre-allocates space for.',
          tuning:
            'Set to your expected prompt-plus-generation length. Too small truncates usable context; too large ' +
            'reserves GPU memory up front that never gets used.',
        },
      ],
      whenToUse: [
        'You are generating text autoregressively (one token at a time) from a transformer decoder — a single-pass ' +
          'encoding or training step has no repeated decoding steps to cache across',
        'GPU memory has room for the cache, which grows linearly with sequence length, batch size, layers and heads',
        'You are doing multi-turn or iterative generation and can persist a previous cache instead of recomputing it ' +
          'from scratch on every new turn',
      ],
      whenNotToUse: [
        'Context length and batch size are large enough that the cache itself becomes the memory bottleneck — pair ' +
          'with multi-query/grouped-query attention or a quantized cache rather than disabling it outright',
        'You only need a single forward pass with no iterative decoding (e.g. classification, or scoring one ' +
          'sequence once) — there is nothing across steps to reuse',
      ],
      facets: {
        task: ['inference'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'cached-attention-state',
      },
      math: {
        latex: ['\\text{cache size} = 2 \\times L \\times H \\times d_{head} \\times n \\times b \\times \\text{bytes}'],
        notes:
          "The leading 2 accounts for storing both keys and values, at every one of L layers. This is pure memory " +
          "accounting — attention itself stays cheap, but the cache grows linearly with every generated token n, " +
          'every batch entry b, and every layer/head. Pope et al. found this large enough to become the dominant ' +
          "inference cost in practice: for PaLM 540B at batch size 512 and context length 2048, they report the KV " +
          "cache reaching 3TB — three times the size of the model's own parameters.",
      },
      complexity: {
        train: 'n/a — this is an inference-time technique, not a training method',
        predict:
          'O(1) new-token compute per decoding step instead of O(n) (n = tokens generated so far); cache memory ' +
          'grows as O(n) per sequence',
      },
      code: [
        'from transformers import AutoModelForCausalLM, AutoTokenizer, DynamicCache',
        'import torch',
        '',
        'tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")',
        'model = AutoModelForCausalLM.from_pretrained(',
        '    "meta-llama/Llama-2-7b-chat-hf", dtype=torch.float16, device_map="auto"',
        ')',
        'inputs = tokenizer("The theory of relativity states", return_tensors="pt").to(model.device)',
        '',
        "# use_cache=True (the default) reuses each layer's K/V tensors across decoding steps",
        'past_key_values = DynamicCache(config=model.config)',
        'outputs = model.generate(**inputs, max_new_tokens=50, past_key_values=past_key_values)',
        '',
        '# disabling it forces every step to reprocess the whole sequence from scratch — much slower',
        'slow_outputs = model.generate(**inputs, max_new_tokens=50, use_cache=False)',
      ].join('\n'),
      related: ['self-attention', 'transformer-block', 'flashattention', 'continuous-batching-and-paged-attention'],
      references: {
        free: [
          { title: 'Hugging Face Transformers docs — Caching (KV cache)', url: 'https://huggingface.co/docs/transformers/en/kv_cache' },
          { title: "Hugging Face Transformers docs — Optimizing LLM inference (static kv-cache)", url: 'https://huggingface.co/docs/transformers/main/en/llm_optims' },
        ],
        papers: [
          {
            title: 'Fast Transformer Decoding: One Write-Head is All You Need',
            url: 'https://arxiv.org/abs/1911.02150',
            year: 2019,
          },
          {
            title: 'Efficiently Scaling Transformer Inference',
            url: 'https://arxiv.org/abs/2211.05102',
            year: 2022,
          },
        ],
        books: [
          {
            title: 'AI Engineering: Building Applications with Foundation Models',
            author: 'Chip Huyen',
            chapter: 'Ch. 9 — Inference Optimization',
          },
        ],
        video: [{ title: 'Umar Jamil', url: 'https://www.youtube.com/@umarjamilai' }],
      },
    },
    {
      id: 'flashattention',
      name: 'FlashAttention',
      aliases: ['flash attention', 'IO-aware exact attention'],
      tier: 1,
      year: 2022,
      difficulty: 4,
      hook: 'Computes exactly the same attention, but tiles it through fast GPU memory so it never writes the full score matrix.',
      intuition:
        "Self-attention's actual arithmetic is cheap for a modern GPU; what's slow is moving data. Computing " +
        'attention the standard way builds the full sequence-length-by-sequence-length matrix of attention scores, ' +
        "writes it out to the GPU's slow high-bandwidth memory (HBM), reads it back to normalize with softmax, and " +
        'reads it again to multiply by the values — several round trips to slow memory for a matrix that never needs ' +
        'to exist all at once. FlashAttention never materializes that matrix. It splits the queries, keys and values ' +
        "into blocks small enough to fit in the GPU's fast on-chip SRAM, computes each block's partial attention " +
        'output and a running softmax correction entirely on-chip, and writes only the final output to HBM once. On ' +
        'the backward pass, instead of storing the huge attention matrix, it recomputes the pieces it needs from ' +
        'what it already saved. Same exact attention, same floating-point operations, dramatically fewer trips to ' +
        "slow memory — the paper calls this being IO-aware: optimizing for memory traffic rather than raw FLOPs, " +
        'because on modern hardware memory traffic is usually the real bottleneck.',
      howItWorks: {
        summary:
          "Tile queries, keys and values into blocks that fit in the GPU's on-chip SRAM, compute attention block by " +
          'block with a running softmax, and write the result to slow memory only once.',
        steps: [
          "Split queries, keys and values into blocks small enough to fit in the GPU's fast on-chip SRAM.",
          'For each block of keys/values, compute partial attention scores and outputs on-chip, without ever writing ' +
            'the full sequence-by-sequence score matrix to HBM.',
          'Maintain a running (online) softmax normalization that updates incrementally as each new block is ' +
            'processed, instead of normalizing over an entire row at once.',
          'Accumulate the running weighted sum of values as each block is processed.',
          'Write only the final attention output to HBM once all blocks have been processed.',
          'On the backward pass, recompute the needed intermediate values from the stored output and normalization ' +
            'statistics rather than reading back a stored full-size score matrix.',
        ],
      },
      hyperparameters: [
        {
          name: 'attn_implementation',
          what: "Which attention backend a model runs — e.g. 'eager', 'sdpa', or 'flash_attention_2'.",
          tuning:
            "Use 'flash_attention_2' when your GPU/dtype combination supports it (Ampere-class or newer, fp16/bf16); " +
            "it changes nothing about the model's outputs, only its speed and memory use. PyTorch's own " +
            'scaled_dot_product_attention will also dispatch to a FlashAttention kernel automatically when available.',
        },
        {
          name: 'block size (SRAM tile size)',
          what: 'How many queries/keys are processed per on-chip tile.',
          tuning:
            "Chosen automatically by the kernel from the GPU's SRAM size — not something users of the library-level " +
            'API normally hand-tune.',
        },
      ],
      whenToUse: [
        'You need exact attention (not an approximation) on GPU hardware FlashAttention supports (Ampere-class or ' +
          'newer for FlashAttention-2, fp16/bf16)',
        "Sequence lengths are long enough that standard attention's memory use or HBM traffic is the real bottleneck, " +
          'not raw FLOPs',
        'You are training or serving through a library that exposes it directly, or through PyTorch SDPA which can ' +
          'dispatch to it automatically',
      ],
      whenNotToUse: [
        'Hardware, dtype or the specific attention mask/bias in use is unsupported by the kernel — most frameworks ' +
          'fall back to a slower backend automatically rather than erroring',
        'Sequences are short enough that standard attention already fits comfortably in memory — FLOP count is ' +
          'unchanged, so there is little to gain when IO was never the bottleneck',
      ],
      facets: {
        task: ['inference'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'exact-attention-output',
      },
      math: {
        latex: ['O(N^2 d) \\text{ FLOPs (unchanged)}, \\qquad O(N) \\text{ additional memory (vs. } O(N^2) \\text{)}'],
        notes:
          "FlashAttention performs the identical computation as standard attention — same FLOPs, same output — so " +
          "accuracy is unaffected; Theorem 1 of Dao et al.'s paper states it needs O(N) additional memory beyond " +
          'inputs and output, versus O(N^2) for materializing the full score matrix. Theorem 2 gives the reason it ' +
          "is faster despite equal FLOPs: Θ(N^2 d^2 M^{-1}) HBM accesses versus Θ(Nd + N^2) for standard attention " +
          '(M = SRAM size), which the paper reports as up to 9x fewer memory accesses and up to 7.6x faster attention ' +
          'computation on GPT-2, even accounting for the extra FLOPs spent recomputing on the backward pass.',
      },
      complexity: {
        train: 'O(N^2 d) FLOPs — the same order as standard attention; FlashAttention reduces memory traffic, not arithmetic',
        predict: 'O(N) additional memory beyond inputs/output, versus O(N^2) for standard attention',
      },
      code: [
        'import torch',
        'from transformers import AutoModelForCausalLM',
        '',
        "# ask the model to run its attention layers through FlashAttention-2's fused kernel",
        'model = AutoModelForCausalLM.from_pretrained(',
        '    "mistralai/Mistral-7B-v0.1",',
        '    dtype=torch.bfloat16,',
        '    attn_implementation="flash_attention_2",',
        ')',
        '',
        "# or let PyTorch's scaled_dot_product_attention pick FlashAttention automatically",
        'from torch.nn.attention import SDPBackend, sdpa_kernel',
        '',
        'with sdpa_kernel(SDPBackend.FLASH_ATTENTION):',
        '    outputs = model.generate(**inputs)',
      ].join('\n'),
      related: ['self-attention', 'multi-head-attention', 'kv-cache'],
      references: {
        free: [
          {
            title: 'PyTorch tutorial — Scaled Dot Product Attention (SDPA)',
            url: 'https://docs.pytorch.org/tutorials/intermediate/scaled_dot_product_attention_tutorial.html',
          },
          { title: 'Hugging Face Transformers docs — Optimizing LLM inference (FlashAttention-2)', url: 'https://huggingface.co/docs/transformers/main/en/llm_optims' },
        ],
        papers: [
          {
            title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
            url: 'https://arxiv.org/abs/2205.14135',
            year: 2022,
          },
          {
            title: 'FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning',
            url: 'https://arxiv.org/abs/2307.08691',
            year: 2023,
          },
        ],
        books: [
          {
            title: 'AI Engineering: Building Applications with Foundation Models',
            author: 'Chip Huyen',
            chapter: 'Ch. 9 — Inference Optimization',
          },
        ],
        video: [{ title: 'Umar Jamil', url: 'https://www.youtube.com/@umarjamilai' }],
      },
    },
    {
      id: 'quantization',
      name: 'Quantization',
      aliases: ['model quantization', 'post-training quantization (PTQ)'],
      tier: 1,
      year: 2015,
      difficulty: 3,
      hook: 'Stores weights and activations in far fewer bits, trading a little precision for much less memory and faster math.',
      intuition:
        "A trained network's weights are usually stored as 32- or 16-bit floating point numbers, but the actual " +
        'information needed to make good predictions rarely needs that much precision. Quantization stores weights ' +
        '— and sometimes activations — in far fewer bits, typically 8 or 4, mapping the original range of values ' +
        'onto a small set of integers with a scale factor, and reversing that mapping (dequantizing) when the number ' +
        'is actually needed for a matrix multiply. A weight that needed four bytes in float32 needs a fraction of ' +
        "that in int4, which shrinks a model's memory footprint and the amount of data that has to move through the " +
        "GPU's memory bus — for a model too large to fit in a given GPU's memory, quantization can be the difference " +
        "between running at all and not. The catch is a small number of outlier values in large models that don't " +
        'compress well at low precision; modern methods either keep those outliers in higher precision separately or ' +
        'solve for the rounding that best preserves each layer\'s output, rather than rounding naively.',
      howItWorks: {
        summary:
          'Map the float range of a tensor onto a small integer range with a scale (and optionally a zero-point), ' +
          'round each value to its nearest quantized level, and dequantize back to float when the value is needed ' +
          'for computation.',
        steps: [
          'Choose a target bit width (e.g. int8, int4) and a granularity — per-tensor, per-channel, or per-group.',
          'Compute a scale (and optionally a zero-point) that maps the observed range of float values onto the ' +
            'chosen integer range.',
          'Round each weight, and optionally each activation, to its nearest representable quantized value using ' +
            'that scale.',
          'Optionally calibrate on a small dataset or solve for rounding that minimizes the resulting layer-output ' +
            'error (e.g. GPTQ), or isolate a small number of outlier values in higher precision instead of ' +
            'quantizing them (e.g. LLM.int8()).',
          'At inference time, dequantize back to floating point on the fly, or use integer kernels directly, to run ' +
            'the matrix multiply.',
        ],
      },
      hyperparameters: [
        {
          name: 'bits',
          what: 'Target bit width for weights (commonly 8 or 4).',
          tuning:
            "GPTQ's paper reports negligible accuracy loss at 3-4 bits and usable results down to 2-bit/ternary " +
            'quantization; 4-bit is the common practical default balancing size against quality.',
        },
        {
          name: 'granularity / group size',
          what: 'Whether one scale factor covers a whole tensor, one channel, or a small group of weights.',
          tuning:
            'Finer granularity (smaller groups) preserves accuracy better at the cost of a bit more overhead per ' +
            'group; per-channel or small-group quantization is a common default for weight-only methods.',
        },
      ],
      whenToUse: [
        'The model does not fit in available GPU memory at full or half precision, and reducing footprint is the priority',
        'You need to serve more concurrent requests or a larger batch on fixed hardware and can tolerate a small, ' +
          'measured accuracy loss',
        'You want to fine-tune a large model on limited hardware by quantizing the frozen base weights (e.g. QLoRA)',
      ],
      whenNotToUse: [
        'Accuracy is extremely sensitive and even the small degradation quantization introduces — especially at ' +
          'very low bit widths (2-3 bits) — is unacceptable for the task',
        'The model already runs comfortably at full precision on the target hardware with memory to spare — ' +
          'dequantization adds overhead that can slow things down (aside from compute-bound methods like AWQ) with ' +
          'no memory benefit to justify it',
      ],
      facets: {
        task: ['inference'],
        dataType: ['text', 'image'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'compressed-model-weights',
      },
      math: {
        latex: ['q = \\mathrm{round}\\!\\left(\\frac{x}{s}\\right) + z', 'x \\approx s\\,(q - z)'],
        notes:
          's (scale) and z (zero-point) are calibrated from the observed range of x; symmetric schemes fix z = 0. ' +
          'This is the standard affine quantization behind post-training methods like GPTQ and bitsandbytes — what ' +
          'differs between methods is how s and z are chosen (per-tensor vs. per-channel vs. per-group) and how ' +
          'carefully rounding error is corrected: GPTQ solves for weights that minimize the resulting layer output ' +
          'error, while LLM.int8() instead keeps a small number of outlier feature dimensions in 16-bit precision ' +
          'rather than quantizing them at all.',
      },
      complexity: {
        train:
          'n/a for basic post-training quantization — a calibration pass over a few hundred examples, not full ' +
          'training; GPTQ reports quantizing a 175B-parameter model in about 4 GPU-hours',
        predict:
          'Same asymptotic FLOPs as the unquantized model; the benefit is reduced memory bandwidth and footprint, ' +
          'and on hardware with native low-bit kernels, faster matrix multiplies',
      },
      code: [
        'from transformers import AutoModelForCausalLM, BitsAndBytesConfig',
        'import torch',
        '',
        'quant_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)',
        '',
        'model = AutoModelForCausalLM.from_pretrained(',
        '    "mistralai/Mistral-7B-v0.1",',
        '    quantization_config=quant_config,',
        '    device_map="auto",',
        ')',
        '# weights are stored in 4-bit and dequantized on the fly for each matmul',
      ].join('\n'),
      // lora-and-qlora is the genuine cross-body link: QLoRA's own paper is explicitly about
      // quantizing a frozen base model to fine-tune it with LoRA adapters. knowledge-distillation
      // is a real sibling link too — both are model-compression techniques, and HF's own
      // QuantizedCache can compress the KV cache the same way, linking back to kv-cache.
      related: ['lora-and-qlora', 'knowledge-distillation', 'kv-cache'],
      references: {
        free: [{ title: 'Hugging Face Transformers docs — Quantization overview', url: 'https://huggingface.co/docs/transformers/en/quantization/overview' }],
        papers: [
          {
            title: 'Deep Compression: Compressing Deep Neural Networks with Pruning, Trained Quantization and Huffman Coding',
            url: 'https://arxiv.org/abs/1510.00149',
            year: 2015,
          },
          {
            title: 'LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale',
            url: 'https://arxiv.org/abs/2208.07339',
            year: 2022,
          },
          {
            title: 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers',
            url: 'https://arxiv.org/abs/2210.17323',
            year: 2022,
          },
        ],
        books: [
          {
            title: 'Efficient Processing of Deep Neural Networks',
            author: 'Sze, Chen, Yang & Emer',
            chapter: 'Ch. 7.2.1 — Quantization',
          },
        ],
        video: [{ title: 'Umar Jamil', url: 'https://www.youtube.com/@umarjamilai' }],
      },
    },
    {
      id: 'knowledge-distillation',
      name: 'Knowledge Distillation',
      aliases: ['model distillation', 'teacher-student training'],
      tier: 1,
      year: 2015,
      difficulty: 3,
      hook: "Trains a small student to match a large teacher's full softened output distribution, not just its top label.",
      intuition:
        "A large trained model doesn't just know the right answer for each input — its full probability distribution " +
        "over the wrong answers carries information too. A model classifying a blurry '2' might put 90% probability " +
        "on '2', but split the remaining 10% mostly between '3' and '7' rather than evenly across all ten digits, and " +
        'that pattern reveals something about how the classes relate that a single hard label never captures. ' +
        "Knowledge distillation trains a small 'student' model to reproduce a large 'teacher' model's full output " +
        'distribution rather than just its top prediction, typically softened with a temperature that spreads out ' +
        'the probabilities so the student can see relationships among the low-probability classes it would otherwise ' +
        "miss. The student trains on a weighted mix of matching the teacher's softened distribution and getting the " +
        "true label right, ending up smaller and faster than the teacher while capturing more of what the teacher " +
        'knew than training on hard labels alone would.',
      howItWorks: {
        summary:
          "Soften both a trained teacher's and an untrained student's output logits with a temperature, train the " +
          "student to match the teacher's softened distribution, and combine that with the student's ordinary " +
          'label loss.',
        steps: [
          'Train (or take an existing) large teacher model to convergence on the task.',
          'Define a smaller student model architecture.',
          "Run both models on the same inputs and soften each model's output logits with a temperature T in the softmax.",
          "Compute a distillation loss between the student's and teacher's softened distributions (e.g. KL divergence).",
          "Combine that with the student's ordinary cross-entropy loss against the true labels, weighted between the two.",
          'Train the student on the combined loss; discard the teacher at deployment time.',
        ],
      },
      hyperparameters: [
        {
          name: 'temperature (T)',
          what: 'Softens the softmax over both teacher and student logits before computing the distillation loss.',
          tuning:
            "Hinton, Vinyals and Dean's own experiments found higher temperatures (8 and above) worked well with " +
            'larger students, but a lower T (2.5-4) worked better with much smaller ones; in their speech-recognition ' +
            'experiments, T=2 was best among {1, 2, 5, 10} tested.',
        },
        {
          name: 'alpha (loss weight)',
          what: 'Balance between the distillation loss (matching the teacher) and the ordinary hard-label cross-entropy loss.',
          tuning:
            'Start near an even split and shift toward the hard-label loss if the student underperforms on the true ' +
            'task, or toward the distillation loss if it appears to overfit the hard labels.',
        },
      ],
      whenToUse: [
        'You have, or can train, a large accurate teacher model and need a smaller model for deployment under real ' +
          'latency, memory or cost constraints',
        'The task has correlated classes where the probabilities on wrong answers carry useful information beyond ' +
          'the single correct label',
        'You have unlabeled or weakly labeled data available at scale, since the teacher can generate soft targets ' +
          'for it during distillation',
      ],
      whenNotToUse: [
        'You lack a good teacher model in the first place, or teacher and student architectures are similar enough ' +
          'that the gap over training the small model directly is negligible',
        'You need a compressed model immediately and cannot afford the extra training run distillation requires — ' +
          'quantization or pruning compress an existing model without retraining it from scratch',
      ],
      facets: {
        task: ['inference'],
        dataType: ['text', 'image'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'compressed-student-model',
      },
      math: {
        latex: [
          'q_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}',
          '\\mathcal{L} = \\alpha \\, \\mathrm{KL}\\!\\left(q^{\\text{teacher}} \\,\\|\\, q^{\\text{student}}\\right) + (1-\\alpha)\\, \\mathrm{CE}\\!\\left(y,\\, q^{\\text{student}}_{T=1}\\right)',
        ],
        notes:
          "T=1 recovers the ordinary softmax; T>1 softens the distribution so the relative sizes of the non-target " +
          "probabilities — what Hinton, Vinyals and Dean's paper describes as revealing 'how the cumbersome model " +
          "tends to generalize' — become large enough for the student to learn from. Both teacher and student logits " +
          'are divided by the same T when computing the distillation term.',
      },
      complexity: {
        train:
          'Requires a full additional training run for the student (plus, if not already trained, the teacher) — ' +
          'roughly the cost of training the student directly, plus teacher inference to generate soft targets',
        predict:
          "Prediction cost is just the student's own forward pass — the teacher is discarded after training, so " +
          'there is no extra inference-time cost',
      },
      code: [
        'import torch.nn.functional as F',
        '',
        'def distillation_loss(student_logits, teacher_logits, labels, T=2.0, alpha=0.5):',
        '    soft_teacher = F.softmax(teacher_logits / T, dim=-1)',
        '    soft_student = F.log_softmax(student_logits / T, dim=-1)',
        '    kd_loss = F.kl_div(soft_student, soft_teacher, reduction="batchmean") * (T ** 2)',
        '    hard_loss = F.cross_entropy(student_logits, labels)',
        '    return alpha * kd_loss + (1 - alpha) * hard_loss',
      ].join('\n'),
      // transfer-learning is the genuine cross-body link: both transfer learned capability from
      // one model/setting to another, though the mechanisms differ (fine-tuning weights vs.
      // matching a soft output distribution).
      related: ['transfer-learning', 'quantization'],
      references: {
        free: [
          {
            title: 'PyTorch tutorial — Knowledge Distillation',
            url: 'https://docs.pytorch.org/tutorials/beginner/knowledge_distillation_tutorial.html',
          },
        ],
        papers: [
          {
            title: 'Distilling the Knowledge in a Neural Network',
            url: 'https://arxiv.org/abs/1503.02531',
            year: 2015,
          },
        ],
        books: [
          {
            title: 'Efficient Processing of Deep Neural Networks',
            author: 'Sze, Chen, Yang & Emer',
            chapter: 'Ch. 9.3 — Knowledge Distillation',
          },
        ],
        video: [{ title: 'Umar Jamil', url: 'https://www.youtube.com/@umarjamilai' }],
      },
    },
    {
      id: 'speculative-decoding',
      name: 'Speculative Decoding',
      aliases: ['speculative sampling'],
      tier: 1,
      year: 2022,
      difficulty: 3,
      hook: 'Lets a small draft model guess several tokens ahead, then verifies them all in one pass of the big model.',
      intuition:
        "Generating with a large model is slow mainly because loading its weights from memory for every single token " +
        'is expensive, and that cost barely changes whether you process one token or several at once. Speculative ' +
        "decoding exploits that: a small, fast 'draft' model guesses the next several tokens on its own, cheaply, " +
        "one at a time. The large 'target' model then processes that whole draft in a single forward pass — a " +
        'transformer can score many positions in parallel — and checks each guessed token against what it would ' +
        'have produced itself. Correct guesses are accepted outright; the first wrong guess is rejected and ' +
        "resampled from a corrected distribution that exactly cancels out the draft model's bias, so the final " +
        'output has precisely the same probability distribution as generating from the target model alone, token by ' +
        'token. When the draft model guesses well, several tokens come out of the big model for the price of one ' +
        'forward pass instead of several sequential ones — and the guarantee holds even when it guesses badly, just ' +
        'with less speedup.',
      howItWorks: {
        summary:
          'Have a small draft model propose several tokens ahead, verify them all in one target-model forward pass, ' +
          'accept the ones the target model agrees with, and resample the first disagreement from a bias-corrected ' +
          'distribution.',
        steps: [
          'Use a small, fast draft model to generate the next k candidate tokens autoregressively.',
          "Run the large target model once, in parallel, over the draft sequence to get its own probabilities for " +
            'each of those k positions.',
          "Accept each draft token with probability min(1, p_target / p_draft) — always accept if the target model's " +
            "probability for it is at least as high as the draft model's.",
          'On the first rejection, resample that position from the residual distribution that corrects for the ' +
            "draft model's bias, rather than keeping the rejected token.",
          'Every accepted token plus the one resampled token become the newly generated tokens for this round.',
          'Repeat, restarting the draft model from the new end of the sequence.',
        ],
      },
      hyperparameters: [
        {
          name: 'draft length (k)',
          what: 'How many tokens the draft model proposes per round before the target model verifies them.',
          tuning:
            'Larger k risks more rejected (wasted) draft tokens when the draft and target disagree often; smaller k ' +
            'gives up potential speedup. Some implementations adapt k dynamically based on the recent acceptance rate.',
        },
        {
          name: 'draft/assistant model choice',
          what: 'Which smaller model proposes candidate tokens.',
          tuning:
            'Must share the same tokenizer as the target model. The larger the size gap while keeping predictions ' +
            'aligned, and the higher the agreement rate with the target model on typical inputs, the larger the speedup.',
        },
      ],
      whenToUse: [
        'Generation is memory-bandwidth bound (typical for single-sequence or small-batch autoregressive decoding), ' +
          'where verifying several tokens costs about the same as generating one',
        'You have, or can obtain, a smaller draft model that agrees with the target model reasonably often on your ' +
          'typical inputs',
        "You need decoding sped up without changing the model's output distribution at all — it is lossless by construction",
      ],
      whenNotToUse: [
        "Batch sizes are already large, so decoding is compute-bound rather than memory-bandwidth bound — the " +
          "target model's forward pass is already the bottleneck and verifying extra draft tokens adds cost without much to gain",
        'No adequate draft model is available and obtaining or distilling one is not worth the engineering cost for ' +
          'the expected speedup',
      ],
      facets: {
        task: ['inference'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'verified-token-sequence',
      },
      math: {
        latex: [
          '\\Pr(\\text{accept } x) = \\min\\!\\left(1, \\frac{p(x)}{q(x)}\\right)',
          "p'(x) = \\mathrm{norm}\\!\\left(\\max(0,\\, p(x) - q(x))\\right)",
        ],
        notes:
          "q is the draft model's distribution, p is the target model's. A token is always accepted if the target " +
          "model agrees it's at least as likely as the draft model did; otherwise it is accepted with probability " +
          "p(x)/q(x), and on rejection the next token is resampled from p' — the residual probability mass that q " +
          "underrepresented. Leviathan, Kalman and Matias prove this combination samples exactly from p's " +
          'distribution overall, which is why the technique changes nothing about the output despite skipping most ' +
          "of the target model's sequential forward passes.",
      },
      complexity: {
        train: 'n/a — an inference-time technique, unless the draft model itself still needs to be trained or distilled',
        predict:
          'One draft-model forward pass per proposed token, plus one target-model forward pass per k proposed ' +
          'tokens instead of one per token; Leviathan et al. report 2-3x wall-clock speedup on T5-XXL, and Chen et ' +
          'al. report 2-2.5x on a 70B-parameter model',
      },
      code: [
        'from transformers import AutoModelForCausalLM, AutoTokenizer',
        '',
        'tokenizer = AutoTokenizer.from_pretrained("facebook/opt-1.3b")',
        'inputs = tokenizer("Einstein\'s theory of relativity states", return_tensors="pt")',
        '',
        'model = AutoModelForCausalLM.from_pretrained("facebook/opt-1.3b")',
        'assistant_model = AutoModelForCausalLM.from_pretrained("facebook/opt-125m")  # ~10x smaller draft model',
        '',
        '# the draft model proposes tokens; the target model verifies them in one forward pass',
        'outputs = model.generate(**inputs, assistant_model=assistant_model, do_sample=True, temperature=0.7)',
      ].join('\n'),
      // gpt-lineage is the genuine cross-body link: speculative decoding is a serving-time
      // technique applied to the autoregressive decoder-only models that entry describes, not a
      // training-time one.
      related: ['kv-cache', 'continuous-batching-and-paged-attention', 'gpt-lineage'],
      references: {
        free: [
          { title: 'Hugging Face blog — Assisted Generation: a new direction toward low-latency text generation', url: 'https://huggingface.co/blog/assisted-generation' },
          { title: 'Hugging Face Transformers docs — Optimizing LLM inference (speculative decoding)', url: 'https://huggingface.co/docs/transformers/main/en/llm_optims' },
        ],
        papers: [
          {
            title: 'Fast Inference from Transformers via Speculative Decoding',
            url: 'https://arxiv.org/abs/2211.17192',
            year: 2022,
          },
          {
            title: 'Accelerating Large Language Model Decoding with Speculative Sampling',
            url: 'https://arxiv.org/abs/2302.01318',
            year: 2023,
          },
        ],
        books: [
          {
            title: 'AI Engineering: Building Applications with Foundation Models',
            author: 'Chip Huyen',
            chapter: 'Ch. 9 — Inference Optimization',
          },
        ],
        video: [{ title: 'Umar Jamil', url: 'https://www.youtube.com/@umarjamilai' }],
      },
    },
    {
      id: 'continuous-batching-and-paged-attention',
      name: 'Continuous Batching & PagedAttention',
      aliases: ['iteration-level scheduling'],
      tier: 2,
      year: 2022,
      difficulty: 3,
      hook: 'Keeps a serving batch full by swapping in new requests every step, and pages the KV cache the way an OS pages memory.',
      intuition:
        "Serving many users' requests to an LLM at once needs batching for GPU efficiency, but requests don't arrive " +
        "or finish together — one reply might be a sentence, another might run for paragraphs. Static batching locks " +
        'a group of requests together until every one finishes, so the GPU sits idle waiting on the slowest sequence ' +
        'while shorter ones have long since finished. Continuous batching, introduced by the Orca serving system, ' +
        'fixes this by scheduling at the level of individual decoding steps rather than whole requests: the moment ' +
        'any sequence finishes, a new waiting request slides into its slot, so batch composition changes every ' +
        "iteration instead of staying fixed. PagedAttention solves a companion problem: each sequence's KV cache " +
        'needs somewhere to live in GPU memory, and reserving one large contiguous block per sequence wastes a lot ' +
        'of it to fragmentation and over-allocation. PagedAttention instead manages the KV cache in small fixed-size ' +
        'blocks, the way an operating system pages virtual memory, so sequences can grow, shrink and even share ' +
        'memory without ever needing one contiguous allocation.',
      howItWorks: {
        summary:
          'Continuous batching swaps finished requests out and waiting requests in at every decoding step instead of ' +
          "waiting for a whole batch to finish; PagedAttention stores each sequence's KV cache in small blocks " +
          'rather than one contiguous allocation.',
        steps: [
          'Continuous batching: after every decoding step, remove any sequence that just finished and admit a new ' +
            'waiting request into its slot, instead of waiting for the whole batch to finish together.',
          "PagedAttention: divide each sequence's KV cache into fixed-size blocks rather than one contiguous allocation.",
          'PagedAttention: maintain a per-sequence block table mapping logical positions to physical blocks, so ' +
            'blocks can be allocated on demand and shared between sequences (e.g. a common prompt prefix).',
        ],
      },
      whenToUse: [
        'You are serving many concurrent, variable-length generation requests (a chat or API service) rather than a ' +
          'single fixed batch job',
        'GPU throughput is suffering because fixed batches sit idle waiting on their slowest sequence, or KV-cache ' +
          'memory fragmentation is limiting how many sequences you can serve at once',
      ],
      whenNotToUse: [
        'You are running a single offline batch job with known, similar-length sequences submitted all at once — ' +
          'static batching is simpler and continuous batching has less to gain',
        'You are not operating a multi-request serving system at all (e.g. local single-user inference) — these are ' +
          "server-side scheduling and memory-management techniques, not something a single generate() call needs",
      ],
      facets: {
        task: ['inference'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'scheduled-generation-batch',
      },
      related: ['kv-cache', 'speculative-decoding', 'gpt-lineage'],
      references: {
        free: [
          { title: 'vLLM docs — PagedAttention design', url: 'https://docs.vllm.ai/en/latest/design/paged_attention.html' },
          { title: 'Anyscale blog — How continuous batching enables 23x throughput in LLM inference', url: 'https://www.anyscale.com/blog/continuous-batching-llm-inference' },
        ],
        papers: [
          {
            title: 'Orca: A Distributed Serving System for Transformer-Based Generative Models',
            url: 'https://www.usenix.org/conference/osdi22/presentation/yu',
            year: 2022,
          },
          {
            title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention',
            url: 'https://arxiv.org/abs/2309.06180',
            year: 2023,
          },
        ],
      },
    },
    {
      id: 'sampling-temperature-top-k-top-p',
      name: 'Sampling: Temperature, Top-k & Top-p',
      aliases: ['nucleus sampling', 'stochastic decoding'],
      tier: 1,
      year: 2018,
      difficulty: 2,
      hook: "Controls how randomly a model picks its next token: temperature reshapes the odds, top-k and top-p trim the field.",
      intuition:
        'Once a language model produces a probability distribution over the next token, something still has to turn ' +
        'that distribution into an actual choice. Always picking the single most likely token (greedy decoding) ' +
        'produces flat, repetitive text, because natural language is not actually that predictable word to word. ' +
        'Temperature reshapes the distribution before sampling: dividing the logits by a number below 1 sharpens it ' +
        'toward the most likely tokens, above 1 flattens it toward uniform, making output more conservative or more ' +
        'random respectively. Top-k sampling throws away everything but the k most likely tokens and samples only ' +
        "from those, which stops the model from ever picking a wildly unlikely word but uses a fixed cutoff " +
        "regardless of how confident the distribution is. Top-p (nucleus) sampling fixes that by keeping a " +
        'variable-sized set instead: whichever smallest group of tokens has cumulative probability at least p, so ' +
        "the cutoff shrinks automatically when the model is confident and widens when it isn't.",
      howItWorks: {
        summary:
          'Reshape next-token probabilities with a temperature, then restrict sampling to a fixed-size (top-k) or ' +
          'cumulative-probability (top-p) subset of the vocabulary before drawing the next token.',
        steps: [
          'Compute the raw logits (unnormalized scores) for the next token from the model.',
          'Divide the logits by the temperature T before the softmax, sharpening (T<1) or flattening (T>1) the ' +
            'resulting distribution.',
          'Optionally restrict to the top-k highest-probability tokens, or to the smallest set of tokens whose ' +
            'cumulative probability exceeds p (top-p / nucleus), zeroing out the rest.',
          'Renormalize the remaining probabilities to sum to 1.',
          'Sample the next token from that final distribution.',
        ],
      },
      hyperparameters: [
        {
          name: 'temperature',
          what: 'Scales logits before the softmax; controls how sharply probability concentrates on the most likely tokens.',
          tuning:
            '1.0 leaves the distribution unchanged; lower (e.g. 0.6-0.7) is common for more focused output, higher ' +
            '(1.2+) for more diverse/creative output; values near 0 approach greedy decoding.',
        },
        {
          name: 'top_k',
          what: 'Restricts sampling to the k most probable tokens at each step.',
          tuning:
            "Fan et al.'s original top-k story-generation paper used k=10; Hugging Face's own worked example uses " +
            'k=50. Too small can make output bland; too large approaches unrestricted sampling.',
        },
        {
          name: 'top_p',
          what: 'Restricts sampling to the smallest set of tokens whose cumulative probability exceeds p.',
          tuning:
            'Holtzman et al. used p around 0.92-0.95 in their experiments; commonly combined with a modest ' +
            'temperature rather than used alone.',
        },
      ],
      whenToUse: [
        'You want varied, creative output (chat, stories, brainstorming) rather than the single most likely ' +
          'continuation every time',
        'You need multiple diverse completions from the same prompt, e.g. for best-of-n selection or dataset diversity',
        'The task tolerates some randomness and benefits from a tunable diversity knob rather than fully deterministic output',
      ],
      whenNotToUse: [
        'The task needs a fully deterministic, reproducible answer (e.g. code execution, structured extraction, ' +
          'grading) — use greedy decoding or a fixed seed instead',
        'You need the single highest-probability sequence overall rather than a plausible one — beam search targets ' +
          'that objective; sampling does not',
      ],
      facets: {
        task: ['inference', 'generation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'sampled-token',
      },
      math: {
        latex: [
          'P(w_i) = \\frac{\\exp(z_i/T)}{\\sum_j \\exp(z_j/T)}',
          '\\text{top-}p:\\ \\text{smallest } V_p \\subseteq V \\text{ s.t. } \\sum_{w \\in V_p} P(w) \\ge p',
        ],
        notes:
          'Temperature is applied before the softmax, so it reshapes probabilities smoothly; top-k and top-p ' +
          'instead hard-truncate the distribution to a subset of the vocabulary V and renormalize over just that ' +
          "subset before sampling. Top-p's subset size changes token to token — a handful of tokens when the model " +
          "is confident, many more when it isn't — which is what Holtzman et al. describe as sampling from the " +
          "'dynamic nucleus' of the distribution rather than a fixed-size set.",
      },
      complexity: {
        train: 'n/a — a decoding-time choice, not a training method',
        predict:
          "O(V log V) per step to sort the vocabulary for top-k/top-p filtering (V = vocabulary size), negligible " +
          "next to the model's own forward-pass cost",
      },
      code: [
        'from transformers import AutoModelForCausalLM, AutoTokenizer',
        '',
        'tokenizer = AutoTokenizer.from_pretrained("gpt2")',
        'model = AutoModelForCausalLM.from_pretrained("gpt2")',
        'inputs = tokenizer("The weather today is", return_tensors="pt")',
        '',
        'outputs = model.generate(',
        '    **inputs,',
        '    do_sample=True,',
        '    temperature=0.7,  # < 1 sharpens the distribution toward the most likely tokens',
        '    top_k=50,         # keep only the 50 most likely tokens at each step',
        '    top_p=0.92,       # then keep the smallest set whose probability mass exceeds 0.92',
        '    max_new_tokens=40,',
        ')',
      ].join('\n'),
      related: ['gpt-lineage', 'causal-vs-masked-language-modeling', 'speculative-decoding'],
      references: {
        free: [{ title: 'Hugging Face blog — How to generate text: using different decoding methods', url: 'https://huggingface.co/blog/how-to-generate' }],
        papers: [
          {
            title: 'Hierarchical Neural Story Generation',
            url: 'https://arxiv.org/abs/1805.04833',
            year: 2018,
          },
          {
            title: 'The Curious Case of Neural Text Degeneration',
            url: 'https://arxiv.org/abs/1904.09751',
            year: 2019,
          },
        ],
        books: [
          {
            title: 'AI Engineering: Building Applications with Foundation Models',
            author: 'Chip Huyen',
            chapter: 'Ch. 9 — Inference Optimization',
          },
        ],
        video: [{ title: 'Umar Jamil', url: 'https://www.youtube.com/@umarjamilai' }],
      },
    },
  ],
} satisfies Body;
