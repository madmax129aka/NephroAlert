const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  riskLevel: { type: String, required: true },
  riskScore: { type: Number, required: true },
  explanation: { type: String, required: true },
  recommendation: { type: String, required: true },
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });

alertSchema.index({ doctorId: 1, read: 1 });

module.exports = mongoose.model('Alert', alertSchema);
