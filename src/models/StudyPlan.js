import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    focusAreas: [{ type: String }],
    suggestedStudyHours: { type: Number, required: true },
    answerWritingTargets: { type: String, required: true },
    revisionStrategy: { type: String, required: true },
    weekStartDate: { type: Date, default: Date.now },
    generatedFrom: {
      averageScore: Number,
      completedTasks: Number,
      missedDeadlines: Number,
      weaknesses: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model('StudyPlan', studyPlanSchema);
