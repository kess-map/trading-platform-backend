import cron from 'node-cron'
import { creditInvestmentReturns, transferInitialInvestment } from '../controllers/investmentController.js'
import Notification from '../models/notificationModel.js';
import LiveSession from '../models/liveSessionModel.js';
import MatchedOrder from '../models/matchedOrderModel.js';
import SellOrder from '../models/sellOrderModel.js';
import catchAsync from './catchAsync.js';
import User from '../models/userModel.js';

cron.schedule('*/3 * * * *', async () => {
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

cron.schedule('*/15 * * * *', catchAsync(async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const sessions = await LiveSession.find();
  const SESSION_DURATION_HOURS = 2;

  for (const session of sessions) {
    const sessionStart = new Date(`${today}T${session.startTime}:00Z`);
    const sessionExpiry = new Date(sessionStart.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    const diffInMinutes = Math.abs((now.getTime() - sessionExpiry.getTime()) / (1000 * 60));

    if (diffInMinutes <= 7.5) {
      const matchedOrders = await MatchedOrder.find({
        status: 'deployed',
        paymentStatus: 'pending'
      });

      let totalRefunded = 0;

      for (const order of matchedOrders) {
        try {
          const sellOrder = await SellOrder.findById(order.sellOrder);
          if (!sellOrder) continue;

          const sellerId = sellOrder.user;
          const user = await User.findById(sellerId);
          if (!user) continue;

          const amount = order.amount ?? 0
          if (!amount) continue;

          user.availableBalance += amount;
          order.status = 'cancelled';

          await user.save();
          await order.save();
          totalRefunded++;
        } catch (err) {
          console.error(`Error processing refund for order ${order._id}:`, err);
        }
      }

      console.log(`Session ${session.startTime} expired. ${totalRefunded} orders cancelled and refunded.`);
    }
  }
}));