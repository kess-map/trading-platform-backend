import User from "../models/userModel.js"
import catchAsync from "../utils/catchAsync.js"
import { failure, success } from "../utils/response.js"
import { v4 as uuidv4 } from "uuid";
import {generateTokenAndSetCookie} from '../utils/generateTokenAndSetCookie.js'
import twilio from 'twilio';
import bcrypt from 'bcryptjs'
import sendSMS from "../utils/smsService.js";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const signup = catchAsync(async (req, res) => {
  const { fullName, username, email, phoneNumber, country, password, referralCode } = req.body;

  const existingUser = await User.findOne({
    $or: [
      { email },
      { username },
      { phoneNumber },
    ],
  });

  if (existingUser) {
    return failure(res, 'User with provided email, username, or phone number already exists.', 400);
  }

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return failure(res, 'Invalid referral code.', 400);
    }
    referredBy = referrer._id;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newReferralCode = uuidv4().split('-')[0]

  const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    fullName,
    username,
    email,
    phoneNumber,
    country,
    password: hashedPassword,
    referralCode: newReferralCode,
    referredBy,
    phoneVerificationCode,
    phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
  });

  generateTokenAndSetCookie(res, user._id)

  await sendSMS(phoneNumber, `Your verification code is ${phoneVerificationCode}`)

  return success(res, { user }, 'Account created successfully.');
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return failure(res, 'Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return failure(res, 'Invalid email or password.', 401);
  }

  const token = generateTokenAndSetCookie(res, user._id)

  return success(res, { user, token }, 'Logged in successfully.');
});

export const checkAuth = catchAsync(async (req, res)=>{
  const user = await User.findById(req.userId)

  if(!user) {
      return failure(res, 'User Not Found', 400)
  }
  success(res, {
      ...user._doc,
      password: undefined
  })
})

export const resendPhoneOtp = catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return failure(res, 'User not found.', 404);
  }

  const now = Date.now();

  if (user.lastResendAt && now - user.lastResendAt.getTime() > 60 * 60 * 1000) {
    user.resendAttempts = 0;
  }

  if (user.resendAttempts >= 3) {
    return failure(res, 'You have reached the maximum resend limit. Try again later.', 429);
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();

  user.phoneVerificationCode = newCode;
  user.phoneVerificationExpires = new Date(now + 10 * 60 * 1000);
  user.resendAttempts += 1;
  user.lastResendAt = new Date(now);

  await user.save();

  await sendSMS(phoneNumber, `Your verification code is ${newCode}`)

  return success(res, null, 'New verification code sent successfully.');
});

export const verifyPhoneOtp = catchAsync(async (req, res) => {
  const { phoneNumber, code } = req.body;

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return failure(res, 'User not found.', 404);
  }

  if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
    return failure(res, 'No verification code found. Please request a new one.', 400);
  }

  if (user.phoneVerificationExpires.getTime() < Date.now()) {
    return failure(res, 'Verification code expired. Please request a new one.', 400);
  }

  if (user.wrongOtpAttempts >= 5) {
    return failure(res, 'Too many wrong attempts. Please request a new code.', 429);
  }

  if (user.phoneVerificationCode !== code) {
    user.wrongOtpAttempts += 1;
    await user.save();
    return failure(res, 'Invalid code.', 400);
  }

  user.isPhoneVerified = true;
  user.phoneVerificationCode = null;
  user.phoneVerificationExpires = null;
  user.wrongOtpAttempts = 0;
  await user.save();

  return success(res, null, 'Phone number verified successfully.');
}); 