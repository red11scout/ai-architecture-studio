import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------
export const projects = pgTable(
  "projects",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => sql`gen_random_uuid()`),
    ownerToken: varchar("owner_token").notNull(),
    name: text("name").notNull(),
    companyName: text("company_name").notNull(),
    industry: text("industry").default(""),
    description: text("description").default(""),
    status: varchar("status", { length: 20 }).default("draft"),
    rawImport: jsonb("raw_import"),
    importVersion: varchar("import_version", { length: 10 }).default(""),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("projects_owner_token_idx").on(table.ownerToken)]
);

// ---------------------------------------------------------------------------
// architectures
// ---------------------------------------------------------------------------
export const architectures = pgTable("architectures", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id),
  useCaseId: varchar("use_case_id").notNull(),
  useCaseName: text("use_case_name").notNull(),
  maturityLevel: integer("maturity_level").default(2),
  businessValueMap: jsonb("business_value_map"),
  systemArchitecture: jsonb("system_architecture"),
  agenticWorkflow: jsonb("agentic_workflow"),
  dataArchitecture: jsonb("data_architecture"),
  governanceModel: jsonb("governance_model"),
  financialImpact: jsonb("financial_impact"),
  prdContent: jsonb("prd_content"),
  prdGeneratedAt: timestamp("prd_generated_at"),
  canvasData: jsonb("canvas_data"),
  implementationPhase: varchar("implementation_phase", { length: 10 }),
  estimatedWeeks: integer("estimated_weeks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// share_links
// ---------------------------------------------------------------------------
export const shareLinks = pgTable(
  "share_links",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => sql`gen_random_uuid()`),
    projectId: varchar("project_id").notNull(),
    shareCode: varchar("share_code", { length: 12 }).notNull(),
    scope: varchar("scope", { length: 20 }).default("portfolio"),
    scopeId: varchar("scope_id"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [uniqueIndex("share_links_share_code_idx").on(table.shareCode)]
);

// ---------------------------------------------------------------------------
// ai_conversations
// ---------------------------------------------------------------------------
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  architectureId: varchar("architecture_id"),
  section: varchar("section", { length: 30 }).notNull(),
  messages: jsonb("messages"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// export_jobs
// ---------------------------------------------------------------------------
export const exportJobs = pgTable("export_jobs", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  architectureId: varchar("architecture_id"),
  format: varchar("format", { length: 10 }).notNull(),
  status: varchar("status", { length: 10 }).default("pending"),
  resultUrl: text("result_url"),
  createdAt: timestamp("created_at").defaultNow(),
});
