const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  designation: { type: String, enum: ['Doctor', 'Nurse', 'Health Worker'], required: true },
  phcName: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, default: 'Tamil Nadu' },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  medicalRegNumber: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
