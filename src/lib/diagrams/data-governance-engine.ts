// ============================================================================
// Data & Governance Combined Diagram Engine
// Merges the data architecture pipeline with governance guardrails:
// Sources → Pipelines → Storage → [Input Guardrails] → AI Layer →
// [Output Guardrails] → HITL Gate → Outputs
// + Observability sidebar
// ============================================================================

import type { DiagramDefinition, DiagramNode, DiagramEdge, UseCase, WorkflowMap } from '../types';

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------
interface DataGovernanceInput {
  dataArchitecture: {
    useCase: UseCase;
    workflow?: WorkflowMap;
    dataTypes: string[];
    integrations: string[];
  };
  governanceModel: {
    useCase: UseCase;
    hitlCheckpoint: string;
    epochFlags: string;
  };
}

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const Y_SPACING = 100;
const X_INTERVAL = 220;

function columnY(index: number, total: number): number {
  const startY = total > 1 ? -((total - 1) * Y_SPACING) / 2 : 0;
  return startY + index * Y_SPACING;
}

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function sanitizeMermaidLabel(text: string): string {
  return text.replace(/[[\](){}|&"]/g, ' ').trim();
}

function epochFlagToColor(flag: string): string {
  const n = (flag || '').toLowerCase().trim();
  if (n === 'green') return '#22c55e';
  if (n === 'yellow') return '#eab308';
  if (n === 'red') return '#ef4444';
  return '#94a3b8';
}

function epochFlagToRisk(flag: string): string {
  const n = (flag || '').toLowerCase().trim();
  if (n === 'green') return 'Low Risk';
  if (n === 'yellow') return 'Medium Risk';
  if (n === 'red') return 'High Risk';
  return 'Unassessed';
}

// ---------------------------------------------------------------------------
// Data Pipeline Nodes (left side)
// ---------------------------------------------------------------------------

function buildSourceNodes(integrations: string[]): DiagramNode[] {
  const sources = integrations.length > 0 ? integrations : ['Manual Input'];
  return sources.map((name, i) => ({
    id: `source_${sanitizeId(name)}`,
    type: 'source',
    label: name,
    data: { integration: name },
    position: { x: 0, y: columnY(i, sources.length) },
  }));
}

function buildPipelineNodes(dataTypes: string[]): DiagramNode[] {
  const streamingKeywords = ['real-time', 'streaming', 'live', 'event', 'iot', 'sensor', 'telemetry'];
  const pipelines = dataTypes.length > 0
    ? dataTypes.map((dt) => {
        const isStreaming = streamingKeywords.some((kw) => dt.toLowerCase().includes(kw));
        return { label: isStreaming ? `Stream: ${dt}` : `ETL: ${dt}`, pipelineType: isStreaming ? 'streaming' : 'etl', dataType: dt };
      })
    : [{ label: 'ETL Pipeline', pipelineType: 'etl', dataType: 'general' }];

  return pipelines.map((p, i) => ({
    id: `pipeline_${sanitizeId(p.dataType)}`,
    type: 'pipeline',
    label: p.label,
    data: { pipelineType: p.pipelineType, dataType: p.dataType },
    position: { x: X_INTERVAL, y: columnY(i, pipelines.length) },
  }));
}

function buildStorageNodes(dataTypes: string[]): DiagramNode[] {
  const storageMap = [
    { id: 'storage_relational', label: 'Relational DB', storageType: 'relational', match: (dt: string) => /financ|transact|record|report|account|invoice|order|customer|crm|erp|sql/i.test(dt) },
    { id: 'storage_vector', label: 'Vector Store', storageType: 'vector', match: (dt: string) => /document|text|embedding|semantic|unstructured|pdf|email|knowledge|nlp|content/i.test(dt) },
    { id: 'storage_graph', label: 'Knowledge Graph', storageType: 'knowledge_graph', match: (dt: string) => /graph|relationship|network|ontolog|linked|hierarchy|taxonomy|entity/i.test(dt) },
  ];

  let selected = storageMap.filter((s) => dataTypes.some((dt) => s.match(dt)));
  if (selected.length === 0) selected = [storageMap[0]];
  if (dataTypes.length >= 3 && !selected.find((s) => s.storageType === 'vector')) selected.push(storageMap[1]);

  return selected.map((s, i) => ({
    id: s.id,
    type: 'storage',
    label: s.label,
    data: { storageType: s.storageType },
    position: { x: X_INTERVAL * 2, y: columnY(i, selected.length) },
  }));
}

// ---------------------------------------------------------------------------
// Governance Nodes (middle and right side)
// ---------------------------------------------------------------------------

function buildInputGuardrailsNode(): DiagramNode {
  return {
    id: 'input_guardrails',
    type: 'guardrail',
    label: 'Input Guardrails',
    data: { subItems: ['PII Detection', 'Prompt Injection Defense', 'Input Validation'], direction: 'input' },
    position: { x: X_INTERVAL * 3, y: 0 },
  };
}

function buildAILayerNode(useCase: UseCase): DiagramNode {
  const pattern = useCase.primaryPattern || useCase.agenticPattern || 'AI Processing';
  return {
    id: 'ai_layer',
    type: 'ai',
    label: `AI Layer\n(${pattern})`,
    data: { pattern, agenticPattern: useCase.agenticPattern, aiPrimitives: useCase.aiPrimitives },
    position: { x: X_INTERVAL * 4, y: 0 },
  };
}

function buildOutputGuardrailsNode(): DiagramNode {
  return {
    id: 'output_guardrails',
    type: 'guardrail',
    label: 'Output Guardrails',
    data: { subItems: ['Hallucination Detection', 'Toxicity Filter', 'Compliance Check'], direction: 'output' },
    position: { x: X_INTERVAL * 5, y: 0 },
  };
}

function buildHITLNode(hitlCheckpoint: string, epochFlags: string): DiagramNode {
  const flagColor = epochFlagToColor(epochFlags);
  const riskLabel = epochFlagToRisk(epochFlags);
  return {
    id: 'hitl_gate',
    type: 'hitl',
    label: `HITL Gate\n${hitlCheckpoint || 'Human review required'}`,
    data: { hitlCheckpoint: hitlCheckpoint || 'Human review required', epochFlags, flagColor, riskLabel, subItems: [hitlCheckpoint || 'Human review required', `Epoch: ${riskLabel}`] },
    position: { x: X_INTERVAL * 6, y: 0 },
  };
}

function buildOutputNodes(useCase: UseCase): DiagramNode[] {
  const outcomeKeywords = {
    dashboard: /dashboard|report|visual|analytics|monitor|kpi|metric/i,
    api: /api|integrat|automat|trigger|webhook|service|endpoint/i,
    notification: /alert|notif|email|slack|message|recommend|flag|warn/i,
  };

  const outputs: Array<{ id: string; label: string; outputType: string }> = [];
  const combined = [...(useCase.desiredOutcomes || []), useCase.description || ''].join(' ');

  if (outcomeKeywords.dashboard.test(combined)) outputs.push({ id: 'output_dashboard', label: 'Dashboard', outputType: 'dashboard' });
  if (outcomeKeywords.api.test(combined)) outputs.push({ id: 'output_api', label: 'API', outputType: 'api' });
  if (outcomeKeywords.notification.test(combined)) outputs.push({ id: 'output_notification', label: 'Notifications', outputType: 'notification' });
  if (outputs.length === 0) outputs.push({ id: 'output_dashboard', label: 'Dashboard', outputType: 'dashboard' });

  return outputs.map((o, i) => ({
    id: o.id,
    type: 'output',
    label: o.label,
    data: { outputType: o.outputType },
    position: { x: X_INTERVAL * 7, y: columnY(i, outputs.length) },
  }));
}

function buildObservabilityNode(): DiagramNode {
  return {
    id: 'observability',
    type: 'observability',
    label: 'Observability',
    data: { subItems: ['Logging', 'Metrics', 'Alerts', 'Audit Trail'], sidebar: true },
    position: { x: X_INTERVAL * 4, y: 250 },
  };
}

// ---------------------------------------------------------------------------
// Edge builder
// ---------------------------------------------------------------------------

function buildEdges(
  sources: DiagramNode[],
  pipelines: DiagramNode[],
  storages: DiagramNode[],
  outputs: DiagramNode[],
): DiagramEdge[] {
  const edges: DiagramEdge[] = [];

  // Sources → Pipelines
  for (const src of sources) {
    for (const pipe of pipelines) {
      edges.push({ id: `e_${src.id}_${pipe.id}`, source: src.id, target: pipe.id, animated: pipe.data.pipelineType === 'streaming' });
    }
  }
  // Pipelines → Storage
  for (const pipe of pipelines) {
    for (const store of storages) {
      edges.push({ id: `e_${pipe.id}_${store.id}`, source: pipe.id, target: store.id });
    }
  }
  // Storage → Input Guardrails
  for (const store of storages) {
    edges.push({ id: `e_${store.id}_input_guardrails`, source: store.id, target: 'input_guardrails' });
  }
  // Input Guardrails → AI Layer
  edges.push({ id: 'e_input_ai', source: 'input_guardrails', target: 'ai_layer', label: 'Validated' });
  // AI Layer → Output Guardrails
  edges.push({ id: 'e_ai_output', source: 'ai_layer', target: 'output_guardrails', label: 'Raw Output' });
  // Output Guardrails → HITL Gate
  edges.push({ id: 'e_output_hitl', source: 'output_guardrails', target: 'hitl_gate', label: 'Filtered' });
  // HITL Gate → Outputs
  for (const out of outputs) {
    edges.push({ id: `e_hitl_${out.id}`, source: 'hitl_gate', target: out.id, label: 'Approved' });
  }
  // Observability sidebar
  edges.push({ id: 'e_obs_ai', source: 'observability', target: 'ai_layer', label: 'Monitor', animated: true });
  edges.push({ id: 'e_obs_hitl', source: 'observability', target: 'hitl_gate', label: 'Audit', animated: true });

  return edges;
}

// ---------------------------------------------------------------------------
// Mermaid code generator
// ---------------------------------------------------------------------------

function generateMermaid(
  sources: DiagramNode[],
  pipelines: DiagramNode[],
  storages: DiagramNode[],
  outputs: DiagramNode[],
  edges: DiagramEdge[],
  hitlCheckpoint: string,
  epochFlags: string,
): string {
  const lines: string[] = ['graph LR'];

  lines.push('  subgraph "Data Sources"');
  for (const s of sources) lines.push(`    ${s.id}["${sanitizeMermaidLabel(s.label)}"]`);
  lines.push('  end');

  lines.push('  subgraph Pipelines');
  for (const p of pipelines) lines.push(`    ${p.id}["${sanitizeMermaidLabel(p.label)}"]`);
  lines.push('  end');

  lines.push('  subgraph Storage');
  for (const s of storages) lines.push(`    ${s.id}[("${sanitizeMermaidLabel(s.label)}")]`);
  lines.push('  end');

  lines.push('  subgraph "Governance Layer"');
  lines.push('    input_guardrails["Input Guardrails"]');
  lines.push('    ai_layer{"AI Layer"}');
  lines.push('    output_guardrails["Output Guardrails"]');
  const safeHitl = sanitizeMermaidLabel(hitlCheckpoint || 'Human review');
  lines.push(`    hitl_gate{"HITL Gate - ${safeHitl} - ${epochFlagToRisk(epochFlags)}"}`);
  lines.push('  end');

  lines.push('  subgraph Outputs');
  for (const o of outputs) lines.push(`    ${o.id}["${sanitizeMermaidLabel(o.label)}"]`);
  lines.push('  end');

  lines.push('  subgraph Observability');
  lines.push('    observability["Observability - Logging | Metrics | Audit"]');
  lines.push('  end');

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

export function generateDataGovernance(
  dataArchitecture: any,
  governanceModel: any,
): DiagramDefinition {
  const da = (dataArchitecture || {}) as DataGovernanceInput['dataArchitecture'];
  const gm = (governanceModel || {}) as DataGovernanceInput['governanceModel'];

  const useCase = da.useCase || gm.useCase || ({} as UseCase);
  const dataTypes = da.dataTypes || useCase.dataTypes || [];
  const integrations = da.integrations || useCase.integrations || [];
  const hitlCheckpoint = gm.hitlCheckpoint || useCase.hitlCheckpoint || '';
  const epochFlags = gm.epochFlags || useCase.epochFlags || '';

  // Build data pipeline nodes
  const sources = buildSourceNodes(integrations);
  const pipelines = buildPipelineNodes(dataTypes);
  const storages = buildStorageNodes(dataTypes);

  // Build governance + AI nodes
  const inputGuardrails = buildInputGuardrailsNode();
  const aiLayer = buildAILayerNode(useCase);
  const outputGuardrails = buildOutputGuardrailsNode();
  const hitlGate = buildHITLNode(hitlCheckpoint, epochFlags);
  const outputs = buildOutputNodes(useCase);
  const observability = buildObservabilityNode();

  const nodes: DiagramNode[] = [
    ...sources, ...pipelines, ...storages,
    inputGuardrails, aiLayer, outputGuardrails, hitlGate,
    ...outputs, observability,
  ];

  const edges = buildEdges(sources, pipelines, storages, outputs);
  const mermaidCode = generateMermaid(sources, pipelines, storages, outputs, edges, hitlCheckpoint, epochFlags);

  return { nodes, edges, mermaidCode };
}
