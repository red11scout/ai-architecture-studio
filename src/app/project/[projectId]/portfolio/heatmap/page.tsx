"use client";

import { useMemo } from "react";
import { useProject } from "../../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute opacity 0.15..1.0 based on how many use cases share an integration */
function intensityOpacity(count: number, maxCount: number): number {
  if (maxCount <= 1) return 0.6;
  const normalized = count / maxCount;
  return 0.15 + normalized * 0.85;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HeatMapPage() {
  const { project, architectures } = useProject();

  const { useCases, integrations, matrix, maxFrequency } = useMemo(() => {
    // Extract integrations from each architecture
    const ucList: Array<{ id: string; name: string; integrations: string[] }> = [];

    architectures.forEach((arch) => {
      const da = arch.dataArchitecture as any;
      const sa = arch.systemArchitecture as any;

      // Try multiple locations for integrations
      const integrationsArr: string[] =
        da?.integrations ||
        da?.useCase?.integrations ||
        sa?.useCase?.integrations ||
        [];

      ucList.push({
        id: arch.id,
        name: arch.useCaseName,
        integrations: integrationsArr,
      });
    });

    // Collect all unique integrations and their frequency
    const integrationFreq: Record<string, number> = {};
    ucList.forEach((uc) => {
      uc.integrations.forEach((intg) => {
        integrationFreq[intg] = (integrationFreq[intg] || 0) + 1;
      });
    });

    // Sort integrations by frequency (most common first)
    const sortedIntegrations = Object.entries(integrationFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // Build matrix: useCaseIdx -> integrationIdx -> boolean
    const matrixData: boolean[][] = ucList.map((uc) =>
      sortedIntegrations.map((intg) => uc.integrations.includes(intg))
    );

    const maxFreq = Math.max(...Object.values(integrationFreq), 1);

    return {
      useCases: ucList,
      integrations: sortedIntegrations,
      matrix: matrixData,
      maxFrequency: maxFreq,
      integrationFreq,
    };
  }, [architectures]);

  // Compute per-integration frequency for color intensity
  const integrationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    useCases.forEach((uc) => {
      uc.integrations.forEach((intg) => {
        counts[intg] = (counts[intg] || 0) + 1;
      });
    });
    return counts;
  }, [useCases]);

  if (!project) return null;

  const hasData = integrations.length > 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          System Integration Heat Map
        </h1>
        <p className="text-muted-foreground mt-1">
          Integration overlap across {useCases.length} use cases and{" "}
          {integrations.length} systems
        </p>
      </div>

      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-foreground">
                {useCases.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Use Cases</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-foreground">
                {integrations.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unique Systems
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-foreground">
                {maxFrequency}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max Shared Usage
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-foreground">
                {matrix.flat().filter(Boolean).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Connections
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heat Map Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Integration Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              No integration data available. Import a project with system
              integrations to populate the heat map.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse">
                <thead>
                  <tr>
                    {/* Row header column */}
                    <th className="sticky left-0 z-10 bg-card py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                      Use Case
                    </th>
                    {/* Integration columns */}
                    {integrations.map((intg) => (
                      <th
                        key={intg}
                        className="py-2 px-1 text-center min-w-[44px]"
                      >
                        <div
                          className="text-xs text-muted-foreground font-medium whitespace-nowrap"
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            height: "120px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          {intg}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {useCases.map((uc, ucIdx) => (
                    <tr
                      key={uc.id}
                      className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-card py-2 px-3 font-medium text-foreground text-sm truncate max-w-[200px]">
                        {uc.name}
                      </td>
                      {integrations.map((intg, intgIdx) => {
                        const isActive = matrix[ucIdx][intgIdx];
                        const freq = integrationCounts[intg] || 0;
                        const opacity = intensityOpacity(freq, maxFrequency);

                        return (
                          <td
                            key={intg}
                            className="py-2 px-1 text-center"
                          >
                            <div
                              className="mx-auto h-8 w-8 rounded-md flex items-center justify-center transition-colors"
                              style={
                                isActive
                                  ? {
                                      backgroundColor: `rgba(2, 162, 253, ${opacity})`,
                                      border: `1px solid rgba(2, 162, 253, ${Math.min(opacity + 0.2, 1)})`,
                                    }
                                  : {
                                      backgroundColor: "transparent",
                                      border: "1px solid hsl(var(--border) / 0.3)",
                                    }
                              }
                              title={
                                isActive
                                  ? `${uc.name} uses ${intg} (shared by ${freq} use cases)`
                                  : `${uc.name} does not use ${intg}`
                              }
                            >
                              {isActive && (
                                <span
                                  className="text-xs font-bold"
                                  style={{
                                    color:
                                      opacity > 0.5
                                        ? "white"
                                        : "rgb(2, 162, 253)",
                                  }}
                                >
                                  {freq}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-medium">Intensity:</span>
                <div className="flex items-center gap-1">
                  <div
                    className="h-5 w-5 rounded"
                    style={{
                      backgroundColor: "rgba(2, 162, 253, 0.15)",
                      border: "1px solid rgba(2, 162, 253, 0.35)",
                    }}
                  />
                  <span>Low (1 use case)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-5 w-5 rounded"
                    style={{
                      backgroundColor: "rgba(2, 162, 253, 0.5)",
                      border: "1px solid rgba(2, 162, 253, 0.7)",
                    }}
                  />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-5 w-5 rounded"
                    style={{
                      backgroundColor: "rgba(2, 162, 253, 1)",
                      border: "1px solid rgba(2, 162, 253, 1)",
                    }}
                  />
                  <span>High ({maxFrequency} use cases)</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Connected Systems */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Connected Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.slice(0, 10).map((intg) => {
                const count = integrationCounts[intg] || 0;
                const pct = (count / useCases.length) * 100;
                return (
                  <div key={intg} className="flex items-center gap-3">
                    <div className="w-[180px] shrink-0 text-sm text-foreground truncate">
                      {intg}
                    </div>
                    <div className="flex-1 h-6 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: `rgba(2, 162, 253, ${intensityOpacity(count, maxFrequency)})`,
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-medium text-muted-foreground">
                      {count}/{useCases.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
