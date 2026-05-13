"use client";

import { useMemo } from "react";
import { MermaidDiagram } from "@/components/diagrams/mermaid-diagram";
import { generateSystemArchitecture } from "@/lib/diagrams/system-architecture-engine";
import { generateAgenticWorkflow } from "@/lib/diagrams/agentic-workflow-engine";
import { generateDataGovernance } from "@/lib/diagrams/data-governance-engine";
import { SECTION_MAP, getSectionContent } from "@/lib/prd-sections";
import { TokenEconomicsSection } from "./token-economics-section";

interface UseCaseArch {
  useCaseId: string;
  useCaseName: string;
  systemArchitecture: any;
  agenticWorkflow: any;
  dataArchitecture: any;
  governanceModel: any;
  businessValueMap: any;
  financialImpact: any;
  prdContent: any;
}

interface UseCaseBlockProps {
  arch: UseCaseArch;
  isFirst: boolean;
  companyName: string;
  industry: string;
  generatedDate: string;
}

/**
 * The only content unit. Renders three pages per use case:
 *  1. Branded intro spotlight (Customer + AI Use Case + details)
 *  2. Architecture Diagrams (System, Agentic Workflow, Data & Governance)
 *  3. Product Requirements Document
 */
export function UseCaseBlock({
  arch,
  isFirst,
  companyName,
  industry,
  generatedDate,
}: UseCaseBlockProps) {
  const sa = arch.systemArchitecture;
  const aw = arch.agenticWorkflow;
  const gov = arch.governanceModel;
  const bvm = arch.businessValueMap;
  const useCase = bvm?.useCase;
  const readiness = arch.financialImpact?.readiness;

  const systemDiagram = useMemo(() => {
    if (!sa) return null;
    try {
      return generateSystemArchitecture(sa);
    } catch {
      return null;
    }
  }, [sa]);

  const agenticDiagram = useMemo(() => {
    if (!aw) return null;
    try {
      return generateAgenticWorkflow(aw);
    } catch {
      return null;
    }
  }, [aw]);

  const dataGovDiagram = useMemo(() => {
    if (!arch.dataArchitecture || !gov) return null;
    try {
      return generateDataGovernance(arch.dataArchitecture, gov);
    } catch {
      return null;
    }
  }, [arch.dataArchitecture, gov]);

  return (
    <>
      <UseCaseIntro
        arch={arch}
        useCase={useCase}
        readiness={readiness}
        companyName={companyName}
        industry={industry}
        generatedDate={generatedDate}
        isFirst={isFirst}
      />

      <TokenEconomicsSection
        useCaseId={arch.useCaseId}
        useCaseName={arch.useCaseName}
        readiness={readiness}
        description={useCase?.description}
        dataTypes={useCase?.dataTypes}
        generatedDate={generatedDate}
      />

      {(systemDiagram || agenticDiagram || dataGovDiagram) && (
        <section
          className="report-page break-before"
          id={`uc-${arch.useCaseId}-arch`}
        >
          <SimpleSectionHeader
            kicker="Architecture"
            title="Architecture Diagrams"
          />

          {systemDiagram?.mermaidCode && (
            <DiagramFrame
              title="System Architecture"
              description="End-to-end view: user → gateway → orchestrator → agents → tools → systems."
              code={systemDiagram.mermaidCode}
              id={`uc-${arch.useCaseId}-system`}
            />
          )}

          {agenticDiagram?.mermaidCode && (
            <DiagramFrame
              title="Agentic Workflow"
              description={`Pattern-specific topology${
                sa?.pattern ? ` for ${sa.pattern.replace(/_/g, " ")}.` : "."
              }`}
              code={agenticDiagram.mermaidCode}
              id={`uc-${arch.useCaseId}-agentic`}
            />
          )}

          {dataGovDiagram?.mermaidCode && (
            <DiagramFrame
              title="Data & Governance Pipeline"
              description="Sources → ETL → storage → AI → output, with observability and HITL controls."
              code={dataGovDiagram.mermaidCode}
              id={`uc-${arch.useCaseId}-datagov`}
            />
          )}
        </section>
      )}

      {arch.prdContent && (
        <PRDPage
          prd={arch.prdContent}
          useCaseId={arch.useCaseId}
          useCaseName={arch.useCaseName}
        />
      )}
    </>
  );
}

function UseCaseIntro({
  arch,
  useCase,
  readiness,
  companyName,
  industry,
  generatedDate,
  isFirst,
}: {
  arch: UseCaseArch;
  useCase: any;
  readiness: any;
  companyName: string;
  industry: string;
  generatedDate: string;
  isFirst: boolean;
}) {
  // ---------- All AI Use Case tokens from the uploaded JSON ----------
  const useCaseId: string = useCase?.id || arch.useCaseId;
  const description: string | undefined = useCase?.description;
  const businessFunction: string | undefined = useCase?.function;
  const subFunction: string | undefined = useCase?.subFunction;
  const epochFlags: string | undefined = useCase?.epochFlags;
  const desiredOutcomes: string[] | undefined = useCase?.desiredOutcomes;
  const dataTypes: string[] | undefined = useCase?.dataTypes;
  const integrations: string[] | undefined = useCase?.integrations;
  const aiPrimitives: string[] | undefined = useCase?.aiPrimitives;
  const primaryPattern: string | undefined =
    useCase?.primaryPattern ||
    arch.systemArchitecture?.pattern ||
    useCase?.agenticPattern;
  const agenticPattern: string | undefined = useCase?.agenticPattern;
  const alternativePattern: string | undefined = useCase?.alternativePattern;
  const patternRationale: string | undefined = useCase?.patternRationale;
  const hitl: string | undefined =
    useCase?.hitlCheckpoint || arch.governanceModel?.hitlCheckpoint;
  const strategicTheme: string | undefined = useCase?.strategicTheme;
  const strategicThemeId: string | undefined = useCase?.strategicThemeId;
  const targetFriction: string | undefined = useCase?.targetFriction;
  const targetFrictionId: string | undefined = useCase?.targetFrictionId;

  return (
    <section
      className={`report-page intro-page ${isFirst ? "" : "break-before"}`}
      id={`uc-${arch.useCaseId}-intro`}
    >
      {/* Top branding strip */}
      <div className="flex items-center justify-between mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/blueally-logo-blue.png"
          alt="BlueAlly"
          style={{ height: "0.42in" }}
        />
        <span
          style={{
            fontSize: "9.5pt",
            letterSpacing: "0.2em",
            color: "#02a2fd",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          AI Solution Builder
        </span>
      </div>

      <p className="text-[10pt] font-semibold tracking-[0.22em] uppercase text-[#02a2fd] m-0 mb-3">
        Customer
      </p>
      <h1 className="text-[28pt] font-bold text-[#001278] m-0 leading-[1.05] tracking-[-0.01em]">
        {companyName}
      </h1>
      {industry && (
        <p className="text-[12pt] text-gray-600 mt-1 mb-0">{industry}</p>
      )}

      <div className="my-7 h-[3pt] w-[0.8in] bg-[#36bf78] rounded-sm" />

      {/* Use case headline */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className="text-[10pt] font-semibold tracking-[0.22em] uppercase text-[#02a2fd] m-0">
          AI Use Case
        </p>
        <span className="text-[10pt] font-mono text-gray-500 tracking-tight">
          {useCaseId}
        </span>
      </div>
      <h2 className="text-[22pt] font-bold text-[#001278] m-0 mt-2 leading-[1.1] tracking-[-0.01em]">
        {arch.useCaseName}
      </h2>

      {/* Function chips */}
      {(businessFunction || subFunction || epochFlags) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {businessFunction && <Chip label={businessFunction} tone="primary" />}
          {subFunction && <Chip label={subFunction} tone="muted" />}
          {epochFlags && (
            <Chip label={`Epoch ${epochFlags}`} tone="accent" />
          )}
        </div>
      )}

      {description && (
        <p className="text-[11.5pt] leading-[1.55] text-gray-800 mt-5 mb-0 max-w-[6.7in]">
          {description}
        </p>
      )}

      {/* ---------------- Profile sections ---------------- */}
      <div className="mt-7 space-y-5">
        {/* 1. Strategic Context */}
        {(strategicTheme || targetFriction || (desiredOutcomes && desiredOutcomes.length > 0)) && (
          <ProfileSection
            kicker="01"
            title="Strategic Context"
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {strategicTheme && (
                <Detail
                  label="Strategic Theme"
                  value={strategicTheme}
                  meta={strategicThemeId}
                />
              )}
              {targetFriction && (
                <Detail
                  label="Target Friction"
                  value={targetFriction}
                  meta={targetFrictionId}
                />
              )}
            </div>
            {desiredOutcomes && desiredOutcomes.length > 0 && (
              <div className="mt-4">
                <p className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500 m-0 mb-2">
                  Desired Outcomes
                </p>
                <ul className="m-0 pl-4 space-y-1 list-disc text-[10.5pt] text-gray-800 leading-[1.5]">
                  {desiredOutcomes.map((outcome, i) => (
                    <li key={i}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}
          </ProfileSection>
        )}

        {/* 2. Pattern Architecture */}
        {(primaryPattern || alternativePattern || patternRationale || hitl) && (
          <ProfileSection
            kicker="02"
            title="Pattern Architecture"
          >
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              {primaryPattern && (
                <Detail
                  label="Primary Pattern"
                  value={prettyPattern(primaryPattern)}
                />
              )}
              {agenticPattern && agenticPattern !== primaryPattern && (
                <Detail
                  label="Agentic Pattern"
                  value={prettyPattern(agenticPattern)}
                />
              )}
              {alternativePattern && (
                <Detail
                  label="Alternative"
                  value={prettyPattern(alternativePattern)}
                />
              )}
            </div>
            {patternRationale && (
              <p className="text-[10.5pt] leading-[1.55] text-gray-800 mt-3 mb-0">
                <span className="font-semibold text-[#001278]">Rationale. </span>
                {patternRationale}
              </p>
            )}
            {hitl && (
              <div className="mt-3 rounded-md border-l-[3px] border-[#36bf78] bg-[#36bf78]/[0.06] py-2 px-3">
                <p className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] text-[#0f5132] m-0 mb-1">
                  Human-in-the-Loop Checkpoint
                </p>
                <p className="text-[10.5pt] leading-[1.5] text-gray-900 m-0">
                  {hitl}
                </p>
              </div>
            )}
          </ProfileSection>
        )}

        {/* 3. Implementation Profile */}
        {((dataTypes && dataTypes.length > 0) ||
          (aiPrimitives && aiPrimitives.length > 0) ||
          (integrations && integrations.length > 0)) && (
          <ProfileSection
            kicker="03"
            title="Implementation Profile"
          >
            <div className="space-y-3">
              {dataTypes && dataTypes.length > 0 && (
                <TokenRow label="Data Types" tokens={dataTypes} />
              )}
              {aiPrimitives && aiPrimitives.length > 0 && (
                <TokenRow label="AI Primitives" tokens={aiPrimitives} />
              )}
              {integrations && integrations.length > 0 && (
                <TokenRow label="Integrations" tokens={integrations} />
              )}
            </div>
          </ProfileSection>
        )}

        {/* Token Economics has its own dedicated page — see TokenEconomicsSection. */}
      </div>

      {/* Footer baseline */}
      <div className="intro-footer pt-4 mt-6 border-t border-gray-200 flex items-end justify-between">
        <p className="text-[9pt] text-gray-500 m-0">
          Prepared {generatedDate}
        </p>
        <p className="text-[9pt] text-gray-500 m-0">
          Confidential · BlueAlly
        </p>
      </div>
    </section>
  );
}

function prettyPattern(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProfileSection({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="report-card">
      <div className="flex items-baseline gap-3 mb-3 keep-with-next">
        <span className="text-[8.5pt] font-mono text-[#02a2fd] tracking-tight">
          {kicker}
        </span>
        <h3 className="text-[13pt] font-semibold text-[#001278] m-0 leading-tight">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div>
      <p className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500 m-0">
        {label}
        {meta && (
          <span className="ml-2 font-mono text-gray-400 normal-case tracking-tight">
            {meta}
          </span>
        )}
      </p>
      <p className="text-[10.5pt] text-[#001278] font-medium mt-1 mb-0 leading-snug">
        {value}
      </p>
    </div>
  );
}

function TokenRow({ label, tokens }: { label: string; tokens: string[] }) {
  return (
    <div>
      <p className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500 m-0 mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((t, i) => (
          <Chip key={`${t}-${i}`} label={t} tone="muted" />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "primary" | "accent" | "muted";
}) {
  const styles =
    tone === "primary"
      ? "bg-[#001278] text-white border-transparent"
      : tone === "accent"
        ? "bg-[#02a2fd]/10 text-[#001278] border-[#02a2fd]/30"
        : "bg-gray-50 text-gray-800 border-gray-200";
  return (
    <span
      className={`inline-flex items-center text-[9.5pt] font-medium px-2 py-[2px] rounded border ${styles}`}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

function SimpleSectionHeader({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <header className="mb-7 keep-with-next">
      <p className="text-[10pt] font-semibold tracking-[0.22em] uppercase text-[#02a2fd] mb-2 m-0">
        {kicker}
      </p>
      <h2 className="text-[22pt] font-bold text-[#001278] m-0 leading-tight">
        {title}
      </h2>
      <div className="mt-3 h-[2.5pt] w-[0.5in] bg-[#36bf78] rounded-sm" />
    </header>
  );
}

function DiagramFrame({
  title,
  description,
  code,
  id,
}: {
  title: string;
  description: string;
  code: string;
  id: string;
}) {
  return (
    <div className="report-card mb-8 last:mb-0">
      <div className="keep-with-next mb-2">
        <h3 className="text-[14pt] font-semibold text-[#001278] m-0">
          {title}
        </h3>
        <p className="text-[10pt] text-gray-600 mt-1 mb-0">{description}</p>
      </div>
      <div className="diagram-frame border border-gray-200 rounded-lg p-4 bg-white mt-3">
        <MermaidDiagram code={code} id={id} printMode />
      </div>
    </div>
  );
}

function PRDPage({
  prd,
  useCaseId,
  useCaseName,
}: {
  prd: any;
  useCaseId: string;
  useCaseName: string;
}) {
  const present = SECTION_MAP.filter((s) => !!getSectionContent(prd, s));
  if (present.length === 0) return null;

  return (
    <section
      className="report-page break-before"
      id={`uc-${useCaseId}-prd`}
    >
      <SimpleSectionHeader
        kicker="Product Requirements"
        title="Product Requirements Document"
      />

      <p className="text-[10.5pt] text-gray-600 mb-6 keep-with-next max-w-[6.5in]">
        Twelve sections, AI-drafted from the upstream assessment data and
        edited for fidelity to <em>{useCaseName}</em>.
      </p>

      <div className="space-y-5">
        {present.map((section) => {
          const content = getSectionContent(prd, section)!;
          return (
            <div
              key={section.key}
              className="report-card border-l-2 border-[#02a2fd]/40 pl-4"
            >
              <h3 className="text-[12pt] font-semibold text-[#001278] m-0 mb-2 keep-with-next">
                {section.label}
              </h3>
              <div className="text-[10.5pt] leading-relaxed text-gray-800 whitespace-pre-wrap">
                {content}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
