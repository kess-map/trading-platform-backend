import mongoose from 'mongoose';
 
const profileEditRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updates: {
    fullName: String,
    username: String,
    email: String,
    phoneNumber: Number,
    country: String
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {timestamps: true});
 
const ProfileEditRequest = mongoose.model('ProfileEditRequest', profileEditRequestSchema);

export default ProfileEditRequest