import TimeCapsule from '../models/TimeCapsule.js'; 
import SharedCapsule from '../models/SharedCapsule.js'
import mongoose from 'mongoose';
import { Profile } from '../models/Profile.js';
// export const createTimeCapsule = async (req, res) => {
//   try {
//     const { title, description, unlockDate, capsuleType, friends } = req.body;
//     const userId = req.userId;
//     const media = req.file.filename

//     const parsedFriends = Array.isArray(friends) ? friends : JSON.parse(friends);
//     const friendsObjectIdArray = parsedFriends.map(friend => mongoose.Types.ObjectId(friend));

//     const timeCapsule = await TimeCapsule.create({
//       Title: title,
//       Description: description,
//       UnlockDate: unlockDate,
//       CapsuleType: capsuleType,
//       Status: 'Locked',
//       UserID: userId,
//       Media: media,
//     });

//     if (capsuleType === 'Shared' && friends && friends.length > 0) {
//         await SharedCapsule.create({
//           TimeCapsuleID: timeCapsule._id,
//           CreatedBy: userId,
//           Friends: parsedFriends,  
//         });
//       }

//     res.status(201).json({
//       success: true,
//       message: 'Time Capsule created successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'An error occurred while creating the Time Capsule',
//       error: error.message,
//     });
//   }
// };


export const getCapsules = async (req, res) => {
  try {
    const userId = req.userId; 
    const personalCapsules = await TimeCapsule.find({ UserID: userId });

    const sharedCapsules = await SharedCapsule.find({ Friends: userId })
      .populate({
        path: 'TimeCapsuleID',
        model: 'TimeCapsule',
      })
      .populate({
        path: 'CreatedBy',
        model: 'User',
      });

    // Get profile information for all creators
    const creatorIds = [...new Set(sharedCapsules.map(sc => sc.CreatedBy._id))];
    const creatorProfiles = await Profile.find({ userId: { $in: creatorIds } });
    
    // Create a map for quick lookup
    const profileMap = {};
    creatorProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    const currentDate = new Date();

    const updateStatus = capsule => {
      const capsuleData = { ...capsule._doc };
      if (new Date(capsule.UnlockDate) < currentDate) {
        capsuleData.Status = 'Open'; 
      }
      return capsuleData;
    };

    const updatedPersonalCapsules = personalCapsules.map(updateStatus);

    const sharedCapsuleDetails = sharedCapsules.map(sharedCapsule => {
      const capsuleData = updateStatus(sharedCapsule.TimeCapsuleID);
      const creatorProfile = profileMap[sharedCapsule.CreatedBy._id.toString()];
      
      return {
        ...capsuleData,
        SharedWith: sharedCapsule.Friends, 
        CreatedBy: sharedCapsule.CreatedBy, 
        CreatorProfile: creatorProfile || null, // This will contain the profile info
      };
    });

    const allCapsules = [
      ...updatedPersonalCapsules.map(capsule => ({ ...capsule, IsShared: false })),
      ...sharedCapsuleDetails.map(capsule => ({ ...capsule, IsShared: true })),
    ];

    res.status(200).json({
      success: true,
      capsules: allCapsules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the capsules',
      error: error.message,
    });
  }
};
export const createTimeCapsule = async (req, res) => {
  try {
    const { title, description, unlockDate, capsuleType, friends } = req.body;
    const userId = req.userId;
    
    console.log('Received request:', {
      body: req.body,
      files: req.files ? req.files.map(f => ({ name: f.originalname, mimetype: f.mimetype })) : 'No files',
      file: req.file ? { name: req.file.originalname, mimetype: req.file.mimetype } : 'No single file'
    });
    
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

    console.log('Creating time capsule with:', {
      Title: title,
      Description: finalDescription,
      UnlockDate: unlockDate,
      CapsuleType: capsuleType,
      Media: media,
      UserID: userId
    });

    const timeCapsule = await TimeCapsule.create({
      Title: title,
      Description: finalDescription,
      UnlockDate: unlockDate,
      CapsuleType: capsuleType,
      Status: 'Locked',
      UserID: userId,
      Media: media,
    });

    if (capsuleType === 'Shared' && friends) {
      // Ensure 'friends' is parsed correctly
      const parsedFriends = typeof friends === 'string' ? JSON.parse(friends) : friends;
      const friendsObjectIdArray = parsedFriends.map(friend => new mongoose.Types.ObjectId(friend));

      if (friendsObjectIdArray.length > 0) {
        await SharedCapsule.create({
          TimeCapsuleID: timeCapsule._id,
          CreatedBy: userId,
          Friends: friendsObjectIdArray, // Ensure ObjectIds are saved
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Time Capsule created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the Time Capsule',
      error: error.message,
    });
  }
};


