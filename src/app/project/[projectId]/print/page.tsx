"use client";

import { useProject } from "../layout";
import { ReportDocument, type ReportArchitecture } from "@/components/report/report-document";

export default function PortfolioPrintPage() {
  const { project, architectures, loading } = useProject();

  if (loading || !project) {
    return <div className="p-8">Loading portfolio...</div>;
  }

  const reportArchs: ReportArchitecture[] = architectures.map((a) => ({
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
      project={{
        name: project.name,
        companyName: project.companyName,
        industry: project.industry || "",
      }}
      architectures={reportArchs}
      scope="portfolio"
      autoPrint
    />
  );
}
