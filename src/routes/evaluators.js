import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
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
    const evaluator = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'evaluator',
      mobile: mobile || '',
    });

    res.status(201).json({
      evaluator: { id: evaluator._id, name: evaluator.name, email: evaluator.email },
    });
  }
);

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const evaluators = await User.find({ role: 'evaluator' }).select('-password -refreshToken');
  res.json({ evaluators });
});

export default router;
