"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProject } from "../../../layout";
import { apiRequest } from "@/lib/api-client";

const PRD_SECTIONS = [
  "executiveSummary",
  "problemStatement",
  "proposedSolution",
  "userStories",
  "technicalRequirements",
  "aiModelSpecifications",
  "hitlRequirements",
  "successMetrics",
  "risksAndMitigations",
  "implementationTimeline",
] as const;

const SECTION_LABELS: Record<string, string> = {
  executiveSummary: "Executive Summary",
  problemStatement: "Problem Statement",
  proposedSolution: "Proposed Solution",
  userStories: "User Stories",
  technicalRequirements: "Technical Requirements",
  aiModelSpecifications: "AI Model Specifications",
  hitlRequirements: "Human-in-the-Loop Requirements",
  successMetrics: "Success Metrics",
  risksAndMitigations: "Risks & Mitigations",
  implementationTimeline: "Implementation Timeline",
};

export default function PRDPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures, refetch } = useProject();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const prd = arch?.prdContent;

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      await apiRequest(
        "POST",
        `/api/projects/${params.projectId}/ai/prd`,
        { useCaseId: params.useCaseId },
        120000
      );
      refetch();
    } catch (e: any) {
      setError(e.message || "Failed to generate PRD");
    } finally {
      setGenerating(false);
    }
  };

  if (!prd) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Product Requirements Document
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Generate a comprehensive 10-section PRD for this use case using
              Claude AI. All financial figures are sourced from the deterministic
              calculation engine.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PRD...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate PRD
                </>
              )}
            </Button>
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          PRD — {arch?.useCaseName}
        </h2>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Regenerate
        </Button>
      </div>

      <div className="space-y-6">
        {PRD_SECTIONS.map((key) => {
          const content = prd[key];
          if (!content) return null;
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {SECTION_LABELS[key]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
