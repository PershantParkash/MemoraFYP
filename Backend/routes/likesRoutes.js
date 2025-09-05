// routes/likesRoutes.js
import express from 'express';
import { toggleLike, getLikes } from '../controllers/likesController.js';
import authMiddleware from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Toggle like for a time capsule
router.post('/toggle/:timeCapsuleId', authMiddleware, toggleLike);

// Get likes for a time capsule
router.get('/:timeCapsuleId', authMiddleware, getLikes);

export default router;
