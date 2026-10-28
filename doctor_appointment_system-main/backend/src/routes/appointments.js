const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getAvailableSlots,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
  getAppointment,
  rateAppointment
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes - get available slots
router.get('/slots/:doctorId', getAvailableSlots);

// Protected routes
router.use(protect);

// Book appointment - User only
router.post('/', restrictTo('user'), bookAppointment);

// Get single appointment
router.get('/:id', getAppointment);

// Confirm appointment - Doctor only
router.put('/:id/confirm', restrictTo('doctor'), confirmAppointment);

// Cancel appointment - Any authenticated user
router.put('/:id/cancel', cancelAppointment);

// Reschedule appointment - User only
router.put('/:id/reschedule', restrictTo('user'), rescheduleAppointment);

// Complete appointment - Doctor only
router.put('/:id/complete', restrictTo('doctor'), completeAppointment);

// Mark as no-show - Doctor only
router.put('/:id/no-show', restrictTo('doctor'), markNoShow);

// Rate appointment - User only
router.put('/:id/rate', restrictTo('user'), rateAppointment);

module.exports = router;
