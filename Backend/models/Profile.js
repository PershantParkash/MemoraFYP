import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema(
  {
    bio: { type: String, trim: true, default: '' },
    profilePicture: {
      type: String,
      default: '',
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    contactNo: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    address: { type: String, required: true },
  },
  {
    timestamps: true, 
  }
);

const Profile = mongoose.model('Profile', ProfileSchema);
export { Profile} ;
