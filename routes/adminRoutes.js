import express from "express";
import { creditUserBalance, deployMatchedOrders, getAllApprovedBuyOrders, getAllBuyOrders, getAllInvestments, getAllSellOrders, getAllUsers, getBuyOrderById, getDashboardMetrics, getIdVerficationRequest, getMatchedOrders, getProfileEditRequest, getSellOrderById, getUserById, handleBuyOrderRequest, handleProfileEditRequest, handleSellOrderRequest, login, logout, matchBuyersToSeller, suspendUser, updateUserRole } from "../controllers/adminController.js";
import {verifyToken} from '../middleware/verifyToken.js'
import {isAdmin} from '../middleware/isAdmin.js'
import { isSuperAdmin } from "../middleware/isSuperAdmin.js";

const router = express.Router()

router.post('/login', login)

router.get('/', verifyToken, isAdmin, getDashboardMetrics)

router.get('/users', verifyToken, isAdmin, getAllUsers)

router.get('/user/:id', verifyToken, isAdmin, getUserById)

router.get('/user/profile-request/:id', verifyToken, isAdmin, getProfileEditRequest)

router.post('/user/profile-request/:id', verifyToken, isAdmin, handleProfileEditRequest)

router.get('/user/id-verification/:id', verifyToken, isAdmin, getIdVerficationRequest)

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

router.post('/logout', verifyToken, isAdmin, logout)


export default router