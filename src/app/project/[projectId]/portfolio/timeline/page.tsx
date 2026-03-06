"use client";

import { useMemo } from "react";
import { useProject } from "../../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCurrency(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.replace(/[$,]/g, "");
  if (cleaned.includes("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.includes("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned) || 0;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  if (value === 0) return "$0";
  return `$${value.toFixed(0)}`;
}

const PHASE_CONFIG: Record<
  string,
  { color: string; bgColor: string; borderColor: string; label: string; order: number }
> = {
  "Phase 1": {
    color: "#36bf78",
    bgColor: "rgba(54, 191, 120, 0.15)",
    borderColor: "rgba(54, 191, 120, 0.4)",
    label: "Phase 1 — Quick Wins",
    order: 1,
  },
  "Phase 2": {
    color: "#02a2fd",
    bgColor: "rgba(2, 162, 253, 0.15)",
    borderColor: "rgba(2, 162, 253, 0.4)",
    label: "Phase 2 — Strategic Build",
    order: 2,
  },
  "Phase 3": {
    color: "#001278",
    bgColor: "rgba(0, 18, 120, 0.15)",
    borderColor: "rgba(0, 18, 120, 0.4)",
    label: "Phase 3 — Advanced Capabilities",
    order: 3,
  },
};

interface TimelineItem {
  id: string;
  name: string;
  phase: string;
  weeks: number;
  startWeek: number;
  annualValue: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TimelinePage() {
  const { project, architectures } = useProject();

  const { phaseGroups, totalWeeks } = useMemo(() => {
    // Group architectures by phase
    const groups: Record<string, TimelineItem[]> = {};

    architectures.forEach((arch) => {
      const phase = arch.implementationPhase || "Phase 1";
      const fi = arch.financialImpact as any;
      const weeks = (arch as any).estimatedWeeks || 8;
      const annualValue = parseCurrency(fi?.benefit?.totalAnnualValue);

      if (!groups[phase]) groups[phase] = [];
      groups[phase].push({
        id: arch.id,
        name: arch.useCaseName,
        phase,
        weeks,
        startWeek: 0,
        annualValue,
      });
    });

    // Calculate start weeks based on phase ordering
    const sortedPhases = Object.keys(groups).sort((a, b) => {
      const orderA = PHASE_CONFIG[a]?.order ?? 99;
      const orderB = PHASE_CONFIG[b]?.order ?? 99;
      return orderA - orderB;
    });

    let runningWeek = 0;
    let maxWeek = 0;

    sortedPhases.forEach((phase) => {
      const items = groups[phase];
      // Items within a phase start at the same time (parallel execution)
      items.forEach((item) => {
        item.startWeek = runningWeek;
      });
      // Next phase starts after the longest item in current phase
      const longestInPhase = Math.max(...items.map((it) => it.weeks));
      runningWeek += longestInPhase;
      maxWeek = Math.max(maxWeek, runningWeek);
    });

    return {
      phaseGroups: sortedPhases.map((phase) => ({
        phase,
        config: PHASE_CONFIG[phase] || {
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.15)",
          borderColor: "rgba(107, 114, 128, 0.4)",
          label: phase,
          order: 99,
        },
        items: groups[phase],
      })),
      totalWeeks: maxWeek || 24,
    };
  }, [architectures]);

  if (!project) return null;

  const hasData = architectures.length > 0;

  // Generate week column headers (show every 4 weeks)
  const weekMarkers: number[] = [];
  for (let w = 0; w <= totalWeeks; w += 4) {
    weekMarkers.push(w);
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Implementation Timeline
        </h1>
        <p className="text-muted-foreground mt-1">
          Phased implementation plan across {totalWeeks} weeks
        </p>
      </div>

      {/* Phase Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phaseGroups.map((group) => {
          const totalValue = group.items.reduce(
            (sum, it) => sum + it.annualValue,
            0
          );
          const maxWeeksInPhase = Math.max(...group.items.map((it) => it.weeks));
          return (
            <Card key={group.phase}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.config.color }}
                  />
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.config.label}
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Use Cases</p>
                    <p className="text-lg font-bold text-foreground">
                      {group.items.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-lg font-bold text-foreground">
                      {maxWeeksInPhase}w
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Implementation Gantt</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              No use case data available. Import a project to populate the
              timeline.
            </p>
          ) : (
            <div className="overflow-x-auto">
              {/* Week markers header */}
              <div className="flex items-end mb-1 pl-[260px]">
                <div className="flex-1 relative" style={{ minWidth: `${totalWeeks * 28}px` }}>
                  {weekMarkers.map((w) => (
                    <div
                      key={w}
                      className="absolute text-xs text-muted-foreground"
                      style={{
                        left: `${(w / totalWeeks) * 100}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      W{w}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gantt rows */}
              <div className="space-y-1">
                {phaseGroups.map((group) => (
                  <div key={group.phase}>
                    {/* Phase divider */}
                    <div className="flex items-center gap-2 py-2 mt-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: group.config.color }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.config.label}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-1.5"
                      >
                        {/* Name */}
                        <div className="w-[248px] shrink-0 pr-3">
                          <p className="text-sm text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.annualValue)} &middot;{" "}
                            {item.weeks}w
                          </p>
                        </div>

                        {/* Bar */}
                        <div
                          className="flex-1 relative h-8 rounded bg-muted/30"
                          style={{ minWidth: `${totalWeeks * 28}px` }}
                        >
                          {/* Grid lines */}
                          {weekMarkers.map((w) => (
                            <div
                              key={w}
                              className="absolute top-0 bottom-0 border-l border-border/40"
                              style={{
                                left: `${(w / totalWeeks) * 100}%`,
                              }}
                            />
                          ))}

                          {/* Bar */}
                          <div
                            className="absolute top-1 bottom-1 rounded-md flex items-center px-2 text-xs font-medium transition-all"
                            style={{
                              left: `${(item.startWeek / totalWeeks) * 100}%`,
                              width: `${(item.weeks / totalWeeks) * 100}%`,
                              backgroundColor: group.config.bgColor,
                              borderLeft: `3px solid ${group.config.color}`,
                              color: group.config.color,
                            }}
                          >
                            <span className="truncate">{item.weeks}w</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
