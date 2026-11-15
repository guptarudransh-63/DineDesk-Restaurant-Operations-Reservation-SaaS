import express from 'express';
import {
  getDashboardSummary,
  getAnalytics,
  getStaff,
  createStaff,
  updateStaffStatus,
  getSettings,
  updateSettings,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize('admin', 'manager'), getDashboardSummary);
router.get('/analytics', authorize('admin', 'manager'), getAnalytics);
router.get('/staff', authorize('admin', 'manager'), getStaff);
router.post('/staff', authorize('admin'), createStaff);
router.patch('/staff/:id/status', authorize('admin'), updateStaffStatus);
router.get('/settings', getSettings);
router.patch('/settings', authorize('admin', 'manager'), updateSettings);
router.get('/audit-logs', authorize('admin'), getAuditLogs);

export default router;
