-- Migration 004: Add metadata columns to practice_sessions
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS method VARCHAR(20) DEFAULT 'topic',
  ADD COLUMN IF NOT EXISTS config JSON;
