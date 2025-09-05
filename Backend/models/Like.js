
// models/Like.js
import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
  UserID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  TimeCapsuleID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TimeCapsule', 
    required: true 
  },
  CreatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure one user can only like one time capsule once
LikeSchema.index({ UserID: 1, TimeCapsuleID: 1 }, { unique: true });

const Like = mongoose.model('Like', LikeSchema);
export default Like;