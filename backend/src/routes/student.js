const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');
const diagnosticController = require('../controllers/diagnosticController');
const masteryController = require('../controllers/masteryController');
const mistakesController = require('../controllers/mistakesController');
const simulatorController = require('../controllers/simulatorController');

// All student routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Diagnostic (first-time gated test)
router.get ('/diagnostic/status', diagnosticController.status);
router.post('/diagnostic/start',  diagnosticController.start);
router.post('/diagnostic/answer', diagnosticController.answer);
router.post('/diagnostic/submit', diagnosticController.submit);
router.get ('/diagnostic/report', diagnosticController.report);

// Mastery + Daily focus (personalised learning loop)
router.get('/mastery',      masteryController.getMastery);
router.get('/focus-today',  masteryController.getFocusToday);

// Mistake Replay Queue — wrong answers auto-collected for re-attempt
router.get   ('/mistakes',                   mistakesController.getMistakes);
router.get   ('/mistakes/replay',            mistakesController.getReplay);
router.post  ('/mistakes/answer',            mistakesController.submitAnswer);
router.delete('/mistakes/:entry_id',         mistakesController.dismissMistake);

// Company Exam Simulator — multi-section proctored mocks (TCS NQT / Infosys SP / …)
router.get ('/simulator/companies',        simulatorController.listCompanies);
router.post('/simulator/start',            simulatorController.start);
router.get ('/simulator/attempt/:id',      simulatorController.getAttempt);
router.post('/simulator/answer',           simulatorController.answer);
router.post('/simulator/submit-section',   simulatorController.submitSection);
router.post('/simulator/submit',           simulatorController.submit);
router.get ('/simulator/result/:id',       simulatorController.result);

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Subjects (with topics) — for Practice page topic picker
router.get('/subjects', studentController.getSubjects);
router.get('/topics/:id/concepts', studentController.getConceptsByTopic);

// AI-powered smart topics / concepts / material generation
// NOTE: ai-generate must be BEFORE /:id routes to avoid Express param match
router.get('/smart-topics', studentController.getSmartTopics);
router.get('/smart-concepts', studentController.getSmartConcepts);
router.post('/materials/ai-generate', studentController.aiGenerateMaterials);

// Study Materials
router.get('/materials', studentController.getMaterials);
router.get('/materials/:id', studentController.getMaterialById);
router.post('/materials/:id/mark-learned', studentController.markLearned);
router.post('/materials/:id/bookmark', studentController.bookmarkMaterial);
router.delete('/materials/:id', studentController.deleteAIMaterial);

// Teacher Notes
router.get('/notes', studentController.getNotes);

// Practice Sessions
router.get('/practice/sessions', studentController.getPracticeSessions);
router.post('/practice/start', studentController.startPractice);
router.post('/practice/submit-answer', studentController.submitPracticeAnswer);
router.post('/practice/end', studentController.endPractice);
router.delete('/practice/sessions/:id', studentController.deletePracticeSession);
router.post('/practice/syllabus-extract',
  require('multer')({ storage: require('multer').memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single('syllabus'),
  studentController.syllabusExtractTopics
);

// Assigned Tests
router.get('/tests', studentController.getAssignedTests);
router.post('/tests/:id/start', studentController.startTest);
router.post('/tests/attempts/:id/answer', studentController.saveTestAnswer);
router.post('/tests/attempts/:id/submit', studentController.submitTest);
router.post('/tests/attempts/:id/violation', studentController.reportViolation);

// Reports
router.get('/reports', studentController.getReports);
router.get('/reports/:id', studentController.getReportById);
router.delete('/reports/:id', studentController.deleteReport);
router.delete('/reports', studentController.deleteAllReports);

// Study Plan
router.post('/plan/generate', studentController.generatePlan);
router.get('/plan', studentController.getCurrentPlan);
router.post('/plan/tasks/:id/complete', studentController.completeTask);

// Company Corner
router.get('/companies', studentController.getCompanies);
router.get('/companies/:id', studentController.getCompanyById);
router.post('/companies/:id/generate-questions', studentController.generateCompanyQuestions);
router.post('/companies/:id/topic-questions', studentController.generateTopicQuestions);

// Leaderboard
router.get('/leaderboard', studentController.getLeaderboard);

// Bookmarks
router.post('/bookmarks', studentController.addBookmark);
router.get('/bookmarks', studentController.getBookmarks);
router.delete('/bookmarks/:id', studentController.removeBookmark);

// Doubts
router.post('/doubts', studentController.postDoubt);
router.get('/doubts', studentController.getDoubts);
router.post('/doubts/:id/answers', studentController.answerDoubt);

// Skill Profile
router.get('/skills', studentController.getSkillProfile);

module.exports = router;
