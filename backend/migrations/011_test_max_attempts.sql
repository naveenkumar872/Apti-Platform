-- Migration 011: Cap how many times a student can attempt each test.
-- NULL or 0 means unlimited (admin's choice). Otherwise the start handler
-- rejects new attempts once attempt_count >= max_attempts.
ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_attempts INT NULL;
