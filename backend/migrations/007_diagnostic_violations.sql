-- Migration 007: store proctoring violation count on diagnostic attempts.
ALTER TABLE diagnostic_attempts ADD COLUMN IF NOT EXISTS violations_count INT DEFAULT 0;
