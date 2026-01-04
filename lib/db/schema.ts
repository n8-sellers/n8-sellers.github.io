import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  pgEnum,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const impactLevelEnum = pgEnum("impact_level", [
  "breakthrough",
  "significant",
  "incremental",
  "early_stage",
]);

export const treatmentCategoryEnum = pgEnum("treatment_category", [
  "immunotherapy",
  "targeted_therapy",
  "gene_therapy",
  "screening_detection",
  "prevention",
  "surgical",
  "radiation",
  "combination",
  "supportive_care",
  "other",
]);

export const researchPhaseEnum = pgEnum("research_phase", [
  "preclinical",
  "phase_1",
  "phase_2",
  "phase_3",
  "fda_review",
  "approved",
  "basic_research",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "peer_reviewed",
  "clinical_trial",
  "institutional",
  "conference",
  "preprint",
  "press_release",
]);

export const digestTypeEnum = pgEnum("digest_type", ["weekly", "monthly"]);

export const jobTypeEnum = pgEnum("job_type", [
  "daily",
  "weekly_digest",
  "monthly_digest",
]);

export const fetchStatusEnum = pgEnum("fetch_status", [
  "success",
  "partial",
  "failed",
]);

// Tables
export const researchEntries = pgTable("research_entries", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Core content
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  plainLanguageSummary: text("plain_language_summary"),

  // Classification
  impactLevel: impactLevelEnum("impact_level").notNull(),
  cancerTypes: text("cancer_types")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  treatmentCategory: treatmentCategoryEnum("treatment_category").notNull(),
  researchPhase: researchPhaseEnum("research_phase").notNull(),

  // Impact assessment
  timeToImpact: text("time_to_impact"),
  implications: text("implications")
    .array()
    .default(sql`ARRAY[]::text[]`),

  // Source tracking
  sourceUrl: text("source_url").notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  sourceName: text("source_name"),
  institutions: text("institutions")
    .array()
    .default(sql`ARRAY[]::text[]`),
  authors: text("authors").array().default(sql`ARRAY[]::text[]`),
  doi: text("doi"),

  // Dates
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),

  // AI metadata
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  aiModelUsed: text("ai_model_used"),

  // Admin
  isVisible: boolean("is_visible").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const digests = pgTable("digests", {
  id: uuid("id").defaultRandom().primaryKey(),
  digestType: digestTypeEnum("digest_type").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown formatted
  highlights: jsonb("highlights"), // Structured highlights data
  stats: jsonb("stats"), // Period statistics for quick access
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fetchLogs = pgTable("fetch_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobType: jobTypeEnum("job_type").notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  sourcesQueried: text("sources_queried")
    .array()
    .default(sql`ARRAY[]::text[]`),
  candidatesFound: integer("candidates_found").default(0),
  entriesAdded: integer("entries_added").default(0),
  duplicatesSkipped: integer("duplicates_skipped").default(0),
  errors: jsonb("errors"),
  status: fetchStatusEnum("status").notNull(),
});

export const monthlyStats = pgTable("monthly_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  month: date("month").notNull().unique(), // First of month
  totalEntries: integer("total_entries").default(0).notNull(),
  breakthroughs: integer("breakthroughs").default(0).notNull(),
  byCancerType: jsonb("by_cancer_type"),
  byTreatmentCategory: jsonb("by_treatment_category"),
  byResearchPhase: jsonb("by_research_phase"),
  bySourceType: jsonb("by_source_type"),
  topInstitutions: jsonb("top_institutions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type ResearchEntry = typeof researchEntries.$inferSelect;
export type NewResearchEntry = typeof researchEntries.$inferInsert;
export type Digest = typeof digests.$inferSelect;
export type NewDigest = typeof digests.$inferInsert;
export type FetchLog = typeof fetchLogs.$inferSelect;
export type NewFetchLog = typeof fetchLogs.$inferInsert;
export type MonthlyStats = typeof monthlyStats.$inferSelect;
export type NewMonthlyStats = typeof monthlyStats.$inferInsert;
