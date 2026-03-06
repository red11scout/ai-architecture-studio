"use client";

import { useMemo } from "react";
import { useProject } from "../../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label,
} from "recharts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THRESHOLD = 6.0;

const TIER_COLORS: Record<string, string> = {
  "Tier 1 — Champions": "#36bf78",
  "Tier 2 — Quick Wins": "#02a2fd",
  "Tier 3 — Strategic": "#f59e0b",
  "Tier 4 — Foundation": "#6b7280",
};

const QUADRANT_LABELS = [
  { label: "Strategic", x: 2.5, y: 8.5, desc: "High readiness, lower value" },
  { label: "Champions", x: 8, y: 8.5, desc: "High value, high readiness" },
  { label: "Foundation", x: 2.5, y: 1.5, desc: "Building blocks" },
  { label: "Quick Wins", x: 8, y: 1.5, desc: "High value, lower readiness" },
];

const tierBadgeClasses: Record<string, string> = {
  "Tier 1 — Champions":
    "bg-[#36bf78]/10 text-[#36bf78] border border-[#36bf78]/30",
  "Tier 2 — Quick Wins":
    "bg-[#02a2fd]/10 text-[#02a2fd] border border-[#02a2fd]/30",
  "Tier 3 — Strategic":
    "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  "Tier 4 — Foundation":
    "bg-gray-500/10 text-gray-500 border border-gray-500/30",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatrixPoint {
  name: string;
  valueScore: number;
  readinessScore: number;
  tier: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function MatrixTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MatrixPoint;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{d.name}</p>
      <div className="space-y-0.5 text-muted-foreground">
        <p>
          Value: <span className="font-medium text-foreground">{d.valueScore.toFixed(1)}</span>
        </p>
        <p>
          Readiness: <span className="font-medium text-foreground">{d.readinessScore.toFixed(1)}</span>
        </p>
        <p>
          Tier: <span className="font-medium text-foreground">{d.tier}</span>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Dot
// ---------------------------------------------------------------------------

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={8}
      fill={payload.color}
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: "pointer", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PriorityMatrixPage() {
  const { project, architectures } = useProject();

  const dataPoints = useMemo<MatrixPoint[]>(() => {
    return architectures
      .map((arch) => {
        const fi = arch.financialImpact as any;
        const priority = fi?.priority;
        if (!priority) return null;

        const tier = priority.priorityTier || "Unranked";
        return {
          name: arch.useCaseName,
          valueScore: priority.valueScore ?? 0,
          readinessScore: priority.readinessScore ?? 0,
          tier,
          color: TIER_COLORS[tier] || "#6b7280",
        };
      })
      .filter(Boolean) as MatrixPoint[];
  }, [architectures]);

  if (!project) return null;

  const hasData = dataPoints.length > 0;

  // Group by tier for legend
  const tierGroups = dataPoints.reduce(
    (acc, pt) => {
      if (!acc[pt.tier]) acc[pt.tier] = [];
      acc[pt.tier].push(pt);
      return acc;
    },
    {} as Record<string, MatrixPoint[]>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Priority Matrix</h1>
        <p className="text-muted-foreground mt-1">
          Use case prioritization by value impact and implementation readiness
        </p>
      </div>

      {/* Matrix Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Value vs. Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              No priority data available. Generate architectures to populate the
              matrix.
            </p>
          ) : (
            <div className="relative">
              {/* Quadrant background labels */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="relative w-full h-[500px]">
                  {QUADRANT_LABELS.map((q) => {
                    const leftPct = (q.x / 10) * 100;
                    const topPct = (1 - q.y / 10) * 100;
                    return (
                      <div
                        key={q.label}
                        className="absolute text-center"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <p className="text-sm font-semibold text-muted-foreground/30">
                          {q.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart
                  margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    dataKey="valueScore"
                    domain={[0, 10]}
                    tickCount={11}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  >
                    <Label
                      value="Value Score"
                      position="bottom"
                      offset={10}
                      style={{
                        fontSize: 13,
                        fill: "hsl(var(--muted-foreground))",
                        fontWeight: 600,
                      }}
                    />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="readinessScore"
                    domain={[0, 10]}
                    tickCount={11}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  >
                    <Label
                      value="Readiness Score"
                      angle={-90}
                      position="left"
                      offset={0}
                      style={{
                        fontSize: 13,
                        fill: "hsl(var(--muted-foreground))",
                        fontWeight: 600,
                        textAnchor: "middle",
                      }}
                    />
                  </YAxis>
                  <ReferenceLine
                    x={THRESHOLD}
                    stroke="#001278"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine
                    y={THRESHOLD}
                    stroke="#001278"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                  />
                  <Tooltip content={<MatrixTooltip />} />
                  <Scatter
                    data={dataPoints}
                    shape={<CustomDot />}
                  >
                    {dataPoints.map((pt, idx) => (
                      <Cell key={idx} fill={pt.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend & Details */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(TIER_COLORS).map(([tier, color]) => {
            const items = tierGroups[tier] || [];
            return (
              <Card key={tier}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <h3 className="text-sm font-semibold text-foreground">
                      {tier.replace("Tier 1 — ", "").replace("Tier 2 — ", "").replace("Tier 3 — ", "").replace("Tier 4 — ", "")}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {items.length}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No use cases in this tier
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-center justify-between"
                        >
                          <span className="truncate mr-2">{item.name}</span>
                          <span className="shrink-0 font-medium text-foreground">
                            {item.valueScore.toFixed(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
