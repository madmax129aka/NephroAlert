const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

// GET /api/export/csv
router.get('/csv', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ doctorId: req.doctor._id });
    const rows = [];
    let counter = 1;

    for (const patient of patients) {
      const visits = await Visit.find({ patientId: patient._id })
        .sort({ visitDate: 1 });
      const patientId = `Patient_${String(counter).padStart(3, '0')}`;
      counter++;

      for (const visit of visits) {
        rows.push({
          patient_id: patientId,
          age: patient.age,
          gender: patient.gender,
          diabetes_duration_years: patient.diabetesDuration,
          smoking: patient.smokingStatus ? 'Yes' : 'No',
          bp_history: patient.bpHistory ? 'Yes' : 'No',
          visit_date: visit.visitDate.toISOString().split('T')[0],
          hba1c: visit.hba1c,
          creatinine: visit.creatinine,
          blood_urea: visit.bloodUrea,
          eGFR: visit.eGFR,
          systolic_bp: visit.systolicBP,
          diastolic_bp: visit.diastolicBP,
          urine_acr: visit.urineACR,
          ckd_stage: visit.ckdStageAtVisit,
          risk_score: visit.riskScoreAtVisit || '',
          risk_level: visit.riskLevelAtVisit || ''
        });
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No data to export' });
    }

    // Build CSV manually
    const headers = Object.keys(rows[0]);
    let csv = headers.join(',') + '\n';
    for (const row of rows) {
      csv += headers.map(h => row[h]).join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="nephroalert_research_data.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
