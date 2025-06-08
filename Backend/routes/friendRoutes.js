import express from 'express';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  getUserFriends, 
  declineFriendRequest, 
  removeFriend,
  getPendingFriendRequests
} from '../controllers/friendController.js'; 
import authMiddleware from '../middlewares/authMiddleware.js'; 

const router = express.Router();

router.post('/send', authMiddleware, sendFriendRequest);

router.post('/accept', authMiddleware, acceptFriendRequest);

router.get('/user-friends', authMiddleware, getUserFriends);

router.post('/decline', authMiddleware, declineFriendRequest);

router.delete('/remove', authMiddleware, removeFriend);

router.get('/getPendingFriendRequests', authMiddleware,  getPendingFriendRequests);

export default router;
