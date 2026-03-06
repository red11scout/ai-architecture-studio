import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { architectures } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Helper: generate a single PRD for one use case
// ---------------------------------------------------------------------------
async function generateSinglePRD(arch: any) {
  const bvm = arch.businessValueMap as any;
  const sa = arch.systemArchitecture as any;
  const fi = arch.financialImpact as any;
  const gov = arch.governanceModel as any;
  const aw = arch.agenticWorkflow as any;
  const da = arch.dataArchitecture as any;

  // Extract agent/tool details from system architecture
  const pattern = sa?.pattern || "N/A";
  const integrations = bvm?.useCase?.integrations || [];
  const dataTypes = bvm?.useCase?.dataTypes || [];
  const aiPrimitives = bvm?.useCase?.aiPrimitives || [];
  const desiredOutcomes = bvm?.useCase?.desiredOutcomes || [];

  // Extract workflow steps if available
  const workflowSteps = aw?.workflow?.targetState
    ?.filter((s: any) => s.isAIEnabled)
    ?.map((s: any) => s.step || s.name)
    ?.join(", ") || "N/A";

  // Extract readiness sub-scores
  const readiness = fi?.readiness || {};

  const prompt = `You are a senior AI solutions architect writing a Product Requirements Document (PRD) that an engineering team will use to BUILD this AI application. Write in Hemingway's voice: short sentences, active verbs, no filler. Be SPECIFIC — reference the exact integration names, data types, and agent names provided. Every financial figure MUST come from the data below — never invent numbers.

=== USE CASE CONTEXT ===
NAME: ${arch.useCaseName}
DESCRIPTION: ${bvm?.useCase?.description || "N/A"}
FUNCTION: ${bvm?.useCase?.function || "N/A"} > ${bvm?.useCase?.subFunction || "N/A"}
STRATEGIC THEME: ${bvm?.theme?.name || bvm?.useCase?.strategicTheme || "N/A"}
TARGET STATE: ${bvm?.theme?.targetState || "N/A"}
CURRENT FRICTION: ${bvm?.useCase?.targetFriction || "N/A"}

=== ARCHITECTURE ===
AGENTIC PATTERN: ${pattern} (primary: ${bvm?.useCase?.primaryPattern || pattern}, alternative: ${bvm?.useCase?.alternativePattern || "N/A"})
INTEGRATIONS: ${integrations.join(", ") || "None specified"}
DATA TYPES: ${dataTypes.join(", ") || "None specified"}
AI PRIMITIVES: ${aiPrimitives.join(", ") || "None specified"}
AI-ENABLED WORKFLOW STEPS: ${workflowSteps}
PATTERN RATIONALE: ${bvm?.useCase?.patternRationale || "N/A"}

=== GOVERNANCE ===
HITL CHECKPOINT: ${gov?.hitlCheckpoint || "N/A"}
EPOCH FLAGS: ${gov?.epochFlags || "N/A"}

=== FINANCIAL METRICS (from deterministic calculation engine — use these exact figures) ===
Total Annual Value: ${fi?.benefit?.totalAnnualValue || "N/A"}
Cost Savings: ${fi?.benefit?.costBenefit || "N/A"}
Revenue Growth: ${fi?.benefit?.revenueBenefit || "N/A"}
Risk Reduction: ${fi?.benefit?.riskBenefit || "N/A"}
Cash Flow Improvement: ${fi?.benefit?.cashFlowBenefit || "N/A"}
Probability of Success: ${fi?.benefit?.probabilityOfSuccess ? (fi.benefit.probabilityOfSuccess * 100).toFixed(0) + "%" : "N/A"}
Priority Tier: ${fi?.priority?.priorityTier || "N/A"}
Recommended Phase: ${fi?.priority?.recommendedPhase || "N/A"}
Estimated Time to Value: ${arch.estimatedWeeks ? arch.estimatedWeeks + " weeks" : "N/A"}

=== READINESS SCORES (out of 10) ===
Overall Readiness: ${readiness.readinessScore?.toFixed(1) || "N/A"}/10
Data Availability: ${readiness.dataAvailability || "N/A"}/10
Technical Infrastructure: ${readiness.technicalInfrastructure || "N/A"}/10
Organizational Capacity: ${readiness.organizationalCapacity || "N/A"}/10
Governance Maturity: ${readiness.governance || "N/A"}/10

=== DESIRED OUTCOMES ===
${desiredOutcomes.map((o: string, i: number) => `${i + 1}. ${o}`).join("\n") || "N/A"}

=== INSTRUCTIONS ===
Write a comprehensive, ACTIONABLE PRD with exactly these 12 sections. This document should be detailed enough that an engineering team can build the application from it. Return ONLY valid JSON with no markdown formatting.

Each section MUST reference SPECIFIC names from the data above (integration names, data types, agent patterns, financial figures). Do NOT write generic prose — write build specifications.

{
  "executiveSummary": "2-3 paragraphs. State the use case name, the ${pattern} agentic pattern, the specific annual value (${fi?.benefit?.totalAnnualValue || 'N/A'}), priority tier (${fi?.priority?.priorityTier || 'N/A'}), and what the system does in concrete terms. Reference the strategic theme and target state.",

  "problemStatement": "Describe the current friction (${bvm?.useCase?.targetFriction || 'the identified friction point'}). Quantify the business impact using the financial metrics. Identify who is affected and what the current manual workflow looks like. Be specific about pain points.",

  "solutionArchitecture": "Describe the ${pattern} pattern implementation in detail. Name each agent in the system and its specific responsibility. For each of the integrations (${integrations.join(', ')}), describe what data flows to/from it. Describe the end-to-end data flow from user input through agents to final output. Include a component-level breakdown.",

  "dataStrategy": "For each data type (${dataTypes.join(', ')}), specify: source system, expected volume/frequency, pipeline type (ETL batch vs real-time streaming), storage tier (relational DB, vector store, or knowledge graph), and data quality requirements. Include data freshness SLAs and retention policies.",

  "aiModelSpecifications": "Specify the recommended LLM (e.g., Claude Sonnet for the primary agent). Define the agentic pattern (${pattern}) mechanics: how agents coordinate, what each primitive (${aiPrimitives.join(', ')}) does in this context, context window requirements, expected tokens per request, and accuracy/reliability targets. Include prompt engineering approach.",

  "userStoriesAcceptanceCriteria": "Write 6-8 user stories in 'As a [specific role], I want [specific action], so that [measurable outcome]' format. Each story MUST have 2-3 testable acceptance criteria written as Given/When/Then or specific measurable conditions. Cover: primary workflow, error handling, HITL override, reporting/analytics.",

  "apiIntegrationSpecs": "For each integration (${integrations.join(', ')}): specify the API type (REST/GraphQL/SDK), authentication method, key endpoints/operations needed, expected payload structure, rate limits, error handling strategy, and retry policy. Include webhook/callback patterns if applicable.",

  "guardrailsSafety": "Define a three-tier boundary system: ALWAYS (automated guardrails: PII detection, prompt injection defense, input validation, output toxicity filtering, hallucination detection), ASK (human-in-the-loop checkpoint: ${gov?.hitlCheckpoint || 'define checkpoint'}), NEVER (prohibited actions and hard boundaries). Include bias mitigation strategy and compliance requirements. Reference epoch risk level: ${gov?.epochFlags || 'N/A'}.",

  "evaluationFramework": "Define test categories: unit tests (per-agent), integration tests (end-to-end flow), evaluation suite (accuracy, coherence, safety, usefulness), and user acceptance tests. For each category, specify: test scenarios, evaluation metrics with target thresholds, benchmark dataset requirements, and pass/fail criteria. Include A/B test plan for production rollout.",

  "implementationRoadmap": "Create a phased plan aligned to ${fi?.priority?.recommendedPhase || 'the recommended phase'} with week-level milestones over ${arch.estimatedWeeks || 12} weeks. Phase 1: Foundation (infra, data pipelines, security). Phase 2: Core (agent implementation, ${pattern} orchestration, HITL). Phase 3: Integration (${integrations.join(', ')}, end-to-end testing). Phase 4: Launch (monitoring, training, production deployment). Each phase: deliverables, team requirements, go/no-go gates, dependencies.",

  "successMetrics": "Define 6-8 specific KPIs tied to the financial metrics. For each: metric name, target value (reference the provided figures), measurement methodology, monitoring frequency, baseline (current state), and escalation threshold. Include both leading indicators (adoption, usage) and lagging indicators (ROI, cost savings).",

  "risksAndMitigations": "Identify 6-8 risks across categories: Technical (model accuracy, integration failures, scaling), Organizational (change management, skill gaps, adoption), Data (quality, availability scored at ${readiness.dataAvailability || 'N/A'}/10, privacy), Ethical (bias, fairness, transparency). For each risk: severity (High/Medium/Low), likelihood, specific mitigation strategy, and responsible owner role."
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse the JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const prdContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

  // Update the architecture row
  await db
    .update(architectures)
    .set({
      prdContent,
      prdGeneratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(architectures.id, arch.id));

  return prdContent;
}

// ---------------------------------------------------------------------------
// POST /api/projects/:projectId/ai/prd
// Single: { useCaseId: string }
// Bulk:   { useCaseIds: string[] | "all" }
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const ownerToken = request.headers.get("x-owner-token");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing owner token" }, { status: 401 });
  }

  let body: { useCaseId?: string; useCaseIds?: string[] | "all" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // -------------------------------------------------------------------------
  // Bulk mode
  // -------------------------------------------------------------------------
  if (body.useCaseIds) {
    let archs: any[];

    if (body.useCaseIds === "all") {
      archs = await db
        .select()
        .from(architectures)
        .where(eq(architectures.projectId, projectId));
    } else {
      archs = [];
      for (const ucId of body.useCaseIds) {
        const [arch] = await db
          .select()
          .from(architectures)
          .where(
            and(
              eq(architectures.projectId, projectId),
              eq(architectures.useCaseId, ucId)
            )
          );
        if (arch) archs.push(arch);
      }
    }

    if (archs.length === 0) {
      return NextResponse.json(
        { error: "No architectures found" },
        { status: 404 }
      );
    }

    const results: { useCaseId: string; useCaseName: string; status: string; error?: string }[] = [];

    for (const arch of archs) {
      try {
        await generateSinglePRD(arch);
        results.push({
          useCaseId: arch.useCaseId,
          useCaseName: arch.useCaseName,
          status: "success",
        });
      } catch (e: any) {
        results.push({
          useCaseId: arch.useCaseId,
          useCaseName: arch.useCaseName,
          status: "error",
          error: e.message || "Generation failed",
        });
      }

      // 1-second delay between calls to avoid rate limits
      if (archs.indexOf(arch) < archs.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return NextResponse.json({ results });
  }

  // -------------------------------------------------------------------------
  // Single mode (existing behavior)
  // -------------------------------------------------------------------------
  if (!body.useCaseId) {
    return NextResponse.json(
      { error: "Missing useCaseId or useCaseIds" },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { error: "Architecture not found" },
      { status: 404 }
    );
  }

  try {
    const prdContent = await generateSinglePRD(arch);
    return NextResponse.json({ prdContent });
  } catch (e: any) {
    if (e.message?.includes("parse")) {
      return NextResponse.json(
        { error: "Failed to parse PRD response" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: e.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
