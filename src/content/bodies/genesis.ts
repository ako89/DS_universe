/**
 * Genesis — Pretraining & Model Families. See PLAN.md §3 for the full moon list.
 *
 * Complete: all 8 moons from PLAN.md §3 are written here at their marked tiers — 6 Tier 1
 * (causal-vs-masked-language-modeling, bert-lineage, gpt-lineage, data-curation-and-deduplication,
 * mixture-of-experts, state-space-models-mamba) and 2 Tier 2 stubs (t5-and-encoder-decoder,
 * long-context-architectures).
 *
 * `eraRange` is [2017, 2024]: 2017 is Shazeer et al.'s sparsely-gated MoE paper, the earliest
 * confirmed publication cited across any of the 8 moons; 2024 is the FineWeb paper (cited in
 * data-curation-and-deduplication) and the Mixtral of Experts paper (cited in mixture-of-experts),
 * the latest. Individual moons' own `year` fields are pinned to the foundational paper for that
 * lineage or technique (e.g. bert-lineage:2018, gpt-lineage:2018, mixture-of-experts:2017,
 * state-space-models-mamba:2021 for S4, the modern line's origin) rather than the newest variant
 * discussed in its prose — the same convention jupiter.ts uses (dbscan:1996 despite discussing a
 * 2017 revisit) — but `eraRange` itself is computed from every confirmed publication year actually
 * cited across all 8 moons, per this batch's brief, not from the 8 `year` fields alone.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * One PDF-fetch trap surfaced and was caught rather than trusted: WebFetch on
 * https://web.stanford.edu/~jurafsky/slp3/7.pdf (checking whether that chapter discusses Mixture
 * of Experts, for a possible book citation) returned "No" along with a note that the PDF looked
 * like a scanned/corrupted stream it could not read cleanly — an honest failure this time, not an
 * invented answer, but treated as untrustworthy either way per the PDF rule, so no MoE claim was
 * sourced from it and Bishop's PRML (verified instead, via HTML search corroboration of its
 * table-of-contents section 14.5.3 "Mixtures of experts") was used for that book reference.
 * GPT-1 and GPT-2's original papers have no arXiv id — OpenAI published them as PDFs only — so
 * their title/authors/year were confirmed via independent secondary HTML sources (search results,
 * the openai/gpt-2 GitHub README, Hugging Face's GPT-2 model card) rather than by trusting a
 * WebFetch summary of the PDFs themselves; the PDF URLs are cited only as the canonical location,
 * with no specific number pulled from a PDF fetch.
 *
 * Deliberate cross-body links, verified rather than assumed: state-space-models-mamba →
 * kalman-filters-and-state-space-models (Chronos) is real — the Mamba paper's own §2 cites
 * Kalman (1960) and frames SSMs as "inspiration from classical state space models"; its link to
 * lstm/vanishing-gradients-and-universal-approximation is also real — the S4 paper (Mamba's direct
 * predecessor) explicitly motivates the architecture by RNNs' vanishing/exploding-gradient problem
 * on long-range dependencies, confirmed by reading its introduction and §2.2, not assumed from
 * general knowledge. mixture-of-experts and state-space-models-mamba both link to scaling-laws
 * (Nova) as genuine architectural responses to the same scaling-cost problem. causal-vs-masked,
 * bert-lineage and gpt-lineage all link to Nova's encoder-decoder-architectures entry, which
 * already discusses encoder-only vs. decoder-only vs. encoder-decoder concretely by name-checking
 * BERT, GPT and T5 — confirmed by reading that entry directly rather than assuming the overlap.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'genesis',
  name: 'Genesis',
  segment: 'Pretraining & Model Families',
  hook: 'How raw text becomes a base model: the two pretraining objectives, the lineages they spawned, and what feeds them.',
  summary:
    'Genesis covers how large language models are actually built before any fine-tuning happens — the objective a model is ' +
    'pretrained with, the architectural families (BERT, GPT, T5) that objective produced, the data pipelines that feed it, ' +
    'and the newer architectural responses (Mixture of Experts, state space models, long-context techniques) to the cost of ' +
    'scaling it further.',
  eraRange: [2017, 2024],
  moons: [
    {
      id: 'causal-vs-masked-language-modeling',
      name: 'Causal vs. Masked Language Modelling',
      aliases: [
        'autoregressive vs. bidirectional pretraining',
        'next-token prediction vs. masked-token prediction',
      ],
      tier: 1,
      year: 2018,
      difficulty: 2,
      hook: 'Predict the next word in order, or guess a hidden word from both sides — the two ways to pretrain on raw text.',
      intuition:
        "Give a model a sentence with the last word removed and ask it to guess what comes next, and you've trained it to " +
        "write — that's causal language modelling, GPT's objective. Instead cover a word in the middle and ask the model " +
        "to guess it using everything before and after, like a fill-in-the-blank exercise, and you've trained it to " +
        "understand — that's masked language modelling, BERT's objective. Both turn raw, unlabelled text into a " +
        'supervised training signal for free, which is the whole trick behind modern pretraining. The difference is what ' +
        'each objective forces the model to become. Predicting strictly left-to-right builds a model that can only look ' +
        'backward, which is exactly the constraint generation needs at inference time. Predicting from both directions ' +
        'builds a model that can see an entire input at once, which is exactly what fixed-input tasks like classification ' +
        'reward — but that same bidirectionality makes left-to-right generation impossible without extra machinery.',
      howItWorks: {
        summary:
          'Causal LM factorises the sequence probability left-to-right and masks future tokens from attention; masked LM ' +
          'corrupts a fraction of tokens and asks the model to recover them from the uncorrupted rest.',
        steps: [
          'Causal LM: feed the model a sequence and, at each position, predict the next token using only tokens before it (a triangular mask blocks the future).',
          'Causal LM: sum the per-position cross-entropy losses across the whole sequence and backpropagate — every token supervises the model at once.',
          'Masked LM: randomly select a subset of input tokens (BERT masks 15%) and replace most of them with a special mask token.',
          'Masked LM: run the corrupted sequence through a bidirectional encoder, where every token attends to every other token, masked or not.',
          'Masked LM: predict only the original identity of the masked positions and compute the loss over those positions alone.',
        ],
      },
      whenToUse: [
        'You need open-ended generation (chat, completion, code) — causal LM is the natural fit, since decoding at inference is inherently left-to-right',
        'You need a representation of a complete, fixed input for classification, extraction or similarity — masked LM lets every token use both left and right context',
        "You're choosing a pretraining objective for a new encoder that will be fine-tuned on understanding tasks rather than used to generate text",
      ],
      whenNotToUse: [
        'You need to generate text from a model pretrained with masked LM — MLM has no built-in left-to-right decoding procedure and generation quality suffers badly',
        "You need every token to see the full input and you're building purely with causal LM — causal attention structurally cannot look ahead, wasting information already available in a fixed-size input",
        'The task is sequence-to-sequence (translation, summarization) — neither pure objective fits as well as an encoder-decoder combining bidirectional encoding with causal decoding',
      ],
      facets: {
        task: ['representation', 'generation'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'next-token-distribution-or-token-embeddings',
      },
      math: {
        latex: [
          'p(x) = \\prod_{t=1}^{T} p(x_t \\mid x_{<t}) \\quad \\text{(causal LM)}',
          '\\mathcal{L}_{\\text{MLM}} = -\\sum_{i \\in M} \\log p(x_i \\mid x_{\\setminus M}) \\quad (M = \\text{masked positions})',
        ],
        notes:
          'Causal LM factorises the joint sequence probability exactly, with no independence assumption, which is what ' +
          'lets it be sampled from autoregressively token by token. Masked LM does not define a valid joint distribution ' +
          'over the sequence at all — it optimises the sum of conditional log-likelihoods for the masked positions only, ' +
          'which is why an MLM cannot generate a coherent sequence by repeatedly sampling masked positions the way a ' +
          'causal LM generates by repeatedly sampling the next token.',
      },
      code: [
        "from transformers import AutoModelForCausalLM, AutoModelForMaskedLM, AutoTokenizer",
        "",
        "gpt_tok = AutoTokenizer.from_pretrained('gpt2')",
        "gpt = AutoModelForCausalLM.from_pretrained('gpt2')                    # left-to-right, causal mask",
        "",
        "bert_tok = AutoTokenizer.from_pretrained('bert-base-uncased')",
        "bert = AutoModelForMaskedLM.from_pretrained('bert-base-uncased')     # bidirectional, masked tokens",
        "",
        "# causal: model predicts token t+1 from tokens <= t",
        "# masked: model predicts the token at masked positions from the full corrupted sequence",
      ].join('\n'),
      related: ['bert-lineage', 'gpt-lineage', 'encoder-decoder-architectures', 'contextual-embeddings'],
      references: {
        free: [
          { title: 'The Illustrated BERT, ELMo, and co.', url: 'https://jalammar.github.io/illustrated-bert/' },
          { title: 'The Illustrated GPT-2', url: 'https://jalammar.github.io/illustrated-gpt2/' },
        ],
        papers: [
          { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', url: 'https://arxiv.org/abs/1810.04805', year: 2018 },
          { title: 'Improving Language Understanding by Generative Pre-Training', url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf', year: 2018 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.9 — Large-Scale Pretraining with Transformers',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/large-pretraining-transformers.html',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'bert-lineage',
      name: 'BERT Lineage',
      aliases: ['Bidirectional Encoder Representations from Transformers', 'BERT and its successors'],
      tier: 1,
      year: 2018,
      difficulty: 3,
      hook: 'One bidirectional encoder pretrained to fill in blanks, then stripped down, sped up and re-tuned by its successors.',
      intuition:
        'BERT took the encoder half of the Transformer, trained it to fill in blanks (masked language modelling) plus ' +
        'guess whether one sentence follows another, and showed that fine-tuning that one pretrained encoder beat ' +
        'task-specific architectures across nearly every NLP benchmark of its time. That result triggered a wave of ' +
        "variants that each questioned one of BERT's original design choices rather than the recipe itself. RoBERTa " +
        'asked whether BERT was simply undertrained, and found yes — more data, bigger batches, dynamic masking, and ' +
        'dropping the next-sentence task alone closed much of the remaining gap. ALBERT asked whether all those ' +
        'parameters were necessary, and shared them across layers to shrink the model. DistilBERT asked whether you ' +
        "even needed the full model at inference, and trained a smaller student to mimic a BERT teacher's outputs. None " +
        'changed the core idea — bidirectional attention plus masked-token pretraining — each traded a different piece ' +
        'of the original recipe for speed, data efficiency or size.',
      howItWorks: {
        summary:
          'Pretrain a Transformer encoder with masked language modelling on unlabeled text, then fine-tune the same ' +
          'weights with a small task-specific head for each downstream task.',
        steps: [
          'Tokenize input text with WordPiece and prepend a [CLS] token used later as a whole-sequence representation.',
          'Mask 15% of tokens (80% replaced with [MASK], 10% with a random token, 10% left unchanged) and train the encoder to predict the original token at each masked position from full bidirectional context.',
          "BERT also trains a binary classifier on [CLS] to predict whether sentence B truly follows sentence A — later successors like RoBERTa dropped this second objective.",
          'Pretrain once on a large unlabeled corpus, then fine-tune the entire model plus one new small output layer on each downstream labelled task.',
        ],
      },
      whenToUse: [
        'The task is understanding a fixed piece of text (classification, NER, extractive QA, semantic similarity) rather than open-ended generation',
        'You need a strong general-purpose sentence/token encoder to fine-tune, and have budget for that fine-tuning step per task',
        'Inference latency and memory matter more than squeezing out the last point of accuracy — pick DistilBERT or ALBERT over full BERT or RoBERTa',
        'You want the best accuracy for a fixed training budget at BERT-base/large scale — RoBERTa reliably outperforms original BERT at the same size',
      ],
      whenNotToUse: [
        'The task requires generating open-ended text — these are encoder-only models with no decoder and no natural autoregressive sampling procedure',
        'You need one model that both reads a source and generates a differently-structured target (translation, summarization) — an encoder-decoder model fits better',
        'Your deployment has no budget for per-task fine-tuning — these models are not built for prompt-only, zero-shot use the way large decoder-only models are',
      ],
      facets: {
        task: ['representation', 'classification'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'contextual-token-and-sentence-embeddings',
      },
      code: [
        "from transformers import AutoTokenizer, AutoModelForSequenceClassification",
        "",
        "tok = AutoTokenizer.from_pretrained('roberta-base')",
        "model = AutoModelForSequenceClassification.from_pretrained('roberta-base', num_labels=2)",
        "",
        "batch = tok(['a movie review to classify'], return_tensors='pt', truncation=True)",
        "logits = model(**batch).logits          # fine-tune this new head on your labelled task",
      ].join('\n'),
      related: [
        'causal-vs-masked-language-modeling',
        'gpt-lineage',
        'encoder-decoder-architectures',
        'wordpiece-and-sentencepiece',
        'contextual-embeddings',
      ],
      references: {
        free: [{ title: 'The Illustrated BERT, ELMo, and co.', url: 'https://jalammar.github.io/illustrated-bert/' }],
        papers: [
          { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', url: 'https://arxiv.org/abs/1810.04805', year: 2018 },
          { title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach', url: 'https://arxiv.org/abs/1907.11692', year: 2019 },
          { title: 'DistilBERT, a distilled version of BERT: smaller, faster, cheaper and lighter', url: 'https://arxiv.org/abs/1910.01108', year: 2019 },
          { title: 'ALBERT: A Lite BERT for Self-supervised Learning of Language Representations', url: 'https://arxiv.org/abs/1909.11942', year: 2019 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.9 — Large-Scale Pretraining with Transformers',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/large-pretraining-transformers.html',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'gpt-lineage',
      name: 'GPT Lineage',
      aliases: ['Generative Pre-trained Transformer family'],
      tier: 1,
      year: 2018,
      difficulty: 3,
      hook: 'The same decoder-only recipe — predict the next token — scaled from 117M to hundreds of billions of parameters.',
      intuition:
        'GPT-1 made a simple bet: pretrain a decoder-only Transformer to predict the next word on a corpus of books, then ' +
        'fine-tune that same network for each downstream task with minimal task-specific machinery — and it worked, ' +
        'beating specialised architectures on most benchmarks tested. GPT-2 kept the architecture and objective ' +
        'essentially unchanged and scaled up data and parameters to 1.5B, discovering that a big enough language model ' +
        'performs many tasks zero-shot, from a prompt alone, with no fine-tuning at all. GPT-3 pushed the same recipe to ' +
        '175B parameters and found the model could learn a new task from a handful of examples placed directly in its ' +
        'prompt — few-shot in-context learning, with no gradient update at all. GPT-4 added multimodal input and heavy ' +
        'post-training on top of the same underlying next-token objective. Every generation is the identical training ' +
        'signal — predict the next token — applied to more data and more parameters, not a new objective.',
      howItWorks: {
        summary:
          'Pretrain a decoder-only Transformer to predict each next token from everything before it, then either ' +
          'fine-tune it per task (GPT-1) or prompt it directly, zero- or few-shot, once it is large enough (GPT-2 onward).',
        steps: [
          'Tokenize a large text corpus and train a causally-masked (decoder-only) Transformer to predict token t+1 from tokens 1..t at every position.',
          'GPT-1: after pretraining, fine-tune the whole model plus a small task-specific input transformation on each labelled downstream task.',
          'GPT-2 onward: skip fine-tuning — pose the task as a natural-language prompt and let the pretrained model complete it directly.',
          'GPT-3: place a handful of input-output examples inside the prompt itself (in-context learning) so the model infers the task pattern with no weight updates.',
          'GPT-4: extend the same next-token pretraining objective to accept image inputs alongside text, then apply extensive post-training before release.',
        ],
      },
      whenToUse: [
        'You need open-ended text generation — completion, chat, code, creative writing — with no fixed separate input to encode',
        'You need a model to learn a new task from a handful of examples at inference time, with no dataset large enough to fine-tune on',
        'You want one general-purpose model callable through a prompt rather than a separate fine-tuned model per task',
      ],
      whenNotToUse: [
        'The task needs the model to see the full input bidirectionally before predicting anything about it (e.g. token-level tagging) — causal masking blocks it from using right-context',
        'You need the smallest possible model for a single, narrow, well-labelled classification task — a fine-tuned small encoder is cheaper to train and run than prompting a large decoder-only model',
        'You need guaranteed grounding in a specific document — next-token pretraining on a general corpus gives no built-in mechanism to cite or restrict to a source; pair with retrieval instead',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text', 'multimodal'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'next-token-distribution',
      },
      math: {
        latex: ['p(x_{1:T}) = \\prod_{t=1}^{T} p(x_t \\mid x_{<t}; \\theta)'],
        notes:
          'Every GPT generation optimises the same causal language-modelling log-likelihood; the objective itself did ' +
          'not change across generations. What changed is theta\'s size, the data theta was fit to, and — from GPT-3 ' +
          'onward — the observation that a large enough theta can be redirected to a new task through its prompt alone, ' +
          'with no change to theta at all.',
      },
      code: [
        "from transformers import AutoModelForCausalLM, AutoTokenizer",
        "",
        "tok = AutoTokenizer.from_pretrained('gpt2')",
        "model = AutoModelForCausalLM.from_pretrained('gpt2')",
        "",
        "ids = tok('In-context learning means', return_tensors='pt').input_ids",
        "out = model.generate(ids, max_new_tokens=20, do_sample=False)",
        "print(tok.decode(out[0]))               # same next-token objective as every later GPT",
      ].join('\n'),
      related: [
        'causal-vs-masked-language-modeling',
        'bert-lineage',
        'encoder-decoder-architectures',
        'scaling-laws',
        'retrieval-augmented-generation',
      ],
      references: {
        free: [{ title: 'The Illustrated GPT-2', url: 'https://jalammar.github.io/illustrated-gpt2/' }],
        papers: [
          { title: 'Improving Language Understanding by Generative Pre-Training', url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf', year: 2018 },
          { title: 'Language Models are Unsupervised Multitask Learners', url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf', year: 2019 },
          { title: 'Language Models are Few-Shot Learners', url: 'https://arxiv.org/abs/2005.14165', year: 2020 },
          { title: 'GPT-4 Technical Report', url: 'https://arxiv.org/abs/2303.08774', year: 2023 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '11.9 — Large-Scale Pretraining with Transformers',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/large-pretraining-transformers.html',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 't5-and-encoder-decoder',
      name: 'T5 & Encoder-Decoder Pretraining',
      aliases: ['Text-to-Text Transfer Transformer', 'text-to-text framing'],
      tier: 2,
      year: 2019,
      difficulty: 3,
      hook: 'Casts every NLP task as text in, text out, and pretrains one encoder-decoder Transformer to fill in corrupted spans.',
      intuition:
        'Translation, summarization, classification and question answering look like different problems with different ' +
        "output shapes, so historically each got its own model or output head. T5's move was to stop treating them as " +
        'different problems: feed the model a task prefix plus input text ("translate English to German: ...", ' +
        '"summarize: ...") and always ask for text back, whatever the task actually is — a classification label becomes ' +
        'the literal word "positive" generated as text. That uniform framing lets one encoder-decoder Transformer, with ' +
        'one training procedure and one loss, cover the full range of NLP tasks. T5 pretrains with span corruption: drop ' +
        'random contiguous spans of the input and replace each with a single sentinel token, then train the decoder to ' +
        'reconstruct just the missing spans, which is cheaper to train on than reconstructing the whole sequence. The ' +
        'encoder still sees the corrupted input bidirectionally; the decoder still generates causally — T5 keeps the ' +
        "original Transformer's two-stack architecture intact rather than picking one half of it.",
      howItWorks: {
        summary:
          'Reformulate every task as text-to-text with a task prefix, and pretrain the encoder-decoder Transformer to ' +
          'reconstruct randomly dropped spans of the input.',
        steps: [
          'Prepend a short task prefix to the input text (e.g. "summarize:", "translate English to German:") so one model can be reused across tasks.',
          'During pretraining, replace random contiguous spans of input tokens with a single sentinel token per span (span corruption, ~15% of tokens).',
          'Encode the corrupted sequence bidirectionally, then have the decoder generate only the dropped spans, each preceded by its sentinel, causally.',
          'At fine-tuning or inference, feed a real task-prefixed input and decode the output text directly — no task-specific output head is needed.',
        ],
      },
      whenToUse: [
        'The task genuinely maps one sequence to a differently-structured one — translation, summarization, or anything you can phrase as text-to-text',
        'You want one shared model and training recipe to cover many tasks instead of a separate architecture or head per task',
      ],
      whenNotToUse: [
        'The task is open-ended generation with no distinct source to condition on — a decoder-only model handles that with fewer parameters and a simpler setup',
        'You only need a fixed-input representation for classification or retrieval, not generation — an encoder-only model is cheaper to run',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-text',
      },
      related: ['encoder-decoder-architectures', 'causal-vs-masked-language-modeling', 'bert-lineage'],
      references: {
        free: [{ title: 'Hugging Face — T5 model docs', url: 'https://huggingface.co/docs/transformers/en/model_doc/t5' }],
        papers: [
          { title: 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer', url: 'https://arxiv.org/abs/1910.10683', year: 2019 },
        ],
      },
    },
    {
      id: 'data-curation-and-deduplication',
      name: 'Data Curation & Deduplication',
      aliases: ['pretraining corpus filtering', 'near-duplicate removal'],
      tier: 1,
      year: 2021,
      difficulty: 2,
      hook: 'What goes into the corpus matters as much as the architecture -- duplicated text gets memorized, not learned from.',
      intuition:
        'A language model trained on raw Common Crawl sees the same boilerplate, spam and near-identical pages dozens or ' +
        'thousands of times, because the web is full of duplication — mirrors, templates, scraped copies. A model that ' +
        'sees one sentence tens of thousands of times does not generalize from it; it memorizes it, which wastes training ' +
        'compute on redundant signal and creates a privacy and copyright liability, since a heavily-duplicated string is ' +
        'far more likely to be reproduced verbatim at inference time. Data curation is the pipeline of filtering and ' +
        'deduplicating a raw web crawl before it ever reaches the model: dropping boilerplate and low-quality pages with ' +
        'heuristic rules, running a language classifier to keep the target language, and then removing near-duplicate ' +
        'documents — typically with MinHash locality-sensitive hashing, which flags likely duplicates without comparing ' +
        'every pair of documents directly. Every major modern pretraining corpus (C4, The Pile, FineWeb) is built around ' +
        'some version of this filter-then-deduplicate pipeline, not raw scraped text.',
      howItWorks: {
        summary:
          'Filter a raw web crawl with heuristic and classifier-based quality rules, then remove near-duplicate documents ' +
          'so the model does not see the same text many times over.',
        steps: [
          'Filter raw crawled pages with heuristics (language ID, minimum sentence count, terminal punctuation, boilerplate lists) to drop obviously low-quality pages.',
          'Compute a compact fingerprint (e.g. a MinHash sketch) for each remaining document from its shingles (overlapping n-grams).',
          'Group documents whose fingerprints collide under locality-sensitive hashing into candidate duplicate clusters, without comparing every pair of documents directly.',
          'Within each cluster, keep one representative document and drop the rest.',
          'Optionally score remaining documents with a trained quality classifier and keep only the highest-scoring fraction.',
        ],
      },
      whenToUse: [
        "You're assembling or filtering a pretraining corpus from web-scraped text, where near-duplicate pages are common",
        'Training compute is limited and you want every token trained on to carry non-redundant signal',
        'Memorization and verbatim regurgitation of training text (privacy, copyright) is a concern for the deployed model',
      ],
      whenNotToUse: [
        'The corpus is already small, curated and known to have little duplication (e.g. a licensed, single-source dataset) — the pipeline cost outweighs the benefit',
        'You need exact-duplicate removal only — full MinHash/LSH near-duplicate detection is more machinery than a simple hash-based exact-match dedup requires',
        'The downstream task specifically wants repetition (e.g. modelling a highly repetitive domain like log data) rather than treating it as noise',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'filtered-deduplicated-corpus',
      },
      math: {
        latex: ['\\Pr[h_{\\min}(A) = h_{\\min}(B)] = J(A,B) = \\frac{|A \\cap B|}{|A \\cup B|}'],
        notes:
          "A single MinHash value colliding between two documents' shingle sets is an unbiased estimator of their " +
          'Jaccard similarity. LSH buckets many independent MinHash values together so that only genuinely similar ' +
          'documents are likely to collide in enough bands to be flagged as candidate duplicates, avoiding an all-pairs ' +
          'O(n²) comparison over the whole corpus.',
      },
      complexity: {
        train: 'O(n) fingerprinting and LSH bucketing per document, versus O(n²) for exact all-pairs comparison',
        predict: 'n/a — a corpus-preparation step, not a trained model',
      },
      code: [
        "from datasketch import MinHash, MinHashLSH",
        "",
        "lsh = MinHashLSH(threshold=0.8, num_perm=128)",
        "for doc_id, text in corpus:",
        "    mh = MinHash(num_perm=128)",
        "    for shingle in {text[i:i+5] for i in range(len(text) - 5)}:",
        "        mh.update(shingle.encode('utf8'))",
        "    if lsh.query(mh):                      # near-duplicate already seen",
        "        continue",
        "    lsh.insert(doc_id, mh)",
        "    keep(doc_id)",
      ].join('\n'),
      related: ['gpt-lineage', 'bert-lineage', 't5-and-encoder-decoder', 'scaling-laws'],
      references: {
        free: [{ title: 'EleutherAI — The Pile: An 800GB Dataset', url: 'https://www.eleuther.ai/papers-blog/the-pile-an-800gb-dataset' }],
        papers: [
          { title: 'Deduplicating Training Data Makes Language Models Better', url: 'https://arxiv.org/abs/2107.06499', year: 2021 },
          { title: 'The Pile: An 800GB Dataset of Diverse Text for Language Modeling', url: 'https://arxiv.org/abs/2101.00027', year: 2020 },
          { title: 'The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale', url: 'https://arxiv.org/abs/2406.17557', year: 2024 },
        ],
        books: [
          {
            title: 'Speech and Language Processing',
            author: 'Jurafsky & Martin',
            chapter: 'Ch. 7 — Large Language Models',
            url: 'https://web.stanford.edu/~jurafsky/slp3/7.pdf',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'mixture-of-experts',
      name: 'Mixture of Experts (MoE)',
      aliases: ['sparsely-gated mixture of experts', 'MoE layers'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Routes each token to a few specialist sub-networks instead of the whole model -- capacity without the compute bill.',
      intuition:
        'A dense Transformer runs every parameter on every token, so making it bigger makes every forward pass ' +
        'proportionally more expensive. Mixture of Experts breaks that link. Replace a single feed-forward block with ' +
        'many parallel feed-forward blocks ("experts") plus a small router network, and for each token the router picks ' +
        'only a handful of experts — often just one or two out of dozens — to actually process it. The token only ever ' +
        "touches the parameters of the experts it was routed to; the rest of the model's weights sit idle for that " +
        'token. Total parameter count and computation cost become almost independent: you can grow the number of ' +
        'experts to increase capacity while compute per token barely changes, since it is set by how many experts are ' +
        'active, not how many exist. The catch is a genuinely new problem dense models never had — getting the router ' +
        'to spread tokens evenly across experts instead of collapsing onto a favourite few.',
      howItWorks: {
        summary:
          'Replace a dense feed-forward block with several parallel expert feed-forward blocks and a learned router that ' +
          'sends each token to only a small, fixed number of them.',
        steps: [
          "For each token's hidden state, the router (a small learned linear layer plus softmax) scores every expert.",
          'Select the top-k highest-scoring experts for that token (k=1 for Switch Transformer, k=2 for the original sparsely-gated design and for Mixtral).',
          "Run the token's hidden state only through those selected experts' feed-forward networks.",
          "Combine the selected experts' outputs, weighted by their router scores, into the token's new hidden state.",
          'Add an auxiliary load-balancing loss during training that penalizes routing all tokens to the same few experts, since the router otherwise tends to collapse onto favourites.',
        ],
      },
      hyperparameters: [
        {
          name: 'num_experts',
          what: 'Total number of parallel expert feed-forward networks per MoE layer.',
          tuning:
            'Switch Transformer scaled up to thousands of experts per layer; Mixtral uses 8. More experts raise total ' +
            'parameters and memory without raising per-token compute, provided training data is large enough to keep ' +
            'each expert well-trained.',
        },
        {
          name: 'top_k (experts per token)',
          what: 'How many experts each token is routed to and its output blended from.',
          tuning:
            'k=1 (Switch Transformer) is cheapest and simplest to route; k=2 (the original Shazeer et al. design, and ' +
            "Mixtral) trades a bit more compute for a smoother gradient signal through the router.",
        },
      ],
      whenToUse: [
        'You want to scale total model capacity without scaling inference compute proportionally, and can afford the extra memory to hold all experts',
        'You have enough training data and traffic volume to keep many experts individually well-trained — MoE needs enough tokens routed to each expert for it to specialize',
        "You have the distributed training or serving infrastructure to shard experts across devices — MoE's benefit is a compute/memory trade, not raw simplicity",
      ],
      whenNotToUse: [
        'Total device memory is the binding constraint, not compute — MoE models must keep all experts resident even though only a few run per token, so they need more memory than a dense model of equivalent active compute',
        "The deployment serves low, bursty traffic where the router's per-token overhead and uneven expert utilization outweigh the compute savings",
        'Training data or batch size is small — experts that rarely get routed to see too few examples to specialize, or collapse under the load-balancing loss into behaving like one big expert',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'token-predictions-or-embeddings',
      },
      math: {
        latex: [
          'g(x) = \\mathrm{softmax}(W_g x)',
          'y = \\sum_{i \\in \\mathrm{Top}_k(g(x))} g(x)_i \\cdot E_i(x)',
        ],
        notes:
          "g(x) scores every expert from the token's hidden state x; only the top-k scoring experts E_i actually run, " +
          'and their outputs are combined weighted by those same router scores. Experts outside the top-k receive no ' +
          'gradient from this token at all, which is why an auxiliary load-balancing loss is added during training to ' +
          'keep the router from routing — and thus training — only a few experts.',
      },
      complexity: {
        train: "O(k) active experts' compute per token, independent of total expert count N — but O(N) parameters must be stored and updated",
        predict: "O(k) active experts' compute per token, the same asymmetry as training",
      },
      code: [
        "import torch, torch.nn as nn, torch.nn.functional as F",
        "",
        "class MoELayer(nn.Module):",
        "    def __init__(self, d_model, d_ff, num_experts=8, top_k=2):",
        "        super().__init__()",
        "        self.experts = nn.ModuleList([",
        "            nn.Sequential(nn.Linear(d_model, d_ff), nn.ReLU(), nn.Linear(d_ff, d_model))",
        "            for _ in range(num_experts)])",
        "        self.router = nn.Linear(d_model, num_experts)",
        "        self.top_k = top_k",
        "",
        "    def forward(self, x):                        # x: (tokens, d_model)",
        "        scores = F.softmax(self.router(x), dim=-1)",
        "        top_scores, top_idx = scores.topk(self.top_k, dim=-1)",
        "        out = torch.zeros_like(x)",
        "        for k in range(self.top_k):",
        "            expert_out = torch.stack([self.experts[i](xi) for xi, i in zip(x, top_idx[:, k])])",
        "            out += top_scores[:, k, None] * expert_out",
        "        return out",
      ].join('\n'),
      related: ['scaling-laws', 'state-space-models-mamba', 'gpt-lineage', 'data-curation-and-deduplication'],
      references: {
        free: [{ title: 'Hugging Face — Mixture of Experts Explained', url: 'https://huggingface.co/blog/moe' }],
        papers: [
          { title: 'Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer', url: 'https://arxiv.org/abs/1701.06538', year: 2017 },
          { title: 'Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity', url: 'https://arxiv.org/abs/2101.03961', year: 2021 },
          { title: 'Mixtral of Experts', url: 'https://arxiv.org/abs/2401.04088', year: 2024 },
        ],
        books: [
          {
            title: 'Pattern Recognition and Machine Learning',
            author: 'Christopher M. Bishop',
            chapter: 'Ch. 14.5.3 — Mixtures of Experts',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'state-space-models-mamba',
      name: 'State Space Models (S4 & Mamba)',
      aliases: ['structured state space sequence models', 'selective state space models'],
      tier: 1,
      year: 2021,
      difficulty: 4,
      hook: 'Replaces attention with a linear recurrence borrowed from control theory, scaling linearly instead of quadratically.',
      intuition:
        'A Kalman filter tracks a hidden state that evolves linearly over time and periodically emits an observation — ' +
        "classical control theory's state-space model. S4 showed the same continuous linear recurrence, discretized and " +
        'initialized carefully (with HiPPO matrices designed to compress a long history into a fixed-size state without ' +
        'forgetting), could be trained as a deep sequence layer handling dependencies tens of thousands of steps apart — ' +
        'something RNNs struggle with because gradients vanish or explode over that many steps, and Transformers ' +
        "struggle with because attention's cost grows quadratically in sequence length. Its main limitation was that the " +
        "recurrence's parameters were fixed, the same for every input, so the model could not decide what to remember " +
        "or forget based on content. Mamba's fix was to make those parameters functions of the current input token — a " +
        'selective state space — so the model can let some information pass through its fixed-size state untouched and ' +
        'let other information decay quickly, much like a gate in an LSTM, but computed to still run as an efficient ' +
        'parallel scan rather than a token-by-token loop.',
      howItWorks: {
        summary:
          "Carry a fixed-size hidden state forward through a linear recurrence (as in a Kalman filter), and in Mamba " +
          "make that recurrence's parameters depend on the current input so the model can selectively remember or forget.",
        steps: [
          'Define a continuous linear state-space system: a hidden state evolves via matrix A and takes in the current input via matrix B, and an output is read out via matrix C.',
          'Discretize the continuous system into a recurrence usable at each token position, initializing A with a HiPPO matrix so the state compresses long history without forgetting (S4).',
          'Mamba: make the discretization step size and the B, C matrices functions of the current input token, rather than fixed constants shared across all tokens (the "selection mechanism").',
          'Compute the resulting input-dependent recurrence with a hardware-aware parallel scan, so training is still parallelizable despite the parameters no longer being fixed.',
          'At inference, run the recurrence step by step, carrying only the fixed-size hidden state forward rather than an ever-growing cache of past tokens.',
        ],
      },
      hyperparameters: [
        {
          name: 'd_state (N)',
          what: 'Dimensionality of the per-channel hidden state carried through the recurrence.',
          tuning:
            "Mamba's default keeps a small state (e.g. 16) per channel, multiplied out across many channels — a larger " +
            'd_state increases how much history the fixed-size state can represent, at a memory and compute cost.',
        },
      ],
      whenToUse: [
        "Sequences are very long (tens of thousands of tokens or more: genomics, audio, long documents) where attention's quadratic cost is prohibitive",
        'Inference throughput and memory matter — the fixed-size recurrent state avoids the growing key-value cache attention needs for every past token',
        "The task rewards content-based selection of what to remember over a long sequence — what Mamba's input-dependent parameters are specifically designed for, more than fixed-dynamics S4",
      ],
      whenNotToUse: [
        "Sequences are short enough that attention's quadratic cost isn't actually the bottleneck — Transformers remain the better-understood, more thoroughly tuned default",
        "The task needs precise, easily-inspected retrieval of one specific earlier token (e.g. copying a token verbatim from far back) — attention's direct token-to-token comparison handles this more reliably than a compressed fixed-size state",
        'You need the ecosystem maturity of Transformers — tooling, pretrained checkpoints, and interpretability research are all far more developed for attention-based models',
      ],
      facets: {
        task: ['representation', 'generation', 'forecasting'],
        dataType: ['text', 'audio', 'timeseries'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'next-token-distribution-or-sequence-embeddings',
      },
      math: {
        latex: [
          "h'(t) = A h(t) + B x(t), \\quad y(t) = C h(t)",
          '\\Delta, B, C = f(x_t) \\quad \\text{(Mamba: input-dependent, vs. fixed constants in S4)}',
        ],
        notes:
          'The continuous system is the same linear state-space equation used in a Kalman filter for a stochastic ' +
          'process; S4 discretizes it with a HiPPO-initialized A so the fixed-size state h approximates a long input ' +
          "history well. Mamba's structural change is making the discretization step size Delta and the input/output " +
          'matrices B, C functions of the current token x_t instead of fixed parameters — this breaks the linear ' +
          'time-invariance a convolutional view of the recurrence relies on, which is why Mamba needs a custom ' +
          'parallel-scan implementation rather than the FFT-based convolution S4 could use.',
      },
      complexity: {
        train: 'O(L) in sequence length L via a hardware-aware parallel scan, versus O(L²) for standard self-attention',
        predict: "O(1) per generated token using the fixed-size recurrent state, versus attention's growing KV-cache cost",
      },
      code: [
        "# pip install mamba-ssm",
        "import torch",
        "from mamba_ssm import Mamba",
        "",
        "x = torch.randn(2, 64, 16).to('cuda')     # (batch, seq_len, d_model)",
        "block = Mamba(d_model=16, d_state=16, d_conv=4, expand=2).to('cuda')",
        "y = block(x)                              # (batch, seq_len, d_model) -- same shape in/out",
      ].join('\n'),
      related: ['scaling-laws', 'kalman-filters-and-state-space-models', 'lstm', 'vanishing-gradients-and-universal-approximation'],
      references: {
        free: [{ title: 'The Annotated S4', url: 'https://srush.github.io/annotated-s4/' }],
        papers: [
          { title: 'Efficiently Modeling Long Sequences with Structured State Spaces', url: 'https://arxiv.org/abs/2111.00396', year: 2021 },
          { title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', url: 'https://arxiv.org/abs/2312.00752', year: 2023 },
        ],
        books: [
          {
            title: 'Probabilistic Machine Learning: Advanced Topics',
            author: 'Kevin P. Murphy',
            chapter: 'Ch. 29 — State-Space Models',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'long-context-architectures',
      name: 'Long-Context Architectures',
      aliases: ['context length extension', 'efficient long-sequence attention'],
      tier: 2,
      year: 2020,
      difficulty: 4,
      hook: 'Sparse attention, position rescaling, recurrence — a grab-bag of tricks for reading further without the quadratic bill.',
      intuition:
        'Standard self-attention compares every token to every other token, so doubling the input length quadruples the ' +
        'compute and memory — fine at a few thousand tokens, prohibitive at a few hundred thousand. Long-context ' +
        'architectures are the family of fixes for that ceiling, attacking it from different angles. Sparse or windowed ' +
        'attention, like Longformer, only compares each token to a local neighbourhood plus a handful of designated ' +
        'global tokens, cutting the cost to roughly linear in sequence length. Position-encoding tricks attack a ' +
        'different failure mode: even a model trained at a fixed context length can be stretched further at inference ' +
        'by rescaling its rotary position embeddings so unfamiliar, very large position values still fall in a range the ' +
        "model has effectively seen before. Recurrent and state-space alternatives sidestep attention's quadratic cost " +
        'altogether by carrying a fixed-size hidden state forward instead of comparing every pair of tokens. None of ' +
        'these is a strict replacement for full attention — each trades some modelling power for reach.',
      howItWorks: {
        summary:
          "Reduce the quadratic cost or fixed training length of standard self-attention through sparse attention " +
          "patterns, position-encoding rescaling, or recurrent/state-space alternatives that avoid all-pairs comparison entirely.",
        steps: [
          'Sparse/windowed attention: restrict each token to attend to a local window plus a small set of global tokens, instead of every other token.',
          'Position-encoding extension: rescale or reinterpolate the rotary position embedding frequencies so position indices beyond the training length still map into a familiar range.',
          'Recurrent/state-space alternatives: replace attention with a mechanism (e.g. Mamba) that carries a fixed-size state forward, so cost grows linearly rather than quadratically with sequence length.',
        ],
      },
      whenToUse: [
        "Inputs routinely exceed the base model's trained context window (long documents, codebases, multi-turn transcripts) and truncation would lose needed information",
        'Compute or memory budget cannot absorb the quadratic cost of full attention at the sequence lengths the task requires',
      ],
      whenNotToUse: [
        "Inputs comfortably fit within a standard model's trained context window — the added complexity and potential quality loss of these techniques buys nothing",
        'The task needs precise retrieval of an exact fact from a huge corpus rather than reasoning over one long contiguous context — retrieval-augmented generation is usually simpler and cheaper than extending context length',
      ],
      facets: {
        task: ['representation', 'generation'],
        dataType: ['text'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'contextual-embeddings-or-generated-text',
      },
      related: ['self-attention', 'positional-encoding', 'state-space-models-mamba', 'long-context-vs-retrieval'],
      references: {
        free: [{ title: "Lil'Log — The Transformer Family Version 2.0", url: 'https://lilianweng.github.io/posts/2023-01-27-the-transformer-family-v2/' }],
        papers: [
          { title: 'Longformer: The Long-Document Transformer', url: 'https://arxiv.org/abs/2004.05150', year: 2020 },
          { title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding', url: 'https://arxiv.org/abs/2104.09864', year: 2021 },
        ],
      },
    },
  ],
} satisfies Body;
