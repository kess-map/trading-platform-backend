import Investment from '../models/investmentModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import { success, failure } from '../utils/response.js';

export const createInvestment = catchAsync(async (req, res) => {
    const { amount, planDurationDays, roiPercentage } = req.body;
    const userId = req.userId;
 
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
 
    if (user.availableBalance < amount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }
 
    await debitAvailableBalance(user, Number(amount));
    await creditStakedBalance(user, Number(amount));
 
    const now = new Date();
    const investmentEndsAt = new Date(now.getTime() + Number(planDurationDays) * 24 * 60 * 60 * 1000);
    const countdownEndsAt = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
 
    const newInvestment = new Investment({
      user: user._id,
      amount: Number(amount),
      planDurationDays: Number(planDurationDays),
      roiPercentage: Number(roiPercentage),
      investmentCreatedAt: now,
      investmentEndsAt,
      countdownEndsAt,
      isCountdownCompleted: false,
      isInitialAmountMoved: false,
      reinvestments: [],
    });
 
    await newInvestment.save();
 
    return res.status(201).json({ message: 'Investment created successfully', investment: newInvestment });
});

export const reinvestInvestment = catchAsync(async (req, res) => {
    const { investmentId } = req.body;
    const userId = req.userId; 

    const investment = await Investment.findOne({ _id: investmentId, user: userId });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    if (!investment.roiCredited) {
      return res.status(400).json({ message: 'Cannot reinvest. Investment returns not yet credited.' });
    }

    investment.reinvestments.push({
      amount: investment.amount, 
      planDurationDays: investment.planDurationDays,
      reinvestedAt: new Date()
    });

    investment.investmentCreatedAt = new Date();
    investment.investmentEndsAt = new Date(Date.now() + investment.planDurationDays * 24 * 60 * 60 * 1000);
    investment.roiCredited = false;

    await investment.save();

    return res.status(200).json({ message: 'Reinvestment started successfully.', investment });
});

export const creditInvestmentReturns = catchAsync(async (req, res) => {
    const now = new Date();

    const investments = await Investment.find({
      investmentEndsAt: { $lte: now },
      roiCredited: false
    });

    for (const investment of investments) {
      const user = await User.findById(investment.user);

      if (!user) continue;

      const roiAmount = investment.amount * (investment.roiPercentage / 100);

      user.availableBalance += roiAmount;

      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const referralBonus = roiAmount * 0.05; 
          referrer.referralBonusBalance += referralBonus;
          referrer.availableBalance += referralBonus;
          await referrer.save();
        }
      }

      investment.roiCredited = true;
      await investment.save();
      await user.save();
    }

    console.log('Investment ROIs credited successfully.');
});

export const transferInitialInvestment = catchAsync(async (req, res) => {
    const now = new Date();
    const investments = await Investment.find({
      countdownEndsAt: { $lte: now },
      isInitialAmountMoved: false,
    });

    for (const investment of investments) {
      const user = await User.findById(investment.user);
      if (!user) continue;

      const hasOngoingReinvestment = investment.investmentEndsAt > now && investment.roiCredited === false;

      if (hasOngoingReinvestment) {
        continue;
      }

      await debitStakedBalance(user, investment.amount);
      await creditAvailableBalance(user, investment.amount);

      investment.isCountdownCompleted = true;
      investment.isInitialAmountMoved = true;
      await investment.save();
    }

    console.log('transferInitialInvestment completed successfully.');
});

// export const reinvestReturns = catchAsync(async (req, res) => {
//     const { investmentId } = req.params;
//     const { amount, planDurationDays } = req.body;
//     const userId = req.userId;

//     const investment = await Investment.findById(investmentId);
//     const user = await User.findById(userId);

//     if (!investment) return res.status(404).json({ message: 'Investment not found' });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     if (user.availableBalance < amount) {
//       return res.status(400).json({ message: 'Insufficient available balance for reinvestment' });
//     }

//     await debitAvailableBalance(user, amount);
//     await creditStakedBalance(user, amount);

//     investment.reinvestments.push({
//       amount,
//       planDurationDays,
//       reinvestedAt: new Date(),
//     });

//     await investment.save();

//     return res.status(200).json({ message: 'Reinvested successfully' });
// });

export const getUserInvestments = catchAsync(async (req, res) => {
    const userId = req.userId;

    const pendingInvestments = await Investment.find({
      user: userId,
      roiCredited: false
    }).sort({ investmentCreatedAt: -1 });

    const completedInvestments = await Investment.find({
      user: userId,
      roiCredited: true
    }).sort({ investmentCreatedAt: -1 });

    const allInvestments = [...pendingInvestments, ...completedInvestments];

    const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpectedReturn = allInvestments.reduce((sum, inv) => {
      const roiPercent = inv.roiPercentage || 0;
      return sum + (inv.amount * roiPercent / 100);
    }, 0);

    return res.status(200).json({
      success: true,
      pending: pendingInvestments,
      completed: completedInvestments,
      summary: {
        totalInvested,
        totalExpectedReturn
      }
    });
});

export const getInvestmentCountdown = catchAsync(async (req, res) => {
    const { investmentId } = req.params;
    const investment = await Investment.findById(investmentId);

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    const now = new Date();
    const countdownEndsAt = new Date(investment.countdownEndsAt);

    const totalCountdownDuration = countdownEndsAt - investment.investmentCreatedAt;
    const elapsed = now - investment.investmentCreatedAt;

    let percentageCompleted = (elapsed / totalCountdownDuration) * 100;
    if (percentageCompleted > 100) percentageCompleted = 100;

    return res.status(200).json({
      success: true,
      countdownEndsAt,
      percentageCompleted: Number(percentageCompleted.toFixed(2))
    });
});


const debitAvailableBalance = async (user, amount) => {
    user.availableBalance -= amount;
    await user.save();
  };
  
  const creditAvailableBalance = async (user, amount) => {
    user.availableBalance += amount;
    await user.save();
  };
  
  const debitStakedBalance = async (user, amount) => {
    user.stakedBalance -= amount;
    await user.save();
  };
  
  const creditStakedBalance = async (user, amount) => {
    user.stakedBalance += amount;
    await user.save();
  };
  