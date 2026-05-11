const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weekStart: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

insightSchema.index({ userId: 1, weekStart: -1 });

module.exports = mongoose.model('Insight', insightSchema);