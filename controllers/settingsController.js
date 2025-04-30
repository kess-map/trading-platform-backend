import ProfileEditRequest from '../models/profileEditRequestModel.js';
import { failure, success } from '../utils/response.js';
import catchAsync from '../utils/catchAsync.js'
 
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