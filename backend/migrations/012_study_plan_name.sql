-- Migration 012: Add name and attempt_id to study_plans
ALTER TABLE study_plans
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS attempt_id CHAR(36);
