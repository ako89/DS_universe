/**
 * The content schema. Single source of truth for every algorithm entry and its placement.
 * Verbatim from docs/ENGINE_SPEC.md §7 — do not diverge from that spec without updating both.
 *
 * Pulled forward into Phase 1 (ahead of its PLAN.md Phase 2 checkbox) because engine/scene.ts
 * needs the `Body` type to type its SceneBody.data field, and content/system.ts needs `Body`'s
 * shape to describe placement. No entries exist yet — Phase 3 writes those. This file is not
 * "frozen" until PLAN.md Phase 2 says so (after the 3 pressure-test entries); until then treat
 * it as still open to the schema changes Phase 2 is expected to pressure-test.
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
