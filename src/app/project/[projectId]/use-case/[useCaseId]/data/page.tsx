"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "../../../layout";
import { generateDataArchitecture } from "@/lib/diagrams/data-architecture-engine";
import { DiagramRenderer } from "@/components/diagrams/diagram-renderer";

export default function DataPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const diagram = useMemo(() => {
    if (!arch?.dataArchitecture) return null;
    try {
      return generateDataArchitecture(arch.dataArchitecture);
    } catch {
      return null;
    }
  }, [arch]);

  const dataTypes: string[] = arch?.dataArchitecture?.dataTypes || [];
  const integrations: string[] = arch?.dataArchitecture?.integrations || [];

  return (
    <div className="p-8">
      {/* Data summary badges */}
      <div className="mb-6 flex flex-wrap gap-2">
        {dataTypes.map((dt: string) => (
          <span
            key={dt}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#36bf78]/10 text-[#36bf78]"
          >
            {dt}
          </span>
        ))}
        {integrations.map((int: string) => (
          <span
            key={int}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#02a2fd]/10 text-[#02a2fd]"
          >
            {int}
          </span>
        ))}
      </div>

      {/* Diagram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Data Architecture — {arch?.useCaseName}
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
                No data architecture available.
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
