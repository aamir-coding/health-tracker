const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  height: user.height || null,
});

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
    const token = generateToken(user._id);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/profile', authMiddleware, [
  body('name').optional().trim().notEmpty().isLength({ max: 50 }),
  body('height').optional({ nullable: true }).isFloat({ min: 50, max: 300 }).withMessage('Height must be 50–300 cm'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.height != null) updates.height = Number(req.body.height);
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;