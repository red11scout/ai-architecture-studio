// =========================================================================
// SHARED TYPES FOR CALCULATION ENGINES
// Ported from aiworkflow/shared/types.ts — subset needed by formulas.ts
// =========================================================================

export type AssessmentCategory = "skills" | "data" | "infrastructure" | "governance";

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export type AssessmentStatus = "early_stage" | "building" | "developing" | "ready";

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  subCategory: string;
  questionText: string;
  hint: string;
  weight: 1 | 2;
  useCasesImpacted: string[];
}

export interface AssessmentAnswer {
  questionId: string;
  score: MaturityLevel | null;
  notes: string;
}
