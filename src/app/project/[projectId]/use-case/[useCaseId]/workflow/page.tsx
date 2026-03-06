"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "../../../layout";
import { generateAgenticWorkflow } from "@/lib/diagrams/agentic-workflow-engine";
import { DiagramRenderer } from "@/components/diagrams/diagram-renderer";

export default function WorkflowPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const diagram = useMemo(() => {
    if (!arch?.agenticWorkflow) return null;
    try {
      return generateAgenticWorkflow(arch.agenticWorkflow);
    } catch {
      return null;
    }
  }, [arch]);

  const pattern = arch?.agenticWorkflow?.pattern || "";
  const primitives: string[] = arch?.agenticWorkflow?.primitives || [];

  return (
    <div className="p-8">
      {/* Pattern info */}
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#02a2fd]/10 text-[#02a2fd]">
          {pattern.replace(/_/g, " ")}
        </span>
        {primitives.map((p: string) => (
          <span
            key={p}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#001278]/10 text-[#001278] dark:bg-[#001278]/20 dark:text-[#02a2fd]"
          >
            {p}
          </span>
        ))}
      </div>

      {/* Diagram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Agentic Workflow — {arch?.useCaseName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagram ? (
            <DiagramRenderer
              diagram={diagram}
              direction="TB"
              className="h-[600px] rounded-lg border border-border"
            />
          ) : (
            <div className="h-[600px] rounded-lg border border-border bg-muted/20 flex items-center justify-center">
              <p className="text-muted-foreground">
                No workflow data available.
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
