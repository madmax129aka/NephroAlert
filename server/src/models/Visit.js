const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  visitDate: { type: Date, required: true },
  hba1c: { type: Number, required: true },
  creatinine: { type: Number, required: true },
  bloodUrea: { type: Number, required: true },
  eGFR: { type: Number, required: true },
  systolicBP: { type: Number, required: true },
  diastolicBP: { type: Number, required: true },
  urineACR: { type: Number, required: true },
  ckdStageAtVisit: { type: Number },
  riskScoreAtVisit: { type: Number },
  riskLevelAtVisit: { type: String },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
