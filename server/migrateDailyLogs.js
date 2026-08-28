const mongoose = require('mongoose');
require('dotenv').config();
const HealthLog = require('./models/HealthLog');
const DailyHealthLog = require('./models/DailyHealthLog');

const dateFromLocal = (dateLocal) => new Date(`${dateLocal}T00:00:00.000Z`);

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const logs = await HealthLog.find({}).sort({ date: 1, createdAt: 1, _id: 1 }).lean();
    const grouped = new Map();

    for (const log of logs) {
      const dateLocal = log.dateLocal || new Date(log.date).toISOString().slice(0, 10);
      const key = `${log.userId}:${dateLocal}`;
      const current = grouped.get(key) || {
        userId: log.userId,
        date: dateFromLocal(dateLocal),
        dateLocal,
        notes: [],
      };

      current.date = log.date || current.date;
      for (const field of ['sleepHours', 'weight', 'mood']) {
        if (log[field] != null) current[field] = log[field];
      }
      for (const field of ['steps', 'waterMl']) {
        if (log[field] != null) current[field] = Math.max(current[field] || 0, log[field]);
      }
      if (log.notes?.trim() && !current.notes.includes(log.notes.trim())) {
        current.notes.push(log.notes.trim());
      }
      grouped.set(key, current);
    }

    const operations = [...grouped.values()].map((record) => ({
      replaceOne: {
        filter: { userId: record.userId, dateLocal: record.dateLocal },
        replacement: record,
        upsert: true,
      },
    }));

    if (operations.length) await DailyHealthLog.bulkWrite(operations, { ordered: false });
    console.log(`Migrated ${logs.length} legacy logs into ${operations.length} daily records.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Daily log migration failed:', error.message);
    process.exitCode = 1;
  }
};

migrate();
