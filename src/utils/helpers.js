export const computePerformanceStatus = (averageScore, attendancePercentage) => {
  const score = averageScore ?? 0;
  const attendance = attendancePercentage ?? 0;

  if (score >= 80 && attendance >= 75) return 'Excellent';
  if (score >= 60 && attendance >= 60) return 'Good';
  if (score >= 40 || attendance >= 40) return 'Needs Attention';
  return 'Critical';
};

export const computeReadinessScore = ({ dailyStudyHours, mockTestsAttempted, stage, subject }) => {
  let score = 0;

  score += Math.min(dailyStudyHours * 5, 30);
  score += Math.min(mockTestsAttempted * 3, 25);

  const stageBonus = { Beginner: 5, Intermediate: 15, Advanced: 25 };
  score += stageBonus[stage] || 10;

  if (subject) score += 10;

  return Math.min(Math.round(score), 100);
};

export const getReadinessRecommendations = (score, stage) => {
  const recommendations = [];

  if (score < 40) {
    recommendations.push('Increase daily study hours to at least 6-8 hours');
    recommendations.push('Start with NCERT fundamentals before advanced materials');
  } else if (score < 60) {
    recommendations.push('Attempt at least 2 mock tests per week');
    recommendations.push('Focus on answer writing practice daily');
  } else if (score < 80) {
    recommendations.push('Revise weak subjects identified in mock tests');
    recommendations.push('Join a test series for consistent evaluation');
  } else {
    recommendations.push('Maintain current momentum with revision cycles');
    recommendations.push('Focus on current affairs and essay writing');
  }

  if (stage === 'Beginner') {
    recommendations.push('Build a strong foundation in History, Polity, and Geography');
  } else if (stage === 'Intermediate') {
    recommendations.push('Integrate prelims and mains preparation strategically');
  } else {
    recommendations.push('Fine-tune optional subject and interview preparation');
  }

  return recommendations;
};
