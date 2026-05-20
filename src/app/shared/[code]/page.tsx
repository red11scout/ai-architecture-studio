import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { projects, architectures, shareLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SharedReportContent from "./shared-report-content";


export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Find share link
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.shareCode, code));

  if (!link) notFound();

  // Load project and architectures
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, link.projectId));

  if (!project) notFound();

  const allArchs = await db
    .select()
    .from(architectures)
    .where(eq(architectures.projectId, project.id));

  // Respect scope filtering
  let filteredArchs = allArchs;
  if ((link as any).scope === "use_case" && (link as any).scopeId) {
    filteredArchs = allArchs.filter(
      (a) => a.useCaseId === (link as any).scopeId
    );
    if (filteredArchs.length === 0) filteredArchs = allArchs; // fallback
  }

  // Serialize data for the client component. Include businessValueMap +
  // estimatedWeeks because ReportDocument's Token Economics derivations
  // need description + dataTypes from businessValueMap.useCase.
  const serializedArchs = filteredArchs.map((a) => ({
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

  const scope: "use_case" | "portfolio" =
    (link as any).scope === "use_case" ? "use_case" : "portfolio";

  return (
    <SharedReportContent
      project={{
        name: project.name,
        companyName: project.companyName,
        industry: project.industry || "",
      }}
      architectures={serializedArchs}
      scope={scope}
    />
  );
}
