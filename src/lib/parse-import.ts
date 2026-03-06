import { z } from "zod";
import type {
  WorkflowExport,
  ParsedImport,
  StrategicTheme,
  BusinessFunction,
  FrictionPoint,
  UseCase,
  BenefitQuantification,
  ReadinessModel,
  PriorityScore,
  WorkflowMap,
} from "./types";

/**
 * Zod schema for validating the workflow export JSON structure.
 * Validates top-level structure and step names without deeply validating every field.
 */
const workflowExportSchema = z.object({
  exportVersion: z.string(),
  exportedAt: z.string(),
  source: z.string(),
  company: z.object({
    name: z.string(),
    industry: z.string(),
    description: z.string().optional().default(""),
  }),
  analysis: z.object({
    steps: z.array(
      z.object({
        step: z.number(),
        name: z.string(),
        content: z.string().optional(),
        data: z.any().optional(),
      })
    ),
    executiveSummary: z.any().optional(),
    executiveDashboard: z.any().optional(),
    scenarioAnalysis: z.any().optional(),
    workflowMaps: z.any().optional(),
  }),
});

/**
 * Validation result returned by validateImport.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    company: string;
    industry: string;
    strategicThemes: number;
    businessFunctions: number;
    frictionPoints: number;
    useCases: number;
    benefits: number;
    readiness: number;
    priorities: number;
    workflowMaps: number;
    hasExecutiveSummary: boolean;
    hasDashboard: boolean;
    hasScenarioAnalysis: boolean;
  };
}

/**
 * Validates the raw JSON before parsing.
 */
export function validateImport(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = workflowExportSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      ),
      warnings: [],
      summary: {
        company: "",
        industry: "",
        strategicThemes: 0,
        businessFunctions: 0,
        frictionPoints: 0,
        useCases: 0,
        benefits: 0,
        readiness: 0,
        priorities: 0,
        workflowMaps: 0,
        hasExecutiveSummary: false,
        hasDashboard: false,
        hasScenarioAnalysis: false,
      },
    };
  }

  const data = parsed.data;
  const steps = data.analysis.steps;

  const findStep = (name: string) =>
    steps.find((s) => s.name === name)?.data ?? [];

  const strategicThemes = findStep("Strategic Themes");
  const businessFunctions = findStep("Business Functions & KPIs");
  const frictionPoints = findStep("Friction Points");
  const useCases = findStep("AI Use Cases");
  const benefits = findStep("Benefits Quantification");
  const readiness = findStep("Readiness & Token Modeling");
  const priorities = findStep("Priority Scoring");

  if (!Array.isArray(useCases) || useCases.length === 0) {
    errors.push("No AI Use Cases found in the export");
  }

  if (!Array.isArray(strategicThemes) || strategicThemes.length === 0) {
    warnings.push("No Strategic Themes found — some visualizations will be limited");
  }

  if (!Array.isArray(benefits) || benefits.length === 0) {
    warnings.push("No Benefits Quantification found — financial dashboards will be empty");
  }

  if (!data.analysis.workflowMaps || !Array.isArray(data.analysis.workflowMaps)) {
    warnings.push("No Workflow Maps found — agent workflow diagrams will use simplified layouts");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      company: data.company.name,
      industry: data.company.industry,
      strategicThemes: Array.isArray(strategicThemes) ? strategicThemes.length : 0,
      businessFunctions: Array.isArray(businessFunctions) ? businessFunctions.length : 0,
      frictionPoints: Array.isArray(frictionPoints) ? frictionPoints.length : 0,
      useCases: Array.isArray(useCases) ? useCases.length : 0,
      benefits: Array.isArray(benefits) ? benefits.length : 0,
      readiness: Array.isArray(readiness) ? readiness.length : 0,
      priorities: Array.isArray(priorities) ? priorities.length : 0,
      workflowMaps: Array.isArray(data.analysis.workflowMaps)
        ? data.analysis.workflowMaps.length
        : 0,
      hasExecutiveSummary: !!data.analysis.executiveSummary,
      hasDashboard: !!data.analysis.executiveDashboard,
      hasScenarioAnalysis: !!data.analysis.scenarioAnalysis,
    },
  };
}

/**
 * Parses the validated workflow export JSON into structured data.
 * All steps are extracted by name and cast to their typed interfaces.
 */
export function parseImportedJSON(raw: WorkflowExport): ParsedImport {
  const steps = raw.analysis.steps;

  const findStepData = <T>(name: string): T[] => {
    const step = steps.find((s) => s.name === name);
    return (step?.data as T[]) ?? [];
  };

  return {
    company: raw.company,
    strategicThemes: findStepData<StrategicTheme>("Strategic Themes"),
    businessFunctions: findStepData<BusinessFunction>("Business Functions & KPIs"),
    frictionPoints: findStepData<FrictionPoint>("Friction Points"),
    useCases: findStepData<UseCase>("AI Use Cases"),
    benefits: findStepData<BenefitQuantification>("Benefits Quantification"),
    readiness: findStepData<ReadinessModel>("Readiness & Token Modeling"),
    priorities: findStepData<PriorityScore>("Priority Scoring"),
    executiveSummary: raw.analysis.executiveSummary,
    executiveDashboard: raw.analysis.executiveDashboard,
    scenarioAnalysis: raw.analysis.scenarioAnalysis,
    workflowMaps: raw.analysis.workflowMaps,
  };
}
