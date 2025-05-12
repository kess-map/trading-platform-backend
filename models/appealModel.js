import mongoose from 'mongoose';

const appealSchema = new mongoose.Schema({
  appealedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appealedAgainst: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchedOrder',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'late confirmation',
      'payment not confirmed',
      'payment not received',
      'fake proof of payment',
      'user unresponsive',
      'other',
    ],
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'rejected'],
    default: 'pending',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  resolutionNote: {
    type: String,
  },
}, { timestamps: true });

const Appeal = mongoose.model('Appeal', appealSchema);

export default Appeal;