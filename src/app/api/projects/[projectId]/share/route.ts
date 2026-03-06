import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, shareLinks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/projects/:projectId/share
 * Create a share link for the project.
 * Body: { scope?: "portfolio" | "use_case", scopeId?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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

  let body: { scope?: string; scopeId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Default scope
  }

  const shareCode = nanoid(12);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiry

  const [link] = await db
    .insert(shareLinks)
    .values({
      id: nanoid(12),
      projectId,
      shareCode,
      scope: body.scope || "portfolio",
      scopeId: body.scopeId || null,
      expiresAt,
    })
    .returning();

  return NextResponse.json({
    shareCode: link.shareCode,
    url: `/shared/${link.shareCode}`,
    expiresAt: link.expiresAt,
  });
}

/**
 * GET /api/projects/:projectId/share
 * List existing share links.
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

  const links = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.projectId, projectId));

  return NextResponse.json(links);
}
