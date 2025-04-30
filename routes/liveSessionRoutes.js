import express from "express";
import { getLiveSessions } from "../controllers/liveSessionController.js";

const router = express.Router()

router.get('/', getLiveSessions)

export default router