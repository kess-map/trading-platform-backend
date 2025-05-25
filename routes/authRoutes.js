import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import {checkAuth, login, logout, resendPhoneOtp, signup, verifyPhoneOtp} from '../controllers/authController.js'

const router = express.Router()

router.post('/signup', signup)

router.post('/login', login)

router.post('/logout', logout)

router.post('/resend-otp', resendPhoneOtp)

router.post('/verify-otp', verifyPhoneOtp)

router.get('/check-auth', verifyToken, checkAuth)

export default router