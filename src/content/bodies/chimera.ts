/**
 * Chimera — Generative Models. See PLAN.md §3 for the full moon list (8 moons: 5 Tier 1, 3 Tier 2).
 *
 * The eight moons trace one taxonomy — "how do you generate data?" — as a sequence of answers,
 * each motivated by a limitation of the one before it:
 *   autoencoders                      compress-then-reconstruct, but NOT reliably sample-able
 *   variational-autoencoders          fixes that: a probabilistic latent space you CAN sample
 *   gans                              a different fix entirely: adversarial training, no explicit
 *                                     likelihood at all, sharp samples, notoriously unstable
 *   dcgan-stylegan-cyclegan           three separate, separately-citable advances built on GANs
 *   normalizing-flows                 a third paradigm: exact likelihood via invertible transforms
 *   autoregressive-generation         exact likelihood too, but via chain-rule factorization —
 *                                     the direct conceptual ancestor of how LLMs generate text
 *   diffusion-models-ddpm             forward-noise / reverse-denoise; trained via a variational
 *                                     bound, closely related to VAEs
 *   latent-and-score-based-diffusion  two distinct advances beyond vanilla DDPM: diffusing in a
 *                                     compressed latent space (Rombach — enables Stable Diffusion),
 *                                     and a continuous-time SDE reframing (Song) that unifies DDPM
 *                                     and score-matching as two discretizations of one process
 *
 * `eraRange` spans 1986 (autoencoders — see the dating note below) to 2021 (Song et al.'s
 * score-based SDE paper, ICLR 2021 — the earlier-venue-year half of latent-and-score-based-
 * diffusion's two bundled contributions).
 *
 * Every claim below was researched per CONTENT_GUIDE §3 — search, open a real source, verify every
 * URL, then write — with heavy use of Lil'Log (lilianweng.github.io), the CS231n generative-models
 * notes, d2l.ai's GAN/DCGAN chapters, and Understanding Deep Learning's chapter structure, all from
 * CONTENT_GUIDE §5's vetted list, plus arXiv `/abs/` pages and ar5iv HTML renderings (real extracted
 * text, not a PDF-fetch guess) for every paper-specific number quoted below (T=1000 in DDPM; DCGAN's
 * lr=0.0002/beta1=0.5; the exact architectural-guideline phrasing).
 *
 * ⚠️ No PDF-fetch failures were hit in this batch — every source used was HTML: arXiv `/abs/` pages,
 * ar5iv HTML paper renderings, d2l.ai/CS231n/Lil'Log doc pages, and one CrossRef DOI lookup (Baldi &
 * Hornik 1989, 10.1016/0893-6080(89)90014-2, confirmed via api.crossref.org directly). One MIT Press
 * chapter-metadata page (direct.mit.edu, for Rumelhart/Hinton/Williams 1986) returned HTTP 403 on
 * fetch — per CONTENT_GUIDE §3 a 403 means refused, not wrong — so that book reference is cited from
 * the exact metadata already returned in the search result itself (title/authors/book/pages/year all
 * matched verbatim across multiple independent listings) rather than re-opened, and its `url` is
 * omitted rather than pointing at a page never actually loaded.
 *
 * Year-dating choices, documented per sol.ts/jupiter.ts precedent:
 *   - autoencoders: 1986. The single-hidden-layer network trained to reconstruct its own input via
 *     backpropagation is standardly traced to Rumelhart, Hinton & Williams's 1986 PDP chapter
 *     ("Learning Internal Representations by Error Propagation," in Parallel Distributed Processing
 *     Vol. 1, pp. 318-362) — confirmed consistently across independent sources (IBM, ScienceDirect,
 *     and Schmidhuber's 2015 survey, arXiv:1404.7828). Schmidhuber's survey specifically dates
 *     autoencoder *hierarchies* to 1987 (Ballard) and the nonlinear-PCA framing to Kramer (1991);
 *     this entry is dated to the earlier, more foundational 1986 origin of the reconstruct-your-own-
 *     input architecture itself, with the PCA-equivalence result (Baldi & Hornik, 1989 — linear case
 *     only) cited separately as the entry's `papers` reference.
 *   - variational-autoencoders: 2014, the ICLR publication year, not 2013. Kingma & Welling's arXiv
 *     preprint (1312.6114) was posted 20 Dec 2013, but the peer-reviewed venue is ICLR 2014 (14-16
 *     Apr 2014, Banff) — confirmed via the arXiv abs page's submission-history and independently via
 *     search-corroborated ICLR citation metadata. This project consistently dates entries to their
 *     official publication venue rather than preprint date elsewhere (e.g. jupiter.ts's hdbscan uses
 *     the 2013 conference year, not an earlier preprint), so the same convention is followed here —
 *     this is exactly the "off-by-one" ambiguity CONTENT_GUIDE flagged for this paper specifically.
 *   - dcgan-stylegan-cyclegan: 2016, DCGAN's ICLR publication year (arXiv Nov 2015) — the earliest
 *     of the three bundled papers by both preprint and venue date (StyleGAN: CVPR 2019, arXiv Dec
 *     2018; CycleGAN: ICCV 2017, arXiv Mar 2017), and the one the entry's name lists first.
 *   - normalizing-flows: 2015, Rezende & Mohamed's ICML publication year (matches arXiv submission
 *     year exactly, no ambiguity).
 *   - autoregressive-generation: 2016, van den Oord et al.'s PixelRNN/PixelCNN ICML publication year
 *     (matches arXiv submission year). The general chain-rule idea long predates this (n-gram
 *     language models, ARMA-style factorizations), but this body is specifically about deep
 *     generative modeling techniques, and 2016 is the paper that introduced the modern deep-net
 *     instantiation this entry actually describes — the same "date to the modern instantiation, not
 *     the ancient statistical root" convention sol.ts uses for loss-functions (dated to Huber 1964,
 *     not Gauss's 18th-century least squares).
 *   - diffusion-models-ddpm: 2020, Ho, Jain & Abbeel's NeurIPS publication year (matches arXiv
 *     submission year, no ambiguity).
 *   - latent-and-score-based-diffusion: 2021, Song et al.'s ICLR publication year — the earlier of
 *     the two bundled contributions by venue year (Song: ICLR 2021; Rombach et al.'s latent
 *     diffusion: CVPR 2022, arXiv Dec 2021), even though Rombach's paper is the one commonly
 *     credited with directly enabling Stable Diffusion. Documented explicitly because it would be
 *     easy to instead anchor this entry to the more famous of the two contributions; the dating
 *     convention used consistently elsewhere in this file is chronological priority, not fame.
 *
 * Cross-linking: pca (Saturn, merged) <-> autoencoders is the Baldi & Hornik (1989) equivalence,
 * stated carefully as a linear-case-only result, not a blanket claim. variational-inference
 * (Neptune, merged) <-> variational-autoencoders AND <-> diffusion-models-ddpm are both genuine:
 * Ho, Jain & Abbeel's own paper states its objective is a variational bound, the same family a VAE
 * optimizes. convolution-and-pooling (vulcan, this batch) <-> dcgan-stylegan-cyclegan is genuine:
 * DCGAN's entire contribution is a set of convolutional-architecture rules for stable GAN training.
 * self-attention (Nova, existing) <-> autoregressive-generation is a real, careful forward link —
 * modern autoregressive text generation replaces PixelRNN/PixelCNN's recurrent/convolutional
 * conditioning with causal self-attention, same chain-rule factorization, different function class
 * for the conditional — with an explicit `//` comment where a body that doesn't exist yet (Genesis,
 * for LLM-specific pretraining/architecture) would otherwise be the more precise target.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'chimera',
  name: 'Chimera',
  segment: 'Generative Models',
  hook: 'How do you generate data? Eight answers, each motivated by what the last one could not do.',
  summary:
    'Chimera collects the major paradigms for generating new data rather than predicting a label: compress-and-reconstruct ' +
    'architectures, probabilistic and adversarial latent-variable models, exact-likelihood alternatives, and the ' +
    'noise-based diffusion process behind modern image generators.',
  eraRange: [1986, 2021],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'autoencoders',
      name: 'Autoencoders',
      aliases: ['AE', 'autoassociative neural network'],
      tier: 1,
      year: 1986,
      difficulty: 2,
      hook: "Squeezes data through a narrow bottleneck and learns to rebuild it — but the bottleneck isn't built for sampling.",
      intuition:
        'An autoencoder is two networks glued together: an encoder that squeezes an input down to a small vector, and a ' +
        'decoder that tries to rebuild the original input from that vector alone. Train both jointly to minimize ' +
        'reconstruction error, and the network is forced to keep only whatever information is most useful for ' +
        'reconstructing typical inputs — a compressed representation, not a copy. This makes autoencoders good at ' +
        'dimensionality reduction and denoising. But a plain autoencoder is not, in the usual sense, a generative model: ' +
        'nothing in its training objective makes the latent space smooth, continuous, or shaped like any distribution you ' +
        'could sample from. Feed the decoder a random vector instead of a real encoding and it will usually produce ' +
        'garbage, because the decoder only ever learned to decode the specific, scattered points the encoder happened to ' +
        'place there. That gap — a useful compressed space with no way to sample new points from it — is exactly what ' +
        'the variational autoencoder was built to close.',
      howItWorks: {
        summary:
          'Train an encoder and decoder jointly to minimize the error between the original input and its reconstruction ' +
          'after passing through a low-dimensional bottleneck.',
        steps: [
          'Feed an input through the encoder network to produce a low-dimensional latent vector (the bottleneck).',
          'Feed that latent vector through the decoder network to produce a reconstruction.',
          'Compute a reconstruction loss (mean squared error for continuous data, cross-entropy for binary/pixel data) between the input and the reconstruction.',
          'Backpropagate through both networks and update their weights jointly to minimize that loss.',
          'Discard the decoder after training if the goal is a compressed representation; keep both for reconstruction or denoising.',
        ],
      },
      hyperparameters: [
        {
          name: 'latent dimension (bottleneck size)',
          what: 'Size of the compressed representation the encoder must fit the input through.',
          tuning:
            'Too large and the network can approach the identity function, learning nothing useful; too small and ' +
            'reconstruction error rises because information is genuinely lost. Search by tracking reconstruction loss ' +
            'and, if the representation feeds a downstream task, that task\'s performance.',
        },
        {
          name: 'denoising / regularization',
          what: 'Constraints added on top of plain reconstruction to force a more useful representation.',
          tuning:
            'A denoising autoencoder corrupts the input before encoding and reconstructs the clean version, which by ' +
            'itself is often enough to prevent the trivial identity solution even with a generous bottleneck size.',
        },
      ],
      whenToUse: [
        "You need dimensionality reduction or feature learning for structured, non-linear data where PCA's linear subspace is too restrictive",
        'You want an unsupervised anomaly detector — reconstruction error is high for inputs unlike anything in training',
        'You want to denoise data by training the decoder to reconstruct a clean version from a corrupted input',
      ],
      whenNotToUse: [
        "You need to generate new, realistic samples — a plain autoencoder's latent space has no guarantee of being smooth or sample-able; use a variational autoencoder instead",
        'The data is genuinely linear and low-dimensional — plain PCA gives the same subspace with a closed-form solution and no training instability',
      ],
      facets: {
        task: ['dimensionality-reduction', 'anomaly-detection', 'representation'],
        dataType: ['tabular', 'image'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'compressed-latent-representation',
      },
      math: {
        latex: [
          'x \\approx d_\\theta(e_\\phi(x))',
          '\\mathcal{L}(\\theta,\\phi) = \\frac{1}{n}\\sum_{i=1}^{n} \\lVert x_i - d_\\theta(e_\\phi(x_i)) \\rVert^2',
        ],
        notes:
          'Baldi and Hornik (1989) proved that when the encoder and decoder are both linear and the loss is squared ' +
          'error, the optimal bottleneck spans exactly the same subspace as the top principal components found by PCA ' +
          "— a genuine equivalence, not an analogy, though the autoencoder's solution is unique only up to an arbitrary " +
          "rotation/rescaling of that subspace, unlike PCA's orthogonal, variance-ranked components. Nonlinear encoders " +
          'and decoders are what let autoencoders capture structure a linear projection cannot represent at all.',
      },
      complexity: {
        train: 'O(n · cost of one encoder+decoder forward/backward pass) per epoch — dominated by network size, no closed form',
        predict: 'O(cost of one encoder forward pass) to obtain the latent code',
      },
      code: [
        'import torch.nn as nn',
        '',
        'class Autoencoder(nn.Module):',
        '    def __init__(self, input_dim, latent_dim):',
        '        super().__init__()',
        '        self.encoder = nn.Sequential(nn.Linear(input_dim, 256), nn.ReLU(), nn.Linear(256, latent_dim))',
        '        self.decoder = nn.Sequential(nn.Linear(latent_dim, 256), nn.ReLU(), nn.Linear(256, input_dim))',
        '',
        '    def forward(self, x):',
        '        z = self.encoder(x)',
        '        return self.decoder(z)',
        '',
        'model = Autoencoder(input_dim=784, latent_dim=32)',
        'loss_fn = nn.MSELoss()',
        'recon = model(x)',
        'loss = loss_fn(recon, x)              # reconstruct the input itself -- no labels needed',
      ].join('\n'),
      // pca (Saturn) is the genuine linear-case equivalence (Baldi & Hornik 1989), not decoration;
      // variational-autoencoders is the direct fix for the sampling gap this entry ends on.
      related: ['pca', 'variational-autoencoders', 'svd-and-truncated-svd'],
      references: {
        free: [{ title: 'Building Autoencoders in Keras (François Chollet)', url: 'https://blog.keras.io/building-autoencoders-in-keras.html' }],
        papers: [
          {
            title: 'Neural Networks and Principal Component Analysis: Learning from Examples Without Local Minima',
            url: 'https://doi.org/10.1016/0893-6080(89)90014-2',
            year: 1989,
          },
        ],
        books: [
          {
            title: 'Learning Internal Representations by Error Propagation',
            author: 'Rumelhart, Hinton & Williams',
            chapter: 'in Parallel Distributed Processing: Explorations in the Microstructures of Cognition, Vol. 1 (1986), pp. 318–362',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'variational-autoencoders',
      name: 'Variational Autoencoders',
      aliases: ['VAE'],
      tier: 1,
      year: 2014,
      difficulty: 4,
      hook: "Makes the autoencoder's latent space a probability distribution, so you can finally sample new data from it.",
      intuition:
        "A plain autoencoder's latent space is a scattered cloud of points with gaps everywhere reconstruction was never " +
        'trained to fill. A variational autoencoder fixes this by making the encoder output a distribution instead of a ' +
        "single point — typically a Gaussian's mean and variance — and adding a second term to the loss that pulls " +
        'every one of those distributions toward a shared, simple prior, usually a standard normal. Two forces now ' +
        "compete: reconstruction wants each input's distribution parked exactly where it needs to be to decode well, " +
        'and the prior penalty wants every distribution pulled toward the same centre and spread. The tug-of-war ' +
        'between them is what makes the latent space continuous and densely packed, so a random point sampled from the ' +
        "prior lands somewhere the decoder has actually learned to decode. Because sampling from a distribution isn't " +
        'differentiable, VAEs train through it with the reparameterization trick: sample noise separately, then compute ' +
        "the latent point as a deterministic function of that noise and the encoder's outputs.",
      howItWorks: {
        summary:
          'Train an encoder that outputs a distribution over latent codes and a decoder that reconstructs from a sample ' +
          'of that distribution, optimizing reconstruction quality together with a KL-divergence penalty pulling every ' +
          'encoded distribution toward a shared prior.',
        steps: [
          'Encoder maps input x to the parameters (mean, variance) of an approximate posterior q(z|x), typically Gaussian.',
          'Sample a latent vector z from q(z|x) via the reparameterization trick: z = mean + std * epsilon, epsilon ~ N(0, I).',
          'Decoder maps z to a reconstruction of x.',
          'Compute the loss as reconstruction error minus a KL-divergence penalty between q(z|x) and the prior p(z) — together the evidence lower bound (ELBO).',
          'Backpropagate through the reparameterized sample to update encoder and decoder jointly.',
          'To generate new samples after training, discard the encoder, sample z from the prior p(z) directly, and decode it.',
        ],
      },
      hyperparameters: [
        {
          name: 'latent dimension',
          what: 'Size of the latent space, now also the dimensionality of the prior distribution.',
          tuning: 'Same tradeoff as a plain autoencoder — too small loses information, too large gives the KL term more room to be ignored.',
        },
        {
          name: 'KL weight (beta, as in beta-VAE)',
          what: "Scales the KL term's contribution relative to reconstruction loss.",
          tuning:
            'beta=1 recovers the original ELBO. Raising beta pushes the latent space closer to the prior and tends to ' +
            'produce more disentangled but blurrier reconstructions — the beta-VAE tradeoff.',
        },
      ],
      whenToUse: [
        'You need to generate new, plausible samples, not just compress and reconstruct existing ones',
        'You want a smooth, structured latent space to interpolate between examples or compute a likelihood-like quantity',
        "Training stability matters more than sample sharpness — VAEs optimize a single well-behaved objective, unlike the adversarial minimax game GANs need",
      ],
      whenNotToUse: [
        'Sample sharpness is the priority — VAEs are well known to produce blurrier samples than GANs or diffusion models, a direct consequence of optimizing a lower bound on likelihood rather than matching the data distribution exactly',
        'The latent space needs to be low-dimensional and exactly linear/orthogonal — plain PCA is simpler and sufficient',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['image', 'tabular'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-samples-and-latent-representation',
      },
      math: {
        latex: [
          '\\log p_\\theta(x) \\ge \\mathbb{E}_{q_\\phi(z|x)}[\\log p_\\theta(x|z)] - D_{KL}(q_\\phi(z|x) \\,\\|\\, p(z))',
          'z = \\mu_\\phi(x) + \\sigma_\\phi(x) \\odot \\epsilon, \\quad \\epsilon \\sim \\mathcal{N}(0, I)',
        ],
        notes:
          "The right-hand side of the first line is the evidence lower bound (ELBO). Kingma and Welling's key " +
          'contribution was showing that the reparameterization trick in the second line turns sampling from q into a ' +
          'deterministic, differentiable function of epsilon, so the whole ELBO can be optimized with ordinary ' +
          'stochastic gradient descent instead of a much higher-variance score-function estimator. When q(z|x) and ' +
          'p(z) are both Gaussian, the KL term has a closed form, which is why Gaussian priors and posteriors are the ' +
          'default choice.',
      },
      complexity: {
        train: 'O(n · cost of one encoder+decoder forward/backward pass) per epoch — the same order as a plain autoencoder; reparameterization adds negligible overhead',
        predict: 'O(cost of one decoder forward pass) per generated sample, given a latent vector drawn from the prior',
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        '',
        'class VAE(nn.Module):',
        '    def __init__(self, input_dim, latent_dim):',
        '        super().__init__()',
        '        self.enc = nn.Sequential(nn.Linear(input_dim, 256), nn.ReLU())',
        '        self.mu, self.logvar = nn.Linear(256, latent_dim), nn.Linear(256, latent_dim)',
        '        self.decoder = nn.Sequential(nn.Linear(latent_dim, 256), nn.ReLU(), nn.Linear(256, input_dim))',
        '',
        '    def forward(self, x):',
        '        h = self.enc(x)',
        '        mu, logvar = self.mu(h), self.logvar(h)',
        '        z = mu + torch.exp(0.5 * logvar) * torch.randn_like(mu)   # reparameterization trick',
        '        return self.decoder(z), mu, logvar',
        '',
        '# loss = reconstruction_loss(recon, x) + kl_divergence(mu, logvar)   # negative ELBO',
      ].join('\n'),
      // variational-inference (Neptune) is the genuine general framework VAEs are one specific
      // instance of -- the ELBO here IS that entry's central object; diffusion-models-ddpm shares
      // the same variational-bound training principle, not just a superficial resemblance.
      related: ['autoencoders', 'variational-inference', 'gans', 'diffusion-models-ddpm'],
      references: {
        free: [{ title: "Lil'Log — From Autoencoder to Beta-VAE", url: 'https://lilianweng.github.io/posts/2018-08-12-vae/' }],
        papers: [
          {
            title: 'Auto-Encoding Variational Bayes',
            url: 'https://arxiv.org/abs/1312.6114',
            year: 2014,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 17 — Variational Autoencoders',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'gans',
      name: 'GANs',
      aliases: ['generative adversarial networks'],
      tier: 1,
      year: 2014,
      difficulty: 4,
      hook: 'Trains a forger against a detective until the forgeries are good enough to fool it — and calls that generation.',
      intuition:
        'A GAN pits two networks against each other. The generator takes random noise and tries to turn it into something ' +
        "that looks like real data. The discriminator sees a mix of real examples and the generator's fakes and tries " +
        'to tell them apart. Train both at once: the discriminator gets sharper at spotting fakes, which forces the ' +
        "generator to get better at fooling it, and around again. Neither network trains against a reconstruction " +
        "target or an explicit likelihood — the generator's only signal is whether it fooled the discriminator this " +
        "round. At the theoretical equilibrium the generator's output distribution exactly matches the real data " +
        'distribution, and the discriminator can do no better than a coin flip. Reaching that equilibrium in practice ' +
        'is hard, because the two networks chase a moving target rather than descend a fixed loss surface — the root ' +
        'of GANs\' well-documented instability: mode collapse, where the generator finds a few outputs that reliably ' +
        'fool the discriminator and stops exploring the rest of the distribution, and outright non-convergence, where ' +
        'the two networks oscillate instead of settling.',
      howItWorks: {
        summary:
          'Train a generator to map random noise to fake samples and a discriminator to distinguish real samples from ' +
          'fakes, alternating updates so each network improves against the other.',
        steps: [
          'Sample random noise z from a simple prior (e.g. standard normal) and pass it through the generator to produce a fake sample G(z).',
          'Sample a batch of real data and a batch of fakes; feed both to the discriminator, which outputs a probability that each input is real.',
          'Update the discriminator to maximize its accuracy at separating real from fake.',
          'Update the generator to maximize the probability that the discriminator misclassifies its fakes as real.',
          'Alternate discriminator and generator updates for many iterations — there is no single shrinking loss whose minimum marks "done" the way a reconstruction loss would.',
        ],
      },
      hyperparameters: [
        {
          name: 'learning rate (generator and discriminator, often separate)',
          what: "Step size for each network's optimizer.",
          tuning:
            "Radford, Metz & Chintala's DCGAN paper reports Adam with learning rate 0.0002 and beta1=0.5 (reduced " +
            'from Adam\'s suggested 0.9) as a stable practical default for convolutional GANs, widely reused since.',
        },
        {
          name: 'discriminator updates per generator update',
          what: 'How many discriminator steps run for each generator step.',
          tuning:
            'The original GAN paper trains the discriminator for k steps per generator step; raising k gives the ' +
            "discriminator more of an edge, which can stabilize training but also starve the generator's gradient " +
            'signal if pushed too far.',
        },
      ],
      whenToUse: [
        'You need sharp, high-fidelity samples and can tolerate a harder, less stable training process to get them',
        'You do not need an explicit likelihood or density estimate — only realistic samples',
        'You have enough compute and data to run the generator/discriminator balancing act for many iterations, including hyperparameter search to avoid collapse',
      ],
      whenNotToUse: [
        'Training stability and reproducibility matter more than sample sharpness — VAEs or diffusion models converge more reliably to a comparable result',
        'You need a density or likelihood value for a given sample, e.g. for anomaly scoring — a vanilla GAN has no tractable way to compute p(x)',
        'You cannot afford to babysit training for mode collapse and non-convergence, both still open, well-documented problems more than a decade after the original paper',
      ],
      facets: {
        task: ['generation'],
        dataType: ['image'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-samples',
      },
      math: {
        latex: [
          '\\min_G \\max_D \\; \\mathbb{E}_{x \\sim p_{data}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]',
        ],
        notes:
          "Goodfellow et al. prove that for a fixed, optimal discriminator, minimizing the generator's objective is " +
          "equivalent to minimizing the Jensen-Shannon divergence between the generator's distribution and the true " +
          'data distribution, and that this minimax game has a unique global optimum where the two distributions ' +
          'coincide and D(x)=1/2 everywhere. That proof assumes both networks have unlimited capacity and are trained ' +
          'to convergence at every step — an idealization the alternating-gradient-descent procedure used in practice ' +
          'does not actually satisfy, which is the theoretical seam training instability falls through.',
      },
      complexity: {
        train:
          'O(n · cost of one generator+discriminator forward/backward pass) per iteration, run for as many iterations ' +
          'as it takes to reach an acceptable, hand-judged equilibrium — no convergence criterion analogous to a ' +
          'shrinking loss exists',
        predict: 'O(cost of one generator forward pass) per generated sample',
      },
      code: [
        'import torch',
        '',
        '# one alternating training step, generator G and discriminator D already defined',
        'z = torch.randn(batch_size, latent_dim)',
        'fake = G(z)',
        '',
        '# discriminator step: tell real from fake',
        'd_loss = -(torch.log(D(real)).mean() + torch.log(1 - D(fake.detach())).mean())',
        'd_loss.backward(); d_opt.step(); d_opt.zero_grad()',
        '',
        '# generator step: fool the discriminator',
        'g_loss = -torch.log(D(G(z))).mean()          # non-saturating variant, not log(1 - D(G(z)))',
        'g_loss.backward(); g_opt.step(); g_opt.zero_grad()',
      ].join('\n'),
      // dcgan-stylegan-cyclegan are the direct architectural/training advances built on this
      // framework; variational-autoencoders and normalizing-flows are the two genuinely different
      // paradigms this entry's whenNotToUse points toward.
      related: ['dcgan-stylegan-cyclegan', 'variational-autoencoders', 'normalizing-flows', 'loss-functions'],
      references: {
        free: [{ title: 'Dive into Deep Learning — Generative Adversarial Networks', url: 'https://d2l.ai/chapter_generative-adversarial-networks/gan.html' }],
        papers: [
          {
            title: 'Generative Adversarial Networks',
            url: 'https://arxiv.org/abs/1406.2661',
            year: 2014,
          },
          {
            title: 'Improved Techniques for Training GANs',
            url: 'https://arxiv.org/abs/1606.03498',
            year: 2016,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 15 — Generative Adversarial Networks',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'dcgan-stylegan-cyclegan',
      name: 'DCGAN / StyleGAN / CycleGAN',
      aliases: ['DCGAN', 'StyleGAN', 'CycleGAN'],
      tier: 2,
      year: 2016,
      difficulty: 3,
      hook: 'Three separate GAN advances: stable convolutions, style-based faces, and image translation without paired data.',
      intuition:
        'These three papers each solved a separate problem for GANs, and blurring them together loses what each ' +
        'actually contributed. DCGAN is not a new kind of GAN — it is a set of architectural rules (strided ' +
        'convolutions instead of pooling, batch normalization in both networks, ReLU in the generator, LeakyReLU in ' +
        'the discriminator) that made convolutional GANs train reliably, at a moment when GANs were notoriously ' +
        "unstable. StyleGAN reworks the generator itself: instead of feeding noise straight in, a mapping network " +
        "turns it into a 'style' vector injected at every resolution via adaptive instance normalization, which " +
        'disentangles coarse attributes (pose, identity) from fine detail (freckles, hair) and gives controllable, ' +
        'high-fidelity faces. CycleGAN solves a completely different problem — translating images between two domains ' +
        '(horses to zebras, photos to paintings) when no paired examples exist — by training two generators back to ' +
        "back and penalizing a translated image that doesn't cycle back to the original.",
      howItWorks: {
        summary:
          'DCGAN constrains the generator/discriminator to specific convolutional architecture choices for training ' +
          "stability; StyleGAN injects a learned style vector at every layer of the generator; CycleGAN trains two " +
          'generator/discriminator pairs with a cycle-consistency loss enforcing that translating and translating back ' +
          'recovers the original image.',
        steps: [
          'DCGAN: replace pooling with strided/fractionally-strided convolutions, use batch normalization in generator and discriminator, and remove fully connected hidden layers.',
          'StyleGAN: pass noise through a mapping network to get a style vector, then inject that style at every resolution of the generator via adaptive instance normalization instead of feeding it in only once at the input.',
          "CycleGAN: train a generator G: X→Y and a generator F: Y→X together with domain discriminators, adding a cycle-consistency loss penalizing ‖F(G(x)) − x‖ and ‖G(F(y)) − y‖ so unpaired translation stays faithful to content.",
        ],
      },
      whenToUse: [
        'You are building or debugging a convolutional GAN and need stable, well-tested architectural defaults to start from (DCGAN)',
        'You need fine-grained, disentangled control over generated image attributes at different scales, e.g. face synthesis (StyleGAN)',
        'You want to translate between two image domains and have no paired examples linking them (CycleGAN)',
      ],
      whenNotToUse: [
        "You have paired input/output examples for translation — a supervised image-to-image method uses the pairing directly and outperforms CycleGAN's unpaired approach when pairs exist",
        'You need the theoretical simplicity of the original GAN objective for research or teaching — these are practical engineering advances layered on top, not changes to the underlying minimax game',
      ],
      facets: {
        task: ['generation'],
        dataType: ['image'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-or-translated-images',
      },
      // convolution-and-pooling (vulcan, this batch) is a genuine mechanical link, not decoration:
      // DCGAN's entire contribution is a set of convolutional-architecture rules for stable training.
      related: ['gans', 'convolution-and-pooling'],
      references: {
        free: [{ title: 'Dive into Deep Learning — Deep Convolutional Generative Adversarial Networks', url: 'https://d2l.ai/chapter_generative-adversarial-networks/dcgan.html' }],
        papers: [
          {
            title: 'Unsupervised Representation Learning with Deep Convolutional Generative Adversarial Networks',
            url: 'https://arxiv.org/abs/1511.06434',
            year: 2016,
          },
          {
            title: 'A Style-Based Generator Architecture for Generative Adversarial Networks',
            url: 'https://arxiv.org/abs/1812.04948',
            year: 2019,
          },
          {
            title: 'Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks',
            url: 'https://arxiv.org/abs/1703.10593',
            year: 2017,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'normalizing-flows',
      name: 'Normalizing Flows',
      aliases: ['flow-based generative models'],
      tier: 2,
      year: 2015,
      difficulty: 4,
      hook: 'Chains invertible transforms into a complex distribution with an exact, tractable likelihood — no adversary.',
      intuition:
        'GANs never tell you how likely a given data point is under the model, and VAEs only give you a lower bound on ' +
        'that likelihood. Normalizing flows give you the real number, exactly. Start from a simple distribution, like a ' +
        'standard Gaussian, and pass a sample through a chain of carefully designed invertible functions — each one ' +
        'computable forward (to generate) and backward (to evaluate density), with a Jacobian determinant cheap enough ' +
        'to compute at every step. The change-of-variables formula from probability theory then tells you exactly how ' +
        "the density warps at each step, so the model's likelihood of any data point is available in closed form, not " +
        'estimated or bounded. Training is direct maximum likelihood: no adversary, no variational bound, just ' +
        'gradient ascent on the exact log-likelihood the invertibility guarantees you can compute.',
      howItWorks: {
        summary:
          'Model data as a simple base distribution passed through a chain of invertible, differentiable ' +
          'transformations, and train by maximizing the exact log-likelihood the change-of-variables formula gives for ' +
          'the transformed density.',
        steps: [
          'Choose a simple base distribution (e.g. standard Gaussian) and a chain of invertible layers with an efficiently computable Jacobian determinant (e.g. coupling layers, as in NICE/RealNVP).',
          'To generate: sample from the base distribution and push it forward through the chain of transformations.',
          'To evaluate likelihood: run a data point backward through the inverse chain, and compute the base density times the product of the Jacobian determinants (change-of-variables formula).',
          "Train by maximum likelihood: adjust the transformations' parameters via gradient ascent on the exact log-likelihood of the training data.",
        ],
      },
      whenToUse: [
        'You need an exact, tractable likelihood/density for the model, not just samples — e.g. for anomaly scoring or model comparison',
        'You want stable, non-adversarial training with a single, well-defined objective to monitor for convergence',
      ],
      whenNotToUse: [
        "Sample quality at a given model size is the priority — flows are constrained to invertible, dimension-preserving transformations, a real architectural restriction GANs and diffusion models don't share",
        'The latent dimension needs to differ from the data dimension — a bijective flow requires equal input and output dimensionality at every layer by construction',
      ],
      facets: {
        task: ['generation', 'representation'],
        dataType: ['tabular', 'image'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'exact-density-and-samples',
      },
      // autoregressive-generation is a genuine sibling in the exact-likelihood family: autoregressive
      // flows (MAF/IAF) are built directly from autoregressive factorizations, and both compete for
      // the tractable-likelihood niche neither VAEs nor GANs fill.
      related: ['variational-autoencoders', 'gans', 'autoregressive-generation', 'ica-and-factor-analysis'],
      references: {
        free: [{ title: "Lil'Log — Flow-based Deep Generative Models", url: 'https://lilianweng.github.io/posts/2018-10-13-flow-models/' }],
        papers: [
          {
            title: 'Variational Inference with Normalizing Flows',
            url: 'https://arxiv.org/abs/1505.05770',
            year: 2015,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'autoregressive-generation',
      name: 'Autoregressive Generation',
      aliases: ['autoregressive models', 'PixelRNN / PixelCNN'],
      tier: 1,
      year: 2016,
      difficulty: 3,
      hook: 'Generates data one piece at a time, each new piece conditioned on everything generated so far.',
      intuition:
        'Any joint distribution can be rewritten, without approximation, as a product of conditional distributions by ' +
        'the chain rule of probability: the probability of a whole image is the probability of its first pixel, times ' +
        'the probability of its second pixel given the first, and so on. Autoregressive generation takes that identity ' +
        'literally and builds a model out of it. Fix an ordering over the pieces of your data — pixels in raster-scan ' +
        "order, tokens left to right — and train one network to predict each piece's distribution given everything " +
        'before it. Training is ordinary supervised learning: at every position, compare the predicted distribution to ' +
        "what actually came next, and because every position's target is already known during training, all of them " +
        'can be scored in parallel. Generation is the opposite: to produce a new sample you must decode piece by piece, ' +
        'feeding each output back in as input to predict the next, which makes sampling inherently sequential and slow ' +
        'no matter how the model is trained.',
      howItWorks: {
        summary:
          "Factor the joint distribution over a data point's components via the chain rule, train one network to " +
          'predict each component\'s conditional distribution given every earlier component, and generate by sampling ' +
          'components one at a time in that order.',
        steps: [
          "Fix an ordering over the data's components (e.g. raster-scan for pixels, left-to-right for tokens).",
          'Train a network to output a distribution over the next component given all previous components (masked convolutions, as in PixelCNN, or a recurrent/attention-based model enforce this causal dependency).',
          "During training, score every position's prediction against the real next component in parallel, since the true previous components are already known (teacher forcing).",
          "Maximize total log-likelihood: the sum of every position's log-probability of its true next value, exactly the chain-rule factorization.",
          'To generate, sample the first component, feed it back in, sample the next conditioned on it, and repeat until the full sample is produced.',
        ],
      },
      hyperparameters: [
        {
          name: 'component ordering',
          what: 'The order in which pieces of the data are factored and generated.',
          tuning:
            'For images, van den Oord et al. used row-by-row raster order, including a "Diagonal BiLSTM" variant that ' +
            'captures dependencies a strict raster scan misses; for text, left-to-right is essentially universal.',
        },
        {
          name: 'context architecture (recurrent vs. masked-convolutional vs. attention-based)',
          what: 'How the network is prevented from seeing future components while conditioning on all past ones.',
          tuning:
            "van den Oord et al. found PixelCNN's masked convolutions dramatically faster to train than PixelRNN's " +
            'recurrent layers, at some cost to the long-range dependencies a recurrent or attention-based context ' +
            'captures more directly.',
        },
      ],
      whenToUse: [
        'You need an exact, tractable likelihood for every generated sample, like normalizing flows but via chain-rule factorization instead of invertible transforms',
        'The data has a natural sequential or spatial ordering to factor over (text, audio waveforms, raster images)',
        'Training stability and simplicity matter — autoregressive training is ordinary supervised next-step prediction, with no adversary and no variational bound to balance',
      ],
      whenNotToUse: [
        "Fast sampling matters — generation is sequential by construction, one component at a time, far slower at inference than a GAN's or a flow's single forward pass",
        'The data has no natural, meaningful ordering over its components to factor along, and an arbitrary ordering would be a poor structural fit',
      ],
      facets: {
        task: ['generation'],
        dataType: ['image', 'text', 'audio'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'generated-sequence-or-image',
      },
      math: {
        latex: [
          'p(x) = \\prod_{i=1}^{n} p(x_i \\mid x_1, \\ldots, x_{i-1})',
          '\\log p_\\theta(x) = \\sum_{i=1}^{n} \\log p_\\theta(x_i \\mid x_{<i})',
        ],
        notes:
          'The factorization in the first line is an identity of probability theory — it holds for any joint ' +
          'distribution over any ordering, with no assumption at all. Everything a specific autoregressive model adds ' +
          'is in how it parameterizes p_theta(x_i | x_<i): PixelRNN uses recurrent layers, PixelCNN uses masked ' +
          'convolutions that only look backward in the fixed order, and later transformer-based language models use ' +
          'causal self-attention over all previous tokens — the same chain-rule identity, a different function class ' +
          'for the conditional.',
      },
      complexity: {
        train:
          'O(n) positions scored per example per forward pass, all in parallel given the true previous components ' +
          '(teacher forcing) — roughly the cost of one forward pass over the whole sequence, not one per position',
        predict:
          'O(n) sequential forward passes to generate one full sample, one new component per pass — this sequential ' +
          'cost is the main practical drawback relative to GANs or flows',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        '# training: next-step prediction, fully parallel (teacher forcing)',
        '# x: (batch, seq_len) integer tokens/pixel-values; model outputs logits over the vocabulary',
        'logits = model(x[:, :-1])                       # causal model only ever sees past positions',
        'loss = nn.functional.cross_entropy(logits.reshape(-1, vocab_size), x[:, 1:].reshape(-1))',
        '',
        '# generation: sequential, one new component per step',
        'generated = x_start',
        'for _ in range(n_new_steps):',
        '    logits = model(generated)',
        '    next_probs = torch.softmax(logits[:, -1], dim=-1)',
        '    next_token = torch.multinomial(next_probs, num_samples=1)',
        '    generated = torch.cat([generated, next_token], dim=1)',
      ].join('\n'),
      // self-attention (Nova) is a genuine forward link: modern text-generation autoregressive
      // models replace PixelRNN/PixelCNN's recurrent/convolutional conditioning with causal
      // self-attention over all previous tokens -- same chain-rule factorization, different function
      // class. LLM-specific pretraining and architecture belongs in a body (Genesis) not yet
      // written; not linked here to avoid overclaiming specifics about it.
      related: ['normalizing-flows', 'diffusion-models-ddpm', 'self-attention'],
      references: {
        free: [{ title: 'CS231n — Generative Models (PixelRNN/PixelCNN, VAE, GAN)', url: 'https://cs231n.github.io/generative-models/' }],
        papers: [
          {
            title: 'Pixel Recurrent Neural Networks',
            url: 'https://arxiv.org/abs/1601.06759',
            year: 2016,
          },
        ],
        books: [
          {
            title: 'Deep Learning',
            author: 'Goodfellow, Bengio & Courville',
            chapter: 'Ch. 20 — Deep Generative Models (directed generative nets / autoregressive networks)',
            url: 'https://www.deeplearningbook.org/contents/generative_models.html',
          },
        ],
        video: [{ title: 'Karpathy — Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'diffusion-models-ddpm',
      name: 'Diffusion Models (DDPM)',
      aliases: ['DDPM', 'denoising diffusion probabilistic models'],
      tier: 1,
      year: 2020,
      difficulty: 4,
      hook: 'Learns to undo a gradual noising process, turning pure noise back into data one small denoising step at a time.',
      intuition:
        'Take a real image and add a small amount of Gaussian noise, repeat that hundreds or thousands of times, and ' +
        "you end up with something indistinguishable from pure static — a fixed, easy-to-describe forward process with " +
        'no learning involved. A diffusion model learns to run that process backward: starting from pure noise, predict ' +
        "and subtract a little bit of noise at each step, and after enough steps you're left with something that looks " +
        'like a real sample. What the network actually learns to predict, at each noisy version of the data and each ' +
        'timestep, is the noise that was added to get there — a single, simple, supervised regression target. Ho, Jain ' +
        'and Abbeel showed that training this noise predictor is mathematically a form of variational inference: the ' +
        'same evidence-lower-bound machinery a VAE optimizes, applied to a chain of hundreds of latent variables (one ' +
        'per noise level) instead of one. Sampling inherits that chain structure directly, which is why generating one ' +
        'image means running the network hundreds or thousands of times in sequence.',
      howItWorks: {
        summary:
          'Define a fixed forward process that gradually adds Gaussian noise to data over many steps, train a network ' +
          'to predict the noise added at each step (equivalently, to denoise), and generate by starting from pure ' +
          'noise and iteratively applying the learned denoising step.',
        steps: [
          'Forward process: define a fixed schedule that adds a small amount of Gaussian noise to the data at each of T steps, so that after T steps the data is indistinguishable from pure noise.',
          'A closed-form property of Gaussian noise lets you sample the noisy version of the data at any single timestep t directly, without simulating all the intermediate steps.',
          'Train a network to predict the noise added to a given input at a randomly sampled timestep t, using ordinary regression (mean squared error between true and predicted noise).',
          "The training objective is a simplified, unweighted version of the variational lower bound on the data's log-likelihood -- the same family of objective a VAE optimizes.",
          'To generate, start from pure Gaussian noise and repeatedly apply the trained network to predict and subtract a small amount of noise, for T steps, ending with a sample.',
        ],
      },
      hyperparameters: [
        {
          name: 'T (number of diffusion timesteps)',
          what: 'How many forward-noising / reverse-denoising steps the chain has.',
          tuning:
            'Ho, Jain & Abbeel set T=1000 for all their experiments; more steps make each individual denoising step ' +
            'smaller and easier to model accurately, at the direct cost of T sequential forward passes at sampling time.',
        },
        {
          name: 'noise (beta) schedule',
          what: 'How much noise is added at each of the T forward steps.',
          tuning:
            'Controls how quickly the forward process destroys signal; a schedule too aggressive early wastes model ' +
            'capacity on already-easy steps, one too gentle leaves too much signal for the trained model to remove ' +
            'usefully near the end.',
        },
      ],
      whenToUse: [
        'Sample quality and diversity both matter and you can afford many sequential network evaluations per sample',
        'You want a training procedure that is a single, stable regression objective rather than an adversarial minimax game',
        "You want the theoretical grounding of a variational bound on likelihood, closer to a VAE than to a GAN's unprincipled adversarial loss",
      ],
      whenNotToUse: [
        "Fast, single-pass or few-pass sampling is required -- vanilla DDPM needs on the order of T (e.g. 1000) sequential network evaluations per sample, far slower than a GAN's single forward pass",
        'Compute budget is tight and the data is high-resolution -- running the full noising/denoising process in pixel space is expensive; see latent diffusion for the fix',
      ],
      facets: {
        task: ['generation'],
        dataType: ['image'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-samples',
      },
      math: {
        latex: [
          'q(x_t \\mid x_{t-1}) = \\mathcal{N}(x_t;\\, \\sqrt{1-\\beta_t}\\, x_{t-1},\\, \\beta_t I)',
          'L_{\\text{simple}}(\\theta) = \\mathbb{E}_{t, x_0, \\epsilon}\\left[ \\lVert \\epsilon - \\epsilon_\\theta(\\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\epsilon,\\; t) \\rVert^2 \\right]',
        ],
        notes:
          'The first line is one step of the fixed forward noising process. L_simple, the objective Ho, Jain and ' +
          'Abbeel found worked best in practice, drops the theoretically-derived per-timestep weighting from the full ' +
          "variational lower bound and just regresses the added noise epsilon directly -- an unweighted objective " +
          "that empirically produces better samples than the mathematically 'correct' weighted one. The paper states " +
          'this noise-prediction objective closely resembles denoising score matching, the same quantity score-based ' +
          'diffusion models estimate directly.',
      },
      complexity: {
        train: 'O(cost of one network forward+backward pass) per training step, at a randomly sampled timestep -- comparable to training an ordinary regression network',
        predict: 'O(T) sequential network forward passes per generated sample (T=1000 in the original paper) -- the dominant cost and the main motivation for later, faster samplers',
      },
      code: [
        'import torch',
        '',
        '# training step: predict the noise added at a random timestep',
        't = torch.randint(0, T, (x0.shape[0],))',
        'eps = torch.randn_like(x0)',
        'x_t = alpha_bar[t].sqrt() * x0 + (1 - alpha_bar[t]).sqrt() * eps    # closed-form forward sample',
        'eps_pred = model(x_t, t)',
        'loss = torch.nn.functional.mse_loss(eps_pred, eps)                 # L_simple',
        '',
        '# sampling: iteratively denoise from pure noise, T steps',
        'x = torch.randn_like(x0)',
        'for t in reversed(range(T)):',
        '    eps_pred = model(x, t)',
        '    x = denoise_step(x, eps_pred, t)          # one reverse-process update using eps_pred',
      ].join('\n'),
      // variational-inference (Neptune) is genuine, not decorative: Ho, Jain & Abbeel's own
      // objective IS a variational bound, the same family VAEs optimize. latent-and-score-based-
      // diffusion is the direct extension this entry motivates.
      related: ['variational-autoencoders', 'variational-inference', 'latent-and-score-based-diffusion', 'gans'],
      references: {
        free: [{ title: "Lil'Log — What are Diffusion Models?", url: 'https://lilianweng.github.io/posts/2021-07-11-diffusion-models/' }],
        papers: [
          {
            title: 'Denoising Diffusion Probabilistic Models',
            url: 'https://arxiv.org/abs/2006.11239',
            year: 2020,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 18 — Diffusion Models',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'latent-and-score-based-diffusion',
      name: 'Latent & Score-Based Diffusion',
      aliases: ['latent diffusion models', 'LDM', 'score-based generative modeling'],
      tier: 1,
      year: 2021,
      difficulty: 5,
      hook: 'Runs diffusion in a compressed latent space for speed, and reframes it as a continuous SDE for cleaner theory.',
      intuition:
        'Vanilla DDPM works directly on raw pixels, which is expensive: modeling and denoising a full-resolution image ' +
        'at every one of a thousand steps costs a lot of compute for detail nobody will notice. Latent diffusion, from ' +
        'Rombach et al., fixes this by first training a separate autoencoder to compress images into a smaller latent ' +
        'space, then running the entire noising-and-denoising diffusion process there instead of in pixel space -- ' +
        "diffusing something closer to the image's semantic content, not its raw pixel grid, which is what makes " +
        'practical, large-scale text-to-image systems like Stable Diffusion computationally feasible at all. ' +
        'Score-based generative modeling, from Song et al., is a separate contribution: reframing diffusion\'s discrete ' +
        'chain of noise levels as the discretization of a continuous-time stochastic differential equation (SDE). ' +
        'Under that lens, DDPM and earlier score-matching methods turn out to be two different discretizations of the ' +
        'same underlying continuous process, unified under one mathematical framework rather than treated as unrelated ' +
        'techniques -- a cleaner theory, not by itself a change to what gets generated or how fast.',
      howItWorks: {
        summary:
          "Latent diffusion trains diffusion's forward/reverse process inside the compressed latent space of a " +
          'separately trained autoencoder instead of pixel space; the score-based SDE framing rewrites the discrete ' +
          'diffusion chain as a continuous-time stochastic differential equation, unifying DDPM and score-matching ' +
          'methods as different discretizations of it.',
        steps: [
          'Latent diffusion: train a perceptual-compression autoencoder to map images to a smaller latent space and back, independent of the diffusion model.',
          "Latent diffusion: train the diffusion model's forward/reverse noising process entirely within that latent space, then decode the final denoised latent back to pixels with the autoencoder's decoder.",
          'Latent diffusion: optionally condition the denoising network on text or other signals via cross-attention layers injected into its architecture.',
          'Score-based SDE: replace the discrete sequence of noise levels with a continuous-time SDE that smoothly diffuses data into noise as t runs from 0 to 1.',
          'Score-based SDE: train a network to estimate the score (gradient of the log-density) of the noised data at every noise level, then generate by solving the corresponding reverse-time SDE backward from noise to data.',
        ],
      },
      whenToUse: [
        'You need diffusion-model sample quality at high resolution or on a large training set, where full pixel-space diffusion is computationally impractical (latent diffusion)',
        'You need flexible conditioning (e.g. text-to-image) integrated cleanly into a diffusion model via cross-attention (latent diffusion)',
        'You want a unified, continuous-time mathematical framework for reasoning about or designing new noise schedules and samplers, rather than being tied to a fixed discrete chain (score-based SDE)',
      ],
      whenNotToUse: [
        'The dataset or images are small enough that pixel-space DDPM is already computationally affordable -- the added autoencoder stage in latent diffusion is extra machinery you may not need',
        "The compression autoencoder's latent space discards details that matter for your task -- latent diffusion inherits whatever information loss the autoencoder introduces before diffusion ever runs",
      ],
      facets: {
        task: ['generation'],
        dataType: ['image', 'multimodal'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'generated-samples',
      },
      math: {
        latex: [
          'dx = f(x,t)\\,dt + g(t)\\,dw \\qquad \\text{forward SDE, } w \\text{ a Wiener process}',
          'dx = \\left[f(x,t) - g(t)^2 \\nabla_x \\log p_t(x)\\right]dt + g(t)\\,d\\bar w \\qquad \\text{reverse-time SDE}',
        ],
        notes:
          'Song et al. show the reverse-time SDE depends only on the score, \\nabla_x \\log p_t(x), the same quantity ' +
          'a score-based model is trained to estimate at every noise level; they further show DDPM corresponds to a ' +
          "specific 'variance preserving' discretization of this SDE and earlier score-matching methods (SMLD) to a " +
          "'variance exploding' one, unifying both as instances of one framework. Latent diffusion does not change " +
          'this theory at all -- it changes only the space (latent vs. pixel) the forward and reverse processes run ' +
          'in, which is why the two advances bundled in this entry are genuinely independent contributions rather ' +
          'than one idea.',
      },
      complexity: {
        train:
          'Latent diffusion: comparable per-step cost to pixel-space DDPM but on a much lower-dimensional latent grid, ' +
          "which is where its reported speedups come from (dominated by the pretrained autoencoder's compression " +
          'factor); the compression autoencoder is trained separately beforehand',
        predict:
          'Still O(number of sampling steps) sequential network evaluations per sample, as in vanilla DDPM, though ' +
          'the score-based SDE framing enables faster numerical SDE/ODE solvers that can cut this substantially below ' +
          'T=1000 in practice',
      },
      code: [
        'import torch',
        '',
        '# latent diffusion: encode -> diffuse in latent space -> decode',
        '# autoencoder (encoder/decoder) is pretrained and frozen while the diffusion model trains',
        'with torch.no_grad():',
        '    z0 = autoencoder.encode(x0)              # compress to latent space once, up front',
        '',
        't = torch.randint(0, T, (z0.shape[0],))',
        'eps = torch.randn_like(z0)',
        'z_t = alpha_bar[t].sqrt() * z0 + (1 - alpha_bar[t]).sqrt() * eps',
        'eps_pred = unet(z_t, t, context=text_embedding)   # cross-attention conditioning, e.g. on text',
        'loss = torch.nn.functional.mse_loss(eps_pred, eps)',
        '',
        '# sampling: denoise in latent space, then decode once at the end',
        '# z = <run the reverse diffusion loop as in diffusion-models-ddpm, entirely on latents>',
        '# image = autoencoder.decode(z)',
      ].join('\n'),
      // autoencoders is a genuine mechanical link, not decoration: latent diffusion's compression
      // stage literally IS an autoencoder (Rombach et al. train "a perceptual compression model")
      // -- the same architecture family as that entry, used here as a preprocessing stage rather
      // than the generative model itself.
      related: ['diffusion-models-ddpm', 'autoencoders', 'variational-inference'],
      references: {
        free: [{ title: "Lil'Log — What are Diffusion Models? (latent diffusion and score-based SDE sections)", url: 'https://lilianweng.github.io/posts/2021-07-11-diffusion-models/' }],
        papers: [
          {
            title: 'High-Resolution Image Synthesis with Latent Diffusion Models',
            url: 'https://arxiv.org/abs/2112.10752',
            year: 2022,
          },
          {
            title: 'Score-Based Generative Modeling through Stochastic Differential Equations',
            url: 'https://arxiv.org/abs/2011.13456',
            year: 2021,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 18 — Diffusion Models',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
  ],
} satisfies Body;
