// ============================================================================
// Governance & AI Safety Diagram Engine
// Generates a left-to-right governance model diagram:
// Model Governance -> Input Guardrails -> Agent Execution ->
// Output Guardrails -> HITL Gate -> Delivery
// + Observability sidebar connected to Execution & HITL
// ============================================================================

import type { DiagramDefinition, DiagramNode, DiagramEdge, UseCase } from '../types';

// ---------------------------------------------------------------------------
// Input shape (from governanceModel JSONB column)
// ---------------------------------------------------------------------------
interface GovernanceModelInput {
  useCase: UseCase;
  hitlCheckpoint: string;
  epochFlags: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const X_INTERVAL = 250;
const MAIN_Y = 0;
const SIDEBAR_Y = 250;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeMermaidLabel(text: string): string {
  return text.replace(/[[\](){}|&"]/g, ' ').trim();
}

function epochFlagToColor(flag: string): string {
  const normalized = (flag || '').toLowerCase().trim();
  switch (normalized) {
    case 'green':
      return '#22c55e';
    case 'yellow':
      return '#eab308';
    case 'red':
      return '#ef4444';
    default:
      return '#94a3b8'; // slate for unknown
  }
}

function epochFlagToRisk(flag: string): string {
  const normalized = (flag || '').toLowerCase().trim();
  switch (normalized) {
    case 'green':
      return 'Low Risk';
    case 'yellow':
      return 'Medium Risk';
    case 'red':
      return 'High Risk';
    default:
      return 'Unassessed';
  }
}

// ---------------------------------------------------------------------------
// Node builders
// ---------------------------------------------------------------------------

function buildGovernanceNode(): DiagramNode {
  return {
    id: 'model_governance',
    type: 'governance',
    label: 'Model Governance',
    data: {
      subItems: ['Model Selection', 'Versioning', 'Bias Testing'],
    },
    position: { x: 0, y: MAIN_Y },
  };
}

function buildInputGuardrailsNode(): DiagramNode {
  return {
    id: 'input_guardrails',
    type: 'guardrail',
    label: 'Input Guardrails',
    data: {
      subItems: ['PII Detection', 'Prompt Injection Defense', 'Input Validation'],
      direction: 'input',
    },
    position: { x: X_INTERVAL, y: MAIN_Y },
  };
}

function buildExecutionNode(useCase: UseCase): DiagramNode {
  return {
    id: 'agent_execution',
    type: 'execution',
    label: 'Agent Execution',
    data: {
      subItems: ['Rate Limiting', 'Token Budget', 'Error Handling'],
      pattern: useCase.primaryPattern || useCase.agenticPattern || 'Agent',
      aiPrimitives: useCase.aiPrimitives || [],
    },
    position: { x: X_INTERVAL * 2, y: MAIN_Y },
  };
}

function buildOutputGuardrailsNode(): DiagramNode {
  return {
    id: 'output_guardrails',
    type: 'guardrail',
    label: 'Output Guardrails',
    data: {
      subItems: ['Hallucination Detection', 'Toxicity Filter', 'Compliance Check'],
      direction: 'output',
    },
    position: { x: X_INTERVAL * 3, y: MAIN_Y },
  };
}

function buildHITLNode(hitlCheckpoint: string, epochFlags: string): DiagramNode {
  const flagColor = epochFlagToColor(epochFlags);
  const riskLabel = epochFlagToRisk(epochFlags);

  return {
    id: 'hitl_gate',
    type: 'hitl',
    label: `HITL Gate\n${hitlCheckpoint || 'Human review required'}`,
    data: {
      hitlCheckpoint: hitlCheckpoint || 'Human review required',
      epochFlags,
      flagColor,
      riskLabel,
      subItems: [hitlCheckpoint || 'Human review required', `Epoch: ${riskLabel}`],
    },
    position: { x: X_INTERVAL * 4, y: MAIN_Y },
  };
}

function buildDeliveryNode(useCase: UseCase): DiagramNode {
  const outcomes = useCase.desiredOutcomes || [];
  return {
    id: 'delivery',
    type: 'delivery',
    label: 'Delivery',
    data: {
      outcomes,
      useCaseName: useCase.name || 'AI Output',
    },
    position: { x: X_INTERVAL * 5, y: MAIN_Y },
  };
}

function buildObservabilityNode(): DiagramNode {
  return {
    id: 'observability',
    type: 'observability',
    label: 'Observability',
    data: {
      subItems: ['Logging', 'Metrics', 'Alerts', 'Audit Trail'],
      sidebar: true,
    },
    position: { x: X_INTERVAL * 2, y: SIDEBAR_Y },
  };
}

// ---------------------------------------------------------------------------
// Edge builder
// ---------------------------------------------------------------------------

function buildEdges(): DiagramEdge[] {
  return [
    // Main flow: left to right
    {
      id: 'e_governance_input',
      source: 'model_governance',
      target: 'input_guardrails',
      label: 'Policy',
    },
    {
      id: 'e_input_execution',
      source: 'input_guardrails',
      target: 'agent_execution',
      label: 'Validated Input',
    },
    {
      id: 'e_execution_output',
      source: 'agent_execution',
      target: 'output_guardrails',
      label: 'Raw Output',
    },
    {
      id: 'e_output_hitl',
      source: 'output_guardrails',
      target: 'hitl_gate',
      label: 'Filtered Output',
    },
    {
      id: 'e_hitl_delivery',
      source: 'hitl_gate',
      target: 'delivery',
      label: 'Approved',
    },
    // Observability sidebar connections
    {
      id: 'e_observability_execution',
      source: 'observability',
      target: 'agent_execution',
      label: 'Monitor',
      animated: true,
    },
    {
      id: 'e_observability_hitl',
      source: 'observability',
      target: 'hitl_gate',
      label: 'Audit',
      animated: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Mermaid code generator
// ---------------------------------------------------------------------------

function generateMermaid(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  hitlCheckpoint: string,
  epochFlags: string,
): string {
  const lines: string[] = ['graph LR'];

  // Main flow nodes
  lines.push('  subgraph Governance');
  lines.push('    model_governance["Model Governance<br/>Model Selection | Versioning | Bias Testing"]');
  lines.push('  end');

  lines.push('  subgraph "Input Guards"');
  lines.push('    input_guardrails["Input Guardrails<br/>PII Detection | Prompt Injection | Validation"]');
  lines.push('  end');

  lines.push('  subgraph Execution');
  lines.push('    agent_execution["Agent Execution<br/>Rate Limiting | Token Budget | Error Handling"]');
  lines.push('  end');

  lines.push('  subgraph "Output Guards"');
  lines.push('    output_guardrails["Output Guardrails<br/>Hallucination Detection | Toxicity | Compliance"]');
  lines.push('  end');

  const safeHitl = sanitizeMermaidLabel(hitlCheckpoint || 'Human review required');
  const riskLabel = epochFlagToRisk(epochFlags);
  lines.push('  subgraph "Human Review"');
  lines.push(`    hitl_gate{"HITL Gate<br/>${safeHitl}<br/>Epoch: ${riskLabel}"}`);
  lines.push('  end');

  lines.push('  subgraph Output');
  lines.push('    delivery["Delivery"]');
  lines.push('  end');

  lines.push('  subgraph "Platform Observability"');
  lines.push('    observability["Observability<br/>Logging | Metrics | Alerts | Audit Trail"]');
  lines.push('  end');

  // Edges
  for (const e of edges) {
    const arrow = e.animated ? '-.->' : '-->';
    const label = e.label ? `|${sanitizeMermaidLabel(e.label)}|` : '';
    lines.push(`  ${e.source} ${arrow}${label} ${e.target}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateGovernanceModel(governanceModel: any): DiagramDefinition {
  const input = governanceModel as GovernanceModelInput;

  const useCase = input.useCase || ({} as UseCase);
  const hitlCheckpoint = input.hitlCheckpoint || useCase.hitlCheckpoint || '';
  const epochFlags = input.epochFlags || useCase.epochFlags || '';

  // Build nodes
  const governance = buildGovernanceNode();
  const inputGuardrails = buildInputGuardrailsNode();
  const execution = buildExecutionNode(useCase);
  const outputGuardrails = buildOutputGuardrailsNode();
  const hitlGate = buildHITLNode(hitlCheckpoint, epochFlags);
  const delivery = buildDeliveryNode(useCase);
  const observability = buildObservabilityNode();

  const nodes: DiagramNode[] = [
    governance,
    inputGuardrails,
    execution,
    outputGuardrails,
    hitlGate,
    delivery,
    observability,
  ];

  // Build edges
  const edges = buildEdges();

  // Generate mermaid
  const mermaidCode = generateMermaid(nodes, edges, hitlCheckpoint, epochFlags);

  return {
    nodes,
    edges,
    mermaidCode,
  };
}
