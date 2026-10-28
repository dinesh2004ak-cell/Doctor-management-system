const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private/User
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let additionalData = {};

    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id }).populate('userId', 'name email phone avatar');
      additionalData.doctorProfile = doctor;
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private/User
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Get user's appointments
// @route   GET /api/users/appointments
// @access  Private/User
const getAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'specialty consultationFee')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ date: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

// @desc    Get user's upcoming appointments
// @route   GET /api/users/appointments/upcoming
// @access  Private/User
const getUpcomingAppointments = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const appointments = await Appointment.find({
      userId: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: today }
    })
      .populate('doctorId', 'specialty consultationFee')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming appointments'
    });
  }
};

// @desc    Get user's prescriptions
// @route   GET /api/users/prescriptions
// @access  Private/User
const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const prescriptions = await Prescription.find({ userId: req.user._id })
      .populate('doctorId', 'specialty')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions'
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/users/prescriptions/:id
// @access  Private/User
const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'specialty qualification')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar email phone'
        }
      })
      .populate('appointmentId', 'date startTime endTime reason');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if prescription belongs to user
    if (prescription.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this prescription'
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescription'
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private/User
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private/User
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private/User
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private/User
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Upcoming appointments count
    const upcomingCount = await Appointment.countDocuments({
      userId,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: today }
    });

    // Completed appointments count
    const completedCount = await Appointment.countDocuments({
      userId,
      status: 'completed'
    });

    // Prescriptions count
    const prescriptionsCount = await Prescription.countDocuments({ userId });

    // Unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      userId,
      isRead: false
    });

    // Recent appointments
    const recentAppointments = await Appointment.find({
      userId,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: today }
    })
      .populate('doctorId', 'specialty consultationFee')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          upcomingAppointments: upcomingCount,
          completedAppointments: completedCount,
          prescriptions: prescriptionsCount,
          unreadNotifications
        },
        recentAppointments
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
};

module.exports = {
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
};
