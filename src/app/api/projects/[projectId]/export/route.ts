import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, architectures } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import ExcelJS from "exceljs";

/** Normalize legacy "Q1"-"Q4" to "Phase 1"-"Phase 4" */
function normalizePhase(phase: string | null | undefined): string {
  if (!phase) return "";
  const qMatch = phase.match(/^Q(\d)$/i);
  if (qMatch) return `Phase ${qMatch[1]}`;
  return phase;
}

function parseCurrency(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.replace(/[$,]/g, "");
  if (cleaned.includes("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.includes("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned) || 0;
}

/**
 * GET /api/projects/:projectId/export?format=excel
 * Export project data as Excel workbook.
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
    .where(
      and(eq(projects.id, projectId), eq(projects.ownerToken, ownerToken))
    );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const archs = await db
    .select()
    .from(architectures)
    .where(eq(architectures.projectId, projectId));

  const wb = new ExcelJS.Workbook();

  // --- Sheet 1: Executive Summary ---
  const summarySheet = wb.addWorksheet("Executive Summary");
  summarySheet.columns = [
    { header: "Field", key: "field", width: 30 },
    { header: "Value", key: "value", width: 50 },
  ];
  summarySheet.addRow({ field: "Company", value: project.companyName });
  summarySheet.addRow({ field: "Industry", value: project.industry });
  summarySheet.addRow({ field: "Project", value: project.name });
  summarySheet.addRow({ field: "Use Cases", value: archs.length });

  let total = 0;
  archs.forEach((a) => {
    total += parseCurrency((a.financialImpact as any)?.benefit?.totalAnnualValue);
  });
  summarySheet.addRow({ field: "Total Annual Value", value: `$${(total / 1_000_000).toFixed(1)}M` });

  // Style header row
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF001278" },
  };

  // --- Sheet 2: Use Cases ---
  const ucSheet = wb.addWorksheet("Use Cases");
  ucSheet.columns = [
    { header: "Use Case", key: "name", width: 35 },
    { header: "Pattern", key: "pattern", width: 25 },
    { header: "Phase", key: "phase", width: 12 },
    { header: "Annual Value", key: "value", width: 18 },
    { header: "Priority Tier", key: "tier", width: 20 },
    { header: "Readiness", key: "readiness", width: 12 },
  ];

  archs.forEach((a) => {
    const fi = a.financialImpact as any;
    const sa = a.systemArchitecture as any;
    ucSheet.addRow({
      name: a.useCaseName,
      pattern: sa?.pattern?.replace(/_/g, " ") || "",
      phase: normalizePhase(a.implementationPhase),
      value: fi?.benefit?.totalAnnualValue || "",
      tier: fi?.priority?.priorityTier || "",
      readiness: fi?.readiness?.readinessScore?.toFixed(1) || "",
    });
  });

  ucSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ucSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF02A2FD" },
  };

  // --- Sheet 3: Financial ---
  const finSheet = wb.addWorksheet("Financial");
  finSheet.columns = [
    { header: "Use Case", key: "name", width: 35 },
    { header: "Cost Savings", key: "cost", width: 18 },
    { header: "Revenue Growth", key: "revenue", width: 18 },
    { header: "Risk Reduction", key: "risk", width: 18 },
    { header: "Cash Flow", key: "cashflow", width: 18 },
    { header: "Total Annual", key: "total", width: 18 },
    { header: "Probability", key: "prob", width: 14 },
  ];

  archs.forEach((a) => {
    const b = (a.financialImpact as any)?.benefit;
    finSheet.addRow({
      name: a.useCaseName,
      cost: b?.costBenefit || "",
      revenue: b?.revenueBenefit || "",
      risk: b?.riskBenefit || "",
      cashflow: b?.cashFlowBenefit || "",
      total: b?.totalAnnualValue || "",
      prob: b?.probabilityOfSuccess ? `${(b.probabilityOfSuccess * 100).toFixed(0)}%` : "",
    });
  });

  finSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  finSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF36BF78" },
  };

  // --- Sheet 4: Architecture ---
  const archSheet = wb.addWorksheet("Architecture");
  archSheet.columns = [
    { header: "Use Case", key: "name", width: 35 },
    { header: "Primary Pattern", key: "primary", width: 20 },
    { header: "Agentic Pattern", key: "agentic", width: 22 },
    { header: "Integrations", key: "integrations", width: 40 },
    { header: "Data Types", key: "dataTypes", width: 40 },
    { header: "AI Primitives", key: "primitives", width: 30 },
  ];

  archs.forEach((a) => {
    const uc = (a.businessValueMap as any)?.useCase;
    archSheet.addRow({
      name: a.useCaseName,
      primary: uc?.primaryPattern || "",
      agentic: uc?.agenticPattern?.replace(/_/g, " ") || "",
      integrations: uc?.integrations?.join(", ") || "",
      dataTypes: uc?.dataTypes?.join(", ") || "",
      primitives: uc?.aiPrimitives?.join(", ") || "",
    });
  });

  archSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  archSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF001278" },
  };

  // --- Sheet 5: Roadmap ---
  const roadmapSheet = wb.addWorksheet("Roadmap");
  roadmapSheet.columns = [
    { header: "Use Case", key: "name", width: 35 },
    { header: "Phase", key: "phase", width: 12 },
    { header: "Est. Weeks", key: "weeks", width: 14 },
    { header: "Priority Score", key: "score", width: 16 },
    { header: "Value Score", key: "valueScore", width: 14 },
    { header: "Readiness Score", key: "readinessScore", width: 16 },
  ];

  archs.forEach((a) => {
    const p = (a.financialImpact as any)?.priority;
    roadmapSheet.addRow({
      name: a.useCaseName,
      phase: normalizePhase(a.implementationPhase),
      weeks: a.estimatedWeeks || "",
      score: p?.priorityScore?.toFixed(1) || "",
      valueScore: p?.valueScore?.toFixed(1) || "",
      readinessScore: p?.readinessScore?.toFixed(1) || "",
    });
  });

  roadmapSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  roadmapSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF59E0B" },
  };

  // --- Sheet 6: Governance ---
  const govSheet = wb.addWorksheet("Governance");
  govSheet.columns = [
    { header: "Use Case", key: "name", width: 35 },
    { header: "HITL Checkpoint", key: "hitl", width: 50 },
    { header: "Epoch Flag", key: "flag", width: 14 },
  ];

  archs.forEach((a) => {
    const g = a.governanceModel as any;
    govSheet.addRow({
      name: a.useCaseName,
      hitl: g?.hitlCheckpoint || "",
      flag: g?.epochFlags || "",
    });
  });

  govSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  govSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEF4444" },
  };

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${project.companyName.replace(/[^a-zA-Z0-9]/g, "_")}_AI_Architecture.xlsx"`,
    },
  });
}
