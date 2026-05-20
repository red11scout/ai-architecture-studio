"use client";

import {
  aggregatePortfolio,
  buildUseCaseTokenView,
  formatTokens,
  formatUSD,
  INPUT_PRICE_PER_M_TOKENS,
  OUTPUT_PRICE_PER_M_TOKENS,
  RANGE_HIGH_MULT,
  RANGE_LOW_MULT,
  type PortfolioTokenSummary,
  type ReadinessShape,
  type UseCaseTokenView,
} from "@/lib/report/token-economics";

interface PortfolioSummaryArch {
  useCaseId: string;
  useCaseName: string;
  businessValueMap?: any;
  financialImpact?: any;
}

interface PortfolioTokenSummaryProps {
  companyName: string;
  industry: string;
  generatedDate: string;
  architectures: PortfolioSummaryArch[];
}

/**
 * Opening page for the Portfolio PDF — totals across every use case so the
 * C-Suite reader sees the full cost & volume picture before drilling into
 * any individual use case.
 *
 * Returns null when no use case carries token data, so the report falls
 * through to the per-UC layout cleanly.
 */
export function PortfolioTokenSummaryPage({
  companyName,
  industry,
  generatedDate,
  architectures,
}: PortfolioTokenSummaryProps) {
  const views: UseCaseTokenView[] = architectures.map((a) => {
    const readiness: ReadinessShape | undefined = a.financialImpact?.readiness;
    const useCase = a.businessValueMap?.useCase;
    return buildUseCaseTokenView(a.useCaseId, a.useCaseName, readiness, {
      description: useCase?.description,
      dataTypes: useCase?.dataTypes,
    });
  });
  const anyData = views.some((v) => v.hasData);
  if (!anyData) return null;

  const summary = aggregatePortfolio(views);

  return (
    <>
      <HeroPage
        companyName={companyName}
        industry={industry}
        generatedDate={generatedDate}
        summary={summary}
      />
      <DetailPage summary={summary} generatedDate={generatedDate} />
    </>
  );
}

function HeroPage({
  companyName,
  industry,
  generatedDate,
  summary,
}: {
  companyName: string;
  industry: string;
  generatedDate: string;
  summary: PortfolioTokenSummary;
}) {
  return (
    <section
      className="report-page intro-page dark-hero"
      id="portfolio-token-summary-hero"
      style={{ background: "#001278", color: "#fff" }}
    >
      <div className="flex items-center justify-between mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/blueally-logo-white.png"
          alt="BlueAlly"
          style={{ height: "0.42in" }}
        />
        <span
          style={{
            fontSize: "9.5pt",
            letterSpacing: "0.22em",
            color: "#02a2fd",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Portfolio Token Economics
        </span>
      </div>

      <p
        className="m-0 mb-3 text-[10pt] font-semibold tracking-[0.22em] uppercase"
        style={{ color: "#02a2fd" }}
      >
        Customer
      </p>
      <h1 className="text-[30pt] font-bold m-0 leading-[1.05] tracking-[-0.01em]">
        {companyName}
      </h1>
      {industry && (
        <p
          className="text-[12pt] mt-1 mb-0"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          {industry}
        </p>
      )}

      <div
        className="my-8 h-[3pt] w-[0.8in] rounded-sm"
        style={{ background: "#36bf78" }}
      />

      <h2 className="text-[22pt] font-bold m-0 leading-[1.15] tracking-[-0.01em]">
        Portfolio Token Economics Summary
      </h2>
      <p
        className="text-[11.5pt] leading-[1.55] mt-3 mb-0 max-w-[6.7in]"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        Aggregate LLM token volume and modeled cost across all{" "}
        {summary.useCaseCount}{" "}
        {summary.useCaseCount === 1 ? "use case" : "use cases"} in the
        portfolio. Ranges reflect a {Math.round((1 - RANGE_LOW_MULT) * 100)}%
        downside and {Math.round((RANGE_HIGH_MULT - 1) * 100)}% upside band
        around each use case&rsquo;s planning estimate to frame real-world
        variance.
      </p>

      {/* KPI Tiles */}
      <div className="grid grid-cols-3 gap-4 mt-10">
        <KpiTile
          label="Annual Tokens (Avg)"
          value={formatTokens(summary.annualTokens.avg)}
          sub={`${formatTokens(summary.annualTokens.low)} – ${formatTokens(summary.annualTokens.high)}`}
        />
        <KpiTile
          label="Annual Cost (Avg)"
          value={formatUSD(summary.annualCost.avg)}
          sub={`${formatUSD(summary.annualCost.low)} – ${formatUSD(summary.annualCost.high)}`}
        />
        <KpiTile
          label="Use Cases with Modeled Volume"
          value={`${summary.withData} / ${summary.useCaseCount}`}
          sub={`${summary.cadenceMix.real_time} real-time · ${summary.cadenceMix.near_real_time} near-RT · ${summary.cadenceMix.batch} batch`}
        />
      </div>

      <div
        className="mt-10 rounded-md px-4 py-3"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)" }}
      >
        <p
          className="text-[9pt] font-semibold uppercase tracking-[0.18em] m-0 mb-1"
          style={{ color: "#02a2fd" }}
        >
          Pricing Assumption
        </p>
        <p className="text-[10pt] m-0" style={{ color: "rgba(255,255,255,0.9)" }}>
          Modeled at Anthropic Sonnet 4.5 list rate: $
          {INPUT_PRICE_PER_M_TOKENS}/1M input tokens, $
          {OUTPUT_PRICE_PER_M_TOKENS}/1M output tokens. Multi-tier model
          routing (Haiku / Sonnet / Opus) can shift costs ±5× — see per-use-case
          Key Decision Variables.
        </p>
      </div>

      <div className="intro-footer pt-4 mt-8 border-t flex items-end justify-between" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
        <p className="text-[9pt] m-0" style={{ color: "rgba(255,255,255,0.65)" }}>
          Prepared {generatedDate}
        </p>
        <p className="text-[9pt] m-0" style={{ color: "rgba(255,255,255,0.65)" }}>
          Confidential · BlueAlly
        </p>
      </div>
    </section>
  );
}

function DetailPage({
  summary,
  generatedDate,
}: {
  summary: PortfolioTokenSummary;
  generatedDate: string;
}) {
  return (
    <section className="report-page break-before" id="portfolio-token-summary-detail">
      <div className="flex items-center justify-between mb-6">
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
          Portfolio Token Economics · Detail
        </span>
      </div>

      <div className="mb-6 keep-with-next">
        <p className="text-[10pt] font-semibold tracking-[0.22em] uppercase text-[#02a2fd] m-0 mb-2">
          Aggregate View
        </p>
        <h2 className="text-[22pt] font-bold text-[#001278] m-0 leading-[1.1] tracking-[-0.01em]">
          Volume, Cost & Operating Mix
        </h2>
        <div className="mt-3 h-[2.5pt] w-[0.5in] bg-[#36bf78] rounded-sm" />
      </div>

      <div className="space-y-5">
        {/* Aggregate range table */}
        <div className="report-card">
          <SubHeader kicker="01" title="Aggregate Volume & Cost (Low · Average · High)" />
          <div className="overflow-hidden rounded-md border border-gray-200 mt-3">
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
                <RangeRow
                  label="Monthly Tokens"
                  low={formatTokens(summary.monthlyTokens.low)}
                  avg={formatTokens(summary.monthlyTokens.avg)}
                  high={formatTokens(summary.monthlyTokens.high)}
                />
                <RangeRow
                  label="Annual Tokens"
                  low={formatTokens(summary.annualTokens.low)}
                  avg={formatTokens(summary.annualTokens.avg)}
                  high={formatTokens(summary.annualTokens.high)}
                  emphasized
                />
                <RangeRow
                  label="Annual Cost (modeled)"
                  low={formatUSD(summary.annualCost.low)}
                  avg={formatUSD(summary.annualCost.avg)}
                  high={formatUSD(summary.annualCost.high)}
                  emphasized
                />
              </tbody>
            </table>
          </div>
          <p className="text-[8.5pt] text-gray-500 mt-3 mb-0">
            Totals sum each use case&rsquo;s individual range. A high-end
            outcome at the portfolio level requires every use case to land at
            its individual high simultaneously — useful for capacity planning,
            not for budgeting central estimate.
          </p>
        </div>

        {/* Mix panels */}
        <div className="grid grid-cols-2 gap-4">
          <MixPanel
            kicker="02"
            title="Run-Cadence Mix"
            description="Distribution of use cases by latency requirement. Real-time workloads drive hardware sizing; batch workloads can ride off-peak windows."
            rows={[
              { label: "Real-Time", count: summary.cadenceMix.real_time, color: "#001278", note: "Sub-second p95, ~3× peak concurrency" },
              { label: "Near Real-Time", count: summary.cadenceMix.near_real_time, color: "#02a2fd", note: "Seconds-tolerant, ~2× peak concurrency" },
              { label: "Batch", count: summary.cadenceMix.batch, color: "#36bf78", note: "Off-peak schedulable, 1× concurrency" },
            ]}
            totalDenominator={summary.withData}
          />
          <MixPanel
            kicker="03"
            title="Data-Sensitivity Mix"
            description="Drives deployment posture: zero-retention API vs. private VPC inference vs. on-prem. Higher tiers add 50–150 ms of routing latency."
            rows={[
              { label: "Restricted", count: summary.sensitivityMix.restricted, color: "#b91c1c", note: "Requires BAA / private deployment" },
              { label: "Confidential", count: summary.sensitivityMix.confidential, color: "#001278", note: "API + zero-retention + audit logs" },
              { label: "Internal", count: summary.sensitivityMix.internal, color: "#36bf78", note: "Standard public API endpoints" },
            ]}
            totalDenominator={summary.withData}
          />
        </div>

        {/* Top volume contributors */}
        {summary.topVolumeContributors.length > 0 && (
          <div className="report-card">
            <SubHeader
              kicker="04"
              title="Top Volume Contributors"
            />
            <p className="text-[9.5pt] text-gray-600 mt-2 mb-3 max-w-[6.7in]">
              Where the tokens actually go. Focus prompt-compression and
              caching effort on these first — every percent of input-token
              reduction here compounds across the portfolio.
            </p>
            <div className="space-y-2">
              {summary.topVolumeContributors.map((c, i) => (
                <ContributorBar
                  key={c.useCaseId}
                  rank={i + 1}
                  useCaseId={c.useCaseId}
                  useCaseName={c.useCaseName}
                  annualTokens={c.annualTokens}
                  sharePct={c.sharePct}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reading guide */}
        <div className="report-card">
          <SubHeader kicker="05" title="How to Read This Report" />
          <ol className="m-0 pl-5 mt-3 space-y-2 text-[10pt] text-gray-800 leading-[1.5]">
            <li>
              Each use case gets a dedicated{" "}
              <span className="font-semibold text-[#001278]">Token Economics</span>{" "}
              page with the same Low / Average / High breakdown shown here, plus
              run-type implications, data sensitivity, and decision drivers.
            </li>
            <li>
              The <span className="font-semibold text-[#001278]">Planning Estimate</span>{" "}
              column is the right number to budget against. The Low and High
              are guardrails — if your forecast lands outside them, revisit
              the inputs (runs / month, prompt size, model tier).
            </li>
            <li>
              The <span className="font-semibold text-[#001278]">Key Decision Variables</span>{" "}
              section on every use case page identifies the five fastest ways
              to move cost. Volume drift and prompt compression typically
              dwarf model-tier choices in absolute dollar terms.
            </li>
          </ol>
        </div>
      </div>

      <div className="intro-footer pt-4 mt-6 border-t border-gray-200 flex items-end justify-between">
        <p className="text-[9pt] text-gray-500 m-0">Prepared {generatedDate}</p>
        <p className="text-[9pt] text-gray-500 m-0">Confidential · BlueAlly</p>
      </div>
    </section>
  );
}

function SubHeader({ kicker, title }: { kicker: string; title: string }) {
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

function KpiTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-md px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <p
        className="text-[8.5pt] font-semibold uppercase tracking-[0.18em] m-0"
        style={{ color: "#02a2fd" }}
      >
        {label}
      </p>
      <p className="text-[22pt] font-bold m-0 mt-1 leading-none tracking-tight text-white">
        {value}
      </p>
      <p
        className="text-[9pt] m-0 mt-1"
        style={{ color: "rgba(255,255,255,0.75)" }}
      >
        {sub}
      </p>
    </div>
  );
}

function RangeRow({
  label,
  low,
  avg,
  high,
  emphasized = false,
}: {
  label: string;
  low: string;
  avg: string;
  high: string;
  emphasized?: boolean;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td
        className={`px-3 py-2 ${
          emphasized ? "font-semibold text-[#001278]" : "text-gray-800"
        }`}
      >
        {label}
      </td>
      <td className="text-right font-mono text-gray-700 px-3 py-2">{low}</td>
      <td
        className={`text-right font-mono px-3 py-2 bg-[#02a2fd]/[0.06] ${
          emphasized ? "font-bold text-[#001278]" : "text-[#001278]"
        }`}
      >
        {avg}
      </td>
      <td className="text-right font-mono text-gray-700 px-3 py-2">{high}</td>
    </tr>
  );
}

function MixPanel({
  kicker,
  title,
  description,
  rows,
  totalDenominator,
}: {
  kicker: string;
  title: string;
  description: string;
  rows: Array<{ label: string; count: number; color: string; note: string }>;
  totalDenominator: number;
}) {
  const denom = Math.max(1, totalDenominator);
  return (
    <div className="report-card">
      <SubHeader kicker={kicker} title={title} />
      <p className="text-[9.5pt] text-gray-600 m-0 mt-2 mb-3">{description}</p>
      <div className="space-y-3">
        {rows.map((r) => {
          const pct = (r.count / denom) * 100;
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10pt] font-semibold text-[#001278]">
                  {r.label}
                </span>
                <span className="text-[9.5pt] font-mono text-gray-600">
                  {r.count} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-[6pt] rounded-sm bg-gray-100 overflow-hidden">
                <div
                  style={{
                    width: `${pct}%`,
                    background: r.color,
                    height: "100%",
                  }}
                />
              </div>
              <p className="text-[8.5pt] text-gray-500 m-0 mt-1">{r.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContributorBar({
  rank,
  useCaseId,
  useCaseName,
  annualTokens,
  sharePct,
}: {
  rank: number;
  useCaseId: string;
  useCaseName: string;
  annualTokens: number;
  sharePct: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[9pt] font-mono text-[#02a2fd] tracking-tight w-[0.3in] shrink-0">
        0{rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10pt] font-semibold text-[#001278] truncate">
            {useCaseName}
          </span>
          <span className="text-[9pt] font-mono text-gray-500 tracking-tight shrink-0">
            {useCaseId}
          </span>
        </div>
        <div className="mt-1 h-[6pt] rounded-sm bg-gray-100 overflow-hidden">
          <div
            style={{
              width: `${Math.min(100, sharePct)}%`,
              background: "#02a2fd",
              height: "100%",
            }}
          />
        </div>
      </div>
      <div className="text-right shrink-0 w-[1.4in]">
        <p className="text-[10pt] font-bold text-[#001278] m-0 leading-none">
          {formatTokens(annualTokens)}
        </p>
        <p className="text-[8.5pt] font-mono text-gray-500 m-0 mt-1">
          {sharePct.toFixed(1)}% of portfolio
        </p>
      </div>
    </div>
  );
}

