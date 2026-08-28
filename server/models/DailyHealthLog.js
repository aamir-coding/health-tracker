const mongoose = require('mongoose');

const dailyHealthLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dateLocal: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid local date'],
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
  notes: [{
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
    trim: true,
  }],
}, { timestamps: true });

dailyHealthLogSchema.index({ userId: 1, dateLocal: 1 }, { unique: true });
dailyHealthLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DailyHealthLog', dailyHealthLogSchema);
