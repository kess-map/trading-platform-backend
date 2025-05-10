import cron from 'node-cron'
import { creditInvestmentReturns, transferInitialInvestment } from '../controllers/investmentController.js'
import Notification from '../models/notificationModel.js';

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