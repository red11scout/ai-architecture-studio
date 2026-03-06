"use client";

import { useParams } from "next/navigation";
import {
  DollarSign, TrendingUp, Shield, Zap, Percent,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "../../../layout";

function parseCurrency(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.replace(/[$,]/g, "");
  if (cleaned.includes("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.includes("K")) return parseFloat(cleaned) * 1_000;
  if (cleaned.includes("B")) return parseFloat(cleaned) * 1_000_000_000;
  return parseFloat(cleaned) || 0;
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const COLORS = ["#02a2fd", "#36bf78", "#001278", "#f59e0b"];

export default function FinancialPage() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const { architectures } = useProject();

  const arch = architectures.find(
    (a) => a.useCaseId === params.useCaseId
  ) as any;

  const fi = arch?.financialImpact;
  const benefit = fi?.benefit;
  const readiness = fi?.readiness;
  const priority = fi?.priority;

  const costVal = parseCurrency(benefit?.costBenefit);
  const revenueVal = parseCurrency(benefit?.revenueBenefit);
  const riskVal = parseCurrency(benefit?.riskBenefit);
  const cashFlowVal = parseCurrency(benefit?.cashFlowBenefit);
  const totalVal = parseCurrency(benefit?.totalAnnualValue);
  const probability = benefit?.probabilityOfSuccess ?? 0;

  const breakdownData = [
    { name: "Cost Savings", value: costVal },
    { name: "Revenue Growth", value: revenueVal },
    { name: "Risk Reduction", value: riskVal },
    { name: "Cash Flow", value: cashFlowVal },
  ].filter((d) => d.value > 0);

  const barData = breakdownData.map((d) => ({
    ...d,
    display: fmtCurrency(d.value),
  }));

  return (
    <div className="p-8">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#36bf78]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#36bf78]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalVal > 0 ? fmtCurrency(totalVal) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Annual Value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#02a2fd]/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-[#02a2fd]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {probability > 0 ? `${(probability * 100).toFixed(0)}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Probability of Success
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#001278]/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#001278]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {readiness?.readinessScore
                    ? `${readiness.readinessScore.toFixed(1)}`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Readiness Score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {priority?.priorityTier || "—"}
                </p>
                <p className="text-xs text-muted-foreground">Priority Tier</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Benefit breakdown bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Benefit Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v: number) => fmtCurrency(v)}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v) => fmtCurrency(Number(v))}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No benefit data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Value Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={(props: any) =>
                      `${props.name || ""} ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {breakdownData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    formatter={(v) => fmtCurrency(Number(v))}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No distribution data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Readiness dimensions */}
      {readiness && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Readiness Dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: "Data Availability",
                  value: readiness.dataAvailability,
                },
                {
                  label: "Technical Infrastructure",
                  value: readiness.technicalInfrastructure,
                },
                {
                  label: "Organizational Capacity",
                  value: readiness.organizationalCapacity,
                },
                { label: "Governance", value: readiness.governance },
              ].map((dim) => (
                <div key={dim.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dim.label}</span>
                    <span className="font-semibold text-foreground">
                      {dim.value?.toFixed(1) || "—"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#02a2fd] rounded-full transition-all"
                      style={{
                        width: `${((dim.value || 0) / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formula details */}
      {benefit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Calculation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  title: "Cost Savings",
                  formula: benefit.costFormula,
                  labels: benefit.costFormulaLabels,
                  value: benefit.costBenefit,
                },
                {
                  title: "Revenue Growth",
                  formula: benefit.revenueFormula,
                  labels: benefit.revenueFormulaLabels,
                  value: benefit.revenueBenefit,
                },
                {
                  title: "Risk Reduction",
                  formula: benefit.riskFormula,
                  labels: benefit.riskFormulaLabels,
                  value: benefit.riskBenefit,
                },
                {
                  title: "Cash Flow",
                  formula: benefit.cashFlowFormula,
                  labels: benefit.cashFlowFormulaLabels,
                  value: benefit.cashFlowBenefit,
                },
              ].map((item) => (
                <div key={item.title} className="space-y-2">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      {item.title}
                    </h4>
                    <span className="text-sm font-bold text-[#36bf78]">
                      {item.value || "—"}
                    </span>
                  </div>
                  {item.formula && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded">
                      {item.formula}
                    </p>
                  )}
                  {item.labels?.components && (
                    <div className="space-y-1">
                      {item.labels.components.map(
                        (c: { label: string; value: number }, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs text-muted-foreground"
                          >
                            <span>{c.label}</span>
                            <span>
                              {typeof c.value === "number"
                                ? c.value.toLocaleString()
                                : c.value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
