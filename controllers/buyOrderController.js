import BuyOrder from "../models/BuyOrderModel.js";
import catchAsync from "../utils/catchAsync.js";
import { success } from "../utils/response.js";

export const createBuyOrder = catchAsync(async(req, res)=>{
    const userId = req.userId
    const {amount, paymentMethod} = req.body

    const newBuyOrder = new BuyOrder({
        user: userId,
        amount,
        paymentMethod
    })

    await newBuyOrder.save()

    success(res, newBuyOrder, 'new buy order created successfully', 201)
})

export const getPendingBuyOrders = catchAsync(async(req, res)=>{
    const userId = req.userId

    const buyOrders = await BuyOrder.find({user: userId}).populate('user', 'phoneNumber').sort({createdAt: -1})

    success(res, buyOrders)
})