"use client";

import {
  ReportDocument,
  type ReportArchitecture,
  type ReportProject,
} from "@/components/report/report-document";

interface SharedArch {
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

/**
 * Public shared report. Renders the same C-Suite report used by the in-app
 * print routes — Portfolio Token Summary, per-use-case Token Economics,
 * Architecture Diagrams, and PRD — so the shared link a customer opens is
 * identical to the in-app "Download Portfolio PDF".
 *
 * autoPrint is intentionally off here: shared-link viewers should land on
 * the report and choose Print/Save PDF themselves from the toolbar.
 */
export default function SharedReportContent({
  project,
  architectures,
  scope,
}: {
  project: ReportProject;
  architectures: SharedArch[];
  scope: "use_case" | "portfolio";
}) {
  const archs: ReportArchitecture[] = architectures.map((a) => ({
    id: a.id,
    useCaseId: a.useCaseId,
    useCaseName: a.useCaseName,
    implementationPhase: a.implementationPhase,
    estimatedWeeks: a.estimatedWeeks,
    systemArchitecture: a.systemArchitecture,
    agenticWorkflow: a.agenticWorkflow,
    dataArchitecture: a.dataArchitecture,
    governanceModel: a.governanceModel,
    financialImpact: a.financialImpact,
    businessValueMap: a.businessValueMap,
    prdContent: a.prdContent,
  }));

  return (
    <ReportDocument
      project={project}
      architectures={archs}
      scope={scope}
      autoPrint={false}
    />
  );
}
