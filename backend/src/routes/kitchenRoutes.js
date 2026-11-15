import express from 'express';
import {
  getKitchenTickets,
  updateTicketStatus,
  updateTicketItemStatus,
} from '../controllers/kitchenController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/tickets', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), getKitchenTickets);
router.patch('/tickets/:id/status', protect, authorize('admin', 'manager', 'kitchen'), updateTicketStatus);
router.patch('/tickets/:id/items/:itemIndex/status', protect, authorize('admin', 'manager', 'kitchen'), updateTicketItemStatus);

export default router;
