import mongoose from 'mongoose';
 
const idVerificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending'
    },
    frontImage: {type: String, required: true},
    backImage: {type: String, required: true}
}, {timestamps: true});
 
const IdVerification = mongoose.model('IdVerification', idVerificationSchema);

export default IdVerification