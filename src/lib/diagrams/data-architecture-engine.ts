// ============================================================================
// Data Architecture Diagram Engine
// Generates a left-to-right data pipeline diagram:
// Source Systems -> Pipelines -> Storage -> AI Layer -> Output
// ============================================================================

import type { DiagramDefinition, DiagramNode, DiagramEdge, UseCase, WorkflowMap } from '../types';

// ---------------------------------------------------------------------------
// Input shape (from dataArchitecture JSONB column)
// ---------------------------------------------------------------------------
interface DataArchitectureInput {
  useCase: UseCase;
  workflow?: WorkflowMap;
  dataTypes: string[];
  integrations: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const Y_SPACING = 100;
const X_INTERVAL = 250;

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

// ---------------------------------------------------------------------------
// Column builders
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
        return {
          label: isStreaming ? `Stream: ${dt}` : `ETL: ${dt}`,
          pipelineType: isStreaming ? 'streaming' : 'etl',
          dataType: dt,
        };
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
  const storageMap: Array<{ id: string; label: string; storageType: string; match: (dt: string) => boolean }> = [
    {
      id: 'storage_relational',
      label: 'Relational DB',
      storageType: 'relational',
      match: (dt) => /financ|transact|record|report|account|invoice|order|customer|crm|erp|sql/i.test(dt),
    },
    {
      id: 'storage_vector',
      label: 'Vector Store',
      storageType: 'vector',
      match: (dt) => /document|text|embedding|semantic|unstructured|pdf|email|knowledge|nlp|content/i.test(dt),
    },
    {
      id: 'storage_graph',
      label: 'Knowledge Graph',
      storageType: 'knowledge_graph',
      match: (dt) => /graph|relationship|network|ontolog|linked|hierarchy|taxonomy|entity/i.test(dt),
    },
  ];

  // Determine which storage types are needed based on data types
  let selected = storageMap.filter((s) => dataTypes.some((dt) => s.match(dt)));

  // Always include at least relational as a baseline
  if (selected.length === 0) {
    selected = [storageMap[0]];
  }

  // If there are many data types, include vector store for search capability
  if (dataTypes.length >= 3 && !selected.find((s) => s.storageType === 'vector')) {
    selected.push(storageMap[1]);
  }

  return selected.map((s, i) => ({
    id: s.id,
    type: 'storage',
    label: s.label,
    data: { storageType: s.storageType },
    position: { x: X_INTERVAL * 2, y: columnY(i, selected.length) },
  }));
}

function buildAILayerNode(useCase: UseCase): DiagramNode {
  const pattern = useCase.primaryPattern || useCase.agenticPattern || 'AI Processing';
  return {
    id: 'ai_layer',
    type: 'ai',
    label: `AI Layer\n(${pattern})`,
    data: {
      pattern,
      agenticPattern: useCase.agenticPattern,
      aiPrimitives: useCase.aiPrimitives,
    },
    position: { x: X_INTERVAL * 3, y: 0 },
  };
}

function buildOutputNodes(useCase: UseCase): DiagramNode[] {
  const outcomeKeywords = {
    dashboard: /dashboard|report|visual|analytics|monitor|kpi|metric/i,
    api: /api|integrat|automat|trigger|webhook|service|endpoint/i,
    notification: /alert|notif|email|slack|message|recommend|flag|warn/i,
  };

  const outputs: Array<{ id: string; label: string; outputType: string }> = [];
  const outcomes = useCase.desiredOutcomes || [];
  const description = useCase.description || '';
  const combined = [...outcomes, description].join(' ');

  if (outcomeKeywords.dashboard.test(combined)) {
    outputs.push({ id: 'output_dashboard', label: 'Dashboard', outputType: 'dashboard' });
  }
  if (outcomeKeywords.api.test(combined)) {
    outputs.push({ id: 'output_api', label: 'API', outputType: 'api' });
  }
  if (outcomeKeywords.notification.test(combined)) {
    outputs.push({ id: 'output_notification', label: 'Notifications', outputType: 'notification' });
  }

  // Ensure at least one output
  if (outputs.length === 0) {
    outputs.push({ id: 'output_dashboard', label: 'Dashboard', outputType: 'dashboard' });
  }

  return outputs.map((o, i) => ({
    id: o.id,
    type: 'output',
    label: o.label,
    data: { outputType: o.outputType },
    position: { x: X_INTERVAL * 4, y: columnY(i, outputs.length) },
  }));
}

// ---------------------------------------------------------------------------
// Edge builder
// ---------------------------------------------------------------------------

function buildEdges(
  sources: DiagramNode[],
  pipelines: DiagramNode[],
  storages: DiagramNode[],
  aiLayer: DiagramNode,
  outputs: DiagramNode[],
): DiagramEdge[] {
  const edges: DiagramEdge[] = [];

  // Sources -> Pipelines (fan-out: each source connects to all pipelines)
  for (const src of sources) {
    for (const pipe of pipelines) {
      edges.push({
        id: `e_${src.id}_${pipe.id}`,
        source: src.id,
        target: pipe.id,
        animated: pipe.data.pipelineType === 'streaming',
      });
    }
  }

  // Pipelines -> Storage (each pipeline connects to all storage nodes)
  for (const pipe of pipelines) {
    for (const store of storages) {
      edges.push({
        id: `e_${pipe.id}_${store.id}`,
        source: pipe.id,
        target: store.id,
      });
    }
  }

  // Storage -> AI Layer
  for (const store of storages) {
    edges.push({
      id: `e_${store.id}_${aiLayer.id}`,
      source: store.id,
      target: aiLayer.id,
    });
  }

  // AI Layer -> Outputs
  for (const out of outputs) {
    edges.push({
      id: `e_${aiLayer.id}_${out.id}`,
      source: aiLayer.id,
      target: out.id,
    });
  }

  return edges;
}

// ---------------------------------------------------------------------------
// Mermaid code generator
// ---------------------------------------------------------------------------

function generateMermaid(
  sources: DiagramNode[],
  pipelines: DiagramNode[],
  storages: DiagramNode[],
  aiLayer: DiagramNode,
  outputs: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const lines: string[] = ['graph LR'];

  // Subgraphs for visual grouping
  lines.push('  subgraph Sources');
  for (const s of sources) {
    lines.push(`    ${s.id}["${sanitizeMermaidLabel(s.label)}"]`);
  }
  lines.push('  end');

  lines.push('  subgraph Pipelines');
  for (const p of pipelines) {
    lines.push(`    ${p.id}["${sanitizeMermaidLabel(p.label)}"]`);
  }
  lines.push('  end');

  lines.push('  subgraph Storage');
  for (const s of storages) {
    lines.push(`    ${s.id}[("${sanitizeMermaidLabel(s.label)}")]`);
  }
  lines.push('  end');

  lines.push('  subgraph AI');
  lines.push(`    ${aiLayer.id}{"${sanitizeMermaidLabel(aiLayer.label)}"}`);
  lines.push('  end');

  lines.push('  subgraph Outputs');
  for (const o of outputs) {
    lines.push(`    ${o.id}["${sanitizeMermaidLabel(o.label)}"]`);
  }
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

export function generateDataArchitecture(dataArchitecture: any): DiagramDefinition {
  const input = dataArchitecture as DataArchitectureInput;

  const useCase = input.useCase || ({} as UseCase);
  const dataTypes = input.dataTypes || useCase.dataTypes || [];
  const integrations = input.integrations || useCase.integrations || [];

  // Build each column
  const sources = buildSourceNodes(integrations);
  const pipelines = buildPipelineNodes(dataTypes);
  const storages = buildStorageNodes(dataTypes);
  const aiLayer = buildAILayerNode(useCase);
  const outputs = buildOutputNodes(useCase);

  // Connect columns
  const edges = buildEdges(sources, pipelines, storages, aiLayer, outputs);

  // Generate mermaid
  const mermaidCode = generateMermaid(sources, pipelines, storages, aiLayer, outputs, edges);

  return {
    nodes: [...sources, ...pipelines, ...storages, aiLayer, ...outputs],
    edges,
    mermaidCode,
  };
}
