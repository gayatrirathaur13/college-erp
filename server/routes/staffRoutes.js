const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sc = require('../controllers/staffController');

// All staff routes require authentication
router.use(authenticateToken);

// Staff can only access their role-specific routes
const STAFF_ROLES = ['TNP_HEAD', 'FINANCE', 'LIBRARIAN'];

// Block non-staff users from all /api/staff/* routes (allow ADMIN as well)
router.use((req, res, next) => {
  if (!req.user || (!STAFF_ROLES.includes(req.user.role) && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Staff access only.' });
  }
  next();
});

// ─────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────
router.get('/profile', sc.getProfile);

// ─────────────────────────────────────────────
// TNP Head Routes
// ─────────────────────────────────────────────
router.get('/tnp/dashboard',              sc.requireRole('TNP_HEAD', 'ADMIN'), sc.getTNPDashboard);
router.get('/tnp/companies',              sc.requireRole('TNP_HEAD', 'ADMIN'), sc.getCompanies);
router.post('/tnp/companies',             sc.requireRole('TNP_HEAD', 'ADMIN'), sc.addCompany);
router.put('/tnp/companies/:id',          sc.requireRole('TNP_HEAD', 'ADMIN'), sc.updateCompany);
router.get('/tnp/drives',                 sc.requireRole('TNP_HEAD', 'ADMIN'), sc.getDrives);
router.post('/tnp/drives',                sc.requireRole('TNP_HEAD', 'ADMIN'), sc.addDrive);
router.put('/tnp/drives/:id',             sc.requireRole('TNP_HEAD', 'ADMIN'), sc.updateDriveStatus);
router.put('/tnp/drives/:id/status',      sc.requireRole('TNP_HEAD', 'ADMIN'), sc.updateDriveStatus);
router.get('/tnp/applications',           sc.requireRole('TNP_HEAD', 'ADMIN'), sc.getApplications);
router.put('/tnp/applications/:id/shortlist', sc.requireRole('TNP_HEAD', 'ADMIN'), sc.shortlistApplication);
router.get('/tnp/placements',             sc.requireRole('TNP_HEAD', 'ADMIN'), sc.getPlacements);

// ─────────────────────────────────────────────
// Finance Officer Routes
// ─────────────────────────────────────────────
router.get('/finance/dashboard',                      sc.requireRole('FINANCE', 'ADMIN'), sc.getFinanceDashboard);
router.get('/finance/students',                       sc.requireRole('FINANCE', 'ADMIN'), sc.getStudentsWithFees);
router.get('/finance/fees/:studentId',                sc.requireRole('FINANCE', 'ADMIN'), sc.getStudentFeeDetails);
router.put('/finance/fees/:studentFeeId/payment',     sc.requireRole('FINANCE', 'ADMIN'), sc.recordPayment);
router.get('/finance/fee-structures',                 sc.requireRole('FINANCE', 'ADMIN'), sc.getFeeStructures);
router.post('/finance/fee-structures',                sc.requireRole('FINANCE', 'ADMIN'), sc.addFeeStructure);
router.get('/finance/payments',                       sc.requireRole('FINANCE', 'ADMIN'), sc.getAllPayments);

// ─────────────────────────────────────────────
// Librarian Routes
// ─────────────────────────────────────────────
router.get('/library/dashboard',          sc.requireRole('LIBRARIAN', 'ADMIN'), sc.getLibraryDashboard);
router.get('/library/books',              sc.requireRole('LIBRARIAN', 'ADMIN'), sc.getBooks);
router.post('/library/books',             sc.requireRole('LIBRARIAN', 'ADMIN'), sc.addBook);
router.put('/library/books/:isbn',        sc.requireRole('LIBRARIAN', 'ADMIN'), sc.updateBook);
router.get('/library/issues',             sc.requireRole('LIBRARIAN', 'ADMIN'), sc.getIssues);
router.post('/library/issues',            sc.requireRole('LIBRARIAN', 'ADMIN'), sc.issueBook);
router.put('/library/issues/:id/return',  sc.requireRole('LIBRARIAN', 'ADMIN'), sc.returnBook);
router.get('/library/overdue',            sc.requireRole('LIBRARIAN', 'ADMIN'), sc.getOverdueBooks);
router.get('/library/fines',              sc.requireRole('LIBRARIAN', 'ADMIN'), sc.getFines);
router.put('/library/fines/:id/collect',  sc.requireRole('LIBRARIAN', 'ADMIN'), sc.collectFine);
router.post('/library/fines/collect',     sc.requireRole('LIBRARIAN', 'ADMIN'), sc.collectFine);

module.exports = router;
