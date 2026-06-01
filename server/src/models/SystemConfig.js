import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  announcement: { type: String, default: 'Welcome to Campus Media v2.0 (Powered by MongoDB)' },
  allowSignups: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  interviewCategories: { type: [String], default: [] }
});

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
