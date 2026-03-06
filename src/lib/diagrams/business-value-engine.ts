// ============================================================================
// Business Value Map — Diagram Engine
// Generates a left-to-right DAG:
//   Strategic Theme → Friction Points → Use Case → KPIs → Financial Value
// ============================================================================

import type {
  DiagramDefinition,
  DiagramNode,
  DiagramEdge,
  UseCase,
  StrategicTheme,
  FrictionPoint,
  BenefitQuantification,
  PriorityScore,
  BusinessFunction,
} from "../types";

// ---------------------------------------------------------------------------
// Input shape (matches the businessValueMap JSONB column)
// ---------------------------------------------------------------------------
interface BusinessValueMapData {
  useCase: UseCase;
  theme?: StrategicTheme;
  friction?: FrictionPoint;
  benefit?: BenefitQuantification;
  priority?: PriorityScore;
  businessFunctions: BusinessFunction[];
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const COL = {
  THEME: 0,
  FRICTION: 300,
  USE_CASE: 600,
  KPI: 900,
  FINANCIAL: 1200,
} as const;

const ROW_HEIGHT = 100;
const BASE_Y = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitize a label for Mermaid — escape quotes and wrap in quotes */
function mermaidLabel(text: string): string {
  return `"${text.replace(/"/g, "#quot;")}"`;
}

/** Format a currency string for display (e.g. "$1,234,567" or raw number) */
function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null) return "$0";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

/** Determine a severity color class for friction nodes */
function severityColor(severity: string | undefined): string {
  if (!severity) return "#dc2626"; // red-600 default
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") return "#991b1b"; // red-800
  if (s === "medium") return "#dc2626"; // red-600
  return "#f87171"; // red-400 for low
}

/** Compute the vertical center for a set of items to balance the layout */
function centeredY(index: number, total: number): number {
  const totalHeight = (total - 1) * ROW_HEIGHT;
  const startY = BASE_Y + (Math.max(total, 1) - 1) * (ROW_HEIGHT / 2) - totalHeight / 2;
  return startY + index * ROW_HEIGHT;
}

// ---------------------------------------------------------------------------
// Main engine
// ---------------------------------------------------------------------------
export function generateBusinessValueMap(
  businessValueMap: any
): DiagramDefinition {
  const data = businessValueMap as BusinessValueMapData;
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const mermaidLines: string[] = ["graph LR"];

  // Track IDs for edge connections
  const kpiNodeIds: string[] = [];
  const frictionNodeIds: string[] = [];

  // -------------------------------------------------------------------------
  // Column 1: Strategic Theme
  // -------------------------------------------------------------------------
  const themeId = data.theme?.id ?? "theme-default";
  const themeName = data.theme?.name ?? data.useCase.strategicTheme ?? "Strategic Theme";

  const kpiCount = data.businessFunctions?.length || 1;
  const themeY = centeredY(0, 1);

  nodes.push({
    id: themeId,
    type: "theme",
    label: themeName,
    data: {
      color: "#001278", // navy
      targetState: data.theme?.targetState,
      currentState: data.theme?.currentState,
      primaryDriverImpact: data.theme?.primaryDriverImpact,
    },
    position: { x: COL.THEME, y: centeredY(0, Math.max(kpiCount, 1)) },
  });

  mermaidLines.push(`  ${themeId}[${mermaidLabel(themeName)}]`);

  // -------------------------------------------------------------------------
  // Column 2: Friction Point(s)
  // -------------------------------------------------------------------------
  if (data.friction) {
    const frictionId = data.friction.id;
    const frictionLabel = data.friction.frictionPoint;
    const costLabel = data.friction.estimatedAnnualCost
      ? ` (${formatCurrency(data.friction.estimatedAnnualCost)}/yr)`
      : "";

    frictionNodeIds.push(frictionId);

    nodes.push({
      id: frictionId,
      type: "friction",
      label: frictionLabel,
      data: {
        color: severityColor(data.friction.severity),
        severity: data.friction.severity,
        role: data.friction.role,
        estimatedAnnualCost: data.friction.estimatedAnnualCost,
        frictionType: data.friction.frictionType,
      },
      position: { x: COL.FRICTION, y: centeredY(0, Math.max(kpiCount, 1)) },
    });

    mermaidLines.push(`  ${frictionId}[${mermaidLabel(frictionLabel + costLabel)}]`);

    // Edge: theme → friction
    edges.push({
      id: `${themeId}-${frictionId}`,
      source: themeId,
      target: frictionId,
      label: "drives",
    });
    mermaidLines.push(`  ${themeId} -->|drives| ${frictionId}`);
  } else {
    // No friction data — connect theme directly to use case
    frictionNodeIds.push(themeId); // use theme as source for use case edge
  }

  // -------------------------------------------------------------------------
  // Column 3: Use Case
  // -------------------------------------------------------------------------
  const useCaseId = data.useCase.id;
  const useCaseName = data.useCase.name;

  nodes.push({
    id: useCaseId,
    type: "useCase",
    label: useCaseName,
    data: {
      color: "#02a2fd", // blue
      description: data.useCase.description,
      agenticPattern: data.useCase.agenticPattern,
      primaryPattern: data.useCase.primaryPattern,
      function: data.useCase.function,
      subFunction: data.useCase.subFunction,
      priorityTier: data.priority?.priorityTier,
      priorityScore: data.priority?.priorityScore,
      recommendedPhase: data.priority?.recommendedPhase,
    },
    position: { x: COL.USE_CASE, y: centeredY(0, Math.max(kpiCount, 1)) },
  });

  mermaidLines.push(`  ${useCaseId}[${mermaidLabel(useCaseName)}]`);

  // Edges: friction(s) → useCase
  for (const srcId of frictionNodeIds) {
    if (srcId !== themeId) {
      edges.push({
        id: `${srcId}-${useCaseId}`,
        source: srcId,
        target: useCaseId,
        label: "addresses",
      });
      mermaidLines.push(`  ${srcId} -->|addresses| ${useCaseId}`);
    } else {
      // Direct theme → useCase when no friction
      edges.push({
        id: `${themeId}-${useCaseId}`,
        source: themeId,
        target: useCaseId,
        label: "enables",
      });
      mermaidLines.push(`  ${themeId} -->|enables| ${useCaseId}`);
    }
  }

  // -------------------------------------------------------------------------
  // Column 4: KPI nodes (one per business function)
  // -------------------------------------------------------------------------
  const financialId = `financial-${useCaseId}`;

  if (data.businessFunctions && data.businessFunctions.length > 0) {
    data.businessFunctions.forEach((bf, index) => {
      const kpiId = bf.id ?? `kpi-${index}`;
      const directionArrow =
        bf.direction?.toLowerCase() === "increase" ? "\u2191" : "\u2193";
      const kpiLabel = `${bf.kpiName} ${directionArrow}`;

      kpiNodeIds.push(kpiId);

      nodes.push({
        id: kpiId,
        type: "kpi",
        label: kpiLabel,
        data: {
          color: "#6366f1", // indigo
          kpiName: bf.kpiName,
          function: bf.function,
          subFunction: bf.subFunction,
          direction: bf.direction,
          targetValue: bf.targetValue,
          baselineValue: bf.baselineValue,
          timeframe: bf.timeframe,
          benchmarkAvg: bf.benchmarkAvg,
        },
        position: {
          x: COL.KPI,
          y: centeredY(index, data.businessFunctions.length),
        },
      });

      mermaidLines.push(`  ${kpiId}[${mermaidLabel(kpiLabel)}]`);

      // Edge: useCase → kpi
      edges.push({
        id: `${useCaseId}-${kpiId}`,
        source: useCaseId,
        target: kpiId,
        label: bf.direction ?? "impacts",
      });
      mermaidLines.push(
        `  ${useCaseId} -->|${bf.direction ?? "impacts"}| ${kpiId}`
      );

      // Edge: kpi → financial
      edges.push({
        id: `${kpiId}-${financialId}`,
        source: kpiId,
        target: financialId,
        animated: true,
      });
      mermaidLines.push(`  ${kpiId} --> ${financialId}`);
    });
  } else {
    // No KPIs — connect use case directly to financial
    edges.push({
      id: `${useCaseId}-${financialId}`,
      source: useCaseId,
      target: financialId,
      label: "delivers",
    });
    mermaidLines.push(`  ${useCaseId} -->|delivers| ${financialId}`);
  }

  // -------------------------------------------------------------------------
  // Column 5: Financial Value
  // -------------------------------------------------------------------------
  const totalValue = formatCurrency(data.benefit?.totalAnnualValue);
  const probability = data.benefit?.probabilityOfSuccess
    ? `${Math.round(data.benefit.probabilityOfSuccess * 100)}%`
    : undefined;
  const financialLabel = `Total: ${totalValue}/yr`;

  nodes.push({
    id: financialId,
    type: "financial",
    label: financialLabel,
    data: {
      color: "#36bf78", // green
      totalAnnualValue: data.benefit?.totalAnnualValue,
      costBenefit: data.benefit?.costBenefit,
      revenueBenefit: data.benefit?.revenueBenefit,
      riskBenefit: data.benefit?.riskBenefit,
      cashFlowBenefit: data.benefit?.cashFlowBenefit,
      probabilityOfSuccess: data.benefit?.probabilityOfSuccess,
      expectedValue: data.benefit?.expectedValue,
      formattedTotal: totalValue,
      formattedProbability: probability,
    },
    position: {
      x: COL.FINANCIAL,
      y: centeredY(0, Math.max(kpiCount, 1)),
    },
  });

  mermaidLines.push(`  ${financialId}[${mermaidLabel(financialLabel)}]`);

  // -------------------------------------------------------------------------
  // Mermaid styling
  // -------------------------------------------------------------------------
  mermaidLines.push("");
  mermaidLines.push("  %% Styling");
  mermaidLines.push(`  style ${themeId} fill:#001278,color:#fff,stroke:#001278`);

  if (data.friction) {
    const fColor = severityColor(data.friction.severity);
    mermaidLines.push(
      `  style ${data.friction.id} fill:${fColor},color:#fff,stroke:${fColor}`
    );
  }

  mermaidLines.push(
    `  style ${useCaseId} fill:#02a2fd,color:#fff,stroke:#02a2fd`
  );

  for (const kpiId of kpiNodeIds) {
    mermaidLines.push(`  style ${kpiId} fill:#6366f1,color:#fff,stroke:#6366f1`);
  }

  mermaidLines.push(
    `  style ${financialId} fill:#36bf78,color:#fff,stroke:#36bf78`
  );

  return {
    nodes,
    edges,
    mermaidCode: mermaidLines.join("\n"),
  };
}
