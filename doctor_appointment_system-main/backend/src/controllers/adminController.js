const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDoctors = await Doctor.countDocuments({ status: 'approved' });
    const pendingDoctors = await Doctor.countDocuments({ status: 'pending' });
    const totalAppointments = await Appointment.countDocuments();

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    // This week's appointments
    const weekAppointments = await Appointment.countDocuments({
      date: { $gte: startOfWeek }
    });

    // This month's revenue
    const monthAppointments = await Appointment.find({
      date: { $gte: startOfMonth },
      status: { $in: ['completed', 'confirmed'] }
    });

    const monthRevenue = monthAppointments.reduce((sum, apt) => sum + apt.totalFee, 0);
    const monthCommission = monthAppointments.reduce((sum, apt) => sum + apt.commission, 0);

    // Get settings for commission rate
    const settings = await Settings.findOne({ key: 'app_settings' });
    const commissionRate = settings?.commission || 10;

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .populate('userId', 'name avatar')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent users
    const recentUsers = await User.find({ role: 'user' })
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly appointments trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalFee' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDoctors,
          pendingDoctors,
          totalAppointments,
          todayAppointments,
          weekAppointments,
          monthRevenue,
          monthCommission,
          commissionRate
        },
        appointmentsByStatus,
        monthlyTrend,
        recentAppointments,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
};

// @desc    Get all doctors with status
// @route   GET /api/admin/doctors
// @access  Private/Admin
const getAllDoctors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { specialty: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone avatar isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors'
    });
  }
};

// @desc    Get single doctor details
// @route   GET /api/admin/doctors/:id
// @access  Private/Admin
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone avatar isActive createdAt');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get doctor's appointments count
    const appointmentsCount = await Appointment.countDocuments({ doctorId: doctor._id });
    const completedCount = await Appointment.countDocuments({ doctorId: doctor._id, status: 'completed' });

    // Get ratings
    const ratings = await Appointment.aggregate([
      { $match: { doctorId: doctor._id, status: 'completed' } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'appointmentId',
          as: 'review'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        doctor,
        stats: {
          totalAppointments: appointmentsCount,
          completedAppointments: completedCount
        }
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor'
    });
  }
};

// @desc    Approve doctor
// @route   PUT /api/admin/doctors/:id/approve
// @access  Private/Admin
const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not pending approval'
      });
    }

    doctor.status = 'approved';
    await doctor.save();

    // Update user role to doctor
    await User.findByIdAndUpdate(doctor.userId, { role: 'doctor' });

    // Notify doctor
    await Notification.create({
      userId: doctor.userId,
      type: 'doctor_approved',
      title: 'Doctor Account Approved',
      message: 'Congratulations! Your doctor account has been approved. You can now accept appointments.',
      data: { doctorId: doctor._id }
    });

    res.json({
      success: true,
      message: 'Doctor approved successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve doctor'
    });
  }
};

// @desc    Reject doctor
// @route   PUT /api/admin/doctors/:id/reject
// @access  Private/Admin
const rejectDoctor = async (req, res) => {
  try {
    const { reason } = req.body;

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not pending approval'
      });
    }

    doctor.status = 'rejected';
    doctor.rejectionReason = reason || 'Your application did not meet our requirements.';
    await doctor.save();

    // Notify doctor
    await Notification.create({
      userId: doctor.userId,
      type: 'doctor_rejected',
      title: 'Doctor Application Rejected',
      message: reason || 'Unfortunately, your doctor application has been rejected. Please contact support for more information.',
      data: { doctorId: doctor._id }
    });

    res.json({
      success: true,
      message: 'Doctor rejected',
      data: doctor
    });
  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject doctor'
    });
  }
};

// @desc    Toggle doctor active status
// @route   PUT /api/admin/doctors/:id/toggle-active
// @access  Private/Admin
const toggleDoctorActive = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();

    // Update user active status
    await User.findByIdAndUpdate(doctor.userId, { isActive: doctor.isAvailable });

    res.json({
      success: true,
      message: `Doctor ${doctor.isAvailable ? 'activated' : 'deactivated'} successfully`,
      data: doctor
    });
  } catch (error) {
    console.error('Toggle doctor active error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor status'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's appointments
    const appointmentsCount = await Appointment.countDocuments({ userId: user._id });
    const completedCount = await Appointment.countDocuments({ userId: user._id, status: 'completed' });
    const prescriptionsCount = await Prescription.countDocuments({ userId: user._id });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalAppointments: appointmentsCount,
          completedAppointments: completedCount,
          prescriptions: prescriptionsCount
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
  try {
    const { status, date, doctorId, userId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (userId) query.userId = userId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('userId', 'name email phone avatar')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
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
    console.error('Get all appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

// @desc    Get app settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'app_settings' });

    // Create default settings if not exists
    if (!settings) {
      settings = await Settings.create({
        key: 'app_settings',
        commission: 10,
        appName: 'MediBook',
        tagline: 'Your Health, Our Priority'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
};

// @desc    Update app settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const {
      commission,
      appName,
      tagline,
      logo,
      contactEmail,
      contactPhone,
      address,
      emailNotifications,
      smsNotifications,
      reminders,
      cancellationPolicy
    } = req.body;

    let settings = await Settings.findOne({ key: 'app_settings' });

    if (!settings) {
      settings = new Settings({ key: 'app_settings' });
    }

    // Update fields
    if (commission !== undefined) settings.commission = commission;
    if (appName !== undefined) settings.appName = appName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (logo !== undefined) settings.logo = logo;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (address !== undefined) settings.address = address;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) settings.smsNotifications = smsNotifications;
    if (reminders) {
      if (reminders.reminder_1d !== undefined) settings.reminders.reminder_1d = reminders.reminder_1d;
      if (reminders.reminder_1h !== undefined) settings.reminders.reminder_1h = reminders.reminder_1h;
      if (reminders.reminder_15m !== undefined) settings.reminders.reminder_15m = reminders.reminder_15m;
    }
    if (cancellationPolicy) {
      if (cancellationPolicy.allowWithin24h !== undefined) {
        settings.cancellationPolicy.allowWithin24h = cancellationPolicy.allowWithin24h;
      }
      if (cancellationPolicy.refundPercentage !== undefined) {
        settings.cancellationPolicy.refundPercentage = cancellationPolicy.refundPercentage;
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/admin/revenue
// @access  Private/Admin
const getRevenue = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const appointments = await Appointment.find({
      date: { $gte: startDate },
      status: { $in: ['completed', 'confirmed'] }
    }).populate('doctorId', 'consultationFee');

    const totalRevenue = appointments.reduce((sum, apt) => sum + apt.totalFee, 0);
    const totalCommission = appointments.reduce((sum, apt) => sum + apt.commission, 0);
    const doctorEarnings = appointments.reduce((sum, apt) => sum + apt.fee, 0);

    // Revenue by doctor
    const revenueByDoctor = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startDate },
          status: { $in: ['completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          totalAppointments: { $sum: 1 },
          revenue: { $sum: '$totalFee' },
          commission: { $sum: '$commission' }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          doctorName: '$user.name',
          specialty: '$doctor.specialty',
          totalAppointments: 1,
          revenue: 1,
          commission: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCommission,
          doctorEarnings,
          appointmentCount: appointments.length
        },
        revenueByDoctor
      }
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue data'
    });
  }
};

module.exports = {
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
};
