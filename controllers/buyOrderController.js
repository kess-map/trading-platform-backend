import BuyOrder from "../models/BuyOrderModel.js";
import SellOrder from '../models/sellOrderModel.js'
import MatchedOrder from '../models/matchedOrderModel.js'
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

    const buyOrders = await BuyOrder.find({user: userId, status: 'pending'}).populate('user', 'fullName phoneNumber').sort({createdAt: -1})

    success(res, buyOrders)
})

export const getBuyAndSellOrders = catchAsync(async (req, res) => {
  const userId = req.userId;

  const [buyOrders, sellOrders, matchedOrders] = await Promise.all([
    BuyOrder.find({ user: userId }).populate('user', 'phoneNumber').lean(),
    SellOrder.find({ user: userId }).populate('user', 'phoneNumber').lean(),
    MatchedOrder.find({
      $or: [{ buyer: userId }, { seller: userId }]
    })
      .populate('buyer', 'phoneNumber')
      .populate('seller', 'phoneNumber')
      .populate('buyOrder')
      .populate('sellOrder')
      .lean()
  ]);

  const groupOrders = (orders, matched) => ({
    pending: orders.filter(o => o.status === 'pending' || o.status === 'approved'),
    approved: matched,
    completed: orders.filter(o => o.status === 'completed'),
  });

  const matchedBuyOrders = matchedOrders
    .filter(order => String(order.buyer._id) === String(userId))
    .map(order => ({
      ...order.buyOrder,
      matchedOrder: order,
      status: order.status
    }));

  const matchedSellOrders = matchedOrders
    .filter(order => String(order.seller._id) === String(userId))
    .map(order => ({
      ...order.sellOrder,
      matchedOrder: order,
      status: order.status
    }));

  const response = {
    buyOrders: groupOrders(buyOrders, matchedBuyOrders),
    sellOrders: groupOrders(sellOrders, matchedSellOrders)
  };

  success(res, response);
});