import express from 'express';
import StudyPlan from '../models/StudyPlan.js';
import StudentProfile from '../models/StudentProfile.js';
import Evaluation from '../models/Evaluation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateStudyPlan } from '../services/aiService.js';

const router = express.Router();

router.post('/study-plan', authenticate, authorize('student', 'admin', 'mentor'), async (req, res) => {
  const studentId =
    req.user.role === 'student' ? req.user._id : req.body.studentId;

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID required.' });
  }

  if (req.user.role === 'mentor') {
    const profile = await StudentProfile.findOne({ user: studentId, mentor: req.user._id });
    if (!profile) {
      return res.status(403).json({ message: 'Student not assigned to you.' });
    }
  }

  const profile = await StudentProfile.findOne({ user: studentId });
  if (!profile) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const recentEvaluations = await Evaluation.find({ student: studentId })
    .sort({ createdAt: -1 })
    .limit(5);

  const weaknesses = recentEvaluations.map((e) => e.weaknesses).filter(Boolean);

  const planData = generateStudyPlan({
    averageScore: profile.averageScore,
    completedTasks: profile.completedTasks,
    missedDeadlines: profile.missedDeadlines,
    weaknesses,
  });

  const studyPlan = await StudyPlan.create({
    student: studentId,
    ...planData,
    generatedFrom: {
      averageScore: profile.averageScore,
      completedTasks: profile.completedTasks,
      missedDeadlines: profile.missedDeadlines,
      weaknesses,
    },
  });

  res.status(201).json({ studyPlan });
});

router.get('/study-plans', authenticate, authorize('student'), async (req, res) => {
  const plans = await StudyPlan.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.json({ studyPlans: plans });
});

router.get('/study-plans/:studentId', authenticate, authorize('admin', 'mentor'), async (req, res) => {
  if (req.user.role === 'mentor') {
    const profile = await StudentProfile.findOne({
      user: req.params.studentId,
      mentor: req.user._id,
    });
    if (!profile) {
      return res.status(403).json({ message: 'Student not assigned to you.' });
    }
  }

  const plans = await StudyPlan.find({ student: req.params.studentId }).sort({ createdAt: -1 });
  res.json({ studyPlans: plans });
});

export default router;
