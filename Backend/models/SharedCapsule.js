import mongoose from 'mongoose';

const SharedCapsuleSchema = new mongoose.Schema({
  TimeCapsuleID: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeCapsule', required: true },
  CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const SharedCapsule = mongoose.model('SharedCapsule', SharedCapsuleSchema);
export default SharedCapsule;
