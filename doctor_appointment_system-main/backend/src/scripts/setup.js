const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Settings = require('../models/Settings');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor_appointment';

const setupData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@medibook.com',
      password: 'admin123',
      phone: '+91 9876543210',
      role: 'admin',
      isActive: true
    });
    console.log('Admin created:', admin.email);

    // Create doctor users
    const doctor1 = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@medibook.com',
      password: 'doctor123',
      phone: '+91 9876543211',
      role: 'doctor',
      isActive: true
    });

    const doctor2 = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh@medibook.com',
      password: 'doctor123',
      phone: '+91 9876543212',
      role: 'doctor',
      isActive: true
    });

    const doctor3 = await User.create({
      name: 'Dr. Ananya Patel',
      email: 'ananya@medibook.com',
      password: 'doctor123',
      phone: '+91 9876543213',
      role: 'doctor',
      isActive: true
    });

    console.log('Doctor users created');

    // Create doctor profiles
    const doctorProfile1 = await Doctor.create({
      userId: doctor1._id,
      specialty: 'General Physician',
      qualification: 'MBBS, MD',
      experience: 12,
      bio: 'Experienced general physician with a focus on preventive care and chronic disease management.',
      consultationFee: 500,
      status: 'approved',
      rating: 4.8,
      totalRatings: 156,
      isAvailable: true,
      availability: {
        monday: [{ start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' }, { start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '14:00', end: '14:30' }, { start: '15:00', end: '15:30' }],
        tuesday: [{ start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' }, { start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '14:00', end: '14:30' }, { start: '15:00', end: '15:30' }],
        wednesday: [{ start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' }, { start: '10:00', end: '10:30' }],
        thursday: [{ start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' }, { start: '10:00', end: '10:30' }, { start: '14:00', end: '14:30' }, { start: '15:00', end: '15:30' }],
        friday: [{ start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' }, { start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }],
        saturday: [],
        sunday: []
      }
    });

    const doctorProfile2 = await Doctor.create({
      userId: doctor2._id,
      specialty: 'Cardiologist',
      qualification: 'MBBS, DM Cardiology',
      experience: 15,
      bio: 'Specialized cardiologist with expertise in interventional cardiology and heart failure management.',
      consultationFee: 800,
      status: 'approved',
      rating: 4.9,
      totalRatings: 89,
      isAvailable: true,
      availability: {
        monday: [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '15:00', end: '15:30' }],
        tuesday: [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '15:00', end: '15:30' }],
        wednesday: [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }],
        thursday: [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '15:00', end: '15:30' }],
        friday: [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }],
        saturday: [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }],
        sunday: []
      }
    });

    const doctorProfile3 = await Doctor.create({
      userId: doctor3._id,
      specialty: 'Dermatologist',
      qualification: 'MBBS, MD Dermatology',
      experience: 8,
      bio: 'Dedicated dermatologist specializing in cosmetic dermatology and skin cancer screening.',
      consultationFee: 600,
      status: 'pending',
      rating: 0,
      totalRatings: 0,
      isAvailable: false,
      availability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    });

    console.log('Doctor profiles created');

    // Create regular users
    const user1 = await User.create({
      name: 'Rahul Verma',
      email: 'user@medibook.com',
      password: 'user123',
      phone: '+91 9876543214',
      role: 'user',
      isActive: true
    });

    const user2 = await User.create({
      name: 'Sneha Gupta',
      email: 'sneha@medibook.com',
      password: 'user123',
      phone: '+91 9876543215',
      role: 'user',
      isActive: true
    });

    const user3 = await User.create({
      name: 'Lisa',
      email: 'lisa@medibook.com',
      password: 'lisa123',
      phone: '+91 9876543214',
      role: 'user',
      isActive: true
    });

    console.log('Regular users created');

    // Create settings
    await Settings.create({
      key: 'app_settings',
      commission: 10,
      appName: 'MediBook',
      tagline: 'Your Health, Our Priority',
      contactEmail: 'support@medibook.com',
      contactPhone: '+91 9876543210',
      emailNotifications: true,
      smsNotifications: true,
      reminders: {
        reminder_1d: true,
        reminder_1h: true,
        reminder_15m: true
      }
    });

    console.log('Settings created');

    console.log('\n✅ Setup complete!');
    console.log('\nDemo accounts:');
    console.log('─────────────────────────────────────');
    console.log('Admin:  admin@medibook.com / admin123');
    console.log('Doctor: doctor@medibook.com / doctor123');
    console.log('User:   user@medibook.com / user123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
};

setupData();
