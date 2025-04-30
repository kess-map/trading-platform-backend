import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { requestProfileEdit } from "../controllers/settingsController.js";

const router = express.Router()

router.post('/profile-edit', verifyToken, requestProfileEdit)

export default router