/**
 * Odyssey — Reinforcement Learning. See PLAN.md §3 for the full moon list.
 *
 * All 10 moons from PLAN.md §3, written at their marked tiers — 9 Tier 1 (mdps-and-bellman-equation,
 * value-and-policy-iteration, q-learning-and-sarsa, dqn, policy-gradients-and-reinforce, actor-critic,
 * ppo, mcts-and-alphazero, multi-armed-bandits) and 1 Tier 2 stub (trpo-sac-ddpg).
 *
 * `eraRange` spans 1952 (Robbins' "Some Aspects of the Sequential Design of Experiments", the paper
 * every source credits as introducing the sequential-decision problem now called the multi-armed
 * bandit) to 2017 (Schulman et al.'s PPO paper) — the earliest and latest `year` field among the ten
 * moons written here. Several entries bundle two or three historically-linked techniques under one
 * id (mdps-and-bellman-equation, value-and-policy-iteration, q-learning-and-sarsa, mcts-and-alphazero,
 * trpo-sac-ddpg); each such entry's `year` is the origin year of whichever technique is named first in
 * its id, following the precedent set in jupiter.ts (optics-and-mean-shift uses OPTICS's 1999, not
 * mean shift's 2002; association-rules uses Apriori's 1994, not FP-Growth's 2000). q-learning-and-sarsa
 * follows k-means' precedent of using the method's origin date (Watkins' 1989 Cambridge PhD thesis,
 * where Q-learning was introduced) rather than its first fully-refereed publication (Watkins & Dayan's
 * 1992 Machine Learning paper, which is what is actually cited in `references.papers` since the thesis
 * has no reliably fetchable page). dqn uses 2013 (the original "Playing Atari" arXiv paper introducing
 * DQN), not 2015 (the later, more complete Nature paper) — this is deliberate and is the whole reason
 * the entry's `howItWorks` and intuition draw a lineage line between the two rather than treating them
 * as one paper: the target network, one of DQN's two signature stabilization tricks, was NOT part of
 * the 2013 paper and was only added in the 2015 Nature version. This was checked directly (search
 * corroboration across multiple independent summaries of the Nature abstract), not assumed from
 * familiarity with the algorithm.
 *
 * Researched per CONTENT_GUIDE §3 — search, open a real source, verify every URL, then write.
 *
 * PDF-fetch trap caught: PPO's clip range (epsilon = 0.2) is exactly the kind of specific number the
 * CONTENT_GUIDE §3 PDF warning calls out. WebFetch on the PPO arXiv /abs/ page and an ar5iv HTML
 * rendering both failed to surface the actual objective/epsilon text (the abs page has no body text,
 * and the ar5iv fetch returned only navigation chrome). Rather than trust a WebFetch summary of the
 * PDF, the PDF was downloaded directly and run through `pdftotext -layout`, and the sentence "where
 * epsilon is a hyperparameter, say, = 0.2" was located verbatim in the self-extracted text before it
 * was used anywhere in this file.
 *
 * Deliberate cross-body links, verified rather than assumed: dqn -> multilayer-perceptron / optimizers
 * (Prometheus) and -> loss-functions (Sol) because DQN's TD-error objective is trained by ordinary
 * backprop and gradient-based optimizers, exactly like any supervised regressor. policy-gradients-and-
 * reinforce and actor-critic -> gradient-descent (Sol) because both are literally gradient ascent on a
 * parameterized policy. mcts-and-alphazero -> mcmc (Neptune): both are Monte Carlo methods in the
 * literal sense of estimating a value by simulation/sampling rather than exact computation, though the
 * actual machinery (tree search + UCB1 vs. Markov-chain sampling of a posterior) is not the same thing
 * — the link is deliberately about the shared sampling-based-estimation principle, not identical
 * mechanics, and is phrased that way in the reasoning above rather than overstated in the entry itself.
 * multi-armed-bandits -> bayesian-optimization (Uranus): both are principled answers to the same
 * explore/exploit tradeoff. mdps-and-bellman-equation -> hidden-markov-models (Neptune): both are built
 * directly on the Markov property.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'odyssey',
  name: 'Odyssey',
  segment: 'Reinforcement Learning',
  hook: 'Learns what to do from trial, error and reward alone — no labelled examples, just consequences.',
  summary:
    'Odyssey covers reinforcement learning: how an agent that only ever observes states, takes actions and receives ' +
    'rewards can learn a policy that maximizes reward over time, from tabular dynamic programming through to the deep ' +
    'policy- and value-based methods that plan, play games, and (later, on Forge) get steered by human feedback.',
  eraRange: [1952, 2017],
  moons: [
    {
      id: 'mdps-and-bellman-equation',
      name: 'Markov Decision Processes & the Bellman Equation',
      aliases: ['MDP', 'Bellman equation'],
      tier: 1,
      year: 1957,
      difficulty: 2,
      hook: "Frames sequential decisions as states and actions, then gives one equation a state's value must satisfy.",
      intuition:
        'Think of a hiker choosing trails on a mountain: at every junction, only the current position matters for ' +
        'deciding what to do next, not how she got there. That no-memory property is what makes a Markov Decision ' +
        'Process tractable — the world is described by states, the choices available in each state are actions, ' +
        'and moving between states hands out a reward, some now and some later. Because rewards can arrive many ' +
        'steps after the decision that caused them, evaluating a choice means accounting for everything that ' +
        'follows it, not just the next step. The Bellman equation is the tool that makes that recursion ' +
        'computable: it says the value of a state, if you act well, equals the immediate reward plus the ' +
        'discounted value of wherever that action leads. It is not itself an algorithm — it is a consistency ' +
        'condition, an equation any correct value function must satisfy — but nearly every method on this planet, ' +
        'from value iteration to Q-learning to deep policy networks, is at bottom a way of enforcing it.',
      howItWorks: {
        summary:
          'Define states, actions, transition probabilities and rewards, then write the value of a state as the ' +
          'reward it earns plus the discounted value of the state the chosen action leads to.',
        steps: [
          'Define the state space: everything the agent needs to know to decide, and nothing about how it got there (the Markov property).',
          'Define the action space available in each state, and the transition probabilities linking a state-action pair to the next state.',
          'Define the reward function and a discount factor gamma < 1 that shrinks the weight of rewards further in the future.',
          "Write the Bellman expectation equation: a state's value under policy pi is the expected immediate reward plus gamma times the expected value of the next state.",
          "Write the Bellman optimality equation by replacing the policy-weighted expectation with a max over actions — what an optimal value function must satisfy.",
        ],
      },
      whenToUse: [
        "The problem is genuinely sequential — a decision now changes what is available or optimal later, not just today's payoff",
        'A Markov state exists or can be engineered: enough information is available at each step to decide without consulting the full history',
        'You need the formal object (states, actions, transitions, rewards) that every solution method on this planet builds on top of, before picking one',
      ],
      whenNotToUse: [
        'The available observation does not summarize enough of the history to be Markov and cannot be fixed by adding recent context to the state (a POMDP, needing different tools)',
        'There is no real state transition at all — the choice at each step does not affect future options or rewards, in which case a multi-armed bandit is the simpler, correct model',
        'The state or action space is enormous or continuous and you plan to stop at the formalism — actually solving it needs value iteration, policy iteration, or a learning method, not the equation alone',
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'value-function',
      },
      math: {
        latex: [
          "V^\\pi(s) = \\mathbb{E}_\\pi\\left[ R(s,a) + \\gamma V^\\pi(s') \\mid s \\right]",
          "V^*(s) = \\max_a \\; \\mathbb{E}\\left[ R(s,a) + \\gamma V^*(s') \\right]",
        ],
        notes:
          'The first line describes the value of following a fixed policy pi; the second replaces that expectation ' +
          'with a max over actions and defines V*, the best possible value function. Q(s,a), the value of taking a ' +
          'specific action then acting optimally after, satisfies the same recursion one level down — it is what ' +
          'Q-learning learns directly instead of V.',
      },
      code: [
        'import numpy as np',
        '',
        '# tiny 1D MDP: 5 states, move left/right, reward for reaching the right edge',
        'n_states, gamma = 5, 0.9',
        'R = np.array([0, 0, 0, 0, 1])          # reward for landing in each state',
        'V = np.zeros(n_states)',
        '',
        'for _ in range(100):                    # apply the Bellman backup until it stops changing',
        '    V_new = V.copy()',
        '    for s in range(n_states):',
        '        left  = R[max(s - 1, 0)] + gamma * V[max(s - 1, 0)]',
        '        right = R[min(s + 1, n_states - 1)] + gamma * V[min(s + 1, n_states - 1)]',
        '        V_new[s] = max(left, right)     # Bellman optimality equation',
        '    V = V_new',
      ].join('\n'),
      // hidden-markov-models (Neptune) is the genuine cross-body link: both are built directly on
      // the Markov property, just applied to control vs. inference.
      related: ['value-and-policy-iteration', 'q-learning-and-sarsa', 'hidden-markov-models'],
      references: {
        free: [{ title: 'UC Berkeley CS 188 — Markov Decision Processes', url: 'https://inst.eecs.berkeley.edu/~cs188/textbook/mdp/markov-decision-processes.html' }],
        papers: [
          {
            title: 'A Markovian Decision Process',
            url: 'http://www.iumj.indiana.edu/IUMJ/fulltext.php?artid=56038&year=1957&volume=6',
            year: 1957,
          },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 3 — Finite Markov Decision Processes',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'value-and-policy-iteration',
      name: 'Value Iteration & Policy Iteration',
      aliases: ['dynamic programming for MDPs'],
      tier: 1,
      year: 1957,
      difficulty: 2,
      hook: "Solves a known MDP exactly by repeated Bellman backups, or by alternating policy evaluation and improvement.",
      intuition:
        "If you already know an MDP's transition probabilities and rewards exactly — a board game with known " +
        'rules, a small inventory model — you do not need to learn anything from experience; you can compute the ' +
        "optimal policy directly by iterating the Bellman equation until it stops changing. Value iteration does " +
        "this the blunt way: start with an arbitrary guess for every state's value, repeatedly replace each one " +
        'with the best immediate reward plus the discounted value of what follows, and stop once the values ' +
        'barely move. Policy iteration takes a more structured route: fix a policy, solve exactly for its value by ' +
        'evaluation, then improve the policy by acting greedily with respect to that value, and repeat. Policy ' +
        'iteration usually needs far fewer outer iterations because it commits to a policy improvement immediately ' +
        'rather than only implicitly through a max, though each of its evaluation steps is more expensive than one ' +
        'value-iteration sweep.',
      howItWorks: {
        summary:
          'Value iteration repeatedly applies the Bellman optimality backup to every state until values converge; ' +
          'policy iteration alternates exactly evaluating a fixed policy and greedily improving it.',
        steps: [
          'Value iteration: initialize V(s) = 0 for every state.',
          'Value iteration: repeatedly replace V(s) with the max over actions of the expected immediate reward plus gamma times V of the next state, for every state.',
          'Value iteration: stop when the largest change in V across all states falls below a threshold, then extract the policy by taking the argmax action at each state.',
          'Policy iteration: start from any policy and repeat two steps until the policy stops changing.',
          "Policy iteration — evaluation: solve exactly for the current policy's value function (no max, just that fixed policy's expected return).",
          "Policy iteration — improvement: update the policy to act greedily with respect to that value function at every state.",
        ],
      },
      whenToUse: [
        "The MDP's transition probabilities and reward function are fully known in advance — this is planning, not learning from interaction",
        'The state and action spaces are small enough to represent every state\'s value in a table, roughly thousands rather than millions of states',
        'You want a guaranteed-optimal solution rather than an approximation, and can afford to compute it offline before deploying a policy',
      ],
      whenNotToUse: [
        'You do not know the transition probabilities or reward function — use a learning method like Q-learning or SARSA that estimates them from interaction instead',
        'The state space is continuous or too large to enumerate — tabular sweeps over every state are not feasible without function approximation',
        "You need each outer loop to be cheap — policy iteration's exact evaluation step solves a linear system over all states, more expensive per iteration than one value-iteration sweep",
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'policy-and-value-function',
      },
      math: {
        latex: [
          "V_{k+1}(s) = \\max_a \\sum_{s'} P(s'|s,a)\\left[ R(s,a,s') + \\gamma V_k(s') \\right]",
          "V^{\\pi}(s) = \\sum_{s'} P(s'|s,\\pi(s))\\left[ R(s,\\pi(s),s') + \\gamma V^{\\pi}(s') \\right]",
        ],
        notes:
          'The first line is the value-iteration update: applying it repeatedly is applying the Bellman optimality ' +
          'operator, a gamma-contraction guaranteed to converge to V* regardless of the initial guess. The second ' +
          'line is policy evaluation, solved exactly as a linear system for a fixed policy pi; policy improvement ' +
          "then sets pi(s) to the argmax of the same expression value iteration's max uses.",
      },
      complexity: {
        train:
          "O(|S|^2|A|) per sweep for value iteration; policy iteration's evaluation step solves an |S| x |S| linear " +
          'system exactly, more expensive per outer iteration but usually needing far fewer outer iterations',
        predict: 'O(1) — read the precomputed policy at the current state',
      },
      code: [
        'import numpy as np',
        '',
        'def value_iteration(P, R, gamma=0.9, theta=1e-6):',
        '    n_states, n_actions = R.shape',
        '    V = np.zeros(n_states)',
        '    while True:',
        '        V_new = np.array([',
        '            max(R[s, a] + gamma * P[s, a] @ V for a in range(n_actions))',
        '            for s in range(n_states)',
        '        ])',
        '        if np.max(np.abs(V_new - V)) < theta:',
        '            break',
        '        V = V_new',
        '    Q = [[R[s, a] + gamma * P[s, a] @ V for a in range(n_actions)] for s in range(n_states)]',
        '    return V, np.argmax(Q, axis=1)',
      ].join('\n'),
      related: ['mdps-and-bellman-equation', 'q-learning-and-sarsa', 'mcts-and-alphazero', 'kalman-filters-and-state-space-models'],
      references: {
        free: [
          { title: 'UC Berkeley CS 188 — Value Iteration', url: 'https://inst.eecs.berkeley.edu/~cs188/textbook/mdp/value-iteration.html' },
          { title: 'UC Berkeley CS 188 — Policy Iteration', url: 'https://inst.eecs.berkeley.edu/~cs188/textbook/mdp/policies-iteration.html' },
        ],
        papers: [
          {
            title: 'A Markovian Decision Process',
            url: 'http://www.iumj.indiana.edu/IUMJ/fulltext.php?artid=56038&year=1957&volume=6',
            year: 1957,
          },
        ],
        books: [
          { title: 'Dynamic Programming and Markov Processes', author: 'Ronald A. Howard' },
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 4 — Dynamic Programming',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'q-learning-and-sarsa',
      name: 'Q-Learning & SARSA',
      aliases: ['temporal-difference control'],
      tier: 1,
      year: 1989,
      difficulty: 2,
      hook: 'Learns action values from experience: Q-learning bootstraps off the best next action, SARSA off the one actually taken.',
      intuition:
        "Value iteration needs to know the MDP's rules in advance; Q-learning and SARSA learn the same kind of " +
        'value function purely by acting and observing what happens, no transition model required. Both keep a ' +
        'table of Q(s,a), the expected return of taking action a in state s and acting well afterward, and both ' +
        'update it after every step using the difference between what was predicted and what was actually ' +
        'observed — a temporal-difference error. They differ in exactly one thing: what next action they assume ' +
        'when computing that error. Q-learning is off-policy — it always bootstraps toward the best action ' +
        'available in the next state, learning the optimal policy even while behaving more randomly to explore. ' +
        'SARSA is on-policy — it bootstraps toward the action its own current policy actually takes next, which ' +
        'makes it learn the value of the policy it is actually running, including the risk of its own ' +
        'exploration, and tends to behave more cautiously near dangerous states as a result.',
      howItWorks: {
        summary:
          "Keep a table of Q(s,a), and after each transition (s, a, r, s') update it toward the observed reward " +
          'plus the discounted value of the next state — using the best next action for Q-learning, or the next ' +
          'action actually taken for SARSA.',
        steps: [
          'Initialize Q(s,a) arbitrarily (commonly zero) for every state-action pair.',
          'In state s, choose action a using an exploration policy, typically epsilon-greedy with respect to the current Q.',
          "Take action a, observe reward r and next state s'.",
          "Q-learning: update Q(s,a) toward r + gamma * max over a' of Q(s', a') — the best available next action, regardless of what the exploration policy would actually do.",
          "SARSA: choose the next action a' from the same exploration policy, and update Q(s,a) toward r + gamma * Q(s', a') — the action the agent will actually take next.",
          'Repeat, decaying the exploration rate over time; both converge to the correct Q-values under standard step-size conditions given enough exploration.',
        ],
      },
      hyperparameters: [
        {
          name: 'alpha (learning rate)',
          what: 'How much each TD error updates Q.',
          tuning:
            'A constant like 0.1 works for stationary tabular problems; decay it over time to satisfy the ' +
            'Robbins-Monro conditions needed for a formal convergence guarantee.',
        },
        {
          name: 'epsilon',
          what: 'Probability of taking a random action instead of the greedy one, controlling exploration.',
          tuning:
            'Start near 1 and decay toward a small floor (e.g. 0.01-0.05) over training so the agent explores ' +
            'early and exploits later.',
        },
      ],
      whenToUse: [
        "You cannot write down the MDP's transition probabilities but can interact with the environment (simulator or real system) and observe rewards",
        'The state-action space is small enough for a table — roughly thousands, not millions, of state-action pairs',
        "Mistakes during learning are cheap or happen only in simulation, and you want Q-learning's off-policy guarantee that it converges to the optimal policy regardless of how it explores",
        "The environment involves risk during training itself (a physical or safety-critical system) and you want SARSA's on-policy value, which accounts for the exploration policy's own mistakes",
      ],
      whenNotToUse: [
        'The state or action space is continuous or too large to tabulate — use DQN or a policy-gradient method with function approximation instead',
        'You need value estimates from raw pixels or unstructured input — a table has no way to generalize across similar-looking states',
        "You need off-policy learning from a fixed batch of already-collected data with no further interaction — plain Q-learning's convergence guarantees assume ongoing exploration of every state-action pair",
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'medium',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'action-value-table',
      },
      math: {
        latex: [
          "Q(s,a) \\leftarrow Q(s,a) + \\alpha \\left[ r + \\gamma \\max_{a'} Q(s',a') - Q(s,a) \\right]",
          "Q(s,a) \\leftarrow Q(s,a) + \\alpha \\left[ r + \\gamma Q(s',a') - Q(s,a) \\right]",
        ],
        notes:
          "The bracketed term in both lines is the TD error. The first line is Q-learning: because it bootstraps " +
          "toward max over a' rather than the action the behaviour policy will actually take, it estimates the " +
          'optimal Q* regardless of the exploration policy, which is what makes it off-policy. The second line is ' +
          'SARSA (State-Action-Reward-State-Action, named for the quintuple it consumes each update): it ' +
          'bootstraps toward the actual next action, so it evaluates and improves the same policy generating its ' +
          'own behaviour.',
      },
      complexity: {
        train: 'O(1) per update — one table lookup and write per step, independent of state-space size beyond storage',
        predict: "O(|A|) to take the argmax action over a state's row",
      },
      code: [
        'import numpy as np',
        '',
        'Q = np.zeros((n_states, n_actions))',
        'alpha, gamma, epsilon = 0.1, 0.99, 0.1',
        '',
        'for episode in range(n_episodes):',
        '    s = env.reset()',
        '    a = epsilon_greedy(Q[s], epsilon)',
        '    done = False',
        '    while not done:',
        '        s2, r, done, _ = env.step(a)',
        '        if algorithm == "q_learning":',
        '            target = r + gamma * np.max(Q[s2])       # best next action',
        '        else:  # sarsa',
        '            a2 = epsilon_greedy(Q[s2], epsilon)',
        '            target = r + gamma * Q[s2, a2]            # actual next action',
        '        Q[s, a] += alpha * (target - Q[s, a])',
        '        s, a = s2, (a2 if algorithm == "sarsa" else epsilon_greedy(Q[s2], epsilon))',
      ].join('\n'),
      related: ['mdps-and-bellman-equation', 'value-and-policy-iteration', 'dqn', 'multi-armed-bandits', 'gradient-descent'],
      references: {
        free: [{ title: 'UC Berkeley CS 188 — Model-Free Learning', url: 'https://inst.eecs.berkeley.edu/~cs188/textbook/rl/mfl.html' }],
        papers: [
          { title: 'Q-learning', url: 'https://doi.org/10.1007/BF00992698', year: 1992 },
          {
            title: 'On-Line Q-Learning Using Connectionist Systems',
            url: 'http://mi.eng.cam.ac.uk/reports/abstracts/robotics/rummery_tr166.html',
            year: 1994,
          },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 6 — Temporal-Difference Learning',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'dqn',
      name: 'Deep Q-Network (DQN)',
      aliases: ['Deep Q-learning'],
      tier: 1,
      year: 2013,
      difficulty: 4,
      hook: "Replaces Q-learning's table with a CNN, then stabilizes the fit with a replay buffer and a lagging target network.",
      intuition:
        'Q-learning needs a table with one entry per state-action pair, which is hopeless once the state is a raw ' +
        '84x84 pixel frame — there are more possible frames than atoms in reach. DQN replaces the table with a ' +
        'convolutional neural network that takes a stack of frames and outputs a Q-value for every action at ' +
        'once, letting it generalize across visually similar states instead of memorizing each one. Training a ' +
        "neural network on its own bootstrapped target is notoriously unstable, though: the target moves every " +
        'time the network updates, and consecutive game frames are highly correlated, which breaks the ' +
        'independence assumption ordinary stochastic gradient descent relies on. DQN fixes both problems with two ' +
        'tricks. Experience replay stores past transitions in a buffer and trains on randomly sampled batches from ' +
        'it, breaking the correlation between consecutive updates. A separate target network, a ' +
        'periodically-refreshed copy of the weights used only to compute the TD target, keeps that target still ' +
        'for a while so the network is not chasing a target that shifts under it every step.',
      howItWorks: {
        summary:
          'Approximate Q(s,a) with a CNN trained by gradient descent on the TD error, sampling uncorrelated ' +
          "minibatches from a replay buffer and computing the target with a separate, slow-moving copy of the network.",
        steps: [
          'Preprocess raw frames (grayscale, downsample, stack the last few frames to give the network a sense of motion).',
          'Feed the frame stack through a CNN that outputs one Q-value per action, no separate forward pass per action needed.',
          "Act epsilon-greedily with respect to the current network's Q-values, and store each transition (s, a, r, s') in a replay buffer.",
          'Sample a random minibatch of past transitions from the buffer, decorrelating consecutive training examples.',
          "Compute the TD target r + gamma * max Q(s', a'; theta-) using a separate target network theta-, not the network being trained.",
          'Minimize the squared (or Huber) error between the predicted Q(s,a;theta) and the target by gradient descent, and periodically copy theta into theta-.',
        ],
      },
      hyperparameters: [
        {
          name: 'replay buffer size',
          what: 'Number of past transitions kept for sampling minibatches.',
          tuning:
            'The original Atari DQN used 1,000,000 transitions; too small and consecutive samples correlate ' +
            'again, too large and old, off-policy transitions dominate training.',
        },
        {
          name: 'target network update frequency',
          what: "How many steps between copying the online network's weights into the target network.",
          tuning:
            'Too frequent reintroduces instability (chasing a moving target); too infrequent slows how quickly ' +
            'improved value estimates propagate. Low thousands of steps is a typical starting point.',
        },
      ],
      whenToUse: [
        'The state is high-dimensional and unstructured (pixels, sensor arrays) where a Q-table cannot generalize across similar states',
        'The action space is discrete and small enough to output one Q-value per action from a single forward pass',
        'You can afford an experience replay buffer in memory and many environment steps — DQN is sample-inefficient compared to more modern methods',
      ],
      whenNotToUse: [
        "The action space is continuous — DQN's max over actions requires enumerating them, which does not work past a small discrete set; use DDPG or SAC instead",
        "The environment is non-stationary within an episode in a way old replay-buffer transitions actively mislead the current policy",
        'You need a stochastic policy (e.g. a multi-agent or partially observed setting where mixed strategies matter) — DQN always outputs a deterministic greedy action',
      ],
      facets: {
        task: ['control'],
        dataType: ['image', 'tabular'],
        dataSize: ['large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'action-values',
      },
      math: {
        latex: [
          "L(\\theta) = \\mathbb{E}_{(s,a,r,s') \\sim D}\\left[ \\left( r + \\gamma \\max_{a'} Q(s',a';\\theta^-) - Q(s,a;\\theta) \\right)^2 \\right]",
        ],
        notes:
          "theta are the online network's weights, trained by gradient descent; theta-minus are the target " +
          "network's weights, copied from theta every C steps and held fixed in between. Squaring the TD error " +
          "turns Q-learning's tabular update into a regression loss trainable by ordinary backpropagation — the " +
          'same loss-function machinery used to train any supervised regressor, applied to a target generated by ' +
          "the network's own (lagged) predictions.",
      },
      complexity: {
        train:
          'One forward and backward pass through the CNN per gradient step, plus O(1) replay buffer sampling — ' +
          'dominated by network size and number of environment steps, typically millions',
        predict: 'One forward pass through the CNN per action selection',
      },
      code: [
        'import torch, torch.nn as nn',
        '',
        'class DQN(nn.Module):',
        '    def __init__(self, n_actions):',
        '        super().__init__()',
        '        self.conv = nn.Sequential(',
        '            nn.Conv2d(4, 32, 8, stride=4), nn.ReLU(),',
        '            nn.Conv2d(32, 64, 4, stride=2), nn.ReLU(),',
        '            nn.Conv2d(64, 64, 3, stride=1), nn.ReLU(),',
        '        )',
        '        self.head = nn.Sequential(nn.Flatten(), nn.Linear(3136, 512), nn.ReLU(), nn.Linear(512, n_actions))',
        '',
        '    def forward(self, x):',
        '        return self.head(self.conv(x))',
        '',
        '# TD target uses a separate, periodically-synced target network:',
        'with torch.no_grad():',
        '    target = reward + gamma * target_net(next_state).max(dim=1).values * (~done)',
        'loss = nn.functional.smooth_l1_loss(policy_net(state).gather(1, action), target.unsqueeze(1))',
      ].join('\n'),
      // multilayer-perceptron / optimizers (Prometheus) and loss-functions (Sol) are genuine cross-body
      // links: DQN's TD-error objective is trained by ordinary backprop and gradient-based optimizers,
      // exactly like any supervised regressor.
      related: ['q-learning-and-sarsa', 'multilayer-perceptron', 'optimizers', 'loss-functions'],
      references: {
        free: [{ title: 'PyTorch tutorial — Reinforcement Learning (DQN)', url: 'https://docs.pytorch.org/tutorials/intermediate/reinforcement_q_learning.html' }],
        papers: [
          { title: 'Playing Atari with Deep Reinforcement Learning', url: 'https://arxiv.org/abs/1312.5602', year: 2013 },
          { title: 'Human-level control through deep reinforcement learning', url: 'https://doi.org/10.1038/nature14236', year: 2015 },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 16 — Applications and Case Studies',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'policy-gradients-and-reinforce',
      name: 'Policy Gradients & REINFORCE',
      aliases: ['score function estimator', 'vanilla policy gradient'],
      tier: 1,
      year: 1992,
      difficulty: 3,
      hook: 'Climbs the gradient of expected return directly, nudging a stochastic policy toward actions that paid off.',
      intuition:
        'Q-learning and SARSA learn values, then derive a policy by taking the best action. Policy gradient methods ' +
        'skip the value function and parameterize the policy directly — a neural network outputting a probability ' +
        'over actions — then adjust those parameters to make good actions more likely, by gradient ascent on ' +
        'expected return. The trick is that you cannot differentiate through the environment: rewards come from a ' +
        'black box you can only sample from. REINFORCE solves this with the score function estimator, also called ' +
        'the log-derivative trick: the gradient of expected return works out to be an expectation of the return ' +
        'multiplied by the gradient of the log-probability of the action taken, estimable from sampled ' +
        "trajectories without ever knowing the environment's dynamics. Weighting every action in an episode by " +
        "that episode's entire return, though, is a very noisy signal — actions get credit or blame for reward " +
        "they had nothing to do with — which is why REINFORCE's raw form has high variance and modern methods " +
        'almost always add a baseline or a learned critic to cut it down.',
      howItWorks: {
        summary:
          'Sample a full episode under the current stochastic policy, then increase the log-probability of every ' +
          'action taken in proportion to the return that followed it.',
        steps: [
          "Parameterize a stochastic policy pi_theta(a|s), typically a neural network outputting action probabilities (or a distribution's parameters for continuous actions).",
          'Run the current policy in the environment for a full episode, recording every state, action and reward.',
          'Compute the return G_t (the discounted sum of future rewards) following each timestep t.',
          'Estimate the policy gradient as the average, over the episode, of G_t times the gradient of log pi_theta(a_t | s_t).',
          'Optionally subtract a baseline (e.g. the average return, or a learned value function) from G_t to reduce variance without introducing bias.',
          'Take a gradient ascent step on theta using that estimate, and repeat with the updated policy.',
        ],
      },
      whenToUse: [
        'The action space is continuous, or otherwise awkward to take a max over — a value-based method like Q-learning cannot act without maximizing over actions',
        'A stochastic policy is genuinely useful, e.g. games with hidden information or multi-agent settings where a deterministic policy is exploitable',
        'You want a method that optimizes the actual objective (expected return) directly rather than an intermediate value function',
      ],
      whenNotToUse: [
        "Sample efficiency matters and you cannot afford many full episodes per update — raw REINFORCE's variance means it needs a lot of data for a reliable gradient estimate",
        'You have not added a baseline or critic yet — vanilla REINFORCE without variance reduction is rarely competitive in practice',
        "The task has very long or infinite-horizon episodes — waiting for a full episode's return before any update is impractical; use an actor-critic method that bootstraps instead",
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular', 'image'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'stochastic-policy',
      },
      math: {
        latex: [
          '\\nabla_\\theta J(\\theta) = \\mathbb{E}_{\\pi_\\theta}\\left[ \\sum_t \\nabla_\\theta \\log \\pi_\\theta(a_t \\mid s_t) \\, G_t \\right]',
          '\\nabla_\\theta J(\\theta) = \\mathbb{E}_{\\pi_\\theta}\\left[ \\sum_t \\nabla_\\theta \\log \\pi_\\theta(a_t \\mid s_t) \\, (G_t - b(s_t)) \\right]',
        ],
        notes:
          'The first line is the REINFORCE gradient estimator, derived from the log-derivative identity applied to ' +
          "trajectory probability — it needs no model of the environment's dynamics, only samples. The second " +
          'subtracts a baseline b(s_t); subtracting any function that does not depend on the action leaves the ' +
          'expectation unchanged (its expected contribution is zero) while reducing the variance of the estimate, ' +
          "which is the mathematical justification for every actor-critic method's value-function baseline.",
      },
      code: [
        'import torch',
        '',
        'log_probs, rewards = [], []',
        'state = env.reset()',
        'done = False',
        'while not done:',
        '    probs = policy_net(state)                    # softmax over actions',
        '    dist = torch.distributions.Categorical(probs)',
        '    action = dist.sample()',
        '    log_probs.append(dist.log_prob(action))',
        '    state, reward, done, _ = env.step(action.item())',
        '    rewards.append(reward)',
        '',
        'returns = discount_cumsum(rewards, gamma=0.99)',
        'returns = (returns - returns.mean()) / (returns.std() + 1e-8)   # simple baseline: normalize',
        'loss = -torch.stack([lp * G for lp, G in zip(log_probs, returns)]).sum()',
        'loss.backward()',
        'optimizer.step()',
      ].join('\n'),
      // gradient-descent (Sol) is a genuine cross-body link: REINFORCE is literally gradient ascent
      // on a parameterized policy, the same machinery Sol catalogues for supervised loss minimization.
      related: ['actor-critic', 'ppo', 'gradient-descent', 'multilayer-perceptron'],
      references: {
        free: [{ title: 'OpenAI Spinning Up — Intro to Policy Optimization', url: 'https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html' }],
        papers: [
          {
            title: 'Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning',
            url: 'https://doi.org/10.1007/BF00992696',
            year: 1992,
          },
          {
            title: 'Policy Gradient Methods for Reinforcement Learning with Function Approximation',
            url: 'https://proceedings.neurips.cc/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html',
            year: 1999,
          },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 13 — Policy Gradient Methods',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'actor-critic',
      name: 'Actor-Critic Methods',
      aliases: ['advantage actor-critic', 'A2C', 'A3C'],
      tier: 1,
      year: 1983,
      difficulty: 3,
      hook: 'Pairs a policy network that picks actions with a value network that grades them, cutting policy-gradient noise.',
      intuition:
        "REINFORCE's actions are only judged once an entire episode finishes, using the full return as a noisy " +
        'verdict on every decision along the way. Actor-critic methods split the job into two parts that train ' +
        'together. The actor is the policy, choosing actions the same way REINFORCE does. The critic is a learned ' +
        'value function that estimates how good a state is, updated the same way TD learning updates a value ' +
        'table — bootstrapping from the next state\'s estimate instead of waiting for the episode to end. The ' +
        "actor then uses the critic's estimate, rather than the raw Monte Carlo return, as its learning signal: " +
        'specifically the advantage, how much better an action did than the critic expected. Because the critic ' +
        'bootstraps, actor-critic methods can update after every step rather than every episode, and because the ' +
        "advantage subtracts out a state's baseline value, the actor's gradient carries far less variance than " +
        "REINFORCE's raw return-weighted version.",
      howItWorks: {
        summary:
          "Train a policy (actor) and a value function (critic) together: the critic estimates state values from " +
          "TD error, and the actor updates using the critic's advantage estimate as a lower-variance replacement " +
          'for the raw return.',
        steps: [
          'Initialize an actor pi_theta(a|s) and a critic V_w(s), typically two small networks (or two heads of one network).',
          "At each step, take action a from the actor, observe reward r and next state s'.",
          "Compute the TD error: delta = r + gamma * V_w(s') - V_w(s), the critic's estimate of the advantage of the action just taken.",
          "Update the critic's weights w to reduce delta (standard TD learning / value-function regression).",
          "Update the actor's weights theta by gradient ascent on log pi_theta(a|s) times delta, using the critic's advantage in place of REINFORCE's Monte Carlo return.",
          'Repeat online, one environment step at a time, rather than waiting for full episodes.',
        ],
      },
      whenToUse: [
        'Episodes are long or effectively continuing, where waiting for a full-episode return (as REINFORCE needs) is impractical',
        'You want lower-variance policy gradient updates than raw REINFORCE without giving up a stochastic, directly-optimized policy',
        'You can afford to train two function approximators (actor and critic) rather than one, and want online, per-step updates',
      ],
      whenNotToUse: [
        'A pure value-based method already fits the problem well (small discrete action space) — Q-learning or DQN is simpler and does not need two networks',
        'The critic is badly miscalibrated early in training — a poor value estimate injects bias into the advantage and can mislead the actor faster than raw high-variance returns would',
        'You need the strongest guarantees against destructively large policy updates — plain actor-critic has no built-in step-size safeguard; use TRPO or PPO for that',
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular', 'image'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'stochastic-policy',
      },
      math: {
        latex: [
          '\\delta_t = r_t + \\gamma V_w(s_{t+1}) - V_w(s_t)',
          '\\nabla_\\theta J(\\theta) \\approx \\mathbb{E}\\left[ \\nabla_\\theta \\log \\pi_\\theta(a_t \\mid s_t) \\, \\delta_t \\right]',
        ],
        notes:
          "delta_t is both the critic's TD error and, in expectation, an estimate of the advantage " +
          'A(s_t,a_t) = Q(s_t,a_t) - V(s_t) — how much better the action taken was than the state\'s average. ' +
          "Using delta in place of REINFORCE's full return G_t is the actor-critic idea in one line: bootstrap " +
          'the credit-assignment signal instead of waiting to observe it exactly.',
      },
      complexity: {
        train: 'One forward/backward pass through both actor and critic per environment step (online variants) or per batch (A2C/A3C-style)',
        predict: 'One forward pass through the actor network per action',
      },
      code: [
        "delta = reward + gamma * critic(next_state) * (1 - done) - critic(state)",
        '',
        'critic_loss = delta.pow(2)                         # TD error, squared, trains the critic',
        "actor_loss  = -log_prob(action) * delta.detach()    # detach: critic's error, not its gradient",
        '',
        '(actor_loss + critic_loss).backward()',
        'optimizer.step()',
      ].join('\n'),
      related: ['policy-gradients-and-reinforce', 'ppo', 'gradient-descent', 'backpropagation-and-autodiff'],
      references: {
        free: [{ title: 'OpenAI Spinning Up — Vanilla Policy Gradient', url: 'https://spinningup.openai.com/en/latest/algorithms/vpg.html' }],
        papers: [
          {
            title: 'Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems',
            url: 'https://doi.org/10.1109/TSMC.1983.6313077',
            year: 1983,
          },
          { title: 'Asynchronous Methods for Deep Reinforcement Learning', url: 'https://arxiv.org/abs/1602.01783', year: 2016 },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 13 — Policy Gradient Methods',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'ppo',
      name: 'Proximal Policy Optimization (PPO)',
      aliases: ['PPO-Clip'],
      tier: 1,
      year: 2017,
      difficulty: 3,
      hook: "Clips how far one update can move a policy — most of TRPO's stability, far less of its machinery.",
      intuition:
        'TRPO keeps policy updates safe by enforcing a hard constraint on how much the new policy can differ from ' +
        'the old one, measured in KL divergence — effective, but expensive, needing a conjugate-gradient solve and ' +
        'a second-order approximation at every step. PPO gets nearly the same safety with plain first-order ' +
        "gradient descent. It looks at the ratio between the new and old policy's probability of the action taken, " +
        'and clips that ratio to a fixed range around 1 — if an update would push the ratio outside that band, ' +
        "PPO's objective simply stops rewarding it any further. Because the objective takes the minimum of the " +
        'clipped and unclipped version, it is a pessimistic bound: it never overstates how much an update actually ' +
        'helped, so there is no incentive to push the ratio far outside the trusted region. The result can be ' +
        'optimized with several epochs of ordinary minibatch stochastic gradient descent on the same batch of ' +
        'collected experience, which is why PPO became the default choice where TRPO used to be necessary.',
      howItWorks: {
        summary:
          "Collect a batch of trajectories under the current policy, then take several epochs of gradient ascent " +
          'on a clipped surrogate objective that stops rewarding updates once the new-to-old policy probability ' +
          'ratio leaves a fixed range.',
        steps: [
          "Roll out the current policy for a batch of timesteps, recording states, actions, rewards and the policy's action probabilities.",
          'Compute an advantage estimate A_t for each timestep (typically via a learned critic and GAE).',
          "Compute the probability ratio r_t(theta) = pi_theta(a_t|s_t) / pi_theta_old(a_t|s_t) between the new and old policy.",
          'Form the clipped surrogate objective: the minimum of r_t * A_t and clip(r_t, 1-epsilon, 1+epsilon) * A_t.',
          'Run several epochs of minibatch gradient ascent on that objective using the same batch of data.',
          'Discard the batch, set the old policy to the new one, and repeat with fresh rollouts.',
        ],
      },
      hyperparameters: [
        {
          name: 'epsilon (clip range)',
          what: 'How far the probability ratio is allowed to move before the objective stops rewarding further change.',
          tuning: 'The original paper uses 0.2 in its main experiments; smaller values are more conservative but slow learning.',
        },
        {
          name: 'epochs per batch',
          what: 'Number of gradient passes over the same collected batch of rollouts before discarding it.',
          tuning:
            'Too many epochs on the same batch drifts the policy far enough from the data that the clip stops ' +
            'approximating a trust region well; a handful (roughly 3-10) is typical.',
        },
      ],
      whenToUse: [
        'You want TRPO-like update stability without implementing conjugate gradients, a KL constraint, or a line search',
        'You can collect fresh on-policy rollouts each iteration — PPO is on-policy and does not reuse old data the way DDPG or SAC do',
        'The action space can be discrete or continuous, and you want one algorithm that handles both reasonably well as a strong default',
      ],
      whenNotToUse: [
        'Sample efficiency is critical and off-policy reuse of past experience is available — SAC or DDPG typically need far fewer environment interactions on continuous-control benchmarks',
        "You need a hard, provable bound on policy change per update — PPO's clip is a heuristic approximation to a trust region, not TRPO's explicit constrained optimization",
        'The reward signal is extremely sparse and the current on-policy batch rarely contains a success to learn from — off-policy methods that replay rare successful transitions generalize that experience further',
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular', 'image'],
        dataSize: ['large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'stochastic-policy',
      },
      math: {
        latex: [
          'r_t(\\theta) = \\frac{\\pi_\\theta(a_t \\mid s_t)}{\\pi_{\\theta_{\\text{old}}}(a_t \\mid s_t)}',
          'L^{\\text{CLIP}}(\\theta) = \\mathbb{E}_t\\left[ \\min\\big( r_t(\\theta) A_t,\\; \\text{clip}(r_t(\\theta), 1-\\varepsilon, 1+\\varepsilon)\\, A_t \\big) \\right]',
        ],
        notes:
          'epsilon is a hyperparameter the original paper sets to 0.2 in its main experiments — self-extracted ' +
          'directly from the paper\'s PDF text rather than taken from a summary. Taking the min of the clipped ' +
          'and unclipped terms makes the objective a pessimistic (lower) bound on the unclipped surrogate: when ' +
          'A_t is positive, the clip caps how much reward the objective gives for increasing the ratio past ' +
          '1+epsilon; when A_t is negative, it caps how much reward it gives for decreasing the ratio past ' +
          '1-epsilon. Either way, once the ratio leaves the trusted band, that timestep stops contributing gradient.',
      },
      complexity: {
        train: 'Several epochs of minibatch gradient descent over each collected batch — the per-step cost of a policy-gradient method, multiplied by epochs per batch',
        predict: 'One forward pass through the policy network per action',
      },
      code: [
        'ratio = torch.exp(new_log_probs - old_log_probs.detach())',
        'clipped = torch.clamp(ratio, 1 - eps, 1 + eps)',
        'policy_loss = -torch.min(ratio * advantages, clipped * advantages).mean()',
        '',
        'value_loss = (returns - value_net(states)).pow(2).mean()',
        'loss = policy_loss + c1 * value_loss - c2 * entropy_bonus',
        'loss.backward()',
        'optimizer.step()',
      ].join('\n'),
      related: ['trpo-sac-ddpg', 'actor-critic', 'policy-gradients-and-reinforce', 'optimizers'],
      references: {
        free: [{ title: 'OpenAI Spinning Up — Proximal Policy Optimization', url: 'https://spinningup.openai.com/en/latest/algorithms/ppo.html' }],
        papers: [{ title: 'Proximal Policy Optimization Algorithms', url: 'https://arxiv.org/abs/1707.06347', year: 2017 }],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 13 — Policy Gradient Methods',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'trpo-sac-ddpg',
      name: 'TRPO, SAC & DDPG',
      tier: 2,
      year: 2015,
      difficulty: 4,
      hook: 'Three fixes for unstable policy gradients: a hard trust region, max-entropy learning, or deterministic actions.',
      intuition:
        'These three algorithms all improve on vanilla policy gradients, but along different axes. TRPO addresses ' +
        "instability directly: instead of PPO's soft clip, it solves a constrained optimization problem at every " +
        'step, guaranteeing the new policy stays within a KL-divergence trust region of the old one, at the cost ' +
        "of a conjugate-gradient solve and a line search per update — PPO was built specifically to approximate " +
        "TRPO's stability more cheaply. DDPG addresses continuous action spaces: it adapts DQN's machinery (a " +
        'replay buffer, a target network) to a deterministic actor that outputs one specific action per state, ' +
        'trained by pushing that action up the gradient of a learned Q-function rather than sampling from a ' +
        'distribution. SAC also targets continuous control, but keeps a stochastic policy and adds an entropy ' +
        'bonus to the objective, explicitly rewarding randomness as well as reward — encouraging thorough ' +
        'exploration and, combined with two Q-functions borrowed from TD3, giving noticeably more stable ' +
        "off-policy training than DDPG's often-fragile deterministic actor.",
      howItWorks: {
        summary:
          'TRPO solves a KL-constrained trust-region optimization each step; DDPG learns a deterministic ' +
          'continuous-action policy off-policy with a DQN-style critic; SAC learns a stochastic policy off-policy ' +
          'that maximizes reward plus an entropy bonus.',
        steps: [
          'TRPO: compute the policy gradient and a KL-divergence constraint, then solve the constrained step via conjugate gradient and a backtracking line search that enforces the trust region.',
          'DDPG: learn a Q-function critic by TD error, as in DQN, using a replay buffer and target networks for stability.',
          "DDPG: learn a deterministic actor by gradient ascent on the critic's Q-value with respect to the actor's chosen action (the deterministic policy gradient).",
          'SAC: learn two Q-functions (to reduce overestimation) and a stochastic policy off-policy, optimizing expected reward plus an entropy term that rewards exploring.',
        ],
      },
      whenToUse: [
        "You need a hard, provable limit on how far one policy update can move — TRPO's constrained optimization gives that guarantee where PPO's clip is only a heuristic",
        'The action space is continuous and you can reuse past experience off-policy — DDPG and SAC are both far more sample-efficient than on-policy methods like PPO on continuous control benchmarks',
        "Training stability across random seeds matters and a deterministic actor (DDPG) has proven fragile on your problem — SAC's entropy bonus and twin critics directly target that failure mode",
      ],
      whenNotToUse: [
        'You want a simple, robust default without tuning a KL bound or an entropy temperature — PPO handles both discrete and continuous actions with far less machinery',
        'The action space is discrete — DDPG and SAC as described here are built around a continuous, differentiable action, and do not apply directly',
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular', 'image'],
        dataSize: ['medium', 'large'],
        interpretability: 'low',
        trainingCost: 'high',
        needsScaling: true,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'policy-continuous-or-discrete',
      },
      related: ['ppo', 'actor-critic', 'dqn', 'optimizers'],
      references: {
        free: [
          { title: 'OpenAI Spinning Up — Trust Region Policy Optimization', url: 'https://spinningup.openai.com/en/latest/algorithms/trpo.html' },
          { title: 'OpenAI Spinning Up — Deep Deterministic Policy Gradient', url: 'https://spinningup.openai.com/en/latest/algorithms/ddpg.html' },
          { title: 'OpenAI Spinning Up — Soft Actor-Critic', url: 'https://spinningup.openai.com/en/latest/algorithms/sac.html' },
        ],
        papers: [
          { title: 'Trust Region Policy Optimization', url: 'https://arxiv.org/abs/1502.05477', year: 2015 },
          { title: 'Continuous Control with Deep Reinforcement Learning', url: 'https://arxiv.org/abs/1509.02971', year: 2015 },
          {
            title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor',
            url: 'https://arxiv.org/abs/1801.01290',
            year: 2018,
          },
        ],
      },
    },
    {
      id: 'mcts-and-alphazero',
      name: 'Monte Carlo Tree Search & AlphaZero',
      aliases: ['MCTS', 'UCT'],
      tier: 1,
      year: 2006,
      difficulty: 4,
      hook: 'Builds a game tree by simulating playouts, then AlphaZero swaps the random rollout for a trained value and policy net.',
      intuition:
        'Minimax search evaluates every branch of a game tree, which is hopeless once the branching factor is ' +
        'large — Go has roughly 250 legal moves per position. Monte Carlo Tree Search sidesteps a full search by ' +
        'growing the tree asymmetrically: it spends more simulations on promising-looking moves and fewer on weak ' +
        "ones, selecting which branch to explore next using UCB1, the same upper-confidence-bound rule used to " +
        "solve multi-armed bandits, treating each node's children as a small bandit problem. Each simulation " +
        'descends the tree by that rule, expands one new node, then estimates its value by playing out random ' +
        'moves to the end of the game and backing that result up the tree. AlphaGo and then AlphaZero replaced ' +
        'the random rollout with a neural network that outputs both a policy (which moves look promising) and a ' +
        'value (who is likely to win), trained entirely by self-play with no human game data, using the tree ' +
        'search itself as the teacher that improves the network and the improved network in turn making the tree ' +
        'search stronger.',
      howItWorks: {
        summary:
          'Grow a search tree by repeatedly selecting the most promising branch via UCB1, expanding a new node, ' +
          'evaluating it (random rollout for classic MCTS, or a neural network for AlphaZero), and backing the ' +
          'result up the tree; then play the most-visited move.',
        steps: [
          'Selection: starting at the root, descend the tree choosing the child that maximizes a UCB1-style score balancing estimated value against how rarely it has been visited.',
          'Expansion: once a leaf with unexplored children is reached, add one new child node to the tree.',
          "Evaluation: classic MCTS plays out random moves to a terminal state and records win/loss; AlphaZero instead queries a neural network for a value estimate and a policy prior over moves, no rollout needed.",
          'Backpropagation: propagate the evaluation result back up every node visited in this simulation, updating visit counts and average value.',
          'Repeat selection through backpropagation for a fixed number of simulations, then play the move with the most visits from the root.',
          "AlphaZero only: use the completed search's visit-count distribution as an improved policy target, and the game outcome as a value target, to train the network by self-play — the same network then guides the next game's search.",
        ],
      },
      whenToUse: [
        'The environment is a known, simulatable model (you can try any move and see the exact result) — MCTS needs a simulator, not just samples from an unknown environment',
        'The branching factor is too large for exhaustive minimax but a heuristic evaluation is hard to hand-design — MCTS estimates position value from simulated outcomes instead',
        'You can afford many simulations per decision and, for the AlphaZero variant, self-play training time before deployment',
      ],
      whenNotToUse: [
        'You do not have a model of the environment\'s dynamics to simulate from — this is planning with a known simulator, not model-free learning from real interaction',
        "Decisions must be made in real time with very few simulations available — MCTS's advantage comes from many simulations per move, and quality degrades sharply with a tight budget",
        "The action space is continuous or extremely large per node — the tree's branching factor and the cost of expanding nodes both grow with it, and discretization becomes its own design problem",
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular', 'image'],
        dataSize: ['large'],
        interpretability: 'medium',
        trainingCost: 'high',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'action-selection',
      },
      math: {
        latex: [
          'a^* = \\arg\\max_a \\left[ Q(s,a) + c \\sqrt{\\frac{\\ln N(s)}{N(s,a)}} \\right]',
          'a^* = \\arg\\max_a \\left[ Q(s,a) + c \\cdot P(s,a) \\frac{\\sqrt{N(s)}}{1+N(s,a)} \\right]',
        ],
        notes:
          "The first line is UCT's selection rule: UCB1 applied to tree nodes, balancing exploitation of a " +
          "child's current average value Q(s,a) against exploration of children visited only N(s,a) times. The " +
          'second is AlphaZero\'s PUCT variant, replacing the log-count exploration bonus with one weighted by ' +
          "the network's policy prior P(s,a), so the search explores moves the network already favours more eagerly.",
      },
      complexity: {
        train:
          'AlphaZero: self-play generates training data continuously; each move search runs a fixed simulation ' +
          'budget (hundreds to thousands of simulations), each costing one neural network evaluation',
        predict: 'Classic MCTS: O(simulations x tree depth) per move decision, each simulation including a rollout to a terminal state',
      },
      code: [
        'def mcts_search(root_state, n_simulations, c=1.4):',
        '    root = Node(root_state)',
        '    for _ in range(n_simulations):',
        '        node = root',
        '        while node.is_fully_expanded() and not node.is_terminal():',
        '            node = node.select_child(c)             # UCB1 (or PUCT with a network prior)',
        '        if not node.is_terminal():',
        '            node = node.expand()',
        "        value = node.rollout()                       # random playout, or a network's value head",
        '        node.backpropagate(value)',
        '    return max(root.children, key=lambda c: c.visit_count).move',
      ].join('\n'),
      // mcmc (Neptune) is a genuine, deliberately qualified cross-body link: both are Monte Carlo
      // methods in the literal sense of estimating a value by sampling/simulation rather than exact
      // computation, not because the underlying machinery (tree search + UCB1 vs. Markov-chain
      // sampling) is the same thing.
      related: ['value-and-policy-iteration', 'multi-armed-bandits', 'mcmc'],
      references: {
        free: [{ title: 'UC Berkeley CS 188 — Monte Carlo Tree Search', url: 'https://inst.eecs.berkeley.edu/~cs188/textbook/games/monte-carlo.html' }],
        papers: [
          { title: 'Bandit Based Monte-Carlo Planning', url: 'https://doi.org/10.1007/11871842_29', year: 2006 },
          {
            title: 'Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm',
            url: 'https://arxiv.org/abs/1712.01815',
            year: 2017,
          },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 8 — Planning and Learning with Tabular Methods',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
    {
      id: 'multi-armed-bandits',
      name: 'Multi-Armed Bandits',
      aliases: ['bandit algorithms', 'k-armed bandit problem'],
      tier: 1,
      year: 1952,
      difficulty: 2,
      hook: 'Solves the explore-exploit tradeoff in its purest form: no state, just which of k arms to pull next.',
      intuition:
        'Strip a Markov Decision Process down to a single state and you get the multi-armed bandit problem: at ' +
        'every round, pick one of k arms (actions), each paying out from its own unknown reward distribution, and ' +
        'try to maximize total reward over many rounds. There is no state to track and no transition to learn — ' +
        'the entire problem is the tension between exploring arms you are uncertain about and exploiting the arm ' +
        'that looks best so far, which is why bandits are the cleanest place to study that tradeoff before adding ' +
        'the complications of state. Epsilon-greedy explores by acting randomly some fraction of the time. Upper ' +
        "Confidence Bound algorithms explore more cleverly, adding a bonus to each arm's estimated value that " +
        'shrinks the more that arm has been tried, so uncertain arms get pulled without ever exploring uniformly ' +
        "at random. Thompson sampling takes a Bayesian view, maintaining a belief distribution over each arm's " +
        'payout and sampling from those beliefs to decide, naturally pulling arms in proportion to how likely ' +
        'they are to be best.',
      howItWorks: {
        summary:
          "Maintain an estimate of each arm's expected reward, choose an arm each round balancing that estimate " +
          'against uncertainty, then update the estimate from the observed payout.',
        steps: [
          'Initialize an estimate of expected reward for each of the k arms (e.g. zero, or an optimistic value to encourage early exploration).',
          'Epsilon-greedy: with probability epsilon pick a random arm; otherwise pick the arm with the highest current estimate.',
          'UCB1: pick the arm maximizing its estimated mean reward plus an exploration bonus proportional to sqrt(log t / n_a), where n_a is how often that arm has been pulled.',
          "Thompson sampling: maintain a posterior distribution over each arm's reward parameter, sample one value per arm from its posterior, and pick the arm with the highest sample.",
          "Observe the reward from the pulled arm and update that arm's estimate (or posterior).",
          'Repeat for the full horizon; track regret, the gap between total reward earned and what an oracle that always pulled the best arm would have earned.',
        ],
      },
      hyperparameters: [
        {
          name: 'epsilon',
          what: 'Probability of a uniformly random exploratory pull in epsilon-greedy.',
          tuning:
            'A constant like 0.1 is a common starting point; decaying epsilon over time trades early exploration ' +
            'for later exploitation and can outperform a fixed rate.',
        },
        {
          name: 'c (UCB exploration constant)',
          what: "Scales the size of UCB1's exploration bonus.",
          tuning:
            'The theoretical form uses c = sqrt(2); in practice this is often treated as a tunable constant and ' +
            'increased if the algorithm converges to a suboptimal arm too early.',
        },
      ],
      whenToUse: [
        'The problem is genuinely stateless — each decision does not change what will be available or optimal next round, e.g. picking which website variant to show a new visitor',
        'You need to start acting well quickly with little data, e.g. online experimentation where every trial has an opportunity cost, unlike offline experiment design',
        'The number of options (arms) is small enough to maintain a per-arm estimate directly',
      ],
      whenNotToUse: [
        'The environment has state that decisions actually affect — e.g. a game where your move changes what is available next; that needs a full MDP method, not a bandit algorithm',
        'Reward distributions drift quickly over time (non-stationary) without any adaptation — a plain sample-average estimate that weighs all history equally will lag a fast-changing best arm',
        'The number of arms is very large or continuous (e.g. choosing a continuous parameter) — per-arm estimation stops being practical; contextual or continuum-armed bandit variants are needed instead',
      ],
      facets: {
        task: ['control'],
        dataType: ['tabular'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: true,
        outputType: 'action-selection',
      },
      math: {
        latex: [
          'A_t = \\arg\\max_a \\left[ \\hat{\\mu}_a + c \\sqrt{\\frac{\\ln t}{n_a}} \\right]',
          '\\text{Regret}(T) = T \\mu^* - \\sum_{t=1}^{T} \\mu_{A_t}',
        ],
        notes:
          'The first line is UCB1: mu-hat_a is the sample-average reward observed from arm a so far, and the ' +
          'second term is an exploration bonus that shrinks as n_a (times arm a has been pulled) grows, and grows ' +
          'slowly with t (the round number) otherwise — Auer, Cesa-Bianchi & Fischer proved this achieves ' +
          'logarithmic expected regret uniformly over time, not just asymptotically. Regret, the second line, is ' +
          'the standard way bandit algorithms are compared: the gap between what was actually earned and what ' +
          'always pulling the single best arm mu* would have earned.',
      },
      complexity: {
        train: "O(1) per round to update one arm's running estimate",
        predict: "O(k) to scan all arms' current estimates (or O(k) to sample from each posterior for Thompson sampling)",
      },
      code: [
        'import numpy as np',
        '',
        'k, T = 10, 10000',
        'counts, values = np.zeros(k), np.zeros(k)',
        '',
        'for t in range(1, T + 1):',
        '    ucb = values + np.sqrt(2 * np.log(t) / (counts + 1e-9))',
        '    arm = np.argmax(ucb)',
        '    reward = pull(arm)                                  # sample from the environment',
        '    counts[arm] += 1',
        '    values[arm] += (reward - values[arm]) / counts[arm]  # running average update',
      ].join('\n'),
      // bayesian-optimization (Uranus) is a genuine cross-body link: both are principled answers to
      // the same explore/exploit tradeoff, one over discrete arms and one over a continuous space.
      related: ['mcts-and-alphazero', 'q-learning-and-sarsa', 'bayesian-optimization'],
      references: {
        free: [{ title: "Lil'Log — The Multi-Armed Bandit Problem and Its Solutions", url: 'https://lilianweng.github.io/posts/2018-01-23-multi-armed-bandit/' }],
        papers: [
          {
            title: 'Some Aspects of the Sequential Design of Experiments',
            url: 'https://projecteuclid.org/journals/bulletin-of-the-american-mathematical-society-new-series/volume-58/issue-5/Some-aspects-of-the-sequential-design-of-experiments/bams/1183517370.full',
            year: 1952,
          },
          { title: 'Finite-time Analysis of the Multiarmed Bandit Problem', url: 'https://doi.org/10.1023/A:1013689704352', year: 2002 },
        ],
        books: [
          {
            title: 'Reinforcement Learning: An Introduction',
            author: 'Sutton & Barto',
            chapter: 'Ch. 2 — Multi-armed Bandits',
            url: 'http://incompleteideas.net/book/the-book-2nd.html',
          },
        ],
        video: [{ title: 'Google DeepMind', url: 'https://www.youtube.com/@googledeepmind' }],
      },
    },
  ],
} satisfies Body;
