import express from 'express';
import {
  getMenu,
  getCategories,
  getItemById,
  createMenuItem,
  updateMenuItem,
  updateAvailability,
  deleteMenuItem,
  createCategory,
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMenu);
router.get('/categories', getCategories);
router.get('/items/:id', getItemById);

// Staff/Admin routes
router.patch('/items/:id/availability', protect, authorize('admin', 'manager', 'waiter', 'kitchen'), updateAvailability);
router.post('/items', protect, authorize('admin', 'manager'), createMenuItem);
router.patch('/items/:id', protect, authorize('admin', 'manager'), updateMenuItem);
router.delete('/items/:id', protect, authorize('admin', 'manager'), deleteMenuItem);
router.post('/categories', protect, authorize('admin', 'manager'), createCategory);

export default router;
