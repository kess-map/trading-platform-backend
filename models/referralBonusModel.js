import mongoose from 'mongoose';

const referralBonusSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true
  },
  bonusAmount: {
    type: Number,
    required: true
  },
}, {timestamps: true});

const ReferralBonus = mongoose.model('ReferralBonus', referralBonusSchema);

export default ReferralBonus
