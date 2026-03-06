"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useProject } from "../../../layout";

const PRD_SECTIONS: Record<string, string> = {
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

function formatCurrency(val: any): string {
  if (!val) return "—";
  if (typeof val === "string") return val;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export default function PrintPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { project, architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const prd = arch?.prdContent;
  const fi = arch?.financialImpact as any;
  const sa = arch?.systemArchitecture as any;
  const gov = arch?.governanceModel as any;

  useEffect(() => {
    // Auto-trigger print dialog after brief render delay
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!arch || !project) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        @page { margin: 0.75in; size: letter; }
      `}</style>

      <div className="max-w-[800px] mx-auto font-[DM_Sans,sans-serif] text-[#0a0e27]">
        {/* Cover header */}
        <div className="bg-[#001278] text-white p-8 rounded-lg mb-8 print:rounded-none">
          <div className="flex items-center justify-between mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blueally-logo-white.png"
              alt="BlueAlly"
              className="h-8"
            />
            <span className="text-sm text-blue-200">AI Solution Builder</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">{arch.useCaseName}</h1>
          <p className="text-blue-200 text-sm">
            {project.companyName} &middot; {project.industry}
          </p>
        </div>

        {/* Back button (screen only) */}
        <button
          onClick={() => window.history.back()}
          className="no-print mb-6 text-sm text-[#02a2fd] hover:underline"
        >
          &larr; Back to use case
        </button>

        {/* Financial summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Annual Value</p>
            <p className="text-xl font-bold text-[#36bf78] mt-1">
              {formatCurrency(fi?.benefit?.totalAnnualValue)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pattern</p>
            <p className="text-sm font-semibold mt-1">
              {(sa?.pattern || "—").replace(/_/g, " ")}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Priority</p>
            <p className="text-sm font-semibold mt-1">
              {fi?.priority?.priorityTier || "—"}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Phase</p>
            <p className="text-sm font-semibold mt-1">
              {arch.implementationPhase || "—"}
            </p>
          </div>
        </div>

        {/* Financial detail */}
        {fi?.benefit && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#001278] mb-3">Financial Impact</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {[
                  ["Cost Savings", fi.benefit.costBenefit],
                  ["Revenue Growth", fi.benefit.revenueBenefit],
                  ["Risk Reduction", fi.benefit.riskBenefit],
                  ["Cash Flow Improvement", fi.benefit.cashFlowBenefit],
                  ["Probability of Success", fi.benefit.probabilityOfSuccess ? `${(fi.benefit.probabilityOfSuccess * 100).toFixed(0)}%` : null],
                  ["Readiness Score", fi.readiness?.readinessScore ? `${fi.readiness.readinessScore.toFixed(1)}/10` : null],
                ].map(([label, val]) =>
                  val ? (
                    <tr key={String(label)} className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">{label}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(val)}</td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Governance summary */}
        {(gov?.hitlCheckpoint || gov?.epochFlags) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#001278] mb-3">Governance</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              {gov.hitlCheckpoint && (
                <p><span className="font-semibold">HITL Checkpoint:</span> {gov.hitlCheckpoint}</p>
              )}
              {gov.epochFlags && (
                <p className="mt-1"><span className="font-semibold">Epoch Risk:</span> {gov.epochFlags}</p>
              )}
            </div>
          </div>
        )}

        {/* PRD sections */}
        {prd && (
          <>
            <div className="page-break" />
            <h2 className="text-xl font-bold text-[#001278] mb-4 mt-8">
              Product Requirements Document
            </h2>
            {Object.entries(PRD_SECTIONS).map(([key, label]) => {
              const content = prd[key];
              if (!content) return null;
              return (
                <div key={key} className="mb-6">
                  <h3 className="text-base font-bold text-[#001278] mb-2 border-b border-[#02a2fd]/30 pb-1">
                    {label}
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blueally-logo-blue.png"
            alt="BlueAlly"
            className="h-5"
          />
          <p>
            Generated {new Date().toLocaleDateString()} &middot; AI Solution Builder
          </p>
        </div>
      </div>
    </>
  );
}
