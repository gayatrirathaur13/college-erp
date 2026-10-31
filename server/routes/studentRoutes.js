const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Restrict all student routes to authenticated users with STUDENT or ADMIN role
router.use(authenticateToken);
router.use(requireRole('STUDENT', 'ADMIN'));

// Student Profile & Demographics
router.get('/profile', studentController.getProfile);
router.get('/dashboard', studentController.getDashboard);

// Academic Attendance & Timetable
router.get('/attendance', studentController.getAttendance);

// Financial Invoices & Payment History
router.get('/fees', studentController.getFees);
router.post('/fees/pay', studentController.payFee);

// Library Loans, Circulation & Overdue Fines
router.get('/library', studentController.getLibrary);

// Examinations & Hall Tickets
router.get('/exams', studentController.getExams);
router.post('/exams/apply', studentController.applyExam);

// Semester Results & Marks Ledger
router.get('/results', studentController.getResults);

// Training & Placement Drives & Applications
router.get('/placement', studentController.getPlacement);
router.post('/placement/apply', studentController.applyJobDrive);

module.exports = router;
