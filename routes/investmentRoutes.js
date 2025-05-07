import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { createInvestment, getInvestmentCountdown, getReferralCounts, getRefferralDetails, getUserInvestments, reinvestInvestment } from "../controllers/investmentController.js";

const router = express.Router()

router.post('/create', verifyToken, createInvestment)

router.post('/reinvest', verifyToken, reinvestInvestment)

router.get('/', verifyToken, getUserInvestments)

router.get('/countdown/:investmentId', verifyToken, getInvestmentCountdown)

router.get('/referrals', verifyToken, getRefferralDetails)

router.get('/referral-count', verifyToken, getReferralCounts)

export default router