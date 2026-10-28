const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar, uploadDoctorRegistration, handleMulterError } = require('../middleware/upload');

// Public routes
router.post('/register', uploadDoctorRegistration, handleMulterError, register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Avatar upload
router.post('/avatar', protect, uploadAvatar, handleMulterError, async (req, res) => {
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
