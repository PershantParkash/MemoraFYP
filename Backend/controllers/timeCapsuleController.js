import TimeCapsule from '../models/TimeCapsule.js'; 
import SharedCapsule from '../models/SharedCapsule.js'
import mongoose from 'mongoose';
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

    const sharedCapsules = await SharedCapsule.find({ Friends: userId }).populate({
      path: 'TimeCapsuleID',
      model: 'TimeCapsule',
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
      return {
        ...capsuleData,
        SharedWith: sharedCapsule.Friends, 
        CreatedBy: sharedCapsule.CreatedBy, 
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
    const media = req.file.filename;

    const timeCapsule = await TimeCapsule.create({
      Title: title,
      Description: description,
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
