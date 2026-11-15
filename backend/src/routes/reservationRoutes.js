import express from 'express';
import {
  checkAvailability,
  createReservation,
  getReservations,
  getMyReservations,
  getReservationByRefOrId,
  updateReservationStatus,
  cancelReservation,
} from '../controllers/reservationController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/availability', checkAvailability);
router.post('/', optionalAuth, createReservation);
router.get('/my', protect, getMyReservations);
router.get('/track/:idOrRef', getReservationByRefOrId);
router.post('/cancel/:idOrRef', optionalAuth, cancelReservation);

// Staff/Admin reservation routes
router.get('/', protect, authorize('admin', 'manager', 'waiter'), getReservations);
router.get('/:idOrRef', protect, authorize('admin', 'manager', 'waiter'), getReservationByRefOrId);
router.patch('/:id/status', protect, authorize('admin', 'manager', 'waiter'), updateReservationStatus);

export default router;
