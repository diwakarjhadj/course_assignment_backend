import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Task from '../models/Task.js';
import Evaluation from '../models/Evaluation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, mobile } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const mentor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'mentor',
      mobile: mobile || '',
    });

    res.status(201).json({
      mentor: { id: mentor._id, name: mentor.name, email: mentor.email },
    });
  }
);

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const mentors = await User.find({ role: 'mentor' }).select('-password -refreshToken');
  res.json({ mentors });
});

router.get('/assigned-students', authenticate, authorize('mentor'), async (req, res) => {
  const profiles = await StudentProfile.find({ mentor: req.user._id }).populate(
    'user',
    'name email'
  );

  const students = await Promise.all(
    profiles.map(async (profile) => {
      const pendingTasks = await Task.countDocuments({
        assignedTo: profile.user._id,
        status: 'pending',
      });

      const evaluations = await Evaluation.find({ student: profile.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('score createdAt');

      const trend =
        evaluations.length >= 2
          ? evaluations[0].score > evaluations[evaluations.length - 1].score
            ? 'improving'
            : evaluations[0].score < evaluations[evaluations.length - 1].score
              ? 'declining'
              : 'stable'
          : 'insufficient_data';

      return {
        id: profile.user._id,
        name: profile.user.name,
        email: profile.user.email,
        averageScore: profile.averageScore,
        pendingTasks,
        performanceTrend: trend,
        performanceStatus: profile.performanceStatus,
      };
    })
  );

  res.json({ students });
});

export default router;
