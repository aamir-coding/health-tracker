const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const HealthLog = require('./models/HealthLog');
const Insight = require('./models/Insight');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteOne({ email: 'demo@healthtracker.com' });
    const existingLogs = await User.findOne({ email: 'demo@healthtracker.com' });
    if (existingLogs) await HealthLog.deleteMany({ userId: existingLogs._id });

    const user = await User.create({
      name: 'Demo User',
      email: 'demo@healthtracker.com',
      password: 'demo123456',
    });
    console.log('Created demo user');
    console.log('  Email:    demo@healthtracker.com');
    console.log('  Password: demo123456');

    const logs = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(12, 0, 0, 0);
      logs.push({
        userId: user._id,
        date,
        weight: parseFloat((68 + (Math.random() * 2 - 1)).toFixed(1)),
        steps: Math.floor(4000 + Math.random() * 8000),
        sleepHours: parseFloat((5.5 + Math.random() * 3).toFixed(1)),
        waterMl: Math.floor(1200 + Math.random() * 1300),
        mood: Math.floor(2 + Math.random() * 4),
        notes: i === 0 ? 'Feeling good today!' : i === 7 ? 'Skipped gym, feeling tired.' : '',
      });
    }

    await HealthLog.insertMany(logs);
    console.log('Created 14 days of demo health logs');
    await mongoose.disconnect();
    console.log('\nSeeding complete! You can now log in with the demo account.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();