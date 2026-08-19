/**
 * The content schema. Single source of truth for every algorithm entry and its placement.
 * Verbatim from docs/ENGINE_SPEC.md §7 — do not diverge from that spec without updating both.
 *
 * FROZEN as of PLAN.md Phase 2, pressure-tested against three real entries spanning a simple
 * closed-form method (linear-regression), a mid-complexity construction (dbscan) and a modern
 * building block attached to a star rather than a planet (self-attention) — see
 * src/content/bodies/{mercury,jupiter,nova}.ts. No field changes were needed; every entry fit
 * the schema as specified. Any change after this point needs the user's sign-off first (PLAN.md
 * §0 rule "the schema doesn't fit an entry you're writing → ask before extending it").
 *
 * One gap surfaced, deliberately left unfixed here: ENGINE_SPEC §4.0's card header wants a
 * "supervised/unsupervised" chip, and `Facets.task` doesn't map onto that binary for every task
 * value (representation, generation, retrieval, ranking, control, inference are genuinely
 * ambiguous). Adding a field per PLAN.md §0 rule 14 would mean *asserting* it for every future
 * entry, including ones where it's not a clean yes/no — a worse failure mode than a UI that
 * derives the chip only when it's unambiguous and omits it otherwise. See src/ui/card-sections.ts.
 */

export type Task =
  | 'regression'
  | 'classification'
  | 'clustering'
  | 'dimensionality-reduction'
  | 'anomaly-detection'
  | 'forecasting'
  | 'generation'
  | 'ranking'
  | 'control'
  | 'representation'
  | 'inference'
  | 'retrieval';

export type DataType =
  | 'tabular'
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'graph'
  | 'timeseries'
  | 'spatial'
  | 'multimodal';

export type DataSize = 'tiny' | 'small' | 'medium' | 'large' | 'massive';

export type Level = 'low' | 'medium' | 'high';

export interface Facets {
  task: Task[];
  dataType: DataType[];
  dataSize: DataSize[];
  interpretability: Level;
  trainingCost: Level;
  needsScaling: boolean;
  handlesMissing: boolean;
  handlesCategorical: boolean;
  outputType: string;
}

export interface Ref {
  title: string;
  url: string;
}

export interface BookRef {
  title: string;
  author: string;
  chapter?: string;
  url?: string;
}

export interface Entry {
  id: string; // kebab-case, globally unique
  name: string;
  aliases?: string[];
  tier: 1 | 2;
  year: number;
  // Currently unrendered in the UI: no document in this repo defines what a value means, and
  // showing an unexplained number was found to be worse than showing nothing (docs/UX_PASS_PLAN.md
  // Task 3d). Kept on the schema and in every entry's authored data — the field is frozen (see
  // this file's header) and the values are real judgements a future rubric could resurface.
  difficulty: 1 | 2 | 3 | 4 | 5;
  hook: string; // ONE sentence, <=120 chars, shown on hover
  intuition: string; // plain language, no notation
  howItWorks: { summary: string; steps: string[] };
  hyperparameters?: { name: string; what: string; tuning: string }[];
  whenToUse: string[]; // <- advisor source of truth
  whenNotToUse: string[]; // <- advisor source of truth
  facets: Facets;
  math?: { latex: string[]; notes?: string };
  complexity?: { train: string; predict: string };
  code?: string;
  related: string[]; // ids; must resolve
  references: {
    free?: Ref[];
    papers?: (Ref & { year: number })[];
    books?: BookRef[];
    video?: Ref[];
  };
}

export interface Body {
  id: string;
  name: string;
  segment: string;
  hook: string;
  summary: string;
  eraRange: [number, number];
  moons: Entry[];
}
