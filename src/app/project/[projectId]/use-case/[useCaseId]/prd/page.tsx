"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Sparkles, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProject } from "../../../layout";
import { apiRequest } from "@/lib/api-client";
import { SECTION_MAP, getSectionContent } from "@/lib/prd-sections";

export default function PRDPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures, refetch } = useProject();
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
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

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    setError("");
    const total = architectures.length;
    setBulkProgress({ current: 0, total });

    try {
      // Process sequentially on the client to show progress
      for (let i = 0; i < architectures.length; i++) {
        setBulkProgress({ current: i + 1, total });
        await apiRequest(
          "POST",
          `/api/projects/${params.projectId}/ai/prd`,
          { useCaseId: architectures[i].useCaseId },
          120000
        );
      }
      refetch();
    } catch (e: any) {
      setError(e.message || "Failed to generate PRDs");
    } finally {
      setBulkGenerating(false);
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
              Generate a comprehensive 12-section PRD for this use case using
              Claude AI. The PRD serves as an actionable build guide with
              specific architecture specs, data strategy, user stories with
              acceptance criteria, and implementation roadmap.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleGenerate} disabled={generating || bulkGenerating}>
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
              {architectures.length > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBulkGenerate}
                  disabled={generating || bulkGenerating}
                >
                  {bulkGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {bulkProgress.current} of {bulkProgress.total}...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate All PRDs
                    </>
                  )}
                </Button>
              )}
            </div>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating || bulkGenerating}>
            {generating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Regenerate
          </Button>
          {architectures.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkGenerate}
              disabled={generating || bulkGenerating}
            >
              {bulkGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {bulkProgress.current}/{bulkProgress.total}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  All PRDs
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {SECTION_MAP.map((section) => {
          const content = getSectionContent(prd, section);
          if (!content) return null;
          return (
            <Card key={section.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {section.label}
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
