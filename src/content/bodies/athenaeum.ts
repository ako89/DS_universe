/**
 * Athenaeum — Retrieval, Memory & RAG. See PLAN.md §3 for the moon list (6 moons, all written
 * here). Tiers follow PLAN.md: ★ = Tier 1 (retrieval-augmented-generation, vector-databases-and-
 * ann-indexes, chunking-strategies, hybrid-search-and-bm25, rerankers-and-cross-encoders),
 * unstarred = Tier 2 (long-context-vs-retrieval).
 *
 * Every entry was researched before it was written, per docs/CONTENT_GUIDE.md §3. Sources
 * actually opened this session, per entry:
 *   RAG              — arxiv.org/abs/2005.11401 abstract page + ar5iv full-text HTML (RAG-Sequence
 *                      / RAG-Token marginalization formulas, k in {5,10}, BART-large 400M, frozen
 *                      DPR document encoder), Hugging Face RAG model docs (RagConfig: n_docs=5,
 *                      retrieval_vector_size=768, faiss-backed index), Pinecone's RAG explainer
 *                      (the modern retrieve-then-prompt pattern), Jurafsky & Martin SLP3 Ch. 11
 *                      (self-extracted via pdftotext — the schematic RAG prompt template and the
 *                      "agent-based RAG" / reranker augmentations).
 *   vector databases — FAISS wiki "Guidelines to choose an index" (Flat/IVF/HNSW thresholds, the
 *                      4*sqrt(N)-16*sqrt(N) cluster-count rule), Meta engineering blog on FAISS's
 *                      2017 release, Qdrant's "Complete Guide to Filtering in Vector Search"
 *                      (pre-filter fragmenting the HNSW graph vs. post-filter waste), Milvus SIGMOD
 *                      2021 paper (DOI verified via Crossref), Product Quantization paper (Jégou,
 *                      Douze & Schmid 2011, DOI verified via Crossref), Pinecone's own 2021 launch
 *                      post (date-verified).
 *   chunking         — Karpukhin et al. 2020 DPR paper via ar5iv HTML (verified verbatim: "split
 *                      each article into multiple, disjoint text blocks of 100 words as passages"
 *                      — this is the historical anchor, not a WebFetch PDF guess), Pinecone's
 *                      "Chunking Strategies for LLM Applications" (fixed/recursive/semantic
 *                      definitions, 128-256 vs 512-1024 token testing ranges), Anthropic's
 *                      Contextual Retrieval post (date- and number-verified: 35%/49%/67% failure-
 *                      rate reductions from a 5.7% baseline), Jurafsky & Martin SLP3 Ch. 11.
 *   hybrid + BM25    — Robertson & Walker 1994 SIGIR paper (DOI verified via Crossref) and Okapi
 *                      at TREC-3 (Robertson et al. 1995, verified via Microsoft Research's own
 *                      publication page), Elastic's "Practical BM25 Part 2" blog (k1=1.2, b=0.75
 *                      Lucene/Elasticsearch defaults, corroborated independently by SLP3 Ch. 11's
 *                      self-extracted BM25 formula and its citation of Manning et al. 2008's
 *                      k1∈[1.2,2], b=0.75 recommendation), Cormack, Clarke & Buettcher's RRF paper
 *                      (DOI verified via Crossref), Pinecone's hybrid-search docs (alpha weighting,
 *                      score-normalization problem between bounded cosine and unbounded BM25).
 *   rerankers        — Nogueira & Cho 2019 arXiv abstract page (27% relative MRR@10 gain on MS
 *                      MARCO), Sentence Transformers' "Retrieve & Re-Rank" and "Cross-Encoders"
 *                      docs (the top-100-candidates two-stage pattern, bi- vs cross-encoder cost
 *                      tradeoff), SLP3 Ch. 11's bi-encoder/cross-encoder formulas (self-extracted).
 *   long context     — Liu et al. 2023 "Lost in the Middle" arXiv abstract page (U-shaped
 *                      position-dependent accuracy, verified year and finding directly from the
 *                      abstract), Xu et al. 2023 "Retrieval meets Long Context Large Language
 *                      Models" arXiv abstract page (retrieval still helps long-context models;
 *                      comparable accuracy at much less compute than extending context alone).
 *
 * PDF-fetch trap caught this session: WebFetch on the SLP3 Ch. 11 PDF
 * (web.stanford.edu/~jurafsky/slp3/11.pdf) returned only a description of the PDF's binary
 * structure ("compressed stream data that isn't directly readable") rather than inventing
 * content — but per CONTENT_GUIDE §3 that raw WebFetch response was still treated as unusable.
 * The PDF was downloaded and run through `pdftotext -layout` directly; every specific claim taken
 * from this chapter (the BM25 formula, the DPR-style 100-token chunking description, the RAG
 * prompt schematic, the bi-encoder/cross-encoder equations, the k1/b citation to Manning et al.
 * 2008) was confirmed to appear verbatim in that self-extracted text before being used.
 *
 * Deliberate cross-links: `vector-databases-and-ann-indexes` links back to `hnsw` and
 * `approximate-nearest-neighbors` (Venus) per PLAN.md's explicit callout — FAISS's own index guide
 * and Qdrant's filtering article both describe HNSW as one of the index types a vector database
 * chooses between, and the metadata-filtering problem (pre-filtering fragments the HNSW graph) is
 * a genuine extension of, not a repeat of, the base HNSW entry. `chunking-strategies` and
 * `vector-databases-and-ann-indexes` both link to `sentence-embedding-models` (Babel): chunks and
 * indexed vectors are exactly the embeddings that entry produces — its own whenToUse already
 * names ANN indexes as the reason to use it. `hybrid-search-and-bm25` links to
 * `contextual-embeddings` (Babel) for its dense side. `retrieval-augmented-generation` links to
 * `gpt-lineage` (Genesis, this batch's sibling): RAG's generator is an off-the-shelf decoder LLM
 * in the common in-context pattern, and BART (the original paper's generator) is itself an
 * encoder-decoder ancestor of that lineage. `long-context-vs-retrieval` links to
 * `long-context-architectures` (Genesis, sibling) — the explicit tradeoff PLAN.md calls out.
 *
 * `eraRange` is [1994, 2023]: 1994 is Robertson & Walker's SIGIR paper introducing what became
 * BM25 (hybrid-search-and-bm25), and 2023 is Liu et al.'s "Lost in the Middle" (long-context-vs-
 * retrieval) — BM25 predates the LLM era by decades, exactly as expected for a body whose other
 * five moons all sit in 2017-2020.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'athenaeum',
  name: 'Athenaeum',
  segment: 'Retrieval, Memory & RAG',
  hook: 'Connects a language model to facts it never memorized: search, split, index, and rerank the world outside its weights.',
  summary:
    'Athenaeum holds the machinery that lets a language model answer from a document, a codebase or a knowledge ' +
    "base instead of from memory alone — splitting text into retrievable pieces, indexing it for fast similarity " +
    'search, combining lexical and semantic signals, and deciding what actually reaches the prompt.',
  eraRange: [1994, 2023],
  moons: [
    {
      id: 'retrieval-augmented-generation',
      name: 'Retrieval-Augmented Generation (RAG)',
      aliases: ['RAG', 'retrieve-then-generate'],
      tier: 1,
      year: 2020,
      difficulty: 3,
      hook: 'Retrieves passages from an external corpus and feeds them into the prompt so answers are grounded in real text.',
      intuition:
        'A language model answering purely from its trained parameters is taking a closed-book exam: whatever it ' +
        'memorized during training is all it has, and if it never saw a fact, or saw it and forgot it, it will ' +
        "confidently make something up rather than admit it doesn't know. Retrieval-augmented generation turns " +
        'that into an open-book exam. Before generating, a retriever searches an external corpus — proprietary ' +
        "documents, a fresh news index, anything not baked into the model's weights — for the passages most " +
        'relevant to the query, and those passages get inserted directly into the prompt alongside the question. ' +
        'The generator then answers conditioned on that retrieved text, rather than purely on what it memorized. ' +
        'This buys three things at once: answers can point at the passage they came from, the knowledge source ' +
        'can be updated by editing the corpus instead of retraining the model, and the model can answer about ' +
        'data it never trained on at all, such as a company\'s internal documents.',
      howItWorks: {
        summary:
          'Embed the query, retrieve the top-k most similar passages from an indexed corpus, insert them into ' +
          'the prompt, and generate an answer conditioned on that retrieved text.',
        steps: [
          'Split the source documents into passages and embed each one, storing the vectors in a retrieval index.',
          'Embed the incoming query with the same, or a matching, embedding model.',
          'Retrieve the top-k passages whose embeddings are closest to the query embedding.',
          'Assemble a prompt containing the retrieved passages, the original query, and an instruction to answer only from that text.',
          'Generate the answer conditioned on that prompt, so the output is grounded in the retrieved passages rather than only the model\'s parameters.',
          'Optionally return the source passages alongside the answer so a user can verify where it came from.',
        ],
      },
      hyperparameters: [
        {
          name: 'k / n_docs',
          what: 'Number of passages retrieved and inserted into the prompt per query.',
          tuning:
            'Lewis et al. train RAG with k in {5, 10} documents and tune k on validation data; Hugging Face\'s ' +
            'RagConfig defaults n_docs to 5. Too small risks missing the passage that actually has the answer; ' +
            'too large adds irrelevant context that can crowd out the useful part or exceed the context window.',
        },
        {
          name: 'chunking and embedding choices',
          what: 'How source documents are split before indexing, and which model embeds them.',
          tuning:
            'Passage granularity trades precision (small chunks pinpoint the answer) against context (large ' +
            'chunks preserve surrounding meaning) — see the chunking-strategies entry for the tuning detail.',
        },
      ],
      whenToUse: [
        "The answer depends on information that changes after the model's training cutoff, or that was never in its training data — proprietary documents, internal wikis, recent news",
        'You need to show which source supports an answer, e.g. for compliance, auditing or user trust',
        'The knowledge base is large enough that fine-tuning the model on all of it would be expensive, or would need repeating every time the data changes',
        'You want to reduce hallucination on knowledge-intensive queries by grounding generation in retrieved text rather than relying purely on what the model memorized',
      ],
      whenNotToUse: [
        'The task is reasoning or style rather than factual recall — retrieval adds latency and prompt length without addressing a problem the task does not have',
        'No retriever can find documents relevant enough to help; irrelevant retrieved passages can distract the generator and make answers worse, not better',
        'The full knowledge base already fits comfortably inside the model\'s context window at acceptable cost — see long-context-vs-retrieval',
        'Query latency budget cannot absorb an extra retrieval round-trip, embedding the query and searching an index, before generation even starts',
      ],
      facets: {
        task: ['generation', 'retrieval'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-text',
      },
      math: {
        latex: [
          'p_{\\text{RAG-Sequence}}(y \\mid x) \\approx \\sum_{z \\in \\text{top-}k} p_\\eta(z \\mid x) \\prod_{i=1}^{N} p_\\theta(y_i \\mid x, z, y_{1:i-1})',
          'p_{\\text{RAG-Token}}(y \\mid x) \\approx \\prod_{i=1}^{N} \\sum_{z \\in \\text{top-}k} p_\\eta(z \\mid x)\\, p_\\theta(y_i \\mid x, z, y_{1:i-1})',
        ],
        notes:
          "These are Lewis et al.'s two original formulations, both marginalizing over the top-k retrieved " +
          'documents z but at different granularity: RAG-Sequence uses the same document for the whole generated ' +
          'sequence, RAG-Token can switch documents at every generated token. p_eta is the retriever\'s ' +
          'distribution over documents (a frozen DPR document encoder plus a fine-tuned query encoder); p_theta ' +
          'is the generator (BART-large, 400M parameters). Most RAG systems used in practice today skip this ' +
          'marginalization entirely: instead of training the retriever and generator jointly, they concatenate ' +
          'retrieved passages straight into the prompt of a frozen, off-the-shelf LLM — simpler to build, but ' +
          "without the joint training signal the original paper's formula relies on.",
      },
      complexity: {
        train:
          'n/a for the common in-context version — no training at all beyond building the retrieval index; the ' +
          'original Lewis et al. formulation jointly fine-tunes the query encoder and generator end to end',
        predict:
          'One retrieval query against the index (see hnsw / approximate-nearest-neighbors for its cost) plus ' +
          'one generator forward pass over the query length plus k retrieved passages',
      },
      code: [
        'from sentence_transformers import SentenceTransformer',
        'import numpy as np',
        '',
        'embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")',
        'doc_embeddings = embedder.encode(passages)          # one vector per indexed passage',
        '',
        'def retrieve(query, k=5):',
        '    q_emb = embedder.encode([query])[0]',
        '    scores = doc_embeddings @ q_emb                  # cosine sim if vectors are normalized',
        '    top_k = np.argsort(-scores)[:k]',
        '    return [passages[i] for i in top_k]',
        '',
        'context = "\\n\\n".join(retrieve(query, k=5))',
        'prompt = f"Answer only from this context:\\n{context}\\n\\nQuestion: {query}"',
        'answer = llm.generate(prompt)                        # any frozen generator LLM',
      ].join('\n'),
      related: ['vector-databases-and-ann-indexes', 'chunking-strategies', 'hybrid-search-and-bm25', 'gpt-lineage'],
      references: {
        free: [
          { title: 'Hugging Face — RAG model documentation', url: 'https://huggingface.co/docs/transformers/en/model_doc/rag' },
          { title: 'Pinecone — Retrieval Augmented Generation (RAG)', url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/' },
        ],
        papers: [
          { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', url: 'https://arxiv.org/abs/2005.11401', year: 2020 },
          { title: 'Dense Passage Retrieval for Open-Domain Question Answering', url: 'https://arxiv.org/abs/2004.04906', year: 2020 },
        ],
        books: [
          {
            title: 'Speech and Language Processing',
            author: 'Jurafsky & Martin',
            chapter: 'Ch. 11 — Information Retrieval and Retrieval-Augmented Generation',
            url: 'https://web.stanford.edu/~jurafsky/slp3/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    {
      id: 'vector-databases-and-ann-indexes',
      name: 'Vector Databases & ANN Indexes',
      aliases: ['vector database', 'vector store', 'vector search engine'],
      tier: 1,
      year: 2017,
      difficulty: 3,
      hook: "Stores millions of embeddings and answers 'find the closest ones' in milliseconds, filtered by metadata too.",
      intuition:
        'HNSW (see Venus) tells you how to walk a graph to find close vectors fast. A vector database is the ' +
        'system built around that walk: it stores the raw vectors and their metadata, keeps the index up to date ' +
        'as data is added or deleted, shards it across machines when it outgrows one, and lets you combine "find ' +
        'the closest vectors" with "only among rows where category = electronics and price < 50" in a single ' +
        'query. That combination is harder than it sounds — filtering after the search wastes work scanning ' +
        'candidates that get thrown away, and filtering before the search by shrinking the candidate set can ' +
        "fracture the very graph connections HNSW's speed depends on. Under the hood, most engines choose " +
        'between an exact flat scan, a graph index such as HNSW, or an inverted-file index that clusters vectors ' +
        'and only searches the nearest clusters, often compressed with product quantization to shrink memory at ' +
        'the cost of some accuracy. Purpose-built systems (Pinecone, Milvus, Qdrant, Weaviate) and extensions to ' +
        'existing databases (pgvector) both compete on this same tradeoff.',
      howItWorks: {
        summary:
          'Store vectors plus metadata behind an ANN index — flat, IVF, or graph-based like HNSW — and answer a ' +
          'query by searching that index, optionally narrowed by a metadata filter, instead of scanning every row.',
        steps: [
          'Embed each item once and write its vector, plus any metadata to filter on, into the store.',
          'Build, or incrementally update, an ANN index over the vectors — commonly HNSW for speed and recall, or IVF with product quantization for lower memory.',
          'On a query, embed the query and search the index for the nearest vectors rather than scanning the full table.',
          'Apply metadata filters either before the search, risking a fragmented graph, or after it, risking wasted work — or use an index built to filter and search together.',
          'Return the top-k matches, typically to be reranked or inserted into an LLM prompt.',
        ],
      },
      hyperparameters: [
        {
          name: 'index type (Flat / IVF / HNSW)',
          what: 'Which structure the store builds over the vectors: an exact flat scan, a clustered inverted-file index, or a proximity graph like HNSW.',
          tuning:
            "FAISS's own guidance: use Flat for corpora too small to bother indexing (a few thousand vectors), " +
            'plain IVF up to about a million vectors, and IVF combined with HNSW clustering beyond that; IVF ' +
            'cluster count is typically dimensioned between 4*sqrt(N) and 16*sqrt(N).',
        },
        {
          name: 'nprobe (IVF) / ef (HNSW)',
          what: 'The query-time knob controlling how many clusters or graph candidates are examined — the main recall-versus-latency dial, whichever index type is chosen.',
          tuning: 'Raise it until measured recall on a held-out query set plateaus; both are cheap to change without rebuilding the index.',
        },
        {
          name: 'metadata filter strategy',
          what: 'Whether filters are applied before the vector search (pre-filter), after it (post-filter), or via an index built to support both together.',
          tuning:
            'Low-cardinality filters (few matching rows) break naive pre-filtering by fragmenting the graph; ' +
            'test your actual filter distributions rather than assuming one strategy always wins.',
        },
      ],
      whenToUse: [
        'You need to search millions to billions of embeddings for the closest matches in milliseconds, not seconds',
        'Queries need to combine vector similarity with structured filters, e.g. category, date range, or access permissions, in the same request',
        'The corpus grows or changes over time and you need to add, update or delete vectors without rebuilding the whole index from scratch',
        'You are serving retrieval for a production RAG or semantic search system where a brute-force scan already misses your latency budget',
      ],
      whenNotToUse: [
        'The corpus is small enough, a few thousand vectors, that a brute-force scan already meets your latency target — a dedicated index adds operational complexity for no benefit',
        'You need guaranteed-exact nearest neighbours with no recall loss — ANN indexes trade a small, measured amount of recall for speed by construction',
        'Your access pattern is pure batch analytics rather than low-latency point queries — a columnar store or a one-off brute-force job is simpler',
        'The filters you need are high-cardinality boolean combinations across many fields — relational query planning may serve you better than a vector index bolted onto metadata',
      ],
      facets: {
        task: ['retrieval'],
        dataType: ['text', 'image', 'multimodal'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ranked-neighbour-ids',
      },
      math: {
        latex: [
          'n_{\\text{clusters}} \\in [4\\sqrt{N},\\, 16\\sqrt{N}]',
          '\\text{PQ}_M : \\mathbb{R}^d \\to \\{0,\\ldots,255\\}^M, \\quad \\text{compressed size} = M \\text{ bytes/vector}',
        ],
        notes:
          "IVF's search cost comes from restricting comparison to nprobe of the n_clusters partitions instead of " +
          'all N vectors; product quantization then shrinks the vectors kept inside those partitions by splitting ' +
          'each one into M sub-vectors and replacing each sub-vector with the index of its nearest of 256 learned ' +
          'centroids, trading a compressed M-byte code for the full d-dimensional float vector. The compounding ' +
          'effect is why IVF+PQ indexes can hold far more vectors per GB of RAM than a flat or HNSW index, at the ' +
          'cost of some recall.',
      },
      complexity: {
        train:
          'O(N) to embed and insert; index build cost depends on the structure — O(N log N) for HNSW (see the ' +
          'hnsw entry), or one k-means pass over a sample plus O(N) assignment for IVF',
        predict:
          'O(nprobe × N/n_clusters) for IVF; O(log N) at fixed recall for HNSW-based indexes — both far below ' +
          'the O(N) of a brute-force scan',
      },
      code: [
        'import faiss',
        'import numpy as np',
        '',
        'd, n = 384, 1_000_000',
        'vectors = np.random.rand(n, d).astype("float32")',
        '',
        'nlist = 4 * int(np.sqrt(n))              # FAISS rule of thumb: 4*sqrt(N) to 16*sqrt(N)',
        'quantizer = faiss.IndexFlatL2(d)',
        'index = faiss.IndexIVFPQ(quantizer, d, nlist, 8, 8)   # 8-byte codes, 8 bits/sub-quantizer',
        '',
        'index.train(vectors[:100_000])            # IVF and PQ both need a training sample',
        'index.add(vectors)',
        'index.nprobe = 16                         # recall/latency dial at query time',
        '',
        'distances, ids = index.search(vectors[:5], k=10)',
      ].join('\n'),
      related: ['hnsw', 'approximate-nearest-neighbors', 'sentence-embedding-models', 'retrieval-augmented-generation'],
      references: {
        free: [
          { title: 'FAISS wiki — Guidelines to choose an index', url: 'https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index' },
          { title: 'Qdrant — A Complete Guide to Filtering in Vector Search', url: 'https://qdrant.tech/articles/vector-search-filtering/' },
        ],
        papers: [
          { title: 'Product Quantization for Nearest Neighbor Search', url: 'https://doi.org/10.1109/TPAMI.2010.57', year: 2011 },
          { title: 'Milvus: A Purpose-Built Vector Data Management System', url: 'https://doi.org/10.1145/3448016.3457550', year: 2021 },
        ],
        books: [{ title: 'Foundations of Vector Retrieval', author: 'Sebastian Bruch', url: 'https://arxiv.org/abs/2401.09350' }],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    {
      id: 'chunking-strategies',
      name: 'Chunking Strategies',
      aliases: ['text splitting', 'passage segmentation', 'document chunking'],
      tier: 1,
      year: 2020,
      difficulty: 2,
      hook: 'How a document gets split into retrievable pieces — a bad cut can hide the answer from the retriever.',
      intuition:
        "Retrieval doesn't work on whole documents — a 50-page PDF embedded as one vector produces a blurry " +
        'average of everything in it, and stuffing the whole thing into a prompt burns the context window on ' +
        'mostly irrelevant text. So every retrieval system first cuts documents into chunks, each embedded and ' +
        'indexed separately. The simplest approach, fixed-size chunking, splits every document into equal ' +
        'windows of tokens or characters — cheap and predictable, but it can slice a sentence, or the answer, in ' +
        'half at an arbitrary boundary. Recursive splitting fixes the worst of that by preferring to break at ' +
        'paragraph or sentence boundaries first, falling back to a hard cut only when a piece is still too long. ' +
        'Semantic chunking goes further, embedding sentences and cutting where consecutive sentences stop being ' +
        'similar, so boundaries track actual topic shifts rather than a token count. Overlap between consecutive ' +
        'chunks is the usual patch for boundary damage: repeat the last few sentences of one chunk at the start ' +
        'of the next, so an answer split across a boundary still appears whole somewhere.',
      howItWorks: {
        summary:
          'Split each document into smaller passages before embedding and indexing them, choosing a splitting ' +
          'rule and a chunk size that keep each piece coherent and close to the size a query is expected to need.',
        steps: [
          'Pick a base unit to split on: characters, tokens, or structural boundaries like paragraphs, headers or sentences.',
          'Fixed-size: cut every chunk_size tokens or characters regardless of structure.',
          'Recursive: try splitting on the largest structural separator first, falling back to a smaller separator or a hard cut only when a piece is still over chunk_size.',
          'Semantic: embed consecutive sentences and start a new chunk wherever their similarity drops sharply.',
          'Add overlap between consecutive chunks so text near a boundary appears in more than one chunk.',
          'Embed and index each finished chunk separately (see vector-databases-and-ann-indexes).',
        ],
      },
      hyperparameters: [
        {
          name: 'chunk_size',
          what: 'Target length of each chunk, in tokens or characters.',
          tuning:
            'A common starting range is 128-256 tokens for precise, narrow retrieval and 512-1024 tokens for ' +
            "broader context; the right value also depends on the embedding model's own context limit and " +
            'should be tuned against a retrieval evaluation set rather than guessed.',
        },
        {
          name: 'chunk_overlap',
          what: 'How much text repeats between consecutive chunks.',
          tuning:
            'A common default is 10-20% of chunk_size; too little overlap orphans sentences that straddle a ' +
            'boundary, too much wastes index space re-embedding the same text repeatedly.',
        },
      ],
      whenToUse: [
        "You are indexing documents longer than a single embedding model's effective context, or longer than what you want returned as one retrieved unit",
        'Queries target specific facts or short answers — smaller chunks give the retriever a better chance of an exact, unpolluted match',
        'Documents have exploitable structure (headers, paragraphs, code blocks) that a structure-aware or recursive splitter can use to avoid cutting mid-thought',
        'You can run a retrieval evaluation to compare chunk sizes empirically rather than picking one on intuition alone',
      ],
      whenNotToUse: [
        'Documents are already short enough, e.g. FAQ entries or short emails, that splitting them further only fragments context for no retrieval benefit',
        'The answer to a typical query requires synthesizing information spread across an entire document — any fixed chunk boundary will separate it from itself',
        'The source documents have no exploitable structure at all, e.g. raw OCR output with no headers or paragraph breaks, so structure-aware chunking has nothing to key off',
        'You need chunk boundaries to be reproducible and auditable and cannot tolerate the nondeterminism of embedding-based semantic chunking',
      ],
      facets: {
        task: ['retrieval', 'representation'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'text-passages',
      },
      complexity: {
        train: 'n/a — chunking is a preprocessing step, not a fitted model',
        predict: 'O(document length) per document to split; semantic chunking additionally costs one embedding call per sentence or window',
      },
      code: [
        'from langchain_text_splitters import RecursiveCharacterTextSplitter',
        '',
        'splitter = RecursiveCharacterTextSplitter(',
        '    chunk_size=512,',
        '    chunk_overlap=64,',
        '    separators=["\\n\\n", "\\n", " ", ""],   # largest structural break first, hard cut last',
        ')',
        '',
        'chunks = splitter.split_text(document_text)',
        '# each chunk gets embedded and indexed separately',
        'embeddings = embedder.encode(chunks)',
      ].join('\n'),
      related: ['sentence-embedding-models', 'retrieval-augmented-generation', 'vector-databases-and-ann-indexes'],
      references: {
        free: [
          { title: 'Pinecone — Chunking Strategies for LLM Applications', url: 'https://www.pinecone.io/learn/chunking-strategies/' },
          { title: 'Anthropic — Contextual Retrieval', url: 'https://www.anthropic.com/news/contextual-retrieval' },
        ],
        papers: [{ title: 'Dense Passage Retrieval for Open-Domain Question Answering', url: 'https://arxiv.org/abs/2004.04906', year: 2020 }],
        books: [
          {
            title: 'Speech and Language Processing',
            author: 'Jurafsky & Martin',
            chapter: 'Ch. 11 — Information Retrieval and Retrieval-Augmented Generation',
            url: 'https://web.stanford.edu/~jurafsky/slp3/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    {
      id: 'hybrid-search-and-bm25',
      name: 'Hybrid Search & BM25',
      aliases: ['Okapi BM25', 'sparse-dense fusion', 'lexical + semantic search'],
      tier: 1,
      year: 1994,
      difficulty: 3,
      hook: 'Combines decades-old keyword scoring with modern embeddings, because neither alone catches everything a query needs.',
      intuition:
        "Dense embeddings are good at synonymy — a query for 'cheap laptop' can match a passage that says " +
        "'affordable notebook' because the two land near each other in vector space. They are bad at exact " +
        'strings: a part number, an error code, or a rare proper noun can drift close to nothing relevant in ' +
        'embedding space, precisely because the model never learned it means anything special. BM25, a ' +
        'decades-old scoring function from classic information retrieval, is the mirror image: it counts term ' +
        "overlap between query and document, weighted so rare terms count for more than common ones and long " +
        "documents don't win purely by having more words, so an exact term match always scores well no matter " +
        'how obscure the term is. Hybrid search runs both in parallel and fuses their rankings — either by ' +
        'weighting normalized scores directly, or, more robustly, with Reciprocal Rank Fusion, which only looks ' +
        "at each result's rank in each list and so never has to reconcile BM25's unbounded scores with a dense " +
        "model's bounded cosine similarities.",
      howItWorks: {
        summary:
          'Score documents against a query with both a sparse lexical method, BM25, and a dense embedding ' +
          'similarity, then fuse the two ranked lists into one.',
        steps: [
          'Build a sparse index (an inverted index of term frequencies) and a dense index (embedding vectors) over the same corpus.',
          "Compute each candidate document's BM25 score: term frequency, boosted by inverse document frequency, saturated so repeated terms give diminishing returns, and normalized by document length.",
          'Separately, embed the query and retrieve its nearest neighbours from the dense index by cosine or dot-product similarity.',
          'Fuse the two ranked lists — either a weighted combination of normalized scores, or Reciprocal Rank Fusion, which sums 1/(k + rank) for each document across both lists.',
          'Return the top-k documents by fused score.',
        ],
      },
      hyperparameters: [
        {
          name: 'k1, b (BM25)',
          what:
            'k1 controls how quickly additional occurrences of a term stop adding to the score (term-frequency ' +
            "saturation); b controls how much a document's length relative to average length penalizes it.",
          tuning:
            "Lucene and Elasticsearch default to k1=1.2 and b=0.75, in the range Manning, Raghavan & Schütze's " +
            'textbook recommends (k1 in [1.2, 2], b=0.75); raise k1 toward 2 if repeated terms should keep ' +
            "adding signal, lower b toward 0 if document length shouldn't be penalized at all.",
        },
        {
          name: 'alpha (hybrid weighting)',
          what: 'Convex-combination weight between the dense and sparse scores when not using rank-based fusion: combined = alpha * dense + (1 - alpha) * sparse.',
          tuning:
            'alpha=1 is pure semantic search, alpha=0 is pure BM25, alpha=0.5 weights them equally; scores must ' +
            'be normalized to comparable ranges first, since dense similarity is bounded and BM25 is not.',
        },
        {
          name: 'k (RRF constant)',
          what: "The smoothing constant in Reciprocal Rank Fusion's 1/(k + rank) term.",
          tuning:
            'k=60 was shown to work well across benchmarks in the original RRF paper and is the common default; ' +
            'a smaller k weights top ranks more heavily, which can help on small result sets.',
        },
      ],
      whenToUse: [
        'Queries mix free-text semantic intent with things embeddings handle poorly: exact identifiers, product codes, acronyms, or rare proper nouns',
        'You are migrating a keyword-search system to embeddings and cannot afford to regress on queries the old system already handled well',
        'You want a fusion method that needs no score calibration between two very differently scaled ranking signals — use Reciprocal Rank Fusion specifically',
        'The corpus and query vocabulary overlap well enough that exact term matches are informative at all — highly paraphrased or cross-lingual queries get little from the sparse side',
      ],
      whenNotToUse: [
        'The corpus and queries are consistently in different vocabularies, e.g. cross-lingual retrieval, where lexical overlap is rare regardless of how BM25 is tuned',
        'You need a single simple system and dense retrieval alone already meets your accuracy target — maintaining two indexes and a fusion step is extra operational cost for a marginal gain',
        'Latency budget cannot absorb running two retrieval passes and a fusion step before generation even starts',
        'The sparse index would need constant re-tokenization for a rapidly evolving vocabulary, e.g. new slang or product SKUs, that a fixed analyzer cannot keep up with',
      ],
      facets: {
        task: ['retrieval', 'ranking'],
        dataType: ['text'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ranked-document-ids',
      },
      math: {
        latex: [
          '\\text{BM25}(q,d) = \\sum_{t \\in q} \\log\\frac{N}{\\mathrm{df}_t} \\cdot \\frac{\\mathrm{tf}_{t,d}}{\\mathrm{tf}_{t,d} + k_1\\left(1 - b + b\\frac{|d|}{|d_{\\text{avg}}|}\\right)}',
          '\\mathrm{RRF}(d) = \\sum_{r \\,\\in\\, \\text{rankings}} \\frac{1}{k + \\mathrm{rank}_r(d)}',
        ],
        notes:
          "BM25's log(N/df_t) term is the classic inverse-document-frequency weight — rarer terms score higher; " +
          'the fraction next to it saturates as tf_{t,d} grows, controlled by k1, and is scaled up for documents ' +
          'shorter than average and down for documents longer than average, controlled by b. Setting k1=0 ' +
          'discards term frequency entirely, reducing BM25 to binary term presence weighted by idf. RRF ignores ' +
          'the underlying scores completely and works purely off rank position, which is precisely why it needs ' +
          "no normalization step between a bounded cosine similarity and an unbounded BM25 score.",
      },
      complexity: {
        train: 'n/a for BM25 — it is a scoring formula over a built inverted index, not a fitted model; building that index costs O(corpus size)',
        predict:
          'O(number of candidate documents containing at least one query term) for BM25 via the inverted index; ' +
          'dense retrieval cost is whatever the chosen ANN index costs (see vector-databases-and-ann-indexes); ' +
          'fusion itself is O(k log k) to merge and sort two top-k lists',
      },
      code: [
        'from rank_bm25 import BM25Okapi',
        'import numpy as np',
        '',
        'tokenized_corpus = [doc.split() for doc in corpus]',
        'bm25 = BM25Okapi(tokenized_corpus, k1=1.2, b=0.75)     # Lucene/Elasticsearch defaults',
        '',
        'sparse_scores = bm25.get_scores(query.split())',
        'dense_scores = doc_embeddings @ query_embedding          # cosine sim, vectors pre-normalized',
        '',
        'def reciprocal_rank_fusion(*rankings, k=60):',
        '    fused = {}',
        '    for ranking in rankings:',
        '        for rank, doc_id in enumerate(ranking):',
        '            fused[doc_id] = fused.get(doc_id, 0) + 1 / (k + rank)',
        '    return sorted(fused, key=fused.get, reverse=True)',
        '',
        'sparse_ranking = np.argsort(-sparse_scores)',
        'dense_ranking = np.argsort(-dense_scores)',
        'final_ranking = reciprocal_rank_fusion(sparse_ranking, dense_ranking)',
      ].join('\n'),
      related: ['contextual-embeddings', 'vector-databases-and-ann-indexes', 'rerankers-and-cross-encoders', 'retrieval-augmented-generation'],
      references: {
        free: [
          { title: 'Elastic — Practical BM25, Part 2: The BM25 Algorithm and its Variables', url: 'https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables' },
          { title: 'Pinecone Docs — Hybrid search', url: 'https://docs.pinecone.io/guides/search/hybrid-search' },
        ],
        papers: [
          {
            title: 'Some Simple Effective Approximations to the 2-Poisson Model for Probabilistic Weighted Retrieval',
            url: 'https://doi.org/10.1007/978-1-4471-2099-5_24',
            year: 1994,
          },
          { title: 'Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods', url: 'https://doi.org/10.1145/1571941.1572114', year: 2009 },
        ],
        books: [
          {
            title: 'Speech and Language Processing',
            author: 'Jurafsky & Martin',
            chapter: 'Ch. 11 — Information Retrieval and Retrieval-Augmented Generation',
            url: 'https://web.stanford.edu/~jurafsky/slp3/',
          },
          { title: 'Introduction to Information Retrieval', author: 'Manning, Raghavan & Schütze', url: 'https://nlp.stanford.edu/IR-book/information-retrieval-book.html' },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    {
      id: 'rerankers-and-cross-encoders',
      name: 'Rerankers & Cross-Encoders',
      aliases: ['cross-encoder reranking', 'two-stage retrieval'],
      tier: 1,
      year: 2019,
      difficulty: 3,
      hook: 'Re-scores a short list of retrieved candidates with a slower model that reads the query and document together.',
      intuition:
        'A bi-encoder, the kind of model behind fast vector search, embeds the query and every document ' +
        'separately, so the only interaction between them at query time is one dot product. That is what makes ' +
        'it fast enough to search millions of vectors, but it also means the model never gets to look at the ' +
        'query and a specific document side by side. A cross-encoder does exactly that: it feeds the query and ' +
        'one candidate document into the same transformer together, so self-attention can compare their tokens ' +
        'directly, and outputs a single relevance score for that pair. This is far more accurate, because the ' +
        'model can weigh exactly how the two texts relate, but it is far too slow to run against a whole corpus: ' +
        'one transformer pass per document, per query. The standard fix is a two-stage pipeline — use a cheap ' +
        'method, a bi-encoder or BM25, to retrieve a short list of maybe 50-100 candidates, then run the ' +
        'expensive cross-encoder only over that short list to reorder it before it reaches the generator.',
      howItWorks: {
        summary:
          'Retrieve a short list of candidates cheaply, then pass each query-candidate pair jointly through a ' +
          "cross-encoder that scores their relevance with full attention between the two texts, and sort by that " +
          'score.',
        steps: [
          'Retrieve an initial candidate list with a fast method: BM25, a bi-encoder / vector search, or both fused together.',
          'For each candidate, concatenate the query and the candidate document into a single input, separated by a special token.',
          'Pass that joint input through a transformer, typically a fine-tuned BERT-style encoder, and read a relevance score off the final layer, e.g. from the [CLS] token.',
          'Repeat for every candidate in the short list — this cost is what limits the list to tens or low hundreds of items, not the whole corpus.',
          'Sort candidates by cross-encoder score and keep the top-k for the generator or the end user.',
        ],
      },
      hyperparameters: [
        {
          name: 'candidate list size (top-N before reranking)',
          what: 'How many first-stage results get passed to the cross-encoder.',
          tuning:
            "A common range is 50-100 candidates: large enough that the first-stage retriever's recall covers " +
            'the true answer most of the time, small enough that N cross-encoder forward passes stay within ' +
            'latency budget.',
        },
        {
          name: 'cross-encoder model size',
          what: 'Which pretrained model backs the reranker, e.g. a small MiniLM cross-encoder vs. a full BERT-large.',
          tuning:
            'Smaller distilled cross-encoders trade some accuracy for latency; the sentence-transformers library ' +
            'ships several pretrained sizes specifically for this tradeoff.',
        },
      ],
      whenToUse: [
        'A fast first-stage retriever already narrows the corpus down to a short candidate list and ranking quality among those top candidates matters',
        "The end task is sensitive to precision at the very top of the ranking, e.g. what gets shown first or what gets fed into a generator's limited context window",
        "The relevance signal depends on fine-grained interaction between query and document tokens that a bi-encoder's single dot product cannot capture",
        'Latency budget can absorb dozens to low hundreds of transformer forward passes per query, on top of the first-stage retrieval',
      ],
      whenNotToUse: [
        'You need to rank the entire corpus, not a short candidate list — a cross-encoder needs one forward pass per query-document pair and does not scale to that',
        'Query latency is extremely tight, e.g. sub-50ms, and even a small reranking pass over 50-100 candidates would not fit the budget',
        'The first-stage retriever already has poor recall — reranking cannot recover a relevant document that was never in the candidate list to begin with',
        'You need to precompute and cache document representations offline — cross-encoders cannot score a document until they see it paired with a specific query',
      ],
      facets: {
        task: ['ranking', 'retrieval'],
        dataType: ['text'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'relevance-scores',
      },
      math: {
        latex: [
          'z = \\mathrm{Transformer}([\\text{CLS}];\\, q;\\, [\\text{SEP}];\\, d)_{[\\text{CLS}]}',
          '\\mathrm{score}(q,d) = \\sigma(Wz + b)',
        ],
        notes:
          "Contrast this with a bi-encoder's score(q,d) = z_q . z_d (see sentence-embedding-models): a " +
          'bi-encoder computes z_q and z_d independently and combines them with one cheap dot product, so ' +
          'document vectors can be precomputed and reused across every future query. A cross-encoder\'s z ' +
          'depends jointly on both q and d together, computed fresh for every pair, which is exactly the extra ' +
          'work that buys its extra accuracy.',
      },
      complexity: {
        train:
          'Fine-tuning a pretrained transformer, typically BERT-scale, on labeled query/relevant/irrelevant ' +
          'triples — the same cost profile as fine-tuning any transformer classifier',
        predict:
          'O(N) transformer forward passes for N candidates, each O(L^2) in the combined query+document length L ' +
          'from self-attention — the reason N is kept to tens or low hundreds, not the full corpus',
      },
      code: [
        'from sentence_transformers import CrossEncoder',
        '',
        'reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")',
        '',
        'query = "What year was the premiere of The Magic Flute?"',
        'candidates = retrieve(query, k=100)              # cheap first-stage retrieval',
        '',
        'pairs = [(query, doc) for doc in candidates]',
        'scores = reranker.predict(pairs)                 # one score per query-doc pair',
        '',
        'reranked = [doc for _, doc in sorted(zip(scores, candidates), reverse=True)]',
        'top_k = reranked[:5]                             # what actually goes to the generator',
      ].join('\n'),
      related: ['sentence-embedding-models', 'hybrid-search-and-bm25', 'retrieval-augmented-generation'],
      references: {
        free: [
          { title: 'Sentence Transformers — Retrieve & Re-Rank', url: 'https://sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html' },
          { title: 'Sentence Transformers — Cross-Encoders', url: 'https://sbert.net/examples/cross_encoder/applications/README.html' },
        ],
        papers: [
          { title: 'Passage Re-ranking with BERT', url: 'https://arxiv.org/abs/1901.04085', year: 2019 },
          { title: 'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks', url: 'https://arxiv.org/abs/1908.10084', year: 2019 },
        ],
        books: [
          {
            title: 'Speech and Language Processing',
            author: 'Jurafsky & Martin',
            chapter: 'Ch. 11 — Information Retrieval and Retrieval-Augmented Generation',
            url: 'https://web.stanford.edu/~jurafsky/slp3/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    {
      id: 'long-context-vs-retrieval',
      name: 'Long Context vs. Retrieval',
      aliases: ['in-context retrieval vs. RAG', 'context-window scaling vs. RAG'],
      tier: 2,
      year: 2023,
      difficulty: 2,
      hook: 'Asks whether to fetch a few relevant passages or hand the model the whole corpus and let attention sort it out.',
      intuition:
        'As context windows grew from thousands to millions of tokens, an obvious question followed: why ' +
        'retrieve anything at all — why not just paste the whole knowledge base into the prompt and let ' +
        'self-attention find what matters? Two things push back. First, cost: attention over a transformer\'s ' +
        'context scales quadratically, so a million-token prompt is far more expensive to process, per query, ' +
        'than embedding one short query and searching an index. Second, and more surprising: even models built ' +
        'for long context do not use all of it evenly. Liu et al. found a U-shaped pattern they called "lost in ' +
        'the middle" — models retrieve facts near the start or end of a long context reliably, but accuracy ' +
        "drops noticeably when the needed fact sits in the middle, even well inside the model's stated context " +
        'limit. In practice the two approaches are not strict rivals: retrieval still improves a long-context ' +
        "model's answers, because it removes the burden of searching a huge prompt for the right needle at all.",
      howItWorks: {
        summary:
          'Compare two ways of getting relevant information in front of the model: retrieve a small set of ' +
          "targeted passages, or rely on a large context window to hold everything and let attention find what's " +
          'needed.',
        steps: [
          'Retrieval path: embed and index the corpus, retrieve the top-k passages per query, and pass only those to the model.',
          "Long-context path: pass a much larger slice of the corpus, or the whole thing, directly in the prompt and let the model attend over it.",
          'Measure both on accuracy as a function of where the needed fact sits in the context, not just average accuracy, since position-dependent performance is where the two approaches diverge most.',
          "Measure both on cost per query: retrieval's index search plus a short generation versus a long-context model's quadratic-cost pass over a much longer prompt.",
        ],
      },
      whenToUse: [
        "The knowledge base is far larger than any practical context window, or than what you want to pay to process per query — retrieval scales to that; pasting everything into context does not",
        'You need to show which specific source supports an answer — retrieval gives you a small, citable set of passages, not "somewhere in a million tokens"',
      ],
      whenNotToUse: [
        "The whole relevant corpus already fits comfortably in the model's context window at acceptable cost, and you would rather not build and maintain a separate retrieval index",
        "The needed information is genuinely spread across the whole document such that no small set of retrieved chunks would contain it, and attending across everything at once matters more than retrieval's precision",
      ],
      facets: {
        task: ['retrieval', 'generation'],
        dataType: ['text'],
        dataSize: ['large', 'massive'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-text',
      },
      related: ['retrieval-augmented-generation', 'long-context-architectures', 'chunking-strategies'],
      references: {
        free: [{ title: 'Pinecone — Retrieval Augmented Generation (RAG)', url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/' }],
        papers: [
          { title: 'Lost in the Middle: How Language Models Use Long Contexts', url: 'https://arxiv.org/abs/2307.03172', year: 2023 },
          { title: 'Retrieval meets Long Context Large Language Models', url: 'https://arxiv.org/abs/2310.03025', year: 2023 },
        ],
      },
    },
  ],
} satisfies Body;
