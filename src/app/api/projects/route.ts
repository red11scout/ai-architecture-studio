import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, architectures } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { validateImport, parseImportedJSON } from "@/lib/parse-import";
import type { WorkflowExport } from "@/lib/types";

/**
 * GET /api/projects — List all projects for the owner.
 */
export async function GET(request: NextRequest) {
  const ownerToken = request.headers.get("x-owner-token");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerToken, ownerToken))
    .orderBy(desc(projects.createdAt));

  return NextResponse.json(result);
}

/**
 * POST /api/projects — Create a new project from an imported JSON file.
 *
 * Body: { rawImport: WorkflowExport }
 */
export async function POST(request: NextRequest) {
  const ownerToken = request.headers.get("x-owner-token");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
  }

  let body: { rawImport: WorkflowExport };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.rawImport) {
    return NextResponse.json({ error: "Missing rawImport field" }, { status: 400 });
  }

  // Validate the import
  const validation = validateImport(body.rawImport);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid import data", details: validation.errors },
      { status: 400 }
    );
  }

  // Parse the import
  const parsed = parseImportedJSON(body.rawImport);
  const projectId = nanoid(12);

  // Create the project
  const [project] = await db
    .insert(projects)
    .values({
      id: projectId,
      ownerToken,
      name: `${parsed.company.name} AI Architecture`,
      companyName: parsed.company.name,
      industry: parsed.company.industry,
      description: parsed.company.description || "",
      status: "in_progress",
      rawImport: body.rawImport,
      importVersion: body.rawImport.exportVersion || "2.1",
    })
    .returning();

  // Generate architecture rows for each use case
  const architectureRows = parsed.useCases.map((uc) => {
    const benefit = parsed.benefits.find((b) => b.useCaseId === uc.id);
    const readiness = parsed.readiness.find((r) => r.useCaseId === uc.id);
    const priority = parsed.priorities.find((p) => p.useCaseId === uc.id);
    const workflow = parsed.workflowMaps?.find((w) => w.useCaseId === uc.id);
    const friction = parsed.frictionPoints.find((f) => f.id === uc.targetFrictionId);
    const theme = parsed.strategicThemes.find((t) => t.id === uc.strategicThemeId);

    return {
      id: nanoid(12),
      projectId,
      useCaseId: uc.id,
      useCaseName: uc.name,
      maturityLevel: 2,
      // Store all related data for diagram engines to consume
      businessValueMap: {
        useCase: uc,
        theme,
        friction,
        benefit,
        priority,
        businessFunctions: parsed.businessFunctions.filter(
          (bf) => bf.strategicThemeId === uc.strategicThemeId
        ),
      },
      systemArchitecture: {
        useCase: uc,
        workflow,
        pattern: uc.agenticPattern,
      },
      agenticWorkflow: {
        useCase: uc,
        workflow,
        pattern: uc.agenticPattern,
        primitives: uc.aiPrimitives,
      },
      dataArchitecture: {
        useCase: uc,
        workflow,
        dataTypes: uc.dataTypes,
        integrations: uc.integrations,
      },
      governanceModel: {
        useCase: uc,
        hitlCheckpoint: uc.hitlCheckpoint,
        epochFlags: uc.epochFlags,
      },
      financialImpact: {
        benefit,
        readiness,
        priority,
      },
      canvasData: {
        businessObjective: theme
          ? `${theme.name}: ${theme.targetState}`
          : uc.strategicTheme,
        frictionPoints: friction?.frictionPoint || uc.targetFriction,
        aiUseCases: uc.name,
        usersRoles: friction?.role || "",
        dataSources: uc.dataTypes.join(", "),
        systemsApis: uc.integrations.join(", "),
        aiArchitecture: `${uc.primaryPattern} (${uc.agenticPattern})`,
        governanceHitl: uc.hitlCheckpoint,
        financialImpact: benefit?.totalAnnualValue || "N/A",
      },
      implementationPhase: priority?.recommendedPhase || null,
      estimatedWeeks: readiness?.timeToValue
        ? Math.round(readiness.timeToValue * 4.3)
        : null,
    };
  });

  if (architectureRows.length > 0) {
    await db.insert(architectures).values(architectureRows);
  }

  return NextResponse.json(
    {
      project,
      summary: validation.summary,
      architectureCount: architectureRows.length,
      warnings: validation.warnings,
    },
    { status: 201 }
  );
}
