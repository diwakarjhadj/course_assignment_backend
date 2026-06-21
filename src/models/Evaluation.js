import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema(
  {
    submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    strengths: { type: String, required: true },
    weaknesses: { type: String, required: true },
    suggestions: { type: String, required: true },
    aiSuggestions: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Evaluation', evaluationSchema);
