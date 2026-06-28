const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  village: { type: String, required: true },
  phc: { type: String, required: true },
  diabetesDuration: { type: Number, required: true },
  smokingStatus: { type: Boolean, default: false },
  bpHistory: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  currentCKDStage: { type: Number, default: null },
  currentRiskLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'], default: 'Low' },
  currentRiskScore: { type: Number, default: 0 },
  lastVisitDate: { type: Date, default: null },
  alertActive: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
