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
// Standard web-search BM25 tunings assume documents whose length mostly reflects how much filler
// surrounds the same amount of signal. Here every entry is deliberately well-written prose of
// genuinely different lengths (a two-sentence Tier 2 stub vs. a full Tier 1 intuition paragraph
// plus 4-5 whenToUse items) — the standard b=0.75 length penalty was found, empirically, to
// bury longer Tier 1 entries under much shorter ones that happened to repeat the query's terms
// in a smaller space. A low b keeps some length normalization without that effect dominating.
const B = 0.15;

// The advisor feeds this the same tokenizer with full free-text problem statements ("I have 50k
// rows and need to predict X..."), so alongside plain grammatical stopwords this also drops the
// generic verbs/fillers a problem description is full of but that carry no topical signal
// ("need", "want", "get", "know") — left in, they nudge every entry's BM25 score up by roughly
// the same tiny amount and mostly just add noise to which entries separate from the pack.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'into',
  'is', 'it', 'its', 'my', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'was', 'were',
  'which', 'with', 'you', 'your',
  'am', 'can', 'could', 'do', 'does', 'get', 'got', 'had', 'here', 'how', 'i', 'just', 'know',
  'like', 'need', 'now', 'really', 'should', 'so', 'some', 'there', 'want', 'wants', 'what',
  'when', 'where', 'will', 'would',
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

const WHOLE_NAME_WEIGHT = 10;
const TOKEN_COVERAGE_WEIGHT = 40;

/** True for an exact word, and for the light stemming variants a name/alias and a query commonly
 *  differ by ("boost" vs "boosting", "cluster" vs "clustering") — a prefix relationship or a
 *  1-edit typo, gated to words long enough that either check stays meaningful. */
function tokensRoughlyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = Math.min(a.length, b.length);
  const longer = Math.max(a.length, b.length);
  if (shorter < 4) return false;
  // A prefix relationship is a real stemming signal ("boost" -> "boosting", ratio 0.63) but not
  // when the shorter word is only a small fraction of the longer one ("gene" -> "generation",
  // ratio 0.4, found empirically as a false match for a query about gene expression data hitting
  // "Retrieval-Augmented Generation") — those are two unrelated words that happen to share a
  // prefix, not one word stemmed from the other.
  if ((a.startsWith(b) || b.startsWith(a)) && shorter / longer >= 0.55) return true;
  // A single substitution/insertion/deletion is a meaningful typo signal on a longer word, but on
  // a short one it is a large fraction of the word — found empirically as a false match between
  // "boss" and the unrelated acronym "GOSS" (LightGBM's alias), both 4 letters, 1 edit apart.
  return shorter >= 6 && levenshtein(a, b) <= 1;
}

/** Rewards a query that is close to an entry's actual name or alias: at the whole-string level
 *  (typo tolerance for the search palette, e.g. "DBSCN" -> DBSCAN) and at the token level (a
 *  multi-word query that only shares some words with a name, e.g. "gradient boost" against
 *  XGBoost's alias "extreme gradient boosting").
 *
 *  The token bonus is a *coverage product* — (matched query tokens / query tokens) times
 *  (matched name tokens / name tokens) — rather than a flat per-match bonus. A flat bonus made a
 *  long free-text advisor query (dozens of tokens) score as high as a real name lookup the moment
 *  any single word coincided with an unrelated entry's alias (e.g. "classification" inside
 *  k-Nearest Neighbors' alias "nearest neighbour classification"). The product only gets large
 *  when the match covers a meaningful fraction of *both* sides, which a short palette query
 *  against a short name naturally does and a long problem description brushing one alias word
 *  naturally doesn't. */
function nameMatchScore(query: string, queryTerms: string[], doc: IndexedDoc): { score: number; matched: string[] } {
  const q = query.trim().toLowerCase();
  const names = [doc.entry.name, ...(doc.entry.aliases ?? [])];
  let whole = 0;
  const matched: string[] = [];

  for (const name of names) {
    const n = name.toLowerCase();
    if (q.length >= 2 && (n === q || n.startsWith(q))) {
      whole = Math.max(whole, 1.2);
      matched.push(name);
      continue;
    }
    const sim = similarity(q, n);
    if (sim > 0.6) {
      whole = Math.max(whole, sim);
      matched.push(name);
    }
  }

  const uniqueQueryTerms = [...new Set(queryTerms)];
  const matchedNameTerms = new Set<string>();
  let matchedQueryCount = 0;

  for (const qt of uniqueQueryTerms) {
    if (doc.nameTerms.has(qt)) {
      matchedQueryCount += 1;
      matchedNameTerms.add(qt);
      matched.push(qt);
      continue;
    }
    for (const nt of doc.nameTerms) {
      if (tokensRoughlyMatch(qt, nt)) {
        matchedQueryCount += 1;
        matchedNameTerms.add(nt);
        matched.push(qt);
        break;
      }
    }
  }

  const queryCoverage = uniqueQueryTerms.length > 0 ? matchedQueryCount / uniqueQueryTerms.length : 0;
  const nameCoverage = doc.nameTerms.size > 0 ? matchedNameTerms.size / doc.nameTerms.size : 0;

  return { score: whole * WHOLE_NAME_WEIGHT + queryCoverage * nameCoverage * TOKEN_COVERAGE_WEIGHT, matched };
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
