import Appeal from '../models/appealModel.js';
import catchAsync from '../utils/catchAsync.js';
import { success } from '../utils/response.js';

export const createAppeal = catchAsync(async (req, res) => {
    const { appealedBy, appealedAgainst, order, reason, description } = req.body;

    const appeal = await Appeal.create({
      appealedBy,
      appealedAgainst,
      order,
      reason,
      description,
    });

    success(res, appeal)
  })

export const getAllAppeals = catchAsync(async (req, res) => {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const appeals = await Appeal.find(query)
      .populate('appealedBy', 'fullName email')
      .populate('appealedAgainst', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: appeals,
    });
})

export const getAppealById = catchAsync(async (req, res) => {
    const appeal = await Appeal.findById(req.params.id)
      .populate('appealedBy', 'fullName email username')
      .populate('appealedAgainst', 'fullName email username')
      .populate({
        path: 'order',
        populate: [
          { path: 'buyer', select: 'fullName' },
          { path: 'seller', select: 'fullName' }
        ]
      });

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    success(res, appeal)
    })

export const updateAppealStatus = catchAsync(async (req, res) => {
  const userId = req.userId
    const { status, resolutionNote } = req.body;

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    appeal.status = status || appeal.status;
    appeal.resolutionNote = resolutionNote || appeal.resolutionNote;
    appeal.resolvedBy = userId

    await appeal.save();

    success(res, appeal)
})
