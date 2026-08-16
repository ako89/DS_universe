/**
 * Babel — Tokenization & Embeddings. See PLAN.md §3 for the full moon list.
 *
 * All 6 moons from PLAN.md §3 are written here at their marked tiers — 4 Tier 1
 * (byte-pair-encoding, word2vec-and-glove, contextual-embeddings, sentence-embedding-models) and
 * 2 Tier 2 stubs (wordpiece-and-sentencepiece, tokenizer-pathologies).
 *
 * `eraRange` spans 2012 (Schuster & Nakajima's WordPiece, introduced for Google's Japanese/Korean
 * voice search system) to 2023 (the SolidGoldMagikarp glitch-token discovery, the newest sourced
 * claim in `tokenizer-pathologies`) — the earliest and latest `year` among the 6 moons.
 *
 * `byte-pair-encoding`'s `year` is 2016 (Sennrich, Haddow & Birch's ACL paper adapting BPE to NLP
 * subword tokenization), not 1994 (Philip Gage's original general-purpose compression algorithm).
 * This mirrors PLAN.md §0's instruction to flag a judgment call rather than silently pick one:
 * unlike jupiter.ts's k-means, which uses 1957 because Lloyd's report *is* the clustering
 * algorithm being catalogued just published late, Gage's 1994 algorithm was built for byte-stream
 * compression, a different subject, and only became a tokenization method when Sennrich et al.
 * repurposed it for NLP 22 years later — the moon here is "BPE for tokenization" specifically, per
 * PLAN.md's moon list. The 1994 origin is still sourced and stated in the intuition prose.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * One PDF-adjacent trap avoided: `dl.acm.org` and Semantic Scholar's page for Gage's 1994 paper
 * both refused to load (403 / empty response), so rather than cite a link never actually opened,
 * the 1994 origin claim is sourced instead from machinetranslate.org's history page (opened and
 * read directly) and cross-corroborated across several independent summary pages, and no papers
 * reference entry was created for Gage 1994 — see the PDF-fetch warning in CONTENT_GUIDE §3 on
 * not citing a link you have not loaded.
 *
 * Deliberate cross-body links: `contextual-embeddings` → `self-attention` / `transformer-block` /
 * `positional-encoding` (Nova) is the strongest one in this batch — a transformer's self-attention
 * layers produce exactly the "contextual embedding" this moon describes (nova.ts's own
 * self-attention entry already sets `outputType: 'contextual-embeddings'`, independently
 * confirming the link). `word2vec-and-glove` → `svd-and-truncated-svd` (Saturn) is genuine, not
 * decorative: the GloVe paper's own abstract frames the method as combining "global matrix
 * factorization and local context window methods" — verified via the ACL Anthology abstract
 * (cross-corroborated across several independent bibliography pages quoting the same sentence)
 * before being cited as fact. `sentence-embedding-models` → `hnsw` / `approximate-nearest-neighbors`
 * (Venus) is genuine: sentence embeddings are precisely the fixed-size vectors an ANN index is
 * built to search, which is why Sentence-BERT's own motivating example is retrieval-speed, not
 * accuracy — Reimers & Gurevych report finding the closest pair among 10,000 sentences drops from
 * ~65 hours with BERT to ~5 seconds with SBERT.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'babel',
  name: 'Babel',
  segment: 'Tokenization & Embeddings',
  hook: 'How raw text becomes numbers a model can learn from, and where that translation quietly breaks.',
  summary:
    'Babel covers the boundary between text and a model: how strings get cut into tokens, and how those ' +
    'tokens, words and sentences turn into dense vectors that carry meaning. It also catalogues where that ' +
    'boundary leaks — tokenization choices that quietly break arithmetic, spelling, and a handful of specific tokens.',
  eraRange: [2012, 2023],
  moons: [
    {
      id: 'byte-pair-encoding',
      name: 'Byte-Pair Encoding (BPE)',
      aliases: ['BPE', 'subword tokenization'],
      tier: 1,
      year: 2016,
      difficulty: 2,
      hook: 'Repeatedly merges the most frequent adjacent symbol pair into a new token, building a vocabulary from characters up.',
      intuition:
        'Start with every character as its own token, and repeatedly find the pair of adjacent tokens that ' +
        'occurs most often across the training text, merging that pair into a single new token. "t" and "h" ' +
        'merge into "th" because they co-occur constantly; "th" and "e" then merge into "the" for the same ' +
        'reason. Keep going until the vocabulary reaches a target size. The result is a vocabulary that puts ' +
        'common whole words in one token, moderately common words in a couple of subword pieces, and anything ' +
        'never seen before still representable as individual characters — no word is ever truly unknown, it ' +
        'just gets expensive to represent. BPE itself is not an NLP invention: Philip Gage described it in ' +
        '1994 as a general-purpose byte-stream compression trick, unrelated to language. Sennrich, Haddow and ' +
        "Birch repurposed exactly that merge procedure for machine translation vocabularies in 2016, and it's " +
        'that adaptation, not the original compression algorithm, that every subword tokenizer since has built on.',
      howItWorks: {
        summary:
          'Represent text as a sequence of base symbols (characters or bytes), repeatedly count and merge the ' +
          'single most frequent adjacent pair into a new symbol, and stop once the vocabulary hits a target size.',
        steps: [
          'Split the training corpus into words (or bytes) and represent each as a sequence of base symbols — individual characters, or the 256 possible byte values for byte-level BPE.',
          'Count every adjacent pair of symbols across the whole corpus, weighted by word frequency.',
          'Merge the single most frequent pair into one new symbol and add it to the vocabulary.',
          'Repeat counting and merging until the vocabulary reaches the target size, or no pair occurs more than once.',
          'To tokenize new text, re-apply the learned merges in the exact order they were learned.',
        ],
      },
      hyperparameters: [
        {
          name: 'vocab_size (target vocabulary size / number of merges)',
          what: 'Final vocabulary size: the base alphabet plus every merge performed.',
          tuning:
            "GPT-2's byte-level BPE uses 50,257 tokens (256 byte values + 50,000 merges + 1 special token); " +
            "the original GPT tokenizer used 40,478 (478 base tokens + 40,000 merges). Hugging Face's " +
            'BpeTrainer defaults to 30,000. Larger vocabularies shorten sequences but enlarge the embedding table.',
        },
        {
          name: 'base alphabet (byte-level vs. character-level)',
          what: 'Whether the starting symbols are the 256 raw byte values or Unicode characters.',
          tuning:
            'Byte-level BPE (used by GPT-2 onward) guarantees every possible input string is representable ' +
            'with no unknown-token fallback, at the cost of needing more tokens for scripts underrepresented ' +
            "in the training corpus. Plain character-level BPE can still hit an unknown token on characters " +
            "it never saw during training.",
        },
      ],
      whenToUse: [
        'You need an open-vocabulary tokenizer that can represent any input string, including words never seen during training, by falling back to smaller subwords or characters',
        "You're building on or reproducing a model in the GPT lineage, where byte-level BPE is the established tokenizer",
        'You want a fixed, deterministic vocabulary learned once from a training corpus and then reused unchanged at inference time',
      ],
      whenNotToUse: [
        "The text is mostly non-Latin-script or low-resource-language content — BPE's merges reflect the training corpus's own statistics, so underrepresented scripts end up split into far more tokens per word than English",
        'Numbers matter to the downstream task — BPE merges digits by frequency like any other symbol, so two numbers with the same digit count can tokenize completely differently (see tokenizer-pathologies)',
        'You need tokenization that respects morpheme or word boundaries exactly — merges are chosen purely by frequency, with no linguistic knowledge of where a word or morpheme actually begins or ends',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'subword-token-ids',
      },
      math: {
        latex: ['V = |\\Sigma_{\\text{base}}| + M', '(a^*, b^*) = \\arg\\max_{(a,b)} \\; \\text{count}(a, b)'],
        notes:
          'M is the number of merge operations, a hyperparameter fixed before training — the algorithm stops ' +
          'after exactly M merges regardless of how much frequency signal is left, so vocabulary size is set ' +
          'directly rather than emerging from a convergence criterion the way, say, EM converges on likelihood.',
      },
      code: [
        "from tokenizers import Tokenizer",
        "from tokenizers.models import BPE",
        "from tokenizers.trainers import BpeTrainer",
        "from tokenizers.pre_tokenizers import Whitespace",
        "",
        'tokenizer = Tokenizer(BPE(unk_token="[UNK]"))',
        "tokenizer.pre_tokenizer = Whitespace()",
        "",
        "trainer = BpeTrainer(vocab_size=30000, special_tokens=[\"[UNK]\"])",
        'tokenizer.train(files=["corpus.txt"], trainer=trainer)',
        "",
        'output = tokenizer.encode("Hello, y\'all!")',
        "print(output.tokens)   # e.g. ['Hello', ',', 'y', \"'\", 'all', '!']",
      ].join('\n'),
      related: ['wordpiece-and-sentencepiece', 'tokenizer-pathologies', 'contextual-embeddings'],
      references: {
        free: [
          {
            title: 'Hugging Face — Tokenization algorithms (BPE, WordPiece, Unigram, SentencePiece)',
            url: 'https://huggingface.co/docs/transformers/en/tokenizer_summary',
          },
          { title: 'machinetranslate.org — Byte-pair encoding', url: 'https://machinetranslate.org/byte-pair-encoding' },
        ],
        papers: [
          {
            title: 'Neural Machine Translation of Rare Words with Subword Units',
            url: 'https://arxiv.org/abs/1508.07909',
            year: 2016,
          },
        ],
        books: [
          {
            title: 'Speech and Language Processing',
            author: 'Jurafsky & Martin',
            chapter: 'Ch. 2 — Words and Tokens',
            url: 'https://web.stanford.edu/~jurafsky/slp3/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'wordpiece-and-sentencepiece',
      name: 'WordPiece & SentencePiece',
      tier: 2,
      year: 2012,
      difficulty: 3,
      hook: 'WordPiece merges by likelihood gain, not raw frequency; SentencePiece tokenizes raw text, spaces included.',
      intuition:
        'Both are alternatives to plain BPE aimed at different weaknesses. WordPiece, introduced by Google for ' +
        'a Japanese and Korean voice search system and later reused as BERT\'s tokenizer, merges pairs like ' +
        'BPE but scores each candidate merge differently: instead of picking the pair that occurs most often, ' +
        'it picks the pair whose combined token is more common than its two parts\' individual frequencies ' +
        'would predict on their own — a statistical-dependence score, not a raw count. SentencePiece solves a ' +
        "different problem: ordinary BPE assumes text arrives pre-split into words by whitespace, which fails " +
        "for languages like Japanese or Thai that don't put spaces between words at all. SentencePiece treats " +
        'raw text as an unsegmented stream of characters or bytes, encoding the space character itself as an ' +
        'ordinary symbol ("▁") rather than assuming it as a boundary, and then runs BPE or a probabilistic ' +
        'alternative called Unigram on top of that stream — decoupling subword segmentation entirely from any ' +
        'notion of a pre-existing "word".',
      howItWorks: {
        summary:
          'WordPiece merges the pair that most increases the training corpus\'s likelihood rather than the ' +
          'most frequent pair; SentencePiece pre-processes raw text, spaces included, into a symbol stream ' +
          'before running BPE or Unigram on top of it.',
        steps: [
          "WordPiece: score every candidate merge as count(pair) / (count(first) * count(second)) — how much more often the pair co-occurs than its parts' independent frequencies predict.",
          'WordPiece: merge the highest-scoring pair and repeat until the target vocabulary size is reached.',
          "SentencePiece: treat raw text as a character or byte stream with no pre-tokenization assumption, replacing spaces with an explicit '▁' symbol so detokenization is lossless.",
          'SentencePiece: run BPE or the probabilistic Unigram algorithm over that stream to learn the subword vocabulary.',
        ],
      },
      whenToUse: [
        'You are training or reproducing a BERT-family model — WordPiece is the original tokenizer for BERT, DistilBERT and Electra',
        'Your text includes languages without whitespace word boundaries (Japanese, Chinese, Thai) — SentencePiece handles these without a separate word-segmentation step first',
      ],
      whenNotToUse: [
        'You just need a standard, widely-supported subword tokenizer with no BERT-family or space-free-language requirement — plain byte-level BPE (GPT-2 style) is simpler and equally standard',
        "You need segmentation to be deterministic and identical across runs — SentencePiece's Unigram mode can sample among multiple valid segmentations by design (subword regularization), which plain BPE and WordPiece do not do",
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'subword-token-ids',
      },
      related: ['byte-pair-encoding', 'contextual-embeddings'],
      references: {
        free: [
          {
            title: 'Hugging Face — Tokenization algorithms (BPE, WordPiece, Unigram, SentencePiece)',
            url: 'https://huggingface.co/docs/transformers/en/tokenizer_summary',
          },
          { title: 'SentencePiece — GitHub repository', url: 'https://github.com/google/sentencepiece' },
        ],
        papers: [
          {
            title: 'Japanese and Korean Voice Search',
            url: 'https://research.google/pubs/japanese-and-korean-voice-search/',
            year: 2012,
          },
          {
            title:
              'SentencePiece: A Simple and Language Independent Subword Tokenizer and Detokenizer for Neural Text Processing',
            url: 'https://arxiv.org/abs/1808.06226',
            year: 2018,
          },
        ],
      },
    },
    {
      id: 'word2vec-and-glove',
      name: 'word2vec & GloVe',
      aliases: ['skip-gram', 'CBOW', 'continuous bag-of-words', 'Global Vectors for Word Representation'],
      tier: 1,
      year: 2013,
      difficulty: 3,
      hook: 'Learns one dense vector per word — by predicting its neighbours, or by factoring how often words co-occur.',
      intuition:
        'You can tell a lot about a word from the company it keeps: words that show up in similar contexts ' +
        'tend to mean similar things. word2vec turns that idea into a training signal directly — a shallow ' +
        'network learns to predict the words surrounding a given word (skip-gram), or the word from its ' +
        'surroundings (CBOW), and words that get predicted in similar contexts end up with similar vectors as ' +
        'a side effect of solving that task. GloVe reaches similar vectors from a different angle: instead of ' +
        'sliding a window and predicting locally, it first counts, once, how often every pair of words ' +
        'co-occurs across the whole corpus, then fits vectors so their dot product approximates the log of ' +
        "that co-occurrence count — its own paper frames this as combining global matrix-factorization methods " +
        "with word2vec's local context-window approach. Both give every word exactly one fixed vector, " +
        'independent of context — the same "bank" vector whether it means a riverbank or a financial ' +
        'institution, the specific limitation contextual embeddings were built to fix.',
      howItWorks: {
        summary:
          'Train a shallow network to predict context from a center word or vice versa (word2vec), or factor ' +
          'a global word-word co-occurrence matrix by weighted least squares (GloVe), and keep only the ' +
          'learned per-word vectors as a lookup table.',
        steps: [
          'word2vec skip-gram: slide a window over the corpus; for each center word, train the network to assign high probability to the words that actually appeared within the window around it.',
          "word2vec: approximate the softmax over the full vocabulary with negative sampling — for each true (center, context) pair, also train against a handful of randomly drawn 'negative' words that should score low.",
          'GloVe: build a global word-word co-occurrence matrix by counting, once, how often each pair of words appears within a window across the entire corpus.',
          "GloVe: fit two vectors and two bias terms per word by weighted least squares, so a word pair's vector dot product plus their biases approximates the log of their co-occurrence count.",
          'Either way, discard the prediction or factorization machinery used during training and keep only the resulting per-word vectors.',
        ],
      },
      hyperparameters: [
        {
          name: 'window / vector_size',
          what: 'Context window radius, and the dimensionality of each learned word vector.',
          tuning:
            "gensim's Word2Vec defaults to vector_size=100, window=5. Larger windows tend to capture more " +
            'topical similarity, smaller windows more syntactic similarity.',
        },
        {
          name: 'negative / sg',
          what: 'Number of negative samples drawn per positive pair, and whether to use skip-gram (sg=1) or CBOW (sg=0).',
          tuning:
            "gensim defaults to negative=5, sg=0 (CBOW). Mikolov et al.'s negative-sampling paper describes it " +
            'as a simplified form of noise-contrastive estimation used specifically to avoid the full softmax.',
        },
      ],
      whenToUse: [
        "You need a lightweight, fast-to-train embedding for a large but fixed vocabulary, and don't need the embedding to change with context",
        'You want embeddings whose geometry supports analogy-style vector arithmetic (king − man + woman ≈ queen), which both models were explicitly evaluated on',
        "You have a large, domain-specific corpus and want vectors tuned to that domain's vocabulary rather than a general-purpose pretrained set",
      ],
      whenNotToUse: [
        "The task depends on word-sense disambiguation — a polysemous word gets one vector averaged across all its senses, so 'bank' the riverbank and 'bank' the institution share a representation",
        'Words that matter to the task are rare or absent from the training corpus — both methods need many co-occurrences per word for a reliable vector, unlike subword tokenizers that back off to smaller units',
        'You need embeddings for whole sentences or documents rather than individual words — averaging word vectors is a weak baseline against models trained directly for sentence similarity',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'static-word-embeddings',
      },
      math: {
        latex: [
          'p(w_{t+j} \\mid w_t) = \\frac{\\exp(v_{w_{t+j}}^{\\prime \\top} v_{w_t})}{\\sum_{w=1}^{V} \\exp(v_w^{\\prime \\top} v_{w_t})}',
          '\\sum_{i,j=1}^{V} h(x_{ij}) \\left( v_i^\\top \\tilde{v}_j + b_i + \\tilde{b}_j - \\log x_{ij} \\right)^2',
        ],
        notes:
          "The first line is skip-gram's exact softmax objective, intractable to normalize over a large " +
          "vocabulary V — the reason Mikolov et al.'s 2013 follow-up paper replaces it with negative sampling, " +
          "which the paper itself frames as a simplified form of noise-contrastive estimation. The second line " +
          "is GloVe's weighted least-squares objective over co-occurrence counts x_ij; h(x) down-weights very " +
          'rare and very frequent pairs so common function-word pairs do not dominate the loss.',
      },
      complexity: {
        train:
          'word2vec: O(V) per training pair for the full softmax; O(k) per pair with negative sampling, for k ' +
          'negative samples (typically 5–20). GloVe: one pass to build the co-occurrence matrix, then iterates ' +
          'only over its nonzero entries rather than the full V×V matrix or the raw corpus.',
        predict: 'O(1) — a vector lookup once training is complete',
      },
      code: [
        'from gensim.models import Word2Vec',
        '',
        '# sentences: list of tokenized sentences, e.g. [["the", "cat", "sat"], ...]',
        'model = Word2Vec(sentences, vector_size=100, window=5, min_count=5, sg=0, negative=5, epochs=5)',
        '',
        'model.wv["cat"]                     # the 100-dim vector for "cat"',
        'model.wv.most_similar("cat")        # nearest neighbours by cosine similarity',
        'model.wv.similarity("cat", "dog")   # cosine similarity between two words',
      ].join('\n'),
      // svd-and-truncated-svd is the genuine cross-body link: GloVe's own abstract frames the
      // method as combining global matrix-factorization approaches (like LSA/truncated SVD on a
      // term-document matrix) with word2vec's local context-window approach.
      related: ['contextual-embeddings', 'sentence-embedding-models', 'svd-and-truncated-svd'],
      references: {
        free: [
          { title: 'GloVe project page (Stanford NLP)', url: 'https://nlp.stanford.edu/projects/glove/' },
          { title: 'gensim documentation — Word2Vec', url: 'https://radimrehurek.com/gensim/models/word2vec.html' },
          { title: 'The Illustrated Word2Vec', url: 'https://jalammar.github.io/illustrated-word2vec/' },
        ],
        papers: [
          {
            title: 'Efficient Estimation of Word Representations in Vector Space',
            url: 'https://arxiv.org/abs/1301.3781',
            year: 2013,
          },
          {
            title: 'Distributed Representations of Words and Phrases and their Compositionality',
            url: 'https://arxiv.org/abs/1310.4546',
            year: 2013,
          },
          {
            title: 'GloVe: Global Vectors for Word Representation',
            url: 'https://aclanthology.org/D14-1162/',
            year: 2014,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: 'Ch. 15 — Natural Language Processing: Pretraining (word2vec, GloVe)',
            url: 'https://d2l.ai/chapter_natural-language-processing-pretraining/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'contextual-embeddings',
      name: 'Contextual Embeddings',
      aliases: ['ELMo', 'contextualized word representations'],
      tier: 1,
      year: 2018,
      difficulty: 4,
      hook: 'Gives the same word a different vector in every sentence, built from context instead of a fixed lookup table.',
      intuition:
        'word2vec and GloVe give "bank" exactly one vector no matter the sentence. Contextual embeddings fix ' +
        'that by making the vector a function of the whole sentence, not just the word in isolation. ELMo ' +
        'showed the way in 2018: run a deep bidirectional LSTM language model over the text — one direction ' +
        'trained to predict the next word, the other trained to predict the previous word — and take a ' +
        "learned, task-specific combination of that model's internal hidden states at each position as the " +
        'word\'s embedding, different for every context it appears in. Modern transformer-based models do the ' +
        "conceptual equivalent in every layer: self-attention lets each token's representation gather " +
        "information from every other token in the sequence, so by a layer's output, a token's vector already " +
        'encodes what surrounds it, not just what it is. "Bank" the riverbank and "bank" the institution start ' +
        'from the same input embedding and diverge as soon as the surrounding words start pulling them apart ' +
        'through attention.',
      howItWorks: {
        summary:
          "Feed a token through a deep bidirectional language model (ELMo's biLSTM, or a transformer's stacked " +
          "self-attention layers) and read the resulting hidden state as that token's embedding for this specific sentence.",
        steps: [
          'ELMo: train a forward LSTM language model (predict the next word) and a backward LSTM language model (predict the previous word) on a large text corpus.',
          "ELMo: for a given token, take a task-specific weighted combination of the hidden states from every layer of both directions, not just the top layer.",
          "Transformer-based models: pass the sequence through stacked self-attention layers, where each token's representation is repeatedly updated by attending to every other token's current representation.",
          'In both cases, the same word produces a different output vector depending on the sentence it appears in, computed fresh on every forward pass rather than looked up in a fixed table.',
        ],
      },
      hyperparameters: [
        {
          name: 'layer combination weights (ELMo)',
          what: "Task-specific scalar weights (plus an overall scale factor γ) combining every biLM layer's hidden state into one embedding, rather than using only the top layer.",
          tuning:
            "Peters et al. report that exposing every internal layer, not only the deepest one, was crucial — " +
            'downstream models mix signal from multiple layers rather than relying on one.',
        },
      ],
      whenToUse: [
        'Word sense matters to the task — polysemous words need different representations depending on context',
        "You're already building on a pretrained transformer — every hidden state it produces is already a contextual embedding, with no separate step required",
        'Downstream performance benefits from combining representations at different depths rather than a single fixed layer',
      ],
      whenNotToUse: [
        'You need a single, fixed vector per word type for a lookup table or a nearest-neighbour index over vocabulary — contextual embeddings only exist per-occurrence, computed at inference time',
        'Compute or latency budget does not allow a full forward pass through a deep language model just to get an embedding — a static word2vec/GloVe lookup is orders of magnitude cheaper',
        'You need embeddings stable and reproducible independent of surrounding text, e.g. as fixed feature keys in a database',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'contextual-embeddings',
      },
      math: {
        latex: ['\\mathrm{ELMo}_k^{\\text{task}} = \\gamma^{\\text{task}} \\sum_{j=0}^{L} s_j^{\\text{task}} \\, h_{k,j}^{LM}'],
        notes:
          'h_{k,j}^{LM} is the biLM hidden state for token k at layer j (j=0 is the input layer, j=1..L are ' +
          'the biLSTM layers); s^task are softmax-normalized, task-specific weights learned on top of the ' +
          'frozen biLM, and γ^task rescales the whole vector. Transformer models have no equivalent single ' +
          "published formula — self-attention's own update rule (see the self-attention entry) plays the role " +
          'of layer j, applied L times, with the final layer\'s hidden state typically used directly instead ' +
          'of a learned combination across layers.',
      },
      complexity: {
        train:
          'ELMo: O(n) per biLSTM layer per direction, for sequence length n. Transformer-based contextual ' +
          'embeddings: O(n^2 · d) per self-attention layer, the same cost the self-attention entry describes.',
        predict: 'One forward pass through the full language model per sentence — cost scales with the underlying architecture, not a separate lookup step',
      },
      code: [
        'from transformers import AutoTokenizer, AutoModel',
        'import torch',
        '',
        'tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")',
        'model = AutoModel.from_pretrained("bert-base-uncased")',
        '',
        'text = "The bank raised its interest rates."',
        'inputs = tokenizer(text, return_tensors="pt")',
        'with torch.no_grad():',
        '    outputs = model(**inputs)',
        '',
        '# one 768-dim vector per token, specific to this sentence',
        'last_hidden_state = outputs.last_hidden_state',
      ].join('\n'),
      // self-attention / transformer-block / positional-encoding are genuine cross-body links to
      // Nova: self-attention's own entry already sets outputType: 'contextual-embeddings', and
      // token embeddings are summed with positional encodings before entering the transformer.
      related: ['word2vec-and-glove', 'self-attention', 'transformer-block', 'positional-encoding'],
      references: {
        free: [
          { title: 'The Illustrated BERT, ELMo, and co.', url: 'https://jalammar.github.io/illustrated-bert/' },
          { title: 'Hugging Face — Transformers quickstart', url: 'https://huggingface.co/docs/transformers/en/quicktour' },
        ],
        papers: [
          { title: 'Deep contextualized word representations', url: 'https://arxiv.org/abs/1802.05365', year: 2018 },
          { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', year: 2017 },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: 'Ch. 15–16 — Natural Language Processing: Pretraining and Applications',
            url: 'https://d2l.ai/chapter_natural-language-processing-pretraining/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'sentence-embedding-models',
      name: 'Sentence Embedding Models',
      aliases: ['Sentence-BERT', 'SBERT', 'sentence-transformers'],
      tier: 1,
      year: 2019,
      difficulty: 3,
      hook: 'Fine-tunes a transformer with a siamese network so cosine similarity between sentence vectors means something.',
      intuition:
        "Plain BERT gives every token a contextual embedding, but there's no obvious way to turn a whole " +
        "sentence into one comparison-ready vector — averaging BERT's token embeddings, or using its special " +
        "[CLS] token, both give mediocre similarity scores, and directly feeding a pair of sentences through " +
        'BERT together is far too slow for retrieval-style problems: Reimers and Gurevych measured roughly 65 ' +
        'hours of BERT inference to find the most similar pair among just 10,000 sentences, since BERT needs ' +
        'both sentences in the same forward pass. Sentence-BERT fixes this by running each sentence through ' +
        'BERT separately, through two copies of the same network sharing weights (a "siamese" architecture), ' +
        "pooling each sentence's token embeddings into one fixed-size vector, and fine-tuning so sentences " +
        'with similar meaning end up with vectors close together by cosine similarity. Once trained, comparing ' +
        'two sentences is one dot product, not one BERT forward pass — that same 10,000-sentence search drops ' +
        'from ~65 hours to about 5 seconds.',
      howItWorks: {
        summary:
          "Run each sentence through a shared-weight transformer encoder, pool its token embeddings into one " +
          'fixed-size vector, and fine-tune with a loss that pulls semantically similar sentences\' vectors together.',
        steps: [
          "Feed each sentence in a training pair or triplet through the same pretrained transformer encoder independently — 'siamese' means the weights are shared, not that two separate networks exist.",
          "Pool each sentence's per-token output vectors into a single fixed-size sentence vector, typically by averaging (mean pooling).",
          'Compute a loss over the pair or triplet of sentence vectors — e.g. cosine-similarity loss for labeled similarity pairs, or triplet loss for anchor/positive/negative sentences — and backpropagate through the shared encoder.',
          'At inference time, encode each sentence once, independently, and compare any two sentences with a single cosine similarity or dot product between their vectors.',
        ],
      },
      hyperparameters: [
        {
          name: 'pooling strategy',
          what: 'How per-token output vectors are combined into one sentence vector (mean pooling, [CLS] token, or max pooling).',
          tuning:
            'Mean pooling over all token vectors is the default and generally best-performing choice in the ' +
            "sentence-transformers library, ahead of using the [CLS] token alone.",
        },
        {
          name: 'loss function',
          what: 'The objective used to fine-tune the shared encoder: e.g. CosineSimilarityLoss, TripletLoss, ContrastiveLoss.',
          tuning:
            'Choice depends on the training data available: CosineSimilarityLoss needs labeled similarity ' +
            'scores between pairs; TripletLoss needs anchor/positive/negative triplets and pushes the anchor ' +
            'closer to the positive than to the negative by at least a margin.',
        },
      ],
      whenToUse: [
        'You need semantic search, clustering, or deduplication over many sentences or passages, where scoring every pair with a full cross-encoder forward pass is too slow',
        'You want to build or query a vector index (e.g. an ANN index) over text, since a fixed-size vector per sentence is exactly what those indexes require',
        'You need sentence- or passage-level similarity scores, not just token-level representations',
      ],
      whenNotToUse: [
        'You only need to score a small, fixed number of sentence pairs and accuracy matters more than speed — a cross-encoder that jointly attends over both sentences at once is more accurate than comparing two independently-pooled vectors',
        'The sentences are far outside the model\'s fine-tuning domain (e.g. highly technical or code-like text) and no in-domain fine-tuning data is available',
        'You need token-level or word-level output rather than a single sentence vector — use contextual embeddings directly instead of pooling them away',
      ],
      facets: {
        task: ['representation', 'retrieval'],
        dataType: ['text'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'sentence-embeddings',
      },
      math: {
        latex: [
          '\\mathcal{L}_{\\text{triplet}} = \\max\\big(0,\\; d(s_a, s_p) - d(s_a, s_n) + \\epsilon\\big)',
          '\\mathcal{L}_{\\text{cos-sim}} = \\big(\\text{label} - \\cos(s_u, s_v)\\big)^2',
        ],
        notes:
          'd is a distance over pooled sentence vectors s (e.g. Euclidean); triplet loss pushes the anchor s_a ' +
          'closer to the positive s_p than to the negative s_n by at least margin ε, while the cosine-similarity ' +
          'loss directly regresses predicted cosine similarity toward a labeled similarity score. Both are ' +
          'documented loss functions in the sentence-transformers library SBERT models are trained with.',
      },
      complexity: {
        train:
          'One encoder forward pass per sentence per training step, not per pair or triplet — cost scales with ' +
          'the underlying transformer encoder, the same as fine-tuning it directly.',
        predict:
          'One forward pass per sentence to encode it, then O(1) per comparison via cosine similarity or dot ' +
          'product — the gap Reimers & Gurevych report (~65 hours with BERT vs. ~5 seconds with SBERT for ' +
          '10,000 sentences) is exactly this: a forward pass per pair versus a forward pass per sentence.',
      },
      code: [
        'from sentence_transformers import SentenceTransformer',
        '',
        'model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")',
        '',
        'sentences = ["The weather is lovely today.", "It\'s so sunny outside!", "He drove to the stadium."]',
        'embeddings = model.encode(sentences)              # one 384-dim vector per sentence',
        '',
        'similarities = model.similarity(embeddings, embeddings)   # cosine similarity matrix',
      ].join('\n'),
      // hnsw / approximate-nearest-neighbors is the genuine cross-body link to Venus: sentence
      // embeddings are exactly the fixed-size vectors an ANN index is built to search over, and
      // SBERT's own motivating benchmark is retrieval speed at scale, not raw accuracy.
      related: ['contextual-embeddings', 'hnsw', 'approximate-nearest-neighbors'],
      references: {
        free: [
          { title: 'Sentence Transformers documentation', url: 'https://www.sbert.net/' },
          { title: 'Sentence Transformers — Quickstart', url: 'https://www.sbert.net/docs/quickstart.html' },
        ],
        papers: [
          {
            title: 'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks',
            url: 'https://arxiv.org/abs/1908.10084',
            year: 2019,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: 'Ch. 16.6 — Fine-Tuning BERT for Sequence-Level and Token-Level Applications',
            url: 'https://d2l.ai/chapter_natural-language-processing-applications/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'tokenizer-pathologies',
      name: 'Tokenizer Pathologies',
      aliases: ['glitch tokens'],
      tier: 2,
      year: 2023,
      difficulty: 2,
      hook: 'The tokenizer, not the model, is often why LLMs fumble arithmetic, spelling, and a handful of specific words.',
      intuition:
        'Every failure catalogued here traces back to one root cause: tokenization is a fixed, ' +
        'frequency-driven preprocessing step with no idea what the text means, so it quietly discards ' +
        'structure the model then has to work to recover. Numbers are the clearest case — a BPE or WordPiece ' +
        'vocabulary merges digits by how often they co-occurred in training text, not by their numeric value, ' +
        'so two numbers with the same digit count can tokenize completely differently; the model never sees ' +
        'individual place-value digits lined up the way a person lines them up to add two numbers by hand. ' +
        'Whitespace causes a related problem: many BPE vocabularies bake a leading space into the token ' +
        'itself, so "hello" and " hello" are entirely different token IDs. The strangest case is glitch ' +
        "tokens: strings frequent enough in the tokenizer's training data to earn their own token, but rare " +
        "or absent from the language model's later training data, leaving that token's embedding never " +
        'meaningfully learned — asking GPT models to simply repeat "SolidGoldMagikarp" produced evasion, ' +
        'insults, or the model silently substituting a different word entirely.',
      howItWorks: {
        summary:
          'A shared root cause across distinct symptoms: tokenizers segment text by corpus-frequency ' +
          "statistics alone, with no awareness of numeric value, morpheme boundaries, or how well a token's " +
          "context was represented in the model's later training data.",
        steps: [
          "Numbers: digit sequences are merged into tokens by frequency like any other string, so the same-length number can split into a different number of tokens depending on what was frequent in the tokenizer's training corpus.",
          'Whitespace: because many BPE/WordPiece vocabularies bake a leading space into the token itself, the same word gets a different token ID depending on what precedes it in the text.',
          "Glitch tokens: a string frequent enough in the tokenizer's training corpus to earn its own token, but rare or absent in the language model's later training data, ends up with an embedding that was never meaningfully updated — querying it produces erratic, occasionally non-deterministic output even at temperature zero.",
        ],
      },
      whenToUse: [
        "You're debugging why an LLM makes arithmetic mistakes it seems to 'understand' conceptually, or is inconsistent at spelling or counting letters within a word",
        "You're auditing a custom or newly-trained vocabulary for tokens that occur in the tokenizer's training corpus but were rare or absent from the language model's own training data — a documented source of unstable behaviour",
      ],
      whenNotToUse: [
        'The tokenizer and training corpus are the same well-established pairing shipped by a major model provider and you have no specific behavioural anomaly to investigate — documented glitch tokens were found by deliberately hunting for vocabulary/training-data mismatches, not encountered incidentally',
        'You need a fix rather than a diagnosis — these are documented failure modes to check for, not a technique with parameters to tune; mitigations like digit-level tokenization belong to the specific tokenizer entry, not here',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'failure-mode-catalogue',
      },
      related: ['byte-pair-encoding', 'wordpiece-and-sentencepiece'],
      references: {
        free: [
          { title: 'Simon Willison — Understanding GPT tokenizers', url: 'https://simonwillison.net/2023/Jun/8/gpt-tokenizers/' },
          {
            title: 'SolidGoldMagikarp (plus, prompt generation)',
            url: 'https://www.greaterwrong.com/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation',
          },
        ],
        papers: [
          {
            title: 'Tokenization Counts: The Impact of Tokenization on Arithmetic in Frontier LLMs',
            url: 'https://arxiv.org/abs/2402.14903',
            year: 2024,
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
  ],
} satisfies Body;
