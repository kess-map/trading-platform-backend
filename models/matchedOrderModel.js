import mongoose from 'mongoose';
 
const matchedOrderSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SellOrder', required: true },
  buyOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyOrder', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'deployed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  proofOfPayment: { type: String },
  paidAt: { type: Date },
  confirmedAt: { type: Date },
}, {timestamps: true});
 
const MatchedOrder = mongoose.model('MatchedOrder', matchedOrderSchema);

export default MatchedOrder