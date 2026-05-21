-- Migration 008: Mistake Replay Queue
-- Auto-collects every wrong answer (from practice, tests, diagnostic) so the
-- student can re-attempt them later. One row per (student, question).
CREATE TABLE IF NOT EXISTS wrong_answer_queue (
  entry_id           CHAR(36)    NOT NULL,
  student_id         CHAR(36)    NOT NULL,
  question_id        CHAR(36)    NOT NULL,
  source             VARCHAR(20) NULL,        -- 'practice' | 'test' | 'diagnostic'
  source_id          CHAR(36)    NULL,        -- session / attempt id
  topic_id           CHAR(36)    NULL,
  subject_id         CHAR(36)    NULL,
  original_selected  VARCHAR(10) NULL,        -- what they answered first time
  correct_answer     VARCHAR(10) NULL,        -- snapshot for fast display
  replay_attempts    INT         DEFAULT 0,
  last_replayed_at   DATETIME    NULL,
  mastered_at        DATETIME    NULL,        -- non-null = got it right in replay
  created_at         DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_id),
  UNIQUE KEY uq_wrong_student_question (student_id, question_id),
  FOREIGN KEY (student_id)  REFERENCES users(user_id)         ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wrong_student_state ON wrong_answer_queue(student_id, mastered_at);
CREATE INDEX IF NOT EXISTS idx_wrong_topic         ON wrong_answer_queue(topic_id);
