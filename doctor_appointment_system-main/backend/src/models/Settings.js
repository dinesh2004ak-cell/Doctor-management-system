const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['app_settings']
  },
  commission: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  appName: {
    type: String,
    default: 'MediBook'
  },
  tagline: {
    type: String,
    default: 'Your Health, Our Priority'
  },
  logo: {
    type: String,
    default: null
  },
  contactEmail: {
    type: String,
    default: 'support@medibook.com'
  },
  contactPhone: {
    type: String,
    default: '+91 9876543210'
  },
  address: {
    type: String,
    default: ''
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: true
  },
  reminders: {
    reminder_1d: {
      type: Boolean,
      default: true
    },
    reminder_1h: {
      type: Boolean,
      default: true
    },
    reminder_15m: {
      type: Boolean,
      default: true
    }
  },
  cancellationPolicy: {
    allowWithin24h: {
      type: Boolean,
      default: false
    },
    refundPercentage: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
