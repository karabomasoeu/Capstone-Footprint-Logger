const express     = require('express');
const ActivityLog = require('../models/ActivityLog');
const protect     = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/logs: retrieve logs for the current user
router.get('/', async (req, res) => {
  try {
    const { category, limit = 100, skip = 0 } = req.query;

    const filter = { userId: req.user._id };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const logs = await ActivityLog.find(filter)
      .sort({ loggedAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await ActivityLog.countDocuments(filter);

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logs, create a new log entry
router.post('/', async (req, res) => {
  try {
    const { activityKey, name, category, quantity, unit, emissionFactor } = req.body;

    if (!activityKey || !name || !category || !quantity || !unit || !emissionFactor) {
      return res.status(400).json({ message: 'All activity fields are required.' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero.' });
    }

    const co2kg = Math.round(quantity * emissionFactor * 1000) / 1000;

    const log = await ActivityLog.create({
      userId: req.user._id,
      activityKey,
      name,
      category,
      quantity,
      unit,
      emissionFactor,
      co2kg,
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/logs/:id — delete a specific log entry
router.delete('/:id', async (req, res) => {
  try {
    const log = await ActivityLog.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!log) {
      return res.status(404).json({ message: 'Log entry not found.' });
    }

    await log.deleteOne();
    res.json({ message: 'Log entry deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
