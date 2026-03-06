"use client";

import { useProject } from "../../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Banknote,
  Layers,
  ArrowUpRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCurrency(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.replace(/[$,]/g, "");
  if (cleaned.includes("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.includes("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned) || 0;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  if (value === 0) return "$0";
  return `$${value.toFixed(0)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return `${tokens}`;
}

const tierBadgeClasses: Record<string, string> = {
  "Tier 1 — Champions":
    "bg-[#36bf78]/10 text-[#36bf78] border border-[#36bf78]/30",
  "Tier 2 — Quick Wins":
    "bg-[#02a2fd]/10 text-[#02a2fd] border border-[#02a2fd]/30",
  "Tier 3 — Strategic":
    "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  "Tier 4 — Foundation":
    "bg-gray-500/10 text-gray-500 border border-gray-500/30",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PortfolioDashboardPage() {
  const { project, architectures } = useProject();

  if (!project) return null;

  // Try to use pre-computed executive dashboard from rawImport
  const rawImport = (project as any).rawImport;
  const parsed = rawImport?.analysis;
  const execDash = parsed?.executiveDashboard;
  const scenarioData = parsed?.scenarioAnalysis;

  // Compute portfolio metrics from architecture data
  let totalAnnualValue = 0;
  let totalCostBenefit = 0;
  let totalRevenueBenefit = 0;
  let totalRiskBenefit = 0;
  let totalCashFlowBenefit = 0;

  const useCaseRows: Array<{
    rank: number;
    name: string;
    annualValue: number;
    priorityTier: string;
    monthlyTokens: number;
    priorityScore: number;
  }> = [];

  architectures.forEach((arch) => {
    const fi = arch.financialImpact as any;
    const benefit = fi?.benefit;
    const priority = fi?.priority;
    const readiness = fi?.readiness;

    const annualVal = parseCurrency(benefit?.totalAnnualValue);
    const costVal = parseCurrency(benefit?.costBenefit);
    const revenueVal = parseCurrency(benefit?.revenueBenefit);
    const riskVal = parseCurrency(benefit?.riskBenefit);
    const cashVal = parseCurrency(benefit?.cashFlowBenefit);

    totalAnnualValue += annualVal;
    totalCostBenefit += costVal;
    totalRevenueBenefit += revenueVal;
    totalRiskBenefit += riskVal;
    totalCashFlowBenefit += cashVal;

    useCaseRows.push({
      rank: 0,
      name: arch.useCaseName,
      annualValue: annualVal,
      priorityTier: priority?.priorityTier || "Unranked",
      monthlyTokens: readiness?.monthlyTokens || 0,
      priorityScore: priority?.priorityScore || 0,
    });
  });

  // Use execDash totals if available, otherwise use computed
  const displayTotalAnnual =
    execDash?.totalAnnualValue != null
      ? parseCurrency(execDash.totalAnnualValue)
      : totalAnnualValue;
  const displayCostBenefit =
    execDash?.totalCostBenefit != null
      ? parseCurrency(execDash.totalCostBenefit)
      : totalCostBenefit;
  const displayRevenueBenefit =
    execDash?.totalRevenueBenefit != null
      ? parseCurrency(execDash.totalRevenueBenefit)
      : totalRevenueBenefit;
  const displayRiskBenefit =
    execDash?.totalRiskBenefit != null
      ? parseCurrency(execDash.totalRiskBenefit)
      : totalRiskBenefit;
  const displayCashFlowBenefit =
    execDash?.totalCashFlowBenefit != null
      ? parseCurrency(execDash.totalCashFlowBenefit)
      : totalCashFlowBenefit;

  // Sort use cases by annual value descending and assign rank
  const topUseCases = (
    execDash?.topUseCases ??
    useCaseRows
      .sort((a, b) => b.annualValue - a.annualValue)
      .map((uc, i) => ({ ...uc, rank: i + 1, useCase: uc.name }))
  ) as Array<{
    rank: number;
    useCase?: string;
    name?: string;
    annualValue: number;
    priorityTier: string;
    monthlyTokens: number;
    priorityScore?: number;
  }>;

  // Scenario analysis
  const scenarios = scenarioData || null;

  const metrics = [
    {
      label: "Total Annual Value",
      value: formatCurrency(displayTotalAnnual),
      icon: DollarSign,
      color: "#36bf78",
    },
    {
      label: "Cost Benefit",
      value: formatCurrency(displayCostBenefit),
      icon: Banknote,
      color: "#02a2fd",
    },
    {
      label: "Revenue Benefit",
      value: formatCurrency(displayRevenueBenefit),
      icon: TrendingUp,
      color: "#001278",
    },
    {
      label: "Risk Benefit",
      value: formatCurrency(displayRiskBenefit),
      icon: ShieldCheck,
      color: "#f59e0b",
    },
    {
      label: "Cash Flow Benefit",
      value: formatCurrency(displayCashFlowBenefit),
      icon: ArrowUpRight,
      color: "#8b5cf6",
    },
    {
      label: "Use Cases",
      value: `${architectures.length}`,
      icon: Layers,
      color: "#02a2fd",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Executive Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Portfolio financial overview for {project.companyName}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${m.color}15` }}
                >
                  <m.icon
                    className="h-4 w-4"
                    style={{ color: m.color }}
                  />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Use Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Use Cases by Value</CardTitle>
        </CardHeader>
        <CardContent>
          {topUseCases.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No use case data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Use Case
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Annual Value
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Priority Tier
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Monthly Tokens
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topUseCases.map((uc, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-muted-foreground">
                        {uc.rank || idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {uc.useCase || uc.name}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        {formatCurrency(parseCurrency(uc.annualValue))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            tierBadgeClasses[uc.priorityTier] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {uc.priorityTier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {formatTokens(uc.monthlyTokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenario Analysis */}
      {scenarios && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scenario Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(
                [
                  {
                    key: "conservative" as const,
                    label: "Conservative",
                    color: "#6b7280",
                  },
                  {
                    key: "moderate" as const,
                    label: "Moderate",
                    color: "#02a2fd",
                  },
                  {
                    key: "aggressive" as const,
                    label: "Aggressive",
                    color: "#36bf78",
                  },
                ] as const
              ).map((scenario) => {
                const data = scenarios[scenario.key];
                if (!data) return null;
                return (
                  <div
                    key={scenario.key}
                    className="rounded-xl border border-border p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: scenario.color }}
                      />
                      <h3 className="font-semibold text-foreground">
                        {scenario.label}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          NPV
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {data.npv}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Annual Benefit
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {data.annualBenefit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Payback Period
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {data.paybackMonths} months
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback if no scenario data */}
      {!scenarios && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scenario Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm py-4 text-center">
              Scenario analysis data is not available for this project.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
