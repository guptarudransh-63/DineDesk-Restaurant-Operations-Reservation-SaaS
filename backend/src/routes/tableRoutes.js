import express from 'express';
import {
  getTables,
  createTable,
  updateTableStatus,
  seatGuests,
  closeTableSession,
  markTableCleaned,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTables);
router.post('/', protect, authorize('admin', 'manager'), createTable);
router.patch('/:id/status', protect, authorize('admin', 'manager', 'waiter'), updateTableStatus);
router.post('/:id/seat', protect, authorize('admin', 'manager', 'waiter'), seatGuests);
router.post('/:id/close-session', protect, authorize('admin', 'manager', 'waiter', 'cashier'), closeTableSession);
router.post('/:id/mark-cleaned', protect, authorize('admin', 'manager', 'waiter'), markTableCleaned);

export default router;
