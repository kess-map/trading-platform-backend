import SellOrder from "../models/sellOrderModel.js";
import catchAsync from "../utils/catchAsync.js";
import { success } from "../utils/response.js";

export const createSellOrder = catchAsync(async(req, res)=>{
    const userId = req.userId
    const {amount, paymentMethod} = req.body

    const newSellOrder = new SellOrder({
        user: userId,
        amount,
        remainingAmount: amount,
        paymentMethod
    })

    await newSellOrder.save()

    success(res, newSellOrder, 'new sell order created successfully', 201)
})

export const getPendingSellOrders = catchAsync(async(req, res)=>{
    const userId = req.userId

    const sellOrders = await SellOrder.find({user: userId}).populate('user', 'phoneNumber').sort({createdAt: -1})

    success(res, sellOrders)
})