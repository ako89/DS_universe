/**
 * The advisor's ranking pipeline, split out of ui/advisor.ts purely to keep that file (the modal
 * state machine + DOM building) under PLAN.md §0's 300-line cap — same reason ui/card.ts split
 * off ui/card-sections.ts. See ui/advisor.ts's header for the full 5-step pipeline this
 * implements (steps 1-4; step 5, trimming to the top N, is `recommend`'s last line).
 *
 * Pure — no DOM — so tests/advisor.test.ts can call `recommend()` directly.
 */

import type { DataSize, DataType, Entry, Task } from '../types/content.ts';
import type { SearchIndex } from '../data/search-index.ts';
import { search as runSearch, tokenize } from '../data/search-index.ts';
import { expand } from '../data/lexicon.ts';
import { entryBody } from '../data/registry.ts';

export interface AdvisorResult {
  entry: Entry;
  score: number;
  why: string[]; // human-readable matched facets/terms, for the "why this matched" line
}

// The corpus is small (~200 entries) and re-ranking is cheap, so the candidate pool is generous
// on purpose: a facet-relevant entry with modest lexical overlap (its own prose just doesn't
// happen to reuse the query's exact words) still needs to reach the facet-agreement pass in
// recommend() rather than being cut before it gets the chance.
const CANDIDATE_POOL = 200;
const RESULT_LIMIT = 5;

// PLAN.md §3 frames these three bodies as practice/support regions, not algorithm families: Sol
// is the shared objective every model minimizes (loss functions, MLE, gradient descent), Belt is
// evaluation and validation craft (metrics, cross-validation, class imbalance), Pallas is
// post-hoc interpretability tooling (SHAP, LIME) applied to an already-chosen model. Their
// entries legitimately carry the same task/dataType facets as real models (a metrics entry is
// "for" classification too), which floods a facet-boosted ranking with concepts instead of
// answers to "which algorithm should I use". Excluded from advisor recommendations for that
// reason; still fully present in search and on the map itself.
const NON_MODEL_BODIES: ReadonlySet<string> = new Set(['sol', 'belt', 'pallas']);

const TASK_VALUES: ReadonlySet<Task> = new Set([
  'regression', 'classification', 'clustering', 'dimensionality-reduction', 'anomaly-detection',
  'forecasting', 'generation', 'ranking', 'control', 'representation', 'inference', 'retrieval',
]);
const DATA_TYPE_VALUES: ReadonlySet<DataType> = new Set([
  'tabular', 'text', 'image', 'audio', 'video', 'graph', 'timeseries', 'spatial', 'multimodal',
]);
const DATA_SIZE_VALUES: ReadonlySet<DataSize> = new Set(['tiny', 'small', 'medium', 'large', 'massive']);

// Lexicon expansion tokens that name a facet value or one of the sentinel qualities below feed
// only the facet-agreement boost, not the BM25 text search — every entry sharing that facet
// value already gets identical credit for it there, so also dropping the word itself into the
// query would double-count it and, worse, flood BM25 with ties across every entry that merely
// shares a task/dataType (see this file's header on why the facet boost is kept modest for the
// same reason). A free descriptive word the lexicon expands to instead (e.g. "stakeholder" from
// "explain to my boss") isn't a schema facet, so it stays in the text query, where it only
// rewards the entries whose own prose happens to use it.
const FACET_SENTINELS: ReadonlySet<string> = new Set(['interpretable', 'fast', 'missing', 'categorical']);
function isFacetToken(t: string): boolean {
  return TASK_VALUES.has(t as Task) || DATA_TYPE_VALUES.has(t as DataType) || DATA_SIZE_VALUES.has(t as DataSize) || FACET_SENTINELS.has(t);
}

// Deliberately modest relative to a typical BM25 term score (see data/search-index.ts): with
// ~15-20 entries in most bodies sharing the same task/dataType facets, a large facet boost just
// ties them all together and lets facet membership alone decide the ranking. Kept small enough
// to break ties and rule out off-topic entries without drowning out which entry's own prose
// actually talks about the query's specifics.
const TASK_BOOST = 2;
const DATA_TYPE_BOOST = 1.5;
const DATA_SIZE_BOOST = 1;
const INTERPRETABLE_BOOST = 2;
const CHEAP_BOOST = 1;
const MISSING_BOOST = 1;
const CATEGORICAL_BOOST = 1;

// "50k rows", "2 million examples", "a few hundred records" -> a DataSize hint the query didn't
// spell out as a facet word. Deliberately coarse: it only needs to land in the right bucket.
const ROW_COUNT_RE = /(\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)?\s*(rows?|records?|examples?|samples?|observations?|data ?points?)/i;

function detectDataSize(query: string): DataSize | undefined {
  const m = query.match(ROW_COUNT_RE);
  if (!m?.[1]) return undefined;
  let n = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(n)) return undefined;
  const unit = m[2]?.toLowerCase();
  if (unit === 'k' || unit === 'thousand') n *= 1_000;
  else if (unit === 'm' || unit === 'million') n *= 1_000_000;

  if (n < 1_000) return 'tiny';
  if (n < 50_000) return 'small';
  if (n < 1_000_000) return 'medium';
  if (n < 100_000_000) return 'large';
  return 'massive';
}

/** Compares an entry's own facets against the query's detected signals. Returns a numeric boost
 *  plus a plain-language list of what agreed, which the UI folds into "why this matched". */
function facetAgreement(entry: Entry, signals: ReadonlySet<string>, dataSize: DataSize | undefined): { boost: number; why: string[] } {
  let boost = 0;
  const why: string[] = [];

  for (const task of entry.facets.task) {
    if (signals.has(task)) {
      boost += TASK_BOOST;
      why.push(task);
    }
  }
  for (const dataType of entry.facets.dataType) {
    if (signals.has(dataType)) {
      boost += DATA_TYPE_BOOST;
      why.push(dataType);
    }
  }
  if (dataSize && entry.facets.dataSize.includes(dataSize)) {
    boost += DATA_SIZE_BOOST;
    why.push(`fits ${dataSize} data`);
  }
  // Graded, not a cliff: "medium" still earns half credit. A model with medium interpretability
  // (e.g. a tree ensemble explainable via global feature importance, just not a per-prediction
  // rule) is a reasonable answer to "I need to explain this", just not as strong a one as a
  // genuinely high-interpretability model.
  if (signals.has('interpretable')) {
    if (entry.facets.interpretability === 'high') {
      boost += INTERPRETABLE_BOOST;
      why.push('highly interpretable');
    } else if (entry.facets.interpretability === 'medium') {
      boost += INTERPRETABLE_BOOST / 2;
      why.push('moderately interpretable');
    }
  }
  if (signals.has('fast') && entry.facets.trainingCost === 'low') {
    boost += CHEAP_BOOST;
    why.push('cheap to train');
  }
  if (signals.has('missing') && entry.facets.handlesMissing) {
    boost += MISSING_BOOST;
    why.push('handles missing values');
  }
  if (signals.has('categorical') && entry.facets.handlesCategorical) {
    boost += CATEGORICAL_BOOST;
    why.push('handles categorical features');
  }

  return { boost, why };
}

export function recommend(idx: SearchIndex, query: string, limit = RESULT_LIMIT): AdvisorResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const expansionTerms = expand(trimmed);
  const dataSize = detectDataSize(trimmed);

  const signals = new Set([...tokenize(trimmed), ...expansionTerms].filter(isFacetToken));
  const bm25ExpansionTerms = expansionTerms.filter((t) => !isFacetToken(t));
  const augmentedQuery = [trimmed, ...bm25ExpansionTerms].join(' ');

  const pool = runSearch(idx, augmentedQuery, CANDIDATE_POOL).filter(
    (hit) => !NON_MODEL_BODIES.has(entryBody(hit.entry.id)?.id ?? ''),
  );

  const results = pool.map((hit) => {
    const { boost, why } = facetAgreement(hit.entry, signals, dataSize);
    return { entry: hit.entry, score: hit.score + boost, why };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
