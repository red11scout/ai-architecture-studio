import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, architectures } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/projects/:projectId/use-case/:useCaseId/export?format=json
 * Export a single use case's data as downloadable JSON.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; useCaseId: string }> }
) {
  const { projectId, useCaseId } = await params;
  const ownerToken = request.headers.get("x-owner-token");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
  }

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.ownerToken, ownerToken))
    );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Find the use case architecture
  const [arch] = await db
    .select()
    .from(architectures)
    .where(
      and(
        eq(architectures.projectId, projectId),
        eq(architectures.useCaseId, useCaseId)
      )
    );

  if (!arch) {
    return NextResponse.json({ error: "Use case not found" }, { status: 404 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      companyName: project.companyName,
      industry: project.industry,
    },
    useCase: {
      id: arch.useCaseId,
      name: arch.useCaseName,
      implementationPhase: arch.implementationPhase,
      estimatedWeeks: arch.estimatedWeeks,
      maturityLevel: arch.maturityLevel,
    },
    systemArchitecture: arch.systemArchitecture,
    agenticWorkflow: arch.agenticWorkflow,
    dataArchitecture: arch.dataArchitecture,
    governanceModel: arch.governanceModel,
    businessValueMap: arch.businessValueMap,
    financialImpact: arch.financialImpact,
    prdContent: arch.prdContent,
    prdGeneratedAt: arch.prdGeneratedAt,
  };

  const filename = `${project.companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${arch.useCaseName.replace(/[^a-zA-Z0-9]/g, "_")}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
