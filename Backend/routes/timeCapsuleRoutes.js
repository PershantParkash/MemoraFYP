import express from 'express';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/fileUploadMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {createTimeCapsule, getCapsules} from '../controllers/timeCapsuleController.js'

const router = express.Router();


router.post('/create',authMiddleware,  uploadMultipleFiles, createTimeCapsule); 

router.get('/getLoginUserCapsules',authMiddleware,  uploadSingleFile, getCapsules); 

export default router;
