"use client";

import { useMemo } from "react";
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

interface SharedProject {
  name: string;
  companyName: string;
  industry: string;
}

interface SharedArch {
  id: string;
  useCaseId: string;
  useCaseName: string;
  implementationPhase: string | null;
  systemArchitecture: any;
  agenticWorkflow: any;
  dataArchitecture: any;
  governanceModel: any;
  financialImpact: any;
  prdContent: any;
}

function UseCaseDiagrams({ arch }: { arch: SharedArch }) {
  const systemDiagram = useMemo(() => {
    if (!arch.systemArchitecture) return null;
    try {
      return generateSystemArchitecture(arch.systemArchitecture);
    } catch {
      return null;
    }
  }, [arch.systemArchitecture]);

  const agenticDiagram = useMemo(() => {
    if (!arch.agenticWorkflow) return null;
    try {
      return generateAgenticWorkflow(arch.agenticWorkflow);
    } catch {
      return null;
    }
  }, [arch.agenticWorkflow]);

  const dataGovDiagram = useMemo(() => {
    if (!arch.dataArchitecture || !arch.governanceModel) return null;
    try {
      return generateDataGovernance(arch.dataArchitecture, arch.governanceModel);
    } catch {
      return null;
    }
  }, [arch.dataArchitecture, arch.governanceModel]);

  if (!systemDiagram && !agenticDiagram && !dataGovDiagram) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-[#001278] mb-4">
        Architecture Diagrams
      </h3>

      {systemDiagram?.mermaidCode && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[#001278] mb-2 border-b border-[#02a2fd]/30 pb-1">
            System Architecture
          </h4>
          <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-hidden">
            <MermaidDiagram
              code={systemDiagram.mermaidCode}
              id={`share-system-${arch.useCaseId}`}
            />
          </div>
        </div>
      )}

      {agenticDiagram?.mermaidCode && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[#001278] mb-2 border-b border-[#02a2fd]/30 pb-1">
            Agentic Workflow
          </h4>
          <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-hidden">
            <MermaidDiagram
              code={agenticDiagram.mermaidCode}
              id={`share-agentic-${arch.useCaseId}`}
            />
          </div>
        </div>
      )}

      {dataGovDiagram?.mermaidCode && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[#001278] mb-2 border-b border-[#02a2fd]/30 pb-1">
            Data &amp; Governance Pipeline
          </h4>
          <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-hidden">
            <MermaidDiagram
              code={dataGovDiagram.mermaidCode}
              id={`share-datagov-${arch.useCaseId}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function UseCasePRD({ prd }: { prd: any }) {
  if (!prd) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-[#001278] mb-4">
        Product Requirements Document
      </h3>
      {SECTION_MAP.map((section) => {
        const content = getSectionContent(prd, section);
        if (!content) return null;
        return (
          <div key={section.key} className="mb-5">
            <h4 className="text-sm font-semibold text-[#001278] mb-1.5 border-b border-[#02a2fd]/30 pb-1">
              {section.label}
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SharedReportContent({
  project,
  architectures,
}: {
  project: SharedProject;
  architectures: SharedArch[];
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break-use-case { page-break-before: always; }
          .mermaid-diagram svg { max-width: 100% !important; height: auto !important; }
        }
        @page { margin: 0.75in; size: letter; }
      `}</style>

      {/* Header */}
      <div className="bg-[#001278] text-white py-12 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blueally-logo-white.png"
              alt="BlueAlly"
              className="h-8"
            />
            <span className="text-sm text-blue-200">AI Solution Builder</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">{project.name}</h1>
          <p className="text-blue-200">
            {project.companyName} &middot; {project.industry}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Per use case */}
        {architectures.map((arch, idx) => {
          const sa = arch.systemArchitecture as any;
          const gov = arch.governanceModel as any;

          return (
            <div
              key={arch.id}
              className={idx > 0 ? "page-break-use-case mt-12" : ""}
            >
              {/* Use case header */}
              <div className="border-l-4 border-[#02a2fd] pl-4 mb-6">
                <h2 className="text-xl font-bold text-[#001278]">
                  {arch.useCaseName}
                </h2>
                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                  {sa?.pattern && (
                    <span className="bg-[#02a2fd]/10 text-[#02a2fd] rounded px-2 py-0.5 text-xs font-medium">
                      {sa.pattern.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Governance summary */}
              {(gov?.hitlCheckpoint || gov?.epochFlags) && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    {gov.hitlCheckpoint && (
                      <p>
                        <span className="font-semibold">HITL Checkpoint:</span>{" "}
                        {gov.hitlCheckpoint}
                      </p>
                    )}
                    {gov.epochFlags && (
                      <p className="mt-1">
                        <span className="font-semibold">Epoch Risk:</span>{" "}
                        {gov.epochFlags}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Diagrams */}
              <UseCaseDiagrams arch={arch} />

              {/* PRD */}
              <UseCasePRD prd={arch.prdContent} />

              {/* Divider between use cases */}
              {idx < architectures.length - 1 && (
                <div className="mt-10 border-b-2 border-gray-100" />
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blueally-logo-blue.png"
            alt="BlueAlly"
            className="h-6"
          />
          <p className="text-xs text-gray-400">
            Generated {new Date().toLocaleDateString()} &middot; AI Solution Builder &middot; BlueAlly
          </p>
        </div>
      </div>
    </div>
  );
}
