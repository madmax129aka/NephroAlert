const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Alert = require('../models/Alert');

// GET /api/alerts
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ doctorId: req.doctor._id })
      .sort({ createdAt: -1 })
      .populate('patientId', 'fullName age gender village');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/alerts/:id/read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.doctor._id },
      { read: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/alerts/read-all
router.put('/read-all', auth, async (req, res) => {
  try {
    await Alert.updateMany(
      { doctorId: req.doctor._id, read: false },
      { read: true }
    );
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
