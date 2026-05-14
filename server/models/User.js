const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  password: { type: String, required: true, minlength: 6, select: false },
  bio: { type: String, maxlength: 200, trim: true, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say', ''], default: '' },
  height: { type: Number, min: 50, max: 300 },
  avatar: { type: String, default: '' },
  preferences: {
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    language: { type: String, default: 'en' },
  },
  goals: {
    dailySteps: { type: Number, min: 0, max: 100000 },
    dailySleepHours: { type: Number, min: 0, max: 24 },
    dailyWaterMl: { type: Number, min: 0, max: 20000 },
    targetWeight: { type: Number, min: 1, max: 500 },
    targetMood: { type: Number, min: 1, max: 5 },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);