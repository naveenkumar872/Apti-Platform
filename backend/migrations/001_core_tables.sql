-- Migration 001: Core tables (MySQL / TiDB compatible)

-- Batches (must be created before users due to FK)
CREATE TABLE IF NOT EXISTS batches (
  batch_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  college VARCHAR(200),
  year INTEGER,
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (batch_id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  college VARCHAR(200),
  branch VARCHAR(50),
  year INTEGER,
  target_companies JSON,
  target_exam_date DATE,
  profile_photo_url TEXT,
  batch_id CHAR(36),
  is_verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_batch ON users(batch_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Email OTPs
CREATE TABLE IF NOT EXISTS email_otps (
  user_id CHAR(36) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id CHAR(36),
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
  user_id CHAR(36) NOT NULL,
  token VARCHAR(100) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_password_resets_token (token),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Subjects (taxonomy level 1)
CREATE TABLE IF NOT EXISTS subjects (
  subject_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (subject_id)
);

-- Topics (taxonomy level 2)
CREATE TABLE IF NOT EXISTS topics (
  topic_id CHAR(36) NOT NULL,
  subject_id CHAR(36),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  PRIMARY KEY (topic_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);

-- Concepts (taxonomy level 3)
CREATE TABLE IF NOT EXISTS concepts (
  concept_id CHAR(36) NOT NULL,
  topic_id CHAR(36),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  PRIMARY KEY (concept_id),
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_concepts_topic ON concepts(topic_id);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  question_id CHAR(36) NOT NULL,
  concept_id CHAR(36),
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'mcq',
  options JSON,
  correct_answer VARCHAR(10) NOT NULL,
  explanation TEXT,
  difficulty INTEGER DEFAULT 3,
  estimated_time_seconds INTEGER DEFAULT 60,
  company_tags JSON,
  source VARCHAR(50) DEFAULT 'manual',
  created_by CHAR(36),
  quality_flag VARCHAR(20) DEFAULT 'ok',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id),
  FOREIGN KEY (concept_id) REFERENCES concepts(concept_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_concept ON questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- Tests
CREATE TABLE IF NOT EXISTS tests (
  test_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  mode VARCHAR(20) DEFAULT 'practice',
  duration_minutes INTEGER,
  total_marks DECIMAL(10,2) DEFAULT 0,
  marking_scheme JSON,
  shuffle_questions TINYINT(1) DEFAULT 0,
  shuffle_options TINYINT(1) DEFAULT 0,
  proctoring_config JSON,
  start_time DATETIME,
  end_time DATETIME,
  assigned_to JSON,
  created_by CHAR(36),
  status VARCHAR(20) DEFAULT 'draft',
  show_results VARCHAR(20) DEFAULT 'immediately',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (test_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);

-- Test Questions (junction)
CREATE TABLE IF NOT EXISTS test_questions (
  test_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  display_order INTEGER DEFAULT 0,
  marks DECIMAL(10,2) DEFAULT 1,
  PRIMARY KEY (test_id, question_id),
  FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- Test Attempts
CREATE TABLE IF NOT EXISTS test_attempts (
  attempt_id CHAR(36) NOT NULL,
  test_id CHAR(36),
  student_id CHAR(36),
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  time_taken_seconds INTEGER DEFAULT 0,
  score DECIMAL(10,2) DEFAULT 0,
  total_marks DECIMAL(10,2) DEFAULT 0,
  accuracy_percent DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
  violations_count INTEGER DEFAULT 0,
  PRIMARY KEY (attempt_id),
  FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_test ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON test_attempts(status);

-- Attempt Answers
CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  selected_answer VARCHAR(10),
  is_correct TINYINT(1),
  time_taken_seconds INTEGER DEFAULT 0,
  marked_for_review TINYINT(1) DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(attempt_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- Practice Sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
  session_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  question_ids JSON,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  score INTEGER DEFAULT 0,
  accuracy_percent DECIMAL(5,2) DEFAULT 0,
  time_limit_minutes INTEGER,
  status VARCHAR(20) DEFAULT 'in_progress',
  PRIMARY KEY (session_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Practice Answers
CREATE TABLE IF NOT EXISTS practice_answers (
  session_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  selected_answer VARCHAR(10),
  is_correct TINYINT(1),
  time_taken_seconds INTEGER DEFAULT 0,
  PRIMARY KEY (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES practice_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- Student Skill Profile
CREATE TABLE IF NOT EXISTS student_skill_profile (
  student_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NOT NULL,
  accuracy_percent DECIMAL(5,2) DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  avg_time_seconds INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1200,
  is_weak TINYINT(1) DEFAULT 0,
  last_attempted DATETIME,
  PRIMARY KEY (student_id, topic_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);

-- Study Plans
CREATE TABLE IF NOT EXISTS study_plans (
  plan_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_weeks INTEGER DEFAULT 4,
  status VARCHAR(20) DEFAULT 'active',
  source VARCHAR(20) DEFAULT 'ai_generated',
  PRIMARY KEY (plan_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Plan Tasks
CREATE TABLE IF NOT EXISTS plan_tasks (
  task_id CHAR(36) NOT NULL,
  plan_id CHAR(36),
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  task_type VARCHAR(30),
  reference_id CHAR(36),
  topic_id CHAR(36),
  description TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  is_completed TINYINT(1) DEFAULT 0,
  completed_at DATETIME,
  PRIMARY KEY (task_id),
  FOREIGN KEY (plan_id) REFERENCES study_plans(plan_id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE SET NULL
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
  material_id CHAR(36) NOT NULL,
  title VARCHAR(300) NOT NULL,
  type VARCHAR(20) NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  subject_id CHAR(36),
  topic_id CHAR(36),
  concept_id CHAR(36),
  uploaded_by CHAR(36),
  visibility VARCHAR(20) DEFAULT 'public',
  target_batch_id CHAR(36),
  download_allowed TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (material_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE SET NULL,
  FOREIGN KEY (concept_id) REFERENCES concepts(concept_id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (target_batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL
);

-- Student Progress (material learned tracking)
CREATE TABLE IF NOT EXISTS student_progress (
  student_id CHAR(36) NOT NULL,
  material_id CHAR(36) NOT NULL,
  marked_learned_at DATETIME,
  PRIMARY KEY (student_id, material_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  company_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  important_topics JSON,
  test_pattern JSON,
  cutoff_info TEXT,
  interview_tips TEXT,
  PRIMARY KEY (company_id),
  UNIQUE KEY uq_companies_name (name)
);

-- Past Papers
CREATE TABLE IF NOT EXISTS past_papers (
  paper_id CHAR(36) NOT NULL,
  company_id CHAR(36),
  year INTEGER NOT NULL,
  round VARCHAR(50),
  file_url TEXT NOT NULL,
  uploaded_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (paper_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_batches JSON,
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (announcement_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Doubts
CREATE TABLE IF NOT EXISTS doubts (
  doubt_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  question_text TEXT NOT NULL,
  subject_id CHAR(36),
  topic_id CHAR(36),
  status VARCHAR(20) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (doubt_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE SET NULL
);

-- Doubt Answers
CREATE TABLE IF NOT EXISTS doubt_answers (
  answer_id CHAR(36) NOT NULL,
  doubt_id CHAR(36),
  answered_by CHAR(36),
  answer_text TEXT NOT NULL,
  is_best_answer TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (answer_id),
  FOREIGN KEY (doubt_id) REFERENCES doubts(doubt_id) ON DELETE CASCADE,
  FOREIGN KEY (answered_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  bookmark_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  item_type VARCHAR(20),
  item_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (bookmark_id),
  UNIQUE KEY uq_bookmark (student_id, item_type, item_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Proctoring Violations
CREATE TABLE IF NOT EXISTS violations (
  violation_id CHAR(36) NOT NULL,
  test_attempt_id CHAR(36),
  student_id CHAR(36),
  violation_type VARCHAR(30),
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  details JSON,
  snapshot_url TEXT,
  PRIMARY KEY (violation_id),
  FOREIGN KEY (test_attempt_id) REFERENCES test_attempts(attempt_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  log_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id CHAR(36),
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  details JSON,
  PRIMARY KEY (log_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurred ON audit_log(occurred_at);

-- Seed: default admin user (password: Admin@123)
INSERT IGNORE INTO users (user_id, name, email, password_hash, role, is_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Platform Admin',
  'admin@aptitudeplatform.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2BhRfZaUb.',
  'admin',
  1
);

