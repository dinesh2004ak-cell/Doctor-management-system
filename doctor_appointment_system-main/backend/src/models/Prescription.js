const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  medications: [medicationSchema],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  attachments: [{
    type: String
  }],
  followUpDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
