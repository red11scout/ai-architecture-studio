// ============================================================================
// SYSTEM ARCHITECTURE DIAGRAM ENGINE
// Generates a top-to-bottom vertical DAG:
// User -> API Gateway -> AI Orchestrator -> Agent(s) -> Tools/APIs -> Enterprise Systems
//
// Input: systemArchitecture JSONB from the architectures table
// Output: { nodes, edges, mermaidCode }
// ============================================================================

import type {
  DiagramDefinition,
  DiagramNode,
  DiagramEdge,
  UseCase,
  WorkflowMap,
} from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CENTER_X = 400;
const NODE_SPACING_X = 200;
const ROW_Y = {
  USER: 0,
  GATEWAY: 150,
  ORCHESTRATOR: 300,
  AGENTS: 450,
  TOOLS: 600,
  SYSTEMS: 750,
} as const;

// ---------------------------------------------------------------------------
// Input shape (matches systemArchitecture JSONB column)
// ---------------------------------------------------------------------------

interface SystemArchitectureInput {
  useCase: UseCase;
  workflow?: WorkflowMap;
  pattern: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitize a string into a valid Mermaid node ID (alphanumeric + underscore). */
function toMermaidId(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Format a pattern ID into a human-readable label. */
function formatPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    orchestrator_worker: "Orchestrator-Worker",
    tool_use: "Tool Use (LLM + Tools)",
    reflection: "Reflection Loop",
    planning: "Task Decomposition",
    parallelization: "Parallel Agents",
    agent_handoff: "Agent Handoff",
    react: "ReAct (Reason + Act)",
    multi_agent: "Multi-Agent",
    group_chat: "Group Chat / Swarm",
    generator_critic: "Generator-Critic",
  };
  return labels[pattern] || pattern.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Center an array of items horizontally around CENTER_X.
 * Returns an array of x-positions.
 */
function centerPositions(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [CENTER_X];
  const totalWidth = (count - 1) * NODE_SPACING_X;
  const startX = CENTER_X - totalWidth / 2;
  return Array.from({ length: count }, (_, i) => startX + i * NODE_SPACING_X);
}

/** Escape Mermaid label text to prevent syntax breaks. */
function escapeMermaidLabel(text: string): string {
  return text.replace(/[[\](){}|<>"]/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Agent derivation per pattern
// ---------------------------------------------------------------------------

interface AgentSpec {
  id: string;
  label: string;
}

function deriveAgents(pattern: string, useCase: UseCase): AgentSpec[] {
  switch (pattern) {
    case "orchestrator_worker": {
      // Derive worker agents from AI primitives or use defaults
      const primitives = useCase.aiPrimitives ?? [];
      if (primitives.length >= 2) {
        return primitives.map((p, i) => ({
          id: `worker_${i}`,
          label: `${p} Worker`,
        }));
      }
      return [
        { id: "worker_0", label: "Research Worker" },
        { id: "worker_1", label: "Analysis Worker" },
        { id: "worker_2", label: "Synthesis Worker" },
      ];
    }

    case "tool_use":
      return [{ id: "tool_agent", label: "Tool-Calling Agent" }];

    case "reflection":
      return [{ id: "reflection_agent", label: "Reflection Agent" }];

    case "planning":
      return [{ id: "planner_agent", label: "Planner Agent" }];

    case "parallelization": {
      const primitives = useCase.aiPrimitives ?? [];
      const count = Math.max(primitives.length, 3);
      return Array.from({ length: count }, (_, i) => ({
        id: `parallel_${i}`,
        label: primitives[i] ? `${primitives[i]} Agent` : `Parallel Agent ${i + 1}`,
      }));
    }

    case "agent_handoff": {
      // Sequential handoff agents
      return [
        { id: "triage_agent", label: "Triage Agent" },
        { id: "specialist_agent", label: "Specialist Agent" },
        { id: "completion_agent", label: "Completion Agent" },
      ];
    }

    case "react":
      return [{ id: "react_agent", label: "ReAct Agent" }];

    case "multi_agent":
      return [
        { id: "coordinator", label: "Coordinator Agent" },
        { id: "specialist_a", label: "Specialist A" },
        { id: "specialist_b", label: "Specialist B" },
      ];

    case "group_chat":
      return [
        { id: "moderator", label: "Moderator" },
        { id: "debater_a", label: "Perspective A" },
        { id: "debater_b", label: "Perspective B" },
      ];

    case "generator_critic":
      return [
        { id: "generator", label: "Generator Agent" },
        { id: "critic", label: "Critic Agent" },
      ];

    default:
      return [{ id: "agent", label: "AI Agent" }];
  }
}

// ---------------------------------------------------------------------------
// Enterprise system extraction
// ---------------------------------------------------------------------------

function deriveEnterpriseSystems(
  integrations: string[],
  workflow?: WorkflowMap,
): string[] {
  const systemSet = new Set<string>();

  // Extract systems from workflow steps if available
  if (workflow) {
    const allSteps = [...(workflow.currentState ?? []), ...(workflow.targetState ?? [])];
    for (const step of allSteps) {
      for (const sys of step.systems ?? []) {
        systemSet.add(sys);
      }
      for (const detail of step.systemDetails ?? []) {
        if (detail.name) {
          systemSet.add(detail.name);
        }
      }
    }
  }

  // If workflow didn't yield systems, derive from integrations
  if (systemSet.size === 0) {
    for (const integration of integrations) {
      systemSet.add(integration);
    }
  }

  return Array.from(systemSet);
}

// ---------------------------------------------------------------------------
// Main engine function
// ---------------------------------------------------------------------------

export function generateSystemArchitecture(
  systemArchitecture: any,
): DiagramDefinition {
  const input = systemArchitecture as SystemArchitectureInput;
  const useCase = input?.useCase;
  const workflow = input?.workflow;
  const pattern = input?.pattern ?? useCase?.primaryPattern ?? "tool_use";
  const integrations = useCase?.integrations ?? [];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const mermaidLines: string[] = ["graph TD"];

  // -----------------------------------------------------------------------
  // Row 0: User / Client
  // -----------------------------------------------------------------------
  const userNode: DiagramNode = {
    id: "user",
    type: "user",
    label: "User / Client",
    data: { role: "end_user" },
    position: { x: CENTER_X, y: ROW_Y.USER },
  };
  nodes.push(userNode);
  mermaidLines.push(`    user["User / Client"]`);

  // -----------------------------------------------------------------------
  // Row 1: API Gateway
  // -----------------------------------------------------------------------
  const gatewayNode: DiagramNode = {
    id: "gateway",
    type: "gateway",
    label: "API Gateway",
    data: { protocol: "REST/WebSocket" },
    position: { x: CENTER_X, y: ROW_Y.GATEWAY },
  };
  nodes.push(gatewayNode);
  mermaidLines.push(`    gateway["API Gateway"]`);

  // Edge: User -> Gateway
  edges.push({
    id: "e_user_gateway",
    source: "user",
    target: "gateway",
    label: "Request",
    animated: true,
  });
  mermaidLines.push(`    user -->|Request| gateway`);

  // -----------------------------------------------------------------------
  // Row 2: AI Orchestrator
  // -----------------------------------------------------------------------
  const patternLabel = formatPatternLabel(pattern);
  const orchestratorNode: DiagramNode = {
    id: "orchestrator",
    type: "orchestrator",
    label: `AI Orchestrator (${patternLabel})`,
    data: {
      pattern,
      patternLabel,
      hitlCheckpoint: useCase?.hitlCheckpoint ?? "none",
    },
    position: { x: CENTER_X, y: ROW_Y.ORCHESTRATOR },
  };
  nodes.push(orchestratorNode);
  mermaidLines.push(
    `    orchestrator["AI Orchestrator\\n${escapeMermaidLabel(patternLabel)}"]`,
  );

  // Edge: Gateway -> Orchestrator
  edges.push({
    id: "e_gateway_orchestrator",
    source: "gateway",
    target: "orchestrator",
    label: "Route",
    animated: true,
  });
  mermaidLines.push(`    gateway -->|Route| orchestrator`);

  // -----------------------------------------------------------------------
  // Row 3: Agent(s)
  // -----------------------------------------------------------------------
  const agents = deriveAgents(pattern, useCase ?? ({} as UseCase));
  const agentXPositions = centerPositions(agents.length);

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const agentNode: DiagramNode = {
      id: agent.id,
      type: "agent",
      label: agent.label,
      data: { pattern, index: i },
      position: { x: agentXPositions[i], y: ROW_Y.AGENTS },
    };
    nodes.push(agentNode);
    mermaidLines.push(`    ${agent.id}["${escapeMermaidLabel(agent.label)}"]`);

    // Edge: Orchestrator -> Agent
    edges.push({
      id: `e_orchestrator_${agent.id}`,
      source: "orchestrator",
      target: agent.id,
      label: agents.length > 1 ? `Task ${i + 1}` : "Execute",
      animated: true,
    });
    mermaidLines.push(
      `    orchestrator -->|${agents.length > 1 ? `Task ${i + 1}` : "Execute"}| ${agent.id}`,
    );
  }

  // Special edge: reflection self-loop
  if (pattern === "reflection") {
    edges.push({
      id: "e_reflection_loop",
      source: "reflection_agent",
      target: "reflection_agent",
      label: "Self-Critique",
      animated: true,
    });
    mermaidLines.push(`    reflection_agent -->|Self-Critique| reflection_agent`);
  }

  // Special edges: generator-critic feedback loop
  if (pattern === "generator_critic") {
    edges.push({
      id: "e_critic_generator",
      source: "critic",
      target: "generator",
      label: "Feedback",
      animated: true,
    });
    mermaidLines.push(`    critic -->|Feedback| generator`);
  }

  // Special edges: agent_handoff sequential connections
  if (pattern === "agent_handoff" && agents.length > 1) {
    for (let i = 0; i < agents.length - 1; i++) {
      edges.push({
        id: `e_handoff_${agents[i].id}_${agents[i + 1].id}`,
        source: agents[i].id,
        target: agents[i + 1].id,
        label: "Handoff",
        animated: false,
      });
      mermaidLines.push(
        `    ${agents[i].id} -->|Handoff| ${agents[i + 1].id}`,
      );
    }
  }

  // -----------------------------------------------------------------------
  // Row 4: Tools / APIs
  // -----------------------------------------------------------------------
  const toolNodes: DiagramNode[] = [];

  if (integrations.length > 0) {
    const toolXPositions = centerPositions(integrations.length);

    for (let i = 0; i < integrations.length; i++) {
      const integration = integrations[i];
      const toolId = `tool_${toMermaidId(integration)}`;
      const toolNode: DiagramNode = {
        id: toolId,
        type: "tool",
        label: integration,
        data: { integration, index: i },
        position: { x: toolXPositions[i], y: ROW_Y.TOOLS },
      };
      nodes.push(toolNode);
      toolNodes.push(toolNode);
      mermaidLines.push(`    ${toolId}["${escapeMermaidLabel(integration)}"]`);
    }

    // Connect agents to tools
    // Distribute tools across agents for multi-agent patterns
    if (agents.length === 1) {
      // Single agent connects to all tools
      for (const tool of toolNodes) {
        edges.push({
          id: `e_${agents[0].id}_${tool.id}`,
          source: agents[0].id,
          target: tool.id,
          label: "API Call",
          animated: false,
        });
        mermaidLines.push(`    ${agents[0].id} -->|API Call| ${tool.id}`);
      }
    } else {
      // Distribute tools across agents round-robin
      for (let t = 0; t < toolNodes.length; t++) {
        const agentIndex = t % agents.length;
        edges.push({
          id: `e_${agents[agentIndex].id}_${toolNodes[t].id}`,
          source: agents[agentIndex].id,
          target: toolNodes[t].id,
          label: "API Call",
          animated: false,
        });
        mermaidLines.push(
          `    ${agents[agentIndex].id} -->|API Call| ${toolNodes[t].id}`,
        );
      }
    }
  } else {
    // No integrations: create a single generic tool node
    const genericTool: DiagramNode = {
      id: "tool_generic",
      type: "tool",
      label: "External APIs",
      data: {},
      position: { x: CENTER_X, y: ROW_Y.TOOLS },
    };
    nodes.push(genericTool);
    toolNodes.push(genericTool);
    mermaidLines.push(`    tool_generic["External APIs"]`);

    for (const agent of agents) {
      edges.push({
        id: `e_${agent.id}_tool_generic`,
        source: agent.id,
        target: "tool_generic",
        label: "API Call",
        animated: false,
      });
      mermaidLines.push(`    ${agent.id} -->|API Call| tool_generic`);
    }
  }

  // -----------------------------------------------------------------------
  // Row 5: Enterprise Systems
  // -----------------------------------------------------------------------
  const enterpriseSystems = deriveEnterpriseSystems(integrations, workflow);

  if (enterpriseSystems.length > 0) {
    const sysXPositions = centerPositions(enterpriseSystems.length);

    for (let i = 0; i < enterpriseSystems.length; i++) {
      const sysName = enterpriseSystems[i];
      const sysId = `sys_${toMermaidId(sysName)}`;
      const sysNode: DiagramNode = {
        id: sysId,
        type: "system",
        label: sysName,
        data: { system: sysName, index: i },
        position: { x: sysXPositions[i], y: ROW_Y.SYSTEMS },
      };
      nodes.push(sysNode);
      mermaidLines.push(`    ${sysId}[("${escapeMermaidLabel(sysName)}")]`);

      // Connect tool nodes to enterprise systems
      // Match by name similarity or connect round-robin
      const matchingTool = toolNodes.find(
        (t) =>
          t.label.toLowerCase().includes(sysName.toLowerCase()) ||
          sysName.toLowerCase().includes(t.label.toLowerCase()),
      );

      if (matchingTool) {
        edges.push({
          id: `e_${matchingTool.id}_${sysId}`,
          source: matchingTool.id,
          target: sysId,
          label: "Data",
          animated: false,
        });
        mermaidLines.push(`    ${matchingTool.id} -->|Data| ${sysId}`);
      } else {
        // Connect to nearest tool by index
        const toolIndex = i % toolNodes.length;
        edges.push({
          id: `e_${toolNodes[toolIndex].id}_${sysId}`,
          source: toolNodes[toolIndex].id,
          target: sysId,
          label: "Data",
          animated: false,
        });
        mermaidLines.push(
          `    ${toolNodes[toolIndex].id} -->|Data| ${sysId}`,
        );
      }
    }
  } else {
    // Fallback: single enterprise system node
    const fallbackSys: DiagramNode = {
      id: "sys_enterprise",
      type: "system",
      label: "Enterprise Systems",
      data: {},
      position: { x: CENTER_X, y: ROW_Y.SYSTEMS },
    };
    nodes.push(fallbackSys);
    mermaidLines.push(`    sys_enterprise[("Enterprise Systems")]`);

    for (const tool of toolNodes) {
      edges.push({
        id: `e_${tool.id}_sys_enterprise`,
        source: tool.id,
        target: "sys_enterprise",
        label: "Data",
        animated: false,
      });
      mermaidLines.push(`    ${tool.id} -->|Data| sys_enterprise`);
    }
  }

  // -----------------------------------------------------------------------
  // Mermaid styling
  // -----------------------------------------------------------------------
  mermaidLines.push("");
  mermaidLines.push("    %% Styling");
  mermaidLines.push("    classDef userNode fill:#E3F2FD,stroke:#1565C0,stroke-width:2px");
  mermaidLines.push("    classDef gatewayNode fill:#FFF3E0,stroke:#E65100,stroke-width:2px");
  mermaidLines.push("    classDef orchestratorNode fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px");
  mermaidLines.push("    classDef agentNode fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px");
  mermaidLines.push("    classDef toolNode fill:#FFFDE7,stroke:#F9A825,stroke-width:2px");
  mermaidLines.push("    classDef systemNode fill:#ECEFF1,stroke:#37474F,stroke-width:2px");
  mermaidLines.push("");
  mermaidLines.push("    class user userNode");
  mermaidLines.push("    class gateway gatewayNode");
  mermaidLines.push("    class orchestrator orchestratorNode");

  const agentIds = agents.map((a) => a.id).join(",");
  if (agentIds) {
    mermaidLines.push(`    class ${agentIds} agentNode`);
  }

  const toolIds = toolNodes.map((t) => t.id).join(",");
  if (toolIds) {
    mermaidLines.push(`    class ${toolIds} toolNode`);
  }

  const systemIds = nodes
    .filter((n) => n.type === "system")
    .map((n) => n.id)
    .join(",");
  if (systemIds) {
    mermaidLines.push(`    class ${systemIds} systemNode`);
  }

  return {
    nodes,
    edges,
    mermaidCode: mermaidLines.join("\n"),
  };
}
