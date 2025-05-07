import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { getPendingRequestVerification, requestIdentityVerification, requestProfileEdit } from "../controllers/settingsController.js";

const router = express.Router()

router.post('/profile-edit', verifyToken, requestProfileEdit)

router.post('/verification-request', verifyToken, requestIdentityVerification)

router.get('/pending-verification', verifyToken, getPendingRequestVerification)

export default router