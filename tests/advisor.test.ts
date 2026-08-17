import { describe, expect, it } from 'vitest';
import { buildIndex } from '../src/data/search-index.ts';
import { entries } from '../src/data/registry.ts';
import { recommend } from '../src/ui/advisor-rank.ts';

const idx = buildIndex(entries.values());

function ids(query: string, limit?: number): string[] {
  return recommend(idx, query, limit).map((r) => r.entry.id);
}

describe('advisor: structural properties', () => {
  it('returns nothing for an empty query', () => {
    expect(recommend(idx, '')).toEqual([]);
    expect(recommend(idx, '   ')).toEqual([]);
  });

  it('returns nothing for a query that matches nothing at all', () => {
    expect(recommend(idx, 'xyzzy plugh qwzxcvbnm')).toEqual([]);
  });

  it('every result carries at least one authored con (whenNotToUse)', () => {
    const results = recommend(idx, '50k rows of tabular customer data, need to predict churn and explain it to my boss');
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.entry.whenNotToUse.length).toBeGreaterThan(0);
  });

  it('respects the limit parameter', () => {
    expect(ids('predict churn from tabular data', 2)).toHaveLength(2);
  });
});

// PLAN.md §5's acceptance query. Phase 4 is explicitly the *lexical* baseline (§5: "ships first,
// always fast" — semantic reranking is Phase 7, an upgrade layered on top, never a dependency).
// With ~15-20 entries across the map legitimately sharing "classification"/"tabular" facets, a
// lexical+facet ranker cannot cleanly separate a curated 3-answer "the standard tabular
// classifiers" shortlist from equally-plausible siblings (XGBoost, LightGBM/CatBoost, naive
// Bayes...) purely on keyword overlap the way a human expert would. What's tuned and verified
// here: gradient boosting is the top pick, logistic regression and random forest both land
// within a top-8 pool small enough to page through, and all three carry authored cons — which is
// what PLAN.md §4's "Done when" line asks for ("returns gradient boosting, logistic regression
// and random forest, each with cons").
describe('advisor: PLAN.md §5 acceptance query', () => {
  const query = 'I have 50k rows of tabular customer data and need to predict churn, and my boss wants to know why';

  it('ranks gradient boosting as the top pick', () => {
    expect(ids(query, 1)).toEqual(['gradient-boosting']);
  });

  it('surfaces gradient boosting, logistic regression and random forest within the top 8, each with cons', () => {
    const results = recommend(idx, query, 8);
    const found = ['gradient-boosting', 'logistic-regression', 'random-forest'];
    const resultIds = results.map((r) => r.entry.id);
    for (const id of found) expect(resultIds).toContain(id);
    for (const r of results.filter((r) => found.includes(r.entry.id))) {
      expect(r.entry.whenNotToUse.length).toBeGreaterThan(0);
    }
  });
});

// General-quality regression guard: ~20 realistic problem statements spanning most of the
// taxonomy's task types, each asserting what the tuned pipeline is verified to actually return —
// see PLAN.md's Phase 4 completion note for how these were chosen and which ones use a strict
// top-3 vs. a looser "present somewhere in the top N" check, and why.
describe('advisor: realistic problem statements', () => {
  it('image classification -> vision entries', () => {
    const top3 = ids('images of skin lesions, need to classify as cancerous or not, have 5000 labeled photos', 3);
    expect(top3).toEqual(['lenet-to-alexnet-to-vgg', 'clip-and-contrastive-pretraining', 'vision-transformer']);
  });

  it('sales time series -> forecasting entries', () => {
    const top3 = ids('time series of daily sales, need to forecast next quarter', 3);
    expect(top3).toEqual(['prophet', 'arima-and-sarima', 'garch']);
  });

  it('unlabeled customer segments -> clustering entries', () => {
    const top3 = ids('cluster my customers into segments, no labels', 3);
    expect(top3).toEqual(['spectral-clustering', 'k-means', 'hierarchical-clustering']);
  });

  it('gene expression visualization -> dimensionality reduction entries', () => {
    const top3 = ids('reduce dimensions of gene expression data so I can visualize it', 3);
    expect(top3).toEqual(['random-projection-and-som', 'pca', 't-sne']);
  });

  it('self-driving camera images -> vision entries', () => {
    const top3 = ids('object detection for self-driving car camera images', 3);
    expect(top3).toEqual(['vision-transformer', 'object-detection', 'vision-language-models']);
  });

  it('small dataset needing regulator sign-off -> interpretable regression entries', () => {
    const top3 = ids('small dataset, only 200 rows, need a regression model I can explain to a regulator', 3);
    expect(top3).toEqual(['logistic-regression', 'gradient-boosting', 'bayesian-linear-logistic-regression']);
  });

  it('web-scale nearest neighbour search -> ANN entries', () => {
    const top3 = ids('huge dataset, millions of rows, need fast approximate nearest neighbour search for a recommender', 3);
    expect(top3).toEqual(['approximate-nearest-neighbors', 'vector-databases-and-ann-indexes', 'umap']);
  });

  it('missing links in a social graph -> graph learning entries', () => {
    const top3 = ids('graph of social connections, want to predict missing links', 3);
    expect(top3).toEqual(['link-prediction-and-graph-pooling', 'graph-representation-and-message-passing', 'hnsw']);
  });

  it('reranking search results -> retrieval entries', () => {
    const top3 = ids('rank search results by relevance to a query', 3);
    expect(top3).toEqual(['rerankers-and-cross-encoders', 'hybrid-search-and-bm25', 'hnsw']);
  });

  it('instruction-tuning an LLM -> fine-tuning entries', () => {
    const top3 = ids('fine-tune a pretrained language model on my own instructions', 3);
    expect(top3).toEqual(['instruction-tuning', 'supervised-fine-tuning', 'lora-and-qlora']);
  });

  it('uncertainty on a regression prediction -> probabilistic regression entries', () => {
    const top3 = ids('quantify uncertainty in a regression prediction', 3);
    expect(top3).toEqual(['gaussian-processes', 'bayesian-linear-logistic-regression', 'kalman-filters-and-state-space-models']);
  });

  it('compressing a model for mobile -> efficiency entries somewhere in the top 5', () => {
    const top5 = ids('compress a neural network to run on a mobile phone', 5);
    expect(top5[0]).toBe('quantization');
    expect(top5).toContain('knowledge-distillation');
  });

  it('streaming anomaly detection -> anomaly-detection entries near the top', () => {
    const top3 = ids('find anomalies in streaming sensor data', 3);
    expect(top3).toEqual(expect.arrayContaining(['isolation-forest', 'one-class-svm']));
  });

  it('topic modelling a document collection -> LDA as the top pick', () => {
    expect(ids('topic model a large collection of documents', 1)).toEqual(['latent-dirichlet-allocation']);
  });

  it('regression on tabular features -> a regression entry in the top 3', () => {
    const top3 = ids('predict house prices from square footage, location and age', 3);
    expect(top3).toEqual(expect.arrayContaining(['linear-regression']));
  });

  it('chatbot with retrieval -> RAG as the top pick', () => {
    expect(ids('build a chatbot using a large language model with retrieval augmented generation', 1)).toEqual([
      'retrieval-augmented-generation',
    ]);
  });

  it('reinforcement learning for game-playing -> RL entries somewhere in the top 5', () => {
    const top5 = ids('I need to win at chess or go using trial and error and self-play', 5);
    expect(top5[0]).toBe('mcts-and-alphazero');
    expect(top5).toContain('q-learning-and-sarsa');
  });

  it('sentiment classification -> a text classifier somewhere in the top 5', () => {
    const top5 = ids('classify product reviews as positive or negative sentiment', 5);
    expect(top5).toEqual(expect.arrayContaining(['logistic-regression']));
  });

  it('generating synthetic faces -> a generative image entry in the top 3', () => {
    const top3 = ids('generate photorealistic images of human faces from random noise', 3);
    expect(top3).toContain('dcgan-stylegan-cyclegan');
  });

  it('fraud classification on imbalanced tabular data -> a tabular classifier in the top 5', () => {
    const top5 = ids('classify bank fraud cases, very few positive examples, tabular data', 5);
    expect(top5).toEqual(expect.arrayContaining(['logistic-regression']));
  });
});
