-- Migration 006: Diagnostic test feature
-- A first-time, gated 30-question test that benchmarks a student across all
-- four placement subjects and feeds the personalised study plan.

-- Track diagnostic completion on the user record (used for gating).
ALTER TABLE users ADD COLUMN IF NOT EXISTS diagnostic_completed_at DATETIME NULL;

-- One row per student per attempt (currently always 1 attempt per student).
CREATE TABLE IF NOT EXISTS diagnostic_attempts (
  attempt_id          CHAR(36)    NOT NULL,
  student_id          CHAR(36)    NOT NULL,
  started_at          DATETIME    DEFAULT CURRENT_TIMESTAMP,
  submitted_at        DATETIME    NULL,
  total_questions     INT         DEFAULT 0,
  correct_count       INT         DEFAULT 0,
  accuracy_percent    DECIMAL(5,2) NULL,
  time_taken_seconds  INT         NULL,
  section_breakdown   JSON        NULL,
  status              VARCHAR(20) DEFAULT 'in_progress',
  PRIMARY KEY (attempt_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_student  ON diagnostic_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_status   ON diagnostic_attempts(status);

-- Per-question answer rows (so we can render a per-question review later).
CREATE TABLE IF NOT EXISTS diagnostic_answers (
  attempt_id          CHAR(36)    NOT NULL,
  question_id         CHAR(36)    NOT NULL,
  question_order      INT         NOT NULL,
  subject_id          CHAR(36)    NULL,
  topic_id            CHAR(36)    NULL,
  selected_answer     VARCHAR(10) NULL,
  is_correct          TINYINT(1)  DEFAULT 0,
  time_taken_seconds  INT         DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES diagnostic_attempts(attempt_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_diag_answers_attempt ON diagnostic_answers(attempt_id);
