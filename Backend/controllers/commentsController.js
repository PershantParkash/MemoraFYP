// controllers/commentsController.js
import Comment from '../models/Comment.js';
import TimeCapsule from '../models/TimeCapsule.js';
import { Profile } from '../models/Profile.js';
import mongoose from 'mongoose';
// Add a comment to a time capsule
export const addComment = async (req, res) => {
  try {
    const { timeCapsuleId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot exceed 1000 characters'
      });
    }

    // Validate ObjectId
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

    // Create the comment
    const newComment = await Comment.create({
      UserID: userId,
      TimeCapsuleID: timeCapsuleId,
      Content: content.trim()
    });

    // Populate the comment with user info
    const populatedComment = await Comment.findById(newComment._id)
      .populate('UserID', 'email');

    // Get user profile for additional info
    const userProfile = await Profile.findOne({ userId: userId });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        ...populatedComment._doc,
        UserProfile: userProfile
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the comment',
      error: error.message
    });
  }
};

// Get comments for a time capsule
export const getComments = async (req, res) => {
  try {
    const { timeCapsuleId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(timeCapsuleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time capsule ID'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get comments with pagination
    const comments = await Comment.find({ TimeCapsuleID: timeCapsuleId })
      .populate('UserID', 'email')
      .sort({ CreatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get user profiles for all comment authors
    const userIds = comments.map(comment => comment.UserID._id);
    const userProfiles = await Profile.find({ userId: { $in: userIds } });

    // Create a profile lookup map
    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    // Add profiles to comments
    const commentsWithProfiles = comments.map(comment => ({
      ...comment._doc,
      UserProfile: profileMap[comment.UserID._id.toString()] || null
    }));

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ TimeCapsuleID: timeCapsuleId });
    const totalPages = Math.ceil(totalComments / parseInt(limit));

    res.status(200).json({
      success: true,
      comments: commentsWithProfiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalComments,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching comments',
      error: error.message
    });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot exceed 1000 characters'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    // Find the comment and check ownership
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.UserID.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Update the comment
    comment.Content = content.trim();
    await comment.save();

    // Populate and return updated comment
    const updatedComment = await Comment.findById(commentId)
      .populate('UserID', 'email');

    const userProfile = await Profile.findOne({ userId: userId });

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        ...updatedComment._doc,
        UserProfile: userProfile
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the comment',
      error: error.message
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    // Find the comment and check ownership
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.UserID.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Delete the comment
    await Comment.deleteOne({ _id: commentId });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the comment',
      error: error.message
    });
  }
};