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
    const appeals = await Appeal.find()
      .populate('appealedBy', 'fullName')
      .populate('appealedAgainst', 'fullName')

    success(res, appeals)
})

export const getAppealById = catchAsync(async (req, res) => {
    const appeal = await Appeal.findById(req.params.id)
      .populate('appealedBy', 'name email')
      .populate('appealedAgainst', 'name email')
      .populate('order');

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    success(res, appeal)
})

export const updateAppealStatus = catchAsync(async (req, res) => {
    const { status, resolutionNote, resolvedBy } = req.body;

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    appeal.status = status || appeal.status;
    appeal.resolutionNote = resolutionNote || appeal.resolutionNote;
    appeal.resolvedBy = resolvedBy || appeal.resolvedBy;

    await appeal.save();

    success(res, appeal)
})
