const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Alert = require('../models/Alert');

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const doctorId = req.doctor._id;

    const totalPatients = await Patient.countDocuments({ doctorId });


    const riskBreakdown = {
      Low: await Patient.countDocuments({ doctorId, currentRiskLevel: 'Low' }),
      Moderate: await Patient.countDocuments({ doctorId, currentRiskLevel: 'Moderate' }),
      High: await Patient.countDocuments({ doctorId, currentRiskLevel: 'High' }),
      Critical: await Patient.countDocuments({ doctorId, currentRiskLevel: 'Critical' })
    };

    // Visits this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const visitsThisMonth = await Visit.countDocuments({
      doctorId,
      visitDate: { $gte: startOfMonth }
    });

    const activeAlerts = await Alert.countDocuments({ doctorId, read: false });

    const recentAlerts = await Alert.find({ doctorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patientId', 'fullName');

    const recentPatients = await Patient.find({ doctorId })
      .sort({ lastVisitDate: -1 })
      .limit(5);

    res.json({
      totalPatients,
      riskBreakdown,
      visitsThisMonth,
      activeAlerts,
      recentAlerts: recentAlerts.map(a => ({
        _id: a._id,
        patientName: a.patientId?.fullName || 'Unknown',
        patientId: a.patientId?._id,
        riskLevel: a.riskLevel,
        riskScore: a.riskScore,
        explanation: a.explanation,
        createdAt: a.createdAt,
        read: a.read
      })),
      recentPatients
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
