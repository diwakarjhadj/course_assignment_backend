import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    targetUPSCYear: { type: Number, required: true },
    notes: { type: String, default: '' },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attendancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    testsAttempted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0, min: 0, max: 100 },
    lastEvaluationDate: { type: Date },
    performanceStatus: {
      type: String,
      enum: ['Excellent', 'Good', 'Needs Attention', 'Critical'],
      default: 'Good',
    },
    missedDeadlines: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('StudentProfile', studentProfileSchema);
