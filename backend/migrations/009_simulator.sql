-- Migration 009: Company Exam Simulator
-- A separate attempt/answer pair just for proctored company simulations
-- (TCS NQT, Infosys SP, Wipro Elite NTH, Cognizant GenC, Capgemini).

-- Section-locked attempts. Distinct from test_attempts so simulator metadata
-- (section results, cutoff verdicts) doesn't clutter the regular tests table.
CREATE TABLE IF NOT EXISTS simulated_attempts (
  attempt_id          CHAR(36)    NOT NULL,
  student_id          CHAR(36)    NOT NULL,
  company_id          CHAR(36)    NOT NULL,
  pattern_snapshot    JSON        NULL,       -- frozen copy of test_pattern at start time
  started_at          DATETIME    DEFAULT CURRENT_TIMESTAMP,
  submitted_at        DATETIME    NULL,
  total_questions     INT         DEFAULT 0,
  correct_count       INT         DEFAULT 0,
  accuracy_percent    DECIMAL(5,2) NULL,
  time_taken_seconds  INT         NULL,
  section_results     JSON        NULL,       -- [{name, total, correct, accuracy, cutoff, passed}]
  overall_passed      TINYINT(1)  DEFAULT 0,
  current_section     INT         DEFAULT 0,  -- 0-indexed, advances as sections submit
  violations_count    INT         DEFAULT 0,
  status              VARCHAR(20) DEFAULT 'in_progress',
  PRIMARY KEY (attempt_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sim_attempts_student ON simulated_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_sim_attempts_company ON simulated_attempts(company_id);

-- Per-question rows. section_index lets the frontend palette group by section.
CREATE TABLE IF NOT EXISTS simulated_answers (
  attempt_id          CHAR(36)    NOT NULL,
  question_id         CHAR(36)    NOT NULL,
  question_order      INT         NOT NULL,
  section_index       INT         NOT NULL,
  selected_answer     VARCHAR(10) NULL,
  is_correct          TINYINT(1)  DEFAULT 0,
  flagged             TINYINT(1)  DEFAULT 0,
  time_taken_seconds  INT         DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES simulated_attempts(attempt_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sim_answers_section ON simulated_answers(attempt_id, section_index);

-- Seed canonical company exam patterns into the existing companies table.
INSERT IGNORE INTO companies (company_id, name, important_topics, cutoff_info, interview_tips)
VALUES
  ('c0000001-0000-0000-0000-000000000002', 'TCS NQT',
   '["Number System","Time and Work","Percentages","Probability","Reading Comprehension","Coding Decoding","Series","Verbal Ability"]',
   'Section-wise cutoff: clear every section to qualify',
   'TCS NQT is a foundational sectioned aptitude. Manage section time strictly.'),
  ('c0000002-0000-0000-0000-000000000002', 'Infosys SP',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Pseudocode"]',
   'Around 65% overall + sectional cutoffs',
   'Watch the difficulty — Infosys SP is one notch above NQT. Focus on logical and pseudocode.'),
  ('c0000005-0000-0000-0000-000000000002', 'Wipro Elite NTH',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   'Sectional cutoff around 55%',
   'Wipro Elite NTH rewards speed. Don\'t over-think — flag and move on.'),
  ('c0000006-0000-0000-0000-000000000002', 'Cognizant GenC',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   'Cutoffs ~60% overall',
   'Verbal section is heavier than NQT. Read the passages carefully.'),
  ('c0000007-0000-0000-0000-000000000001', 'Capgemini',
   '["Game-based Aptitude","Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   'Sectional cutoffs apply',
   'Capgemini emphasises Pseudocode and Essay. Practice section-locked tests.');

-- Set the rich per-section pattern (always overwrite so admins get the latest layout).
UPDATE companies SET test_pattern = '{
  "duration_minutes": 60,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 60,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":20,"cutoff_percent":60},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":10,"duration_minutes":20,"cutoff_percent":60},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":10,"duration_minutes":20,"cutoff_percent":60}
  ]
}' WHERE name = 'TCS NQT';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 75,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 65,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":25,"cutoff_percent":65},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":15,"duration_minutes":25,"cutoff_percent":65},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":15,"duration_minutes":25,"cutoff_percent":65}
  ]
}' WHERE name = 'Infosys SP';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 60,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 55,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":20,"cutoff_percent":55},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":10,"duration_minutes":20,"cutoff_percent":55},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":10,"duration_minutes":20,"cutoff_percent":55}
  ]
}' WHERE name = 'Wipro Elite NTH';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 55,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 60,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":8,"duration_minutes":18,"cutoff_percent":60},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":8,"duration_minutes":18,"cutoff_percent":60},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":9,"duration_minutes":19,"cutoff_percent":60}
  ]
}' WHERE name = 'Cognizant GenC';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 65,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 60,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":22,"cutoff_percent":60},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":10,"duration_minutes":22,"cutoff_percent":60},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":10,"duration_minutes":21,"cutoff_percent":60}
  ]
}' WHERE name = 'Capgemini';
