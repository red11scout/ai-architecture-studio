"use client";

import { useParams } from "next/navigation";
import { CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "../../../layout";
import { cn } from "@/lib/utils";

const PHASE_CONFIG: Record<string, { label: string; color: string; weeks: string }> = {
  "Phase 1": { label: "Foundation", color: "bg-[#36bf78]", weeks: "Weeks 1-4" },
  "Phase 2": { label: "Core Development", color: "bg-[#02a2fd]", weeks: "Weeks 5-8" },
  "Phase 3": { label: "Integration", color: "bg-[#001278]", weeks: "Weeks 9-12" },
  "Phase 4": { label: "Optimization", color: "bg-amber-500", weeks: "Weeks 13-16" },
};

const MILESTONES = [
  { phase: "Phase 1", items: ["Environment setup", "Data pipeline configuration", "Integration scaffolding", "Security baseline"] },
  { phase: "Phase 2", items: ["Agent implementation", "Workflow orchestration", "HITL checkpoint integration", "Unit testing"] },
  { phase: "Phase 3", items: ["System integration testing", "Performance optimization", "User acceptance testing", "Documentation"] },
  { phase: "Phase 4", items: ["Production deployment", "Monitoring setup", "Team training", "Handoff complete"] },
];

export default function RoadmapPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const phase = arch?.implementationPhase || "Phase 1";
  const weeks = arch?.estimatedWeeks || 12;

  return (
    <div className="p-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#02a2fd]/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-[#02a2fd]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{phase}</p>
                <p className="text-xs text-muted-foreground">Recommended Phase</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#36bf78]/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#36bf78]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{weeks}</p>
                <p className="text-xs text-muted-foreground">Estimated Weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#001278]/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[#001278]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">4</p>
                <p className="text-xs text-muted-foreground">Total Phases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Implementation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {MILESTONES.map((milestone, idx) => {
              const config = PHASE_CONFIG[milestone.phase] || PHASE_CONFIG["Phase 1"];
              const isCurrentPhase = milestone.phase === phase;

              return (
                <div key={milestone.phase} className="relative">
                  {/* Timeline connector */}
                  {idx < MILESTONES.length - 1 && (
                    <div className="absolute left-5 top-12 w-0.5 h-full bg-border" />
                  )}

                  <div className="flex gap-4">
                    {/* Phase indicator */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                        config.color,
                        isCurrentPhase && "ring-4 ring-offset-2 ring-offset-background ring-[#02a2fd]/30"
                      )}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {milestone.phase}: {config.label}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {config.weeks}
                        </span>
                        {isCurrentPhase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#02a2fd]/10 text-[#02a2fd]">
                            Recommended Start
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {milestone.items.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
