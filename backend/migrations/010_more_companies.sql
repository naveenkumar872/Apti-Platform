-- Migration 010: Add 7 more popular placement companies to the simulator.
-- Patterns approximated from public exam-pattern info as of 2024-25.

INSERT IGNORE INTO companies (company_id, name, important_topics, cutoff_info, interview_tips) VALUES
  ('c0000010-0000-0000-0000-000000000001', 'Accenture',
   '["Pseudocode","Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   'Sectional cutoffs apply. Pseudocode + cognitive section are key.',
   'Accenture rewards consistency across sections. Don\'t over-invest in one part.'),
  ('c0000011-0000-0000-0000-000000000001', 'HCL TechBee',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   'Around 60% overall cutoff',
   'HCL TechBee aptitude is mid-difficulty. Focus on speed in reasoning.'),
  ('c0000012-0000-0000-0000-000000000001', 'Tech Mahindra',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   '~55% sectional cutoff',
   'Tech Mahindra is accessible — accuracy matters more than difficulty.'),
  ('c0000013-0000-0000-0000-000000000001', 'LTIMindtree',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Pseudocode"]',
   'Sectional + overall cutoffs around 60%',
   'LTIMindtree leans on pseudocode and aptitude — practice both equally.'),
  ('c0000014-0000-0000-0000-000000000001', 'IBM',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability"]',
   'Section cutoffs vary by role - around 65% is the safe target',
   'IBM tends to skew toward logical and verbal — read passages carefully.'),
  ('c0000015-0000-0000-0000-000000000001', 'Deloitte USI',
   '["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Data Interpretation"]',
   'Roughly 70% overall is the safe zone',
   'Deloitte rounds are slightly harder — DI and verbal accuracy are decisive.'),
  ('c0000016-0000-0000-0000-000000000001', 'ZS Associates',
   '["Quantitative Aptitude","Logical Reasoning","Data Interpretation"]',
   '~70%+ scores typically advance',
   'ZS is heavy on data interpretation and case-style reasoning — practice DI sets.');

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
}' WHERE name = 'Accenture';

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
}' WHERE name = 'HCL TechBee';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 55,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 55,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":8,"duration_minutes":18,"cutoff_percent":55},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":8,"duration_minutes":18,"cutoff_percent":55},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":9,"duration_minutes":19,"cutoff_percent":55}
  ]
}' WHERE name = 'Tech Mahindra';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 70,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 60,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":22,"cutoff_percent":60},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":12,"duration_minutes":24,"cutoff_percent":60},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":12,"duration_minutes":24,"cutoff_percent":60}
  ]
}' WHERE name = 'LTIMindtree';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 70,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 65,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":22,"cutoff_percent":65},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":12,"duration_minutes":24,"cutoff_percent":65},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":12,"duration_minutes":24,"cutoff_percent":65}
  ]
}' WHERE name = 'IBM';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 80,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 70,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":10,"duration_minutes":20,"cutoff_percent":70},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":10,"duration_minutes":20,"cutoff_percent":70},
    {"name":"Verbal Ability",      "subject_id":"00000000-0000-0000-0000-000000000003","question_count":10,"duration_minutes":20,"cutoff_percent":70},
    {"name":"Data Interpretation", "subject_id":"00000000-0000-0000-0000-000000000004","question_count":10,"duration_minutes":20,"cutoff_percent":70}
  ]
}' WHERE name = 'Deloitte USI';

UPDATE companies SET test_pattern = '{
  "duration_minutes": 75,
  "navigation": "section_locked",
  "negative_marking": 0,
  "overall_cutoff_percent": 70,
  "sections": [
    {"name":"Quantitative Aptitude","subject_id":"00000000-0000-0000-0000-000000000001","question_count":12,"duration_minutes":25,"cutoff_percent":70},
    {"name":"Logical Reasoning",   "subject_id":"00000000-0000-0000-0000-000000000002","question_count":12,"duration_minutes":25,"cutoff_percent":70},
    {"name":"Data Interpretation", "subject_id":"00000000-0000-0000-0000-000000000004","question_count":11,"duration_minutes":25,"cutoff_percent":70}
  ]
}' WHERE name = 'ZS Associates';
