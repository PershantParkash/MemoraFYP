// controllers/likesController.js
import Like from '../models/Like.js';
import TimeCapsule from '../models/TimeCapsule.js';
import mongoose from 'mongoose';

// Toggle like for a time capsule
export const toggleLike = async (req, res) => {
  try {
    const { timeCapsuleId } = req.params;
    const userId = req.userId; // From auth middleware

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(timeCapsuleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time capsule ID'
      });
    }

    // Check if time capsule exists
    const timeCapsule = await TimeCapsule.findById(timeCapsuleId);
    if (!timeCapsule) {
      return res.status(404).json({
        success: false,
        message: 'Time capsule not found'
      });
    }

    // Check if user already liked this time capsule
    const existingLike = await Like.findOne({
      UserID: userId,
      TimeCapsuleID: timeCapsuleId
    });

    if (existingLike) {
      // Remove like
      await Like.deleteOne({ _id: existingLike._id });
      
      res.status(200).json({
        success: true,
        message: 'Like removed',
        isLiked: false
      });
    } else {
      // Add like
      const newLike = await Like.create({
        UserID: userId,
        TimeCapsuleID: timeCapsuleId
      });

      res.status(201).json({
        success: true,
        message: 'Like added',
        isLiked: true,
        like: newLike
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the like',
      error: error.message
    });
  }
};

// Get likes for a time capsule
export const getLikes = async (req, res) => {
  try {
    const { timeCapsuleId } = req.params;
    const userId = req.userId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(timeCapsuleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time capsule ID'
      });
    }

    // Get all likes for the time capsule
    const likes = await Like.find({ TimeCapsuleID: timeCapsuleId })
      .populate('UserID', 'email') // Only populate email for privacy
      .sort({ CreatedAt: -1 });

    // Check if current user has liked this time capsule
    const userLike = await Like.findOne({
      UserID: userId,
      TimeCapsuleID: timeCapsuleId
    });

    res.status(200).json({
      success: true,
      likes: likes,
      likesCount: likes.length,
      isLikedByUser: !!userLike
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching likes',
      error: error.message
    });
  }
};