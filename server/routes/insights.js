const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Insight = require('../models/Insight');
const HealthLog = require('../models/HealthLog');
const { getWeeklyInsight } = require('../services/aiService');

router.use(authMiddleware);

router.get('/weekly', async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const cached = await Insight.findOne({
      userId: req.userId,
      weekStart: { $gte: weekStart },
    });

    if (cached && !req.query.refresh) {
      return res.json({ insight: cached.content, cached: true });
    }

    const logs = await HealthLog.find({
      userId: req.userId,
      date: { $gte: weekStart },
    });

    const content = await getWeeklyInsight(logs);

    await Insight.findOneAndUpdate(
      { userId: req.userId, weekStart: { $gte: weekStart } },
      { userId: req.userId, weekStart, content },
      { upsert: true, new: true }
    );

    res.json({ insight: content, cached: false });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

module.exports = router;