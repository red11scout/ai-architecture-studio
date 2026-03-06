"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "../../../layout";
import { generateDataGovernance } from "@/lib/diagrams/data-governance-engine";
import { DiagramRenderer } from "@/components/diagrams/diagram-renderer";

export default function DataGovernancePage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const diagram = useMemo(() => {
    if (!arch?.dataArchitecture && !arch?.governanceModel) return null;
    try {
      return generateDataGovernance(arch.dataArchitecture, arch.governanceModel);
    } catch {
      return null;
    }
  }, [arch]);

  const hitlCheckpoint = (arch?.governanceModel as any)?.hitlCheckpoint || "";
  const epochFlags = (arch?.governanceModel as any)?.epochFlags || "";
  const dataTypes: string[] = (arch?.dataArchitecture as any)?.dataTypes || [];
  const integrations: string[] = (arch?.dataArchitecture as any)?.integrations || [];

  return (
    <div className="p-8">
      {/* Summary badges */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {dataTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data:
            </span>
            {dataTypes.map((dt: string) => (
              <span
                key={dt}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#02a2fd]/10 text-[#02a2fd]"
              >
                {dt}
              </span>
            ))}
          </div>
        )}
        {integrations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Integrations:
            </span>
            {integrations.slice(0, 4).map((ig: string) => (
              <span
                key={ig}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#001278]/10 text-[#001278] dark:bg-[#001278]/20 dark:text-[#02a2fd]"
              >
                {ig}
              </span>
            ))}
          </div>
        )}
        {hitlCheckpoint && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600">
            HITL: {hitlCheckpoint}
          </span>
        )}
        {epochFlags && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              epochFlags.toLowerCase() === "green"
                ? "bg-green-500/10 text-green-600"
                : epochFlags.toLowerCase() === "yellow"
                  ? "bg-yellow-500/10 text-yellow-600"
                  : epochFlags.toLowerCase() === "red"
                    ? "bg-red-500/10 text-red-600"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            Epoch: {epochFlags}
          </span>
        )}
      </div>

      {/* Diagram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Data Pipeline & Governance — {arch?.useCaseName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagram ? (
            <DiagramRenderer
              diagram={diagram}
              direction="LR"
              className="h-[600px] rounded-lg border border-border"
            />
          ) : (
            <div className="h-[600px] rounded-lg border border-border bg-muted/20 flex items-center justify-center">
              <p className="text-muted-foreground">
                No data architecture or governance data available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {diagram?.mermaidCode && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Mermaid Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-x-auto font-mono">
              {diagram.mermaidCode}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
