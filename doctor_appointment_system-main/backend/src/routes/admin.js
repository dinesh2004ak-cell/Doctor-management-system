const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllDoctors,
  getDoctor,
  approveDoctor,
  rejectDoctor,
  toggleDoctorActive,
  getAllUsers,
  getUser,
  toggleUserActive,
  getAllAppointments,
  getSettings,
  updateSettings,
  getRevenue
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadLogo, handleMulterError } = require('../middleware/upload');

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Doctors management
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctor);
router.put('/doctors/:id/approve', approveDoctor);
router.put('/doctors/:id/reject', rejectDoctor);
router.put('/doctors/:id/toggle-active', toggleDoctorActive);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/toggle-active', toggleUserActive);

// Appointments
router.get('/appointments', getAllAppointments);

// Revenue
router.get('/revenue', getRevenue);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Logo upload
router.post('/upload/logo', uploadLogo, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const Settings = require('../models/Settings');
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    await Settings.findOneAndUpdate(
      { key: 'app_settings' },
      { logo: logoUrl },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logo: logoUrl }
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
});

module.exports = router;
