"use client";

import { useEffect, useState } from "react";
import { PrintStyles } from "./print-styles";
import { UseCaseBlock } from "./use-case-block";
import { PortfolioTokenSummaryPage } from "./portfolio-token-summary";

export interface ReportProject {
  name: string;
  companyName: string;
  industry: string;
}

export interface ReportArchitecture {
  id: string;
  useCaseId: string;
  useCaseName: string;
  implementationPhase: string | null;
  estimatedWeeks: number | null;
  systemArchitecture: any;
  agenticWorkflow: any;
  dataArchitecture: any;
  governanceModel: any;
  financialImpact: any;
  businessValueMap: any;
  prdContent: any;
}

interface ReportDocumentProps {
  project: ReportProject;
  architectures: ReportArchitecture[];
  scope: "use_case" | "portfolio";
  autoPrint?: boolean;
}

/**
 * Simplified report document.
 *
 * Per use case (and per use case in portfolio mode), three pages:
 *  1. Branded intro spotlight — Customer + AI Use Case + key details
 *  2. Architecture Diagrams (System, Agentic Workflow, Data & Governance)
 *  3. Product Requirements Document
 *
 * No table of contents, no executive summary, no scorecards. Clean.
 */
export function ReportDocument({
  project,
  architectures,
  scope,
  autoPrint = false,
}: ReportDocumentProps) {
  const [previewOnly, setPreviewOnly] = useState(false);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setPreviewOnly(sp.get("preview") === "1");
  }, []);

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isPortfolio = scope === "portfolio";
  const archs = architectures;
  const headlineText = isPortfolio
    ? `${project.companyName} · AI Architecture Brief`
    : archs[0]?.useCaseName || project.name;

  // Auto-print: wait for Mermaid + fonts before invoking print dialog.
  useEffect(() => {
    if (!autoPrint || printed || previewOnly) return;
    let cancelled = false;

    const trigger = async () => {
      try {
        await new Promise((r) => setTimeout(r, 250));
        const w = window as any;
        const pending: Promise<any>[] = w.__mermaidPending || [];
        await Promise.all(pending);
        if (document.fonts && (document.fonts as any).ready) {
          await (document.fonts as any).ready;
        }
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (cancelled) return;
        setPrinted(true);
        window.print();
      } catch {
        if (!cancelled) {
          setPrinted(true);
          window.print();
        }
      }
    };
    trigger();

    return () => {
      cancelled = true;
    };
  }, [autoPrint, printed, previewOnly]);

  return (
    <div className="report-doc">
      <PrintStyles />

      {/* Screen-only sticky toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blueally-logo-blue.png"
            alt="BlueAlly"
            className="h-5"
          />
          <span className="text-sm text-gray-700 font-medium">
            {headlineText}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Tip: best in Chrome via &ldquo;Save as PDF&rdquo;
          </span>
          <button
            onClick={() => window.print()}
            className="text-sm bg-[#001278] text-white px-3 py-1.5 rounded-md hover:bg-[#001278]/90 font-medium"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {isPortfolio && (
        <PortfolioTokenSummaryPage
          companyName={project.companyName}
          industry={project.industry}
          generatedDate={generatedDate}
          architectures={archs}
        />
      )}

      {archs.map((arch, idx) => (
        <UseCaseBlock
          key={arch.id}
          arch={arch}
          isFirst={idx === 0 && !isPortfolio}
          companyName={project.companyName}
          industry={project.industry}
          generatedDate={generatedDate}
        />
      ))}
    </div>
  );
}
