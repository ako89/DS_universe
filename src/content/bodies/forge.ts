/**
 * Forge — Fine-tuning & Alignment. See PLAN.md §3 for the full moon list.
 *
 * All 7 moons from PLAN.md §3, written at their marked tiers — 5 Tier 1 (supervised-fine-tuning,
 * lora-and-qlora, rlhf, dpo, instruction-tuning) and 2 Tier 2 stubs (adapters-and-prefix-tuning,
 * constitutional-ai-and-rlaif).
 *
 * `eraRange` spans 2017 (Christiano, Leike, Brown, Martic, Legg & Amodei, "Deep Reinforcement
 * Learning from Human Preferences" — the paper that established learning a reward model from
 * pairwise human comparisons and optimizing a policy against it with RL, the direct ancestor of
 * the RLHF pipeline this body's `rlhf` entry covers) to 2023 (Rafailov, Sharma, Mitchell, Ermon,
 * Manning & Finn, "Direct Preference Optimization", and Dettmers, Pagnoni, Holtzman & Zettlemoyer,
 * "QLoRA", both this same year).
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 * All specific numbers (LoRA's r=8 / lora_alpha=8 defaults, DPO's beta=0.1 default, QLoRA's NF4 /
 * 65B-on-a-single-48GB-GPU claim, adapter/prefix parameter percentages) were pulled from HTML
 * pages opened directly — arXiv `/abs/` pages, ar5iv full-text renderings, Hugging Face's own PEFT
 * and TRL documentation, and the PEFT `LoraConfig` source on GitHub — never from a WebFetch PDF
 * summary, per the PDF-fetch warning in CONTENT_GUIDE §3. One borderline case: the GPT-1 paper
 * ("Improving Language Understanding by Generative Pre-Training", Radford, Narasimhan, Salimans &
 * Sutskever, 2018) is PDF-only with no HTML abstract page; its title/authors/year are used for
 * `supervised-fine-tuning`'s citation because they are corroborated independently across multiple
 * search results (Semantic Scholar, GM-RKB, contemporaneous summaries), but no specific number from
 * that PDF is cited anywhere in this file.
 *
 * Deliberate cross-body links: `rlhf` → `ppo` (Odyssey) is the pipeline's actual RL algorithm per
 * both the InstructGPT paper and the Christiano et al. paper. `dpo` → `maximum-likelihood-and-map`
 * (Sol) is genuine, not decorative — DPO's loss is derived by substituting the KL-constrained RL
 * solution into the same Bradley-Terry preference likelihood RLHF's reward model is fit with, so
 * fitting the DPO loss is a maximum-likelihood fit under that model, confirmed by reading the
 * paper's own derivation via its ar5iv rendering. `lora-and-qlora` → `quantization` (Velocity) is
 * explicit in the QLoRA paper's own framing (4-bit NormalFloat quantization of the frozen base
 * model, combined with LoRA adapters trained in higher precision). `supervised-fine-tuning` and
 * `instruction-tuning` → `gpt-lineage` (Genesis) because every entry in this body fine-tunes a
 * model whose pretraining Genesis's GPT lineage entry covers.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'forge',
  name: 'Forge',
  segment: 'Fine-tuning & Alignment',
  hook: 'Reshapes a pretrained model into one that follows instructions and matches preferences, not just predicts text.',
  summary:
    'Forge covers what happens after pretraining: adapting a model to a task or format through supervised fine-tuning, doing that ' +
    'efficiently by training a small add-on instead of every weight, and steering its behavior toward human (or AI-judged) ' +
    'preferences through reinforcement learning or direct preference optimization.',
  eraRange: [2017, 2023],
  moons: [
    {
      id: 'supervised-fine-tuning',
      name: 'Supervised Fine-Tuning (SFT)',
      aliases: ['SFT'],
      tier: 1,
      year: 2018,
      difficulty: 2,
      hook: 'Continues training a pretrained model on curated prompt-response pairs so it does a task, not just predicts text.',
      intuition:
        'Pretraining teaches a model to predict the next token from a huge pile of unlabeled text, which produces something fluent ' +
        'but not necessarily useful in the shape you want. Supervised fine-tuning takes that pretrained model and keeps training it ' +
        '— with the exact same next-token objective — but on a much smaller, curated dataset of (prompt, response) pairs: a question ' +
        'paired with the answer a human actually wrote for it, or an instruction paired with a demonstration of following it. ' +
        'Nothing about the training mechanics changes; what changes is the distribution of examples the model sees. Because the ' +
        "pretrained weights already encode broad language ability, a comparatively small fine-tuning set is enough to reshape the " +
        "model's behavior toward the target format, without needing anywhere near pretraining-scale data. SFT is usually the first " +
        'supervised stage in a longer pipeline — RLHF and DPO both start from an SFT checkpoint rather than the raw pretrained model.',
      howItWorks: {
        summary:
          'Continue training a pretrained model with the ordinary next-token cross-entropy loss, restricted to a curated dataset of ' +
          'prompt-response pairs, with the loss usually masked so gradients only flow from the response tokens.',
        steps: [
          'Collect or write a dataset of (prompt, target response) pairs that demonstrate the behavior you want.',
          "Format each example with the model's chat template so prompt and response are clearly delimited.",
          'Tokenize the pair and mask the loss on the prompt tokens so gradients only flow from the response.',
          'Run ordinary next-token cross-entropy training, typically for a few epochs at a low learning rate.',
          'Evaluate on held-out prompts and stop before the model overfits the fine-tuning set and forgets pretrained abilities.',
        ],
      },
      hyperparameters: [
        {
          name: 'learning rate',
          what: 'Step size for the fine-tuning optimizer.',
          tuning:
            "Hugging Face TRL's SFTConfig defaults to 2e-5, well below typical pretraining rates — fine-tuning at pretraining-scale " +
            'rates catastrophically forgets what the base model already knows.',
        },
        {
          name: 'epochs',
          what: 'Number of passes over the fine-tuning dataset.',
          tuning: 'Usually 1-3. SFT datasets are tiny compared to pretraining corpora, so more passes overfit quickly; watch held-out loss.',
        },
      ],
      whenToUse: [
        'You have a curated dataset of example prompts paired with the exact responses you want the model to produce',
        'You need the model to follow a specific format, tone, or task it was not pretrained to do directly',
        'You want a single, deterministic supervised training run rather than reward modeling and reinforcement learning',
        'You are producing the base policy that a later RLHF or DPO stage will further align',
      ],
      whenNotToUse: [
        'You only have preference comparisons (response A is better than B), not target outputs to imitate — DPO or RLHF fit that data directly, SFT does not',
        'Your demonstration dataset is small and inconsistent — SFT will faithfully reproduce its mistakes rather than average them away',
        'You need to update a very large model but lack the memory to hold optimizer state for every parameter — LoRA or QLoRA fine-tune the same way with far less memory',
        'The behavior you want is more about avoiding specific bad outputs than imitating good ones — preference-based methods target that more directly than imitation',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'fine-tuned-model-weights',
      },
      math: {
        latex: ['\\mathcal{L}_{\\text{SFT}}(\\theta) = -\\sum_{t=1}^{T} \\log p_\\theta(y_t \\mid x, y_{<t})'],
        notes:
          'Identical in form to the pretraining objective — next-token cross-entropy. The only change is the distribution the ' +
          'examples are drawn from: curated (prompt, response) pairs instead of raw web text, with the loss usually masked to the ' +
          'response tokens so the model is not penalized for failing to predict the prompt it was given.',
      },
      complexity: {
        train: 'O(n·d) per token over the fine-tuning set for a model with d parameters — the same per-step cost as pretraining, just far fewer steps',
        predict: 'Identical to the base model — SFT changes the weights, not the inference cost',
      },
      code: [
        'from trl import SFTTrainer, SFTConfig',
        'from datasets import load_dataset',
        '',
        'dataset = load_dataset("trl-lib/Capybara", split="train")',
        '',
        'trainer = SFTTrainer(',
        '    model="Qwen/Qwen3-0.6B-Base",',
        '    args=SFTConfig(learning_rate=2e-5, num_train_epochs=3),',
        '    train_dataset=dataset,',
        ')',
        'trainer.train()',
      ].join('\n'),
      // gpt-lineage is the genuine cross-body link: every SFT run in this body starts from a
      // pretrained checkpoint whose pretraining Genesis's GPT lineage entry covers.
      related: ['instruction-tuning', 'lora-and-qlora', 'rlhf', 'gpt-lineage'],
      references: {
        free: [{ title: 'Hugging Face TRL — SFT Trainer', url: 'https://huggingface.co/docs/trl/sft_trainer' }],
        papers: [
          {
            title: 'Improving Language Understanding by Generative Pre-Training',
            url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf',
            year: 2018,
          },
          {
            title: 'Training language models to follow instructions with human feedback',
            url: 'https://arxiv.org/abs/2203.02155',
            year: 2022,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 15 — Representation Learning (Transfer Learning and Domain Adaptation)',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'lora-and-qlora',
      name: 'LoRA & QLoRA',
      aliases: ['Low-Rank Adaptation', 'Quantized LoRA'],
      tier: 1,
      year: 2021,
      difficulty: 3,
      hook: 'Freezes the pretrained weights and trains two tiny low-rank matrices instead — QLoRA does it on a 4-bit model.',
      intuition:
        'Full fine-tuning updates every weight in a model, which means storing gradients and optimizer state for every one of them. ' +
        'LoRA freezes the entire pretrained weight matrix and, next to it, adds a much smaller update built from two skinny matrices ' +
        'multiplied together — their product has the same shape as the frozen weight, but because their inner dimension (the rank) ' +
        'is tiny compared to the full matrix, the pair holds far fewer parameters. One of the two matrices starts at zero, so the ' +
        "model is identical to the base model before training even begins; training only ever touches this small pair, never the " +
        'original weights. QLoRA pushes the same idea further: it quantizes the frozen base model down to 4-bit precision to shrink ' +
        'its memory footprint, then backpropagates through that quantized model into ordinary higher-precision LoRA matrices, making ' +
        "it possible to fine-tune a model far larger than would otherwise fit in a single GPU's memory.",
      howItWorks: {
        summary:
          'Freeze the pretrained weight matrix and add a trainable low-rank update B·A next to it, training only B and A; QLoRA ' +
          'additionally quantizes the frozen base to 4-bit before training the same low-rank update on top of it.',
        steps: [
          'Pick which weight matrices to adapt (commonly the attention projection matrices) and a rank r much smaller than their dimensions.',
          'Initialize matrix A with random Gaussian values and matrix B to zero, so the initial update B·A is exactly zero.',
          'At each forward pass, add the scaled low-rank update to the frozen weight: h = W0·x + (alpha/r)·B·A·x.',
          'Backpropagate and update only A and B — the original weight matrix W0 never receives a gradient.',
          '(QLoRA only) Store the frozen base model in 4-bit NormalFloat precision and dequantize on the fly during the forward pass, training the LoRA matrices in higher precision.',
          'After training, optionally merge B·A into W0 for a single dense weight matrix with no extra inference cost.',
        ],
      },
      hyperparameters: [
        {
          name: 'r (rank)',
          what: 'Rank of the low-rank decomposition matrices A and B.',
          tuning:
            "PEFT's LoraConfig defaults to r=8. Lower rank means fewer trainable parameters; the original paper found quality " +
            'was often insensitive to rank above a small threshold, so start low and raise it only if the adapted model underfits.',
        },
        {
          name: 'lora_alpha',
          what: 'Scaling factor applied to the low-rank update; the effective scale is lora_alpha / r.',
          tuning:
            'PEFT defaults lora_alpha=8 (a scale of 1x at r=8). A common convention sets alpha to roughly twice the rank, which ' +
            "strengthens the adapter's influence without adding any parameters.",
        },
        {
          name: 'quantization (QLoRA only)',
          what: 'Precision the frozen base model is stored in during training.',
          tuning:
            'QLoRA quantizes the frozen base to 4-bit NormalFloat (NF4) with double quantization of the quantization constants ' +
            'themselves, cutting memory enough to fine-tune a 65B-parameter model on a single 48GB GPU.',
        },
      ],
      whenToUse: [
        'You need to fine-tune a large pretrained model but cannot afford to store gradients and optimizer state for every parameter',
        'You want to keep several task-specific fine-tunes of the same base model — each LoRA adapter is a few megabytes and can be swapped in independently',
        'The base model is too large to fine-tune at full precision on your GPU — QLoRA quantizes the frozen base to 4-bit so training fits on a single consumer or workstation GPU',
        'Inference-time cost matters and you can merge the adapter into the base weights after training, since a merged LoRA adds no extra forward-pass latency',
      ],
      whenNotToUse: [
        'The downstream task is dramatically different from anything in pretraining and needs to change what the model represents at every layer — a low-rank update may not have enough capacity',
        'You need the absolute best achievable quality and have the compute budget for full fine-tuning — LoRA is usually close but not always identical',
        'The base model already fits comfortably in memory at full precision and training speed matters more than memory — QLoRA\'s quantize/dequantize overhead is not worth it there',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'adapter-weights',
      },
      math: {
        latex: ['h = W_0 x + \\Delta W x = W_0 x + \\frac{\\alpha}{r}(BA)x'],
        notes:
          'A is initialized from a random Gaussian and B is initialized to zero, so the update \\Delta W = BA is exactly zero at ' +
          'the start of training and the adapted model begins identical to the base model. Because r is far smaller than the ' +
          'dimensions of W0, B and A together hold far fewer parameters than the full weight matrix, and only B and A ever ' +
          'receive gradients — W0 stays frozen throughout training.',
      },
      complexity: {
        train: 'O(r·(m+n)) trainable parameters per adapted m×n weight matrix instead of O(m·n) for full fine-tuning, where r << min(m,n)',
        predict: 'Identical to the base model if the adapter is merged into W0 after training; a small additional matmul per adapted layer if kept separate',
      },
      code: [
        'from peft import LoraConfig, get_peft_model',
        'from transformers import AutoModelForCausalLM',
        '',
        'model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B")',
        '',
        'lora_config = LoraConfig(',
        '    r=8, lora_alpha=16, lora_dropout=0.05,',
        '    target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM",',
        ')',
        'model = get_peft_model(model, lora_config)   # only a small fraction of params are now trainable',
        'model.print_trainable_parameters()',
      ].join('\n'),
      // quantization is the genuine cross-body link: QLoRA's own paper is explicitly about
      // combining 4-bit quantization of the frozen base model with LoRA adapters.
      related: ['supervised-fine-tuning', 'adapters-and-prefix-tuning', 'quantization'],
      references: {
        free: [{ title: 'Hugging Face PEFT — LoRA conceptual guide', url: 'https://huggingface.co/docs/peft/main/en/conceptual_guides/lora' }],
        papers: [
          { title: 'LoRA: Low-Rank Adaptation of Large Language Models', url: 'https://arxiv.org/abs/2106.09685', year: 2021 },
          { title: 'QLoRA: Efficient Finetuning of Quantized LLMs', url: 'https://arxiv.org/abs/2305.14314', year: 2023 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 15 — Representation Learning (Transfer Learning and Domain Adaptation)',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'adapters-and-prefix-tuning',
      name: 'Adapters & Prefix Tuning',
      aliases: ['Houlsby adapters', 'soft prompts'],
      tier: 2,
      year: 2019,
      difficulty: 3,
      hook: 'Freezes the whole model and trains only small bottleneck layers, or a learned prefix prepended to every layer.',
      intuition:
        'Before LoRA, two other families of parameter-efficient fine-tuning made the same trade — freeze the pretrained model, ' +
        'train something small instead. Adapters insert tiny bottleneck feed-forward modules — down-project, nonlinearity, up-project, ' +
        'plus a residual connection — after the attention and feed-forward sublayers of every transformer block, initialized so the ' +
        'model starts close to unchanged. Prefix tuning instead prepends a set of trainable vectors ("virtual tokens") to the keys ' +
        'and values at every layer, optimized through a separate feed-forward network for training stability and then fixed in place. ' +
        "Both leave every original weight untouched and train only the add-on: Houlsby's adapters reach within a fraction of a " +
        'percent of full fine-tuning while adding a few percent of the parameters per task; prefix tuning gets comparable results ' +
        'while training a far smaller fraction than that. LoRA came later and now sees wider use than either, but both are the ' +
        'direct ancestors of the parameter-efficient fine-tuning family LoRA belongs to.',
      howItWorks: {
        summary:
          "Keep every pretrained weight frozen and add either small bottleneck feed-forward modules inside each transformer layer " +
          "(adapters) or a learned sequence of vectors prepended to each layer's keys and values (prefix tuning).",
        steps: [
          "Adapters: after the attention (and again after the feed-forward) sublayer, down-project the hidden state to a small bottleneck dimension, apply a nonlinearity, up-project back, and add the result via a residual connection.",
          "Prefix tuning: initialize a short sequence of trainable vectors per layer and prepend them to that layer's keys and values so later tokens can attend to them.",
          'Train only the added parameters — the bottleneck weights for adapters, the prefix vectors and their reparameterization network for prefix tuning — with the base model entirely frozen.',
        ],
      },
      whenToUse: [
        'You want strict modularity — a task adapter or prefix can be swapped in or shared without touching the base model weights at all',
        'You are fine-tuning for many tasks and want to store a small artifact per task rather than a full model copy',
      ],
      whenNotToUse: [
        'LoRA is available and applicable — it typically matches or beats both at a similar or lower parameter budget and, once merged, adds no inference latency, while adapters always add sequential compute',
        'Inference latency is critical — adapters insert extra layers into the forward pass that cannot be merged away the way a linear LoRA update can',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'adapter-or-prefix-weights',
      },
      related: ['lora-and-qlora', 'supervised-fine-tuning'],
      references: {
        free: [{ title: 'Hugging Face PEFT — Soft prompts (prompt tuning, prefix tuning, P-tuning)', url: 'https://huggingface.co/docs/peft/main/en/conceptual_guides/prompting' }],
        papers: [
          { title: 'Parameter-Efficient Transfer Learning for NLP', url: 'https://arxiv.org/abs/1902.00751', year: 2019 },
          { title: 'Prefix-Tuning: Optimizing Continuous Prompts for Generation', url: 'https://arxiv.org/abs/2101.00190', year: 2021 },
        ],
      },
    },
    {
      id: 'rlhf',
      name: 'Reinforcement Learning from Human Feedback (RLHF)',
      aliases: ['RLHF'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Trains a reward model on human preference comparisons, then uses PPO to optimize the policy against it.',
      intuition:
        "You cannot write down a reward function for \"is this response helpful and honest\" the way you can for a game score, so " +
        'RLHF asks people instead. Human labelers compare pairs of model outputs for the same prompt and say which they prefer; ' +
        'those comparisons train a separate reward model to predict a score matching that preference. The language model is then ' +
        'treated as a reinforcement-learning policy: it generates a response, the reward model scores it, and an RL algorithm — PPO ' +
        "in the original pipeline — nudges the policy's weights to raise that score. A KL penalty against the original " +
        'supervised-fine-tuned model is added, stopping the policy from drifting into outputs that game the reward model rather than ' +
        'genuinely satisfying the labelers. The result is a three-stage pipeline: supervised fine-tuning on demonstrations, reward-' +
        'model training on comparisons, then reinforcement learning against the reward model.',
      howItWorks: {
        summary:
          'Fit a reward model to predict human pairwise preferences, then fine-tune the language model with PPO to maximize that ' +
          'reward, penalized by a KL term against the original supervised-fine-tuned policy.',
        steps: [
          'Start from a supervised-fine-tuned model as the initial policy.',
          'Collect pairwise comparisons: for a prompt, humans rank two or more model outputs by preference.',
          'Train a reward model so the ranking implied by its scores matches the human comparisons.',
          'Use PPO to update the policy to maximize the reward model score on new generations, penalized by a per-token KL divergence from the SFT policy.',
          'Repeat sampling, reward scoring, and PPO updates, monitoring for the policy exploiting weaknesses in the reward model.',
        ],
      },
      hyperparameters: [
        {
          name: 'KL coefficient',
          what: 'Weight on the per-token KL penalty against the reference (SFT) policy.',
          tuning:
            'Too low lets the policy exploit reward-model blind spots (reward hacking); too high barely moves the policy from its ' +
            'SFT starting point. InstructGPT applies this penalty per-token rather than per-episode.',
        },
        {
          name: 'reward model size',
          what: 'Capacity of the separate model trained to score outputs.',
          tuning: 'InstructGPT trained reward models considerably smaller than the largest policy — a smaller reward model trained more stably than matching the policy size.',
        },
      ],
      whenToUse: [
        'You have (or can collect) pairwise human preference comparisons between model outputs, not just target outputs to imitate',
        'The behavior you want is hard to specify as a loss function directly — helpfulness, harmlessness, tone — but people can reliably compare two outputs',
        'You have the infrastructure to run a full RL training loop reliably: policy, reference model, reward model and PPO updates',
      ],
      whenNotToUse: [
        'You want preference alignment without maintaining a separate reward model and an RL loop — DPO fits the same preference data more simply',
        'Your preference labels are noisy or inconsistent in bulk — a poorly fit reward model gets exploited by the policy (reward hacking) instead of genuinely improving outputs',
        'You lack the compute or engineering budget to keep several models in memory at once and tune RL-specific hyperparameters like the KL coefficient and clip range',
      ],
      facets: {
        task: ['generation', 'control'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'aligned-policy',
      },
      math: {
        latex: [
          'p^*(y_1 \\succ y_2 \\mid x) = \\frac{\\exp(r^*(x,y_1))}{\\exp(r^*(x,y_1)) + \\exp(r^*(x,y_2))}',
          '\\max_\\pi \\; \\mathbb{E}_{x,y\\sim\\pi}\\left[r_\\phi(x,y)\\right] - \\beta \\, \\mathbb{D}_{\\mathrm{KL}}\\!\\left[\\pi(y\\mid x) \\,\\|\\, \\pi_{\\text{ref}}(y\\mid x)\\right]',
        ],
        notes:
          'The reward model is fit under a Bradley-Terry preference model — the probability that y1 is preferred over y2 is a ' +
          'sigmoid of the difference in their scores. The RL objective then maximizes expected reward under the policy while a KL ' +
          'penalty against the reference (SFT) policy keeps generations from drifting far enough to exploit weaknesses in the ' +
          'reward model rather than genuinely satisfying the preferences it was fit to.',
      },
      complexity: {
        train: 'One reward-model training pass plus iterative PPO rollouts and updates — substantially more expensive than SFT alone, since each iteration samples from the policy, scores with the reward model, and runs an RL update',
        predict: 'Identical to the underlying language model — RLHF changes the weights, not the inference-time cost',
      },
      code: [
        '# Sketch of the InstructGPT-style pipeline using TRL',
        'from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead',
        '',
        'policy = AutoModelForCausalLMWithValueHead.from_pretrained("sft-model")',
        'ref_model = AutoModelForCausalLMWithValueHead.from_pretrained("sft-model")',
        '',
        'ppo_trainer = PPOTrainer(PPOConfig(), policy, ref_model, tokenizer)',
        '',
        'for batch in prompt_loader:',
        '    responses = ppo_trainer.generate(batch["input_ids"])',
        '    rewards = reward_model(batch["input_ids"], responses)   # scalar score per response',
        '    ppo_trainer.step(batch["input_ids"], responses, rewards)',
      ].join('\n'),
      // ppo is a direct, verified link, not decorative: both the Christiano et al. paper and the
      // InstructGPT paper name PPO as the RL algorithm the policy is optimized with.
      related: ['ppo', 'dpo', 'constitutional-ai-and-rlaif', 'instruction-tuning'],
      references: {
        free: [{ title: 'Hugging Face — Illustrating Reinforcement Learning from Human Feedback (RLHF)', url: 'https://huggingface.co/blog/rlhf' }],
        papers: [
          { title: 'Deep Reinforcement Learning from Human Preferences', url: 'https://arxiv.org/abs/1706.03741', year: 2017 },
          { title: 'Training language models to follow instructions with human feedback', url: 'https://arxiv.org/abs/2203.02155', year: 2022 },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 13 — Policy Gradient Methods',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'dpo',
      name: 'Direct Preference Optimization (DPO)',
      aliases: ['DPO'],
      tier: 1,
      year: 2023,
      difficulty: 3,
      hook: 'Turns RLHF into one classification loss over preference pairs — no reward model, no RL rollouts.',
      intuition:
        "RLHF's reward model and PPO loop exist to solve one problem: given comparisons of which response people prefer, find a " +
        'policy that generates more of the preferred kind. DPO notices that under the same Bradley-Terry preference model RLHF\'s ' +
        'reward model is fit with, the RL step that maximizes reward subject to a KL constraint against a reference policy has a ' +
        "closed-form optimal solution — the optimal policy's log-probability ratio to the reference is the reward, up to a constant. " +
        'Substituting that relationship back into the preference loss produces a loss defined directly on the policy\'s own log-' +
        'probabilities: for a chosen and a rejected response to the same prompt, increase the model\'s relative preference for the ' +
        'chosen one over the rejected one, compared to what the frozen reference model would have preferred. No reward model is ' +
        'trained, nothing is sampled during training, and the whole thing reduces to ordinary supervised optimization of a binary ' +
        'classification loss.',
      howItWorks: {
        summary:
          "Rewrite the RLHF objective in terms of the policy's own log-probabilities via the reward-policy correspondence implied " +
          'by the KL-constrained RL solution, then optimize that directly as a classification loss over (chosen, rejected) pairs.',
        steps: [
          'Collect a dataset of (prompt, chosen response, rejected response) preference triples.',
          'Compute the log-probability the current policy assigns to the chosen and rejected responses.',
          'Compute the same log-probabilities under a frozen reference model (usually the SFT checkpoint).',
          'Form the loss: a sigmoid of beta times the difference between the chosen and rejected log-probability ratios (policy vs. reference), pushed toward classifying chosen as preferred.',
          'Backpropagate and update the policy directly — no reward model, no sampling, no RL rollout.',
        ],
      },
      hyperparameters: [
        {
          name: 'beta',
          what: 'Temperature controlling how strongly the loss penalizes deviation from the reference model.',
          tuning:
            "Hugging Face TRL's DPOConfig defaults beta=0.1. Higher beta keeps the policy closer to the reference model (weaker " +
            'preference signal); lower beta allows more deviation and a stronger push toward the chosen responses.',
        },
        {
          name: 'reference model',
          what: "The frozen model the policy's log-probabilities are compared against — usually the SFT checkpoint DPO starts from.",
          tuning: 'Must already produce reasonable completions for the dataset; DPO measures relative change from this baseline, not absolute quality.',
        },
      ],
      whenToUse: [
        'You have pairwise preference data (chosen vs. rejected response to the same prompt) and want to align a model to it',
        'You want RLHF-equivalent alignment without standing up a separate reward model, a value function, and an on-policy RL loop',
        'You want a training run that looks like ordinary supervised fine-tuning — stable, reproducible, with no actively-optimized reward model to game',
      ],
      whenNotToUse: [
        'You only have demonstrations (single good responses), not preference comparisons — that is supervised fine-tuning, not DPO',
        'You need online, on-policy exploration to discover better responses than any in your fixed dataset — DPO trains only against the pairs already collected',
        'Your reference model is a poor starting point — DPO measures preference relative to it and inherits its blind spots',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'aligned-policy',
      },
      math: {
        latex: [
          '\\mathcal{L}_{\\text{DPO}}(\\theta) = -\\mathbb{E}\\left[\\log \\sigma\\!\\left(\\beta \\log\\frac{\\pi_\\theta(y_w\\mid x)}{\\pi_{\\text{ref}}(y_w\\mid x)} - \\beta \\log\\frac{\\pi_\\theta(y_l\\mid x)}{\\pi_{\\text{ref}}(y_l\\mid x)}\\right)\\right]',
        ],
        notes:
          'y_w is the chosen (winning) response and y_l the rejected (losing) one. The loss is derived from the same Bradley-Terry ' +
          "preference model RLHF's reward model is fit with — DPO substitutes the closed-form relationship between the optimal " +
          'KL-constrained policy and its implicit reward directly into that preference loss, so fitting this objective is ' +
          'mathematically equivalent to fitting a reward model and then solving the RLHF RL problem exactly, without ever forming ' +
          'the reward model or running RL.',
      },
      complexity: {
        train: 'Same order as supervised fine-tuning — one forward pass through the policy and one through the frozen reference model per pair, no sampling or rollout collection',
        predict: 'Identical to the base model — DPO changes the weights, not inference cost',
      },
      code: [
        'from trl import DPOTrainer, DPOConfig',
        'from datasets import load_dataset',
        '',
        'dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")',
        '',
        'trainer = DPOTrainer(',
        '    model="sft-model",              # start from an SFT checkpoint',
        '    args=DPOConfig(beta=0.1, learning_rate=1e-6),',
        '    train_dataset=dataset,          # {prompt, chosen, rejected}',
        ')',
        'trainer.train()',
      ].join('\n'),
      // maximum-likelihood-and-map is a genuine cross-body link, not decoration: the DPO loss is
      // the maximum-likelihood fit of the same Bradley-Terry model RLHF's reward model uses,
      // confirmed by reading the paper's own derivation.
      related: ['rlhf', 'ppo', 'maximum-likelihood-and-map'],
      references: {
        free: [{ title: 'Hugging Face TRL — DPO Trainer', url: 'https://huggingface.co/docs/trl/dpo_trainer' }],
        papers: [
          {
            title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
            url: 'https://arxiv.org/abs/2305.18290',
            year: 2023,
          },
        ],
        books: [
          {
            title: 'The Elements of Statistical Learning',
            author: 'Hastie, Tibshirani & Friedman',
            chapter: 'Ch. 4 — Linear Methods for Classification',
            url: 'https://hastie.su.domains/ElemStatLearn/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },
    {
      id: 'instruction-tuning',
      name: 'Instruction Tuning',
      aliases: ['instruction fine-tuning', 'FLAN'],
      tier: 1,
      year: 2021,
      difficulty: 2,
      hook: 'Fine-tunes on many tasks phrased as instructions so the model generalizes to instructions it has never seen.',
      intuition:
        'A model fine-tuned on one task learns that task; a model fine-tuned on thousands of different tasks, each rewritten as a ' +
        'plain-language instruction plus its answer, learns something more general: how to read an instruction and do what it says. ' +
        'Instruction tuning takes a pretrained model and continues training it with ordinary supervised learning, but the dataset is ' +
        'deliberately built from many different task types — summarize this, translate that, answer this question, classify this ' +
        'review — every one phrased as a natural-language instruction rather than a task-specific format. Held-out tasks, phrased the ' +
        'same way but never seen during training, improve too, because the model has learned the general skill of instruction-' +
        'following rather than memorizing any single task\'s format. This is what turns a raw next-token predictor into something ' +
        'that behaves like an assistant responding to requests, and it is typically the first supervised stage in a pipeline that ' +
        'later adds RLHF or DPO on top.',
      howItWorks: {
        summary:
          'Fine-tune a pretrained model with ordinary supervised cross-entropy on a dataset spanning many different tasks, each ' +
          'verbalized as a natural-language instruction paired with its target response.',
        steps: [
          'Assemble a dataset covering many distinct tasks — summarization, translation, classification, question answering, and more.',
          "Convert each task's examples into a shared instruction format: a natural-language instruction, optional input, and target output.",
          'Fine-tune the pretrained model on the combined dataset with the standard next-token cross-entropy loss.',
          'Hold out some task types entirely during training to measure zero-shot generalization to unseen instructions.',
          'Evaluate on the held-out tasks; scaling the number and diversity of training tasks improves that generalization.',
        ],
      },
      hyperparameters: [
        {
          name: 'number of tasks',
          what: 'How many distinct task types the instruction dataset spans.',
          tuning: 'The FLAN paper found generalization to held-out tasks improved as more task clusters were added during training — diversity of tasks matters more than examples per task.',
        },
        {
          name: 'learning rate',
          what: 'Step size for the fine-tuning optimizer.',
          tuning: 'Same order as ordinary SFT — a small fraction of the pretraining learning rate, to avoid catastrophic forgetting of pretrained knowledge.',
        },
      ],
      whenToUse: [
        'You want a single model that follows natural-language instructions across many task types, not one fine-tuned narrowly for a single task',
        'You need better zero-shot performance on tasks you have not specifically collected training data for',
        'You are building the base instruction-following model that a later RLHF or DPO alignment stage will refine',
      ],
      whenNotToUse: [
        'You only care about one narrow, fixed task and have plenty of task-specific labeled data — a narrowly fine-tuned model can outperform a broadly instruction-tuned one on that single task',
        'Your instruction dataset covers only a handful of task types — the zero-shot generalization benefit comes specifically from diversity across many tasks, not from more examples of the same one',
        'You need preference-level alignment (helpfulness, safety, tone) rather than task-following — that is what RLHF, DPO or Constitutional AI target, not instruction tuning by itself',
      ],
      facets: {
        task: ['generation'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'fine-tuned-model-weights',
      },
      math: {
        latex: ['\\mathcal{L}_{\\text{IT}}(\\theta) = -\\mathbb{E}_{(x,y)\\sim \\mathcal{D}_{\\text{tasks}}}\\left[\\sum_{t} \\log p_\\theta(y_t \\mid x, y_{<t})\\right]'],
        notes:
          "The loss is identical to plain SFT's next-token cross-entropy — instruction tuning is not a different objective, it is " +
          'SFT applied to a dataset deliberately constructed to span many task types verbalized as instructions. The zero-shot ' +
          'generalization the FLAN paper documents comes entirely from the composition of the data, not from any change to the loss.',
      },
      complexity: {
        train: 'Same per-step cost as SFT — O(n·d) per token for a model with d parameters — but typically over a larger and more diverse dataset spanning many tasks',
        predict: 'Identical to the base model',
      },
      code: [
        'from trl import SFTTrainer, SFTConfig',
        'from datasets import load_dataset, concatenate_datasets',
        '',
        '# combine many task-specific datasets, each reformatted as {instruction, input, output}',
        'tasks = [load_dataset(name, split="train") for name in TASK_DATASET_NAMES]',
        'instruction_dataset = concatenate_datasets(tasks).shuffle(seed=0)',
        '',
        'trainer = SFTTrainer(',
        '    model="base-pretrained-model",',
        '    args=SFTConfig(learning_rate=2e-5, num_train_epochs=3),',
        '    train_dataset=instruction_dataset,',
        ')',
        'trainer.train()',
      ].join('\n'),
      // gpt-lineage is the genuine cross-body link: instruction tuning is applied to a pretrained
      // transformer LM whose pretraining Genesis's GPT lineage entry covers.
      related: ['supervised-fine-tuning', 'rlhf', 'gpt-lineage'],
      references: {
        free: [{ title: 'Hugging Face TRL — SFT Trainer (instruction tuning example)', url: 'https://huggingface.co/docs/trl/sft_trainer' }],
        papers: [
          { title: 'Finetuned Language Models Are Zero-Shot Learners', url: 'https://arxiv.org/abs/2109.01652', year: 2021 },
          { title: 'Training language models to follow instructions with human feedback', url: 'https://arxiv.org/abs/2203.02155', year: 2022 },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 15 — Representation Learning (Transfer Learning and Domain Adaptation)',
            url: 'https://www.deeplearningbook.org/',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },
    {
      id: 'constitutional-ai-and-rlaif',
      name: 'Constitutional AI & RLAIF',
      aliases: ['CAI', 'RL from AI Feedback'],
      tier: 2,
      year: 2022,
      difficulty: 3,
      hook: 'Replaces human preference labels with written principles and an AI judge that scores responses against them.',
      intuition:
        'RLHF needs a person to compare every pair of candidate responses, which is slow and expensive to scale. Constitutional AI ' +
        "replaces most of that human labor with the model itself, guided by a short list of written principles — a \"constitution\" " +
        '— such as choosing the response that is more helpful and less harmful. In its supervised phase, the model critiques and ' +
        'revises its own outputs against those principles, and is fine-tuned on the revised versions. In its RL phase, instead of ' +
        'humans comparing pairs of outputs, another instance of the model does the comparing, and those AI-generated preferences ' +
        'train the reward model that RL then optimizes against — a pipeline the paper calls RL from AI Feedback (RLAIF). Follow-up ' +
        'work found that RLAIF alone, without the constitutional critique-and-revise step, produces preferences that match RLHF\'s ' +
        'downstream performance about as well as human preferences do on tasks like summarization, at a fraction of the labeling cost.',
      howItWorks: {
        summary:
          "Have the model critique and revise its own outputs against a written set of principles (supervised phase), then replace " +
          "human preference comparisons with an AI model's judgments to train the reward model used in RL (RLAIF).",
        steps: [
          'Supervised phase: sample a response, have the model critique it against the constitution, then revise it; fine-tune on the revised responses.',
          'RL phase: sample pairs of responses from the fine-tuned model.',
          'Have an AI labeler (an LLM prompted with the constitution) judge which response is better, producing AI preference labels.',
          'Train a reward model on those AI preferences and run RL (e.g. PPO) against it, exactly as in RLHF but with AI-generated comparisons in place of human ones.',
        ],
      },
      whenToUse: [
        'You want RLHF-style alignment but human preference labeling at the scale you need is too slow or expensive',
        'You can articulate the behavior you want as a small set of written principles a model can apply consistently',
      ],
      whenNotToUse: [
        'The judgments you need require nuance current AI labelers cannot reliably apply — subtle cultural, legal or safety calls still benefit from human review',
        "You have no AI labeler capable enough to trust — RLAIF's preference quality depends on the labeler's judgment being good enough to compare responses well",
      ],
      facets: {
        task: ['generation', 'control'],
        dataType: ['text'],
        dataSize: ['large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'aligned-policy',
      },
      related: ['rlhf', 'dpo'],
      references: {
        free: [{ title: 'Anthropic — Constitutional AI: Harmlessness from AI Feedback', url: 'https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback' }],
        papers: [
          { title: 'Constitutional AI: Harmlessness from AI Feedback', url: 'https://arxiv.org/abs/2212.08073', year: 2022 },
          { title: 'RLAIF vs. RLHF: Scaling Reinforcement Learning from Human Feedback with AI Feedback', url: 'https://arxiv.org/abs/2309.00267', year: 2023 },
        ],
      },
    },
  ],
} satisfies Body;
