// ============================================================================
// AI Solution Builder — Shared Type System
// Matches the aiworkflow export JSON format
// ============================================================================

// ---------------------------------------------------------------------------
// Import JSON structure
// ---------------------------------------------------------------------------
export interface WorkflowExport {
  exportVersion: string;
  exportedAt: string;
  source: string;
  company: CompanyInfo;
  analysis: AnalysisData;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  description: string;
}

export interface AnalysisData {
  steps: AnalysisStep[];
  executiveSummary?: ExecutiveSummary;
  executiveDashboard?: ExecutiveDashboard;
  scenarioAnalysis?: ScenarioAnalysis;
  workflowMaps?: WorkflowMap[];
}

export interface AnalysisStep {
  step: number;
  name: string;
  content?: string;
  data?: any;
}

// ---------------------------------------------------------------------------
// Strategic themes & business functions
// ---------------------------------------------------------------------------
export interface StrategicTheme {
  id: string;
  name: string;
  targetState: string;
  currentState: string;
  secondaryDriver: string;
  primaryDriverImpact: string;
}

export interface BusinessFunction {
  id: string;
  kpiName: string;
  function: string;
  direction: string;
  timeframe: string;
  subFunction: string;
  targetValue: string;
  benchmarkAvg: string;
  baselineValue: string;
  strategicTheme: string;
  strategicThemeId: string;
  benchmarkOverallBest: string;
  benchmarkIndustryBest: string;
}

// ---------------------------------------------------------------------------
// Friction points
// ---------------------------------------------------------------------------
export interface FrictionPoint {
  id: string;
  role: string;
  roleId: string;
  function: string;
  severity: string;
  hourlyRate: number;
  annualHours: number;
  costFormula: string;
  subFunction: string;
  frictionType: string;
  frictionPoint: string;
  strategicTheme: string;
  loadedHourlyRate: number;
  strategicThemeId: string;
  estimatedAnnualCost: string;
  primaryDriverImpact: string;
}

// ---------------------------------------------------------------------------
// Use cases
// ---------------------------------------------------------------------------
export interface UseCase {
  id: string;
  name: string;
  function: string;
  dataTypes: string[];
  epochFlags: string;
  description: string;
  subFunction: string;
  aiPrimitives: string[];
  integrations: string[];
  agenticPattern: string;
  hitlCheckpoint: string;
  primaryPattern: string;
  strategicTheme: string;
  targetFriction: string;
  desiredOutcomes: string[];
  patternRationale: string;
  strategicThemeId: string;
  targetFrictionId: string;
  alternativePattern: string;
}

// ---------------------------------------------------------------------------
// Benefits & financial
// ---------------------------------------------------------------------------
export interface FormulaLabels {
  result: string;
  components: Array<{ label: string; value: number }>;
}

export interface BenefitQuantification {
  id: string;
  useCaseId: string;
  useCaseName: string;
  costBenefit: string;
  costFormula: string;
  costFormulaLabels: FormulaLabels;
  revenueBenefit: string;
  revenueFormula: string;
  revenueFormulaLabels: FormulaLabels;
  riskBenefit: string;
  riskFormula: string;
  riskFormulaLabels: FormulaLabels;
  cashFlowBenefit: string;
  cashFlowFormula: string;
  cashFlowFormulaLabels: FormulaLabels;
  totalAnnualValue: string;
  expectedValue: string;
  probabilityOfSuccess: number;
  strategicTheme: string;
  strategicThemeId: string;
}

// ---------------------------------------------------------------------------
// Readiness & priority
// ---------------------------------------------------------------------------
export interface ReadinessModel {
  id: string;
  useCaseId: string;
  useCaseName: string;
  governance: number;
  timeToValue: number;
  runsPerMonth: number;
  monthlyTokens: number;
  readinessScore: number;
  annualTokenCost: string;
  dataAvailability: number;
  strategicTheme: string;
  strategicThemeId: string;
  inputTokensPerRun: number;
  outputTokensPerRun: number;
  organizationalCapacity: number;
  technicalInfrastructure: number;
}

export interface PriorityScore {
  id: string;
  ttvScore: number;
  useCaseId: string;
  valueScore: number;
  useCaseName: string;
  priorityTier: string;
  priorityScore: number;
  readinessScore: number;
  strategicTheme: string;
  recommendedPhase: string;
  strategicThemeId: string;
}

// ---------------------------------------------------------------------------
// Executive summary & dashboard
// ---------------------------------------------------------------------------
export interface ExecutiveSummary {
  context: string;
  findings: Array<{ body: string; title: string; value: string }>;
  headline: string;
  criticalPath: string;
  opportunityTable: { rows: Array<{ value: string; metric: string }> };
  recommendedAction: string;
}

export interface ExecutiveDashboard {
  topUseCases: Array<{
    rank: number;
    useCase: string;
    annualValue: number;
    priorityTier: string;
    monthlyTokens: number;
    priorityScore: number;
  }>;
  totalAnnualValue: number;
  totalCostBenefit: number;
  totalRiskBenefit: number;
  totalMonthlyTokens: number;
  totalRevenueBenefit: number;
  totalCashFlowBenefit: number;
  valuePerMillionTokens: number;
}

export interface ScenarioAnalysis {
  moderate: { npv: string; annualBenefit: string; paybackMonths: number };
  aggressive: { npv: string; annualBenefit: string; paybackMonths: number };
  conservative: { npv: string; annualBenefit: string; paybackMonths: number };
}

// ---------------------------------------------------------------------------
// Workflow maps
// ---------------------------------------------------------------------------
export interface WorkflowStep {
  id: string;
  name: string;
  systems: string[];
  duration: string;
  position: { x: number; y: number };
  actorName: string;
  actorType: string;
  aiApproach?: string;
  department: string;
  outputType: string;
  painPoints: string[];
  stepNumber: number;
  description: string;
  isAIEnabled: boolean;
  hoursPerTask: number;
  isBottleneck: boolean;
  stepCategory: string;
  avgHourlyCost: number;
  employeeCount: number;
  systemDetails: Array<{
    name: string;
    dataType: string;
    integrationType: string;
    integrationAvailable: boolean;
  }>;
  tasksPerMonth: number;
  aiCapabilities?: string[];
  automationLevel?: string;
  isDecisionPoint: boolean;
  burdenMultiplier: number;
  isHumanInTheLoop: boolean;
  desiredAIOutputType?: string;
  isDepartmentHandoff: boolean;
}

export interface WorkflowMap {
  useCaseId: string;
  dataTypes: string[];
  currentState: WorkflowStep[];
  targetState: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// Diagram types (React Flow)
// ---------------------------------------------------------------------------
export interface DiagramNode {
  id: string;
  type: string;
  label: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface DiagramDefinition {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  mermaidCode: string;
}

// ---------------------------------------------------------------------------
// Canvas types
// ---------------------------------------------------------------------------
export interface CanvasData {
  businessObjective: string;
  frictionPoints: string;
  aiUseCases: string;
  usersRoles: string;
  dataSources: string;
  systemsApis: string;
  aiArchitecture: string;
  governanceHitl: string;
  financialImpact: string;
}

// ---------------------------------------------------------------------------
// PRD types
// ---------------------------------------------------------------------------
export interface PRDContent {
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  userStories: string;
  technicalRequirements: string;
  aiModelSpecifications: string;
  hitlRequirements: string;
  successMetrics: string;
  risksAndMitigations: string;
  implementationTimeline: string;
}

// ---------------------------------------------------------------------------
// Parsed import data (flattened from WorkflowExport)
// ---------------------------------------------------------------------------
export interface ParsedImport {
  company: CompanyInfo;
  strategicThemes: StrategicTheme[];
  businessFunctions: BusinessFunction[];
  frictionPoints: FrictionPoint[];
  useCases: UseCase[];
  benefits: BenefitQuantification[];
  readiness: ReadinessModel[];
  priorities: PriorityScore[];
  executiveSummary?: ExecutiveSummary;
  executiveDashboard?: ExecutiveDashboard;
  scenarioAnalysis?: ScenarioAnalysis;
  workflowMaps?: WorkflowMap[];
}
