const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const DailyHealthLog = require('../models/DailyHealthLog');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      DailyHealthLog.find({ userId: req.userId }).sort({ dateLocal: -1, createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      DailyHealthLog.countDocuments({ userId: req.userId }),
    ]);
    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const logs = await DailyHealthLog.find({
      userId: req.userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: -1, createdAt: -1, _id: -1 });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent logs' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const logs = await DailyHealthLog.find({ userId: req.userId }).sort({ dateLocal: -1, createdAt: -1, _id: -1 }).limit(30);
    if (!logs.length) return res.json({ averages: {}, latest: null, total: 0 });
    const avg = (field) => {
      const vals = logs.filter(l => l[field] != null).map(l => l[field]);
      if (!vals.length) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };
    res.json({
      averages: {
        weight: avg('weight'),
        steps: avg('steps') != null ? Math.round(avg('steps')) : null,
        sleepHours: avg('sleepHours'),
        waterMl: avg('waterMl') != null ? Math.round(avg('waterMl')) : null,
        mood: avg('mood'),
      },
      latest: logs[0],
      total: await DailyHealthLog.countDocuments({ userId: req.userId }),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/day/:dateLocal', async (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.dateLocal)) {
    return res.status(400).json({ error: 'Invalid local date' });
  }
  try {
    const log = await DailyHealthLog.findOne({
      userId: req.userId,
      dateLocal: req.params.dateLocal,
    });
    if (!log) return res.status(404).json({ error: 'No log for this day' });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily log' });
  }
});

router.get('/streak', async (req, res) => {
  try {
    const logs = await DailyHealthLog.find({ userId: req.userId }).select('dateLocal');
    if (!logs.length) return res.json({ streak: 0, longest: 0 });

    const uniqueDates = [...new Set(logs.map(l => l.dateLocal))].sort((a, b) => b.localeCompare(a));

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let streak = 0;
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      let expected = new Date(uniqueDates[0]);
      for (const d of uniqueDates) {
        if (d === expected.toISOString().slice(0, 10)) {
          streak++;
          expected = new Date(expected.getTime() - 86400000);
        } else break;
      }
    }

    let longest = streak;
    let curr = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = Math.round(
        (new Date(uniqueDates[i - 1]) - new Date(uniqueDates[i])) / 86400000
      );
      if (diff === 1) { curr++; longest = Math.max(longest, curr); }
      else curr = 1;
    }
    if (uniqueDates.length === 1) longest = Math.max(longest, 1);

    res.json({ streak, longest });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

router.get('/heatmap', async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 112);
    // Count number of log entries per dateLocal (grouped by user's local date, not UTC)
    const logs = await DailyHealthLog.find({
      userId: req.userId,
      date: { $gte: since },
    }).select('dateLocal');

    const map = {};
    logs.forEach(log => {
      if (log.dateLocal) {
        map[log.dateLocal] = 1;
      }
    });

    res.json({ heatmap: map });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

router.get('/compare', async (req, res) => {
  try {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);

    const [thisWeekLogs, lastWeekLogs] = await Promise.all([
      DailyHealthLog.find({ userId: req.userId, date: { $gte: thisWeekStart } }),
      DailyHealthLog.find({ userId: req.userId, date: { $gte: lastWeekStart, $lt: thisWeekStart } }),
    ]);

    const avgOf = (logs, field) => {
      const vals = logs.filter(l => l[field] != null).map(l => l[field]);
      if (!vals.length) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };

    const fields = ['steps', 'sleepHours', 'waterMl', 'mood', 'weight'];
    const thisWeek = {}, lastWeek = {};
    fields.forEach(f => {
      thisWeek[f] = avgOf(thisWeekLogs, f);
      lastWeek[f] = avgOf(lastWeekLogs, f);
    });

    res.json({ thisWeek, lastWeek });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare weeks' });
  }
});

const logValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date'),
  body('dateLocal').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid local date'),
  body('weight').optional({ nullable: true }).isFloat({ min: 1, max: 500 }),
  body('steps').optional({ nullable: true }).isInt({ min: 0, max: 100000 }),
  body('sleepHours').optional({ nullable: true }).isFloat({ min: 0, max: 24 }),
  body('waterMl').optional({ nullable: true }).isInt({ min: 0, max: 20000 }),
  body('mood').optional({ nullable: true }).isInt({ min: 1, max: 5 }),
  body('notes').optional().isLength({ max: 500 }),
];

const dateForLocal = (dateLocal) => new Date(`${dateLocal}T00:00:00.000Z`);
const fieldsToUpdate = (body) => {
  const updates = {};
  for (const field of ['date', 'dateLocal', 'weight', 'steps', 'sleepHours', 'waterMl', 'mood']) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  if (body.notes !== undefined) updates.notes = Array.isArray(body.notes) ? body.notes : [body.notes];
  return updates;
};

router.post('/today/:field', async (req, res) => {
  const { field } = req.params;
  const amount = Number(req.body.amount);
  const dateLocal = req.body.dateLocal;
  if (!['steps', 'waterMl'].includes(field) || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid increment' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal || '')) {
    return res.status(400).json({ error: 'Invalid local date' });
  }
  try {
    const log = await DailyHealthLog.findOneAndUpdate(
      { userId: req.userId, dateLocal },
      {
        $setOnInsert: { userId: req.userId, date: dateForLocal(dateLocal), dateLocal },
        $inc: { [field]: amount },
      },
      { new: true, upsert: true, runValidators: true }
    );
    req.app.get('io').to(req.userId.toString()).emit('log:updated', log);
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update daily log' });
  }
});

router.post('/', logValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const updates = fieldsToUpdate(req.body);
    const log = await DailyHealthLog.findOneAndUpdate(
      { userId: req.userId, dateLocal: req.body.dateLocal },
      { $set: updates, $setOnInsert: { userId: req.userId, date: dateForLocal(req.body.dateLocal) } },
      { new: true, upsert: true, runValidators: true }
    );
    req.app.get('io').to(req.userId.toString()).emit('log:updated', log);
    res.status(200).json({ log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

router.put('/:id', logValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const updates = fieldsToUpdate(req.body);
    const current = await DailyHealthLog.findOne({ _id: req.params.id, userId: req.userId });
    if (!current) return res.status(404).json({ error: 'Log not found' });

    const target = req.body.dateLocal && req.body.dateLocal !== current.dateLocal
      ? await DailyHealthLog.findOne({ userId: req.userId, dateLocal: req.body.dateLocal })
      : null;
    if (target) {
      Object.assign(target, updates);
      await target.save();
      await current.deleteOne();
      req.app.get('io').to(req.userId.toString()).emit('log:updated', target);
      return res.json({ log: target });
    }

    const log = await DailyHealthLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(404).json({ error: 'Log not found' });
    req.app.get('io').to(req.userId.toString()).emit('log:updated', log);
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update log' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const log = await DailyHealthLog.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    req.app.get('io').to(req.userId.toString()).emit('log:deleted', { id: req.params.id });
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

module.exports = router;