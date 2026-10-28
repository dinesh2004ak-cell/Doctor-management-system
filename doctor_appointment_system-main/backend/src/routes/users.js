const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAppointments,
  getUpcomingAppointments,
  getPrescriptions,
  getPrescription,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getDashboard
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadAvatar, handleMulterError } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Avatar upload
router.post('/avatar', uploadAvatar, handleMulterError, async (req, res) => {
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

// Appointment routes
router.get('/appointments', getAppointments);
router.get('/appointments/upcoming', getUpcomingAppointments);

// Prescription routes
router.get('/prescriptions', getPrescriptions);
router.get('/prescriptions/:id', getPrescription);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

// Dashboard
router.get('/dashboard', getDashboard);

module.exports = router;
