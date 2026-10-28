const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

// @desc    Get all approved doctors (public)
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res) => {
  try {
    const { specialty, search, minFee, maxFee, page = 1, limit = 12 } = req.query;

    // Build query
    const query = { status: 'approved', isAvailable: true };

    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }

    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = parseInt(minFee);
      if (maxFee) query.consultationFee.$lte = parseInt(maxFee);
    }

    if (search) {
      query.$or = [
        { specialty: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone avatar')
      .select('-__v')
      .sort({ rating: -1, totalRatings: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    // Get specialties for filter
    const specialties = await Doctor.distinct('specialty', { status: 'approved' });

    // Get settings for commission calculation
    const settings = await Settings.findOne({ key: 'app_settings' });
    const commission = settings?.commission || 10;

    res.json({
      success: true,
      data: {
        doctors,
        commission,
        specialties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors'
    });
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone avatar');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get settings for commission
    const settings = await Settings.findOne({ key: 'app_settings' });
    const commission = settings?.commission || 10;

    res.json({
      success: true,
      data: {
        doctor,
        commission,
        totalWithCommission: doctor.consultationFee + (doctor.consultationFee * commission / 100)
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

// @desc    Register as doctor (complete profile)
// @route   POST /api/doctors/register
// @access  Private/Doctor
const registerAsDoctor = async (req, res) => {
  try {
    const { specialty, qualification, experience, bio, consultationFee } = req.body;

    // Check if user is already a doctor
    let doctor = await Doctor.findOne({ userId: req.user._id });

    if (doctor) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a doctor'
      });
    }

    // Create doctor profile
    doctor = await Doctor.create({
      userId: req.user._id,
      specialty,
      qualification,
      experience,
      bio,
      consultationFee: consultationFee || 500,
      status: 'pending' // Requires admin approval
    });

    res.status(201).json({
      success: true,
      message: 'Doctor registration submitted. Please wait for admin approval.',
      data: doctor
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register as doctor'
    });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private/Doctor
const updateProfile = async (req, res) => {
  try {
    const { specialty, qualification, experience, bio, consultationFee, isAvailable } = req.body;

    let doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const updateData = {};
    if (specialty) updateData.specialty = specialty;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (experience !== undefined) updateData.experience = experience;
    if (bio !== undefined) updateData.bio = bio;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    doctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone avatar');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Get doctor's own profile
// @route   GET /api/doctors/my-profile
// @access  Private/Doctor
const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone avatar');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// @desc    Set doctor availability
// @route   PUT /api/doctors/availability
// @access  Private/Doctor
const setAvailability = async (req, res) => {
  try {
    const { availability, exceptions } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    if (availability) {
      doctor.availability = availability;
    }

    if (exceptions) {
      doctor.exceptions = exceptions;
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: doctor.availability,
        exceptions: doctor.exceptions
      }
    });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set availability'
    });
  }
};

// @desc    Add availability exception
// @route   POST /api/doctors/availability/exception
// @access  Private/Doctor
const addAvailabilityException = async (req, res) => {
  try {
    const { date, available, slots } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Check if exception already exists for this date
    const existingIndex = doctor.exceptions.findIndex(
      ex => new Date(ex.date).toDateString() === new Date(date).toDateString()
    );

    if (existingIndex >= 0) {
      doctor.exceptions[existingIndex] = { date, available, slots };
    } else {
      doctor.exceptions.push({ date, available, slots });
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Exception added successfully',
      data: doctor.exceptions
    });
  } catch (error) {
    console.error('Add exception error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add exception'
    });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/doctors/appointments
// @access  Private/Doctor
const getAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const query = { doctorId: doctor._id };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('userId', 'name email phone avatar')
      .sort({ date: 1, startTime: 1 })
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
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

// @desc    Get today's appointments
// @route   GET /api/doctors/appointments/today
// @access  Private/Doctor
const getTodayAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('userId', 'name email phone avatar')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today appointments'
    });
  }
};

// @desc    Get doctor's prescriptions
// @route   GET /api/doctors/prescriptions
// @access  Private/Doctor
const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const prescriptions = await Prescription.find({ doctorId: doctor._id })
      .populate('userId', 'name email phone avatar')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments({ doctorId: doctor._id });

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
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions'
    });
  }
};

// @desc    Get doctor's dashboard stats
// @route   GET /api/doctors/dashboard
// @access  Private/Doctor
const getDashboard = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    // This week's appointments
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: { $gte: startOfWeek },
      status: 'completed'
    });

    // Total patients
    const totalPatients = await Appointment.distinct('userId', {
      doctorId: doctor._id,
      status: 'completed'
    });

    // This month's earnings
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: startOfMonth },
      status: { $in: ['completed', 'confirmed'] }
    });

    const monthEarnings = monthAppointments.reduce((sum, apt) => sum + apt.fee, 0);

    // Recent appointments
    const recentAppointments = await Appointment.find({
      doctorId: doctor._id,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: startOfDay }
    })
      .populate('userId', 'name avatar')
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          todayAppointments,
          weekAppointments,
          totalPatients: totalPatients.length,
          monthEarnings,
          rating: doctor.rating,
          totalRatings: doctor.totalRatings
        },
        recentAppointments
      }
    });
  } catch (error) {
    console.error('Get doctor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
};

module.exports = {
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
};
