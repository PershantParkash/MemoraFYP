import express from 'express';
import { createProfile, updateProfile, getProfile, deleteProfile, getAllProfilesExceptCurrentUser, getProfileByID } from '../controllers/profileController.js';
const router = express.Router();
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/fileUploadMiddleware.js';

// 
router.post('/createProfile', authMiddleware,  uploadSingleFile, createProfile );
router.put('/updateProfile', authMiddleware, uploadSingleFile, updateProfile);
router.get('/getProfile', authMiddleware, getProfile);
router.delete('/deleteProfile', authMiddleware, deleteProfile);
router.get('/getAllProfiles', authMiddleware, getAllProfilesExceptCurrentUser);
router.get('/getProfileByID/:UserID', authMiddleware, getProfileByID);

export default router;
