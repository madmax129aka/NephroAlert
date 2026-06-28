const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Alert = require('../models/Alert');
const { predictCKDProgression, calculateEGFR, getCKDStage } = require('../services/prediction');

// GET /api/patients — all patients for this doctor
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ doctorId: req.doctor._id })
      .sort({ lastVisitDate: -1, createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/patients — create patient
router.post('/', auth, [
  body('fullName').trim().notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Valid age is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('village').trim().notEmpty().withMessage('Village is required'),
  body('phc').trim().notEmpty().withMessage('PHC is required'),
  body('diabetesDuration').isInt({ min: 0 }).withMessage('Diabetes duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const patient = await Patient.create({
      ...req.body,
      doctorId: req.doctor._id
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/patients/:id — patient detail + all visits
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, doctorId: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const visits = await Visit.find({ patientId: patient._id }).sort({ visitDate: 1 });
    
    // Run prediction with current data
    let prediction = null;
    if (visits.length >= 2) {
      prediction = predictCKDProgression(patient, visits);
    }

    res.json({ patient, visits, prediction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/patients/:id — update patient
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.doctor._id },
      req.body,
      { new: true }
    );
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, doctorId: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Delete related data
    await Visit.deleteMany({ patientId: patient._id });
    await Alert.deleteMany({ patientId: patient._id });
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/patients/:id/visits — add visit + run prediction
router.post('/:id/visits', auth, [
  body('visitDate').notEmpty().withMessage('Visit date is required'),
  body('hba1c').isFloat({ min: 3, max: 20 }).withMessage('Valid HbA1c is required'),
  body('creatinine').isFloat({ min: 0.1, max: 30 }).withMessage('Valid creatinine is required'),
  body('bloodUrea').isFloat({ min: 1, max: 300 }).withMessage('Valid blood urea is required'),
  body('systolicBP').isInt({ min: 60, max: 300 }).withMessage('Valid systolic BP is required'),
  body('diastolicBP').isInt({ min: 30, max: 200 }).withMessage('Valid diastolic BP is required'),
  body('urineACR').isFloat({ min: 0, max: 10000 }).withMessage('Valid urine ACR is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const patient = await Patient.findOne({ _id: req.params.id, doctorId: req.doctor._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Calculate eGFR
    const eGFR = calculateEGFR(req.body.creatinine, patient.age, patient.gender);
    const ckdStage = getCKDStage(eGFR);

    // Create visit
    const visit = await Visit.create({
      patientId: patient._id,
      doctorId: req.doctor._id,
      visitDate: req.body.visitDate,
      hba1c: req.body.hba1c,
      creatinine: req.body.creatinine,
      bloodUrea: req.body.bloodUrea,
      eGFR,
      systolicBP: req.body.systolicBP,
      diastolicBP: req.body.diastolicBP,
      urineACR: req.body.urineACR,
      ckdStageAtVisit: ckdStage,
      notes: req.body.notes || ''
    });

    // Fetch all visits for prediction
    const allVisits = await Visit.find({ patientId: patient._id }).sort({ visitDate: 1 });
    
    // Run prediction
    const prediction = predictCKDProgression(patient, allVisits);

    // Update visit with prediction
    visit.riskScoreAtVisit = prediction.score;
    visit.riskLevelAtVisit = prediction.level;
    await visit.save();

    // Track if risk increased
    const previousRiskLevel = patient.currentRiskLevel;
    const riskLevels = ['Low', 'Moderate', 'High', 'Critical'];
    const riskIncreased = riskLevels.indexOf(prediction.level) > riskLevels.indexOf(previousRiskLevel);

    // Update patient
    await Patient.findByIdAndUpdate(patient._id, {
      currentCKDStage: ckdStage,
      currentRiskLevel: prediction.level,
      currentRiskScore: prediction.score,
      lastVisitDate: req.body.visitDate,
      alertActive: prediction.level === 'High' || prediction.level === 'Critical'
    });

    // Create alert if risk is high/critical and increased
    if ((prediction.level === 'High' || prediction.level === 'Critical') && riskIncreased) {
      await Alert.create({
        patientId: patient._id,
        doctorId: req.doctor._id,
        visitId: visit._id,
        riskLevel: prediction.level,
        riskScore: prediction.score,
        explanation: prediction.explanation,
        recommendation: prediction.recommendation,
        read: false
      });
    }

    res.status(201).json({ visit, prediction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/patients/:id/visits — all visits for patient
router.get('/:id/visits', auth, async (req, res) => {
  try {
    const visits = await Visit.find({ patientId: req.params.id, doctorId: req.doctor._id })
      .sort({ visitDate: 1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
