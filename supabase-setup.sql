-- ============================================================================
-- Pulse AI — Complete Database Setup Script
-- Run this entire script in: Supabase → SQL Editor → New Query → Run
-- ============================================================================

-- Enable UUID generation (usually already enabled on Supabase, but safe to include)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLE: User
-- ============================================================================
CREATE TABLE IF NOT EXISTS "User" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  "passwordHash"  TEXT NOT NULL,
  tier            TEXT NOT NULL DEFAULT 'free',
  "auditsThisMonth" INTEGER NOT NULL DEFAULT 0,
  "auditsResetAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: Session
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Session" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token       TEXT UNIQUE NOT NULL,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"(token);

-- ============================================================================
-- TABLE: Project
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Project" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'website',
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId");

-- ============================================================================
-- TABLE: Audit
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Audit" (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"           TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending',
  mode                  TEXT NOT NULL DEFAULT 'simple',
  "healthScore"         FLOAT,
  "performanceScore"    FLOAT,
  "seoScore"            FLOAT,
  "accessibilityScore"  FLOAT,
  "securityScore"       FLOAT,
  "uxScore"             FLOAT,
  "technologyScore"     FLOAT,
  "contentScore"        FLOAT,
  findings              TEXT NOT NULL DEFAULT '{}',
  "aiSummary"           TEXT NOT NULL DEFAULT '{}',
  "responseTime"        FLOAT,
  "pageSize"            FLOAT,
  "createdAt"           TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Audit_projectId_idx" ON "Audit"("projectId");
CREATE INDEX IF NOT EXISTS "Audit_status_idx" ON "Audit"(status);
CREATE INDEX IF NOT EXISTS "Audit_createdAt_idx" ON "Audit"("createdAt");

-- ============================================================================
-- TABLE: _prisma_migrations
-- (Required so Prisma doesn't complain about missing migration history.
--  Not used for actual migration tracking in this manual-SQL setup.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  id                      TEXT PRIMARY KEY,
  checksum                TEXT NOT NULL,
  finished_at             TIMESTAMP,
  migration_name          TEXT NOT NULL,
  logs                    TEXT,
  rolled_back_at          TIMESTAMP,
  started_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_steps_count     INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- VERIFY: Run this to confirm all tables were created correctly
-- ============================================================================
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('User', 'Session', 'Project', 'Audit', '_prisma_migrations')
ORDER BY table_name;

-- ============================================================================
-- TABLE: Competitor (added for Competitor Benchmarking feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Competitor" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  "lastAuditId" TEXT,
  comparison  TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Competitor_projectId_idx" ON "Competitor"("projectId");

-- ============================================================================
-- TABLE: MonitorSchedule (added for Continuous Monitoring feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MonitorSchedule" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"   TEXT NOT NULL UNIQUE REFERENCES "Project"(id) ON DELETE CASCADE,
  enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  frequency     TEXT NOT NULL DEFAULT 'weekly',
  mode          TEXT NOT NULL DEFAULT 'simple',
  "lastRunAt"   TIMESTAMP,
  "nextRunAt"   TIMESTAMP,
  "alertOnDrop" BOOLEAN NOT NULL DEFAULT TRUE,
  "dropThreshold" INTEGER NOT NULL DEFAULT 10,
  "alertEmail"  TEXT,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Add columns to Audit table for Technology/Content scores (if not already run)
-- ============================================================================
ALTER TABLE "Audit" ADD COLUMN IF NOT EXISTS "technologyScore" FLOAT;
ALTER TABLE "Audit" ADD COLUMN IF NOT EXISTS "contentScore" FLOAT;
