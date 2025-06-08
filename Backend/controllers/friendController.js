import { Friendship } from '../models/friendshipModel.js';
import { User } from '../models/userModel.js'; 
import { Profile } from '../models/Profile.js';

export const getPendingFriendRequests = async (req, res) => {
    try {
        const userId = req.userId; 

        const pendingRequests = await Friendship.find({
            friend_user_id: userId,
            status: 'pending',
        }).select('user_id');

        // Extract user IDs from pending requests
        const userIds = pendingRequests.map(request => request.user_id);

        // Fetch full profile details of these users
        const profiles = await Profile.find({ userId: { $in: userIds } });

        res.status(200).json({ pendingRequests: profiles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving pending friend requests', error });
    }
};

export const sendFriendRequest = async (req, res) => {
    try {
        const friendUserId  = req.body.friend_user_id; 
        const userId = req.userId; 

        if (userId === friendUserId) {
            return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
        }

        const existingFriendship = await Friendship.findOne({
            $or: [
                { user_id: userId, friend_user_id: friendUserId },
                { user_id: friendUserId, friend_user_id: userId }
            ]
        });

        if (existingFriendship) {
            return res.status(400).json({ message: 'Friendship already exists or pending.' });
        }

        const friendship = new Friendship({
            user_id: userId,
            friend_user_id: friendUserId,
            status: 'pending',
        });

        await friendship.save(); 

        res.status(201).json({ message: 'Friend request sent successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending friend request', error });
    }
};

export const getUserFriends = async (req, res) => {
    try {
        const userId = req.userId; 

    
        const friendships = await Friendship.find({
            $or: [
                { user_id: userId, status: 'accepted' },
                { friend_user_id: userId, status: 'accepted' }
            ]
        }).populate('user_id friend_user_id'); 

        const friends = friendships.map(friendship => {
            return friendship.user_id._id.toString() === userId
                ? friendship.friend_user_id
                : friendship.user_id;
        });

        res.status(200).json({ friends });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving friends', error });
    }
};

export const removeFriend = async (req, res) => {
    try {
        const { friendUserId } = req.body;
        const userId = req.userId; 

        await Friendship.deleteMany({
            $or: [
                { user_id: userId, friend_user_id: friendUserId },
                { user_id: friendUserId, friend_user_id: userId }
            ]
        });

        res.status(200).json({ message: 'Friend removed successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing friend', error });
    }
};

// export const getPendingFriendRequests = async (req, res) => {
//     try {
//         const userId = req.userId; 

//         const pendingRequests = await Friendship.find({
//             friend_user_id: userId,
//             status: 'pending',
//           }, 'user_id'); 
//         res.status(200).json({ pendingRequests });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error retrieving pending friend requests', error });
//     }
// };

export const declineFriendRequest = async (req, res) => {
    try {
        const  friendshipId  = req.body.friendshipId; 
        const loggedInUserId = req.userId; 
       
        const friendship = await Friendship.findOne({
            user_id: friendshipId, 
            friend_user_id: loggedInUserId, 
        });

        if (!friendship) {
            return res.status(404).json({ message: 'Friend request not found.' });
        }

        friendship.status = 'rejected';
        await friendship.save();

        res.status(200).json({ message: 'Friend request declined.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error declining friend request', error });
    }
};

export const acceptFriendRequest = async (req, res) => {
    try {
        const friendshipId  = req.body.friendshipId; 
        const loggedInUserId = req.userId; 

        const friendship = await Friendship.findOne({
            user_id: friendshipId, 
            friend_user_id: loggedInUserId, 
        });

        if (!friendship) {
            return res.status(404).json({ message: 'Friend request not found.' });
        }

        friendship.status = 'accepted';
        await friendship.save();

        res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error accepting friend request', error });
    }
};



export const getAllProfilesExceptCurrentUser = async (req, res) => {
    const userId = req.userId; 
  
    try {
      const profiles = await Profile.find({ userId: { $ne: userId } }); 
      res.status(200).json(profiles);
    } catch (error) {
      console.error('Error in getAllProfilesExceptCurrentUser:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  };
  