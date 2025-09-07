import mongoose from 'mongoose';

const NestedCapsuleSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String },
  CapsuleType: { type: String, enum: ['Personal', 'Shared', 'Public', 'Nested'], required: true },
  Status: { type: String, enum: ['Open', 'Locked'], required: true },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Media: { type: String, required: true },
  ParentCapsuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeCapsule', required: true },
}, {
  timestamps: true
});

const NestedCapsule = mongoose.model('NestedCapsule', NestedCapsuleSchema);
export default NestedCapsule; 