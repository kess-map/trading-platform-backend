import BuyOrder from "../models/buyOrderModel.js";
import SellOrder from '../models/sellOrderModel.js'
import MatchedOrder from '../models/matchedOrderModel.js'
import catchAsync from "../utils/catchAsync.js";
import { failure, success } from "../utils/response.js";
import cloudinary from '../utils/cloudinary.js'
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";

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
    BuyOrder.find({ user: userId }).populate('user', 'phoneNumber fullName').lean(),
    SellOrder.find({ user: userId }).populate('user', 'phoneNumber fullName').lean(),
    MatchedOrder.find({
      $or: [{ buyer: userId }, { seller: userId }],
      status: 'deployed',
    })
      .populate('buyer', 'phoneNumber')
      .populate('seller', 'phoneNumber fullName')
      .populate('buyOrder')
      .populate('sellOrder')
      .lean()
  ]);

  const groupOrders = (orders, matched) => ({
    pending: orders.filter(o => o.status === 'pending' || o.status === 'approved'),
    approved: matched,
    completed: orders.filter(o => o.status === 'completed'),
    cancelled: orders.filter(o => o.status === 'cancelled')
  });

  const matchedBuyOrders = matchedOrders
    .filter(order => String(order.buyer._id) === String(userId))
    .map(order => ({
      ...order,
      matchedOrder: order,
      status: order.status
    }));

  const matchedSellOrders = matchedOrders
    .filter(order => String(order.seller._id) === String(userId))
    .map(order => ({
      ...order,
      matchedOrder: order,
      status: order.status
    }));

  const response = {
    buyOrders: groupOrders(buyOrders, matchedBuyOrders),
    sellOrders: groupOrders(sellOrders, matchedSellOrders)
  };

  success(res, response);
});

export const cancelBuyOrder = catchAsync(async(req, res)=>{
  const userId = req.userId
  const {id} = req.params

  const buyOrder = await BuyOrder.findById(id)

  if(!buyOrder) return failure(res, 'Buy Order not found', 404)

  if(buyOrder.user.toString() !== userId.toString()) return failure(res, 'You can only update sell orders created by you')

  buyOrder.status = 'cancelled'

  await buyOrder.save()

  success(res, {}, 'Buy Order canceled successfully')
})

export const payForOrder = catchAsync(async(req, res)=>{
  const {paymentProof} = req.body
  const {id} = req.params
  const userId = req.userId

  const matchedOrder = await MatchedOrder.findById(id);
  if (!matchedOrder) {
    return failure(res, 'matched order not found', 404)
  }

  if (matchedOrder.buyer.toString() !== userId.toString()) {
    return failure(res, 'only buyer can access this route', 403)
  }

  if (!paymentProof) {
    failure(res, 'Payment proof is required', 400)
  }

  const result = await cloudinary.uploader.upload(paymentProof, {
    folder: "proofs",
  });

  matchedOrder.proofOfPayment = result.secure_url;
  matchedOrder.paymentStatus = "paid";
  matchedOrder.paidAt = new Date
  await matchedOrder.save();

  await Notification.create({
    userId: matchedOrder.seller,
    category: 'orders',
    title: 'Sell Order Payment',
    content: 'Buyer has just sent payment, view proof and confirm payment'
  })

  success(res, matchedOrder)
})

export const confirmOrderPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const matchedOrder = await MatchedOrder.findById(id);
  if (!matchedOrder) {
    return failure(res, 'Matched order not found', 404);
  }

  if (matchedOrder.seller.toString() !== userId.toString()) {
    return failure(res, 'Only the seller can confirm payment', 403);
  }

  if (matchedOrder.paymentStatus === 'confirmed') {
    return failure(res, 'This payment is already confirmed', 400);
  }

  matchedOrder.paymentStatus = 'confirmed';
  matchedOrder.status = 'completed';

  const buyOrder = await BuyOrder.findById(matchedOrder.buyOrder);
  const sellOrder = await SellOrder.findById(matchedOrder.sellOrder);

  if (buyOrder) {
    buyOrder.status = 'completed';
    await buyOrder.save();
  }

  const buyer = await User.findById(matchedOrder.buyer);
  if (buyer) {
    buyer.availableBalance += matchedOrder.amount;
    await buyer.save();
  }

  // Check if all matched orders for this sellOrder are completed
  const completedMatchedOrders = await MatchedOrder.find({
    sellOrder: sellOrder._id,
    status: 'completed'
  });

  const totalCompletedAmount = completedMatchedOrders.reduce((sum, order) => sum + order.amount, 0);

  if (totalCompletedAmount >= sellOrder.amount) {
    sellOrder.status = 'completed';
    await sellOrder.save();
  }

  await matchedOrder.save();

  // Notify buyer
  await Notification.create({
    userId: matchedOrder.buyer,
    category: 'orders',
    title: 'Buy Order Payment Confirmed',
    content: `Seller has confirmed your payment. ${matchedOrder.amount}CHT has been added to your wallet.`,
  });

  // Notify seller
  await Notification.create({
    userId: matchedOrder.seller,
    category: 'orders',
    title: 'Sell Order Completed',
    content: 'Your sell order has been marked as completed.',
  });

  success(res, matchedOrder);
});