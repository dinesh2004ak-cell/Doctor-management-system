const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctor,
  registerAsDoctor,
  updateProfile,
  getMyProfile,
  setAvailability,
  addAvailabilityException,
  getAppointments,
  getTodayAppointments,
  getPrescriptions,
  getDashboard
} = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadCertificate, uploadCertificates, uploadAvatar, handleMulterError } = require('../middleware/upload');

// Public routes
router.get('/', getAllDoctors);
router.get('/:id', getDoctor);

// Protected routes - Doctor
router.post('/register', protect, restrictTo('doctor'), registerAsDoctor);
router.put('/profile', protect, restrictTo('doctor'), updateProfile);
router.get('/profile/my', protect, restrictTo('doctor'), getMyProfile);

// Availability management
router.put('/availability', protect, restrictTo('doctor'), setAvailability);
router.post('/availability/exception', protect, restrictTo('doctor'), addAvailabilityException);

// Appointments
router.get('/appointments/list', protect, restrictTo('doctor'), getAppointments);
router.get('/appointments/today', protect, restrictTo('doctor'), getTodayAppointments);

// Prescriptions
router.get('/prescriptions/list', protect, restrictTo('doctor'), getPrescriptions);

// Dashboard
router.get('/dashboard/stats', protect, restrictTo('doctor'), getDashboard);

// File uploads
router.post('/upload/certificate', protect, restrictTo('doctor'), uploadCertificate, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const Doctor = require('../models/Doctor');
    const certificateUrl = `/uploads/certificates/${req.file.filename}`;
    
    await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      { certificate: certificateUrl }
    );

    res.json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: { certificate: certificateUrl }
    });
  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload certificate'
    });
  }
});

router.post('/upload/certificates', protect, restrictTo('doctor'), uploadCertificates, handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const Doctor = require('../models/Doctor');
    const certificates = req.files.map(file => `/uploads/certificates/${file.filename}`);
    
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { certificates: { $each: certificates } } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Certificates uploaded successfully',
      data: { certificates: doctor.certificates }
    });
  } catch (error) {
    console.error('Certificates upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload certificates'
    });
  }
});

router.post('/upload/avatar', protect, restrictTo('doctor'), uploadAvatar, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const User = require('../models/User');
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
});

module.exports = router;
