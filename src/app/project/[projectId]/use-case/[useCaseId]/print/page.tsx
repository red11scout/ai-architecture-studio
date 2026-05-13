"use client";

import { useParams } from "next/navigation";
import { useProject } from "../../../layout";
import { ReportDocument, type ReportArchitecture } from "@/components/report/report-document";

export default function PrintPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { project, architectures } = useProject();

  if (!project) {
    return <div className="p-8">Loading...</div>;
  }

  const arch = architectures.find((a) => a.useCaseId === params.useCaseId);
  if (!arch) {
    return <div className="p-8">Use case not found.</div>;
  }

  const reportArchs: ReportArchitecture[] = [
    {
      id: arch.id,
      useCaseId: arch.useCaseId,
      useCaseName: arch.useCaseName,
      implementationPhase: arch.implementationPhase,
      estimatedWeeks: arch.estimatedWeeks,
      systemArchitecture: arch.systemArchitecture,
      agenticWorkflow: arch.agenticWorkflow,
      dataArchitecture: arch.dataArchitecture,
      governanceModel: arch.governanceModel,
      financialImpact: arch.financialImpact,
      businessValueMap: arch.businessValueMap,
      prdContent: arch.prdContent,
    },
  ];

  return (
    <ReportDocument
      project={{
        name: project.name,
        companyName: project.companyName,
        industry: project.industry || "",
      }}
      architectures={reportArchs}
      scope="use_case"
      autoPrint
    />
  );
}
