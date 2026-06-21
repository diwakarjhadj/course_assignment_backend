import express from 'express';
import { body, validationResult } from 'express-validator';
import Submission from '../models/Submission.js';
import Evaluation from '../models/Evaluation.js';
import StudentProfile from '../models/StudentProfile.js';
import Task from '../models/Task.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { computePerformanceStatus } from '../utils/helpers.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

router.get('/pending', authenticate, authorize('evaluator'), async (req, res) => {
  const submissions = await Submission.find({ status: 'pending' })
    .populate('task', 'title description dueDate priority')
    .populate('student', 'name email')
    .sort({ submittedAt: -1 });

  res.json({ submissions });
});

router.post(
  '/',
  authenticate,
  authorize('evaluator'),
  [
    body('submissionId').notEmpty(),
    body('score').isFloat({ min: 0, max: 100 }),
    body('strengths').trim().notEmpty(),
    body('weaknesses').trim().notEmpty(),
    body('suggestions').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { submissionId, score, strengths, weaknesses, suggestions } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission || submission.status !== 'pending') {
      return res.status(404).json({ message: 'Pending submission not found.' });
    }

    const aiSuggestions = `Based on weaknesses: ${weaknesses}. Recommended focus: ${suggestions}`;

    const evaluation = await Evaluation.create({
      submission: submissionId,
      student: submission.student,
      evaluator: req.user._id,
      score,
      strengths,
      weaknesses,
      suggestions,
      aiSuggestions,
    });

    submission.status = 'evaluated';
    await submission.save();

    const task = await Task.findById(submission.task);
    if (task) {
      task.status = 'completed';
      await task.save();
    }

    const profile = await StudentProfile.findOne({ user: submission.student });
    if (profile) {
      profile.testsAttempted += 1;
      profile.lastEvaluationDate = new Date();

      const allEvaluations = await Evaluation.find({ student: submission.student });
      const avg =
        allEvaluations.reduce((sum, e) => sum + e.score, 0) / allEvaluations.length;
      profile.averageScore = Math.round(avg * 10) / 10;
      profile.performanceStatus = computePerformanceStatus(
        profile.averageScore,
        profile.attendancePercentage
      );
      await profile.save();
    }

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: submission.student,
      type: 'evaluation_submitted',
      title: 'Evaluation Completed',
      message: `Your submission has been evaluated. Score: ${score}/100`,
      metadata: { evaluationId: evaluation._id },
    });

    res.status(201).json({ evaluation });
  }
);

router.get('/history/student', authenticate, authorize('student'), async (req, res) => {
  const evaluations = await Evaluation.find({ student: req.user._id })
    .populate('evaluator', 'name')
    .populate({ path: 'submission', populate: { path: 'task', select: 'title' } })
    .sort({ createdAt: -1 });

  res.json({ evaluations });
});

router.get('/history', authenticate, authorize('evaluator', 'admin'), async (req, res) => {
  const filter = req.user.role === 'evaluator' ? { evaluator: req.user._id } : {};
  const evaluations = await Evaluation.find(filter)
    .populate('student', 'name email')
    .populate('evaluator', 'name')
    .populate({ path: 'submission', populate: { path: 'task', select: 'title' } })
    .sort({ createdAt: -1 });

  res.json({ evaluations });
});

export default router;
