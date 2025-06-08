import { Profile } from '../models/Profile.js';
import { Friendship } from '../models/friendshipModel.js';

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

// export const updateProfile = async (req, res) => {
//   const { bio, username, cnic, contactNo, dob, gender, address } = req.body;
//   const userId = req.userId;
//   const profilePicture = req.file.filename;
//   try {
//     const profile = await Profile.findOne({ userId });
//     if (!profile) return res.status(404).json({ message: 'Profile not found' });

//     if (bio !== undefined) profile.bio = bio;
//     if (profilePicture !== undefined) profile.profilePicture = profilePicture;
//     if (username !== undefined) profile.username = username;
//     if (cnic !== undefined) profile.cnic = cnic;
//     if (contactNo !== undefined) profile.contactNo = contactNo;
//     if (dob !== undefined) profile.dob = dob;
//     if (gender !== undefined) profile.gender = gender;
//     if (address !== undefined) profile.address = address;

//     await profile.save();
//     res.status(200).json(profile);
//   } catch (error) {
//     console.error('Error in updateProfile:', error);
//     res.status(500).json({ message: `Server error: ${error.message}` });
//   }
// };

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
