const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// All student routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Subjects (with topics) — for Practice page topic picker
router.get('/subjects', studentController.getSubjects);
router.get('/topics/:id/concepts', studentController.getConceptsByTopic);

// Study Materials
router.get('/materials', studentController.getMaterials);
router.get('/materials/:id', studentController.getMaterialById);
router.post('/materials/:id/mark-learned', studentController.markLearned);
router.post('/materials/:id/bookmark', studentController.bookmarkMaterial);

// Teacher Notes
router.get('/notes', studentController.getNotes);

// Practice Sessions
router.post('/practice/start', studentController.startPractice);
router.post('/practice/submit-answer', studentController.submitPracticeAnswer);
router.post('/practice/end', studentController.endPractice);

// Assigned Tests
router.get('/tests', studentController.getAssignedTests);
router.post('/tests/:id/start', studentController.startTest);
router.post('/tests/attempts/:id/answer', studentController.saveTestAnswer);
router.post('/tests/attempts/:id/submit', studentController.submitTest);
router.post('/tests/attempts/:id/violation', studentController.reportViolation);

// Reports
router.get('/reports', studentController.getReports);
router.get('/reports/:id', studentController.getReportById);

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
