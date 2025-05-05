import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { cancelBuyOrder, createBuyOrder, getBuyAndSellOrders, getPendingBuyOrders } from "../controllers/buyOrderController.js";

const router = express.Router()

router.post('/create', verifyToken, createBuyOrder)

router.get('/pending', verifyToken, getPendingBuyOrders)

router.get('/all', verifyToken, getBuyAndSellOrders)

router.put('/cancel/:id', verifyToken, cancelBuyOrder)

export default router