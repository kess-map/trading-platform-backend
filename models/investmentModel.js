import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },          
  planDurationDays: {
    type: Number,
    required: true
  },
  roiPercentage: {
    type: Number,
    required: true
  },
  investmentCreatedAt: {
    type: Date,
    default: Date.now
  },
  investmentEndsAt: {
    type: Date,
    required: true
  },
  countdownEndsAt: {
    type: Date,
    required: true
  },
  isCountdownCompleted: {
    type: Boolean,
    default: false
  },
  isInitialAmountMoved: {
    type: Boolean,
    default: false
  },
  reinvestments: [
    {
      amount: Number,
      planDurationDays: Number,
      reinvestedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  roiCredited: {
    type: Boolean,
    default: false
  }
}, {timestamps: true});

const Investments = mongoose.model('Investment', investmentSchema);

export default Investments;