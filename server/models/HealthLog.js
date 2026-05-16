const mongoose = require('mongoose');

const healthLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dateLocal: {
    type: String,
    // Format: YYYY-MM-DD in user's local timezone (sent by client)
    // Used for grouping logs by day in heatmap/streak (avoids UTC offset issues)
  },
  weight: {
    type: Number,
    min: [1, 'Weight must be positive'],
    max: [500, 'Weight value too high'],
  },
  steps: {
    type: Number,
    min: [0, 'Steps cannot be negative'],
    max: [100000, 'Steps value too high'],
  },
  sleepHours: {
    type: Number,
    min: [0, 'Sleep hours cannot be negative'],
    max: [24, 'Sleep hours cannot exceed 24'],
  },
  waterMl: {
    type: Number,
    min: [0, 'Water cannot be negative'],
    max: [20000, 'Water value too high'],
  },
  mood: {
    type: Number,
    min: [1, 'Mood must be 1–5'],
    max: [5, 'Mood must be 1–5'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true,
  },
}, { timestamps: true });

healthLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('HealthLog', healthLogSchema);