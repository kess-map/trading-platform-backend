import mongoose from 'mongoose';
 
const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: { type: Number, required: true },
  purpose: {
    type: String,
    enum: ['investment', 'order', 'withdrawal', 'top-up'],
    required: true
  },
  reference: { type: String },
  createdAt: { type: Date, default: Date.now }
});
 
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction