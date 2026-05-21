-- Migration 005: Add content and url columns to plan_tasks
ALTER TABLE plan_tasks
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT;
