/**
 * Iris — Multimodal. See PLAN.md §3 for the full moon list.
 *
 * All 5 moons from PLAN.md §3, at their marked tiers: 2 Tier 1 (clip-and-contrastive-pretraining,
 * vision-language-models) and 3 Tier 2 stubs (audio-models, video-and-world-models,
 * unified-any-to-any-architectures).
 *
 * `eraRange` spans 2018 (Ha & Schmidhuber's "World Models" — the earliest publication cited
 * anywhere in this file, and the origin of the "learned simulator of an environment" half of
 * video-and-world-models) to 2024 (Genie, the most recent paper cited, and independently the
 * year of OpenAI's Sora technical report — see that entry's header note for how Sora itself was
 * sourced). This is wider than the range of the five `year` fields (2018–2023) because each
 * bundled Tier 2 entry cites a paper newer than the technique it is dated to, following the same
 * "date to the earlier of the bundled techniques" convention jupiter.ts set for
 * optics-and-mean-shift and echo.ts continued for tcns-and-wavenet — see each entry below for its
 * own reasoning.
 *
 * Researched per CONTENT_GUIDE §3 throughout: search, open a real source (arXiv /abs/ or ar5iv
 * HTML pages, official library docs, or a canonical text from §5 — never a PDF summary for a
 * specific claim), verify every URL, then write. Two access notes worth flagging for future
 * agents:
 *
 * 1. `openai.com` returned HTTP 403 to every WebFetch attempt in this session (tried
 *    `/index/video-generation-models-as-world-simulators/`, a trailing-slash variant, and
 *    `/research/...` — all blocked, not just one URL shape). No claim in this file rests on that
 *    fetch. Sora's architecture (diffusion transformer denoising space-time patches of video/image
 *    latents) is instead sourced from Lilian Weng's Lil'Log post "Diffusion Models for Video
 *    Generation" (a vetted §5 source, fetched directly and successfully), which quotes and cites
 *    the OpenAI report, and independently cross-checked against Wikipedia's "Sora (text-to-video
 *    model)" page for the February 15, 2024 date. See video-and-world-models below.
 * 2. The `books` reference required on both Tier 1 entries (validator rule: all four categories,
 *    ≥1 each) was the hardest sourcing problem in this batch — CLIP and VLMs are too recent for
 *    most vetted canonical texts to cover in a dedicated section. For clip-and-contrastive-
 *    pretraining, Prince's *Understanding Deep Learning* was confirmed (by downloading and
 *    grepping the book's own `.bib` file directly — not a WebFetch summary) to cite Radford et
 *    al. 2021 as `radford2021learning`; combined with a bookseller-listed table of contents
 *    naming Chapter 14 "Unsupervised learning" and that chapter's absence from the book's
 *    `Notebooks/` folder (consistent with a conceptual, non-coding chapter — checked directly
 *    against the repo's file listing), Ch. 14 is the citation used. For vision-language-models,
 *    no vetted text was found to name VLMs specifically; Murphy's *Probabilistic Machine
 *    Learning: Advanced Topics* was used instead, citing Ch. 32 "Representation Learning," §32.3.4
 *    "Multiview Representation Learning" — confirmed by downloading the book's own official
 *    table-of-contents PDF and self-extracting it with `pdftotext -layout` (per the PDF-fetch
 *    rule: a real, self-extracted file, not a WebFetch summary), which is the general chapter
 *    covering how a shared representation connects two encoders, the underlying mechanism a VLM's
 *    image-to-LLM connector depends on. Neither claims the chapter names any specific VLM system.
 *
 * Cross-body links: clip-and-contrastive-pretraining → vision-transformer (Vulcan) and
 * byte-pair-encoding (Babel) are direct architectural facts read out of the CLIP paper itself
 * (its best model is a ViT-L/14; its text encoder tokenizes with BPE) — see that entry's
 * math.notes. vision-language-models → gpt-lineage (Genesis) reflects that LLaVA/Flamingo-style
 * VLMs reuse a pretrained autoregressive LLM as their text decoder rather than training language
 * understanding from scratch. video-and-world-models → latent-and-score-based-diffusion (Chimera)
 * and mdps-and-bellman-equation (Odyssey) are both read directly out of the two anchor papers:
 * Sora is described by Weng's post as operating in a video/image "latent" space with a diffusion
 * denoiser, and Ha & Schmidhuber's world model is explicitly a learned transition model — the
 * next-state predictor at the center of an MDP — used to train a policy inside simulation.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'iris',
  name: 'Iris',
  segment: 'Multimodal',
  hook: 'Models that connect image, text, audio and video through one shared representation or one generator.',
  summary:
    'Iris covers the architectures that cross modality boundaries: CLIP-style contrastive pretraining that aligns images ' +
    'and text in one embedding space, vision-language models that give a language model eyes, speech and audio models ' +
    'that transcribe or generate sound, video generation and world models that simulate what a scene looks like or how ' +
    'an environment behaves, and the early unified architectures that take and produce any mix of these modalities at once.',
  eraRange: [2018, 2024],
  moons: [
    {
      id: 'clip-and-contrastive-pretraining',
      name: 'CLIP & Contrastive Pretraining',
      aliases: ['Contrastive Language-Image Pre-training', 'CLIP', 'dual-encoder contrastive pretraining'],
      tier: 1,
      year: 2021,
      difficulty: 3,
      hook: 'Learns a shared image-text embedding from 400M web image-caption pairs, so a new category is just a sentence.',
      intuition:
        'Traditional image classifiers learn a fixed list of categories baked into the final layer, so recognizing a ' +
        'new category means retraining that layer on new labeled examples. CLIP sidesteps this by never learning a ' +
        'label list at all. It trains two encoders — one for images, one for text — end to end on 400 million ' +
        '(image, caption) pairs scraped from the web, with a single objective: given a batch of images and captions, ' +
        "pull each image's embedding close to its own caption's embedding and push it away from every other caption " +
        'in the batch, and do the symmetric thing from the caption side. Nothing in that objective mentions specific ' +
        'categories, so the resulting embedding space generalizes to any category describable in words. At test ' +
        'time, "classification" becomes a comparison: embed a new image, embed candidate class names as short ' +
        'sentences ("a photo of a dog"), and pick whichever caption embedding sits closest — no retraining, no new ' +
        'labels, just a different sentence.',
      howItWorks: {
        summary:
          'Encode an image and its caption with separate encoders into a shared embedding space, then train both ' +
          'encoders jointly so each matching pair scores higher similarity than every mismatched pair in the batch.',
        steps: [
          'Encode a batch of N images with an image encoder (a ResNet variant or a Vision Transformer) into N embedding vectors.',
          'Encode the N corresponding captions with a Transformer text encoder, tokenized with byte-pair encoding, into N embedding vectors.',
          "Project both sets of embeddings into a shared multi-modal space with one linear layer each, then L2-normalize them.",
          'Compute the N x N matrix of cosine similarities between every image and every caption in the batch, scaled by a learned temperature.',
          "Train with a symmetric cross-entropy loss: each image is classified against the N captions in its batch, and each caption against the N images, and both losses are averaged.",
          'At inference, classify a new image zero-shot by embedding candidate class names as short template sentences and picking the highest-similarity match.',
        ],
      },
      hyperparameters: [
        {
          name: 'temperature (logit scale)',
          what: 'A learned scalar that rescales the cosine similarities before the softmax in the contrastive loss.',
          tuning:
            "CLIP initializes it to the equivalent of 0.07 and clips it during training so similarities are never " +
            'scaled by more than 100 — an unclipped temperature can run away and collapse the loss.',
        },
        {
          name: 'batch size',
          what: 'Number of image-text pairs per training batch, which sets how many negatives each positive pair is contrasted against.',
          tuning:
            'Contrastive pretraining is unusually batch-size sensitive: more in-batch negatives make the discrimination ' +
            'task harder and more informative. CLIP trained with a batch size of 32,768; substantially smaller batches weaken the signal.',
        },
      ],
      whenToUse: [
        'You need zero-shot image classification or retrieval without collecting labeled training examples for every new class',
        'You want a general-purpose joint image-text embedding space to use for retrieval, clustering, or as a frozen vision encoder inside a larger multimodal model',
        'You have (or can approximate) large-scale, weakly-supervised image-caption pairs rather than a clean, single-label training set',
        'The task benefits from describing classes in natural language rather than committing to a fixed, pre-enumerated label set',
      ],
      whenNotToUse: [
        "The task needs fine-grained distinctions the original paper itself reports as a weakness — e.g. distinguishing similar car models or flower species, or counting objects in an image",
        'You need the model to generate images or text, not just embed and compare them — CLIP scores similarity between modalities, it does not generate either one',
        "Your domain is far from CLIP's web-scraped training distribution (e.g. medical or satellite imagery) and there is no budget to fine-tune or adapt it",
        'You need calibrated probabilities rather than a ranked similarity score — the temperature-scaled softmax is tuned for contrastive ranking, not for calibration',
      ],
      facets: {
        task: ['representation', 'retrieval', 'classification'],
        dataType: ['image', 'text', 'multimodal'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'joint-image-text-embedding',
      },
      math: {
        latex: [
          '\\mathrm{sim}(i, t) = \\frac{e_i \\cdot e_t}{\\|e_i\\|\\,\\|e_t\\|}',
          '\\mathcal{L} = -\\frac{1}{2N}\\sum_{k=1}^{N}\\left[\\log\\frac{\\exp(\\mathrm{sim}(i_k,t_k)/\\tau)}{\\sum_{j=1}^N \\exp(\\mathrm{sim}(i_k,t_j)/\\tau)} + \\log\\frac{\\exp(\\mathrm{sim}(i_k,t_k)/\\tau)}{\\sum_{j=1}^N \\exp(\\mathrm{sim}(i_j,t_k)/\\tau)}\\right]',
        ],
        notes:
          'The loss is symmetric cross-entropy over an N x N similarity matrix built from one batch: the first term ' +
          "treats each image as a classification problem over the N captions present, the second does the reverse " +
          "for each caption over the N images. \\tau is not fixed by hand — CLIP learns it as a log-parameterized " +
          'scalar (see hyperparameters), which controls how peaked the softmax is over the batch. The best-performing ' +
          "encoder in the original paper is a ViT-L/14 (vision-transformer, Vulcan) fed with a BPE-tokenized " +
          "(byte-pair-encoding, Babel) 12-layer Transformer text encoder — CLIP is a direct application of both, not " +
          'a new architecture in either tower; the contribution is the contrastive objective connecting them.',
      },
      complexity: {
        train: 'O(N) encoder forward passes per batch of size N through the image and text towers, plus O(N^2) for the pairwise similarity matrix the contrastive loss is computed over',
        predict: 'O(1) — one image or text forward pass and a dot product against pre-computed candidate embeddings',
      },
      code: [
        'from transformers import CLIPModel, CLIPProcessor',
        'import torch',
        '',
        'model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")',
        'processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")',
        '',
        'labels = ["a photo of a cat", "a photo of a dog", "a photo of a car"]',
        'inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)',
        '',
        'with torch.no_grad():',
        '    outputs = model(**inputs)',
        '',
        'logits_per_image = outputs.logits_per_image   # temperature-scaled image-to-text similarity',
        'probs = logits_per_image.softmax(dim=1)        # zero-shot class probabilities',
      ].join('\n'),
      related: ['vision-transformer', 'byte-pair-encoding', 'self-attention', 'vision-language-models'],
      references: {
        free: [
          { title: 'Hugging Face — CLIP model documentation', url: 'https://huggingface.co/docs/transformers/en/model_doc/clip' },
        ],
        papers: [
          { title: 'Learning Transferable Visual Models From Natural Language Supervision', url: 'https://arxiv.org/abs/2103.00020', year: 2021 },
          { title: 'Scaling Up Visual and Vision-Language Representation Learning With Noisy Text Supervision', url: 'https://arxiv.org/abs/2102.05918', year: 2021 },
        ],
        books: [
          { title: 'Understanding Deep Learning', author: 'Prince', chapter: 'Ch. 14 — Unsupervised Learning', url: 'https://udlbook.github.io/udlbook/' },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'vision-language-models',
      name: 'Vision-Language Models',
      aliases: ['VLM', 'multimodal LLM', 'LMM (large multimodal model)'],
      tier: 1,
      year: 2022,
      difficulty: 4,
      hook: 'Gives a language model eyes: project image features into its token space and let it write about what it sees.',
      intuition:
        'A CLIP-style model can score how well an image matches a caption, but it cannot write a new sentence about ' +
        'the image — it only compares, it does not generate. Vision-language models close that gap by reusing a ' +
        "pretrained language model's ability to generate open-ended text and giving it eyes. An image encoder turns " +
        'a picture into a set of feature vectors; a connector module — sometimes a plain linear projection ' +
        '(LLaVA), sometimes a small cross-attention resampler (Flamingo, BLIP-2) — translates those vectors into the ' +
        "same kind of token embeddings the language model already expects, and slots them into the input sequence " +
        'alongside the text prompt. The language model then does what it always did: predict the next token, one at ' +
        'a time, except some of what it is conditioning on now describes pixels instead of words. Because the heavy ' +
        'lifting — world knowledge, grammar, reasoning — was already learned during text-only pretraining, VLMs need ' +
        'comparatively little paired image-text data to connect the two towers.',
      howItWorks: {
        summary:
          "Encode an image into visual features, project those features into the language model's token embedding " +
          'space, and let the language model generate text autoregressively conditioned on both the visual and text tokens.',
        steps: [
          'Encode the input image with a pretrained vision encoder (often a CLIP-style Vision Transformer) into a grid or sequence of visual feature vectors.',
          "Map those features into the language model's embedding space with a connector: a linear/MLP projection (LLaVA-style), or a cross-attention module that resamples them into a fixed number of tokens (Flamingo/BLIP-2-style).",
          "Concatenate or interleave the resulting visual tokens with the text prompt's token embeddings.",
          'Feed the combined sequence into a pretrained large language model, frozen or partially fine-tuned depending on the training stage.',
          'Generate the output text autoregressively, one token at a time, conditioned on all preceding visual and text tokens.',
          'Train with standard next-token cross-entropy computed only over the text targets — the visual tokens are conditioning context, never prediction targets.',
        ],
      },
      hyperparameters: [
        {
          name: 'number of visual tokens',
          what: 'How many tokens an image is compressed into before being handed to the language model.',
          tuning:
            'Fewer visual tokens make the LLM forward pass cheaper per image but can lose fine-grained detail. ' +
            'Resampler-based connectors (Flamingo, BLIP-2) fix this count independent of image resolution; ' +
            'patch-projection connectors (LLaVA) scale token count with resolution instead.',
        },
        {
          name: 'frozen vs. fine-tuned backbone',
          what: 'Whether the vision encoder and/or language model weights are kept frozen or updated during multimodal training.',
          tuning:
            "Freezing both and training only the connector is cheapest and best preserves the LLM's original text " +
            'abilities; unfreezing the LLM in a later stage (as LLaVA does) costs more compute but typically improves multimodal task performance.',
        },
      ],
      whenToUse: [
        'The task needs open-ended natural-language output conditioned on an image — captioning, visual question answering, chart/document reading, instruction-following over visual content',
        'You want one model that generalizes across many vision-plus-text tasks through natural-language prompting rather than a separate trained head per task',
        'You can reuse a pretrained vision encoder and a pretrained LLM rather than training a multimodal model from scratch',
        'The application benefits from few-shot or zero-shot prompting with interleaved images and text',
      ],
      whenNotToUse: [
        'The task is pure image-text similarity or retrieval with no generated language needed — a dual-encoder model like CLIP is cheaper and sufficient',
        'You need pixel-level or dense spatial output (segmentation masks, precise bounding boxes) — most VLMs emit text tokens, not dense visual predictions, without an added task-specific head',
        'Inference latency or cost is tightly constrained — decoding through a multi-billion-parameter LLM one token at a time costs far more than a single dual-encoder forward pass',
        'The visual input needs very high resolution or many video frames at once — most VLMs downsample or subsample, at a cost to fine-grained or temporal detail',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['image', 'text', 'multimodal'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-text-conditioned-on-image',
      },
      math: {
        latex: [
          'v_i = W_{\\text{proj}}\\, f_{\\text{vision}}(\\text{image})_i',
          'p(y_t \\mid y_{<t}, v_{1:M}) = \\mathrm{softmax}(W_o\\, h_t), \\qquad h_t = \\mathrm{LLM}([v_1, \\dots, v_M, y_1, \\dots, y_{t-1}])',
        ],
        notes:
          'The image enters only through v_{1:M}, a sequence of M projected visual tokens sitting in the same ' +
          'embedding space as text tokens — the language model has no architectural awareness that some of its ' +
          'input came from pixels rather than a tokenizer. Training minimizes next-token cross-entropy only over the ' +
          'text targets y_t; the visual tokens are conditioning context, never prediction targets, which is why no ' +
          'image-reconstruction loss appears anywhere in the pipeline. This reuses the same causal next-token ' +
          'machinery as text-only decoder pretraining (gpt-lineage, Genesis) — a VLM changes what can appear in the ' +
          'prefix, not how the model is trained to predict what comes next.',
      },
      complexity: {
        train: 'O(M + L) tokens through the language model per example, for M visual and L text tokens, dominated by self-attention cost of O((M+L)^2) per layer, plus one forward pass through the (often frozen) vision encoder',
        predict: 'O(L) sequential decoding steps, each attending over the full M+L context — the same autoregressive cost profile as text-only LLM inference, with a longer fixed prefix',
      },
      code: [
        'from transformers import AutoProcessor, LlavaForConditionalGeneration',
        'import torch',
        '',
        'model = LlavaForConditionalGeneration.from_pretrained("llava-hf/llava-1.5-7b-hf")',
        'processor = AutoProcessor.from_pretrained("llava-hf/llava-1.5-7b-hf")',
        '',
        'prompt = "USER: <image>\\nWhat\'s the content of the image? ASSISTANT:"',
        'inputs = processor(images=image, text=prompt, return_tensors="pt")',
        '',
        'generate_ids = model.generate(**inputs, max_new_tokens=30)',
        'processor.batch_decode(generate_ids, skip_special_tokens=True)[0]',
      ].join('\n'),
      related: ['clip-and-contrastive-pretraining', 'gpt-lineage', 'vision-transformer', 'unified-any-to-any-architectures'],
      references: {
        free: [
          { title: 'Hugging Face — Vision Language Models Explained', url: 'https://huggingface.co/blog/vlms' },
        ],
        papers: [
          { title: 'Flamingo: a Visual Language Model for Few-Shot Learning', url: 'https://arxiv.org/abs/2204.14198', year: 2022 },
          { title: 'Visual Instruction Tuning', url: 'https://arxiv.org/abs/2304.08485', year: 2023 },
        ],
        books: [
          {
            title: 'Probabilistic Machine Learning: Advanced Topics',
            author: 'Murphy',
            chapter: 'Ch. 32 — Representation Learning (§32.3.4 Multiview Representation Learning)',
            url: 'https://probml.github.io/pml-book/book2.html',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
    {
      id: 'audio-models',
      name: 'Audio Models',
      aliases: ['speech and audio foundation models', 'audio language models'],
      tier: 2,
      year: 2022,
      difficulty: 3,
      hook: 'Turns audio into a spectrogram or discrete tokens so a transformer can transcribe, translate, or generate sound.',
      intuition:
        'WaveNet (tcns-and-wavenet, Echo) showed a convolutional network can generate raw audio one sample at a time, ' +
        'predicting each sample from the ones before it — powerful, but every second of 16kHz audio is 16,000 ' +
        'separate predictions. Modern audio models mostly avoid modeling individual samples at all. For ' +
        'understanding, Whisper turns a waveform into a log-mel spectrogram — a picture of frequency over time — ' +
        'and feeds it to a standard encoder-decoder Transformer that reads out transcribed or translated text, ' +
        'trained on 680,000 hours of weakly-supervised multilingual audio so it generalizes across languages and ' +
        'accents without per-language fine-tuning. For generation, models like AudioLM first compress audio into a ' +
        'much shorter sequence of discrete tokens using a learned tokenizer, then treat audio generation as ordinary ' +
        'language modeling over those tokens — predicting the next token rather than the next raw sample — which is ' +
        'what lets it stay coherent over tens of seconds instead of a few thousand raw samples.',
      howItWorks: {
        summary:
          'Convert raw audio into a model-friendly representation — a spectrogram for understanding tasks, or a ' +
          'sequence of discrete tokens for generation — then process or generate that representation with a transformer.',
        steps: [
          'For understanding tasks (Whisper): compute a log-mel spectrogram from the raw waveform and feed it into an encoder-decoder Transformer that outputs text tokens for transcription, translation, or language identification.',
          'For generation tasks (AudioLM): first convert the waveform into a sequence of discrete tokens with a learned tokenizer/codec that separates coarse long-term structure from fine acoustic detail.',
          'Model that discrete token sequence autoregressively, as a language-modeling problem, predicting each next audio token from the tokens before it and any conditioning prompt.',
        ],
      },
      whenToUse: [
        'You need automatic transcription or translation across many languages without per-language fine-tuning (Whisper-style multitask encoder-decoder models)',
        'You need to generate novel speech or music continuations that preserve long-range structure like speaker identity, prosody, or melody, not just raw sample-level fidelity',
      ],
      whenNotToUse: [
        'You need the lowest-latency, sample-accurate raw waveform synthesis step (a vocoder) — a convolutional model like WaveNet, or a lighter modern vocoder, is more directly suited to that final synthesis stage than a tokenized language-modeling approach',
        'Your budget cannot support training or fine-tuning on hundreds of thousands of hours of audio, or running a large transformer at inference — a smaller task-specific model may be more practical',
      ],
      facets: {
        task: ['generation'],
        dataType: ['audio', 'text'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'transcribed-text-or-generated-audio',
      },
      related: ['tcns-and-wavenet', 'vision-language-models'],
      references: {
        free: [
          { title: 'Hugging Face — Whisper model documentation', url: 'https://huggingface.co/docs/transformers/en/model_doc/whisper' },
        ],
        papers: [
          { title: 'Robust Speech Recognition via Large-Scale Weak Supervision', url: 'https://arxiv.org/abs/2212.04356', year: 2022 },
          { title: 'AudioLM: a Language Modeling Approach to Audio Generation', url: 'https://arxiv.org/abs/2209.03143', year: 2022 },
        ],
      },
    },
    {
      id: 'video-and-world-models',
      name: 'Video & World Models',
      aliases: ['video generation models', 'world models', 'video diffusion'],
      tier: 2,
      year: 2018,
      difficulty: 4,
      hook: "Generates video by denoising space-time patches, or learns an environment's dynamics well enough to simulate it.",
      intuition:
        'This entry bundles two related but distinct ideas that both improved sharply once video-scale data and ' +
        'diffusion/transformer architectures arrived. Video generation asks: can a model produce a plausible video ' +
        "from a prompt? OpenAI's Sora represents video as a sequence of space-time patches in a compressed latent " +
        'space and trains a diffusion transformer to denoise those patches — the same denoising idea used for still ' +
        'images, extended across time. World models ask a different question: can a model learn the rules of an ' +
        "environment well enough to simulate it? Ha and Schmidhuber's original world model compressed observations " +
        'with a variational autoencoder and trained a recurrent network to predict what happens next, then trained ' +
        'a policy entirely inside that learned simulation — a "hallucinated dream" — before ever touching the real ' +
        "environment. Genie fuses both ideas: a video-generation model of playable worlds that responds to latent, " +
        'user-controlled actions frame by frame, turning the generated video itself into a controllable simulator.',
      howItWorks: {
        summary:
          'Either generate video by denoising a latent representation of space-time patches (diffusion), or learn a ' +
          "compact predictive model of an environment's dynamics that can be simulated forward for planning or interaction.",
        steps: [
          'Video generation (Sora-style): compress video into a lower-dimensional latent space, represent it as a sequence of space-time patches, and train a diffusion transformer to denoise those patches conditioned on a text prompt.',
          "World models (Ha & Schmidhuber-style): compress observations with an autoencoder, learn a recurrent dynamics model that predicts the next latent state given the current state and action, and train a compact controller on top of it.",
          'Interactive video world models (Genie-style): tokenize video frames, learn an autoregressive dynamics model over those tokens plus a latent action space, so a rollout can be steered frame by frame despite no ground-truth action labels during training.',
        ],
      },
      whenToUse: [
        'You need to generate novel, temporally coherent video from a text or image prompt for creative or prototyping use, accepting that physical accuracy is not guaranteed',
        "You want a learned, compressed simulator of an environment's dynamics to train or evaluate a control/planning agent cheaply, without querying the real environment or a hand-built simulator every step",
      ],
      whenNotToUse: [
        "You need a physically accurate or verifiable simulation — current video/world models are not reliable physics engines; OpenAI's own Sora report describes failures such as objects not changing state correctly during interactions",
        'You need frame-accurate, low-latency interactive control at high resolution — interactive world models like Genie trade off resolution, speed, and fidelity, and pure video-diffusion generation is far from real-time',
      ],
      facets: {
        task: ['generation', 'control'],
        dataType: ['video', 'image'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-video-or-simulated-environment-state',
      },
      // latent-and-score-based-diffusion: Sora is described (Lil'Log, below) as a diffusion
      // transformer denoising video/image latents — the same latent-diffusion mechanism, applied
      // across time. mdps-and-bellman-equation: Ha & Schmidhuber's world model is explicitly a
      // learned transition model — the next-state predictor at the center of an MDP.
      related: ['latent-and-score-based-diffusion', 'mdps-and-bellman-equation'],
      references: {
        free: [
          { title: "Lil'Log — Diffusion Models for Video Generation", url: 'https://lilianweng.github.io/posts/2024-04-12-diffusion-video/' },
        ],
        papers: [
          { title: 'World Models', url: 'https://arxiv.org/abs/1803.10122', year: 2018 },
          { title: 'Genie: Generative Interactive Environments', url: 'https://arxiv.org/abs/2402.15391', year: 2024 },
        ],
      },
    },
    {
      id: 'unified-any-to-any-architectures',
      name: 'Unified Any-to-Any Architectures',
      aliases: ['any-to-any multimodal models', 'omni-modal models', 'composable multimodal generation'],
      tier: 2,
      year: 2023,
      difficulty: 4,
      hook: 'One model, any mix of text, image, audio or video in, any mix of them out, via a shared latent space.',
      intuition:
        'CLIP aligns two modalities for comparison; a vision-language model turns image-plus-text into more text. ' +
        'Any-to-any architectures generalize the pattern further: one model that takes a mix of text, image, audio, ' +
        'or video as input and produces a mix of any of those as output, not just one fixed pair. The trick is a ' +
        'shared representation space that every modality-specific encoder maps into and every modality-specific ' +
        'decoder maps out of, so alignment learned for one pair of modalities partially transfers to combinations ' +
        'never jointly observed during training — CoDi calls this "composable" generation, built by bridging ' +
        "alignment inside the diffusion process itself. NExT-GPT takes a more LLM-centered route: a language model " +
        'sits at the center, lightweight adapters translate other modalities in, and separate pretrained diffusion ' +
        "decoders translate the LLM's intent back out into image, audio, or video, with only a small fraction of " +
        'parameters actually trained. Both are early, research-stage systems — broad modality coverage, not yet ' +
        'matched in quality against dedicated single-modality specialists.',
      howItWorks: {
        summary:
          'Encode each input modality into a shared representation space, then decode from that shared space into ' +
          'any requested output modality, so no fixed input-output modality pair has to be trained explicitly.',
        steps: [
          'Encode each available input modality (text, image, audio, video) with its own encoder into a shared, aligned representation space.',
          'Condition modality-specific decoders (diffusion decoders for image/audio/video, a language model for text) on that shared representation to generate each requested output modality.',
          'Train the cross-modal alignment so combinations absent from the paired training data can still be generated by composing the shared space, rather than requiring every input-output pair to have been observed together.',
        ],
      },
      whenToUse: [
        'The application needs a single model to understand and generate across more than two modalities (e.g. text, image, audio, video) rather than chaining separate specialist models together',
        'You need to generate a modality combination not directly present in your paired training data — architectures like CoDi are explicitly designed to compose modalities never jointly observed during training',
      ],
      whenNotToUse: [
        'The task only involves one input and one output modality — a dedicated specialist model (a text-to-image diffusion model, or a dedicated ASR model) will typically outperform a general any-to-any model on that single pair',
        'You need production-grade reliability and quality matched to state-of-the-art single-modality systems — any-to-any generalist architectures are a young, fast-moving research direction that commonly trades per-modality quality for breadth',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['multimodal', 'text', 'image', 'audio', 'video'],
        dataSize: ['massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-content-in-arbitrary-modality-combination',
      },
      related: ['vision-language-models', 'gpt-lineage', 'causal-vs-masked-language-modeling'],
      references: {
        papers: [
          { title: 'Any-to-Any Generation via Composable Diffusion', url: 'https://arxiv.org/abs/2305.11846', year: 2023 },
          { title: 'NExT-GPT: Any-to-Any Multimodal LLM', url: 'https://arxiv.org/abs/2309.05519', year: 2023 },
        ],
      },
    },
  ],
} satisfies Body;
