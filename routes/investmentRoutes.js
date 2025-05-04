import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { createInvestment, getInvestmentCountdown, getUserInvestments } from "../controllers/investmentController.js";

const router = express.Router()

router.post('/create', verifyToken, createInvestment)

router.get('/', verifyToken, getUserInvestments)

router.get('/countdown/investmentId', verifyToken, getInvestmentCountdown)

export default router