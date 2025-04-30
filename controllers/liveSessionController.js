import LiveSession from '../models/liveSessionModel.js';
import { success } from '../utils/response.js';
import catchAsync from '../utils/catchAsync.js';

export const getLiveSessions = catchAsync(async (req, res) => {
    const sessions = await LiveSession.find().sort({ startTime: 1 });
    return success(res, sessions );
})
