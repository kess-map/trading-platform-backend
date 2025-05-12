import cron from 'node-cron'
import { creditInvestmentReturns, transferInitialInvestment } from '../controllers/investmentController.js'
import Notification from '../models/notificationModel.js';
import LiveSession from '../models/liveSessionModel.js';
import MatchedOrder from '../models/matchedOrderModel.js';
import catchAsync from './catchAsync.js';

cron.schedule('*/30 * * * *', async () => {
  console.log('Running creditInvestmentReturns...');
  await creditInvestmentReturns();
});

cron.schedule('*/30 * * * *', async () => {
  console.log('Running transferInitialInvestment...');
  await transferInitialInvestment();
});

cron.schedule('0 0 * * *', async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  try {
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoffDate } });
    console.log(`[Cron] Deleted ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('[Cron] Error deleting old notifications:', error);
  }
});

cron.schedule('*/15 * * * *', catchAsync( async()=>{
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const sessions = await LiveSession.find();

    for (const session of sessions) {
      const sessionStart = new Date(`${today}T${session.startTime}:00Z`);
      const sessionExpiry = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);

      const diffInMinutes = Math.abs((now.getTime() - sessionExpiry.getTime()) / (1000 * 60));

      if (diffInMinutes <= 7.5) {
        const result = await MatchedOrder.updateMany(
          { status: 'deployed', paymentStatus: 'pending' },
          { $set: { status: 'cancelled' } }
        );

        console.log(`Session ${session.startTime} expired. ${result.modifiedCount} pending orders cancelled.`);
      }
    }}));