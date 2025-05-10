import ProfileEditRequest from '../models/profileEditRequestModel.js';
import { failure, success } from '../utils/response.js';
import catchAsync from '../utils/catchAsync.js'
import IdVerification from '../models/idVerificationModel.js';
import cloudinary from '../utils/cloudinary.js'
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs'
import Notification from '../models/notificationModel.js';
 
export const requestProfileEdit = catchAsync(async (req, res) => {
  const userId = req.userId;
  const updates = req.body;
 
  const existing = await ProfileEditRequest.findOne({ user: userId, status: 'pending' });
  if (existing) {
    return failure(res, 'You already have a pending request')
  }
 
  const request = new ProfileEditRequest({ user: userId, updates });
  await request.save();

  success(res, {}, 'Profile update request submitted', 201)
})

export const requestIdentityVerification = catchAsync(async (req, res) => {
  const userId = req.userId;
  const {country, verificationType, frontImage, backImage } = req.body
 
  const existing = await IdVerification.findOne({ user: userId, status: 'pending' });
  if (existing) {
    return failure(res, 'You already have a pending request')
  }

  const uploadBase64 = async (base64, folder) => {
    return await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'image',
    });
  };

  const [frontUpload, backUpload] = await Promise.all([
    uploadBase64(frontImage, 'identity_verifications/front'),
    uploadBase64(backImage, 'identity_verifications/back'),
  ]);
 
  const request = new IdVerification({ user: userId, type:verificationType, country, frontImage: frontUpload.secure_url, backImage: backUpload.secure_url});
  await request.save();

  success(res, {}, 'Identity Verification request submitted', 201)
})

export const getPendingRequestVerification = catchAsync(async(req, res)=>{
  const userId = req.userId

  const hasPendingVerification = await IdVerification.findOne({user: userId, status: 'pending'})

  success(res, hasPendingVerification ? true : false)
})

export const changePassword = catchAsync(async(req, res)=>{
  const userId = req.userId
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(userId)

  if(!user) return failure(res, 'User not found', 404)

  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password)

  if(!isOldPasswordCorrect) return failure(res, 'Incorrect password', 404)

  const salt = await bcrypt.genSalt(10)

  const hashedPassword = await bcrypt.hash(newPassword, salt)

  user.password = hashedPassword

  await user.save()

  await Notification.create({
    userId: user._id,
    category: 'settings',
    title: "Password Changed Successfully",
    content: 'You changed your password. If you didn’t perform this action, contact support immediately.'
  })

  success(res, {}, 'Password Changed Successfully')
})