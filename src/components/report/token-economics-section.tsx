"use client";

import {
  buildUseCaseTokenView,
  formatTokens,
  formatUSD,
  INPUT_PRICE_PER_M_TOKENS,
  OUTPUT_PRICE_PER_M_TOKENS,
  RANGE_LOW_MULT,
  RANGE_HIGH_MULT,
  type ReadinessShape,
  type RunTypeProfile,
  type SensitivityProfile,
  type TokenRange,
  type CostRange,
} from "@/lib/report/token-economics";

interface TokenEconomicsSectionProps {
  useCaseId: string;
  useCaseName: string;
  readiness: ReadinessShape | null | undefined;
  description?: string;
  dataTypes?: string[];
  generatedDate: string;
}

/**
 * Per-use-case Token Economics page.
 * Its own printed page so the executive reader gets full breathing room
 * for the range card, run-type implications, sensitivity, and decision drivers.
 */
export function TokenEconomicsSection({
  useCaseId,
  useCaseName,
  readiness,
  description,
  dataTypes,
  generatedDate,
}: TokenEconomicsSectionProps) {
  if (!readiness) return null;

  const view = buildUseCaseTokenView(useCaseId, useCaseName, readiness, {
    description,
    dataTypes,
  });
  if (!view.hasData) return null;

  return (
    <section
      className="report-page break-before"
      id={`uc-${useCaseId}-tokens`}
    >
      {/* Branded strip */}
      <div className="flex items-center justify-between mb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/blueally-logo-blue.png"
          alt="BlueAlly"
          style={{ height: "0.38in" }}
        />
        <span
          style={{
            fontSize: "9pt",
            letterSpacing: "0.2em",
            color: "#02a2fd",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Token Economics
        </span>
      </div>

      {/* Title */}
      <div className="mb-6 keep-with-next">
        <p className="text-[10pt] font-semibold tracking-[0.22em] uppercase text-[#02a2fd] m-0 mb-2">
          AI Use Case {useCaseId}
        </p>
        <h2 className="text-[22pt] font-bold text-[#001278] m-0 leading-[1.1] tracking-[-0.01em]">
          {useCaseName}
        </h2>
        <p className="text-[10pt] text-gray-600 mt-2 mb-0 max-w-[6.7in]">
          LLM token volume, modeled cost, and operational implications. Ranges
          reflect a {Math.round((1 - RANGE_LOW_MULT) * 100)}% downside and{" "}
          {Math.round((RANGE_HIGH_MULT - 1) * 100)}% upside band around the
          planning estimate.
        </p>
        <div className="mt-3 h-[2.5pt] w-[0.5in] bg-[#36bf78] rounded-sm" />
      </div>

      <div className="space-y-5">
        {/* Per-run profile */}
        <div className="report-card">
          <SectionHeader kicker="01" title="Per-Run Profile" />
          <div className="grid grid-cols-4 gap-3 mt-3">
            <Stat
              label="Input Tokens / Run"
              value={formatTokens(view.inputTokensPerRun)}
            />
            <Stat
              label="Output Tokens / Run"
              value={formatTokens(view.outputTokensPerRun)}
            />
            <Stat
              label="Total Tokens / Run"
              value={formatTokens(view.tokensPerRun)}
              emphasized
            />
            <Stat
              label="Runs / Month"
              value={formatTokens(view.runsPerMonth)}
            />
          </div>
        </div>

        {/* Token range — Low / Avg / High */}
        <div className="report-card">
          <SectionHeader kicker="02" title="Volume Range (Low · Average · High)" />
          <p className="text-[9.5pt] text-gray-600 mt-2 mb-3 max-w-[6.7in]">
            A single point estimate hides reality. The range below frames the
            decision: a {Math.round((RANGE_HIGH_MULT / RANGE_LOW_MULT) * 10) / 10}×
            spread from conservative to expansive.
          </p>
          <RangeTable
            rows={[
              {
                label: "Monthly Tokens",
                range: view.monthlyTokens,
                format: formatTokens,
              },
              {
                label: "Annual Tokens",
                range: view.annualTokens,
                format: formatTokens,
                emphasized: true,
              },
              {
                label: "Annual Cost (modeled)",
                range: view.annualCost,
                format: formatUSD,
                emphasized: true,
              },
            ]}
          />
          <p className="text-[8.5pt] text-gray-500 mt-3 mb-0">
            Cost modeled at Anthropic Sonnet 4.5 list rate: $
            {INPUT_PRICE_PER_M_TOKENS}/1M input, ${OUTPUT_PRICE_PER_M_TOKENS}/1M
            output. Switch to Haiku for ~5× lower cost or Opus for ~5× higher —
            see Key Decision Variables below.
          </p>
        </div>

        {/* Run type + sensitivity — two-column */}
        <div className="grid grid-cols-2 gap-4">
          <RunTypePanel run={view.runType} runsPerMonth={view.runsPerMonth} />
          <SensitivityPanel sensitivity={view.sensitivity} />
        </div>

        {/* Key decision variables */}
        <DecisionVariablesPanel />
      </div>

      <div className="intro-footer pt-4 mt-6 border-t border-gray-200 flex items-end justify-between">
        <p className="text-[9pt] text-gray-500 m-0">Prepared {generatedDate}</p>
        <p className="text-[9pt] text-gray-500 m-0">Confidential · BlueAlly</p>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 keep-with-next">
      <span className="text-[8.5pt] font-mono text-[#02a2fd] tracking-tight">
        {kicker}
      </span>
      <h3 className="text-[13pt] font-semibold text-[#001278] m-0 leading-tight">
        {title}
      </h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Stat({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        emphasized
          ? "border-[#02a2fd]/40 bg-[#02a2fd]/[0.04]"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-[7.5pt] font-semibold uppercase tracking-[0.16em] text-gray-500 m-0 leading-tight">
        {label}
      </p>
      <p
        className={`text-[16pt] font-bold m-0 mt-1 leading-none tracking-tight ${
          emphasized ? "text-[#001278]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RangeTable({
  rows,
}: {
  rows: Array<{
    label: string;
    range: TokenRange | CostRange;
    format: (n: number) => string;
    emphasized?: boolean;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <table className="w-full text-[10pt] border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left font-semibold text-[#001278] px-3 py-2 border-b border-gray-200 w-[2.4in]">
              Metric
            </th>
            <th className="text-right font-semibold text-gray-600 px-3 py-2 border-b border-gray-200">
              Low (−30%)
            </th>
            <th className="text-right font-semibold text-[#001278] px-3 py-2 border-b border-gray-200 bg-[#02a2fd]/[0.06]">
              Planning Estimate
            </th>
            <th className="text-right font-semibold text-gray-600 px-3 py-2 border-b border-gray-200">
              High (+50%)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100 last:border-0">
              <td
                className={`px-3 py-2 ${
                  row.emphasized
                    ? "font-semibold text-[#001278]"
                    : "text-gray-800"
                }`}
              >
                {row.label}
              </td>
              <td className="text-right font-mono text-gray-700 px-3 py-2">
                {row.format(row.range.low)}
              </td>
              <td
                className={`text-right font-mono px-3 py-2 bg-[#02a2fd]/[0.06] ${
                  row.emphasized
                    ? "font-bold text-[#001278]"
                    : "text-[#001278]"
                }`}
              >
                {row.format(row.range.avg)}
              </td>
              <td className="text-right font-mono text-gray-700 px-3 py-2">
                {row.format(row.range.high)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunTypePanel({
  run,
  runsPerMonth,
}: {
  run: RunTypeProfile;
  runsPerMonth: number;
}) {
  const accent =
    run.cadence === "real_time"
      ? "#001278"
      : run.cadence === "near_real_time"
        ? "#02a2fd"
        : "#36bf78";
  return (
    <div
      className="report-card"
      style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "12pt" }}
    >
      <p className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500 m-0">
        Run Type
      </p>
      <h4
        className="text-[15pt] font-bold m-0 mt-1 leading-tight"
        style={{ color: accent }}
      >
        {run.label}
      </h4>
      <p className="text-[9pt] text-gray-500 m-0 mt-1">
        Derived from {runsPerMonth.toLocaleString()} runs / month
      </p>

      <dl className="mt-3 space-y-2 text-[9.5pt] leading-[1.45]">
        <PanelRow label="Latency Target" value={run.latencyTarget} />
        <PanelRow label="Peak Concurrency" value={run.peakConcurrency} />
        <PanelRow label="Scheduling" value={run.schedulingWindow} />
      </dl>

      <p className="text-[9.5pt] leading-[1.5] text-gray-800 mt-3 mb-0">
        <span className="font-semibold text-[#001278]">Hardware. </span>
        {run.infraImplications}
      </p>
    </div>
  );
}

function SensitivityPanel({
  sensitivity,
}: {
  sensitivity: SensitivityProfile;
}) {
  const accent =
    sensitivity.tier === "restricted"
      ? "#b91c1c"
      : sensitivity.tier === "confidential"
        ? "#001278"
        : "#36bf78";
  return (
    <div
      className="report-card"
      style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "12pt" }}
    >
      <p className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] text-gray-500 m-0">
        Data Sensitivity
      </p>
      <h4
        className="text-[15pt] font-bold m-0 mt-1 leading-tight"
        style={{ color: accent }}
      >
        {sensitivity.label}
      </h4>
      <p className="text-[9pt] text-gray-500 m-0 mt-1">
        Inferred from use case context and data types
      </p>

      <dl className="mt-3 space-y-2 text-[9.5pt] leading-[1.45]">
        <PanelRow label="Deployment" value={sensitivity.deploymentImplications} />
        <PanelRow label="Latency Impact" value={sensitivity.latencyConcerns} />
      </dl>
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[7.5pt] font-semibold uppercase tracking-[0.16em] text-gray-500 m-0">
        {label}
      </dt>
      <dd className="text-[9.5pt] text-gray-800 m-0 mt-0.5">{value}</dd>
    </div>
  );
}

function DecisionVariablesPanel() {
  const items = [
    {
      title: "Volume Drift",
      detail:
        "Runs / month is the biggest annual cost lever. Validate against historical workload and projected adoption curves before locking in capacity.",
    },
    {
      title: "Prompt Compression",
      detail:
        "Input tokens per run drives both cost and latency. Trim system prompts, summarize RAG context, and use structured tool calls to cut input by 30–60%.",
    },
    {
      title: "Model Tier",
      detail:
        "Haiku (~$1/1M in, $5/1M out) vs. Sonnet (this estimate) vs. Opus (~5× Sonnet). Route the easy 80% to Haiku and reserve Sonnet/Opus for the hard 20%.",
    },
    {
      title: "Prompt Caching",
      detail:
        "Repeated system prompts and long retrieved contexts can be cached at ~10% of the original input cost — a 50–90% reduction for high-frequency flows.",
    },
    {
      title: "HITL Frequency",
      detail:
        "Every human-in-the-loop checkpoint adds round-trip latency and a re-prompt cost. Right-size confidence thresholds to balance trust vs. throughput.",
    },
  ];
  return (
    <div className="report-card">
      <SectionHeader kicker="03" title="Key Decision Variables" />
      <p className="text-[9.5pt] text-gray-600 m-0 mt-2 mb-3 max-w-[6.7in]">
        The five levers most likely to move this use case&rsquo;s cost,
        latency, or risk profile. Use these to challenge the planning estimate.
      </p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        {items.map((it, i) => (
          <div key={it.title} className="flex gap-3">
            <span className="text-[9pt] font-mono text-[#02a2fd] tracking-tight pt-[2pt] w-[0.4in] shrink-0">
              0{i + 1}
            </span>
            <div>
              <p className="text-[10pt] font-semibold text-[#001278] m-0">
                {it.title}
              </p>
              <p className="text-[9.5pt] text-gray-800 m-0 mt-0.5 leading-[1.45]">
                {it.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
