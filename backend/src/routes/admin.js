const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'teacher'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User Management (admin only)
router.get('/users/stats', adminController.getUserStats);
router.get('/users', authorize('admin'), adminController.getUsers);
router.post('/users', authorize('admin'), adminController.createUser);
router.put('/users/:id', authorize('admin'), adminController.updateUser);
router.delete('/users/:id', authorize('admin'), adminController.deleteUser);

// Batch Management
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);
router.put('/batches/:id', adminController.updateBatch);
router.delete('/batches/:id', authorize('admin'), adminController.deleteBatch);

// Test Builder
router.get('/tests', adminController.getTests);
router.post('/tests', adminController.createTest);
router.put('/tests/:id', adminController.updateTest);
router.post('/tests/:id/publish', adminController.publishTest);
router.delete('/tests/:id', adminController.deleteTest);
router.post('/tests/ai-generate', adminController.aiGenerateQuestions);

// Question Bank
router.get('/questions/stats', adminController.getQuestionBankStats);
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

// Materials
router.get('/materials', adminController.getMaterials);
router.post('/materials', adminController.uploadMaterial);
router.put('/materials/:id', adminController.updateMaterial);
router.delete('/materials/:id', adminController.deleteMaterial);

// Reports
router.get('/reports/stats', adminController.getReportStats);
router.get('/reports/tests/:id', adminController.getTestReport);
router.get('/reports/students/:id', adminController.getStudentReport);

// Study Plans
router.get('/plans/:student_id', adminController.getStudentPlan);
router.post('/plans/:student_id/generate', adminController.adminGeneratePlan);
router.put('/plans/:plan_id', adminController.updatePlan);
router.delete('/plans/:plan_id/tasks/:task_id', adminController.deletePlanTask);

// Proctoring Violations
router.get('/violations', adminController.getViolations);

// Announcements
router.post('/announcements', adminController.createAnnouncement);
router.get('/announcements', adminController.getAnnouncements);

// Doubts
router.get('/doubts', adminController.getAllDoubts);
router.post('/doubts/:id/answer', adminController.answerDoubt);

// Taxonomy
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.get('/topics', adminController.getTopics);
router.post('/topics', adminController.createTopic);
router.get('/concepts', adminController.getConcepts);
router.post('/concepts', adminController.createConcept);

// Audit Log (admin only)
router.get('/audit-log', authorize('admin'), adminController.getAuditLog);

module.exports = router;
