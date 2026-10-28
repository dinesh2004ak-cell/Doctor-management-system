const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

// Helper function to calculate fees
const calculateFees = async (doctorFee) => {
  const settings = await Settings.findOne({ key: 'app_settings' });
  const commission = settings?.commission || 10;
  const commissionAmount = doctorFee * (commission / 100);
  return {
    fee: doctorFee,
    commission: commissionAmount,
    totalFee: doctorFee + commissionAmount,
    commissionPercent: commission
  };
};

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private/User
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, reason } = req.body;

    // Validate required fields
    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctor, date, start time, and end time'
      });
    }

    // Check doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available for appointments'
      });
    }

    // Check if slot is available (no double booking)
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      startTime,
      endTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose another.'
      });
    }

    // Calculate fees
    const fees = await calculateFees(doctor.consultationFee);

    // Create appointment
    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      date: appointmentDate,
      startTime,
      endTime,
      reason: reason || '',
      status: 'pending',
      fee: fees.fee,
      commission: fees.commission,
      totalFee: fees.totalFee
    });

    // Create notification
    await Notification.create({
      userId: req.user._id,
      type: 'booking',
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${doctor.specialty} specialist has been requested. Awaiting confirmation.`,
      data: { appointmentId: appointment._id }
    });

    // Notify doctor
    await Notification.create({
      userId: doctor.userId,
      type: 'booking',
      title: 'New Appointment Request',
      message: `You have a new appointment request for ${appointmentDate.toDateString()} at ${startTime}.`,
      data: { appointmentId: appointment._id }
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'specialty consultationFee')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. Awaiting confirmation.',
      data: {
        appointment: populatedAppointment,
        fees
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
};

// @desc    Get available slots for a doctor on a date
// @route   GET /api/appointments/slots/:doctorId
// @access  Public
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const appointmentDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[appointmentDate.getDay()];

    // Check for exceptions
    const exception = doctor.exceptions.find(
      ex => new Date(ex.date).toDateString() === appointmentDate.toString()
    );

    let availableSlots = [];

    if (exception) {
      if (exception.available) {
        availableSlots = exception.slots || [];
      } else {
        // Doctor not available on this date
        return res.json({
          success: true,
          data: {
            slots: [],
            isAvailable: false,
            message: 'Doctor is not available on this date'
          }
        });
      }
    } else {
      // Use regular schedule
      availableSlots = doctor.availability[dayName] || [];
    }

    // Get booked slots for this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: appointmentDate,
      status: { $in: ['pending', 'confirmed'] }
    }).select('startTime endTime');

    // Filter out booked slots
    const bookedSlots = bookedAppointments.map(apt => ({
      start: apt.startTime,
      end: apt.endTime
    }));

    const available = availableSlots.filter(slot => {
      return !bookedSlots.some(booked => {
        return booked.start === slot.start && booked.end === slot.end;
      });
    });

    res.json({
      success: true,
      data: {
        slots: available,
        isAvailable: available.length > 0,
        daySchedule: availableSlots
      }
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slots'
    });
  }
};

// @desc    Confirm an appointment (doctor action)
// @route   PUT /api/appointments/:id/confirm
// @access  Private/Doctor
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment or the user is an admin
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && (!doctor || appointment.doctorId.toString() !== doctor._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this appointment'
      });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be confirmed'
      });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    // Notify user
    await Notification.create({
      userId: appointment.userId,
      type: 'booking_confirmed',
      title: 'Appointment Confirmed',
      message: `Your appointment on ${appointment.date.toDateString()} at ${appointment.startTime} has been confirmed.`,
      data: { appointmentId: appointment._id }
    });

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm appointment'
    });
  }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const userId = req.user._id.toString();
    const isOwner = appointment.userId.toString() === userId;
    const doctor = await Doctor.findOne({ userId });
    const isDoctor = doctor && appointment.doctorId.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check 24-hour restriction
    const now = new Date();
    const appointmentTime = new Date(appointment.date);
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    appointmentTime.setHours(hours, minutes, 0, 0);

    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24 && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointment within 24 hours of the scheduled time'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || '';
    appointment.cancelledBy = isOwner ? 'user' : (isDoctor ? 'doctor' : 'admin');
    await appointment.save();

    // Notify the other party
    const notifyUserId = isOwner ? doctor?.userId : appointment.userId;
    if (notifyUserId) {
      await Notification.create({
        userId: notifyUserId,
        type: 'cancelled',
        title: 'Appointment Cancelled',
        message: `The appointment on ${appointment.date.toDateString()} at ${appointment.startTime} has been cancelled.`,
        data: { appointmentId: appointment._id }
      });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
};

// @desc    Reschedule an appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private/User
const rescheduleAppointment = async (req, res) => {
  try {
    const { newDate, newStartTime, newEndTime } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this appointment'
      });
    }

    // Check 24-hour restriction
    const now = new Date();
    const appointmentTime = new Date(appointment.date);
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    appointmentTime.setHours(hours, minutes, 0, 0);

    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule appointment within 24 hours of the scheduled time'
      });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule this appointment'
      });
    }

    // Check new slot availability
    const appointmentDate = new Date(newDate);
    const existingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      date: appointmentDate,
      startTime: newStartTime,
      endTime: newEndTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'The new time slot is not available'
      });
    }

    // Save previous slot
    appointment.previousSlots.push({
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime
    });

    appointment.date = appointmentDate;
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.rescheduleCount += 1;
    appointment.status = 'pending'; // Needs confirmation again
    await appointment.save();

    // Notify doctor
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      await Notification.create({
        userId: doctor.userId,
        type: 'rescheduled',
        title: 'Appointment Rescheduled',
        message: `Your appointment has been rescheduled to ${appointmentDate.toDateString()} at ${newStartTime}. Please confirm.`,
        data: { appointmentId: appointment._id }
      });
    }

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully. Awaiting confirmation.',
      data: appointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment'
    });
  }
};

// @desc    Complete an appointment (doctor action)
// @route   PUT /api/appointments/:id/complete
// @access  Private/Doctor
const completeAppointment = async (req, res) => {
  try {
    const { notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment or the user is an admin
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && (!doctor || appointment.doctorId.toString() !== doctor._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this appointment'
      });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete this appointment'
      });
    }

    appointment.status = 'completed';
    if (notes) appointment.notes = notes;
    await appointment.save();

    // Notify user
    await Notification.create({
      userId: appointment.userId,
      type: 'completed',
      title: 'Appointment Completed',
      message: `Your appointment on ${appointment.date.toDateString()} has been marked as completed.`,
      data: { appointmentId: appointment._id }
    });

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment'
    });
  }
};

// @desc    Mark appointment as no-show
// @route   PUT /api/appointments/:id/no-show
// @access  Private/Doctor
const markNoShow = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment or the user is an admin
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && (!doctor || appointment.doctorId.toString() !== doctor._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    appointment.status = 'no_show';
    await appointment.save();

    // Notify user
    await Notification.create({
      userId: appointment.userId,
      type: 'system',
      title: 'Appointment Missed',
      message: `You missed your appointment on ${appointment.date.toDateString()}. Please book a new appointment if needed.`,
      data: { appointmentId: appointment._id }
    });

    res.json({
      success: true,
      message: 'Appointment marked as no-show',
      data: appointment
    });
  } catch (error) {
    console.error('Mark no-show error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark appointment as no-show'
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('doctorId')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name avatar email phone'
        }
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const userId = req.user._id.toString();
    const isOwner = appointment.userId._id.toString() === userId;
    const doctor = await Doctor.findOne({ userId });
    const isDoctor = doctor && appointment.doctorId._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    // Get fees info
    const fees = await calculateFees(appointment.fee);

    res.json({
      success: true,
      data: {
        appointment,
        fees
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment'
    });
  }
};

// @desc    Rate a completed appointment
// @route   PUT /api/appointments/:id/rate
// @access  Private/User
const rateAppointment = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this appointment'
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed appointments'
      });
    }

    // Update doctor rating
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const newTotalRatings = doctor.totalRatings + 1;
      const newRating = ((doctor.rating * doctor.totalRatings) + rating) / newTotalRatings;
      doctor.rating = Math.round(newRating * 10) / 10;
      doctor.totalRatings = newTotalRatings;
      await doctor.save();
    }

    res.json({
      success: true,
      message: 'Thank you for your rating!',
      data: { rating }
    });
  } catch (error) {
    console.error('Rate appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate appointment'
    });
  }
};

module.exports = {
  bookAppointment,
  getAvailableSlots,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
  getAppointment,
  rateAppointment
};
