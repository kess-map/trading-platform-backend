import mongoose from 'mongoose';
 
const sellOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  remainingAmount: { type: Number },
  paymentMethod: { type: String, enum: ['bank', 'usdt'], required: true },
  bankName: {type: String},
  accountNumber: {type: String},
  accountName: {type: String},
  cryptoAddress: {type: String},
  cryptoNetwork: {type: String},
  status: {
    type: String,
    enum: ['pending', 'approved', 'matched', 'confirmed', 'cancelled'],
    default: 'pending'
  },
}, {timestamps: true});
 
const SellOrder = mongoose.model('SellOrder', sellOrderSchema);

export default SellOrder