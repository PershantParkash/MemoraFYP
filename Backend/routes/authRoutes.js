import { Router } from 'express';
import { register, login,getAllUsers } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js'; 

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/getAllUsers',authMiddleware, getAllUsers);

export default router;
