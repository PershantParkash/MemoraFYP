import TimeCapsule from '../models/TimeCapsule.js'; 
import SharedCapsule from '../models/SharedCapsule.js'
import NestedCapsule from '../models/NestedCapsule.js';
import mongoose from 'mongoose';
import { Profile } from '../models/Profile.js';

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

    // Get nested capsules for all personal capsules
    const personalCapsuleIds = updatedPersonalCapsules.map(capsule => capsule._id);
    const nestedCapsules = await NestedCapsule.find({ 
      ParentCapsuleId: { $in: personalCapsuleIds },
      UserID: userId 
    });

    // Group nested capsules by parent capsule
    const nestedCapsulesByParent = {};
    nestedCapsules.forEach(nestedCapsule => {
      const parentId = nestedCapsule.ParentCapsuleId.toString();
      if (!nestedCapsulesByParent[parentId]) {
        nestedCapsulesByParent[parentId] = [];
      }
      
      // Check if parent capsule is unlocked to determine nested capsule status
      const parentCapsule = updatedPersonalCapsules.find(capsule => capsule._id.toString() === parentId);
      const nestedCapsuleData = { ...nestedCapsule._doc };
      if (parentCapsule && new Date(parentCapsule.UnlockDate) < currentDate) {
        nestedCapsuleData.Status = 'Open';
      }
      
      nestedCapsulesByParent[parentId].push(nestedCapsuleData);
    });

    // Add nested capsules to personal capsules
    const personalCapsulesWithNested = updatedPersonalCapsules.map(capsule => ({
      ...capsule,
      IsShared: false,
      NestedCapsules: nestedCapsulesByParent[capsule._id.toString()] || []
    }));

    const allCapsules = [
      ...personalCapsulesWithNested,
      ...sharedCapsuleDetails.map(capsule => ({ ...capsule, IsShared: true, NestedCapsules: [] })),
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
    const { title, description, unlockDate, capsuleType, friends, lat, lng } = req.body;
    const userId = req.userId;
    
    console.log('Received request:', {
      body: req.body,
      files: req.files ? req.files.map(f => ({ name: f.originalname, mimetype: f.mimetype })) : 'No files',
      file: req.file ? { name: req.file.originalname, mimetype: req.file.mimetype } : 'No single file'
    });

    // Handle file uploads
    let media = null;
    let finalDescription = description;

    if (req.files && req.files.length > 0) {
      console.log('Processing multiple files:', req.files.length);
      
      const imageFile = req.files.find(file => file.mimetype.startsWith('image/'));
      const audioFile = req.files.find(file => file.mimetype.startsWith('audio/'));

      console.log('Found files:', {
        imageFile: imageFile ? { name: imageFile.originalname, mimetype: imageFile.mimetype } : null,
        audioFile: audioFile ? { name: audioFile.originalname, mimetype: audioFile.mimetype } : null
      });

      if (imageFile) {
        media = imageFile.filename;
        console.log('Image file saved as:', media);
      }

      if (audioFile && description && description.startsWith('file://')) {
        finalDescription = audioFile.filename;
        console.log('Audio file saved as description:', finalDescription);
      }
    } else if (req.file) {
      media = req.file.filename;
      console.log('Single file saved as:', media);
    } else {
      console.log('No files found in request');
    }

    // ✅ Create new capsule with location
    const timeCapsule = await TimeCapsule.create({
      Title: title,
      Description: finalDescription,
      UnlockDate: unlockDate,
      CapsuleType: capsuleType,
      Status: 'Locked',
      UserID: userId,
      Media: media,
      Lat: lat,   // 📍 Save latitude
      Lng: lng,   // 📍 Save longitude
    });

    // ✅ If capsule is shared → save in SharedCapsule collection
    if (capsuleType === 'Shared' && friends) {
      const parsedFriends = typeof friends === 'string' ? JSON.parse(friends) : friends;
      const friendsObjectIdArray = parsedFriends.map(friend => new mongoose.Types.ObjectId(friend));

      if (friendsObjectIdArray.length > 0) {
        await SharedCapsule.create({
          TimeCapsuleID: timeCapsule._id,
          CreatedBy: userId,
          Friends: friendsObjectIdArray,
        });
      }
    }

    // ✅ Send back capsule including location
    res.status(201).json({
      success: true,
      message: 'Time Capsule created successfully',
      capsule: timeCapsule,
    });

  } catch (error) {
    console.error("Error creating time capsule:", error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the Time Capsule',
      error: error.message,
    });
  }
};


