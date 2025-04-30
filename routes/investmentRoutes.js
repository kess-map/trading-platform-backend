import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { createInvestment } from "../controllers/investmentController.js";

const router = express.Router()

router.post('/create', verifyToken, createInvestment)

export default router