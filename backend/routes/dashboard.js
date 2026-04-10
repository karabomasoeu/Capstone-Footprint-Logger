const express     = require('express');
const ActivityLog = require('../models/ActivityLog');
const protect     = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/dashboard, aggregated summary for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Total CO2 and count
    const [totals] = await ActivityLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id:        null,
          totalCo2:   { $sum: '$co2kg' },
          totalLogs:  { $sum: 1 },
        },
      },
    ]);

    // Totals by category
    const byCategory = await ActivityLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id:   '$category',
          co2:   { $sum: '$co2kg' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily totals for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTotals = await ActivityLog.aggregate([
      { $match: { userId, loggedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$loggedAt' },
          },
          co2: { $sum: '$co2kg' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Logged dates for streak calculation (last 7 days)
    const loggedDates = dailyTotals.map((d) => d._id);

    // Today's total
    const todayStr  = new Date().toISOString().split('T')[0];
    const todayData = dailyTotals.find((d) => d._id === todayStr);
    const todayCo2  = todayData ? todayData.co2 : 0;

    res.json({
      totalCo2:   totals ? Math.round(totals.totalCo2  * 100) / 100 : 0,
      totalLogs:  totals ? totals.totalLogs : 0,
      todayCo2:   Math.round(todayCo2 * 100) / 100,
      byCategory: byCategory.reduce((acc, c) => {
        acc[c._id] = { co2: Math.round(c.co2 * 100) / 100, count: c.count };
        return acc;
      }, {}),
      dailyTotals,
      loggedDates,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
