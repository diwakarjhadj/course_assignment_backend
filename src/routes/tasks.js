import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import StudentProfile from '../models/StudentProfile.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('mentor'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('dueDate').isISO8601(),
    body('priority').isIn(['Low', 'Medium', 'High']),
    body('assignedTo').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, priority, assignedTo } = req.body;

    const profile = await StudentProfile.findOne({
      user: assignedTo,
      mentor: req.user._id,
    });

    if (!profile && req.user.role === 'mentor') {
      return res.status(403).json({ message: 'Student not assigned to you.' });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      assignedBy: req.user._id,
    });

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: assignedTo,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned: "${title}"`,
      metadata: { taskId: task._id },
    });

    res.status(201).json({ task });
  }
);

router.get('/assigned', authenticate, authorize('student'), async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id }).sort({ dueDate: 1 });
  res.json({ tasks });
});

router.get('/mentor', authenticate, authorize('mentor'), async (req, res) => {
  const tasks = await Task.find({ assignedBy: req.user._id })
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
  res.json({ tasks });
});

router.post(
  '/:taskId/submit',
  authenticate,
  authorize('student'),
  [body('textResponse').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findOne({ _id: req.params.taskId, assignedTo: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const existing = await Submission.findOne({ task: task._id, student: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Already submitted for this task.' });
    }

    const submission = await Submission.create({
      task: task._id,
      student: req.user._id,
      textResponse: req.body.textResponse,
    });

    task.status = 'submitted';
    await task.save();

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile) {
      profile.completedTasks += 1;
      await profile.save();
    }

    const io = req.app.get('io');
    const taskWithMentor = await Task.findById(task._id).populate('assignedBy');
    if (taskWithMentor?.assignedBy) {
      await createNotification(io, {
        recipient: taskWithMentor.assignedBy._id,
        type: 'submission_received',
        title: 'Student Submission Received',
        message: `Submission received for task: "${task.title}"`,
        metadata: { submissionId: submission._id, taskId: task._id },
      });
    }

    res.status(201).json({ submission });
  }
);

router.patch('/:taskId/complete', authenticate, authorize('student'), async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, assignedTo: req.user._id });
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  task.status = 'completed';
  await task.save();
  res.json({ task });
});

export default router;
