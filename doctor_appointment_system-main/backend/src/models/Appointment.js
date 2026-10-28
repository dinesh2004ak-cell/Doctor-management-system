const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'pending'
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    type: Number,
    default: 0
  },
  totalFee: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    maxlength: [500, 'Reason cannot exceed 500 characters'],
    default: ''
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'doctor', 'admin', null],
    default: null
  },
  rescheduleCount: {
    type: Number,
    default: 0
  },
  previousSlots: [{
    date: Date,
    startTime: String,
    endTime: String
  }],
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
appointmentSchema.index({ doctorId: 1, date: 1, startTime: 1, endTime: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } }
});

appointmentSchema.index({ userId: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
