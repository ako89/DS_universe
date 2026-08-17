/**
 * Query-expansion lexicon for the advisor (docs/ENGINE_SPEC.md §5, Phase 4 step 2): maps the
 * plain-language terms a reader actually types onto the vocabulary the map is written in — task
 * names, data types, data sizes, and a handful of recurring qualities (interpretable, imbalanced,
 * streaming, ...) that show up across many entries' `hook`/`intuition`/`whenToUse` prose.
 *
 * A key may be one word or a short phrase; `expand()` matches whole words/phrases only (so
 * "image" doesn't fire inside "imagine"). Where an expansion token is a real `Task`/`DataType`/
 * `DataSize` value it directly feeds `ui/advisor.ts`'s facet-agreement boost; free descriptive
 * tokens (e.g. "interpretable", "streaming") only feed BM25 by widening the effective query, since
 * the schema has no facet for them. Deliberately over-inclusive and overlapping — a query hitting
 * three keys that all expand to "classification" is fine, `expand()` dedupes the result.
 */

export const LEXICON: Readonly<Record<string, readonly string[]>> = {
  // ---- Task intent: classification ----
  classify: ['classification'],
  classifier: ['classification'],
  classification: ['classification'],
  'predict a category': ['classification'],
  'predict a label': ['classification'],
  'predict yes or no': ['classification', 'binary'],
  'yes or no': ['classification', 'binary'],
  spam: ['classification', 'text', 'imbalanced'],
  fraud: ['classification', 'anomaly-detection', 'imbalanced', 'tabular'],
  churn: ['classification', 'imbalanced', 'tabular', 'interpretable'],
  'will they leave': ['classification', 'imbalanced', 'tabular'],
  'credit scoring': ['classification', 'tabular', 'interpretable'],
  'credit risk': ['classification', 'tabular', 'interpretable'],
  'loan default': ['classification', 'tabular', 'interpretable'],
  sentiment: ['classification', 'text'],
  'sentiment analysis': ['classification', 'text'],
  diagnosis: ['classification', 'tabular', 'interpretable'],
  triage: ['classification', 'tabular'],
  'sort into groups': ['classification'],
  'sort into categories': ['classification'],

  // ---- Task intent: regression ----
  regression: ['regression'],
  'predict a number': ['regression'],
  'predict a price': ['regression', 'tabular'],
  'predict a value': ['regression'],
  pricing: ['regression', 'tabular'],
  'house prices': ['regression', 'tabular'],
  'demand forecasting': ['forecasting', 'regression', 'timeseries'],
  'estimate a quantity': ['regression'],

  // ---- Task intent: clustering / segmentation ----
  cluster: ['clustering'],
  clustering: ['clustering'],
  'group similar': ['clustering'],
  'group similar items': ['clustering'],
  segment: ['clustering'],
  segmentation: ['clustering'],
  'customer segmentation': ['clustering', 'tabular'],
  'find groups': ['clustering'],
  'find natural groups': ['clustering'],
  'unlabeled data': ['clustering'],
  'unlabelled data': ['clustering'],
  'no labels': ['clustering'],

  // ---- Task intent: anomaly / outlier detection ----
  anomaly: ['anomaly-detection'],
  'anomaly detection': ['anomaly-detection'],
  outlier: ['anomaly-detection'],
  outliers: ['anomaly-detection'],
  'detect outliers': ['anomaly-detection'],
  'rare events': ['anomaly-detection', 'imbalanced'],
  'unusual behavior': ['anomaly-detection'],
  'unusual behaviour': ['anomaly-detection'],
  'network intrusion': ['anomaly-detection', 'tabular'],
  'defect detection': ['anomaly-detection', 'image'],

  // ---- Task intent: forecasting / time series ----
  forecast: ['forecasting', 'timeseries'],
  forecasting: ['forecasting', 'timeseries'],
  'time series': ['forecasting', 'timeseries'],
  'time-series': ['forecasting', 'timeseries'],
  seasonality: ['forecasting', 'timeseries'],
  'sales forecast': ['forecasting', 'timeseries', 'tabular'],
  'stock price': ['forecasting', 'timeseries'],
  'sensor data': ['timeseries'],
  streaming: ['timeseries', 'streaming'],
  'real-time data': ['timeseries', 'streaming'],
  'sequential data': ['timeseries'],

  // ---- Task intent: dimensionality reduction / representation ----
  'reduce dimensions': ['dimensionality-reduction'],
  'dimensionality reduction': ['dimensionality-reduction'],
  'too many features': ['dimensionality-reduction'],
  'high dimensional': ['dimensionality-reduction', 'high-dimensional'],
  'high-dimensional': ['dimensionality-reduction', 'high-dimensional'],
  visualize: ['dimensionality-reduction'],
  visualise: ['dimensionality-reduction'],
  'visualize high dimensional data': ['dimensionality-reduction'],
  embeddings: ['representation'],
  embedding: ['representation'],
  'feature learning': ['representation'],

  // ---- Task intent: generation ----
  generate: ['generation'],
  'generate images': ['generation', 'image'],
  'generate text': ['generation', 'text'],
  'generate music': ['generation', 'audio'],
  synthesize: ['generation'],
  synthesise: ['generation'],
  'synthetic data': ['generation'],
  chatbot: ['generation', 'text'],
  'write like': ['generation', 'text'],
  'image generation': ['generation', 'image'],
  'text-to-image': ['generation', 'image', 'text', 'multimodal'],

  // ---- Task intent: ranking / retrieval / recommendation ----
  rank: ['ranking'],
  ranking: ['ranking'],
  recommend: ['ranking', 'retrieval'],
  recommendation: ['ranking', 'retrieval'],
  recommender: ['ranking', 'retrieval'],
  'search engine': ['retrieval'],
  'find similar documents': ['retrieval', 'text'],
  'find similar items': ['retrieval'],
  'nearest neighbours': ['retrieval'],
  'nearest neighbors': ['retrieval'],
  'semantic search': ['retrieval', 'text'],

  // ---- Task intent: control / RL ----
  'reinforcement learning': ['control'],
  'game playing': ['control'],
  robotics: ['control'],
  'sequential decisions': ['control'],
  'trial and error': ['control'],

  // ---- Task intent: inference / probabilistic ----
  uncertainty: ['inference'],
  'need uncertainty': ['inference'],
  'confidence interval': ['inference'],
  'probabilistic model': ['inference'],
  bayesian: ['inference'],

  // ---- Data type: text / NLP ----
  nlp: ['text'],
  'natural language': ['text'],
  text: ['text'],
  documents: ['text'],
  reviews: ['text'],
  emails: ['text'],
  tweets: ['text'],
  translation: ['text', 'generation'],
  summarization: ['text', 'generation'],
  summarisation: ['text', 'generation'],

  // ---- Data type: vision ----
  images: ['image', 'vision'],
  image: ['image', 'vision'],
  photos: ['image', 'vision'],
  pictures: ['image', 'vision'],
  'computer vision': ['image', 'vision'],
  'object detection': ['image', 'vision'],
  'face recognition': ['image', 'vision'],
  'medical imaging': ['image', 'vision'],
  xrays: ['image', 'vision'],
  'x-rays': ['image', 'vision'],
  video: ['video'],
  videos: ['video'],

  // ---- Data type: audio ----
  audio: ['audio'],
  speech: ['audio'],
  'speech recognition': ['audio', 'text'],
  music: ['audio'],
  sound: ['audio'],

  // ---- Data type: graph ----
  graph: ['graph'],
  network: ['graph'],
  'social network': ['graph'],
  'social graph': ['graph'],
  relationships: ['graph'],
  'knowledge graph': ['graph'],

  // ---- Data type: tabular ----
  tabular: ['tabular'],
  spreadsheet: ['tabular'],
  'customer data': ['tabular'],
  'rows and columns': ['tabular'],
  csv: ['tabular'],
  database: ['tabular'],

  // ---- Data type: spatial / multimodal ----
  spatial: ['spatial'],
  geographic: ['spatial'],
  gis: ['spatial'],
  multimodal: ['multimodal'],
  'text and images': ['multimodal', 'text', 'image'],

  // ---- Data scale ----
  'small dataset': ['small'],
  'few examples': ['tiny', 'small'],
  'a handful of rows': ['tiny'],
  'few hundred rows': ['tiny', 'small'],
  'few thousand rows': ['small'],
  'tens of thousands of rows': ['medium'],
  'hundreds of thousands of rows': ['large'],
  'millions of rows': ['large', 'massive'],
  'billions of rows': ['massive'],
  'big data': ['large', 'massive'],
  'web scale': ['massive'],
  'web-scale': ['massive'],

  // ---- Interpretability / trust ----
  interpretable: ['interpretable'],
  interpretability: ['interpretable'],
  explainable: ['interpretable'],
  'explain to my boss': ['interpretable'],
  'explain to a regulator': ['interpretable'],
  'explain to a non-technical stakeholder': ['interpretable'],
  'explain the model': ['interpretable'],
  'why did it predict that': ['interpretable'],
  'black box': ['interpretability'],
  regulator: ['interpretable'],
  regulated: ['interpretable'],
  auditable: ['interpretable'],
  transparent: ['interpretable'],
  trustworthy: ['interpretable'],
  fairness: ['interpretable'],
  bias: ['interpretable'],

  // ---- Data quality / practical constraints ----
  'missing data': ['missing'],
  'missing values': ['missing'],
  incomplete: ['missing'],
  categorical: ['categorical'],
  'categorical features': ['categorical'],
  'mixed data types': ['categorical', 'tabular'],
  'imbalanced classes': ['imbalanced'],
  imbalanced: ['imbalanced'],
  'rare positive class': ['imbalanced'],
  noisy: ['noisy'],
  'noisy labels': ['noisy'],
  sparse: ['sparse'],
  'high cardinality': ['categorical'],
  'need to scale': ['scaling'],
  unscaled: ['scaling'],

  // ---- Compute / latency constraints ----
  'real-time': ['latency', 'fast'],
  'low latency': ['latency', 'fast'],
  'limited compute': ['cheap', 'fast'],
  'edge device': ['cheap', 'fast'],
  mobile: ['cheap', 'fast'],
  'on device': ['cheap', 'fast'],
  gpu: ['deep-learning'],
  'no gpu': ['cheap', 'fast'],

  // ---- Modern / LLM stack ----
  llm: ['language-model', 'generation', 'text'],
  'large language model': ['language-model', 'generation', 'text'],
  'language model': ['language-model', 'generation', 'text'],
  gpt: ['language-model', 'text'],
  rag: ['retrieval', 'retrieval-augmented-generation', 'text'],
  'retrieval augmented generation': ['retrieval', 'retrieval-augmented-generation', 'text'],
  'vector database': ['retrieval'],
  'vector search': ['retrieval'],
  'fine-tune': ['fine-tuning'],
  'fine tune': ['fine-tuning'],
  'fine-tuning': ['fine-tuning'],
  finetuning: ['fine-tuning'],
  prompt: ['language-model'],
  prompting: ['language-model'],
  hallucination: ['language-model', 'grounding'],
  hallucinating: ['language-model', 'grounding'],
  jailbreak: ['language-model', 'safety'],
  agent: ['agent', 'tool-use'],
  agents: ['agent', 'tool-use'],
  'ai agent': ['agent', 'tool-use'],
  'tool use': ['agent', 'tool-use'],
  'function calling': ['agent', 'tool-use'],
  chatbots: ['generation', 'text', 'language-model'],
  'few-shot': ['few-shot'],
  'zero-shot': ['few-shot'],
  'in-context learning': ['few-shot', 'language-model'],

  // ---- Broad "just tell me what to use" phrasing ----
  'what algorithm should i use': [],
  'what model should i use': [],
  baseline: ['fast', 'cheap'],
  'quick baseline': ['fast', 'cheap'],
  'starting point': ['fast', 'cheap'],
} as const;

const LEXICON_ENTRIES: readonly (readonly [string, readonly string[]])[] = Object.entries(LEXICON);

/** Matches lexicon keys against `query` on whole word/phrase boundaries (so "image" does not
 *  fire inside "imagine") and returns the deduplicated union of their expansion tokens. */
export function expand(query: string): string[] {
  const normalized = ` ${query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
  const tokens = new Set<string>();

  for (const [key, values] of LEXICON_ENTRIES) {
    if (normalized.includes(` ${key} `)) {
      for (const value of values) tokens.add(value);
    }
  }

  return [...tokens];
}
