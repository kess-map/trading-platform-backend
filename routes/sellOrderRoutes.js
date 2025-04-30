import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { createSellOrder, getPendingSellOrders } from "../controllers/sellOrderController.js";

const router = express.Router()

router.post('/create', verifyToken, createSellOrder)

router.get('/pending', verifyToken, getPendingSellOrders)

export default router