import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, architectures } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/projects/:projectId — Get project with all architectures.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const ownerToken = request.headers.get("x-owner-token");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerToken, ownerToken)));

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const archs = await db
    .select()
    .from(architectures)
    .where(eq(architectures.projectId, projectId));

  return NextResponse.json({ project, architectures: archs });
}

/**
 * DELETE /api/projects/:projectId — Delete a project and its architectures.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const ownerToken = request.headers.get("x-owner-token");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerToken, ownerToken)));

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Delete architectures first, then project
  await db.delete(architectures).where(eq(architectures.projectId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));

  return NextResponse.json({ deleted: true });
}
