const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { generateToken, generateRefreshToken, JWT_SECRET } = require('../middleware/auth');

// @desc    Register user or doctor
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate role
    const validRoles = ['user', 'doctor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user or doctor'
      });
    }

    // Pre-validate doctor fields if role is doctor
    if (role === 'doctor') {
      const { specialty, qualification, experience, consultationFee } = req.body;
      
      if (!specialty || specialty.trim() === '') {
        return res.status(400).json({ success: false, message: 'Specialty is required' });
      }
      if (!qualification || qualification.trim() === '') {
        return res.status(400).json({ success: false, message: 'Qualification is required' });
      }
      if (experience === undefined || experience === null || experience === '') {
        return res.status(400).json({ success: false, message: 'Experience is required' });
      }
      if (isNaN(Number(experience)) || Number(experience) < 0) {
        return res.status(400).json({ success: false, message: 'Experience must be a non-negative number' });
      }
      if (consultationFee === undefined || consultationFee === null || consultationFee === '') {
        return res.status(400).json({ success: false, message: 'Consultation fee is required' });
      }
      if (isNaN(Number(consultationFee)) || Number(consultationFee) < 0) {
        return res.status(400).json({ success: false, message: 'Consultation fee must be a non-negative number' });
      }

      // Check primary certificate file
      const certificateFile = req.files && req.files['certificate'] ? req.files['certificate'][0] : null;
      if (!certificateFile) {
        return res.status(400).json({
          success: false,
          message: 'Primary Medical Registration Certificate is required'
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user'
    });

    // If registering as doctor, create doctor profile
    if (role === 'doctor') {
      try {
        const { specialty, qualification, experience, bio, consultationFee } = req.body;

        const certificateFile = req.files && req.files['certificate'] ? req.files['certificate'][0] : null;
        const certificateUrl = certificateFile ? `/uploads/certificates/${certificateFile.filename}` : null;

        const certificatesFiles = req.files && req.files['certificates'] ? req.files['certificates'] : (req.files && req.files['certificates[]'] ? req.files['certificates[]'] : []);
        const certificatesUrls = certificatesFiles.map(file => `/uploads/certificates/${file.filename}`);

        let parsedAvailability = {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        };
        if (req.body.availability) {
          try {
            parsedAvailability = typeof req.body.availability === 'string' ? JSON.parse(req.body.availability) : req.body.availability;
          } catch (e) {
            console.error('Availability parsing error:', e);
          }
        }

        let parsedExceptions = [];
        if (req.body.exceptions) {
          try {
            parsedExceptions = typeof req.body.exceptions === 'string' ? JSON.parse(req.body.exceptions) : req.body.exceptions;
          } catch (e) {
            console.error('Exceptions parsing error:', e);
          }
        }

        await Doctor.create({
          userId: user._id,
          specialty: specialty.trim(),
          qualification: qualification.trim(),
          experience: Number(experience),
          bio: bio ? bio.trim() : '',
          consultationFee: Number(consultationFee),
          certificate: certificateUrl,
          certificates: certificatesUrls,
          availability: parsedAvailability,
          exceptions: parsedExceptions,
          status: 'pending' // Requires admin approval
        });

        return res.status(201).json({
          success: true,
          message: 'Registration successful. Your doctor account is pending admin approval.',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            requiresApproval: true,
            doctorStatus: 'pending'
          }
        });
      } catch (doctorError) {
        // Rollback user creation to avoid email conflict on retry
        await User.findByIdAndDelete(user._id);
        throw doctorError;
      }
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check if doctor is approved
    let doctorStatus = null;
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) {
        doctorStatus = doctor.status;
        if (doctor.status === 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Your doctor account is pending approval. Please wait for admin verification.'
          });
        }
        if (doctor.status === 'rejected') {
          return res.status(403).json({
            success: false,
            message: 'Your doctor account has been rejected. Please contact support.'
          });
        }
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar
        },
        accessToken,
        refreshToken,
        doctorStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: token
    }).select('+refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Generate new access token
    const accessToken = generateToken(user._id);

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear refresh token
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let additionalData = {};

    // If doctor, get doctor profile
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) {
        additionalData.doctorProfile = doctor;
      }
    }

    res.json({
      success: true,
      data: {
        user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword
};
