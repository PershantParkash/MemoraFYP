import mongoose from 'mongoose';

const TimeCapsuleSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String },
  UnlockDate: { type: Date, required: true },
  CapsuleType: { type: String, enum: ['Personal', 'Shared'], required: true },
  Status: { type: String, enum: ['Open', 'Locked'], required: true },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Media: { type: String, required: true },
});

const TimeCapsule = mongoose.model('TimeCapsule', TimeCapsuleSchema);
export default TimeCapsule; 
