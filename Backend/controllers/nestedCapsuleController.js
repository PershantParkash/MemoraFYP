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

// export const createNestedCapsule = async (req, res) => {
//   try {
//     console.log('=== NESTED CAPSULE CREATION REQUEST START ===');
    
//     // Log all request details
//     console.log('Headers:', req.headers);
//     console.log('Body fields:', req.body);
//     console.log('Files array:', req.files ? req.files.map(f => ({ 
//       fieldname: f.fieldname,
//       originalname: f.originalname, 
//       mimetype: f.mimetype,
//       size: f.size,
//       filename: f.filename 
//     })) : 'No files array');
//     console.log('Single file:', req.file ? { 
//       fieldname: req.file.fieldname,
//       originalname: req.file.originalname, 
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//       filename: req.file.filename 
//     } : 'No single file');
//     console.log('User ID from middleware:', req.userId);
    
//     // Extract and validate required fields
//     const { title, description, capsuleType, parentCapsuleId, mediaType } = req.body;
//     const userId = req.userId;
    
//     console.log('Extracted fields:', {
//       title: title || 'MISSING',
//       description: description || 'EMPTY',
//       capsuleType: capsuleType || 'MISSING',
//       parentCapsuleId: parentCapsuleId || 'MISSING',
//       mediaType: mediaType || 'NOT PROVIDED',
//       userId: userId || 'MISSING FROM MIDDLEWARE'
//     });
    
//     // Validate required fields
//     const validationErrors = [];
//     if (!title) validationErrors.push('title is required');
//     if (!capsuleType) validationErrors.push('capsuleType is required');
//     if (!parentCapsuleId) validationErrors.push('parentCapsuleId is required');
//     if (!userId) validationErrors.push('userId is missing (authentication issue)');
    
//     if (validationErrors.length > 0) {
//       console.log('Validation failed:', validationErrors);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: validationErrors,
//         receivedData: {
//           title: !!title,
//           capsuleType: !!capsuleType,
//           parentCapsuleId: !!parentCapsuleId,
//           userId: !!userId,
//           hasFiles: !!(req.files && req.files.length > 0),
//           hasFile: !!req.file
//         }
//       });
//     }
    
//     // Validate parentCapsuleId format
//     if (parentCapsuleId.length !== 24) {
//       console.log('Invalid parentCapsuleId format:', parentCapsuleId);
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid parentCapsuleId format',
//         details: {
//           received: parentCapsuleId,
//           expectedLength: 24,
//           actualLength: parentCapsuleId.length
//         }
//       });
//     }
    
//     console.log('Looking for parent capsule with:', {
//       _id: parentCapsuleId,
//       UserID: userId
//     });
    
//     // Validate parent capsule exists and belongs to user
//     const parentCapsule = await TimeCapsule.findOne({ 
//       _id: parentCapsuleId, 
//       UserID: userId 
//     });
    
//     if (!parentCapsule) {
//       console.log('Parent capsule not found. Searching for any capsule with this ID...');
//       const anyParentCapsule = await TimeCapsule.findOne({ _id: parentCapsuleId });
      
//       if (!anyParentCapsule) {
//         console.log('No capsule found with ID:', parentCapsuleId);
//         return res.status(404).json({
//           success: false,
//           message: 'Parent capsule does not exist',
//           details: {
//             searchedId: parentCapsuleId,
//             userId: userId
//           }
//         });
//       } else {
//         console.log('Capsule exists but belongs to different user:', {
//           capsuleUserId: anyParentCapsule.UserID,
//           requestUserId: userId
//         });
//         return res.status(403).json({
//           success: false,
//           message: 'Parent capsule belongs to different user',
//           details: {
//             capsuleUserId: anyParentCapsule.UserID.toString(),
//             requestUserId: userId.toString()
//           }
//         });
//       }
//     }
    
//     console.log('Parent capsule found:', {
//       id: parentCapsule._id,
//       title: parentCapsule.Title,
//       userId: parentCapsule.UserID
//     });
    
//     // Handle file uploads
//     let media = null;
//     let finalDescription = description || '';
    
//     if (req.files && req.files.length > 0) {
//       console.log('Processing multiple files:', req.files.length);
      
//       // Find the image file (first file is typically the image)
//       const imageFile = req.files.find(file => 
//         file.mimetype.startsWith('image/')
//       );
      
//       // Find the audio file (if any)
//       const audioFile = req.files.find(file => 
//         file.mimetype.startsWith('audio/')
//       );
      
//       console.log('Found files:', {
//         imageFile: imageFile ? { name: imageFile.originalname, mimetype: imageFile.mimetype } : null,
//         audioFile: audioFile ? { name: audioFile.originalname, mimetype: audioFile.mimetype } : null
//       });
      
//       if (imageFile) {
//         media = imageFile.filename;
//         console.log('Image file saved as:', media);
//       }
      
//       // If we have an audio file and the description is a local file path, 
//       // replace it with the uploaded audio filename
//       if (audioFile && description && description.startsWith('file://')) {
//         finalDescription = audioFile.filename;
//         console.log('Audio file saved as description:', finalDescription);
//       }
//     } else if (req.file) {
//       // Fallback for single file upload
//       media = req.file.filename;
//       console.log('Single file saved as:', media);
//     } else {
//       console.log('No files found in request - this might be the issue');
//       return res.status(400).json({
//         success: false,
//         message: 'No file provided',
//         details: {
//           hasFiles: !!(req.files && req.files.length > 0),
//           hasFile: !!req.file,
//           filesArray: req.files || 'undefined',
//           singleFile: req.file || 'undefined'
//         }
//       });
//     }
    
//     const nestedCapsuleData = {
//       Title: title,
//       Description: finalDescription,
//       CapsuleType: capsuleType,
//       Status: 'Locked',
//       UserID: userId,
//       Media: media,
//       ParentCapsuleId: parentCapsuleId,
//     };
    
//     console.log('Creating nested capsule with data:', nestedCapsuleData);
    
//     const nestedCapsule = await NestedCapsule.create(nestedCapsuleData);
    
//     console.log('Nested capsule created successfully:', {
//       id: nestedCapsule._id,
//       title: nestedCapsule.Title
//     });
    
//     console.log('=== NESTED CAPSULE CREATION SUCCESS ===');
    
//     res.status(201).json({
//       success: true,
//       message: 'Nested Capsule created successfully',
//       data: nestedCapsule,
//       debug: {
//         receivedFiles: req.files ? req.files.length : 0,
//         mediaSet: !!media,
//         parentCapsuleFound: true
//       }
//     });
    
//   } catch (error) {
//     console.error('=== NESTED CAPSULE CREATION ERROR ===');
//     console.error('Error type:', error.constructor.name);
//     console.error('Error message:', error.message);
//     console.error('Error stack:', error.stack);
    
//     // Handle specific MongoDB errors
//     if (error.name === 'ValidationError') {
//       console.error('Mongoose validation error:', error.errors);
//       return res.status(400).json({
//         success: false,
//         message: 'Database validation failed',
//         error: error.message,
//         validationErrors: Object.keys(error.errors).map(key => ({
//           field: key,
//           message: error.errors[key].message
//         }))
//       });
//     }
    
//     if (error.name === 'CastError') {
//       console.error('Mongoose cast error:', error);
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid data format',
//         error: error.message,
//         details: {
//           path: error.path,
//           value: error.value,
//           kind: error.kind
//         }
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'An error occurred while creating the Nested Capsule',
//       error: error.message,
//       errorType: error.constructor.name,
//       debug: {
//         hasReqBody: !!req.body,
//         hasReqFiles: !!(req.files && req.files.length > 0),
//         hasReqFile: !!req.file,
//         hasUserId: !!req.userId
//       }
//     });}}

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