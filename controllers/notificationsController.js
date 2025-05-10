import Notification from '../models/notificationModel.js'
import catchAsync from "../utils/catchAsync.js";
import { success } from '../utils/response.js';

export const getAllNotifications = catchAsync(async(req, res)=>{
    const userId = req.userId
    const { limit } = req.query;

    const query = Notification.find({ userId }).sort({ createdAt: -1 });

    if (limit && !isNaN(limit)) {
      query.limit(Number(limit));
    }

    const notifications = await query.exec();

    success(res, notifications)
})