import Investment from '../models/investmentModel.js';
import ReferralBonus from '../models/referralBonusModel.js';
import Notification from '../models/notificationModel.js';
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

      await Notification.create({
        userId: user._id,
        category: 'investments',
        title: `Investment Completed`,
        content: `${roiAmount}CHT has been added to your wallet on completed Investment`
      })

      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const referralBonus = roiAmount * 0.5; 
          referrer.referralBonusBalance += referralBonus;
          referrer.availableBalance += referralBonus;
          await referrer.save();

          await ReferralBonus.create({
            referrer: user.referredBy,
            referredUser: investment.user,
            investment: investment._id,
            bonusAmount: referralBonus
          });

          await Notification.create({
            userId: user.referredBy,
            category: 'investments',
            title: `Referral Bonus Credited`,
            content: `${referralBonus}CHT has been added to your wallet.`
          })
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

    const totalCountdownDuration = countdownEndsAt - investment.createdAt;
    const elapsed = now - investment.createdAt;

    let percentageCompleted = (elapsed / totalCountdownDuration) * 100;
    if (percentageCompleted > 100) percentageCompleted = 100;

    return res.status(200).json({
      success: true,
      countdownEndsAt,
      percentageCompleted: Number(percentageCompleted.toFixed(2))
    });
});

export const getRefferralDetails = catchAsync(async(req, res)=>{
  const userId = req.userId

  const referrals = await User.find({referredBy: userId})

  const referralList = await Promise.all(
    referrals.map(async (ref) => {
      const investments = await Investment.find({ user: ref._id });
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

      const bonuses = await ReferralBonus.find({ referrer: userId, referredUser: ref._id });
      const totalBonus = bonuses.reduce((sum, b) => sum + b.bonusAmount, 0);

      return {
        username: ref.username,
        amountInvested: totalInvested,
        dateJoined: ref.createdAt,
        bonus: totalBonus
      };
    })
  );

  res.status(200).json({ referralList })
})

export const getReferralCounts = catchAsync(async (req, res) => {
  const userId = req.userId;

  // Get all users referred by the current user
  const referredUsers = await User.find({ referredBy: userId }).select('_id');

  const totalReferrals = referredUsers.length;

  if (totalReferrals === 0) {
    return res.json({ totalReferrals: 0, activeReferrals: 0 });
  }

  const referredUserIds = referredUsers.map(user => user._id);

  // Count how many referred users have made at least one investment
  const activeReferralUsers = await Investment.distinct('user', {
    user: { $in: referredUserIds }
  });

  const activeReferrals = activeReferralUsers.length;

  res.json({
    totalReferrals,
    activeReferrals
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
  