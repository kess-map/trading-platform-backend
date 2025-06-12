import cron from 'node-cron'
import { creditInvestmentReturns, transferInitialInvestment } from '../controllers/investmentController.js'
import Notification from '../models/notificationModel.js';
import LiveSession from '../models/liveSessionModel.js';
import MatchedOrder from '../models/matchedOrderModel.js';
import SellOrder from '../models/sellOrderModel.js';
import catchAsync from './catchAsync.js';
import User from '../models/userModel.js';
import BuyOrder from '../models/buyOrderModel.js';

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

cron.schedule('*/10 * * * *', catchAsync(async () => {
  console.log('Cancelling unpaid orders...');
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const sessions = await LiveSession.find();
  const SESSION_DURATION_HOURS = 2;

  for (const session of sessions) {
    const sessionStart = new Date(`${today}T${session.startTime}:00`);
    const sessionExpiry = new Date(sessionStart.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    const diffInMinutes = Math.abs((now.getTime() - sessionExpiry.getTime()) / (1000 * 60));

    if (diffInMinutes <= 7.5) {
      const matchedOrders = await MatchedOrder.find({
        status: 'deployed',
        paymentStatus: 'pending'
      });

      let totalOrders = 0
      for (const order of matchedOrders) {
        try {
          const { sellOrder: sellOrderId, buyOrder: oldBuyOrderId, amount: matchedAmount } = order;
 
          const sellOrder = await SellOrder.findById(sellOrderId);
          const oldBuyOrder = await BuyOrder.findById(oldBuyOrderId);
        
          if (!sellOrder || !oldBuyOrder) {
            continue
          }
        
          // Step 1: Reset old buyer's state
          oldBuyOrder.status = 'cancelled';
          oldBuyOrder.matchedTo = undefined;
          await oldBuyOrder.save();
        
          // Step 2: update match status
          order.status = 'cancelled'
          await order.save()
        
          // Step 3: Increase seller's remainingAmount
          sellOrder.remainingAmount = (sellOrder.remainingAmount || 0) + matchedAmount;
          sellOrder.status = 'approved'
          await sellOrder.save();
          totalOrders++
        } catch (err) {
          console.error(`Error processing refund for order ${order._id}:`, err);
        }
      }
      console.log(`Session ${session.startTime} expired. ${totalOrders} orders cancelled and refunded.`);
    }
  }
}));