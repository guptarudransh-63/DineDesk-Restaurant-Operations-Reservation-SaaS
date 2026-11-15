import express from 'express';
import {
  processPayment,
  getPayments,
  getInvoice,
  refundPayment,
} from '../controllers/paymentController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, processPayment); // Allow online payment checkout or staff POS
router.get('/invoice/:invoiceNumber', getInvoice);
router.get('/', protect, authorize('admin', 'manager', 'cashier'), getPayments);
router.post('/:id/refund', protect, authorize('admin', 'manager'), refundPayment);

export default router;
