import mongoose from 'mongoose';
 
const buyOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['bank', 'usdt'], required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'matched', 'paid', 'declined', 'cancelled'],
    default: 'pending'
  },
  matchedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SellOrder' },
  proofOfPayment: { type: String },
}, {timestamps: true});
 
const BuyOrder = mongoose.model('BuyOrder', buyOrderSchema);

export default BuyOrder