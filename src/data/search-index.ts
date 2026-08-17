/**
 * Lexical search core: BM25 over a per-entry text document plus a fuzzy name/alias matcher, per
 * docs/ENGINE_SPEC.md §9's module contract. Two independent signals are summed into one score —
 * BM25 rewards a query that overlaps an entry's prose (hook/intuition/whenToUse) and facets;
 * the name matcher rewards a query that is, or nearly is, the thing's actual name, which BM25
 * alone under-weights once `name` is diluted into a much longer document. `ui/search.ts` calls
 * this directly; `ui/advisor.ts` expands the query via `data/lexicon.ts` first, then calls this,
 * then re-ranks the results by facet agreement — this module knows nothing about either.
 */

import type { Entry, Facets } from '../types/content.ts';

export interface SearchHit {
  entry: Entry;
  score: number;
  matched: string[]; // terms/names that contributed to the score, for a "why this matched" line
}

interface IndexedDoc {
  entry: Entry;
  terms: Map<string, number>;
  length: number;
  nameTerms: Set<string>;
}

export interface SearchIndex {
  docs: IndexedDoc[];
  df: Map<string, number>;
  avgLength: number;
  n: number;
}

// BM25's standard constants: k1 controls term-frequency saturation, b controls how much a long
// document is penalized relative to the average.
const K1 = 1.5;
const B = 0.75;

const NAME_MATCH_WEIGHT = 6;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'into',
  'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'was', 'were',
  'which', 'with', 'you', 'your',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Turns facets into words so BM25 can match a query against them the same way it matches prose
 *  — e.g. a query containing "tabular" or "clustering" hits an entry via its own facet values,
 *  not just its written text. Kept deliberately simple; ui/advisor.ts's facet-agreement boost
 *  reads `entry.facets` directly rather than through this text projection. */
function facetTerms(facets: Facets): string[] {
  const terms = [...facets.task, ...facets.dataType, ...facets.dataSize, facets.outputType];
  if (facets.interpretability === 'high') terms.push('interpretable', 'explainable');
  if (facets.trainingCost === 'low') terms.push('cheap', 'fast');
  if (facets.needsScaling) terms.push('scaling');
  if (facets.handlesMissing) terms.push('missing');
  if (facets.handlesCategorical) terms.push('categorical');
  return terms;
}

function docText(entry: Entry): string {
  return [entry.name, ...(entry.aliases ?? []), entry.hook, entry.intuition, ...entry.whenToUse, ...facetTerms(entry.facets)].join(' ');
}

export function buildIndex(entries: Iterable<Entry>): SearchIndex {
  const docs: IndexedDoc[] = [];
  const df = new Map<string, number>();
  let totalLength = 0;

  for (const entry of entries) {
    const tokens = tokenize(docText(entry));
    const terms = new Map<string, number>();
    for (const t of tokens) terms.set(t, (terms.get(t) ?? 0) + 1);
    for (const t of terms.keys()) df.set(t, (df.get(t) ?? 0) + 1);

    const nameTerms = new Set(tokenize([entry.name, ...(entry.aliases ?? [])].join(' ')));

    docs.push({ entry, terms, length: tokens.length, nameTerms });
    totalLength += tokens.length;
  }

  return { docs, df, avgLength: docs.length > 0 ? totalLength / docs.length : 0, n: docs.length };
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((curr[j - 1] ?? Infinity) + 1, (prev[j] ?? Infinity) + 1, (prev[j - 1] ?? Infinity) + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? Math.max(m, n);
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

/** Rewards a query that is close to an entry's actual name or alias, at the whole-string level
 *  (typo tolerance for the search palette) and the per-token level (partial credit for a
 *  multi-word query that only shares some words, e.g. "gradient boost" against "XGBoost"'s alias
 *  "extreme gradient boosting"). */
function nameMatchScore(query: string, queryTerms: string[], doc: IndexedDoc): { score: number; matched: string[] } {
  const q = query.trim().toLowerCase();
  const names = [doc.entry.name, ...(doc.entry.aliases ?? [])];
  let whole = 0;
  const matched: string[] = [];

  for (const name of names) {
    const n = name.toLowerCase();
    if (q.length >= 2 && (n === q || n.startsWith(q))) {
      whole = Math.max(whole, 12);
      matched.push(name);
      continue;
    }
    const sim = similarity(q, n);
    if (sim > 0.6) {
      whole = Math.max(whole, sim * 8);
      matched.push(name);
    }
  }

  let tokenBonus = 0;
  for (const qt of queryTerms) {
    if (doc.nameTerms.has(qt)) {
      tokenBonus += 2;
      continue;
    }
    for (const nt of doc.nameTerms) {
      if (Math.min(qt.length, nt.length) >= 4 && levenshtein(qt, nt) <= 1) {
        tokenBonus += 1.2;
        break;
      }
    }
  }

  return { score: (whole + tokenBonus) * NAME_MATCH_WEIGHT, matched };
}

export function search(idx: SearchIndex, query: string, limit = 8): SearchHit[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0 && query.trim().length === 0) return [];

  const uniqueTerms = [...new Set(queryTerms)];
  const hits: SearchHit[] = [];

  for (const doc of idx.docs) {
    let bm25 = 0;
    const matchedTerms: string[] = [];

    for (const term of uniqueTerms) {
      const df = idx.df.get(term) ?? 0;
      const tf = doc.terms.get(term) ?? 0;
      if (df === 0 || tf === 0) continue;
      matchedTerms.push(term);
      const idf = Math.log((idx.n - df + 0.5) / (df + 0.5) + 1);
      bm25 += (idf * (tf * (K1 + 1))) / (tf + K1 * (1 - B + (B * doc.length) / (idx.avgLength || 1)));
    }

    const name = nameMatchScore(query, queryTerms, doc);
    const score = bm25 + name.score;
    if (score > 0) {
      hits.push({ entry: doc.entry, score, matched: [...new Set([...name.matched, ...matchedTerms])] });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
