export const generateStudyPlan = ({ averageScore, completedTasks, missedDeadlines, weaknesses }) => {
  const focusAreas = [];
  let suggestedStudyHours = 6;
  let answerWritingTargets = 'Write 2 answers daily (250 words each)';
  let revisionStrategy = 'Weekly revision of covered topics';

  if (averageScore < 50) {
    focusAreas.push('Fundamentals', 'NCERT Revision', 'Basic Answer Writing');
    suggestedStudyHours = 8;
    answerWritingTargets = 'Write 1 structured answer daily with model answer comparison';
    revisionStrategy = 'Daily 1-hour revision of previous day topics';
  } else if (averageScore < 70) {
    focusAreas.push('Current Affairs', 'Answer Writing', 'Optional Subject');
    suggestedStudyHours = 7;
    answerWritingTargets = 'Write 3 answers daily covering GS papers';
    revisionStrategy = 'Bi-weekly full subject revision cycles';
  } else {
    focusAreas.push('Advanced Topics', 'Essay Writing', 'Mock Test Analysis');
    suggestedStudyHours = 6;
    answerWritingTargets = 'Write 4 high-quality answers daily with peer review';
    revisionStrategy = 'Spaced repetition with monthly full syllabus revision';
  }

  if (missedDeadlines > 2) {
    focusAreas.push('Time Management');
    revisionStrategy += '; Use Pomodoro technique for focused study blocks';
  }

  if (completedTasks < 5) {
    focusAreas.push('Task Completion Discipline');
  }

  weaknesses.forEach((w) => {
    if (w && !focusAreas.includes(w)) focusAreas.push(w);
  });

  return {
    focusAreas: focusAreas.slice(0, 6),
    suggestedStudyHours,
    answerWritingTargets,
    revisionStrategy,
  };
};
