import express from 'express';
import {verifyToken} from '../middleware/verifyToken.js'
import {isAdmin} from '../middleware/isAdmin.js'
import {
  createAppeal,
  getAllAppeals,
  getAppealById,
  updateAppealStatus,
} from '../controllers/appealController.js';

const router = express.Router();

router.post('/', verifyToken, createAppeal);
router.get('/', verifyToken, isAdmin, getAllAppeals);
router.get('/:id', verifyToken, isAdmin, getAppealById);
router.put('/:id', verifyToken, isAdmin, updateAppealStatus);

export default router;
