import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import StudentProfile from './models/StudentProfile.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected for seeding...');

  await User.deleteMany({});
  await StudentProfile.deleteMany({});

  const password = await bcrypt.hash('password123', 12);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@portal.com',
    password,
    role: 'admin',
  });

  const mentor = await User.create({
    name: 'Dr. Rajesh Mentor',
    email: 'mentor@portal.com',
    password,
    role: 'mentor',
    mobile: '9876543210',
  });

  const evaluator = await User.create({
    name: 'Prof. Priya Evaluator',
    email: 'evaluator@portal.com',
    password,
    role: 'evaluator',
    mobile: '9876543211',
  });

  const student = await User.create({
    name: 'Amit Student',
    email: 'student@portal.com',
    password,
    role: 'student',
    mobile: '9876543212',
  });

  await StudentProfile.create({
    user: student._id,
    targetUPSCYear: 2026,
    notes: 'Focused on GS Paper 1 and 2',
    mentor: mentor._id,
    attendancePercentage: 85,
    testsAttempted: 5,
    averageScore: 72,
    performanceStatus: 'Good',
    completedTasks: 8,
    missedDeadlines: 1,
  });

  console.log('Seed completed!');
  console.log('Demo accounts (password: password123):');
  console.log('  Admin:     admin@portal.com');
  console.log('  Mentor:    mentor@portal.com');
  console.log('  Evaluator: evaluator@portal.com');
  console.log('  Student:   student@portal.com');

  await mongoose.disconnect();
};

seed().catch(console.error);
