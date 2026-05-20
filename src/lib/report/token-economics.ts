/**
 * Deterministic derivations for the Token Economics report sections.
 * Zero AI. Zero side effects. Pure functions over the imported readiness model.
 *
 * Customers feel imported token counts are either too low or too high — these
 * helpers translate a single point estimate into a defensible Low / Avg / High
 * range and classify each use case by run cadence and data sensitivity so the
 * Executive reader can see WHERE the cost will actually swing.
 */

// Anthropic Sonnet 4.5 list pricing (as of 2026-Q2).
// Mirror of src/lib/engines/formulas.ts — duplicated here so the report module
// stays self-contained and the assumption is visible alongside the derivation.
export const INPUT_PRICE_PER_M_TOKENS = 3; // USD per 1M input tokens
export const OUTPUT_PRICE_PER_M_TOKENS = 15; // USD per 1M output tokens

export const RANGE_LOW_MULT = 0.7;
export const RANGE_AVG_MULT = 1.0;
export const RANGE_HIGH_MULT = 1.5;

export interface ReadinessShape {
  inputTokensPerRun?: number | null;
  outputTokensPerRun?: number | null;
  runsPerMonth?: number | null;
  monthlyTokens?: number | null;
  annualTokenCost?: string | number | null;
  timeToValue?: number | null;
  strategicTheme?: string | null;
}

export interface TokenRange {
  low: number;
  avg: number;
  high: number;
}

export interface CostRange {
  low: number;
  avg: number;
  high: number;
}

export type RunCadence = "real_time" | "near_real_time" | "batch";

export interface RunTypeProfile {
  cadence: RunCadence;
  label: string;
  latencyTarget: string;
  peakConcurrency: string;
  infraImplications: string;
  schedulingWindow: string;
}

export type SensitivityTier = "restricted" | "confidential" | "internal";

export interface SensitivityProfile {
  tier: SensitivityTier;
  label: string;
  deploymentImplications: string;
  latencyConcerns: string;
}

export interface UseCaseTokenView {
  useCaseId: string;
  useCaseName: string;
  hasData: boolean;
  inputTokensPerRun: number;
  outputTokensPerRun: number;
  tokensPerRun: number;
  runsPerMonth: number;
  monthlyTokens: TokenRange;
  annualTokens: TokenRange;
  annualCost: CostRange;
  runType: RunTypeProfile;
  sensitivity: SensitivityProfile;
}

export interface PortfolioTokenSummary {
  useCaseCount: number;
  withData: number;
  monthlyTokens: TokenRange;
  annualTokens: TokenRange;
  annualCost: CostRange;
  cadenceMix: Record<RunCadence, number>;
  sensitivityMix: Record<SensitivityTier, number>;
  topVolumeContributors: Array<{
    useCaseId: string;
    useCaseName: string;
    annualTokens: number;
    sharePct: number;
  }>;
}

// ---------- Volume / cost ranges ----------

function applyRange(base: number): TokenRange {
  return {
    low: Math.round(base * RANGE_LOW_MULT),
    avg: Math.round(base * RANGE_AVG_MULT),
    high: Math.round(base * RANGE_HIGH_MULT),
  };
}

export function computeAnnualCostUSD(
  inputTokensPerRun: number,
  outputTokensPerRun: number,
  runsPerMonth: number,
): number {
  const annualInput = inputTokensPerRun * runsPerMonth * 12;
  const annualOutput = outputTokensPerRun * runsPerMonth * 12;
  const inputCost = (annualInput / 1_000_000) * INPUT_PRICE_PER_M_TOKENS;
  const outputCost = (annualOutput / 1_000_000) * OUTPUT_PRICE_PER_M_TOKENS;
  return inputCost + outputCost;
}

// ---------- Run type classification ----------

export function classifyRunType(
  runsPerMonth: number,
  strategicTheme?: string | null,
): RunTypeProfile {
  const theme = (strategicTheme || "").toLowerCase();
  const batchHinted = /\b(batch|nightly|overnight|weekly|monthly report)\b/.test(
    theme,
  );

  if (batchHinted || runsPerMonth < 1_000) {
    return {
      cadence: "batch",
      label: "Batch",
      latencyTarget: "Minutes to hours acceptable",
      peakConcurrency: "1× average — single queue worker is fine",
      infraImplications:
        "Schedule during off-peak windows (evenings / weekends). No concurrency overhead, minimal API rate-limit risk, lowest cost-per-token.",
      schedulingWindow: "Off-peak (evenings / weekends)",
    };
  }

  if (runsPerMonth < 30_000) {
    return {
      cadence: "near_real_time",
      label: "Near Real-Time",
      latencyTarget: "Seconds to a few minutes",
      peakConcurrency: "~2× average rate at peak",
      infraImplications:
        "Synchronous user experience. Reserve capacity headroom, monitor p95 latency, plan for warm-pool sizing to avoid cold-start tax.",
      schedulingWindow: "Business hours, continuous",
    };
  }

  return {
    cadence: "real_time",
    label: "Real-Time",
    latencyTarget: "Sub-second p95",
    peakConcurrency: "~3× average rate at peak — bursty",
    infraImplications:
      "Time-sensitive. Plan for concurrency: provisioned throughput, prompt caching, request hedging. Hardware sizing is dominated by peak, not average.",
    schedulingWindow: "24/7 with peak hour shaping",
  };
}

// ---------- Data sensitivity classification ----------

const RESTRICTED_PATTERNS =
  /\b(pii|phi|hipaa|sox|gdpr|pci|nuclear|defense|classified|medical|patient|financial transaction|regulated)\b/i;
const CONFIDENTIAL_PATTERNS =
  /\b(customer|proprietary|intellectual property|source code|contract|salary|compensation|internal product|trade secret)\b/i;

export function classifyDataSensitivity(args: {
  useCaseName?: string;
  description?: string;
  strategicTheme?: string;
  dataTypes?: string[];
}): SensitivityProfile {
  const haystack = [
    args.useCaseName || "",
    args.description || "",
    args.strategicTheme || "",
    (args.dataTypes || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  if (RESTRICTED_PATTERNS.test(haystack)) {
    return {
      tier: "restricted",
      label: "Restricted",
      deploymentImplications:
        "BAA or equivalent contract required. Consider private deployment (VPC inference, AWS Bedrock, Azure OpenAI) or on-prem fine-tunes. Zero-retention API mandatory.",
      latencyConcerns:
        "Private routing typically adds 50–150 ms — factor into SLAs before committing to real-time UX.",
    };
  }

  if (CONFIDENTIAL_PATTERNS.test(haystack)) {
    return {
      tier: "confidential",
      label: "Confidential",
      deploymentImplications:
        "Anthropic API with zero-retention enabled + audit logging. No model training opt-in.",
      latencyConcerns:
        "Standard public-endpoint latency. Acceptable for most interactive flows.",
    };
  }

  return {
    tier: "internal",
    label: "Internal",
    deploymentImplications:
      "Standard public API. Default retention settings are fine for operational telemetry.",
    latencyConcerns:
      "Standard public-endpoint latency. No special routing needed.",
  };
}

// ---------- Per-use-case view ----------

export function buildUseCaseTokenView(
  useCaseId: string,
  useCaseName: string,
  readiness: ReadinessShape | null | undefined,
  context: {
    description?: string;
    dataTypes?: string[];
  } = {},
): UseCaseTokenView {
  const input = readiness?.inputTokensPerRun ?? 0;
  const output = readiness?.outputTokensPerRun ?? 0;
  const runs = readiness?.runsPerMonth ?? 0;
  const tokensPerRun = input + output;
  const baseMonthly =
    readiness?.monthlyTokens != null && readiness.monthlyTokens > 0
      ? readiness.monthlyTokens
      : runs * tokensPerRun;
  const baseAnnual = baseMonthly * 12;
  const baseCost = computeAnnualCostUSD(input, output, runs);

  const monthlyTokens = applyRange(baseMonthly);
  const annualTokens = applyRange(baseAnnual);
  const annualCost: CostRange = {
    low: baseCost * RANGE_LOW_MULT,
    avg: baseCost * RANGE_AVG_MULT,
    high: baseCost * RANGE_HIGH_MULT,
  };

  return {
    useCaseId,
    useCaseName,
    hasData:
      (readiness?.inputTokensPerRun ?? 0) > 0 ||
      (readiness?.outputTokensPerRun ?? 0) > 0 ||
      (readiness?.runsPerMonth ?? 0) > 0,
    inputTokensPerRun: input,
    outputTokensPerRun: output,
    tokensPerRun,
    runsPerMonth: runs,
    monthlyTokens,
    annualTokens,
    annualCost,
    runType: classifyRunType(runs, readiness?.strategicTheme),
    sensitivity: classifyDataSensitivity({
      useCaseName,
      description: context.description,
      strategicTheme: readiness?.strategicTheme ?? undefined,
      dataTypes: context.dataTypes,
    }),
  };
}

// ---------- Portfolio aggregation ----------

export function aggregatePortfolio(
  views: UseCaseTokenView[],
): PortfolioTokenSummary {
  const withData = views.filter((v) => v.hasData);

  const sumRange = (key: "monthlyTokens" | "annualTokens"): TokenRange => ({
    low: withData.reduce((acc, v) => acc + v[key].low, 0),
    avg: withData.reduce((acc, v) => acc + v[key].avg, 0),
    high: withData.reduce((acc, v) => acc + v[key].high, 0),
  });
  const sumCost = (): CostRange => ({
    low: withData.reduce((acc, v) => acc + v.annualCost.low, 0),
    avg: withData.reduce((acc, v) => acc + v.annualCost.avg, 0),
    high: withData.reduce((acc, v) => acc + v.annualCost.high, 0),
  });

  const cadenceMix: Record<RunCadence, number> = {
    real_time: 0,
    near_real_time: 0,
    batch: 0,
  };
  const sensitivityMix: Record<SensitivityTier, number> = {
    restricted: 0,
    confidential: 0,
    internal: 0,
  };
  for (const v of withData) {
    cadenceMix[v.runType.cadence] += 1;
    sensitivityMix[v.sensitivity.tier] += 1;
  }

  const annualAvgTotal = withData.reduce((acc, v) => acc + v.annualTokens.avg, 0);
  const topVolumeContributors = [...withData]
    .sort((a, b) => b.annualTokens.avg - a.annualTokens.avg)
    .slice(0, 5)
    .map((v) => ({
      useCaseId: v.useCaseId,
      useCaseName: v.useCaseName,
      annualTokens: v.annualTokens.avg,
      sharePct: annualAvgTotal > 0 ? (v.annualTokens.avg / annualAvgTotal) * 100 : 0,
    }));

  return {
    useCaseCount: views.length,
    withData: withData.length,
    monthlyTokens: sumRange("monthlyTokens"),
    annualTokens: sumRange("annualTokens"),
    annualCost: sumCost(),
    cadenceMix,
    sensitivityMix,
    topVolumeContributors,
  };
}

// ---------- Formatting helpers ----------

export function formatTokens(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatUSD(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
