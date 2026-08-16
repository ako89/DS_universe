/**
 * Arachne — Graph Learning. See PLAN.md §3 for the full moon list.
 *
 * All 6 moons from PLAN.md §3, at their marked tiers — 4 Tier 1 (graph-representation-and-
 * message-passing, graph-convolutional-networks, graph-attention-networks, node2vec-and-deepwalk)
 * and 2 Tier 2 stubs (graphsage, link-prediction-and-graph-pooling).
 *
 * `eraRange` spans 2009 (Scarselli, Gori, Tsoi, Hagenbuchner & Monfardini's "The Graph Neural
 * Network Model", IEEE TNN — the earliest formalization of learned iterative neighbor-state
 * propagation on graphs, which graph-representation-and-message-passing is built around) to 2017
 * (GraphSAGE and GAT, both submitted the same year) — the earliest and latest `year` field among
 * the six moons on this body.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source (arXiv /abs/ pages and their
 * ar5iv HTML full-text renderings, not PDFs; library docs; a verified free book), verify every
 * URL, then write. Every arXiv paper cited here was read via its /abs/ page for bibliographic
 * facts and, where a specific equation or number was needed, via ar5iv's HTML rendering — never
 * a WebFetch PDF summary, per the PDF-fetch warning in CONTENT_GUIDE §3. Two specific claims were
 * cross-checked this way and held up: GAT's paper explicitly cites Vaswani et al. 2017 ("Attention
 * is all you need") and Bahdanau et al. 2015 as its direct inspiration (confirmed by reading the
 * ar5iv-rendered introduction, not inferred) — the basis for its cross-body link to Nova's
 * self-attention; and node2vec's paper states in its own words "the sampling strategy in DeepWalk
 * can be seen as a special case of node2vec with p=1 and q=1" (also read directly, not assumed
 * from general knowledge of the two methods' reputations).
 *
 * Deliberate cross-body links, each checked against a real source rather than assumed from
 * reputation: graph-convolutional-networks → spectral-clustering (Jupiter) because Kipf &
 * Welling's own paper derives the GCN propagation rule as a first-order truncation of spectral
 * graph convolutions built on the graph Laplacian — the same object spectral clustering
 * eigendecomposes. graph-representation-and-message-passing → backpropagation-and-autodiff
 * (Prometheus) because every message/update function in the framework (Gilmer et al.'s MPNN
 * formalization) is a small learned network trained by ordinary backprop; there is no
 * graph-specific training rule. node2vec-and-deepwalk → word2vec-and-glove (Babel) because both
 * methods are explicit, acknowledged applications of word2vec's skip-gram objective to random
 * walks instead of sentences (DeepWalk's own paper frames this as its central move), and →
 * svd-and-truncated-svd (Saturn) because Qiu et al.'s NetMF paper (WSDM 2018, arXiv 2017) proves
 * DeepWalk's skip-gram training implicitly factorizes a closed-form matrix derived from the
 * graph's normalized Laplacian — a genuine matrix-factorization equivalence, not a loose analogy,
 * confirmed by reading the paper's own abstract rather than assumed.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'arachne',
  name: 'Arachne',
  segment: 'Graph Learning',
  hook: "Learns from data that is naturally a network — nodes, edges, and the structure linking them — not a table.",
  summary:
    'Arachne covers algorithms built for graph-structured data — social networks, molecules, citation graphs — ' +
    'where the relationships between entities carry as much signal as the entities themselves. It spans ' +
    'message-passing neural networks that learn directly from graph structure and random-walk methods that ' +
    'embed nodes without training a network at all.',
  eraRange: [2009, 2017],
  moons: [
    {
      id: 'graph-representation-and-message-passing',
      name: 'Graph Representation & Message Passing',
      aliases: ['message passing neural networks', 'MPNN', 'graph neural network model'],
      tier: 1,
      year: 2009,
      difficulty: 3,
      hook: 'Represents data as nodes and edges, then has every node update itself from what its neighbors send it.',
      intuition:
        'A photo is a fixed grid and a sentence is a fixed sequence, which is why convolution and recurrence work ' +
        'on them: there is a consistent notion of "next to" to exploit. A social network, a molecule, or a road ' +
        'map has no such grid — a node can have three neighbors or three hundred, in no particular order. Message ' +
        'passing is the trick that lets a neural network learn from data shaped like that anyway. Every node ' +
        'holds a state vector, starting from its own features. At each round, every node builds a message for ' +
        'each neighbor, every node collects the messages it receives and combines them with a function that does ' +
        'not care what order they arrived in (sum, mean, or max), and then updates its own state from that ' +
        'combined message. Stack several rounds and a node\'s state comes to summarize its neighborhood several ' +
        'hops out. A final readout turns per-node states into a node-, edge-, or whole-graph-level prediction.',
      howItWorks: {
        summary:
          'Turn each node\'s neighbors\' states into messages, aggregate those messages with a ' +
          'permutation-invariant function, and use the result to update the node\'s own state — repeating for ' +
          'several rounds, then reading out a prediction.',
        steps: [
          'Represent the graph as a node feature matrix, an edge list (with optional edge features), and an adjacency structure.',
          'Initialize each node\'s hidden state to its input feature vector.',
          'At each round, every node computes a message from its own state, each neighbor\'s state, and the connecting edge, using a learned function.',
          'Aggregate the incoming messages at each node with a permutation-invariant function (sum, mean, or max) so the result does not depend on neighbor order.',
          'Update each node\'s hidden state from its previous state and the aggregated message, usually with a small neural network.',
          'Repeat for several rounds, then read out a node-, edge-, or whole-graph-level prediction from the final states with a permutation-invariant readout function.',
        ],
      },
      hyperparameters: [
        {
          name: 'Number of message-passing rounds (layers)',
          what: 'How many hops of neighbor information reach each node\'s final state.',
          tuning:
            'Each round only reaches one more hop, but stacking too many collapses distinct nodes\' representations ' +
            'toward the same value (over-smoothing); most GNNs use 2-4 rounds rather than the dozens of layers common in CNNs.',
        },
        {
          name: 'Aggregation function',
          what: 'How incoming messages at a node are combined — sum, mean, or max.',
          tuning:
            'Sum is the most expressive choice: it is injective over a multiset of neighbor states, which mean and ' +
            'max are not, and Xu et al. (2018) show this is exactly what makes Graph Isomorphism Networks provably ' +
            'as powerful as the Weisfeiler-Lehman graph isomorphism test. Mean is the common default when neighbor ' +
            'count varies a lot and raw magnitude should not dominate.',
        },
      ],
      whenToUse: [
        'Data is naturally relational — entities and the connections between them both carry signal — rather than independent rows in a table',
        'You need predictions at the node, edge, or whole-graph level, and want the model to use the graph structure directly rather than hand-engineered graph statistics',
        'The task benefits from combining node features with multi-hop structural context, e.g. molecular property prediction or citation-network classification',
      ],
      whenNotToUse: [
        'The data is not genuinely graph-structured — forcing a graph representation onto tabular or grid data adds complexity a simpler model does not need',
        'The graph is extremely large and dense enough that full-neighborhood message passing at every round is too expensive — a sampling-based variant like GraphSAGE is needed instead',
        'Very long-range dependencies matter and the graph\'s diameter is large — reaching a distant node requires that many rounds, and over-smoothing makes very deep stacks unreliable',
      ],
      facets: {
        task: ['representation', 'classification'],
        dataType: ['graph'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'node-edge-or-graph-level-representations',
      },
      math: {
        latex: [
          'm_v^{t+1} = \\sum_{w \\in N(v)} M_t(h_v^t, h_w^t, e_{vw})',
          'h_v^{t+1} = U_t(h_v^t, m_v^{t+1})',
          '\\hat{y} = R(\\{h_v^T : v \\in G\\})',
        ],
        notes:
          'M_t and U_t are learned, differentiable functions (typically small MLPs) shared across every node at ' +
          'round t; R must itself be invariant to node ordering, since a graph has no canonical order to begin ' +
          'with. Gilmer et al. (2017) showed that this single framework — vary only M, U and R — already ' +
          'describes GCN, gated graph neural networks, and several earlier graph-convolution proposals as special ' +
          'cases, which is why "message passing" is treated as the umbrella the rest of this body specializes.',
      },
      complexity: {
        train: 'O(T · |E|) per forward pass for T rounds of message passing, since every edge contributes one message per round',
        predict: 'O(T · |E|) — inference re-runs the same message-passing computation as training',
      },
      code: [
        'from torch_geometric.nn import MessagePassing',
        'from torch.nn import Linear, Parameter',
        'import torch',
        '',
        'class MyMessagePassingLayer(MessagePassing):',
        '    def __init__(self, in_channels, out_channels):',
        '        super().__init__(aggr="add")          # permutation-invariant aggregator',
        '        self.lin = Linear(in_channels, out_channels, bias=False)',
        '        self.bias = Parameter(torch.empty(out_channels))',
        '',
        '    def forward(self, x, edge_index):',
        '        x = self.lin(x)',
        '        return self.propagate(edge_index, x=x)   # runs message -> aggregate -> update',
        '',
        '    def message(self, x_j):        # x_j: neighbor features for every edge',
        '        return x_j',
        '',
        '    def update(self, aggr_out):    # aggr_out: summed messages per node',
        '        return aggr_out + self.bias',
      ].join('\n'),
      related: ['graph-convolutional-networks', 'graph-attention-networks', 'graphsage', 'backpropagation-and-autodiff'],
      references: {
        free: [
          { title: 'Distill — A Gentle Introduction to Graph Neural Networks', url: 'https://distill.pub/2021/gnn-intro/' },
          { title: 'PyTorch Geometric — Creating Message Passing Networks', url: 'https://pytorch-geometric.readthedocs.io/en/latest/tutorial/create_gnn.html' },
        ],
        papers: [
          { title: 'The Graph Neural Network Model', url: 'https://doi.org/10.1109/TNN.2008.2005605', year: 2009 },
          { title: 'Neural Message Passing for Quantum Chemistry', url: 'https://arxiv.org/abs/1704.01212', year: 2017 },
          { title: 'How Powerful are Graph Neural Networks?', url: 'https://arxiv.org/abs/1810.00826', year: 2018 },
        ],
        books: [
          {
            title: 'Graph Representation Learning',
            author: 'Hamilton',
            chapter: 'Ch. 5 — The Graph Neural Network Model',
            url: 'https://www.cs.mcgill.ca/~wlh/grl_book/',
          },
        ],
        video: [{ title: 'Stanford CS224W — Machine Learning with Graphs', url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rPLKxIpqhjhPgdQy7imNkDn' }],
      },
    },
    {
      id: 'graph-convolutional-networks',
      name: 'Graph Convolutional Networks (GCN)',
      aliases: ['GCN', 'spectral graph convolution (first-order approximation)'],
      tier: 1,
      year: 2016,
      difficulty: 3,
      hook: 'Averages each node\'s features with its neighbors\', degree-normalized, through one shared filter.',
      intuition:
        'GCN is the specific, simplest instantiation of message passing that most people picture when they hear ' +
        '"graph neural network." Its message is just a neighbor\'s linearly transformed features; its aggregation ' +
        'is a sum reweighted by node degree, so a node with a hundred neighbors does not get a hundred times the ' +
        'signal of one with a single neighbor. Kipf & Welling motivate this specific rule as a cheap ' +
        'approximation to spectral graph convolution — filtering a signal in the eigenbasis of the graph ' +
        'Laplacian, which is mathematically principled but expensive — truncated to first order, so each layer ' +
        'only reaches one hop, exactly like message passing with one round. To keep the operation numerically ' +
        'stable when layers are stacked, self-loops are added and the adjacency matrix is symmetrically ' +
        'normalized by degree before every layer, rather than added as a separate "remember yourself" step.',
      howItWorks: {
        summary:
          'Add self-loops to the graph, symmetrically normalize the adjacency matrix by node degree, and ' +
          'propagate node features through that normalized neighborhood with one shared linear layer per round, ' +
          'followed by a nonlinearity.',
        steps: [
          'Add a self-loop to every node so a node\'s own features survive the aggregation.',
          'Compute the degree matrix of the self-looped graph and form the symmetric normalization of the adjacency matrix.',
          'Multiply the normalized adjacency by the current layer\'s node feature matrix, mixing every node\'s features with its degree-weighted neighbors\'.',
          'Apply a shared learnable weight matrix and a nonlinearity (usually ReLU) to the mixed features.',
          'Stack layers to reach farther neighbors — each layer reaches exactly one more hop.',
          'Feed the final layer\'s node representations into a task head, e.g. softmax for node classification.',
        ],
      },
      hyperparameters: [
        {
          name: 'Number of layers',
          what: 'How many hops of the graph each node\'s final representation summarizes.',
          tuning:
            'Kipf & Welling used 2 layers for citation-network node classification; going much deeper tends to ' +
            'over-smooth node representations toward the same value rather than improving accuracy, unlike CNNs.',
        },
        {
          name: 'Hidden units per layer',
          what: 'Width of the intermediate node representations.',
          tuning:
            'The original paper used 16 hidden units in its 2-layer citation-network models — small relative to ' +
            'typical CNN widths, since GCNs on citation graphs overfit quickly with more capacity; pair extra width with dropout.',
        },
      ],
      whenToUse: [
        'Data is naturally a graph — a citation network, social graph, or molecule — and both node features and graph structure should inform the prediction',
        'You want a simple, well-understood baseline GNN with one well-tested propagation rule before trying attention- or sampling-based variants',
        'The graph is available in full at both training and test time (transductive setting), as in semi-supervised node classification on a fixed graph',
      ],
      whenNotToUse: [
        'New, previously unseen nodes need embeddings after training without retraining — plain GCN\'s propagation is defined over the fixed training graph; use GraphSAGE instead',
        'The graph is very large and the full adjacency and feature matrices do not comfortably fit in memory — the propagation rule scales with the number of edges every layer',
        'Neighbors should count differently regardless of degree — GCN\'s normalization weights every neighbor by degree, not by learned relevance; use GAT if that distinction matters',
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['graph'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'node-embeddings-and-labels',
      },
      math: {
        latex: [
          '\\tilde{A} = A + I_N, \\qquad \\tilde{D}_{ii} = \\sum_j \\tilde{A}_{ij}',
          'H^{(l+1)} = \\sigma\\left(\\tilde{D}^{-1/2} \\tilde{A} \\tilde{D}^{-1/2} H^{(l)} W^{(l)}\\right)',
        ],
        notes:
          'This propagation rule is the first-order (K=1) truncation of a Chebyshev-polynomial spectral filter; ' +
          'the "renormalization trick" swaps the more naive I_N + D^{-1/2}AD^{-1/2} (eigenvalues in [0,2], ' +
          'numerically unstable when layers are stacked) for the self-looped, degree-normalized ' +
          'D̃^{-1/2}ÃD̃^{-1/2}. A "graph convolution" here is not a learned filter shape the way a CNN kernel is — ' +
          'the neighborhood-mixing structure is fixed entirely by the graph; only the weight matrix W is learned.',
      },
      complexity: {
        train: 'O(|E|·C·H·F) per layer — linear in the number of graph edges, for C input channels, H hidden units and F output features',
        predict: 'Same as one forward pass through the stacked propagation rule — O(|E|·C·H·F) per layer',
      },
      code: [
        'import torch.nn.functional as F',
        'from torch_geometric.nn import GCNConv',
        '',
        'class GCN(torch.nn.Module):',
        '    def __init__(self, num_features, num_classes):',
        '        super().__init__()',
        '        self.conv1 = GCNConv(num_features, 16)',
        '        self.conv2 = GCNConv(16, num_classes)',
        '',
        '    def forward(self, x, edge_index):',
        '        x = F.relu(self.conv1(x, edge_index))',
        '        x = F.dropout(x, training=self.training)',
        '        x = self.conv2(x, edge_index)',
        '        return F.log_softmax(x, dim=1)',
        '',
        'model = GCN(dataset.num_features, dataset.num_classes)',
        'out = model(data.x, data.edge_index)',
      ].join('\n'),
      // spectral-clustering is the genuine cross-body link: Kipf & Welling derive the GCN
      // propagation rule directly from spectral graph convolutions on the graph Laplacian, the
      // same object spectral clustering eigendecomposes.
      related: ['graph-representation-and-message-passing', 'graph-attention-networks', 'graphsage', 'spectral-clustering'],
      references: {
        free: [
          { title: 'PyTorch Geometric — GCNConv', url: 'https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GCNConv.html' },
          { title: 'Distill — Understanding Convolutions on Graphs', url: 'https://distill.pub/2021/understanding-gnns/' },
        ],
        papers: [
          { title: 'Semi-Supervised Classification with Graph Convolutional Networks', url: 'https://arxiv.org/abs/1609.02907', year: 2016 },
          { title: 'Convolutional Neural Networks on Graphs with Fast Localized Spectral Filtering', url: 'https://arxiv.org/abs/1606.09375', year: 2016 },
        ],
        books: [
          {
            title: 'Graph Representation Learning',
            author: 'Hamilton',
            chapter: 'Ch. 5 — The Graph Neural Network Model',
            url: 'https://www.cs.mcgill.ca/~wlh/grl_book/',
          },
        ],
        video: [{ title: 'Stanford CS224W — Machine Learning with Graphs', url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rPLKxIpqhjhPgdQy7imNkDn' }],
      },
    },
    {
      id: 'graphsage',
      name: 'GraphSAGE (inductive neighbor sampling)',
      aliases: ['GraphSAGE', 'sample and aggregate'],
      tier: 2,
      year: 2017,
      difficulty: 3,
      hook: 'Learns a function to embed any node — even one never seen in training — by sampling and aggregating its neighbors.',
      intuition:
        'GCN computes representations using the whole training graph at once, which is a problem the moment a new ' +
        'node shows up: the model has nothing to fall back on for it. GraphSAGE — "sample and aggregate" — fixes ' +
        'this by learning a function instead of relying on the fixed graph. For any node, take a fixed-size ' +
        'random sample of its neighbors, run their features through a chosen aggregator (elementwise mean, an ' +
        'LSTM over a random neighbor order, or a max-pooling network), and concatenate the result with the ' +
        'node\'s own features before a linear layer and nonlinearity. Because the aggregator\'s weights do not ' +
        'depend on which specific node they are applied to, the exact same function runs on a node the model ' +
        'never trained on — even one from an entirely different graph — which is what makes GraphSAGE inductive rather than transductive.',
      howItWorks: {
        summary:
          'Sample a fixed number of neighbors at each of several depths, aggregate their representations with a ' +
          'chosen function, and concatenate the result with the node\'s own representation through a learned ' +
          'layer — repeatable on nodes never seen during training.',
        steps: [
          'For each node, uniformly sample a fixed-size set of neighbors at each of K depths (the paper uses 25 then 10).',
          'Aggregate the sampled neighbors\' representations from the previous depth with mean, LSTM, or max-pooling aggregation.',
          'Concatenate the aggregated neighbor vector with the node\'s own representation and pass it through a weight matrix and nonlinearity.',
          'Apply the same aggregator and weights to any node, including ones absent from the training graph, to embed it inductively.',
        ],
      },
      whenToUse: [
        'New nodes appear after training and need embeddings without retraining — a growing social network or an evolving citation graph',
        'The graph is too large to run full-neighborhood GCN-style propagation, and fixed-size neighbor sampling is needed to bound per-batch compute',
      ],
      whenNotToUse: [
        'The graph is small, fixed, and fully available at both train and test time — plain GCN\'s propagation rule is simpler and needs no sampling scheme',
        'Every neighbor should contribute, not a random subsample — sampling discards information a full-neighborhood aggregator would keep',
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['graph'],
        dataSize: ['medium', 'large', 'massive'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'inductive-node-embeddings',
      },
      related: ['graph-convolutional-networks', 'graph-attention-networks', 'graph-representation-and-message-passing'],
      references: {
        free: [
          { title: 'GraphSAGE project page (Stanford SNAP)', url: 'http://snap.stanford.edu/graphsage/' },
          { title: 'PyTorch Geometric — SAGEConv', url: 'https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.SAGEConv.html' },
        ],
        papers: [{ title: 'Inductive Representation Learning on Large Graphs', url: 'https://arxiv.org/abs/1706.02216', year: 2017 }],
      },
    },
    {
      id: 'graph-attention-networks',
      name: 'Graph Attention Networks (GAT)',
      aliases: ['GAT', 'graph self-attention'],
      tier: 1,
      year: 2017,
      difficulty: 4,
      hook: 'Learns how much attention to pay each neighbor instead of weighting them all by degree.',
      intuition:
        'GCN treats every neighbor\'s contribution as fixed by graph structure alone — every neighbor of a given ' +
        'node gets the same implicit weight, set by degree normalization, regardless of how relevant it actually ' +
        'is to the task. GAT replaces that fixed rule with a learned one. For every edge, compute a compatibility ' +
        'score between the two endpoints\' transformed features, normalize the scores across a node\'s neighbors ' +
        'with softmax, and use them as attention weights when summing neighbor features into the node\'s new ' +
        'representation. This is the same masked self-attention idea the Transformer uses — the paper cites ' +
        'Vaswani et al.\'s "Attention is all you need" and Bahdanau et al.\'s earlier attention mechanism directly ' +
        'as its inspiration — just restricted to a node\'s actual graph neighbors instead of an entire sequence. ' +
        'Because the attention function is shared and computed from features alone, GAT works without the whole ' +
        'graph\'s adjacency structure being fixed in advance, unlike GCN\'s precomputed normalization.',
      howItWorks: {
        summary:
          'Compute an attention score between every node and each of its neighbors from their transformed ' +
          'features, normalize the scores with softmax, and use them to weight the neighbor features summed into ' +
          'the node\'s new representation.',
        steps: [
          'Linearly transform every node\'s features with a shared weight matrix.',
          'For each edge (i, j), compute an unnormalized attention score by applying a shared single-layer feedforward network (with LeakyReLU) to the concatenation of the transformed features of i and j.',
          'Normalize the scores over each node\'s neighborhood with softmax to get attention coefficients that sum to 1.',
          'Compute the node\'s new representation as the attention-weighted sum of its neighbors\' transformed features, passed through a nonlinearity.',
          'Run K independent attention heads in parallel; concatenate their outputs on hidden layers, average them on the final layer.',
        ],
      },
      hyperparameters: [
        {
          name: 'Number of attention heads (K)',
          what: 'How many independent attention mechanisms run per layer.',
          tuning:
            'The original paper used K=8 heads on citation networks and K=4 (K=6 on the final layer) for the ' +
            'inductive protein-interaction task; more heads add stability and capacity at roughly linear extra cost per head.',
        },
        {
          name: 'Attention dropout',
          what: 'Dropout applied to the normalized attention coefficients themselves, not just the features.',
          tuning:
            'Regularizes which specific neighbors a node relies on from run to run, which matters more on small ' +
            'citation-network training sets than on large, densely labeled ones.',
        },
      ],
      whenToUse: [
        'Neighbors plausibly matter differently — some genuinely more relevant to the task than others — and the model should learn that weighting rather than assume degree-based normalization',
        'The full graph structure is not fixed or known upfront — attention coefficients are computed from node features alone, not a precomputed normalized adjacency matrix',
        'Some interpretability into which neighbors most influenced a prediction is useful, via the learned attention weights',
      ],
      whenNotToUse: [
        'The graph is enormous and scoring every edge, for every head, becomes the bottleneck — plain GCN or a sampling method like GraphSAGE is cheaper per edge',
        'Neighbors are genuinely close to interchangeable for the task — the extra attention parameters buy little over GCN\'s simpler fixed averaging and add overfitting risk on small graphs',
      ],
      facets: {
        task: ['classification', 'representation'],
        dataType: ['graph'],
        dataSize: ['small', 'medium'],
        interpretability: 'medium',
        trainingCost: 'medium',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'node-embeddings-and-attention-weights',
      },
      math: {
        latex: [
          'e_{ij} = \\text{LeakyReLU}\\left(a^{T} [Wh_i \\, \\| \\, Wh_j]\\right)',
          '\\alpha_{ij} = \\frac{\\exp(e_{ij})}{\\sum_{k \\in N_i} \\exp(e_{ik})}',
          'h_i^{\\prime} = \\sigma\\left(\\sum_{j \\in N_i} \\alpha_{ij} W h_j\\right)',
        ],
        notes:
          '[·‖·] denotes concatenation and a is a shared learnable vector — effectively a single-layer network ' +
          'scoring how relevant j\'s features are to i. Because alpha_ij is normalized only over i\'s actual ' +
          'neighbors N_i, this is a masked form of the scaled dot-product self-attention used in the Transformer, ' +
          'restricted to the edges the graph actually has rather than an entire sequence.',
      },
      complexity: {
        train: 'O(|V|·F·F\' + |E|·F\') for input features F, output features per head F\', |V| nodes and |E| edges — linear in nodes and edges, computed independently per head',
        predict: 'Same per-layer cost as training — one forward pass through the same attention computation',
      },
      code: [
        'import torch.nn.functional as F',
        'from torch_geometric.nn import GATConv',
        '',
        'class GAT(torch.nn.Module):',
        '    def __init__(self, num_features, num_classes, heads=8):',
        '        super().__init__()',
        '        self.conv1 = GATConv(num_features, 8, heads=heads, dropout=0.6)',
        '        # heads are concatenated after conv1: 8 * heads output features',
        '        self.conv2 = GATConv(8 * heads, num_classes, heads=1, concat=False, dropout=0.6)',
        '',
        '    def forward(self, x, edge_index):',
        '        x = F.elu(self.conv1(x, edge_index))',
        '        x = self.conv2(x, edge_index)',
        '        return F.log_softmax(x, dim=1)',
      ].join('\n'),
      // self-attention (Nova) is the genuine cross-body link: GAT's own paper cites Vaswani et
      // al. 2017 and Bahdanau et al. 2015 directly as the inspiration for its attention mechanism.
      related: ['graph-convolutional-networks', 'graph-representation-and-message-passing', 'graphsage', 'self-attention'],
      references: {
        free: [
          { title: 'PyTorch Geometric — GATConv', url: 'https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.conv.GATConv.html' },
          { title: 'Distill — Understanding Convolutions on Graphs', url: 'https://distill.pub/2021/understanding-gnns/' },
        ],
        papers: [{ title: 'Graph Attention Networks', url: 'https://arxiv.org/abs/1710.10903', year: 2017 }],
        books: [
          {
            title: 'Graph Representation Learning',
            author: 'Hamilton',
            chapter: 'Ch. 6 — Graph Neural Networks in Practice',
            url: 'https://www.cs.mcgill.ca/~wlh/grl_book/',
          },
        ],
        video: [{ title: 'Stanford CS224W — Machine Learning with Graphs', url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rPLKxIpqhjhPgdQy7imNkDn' }],
      },
    },
    {
      id: 'node2vec-and-deepwalk',
      name: 'node2vec & DeepWalk',
      aliases: ['random-walk node embeddings', 'skip-gram graph embeddings'],
      tier: 1,
      year: 2014,
      difficulty: 3,
      hook: 'Turns random walks over a graph into "sentences" and runs word2vec on them to embed every node.',
      intuition:
        'DeepWalk noticed that random walks over a graph produce sequences of nodes with the same short-range ' +
        'co-occurrence statistics that word2vec was built to exploit in text — so treat each walk as a sentence ' +
        'and each node as a word, and run the skip-gram model directly: learn a vector per node that is good at ' +
        'predicting the nodes that co-occur with it within a fixed window along the walk. Because scoring every ' +
        'node against every other node is too slow, DeepWalk uses hierarchical softmax over a binary tree of ' +
        'nodes to make training tractable. node2vec keeps this same skip-gram machinery but replaces DeepWalk\'s ' +
        'uniform random walk with a biased one controlled by two parameters: p, the chance of immediately ' +
        'backtracking, and q, which steers the walk toward breadth-first, structural exploration or depth-first, ' +
        'far-ranging exploration. DeepWalk is exactly node2vec\'s p=q=1 special case.',
      howItWorks: {
        summary:
          'Generate many random walks from every node, treat each walk as a sentence of node IDs, and train a ' +
          'skip-gram model to predict nearby nodes in the walk from a target node\'s embedding.',
        steps: [
          'From every node, simulate several random walks of fixed length (node2vec: biased by return parameter p and in-out parameter q; DeepWalk: uniform, i.e. p=q=1).',
          'Slide a context window along each walk, pairing each node with the other nodes that fall within the window.',
          'Train a skip-gram model, exactly like word2vec, to maximize the probability of a node\'s window co-occurrences given its embedding.',
          'Use hierarchical softmax (DeepWalk) or negative sampling to make the co-occurrence probability tractable over a large vocabulary of nodes.',
          'Take the learned per-node embedding matrix as the final representation, usable for downstream classification, clustering, or link prediction.',
        ],
      },
      hyperparameters: [
        {
          name: 'Walk length and walks per node',
          what: 'How far each random walk travels and how many independent walks start from each node.',
          tuning:
            'node2vec\'s experiments used a walk length of 80 and 10 walks per node as a starting point; longer or ' +
            'more walks trade training time for better coverage of each node\'s neighborhood.',
        },
        {
          name: 'Return parameter p, in-out parameter q (node2vec only)',
          what: 'Bias the walk toward backtracking (low p) versus exploring, and toward BFS-like local structure (q>1) versus DFS-like reach (q<1).',
          tuning:
            'Grid search p and q over {0.25, 0.5, 1, 2, 4} on a validation task, per the original paper\'s protocol ' +
            '— p=q=1 recovers plain DeepWalk as a baseline to compare against.',
        },
      ],
      whenToUse: [
        'Node embeddings are needed from graph structure alone, with no node features required — unlike GCN or GraphSAGE, which need feature vectors to propagate',
        'The graph is fixed and fully available upfront (transductive) — every node ever queried is present when the model is trained',
        'Whether the embedding captures local community structure or broader structural roles should be tunable, via node2vec\'s p and q',
      ],
      whenNotToUse: [
        'The graph has rich node or edge features the embedding should use directly — random-walk methods see only graph structure, not attributes, unlike GNNs',
        'New nodes need embeddings after training without rerunning walks and retraining — these methods are transductive, unlike GraphSAGE',
        'The graph is extremely large and dense — simulating enough walks per node, and training skip-gram over a huge node vocabulary, gets expensive',
      ],
      facets: {
        task: ['representation'],
        dataType: ['graph'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'node-embeddings',
      },
      math: {
        latex: [
          '\\max_{f} \\sum_{u \\in V} \\log \\Pr(N_S(u) \\mid f(u))',
          '\\alpha_{pq}(t,x) = 1/p \\text{ if } d_{tx}=0, \\quad 1 \\text{ if } d_{tx}=1, \\quad 1/q \\text{ if } d_{tx}=2',
        ],
        notes:
          'N_S(u) is the set of nodes visited within a fixed window of u across the sampled walks — the graph ' +
          'analogue of a skip-gram context. alpha_pq is the unnormalized bias applied to node2vec\'s second-order ' +
          'random-walk transition probability: it depends only on the shortest-path distance d_tx between the ' +
          'previously visited node t and the candidate next node x, which is what lets p and q steer the walk ' +
          'between BFS-like and DFS-like exploration without tracking the whole walk history. Qiu et al. (2017) ' +
          'later showed DeepWalk\'s skip-gram training implicitly factorizes a closed-form matrix built from the ' +
          'graph\'s normalized Laplacian — the objective above is not "just" a language-modeling trick borrowed ' +
          'wholesale; it has a matrix-factorization reading too.',
      },
      complexity: {
        train:
          'node2vec: O(a^2|V|) space to precompute second-order transition probabilities for average degree a, ' +
          'then near-linear in the number of sampled walk steps to train skip-gram; DeepWalk\'s hierarchical ' +
          'softmax reduces the per-step cost from O(|V|) to O(log|V|)',
        predict: 'n/a — transductive; embeddings exist only for nodes present at training time',
      },
      code: [
        'import networkx as nx',
        'from node2vec import Node2Vec',
        '',
        'graph = nx.fast_gnp_random_graph(n=100, p=0.05)',
        '',
        '# precompute biased 2nd-order walks; p = q = 1 reduces this exactly to DeepWalk',
        'n2v = Node2Vec(graph, dimensions=64, walk_length=30, num_walks=200, p=1, q=1, workers=4)',
        '',
        'model = n2v.fit(window=10, min_count=1, batch_words=4)   # trains skip-gram via gensim',
        'embedding = model.wv["2"]                                  # 64-dim vector for node "2"',
        'model.wv.most_similar("2")',
      ].join('\n'),
      // word2vec-and-glove and svd-and-truncated-svd are genuine cross-body links: DeepWalk's own
      // paper frames applying word2vec's skip-gram to random walks as its central move, and Qiu et
      // al. (2017) prove DeepWalk's training implicitly factorizes a Laplacian-derived matrix.
      related: ['graph-representation-and-message-passing', 'word2vec-and-glove', 'svd-and-truncated-svd', 't-sne'],
      references: {
        free: [
          { title: 'node2vec project page (Stanford SNAP)', url: 'https://snap.stanford.edu/node2vec/' },
          { title: 'node2vec (Python package README)', url: 'https://github.com/eliorc/node2vec' },
        ],
        papers: [
          { title: 'DeepWalk: Online Learning of Social Representations', url: 'https://arxiv.org/abs/1403.6652', year: 2014 },
          { title: 'node2vec: Scalable Feature Learning for Networks', url: 'https://arxiv.org/abs/1607.00653', year: 2016 },
          { title: 'Network Embedding as Matrix Factorization: Unifying DeepWalk, LINE, PTE, and node2vec', url: 'https://arxiv.org/abs/1710.02971', year: 2017 },
        ],
        books: [
          {
            title: 'Graph Representation Learning',
            author: 'Hamilton',
            chapter: 'Ch. 3 — Neighborhood Reconstruction Methods',
            url: 'https://www.cs.mcgill.ca/~wlh/grl_book/',
          },
        ],
        video: [{ title: 'Stanford CS224W — Machine Learning with Graphs', url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rPLKxIpqhjhPgdQy7imNkDn' }],
      },
    },
    {
      id: 'link-prediction-and-graph-pooling',
      name: 'Link Prediction & Graph Pooling',
      tier: 2,
      year: 2016,
      difficulty: 3,
      hook: 'Scores whether an edge should exist between two nodes, and pools a graph into one vector for graph-level tasks.',
      intuition:
        'These are two different problems that both build on node embeddings. Link prediction asks: given two ' +
        'nodes\' representations, how likely is an edge between them? The simplest approach decodes a pair of ' +
        'embeddings with an inner product — a graph autoencoder trains a GNN encoder against exactly that ' +
        'objective, reconstructing which edges exist from the embeddings it produces. A heavier but more powerful ' +
        'approach (SEAL) skips embeddings and instead extracts the local subgraph around a candidate pair, labels ' +
        'each node by its distance to the two endpoints, and classifies the whole subgraph as edge-or-not with a ' +
        'GNN. Graph pooling solves a different problem: message passing produces one vector per node, but ' +
        'graph-level tasks — is this molecule toxic? — need one vector for the whole graph. Pooling methods like ' +
        'DiffPool learn to cluster nodes into coarser "super-nodes" at each layer, shrinking the graph the way stride pooling shrinks an image.',
      howItWorks: {
        summary:
          'Link prediction scores node pairs from their embeddings or a labeled enclosing subgraph; graph pooling ' +
          'learns to coarsen a graph\'s nodes into clusters across layers so a whole graph collapses to one vector.',
        steps: [
          'Link prediction (embedding-based): train a GNN encoder, then score a candidate pair with a decoder such as the inner product of their embeddings.',
          'Link prediction (subgraph-based, SEAL): extract the enclosing subgraph around a candidate pair, label nodes by their distance to both endpoints, and classify the subgraph with a GNN.',
          'Graph pooling (DiffPool): at each layer, learn a soft cluster-assignment matrix mapping the current nodes onto a smaller number of clusters.',
          'Use that assignment matrix to coarsen both the adjacency matrix and the node features into the next, smaller layer, repeating until one graph-level vector remains.',
        ],
      },
      whenToUse: [
        'Missing or future edges need predicting — recommending a connection, completing a knowledge graph, or predicting a drug-target interaction',
        'A whole-graph prediction is needed (molecule property, graph classification) and simple global averaging of node embeddings loses too much structure',
      ],
      whenNotToUse: [
        'Only node-level predictions or attributes on edges that already exist are needed — plain node classification does not need either technique',
        'The graph is large and dense enough that SEAL\'s per-pair subgraph extraction, or DiffPool\'s dense assignment matrix, becomes the bottleneck — a simpler inner-product decoder or global mean pooling scales further',
      ],
      facets: {
        task: ['classification', 'ranking'],
        dataType: ['graph'],
        dataSize: ['small', 'medium', 'large'],
        interpretability: 'low',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'edge-scores-and-graph-level-embeddings',
      },
      related: ['graph-convolutional-networks', 'graph-representation-and-message-passing', 'node2vec-and-deepwalk'],
      references: {
        free: [{ title: 'PyTorch Geometric — GAE (Graph Auto-Encoder)', url: 'https://pytorch-geometric.readthedocs.io/en/latest/generated/torch_geometric.nn.models.GAE.html' }],
        papers: [
          { title: 'Variational Graph Auto-Encoders', url: 'https://arxiv.org/abs/1611.07308', year: 2016 },
          { title: 'Link Prediction Based on Graph Neural Networks', url: 'https://arxiv.org/abs/1802.09691', year: 2018 },
          { title: 'Hierarchical Graph Representation Learning with Differentiable Pooling', url: 'https://arxiv.org/abs/1806.08804', year: 2018 },
        ],
      },
    },
  ],
} satisfies Body;
