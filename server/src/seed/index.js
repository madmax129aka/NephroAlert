const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Alert = require('../models/Alert');
const { predictCKDProgression, calculateEGFR, getCKDStage } = require('../services/prediction');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const doctorCount = await Doctor.countDocuments();
    if (doctorCount > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    // Create Demo Doctor
    const passwordHash = await bcrypt.hash('Demo@123', 10);
    const doctor = await Doctor.create({
      fullName: 'Dr. Priya Ramesh',
      designation: 'Doctor',
      phcName: 'Villupuram PHC',
      district: 'Villupuram',
      state: 'Tamil Nadu',
      email: 'demo@nephroalert.com',
      passwordHash,
      medicalRegNumber: 'TN-MED-2019-4521'
    });

    console.log('Demo doctor created');

    // Helper to create date relative to now
    const monthsAgo = (months) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d;
    };

    // Patient Data
    const patientsData = [
      {
        info: { fullName: 'Rajesh Kumar', age: 58, gender: 'Male', village: 'Thiruvannamalai', phc: 'Villupuram PHC', diabetesDuration: 12, smokingStatus: true, bpHistory: true, phone: '9876543210' },
        visits: [
          { date: monthsAgo(18), hba1c: 8.2, creatinine: 0.9, bloodUrea: 22, systolicBP: 142, diastolicBP: 88, urineACR: 45 },
          { date: monthsAgo(15), hba1c: 8.5, creatinine: 1.0, bloodUrea: 26, systolicBP: 145, diastolicBP: 90, urineACR: 68 },
          { date: monthsAgo(12), hba1c: 8.8, creatinine: 1.2, bloodUrea: 31, systolicBP: 148, diastolicBP: 92, urineACR: 120 },
          { date: monthsAgo(9), hba1c: 9.1, creatinine: 1.4, bloodUrea: 38, systolicBP: 150, diastolicBP: 94, urineACR: 180 },
          { date: monthsAgo(6), hba1c: 9.3, creatinine: 1.7, bloodUrea: 44, systolicBP: 152, diastolicBP: 95, urineACR: 250 },
          { date: monthsAgo(3), hba1c: 9.6, creatinine: 2.1, bloodUrea: 52, systolicBP: 155, diastolicBP: 96, urineACR: 320 }
        ]
      },
      {
        info: { fullName: 'Lakshmi Devi', age: 52, gender: 'Female', village: 'Gingee', phc: 'Villupuram PHC', diabetesDuration: 8, smokingStatus: false, bpHistory: true, phone: '9876543211' },
        visits: [
          { date: monthsAgo(12), hba1c: 7.8, creatinine: 1.1, bloodUrea: 24, systolicBP: 138, diastolicBP: 86, urineACR: 55 },
          { date: monthsAgo(9), hba1c: 7.9, creatinine: 1.2, bloodUrea: 28, systolicBP: 140, diastolicBP: 88, urineACR: 78 },
          { date: monthsAgo(6), hba1c: 8.1, creatinine: 1.3, bloodUrea: 32, systolicBP: 142, diastolicBP: 90, urineACR: 110 },
          { date: monthsAgo(3), hba1c: 8.3, creatinine: 1.4, bloodUrea: 36, systolicBP: 144, diastolicBP: 91, urineACR: 145 }
        ]
      },
      {
        info: { fullName: 'Murugan Selvam', age: 47, gender: 'Male', village: 'Tindivanam', phc: 'Villupuram PHC', diabetesDuration: 5, smokingStatus: false, bpHistory: false, phone: '9876543212' },
        visits: [
          { date: monthsAgo(9), hba1c: 7.4, creatinine: 0.9, bloodUrea: 18, systolicBP: 128, diastolicBP: 80, urineACR: 22 },
          { date: monthsAgo(6), hba1c: 7.6, creatinine: 1.0, bloodUrea: 20, systolicBP: 130, diastolicBP: 82, urineACR: 28 },
          { date: monthsAgo(3), hba1c: 7.8, creatinine: 1.1, bloodUrea: 22, systolicBP: 132, diastolicBP: 82, urineACR: 35 }
        ]
      },
      {
        info: { fullName: 'Saravanan Pillai', age: 45, gender: 'Male', village: 'Kallakurichi', phc: 'Villupuram PHC', diabetesDuration: 4, smokingStatus: false, bpHistory: false, phone: '9876543213' },
        visits: [
          { date: monthsAgo(12), hba1c: 6.8, creatinine: 0.8, bloodUrea: 14, systolicBP: 120, diastolicBP: 78, urineACR: 12 },
          { date: monthsAgo(9), hba1c: 6.9, creatinine: 0.8, bloodUrea: 15, systolicBP: 118, diastolicBP: 76, urineACR: 14 },
          { date: monthsAgo(6), hba1c: 7.0, creatinine: 0.9, bloodUrea: 15, systolicBP: 122, diastolicBP: 78, urineACR: 15 },
          { date: monthsAgo(3), hba1c: 6.7, creatinine: 0.8, bloodUrea: 14, systolicBP: 119, diastolicBP: 77, urineACR: 13 }
        ]
      },
      {
        info: { fullName: 'Kavitha Rangan', age: 62, gender: 'Female', village: 'Ulundurpettai', phc: 'Villupuram PHC', diabetesDuration: 15, smokingStatus: false, bpHistory: true, phone: '9876543214' },
        visits: [
          { date: monthsAgo(15), hba1c: 8.8, creatinine: 1.5, bloodUrea: 35, systolicBP: 155, diastolicBP: 95, urineACR: 200 },
          { date: monthsAgo(12), hba1c: 9.0, creatinine: 1.7, bloodUrea: 40, systolicBP: 158, diastolicBP: 96, urineACR: 280 },
          { date: monthsAgo(9), hba1c: 9.2, creatinine: 1.9, bloodUrea: 45, systolicBP: 160, diastolicBP: 98, urineACR: 350 },
          { date: monthsAgo(6), hba1c: 9.4, creatinine: 2.2, bloodUrea: 50, systolicBP: 162, diastolicBP: 98, urineACR: 420 },
          { date: monthsAgo(3), hba1c: 9.6, creatinine: 2.5, bloodUrea: 56, systolicBP: 165, diastolicBP: 100, urineACR: 500 }
        ]
      },
      {
        info: { fullName: 'Anand Krishnan', age: 55, gender: 'Male', village: 'Sankarapuram', phc: 'Villupuram PHC', diabetesDuration: 9, smokingStatus: true, bpHistory: true, phone: '9876543215' },
        visits: [
          { date: monthsAgo(6), hba1c: 8.0, creatinine: 1.2, bloodUrea: 25, systolicBP: 140, diastolicBP: 88, urineACR: 65 },
          { date: monthsAgo(3), hba1c: 8.2, creatinine: 1.3, bloodUrea: 28, systolicBP: 142, diastolicBP: 90, urineACR: 85 }
        ]
      },
      {
        info: { fullName: 'Meena Sundaram', age: 49, gender: 'Female', village: 'Arakandanallur', phc: 'Villupuram PHC', diabetesDuration: 6, smokingStatus: false, bpHistory: false, phone: '9876543216' },
        visits: [
          { date: monthsAgo(12), hba1c: 7.2, creatinine: 0.8, bloodUrea: 16, systolicBP: 125, diastolicBP: 80, urineACR: 18 },
          { date: monthsAgo(9), hba1c: 7.1, creatinine: 0.8, bloodUrea: 15, systolicBP: 124, diastolicBP: 78, urineACR: 16 },
          { date: monthsAgo(6), hba1c: 7.3, creatinine: 0.9, bloodUrea: 16, systolicBP: 126, diastolicBP: 80, urineACR: 20 },
          { date: monthsAgo(3), hba1c: 7.0, creatinine: 0.8, bloodUrea: 15, systolicBP: 122, diastolicBP: 78, urineACR: 17 },
          { date: monthsAgo(1), hba1c: 7.1, creatinine: 0.8, bloodUrea: 16, systolicBP: 124, diastolicBP: 79, urineACR: 18 }
        ]
      },
      {
        info: { fullName: 'Venkatesh Iyer', age: 60, gender: 'Male', village: 'Chinnasalem', phc: 'Villupuram PHC', diabetesDuration: 11, smokingStatus: true, bpHistory: true, phone: '9876543217' },
        visits: [
          { date: monthsAgo(9), hba1c: 8.5, creatinine: 1.3, bloodUrea: 30, systolicBP: 145, diastolicBP: 90, urineACR: 95 },
          { date: monthsAgo(6), hba1c: 8.7, creatinine: 1.4, bloodUrea: 34, systolicBP: 148, diastolicBP: 92, urineACR: 130 },
          { date: monthsAgo(3), hba1c: 8.9, creatinine: 1.6, bloodUrea: 38, systolicBP: 150, diastolicBP: 94, urineACR: 175 }
        ]
      }
    ];

    // Create patients and visits
    for (const patientData of patientsData) {
      const patient = await Patient.create({
        ...patientData.info,
        doctorId: doctor._id
      });

      const createdVisits = [];
      for (const visitData of patientData.visits) {
        const eGFR = calculateEGFR(visitData.creatinine, patientData.info.age, patientData.info.gender);
        const ckdStage = getCKDStage(eGFR);
        
        const visit = await Visit.create({
          patientId: patient._id,
          doctorId: doctor._id,
          visitDate: visitData.date,
          hba1c: visitData.hba1c,
          creatinine: visitData.creatinine,
          bloodUrea: visitData.bloodUrea,
          eGFR,
          systolicBP: visitData.systolicBP,
          diastolicBP: visitData.diastolicBP,
          urineACR: visitData.urineACR,
          ckdStageAtVisit: ckdStage,
          notes: ''
        });
        createdVisits.push(visit);
      }

      // Run prediction
      const prediction = predictCKDProgression(patient, createdVisits);
      
      // Update visit risk scores
      const lastVisit = createdVisits[createdVisits.length - 1];
      await Visit.findByIdAndUpdate(lastVisit._id, {
        riskScoreAtVisit: prediction.score,
        riskLevelAtVisit: prediction.level
      });

      // Update patient
      await Patient.findByIdAndUpdate(patient._id, {
        currentCKDStage: getCKDStage(lastVisit.eGFR),
        currentRiskLevel: prediction.level,
        currentRiskScore: prediction.score,
        lastVisitDate: lastVisit.visitDate,
        alertActive: prediction.level === 'High' || prediction.level === 'Critical'
      });

      // Create alert for high/critical patients
      if (prediction.level === 'High' || prediction.level === 'Critical') {
        await Alert.create({
          patientId: patient._id,
          doctorId: doctor._id,
          visitId: lastVisit._id,
          riskLevel: prediction.level,
          riskScore: prediction.score,
          explanation: prediction.explanation,
          recommendation: prediction.recommendation,
          read: false
        });
      }

      console.log(`  Created patient: ${patient.fullName} (${prediction.level} risk, score: ${prediction.score})`);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Export for use in server startup
module.exports = seedDatabase;

// Run directly if called from command line
if (require.main === module) {
  seedDatabase();
}
