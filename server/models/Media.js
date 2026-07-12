import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  resourceType: { type: String },
  thumbnailUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Media = mongoose.model('Media', mediaSchema);
