import express from 'express';
import {
  createOrder,
  addItemsToOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  applyDiscount,
  requestBill,
} from '../controllers/orderController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/track/:id', getOrderById);
router.get('/:id', getOrderById);

// Staff/Admin order management
router.get('/', protect, authorize('admin', 'manager', 'waiter', 'cashier'), getOrders);
router.post('/:id/add-items', protect, authorize('admin', 'manager', 'waiter'), addItemsToOrder);
router.patch('/:id/status', protect, authorize('admin', 'manager', 'waiter', 'kitchen', 'cashier'), updateOrderStatus);
router.post('/:id/apply-discount', protect, authorize('admin', 'manager', 'cashier'), applyDiscount);
router.post('/:id/request-bill', protect, authorize('admin', 'manager', 'waiter', 'cashier'), requestBill);

export default router;
