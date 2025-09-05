import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
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
  Content: { 
    type: String, 
    required: true,
    maxlength: 1000 // Limit comment length
  },
  CreatedAt: { 
    type: Date, 
    default: Date.now 
  },
  UpdatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient querying
CommentSchema.index({ TimeCapsuleID: 1, CreatedAt: -1 });

// Update the UpdatedAt field on save
CommentSchema.pre('save', function(next) {
  if (this.isModified('Content')) {
    this.UpdatedAt = Date.now();
  }
  next();
});

const Comment = mongoose.model('Comment', CommentSchema);
export default Comment;