import cron from 'node-cron'
import { creditInvestmentReturns, transferInitialInvestment } from '../controllers/investmentController.js'

cron.schedule('0 0 * * *', async () => {
  console.log('Running creditInvestmentReturns...');
  await creditInvestmentReturns();
});

cron.schedule('0 1 * * *', async () => {
  console.log('Running transferInitialInvestment...');
  await transferInitialInvestment();
});
