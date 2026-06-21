import express from 'express';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Submission from '../models/Submission.js';
import Evaluation from '../models/Evaluation.js';
import Task from '../models/Task.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  const [totalStudents, totalMentors, totalEvaluators, activeStudents, pendingEvaluations, completedEvaluations] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'mentor' }),
      User.countDocuments({ role: 'evaluator' }),
      User.countDocuments({ role: 'student', isActive: true }),
      Submission.countDocuments({ status: 'pending' }),
      Evaluation.countDocuments(),
    ]);

  const profiles = await StudentProfile.find().select('performanceStatus averageScore');
  const performanceDistribution = {
    Excellent: 0,
    Good: 0,
    'Needs Attention': 0,
    Critical: 0,
  };
  profiles.forEach((p) => {
    performanceDistribution[p.performanceStatus] =
      (performanceDistribution[p.performanceStatus] || 0) + 1;
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tasks = await Task.find({ createdAt: { $gte: sixMonthsAgo } });
  const taskCompletionTrend = {};
  tasks.forEach((t) => {
    const month = t.createdAt.toISOString().slice(0, 7);
    if (!taskCompletionTrend[month]) {
      taskCompletionTrend[month] = { assigned: 0, completed: 0 };
    }
    taskCompletionTrend[month].assigned += 1;
    if (t.status === 'completed' || t.status === 'submitted') {
      taskCompletionTrend[month].completed += 1;
    }
  });

  const evaluations = await Evaluation.find({ createdAt: { $gte: sixMonthsAgo } }).sort({
    createdAt: 1,
  });
  const evaluationScoreTrend = {};
  evaluations.forEach((e) => {
    const month = e.createdAt.toISOString().slice(0, 7);
    if (!evaluationScoreTrend[month]) {
      evaluationScoreTrend[month] = { total: 0, count: 0 };
    }
    evaluationScoreTrend[month].total += e.score;
    evaluationScoreTrend[month].count += 1;
  });

  const scoreTrend = Object.entries(evaluationScoreTrend).map(([month, data]) => ({
    month,
    averageScore: Math.round((data.total / data.count) * 10) / 10,
  }));

  const completionTrend = Object.entries(taskCompletionTrend).map(([month, data]) => ({
    month,
    assigned: data.assigned,
    completed: data.completed,
    completionRate: data.assigned
      ? Math.round((data.completed / data.assigned) * 100)
      : 0,
  }));

  res.json({
    statistics: {
      totalStudents,
      totalMentors,
      totalEvaluators,
      activeStudents,
      pendingEvaluations,
      completedEvaluations,
    },
    charts: {
      performanceDistribution: Object.entries(performanceDistribution).map(([status, count]) => ({
        status,
        count,
      })),
      taskCompletionTrend: completionTrend,
      evaluationScoreTrend: scoreTrend,
    },
  });
});

router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });
  res.json({ users });
});

export default router;
