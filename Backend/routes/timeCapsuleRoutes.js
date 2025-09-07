import express from 'express';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/fileUploadMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {createTimeCapsule, getCapsules, getPublicCapsules, updateAllCapsulesStatus} from '../controllers/timeCapsuleController.js'

const router = express.Router();


router.post('/create',authMiddleware,  uploadMultipleFiles, createTimeCapsule); 

router.get('/getLoginUserCapsules',authMiddleware,  uploadSingleFile, getCapsules); 

router.get('/getPublicCapsule', authMiddleware, getPublicCapsules)

router.post('/admin/update-all-statuses', updateAllCapsulesStatus);

export default router;
