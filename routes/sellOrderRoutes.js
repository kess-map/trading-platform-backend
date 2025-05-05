import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { cancelSellOrder, createSellOrder, getPendingSellOrders } from "../controllers/sellOrderController.js";

const router = express.Router()

router.post('/create', verifyToken, createSellOrder)

router.get('/pending', verifyToken, getPendingSellOrders)

router.put('/cancel/:id', verifyToken, cancelSellOrder)

export default router