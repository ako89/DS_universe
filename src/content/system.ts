/**
 * Scene placement: where every body sits, how big it renders, which star lights it. Separate
 * from pedagogy — see docs/ENGINE_SPEC.md §7. `name` and `segment` are transcribed directly
 * from PLAN.md §3 (the taxonomy) so render/labels.ts has real display text without depending on
 * Phase 3 content; nothing here is invented pedagogical fact (no year, no claim, no citation).
 *
 * Pulled forward into Phase 1 (ahead of its nominal Phase 2 slot) because engine/scene.ts needs
 * it to build the scene. See engine/scene.ts's file comment for how this deliberately decouples
 * from src/types/content.ts's `Body`/`Entry` schema, which still has zero real content until
 * Phase 3.
 *
 * `litBy` doubles as "orbits" — the body's orbitRadius/theta are measured from that star's `at`.
 * Sol-side bodies keep increasing orbitRadius out past the Sol/Nova midpoint (the "transit");
 * Nova-side bodies orbit Nova directly. This is a Phase 1 placement judgment call, not specified
 * numerically in PLAN.md/ENGINE_SPEC beyond the two anchor values given in ENGINE_SPEC §7
 * (mercury: 320, belt: 1180), which are kept as given.
 *
 * `moonCount` is the real moon count published in PLAN.md §3 for that body — used only to
 * generate placeholder sub-orbit geometry (dots, no names/content) so scene.ts's "moon
 * sub-orbits" capability is demonstrable before Phase 3 content exists.
 */

export interface StarPlacement {
  id: string;
  name: string;
  at: readonly [number, number];
  hue: number;
  radius: number;
  moonCount: number;
}

export interface BodyPlacement {
  id: string;
  name: string;
  segment: string;
  orbitRadius: number;
  phase: number; // 0..1, fraction of a full turn
  radius: number;
  hue: number;
  litBy: 'sol' | 'nova';
  type: 'planet' | 'belt';
  moonCount: number;
  rockCount?: number; // belt only
}

export const system = {
  stars: [
    { id: 'sol', name: 'Sol', at: [0, 0], hue: 42, radius: 46, moonCount: 6 },
    { id: 'nova', name: 'Nova', at: [4200, 0], hue: 194, radius: 38, moonCount: 6 },
  ],
  bodies: [
    // --- Sol system, inner (amber -> rust) ---
    { id: 'mercury', name: 'Mercury', segment: 'Linear & Probabilistic Foundations',
      orbitRadius: 320, phase: 0.15, radius: 16, hue: 40, litBy: 'sol', type: 'planet',
      moonCount: 9 },
    { id: 'venus', name: 'Venus', segment: 'Similarity & Instance-Based',
      orbitRadius: 480, phase: 0.62, radius: 15, hue: 33, litBy: 'sol', type: 'planet',
      moonCount: 6 },
    { id: 'terra', name: 'Terra', segment: 'Trees & Rules',
      orbitRadius: 620, phase: 0.34, radius: 15, hue: 25, litBy: 'sol', type: 'planet',
      moonCount: 5 },
    { id: 'mars', name: 'Mars', segment: 'Ensembles',
      orbitRadius: 780, phase: 0.83, radius: 14, hue: 18, litBy: 'sol', type: 'planet',
      moonCount: 8 },

    // --- The Belt / Pallas (craft, slate) ---
    { id: 'belt', name: 'The Belt', segment: 'Evaluation, Validation & the Craft',
      orbitRadius: 1180, phase: 0, radius: 0, hue: 210, litBy: 'sol', type: 'belt',
      moonCount: 8, rockCount: 240 },
    { id: 'pallas', name: 'Pallas', segment: 'Interpretability & Trust',
      orbitRadius: 1320, phase: 0.47, radius: 12, hue: 210, litBy: 'sol', type: 'planet',
      moonCount: 6 },

    // --- Sol system, mid (teal -> green) ---
    { id: 'jupiter', name: 'Jupiter', segment: 'Clustering, Density & Anomaly',
      orbitRadius: 1500, phase: 0.09, radius: 30, hue: 174, litBy: 'sol', type: 'planet',
      moonCount: 10 },
    { id: 'saturn', name: 'Saturn', segment: 'Dimensionality Reduction & Representation',
      orbitRadius: 1680, phase: 0.71, radius: 26, hue: 167, litBy: 'sol', type: 'planet',
      moonCount: 9 },
    { id: 'uranus', name: 'Uranus', segment: 'Kernels, Margins & Gaussian Processes',
      orbitRadius: 1840, phase: 0.28, radius: 20, hue: 160, litBy: 'sol', type: 'planet',
      moonCount: 6 },
    { id: 'neptune', name: 'Neptune', segment: 'Bayesian Inference & Graphical Models',
      orbitRadius: 1990, phase: 0.55, radius: 19, hue: 153, litBy: 'sol', type: 'planet',
      moonCount: 8 },
    { id: 'chronos', name: 'Chronos', segment: 'Time Series & Forecasting',
      orbitRadius: 2050, phase: 0.91, radius: 17, hue: 146, litBy: 'sol', type: 'planet',
      moonCount: 8 },

    // --- The transit (violet -> magenta); Echo onward renders lit by Nova ---
    { id: 'prometheus', name: 'Prometheus', segment: 'Neural Network Foundations',
      orbitRadius: 2280, phase: 0.4, radius: 18, hue: 254, litBy: 'sol', type: 'planet',
      moonCount: 9 },
    { id: 'vulcan', name: 'Vulcan', segment: 'Convolutional Networks & Vision',
      orbitRadius: 2520, phase: 0.18, radius: 19, hue: 265, litBy: 'sol', type: 'planet',
      moonCount: 8 },
    { id: 'echo', name: 'Echo', segment: 'Recurrent Networks & Sequences',
      orbitRadius: 2780, phase: 0.66, radius: 16, hue: 276, litBy: 'nova', type: 'planet',
      moonCount: 6 },
    { id: 'chimera', name: 'Chimera', segment: 'Generative Models',
      orbitRadius: 3050, phase: 0.02, radius: 18, hue: 288, litBy: 'nova', type: 'planet',
      moonCount: 8 },
    { id: 'arachne', name: 'Arachne', segment: 'Graph Learning',
      orbitRadius: 3330, phase: 0.5, radius: 15, hue: 299, litBy: 'nova', type: 'planet',
      moonCount: 6 },
    { id: 'odyssey', name: 'Odyssey', segment: 'Reinforcement Learning',
      orbitRadius: 3620, phase: 0.79, radius: 17, hue: 310, litBy: 'nova', type: 'planet',
      moonCount: 10 },

    // --- Nova system (cyan -> white-blue) ---
    { id: 'babel', name: 'Babel', segment: 'Tokenization & Embeddings',
      orbitRadius: 260, phase: 0.12, radius: 14, hue: 194, litBy: 'nova', type: 'planet',
      moonCount: 6 },
    { id: 'genesis', name: 'Genesis', segment: 'Pretraining & Model Families',
      orbitRadius: 420, phase: 0.6, radius: 22, hue: 195, litBy: 'nova', type: 'planet',
      moonCount: 8 },
    { id: 'forge', name: 'Forge', segment: 'Fine-tuning & Alignment',
      orbitRadius: 580, phase: 0.37, radius: 15, hue: 196, litBy: 'nova', type: 'planet',
      moonCount: 7 },
    { id: 'velocity', name: 'Velocity', segment: 'Inference & Efficiency',
      orbitRadius: 740, phase: 0.85, radius: 14, hue: 196, litBy: 'nova', type: 'planet',
      moonCount: 7 },
    { id: 'athenaeum', name: 'Athenaeum', segment: 'Retrieval, Memory & RAG',
      orbitRadius: 900, phase: 0.23, radius: 15, hue: 197, litBy: 'nova', type: 'planet',
      moonCount: 6 },
    { id: 'daedalus', name: 'Daedalus', segment: 'Agents & Tool Use',
      orbitRadius: 1060, phase: 0.68, radius: 14, hue: 198, litBy: 'nova', type: 'planet',
      moonCount: 6 },
    { id: 'iris', name: 'Iris', segment: 'Multimodal',
      orbitRadius: 1220, phase: 0.05, radius: 13, hue: 199, litBy: 'nova', type: 'planet',
      moonCount: 5 },
    { id: 'aegis', name: 'Aegis', segment: 'Evaluation, Safety & Interpretability',
      orbitRadius: 1380, phase: 0.44, radius: 16, hue: 200, litBy: 'nova', type: 'planet',
      moonCount: 8 },
  ],
} as const satisfies { stars: StarPlacement[]; bodies: BodyPlacement[] };
