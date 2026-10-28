const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  }
}, { _id: false });

const availabilityExceptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  available: {
    type: Boolean,
    default: false
  },
  slots: [timeSlotSchema]
}, { _id: true });

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialty: {
    type: String,
    required: function() {
      return this.status === 'approved';
    },
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    default: ''
  },
  consultationFee: {
    type: Number,
    min: 0,
    default: 500
  },
  certificate: {
    type: String,
    default: null
  },
  certificates: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  availability: {
    monday: [timeSlotSchema],
    tuesday: [timeSlotSchema],
    wednesday: [timeSlotSchema],
    thursday: [timeSlotSchema],
    friday: [timeSlotSchema],
    saturday: [timeSlotSchema],
    sunday: [timeSlotSchema]
  },
  exceptions: [availabilityExceptionSchema],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching
doctorSchema.index({ specialty: 'text', bio: 'text' });
doctorSchema.index({ status: 1 });
doctorSchema.index({ userId: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
