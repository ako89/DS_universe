/**
 * Daedalus — Agents & Tool Use. See PLAN.md §3 for the full moon list (6 moons, all written
 * here). Tiers follow PLAN.md: Tier 1 = function-tool-calling, react-loops,
 * planning-and-decomposition; Tier 2 = model-context-protocol, multi-agent-systems,
 * computer-use-and-browser-agents.
 *
 * Researched per docs/CONTENT_GUIDE.md §3 — search, open a real (HTML) source, verify every URL
 * by opening it, then write. Sources actually opened this session, per entry:
 *   function-tool-calling — developers.openai.com's Function Calling guide (fetched twice: the
 *                            schema/response/parallel_tool_calls mechanics, and separately the
 *                            "fewer than 20 functions" tool-count guidance), Simon Willison's
 *                            write-up of OpenAI's original June 13 2023 announcement (date, and
 *                            the "user confirmation before real-world-impact actions" safety
 *                            line, and the "implementation of the ReAct pattern" framing), the
 *                            Toolformer arXiv abstract page (2302.04761, Feb 2023 — the academic
 *                            precursor: self-supervised tool use, distinct mechanism from OpenAI's
 *                            product feature), and Google Books' public metadata page for
 *                            "Prompt Engineering for Generative AI" (title/authors/publisher/year/
 *                            chapter title verified directly; the O'Reilly chapter page itself
 *                            403'd — paywalled — so no content beyond the verified metadata is
 *                            attributed to it).
 *   react-loops            — the ReAct arXiv abstract page (2210.03629), the official
 *                            react-lm.github.io project page, and the Google Research blog post
 *                            (dated Nov 8 2022, with the HotpotQA Thought/Action/Observation
 *                            example) — all fetched directly, all HTML.
 *   planning-and-decomposition — Least-to-Most Prompting's arXiv abstract page (2205.10625, May
 *                            2022), Tree of Thoughts' arXiv abstract page (2305.10601, May 2023),
 *                            and PromptHub's Least-to-Most guide (fetched directly; verified the
 *                            two-stage decompose-then-solve process and its worked example).
 *   model-context-protocol  — Anthropic's own MCP announcement (anthropic.com/news/model-context-
 *                            protocol, Nov 25 2024, creators and initial server list) and the
 *                            official modelcontextprotocol.io introduction page (architecture,
 *                            the USB-C analogy, tools/resources/prompts).
 *   multi-agent-systems     — the CAMEL arXiv abstract page (2303.17760, Mar 2023 — the earliest
 *                            of the three multi-agent papers checked), the AutoGen arXiv/ar5iv
 *                            full-text HTML (2308.08155, Aug 2023 — agent roles, AssistantAgent/
 *                            UserProxyAgent), and Microsoft Research's AutoGen blog post (fetched
 *                            directly; date and the Commander/Writer/Safeguard example).
 *   computer-use-and-browser-agents — Anthropic's computer-use announcement
 *                            (anthropic.com/news/3-5-models-and-computer-use, Oct 22 2024 —
 *                            OSWorld numbers, the "experimental...cumbersome and error-prone"
 *                            self-description), Anthropic's prompt-injection-defenses research
 *                            page (browser-agent-specific risk and defense detail, used for the
 *                            Aegis cross-link), and the WebArena arXiv abstract page (2307.13854,
 *                            Jul 2023 — the 14.41% GPT-4-agent vs. 78.24% human success-rate
 *                            figures).
 * Generative Agents (Park et al. 2023) and WebGPT (2021) were checked as candidate earlier
 * anchors for multi-agent-systems and computer-use-and-browser-agents respectively but not used
 * as the primary source: CAMEL predates Generative Agents by a few weeks and is the more direct
 * "agents cooperating via structured dialogue" match; WebGPT is a browsing-augmented QA system
 * (a text console, no visual/DOM action loop) rather than the UI-acting pattern this moon covers,
 * so using it would have stretched the sourced claim rather than reported it.
 *
 * No PDF-fetch trap encountered — every source used this session was HTML (arXiv /abs/ pages,
 * official blogs/docs, or a legitimate book-metadata page), per the PDF warning in CONTENT_GUIDE
 * §3; no number in this file was taken from a WebFetch PDF summary.
 *
 * Cross-body links, verified against what was actually read (not asserted from the taxonomy's
 * suggestions alone): `function-tool-calling` → `gpt-lineage` (Genesis) because OpenAI's feature
 * was announced specifically for its GPT-3.5/GPT-4 models, and → `instruction-tuning` (Forge)
 * because Willison's write-up describes function calling as running on "models that have been
 * fine-tuned to execute" the pattern — a real training-time link, not a decorative one.
 * `planning-and-decomposition` → `mdps-and-bellman-equation` (Odyssey): both formalize choosing a
 * sequence of actions toward a goal, and Russell & Norvig's AIMA situates classical
 * (STRIPS-style) planning and MDP-based planning as adjacent chapters of the same problem, which
 * is the framing this entry's book reference actually uses. `computer-use-and-browser-agents` →
 * `guardrails` and `red-teaming-and-jailbreaks` (Aegis, sibling): Anthropic's own
 * prompt-injection-defenses page describes training-time refusal reinforcement, input classifiers
 * and continuous red-teaming specifically for its browser agent — a documented agentic-specific
 * risk, not a generic LLM-safety restatement. `multi-agent-systems` → `guardrails` (Aegis,
 * sibling) for the same reason at the orchestration level (a "Safeguard" agent role appears
 * directly in Microsoft's own AutoGen example).
 *
 * `eraRange` is [2022, 2024]: 2022 is the earliest sourced year on this body — both ReAct
 * (arXiv Oct 2022) and Least-to-Most Prompting (arXiv May 2022) — and 2024 is the latest, shared
 * by the Model Context Protocol (Nov 2024) and Anthropic's computer-use announcement (Oct 2024).
 * This body sits entirely inside a three-year window, which is expected: agentic LLM patterns are
 * the newest material in the whole map, not an oversight in how the range was computed.
 */

import type { Body } from '../../types/content.ts';

export const body = {
  id: 'daedalus',
  name: 'Daedalus',
  segment: 'Agents & Tool Use',
  hook: 'Turns a language model into something that acts: calling tools, planning, and looping toward a goal.',
  summary:
    'Daedalus covers how large language models move from generating text to taking action — requesting a function call with structured ' +
    'arguments, interleaving reasoning with tool use in a loop, decomposing a goal into subtasks, connecting to external tools over a ' +
    'shared protocol, coordinating with other agents, and operating a real screen or webpage the way a person would.',
  eraRange: [2022, 2024],
  moons: [
    {
      id: 'function-tool-calling',
      name: 'Function / Tool Calling',
      aliases: ['function calling', 'tool use'],
      tier: 1,
      year: 2023,
      difficulty: 2,
      hook: 'Hands the model a JSON schema of your functions so it asks for one to be called with real arguments, not a guess.',
      intuition:
        "Ask a plain language model to check today's weather and it can only answer from what it memorized during training — it has no " +
        'way to actually run a lookup. Function calling fixes that by handing the model a menu instead of a blank page: you describe ' +
        'each callable function with a name, a description, and a JSON schema of its parameters, and give that menu to the model ' +
        'alongside the conversation. When the model decides a function would help, it does not write prose — it emits structured JSON ' +
        'naming the function and filling in the arguments, formatted exactly as your code expects. Your application reads that JSON, ' +
        'actually calls the function or API, and feeds the return value back into the conversation as a new message. The model then ' +
        'continues, now working with a real result instead of a guess. This is the plumbing underneath almost every LLM agent: without ' +
        "a reliable, structured way to request an action, nothing downstream — a ReAct loop, a multi-step plan — has anything solid to " +
        'execute.',
      howItWorks: {
        summary:
          'Describe each callable function as a JSON-schema tool definition, let the model choose whether and which to call, execute ' +
          'that call in your own code, then return the result to the model as a new message.',
        steps: [
          'Define each function as a JSON-schema object: a name, a natural-language description of when to use it, and typed parameters.',
          'Send those tool definitions to the model alongside the conversation.',
          'The model responds with structured JSON naming a function and its arguments whenever it judges a call would help, instead of a prose answer.',
          'Your application code parses that JSON and executes the corresponding function or API call.',
          "Send the function's return value back to the model as a new message in the conversation.",
          'The model incorporates that result into its next reply, or issues another function call if more information is needed.',
        ],
      },
      hyperparameters: [
        {
          name: 'tool_choice',
          what: 'Controls whether, and which, tool the model must invoke: auto, required, a specific named function, or none.',
          tuning:
            "Default is 'auto' (the model decides). Force a specific function when exactly one call must run next; use 'required' to " +
            'force some call rather than a prose reply.',
        },
        {
          name: 'parallel_tool_calls',
          what: 'Whether the model may request several independent tool calls in a single turn.',
          tuning:
            'Enabled by default on models that support it. Disable it when calls must run strictly one at a time, e.g. because a later ' +
            "call depends on an earlier one's result.",
        },
      ],
      whenToUse: [
        'The model needs to take an action or fetch information outside its training data — call an API, query a database, run a calculator',
        'You need output in a fixed machine-readable shape (specific fields, enum values, IDs) rather than prose you would otherwise have to parse out',
        'You are building an agent loop such as ReAct or a planner — function calling is the mechanism that turns a chosen action into an actual call',
      ],
      whenNotToUse: [
        'The task is a single, self-contained generation with no external action or lookup needed — a plain prompt has one fewer point of failure',
        'The function has real-world side effects (sending money, deleting data, posting publicly) and you have not added a human-confirmation or sandboxing step before executing it',
        "You are exposing dozens of overlapping functions at once — OpenAI's own guidance is to keep functions available in a single turn under about 20, since selection accuracy drops as the tool list grows",
      ],
      facets: {
        task: ['control', 'generation'],
        dataType: ['text'],
        dataSize: ['tiny', 'small'],
        interpretability: 'medium',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'structured-function-call',
      },
      code: [
        'tools = [{',
        '    "type": "function",',
        '    "name": "get_weather",',
        '    "description": "Get current weather for a city.",',
        '    "parameters": {',
        '        "type": "object",',
        '        "properties": {"city": {"type": "string"}},',
        '        "required": ["city"],',
        '    },',
        '}]',
        '',
        'response = client.responses.create(model="gpt-4o", input=messages, tools=tools)',
        'call = response.output[0]                      # a function_call item, if the model chose one',
        'args = json.loads(call.arguments)',
        'result = get_weather(**args)                   # your code actually runs it',
        '',
        'messages.append({"type": "function_call_output", "call_id": call.call_id, "output": str(result)})',
        'response = client.responses.create(model="gpt-4o", input=messages, tools=tools)',
      ].join('\n'),
      // gpt-lineage (Genesis) is the genuine cross-body link: OpenAI announced function calling
      // specifically for GPT-3.5/GPT-4. instruction-tuning (Forge) is genuine too: Willison's
      // write-up of the announcement describes function calling as running on models "fine-tuned
      // to execute" the pattern.
      related: ['react-loops', 'planning-and-decomposition', 'model-context-protocol', 'gpt-lineage', 'instruction-tuning'],
      references: {
        free: [
          { title: 'OpenAI API guide — Function calling', url: 'https://developers.openai.com/api/docs/guides/function-calling' },
          { title: "Simon Willison — OpenAI: Function calling and other API updates", url: 'https://simonwillison.net/2023/Jun/13/function-calling/' },
        ],
        papers: [
          { title: 'Toolformer: Language Models Can Teach Themselves to Use Tools', url: 'https://arxiv.org/abs/2302.04761', year: 2023 },
        ],
        books: [
          {
            title: 'Prompt Engineering for Generative AI',
            author: 'James Phoenix & Mike Taylor',
            chapter: 'Ch. 6 — Autonomous Agents with Memory and Tools',
            url: 'https://www.oreilly.com/library/view/prompt-engineering-for/9781098153427/',
          },
        ],
        video: [{ title: 'DeepLearning.AI', url: 'https://www.youtube.com/@Deeplearningai' }],
      },
    },
    {
      id: 'react-loops',
      name: 'ReAct (Reason + Act) Loops',
      aliases: ['ReAct', 'reason and act prompting'],
      tier: 1,
      year: 2022,
      difficulty: 3,
      hook: 'Interleaves written reasoning with tool calls so a model plans, acts, observes the result, and re-plans in one loop.',
      intuition:
        'Chain-of-thought prompting gets a model to think in writing before answering, but that thinking is disconnected from the world ' +
        '— every fact still has to come from memory. ReAct closes that gap by interleaving the two: the model writes a Thought about ' +
        'what to do next, takes an Action such as a search-engine or calculator call, receives an Observation with the real result, and ' +
        'writes another Thought that takes that observation into account before deciding the next action. This repeats until the model ' +
        'decides it has enough to answer. Reasoning steps give the loop a memory and a plan it can revise; acting steps let it check ' +
        'facts and correct course instead of hallucinating forward from a wrong assumption. The result behaves like someone thinking ' +
        'out loud while looking things up, rather than reasoning blind or reacting with no plan. ReAct itself is a prompting pattern, ' +
        'not new model weights — it works with any model given the right instructions and something that can execute the actions it ' +
        'names, which is exactly the job function calling does.',
      howItWorks: {
        summary:
          'Prompt the model to alternate between a written Thought, an Action that calls an external tool, and an Observation of that ' +
          "tool's result, repeating until it has enough information to give a final answer.",
        steps: [
          'Prompt the model with the task and a small number of worked Thought/Action/Observation examples.',
          'The model writes a Thought: reasoning about what it knows so far and what to do next.',
          'The model emits an Action: a call to an external tool such as a search engine, calculator, or API.',
          "Execute that action outside the model and append its result as an Observation to the transcript.",
          'The model reads the Observation and writes the next Thought, revising its plan if the result was unexpected.',
          'Repeat until the model emits a final answer instead of another action.',
        ],
      },
      hyperparameters: [
        {
          name: 'number of few-shot exemplars',
          what: 'How many worked Thought/Action/Observation trajectories are shown in the prompt.',
          tuning:
            "The original paper used as few as one or two in-context examples per task; the technique is designed to work from minimal " +
            'demonstration rather than needing many.',
        },
        {
          name: 'max steps / loop budget',
          what: 'How many Thought-Action-Observation cycles the loop is allowed before it is forced to stop.',
          tuning:
            "Set low enough to bound cost and latency; too low cuts off tasks that genuinely need several lookups, too high lets the " +
            "model wander on ones it can't solve.",
        },
      ],
      whenToUse: [
        'The task needs facts the model cannot reliably recall or compute — multi-hop question answering, arithmetic, up-to-date information',
        'A single tool call is not enough — the answer depends on a chain of lookups where later queries depend on earlier results',
        'You want the reasoning trace itself, not just the answer, so a person can audit why the model took each action',
      ],
      whenNotToUse: [
        "The task can be answered directly from the model's own knowledge with no external lookup — the extra Thought/Action turns only add latency and cost",
        'The task is a single lookup with no dependency between steps — one function call is cheaper and less error-prone than a full loop',
        'Tool calls are slow or expensive and the task has a tight latency budget — each loop iteration is a full model call plus a tool round-trip',
      ],
      facets: {
        task: ['control', 'inference'],
        dataType: ['text'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'reasoning-trace-and-answer',
      },
      complexity: {
        train: 'n/a — ReAct is a prompting pattern, not a trained model',
        predict: 'O(k) language-model calls for a loop that runs k Thought-Action-Observation steps, plus one external tool call per action',
      },
      code: [
        'transcript = f"Question: {question}\\n"',
        '',
        'while True:',
        '    step = llm.generate(transcript)          # model writes a Thought, then an Action',
        '    transcript += step.text',
        '    if step.action == "finish":',
        '        answer = step.action_input',
        '        break',
        '    observation = run_tool(step.action, step.action_input)   # e.g. run_tool("search", "...")',
        '    transcript += f"\\nObservation: {observation}\\n"',
      ].join('\n'),
      related: ['function-tool-calling', 'planning-and-decomposition', 'computer-use-and-browser-agents'],
      references: {
        free: [
          {
            title: 'Google Research — ReAct: Synergizing Reasoning and Acting in Language Models',
            url: 'https://research.google/blog/react-synergizing-reasoning-and-acting-in-language-models/',
          },
          { title: 'ReAct project page', url: 'https://react-lm.github.io/' },
        ],
        papers: [
          { title: 'ReAct: Synergizing Reasoning and Acting in Language Models', url: 'https://arxiv.org/abs/2210.03629', year: 2022 },
        ],
        books: [
          {
            title: 'Prompt Engineering for Generative AI',
            author: 'James Phoenix & Mike Taylor',
            chapter: 'Ch. 6 — Autonomous Agents with Memory and Tools',
            url: 'https://www.oreilly.com/library/view/prompt-engineering-for/9781098153427/',
          },
        ],
        video: [{ title: 'DeepLearning.AI', url: 'https://www.youtube.com/@Deeplearningai' }],
      },
    },
    {
      id: 'planning-and-decomposition',
      name: 'Planning & Task Decomposition',
      aliases: ['task decomposition', 'least-to-most prompting'],
      tier: 1,
      year: 2022,
      difficulty: 3,
      hook: 'Breaks a hard goal into an ordered list of subgoals before acting, instead of improvising the next step at a time.',
      intuition:
        'ReAct decides its next action one step at a time, reacting to whatever the last observation was — which works well but can ' +
        'wander, especially on tasks with many steps where an early wrong turn compounds. Planning takes the opposite bet: work out a ' +
        'sequence of subgoals up front, then execute them, checking in and revising the plan only when something breaks it. ' +
        'Least-to-most prompting was an early version of this for pure reasoning — split a hard question into a list of simpler ' +
        'subquestions and answer them in order, each one able to use the answers before it, which let models generalize to problems ' +
        'harder than any example they were shown. Tree of Thoughts generalizes further by letting the model explore several candidate ' +
        'next steps at once, evaluate which look promising, and backtrack from dead ends, instead of committing to one path. For an ' +
        'agent, the same idea becomes: decompose a goal into an ordered list of subtasks, execute or delegate each one, and replan ' +
        'when a subtask fails or the environment changes.',
      howItWorks: {
        summary:
          'Decompose a goal into an ordered sequence of subgoals before acting, execute or delegate each subgoal in turn, and revise ' +
          'the remaining plan when a step fails or new information changes what is needed.',
        steps: [
          'Prompt the model to break the overall goal into a list of smaller subgoals, before executing any of them.',
          'Order the subgoals so that each one can use the results of the ones before it.',
          'Execute or delegate the first subgoal, using tools or sub-agents as needed.',
          'Feed the result back in and either proceed to the next subgoal or revise the remaining plan if the result was unexpected.',
          'Repeat until every subgoal is complete, then assemble the final answer or action from the results.',
        ],
      },
      hyperparameters: [
        {
          name: 'search breadth (for tree-style planning)',
          what: 'How many candidate next steps are generated and evaluated at each point in the plan.',
          tuning:
            'Tree of Thoughts found a small breadth already captures most of the benefit over a single greedy path; wider search raises ' +
            'cost roughly linearly per level explored.',
        },
        {
          name: 'replanning trigger',
          what: 'The condition under which the agent abandons the rest of the plan and generates a new one.',
          tuning:
            'Common choices are a failed tool call, an observation contradicting an assumption in the plan, or a fixed step budget being ' +
            'exceeded — too sensitive a trigger causes constant replanning instead of progress.',
        },
      ],
      whenToUse: [
        'The task has many steps where an early decision constrains what is valid later — a multi-leg booking, a multi-file coding task, a research task with several sub-questions',
        'The problem is harder than any single worked example the model has seen, and needs to be reduced to subproblems it can solve individually',
        'You want a plan a person can review or edit before the agent starts taking real-world actions',
      ],
      whenNotToUse: [
        'The task is a single, short-horizon lookup or action — planning overhead buys nothing over one ReAct step',
        'The environment is highly unpredictable step to step, so a plan made in advance is likely to be invalidated before it is half executed — an interleaved reason-act loop adapts faster',
        'Latency or cost budget cannot absorb generating and evaluating multiple candidate plans, as tree-style search does',
      ],
      facets: {
        task: ['control', 'inference'],
        dataType: ['text'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ordered-subgoal-list',
      },
      complexity: {
        train: 'n/a — prompting pattern, not a trained model',
        predict: 'O(k) model calls for a linear decomposition into k subgoals; O(b^d) for tree-style search with branching factor b and depth d',
      },
      code: [
        'subgoals = llm.generate(f"Break this goal into an ordered list of subgoals: {goal}").parse_list()',
        '',
        'results = []',
        'for subgoal in subgoals:',
        '    result = execute(subgoal, context=results)      # tool call, sub-agent, or direct answer',
        '    if result.failed:',
        '        subgoals = replan(goal, results, failure=result)   # revise the remaining plan',
        '        continue',
        '    results.append(result)',
        '',
        'answer = assemble(goal, results)',
      ].join('\n'),
      // mdps-and-bellman-equation (Odyssey) is the genuine cross-body link: both formalize
      // choosing a sequence of actions toward a goal, and AIMA situates classical planning and
      // MDP-based planning as adjacent chapters of the same problem.
      related: ['react-loops', 'function-tool-calling', 'multi-agent-systems', 'mdps-and-bellman-equation'],
      references: {
        free: [{ title: 'PromptHub — Least-to-Most Prompting Guide', url: 'https://www.prompthub.us/blog/least-to-most-prompting-guide' }],
        papers: [
          {
            title: 'Least-to-Most Prompting Enables Complex Reasoning in Large Language Models',
            url: 'https://arxiv.org/abs/2205.10625',
            year: 2022,
          },
          { title: 'Tree of Thoughts: Deliberate Problem Solving with Large Language Models', url: 'https://arxiv.org/abs/2305.10601', year: 2023 },
        ],
        books: [
          {
            title: 'Artificial Intelligence: A Modern Approach',
            author: 'Russell & Norvig',
            chapter: 'Ch. 10 — Classical Planning',
          },
        ],
        video: [{ title: 'DeepLearning.AI', url: 'https://www.youtube.com/@Deeplearningai' }],
      },
    },
    {
      id: 'model-context-protocol',
      name: 'Model Context Protocol (MCP)',
      aliases: ['MCP'],
      tier: 2,
      year: 2024,
      difficulty: 2,
      hook: 'A standard client-server protocol so any AI app can plug into any tool or data source without a custom integration.',
      intuition:
        "Before MCP, connecting a model to a company's Google Drive, database, or ticketing system meant writing a bespoke integration " +
        'for each pairing of assistant and tool — the same plumbing rebuilt once per assistant, once per tool. MCP standardizes the ' +
        'wire format instead: an MCP server exposes a data source or a set of tools in a common way, and any MCP client — an AI ' +
        'application such as an assistant, an IDE, or a custom agent — can talk to any MCP server without knowing anything about how ' +
        "it's implemented. Anthropic's own analogy is direct: MCP is meant to work like a USB-C port for AI applications, one standard " +
        'connector instead of one cable per device. A server can expose tools (callable functions), resources (readable data like ' +
        'files or database rows), and prompts (reusable templates) over a common protocol, and the same server works with every client ' +
        'that speaks MCP, not just the one it was built for.',
      howItWorks: {
        summary:
          'An MCP server exposes tools, resources and prompts over a standard protocol; any MCP client connects to any server using the ' +
          'same interface, without a custom integration per pairing.',
        steps: [
          'A server developer wraps a data source or tool (a database, a filesystem, an API) as an MCP server, exposing it as tools, resources and/or prompts.',
          'An MCP client — an AI application such as an assistant, IDE, or custom agent — connects to one or more MCP servers over the protocol.',
          "The client lists what each server offers and passes the relevant tools and resources into the model's context, similar to a function-calling schema.",
          'When the model requests a tool or resource, the client relays that request to the correct server and returns the result.',
        ],
      },
      whenToUse: [
        'You are building an AI application that needs to connect to several external tools or data sources and want one integration surface instead of one per tool',
        "You are exposing your own tool or data source and want it usable by any MCP-compatible client without writing a client-specific integration for each one",
      ],
      whenNotToUse: [
        'You have exactly one tool and one client, permanently, with no plan to reuse either — a direct function-calling integration is less machinery for the same result',
        'The client you are building has no MCP-client support and adding it is not worth the engineering cost for a single integration',
      ],
      facets: {
        task: ['control'],
        dataType: ['text'],
        dataSize: ['tiny', 'small'],
        interpretability: 'high',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'tool-and-resource-access',
      },
      related: ['function-tool-calling', 'multi-agent-systems'],
      references: {
        free: [
          { title: 'Anthropic — Introducing the Model Context Protocol', url: 'https://www.anthropic.com/news/model-context-protocol' },
          { title: 'Model Context Protocol — Introduction', url: 'https://modelcontextprotocol.io/introduction' },
        ],
      },
    },
    {
      id: 'multi-agent-systems',
      name: 'Multi-Agent LLM Systems',
      aliases: ['multi-agent orchestration', 'agent teams'],
      tier: 2,
      year: 2023,
      difficulty: 4,
      hook: 'Splits a task across several LLM agents with distinct roles that message each other instead of one agent doing it all.',
      intuition:
        'A single agent juggling research, writing and review in one long context tends to blur all three jobs together and lose track ' +
        'of what it already did. Multi-agent systems split that up: give each agent a narrow role — a researcher, a coder, a critic, a ' +
        'manager that assigns work — a shorter, focused context, and let them communicate through structured messages instead of ' +
        "forcing one model to hold the whole task at once. CAMEL formalized a simple version with two role-playing agents, an 'AI " +
        "user' who issues instructions and an 'AI assistant' who carries them out, cooperating on a task neither prompt alone " +
        'specifies completely. AutoGen generalized the pattern into a conversation framework where any number of customizable agents ' +
        '— assistants, human proxies that can also execute code, or specialized tools — exchange messages until the task is done. The ' +
        "gain is division of labor and, sometimes, one agent catching another's mistake; the cost is more model calls, coordination " +
        "overhead, and new failure modes when agents miscommunicate or reinforce each other's error.",
      howItWorks: {
        summary:
          'Assign each agent a distinct role and scoped context, let them exchange messages according to a coordination pattern, and ' +
          'stop once the group produces one output for the shared task.',
        steps: [
          "Define each agent's role, its own system prompt, and which tools or context it has access to.",
          'Choose a coordination pattern: two agents role-playing instructor and executor, a manager agent that delegates to workers, or a group chat where agents speak in turn.',
          'Agents exchange messages — instructions, intermediate results, critiques — through the coordinator or directly with each other.',
          'The system stops when a designated agent signals completion, or a step/turn budget is reached, and returns the final result.',
        ],
      },
      whenToUse: [
        "The task naturally splits into distinct roles that benefit from separate context or expertise — one agent writes code, another reviews it",
        "A single agent's context is visibly overloaded by a task mixing several kinds of work at once",
      ],
      whenNotToUse: [
        'The task is short and single-purpose — coordination overhead across multiple agents costs more model calls and latency than one well-scoped agent',
        "You cannot tolerate the added failure surface of inter-agent miscommunication — agents can talk past each other or reinforce a shared wrong assumption with no external check",
      ],
      facets: {
        task: ['control'],
        dataType: ['text'],
        dataSize: ['small', 'medium'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'coordinated-multi-agent-output',
      },
      // guardrails (Aegis, sibling) is a genuine link, not decoration: Microsoft's own AutoGen
      // example includes a dedicated "Safeguard" agent role monitoring the other agents' output.
      related: ['react-loops', 'planning-and-decomposition', 'guardrails'],
      references: {
        free: [
          {
            title: 'Microsoft Research — AutoGen: Enabling next-generation large language model applications',
            url: 'https://www.microsoft.com/en-us/research/blog/autogen-enabling-next-generation-large-language-model-applications/',
          },
        ],
        papers: [
          {
            title: 'CAMEL: Communicative Agents for "Mind" Exploration of Large Language Model Society',
            url: 'https://arxiv.org/abs/2303.17760',
            year: 2023,
          },
          {
            title: 'AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation',
            url: 'https://arxiv.org/abs/2308.08155',
            year: 2023,
          },
        ],
      },
    },
    {
      id: 'computer-use-and-browser-agents',
      name: 'Computer Use & Browser Agents',
      aliases: ['computer use', 'web agents'],
      tier: 2,
      year: 2024,
      difficulty: 4,
      hook: 'Lets a model act on a real screen or webpage — reading pixels or the DOM, then clicking and typing like a person.',
      intuition:
        'Most tool use is a clean function call: structured input in, structured output out. Computer-use and browser agents instead ' +
        "operate the same interface a human would — a screenshot or a webpage's DOM — and act through the same primitives: move the " +
        "mouse, click a coordinate, type text, scroll, press a key. Anthropic's computer use gives Claude a loop of screenshot-in, " +
        'action-out: the model sees the current screen, decides on one action, that action executes, and a fresh screenshot comes back ' +
        'for the next decision. Browser-specific agents can instead act on structured DOM elements rather than raw pixels, which is ' +
        'often more reliable when the target is a webpage rather than an arbitrary desktop app. Both let a model touch any interface ' +
        'built for humans without an API existing for it at all, but at a real cost: the WebArena benchmark found GPT-4-based agents ' +
        'completing only about 14% of realistic multi-step web tasks against roughly 78% for humans, and Anthropic itself describes ' +
        'the capability as experimental and error-prone, still struggling with ordinary actions like scrolling and dragging.',
      howItWorks: {
        summary:
          'Feed the model the current state of a screen or webpage, let it choose one interface-level action, execute that action, and ' +
          'repeat with the updated state until the task is done.',
        steps: [
          'Capture the current state: a screenshot for computer-use agents, or the DOM/accessibility tree for browser agents.',
          'Give the model that state plus the task, and let it choose one action — click a coordinate or element, type text, scroll, press a key, or navigate a URL.',
          'Execute that single action against the real interface.',
          'Capture the new state and repeat, so the model always decides its next action from the actual current screen or page rather than an assumed one.',
          'Stop when the model judges the task complete, or a step budget is exceeded.',
        ],
      },
      whenToUse: [
        'The target system has no API at all — a legacy desktop application, or a website that only exposes a human UI',
        'The task is genuinely visual or DOM-structural — form filling, navigating a multi-page flow, verifying something rendered correctly on screen',
      ],
      whenNotToUse: [
        'A direct API or function call exists for the same task — it is faster, cheaper and far more reliable than driving the UI',
        'The task is high-stakes or irreversible (payments, account changes, deleting data) without human confirmation — success rates on realistic multi-step web tasks are still well below human performance, and the agent can misclick or misread the screen',
      ],
      facets: {
        task: ['control'],
        dataType: ['image', 'text', 'multimodal'],
        dataSize: ['tiny', 'small'],
        interpretability: 'low',
        trainingCost: 'low',
        needsScaling: false,
        handlesMissing: false,
        handlesCategorical: false,
        outputType: 'ui-action-sequence',
      },
      // guardrails / red-teaming-and-jailbreaks (Aegis, sibling) are genuine links: Anthropic's
      // own prompt-injection-defenses research page describes training-time refusal
      // reinforcement, input classifiers, and continuous red-teaming specifically for its browser
      // agent — a documented agentic-specific risk, not a generic LLM-safety restatement.
      related: ['react-loops', 'multi-agent-systems', 'guardrails', 'red-teaming-and-jailbreaks'],
      references: {
        free: [
          {
            title: 'Anthropic — Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku',
            url: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
          },
          {
            title: 'Anthropic — Mitigating the risk of prompt injections in browser use',
            url: 'https://www.anthropic.com/research/prompt-injection-defenses',
          },
        ],
        papers: [
          { title: 'WebArena: A Realistic Web Environment for Building Autonomous Agents', url: 'https://arxiv.org/abs/2307.13854', year: 2023 },
        ],
      },
    },
  ],
} satisfies Body;
