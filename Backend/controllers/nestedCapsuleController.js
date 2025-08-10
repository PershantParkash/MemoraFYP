import NestedCapsule from '../models/NestedCapsule.js';
import TimeCapsule from '../models/TimeCapsule.js';
import mongoose from 'mongoose';

export const createNestedCapsule = async (req, res) => {
  try {
    const { title, description, capsuleType, parentCapsuleId } = req.body;
    const userId = req.userId;
    
    console.log('Received nested capsule request:', {
      body: req.body,
      files: req.files ? req.files.map(f => ({ name: f.originalname, mimetype: f.mimetype })) : 'No files',
      file: req.file ? { name: req.file.originalname, mimetype: req.file.mimetype } : 'No single file',
      userId,
    });
    
    // Validate parent capsule exists and belongs to user
    const parentCapsule = await TimeCapsule.findOne({ 
      _id: parentCapsuleId, 
      UserID: userId 
    });
    
    if (!parentCapsule) {
      return res.status(404).json({
        success: false,
        message: 'Parent capsule not found or you do not have permission to access it'
      });
    }
    
    // Handle multiple files upload
    let media = null;
    let finalDescription = description;
    
    if (req.files && req.files.length > 0) {
      console.log('Processing multiple files:', req.files.length);
      
      // Find the image file (first file is typically the image)
      const imageFile = req.files.find(file => 
        file.mimetype.startsWith('image/')
      );
      
      // Find the audio file (if any)
      const audioFile = req.files.find(file => 
        file.mimetype.startsWith('audio/')
      );
      
      console.log('Found files:', {
        imageFile: imageFile ? { name: imageFile.originalname, mimetype: imageFile.mimetype } : null,
        audioFile: audioFile ? { name: audioFile.originalname, mimetype: audioFile.mimetype } : null
      });
      
      if (imageFile) {
        media = imageFile.filename;
        console.log('Image file saved as:', media);
      }
      
      // If we have an audio file and the description is a local file path, 
      // replace it with the uploaded audio filename
      if (audioFile && description && description.startsWith('file://')) {
        finalDescription = audioFile.filename;
        console.log('Audio file saved as description:', finalDescription);
      }
    } else if (req.file) {
      // Fallback for single file upload
      media = req.file.filename;
      console.log('Single file saved as:', media);
    } else {
      console.log('No files found in request');
    }
console.log("types", typeof parentCapsuleId, parentCapsuleId);
    console.log('Creating nested capsule with:', {
      Title: title,
      Description: finalDescription,
      CapsuleType: capsuleType,
      Media: media,
      UserID: userId,
      ParentCapsuleId: parentCapsuleId
    });
    

    const nestedCapsule = await NestedCapsule.create({
      Title: title,
      Description: finalDescription,
      CapsuleType: capsuleType,
      Status: 'Locked',
      UserID: userId,
      Media: media,
      ParentCapsuleId: parentCapsuleId,
    });
     console.log('Creating nested capsule with 2:', {
      Title: title,
      Description: finalDescription,
      CapsuleType: capsuleType,
      Media: media,
      UserID: userId,
      ParentCapsuleId: parentCapsuleId
    });

    res.status(201).json({
      success: true,
      message: 'Nested Capsule created successfully',
      data: nestedCapsule
    });
  } catch (error) {
    console.error('Error creating nested capsule:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the Nested Capsule',
      error: error.message,
    });
  }
};

export const getNestedCapsules = async (req, res) => {
  try {
    const userId = req.userId;
    const { parentCapsuleId } = req.params;

    // Validate parent capsule exists and belongs to user
    const parentCapsule = await TimeCapsule.findOne({ 
      _id: parentCapsuleId, 
      UserID: userId 
    });
    
    if (!parentCapsule) {
      return res.status(404).json({
        success: false,
        message: 'Parent capsule not found or you do not have permission to access it'
      });
    }

    const nestedCapsules = await NestedCapsule.find({ 
      ParentCapsuleId: parentCapsuleId,
      UserID: userId 
    });

    const currentDate = new Date();

    const updatedNestedCapsules = nestedCapsules.map(capsule => {
      const capsuleData = { ...capsule._doc };
      // Check if parent capsule is unlocked
      if (new Date(parentCapsule.UnlockDate) < currentDate) {
        capsuleData.Status = 'Open';
      }
      return capsuleData;
    });

    res.status(200).json({
      success: true,
      data: updatedNestedCapsules
    });
  } catch (error) {
    console.error('Error fetching nested capsules:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching nested capsules',
      error: error.message,
    });
  }
};

export const getAllNestedCapsules = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all parent capsules for the user
    const parentCapsules = await TimeCapsule.find({ UserID: userId });
    const parentCapsuleIds = parentCapsules.map(capsule => capsule._id);

    // Get all nested capsules for these parent capsules
    const nestedCapsules = await NestedCapsule.find({ 
      ParentCapsuleId: { $in: parentCapsuleIds },
      UserID: userId 
    }).populate('ParentCapsuleId');

    const currentDate = new Date();

    const updatedNestedCapsules = nestedCapsules.map(capsule => {
      const capsuleData = { ...capsule._doc };
      // Check if parent capsule is unlocked
      if (new Date(capsule.ParentCapsuleId.UnlockDate) < currentDate) {
        capsuleData.Status = 'Open';
      }
      return capsuleData;
    });

    res.status(200).json({
      success: true,
      data: updatedNestedCapsules
    });
  } catch (error) {
    console.error('Error fetching all nested capsules:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching nested capsules',
      error: error.message,
    });
  }
}; 