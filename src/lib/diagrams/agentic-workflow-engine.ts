// ============================================================================
// AGENTIC WORKFLOW DIAGRAM ENGINE
// Transforms the agenticWorkflow JSONB column into topology-specific diagrams.
// Each agentic pattern produces a DIFFERENT graph layout.
// Pure TypeScript — no framework dependencies.
// ============================================================================

import type {
  DiagramDefinition,
  DiagramNode,
  DiagramEdge,
  UseCase,
  WorkflowMap,
  WorkflowStep,
} from "../types";

// ---------------------------------------------------------------------------
// Input shape (from the architectures.agenticWorkflow JSONB column)
// ---------------------------------------------------------------------------
interface AgenticWorkflowInput {
  useCase: UseCase;
  workflow?: WorkflowMap;
  pattern: string;
  primitives: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  type: string,
  label: string,
  x: number,
  y: number,
  data: Record<string, any> = {},
): DiagramNode {
  return { id, type, label, data, position: { x, y } };
}

function makeEdge(
  source: string,
  target: string,
  label?: string,
  animated?: boolean,
): DiagramEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    ...(label ? { label } : {}),
    ...(animated !== undefined ? { animated } : {}),
  };
}

/** Extract AI-enabled workflow steps as agent descriptors. */
function deriveAgentsFromWorkflow(
  workflow?: WorkflowMap,
): Array<{ id: string; name: string; description: string }> {
  if (!workflow?.targetState) return [];
  return workflow.targetState
    .filter((s) => s.isAIEnabled)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || s.aiApproach || "",
    }));
}

/** Sanitize a label for Mermaid (remove special characters). */
function mermaidLabel(label: string): string {
  return label.replace(/[[\](){}|#&"]/g, "").replace(/\n/g, " ");
}

/** Produce a short identifier safe for Mermaid node IDs. */
function mermaidId(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 30);
}

// ---------------------------------------------------------------------------
// PATTERN GENERATORS
// ---------------------------------------------------------------------------

// 1. Orchestrator-Worker  --------------------------------------------------
function generateOrchestratorWorker(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const workerNames =
    agents.length > 0
      ? agents.map((a) => a.name)
      : ["Data Worker", "Analysis Worker", "Validation Worker", "Output Worker"];

  const cx = 400;
  const cy = 300;
  const radius = 250;
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Orchestrator
  nodes.push(
    makeNode("orchestrator", "orchestrator", "Orchestrator", cx, cy, {
      role: "coordinator",
      useCase: input.useCase.name,
      primitives: input.primitives,
    }),
  );

  // Workers arranged radially
  const angleStep = (2 * Math.PI) / workerNames.length;
  workerNames.forEach((name, i) => {
    const angle = angleStep * i - Math.PI / 2; // start from top
    const wx = cx + radius * Math.cos(angle);
    const wy = cy + radius * Math.sin(angle);
    const workerId = `worker-${i}`;
    const agentData = agents[i] || {};

    nodes.push(
      makeNode(workerId, "worker", name, wx, wy, {
        role: "specialist",
        ...agentData,
      }),
    );
    edges.push(makeEdge("orchestrator", workerId, "assign", true));
    edges.push(makeEdge(workerId, "orchestrator", "result"));
  });

  // Mermaid
  const workerMermaid = workerNames
    .map((name, i) => {
      const mid = mermaidId(`worker_${i}`);
      const ml = mermaidLabel(name);
      return `    Orchestrator -->|assign| ${mid}["${ml}"]\n    ${mid} -->|result| Orchestrator`;
    })
    .join("\n");

  const mermaidCode = `graph TD
    Orchestrator(("Orchestrator"))
${workerMermaid}`;

  return { nodes, edges, mermaidCode };
}

// 2. Tool Use  -------------------------------------------------------------
function generateToolUse(input: AgenticWorkflowInput): DiagramDefinition {
  const tools = input.useCase.integrations?.length
    ? input.useCase.integrations
    : ["API", "Database", "File System"];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Main vertical chain
  nodes.push(makeNode("input", "input", "Input", 400, 50, {}));
  nodes.push(
    makeNode("agent", "agent", "AI Agent", 400, 200, {
      primitives: input.primitives,
      useCase: input.useCase.name,
    }),
  );
  nodes.push(makeNode("router", "router", "Tool Router", 400, 350, {}));
  nodes.push(makeNode("output", "output", "Output", 400, 550, {}));

  edges.push(makeEdge("input", "agent"));
  edges.push(makeEdge("agent", "router", "select tool", true));
  edges.push(makeEdge("router", "output", "final result"));

  // Tool branches — alternate left and right
  const toolSpacing = 180;
  const startX = 400 - ((tools.length - 1) * toolSpacing) / 2;

  tools.forEach((tool, i) => {
    const toolId = `tool-${i}`;
    const tx = startX + i * toolSpacing;
    const ty = 450;

    nodes.push(makeNode(toolId, "tool", tool, tx, ty, { tool }));
    edges.push(makeEdge("router", toolId, "invoke", true));
    edges.push(makeEdge(toolId, "router", "response"));
  });

  // Mermaid
  const toolMermaid = tools
    .map((tool, i) => {
      const tid = mermaidId(`tool_${i}`);
      const tl = mermaidLabel(tool);
      return `    Router -->|invoke| ${tid}["${tl}"]\n    ${tid} -->|response| Router`;
    })
    .join("\n");

  const mermaidCode = `graph TD
    Input["Input"] --> Agent["AI Agent"]
    Agent -->|select tool| Router{"Tool Router"}
    Router -->|final result| Output["Output"]
${toolMermaid}`;

  return { nodes, edges, mermaidCode };
}

// 3. Reflection  -----------------------------------------------------------
function generateReflection(input: AgenticWorkflowInput): DiagramDefinition {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Circular loop: Generate -> Evaluate -> Refine -> Generate
  const cx = 400;
  const cy = 300;
  const radius = 180;

  const loopSteps = [
    { id: "generate", label: "Generate", angle: -Math.PI / 2 },
    { id: "evaluate", label: "Evaluate", angle: Math.PI / 6 },
    { id: "refine", label: "Refine", angle: (5 * Math.PI) / 6 },
  ];

  loopSteps.forEach((step) => {
    const x = cx + radius * Math.cos(step.angle);
    const y = cy + radius * Math.sin(step.angle);
    nodes.push(
      makeNode(step.id, "process", step.label, x, y, {
        primitives: input.primitives,
      }),
    );
  });

  // Loop edges
  edges.push(makeEdge("generate", "evaluate", "draft", true));
  edges.push(makeEdge("evaluate", "refine", "feedback", true));
  edges.push(makeEdge("refine", "generate", "iterate", true));

  // Output exit from Evaluate
  nodes.push(
    makeNode("output", "output", "Output", cx + radius + 200, cy, {
      description: "Final output after quality gate passes",
    }),
  );
  edges.push(makeEdge("evaluate", "output", "approved"));

  const mermaidCode = `graph TD
    Generate["Generate"] -->|draft| Evaluate["Evaluate"]
    Evaluate -->|feedback| Refine["Refine"]
    Refine -->|iterate| Generate
    Evaluate -->|approved| Output["Output"]`;

  return { nodes, edges, mermaidCode };
}

// 4. Planning  -------------------------------------------------------------
function generatePlanning(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const subTasks =
    agents.length >= 2
      ? agents.slice(0, 4).map((a) => a.name)
      : ["Sub-task A", "Sub-task B", "Sub-task C"];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Level 0: Planner
  nodes.push(
    makeNode("planner", "planner", "Planner", 400, 50, {
      primitives: input.primitives,
      useCase: input.useCase.name,
    }),
  );

  // Level 1: Sub-tasks
  const subSpacing = 250;
  const subStartX = 400 - ((subTasks.length - 1) * subSpacing) / 2;

  subTasks.forEach((name, i) => {
    const subId = `subtask-${i}`;
    const sx = subStartX + i * subSpacing;
    nodes.push(makeNode(subId, "subtask", name, sx, 200, { task: name }));
    edges.push(makeEdge("planner", subId, "decompose", true));

    // Level 2: Execution node per sub-task
    const execId = `exec-${i}`;
    nodes.push(makeNode(execId, "execution", `Execute: ${name}`, sx, 370, {}));
    edges.push(makeEdge(subId, execId, "execute"));

    // Connect execution to synthesis
    edges.push(makeEdge(execId, "synthesis", "result"));
  });

  // Level 3: Synthesis
  nodes.push(
    makeNode("synthesis", "synthesis", "Synthesis", 400, 530, {
      description: "Merge sub-task results into final output",
    }),
  );

  // Mermaid
  const subMermaid = subTasks
    .map((name, i) => {
      const sid = mermaidId(`subtask_${i}`);
      const eid = mermaidId(`exec_${i}`);
      const sl = mermaidLabel(name);
      return [
        `    Planner -->|decompose| ${sid}["${sl}"]`,
        `    ${sid} -->|execute| ${eid}["Execute: ${sl}"]`,
        `    ${eid} -->|result| Synthesis`,
      ].join("\n");
    })
    .join("\n");

  const mermaidCode = `graph TD
    Planner["Planner"]
${subMermaid}
    Synthesis["Synthesis"]`;

  return { nodes, edges, mermaidCode };
}

// 5. Parallelization  ------------------------------------------------------
function generateParallelization(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const workerCount = agents.length >= 2 ? agents.length : 3;
  const workerNames =
    agents.length >= 2
      ? agents.map((a) => a.name)
      : Array.from({ length: workerCount }, (_, i) => `Worker ${i + 1}`);

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Input -> Fan-out
  nodes.push(makeNode("input", "input", "Input", 400, 50, {}));
  nodes.push(
    makeNode("fanout", "fanout", "Fan-out", 400, 180, {
      description: "Distributes work to parallel workers",
    }),
  );
  edges.push(makeEdge("input", "fanout"));

  // Parallel workers
  const workerSpacing = 220;
  const startX = 400 - ((workerCount - 1) * workerSpacing) / 2;

  workerNames.forEach((name, i) => {
    const wid = `worker-${i}`;
    const wx = startX + i * workerSpacing;
    nodes.push(
      makeNode(wid, "worker", name, wx, 330, {
        parallel: true,
        ...(agents[i] || {}),
      }),
    );
    edges.push(makeEdge("fanout", wid, undefined, true));
    edges.push(makeEdge(wid, "fanin"));
  });

  // Fan-in -> Output
  nodes.push(
    makeNode("fanin", "fanin", "Fan-in", 400, 480, {
      description: "Merges parallel results",
    }),
  );
  nodes.push(makeNode("output", "output", "Output", 400, 610, {}));
  edges.push(makeEdge("fanin", "output"));

  // Mermaid
  const workerMermaid = workerNames
    .map((name, i) => {
      const wid = mermaidId(`worker_${i}`);
      const wl = mermaidLabel(name);
      return `    FanOut -->|parallel| ${wid}["${wl}"]\n    ${wid} --> FanIn`;
    })
    .join("\n");

  const mermaidCode = `graph TD
    Input["Input"] --> FanOut{"Fan-out"}
${workerMermaid}
    FanIn{"Fan-in"} --> Output["Output"]`;

  return { nodes, edges, mermaidCode };
}

// 6. Agent Handoff  --------------------------------------------------------
function generateAgentHandoff(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const agentNames =
    agents.length >= 2
      ? agents.map((a) => a.name)
      : ["Triage Agent", "Specialist A", "Specialist B", "Resolution Agent"];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const ySpacing = 160;

  agentNames.forEach((name, i) => {
    const agentId = `agent-${i}`;
    const y = 50 + i * ySpacing;

    // Agent node
    nodes.push(
      makeNode(agentId, "agent", name, 400, y, {
        role: "specialist",
        ...(agents[i] || {}),
      }),
    );

    // Diamond routing node between agents (except after the last)
    if (i < agentNames.length - 1) {
      const routerId = `router-${i}`;
      const routerY = y + ySpacing / 2;
      nodes.push(
        makeNode(routerId, "decision", "Route", 400, routerY, {
          description: `Handoff decision: ${name}`,
        }),
      );
      edges.push(makeEdge(agentId, routerId, "handoff", true));
      edges.push(makeEdge(routerId, `agent-${i + 1}`, "delegate"));
    }
  });

  // Mermaid
  const lines: string[] = [];
  agentNames.forEach((name, i) => {
    const aid = mermaidId(`agent_${i}`);
    const al = mermaidLabel(name);
    if (i === 0) {
      lines.push(`    ${aid}["${al}"]`);
    }
    if (i < agentNames.length - 1) {
      const rid = mermaidId(`router_${i}`);
      const nextId = mermaidId(`agent_${i + 1}`);
      const nextLabel = mermaidLabel(agentNames[i + 1]);
      lines.push(`    ${aid} -->|handoff| ${rid}{"Route"}`);
      lines.push(`    ${rid} -->|delegate| ${nextId}["${nextLabel}"]`);
    }
  });

  const mermaidCode = `graph TD\n${lines.join("\n")}`;

  return { nodes, edges, mermaidCode };
}

// 7. ReAct  ----------------------------------------------------------------
function generateReact(input: AgenticWorkflowInput): DiagramDefinition {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Triangle layout
  const cx = 400;
  const topY = 100;
  const bottomY = 400;
  const halfSpread = 250;

  nodes.push(
    makeNode("think", "reasoning", "Think", cx, topY, {
      description: "Reason about current state and decide next action",
      primitives: ["Reasoning"],
    }),
  );
  nodes.push(
    makeNode("act", "action", "Act", cx - halfSpread, bottomY, {
      description: "Execute chosen action or tool call",
      primitives: ["Tool Use"],
    }),
  );
  nodes.push(
    makeNode("observe", "observation", "Observe", cx + halfSpread, bottomY, {
      description: "Process result and update state",
      primitives: ["Memory"],
    }),
  );

  // Cycle edges
  edges.push(makeEdge("think", "act", "decide action", true));
  edges.push(makeEdge("act", "observe", "result", true));
  edges.push(makeEdge("observe", "think", "update state", true));

  // Output exit
  nodes.push(
    makeNode("output", "output", "Output", cx, bottomY + 180, {
      description: "Final answer when reasoning concludes",
    }),
  );
  edges.push(makeEdge("think", "output", "done"));

  // Tool branches from Act
  const tools = input.useCase.integrations?.length
    ? input.useCase.integrations.slice(0, 3)
    : ["Tool 1", "Tool 2"];

  const toolStartX = cx - halfSpread - 180;
  tools.forEach((tool, i) => {
    const toolId = `tool-${i}`;
    const tx = toolStartX;
    const ty = bottomY - 80 + i * 80;
    nodes.push(makeNode(toolId, "tool", tool, tx, ty, { tool }));
    edges.push(makeEdge("act", toolId, "call", true));
  });

  // Mermaid
  const toolMermaid = tools
    .map((tool, i) => {
      const tid = mermaidId(`tool_${i}`);
      const tl = mermaidLabel(tool);
      return `    Act -->|call| ${tid}["${tl}"]`;
    })
    .join("\n");

  const mermaidCode = `graph TD
    Think["Think"] -->|decide action| Act["Act"]
    Act -->|result| Observe["Observe"]
    Observe -->|update state| Think
    Think -->|done| Output["Output"]
${toolMermaid}`;

  return { nodes, edges, mermaidCode };
}

// 8. Generator-Critic  -----------------------------------------------------
function generateGeneratorCritic(input: AgenticWorkflowInput): DiagramDefinition {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Two-column layout
  const leftX = 200;
  const rightX = 600;

  // Generator column (left)
  nodes.push(
    makeNode("gen-input", "input", "Input", leftX, 50, {}),
  );
  nodes.push(
    makeNode("generator", "generator", "Generator", leftX, 200, {
      description: "Produces initial output",
      primitives: input.primitives,
    }),
  );
  nodes.push(
    makeNode("gen-draft", "artifact", "Draft Output", leftX, 350, {}),
  );
  nodes.push(
    makeNode("gen-revised", "artifact", "Revised Output", leftX, 500, {}),
  );

  // Critic column (right)
  nodes.push(
    makeNode("critic", "critic", "Critic", rightX, 200, {
      description: "Reviews and provides feedback",
    }),
  );
  nodes.push(
    makeNode("feedback", "artifact", "Feedback", rightX, 350, {}),
  );
  nodes.push(
    makeNode("approval", "decision", "Approval Gate", rightX, 500, {}),
  );

  // Final output
  nodes.push(
    makeNode("output", "output", "Final Output", 400, 650, {}),
  );

  // Edges: Generator flow
  edges.push(makeEdge("gen-input", "generator"));
  edges.push(makeEdge("generator", "gen-draft", "produce", true));

  // Cross: Draft -> Critic
  edges.push(makeEdge("gen-draft", "critic", "submit for review"));

  // Critic flow
  edges.push(makeEdge("critic", "feedback", "critique"));
  edges.push(makeEdge("feedback", "generator", "revise", true));
  edges.push(makeEdge("critic", "approval", "evaluate"));

  // Revised output
  edges.push(makeEdge("generator", "gen-revised", "revision"));
  edges.push(makeEdge("gen-revised", "approval", "re-submit"));

  // Approval gate
  edges.push(makeEdge("approval", "output", "approved"));
  edges.push(makeEdge("approval", "critic", "reject"));

  const mermaidCode = `graph TD
    Input["Input"] --> Generator["Generator"]
    Generator -->|produce| Draft["Draft Output"]
    Draft -->|submit for review| Critic["Critic"]
    Critic -->|critique| Feedback["Feedback"]
    Feedback -->|revise| Generator
    Generator -->|revision| Revised["Revised Output"]
    Revised -->|re-submit| Approval{"Approval Gate"}
    Critic -->|evaluate| Approval
    Approval -->|approved| Output["Final Output"]
    Approval -->|reject| Critic`;

  return { nodes, edges, mermaidCode };
}

// 9. Group Chat / Swarm  ---------------------------------------------------
function generateGroupChat(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const agentNames =
    agents.length >= 2
      ? agents.map((a) => a.name)
      : ["Agent A", "Agent B", "Agent C", "Agent D"];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  const cx = 400;
  const cy = 300;
  const radius = 250;

  // Central moderator
  nodes.push(
    makeNode("moderator", "moderator", "Moderator", cx, cy, {
      role: "moderator",
      description: "Manages turn-taking and convergence",
    }),
  );

  // Agents in a ring
  const angleStep = (2 * Math.PI) / agentNames.length;
  agentNames.forEach((name, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const ax = cx + radius * Math.cos(angle);
    const ay = cy + radius * Math.sin(angle);
    const agentId = `agent-${i}`;

    nodes.push(
      makeNode(agentId, "agent", name, ax, ay, {
        role: "participant",
        ...(agents[i] || {}),
      }),
    );

    // All-to-all through moderator
    edges.push(makeEdge(agentId, "moderator", "speak", true));
    edges.push(makeEdge("moderator", agentId, "broadcast"));
  });

  // Mermaid
  const agentMermaid = agentNames
    .map((name, i) => {
      const aid = mermaidId(`agent_${i}`);
      const al = mermaidLabel(name);
      return `    ${aid}["${al}"] -->|speak| Moderator\n    Moderator -->|broadcast| ${aid}`;
    })
    .join("\n");

  const mermaidCode = `graph TD
    Moderator(("Moderator"))
${agentMermaid}`;

  return { nodes, edges, mermaidCode };
}

// 10. Semantic Router  -----------------------------------------------------
function generateSemanticRouter(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const routeTargets =
    agents.length >= 2
      ? agents.map((a) => a.name)
      : ["Intent A Handler", "Intent B Handler", "Intent C Handler"];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Input
  nodes.push(makeNode("input", "input", "Input", 400, 50, {}));

  // Router diamond
  nodes.push(
    makeNode("router", "decision", "Semantic Router", 400, 200, {
      description: "Routes based on intent classification",
      primitives: input.primitives,
    }),
  );
  edges.push(makeEdge("input", "router"));

  // Specialized agents — horizontal spread
  const agentSpacing = 220;
  const startX = 400 - ((routeTargets.length - 1) * agentSpacing) / 2;

  routeTargets.forEach((name, i) => {
    const agentId = `handler-${i}`;
    const ax = startX + i * agentSpacing;
    nodes.push(
      makeNode(agentId, "agent", name, ax, 380, {
        role: "handler",
        ...(agents[i] || {}),
      }),
    );
    edges.push(makeEdge("router", agentId, `intent ${i + 1}`, true));
    edges.push(makeEdge(agentId, "output"));
  });

  // Output
  nodes.push(makeNode("output", "output", "Output", 400, 550, {}));

  // Mermaid
  const routeMermaid = routeTargets
    .map((name, i) => {
      const hid = mermaidId(`handler_${i}`);
      const hl = mermaidLabel(name);
      return `    Router -->|"intent ${i + 1}"| ${hid}["${hl}"]\n    ${hid} --> Output`;
    })
    .join("\n");

  const mermaidCode = `graph TD
    Input["Input"] --> Router{"Semantic Router"}
${routeMermaid}
    Output["Output"]`;

  return { nodes, edges, mermaidCode };
}

// Fallback: Linear flow  ---------------------------------------------------
function generateLinearFallback(input: AgenticWorkflowInput): DiagramDefinition {
  const agents = deriveAgentsFromWorkflow(input.workflow);
  const steps =
    agents.length >= 2
      ? agents.map((a) => a.name)
      : ["Input", "Process", "Output"];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const ySpacing = 150;

  steps.forEach((name, i) => {
    const nodeType = i === 0 ? "input" : i === steps.length - 1 ? "output" : "process";
    const nodeId = `step-${i}`;
    nodes.push(makeNode(nodeId, nodeType, name, 400, 50 + i * ySpacing, {}));
    if (i > 0) {
      edges.push(makeEdge(`step-${i - 1}`, nodeId, undefined, true));
    }
  });

  // Mermaid
  const stepMermaid = steps
    .map((name, i) => {
      const sid = mermaidId(`step_${i}`);
      const sl = mermaidLabel(name);
      return i === 0
        ? `    ${sid}["${sl}"]`
        : `    ${mermaidId(`step_${i - 1}`)} --> ${sid}["${sl}"]`;
    })
    .join("\n");

  const mermaidCode = `graph TD\n${stepMermaid}`;

  return { nodes, edges, mermaidCode };
}

// ---------------------------------------------------------------------------
// PATTERN DISPATCH MAP
// ---------------------------------------------------------------------------

const PATTERN_GENERATORS: Record<
  string,
  (input: AgenticWorkflowInput) => DiagramDefinition
> = {
  orchestrator_worker: generateOrchestratorWorker,
  tool_use: generateToolUse,
  reflection: generateReflection,
  planning: generatePlanning,
  parallelization: generateParallelization,
  agent_handoff: generateAgentHandoff,
  react: generateReact,
  generator_critic: generateGeneratorCritic,
  group_chat: generateGroupChat,
  semantic_router: generateSemanticRouter,
  // Aliases
  multi_agent: generateOrchestratorWorker,
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Generate a topology-specific diagram from an agentic workflow definition.
 *
 * Each agentic pattern produces a unique graph layout:
 * - orchestrator_worker: Star topology with radial workers
 * - tool_use: Linear chain with tool branches
 * - reflection: Circular loop (Generate -> Evaluate -> Refine)
 * - planning: Tree decomposition (Planner -> Sub-tasks -> Execution -> Synthesis)
 * - parallelization: Fork-join (Fan-out -> Workers -> Fan-in)
 * - agent_handoff: Sequential with routing diamonds
 * - react: Cyclic triangle (Think -> Act -> Observe)
 * - generator_critic: Two-column with feedback arrows
 * - group_chat: Ring with central moderator
 * - semantic_router: Diamond decision tree
 *
 * Unrecognized patterns fall back to a simple linear flow.
 *
 * If workflow.targetState exists, agent names and descriptions are derived
 * from AI-enabled steps (isAIEnabled === true).
 */
export function generateAgenticWorkflow(
  agenticWorkflow: any,
): DiagramDefinition {
  const input = agenticWorkflow as AgenticWorkflowInput;

  // Safety: if no pattern, fall back
  if (!input?.pattern) {
    return generateLinearFallback(input || { useCase: { name: "Unknown" } as any, primitives: [] });
  }

  const generator = PATTERN_GENERATORS[input.pattern];
  if (generator) {
    return generator(input);
  }

  // Unrecognized pattern
  return generateLinearFallback(input);
}
