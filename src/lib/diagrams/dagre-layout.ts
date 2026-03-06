// ============================================================================
// Dagre Auto-Layout Utility
// Takes DiagramNode[] and DiagramEdge[], applies Dagre graph layout,
// returns nodes with updated positions for React Flow rendering.
// ============================================================================

import dagre from "dagre";
import type { DiagramNode, DiagramEdge } from "../types";

interface LayoutOptions {
  direction?: "TB" | "LR"; // top-to-bottom or left-to-right
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number; // spacing between ranks (columns in LR, rows in TB)
  nodeSep?: number; // spacing between nodes in the same rank
}

const DEFAULTS: Required<LayoutOptions> = {
  direction: "LR",
  nodeWidth: 180,
  nodeHeight: 80,
  rankSep: 100,
  nodeSep: 40,
};

/**
 * Apply Dagre auto-layout to a set of diagram nodes and edges.
 * Returns a new array of DiagramNodes with computed `position` values.
 * The original nodes are not mutated.
 */
export function applyDagreLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  options?: LayoutOptions
): DiagramNode[] {
  const opts = { ...DEFAULTS, ...options };

  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // Configure the graph layout
  g.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to the dagre graph
  for (const node of nodes) {
    g.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  }

  // Add edges to the dagre graph
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  // Run the layout algorithm
  dagre.layout(g);

  // Map the computed positions back to DiagramNode objects
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);

    // Dagre returns center positions; React Flow uses top-left corner,
    // so offset by half the node dimensions.
    return {
      ...node,
      position: {
        x: dagreNode.x - opts.nodeWidth / 2,
        y: dagreNode.y - opts.nodeHeight / 2,
      },
    };
  });
}
