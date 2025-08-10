import express from 'express';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/fileUploadMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createNestedCapsule, getNestedCapsules, getAllNestedCapsules } from '../controllers/nestedCapsuleController.js';

const router = express.Router();

// Create a nested capsule
router.post('/create', authMiddleware, uploadMultipleFiles, createNestedCapsule);

// Get nested capsules for a specific parent capsule
router.get('/parent/:parentCapsuleId', authMiddleware, getNestedCapsules);

// Get all nested capsules for the current user
router.get('/all', authMiddleware, getAllNestedCapsules);

export default router; 