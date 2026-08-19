/**
 * Vulcan — Convolutional Networks & Vision. See PLAN.md §3 for the full moon list (8 moons, all
 * written here: 7 Tier 1, 1 Tier 2).
 *
 * `year` dating choices, documented per CONTENT_GUIDE/sol.ts precedent of stating a deliberate
 * choice rather than silently picking one:
 *   - convolution-and-pooling: 1980 (Fukushima, "Neocognitron: A Self-Organizing Neural Network
 *     Model for a Mechanism of Pattern Recognition Unaffected by Shift in Position", Biological
 *     Cybernetics 36:193-202 — confirmed via CrossRef for DOI 10.1007/BF00344251). The
 *     Neocognitron's S-cells/C-cells are the conceptual origin of local receptive fields +
 *     subsampling, predating gradient-trained CNNs. LeCun's 1989/1998 work is the first
 *     *gradient-trained* instantiation of the same structure — dated separately below under
 *     lenet-to-alexnet-to-vgg, which owns that specific lineage claim.
 *   - lenet-to-alexnet-to-vgg: 1998 (LeCun, Bottou, Bengio & Haffner, "Gradient-Based Learning
 *     Applied to Document Recognition", Proceedings of the IEEE 86(11):2278-2324 — confirmed via
 *     leon.bottou.org's own paper page, which reproduces title/authors/journal/volume/pages/year
 *     verbatim). Pinned to the earliest of the three papers per this body's own convention
 *     (matches jupiter.ts/sol.ts pinning technique entries to their earliest or most load-bearing
 *     paper rather than inventing a group date).
 *   - resnet-and-skip-connections: 2015 (He, Zhang, Ren & Sun, "Deep Residual Learning for Image
 *     Recognition", arXiv:1512.03385, submitted 10 Dec 2015 — confirmed via the arXiv abstract
 *     page). Published at CVPR 2016; dated to the arXiv posting year per this repo's convention
 *     (see sol.ts's VGG/gradient-descent precedent of using first-disclosure year). The
 *     year-discrepancy and the paper's own "degradation problem" framing (explicitly NOT vanishing
 *     gradients) were both verified against the paper's full text — see research trail below.
 *   - inception-and-efficientnet: 2014 (Szegedy et al., "Going Deeper with Convolutions",
 *     arXiv:1409.4842, the GoogLeNet/Inception paper — confirmed via the arXiv abstract page).
 *     Pinned to the earlier of the two papers this Tier-2 entry covers; EfficientNet (Tan & Le,
 *     arXiv:1905.11946, 2019) is dated separately in its own reference entry.
 *   - transfer-learning: 2014 (Yosinski, Clune, Bengio & Lipson, "How transferable are features in
 *     deep neural networks?", arXiv:1411.1792 — confirmed via the arXiv abstract page). This is
 *     the canonical empirical study of CNN feature transferability, not the first use of the idea
 *     in general ML (which has no single clean origin), so the entry is pinned to the paper that
 *     gives it a rigorous vision-specific treatment.
 *   - object-detection: 2014 (Girshick, Donahue, Darrell & Malik, "Rich feature hierarchies for
 *     accurate object detection and semantic segmentation" — R-CNN, arXiv:1311.2524, published
 *     CVPR 2014 — confirmed via the ar5iv full-text rendering). Pinned to the earliest of the four
 *     papers this entry covers (R-CNN 2014, Fast R-CNN 2015, Faster R-CNN 2015, YOLO 2016).
 *   - unet-and-segmentation: 2015 (Ronneberger, Fischer & Brox, "U-Net: Convolutional Networks for
 *     Biomedical Image Segmentation", arXiv:1505.04597 — confirmed via ar5iv, and independently via
 *     CrossRef metadata for the published MICCAI 2015 chapter, DOI 10.1007/978-3-319-24574-4_28,
 *     which confirms both the year and the MICCAI 2015 venue).
 *   - vision-transformer: 2020 (Dosovitskiy et al., "An Image is Worth 16x16 Words: Transformers
 *     for Image Recognition at Scale", arXiv:2010.11929, submitted 22 Oct 2020 — confirmed via the
 *     arXiv abstract page). Published at ICLR 2021; dated to the arXiv posting year, consistent
 *     with resnet-and-skip-connections above.
 *
 * `eraRange` spans 1980 (Fukushima's Neocognitron) to 2020 (ViT's arXiv posting) — the earliest and
 * latest moon on this body.
 *
 * Research trail (every claim read from an opened source, per CONTENT_GUIDE §3):
 *   - Fukushima (1980) verified via CrossRef metadata for DOI 10.1007/BF00344251 (title, author,
 *     journal, volume, pages, year all confirmed structurally) after a direct Springer fetch
 *     redirected to an auth-gated page.
 *   - CS231n's own convolutional-networks and transfer-learning notes (cs231n.github.io) fetched
 *     directly for the parameter-sharing/receptive-field/pooling mechanics and the four-quadrant
 *     (dataset size x similarity) transfer-learning decision table used verbatim in that entry's
 *     whenToUse/whenNotToUse and hyperparameters.
 *   - LeCun et al. (1998) verified via leon.bottou.org/papers/lecun-98h, LeCun's own co-author's
 *     hosted paper page, reproducing full bibliographic detail.
 *   - Krizhevsky, Sutskever & Hinton (2012, AlexNet) — see the dedicated PDF-fetch warning below.
 *     Final verified numbers: 1.2M training images, 60M parameters, 650,000 neurons, five conv +
 *     three fully-connected layers, dropout named explicitly, 37.5%/17.0% top-1/top-5 on the
 *     ILSVRC-2010 test set, and a winning 15.3% top-5 error on ILSVRC-2012 vs. 26.2% for the
 *     second-best entry — all confirmed by extracting the actual PDF text with `pdftotext`, not by
 *     trusting any fetch summary. d2l.ai §8.1 independently corroborates the 5 conv + 3 FC (2
 *     hidden + 1 output) layer count and the ReLU-over-sigmoid choice.
 *   - Simonyan & Zisserman (2014, VGG) verified via arXiv:1409.1556's abstract page (title,
 *     authors, year, "very small (3x3) convolution filters", 16-19 weight layers, ILSVRC-2014
 *     1st/2nd place) and via ar5iv's full-text §2.3, which gives the exact 27C^2-vs-49C^2
 *     ("81% more") parameter argument used in this entry's math.notes, cross-checked arithmetically
 *     (49/27 ≈ 1.815, i.e. 81% more — internally consistent).
 *   - He, Zhang, Ren & Sun (2015, ResNet) verified via arXiv:1512.03385's abstract page and via
 *     ar5iv's full text, which was used to quote the paper's own "degradation problem" language
 *     verbatim and its explicit argument that the difficulty is "unlikely to be caused by vanishing
 *     gradients" (their plain-network baselines had healthy BN-verified gradient norms) — this is
 *     the exact distinction CONTENT_GUIDE flagged as commonly garbled, sourced from the primary
 *     text rather than from recall. The y = F(x,{Wi}) + x formula and the 3.57% ensemble top-5
 *     error winning ILSVRC 2015 were both quoted directly from the same ar5iv fetch. d2l.ai §8.6
 *     independently corroborates the citation (He et al. 2016, the CVPR-published year).
 *   - Szegedy et al. (2014, Inception/GoogLeNet) and Tan & Le (2019, EfficientNet) verified via
 *     their respective arXiv abstract pages (1409.4842, 1905.11946) — GoogLeNet's 22-layer depth
 *     and ILSVRC-2014 result, and EfficientNet-B7's "84.3% top-1... 8.4x smaller and 6.1x faster"
 *     claim, both quoted directly from the abstracts. d2l.ai §8.4 independently corroborates the
 *     GoogLeNet multi-branch description.
 *   - Yosinski, Clune, Bengio & Lipson (2014) verified via arXiv:1411.1792's abstract page.
 *     CS231n's transfer-learning page supplied the practical fixed-feature-extractor-vs-fine-tuning
 *     decision matrix used in that entry.
 *   - Girshick et al. (2014, R-CNN) verified via ar5iv's full text (53.7%/53.3% mAP on VOC
 *     2010/2012, the selective-search + CNN-features + SVM pipeline). Girshick (2015, Fast R-CNN)
 *     and Ren, He, Girshick & Sun (2015, Faster R-CNN) verified via their arXiv abstract pages
 *     (1504.08083: "9x faster... 213x faster at test-time" vs. R-CNN; 1506.01497: "5fps... on a
 *     GPU" for VGG-16, authors and submission date). Redmon, Divvala, Girshick & Farhadi (YOLO)
 *     verified via arXiv:1506.02640 and corroborating search results giving the CVPR 2016
 *     publication venue and the 45fps/155fps (Fast YOLO) figures. IoU's definition and its use as
 *     both an NMS and an evaluation threshold verified via Wikipedia's Jaccard index article.
 *   - Ronneberger, Fischer & Brox (2015, U-Net) verified via ar5iv's full text, which supplied the
 *     contracting/expansive path description, the exact weighted cross-entropy loss formula
 *     (w(x) = wc(x) + w0*exp(-(d1+d2)^2/2*sigma^2), w0=10, sigma≈5), the 30/20-35 annotated-image
 *     counts, elastic-deformation augmentation, and the overlap-tile strategy for arbitrarily large
 *     images — all quoted or closely paraphrased directly from the paper's own text, and the
 *     MICCAI-2015 venue independently confirmed via CrossRef metadata for the published chapter's
 *     DOI (10.1007/978-3-319-24574-4_28).
 *   - Dosovitskiy et al. (2020, ViT) verified via arXiv:2010.11929's abstract page and via ar5iv's
 *     full text, which supplied the exact "lack some of the inductive biases inherent to CNNs, such
 *     as translation equivariance and locality" quote, the JFT-300M / 14M-300M data-scale claim,
 *     and the explicit statement that ViT trails ResNets "by a few percentage points" on mid-sized
 *     datasets like ImageNet without strong regularization — the whenNotToUse condition this entry
 *     leads with, sourced from the paper's own honest limitation, not inferred.
 *   - Book chapter references (Understanding Deep Learning by Prince, and Dive into Deep Learning)
 *     verified via direct table-of-contents searches: UDL's Ch. 10 "Convolutional networks", Ch. 11
 *     "Residual networks" and Ch. 12 "Transformers" (udlbook.github.io); d2l.ai's §7.6 (LeNet), §8.1
 *     (AlexNet), §8.2 (VGG), §8.4 (GoogLeNet), §8.6 (ResNet), §14.2 (Fine-Tuning), §14.8
 *     (Region-based CNNs) and §14.9 (Semantic Segmentation) all confirmed via their own page
 *     fetches or direct search-result URLs, per this repo's established precedent (sol.ts) of
 *     citing d2l.ai under the `books` category with author + chapter.
 *
 * ⚠️ PDF-fetch caught fabricating, per CONTENT_GUIDE §3's warning — and notably NOT on a scanned
 * PDF with no text layer, the failure mode the guide describes, but on a normal typeset PDF that
 * `pdftotext` extracted cleanly once checked directly. `WebFetch` on both
 * https://proceedings.neurips.cc/paper/2012/hash/.../Abstract.html (the HTML abstract page) and
 * the paper's own PDF returned, twice independently, "39.7% and 18.9%" top-1/top-5 error and
 * "500,000 neurons" / "two fully-connected layers" as the AlexNet abstract's numbers. The actual
 * paper — downloaded and read with `pdftotext -layout` directly rather than trusted — says "37.5%
 * and 17.0%" on the LSVRC-2010 test set, "650,000 neurons," and "three fully-connected layers,"
 * plus the ILSVRC-2012 "winning top-5 test error rate of 15.3%, compared to 26.2% achieved by the
 * second-best entry" that WebFetch's summary omitted from the same paragraph entirely. Every
 * AlexNet number in this file is taken from that self-extracted text, not from any WebFetch
 * summary. This is worth flagging explicitly: the failure was not "PDF has no text," it was
 * "WebFetch's summarizing model silently substituted different, wrong, but equally plausible
 * numbers" — a stricter version of the warning than the scanned-PDF case CONTENT_GUIDE documents.
 *
 * Cross-linking: `related` favours this batch's own prometheus.ts ids (activation-functions,
 * weight-initialization, batch-and-layer-normalization, dropout-and-weight-decay,
 * vanishing-gradients-and-universal-approximation) since every entry here is a direct application
 * of those foundations and prometheus lands in this same batch — each such link is marked inline.
 * resnet-and-skip-connections -> vanishing-gradients-and-universal-approximation is deliberately a
 * *contrast* link, not a "this causes that" link: He et al.'s own ablations found the degradation
 * problem is NOT primarily a gradient-magnitude problem, which is exactly the point worth reading
 * both entries to see. vision-transformer -> self-attention (Nova, already exists) is a genuine,
 * important cross-body link forward to Nova's own attention machinery — ViT reuses it unchanged.
 * object-detection/unet-and-segmentation deliberately do NOT link to decision-trees/random-forest
 * (Mercury/Mars) per this task's own instruction — that link was considered and is not a real one.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'vulcan',
  name: 'Vulcan',
  segment: 'Convolutional Networks & Vision',
  hook: 'Shared filters, then depth, then skip connections, then the challenge from attention itself.',
  summary:
    'Vulcan collects the architectures that taught networks to see — from the shared, position-invariant filter that ' +
    'makes convolution cheap, through the arc of ever-deeper classifiers, to the detection and segmentation heads built ' +
    "on top of them, and finally to the Vision Transformer's direct challenge to convolution's whole premise.",
  eraRange: [1980, 2020],
  moons: [
    // ---------------------------------------------------------------------------------------------
    {
      id: 'convolution-and-pooling',
      name: 'Convolution & Pooling',
      aliases: ['convolutional layer', 'local receptive fields', 'subsampling'],
      tier: 1,
      year: 1980,
      difficulty: 2,
      hook: 'Reuses one small filter across every patch of the image, then shrinks the map it produces.',
      intuition:
        'A photograph does not care where in the frame an edge appears — an edge detector that works in the ' +
        'top-left corner should work identically in the bottom-right. Convolution builds that assumption directly ' +
        'into the network: instead of giving every pixel its own private weight, one small filter (say 3x3 or 5x5) ' +
        'slides across the whole image, reusing the same handful of weights at every position. Each application ' +
        'produces one number in an output feature map, so a filter tuned to detect vertical edges lights up ' +
        'wherever a vertical edge occurs, regardless of location. Pooling then throws away exact position on ' +
        'purpose: taking the maximum (or average) value in each small neighborhood shrinks the map and makes the ' +
        'result tolerant to a feature shifting by a pixel or two. Stack convolution-then-pooling repeatedly and ' +
        "each layer's filters see a progressively larger patch of the original image — edges compose into " +
        'textures, textures into parts, parts into objects.',
      howItWorks: {
        summary:
          'Slide a small learned filter across the input computing a weighted sum at each position to build a ' +
          'feature map, then shrink each map with a pooling operation.',
        steps: [
          'Take a small filter (e.g. 3x3xC) and slide it across every spatial position of the input volume.',
          'At each position, compute the dot product between the filter weights and the patch underneath it, producing one output value.',
          'Repeat with many different filters to produce a stack of feature maps, each tuned to a different pattern.',
          'Pass each feature map through a non-linearity (commonly ReLU).',
          'Apply a pooling operation (commonly 2x2 max pooling with stride 2) to shrink each feature map and add local shift-tolerance.',
          'Stack convolution+pooling blocks so later layers operate over larger effective receptive fields of the original input.',
        ],
      },
      hyperparameters: [
        {
          name: 'filter size (kernel size)',
          what: 'Spatial extent of each filter, e.g. 3x3 or 5x5.',
          tuning:
            'Modern architectures favor small filters (3x3) stacked in depth over one large filter — see ' +
            'lenet-to-alexnet-to-vgg for the parameter-count argument.',
        },
        {
          name: 'stride',
          what: 'Number of positions the filter moves between applications.',
          tuning:
            'Stride 1 (with matching padding) preserves spatial resolution; stride 2 halves it, and is ' +
            'sometimes used in place of pooling to downsample.',
        },
      ],
      whenToUse: [
        'Input has spatial structure where a pattern (an edge, a texture) can appear at any location and should be detected the same way everywhere',
        "You want far fewer parameters than a fully-connected layer over the same input, since one filter's weights are reused at every position",
        'Some tolerance to small translations or shifts in the input is desirable, not a liability',
      ],
      whenNotToUse: [
        'The input has no meaningful spatial or local structure (e.g. shuffled tabular features), where a fixed local filter has nothing to exploit',
        'The task depends on precise pixel-level position that pooling would deliberately discard — use strided convolution or skip pooling at that stage',
        'Long-range dependencies across the whole image matter more than local patterns, and a purely convolutional stack would need many layers to connect distant regions — see vision-transformer',
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['image'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'feature-maps',
      },
      math: {
        latex: [
          '(f * g)(x, y) = \\sum_{i}\\sum_{j} f(i, j)\\, g(x-i, y-j)',
          '\\text{output size} = \\left\\lfloor \\frac{W - F + 2P}{S} \\right\\rfloor + 1',
        ],
        notes:
          "The output-size formula (CS231n's own convention) governs both convolution and pooling layers: W is " +
          'the input width, F the filter size, P the zero-padding, S the stride. A 3x3 filter with stride 1 and ' +
          'padding 1 preserves spatial size exactly; 2x2 max pooling with stride 2 halves it. Parameter sharing is ' +
          'what makes convolution cheap: a layer with C_in input channels and C_out filters of size KxK has only ' +
          'C_out * C_in * K * K weights, independent of image size, versus a fully-connected layer whose weight ' +
          'count scales with the number of input pixels.',
      },
      complexity: {
        train: 'O(H*W*C_in*C_out*K^2) multiply-adds per convolutional layer per forward pass, summed over training steps',
        predict: 'O(H*W*C_in*C_out*K^2) per convolutional layer per forward pass',
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        '',
        'block = nn.Sequential(',
        '    nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3, stride=1, padding=1),',
        '    nn.ReLU(),',
        '    nn.MaxPool2d(kernel_size=2, stride=2),   # halves H and W; channel count unchanged',
        ')',
        '',
        'x = torch.randn(1, 3, 32, 32)   # one 32x32 RGB image',
        'y = block(x)                    # -> (1, 16, 16, 16): more channels, half the resolution',
      ].join('\n'),
      // activation-functions and weight-initialization are prometheus ids (same batch) -- every
      // conv layer here is trained with exactly that machinery.
      related: [
        'activation-functions',
        'weight-initialization',
        'lenet-to-alexnet-to-vgg',
        'resnet-and-skip-connections',
      ],
      references: {
        free: [
          {
            title: 'CS231n notes — Convolutional Neural Networks',
            url: 'https://cs231n.github.io/convolutional-networks/',
          },
        ],
        papers: [
          {
            title:
              'Neocognitron: A Self-Organizing Neural Network Model for a Mechanism of Pattern Recognition Unaffected by Shift in Position',
            url: 'https://doi.org/10.1007/BF00344251',
            year: 1980,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 10 — Convolutional Networks',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'lenet-to-alexnet-to-vgg',
      name: 'LeNet -> AlexNet -> VGG',
      aliases: ['LeNet-5', 'AlexNet', 'VGGNet', 'VGG16', 'VGG19'],
      tier: 1,
      year: 1998,
      difficulty: 3,
      hook: 'Three papers, fourteen years apart, that turned depth and data into the recipe for vision.',
      intuition:
        'LeNet-5 (1998) is the template every convolutional network still follows: alternate convolution and ' +
        'pooling to extract features, then a few fully-connected layers to classify — trained end-to-end with ' +
        'backpropagation, on small grayscale digits. For over a decade nobody could make that template work at ' +
        'real-world scale. AlexNet (2012) is the paper that changed that: roughly the same recipe, but much ' +
        'deeper, trained on 1.2 million ImageNet photos across two GPUs, using ReLU instead of sigmoid to keep ' +
        'gradients from saturating, and dropout to keep 60 million parameters from just memorizing the training ' +
        'set. It beat the next-best entry by more than ten points of top-5 error and effectively ended the ' +
        'pre-deep-learning era of computer vision overnight. VGG (2014) then asked a narrower question: how far ' +
        'can depth alone take you if you stop tuning filter sizes and simply stack small 3x3 convolutions? The ' +
        'answer was 16-19 weight layers and a new state of the art, at the cost of far more compute.',
      howItWorks: {
        summary:
          'Three architectures sharing one template — convolution/pooling for features, then dense layers for ' +
          'classification — that differ in depth, training tricks and filter design as compute and data grew.',
        steps: [
          'LeNet-5: two conv+average-pool stages (6, then 16 filters) feeding three fully-connected layers, trained on 32x32 grayscale digit images.',
          'AlexNet: five conv layers (some followed by max-pooling) feeding three fully-connected layers, trained on 224x224 ImageNet crops split across two GPUs.',
          "AlexNet's departures from LeNet: ReLU activations instead of tanh/sigmoid, dropout in the fully-connected layers, and heavy data augmentation to fight overfitting at 60 million parameters.",
          'VGG: replaces every large filter with a stack of 3x3 convolutions, pushing depth to 16-19 weight layers while holding filter size fixed throughout.',
          'All three are trained end-to-end by backpropagation and gradient descent on a classification cross-entropy loss.',
        ],
      },
      hyperparameters: [
        {
          name: 'depth (number of weight layers)',
          what: 'How many convolutional and fully-connected layers are stacked.',
          tuning:
            'The arc itself is the tuning story: roughly 7 (LeNet) to 8 (AlexNet) to 16-19 (VGG-16/VGG-19) — ' +
            'each increase required a new trick (ReLU, dropout, GPU-scale data) to stay trainable.',
        },
        {
          name: 'filter size',
          what: 'Spatial extent of each convolutional filter.',
          tuning:
            'LeNet and AlexNet mix filter sizes (5x5, up to 11x11 in AlexNet\'s first layer); VGG fixes every ' +
            'filter at 3x3 and gets an equivalent receptive field, plus extra non-linearity, from stacking depth instead.',
        },
      ],
      whenToUse: [
        'You need a simple, well-understood baseline CNN for small images before reaching for a modern architecture — LeNet-style networks still work well on MNIST-scale problems',
        'You want to understand or teach why depth, ReLU, dropout and GPU-scale data were each individually necessary for deep vision to work, not just that a modern network works',
        "VGG's uniform 3x3-only design as a simple feature extractor for transfer learning, where its regular structure and widely-available pretrained weights are the whole draw",
      ],
      whenNotToUse: [
        'Any real accuracy-per-compute budget in production — ResNet and later architectures beat VGG on both accuracy and parameter count (VGG-16 alone is commonly cited at roughly 138 million parameters)',
        'The dataset is small and nothing like ImageNet — training any of these from scratch on a few thousand images invites the same overfitting AlexNet needed dropout and augmentation to fight; transfer learning from a pretrained network is usually the better starting point',
        'Very deep stacks are needed (50+ layers) — plain stacking without a fix for the degradation problem stops improving and can even get worse; see resnet-and-skip-connections',
      ],
      facets: {
        task: ['classification'],
        dataType: ['image'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities',
      },
      math: {
        latex: [
          'y = \\mathrm{ReLU}(x) = \\max(0, x)',
          '\\underbrace{3 \\times (3^2 C^2)}_{27C^2 \\text{, three 3x3 layers}} \\ \\text{vs.} \\ \\underbrace{7^2 C^2}_{49C^2 \\text{, one 7x7 layer}}',
        ],
        notes:
          "ReLU's gradient is exactly 1 for any positive input and 0 otherwise, so it does not saturate the way " +
          "sigmoid or tanh do for large inputs — part of why AlexNet's much deeper network was trainable at all. " +
          "VGG's own accounting (Simonyan & Zisserman, 2014, §2.3) shows three stacked 3x3 conv layers give the " +
          'same 7x7 effective receptive field as one large filter for 27C^2 weights instead of 49C^2 — 81% fewer ' +
          '— while inserting two extra ReLU non-linearities along the way, which the authors argue makes the ' +
          'decision function more discriminative.',
      },
      complexity: {
        train:
          "Parameter count grows from LeNet's tens of thousands, to AlexNet's ~60 million, to VGG-16's " +
          'commonly-cited ~138 million — depth and filter width both drive this up sharply across the arc',
        predict: 'One forward pass per image; latency scales with depth and channel width',
      },
      code: [
        'import torch.nn as nn',
        '',
        'class LeNet5(nn.Module):',
        '    """The 1998 template every CNN on this body still follows."""',
        '    def __init__(self, n_classes=10):',
        '        super().__init__()',
        '        self.features = nn.Sequential(',
        '            nn.Conv2d(1, 6, kernel_size=5), nn.Tanh(), nn.AvgPool2d(2),',
        '            nn.Conv2d(6, 16, kernel_size=5), nn.Tanh(), nn.AvgPool2d(2),',
        '        )',
        '        self.classifier = nn.Sequential(',
        '            nn.Flatten(),',
        '            nn.Linear(16 * 4 * 4, 120), nn.Tanh(),',
        '            nn.Linear(120, 84), nn.Tanh(),',
        '            nn.Linear(84, n_classes),',
        '        )',
        '    # AlexNet (2012): ~5x deeper, ReLU not Tanh, dropout, ImageNet-scale data across 2 GPUs',
        '    # VGG (2014): every filter fixed at 3x3, depth pushed to 16-19 weight layers',
        '    def forward(self, x):',
        '        return self.classifier(self.features(x))',
      ].join('\n'),
      // dropout-and-weight-decay is a prometheus id (same batch) -- AlexNet's dropout is the
      // canonical instance of it applied at ImageNet scale.
      related: [
        'convolution-and-pooling',
        'resnet-and-skip-connections',
        'dropout-and-weight-decay',
        'transfer-learning',
      ],
      references: {
        free: [
          {
            title: 'Dive into Deep Learning — Convolutional Neural Networks (LeNet)',
            url: 'https://d2l.ai/chapter_convolutional-neural-networks/lenet.html',
          },
          { title: 'Wikipedia — AlexNet', url: 'https://en.wikipedia.org/wiki/AlexNet' },
        ],
        papers: [
          {
            title: 'Gradient-Based Learning Applied to Document Recognition',
            url: 'https://leon.bottou.org/papers/lecun-98h',
            year: 1998,
          },
          {
            title: 'ImageNet Classification with Deep Convolutional Neural Networks',
            url: 'https://proceedings.neurips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html',
            year: 2012,
          },
          {
            title: 'Very Deep Convolutional Networks for Large-Scale Image Recognition',
            url: 'https://arxiv.org/abs/1409.1556',
            year: 2014,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '§7.6 Convolutional Neural Networks (LeNet); §8.1 Deep CNNs (AlexNet); §8.2 Networks Using Blocks (VGG)',
            url: 'https://d2l.ai/chapter_convolutional-modern/index.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'resnet-and-skip-connections',
      name: 'ResNet & Skip Connections',
      aliases: ['deep residual learning', 'residual networks', 'identity shortcut connections'],
      tier: 1,
      year: 2015,
      difficulty: 3,
      hook: 'Adds the input back onto the output, so a layer only has to learn what changed.',
      intuition:
        'Stack enough plain convolutional layers and something strange happens: past a certain depth, training ' +
        'accuracy gets worse, not just validation accuracy — and it is not overfitting, since more layers hurt the ' +
        'training set too. He et al. called this the degradation problem, and traced it to a much simpler failure ' +
        'than vanishing gradients: it is hard for a stack of nonlinear layers to learn to leave its input alone, ' +
        'even when the identity function would be the best thing to do. A residual block sidesteps the problem by ' +
        'changing what each block is asked to learn. Instead of learning the full output directly, it learns only ' +
        'the residual — the difference between output and input — and adds the original input back on top through ' +
        'a shortcut connection. If the extra layers have nothing useful to add, they can drive that residual to ' +
        'zero and the block behaves as identity, which is trivial to learn. That one change let ResNet train ' +
        'networks over 150 layers deep and win ILSVRC 2015.',
      howItWorks: {
        summary:
          'Reformulate each block to learn a residual function F(x) added back to its own input x via a shortcut ' +
          'connection, so identity is a trivial solution rather than something stacked nonlinear layers must ' +
          'approximate from scratch.',
        steps: [
          'Feed input x into a small stack of conv layers (typically two or three, with batch norm and ReLU) to compute a residual F(x).',
          'Add the original input x back to F(x) via a shortcut connection that skips the stack.',
          'Apply a final ReLU to the sum F(x) + x to produce the block output.',
          'When input and output dimensions differ (e.g. at a stride-2 block), project x through a 1x1 convolution before adding.',
          'Stack many such residual blocks — ResNet-18/34/50/101/152 vary only in how many blocks and how they are arranged.',
        ],
      },
      hyperparameters: [
        {
          name: 'depth (number of residual blocks / layers)',
          what: "Total number of weight layers, e.g. 18, 34, 50, 101 or 152 in the original paper's variants.",
          tuning:
            'Deeper variants (50+) typically use a "bottleneck" block (1x1 -> 3x3 -> 1x1 convolutions) to keep ' +
            'parameter count down; shallower variants (18, 34) use plain two-conv blocks.',
        },
      ],
      whenToUse: [
        'You need a network deeper than about 20-30 plain conv layers, where stacking more plain layers alone would trigger the degradation problem',
        'You want a standard, well-benchmarked backbone for transfer learning or as a component in a larger detection/segmentation pipeline',
        "Training stability at depth matters more than squeezing out the very best accuracy-per-parameter — ResNet's residual blocks are simple and robust to train",
      ],
      whenNotToUse: [
        'The network is shallow enough (a handful of layers) that the degradation problem never appears — skip connections add complexity with no benefit',
        'Parameter or compute budget is the binding constraint — compound scaling (see inception-and-efficientnet) gets more accuracy per parameter than plain ResNet scaling',
        "You are diagnosing a training failure as vanishing gradients specifically — He et al.'s own experiments found their plain (non-residual) baselines still had healthy gradient norms under batch normalization, so the degradation problem is a distinct optimization difficulty, not a gradient-magnitude one",
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['image'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities-or-feature-backbone',
      },
      math: {
        latex: ['y = \\mathcal{F}(x, \\{W_i\\}) + x'],
        notes:
          "F(x, {Wi}) is the residual branch's output (typically two or three weight layers with batch norm and " +
          'ReLU in between); x passes through the shortcut unchanged unless dimensions must be matched, in which ' +
          'case a 1x1 convolution W_s projects it: y = F(x,{Wi}) + W_s x. The argument for why this helps, from ' +
          'the paper itself: if the optimal underlying function really is close to identity, it is far easier for ' +
          'the stacked layers to drive F(x) toward zero than for an unconstrained stack to learn the identity ' +
          'mapping outright.',
      },
      complexity: {
        train:
          'Compute per block is similar to an equivalent plain conv block (the shortcut addition is negligible ' +
          'extra cost); total cost scales with chosen depth (18-152 layers in the original paper)',
        predict:
          'One forward pass; latency scales with depth and channel width, with bottleneck blocks (1x1->3x3->1x1) ' +
          'used at depth 50+ to control it',
      },
      code: [
        'import torch.nn as nn',
        '',
        'class ResidualBlock(nn.Module):',
        '    def __init__(self, channels):',
        '        super().__init__()',
        '        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)',
        '        self.bn1 = nn.BatchNorm2d(channels)',
        '        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)',
        '        self.bn2 = nn.BatchNorm2d(channels)',
        '        self.relu = nn.ReLU()',
        '',
        '    def forward(self, x):',
        '        identity = x                              # the shortcut',
        '        out = self.relu(self.bn1(self.conv1(x)))',
        '        out = self.bn2(self.conv2(out))',
        '        out += identity                            # F(x) + x',
        '        return self.relu(out)',
      ].join('\n'),
      // batch-and-layer-normalization is a prometheus id (same batch) -- ResNet's own ablations,
      // cited above, used BN specifically to rule out vanishing gradients as the cause.
      // vanishing-gradients-and-universal-approximation is a deliberate *contrast* link, not a
      // "this causes that" link -- see the file header comment.
      related: [
        'lenet-to-alexnet-to-vgg',
        'batch-and-layer-normalization',
        'vanishing-gradients-and-universal-approximation',
        'inception-and-efficientnet',
        'vision-transformer',
      ],
      references: {
        free: [
          {
            title: 'Dive into Deep Learning — Residual Networks (ResNet) and ResNeXt',
            url: 'https://d2l.ai/chapter_convolutional-modern/resnet.html',
          },
        ],
        papers: [
          {
            title: 'Deep Residual Learning for Image Recognition',
            url: 'https://arxiv.org/abs/1512.03385',
            year: 2015,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 11 — Residual Networks',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'inception-and-efficientnet',
      name: 'Inception & EfficientNet',
      aliases: ['GoogLeNet', 'Inception module', 'compound scaling'],
      tier: 2,
      year: 2014,
      difficulty: 3,
      hook: 'Widens with parallel filter sizes per layer, then later scales depth, width and resolution together.',
      intuition:
        "Two different answers to 'how do we get more accuracy per unit of compute out of a CNN.' Inception " +
        "(2014) answers it inside a single layer: instead of picking one filter size, run 1x1, 3x3 and 5x5 " +
        'convolutions (plus pooling) in parallel on the same input and concatenate their outputs, so the network ' +
        'can use whichever receptive field actually helps at that stage. Cheap 1x1 convolutions squeeze the ' +
        'channel count down first, which is what keeps the parallel branches affordable. EfficientNet (2019) ' +
        'answers a different question: given a fixed extra compute budget, should a network get deeper, wider, or ' +
        'fed higher-resolution images? Prior work tuned these three knobs separately and ad hoc; EfficientNet\'s ' +
        'compound scaling raises all three together by fixed ratios found via a small search, and its baseline ' +
        'network (itself found by neural architecture search) scaled up this way beat much larger hand-designed ' +
        'networks on both accuracy and efficiency.',
      howItWorks: {
        summary:
          'Inception widens a single layer by running several filter sizes in parallel and concatenating them; ' +
          "EfficientNet instead scales an entire network's depth, width and input resolution together by one " +
          'compound coefficient.',
        steps: [
          'Inception module: apply 1x1, 3x3 and 5x5 convolutions (each often preceded by a 1x1 "bottleneck" to cut channels first) plus a pooling branch, all to the same input.',
          "Concatenate the branches' outputs along the channel dimension to form the module's output feature map.",
          'EfficientNet: start from a small, NAS-found baseline network and a single compound coefficient phi.',
          'Scale depth, width and resolution together as fixed powers of phi (found by a small grid search on the baseline), rather than tuning each independently.',
        ],
      },
      whenToUse: [
        "You want more representational flexibility per layer without committing to a single filter size in advance — Inception's multi-branch design",
        "You have a target compute or parameter budget and want the best accuracy obtainable within it, scaled up systematically rather than by trial and error — EfficientNet's compound scaling",
      ],
      whenNotToUse: [
        "Simplicity and ease of implementation/debugging matter more than squeezing out the last bit of accuracy — Inception's multi-branch modules are more fiddly to build and modify than ResNet's uniform blocks",
        'You need the most widely-supported backbone with the largest ecosystem of pretrained checkpoints and tutorials for transfer learning — ResNet and VGG remain more common defaults',
      ],
      facets: {
        task: ['classification'],
        dataType: ['image'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities',
      },
      related: ['resnet-and-skip-connections', 'lenet-to-alexnet-to-vgg', 'transfer-learning', 'scaling-laws'],
      references: {
        free: [
          {
            title: 'Dive into Deep Learning — Multi-Branch Networks (GoogLeNet)',
            url: 'https://d2l.ai/chapter_convolutional-modern/googlenet.html',
          },
        ],
        papers: [
          { title: 'Going Deeper with Convolutions', url: 'https://arxiv.org/abs/1409.4842', year: 2014 },
          {
            title: 'EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks',
            url: 'https://arxiv.org/abs/1905.11946',
            year: 2019,
          },
        ],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'transfer-learning',
      name: 'Transfer Learning',
      aliases: ['fine-tuning', 'frozen feature extraction', 'pretrained-then-adapt'],
      tier: 1,
      year: 2014,
      difficulty: 2,
      hook: 'Starts from a network already trained on millions of images instead of learning features from zero.',
      intuition:
        'A network trained on ImageNet to tell dogs from cats has, as a side effect, learned to detect edges, ' +
        'textures and object parts in its early and middle layers — features useful for almost any image task, ' +
        "not just the one it was trained on. Transfer learning exploits this: instead of initializing a new " +
        'network\'s weights randomly and learning everything from scratch, start from a network already trained ' +
        'on a large dataset and adapt it to a new, usually much smaller, target task. How much to adapt is the ' +
        'real design choice. Freeze the pretrained network entirely and train only a new classifier on top of its ' +
        'output features when the target data is small and similar to the original. Fine-tune some or all of the ' +
        'pretrained weights, continuing backpropagation into the backbone at a lower learning rate, when there is ' +
        'more target data or the task differs more from the original. Either way, features learned once on ' +
        'millions of images do not need to be relearned from a few hundred.',
      howItWorks: {
        summary:
          'Start from a network pretrained on a large source dataset, then either freeze it and train a new head ' +
          'on top, or continue backpropagation into some or all of its weights on the smaller target dataset.',
        steps: [
          'Take a network already trained on a large source dataset (e.g. ImageNet) and discard or replace its final classification layer.',
          "Add a new head (typically one or a few fully-connected layers) matching the target task's number of classes.",
          'Decide how much of the pretrained network to update: freeze it entirely (feature extraction) or unfreeze some/all layers (fine-tuning).',
          'Train on the target dataset — if fine-tuning, use a much lower learning rate on the pretrained layers than on the new head, so existing features are nudged rather than overwritten.',
          'Optionally unfreeze progressively more layers as training on the target task stabilizes.',
        ],
      },
      hyperparameters: [
        {
          name: 'learning rate (pretrained layers vs. new head)',
          what: 'How much the weights are allowed to move per update.',
          tuning:
            'Use a much smaller learning rate for pretrained layers than for the newly-initialized head — large ' +
            'steps in already-good pretrained weights tend to destroy the features being reused.',
        },
        {
          name: 'number of frozen layers',
          what: "How many of the pretrained network's early layers are kept fixed during training.",
          tuning:
            "Per CS231n's own guidance: freeze more when the target dataset is small (to avoid overfitting a " +
            'large network to few examples); unfreeze more when the target dataset is large, since there is ' +
            'enough data to safely re-adapt more of the network.',
        },
      ],
      whenToUse: [
        'The target dataset is small (hundreds to a few thousand labeled images) relative to what training a comparable network from scratch would need',
        'The target task is visually similar to the source dataset (natural images, for most ImageNet-pretrained backbones) so early- and mid-level features transfer directly',
        'Training compute or time is limited and a pretrained backbone gets most of the way there without a full training run from random initialization',
      ],
      whenNotToUse: [
        'The target domain is very different from the source (e.g. medical scans, satellite imagery, spectrograms) — low-level features still often help, but expect a bigger fine-tuning effort and smaller gains than on natural images',
        'There is enough target data and compute to train a comparable network from scratch, and the small remaining accuracy gap is not worth the constraint of inheriting someone else\'s architecture',
        'A large learning rate is applied uniformly across pretrained and new layers — one of the most common transfer-learning failure modes, and it destroys the pretrained features being reused',
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['image'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'fine-tuned-model-on-target-task',
      },
      complexity: {
        train:
          'Much cheaper than training from scratch — typically a handful of epochs over the target set versus the ' +
          'many needed to train the backbone originally',
        predict: "Same as the underlying pretrained architecture's own inference cost",
      },
      code: [
        'import torch',
        'import torchvision.models as models',
        '',
        'model = models.resnet50(weights="IMAGENET1K_V2")   # pretrained on ImageNet',
        'for param in model.parameters():',
        '    param.requires_grad = False                     # freeze the backbone',
        '',
        'model.fc = torch.nn.Linear(model.fc.in_features, n_target_classes)  # new head',
        '',
        'optimizer = torch.optim.Adam([',
        '    {"params": model.fc.parameters(), "lr": 1e-3},        # new layer: normal LR',
        '    {"params": model.layer4.parameters(), "lr": 1e-5},    # unfrozen tail: tiny LR',
        '])',
      ].join('\n'),
      related: [
        'lenet-to-alexnet-to-vgg',
        'resnet-and-skip-connections',
        'inception-and-efficientnet',
        'object-detection',
        'supervised-fine-tuning',
      ],
      references: {
        free: [
          { title: 'CS231n notes — Transfer Learning', url: 'https://cs231n.github.io/transfer-learning/' },
        ],
        papers: [
          {
            title: 'How transferable are features in deep neural networks?',
            url: 'https://arxiv.org/abs/1411.1792',
            year: 2014,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '§14.2 Fine-Tuning',
            url: 'https://d2l.ai/chapter_computer-vision/fine-tuning.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'object-detection',
      name: 'Object Detection (R-CNN family, YOLO)',
      aliases: ['R-CNN', 'Fast R-CNN', 'Faster R-CNN', 'YOLO', 'two-stage detection', 'one-stage detection'],
      tier: 1,
      year: 2014,
      difficulty: 4,
      hook: 'Finds every object in an image and boxes it -- accurate two-stage proposals, or one fast single pass.',
      intuition:
        "Classification answers 'what is in this image'; object detection answers 'what is in this image, and " +
        "exactly where.' The field split into two philosophies that trade accuracy for speed. Two-stage " +
        'detectors, starting with R-CNN, first propose a couple thousand candidate regions that might contain an ' +
        'object, then run a classifier on each one — accurate, because classification happens on focused crops, ' +
        'but slow, because the network runs many times per image. Each R-CNN generation removed a bottleneck: ' +
        'Fast R-CNN shares one convolutional pass across all proposals instead of rerunning the CNN per region; ' +
        'Faster R-CNN replaces the separate, slow region-proposal step (selective search) with a small trainable ' +
        'network that proposes regions from the same shared features. One-stage detectors, starting with YOLO, ' +
        'skip proposals entirely: a single network looks at the whole image once and directly regresses bounding ' +
        'boxes and class scores in one pass, trading a little accuracy for a large speed advantage that makes ' +
        'real-time detection possible.',
      howItWorks: {
        summary:
          'Two-stage detectors first propose candidate regions then classify each one; one-stage detectors skip ' +
          'proposals and regress boxes and classes directly from the whole image in a single pass.',
        steps: [
          'R-CNN: generate ~2000 region proposals per image (selective search), warp and run each through a CNN, then classify with SVMs and refine box coordinates.',
          'Fast R-CNN: run the CNN once over the whole image, then pool features for each proposed region from that single shared feature map (RoI pooling) before classifying.',
          'Faster R-CNN: replace selective search with a Region Proposal Network (RPN) that shares the same convolutional features to generate proposals, making the whole pipeline trainable end-to-end.',
          'YOLO: divide the image into a grid; each cell directly predicts bounding boxes, confidence scores and class probabilities in one forward pass, with no separate proposal stage.',
          'For any method, suppress overlapping duplicate boxes with non-maximum suppression before returning final detections.',
        ],
      },
      hyperparameters: [
        {
          name: 'IoU threshold (non-max suppression / evaluation)',
          what: 'Overlap fraction above which two boxes are considered duplicates (NMS) or a detection is scored as correct (evaluation).',
          tuning:
            "0.5 is the conventional threshold for both, e.g. PASCAL VOC's standard evaluation protocol; raising " +
            'it demands tighter box localization.',
        },
        {
          name: 'number of region proposals (two-stage) / grid size (one-stage)',
          what: 'How many candidate regions are considered (R-CNN family) or how finely the image is divided into prediction cells (YOLO).',
          tuning:
            'More proposals or a finer grid catches more/smaller objects at higher compute cost; fewer trades ' +
            'recall for speed.',
        },
      ],
      whenToUse: [
        'Real-time or near-real-time throughput matters (video, robotics, embedded devices) — one-stage detectors like YOLO trade some accuracy for large speed gains',
        'Maximum localization accuracy matters more than speed and there is budget for slower inference — two-stage detectors (Faster R-CNN) generally edge out one-stage methods on precise box accuracy',
        'Both what and where are needed for every instance in an image, not just a whole-image label — plain classification (see lenet-to-alexnet-to-vgg) has no answer for "where"',
      ],
      whenNotToUse: [
        'Only one label per image is needed, with no localization — whole-image classification is simpler, cheaper and does not need bounding-box-annotated training data',
        'A label is needed for every pixel, not just a box around each object — see unet-and-segmentation for pixel-level segmentation',
        'Training data has few or no bounding-box annotations and acquiring them is not feasible — every method here is trained with box-labeled data, unlike plain classification',
      ],
      facets: {
        task: ['classification'],
        dataType: ['image', 'video'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'bounding-boxes-with-class-labels-and-scores',
      },
      math: {
        latex: ['\\mathrm{IoU}(A, B) = \\frac{|A \\cap B|}{|A \\cup B|}'],
        notes:
          'Intersection-over-Union scores how well a predicted box overlaps the ground-truth box: 1 for a ' +
          'perfect match, 0 for no overlap. It is used twice — to suppress duplicate predicted boxes for the same ' +
          'object (non-maximum suppression, keeping only the highest-confidence box among any group whose ' +
          'pairwise IoU exceeds a threshold) and to decide whether a prediction counts as correct when computing ' +
          'mean average precision (mAP), the standard object-detection accuracy metric.',
      },
      complexity: {
        train:
          'Two-stage methods pay a per-region cost (thousands of proposals per image in R-CNN; one shared CNN ' +
          'pass plus a light per-region head in Fast/Faster R-CNN); one-stage methods pay one full-image forward ' +
          'pass per training step',
        predict:
          'R-CNN: roughly 2000 CNN forward passes per image (slowest); Fast R-CNN: one CNN pass with proposals ' +
          'still generated separately; Faster R-CNN: one network, one pass, ~5fps reported on a GPU for VGG-16 ' +
          'in the original paper; YOLO: one network, one pass, ~45fps reported for the base model',
      },
      code: [
        'import torch',
        'import torchvision',
        'from torchvision.transforms.functional import to_tensor',
        '',
        'model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights="DEFAULT")',
        'model.eval()',
        '',
        'image = to_tensor(pil_image)              # (C, H, W); no batch dimension needed',
        'with torch.no_grad():',
        '    prediction = model([image])[0]',
        '',
        'boxes, labels, scores = prediction["boxes"], prediction["labels"], prediction["scores"]',
        'keep = scores > 0.5                       # simple confidence filter',
      ].join('\n'),
      related: [
        'convolution-and-pooling',
        'resnet-and-skip-connections',
        'unet-and-segmentation',
        'transfer-learning',
        'vision-language-models',
      ],
      references: {
        free: [
          {
            title: 'Wikipedia — Intersection over union (Jaccard index)',
            url: 'https://en.wikipedia.org/wiki/Intersection_over_union',
          },
        ],
        papers: [
          {
            title: 'Rich feature hierarchies for accurate object detection and semantic segmentation',
            url: 'https://arxiv.org/abs/1311.2524',
            year: 2014,
          },
          { title: 'Fast R-CNN', url: 'https://arxiv.org/abs/1504.08083', year: 2015 },
          {
            title: 'Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks',
            url: 'https://arxiv.org/abs/1506.01497',
            year: 2015,
          },
          {
            title: 'You Only Look Once: Unified, Real-Time Object Detection',
            url: 'https://arxiv.org/abs/1506.02640',
            year: 2016,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '§14.8 Region-based CNNs (R-CNNs)',
            url: 'https://d2l.ai/chapter_computer-vision/rcnn.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'unet-and-segmentation',
      name: 'U-Net & Segmentation',
      aliases: ['U-Net', 'semantic segmentation', 'encoder-decoder segmentation'],
      tier: 1,
      year: 2015,
      difficulty: 3,
      hook: 'Labels every pixel by mirroring a shrinking encoder with a growing decoder, joined by skip connections.',
      intuition:
        'Classification collapses an image down to one label; segmentation needs a label for every single pixel, ' +
        'so simply shrinking the image away, as a classifier does, throws away exactly the spatial detail the ' +
        'task needs back at the end. U-Net solves this with a symmetric, U-shaped architecture. The contracting ' +
        'path (encoder) is an ordinary conv-and-pool stack that repeatedly halves resolution while learning ' +
        'increasingly abstract features — what is in the image. The expansive path (decoder) mirrors it, ' +
        'repeatedly upsampling back toward full resolution — where it is. The key trick is the skip connections ' +
        "that copy each encoder stage's high-resolution feature maps directly across to the matching decoder " +
        'stage, so fine spatial detail lost during downsampling is recovered rather than reconstructed from ' +
        'scratch. Designed for biomedical images, where labeled training data is scarce, U-Net was built to train ' +
        'well from only a few dozen annotated images using heavy data augmentation, and remains a default ' +
        'starting architecture whenever pixel-level output is needed.',
      howItWorks: {
        summary:
          'Downsample through a convolutional encoder to capture context, upsample back through a mirrored ' +
          'decoder to recover resolution, and concatenate matching-resolution encoder features into the decoder ' +
          'at each stage.',
        steps: [
          'Contracting path: repeated 3x3 conv + ReLU pairs followed by 2x2 max pooling, doubling channel depth and halving spatial resolution at each stage.',
          'At the bottleneck, the representation is small spatially but rich in learned, abstract features.',
          'Expansive path: repeated upsampling followed by 3x3 conv + ReLU pairs, doubling spatial resolution and halving channel depth at each stage.',
          "Skip connections: concatenate each encoder stage's feature map onto the matching-resolution decoder stage before its convolutions, restoring fine spatial detail.",
          'A final 1x1 convolution maps to per-pixel class scores, trained with a (optionally weighted) pixel-wise cross-entropy loss.',
        ],
      },
      hyperparameters: [
        {
          name: 'loss weight map (w0, sigma)',
          what: 'Per-pixel weighting added to the cross-entropy loss to up-weight the narrow separation border between touching instances of the same class.',
          tuning:
            'The original paper uses w0=10 and sigma≈5 pixels to force the network to learn a thin background ' +
            'border between touching cells; tune sigma to roughly the typical gap that needs resolving.',
        },
        {
          name: 'input tile size / overlap-tile strategy',
          what: 'How a large image is split into tiles for inference when it does not fit in memory.',
          tuning:
            'Ronneberger et al. mirror-pad missing context at tile borders (overlap-tile) rather than simply ' +
            'cropping, so border predictions get the same amount of surrounding context as interior ones.',
        },
      ],
      whenToUse: [
        'Every pixel needs its own class label, not just one label for the whole image — medical scans, satellite/aerial imagery, or any task needing a precise mask',
        'Labeled training data is scarce (tens to low hundreds of annotated images) — U-Net was explicitly designed and demonstrated to train well from very few images plus aggressive data augmentation',
        'Precise localization of boundaries matters (e.g. separating touching or adjacent objects), which the encoder-decoder skip-connection design is built to preserve',
      ],
      whenNotToUse: [
        'Only a whole-image label or a handful of bounding boxes is needed — plain classification or object detection is cheaper to train and label for',
        'Object instances of the same class overlap heavily and must be individually counted or separated — plain U-Net produces a class mask, not separate instance ids, without further post-processing or an instance-segmentation extension',
        'Training images are enormous and cannot be tiled without losing essential global context that a purely local encoder-decoder cannot see across',
      ],
      facets: {
        task: ['classification'],
        dataType: ['image'],
        dataSize: ['tiny', 'small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'per-pixel-class-mask',
      },
      math: {
        latex: [
          'E = \\sum_{x} w(x) \\log\\big(p_{\\ell(x)}(x)\\big)',
          'w(x) = w_c(x) + w_0 \\cdot \\exp\\!\\left(-\\frac{(d_1(x)+d_2(x))^2}{2\\sigma^2}\\right)',
        ],
        notes:
          'E is the pixel-wise weighted cross-entropy loss summed over all pixels x, where p_l(x)(x) is the ' +
          'softmax probability of the true class l(x) at pixel x. w_c is a per-class weight (e.g. to rebalance ' +
          'class frequencies); the second term, added by Ronneberger, Fischer and Brox specifically for ' +
          'biomedical images, spikes the weight near the border between two touching objects of the same class — ' +
          'd1 and d2 are the distances to the nearest and second-nearest object border — so the loss forces the ' +
          'network to output a thin background gap separating them rather than merging them into one blob.',
      },
      complexity: {
        train:
          'One forward+backward pass per tile per training step; cost dominated by the encoder/decoder conv ' +
          'stack, comparable to a similarly-deep plain CNN plus the extra decoder half',
        predict:
          'One forward pass per tile (or per image, for images that fit in memory); the overlap-tile strategy ' +
          'adds redundant compute at tile borders for arbitrarily large images',
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        '',
        'def conv_block(c_in, c_out):',
        '    return nn.Sequential(',
        '        nn.Conv2d(c_in, c_out, 3, padding=1), nn.ReLU(),',
        '        nn.Conv2d(c_out, c_out, 3, padding=1), nn.ReLU(),',
        '    )',
        '',
        'class UNetStage(nn.Module):',
        '    """One encoder-decoder pair: downsample, then upsample and concatenate the skip."""',
        '    def __init__(self, c_in, c_out):',
        '        super().__init__()',
        '        self.enc = conv_block(c_in, c_out)',
        '        self.pool = nn.MaxPool2d(2)',
        '        self.up = nn.ConvTranspose2d(c_out, c_out, 2, stride=2)',
        '        self.dec = conv_block(c_out * 2, c_out)   # *2: concatenated with the skip',
        '',
        '    def forward(self, x):',
        '        skip = self.enc(x)',
        '        x = self.up(self.pool(skip))',
        '        x = torch.cat([x, skip], dim=1)           # the skip connection',
        '        return self.dec(x)',
      ].join('\n'),
      related: ['convolution-and-pooling', 'resnet-and-skip-connections', 'object-detection', 'diffusion-models-ddpm'],
      references: {
        free: [
          { title: 'Wikipedia — Image segmentation', url: 'https://en.wikipedia.org/wiki/Image_segmentation' },
        ],
        papers: [
          {
            title: 'U-Net: Convolutional Networks for Biomedical Image Segmentation',
            url: 'https://arxiv.org/abs/1505.04597',
            year: 2015,
          },
        ],
        books: [
          {
            title: 'Dive into Deep Learning',
            author: 'Zhang, Lipton, Li & Smola',
            chapter: '§14.9 Semantic Segmentation and the Dataset',
            url: 'https://d2l.ai/chapter_computer-vision/semantic-segmentation-and-dataset.html',
          },
        ],
        video: [{ title: 'StatQuest', url: 'https://www.youtube.com/@statquest' }],
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: 'vision-transformer',
      name: 'Vision Transformer',
      aliases: ['ViT', 'An Image is Worth 16x16 Words'],
      tier: 1,
      year: 2020,
      difficulty: 4,
      hook: 'Cuts an image into patches and feeds them to a plain transformer -- no convolution, given enough data.',
      intuition:
        'Every architecture on this body up to this point bakes in the same assumption: a pattern found in one ' +
        'part of an image should be detected the same way anywhere else, because a shared filter slides across ' +
        'the whole thing. The Vision Transformer throws that assumption away. It slices an image into a grid of ' +
        'fixed-size patches (16x16 pixels, in the original paper), flattens and linearly projects each patch into ' +
        'a token, adds a learned position embedding, and feeds the resulting sequence straight into a standard ' +
        'transformer encoder — the same self-attention architecture built for text, with no convolution anywhere. ' +
        "Losing convolution's built-in translation-equivariance and locality is a real cost, not a free upgrade: " +
        'on ImageNet-sized training data alone, ViT trails a comparable ResNet by a few accuracy points, because ' +
        'it has to learn from scratch what convolution assumed for free. Pretrained on hundreds of millions of ' +
        'images instead, that gap closes and reverses — with enough data, learning the right inductive bias beats ' +
        'hard-coding one.',
      howItWorks: {
        summary:
          'Split an image into fixed-size patches, linearly embed each as a token with a position embedding, and ' +
          'process the resulting sequence with a standard transformer encoder exactly as for text.',
        steps: [
          'Split the input image into a grid of fixed-size, non-overlapping patches (16x16 pixels in the original paper).',
          "Flatten each patch and linearly project it into a token embedding at the transformer's expected dimensionality.",
          'Prepend a learnable [class] token and add learned position embeddings to every token, since attention has no built-in notion of position.',
          'Feed the resulting sequence through a standard transformer encoder (multi-head self-attention + MLP blocks).',
          "Feed the final [class] token's representation into a small classification head.",
        ],
      },
      hyperparameters: [
        {
          name: 'patch size',
          what: 'Side length of each square image patch tokenized (e.g. 16x16 or 32x32 pixels).',
          tuning:
            'Smaller patches give a longer token sequence and finer spatial detail at quadratically higher ' +
            'attention cost; the paper\'s naming ("16x16 words") reflects its default configuration.',
        },
        {
          name: 'pretraining dataset scale',
          what: 'Size of the dataset ViT is pretrained on before fine-tuning on the target task.',
          tuning:
            "The paper's own results: ViT trails ResNets when pretrained on ImageNet-1k alone; the gap closes on " +
            'ImageNet-21k (roughly 14M images) and reverses on JFT-300M (roughly 300M images) — the model needs ' +
            "scale specifically because it lacks convolution's built-in inductive bias.",
        },
      ],
      whenToUse: [
        'Large-scale pretraining data is available (tens of millions of images or more), or a strong ViT checkpoint already pretrained at that scale can be fine-tuned',
        'A single architecture family shared with text/multimodal transformers is wanted, e.g. for a joint vision-language model',
        "Modeling long-range relationships across the whole image matters more than the local, translation-equivariant patterns convolution is built to exploit"
      ],
      whenNotToUse: [
        "Training data is mid-sized (ImageNet-scale, ~1M images) or smaller and strong regularization/distillation is not part of the plan — the paper's own results show ViT trailing comparable ResNets by a few accuracy points in exactly this regime",
        "Compute or memory is tightly constrained — self-attention cost grows quadratically with the number of patch tokens, unlike convolution's local, linear-in-image-size cost",
        "Convolution's built-in translation-equivariance and locality are wanted as a modeling assumption rather than something the network must learn from data — e.g. very limited data with no pretrained checkpoint available",
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['image'],
        dataSize: ['large', 'massive'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'class-probabilities',
      },
      math: {
        latex: [
          '\\mathbf{z}_0 = [\\mathbf{x}_{\\text{class}}; \\mathbf{x}_p^1\\mathbf{E}; \\dots; \\mathbf{x}_p^N\\mathbf{E}] + \\mathbf{E}_{pos}',
        ],
        notes:
          "Each of the N flattened image patches x_p^i (dimension P^2 * C for a PxP patch with C channels) is " +
          "linearly projected by a shared matrix E into the transformer's embedding dimension, exactly as a " +
          'token embedding lookup maps a word to a vector in a text transformer. A learnable class token is ' +
          'prepended and a learned position embedding E_pos is added to every token, since self-attention itself ' +
          'has no notion of spatial order — everything downstream (see self-attention, Nova) is unchanged from ' +
          'the text transformer.',
      },
      complexity: {
        train:
          "Self-attention cost scales as O(N^2 * d) in the number of patch tokens N and embedding dimension d, " +
          "versus convolution's cost scaling linearly with image area",
        predict: 'One forward pass through the transformer encoder; cost dominated by the same O(N^2 * d) attention term',
      },
      code: [
        'import torch',
        'import torch.nn as nn',
        '',
        'class PatchEmbed(nn.Module):',
        '    """Turn an image into a sequence of patch tokens -- everything after this is a text transformer."""',
        '    def __init__(self, img_size=224, patch_size=16, in_chans=3, embed_dim=768):',
        '        super().__init__()',
        '        n_patches = (img_size // patch_size) ** 2',
        '        self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)',
        '        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))',
        '        self.pos_embed = nn.Parameter(torch.zeros(1, n_patches + 1, embed_dim))',
        '',
        '    def forward(self, x):',
        '        x = self.proj(x).flatten(2).transpose(1, 2)      # (B, n_patches, embed_dim)',
        '        cls = self.cls_token.expand(x.shape[0], -1, -1)',
        '        x = torch.cat([cls, x], dim=1)',
        '        return x + self.pos_embed',
      ].join('\n'),
      // self-attention is Nova (already exists, cross-body) -- ViT reuses the standard text
      // transformer encoder unchanged, per the paper's own architecture.
      related: ['self-attention', 'resnet-and-skip-connections', 'convolution-and-pooling', 'transfer-learning'],
      references: {
        free: [
          { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
          {
            title: 'Dive into Deep Learning — Transformers for Vision',
            url: 'https://d2l.ai/chapter_attention-mechanisms-and-transformers/vision-transformer.html',
          },
        ],
        papers: [
          {
            title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
            url: 'https://arxiv.org/abs/2010.11929',
            year: 2020,
          },
        ],
        books: [
          {
            title: 'Understanding Deep Learning',
            author: 'Prince',
            chapter: 'Ch. 12 — Transformers',
            url: 'https://udlbook.github.io/udlbook/',
          },
        ],
        video: [{ title: '3Blue1Brown', url: 'https://www.3blue1brown.com/' }],
      },
    },
  ],
} satisfies Body;
