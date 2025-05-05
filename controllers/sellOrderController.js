import SellOrder from "../models/sellOrderModel.js";
import catchAsync from "../utils/catchAsync.js";
import { failure, success } from "../utils/response.js";

export const createSellOrder = catchAsync(async(req, res)=>{
    const userId = req.userId
    const {amount, bankName, accountName, accountNumber, network, walletAddress, paymentMethod} = req.body

    if(!paymentMethod) return failure(res, 'Input a valid payment method', 400)

    if(paymentMethod === 'bank'){
        const newBankSellOrder = new SellOrder({
            user: userId,
            amount: Number(amount),
            remainingAmount: Number(amount),
            paymentMethod,
            bankName,
            accountNumber,
            accountName
        })
        
        await newBankSellOrder.save()
    }else{
        const newCryptoSellOrder = new SellOrder({
            user: userId,
            amount: Number(amount),
            remainingAmount: Number(amount),
            paymentMethod,
            cryptoAddress: walletAddress,
            cryptoNetwork: network
        })
        
        await newCryptoSellOrder.save()
    }

    success(res, {}, 'new sell order created successfully', 201)
})

export const getPendingSellOrders = catchAsync(async(req, res)=>{
    const userId = req.userId

    const sellOrders = await SellOrder.find({user: userId, status: 'pending'}).populate('user', 'fullName phoneNumber').sort({createdAt: -1})

    success(res, sellOrders)
})

export const cancelSellOrder = catchAsync(async(req, res)=>{
  const {id} = req.params
  const userId = req.userId

  const sellOrder = await SellOrder.findById(id)

  if(!sellOrder) return failure(res, 'Sell Order not found', 404)

  if(sellOrder.user.toString() !== userId.toString()) return failure(res, 'You can only update sell orders created by you') 

  sellOrder.status = 'cancelled'

  await sellOrder.save()

  success(res, {}, 'Sell Order canceled successfully')
})