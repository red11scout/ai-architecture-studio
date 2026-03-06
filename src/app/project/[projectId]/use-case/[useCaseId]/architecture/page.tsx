"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Cpu, GitBranch, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProject } from "../../../layout";
import { cn } from "@/lib/utils";
import { generateSystemArchitecture } from "@/lib/diagrams/system-architecture-engine";
import { generateAgenticWorkflow } from "@/lib/diagrams/agentic-workflow-engine";
import { generateDataGovernance } from "@/lib/diagrams/data-governance-engine";
import { DiagramRenderer } from "@/components/diagrams/diagram-renderer";
import type { DiagramDefinition } from "@/lib/types";

const layers = [
  { id: "system", label: "System Architecture", icon: Cpu, direction: "TB" as const },
  { id: "agentic", label: "Agentic Workflow", icon: GitBranch, direction: "TB" as const },
  { id: "data-governance", label: "Data & Governance", icon: ShieldCheck, direction: "LR" as const },
];

export default function ArchitecturePage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();
  const [activeLayer, setActiveLayer] = useState("system");

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const diagram = useMemo<DiagramDefinition | null>(() => {
    if (!arch) return null;
    try {
      switch (activeLayer) {
        case "system":
          return generateSystemArchitecture(arch.systemArchitecture);
        case "agentic":
          return generateAgenticWorkflow(arch.agenticWorkflow);
        case "data-governance":
          return generateDataGovernance(arch.dataArchitecture, arch.governanceModel);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }, [arch, activeLayer]);

  const currentLayer = layers.find((l) => l.id === activeLayer)!;

  if (!arch) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Use case not found.
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Layer switcher */}
      <div className="flex items-center gap-2 mb-6">
        {layers.map((layer) => (
          <Button
            key={layer.id}
            variant={activeLayer === layer.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveLayer(layer.id)}
            className={cn(
              "gap-1.5",
              activeLayer === layer.id &&
                "bg-[#001278] hover:bg-[#001278]/90 text-white"
            )}
          >
            <layer.icon className="h-4 w-4" />
            {layer.label}
          </Button>
        ))}
      </div>

      {/* Diagram canvas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <currentLayer.icon className="h-5 w-5 text-[#02a2fd]" />
            {currentLayer.label} — {arch.useCaseName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagram ? (
            <DiagramRenderer
              diagram={diagram}
              direction={currentLayer.direction}
              className="h-[600px] rounded-lg border border-border"
            />
          ) : (
            <div className="h-[600px] rounded-lg border border-border bg-muted/20 flex items-center justify-center">
              <p className="text-muted-foreground">
                No diagram data available for this layer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mermaid preview */}
      {diagram?.mermaidCode && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Mermaid Export Code
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
