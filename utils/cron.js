import cron from 'node-cron'
import { creditInvestmentReturns, transferInitialInvestment } from '../controllers/investmentController.js'

cron.schedule('*/30 * * * *', async () => {
  console.log('Running creditInvestmentReturns...');
  await creditInvestmentReturns();
});

cron.schedule('*/30 * * * *', async () => {
  console.log('Running transferInitialInvestment...');
  await transferInitialInvestment();
});
