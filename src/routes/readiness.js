import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  computeReadinessScore,
  getReadinessRecommendations,
} from '../utils/helpers.js';

const router = express.Router();

router.post(
  '/analyze',
  [
    body('dailyStudyHours').isFloat({ min: 0, max: 24 }),
    body('mockTestsAttempted').isInt({ min: 0 }),
    body('stage').isIn(['Beginner', 'Intermediate', 'Advanced']),
    body('subject').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dailyStudyHours, mockTestsAttempted, stage, subject } = req.body;

    const readinessScore = computeReadinessScore({
      dailyStudyHours,
      mockTestsAttempted,
      stage,
      subject,
    });

    const recommendations = getReadinessRecommendations(readinessScore, stage);

    let indicator = 'Needs Improvement';
    let indicatorColor = '#ef4444';
    if (readinessScore >= 80) {
      indicator = 'Exam Ready';
      indicatorColor = '#22c55e';
    } else if (readinessScore >= 60) {
      indicator = 'On Track';
      indicatorColor = '#3b82f6';
    } else if (readinessScore >= 40) {
      indicator = 'Building Foundation';
      indicatorColor = '#f59e0b';
    }

    res.json({
      readinessScore,
      indicator,
      indicatorColor,
      recommendations,
      inputs: { dailyStudyHours, mockTestsAttempted, stage, subject: subject || null },
    });
  }
);

export default router;
