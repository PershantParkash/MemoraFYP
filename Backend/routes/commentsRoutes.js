import express from 'express';
import { 
  addComment, 
  getComments, 
  updateComment, 
  deleteComment 
} from '../controllers/commentsController.js';
import authMiddleware from '../middlewares/authMiddleware.js'; 

const router = express.Router();

router.post('/:timeCapsuleId', authMiddleware, addComment);

router.get('/:timeCapsuleId', authMiddleware, getComments);

router.put('/:commentId', authMiddleware, updateComment);

router.delete('/:commentId', authMiddleware, deleteComment);

export default router;
