import express from 'express';
import multer from 'multer';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/fileUploadMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {createTimeCapsule, getCapsules} from '../controllers/timeCapsuleController.js'
const upload = multer();
const router = express.Router();


router.post('/create',authMiddleware,  uploadSingleFile, createTimeCapsule); 

router.get('/getLoginUserCapsules',authMiddleware,  uploadSingleFile, getCapsules); 

export default router;
