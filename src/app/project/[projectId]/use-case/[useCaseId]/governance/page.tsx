"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "../../../layout";
import { generateGovernanceModel } from "@/lib/diagrams/governance-engine";
import { DiagramRenderer } from "@/components/diagrams/diagram-renderer";

export default function GovernancePage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const diagram = useMemo(() => {
    if (!arch?.governanceModel) return null;
    try {
      return generateGovernanceModel(arch.governanceModel);
    } catch {
      return null;
    }
  }, [arch]);

  const hitlCheckpoint = arch?.governanceModel?.hitlCheckpoint || "";
  const epochFlags = arch?.governanceModel?.epochFlags || "";

  const flagColor =
    epochFlags === "Green"
      ? "bg-[#36bf78]/10 text-[#36bf78]"
      : epochFlags === "Yellow"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-red-500/10 text-red-600";

  return (
    <div className="p-8">
      {/* HITL + epoch flag info */}
      <div className="mb-6 space-y-3">
        {hitlCheckpoint && (
          <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <p className="text-sm font-semibold text-foreground mb-1">
              Human-in-the-Loop Checkpoint
            </p>
            <p className="text-sm text-muted-foreground">{hitlCheckpoint}</p>
          </div>
        )}
        {epochFlags && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Epoch Flag:</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${flagColor}`}
            >
              {epochFlags}
            </span>
          </div>
        )}
      </div>

      {/* Diagram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Governance & AI Safety — {arch?.useCaseName}
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
                No governance data available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
