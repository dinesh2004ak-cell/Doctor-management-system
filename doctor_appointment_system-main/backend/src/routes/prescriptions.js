const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescription,
  updatePrescription,
  getByAppointment,
  addAttachment,
  getMyPrescriptions
} = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadPrescriptionFiles, handleMulterError } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Create prescription - Doctor only
router.post('/', restrictTo('doctor'), createPrescription);

// Get prescriptions (doctor's own) - Doctor only
router.get('/', restrictTo('doctor'), getMyPrescriptions);

// Get prescription by appointment
router.get('/appointment/:appointmentId', getByAppointment);

// Get single prescription
router.get('/:id', getPrescription);

// Update prescription - Doctor only
router.put('/:id', restrictTo('doctor'), updatePrescription);

// Add attachment to prescription - Doctor only
router.post('/:id/attachments', restrictTo('doctor'), uploadPrescriptionFiles, handleMulterError, addAttachment);

module.exports = router;
