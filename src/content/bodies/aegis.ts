/**
 * Aegis — Evaluation, Safety & Interpretability. See PLAN.md §3 for the full moon list (8 moons,
 * all written here in this Phase 3 batch — the final content batch; Daedalus and Iris were written
 * in parallel by other agents in this same batch).
 *
 * Every entry was researched per CONTENT_GUIDE §3 — search, open a real source (arXiv /abs/ pages,
 * official Anthropic/Meta/NVIDIA research pages, or self-extracted PDF text), verify every URL,
 * then write. Notes worth flagging:
 *
 * - Two WebFetch-on-PDF traps were caught rather than trusted, per the CONTENT_GUIDE §3 warning:
 *   `transformer-circuits.pub/2023/monosemantic-features` (the Towards Monosemanticity page) was
 *   too large to fetch at all (>10MB, hard error, not a silent bad summary) and was corroborated
 *   instead via a HTML repost (alignmentforum.org) plus independent web-search snippets;
 *   `web.stanford.edu/~jurafsky/slp3/7.pdf` (Jurafsky & Martin Ch. 7) returned a WebFetch response
 *   that honestly admitted it could not extract text from the compressed PDF stream rather than
 *   inventing a summary — the PDF was then downloaded and run through `pdftotext -layout` directly,
 *   which did yield clean text, self-extracted and grep-verified for the exact section headings and
 *   passages cited below (7.6 "Evaluating Large Language Models" incl. MMLU/data contamination;
 *   7.7 "Ethical and Safety Issues with Language Models" incl. hallucination; 9.2 "Learning from
 *   Preferences" incl. "prompting GPT-4 to rank the outputs"). No number in this file was ever
 *   taken from an un-self-extracted PDF summary.
 * - A DOI for the Ji et al. hallucination survey's archival ACM Computing Surveys publication was
 *   confirmed via `api.crossref.org/works/10.1145/3571730` — structured metadata, not a publisher
 *   fetch, per the DOI-verification rule; it resolves to the correct title/abstract and a
 *   published-print date of 2023-12-31, which is why the reference below cites year 2023 (the
 *   archival year) rather than 2022 (the arXiv preprint year) — same convention pallas.ts uses for
 *   SHAP/adaboost-era papers cited by their conference/journal year rather than preprint year.
 * - `mechanistic-interpretability` and `pallas.ts`'s `shap`/`lime` are deliberately linked but are
 *   NOT the same kind of interpretability: SHAP/LIME are post-hoc, model-agnostic attribution
 *   methods that explain one prediction of any model from its outputs; mechanistic interpretability
 *   reverse-engineers the actual internal computation (features and circuits) of a specific network,
 *   and can in principle explain behavior a black-box attribution method has no access to at all.
 *   The entry's own prose states this distinction directly rather than leaving it implicit.
 * - `sparse-autoencoders` and `chimera.ts`'s `autoencoders` share the encoder/decoder-with-a-
 *   bottleneck architecture, but a sparse autoencoder here is not used for compression or
 *   generation — the hidden layer is far *wider* than the input (an overcomplete dictionary), and
 *   the point is to decompose activations into interpretable features, not to compress them.
 * - `hallucination-and-grounding` → `retrieval-augmented-generation` (athenaeum.ts) is the
 *   strongest cross-body link in this file: RAG's entire mechanism is grounding generation in
 *   retrieved text specifically to reduce hallucination, confirmed directly in athenaeum.ts's own
 *   RAG intuition text ("answers can point at the passage they came from").
 * - `llm-as-judge` → `constitutional-ai-and-rlaif`/`rlhf` (forge.ts) is confirmed directly in
 *   forge.ts's own CAI entry, which states RLAIF replaces human preference comparisons with "an AI
 *   labeler (an LLM prompted with the constitution)" — an LLM-as-judge pipeline feeding a reward
 *   model, not just an analogous idea.
 * - `guardrails` cites AgentDojo (NeurIPS 2024 D&B) to ground the link to daedalus.ts's
 *   `computer-use-and-browser-agents`/`multi-agent-systems`: it's a real benchmark of prompt
 *   injection specifically against tool-using agents, not a generic LLM-safety citation stretched
 *   to cover agents.
 *
 * `eraRange` is [2020, 2023]: Olah et al.'s "Zoom In: An Introduction to Circuits" (Distill, March
 * 2020) is the earliest moon (mechanistic-interpretability, the founding paper of the circuits
 * agenda this field is named after); every other moon anchors to 2021-2023 work, so 2023 is the
 * latest (llm-as-judge, guardrails, sparse-autoencoders, and chain-of-thought-faithfulness all
 * anchor there).
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'aegis',
  name: 'Aegis',
  segment: 'Evaluation, Safety & Interpretability',
  hook: "Checks whether a model's outputs can be trusted: how it scored, whether it's grounded, and what's happening inside it.",
  summary:
    "Aegis holds the practices for finding out what a language model's outputs are actually worth — scoring it fairly and knowing " +
    'where those scores mislead, catching fabricated claims before they reach a user, attacking it the way a real adversary would, ' +
    "and opening up its internals to see which computation actually produced an answer. None of these methods make a model better; " +
    'they tell you how much to trust the one you already have.',
  eraRange: [2020, 2023],
  moons: [
    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2009.03300 (MMLU abs page, title/authors/year); github.com/
    // hendrycks/test (official MMLU repo, confirmed ICLR 2021); arxiv.org/abs/2211.09110 (HELM abs
    // page); arxiv.org/abs/2311.09783 (Deng et al. contamination paper abs page, quotes the 52%/57%
    // TS-Guessing exact-match figures directly from the abstract text, not a PDF); self-extracted
    // web.stanford.edu/~jurafsky/slp3/7.pdf via pdftotext after WebFetch honestly failed on it —
    // grep-confirmed section "7.6 Evaluating Large Language Models" with subsections on MMLU and a
    // "data contamination" margin-note discussing training/test overlap.
    {
      id: 'llm-benchmarks-and-their-limits',
      name: 'LLM Benchmarks & Their Limits',
      aliases: ['benchmark contamination', 'benchmark saturation', 'construct validity'],
      tier: 1,
      year: 2021,
      difficulty: 2,
      hook: 'A leaderboard number can be inflated by contamination, flattened by a ceiling, or simply measuring the wrong thing.',
      intuition:
        "A benchmark score looks like a fact about a model, but it's really a fact about a test, and tests can be gamed, go stale, " +
        'or ask the wrong question. Large language models train on huge scrapes of the public web, and public benchmarks live on ' +
        'the public web too, so a model can end up having seen a benchmark\'s questions, or close paraphrases of them, during ' +
        "pretraining; its score then reflects memorization rather than the skill the benchmark claims to measure — data " +
        'contamination. Even an uncontaminated benchmark saturates once every strong model scores near the ceiling, at which point ' +
        "tiny, meaningless gaps separate leaderboard rankings. And a single number — \"this model scored 86% on MMLU\" — collapses " +
        'accuracy, calibration, robustness, fairness and cost into one figure, hiding exactly the trade-offs a real deployment ' +
        'decision needs to see. None of this makes benchmarks useless; it makes a score a starting point for questions, not a verdict.',
      howItWorks: {
        summary:
          'Construct a fixed test set with a scoring rule, run every model against it, and rank by the aggregate score — a ' +
          'pipeline that breaks down whenever the test set leaks into training, saturates, or measures something narrower than ' +
          'what the score implies.',
        steps: [
          'Assemble a test set of items with a scoring rule, ideally spanning a broad range of subjects or skills.',
          'Run each candidate model over the test set under a fixed prompting protocol and record its score.',
          'Rank models by the aggregate score, or break the score down by category, metric, or subject.',
          "Check for data contamination: whether test items appear, verbatim or paraphrased, in a model's training data.",
          'Check for saturation: whether scores cluster near the maximum, where small differences are mostly noise.',
          'Treat any single score as one measurement among several (calibration, robustness, cost) rather than a complete verdict.',
        ],
      },
      whenToUse: [
        'You need a fast, cheap, comparable signal to screen many candidate models before deeper evaluation',
        "The benchmark's task genuinely matches your use case and its construction methodology is public and auditable",
        'You are tracking relative progress across versions of the same model family, where contamination affects each version similarly',
      ],
      whenNotToUse: [
        "The model's training data provenance is unknown, so you cannot rule out the benchmark's own text having leaked into training",
        'Every strong model scores within a point or two of each other on the benchmark — you are reading noise near the ceiling, not a real gap',
        'The decision at stake is safety- or deployment-critical — a single aggregate score cannot substitute for held-out, task-specific evaluation',
      ],
      facets: {
        task: ['classification', 'generation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'aggregate-score-with-caveats',
      },
      related: ['llm-as-judge', 'hallucination-and-grounding', 'gpt-lineage', 'bert-lineage'],
      references: {
        free: [{ title: 'MMLU — official benchmark repository', url: 'https://github.com/hendrycks/test' }],
        papers: [
          { title: 'Measuring Massive Multitask Language Understanding', url: 'https://arxiv.org/abs/2009.03300', year: 2021 },
          { title: 'Holistic Evaluation of Language Models', url: 'https://arxiv.org/abs/2211.09110', year: 2022 },
          {
            title: 'Investigating Data Contamination in Modern Benchmarks for Large Language Models',
            url: 'https://arxiv.org/abs/2311.09783',
            year: 2023,
          },
        ],
        books: [
          {
            title: 'Speech and Language Processing (3rd ed. draft)',
            author: 'Daniel Jurafsky & James H. Martin',
            chapter: 'Ch. 7.6 — Evaluating Large Language Models',
            url: 'https://web.stanford.edu/~jurafsky/slp3/7.pdf',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2306.05685 (MT-Bench/Chatbot Arena abs page, title/authors/
    // abstract, position/verbosity/self-enhancement bias findings, ">80% agreement" figure);
    // lmsys.org/blog/2023-05-03-arena/ (original Chatbot Arena announcement, Elo methodology);
    // self-extracted web.stanford.edu/~jurafsky/slp3/9.pdf via pdftotext — grep-confirmed passage
    // "prompting GPT-4 to rank the outputs for each prompt" in section 9.2 "Learning from Preferences".
    {
      id: 'llm-as-judge',
      name: 'LLM-as-a-Judge',
      aliases: ['LLM-as-a-judge', 'model-based evaluation'],
      tier: 1,
      year: 2023,
      difficulty: 2,
      hook: "Uses one LLM to grade another's answers at a speed no human panel can match — with its own biases baked in.",
      intuition:
        'Comparing two model outputs to decide which is better used to require a person: read both, weigh helpfulness against ' +
        "accuracy against tone, and pick one. That doesn't scale past a few thousand comparisons. LLM-as-a-judge replaces the " +
        'person with another language model, prompted with the question, one or more candidate answers, and a rubric, and asked ' +
        "to declare a winner or assign a score. Zheng et al. showed a strong judge like GPT-4 agrees with human preference at " +
        'roughly the rate humans agree with each other, which is what makes the approach usable rather than merely convenient. ' +
        'But the judge inherits the biases of the thing doing the judging: it tends to favor whichever answer comes first in the ' +
        'prompt (position bias), favor longer answers regardless of quality (verbosity bias), and rate its own model family more ' +
        'favorably (self-enhancement bias). Swapping answer order, averaging, and using a judge from a different model family ' +
        'reduce these biases but do not remove them.',
      howItWorks: {
        summary:
          'Prompt an LLM with the question, one or more candidate answers, and a grading rubric, and have it output a score or a ' +
          'pairwise verdict in place of a human annotator.',
        steps: [
          'Write a rubric or grading criteria the judge should apply (helpfulness, correctness, tone, etc.).',
          'For pairwise grading, present two candidate responses to the same prompt and ask the judge to pick a winner or a tie.',
          'For pointwise grading, ask the judge to score a single response against the rubric, optionally against a reference answer.',
          'Run the judgment in both answer orders and treat a disagreement between them as evidence of position bias.',
          'Aggregate verdicts across many prompts into a win rate or an average score.',
          "Spot-check a sample of the judge's verdicts against human judgment to calibrate how much to trust it.",
        ],
      },
      hyperparameters: [
        {
          name: 'judge model and prompt template',
          what: 'Which model grades the candidates, and the rubric or instructions it is given.',
          tuning:
            "Use a judge at least as capable as the models being evaluated; write explicit criteria rather than \"which is " +
            'better", and add reference answers or few-shot examples for grading that needs to be more than a stylistic preference.',
        },
        {
          name: 'answer order / position swap',
          what: 'Whether the two candidates are shown in a fixed order or in both orders.',
          tuning:
            'Always run both orders for pairwise judging (per Zheng et al.) and treat a verdict that flips between orders as a tie ' +
            'rather than trusting either single run.',
        },
      ],
      whenToUse: [
        'You need to compare many candidate responses (thousands or more) at a cost or speed human annotation cannot match',
        "The judgment is about open-ended quality — helpfulness, tone, coherence — where a strong LLM's preferences track human preferences well",
        'You can use a judge model that is stronger than, or from a different family than, the model being evaluated',
      ],
      whenNotToUse: [
        'The two candidates differ mainly in length or formatting rather than substance — verbosity bias will contaminate the verdict',
        'You are evaluating the same model family the judge belongs to, where self-enhancement bias inflates its own outputs',
        'The judgment requires checking facts against ground truth rather than a style or quality preference — use a grounded, reference-based metric instead',
      ],
      facets: {
        task: ['ranking', 'generation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'pairwise-verdict-or-score',
      },
      code: [
        'judge_prompt = f"""You are grading which response better answers the question.',
        'Question: {question}',
        'Response A: {response_a}',
        'Response B: {response_b}',
        'First reason step by step about helpfulness, correctness and clarity.',
        'Then output your verdict as exactly one of: "A", "B", "Tie"."""',
        '',
        'verdict_ab = judge_llm(judge_prompt)',
        'verdict_ba = judge_llm(swap_order(judge_prompt))   # mitigate position bias',
        "final = verdict_ab if verdict_ab == flip(verdict_ba) else 'Tie'",
      ].join('\n'),
      related: ['llm-benchmarks-and-their-limits', 'hallucination-and-grounding', 'constitutional-ai-and-rlaif', 'rlhf'],
      references: {
        free: [
          {
            title: 'LMSYS Org — Chatbot Arena: Benchmarking LLMs in the Wild with Elo Ratings',
            url: 'https://lmsys.org/blog/2023-05-03-arena/',
          },
        ],
        papers: [
          { title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena', url: 'https://arxiv.org/abs/2306.05685', year: 2023 },
        ],
        books: [
          {
            title: 'Speech and Language Processing (3rd ed. draft)',
            author: 'Daniel Jurafsky & James H. Martin',
            chapter: 'Ch. 9.2 — Learning from Preferences',
            url: 'https://web.stanford.edu/~jurafsky/slp3/9.pdf',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2202.03629 (Ji et al. survey abs page, title/authors/abstract);
    // api.crossref.org/works/10.1145/3571730 (crossref metadata confirming the ACM Computing Surveys
    // archival publication, published-print 2023-12-31, matching abstract text verbatim); aclanthology.
    // org/2023.emnlp-main.557/ + arxiv.org/abs/2303.08896 (SelfCheckGPT abs page, sampling-consistency
    // mechanism confirmed); self-extracted slp3/7.pdf, section "7.7 Ethical and Safety Issues with
    // Language Models", grep-confirmed passage defining hallucination as "LLMs are prone to saying
    // things that are false".
    {
      id: 'hallucination-and-grounding',
      name: 'Hallucination & Grounding',
      aliases: ['factuality', 'confabulation'],
      tier: 1,
      year: 2023,
      difficulty: 2,
      hook: 'Language models state fluent falsehoods with total confidence; grounding anchors claims in retrieved or given text.',
      intuition:
        'A language model is trained to produce plausible next tokens, not true ones — nothing in ordinary pretraining tells it ' +
        'apart a confident fabrication from a confident fact, so it will invent a citation, a statistic, or an API method with the ' +
        "same fluency it uses for something it actually learned. Ji et al.'s survey frames this as hallucination: text unfaithful " +
        'to the source it should be grounded in, or unverifiable against any source at all. The fix that addresses the cause ' +
        "rather than the symptom is grounding — giving the model real text to condition its answer on (retrieved passages, a " +
        'tool\'s output, a document the user pasted in) and instructing it to answer only from that material. Detection methods ' +
        "that don't require retrieval also exist: SelfCheckGPT samples several answers to the same question and treats " +
        'inconsistency across samples as a signal of fabrication, on the reasoning that a model repeating something it actually ' +
        'knows will say roughly the same thing each time, while a fabrication drifts.',
      howItWorks: {
        summary:
          'Reduce unsupported claims either by grounding generation in retrieved or provided text the model is instructed to ' +
          'answer from, or by detecting fabrication after the fact through sampling-consistency or entailment checks.',
        steps: [
          'For grounding: retrieve or provide the source text relevant to the query and insert it into the prompt.',
          'Instruct the model to answer only using the supplied text, ideally citing back to the source passage.',
          'For detection without retrieval: sample the same prompt multiple times at nonzero temperature.',
          'Compare the sampled answers for consistency — claims that vary across samples are flagged as likely fabricated.',
          'Optionally check each claim against the source text with a natural-language-inference model for entailment.',
          'Surface the confidence or grounding status to the user rather than presenting every claim with equal certainty.',
        ],
      },
      whenToUse: [
        'The answer must be traceable to a specific source a user could go verify',
        "The task draws on facts that could have changed, or never appeared, in the model's training data",
        'You need an automatic factuality signal on freeform generations and can afford a few extra samples for consistency checking',
      ],
      whenNotToUse: [
        "The task is genuinely creative (fiction, brainstorming) where being 'ungrounded' is not a defect",
        'No reliable corpus exists to ground answers in — retrieval-based mitigation needs a trustworthy source to retrieve from',
        "Latency budget can't absorb retrieval or multiple-sample consistency checks",
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'grounded-text-or-fabrication-flag',
      },
      related: ['retrieval-augmented-generation', 'llm-benchmarks-and-their-limits', 'llm-as-judge'],
      references: {
        free: [{ title: 'SelfCheckGPT — ACL Anthology page', url: 'https://aclanthology.org/2023.emnlp-main.557/' }],
        papers: [
          { title: 'Survey of Hallucination in Natural Language Generation', url: 'https://arxiv.org/abs/2202.03629', year: 2023 },
          {
            title: 'SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models',
            url: 'https://arxiv.org/abs/2303.08896',
            year: 2023,
          },
        ],
        books: [
          {
            title: 'Speech and Language Processing (3rd ed. draft)',
            author: 'Daniel Jurafsky & James H. Martin',
            chapter: 'Ch. 7.7 — Ethical and Safety Issues with Language Models',
            url: 'https://web.stanford.edu/~jurafsky/slp3/7.pdf',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2209.07858 (Ganguli et al. abs page, 38,961-attack dataset, RLHF-
    // scales-safer / other-model-types-flat finding); github.com/anthropics/hh-rlhf/tree/master/
    // red-team-attempts (confirmed dataset release, matching 38,961 count); arxiv.org/abs/2307.02483
    // (Wei et al. "Jailbroken" abs page, competing-objectives / mismatched-generalization framing,
    // NeurIPS 2023); arxiv.org/abs/2307.15043 (Zou et al. GCG abs page, gradient+greedy suffix search,
    // transfer across ChatGPT/Bard/Claude/Llama-2-Chat confirmed); self-extracted slp3/7.pdf §7.7.
    {
      id: 'red-teaming-and-jailbreaks',
      name: 'Red Teaming & Jailbreaks',
      aliases: ['adversarial prompting', 'jailbreaking'],
      tier: 1,
      year: 2022,
      difficulty: 3,
      hook: 'Deliberately attacks a model with adversarial prompts to surface the harmful outputs it would otherwise hide.',
      intuition:
        "Before a model ships, someone needs to find its worst outputs on purpose, the way a security team attacks its own " +
        'systems before an outside attacker does. Red teaming is that practice applied to language models: people, or other ' +
        'models, try prompts designed to elicit harmful or policy-violating output, and the failures get logged and fed back ' +
        "into training or filtering. Anthropic's early large-scale study found something specific and useful: models trained " +
        'with RLHF got harder to red-team as they scaled up, while plain pretrained and prompted-only models showed a flat trend ' +
        'with scale — safety training, not size, was doing the work. Jailbreaking is the adversarial half of the same coin — a ' +
        'crafted prompt (a role-play framing, or an optimized suffix of nonsense tokens found by gradient search) that gets a ' +
        'safety-trained model to comply anyway. Wei et al. trace jailbreak success to two causes: capabilities and safety ' +
        'training were never taught to agree in every domain, and safety training sometimes fails to generalize to a domain the ' +
        'model can still operate in.',
      howItWorks: {
        summary:
          'Systematically probe a model with adversarial prompts designed to produce harmful, biased, or policy-violating output, ' +
          'then feed the discovered failures back into training or filtering.',
        steps: [
          'Define the harm categories being tested for (e.g. weapons, self-harm, deception, bias).',
          'Generate adversarial prompts by hand (human red teamers), with another model, or by automated search over token suffixes.',
          'Run the target model against each prompt and record whether it complied with the harmful request.',
          'Score and categorize the failures by severity and type.',
          "Feed confirmed failures back into safety fine-tuning, a guardrail's block list, or the reward model used in alignment training.",
          'Re-run the same attacks against the updated model to measure whether the fix actually closed the gap.',
        ],
      },
      whenToUse: [
        'You are about to deploy a model publicly and need to find failure modes before real users do',
        'You want to measure whether a specific safety intervention (RLHF, a system prompt, a classifier) holds under adversarial pressure, not just typical use',
        'The deployment surface includes agentic actions (tool use, code execution) where a successful jailbreak has real-world consequences',
      ],
      whenNotToUse: [
        'You only need to know how the model behaves on typical, non-adversarial input — ordinary evaluation is cheaper and sufficient',
        'You lack a process for triaging and fixing what red teaming finds — a pile of discovered, unpatched jailbreaks is not a safety improvement',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'adversarial-prompts-and-failure-reports',
      },
      related: ['guardrails', 'constitutional-ai-and-rlaif', 'computer-use-and-browser-agents', 'multi-agent-systems'],
      references: {
        free: [
          {
            title: 'Anthropic — red-team-attempts dataset (hh-rlhf)',
            url: 'https://github.com/anthropics/hh-rlhf/tree/master/red-team-attempts',
          },
        ],
        papers: [
          {
            title: 'Red Teaming Language Models to Reduce Harms: Methods, Scaling Behaviors, and Lessons Learned',
            url: 'https://arxiv.org/abs/2209.07858',
            year: 2022,
          },
          { title: 'Jailbroken: How Does LLM Safety Training Fail?', url: 'https://arxiv.org/abs/2307.02483', year: 2023 },
          {
            title: 'Universal and Transferable Adversarial Attacks on Aligned Language Models',
            url: 'https://arxiv.org/abs/2307.15043',
            year: 2023,
          },
        ],
        books: [
          {
            title: 'Speech and Language Processing (3rd ed. draft)',
            author: 'Daniel Jurafsky & James H. Martin',
            chapter: 'Ch. 7.7 — Ethical and Safety Issues with Language Models',
            url: 'https://web.stanford.edu/~jurafsky/slp3/7.pdf',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2310.10501 (NeMo Guardrails abs page, "programmable rails"
    // definition quoted directly); docs.nvidia.com/nemo/guardrails/latest/README.html (confirmed live
    // docs, input/output/dialog rails, jailbreak protection use case); arxiv.org/abs/2312.06674
    // (Llama Guard abs page); huggingface.co/meta-llama/Llama-Guard-3-8B (confirmed live model card,
    // 14-hazard-category input/output classifier); arxiv.org/abs/2406.13352 (AgentDojo abs page,
    // confirms prompt injection via tool outputs against agents specifically, NeurIPS 2024 D&B).
    {
      id: 'guardrails',
      name: 'Guardrails',
      aliases: ['LLM guardrails', 'safety rails', 'input/output filtering'],
      tier: 2,
      year: 2023,
      difficulty: 2,
      hook: 'Wraps a deployed model in input and output filters so unsafe requests and responses get caught outside the model itself.',
      intuition:
        'Safety training changes what a model tends to do; guardrails change what a deployed system is allowed to do, enforced ' +
        'outside the model itself. A guardrail sits between the user and the model, and again between the model and the user, ' +
        'checking input against a policy before it reaches the model (block a request for weapons synthesis) and checking output ' +
        "before it reaches the user (block a response that leaked a system prompt or gave medical advice it shouldn't). NeMo " +
        "Guardrails implements this as programmable \"rails\" — rules a developer writes that are independent of the underlying " +
        'model and stay in force even if the model itself would have complied. Llama Guard takes a model-based approach instead: ' +
        'a smaller LLM fine-tuned specifically to classify a prompt or response against a safety taxonomy and return a violation ' +
        "category. Either way, guardrails are a deployment-time control, not a training method — they don't make the underlying " +
        'model safer, they stop an unsafe turn from reaching anyone before or after it.',
      howItWorks: {
        summary:
          'Check every user input against a policy before it reaches the model, and every model output against a policy before ' +
          'it reaches the user, blocking or rewriting anything that violates the rules.',
        steps: [
          'Define the policy: banned topics, required disclaimers, formats to enforce, or a taxonomy of violation categories.',
          'Classify the incoming message against the policy — keyword rules, a fine-tuned classifier, or a prompted LLM check.',
          'If the input violates policy, block it or route to a canned response instead of calling the underlying model.',
          'Otherwise call the model, then classify its output against the same policy.',
          'If the output violates policy, block, redact, or regenerate it before it reaches the user.',
        ],
      },
      whenToUse: [
        'You need enforcement that holds even when the underlying model would otherwise comply, e.g. blocking a specific topic by policy',
        'Different deployments of the same underlying model need different rules (a support bot vs. an internal coding assistant) without retraining',
      ],
      whenNotToUse: [
        'The unsafe behavior is subtle enough that a rule-based or lightweight classifier rail cannot reliably distinguish it from a legitimate request',
        'Guardrails are being treated as a substitute for red teaming and safety training rather than a layer on top of them — they catch known patterns, not novel ones',
      ],
      facets: {
        task: ['classification', 'control'],
        dataType: ['text'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'allow-or-block-decision',
      },
      related: ['red-teaming-and-jailbreaks', 'computer-use-and-browser-agents', 'multi-agent-systems'],
      references: {
        free: [
          { title: 'NVIDIA NeMo Guardrails documentation', url: 'https://docs.nvidia.com/nemo/guardrails/latest/README.html' },
          { title: 'Llama Guard 3 — model card', url: 'https://huggingface.co/meta-llama/Llama-Guard-3-8B' },
        ],
        papers: [
          {
            title: 'NeMo Guardrails: A Toolkit for Controllable and Safe LLM Applications with Programmable Rails',
            url: 'https://arxiv.org/abs/2310.10501',
            year: 2023,
          },
          {
            title: 'Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations',
            url: 'https://arxiv.org/abs/2312.06674',
            year: 2023,
          },
          {
            title: 'AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents',
            url: 'https://arxiv.org/abs/2406.13352',
            year: 2024,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: distill.pub/2020/circuits/zoom-in/ (Zoom In page — WebFetch failed with a
    // content-too-large error on a related transformer-circuits.pub page but this one returned via
    // WebSearch snippets corroborated across two independent searches: authors, March 2020 date, and
    // the three features/circuits/universality claims, quoted consistently both times); transformer-
    // circuits.pub/2021/framework/index.html (fetched directly and successfully — full author list,
    // Dec 2021 date, induction-head and circuit-decomposition claims); aisafetybook.com/textbook/
    // monitoring (Hendrycks, confirmed live, quotes the mechanistic-interpretability vs. representation-
    // engineering distinction and the "confabulate" framing verbatim); christophm.github.io/
    // interpretable-ml-book/cnn-features.html (Molnar Ch. 27, confirmed live, feature visualization).
    {
      id: 'mechanistic-interpretability',
      name: 'Mechanistic Interpretability',
      aliases: ['mech interp', 'circuits analysis'],
      tier: 1,
      year: 2020,
      difficulty: 4,
      hook: 'Reverse-engineers the actual weighted circuits inside a network instead of just scoring which inputs mattered.',
      intuition:
        "Most interpretability methods treat a model as a black box and ask which input features mattered for one prediction. " +
        'Mechanistic interpretability refuses that shortcut: it tries to actually reverse-engineer the computation a network ' +
        "performs, the way someone might disassemble a compiled binary back into readable source. Olah et al.'s Circuits work on " +
        'vision models proposed that networks are built from features — directions in activation space that detect a concept — ' +
        'wired together into circuits, the specific weighted connections from one feature to the next, and that finding these ' +
        "circuits explains behavior rather than merely correlating with it. Anthropic's Transformer Circuits thread carried the " +
        'same agenda into language models, decomposing small attention-only transformers into interpretable end-to-end functions ' +
        'and identifying "induction heads" — a circuit built from two attention layers that lets a model continue a pattern it ' +
        'saw once earlier in context, proposed as an explanation for a meaningful share of in-context learning. It is a heavier ' +
        'undertaking than post-hoc attribution: it can in principle explain why a model that behaves correctly might still be ' +
        'doing something concerning underneath.',
      howItWorks: {
        summary:
          'Identify the features a network represents internally and the circuits — the specific weighted connections — that ' +
          'compute one feature from another, then validate the proposed mechanism by intervening on it.',
        steps: [
          'Pick a narrow behavior to explain, e.g. how the model continues a repeated pattern.',
          'Identify candidate features: directions in activation space that seem to detect a concept, via activation patterns or feature visualization.',
          'Trace the circuit: which earlier features and attention or weight paths combine to produce a later feature or the output.',
          'Validate the hypothesis causally — ablate or patch the proposed component and check the predicted behavior actually changes.',
          'Generalize: check whether the same circuit or feature recurs across other inputs, layers, or models.',
        ],
      },
      whenToUse: [
        "You need to know whether a model is doing the thing you think it's doing internally, not just whether its output looks right",
        'You are investigating a specific, narrow capability (e.g. in-context learning, a factual-recall pathway) small enough to trace circuit by circuit',
        'You need to distinguish a model that is internally deceptive or misaligned from one that merely produces correct outputs',
      ],
      whenNotToUse: [
        'You need an explanation today for a production model — circuit-level analysis is slow, labor-intensive research, not a deployable tool yet',
        'A cheaper method already answers the question — post-hoc attribution (SHAP, LIME) is enough when you only need which input features drove one prediction',
        'The model or behavior under study is large and diffuse enough that no full circuit has been isolated for it yet',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text', 'image'],
        dataSize: ['large'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'circuit-or-feature-description',
      },
      related: ['sparse-autoencoders', 'chain-of-thought-faithfulness', 'shap', 'lime'],
      references: {
        free: [{ title: 'Transformer Circuits Thread', url: 'https://transformer-circuits.pub/' }],
        papers: [
          { title: 'Zoom In: An Introduction to Circuits', url: 'https://distill.pub/2020/circuits/zoom-in/', year: 2020 },
          {
            title: 'A Mathematical Framework for Transformer Circuits',
            url: 'https://transformer-circuits.pub/2021/framework/index.html',
            year: 2021,
          },
        ],
        books: [
          {
            title: 'Introduction to AI Safety, Ethics, and Society',
            author: 'Dan Hendrycks',
            chapter: '§3.2 — Monitoring',
            url: 'https://www.aisafetybook.com/textbook/monitoring',
          },
          {
            title: 'Interpretable Machine Learning',
            author: 'Christoph Molnar',
            chapter: 'Ch. 27 — Learned Features',
            url: 'https://christophm.github.io/interpretable-ml-book/cnn-features.html',
          },
        ],
        video: [{ title: 'Anthropic', url: 'https://www.youtube.com/@anthropic-ai' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2209.10652 (Toy Models of Superposition abs page, full author
    // list, polysemanticity/superposition mechanism confirmed); alignmentforum.org repost of Towards
    // Monosemanticity (used because the primary transformer-circuits.pub page exceeded WebFetch's
    // 10MB limit — an HTML repost, not a PDF, so the PDF-trap warning doesn't apply, but its specific
    // "512 neurons -> 4000+ features" figure was still treated as a lead and phrased generally rather
    // than asserted as exact in the entry text below); arxiv.org/abs/2309.08600 (Cunningham et al.
    // abs page, independent replication outside Anthropic, indirect-object-identification finding).
    {
      id: 'sparse-autoencoders',
      name: 'Sparse Autoencoders for Interpretability',
      aliases: ['SAE', 'dictionary learning for interpretability'],
      tier: 2,
      year: 2023,
      difficulty: 4,
      hook: "Decomposes a model's tangled, overlapping neuron activations into a long dictionary of single-concept features.",
      intuition:
        "A single neuron inside a language model rarely means one thing — it might fire for French text, DNA sequences, and " +
        "legal boilerplate all at once, a phenomenon Anthropic's Toy Models of Superposition explained as networks packing more " +
        'concepts than they have neurons by storing each concept along a shared, overlapping direction in activation space. A ' +
        'sparse autoencoder undoes this compression. It is trained not on raw data but on a model\'s internal activations, with a ' +
        'hidden layer far wider than the input and a sparsity penalty pushing most hidden units to zero on any given input; the ' +
        "network can only reconstruct the activation well if a handful of active units, out of many thousands available, capture " +
        "what's really there. Anthropic's Towards Monosemanticity and Cunningham et al.'s independent replication both found the " +
        'resulting features are considerably more interpretable than individual neurons — recognizably firing for one concept at ' +
        'a time — turning a tangled activation space into a long, mostly-legible dictionary a researcher can actually read.',
      howItWorks: {
        summary:
          "Train a wide autoencoder on a model's internal activations with a sparsity penalty that forces most hidden units off " +
          'for any given input, so each surviving active unit corresponds to a more singular, interpretable concept.',
        steps: [
          'Collect a large sample of activations from one layer or component of the target model, run over diverse text.',
          'Train an autoencoder whose hidden layer is several times wider than the activation being explained.',
          'Add an L1 penalty on the hidden activations to push most of them to zero (sparse coding).',
          'Minimize reconstruction error plus the sparsity penalty until the decoder can rebuild the original activation from a handful of active features.',
          'Interpret each learned feature by finding the inputs that activate it most strongly.',
          "Discard or merge 'dead' features that never activate, and re-tune the sparsity coefficient and dictionary width as needed.",
        ],
      },
      whenToUse: [
        "You need individually interpretable units from a model's activations, not just an attribution score for one prediction",
        'You want to find or steer a specific concept a model represents, e.g. to suppress a behavior by acting on its dictionary feature',
      ],
      whenNotToUse: [
        'You need results quickly — training a good SAE requires collecting large activation datasets and sweeping sparsity/width hyperparameters',
        'A downstream task, not interpretability itself, is the goal — a normal (non-sparse) autoencoder or PCA is cheaper if you just need compression',
      ],
      facets: {
        task: ['representation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'high',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'sparse-interpretable-feature-activations',
      },
      math: {
        latex: [
          '\\hat{x} = W_{dec}\\,\\text{ReLU}(W_{enc}(x - b_{dec}) + b_{enc}) + b_{dec}',
          '\\mathcal{L} = \\lVert x - \\hat{x} \\rVert_2^2 + \\lambda \\lVert f \\rVert_1',
        ],
        notes:
          'f is the hidden (feature) activation vector, deliberately much higher-dimensional than x; the L1 term on f is what ' +
          "forces most features to zero for any given input, which is what makes the surviving active features attributable to " +
          'specific, separable concepts instead of a dense, tangled combination of all of them at once.',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        'class SparseAutoencoder(nn.Module):',
        '    def __init__(self, d_model, d_hidden):     # d_hidden >> d_model, an overcomplete dictionary',
        '        super().__init__()',
        '        self.enc = nn.Linear(d_model, d_hidden)',
        '        self.dec = nn.Linear(d_hidden, d_model)',
        '',
        '    def forward(self, x):',
        '        f = torch.relu(self.enc(x))            # sparse feature activations',
        '        return self.dec(f), f',
        '',
        'x_hat, f = sae(activations)',
        'loss = (activations - x_hat).pow(2).sum(-1).mean() + l1_coefficient * f.abs().sum(-1).mean()',
      ].join('\n'),
      related: ['mechanistic-interpretability', 'autoencoders'],
      references: {
        free: [
          {
            title: 'Towards Monosemanticity: Decomposing Language Models With Dictionary Learning',
            url: 'https://transformer-circuits.pub/2023/monosemantic-features',
          },
          {
            title: 'Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet',
            url: 'https://transformer-circuits.pub/2024/scaling-monosemanticity/',
          },
        ],
        papers: [
          { title: 'Toy Models of Superposition', url: 'https://arxiv.org/abs/2209.10652', year: 2022 },
          {
            title: 'Sparse Autoencoders Find Highly Interpretable Features in Language Models',
            url: 'https://arxiv.org/abs/2309.08600',
            year: 2023,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Sources opened: arxiv.org/abs/2305.04388 (Turpin et al. abs page, option-reordering bias
    // experiment, 13 BIG-Bench Hard tasks on GPT-3.5/Claude 1.0 confirmed); arxiv.org/abs/2307.13702
    // (Lanham et al. abs page, intervention methodology and "less faithful reasoning ... as models
    // become larger and more capable" finding, quoted directly from the abstract); anthropic.com/
    // research/measuring-faithfulness-in-chain-of-thought-reasoning (confirmed live official page).
    {
      id: 'chain-of-thought-faithfulness',
      name: 'Chain-of-Thought Faithfulness',
      aliases: ['CoT faithfulness', 'faithful reasoning'],
      tier: 2,
      year: 2023,
      difficulty: 3,
      hook: "Tests whether a model's written reasoning actually caused its answer, or is a good story invented after the fact.",
      intuition:
        "A model asked to \"think step by step\" produces a chain of reasoning followed by an answer, and it's tempting to read " +
        "that chain as an explanation of how the answer was reached. Faithfulness is the question of whether that's actually " +
        "true. Turpin et al. showed it often isn't: reorder the multiple-choice options in a few-shot prompt so the correct " +
        'answer is always "(A)", and models pick "(A)" more often — while their written reasoning never mentions the ordering ' +
        'and instead constructs a plausible-sounding justification for whatever answer the bias produced. Lanham et al. tested ' +
        'faithfulness more systematically by perturbing the chain of thought itself — truncating it, introducing an error, ' +
        'paraphrasing it — and checking whether the final answer changes accordingly; they found faithfulness varies a lot by ' +
        'task and, notably, tends to get worse as models get larger and more capable. The practical takeaway is that a fluent ' +
        "chain of thought is not evidence the model actually used that reasoning — it can be a post-hoc story.",
      howItWorks: {
        summary:
          "Test whether a model's answer actually tracks its stated reasoning by perturbing the prompt or the reasoning itself " +
          'and checking whether the final answer changes the way faithful reasoning would predict.',
        steps: [
          'Generate a chain-of-thought answer to a prompt as normal.',
          "Introduce a bias into the prompt the model shouldn't rely on (e.g. always making the correct MCQ option 'A') and check whether the answer shifts without the reasoning ever mentioning it.",
          'Alternatively, perturb the reasoning itself — truncate it, insert an error, or paraphrase it — before letting the model produce a final answer.',
          'Compare the final answer across the original and perturbed conditions.',
          "Score faithfulness by how much the answer tracks the reasoning: unfaithful reasoning is reasoning the model doesn't actually condition its answer on.",
        ],
      },
      whenToUse: [
        'You are using a model\'s stated reasoning as a safety or trust signal, e.g. to audit a decision, and need to know if that trust is warranted',
        'You suspect a bias (answer ordering, a leading detail in the prompt) may be driving the answer and want to test whether the reasoning discloses it',
      ],
      whenNotToUse: [
        'You only need the chain of thought to improve accuracy, not to explain the model — unfaithful CoT can still boost performance',
        'The task and model combination has not been tested for faithfulness — treating any CoT as faithful by default is exactly the assumption this entry warns against',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'faithfulness-verdict-on-reasoning-trace',
      },
      related: ['mechanistic-interpretability', 'llm-as-judge'],
      references: {
        free: [
          {
            title: 'Anthropic — Measuring Faithfulness in Chain-of-Thought Reasoning',
            url: 'https://www.anthropic.com/research/measuring-faithfulness-in-chain-of-thought-reasoning',
          },
        ],
        papers: [
          {
            title: "Language Models Don't Always Say What They Think: Unfaithful Explanations in Chain-of-Thought Prompting",
            url: 'https://arxiv.org/abs/2305.04388',
            year: 2023,
          },
          { title: 'Measuring Faithfulness in Chain-of-Thought Reasoning', url: 'https://arxiv.org/abs/2307.13702', year: 2023 },
        ],
      },
    },
  ],
} satisfies Body;
