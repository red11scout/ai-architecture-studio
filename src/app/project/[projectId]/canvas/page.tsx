"use client";

import { useMemo } from "react";
import {
  Target,
  AlertTriangle,
  Brain,
  Users,
  Database,
  Plug,
  Cpu,
  ShieldCheck,
  DollarSign,
  Grid3X3,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProject } from "../layout";
import type { CanvasData } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Canvas cell configuration — each of the 9 sections
// ---------------------------------------------------------------------------
interface CellConfig {
  key: keyof CanvasData;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;        // border / header bg
  colorLight: string;   // subtle bg tint
  iconColor: string;    // icon foreground
}

const CELLS: CellConfig[] = [
  {
    key: "businessObjective",
    label: "Business Objective",
    icon: Target,
    color: "#001278",
    colorLight: "rgba(0,18,120,0.06)",
    iconColor: "#001278",
  },
  {
    key: "frictionPoints",
    label: "Friction Points",
    icon: AlertTriangle,
    color: "#D97706",
    colorLight: "rgba(217,119,6,0.06)",
    iconColor: "#D97706",
  },
  {
    key: "aiUseCases",
    label: "AI Use Cases",
    icon: Brain,
    color: "#02a2fd",
    colorLight: "rgba(2,162,253,0.06)",
    iconColor: "#02a2fd",
  },
  {
    key: "usersRoles",
    label: "Users & Roles",
    icon: Users,
    color: "#7C3AED",
    colorLight: "rgba(124,58,237,0.06)",
    iconColor: "#7C3AED",
  },
  {
    key: "dataSources",
    label: "Data Sources",
    icon: Database,
    color: "#36bf78",
    colorLight: "rgba(54,191,120,0.06)",
    iconColor: "#36bf78",
  },
  {
    key: "systemsApis",
    label: "Systems & APIs",
    icon: Plug,
    color: "#0284C7",
    colorLight: "rgba(2,132,199,0.06)",
    iconColor: "#0284C7",
  },
  {
    key: "aiArchitecture",
    label: "AI Architecture",
    icon: Cpu,
    color: "#001278",
    colorLight: "rgba(0,18,120,0.06)",
    iconColor: "#001278",
  },
  {
    key: "governanceHitl",
    label: "Governance & HITL",
    icon: ShieldCheck,
    color: "#D97706",
    colorLight: "rgba(217,119,6,0.06)",
    iconColor: "#D97706",
  },
  {
    key: "financialImpact",
    label: "Financial Impact",
    icon: DollarSign,
    color: "#36bf78",
    colorLight: "rgba(54,191,120,0.06)",
    iconColor: "#36bf78",
  },
];

// ---------------------------------------------------------------------------
// Aggregation — collect canvasData across all architectures
// ---------------------------------------------------------------------------
interface AggregatedCell {
  key: keyof CanvasData;
  entries: { useCaseName: string; content: string }[];
}

function aggregateCanvasData(
  architectures: any[]
): Record<keyof CanvasData, AggregatedCell> {
  const result = {} as Record<keyof CanvasData, AggregatedCell>;

  for (const cell of CELLS) {
    result[cell.key] = { key: cell.key, entries: [] };
  }

  for (const arch of architectures) {
    const canvas = arch.canvasData as CanvasData | null | undefined;
    if (!canvas) continue;

    for (const cell of CELLS) {
      const value = canvas[cell.key];
      if (value && typeof value === "string" && value.trim()) {
        result[cell.key].entries.push({
          useCaseName: arch.useCaseName ?? "Untitled",
          content: value.trim(),
        });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Canvas Cell component
// ---------------------------------------------------------------------------
function CanvasCell({
  config,
  entries,
  totalUseCases,
}: {
  config: CellConfig;
  entries: { useCaseName: string; content: string }[];
  totalUseCases: number;
}) {
  const Icon = config.icon;
  const hasContent = entries.length > 0;

  return (
    <Card
      className="overflow-hidden transition-all duration-200 hover:shadow-lg group relative"
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ backgroundColor: config.colorLight }}
      >
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {config.label}
        </h3>
        {hasContent && (
          <span
            className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: config.colorLight,
              color: config.color,
              border: `1px solid ${config.color}20`,
            }}
          >
            {entries.length} {entries.length === 1 ? "source" : "sources"}
          </span>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3 min-h-[140px]">
        {hasContent ? (
          entries.map((entry, idx) => (
            <div key={idx} className="space-y-1">
              {/* Show use case label when multiple architectures contribute */}
              {totalUseCases > 1 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: config.color }}
                  >
                    {entry.useCaseName}
                  </span>
                </div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {entry.content}
              </p>
              {idx < entries.length - 1 && (
                <div className="border-b border-border/50 pt-1" />
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
            <Icon className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/60 italic">
              No data generated yet.
              <br />
              Generate architecture for a use case to populate.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Canvas page
// ---------------------------------------------------------------------------
export default function CanvasPage() {
  const { project, architectures, loading } = useProject();

  const aggregated = useMemo(
    () => aggregateCanvasData(architectures),
    [architectures]
  );

  const populatedCells = CELLS.filter(
    (c) => aggregated[c.key].entries.length > 0
  ).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-[#001278] flex items-center justify-center">
            <Grid3X3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              AI Solution Architecture Canvas
            </h1>
            <p className="text-sm text-muted-foreground">
              {project?.companyName} &mdash; combined view across{" "}
              {architectures.length}{" "}
              {architectures.length === 1 ? "use case" : "use cases"}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(populatedCells / 9) * 100}%`,
                background: "linear-gradient(90deg, #001278, #02a2fd, #36bf78)",
              }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {populatedCells}/9 sections populated
          </span>
        </div>
      </div>

      {/* 3x3 Canvas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CELLS.map((cellConfig) => (
          <CanvasCell
            key={cellConfig.key}
            config={cellConfig}
            entries={aggregated[cellConfig.key].entries}
            totalUseCases={architectures.length}
          />
        ))}
      </div>

      {/* Footer watermark */}
      <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/40">
        <Layers className="h-4 w-4" />
        <span className="text-xs font-medium tracking-wide">
          AI Solution Architecture Canvas &mdash; Powered by BlueAlly
        </span>
      </div>
    </div>
  );
}
