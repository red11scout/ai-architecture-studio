import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { projects, architectures, shareLinks } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

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

  const archs = await db
    .select()
    .from(architectures)
    .where(eq(architectures.projectId, project.id));

  // Calculate totals
  let totalValue = 0;
  archs.forEach((a) => {
    const fi = a.financialImpact as any;
    totalValue += parseCurrency(fi?.benefit?.totalAnnualValue);
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="bg-[#001278] text-white py-12 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blueally-logo-white.png"
              alt="BlueAlly"
              className="h-8"
            />
            <span className="text-sm text-blue-200">AI Solution Builder</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">{project.name}</h1>
          <p className="text-blue-200">
            {project.companyName} &middot; {project.industry}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-3xl font-bold text-[#001278]">{archs.length}</p>
            <p className="text-sm text-gray-500 mt-1">AI Use Cases</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-3xl font-bold text-[#36bf78]">
              {totalValue > 0 ? fmtCurrency(totalValue) : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total Annual Value</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-3xl font-bold text-[#02a2fd]">
              {new Set(
                archs.map((a) => (a.systemArchitecture as any)?.pattern || "")
              ).size}
            </p>
            <p className="text-sm text-gray-500 mt-1">AI Patterns</p>
          </div>
        </div>

        {/* Use cases */}
        <h2 className="text-xl font-bold mb-4 text-[#001278]">
          AI Use Cases
        </h2>
        <div className="space-y-4 mb-10">
          {archs.map((arch) => {
            const fi = arch.financialImpact as any;
            const sa = arch.systemArchitecture as any;
            return (
              <div
                key={arch.id}
                className="border border-gray-200 rounded-xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{arch.useCaseName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {sa?.pattern?.replace(/_/g, " ") || ""} &middot;{" "}
                      {arch.implementationPhase || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#36bf78]">
                      {String(fi?.benefit?.totalAnnualValue || "—")}
                    </p>
                    <p className="text-xs text-gray-500">Annual Value</p>
                  </div>
                </div>

                {/* Canvas preview */}
                {arch.canvasData != null && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: "Objective", key: "businessObjective" },
                      { label: "Friction", key: "frictionPoints" },
                      { label: "Data", key: "dataSources" },
                      { label: "Systems", key: "systemsApis" },
                      { label: "HITL", key: "governanceHitl" },
                      { label: "Architecture", key: "aiArchitecture" },
                    ].map(({ label, key }) => (
                      <div
                        key={key}
                        className="bg-gray-50 rounded p-2"
                      >
                        <p className="font-semibold text-gray-700 mb-0.5">
                          {label}
                        </p>
                        <p className="text-gray-500 line-clamp-2">
                          {(arch.canvasData as any)?.[key] || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blueally-logo-blue.png"
            alt="BlueAlly"
            className="h-6"
          />
          <p className="text-xs text-gray-400">
            AI Solution Builder &middot; BlueAlly
          </p>
        </div>
      </div>
    </div>
  );
}
