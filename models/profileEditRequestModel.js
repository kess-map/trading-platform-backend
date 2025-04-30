import mongoose from 'mongoose';
 
const profileEditRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updates: {
    fullName: String,
    AccountNumber: Number,
    BankName: String,
    phoneNumber: Number,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {timestamps: true});
 
const ProfileEditRequest = mongoose.model('ProfileEditRequest', profileEditRequestSchema);

export default ProfileEditRequest