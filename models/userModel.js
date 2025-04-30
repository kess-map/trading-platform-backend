import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    country: { type: String },
    password: { type: String, required: true },
    referralCode: { type: String, required: true, unique: true},
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPER-ADMIN'],
      default: 'USER'
    },
    isPhoneVerified: { type: Boolean, default: false },
    isDocumentVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    availableBalance: {
      type: Number,
      default: 0,
    },
    stakedBalance: {
      type: Number,
      default: 0,
    },
    referralBonusBalance: {
      type: Number,
      default: 0,
    },
    AccountNumber: {type:Number},
    BankName: {type: String},
    phoneVerificationCode: { type: String },
    phoneVerificationExpires: { type: Date },
    resendAttempts: { type: Number, default: 0 },
    lastResendAt: { type: Date },
    wrongOtpAttempts: { type: Number, default: 0 },
}, {timestamps: true});

const User = mongoose.model('User', userSchema);

export default User