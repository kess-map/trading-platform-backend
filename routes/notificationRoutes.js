import express from "express";
import {verifyToken} from '../middleware/verifyToken.js'
import { getAllNotifications } from "../controllers/notificationsController.js";

const router = express.Router()

router.get('/', verifyToken, getAllNotifications)

export default router