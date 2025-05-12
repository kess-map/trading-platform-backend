import BuyOrder from '../models/buyOrderModel.js';
import SellOrder from '../models/sellOrderModel.js';
import MatchedOrder from '../models/matchedOrderModel.js';
import Investment from '../models/investmentModel.js';
import ProfileEditRequest from '../models/profileEditRequestModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import { failure, success } from '../utils/response.js';
import {generateTokenAndSetCookie} from '../utils/generateTokenAndSetCookie.js'
import {v4 as uuidv4} from 'uuid'
import bcrypt from 'bcryptjs'
import IdVerification from '../models/idVerificationModel.js';
import LiveSession from '../models/liveSessionModel.js';

export const login = catchAsync(async (req, res)=>{
  // const users = [
  //   {
  //     fullName: 'John Doe',
  //     username: 'johndoe',
  //     email: 'john@example.com',
  //     phoneNumber: '08012345678',
  //     country: 'Nigeria',
  //     password: '123456',
  //     role: 'USER',
  //     isPhoneVerified: true,
  //     isDocumentVerified: false
  //   },
  //   {
  //     fullName: 'Jane Admin',
  //     username: 'janeadmin',
  //     email: 'jane@example.com',
  //     phoneNumber: '08023456789',
  //     country: 'Ghana',
  //     password: 'admin123',
  //     role: 'ADMIN',
  //     isPhoneVerified: true,
  //     isDocumentVerified: false
  //   },
  //   {
  //     fullName: 'Michael Super',
  //     username: 'michaelsuper',
  //     email: 'michael@example.com',
  //     phoneNumber: '08034567890',
  //     country: 'Kenya',
  //     password: 'super123',
  //     role: 'SUPER-ADMIN',
  //     isPhoneVerified: true,
  //     isDocumentVerified: false
  //   },
  //   {
  //     fullName: 'Fatima Yusuf',
  //     username: 'fatimay',
  //     email: 'fatima@example.com',
  //     phoneNumber: '08045678901',
  //     country: 'Nigeria',
  //     password: 'fatima123',
  //     role: 'USER',
  //     isPhoneVerified: true,
  //     isDocumentVerified: false
  //   },
  //   {
  //     fullName: 'Emeka Obi',
  //     username: 'emekaobi',
  //     email: 'emeka@example.com',
  //     phoneNumber: '08056789012',
  //     country: 'Nigeria',
  //     password: 'emeka123',
  //     role: 'USER',
  //     isPhoneVerified: true,
  //     isDocumentVerified: false
  //   }
  // ];

  // const salt = await bcrypt.genSalt(10)

  // users.forEach(async(user)=>{
  //   try {
  //     const hashedPassword = await bcrypt.hash(user.password, salt)
  //     const newUser = new User({...user,
  //        referralCode: uuidv4().split('-')[0],
  //       password: hashedPassword})
  //     await newUser.save()
  //     console.log('New user added successfully')
    
  // } catch (error) {
  //   console.log(error)
  // }
  // })
  const { email, password} = req.body

  const user = await User.findOne({email})

  if(!user) return failure(res, 'User not found', 404)

  if(user.role !== 'ADMIN' && user.role !== 'SUPER-ADMIN') return failure(res, 'Only Admins can access this page', 403)

  const isPasswordValid = await bcrypt.compare(password, user.password)
  
  if(!isPasswordValid){
    return failure(res, 'Invalid Password', 400)
  }

  generateTokenAndSetCookie(res, user._id)

  success(res, {...user._doc, password: undefined}, 'Logged In successfully')
})

export const getAllUsers = catchAsync(async(req, res)=>{
  const { search = '', page = 1, limit = 15 } = req.query;
  const currentUserId = req.userId
  const query = {
    _id: { $ne: currentUserId },
    $or: [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  };

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);
  success(res, {users,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)}
  )
})

export const getUserById = catchAsync(async(req, res)=>{
  const {id} = req.params

  const user = await User.findById(id)

  if(!user) return failure(res, 'User not found', 404)

  return success(res, user, 'User fetched Sucessfully')
})

export const suspendUser = catchAsync(async(req, res)=>{
  const {id} = req.params

  const user = await User.findById(id)

  if(!user) return failure(res, 'User not found', 404)

  if(user.role === 'SUPER-ADMIN') return failure(res, 'Cannot modify super-admin role', 400)

  user.isSuspended = !user.isSuspended

  await user.save()

  return success(res, user, 'User suspended Sucessfully')
})

export const updateUserRole = catchAsync(async(req, res)=>{
  const {id} = req.params

  const user = await User.findById(id)

  if(!user) return failure(res, 'User not found', 404)

  if(user.role === 'SUPER-ADMIN') return failure(res, 'Cannot Modify Super Admin Role', 400)

  user.role = user.role === 'USER' ? 'ADMIN' : 'USER'

  await user.save()

  return success(res, user, 'Role modified successfully')
})

export const creditUserBalance = catchAsync(async(req, res)=>{
  const {id} = req.params
  const {amount} = req.body

  const user = await User.findById(id)

  if(!user) return failure(res, 'User not found', 404)

  user.availableBalance += Number(amount)

  await user.save()

  return success(res, user, 'User balance updated Sucessfully')
})

export const getAllIdVerificationRequests = catchAsync(async (req, res) => {
  const request = await IdVerification.find({status: 'pending'}).populate('user', 'fullName email username')
  success(res, request)
})
 
export const getIdVerficationRequest = catchAsync(async (req, res) => {
  const {id} = req.params
  const request = await IdVerification.findOne({_id:id, status: 'pending'})
  if(!request) return failure(res, 'Request not found', 404)
  success(res, request)
});

export const handleIdVerificationRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; 
 
  const request = await IdVerification.findById(id);
  if (!request || request.status !== 'pending') {
    return failure(res, 'Request not found or already handled', 400)
  }
 
  if (action === 'approved') {
    await User.findByIdAndUpdate(request.user, {isDocumentVerified: true});
    request.status = 'approved';
  } else {
    request.status = 'declined';
  }
 
  await request.save();
  return success(res, {}, `Request ${action} successfully`)
});

export const getAllProfileRequests = catchAsync(async (req, res) => {
  const request = await ProfileEditRequest.find({status: 'pending'}).populate('user', 'fullName email username')
  success(res, request)
})

export const getProfileEditRequest = catchAsync(async (req, res) => {
  const {id} = req.params
  const request = await ProfileEditRequest.findOne({_id:id, status: 'pending'}).populate('user', 'fullName username email phoneNumber country')
  if(!request) return failure(res, 'Request not found', 404)
  success(res, request)
});
 
export const handleProfileEditRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; 
 
  const request = await ProfileEditRequest.findById(id);
  if (!request || request.status !== 'pending') {
    return failure(res, 'Request not found or already handled', 400)
  }
 
  if (action === 'approved') {
    await User.findByIdAndUpdate(request.user, request.updates);
    request.status = 'approved';
  } else {
    request.status = 'rejected';
  }
 
  await request.save();
  return success(res, {}, `Request ${action} successfully`)
});
 
export const getDashboardMetrics = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalBuyOrders,
    totalSellOrders,
    pendingBuyOrders,
    pendingSellOrders,
    totalMatchedOrders,
    successfulMatchedOrders,
    activeInvestments,
    totalInvestmentAmount
  ] = await Promise.all([
    User.countDocuments(),
    BuyOrder.countDocuments(),
    SellOrder.countDocuments(),
    BuyOrder.countDocuments({ status: 'pending' }),
    SellOrder.countDocuments({ status: 'pending' }),
    MatchedOrder.countDocuments(),
    MatchedOrder.countDocuments({status: 'completed'}),
    Investment.countDocuments({ roiCredited: false }),
    Investment.aggregate([
      { $match: { roiCredited: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  success(res,
    {
      users: {
        total: totalUsers,
      },
      orders: {
        buy: {
          total: totalBuyOrders,
          pending: pendingBuyOrders
        },
        sell: {
          total: totalSellOrders,
          pending: pendingSellOrders
        },
        matched: {
          total: totalMatchedOrders,
          successful: successfulMatchedOrders,
        }
      },
      investments: {
        active: activeInvestments,
        totalAmount: totalInvestmentAmount[0]?.total || 0
      }
    },
    'Admin Dashboard Analytics Fetched Successfully'
   )
})
 
export const matchBuyersToSeller = catchAsync(async (req, res) => {
  const { id:sellOrderId } = req.params;
  const { matches } = req.body;
 
  const sellerOrder = await SellOrder.findById(sellOrderId).populate('user');
  if (!sellerOrder || !['approved', 'matched'].includes(sellerOrder.status)) {
    return failure(res, 'Sell order not matchable', 400)
  }
 
  const remaining = sellerOrder.remainingAmount ?? sellerOrder.amount;
  const totalToMatch = matches.reduce((sum, m) => sum + m.amount, 0);
 
  if (totalToMatch > remaining) {
    return failure(res, 'Total match amount exceeds remaining amount', 400)
  }
 
  const matchedOrders = [];
 
  for (const match of matches) {
    const buyOrder = await BuyOrder.findById(match.buyOrderId).populate('user');
    if (!buyOrder || buyOrder.status !== 'approved') {
      return failure(res, `Buy order ${match.buyOrderId} not valid`, 400)
    }
 
    buyOrder.status = 'matched';
    buyOrder.matchedTo = sellerOrder._id;
    await buyOrder.save();
 
    const matched = new MatchedOrder({
      seller: sellerOrder.user._id,
      buyer: buyOrder.user._id,
      sellOrder: sellerOrder._id,
      buyOrder: buyOrder._id,
      amount: match.amount
    });
 
    await matched.save();
    matchedOrders.push(matched);
  }

  sellerOrder.remainingAmount = remaining - totalToMatch;
  sellerOrder.status = sellerOrder.remainingAmount === 0 ? 'matched' : 'pending';
  await sellerOrder.save();

  success(res, {
    remainingAmount: sellerOrder.remainingAmount,
    matchedOrders
  }, 'Buyers matched to seller successfully')
})
 
export const unmatchAndReplaceBuyer = catchAsync(async (req, res) => {
  const { matchedOrderId } = req.params;
  const { replaceWith } = req.body;
 
  const match = await MatchedOrder.findById(matchedOrderId);
  if (!match) return failure(res, 'Matched order not found', 404) 
 
  const { sellOrder: sellOrderId, buyOrder: oldBuyOrderId, amount: matchedAmount } = match;
 
  const sellOrder = await SellOrder.findById(sellOrderId);
  const oldBuyOrder = await BuyOrder.findById(oldBuyOrderId);
 
  if (!sellOrder || !oldBuyOrder) {
    return failure(res, 'Linked orders not found', 400)
  }
 
  // Step 1: Reset old buyer's state
  oldBuyOrder.status = 'approved';
  oldBuyOrder.matchedTo = null;
  await oldBuyOrder.save();
 
  // Step 2: Remove match
  await match.deleteOne();
 
  // Step 3: Increase seller's remainingAmount
  sellOrder.remainingAmount = (sellOrder.remainingAmount || 0) + matchedAmount;
  await sellOrder.save();
 
  // Step 4: Replace with new buyer if provided
  if (replaceWith) {
    const newBuyOrder = await BuyOrder.findById(replaceWith.buyOrderId).populate('user');
    if (!newBuyOrder || newBuyOrder.status !== 'approved') {
      return failure(res, 'New buy order is invalid or already matched', 400)
    }
 
    if (replaceWith.amount > sellOrder.remainingAmount) {
      return failure(res, 'Replacement amount exceeds remaining sell amount', 400)
    }
 
    // Create new match
    const newMatch = new MatchedOrder({
      seller: sellOrder.user,
      buyer: newBuyOrder.user,
      sellOrder: sellOrder._id,
      buyOrder: newBuyOrder._id,
      amount: replaceWith.amount,
      status: 'pending'
    });
 
    await newMatch.save();
 
    newBuyOrder.status = 'matched';
    newBuyOrder.matchedTo = sellOrder._id;
    await newBuyOrder.save();
 
    sellOrder.remainingAmount -= replaceWith.amount;
    await sellOrder.save();

    return success(res, {replaced: newMatch,
      remainingAmount: sellOrder.remainingAmount}, 'Match replaced successfully')
  }
 
  return success(res, {remainingAmount: sellOrder.remainingAmount}, 'Buyer unmatched successfully')
})

export const getAllBuyOrders = catchAsync(async (req, res) => {
  const { search = '', page = 1, limit = 15 } = req.query;

  // Build match condition
  const match = {};
  if (search) {
    match.$or = [
      { 'user.fullName': { $regex: search, $options: 'i' } },
      { 'user.email': { $regex: search, $options: 'i' } }
    ];
  }

  // Aggregation with lookup
  const pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) }
  ];

  const orders = await BuyOrder.aggregate(pipeline);

  // Count total for pagination
  const totalCountPipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $match: match },
    { $count: 'total' }
  ];
  const countResult = await BuyOrder.aggregate(totalCountPipeline);
  const total = countResult[0]?.total || 0;

  success(res, {
    orders,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

export const getAllApprovedBuyOrders = catchAsync(async(req,res)=>{
  const { page = 1, limit = 10, search = '', paymentMethod='' } = req.query;

  // Find users matching the search query
  const users = await User.find({
    $or: [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  }).select('_id');

  const userIds = users.map(u => u._id);

  const query = {
    status: 'approved',
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(search ? { user: { $in: userIds } } : {}),
  };

  const total = await BuyOrder.countDocuments(query);

  const orders = await BuyOrder.find(query)
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  success(res, {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  },)
})

export const getBuyOrderById = catchAsync(async(req, res)=>{
  const {id} = req.params

  const buyOrder = await BuyOrder.findById(id)
    .populate('user', 'fullName email')
    .populate({
      path: 'matchedTo',
      populate: {
        path: 'user',
        select: 'fullName email'
      },
    })

  if(!buyOrder) return failure(res, 'Buy order not found', 404)

  success(res, buyOrder)
})

export const handleBuyOrderRequest = catchAsync(async(req, res)=>{
  const {id} = req.params
  const {action} = req.body

  const buyOrder = await BuyOrder.findById(id)

  if(!buyOrder || buyOrder.status !== 'pending') return failure(res, 'Buy Order not found', 404)
  
  buyOrder.status = action

  await buyOrder.save()

  success(res, buyOrder)
})

export const getAllSellOrders = catchAsync(async(req, res)=>{
  const { search = '', page = 1, limit = 15 } = req.query;

  // Build match condition
  const match = {};
  if (search) {
    match.$or = [
      { 'user.fullName': { $regex: search, $options: 'i' } },
      { 'user.email': { $regex: search, $options: 'i' } }
    ];
  }

  // Aggregation with lookup
  const pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) }
  ];

  const orders = await SellOrder.aggregate(pipeline);

  // Count total for pagination
  const totalCountPipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $match: match },
    { $count: 'total' }
  ];
  const countResult = await SellOrder.aggregate(totalCountPipeline);
  const total = countResult[0]?.total || 0;

  success(res, {
    orders,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
})

export const getSellOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const sellOrder = await SellOrder.findById(id).populate('user');

  if (!sellOrder) return failure(res, 'Sell order not found', 404);

  const matchedOrder = await MatchedOrder.find({ sellOrder: id })
    .populate('buyer')
    .populate('buyOrder');

  return success(res, { sellOrder, matchedOrder });
});

export const handleSellOrderRequest = catchAsync(async(req, res)=>{
  const {id} = req.params
  const {action} = req.body

  const sellOrder = await SellOrder.findById(id)

  if(!sellOrder || sellOrder.status !== 'pending') return failure(res, 'Sell Order not found', 404)
  
  sellOrder.status = action

  await sellOrder.save()

  success(res, sellOrder)
})

export const getMatchedOrders = catchAsync(async (req, res) => {
  const { status } = req.query;
 
  const query = status === 'all' ? {} : { status };
  const orders = await MatchedOrder.find(query)
    .populate('buyer', 'fullName')
    .populate('seller', 'fullName')
    .sort({ createdAt: -1 });
 
  success(res, orders);
});

export const deployMatchedOrders = catchAsync(async (req, res) => {
const { matchedOrderIds } = req.body;

  await MatchedOrder.updateMany(
    { _id: { $in: matchedOrderIds }, status: 'pending' },
    { status: 'deployed' }
  );

  success(res, null, 'Orders deployed successfully')
})

export const getAllInvestments = catchAsync(async (req, res) => {
  const { search = '', page = 1, limit = 15, sortBy = 'createdAt', order = 'desc', status } = req.query;

  const skip = (page - 1) * limit;

  const userQuery = search
    ? {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // Find user IDs that match search
  const users = await User.find(userQuery).select('_id');
  const userIds = users.map((u) => u._id);

  // Build investment filter
  const filter = {
    ...(search && { user: { $in: userIds } }),
    ...(status === 'active' && { roiCredited: false }),
    ...(status === 'completed' && { roiCredited: true }),
  };

  const investments = await Investment.find(filter)
    .populate('user', 'fullName email')
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit));

  const total = await Investment.countDocuments(filter);

  return success(res, {
    investments,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
});

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  success(res, {},'Logged out successfully')
};

export const getLiveSessions = catchAsync(async (req, res) => {
  const sessions = await LiveSession.find().sort({ createdAt: -1 });
  success(res, sessions)
})

export const createLiveSession = catchAsync(async (req, res) => {
    const { startTime, durationInMinutes } = req.body;
    
    if (!startTime || !durationInMinutes) {
      return failure(res, 'Start time and duration are required', 400);
    }

    const session = await LiveSession.create({ startTime, durationInMinutes });

    return success(res, session, 'Live session created successfully');
});

export const deleteLiveSession = catchAsync(async (req, res) => {
    const { id } = req.params;
    await LiveSession.findByIdAndDelete(id);
    return success(res, null, 'Live session deleted successfully');
})
