import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { architectures } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const anthropic = new Anthropic();

/**
 * POST /api/projects/:projectId/ai/prd
 * Generate a 10-section PRD for a specific use case using Claude.
 * Body: { useCaseId: string }
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

  let body: { useCaseId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.useCaseId) {
    return NextResponse.json({ error: "Missing useCaseId" }, { status: 400 });
  }

  // Fetch the architecture row
  const [arch] = await db
    .select()
    .from(architectures)
    .where(
      and(
        eq(architectures.projectId, projectId),
        eq(architectures.useCaseId, body.useCaseId)
      )
    );

  if (!arch) {
    return NextResponse.json({ error: "Architecture not found" }, { status: 404 });
  }

  const bvm = arch.businessValueMap as any;
  const sa = arch.systemArchitecture as any;
  const fi = arch.financialImpact as any;
  const gov = arch.governanceModel as any;

  // Build the structured prompt
  const prompt = `You are a senior AI solutions architect writing a Product Requirements Document (PRD) for an enterprise AI use case. Write in Hemingway's voice: short sentences, active verbs, no filler. Every number must come from the data provided — never invent financial figures.

USE CASE: ${arch.useCaseName}
DESCRIPTION: ${bvm?.useCase?.description || "N/A"}
PATTERN: ${sa?.pattern || "N/A"} (${bvm?.useCase?.primaryPattern || ""})
FUNCTION: ${bvm?.useCase?.function || "N/A"} > ${bvm?.useCase?.subFunction || "N/A"}
STRATEGIC THEME: ${bvm?.theme?.name || bvm?.useCase?.strategicTheme || "N/A"}
TARGET STATE: ${bvm?.theme?.targetState || "N/A"}

INTEGRATIONS: ${bvm?.useCase?.integrations?.join(", ") || "None specified"}
DATA TYPES: ${bvm?.useCase?.dataTypes?.join(", ") || "None specified"}
AI PRIMITIVES: ${bvm?.useCase?.aiPrimitives?.join(", ") || "None specified"}
HITL CHECKPOINT: ${gov?.hitlCheckpoint || "N/A"}
EPOCH FLAGS: ${gov?.epochFlags || "N/A"}

FINANCIAL METRICS (from deterministic calculation engine):
- Total Annual Value: ${fi?.benefit?.totalAnnualValue || "N/A"}
- Cost Savings: ${fi?.benefit?.costBenefit || "N/A"}
- Revenue Growth: ${fi?.benefit?.revenueBenefit || "N/A"}
- Risk Reduction: ${fi?.benefit?.riskBenefit || "N/A"}
- Cash Flow Improvement: ${fi?.benefit?.cashFlowBenefit || "N/A"}
- Probability of Success: ${fi?.benefit?.probabilityOfSuccess ? (fi.benefit.probabilityOfSuccess * 100).toFixed(0) + "%" : "N/A"}
- Readiness Score: ${fi?.readiness?.readinessScore?.toFixed(1) || "N/A"}/10
- Priority Tier: ${fi?.priority?.priorityTier || "N/A"}
- Recommended Phase: ${fi?.priority?.recommendedPhase || "N/A"}

DESIRED OUTCOMES: ${bvm?.useCase?.desiredOutcomes?.join("; ") || "N/A"}

Write a comprehensive PRD with exactly these 10 sections. Return ONLY valid JSON with no markdown formatting:

{
  "executiveSummary": "2-3 paragraph executive overview",
  "problemStatement": "Current friction, pain points, and business impact",
  "proposedSolution": "AI-powered solution description with architecture pattern",
  "userStories": "5-8 user stories in 'As a [role], I want [action], so that [benefit]' format",
  "technicalRequirements": "Infrastructure, integrations, data pipeline requirements",
  "aiModelSpecifications": "Model selection, prompt engineering, agentic pattern details",
  "hitlRequirements": "Human oversight checkpoints, escalation paths, approval workflows",
  "successMetrics": "KPIs, measurement methodology, target thresholds",
  "risksAndMitigations": "Technical, organizational, and ethical risks with mitigation strategies",
  "implementationTimeline": "Phased rollout plan with milestones and dependencies"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let prdContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      prdContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse PRD response" },
        { status: 500 }
      );
    }

    // Update the architecture row
    await db
      .update(architectures)
      .set({
        prdContent,
        prdGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(architectures.id, arch.id));

    return NextResponse.json({ prdContent });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
