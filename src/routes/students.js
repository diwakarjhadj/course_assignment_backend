import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { computePerformanceStatus } from '../utils/helpers.js';

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('mobile').trim().notEmpty(),
    body('targetUPSCYear').isInt({ min: 2024, max: 2035 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, mobile, targetUPSCYear, notes, mentorId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      mobile,
    });

    const profile = await StudentProfile.create({
      user: user._id,
      targetUPSCYear,
      notes: notes || '',
      mentor: mentorId || null,
      performanceStatus: 'Good',
    });

    res.status(201).json({
      student: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile,
      },
    });
  }
);

router.get('/', authenticate, authorize('admin', 'mentor'), async (req, res) => {
  const filter = req.user.role === 'mentor' ? { mentor: req.user._id } : {};
  const profiles = await StudentProfile.find(filter)
    .populate('user', 'name email mobile isActive')
    .populate('mentor', 'name email')
    .sort({ createdAt: -1 });

  res.json({ students: profiles });
});

router.get('/profile/me', authenticate, authorize('student'), async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id })
    .populate('mentor', 'name email');

  if (!profile) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  res.json({ profile });
});

router.get('/:id', authenticate, authorize('admin', 'mentor'), async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.params.id })
    .populate('user', 'name email mobile isActive')
    .populate('mentor', 'name email');

  if (!profile) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  if (req.user.role === 'mentor' && profile.mentor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not assigned to this student.' });
  }

  res.json({ student: profile });
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { name, mobile, targetUPSCYear, notes, mentorId, attendancePercentage } = req.body;

  const profile = await StudentProfile.findOne({ user: req.params.id });
  if (!profile) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  if (name || mobile) {
    await User.findByIdAndUpdate(req.params.id, {
      ...(name && { name }),
      ...(mobile && { mobile }),
    });
  }

  if (targetUPSCYear) profile.targetUPSCYear = targetUPSCYear;
  if (notes !== undefined) profile.notes = notes;
  if (mentorId !== undefined) profile.mentor = mentorId || null;
  if (attendancePercentage !== undefined) {
    profile.attendancePercentage = attendancePercentage;
    profile.performanceStatus = computePerformanceStatus(
      profile.averageScore,
      profile.attendancePercentage
    );
  }

  await profile.save();
  const updated = await StudentProfile.findById(profile._id)
    .populate('user', 'name email mobile')
    .populate('mentor', 'name email');

  res.json({ student: updated });
});

export default router;
