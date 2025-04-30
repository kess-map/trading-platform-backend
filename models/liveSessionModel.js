import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, 
  durationInMinutes: { type: Number, required: true },
}, { timestamps: true });

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);

export default LiveSession;
