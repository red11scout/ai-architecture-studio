/**
 * Shared PRD section definitions with backward-compatibility lookup.
 * Used by the PRD display page, print page, and shared report.
 */

export interface PRDSection {
  key: string;
  label: string;
  legacy: string[];
}

export const SECTION_MAP: PRDSection[] = [
  { key: "executiveSummary", label: "Executive Summary", legacy: [] },
  { key: "problemStatement", label: "Problem Statement", legacy: [] },
  { key: "solutionArchitecture", label: "Solution Architecture", legacy: ["proposedSolution"] },
  { key: "dataStrategy", label: "Data Strategy", legacy: [] },
  { key: "aiModelSpecifications", label: "AI Model Specifications", legacy: [] },
  { key: "userStoriesAcceptanceCriteria", label: "User Stories & Acceptance Criteria", legacy: ["userStories"] },
  { key: "apiIntegrationSpecs", label: "API & Integration Specifications", legacy: ["technicalRequirements"] },
  { key: "guardrailsSafety", label: "Guardrails & Safety", legacy: ["hitlRequirements"] },
  { key: "evaluationFramework", label: "Evaluation Framework", legacy: [] },
  { key: "implementationRoadmap", label: "Implementation Roadmap", legacy: ["implementationTimeline"] },
  { key: "successMetrics", label: "Success Metrics & KPIs", legacy: [] },
  { key: "risksAndMitigations", label: "Risks & Mitigations", legacy: [] },
];

/**
 * Look up content for a PRD section, trying the new key first
 * then falling back to legacy field names for old PRDs.
 */
export function getSectionContent(
  prd: Record<string, string | undefined>,
  section: PRDSection
): string | null {
  if (prd[section.key]) return prd[section.key]!;
  for (const legacyKey of section.legacy) {
    if (prd[legacyKey]) return prd[legacyKey]!;
  }
  return null;
}
