import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { projects, architectures, shareLinks } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import SharedReportContent from "./shared-report-content";

function parseCurrency(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.replace(/[$,]/g, "");
  if (cleaned.includes("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.includes("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned) || 0;
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

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
    .where(
      and(
        eq(shareLinks.shareCode, code),
        gt(shareLinks.expiresAt, new Date())
      )
    );

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

  // Calculate totals
  let totalValue = 0;
  filteredArchs.forEach((a) => {
    const fi = a.financialImpact as any;
    totalValue += parseCurrency(fi?.benefit?.totalAnnualValue);
  });

  // Serialize data for the client component
  const serializedArchs = filteredArchs.map((a) => ({
    id: a.id,
    useCaseId: a.useCaseId,
    useCaseName: a.useCaseName,
    implementationPhase: a.implementationPhase,
    systemArchitecture: a.systemArchitecture,
    agenticWorkflow: a.agenticWorkflow,
    dataArchitecture: a.dataArchitecture,
    governanceModel: a.governanceModel,
    financialImpact: a.financialImpact,
    prdContent: a.prdContent,
  }));

  return (
    <SharedReportContent
      project={{
        name: project.name,
        companyName: project.companyName,
        industry: project.industry || "",
      }}
      architectures={serializedArchs}
      totalValue={totalValue > 0 ? fmtCurrency(totalValue) : "—"}
    />
  );
}
