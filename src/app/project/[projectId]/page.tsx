"use client";

import { useRouter, useParams } from "next/navigation";
import {
  DollarSign, Clock, Zap, Layers, ArrowRight,
  TrendingUp, ShieldCheck, Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProject } from "./layout";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const tierColors: Record<string, string> = {
  "Tier 1 — Champions": "bg-[#36bf78]/10 text-[#36bf78] border-[#36bf78]/30",
  "Tier 2 — Quick Wins": "bg-[#02a2fd]/10 text-[#02a2fd] border-[#02a2fd]/30",
  "Tier 3 — Strategic": "bg-amber-500/10 text-amber-600 border-amber-500/30",
  "Tier 4 — Foundation": "bg-muted text-muted-foreground border-border",
};

export default function ProjectOverviewPage() {
  const { project, architectures } = useProject();
  const router = useRouter();
  const params = useParams<{ projectId: string }>();

  if (!project) return null;

  // Extract portfolio metrics from architecture data
  let totalAnnualValue = 0;
  let useCaseCount = architectures.length;

  architectures.forEach((arch) => {
    const fi = arch.financialImpact as any;
    if (fi?.benefit?.totalAnnualValue) {
      const val = fi.benefit.totalAnnualValue;
      const num = typeof val === "string" ? parseFloat(val.replace(/[$,KMB]/g, "")) : val;
      if (!isNaN(num)) {
        // Handle formatted strings like "$6.3M"
        if (typeof val === "string" && val.includes("M")) totalAnnualValue += num * 1_000_000;
        else if (typeof val === "string" && val.includes("K")) totalAnnualValue += num * 1_000;
        else totalAnnualValue += num;
      }
    }
  });

  // Get unique patterns
  const patterns = new Set(
    architectures.map((a) => {
      const sa = a as any;
      return sa.systemArchitecture?.pattern || "unknown";
    })
  );

  return (
    <div className="p-8">
      {/* Hero header */}
      <div className="mb-8 pb-8 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.companyName} &middot; {project.industry}
            </p>
            {project.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
          <Button
            onClick={() => router.push(`/project/${params.projectId}/portfolio/dashboard`)}
          >
            Executive Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#02a2fd]/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-[#02a2fd]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{useCaseCount}</p>
                <p className="text-xs text-muted-foreground">Use Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#36bf78]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#36bf78]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalAnnualValue > 0 ? formatCurrency(totalAnnualValue) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Total Annual Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#001278]/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-[#001278]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{patterns.size}</p>
                <p className="text-xs text-muted-foreground">AI Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{useCaseCount}</p>
                <p className="text-xs text-muted-foreground">HITL Checkpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Use cases table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Use Case
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pattern
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Phase
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Annual Value
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {architectures.map((arch) => {
                  const fi = arch.financialImpact as any;
                  const pattern = (arch as any).systemArchitecture?.pattern || "";
                  const value = fi?.benefit?.totalAnnualValue || "—";

                  return (
                    <tr
                      key={arch.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(
                          `/project/${params.projectId}/use-case/${arch.useCaseId}/architecture`
                        )
                      }
                    >
                      <td className="py-3 px-4 font-medium text-foreground">
                        {arch.useCaseName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#02a2fd]/10 text-[#02a2fd]">
                          {pattern.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {arch.implementationPhase || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {value}
                      </td>
                      <td className="py-3 px-4">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
