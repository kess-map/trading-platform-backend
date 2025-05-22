import express from "express";
import { creditUserBalance, getLiveSessions, deployMatchedOrders, getAllApprovedBuyOrders, getAllBuyOrders, getAllIdVerificationRequests, getAllInvestments, getAllProfileRequests, getAllSellOrders, getAllUsers, getBuyOrderById, getDashboardMetrics, getIdVerficationRequest, getMatchedOrders, getProfileEditRequest, getSellOrderById, getUserById, handleBuyOrderRequest, handleIdVerificationRequest, handleProfileEditRequest, handleSellOrderRequest, login, logout, matchBuyersToSeller, suspendUser, updateUserRole, createLiveSession, deleteLiveSession, checkAuth } from "../controllers/adminController.js";
import {verifyToken} from '../middleware/verifyToken.js'
import {isAdmin} from '../middleware/isAdmin.js'
import { isSuperAdmin } from "../middleware/isSuperAdmin.js";

const router = express.Router()

router.post('/login', login)

router.get('/check-auth', verifyToken, isAdmin, checkAuth)

router.get('/', verifyToken, isAdmin, getDashboardMetrics)

router.get('/users', verifyToken, isAdmin, getAllUsers)

router.get('/user/:id', verifyToken, isAdmin, getUserById)

router.get('/profile-requests', verifyToken, isAdmin, getAllProfileRequests)

router.get('/profile-request/:id', verifyToken, isAdmin, getProfileEditRequest)

router.post('/profile-request/:id', verifyToken, isAdmin, handleProfileEditRequest)

router.get('/id-verification', verifyToken, isAdmin, getAllIdVerificationRequests)

router.get('/id-verification/:id', verifyToken, isAdmin, getIdVerficationRequest)

router.post('/id-verification/:id', verifyToken, isAdmin, handleIdVerificationRequest)

router.post('/user/top-up/:id', verifyToken, isSuperAdmin, creditUserBalance)

router.post('/user/suspend/:id', verifyToken, isAdmin, suspendUser)

router.post('/user/role/:id', verifyToken, isSuperAdmin, updateUserRole)

router.get('/buy-orders', verifyToken, isAdmin, getAllBuyOrders)

router.get('/buy-orders/approved', verifyToken, isAdmin, getAllApprovedBuyOrders)

router.get('/buy-orders/:id', verifyToken, isAdmin, getBuyOrderById)

router.post('/buy-orders/:id/status', verifyToken, isAdmin, handleBuyOrderRequest)

router.get('/sell-orders', verifyToken, isAdmin, getAllSellOrders)

router.get('/sell-orders/:id', verifyToken, isAdmin, getSellOrderById )

router.post('/sell-orders/:id/status', verifyToken, isAdmin, handleSellOrderRequest)

router.post('/match-buy-orders/:id', verifyToken, isAdmin, matchBuyersToSeller)

router.get('/matched-orders', verifyToken, isAdmin, getMatchedOrders)

router.post('/matched-orders/deploy', verifyToken, isAdmin, deployMatchedOrders)

router.get('/investments', verifyToken, isAdmin, getAllInvestments)

router.get('/livesessions', verifyToken, isAdmin, getLiveSessions)

router.post('/livesessions/create', verifyToken, isAdmin, createLiveSession)

router.delete('/livesessions/:id', verifyToken, isAdmin, deleteLiveSession)

router.post('/logout', verifyToken, isAdmin, logout)


export default router