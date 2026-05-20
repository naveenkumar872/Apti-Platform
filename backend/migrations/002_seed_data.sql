-- Migration 002: Seed taxonomy data (MySQL / TiDB compatible)

-- SUBJECTS
INSERT IGNORE INTO subjects (subject_id, name, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Quantitative Aptitude', 1),
  ('00000000-0000-0000-0000-000000000002', 'Logical Reasoning', 2),
  ('00000000-0000-0000-0000-000000000003', 'Verbal Ability', 3),
  ('00000000-0000-0000-0000-000000000004', 'Data Interpretation', 4);

-- QUANTITATIVE APTITUDE TOPICS
INSERT IGNORE INTO topics (topic_id, subject_id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Number System'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Percentages'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Profit and Loss'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Time and Work'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Time Speed Distance'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Simple and Compound Interest'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Algebra'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Geometry and Mensuration'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Probability'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Permutation and Combination'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Ratio and Proportion'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Averages and Mixtures');

-- LOGICAL REASONING TOPICS
INSERT IGNORE INTO topics (topic_id, subject_id, name) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Blood Relations'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Seating Arrangement'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Syllogism'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Coding Decoding'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Directions and Distance'),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Series Completion'),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Puzzles'),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 'Inequalities'),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'Clocks and Calendars'),
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Decision Making');

-- VERBAL ABILITY TOPICS
INSERT IGNORE INTO topics (topic_id, subject_id, name) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Reading Comprehension'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Grammar and Usage'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Vocabulary'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Sentence Completion'),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Synonyms and Antonyms'),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'Para Jumbles'),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'Error Spotting');

-- DATA INTERPRETATION TOPICS
INSERT IGNORE INTO topics (topic_id, subject_id, name) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Bar Charts'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Line Graphs'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Pie Charts'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Tables'),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'Caselets');

-- CONCEPTS for Time and Work
INSERT IGNORE INTO concepts (concept_id, topic_id, name) VALUES
  ('10040001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Basic Work Problems'),
  ('10040002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Pipes and Cisterns'),
  ('10040003-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Combined Work'),
  ('10040004-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Work Efficiency Problems');

-- CONCEPTS for Percentages
INSERT IGNORE INTO concepts (concept_id, topic_id, name) VALUES
  ('10020001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Basic Percentage Calculations'),
  ('10020002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Percentage Change'),
  ('10020003-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Successive Percentages');

-- CONCEPTS for Probability
INSERT IGNORE INTO concepts (concept_id, topic_id, name) VALUES
  ('10090001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'Basic Probability'),
  ('10090002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'Conditional Probability'),
  ('10090003-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'Bayes Theorem');

-- Companies
INSERT IGNORE INTO companies (company_id, name, important_topics, test_pattern) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'TCS',
   '["Number System","Percentages","Time and Work","Syllogism","Coding Decoding","Reading Comprehension"]',
   '{"sections":["Verbal","Reasoning","Quantitative"],"duration":90,"questions":30,"marking":{"correct":1,"wrong":0}}'),
  ('c0000002-0000-0000-0000-000000000001', 'Infosys',
   '["Puzzles","Seating Arrangement","Data Interpretation","Reading Comprehension","Probability"]',
   '{"sections":["Reasoning","Mathematical Ability","Verbal"],"duration":95,"questions":40,"marking":{"correct":1,"wrong":0}}'),
  ('c0000003-0000-0000-0000-000000000001', 'Wipro',
   '["Number System","Time Speed Distance","Syllogism","Vocabulary","Bar Charts"]',
   '{"sections":["Aptitude","Verbal","Reasoning"],"duration":60,"questions":65,"marking":{"correct":1,"wrong":0}}'),
  ('c0000004-0000-0000-0000-000000000001', 'Accenture',
   '["Profit and Loss","Percentages","Blood Relations","Para Jumbles","Pie Charts"]',
   '{"sections":["Quantitative","Verbal","Logical"],"duration":60,"questions":40,"marking":{"correct":1,"wrong":0}}'),
  ('c0000005-0000-0000-0000-000000000001', 'Capgemini',
   '["Algebra","Permutation and Combination","Coding Decoding","Sentence Completion","Tables"]',
   '{"sections":["Psychometric","Aptitude","English","Logical"],"duration":105,"questions":55,"marking":{"correct":1,"wrong":0}}'),
  ('c0000006-0000-0000-0000-000000000001', 'Cognizant',
   '["Averages","Ratio and Proportion","Series Completion","Grammar","Line Graphs"]',
   '{"sections":["Aptitude","Logical","Verbal"],"duration":60,"questions":55,"marking":{"correct":1,"wrong":0}}');

-- Sample questions for demonstration
INSERT IGNORE INTO questions (question_id, concept_id, question_text, question_type, options, correct_answer, explanation, difficulty, estimated_time_seconds, source)
VALUES
  (UUID(), '10020001-0000-0000-0000-000000000001',
   'If 30% of a number is 90, what is 60% of that number?',
   'mcq',
   '[{"id":"A","text":"150"},{"id":"B","text":"180"},{"id":"C","text":"270"},{"id":"D","text":"200"}]',
   'B', 'If 30% = 90, then 100% = 300. 60% of 300 = 180.',
   2, 45, 'manual'),
  (UUID(), '10040001-0000-0000-0000-000000000001',
   'A can complete a work in 10 days and B can complete it in 15 days. In how many days can they together complete the work?',
   'mcq',
   '[{"id":"A","text":"5 days"},{"id":"B","text":"6 days"},{"id":"C","text":"8 days"},{"id":"D","text":"12 days"}]',
   'B', 'A''s 1 day work = 1/10, B''s 1 day work = 1/15. Together = 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6. So 6 days.',
   2, 60, 'manual'),
  (UUID(), '10090001-0000-0000-0000-000000000001',
   'What is the probability of getting an even number when a fair die is rolled?',
   'mcq',
   '[{"id":"A","text":"1/6"},{"id":"B","text":"1/3"},{"id":"C","text":"1/2"},{"id":"D","text":"2/3"}]',
   'C', 'Even numbers on a die: 2, 4, 6. Total outcomes = 6. Probability = 3/6 = 1/2.',
   1, 30, 'manual');
