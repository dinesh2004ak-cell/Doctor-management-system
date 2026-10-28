const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, symptoms, medications, notes, followUpDate } = req.body;

    // Validate required fields
    if (!appointmentId || !diagnosis || !medications || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide appointment ID, diagnosis, and at least one medication'
      });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add prescription for this appointment'
      });
    }

    // Check if prescription already exists
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res.status(400).json({
        success: false,
        message: 'Prescription already exists for this appointment'
      });
    }

    // Create prescription
    const prescription = await Prescription.create({
      appointmentId,
      doctorId: doctor._id,
      userId: appointment.userId,
      diagnosis,
      symptoms: symptoms || [],
      medications,
      notes: notes || '',
      followUpDate: followUpDate ? new Date(followUpDate) : null
    });

    // Mark appointment as completed if not already
    if (appointment.status !== 'completed') {
      appointment.status = 'completed';
      await appointment.save();

      // Notify user
      await Notification.create({
        userId: appointment.userId,
        type: 'completed',
        title: 'Appointment Completed',
        message: `Your appointment on ${appointment.date.toDateString()} has been marked as completed. A prescription has been added.`,
        data: { appointmentId: appointment._id, prescriptionId: prescription._id }
      });
    } else {
      // Still notify about prescription
      await Notification.create({
        userId: appointment.userId,
        type: 'system',
        title: 'New Prescription Added',
        message: `A new prescription has been added for your appointment on ${appointment.date.toDateString()}.`,
        data: { prescriptionId: prescription._id }
      });
    }

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('doctorId', 'specialty')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .populate('userId', 'name email phone')
      .populate('appointmentId', 'date startTime');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
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
      .populate('userId', 'name email phone')
      .populate('appointmentId', 'date startTime reason');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization
    const userId = req.user._id.toString();
    const isPatient = prescription.userId._id.toString() === userId;
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && prescription.doctorId._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
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

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private/Doctor
const updatePrescription = async (req, res) => {
  try {
    const { diagnosis, symptoms, medications, notes, followUpDate } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify doctor owns this prescription
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this prescription'
      });
    }

    // Update fields
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (symptoms) prescription.symptoms = symptoms;
    if (medications) prescription.medications = medications;
    if (notes !== undefined) prescription.notes = notes;
    if (followUpDate !== undefined) {
      prescription.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('doctorId', 'specialty')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .populate('userId', 'name email phone')
      .populate('appointmentId', 'date startTime');

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: populatedPrescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription'
    });
  }
};

// @desc    Get prescriptions for an appointment
// @route   GET /api/prescriptions/appointment/:appointmentId
// @access  Private
const getByAppointment = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointmentId: req.params.appointmentId })
      .populate('doctorId', 'specialty qualification')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar email phone'
        }
      })
      .populate('userId', 'name email phone')
      .populate('appointmentId', 'date startTime reason');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found for this appointment'
      });
    }

    // Check authorization
    const userId = req.user._id.toString();
    const isPatient = prescription.userId._id.toString() === userId;
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && prescription.doctorId._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
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
    console.error('Get prescription by appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescription'
    });
  }
};

// @desc    Add attachment to prescription
// @route   POST /api/prescriptions/:id/attachments
// @access  Private/Doctor
const addAttachment = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify doctor owns this prescription
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const attachments = req.files.map(file => file.path);
    prescription.attachments.push(...attachments);
    await prescription.save();

    res.json({
      success: true,
      message: 'Attachments added successfully',
      data: { attachments: prescription.attachments }
    });
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add attachments'
    });
  }
};

// @desc    Get all prescriptions (doctor view)
// @route   GET /api/prescriptions
// @access  Private/Doctor
const getMyPrescriptions = async (req, res) => {
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
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions'
    });
  }
};

module.exports = {
  createPrescription,
  getPrescription,
  updatePrescription,
  getByAppointment,
  addAttachment,
  getMyPrescriptions
};
