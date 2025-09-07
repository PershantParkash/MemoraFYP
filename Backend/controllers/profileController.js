import { Profile } from '../models/Profile.js';
import { Friendship } from '../models/friendshipModel.js';
import TimeCapsule from '../models/TimeCapsule.js'; 
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import NestedCapsule from '../models/NestedCapsule.js';

export const createProfile = async (req, res) => {
  const { bio, username, cnic, contactNo, dob, gender, address } = req.body;
  const userId = req.userId;
  const profilePicture = req.file.filename
  try {
    const existingProfile = await Profile.findOne({ userId });

    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }
    const profile = new Profile({ userId, bio, profilePicture, username, cnic, contactNo, dob, gender, address });
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error in createProfile:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.userId;

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const deleteProfile = async (req, res) => {
  const userId = req.userId;
  try {
    const profile = await Profile.findOneAndDelete({ userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProfile:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
export const getProfileByID = async (req, res) => {
  const userId = req.params.UserID;
  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const getAllProfilesExceptCurrentUser = async (req, res) => {
  const userId = req.userId;

  try {
    // Step 1: Fetch all friendships of the logged-in user
    const friendships = await Friendship.find({
      $or: [
        { user_id: userId },
        { friend_user_id: userId }
      ]
    });

    // Step 2: Create a list of user IDs to exclude
    const excludedUserIds = friendships.map(friendship => {
      return friendship.user_id.toString() === userId
        ? friendship.friend_user_id.toString()
        : friendship.user_id.toString();
    });

    // Add the logged-in user's ID to the excluded list
    excludedUserIds.push(userId);

    // Step 3: Fetch all profiles excluding the logged-in user and friends/requests
    const profiles = await Profile.find({
      userId: { $nin: excludedUserIds } // Exclude these user IDs
    });

    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error in getAllProfilesExceptCurrentUser:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const updateProfile = async (req, res) => {
  const { bio, username, cnic, contactNo, dob, gender, address } = req.body;
  const userId = req.userId;
  const profilePicture = req.file ? req.file.filename : undefined; // Check if file exists

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (bio !== undefined) profile.bio = bio;
    if (profilePicture !== undefined) profile.profilePicture = profilePicture; // Update only if a file is uploaded
    if (username !== undefined) profile.username = username;
    if (cnic !== undefined) profile.cnic = cnic;
    if (contactNo !== undefined) profile.contactNo = contactNo;
    if (dob !== undefined) profile.dob = dob;
    if (gender !== undefined) profile.gender = gender;
    if (address !== undefined) profile.address = address;

    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const getUserPublicCapsules = async (req, res) => {
  const loginUserId = req.userId;
  const userId = req.params.UserID;
  
  try {
    const publicCapsules = await TimeCapsule.find({ 
      UserID: userId, 
      CapsuleType: 'Public' 
    }).sort({ createdAt: -1 });

    const currentDate = new Date();
    const updatedCapsules = publicCapsules.map(capsule => {
      const capsuleData = { ...capsule._doc };
      if (new Date(capsule.UnlockDate) < currentDate) {
        capsuleData.Status = 'Open';
      }
      return capsuleData;
    });

    // Get nested capsules for all public capsules
    const publicCapsuleIds = updatedCapsules.map(capsule => capsule._id);
    const nestedCapsules = await NestedCapsule.find({ 
      ParentCapsuleId: { $in: publicCapsuleIds },
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
      const parentCapsule = updatedCapsules.find(capsule => capsule._id.toString() === parentId);
      const nestedCapsuleData = { ...nestedCapsule._doc };
      if (parentCapsule && new Date(parentCapsule.UnlockDate) < currentDate) {
        nestedCapsuleData.Status = 'Open';
      }
      
      nestedCapsulesByParent[parentId].push(nestedCapsuleData);
    });

    // Add nested capsules to public capsules
    const publicCapsulesWithNested = updatedCapsules.map(capsule => ({
      ...capsule,
      NestedCapsules: nestedCapsulesByParent[capsule._id.toString()] || []
    }));

    const capsuleIds = publicCapsulesWithNested.map(capsule => capsule._id);

    const likesAggregation = await Like.aggregate([
      { $match: { TimeCapsuleID: { $in: capsuleIds } } },
      { $group: { _id: '$TimeCapsuleID', count: { $sum: 1 } } }
    ]);

    const commentsAggregation = await Comment.aggregate([
      { $match: { TimeCapsuleID: { $in: capsuleIds } } },
      { $group: { _id: '$TimeCapsuleID', count: { $sum: 1 } } }
    ]);

    const userLikes = await Like.find({
      UserID: loginUserId,
      TimeCapsuleID: { $in: capsuleIds }
    });

    const likesCountMap = {};
    likesAggregation.forEach(like => {
      likesCountMap[like._id.toString()] = like.count;
    });

    const commentsCountMap = {};
    commentsAggregation.forEach(comment => {
      commentsCountMap[comment._id.toString()] = comment.count;
    });

    const userLikesMap = {};
    userLikes.forEach(like => {
      userLikesMap[like.TimeCapsuleID.toString()] = true;
    });

    const finalCapsules = publicCapsulesWithNested.map(capsule => {
      const capsuleId = capsule._id.toString();
      
      return {
        ...capsule,
        LikesCount: likesCountMap[capsuleId] || 0,
        CommentsCount: commentsCountMap[capsuleId] || 0,
        IsLikedByUser: userLikesMap[capsuleId] || false
      };
    });

    res.status(200).json({
      success: true,
      capsules: finalCapsules
    });
  } catch (error) {
    console.error('Error fetching user public capsules:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// export const getUserPublicCapsules = async (req, res) => {
//   const loginUserId = req.userId;
//   const userId = req.params.UserID;
  
//   try {
//     const publicCapsules = await TimeCapsule.find({ 
//       UserID: userId, 
//       CapsuleType: 'Public' 
//     }).sort({ createdAt: -1 });

//     const currentDate = new Date();
//     const updatedCapsules = publicCapsules.map(capsule => {
//       const capsuleData = { ...capsule._doc };
//       if (new Date(capsule.UnlockDate) < currentDate) {
//         capsuleData.Status = 'Open';
//       }
//       return capsuleData;
//     });

//     const capsuleIds = updatedCapsules.map(capsule => capsule._id);

//     const likesAggregation = await Like.aggregate([
//       { $match: { TimeCapsuleID: { $in: capsuleIds } } },
//       { $group: { _id: '$TimeCapsuleID', count: { $sum: 1 } } }
//     ]);

//     const commentsAggregation = await Comment.aggregate([
//       { $match: { TimeCapsuleID: { $in: capsuleIds } } },
//       { $group: { _id: '$TimeCapsuleID', count: { $sum: 1 } } }
//     ]);

//     const userLikes = await Like.find({
//       UserID: loginUserId,
//       TimeCapsuleID: { $in: capsuleIds }
//     });

//     const likesCountMap = {};
//     likesAggregation.forEach(like => {
//       likesCountMap[like._id.toString()] = like.count;
//     });

//     const commentsCountMap = {};
//     commentsAggregation.forEach(comment => {
//       commentsCountMap[comment._id.toString()] = comment.count;
//     });

//     const userLikesMap = {};
//     userLikes.forEach(like => {
//       userLikesMap[like.TimeCapsuleID.toString()] = true;
//     });

//     const finalCapsules = updatedCapsules.map(capsule => {
//       const capsuleId = capsule._id.toString();
      
//       return {
//         ...capsule,
//         LikesCount: likesCountMap[capsuleId] || 0,
//         CommentsCount: commentsCountMap[capsuleId] || 0,
//         IsLikedByUser: userLikesMap[capsuleId] || false
//       };
//     });

//     res.status(200).json({
//       success: true,
//       capsules: finalCapsules
//     });
//   } catch (error) {
//     console.error('Error fetching user public capsules:', error);
//     res.status(500).json({ message: `Server error: ${error.message}` });
//   }
// };

export const getUserFriends = async (req, res) => {
  const targetUserId = req.params.UserID;
  const currentUserId = req.userId;
  
  try {
    console.log('=== getUserFriends Debug ===');
    console.log('Current User ID:', currentUserId);
    console.log('Target User ID:', targetUserId);
    
    // Get all friends of the target user (not just mutual friends)
    const allFriends = await getAllUserFriends(targetUserId);
    
    console.log('Final result - all friends count:', allFriends.length);
    console.log('=== End Debug ===');
    
    res.status(200).json({
      success: true,
      friends: allFriends
    });
  } catch (error) {
    console.error('Error fetching user friends:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const getAllUserFriends = async (userId) => {
  try {
    // Find all friendships where the user is either the sender or receiver
    // and the friendship status is 'accepted'
    const friendships = await Friendship.find({
      $or: [
        { user_id: userId, status: 'accepted' },
        { friend_user_id: userId, status: 'accepted' }
      ]
    });

    console.log(`Found ${friendships.length} accepted friendships for user ${userId}`);

    // Extract friend IDs
    const friendIds = friendships.map(friendship => {
      // If the user is the sender, get the receiver's ID
      // If the user is the receiver, get the sender's ID
      return friendship.user_id.toString() === userId.toString() 
        ? friendship.friend_user_id 
        : friendship.user_id;
    });

    console.log('Friend IDs:', friendIds);

    if (friendIds.length === 0) {
      return [];
    }

    // Get profile information for all friends
    const friendsProfiles = await Profile.find({
      userId: { $in: friendIds }
    }).select('_id username profilePicture userId bio gender createdAt');

    console.log(`Found ${friendsProfiles.length} friend profiles`);

    return friendsProfiles;
  } catch (error) {
    console.error('Error in getAllUserFriends:', error);
    throw error;
  }
};
