import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { cancelBuyOrder, confirmOrderPayment, createBuyOrder, getBuyAndSellOrders, getPendingBuyOrders, payForOrder } from "../controllers/buyOrderController.js";

const router = express.Router()

router.post('/create', verifyToken, createBuyOrder)

router.get('/pending', verifyToken, getPendingBuyOrders)

router.get('/all', verifyToken, getBuyAndSellOrders)

router.put('/cancel/:id', verifyToken, cancelBuyOrder)

router.post('/pay/:id', verifyToken, payForOrder)

router.post('/confirm/:id', verifyToken, confirmOrderPayment)

export default router