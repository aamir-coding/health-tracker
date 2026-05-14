const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const Insight = require('../models/Insight');
const authMiddleware = require('../middleware/auth');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  height: user.height || null,
  bio: user.bio || '',
  dateOfBirth: user.dateOfBirth || null,
  gender: user.gender || '',
  avatar: user.avatar || '',
  preferences: {
    units: user.preferences?.units || 'metric',
    language: user.preferences?.language || 'en',
  },
  goals: {
    dailySteps: user.goals?.dailySteps ?? null,
    dailySleepHours: user.goals?.dailySleepHours ?? null,
    dailyWaterMl: user.goals?.dailyWaterMl ?? null,
    targetWeight: user.goals?.targetWeight ?? null,
    targetMood: user.goals?.targetMood ?? null,
  },
});

router.post('/register', [
  body('name').trim().notEmpty().isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
    const user = await User.create(req.body);
    res.status(201).json({ token: generateToken(user._id), user: userPayload(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: generateToken(user._id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/profile', authMiddleware, [
  body('name').optional().trim().notEmpty().isLength({ max: 50 }),
  body('bio').optional().isLength({ max: 200 }),
  body('dateOfBirth').optional({ nullable: true }).isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say', '']),
  body('height').optional({ nullable: true }).isFloat({ min: 50, max: 300 }),
  body('avatar').optional().custom(val => {
    if (!val || val === '') return true;
    if (!val.startsWith('data:image/')) throw new Error('Invalid image format');
    if (val.length > 250000) throw new Error('Image too large — please use a smaller photo');
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const allowed = ['name', 'bio', 'dateOfBirth', 'gender', 'height', 'avatar'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

router.patch('/preferences', authMiddleware, [
  body('units').optional().isIn(['metric', 'imperial']),
  body('language').optional().isString().isLength({ max: 10 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const updates = {};
    if (req.body.units) updates['preferences.units'] = req.body.units;
    if (req.body.language) updates['preferences.language'] = req.body.language;
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
    res.json({ user: userPayload(user) });
  } catch {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

router.patch('/goals', authMiddleware, [
  body('dailySteps').optional({ nullable: true }).isFloat({ min: 0, max: 100000 }),
  body('dailySleepHours').optional({ nullable: true }).isFloat({ min: 0, max: 24 }),
  body('dailyWaterMl').optional({ nullable: true }).isFloat({ min: 0, max: 20000 }),
  body('targetWeight').optional({ nullable: true }).isFloat({ min: 1, max: 500 }),
  body('targetMood').optional({ nullable: true }).isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const updates = {};
    ['dailySteps', 'dailySleepHours', 'dailyWaterMl', 'targetWeight', 'targetMood'].forEach(k => {
      if (req.body[k] !== undefined) updates[`goals.${k}`] = req.body[k] === '' ? null : Number(req.body[k]);
    });
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
    res.json({ user: userPayload(user) });
  } catch {
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

router.patch('/password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await user.comparePassword(req.body.currentPassword);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.delete('/account', authMiddleware, [
  body('password').notEmpty().withMessage('Password is required to confirm deletion'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await user.comparePassword(req.body.password);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    await Promise.all([
      HealthLog.deleteMany({ userId: req.userId }),
      Insight.deleteMany({ userId: req.userId }),
      User.findByIdAndDelete(req.userId),
    ]);
    res.json({ message: 'Account deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;