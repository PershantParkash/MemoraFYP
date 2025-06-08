import mongoose from 'mongoose';

// Define the Friendship schema
const friendshipSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
    },
    friend_user_id: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending', 
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now, 
    },
  },
  {
    timestamps: true, 
  }
);

const Friendship = mongoose.model('Friendship', friendshipSchema);
export { Friendship };
