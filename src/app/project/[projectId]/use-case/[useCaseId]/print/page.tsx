"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useProject } from "../../../layout";
import { SECTION_MAP, getSectionContent } from "@/lib/prd-sections";
import { MermaidDiagram } from "@/components/diagrams/mermaid-diagram";
import { generateSystemArchitecture } from "@/lib/diagrams/system-architecture-engine";
import { generateAgenticWorkflow } from "@/lib/diagrams/agentic-workflow-engine";
import { generateDataGovernance } from "@/lib/diagrams/data-governance-engine";

/** Normalize legacy "Q1"-"Q4" to "Phase 1"-"Phase 4" */
function normalizePhase(phase: string | null | undefined): string {
  if (!phase) return "";
  const qMatch = phase.match(/^Q(\d)$/i);
  if (qMatch) return `Phase ${qMatch[1]}`;
  return phase;
}

export default function PrintPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { project, architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const prd = arch?.prdContent;
  const sa = arch?.systemArchitecture as any;
  const gov = arch?.governanceModel as any;

  // Generate diagrams from stored data
  const systemDiagram = useMemo(() => {
    if (!arch?.systemArchitecture) return null;
    try {
      return generateSystemArchitecture(arch.systemArchitecture);
    } catch {
      return null;
    }
  }, [arch?.systemArchitecture]);

  const agenticDiagram = useMemo(() => {
    if (!arch?.agenticWorkflow) return null;
    try {
      return generateAgenticWorkflow(arch.agenticWorkflow);
    } catch {
      return null;
    }
  }, [arch?.agenticWorkflow]);

  const dataGovDiagram = useMemo(() => {
    if (!arch?.dataArchitecture || !arch?.governanceModel) return null;
    try {
      return generateDataGovernance(arch.dataArchitecture, arch.governanceModel);
    } catch {
      return null;
    }
  }, [arch?.dataArchitecture, arch?.governanceModel]);

  useEffect(() => {
    // Increased delay to allow Mermaid diagrams to render before print dialog
    const timer = setTimeout(() => window.print(), 1500);
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
          .mermaid-diagram svg { max-width: 100% !important; height: auto !important; }
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
          <div className="flex gap-4 mt-4 text-sm">
            {sa?.pattern && (
              <span className="bg-white/15 rounded px-2 py-0.5">
                {sa.pattern.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>

        {/* Back button (screen only) */}
        <button
          onClick={() => window.history.back()}
          className="no-print mb-6 text-sm text-[#02a2fd] hover:underline"
        >
          &larr; Back to use case
        </button>

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

        {/* Architecture Diagrams */}
        {(systemDiagram || agenticDiagram || dataGovDiagram) && (
          <>
            <div className="page-break" />
            <h2 className="text-xl font-bold text-[#001278] mb-6 mt-8">
              Architecture Diagrams
            </h2>

            {systemDiagram?.mermaidCode && (
              <div className="mb-8">
                <h3 className="text-base font-bold text-[#001278] mb-3 border-b border-[#02a2fd]/30 pb-1">
                  System Architecture
                </h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <MermaidDiagram
                    code={systemDiagram.mermaidCode}
                    id="print-system"
                  />
                </div>
              </div>
            )}

            {agenticDiagram?.mermaidCode && (
              <div className="mb-8 page-break">
                <h3 className="text-base font-bold text-[#001278] mb-3 border-b border-[#02a2fd]/30 pb-1">
                  Agentic Workflow
                </h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <MermaidDiagram
                    code={agenticDiagram.mermaidCode}
                    id="print-agentic"
                  />
                </div>
              </div>
            )}

            {dataGovDiagram?.mermaidCode && (
              <div className="mb-8 page-break">
                <h3 className="text-base font-bold text-[#001278] mb-3 border-b border-[#02a2fd]/30 pb-1">
                  Data &amp; Governance Pipeline
                </h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <MermaidDiagram
                    code={dataGovDiagram.mermaidCode}
                    id="print-datagov"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* PRD sections */}
        {prd && (
          <>
            <div className="page-break" />
            <h2 className="text-xl font-bold text-[#001278] mb-4 mt-8">
              Product Requirements Document
            </h2>
            {SECTION_MAP.map((section) => {
              const content = getSectionContent(prd, section);
              if (!content) return null;
              return (
                <div key={section.key} className="mb-6">
                  <h3 className="text-base font-bold text-[#001278] mb-2 border-b border-[#02a2fd]/30 pb-1">
                    {section.label}
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
