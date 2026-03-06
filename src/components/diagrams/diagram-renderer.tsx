"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DiagramDefinition } from "@/lib/types";
import { applyDagreLayout } from "@/lib/diagrams/dagre-layout";

// Custom node types
import { ThemeNode } from "./nodes/theme-node";
import { UseCaseNode } from "./nodes/use-case-node";
import { AgentNode } from "./nodes/agent-node";
import { ToolNode } from "./nodes/tool-node";
import { GatewayNode } from "./nodes/gateway-node";
import { HITLNode } from "./nodes/hitl-node";
import { FinancialNode } from "./nodes/financial-node";
import { DefaultDiagramNode } from "./nodes/default-node";

// ---------------------------------------------------------------------------
// Node type registry — maps DiagramNode.type to custom React Flow components.
// Types not listed here fall back to DefaultDiagramNode.
// ---------------------------------------------------------------------------
const nodeTypes: NodeTypes = {
  theme: ThemeNode,
  useCase: UseCaseNode,
  agent: AgentNode,
  tool: ToolNode,
  gateway: GatewayNode,
  hitl: HITLNode,
  financial: FinancialNode,
  default: DefaultDiagramNode,
  // Aliases — map domain types to closest visual representation
  friction: DefaultDiagramNode,
  kpi: DefaultDiagramNode,
  user: DefaultDiagramNode,
  orchestrator: AgentNode,
  source: DefaultDiagramNode,
  pipeline: DefaultDiagramNode,
  storage: DefaultDiagramNode,
  ai: AgentNode,
  output: DefaultDiagramNode,
  guardrail: DefaultDiagramNode,
  governance: DefaultDiagramNode,
  execution: AgentNode,
  delivery: DefaultDiagramNode,
  observability: DefaultDiagramNode,
  worker: AgentNode,
  router: GatewayNode,
  planner: AgentNode,
  input: DefaultDiagramNode,
  synthesis: DefaultDiagramNode,
  moderator: AgentNode,
};

// ---------------------------------------------------------------------------
// MiniMap node color — brand-themed by node type
// ---------------------------------------------------------------------------
function miniMapNodeColor(node: Node): string {
  switch (node.type) {
    case "theme":
      return "#001278";
    case "useCase":
      return "#02a2fd";
    case "agent":
    case "orchestrator":
    case "ai":
    case "execution":
    case "worker":
    case "planner":
    case "moderator":
      return "#0264b8";
    case "financial":
      return "#36bf78";
    case "gateway":
    case "router":
      return "#02a2fd";
    case "hitl":
      return "#f59e0b";
    case "tool":
      return "#64748b";
    default:
      return "#94a3b8";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DiagramRendererProps {
  diagram: DiagramDefinition;
  direction?: "TB" | "LR";
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DiagramRenderer({
  diagram,
  direction = "LR",
  className,
}: DiagramRendererProps) {
  // Convert DiagramDefinition nodes to React Flow format with Dagre layout
  const { initialNodes, initialEdges } = useMemo(() => {
    // Apply dagre auto-layout
    const laidOut = applyDagreLayout(diagram.nodes, diagram.edges, {
      direction,
      nodeWidth: 180,
      nodeHeight: 80,
      rankSep: 100,
      nodeSep: 50,
    });

    // Map to React Flow Node[]
    const rfNodes: Node[] = laidOut.map((n) => ({
      id: n.id,
      type: n.type in nodeTypes ? n.type : "default",
      position: n.position,
      data: { label: n.label, ...n.data },
    }));

    // Map to React Flow Edge[]
    const rfEdges: Edge[] = diagram.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated ?? false,
      style: { stroke: "#02a2fd", strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: "#64748b" },
    }));

    return { initialNodes: rfNodes, initialEdges: rfEdges };
  }, [diagram, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when diagram prop changes (e.g. layer switch)
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onInit = useCallback(() => {
    // Could call fitView here if needed via the reactFlowInstance
  }, []);

  return (
    <div className={className ?? "w-full h-[500px] rounded-lg border border-border overflow-hidden"}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#cbd5e1"
        />
        <Controls
          showInteractive={false}
          className="!bg-background !border-border !shadow-md [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground"
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor="rgba(0, 18, 120, 0.08)"
          className="!bg-background !border-border"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
