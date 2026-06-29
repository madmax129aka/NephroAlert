package com.nephroalert.config;

import com.nephroalert.dto.PredictionResult;
import com.nephroalert.entity.*;
import com.nephroalert.repository.*;
import com.nephroalert.service.PredictionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final AlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;
    private final PredictionService predictionService;

    public DataSeeder(DoctorRepository doctorRepository, PatientRepository patientRepository,
                      VisitRepository visitRepository, AlertRepository alertRepository,
                      PasswordEncoder passwordEncoder, PredictionService predictionService) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.visitRepository = visitRepository;
        this.alertRepository = alertRepository;
        this.passwordEncoder = passwordEncoder;
        this.predictionService = predictionService;
    }

    @Override
    public void run(String... args) {
        if (doctorRepository.count() > 0) {
            log.info("Database already seeded. Skipping...");
            return;
        }

        log.info("Empty database detected. Seeding...");

        // Create Demo Doctor
        Doctor doctor = Doctor.builder()
                .fullName("Dr. Priya Ramesh")
                .designation(Doctor.Designation.Doctor)
                .phcName("Villupuram PHC")
                .district("Villupuram")
                .state("Tamil Nadu")
                .email("demo@nephroalert.com")
                .passwordHash(passwordEncoder.encode("Demo@123"))
                .medicalRegNumber("TN-MED-2019-4521")
                .build();
        doctor = doctorRepository.save(doctor);
        log.info("Demo doctor created: {}", doctor.getEmail());

        // Seed patients
        seedPatient1(doctor.getId());
        seedPatient2(doctor.getId());
        seedPatient3(doctor.getId());
        seedPatient4(doctor.getId());
        seedPatient5(doctor.getId());
        seedPatient6(doctor.getId());
        seedPatient7(doctor.getId());
        seedPatient8(doctor.getId());

        log.info("Database seeded successfully!");
    }

    private void seedPatient1(Long doctorId) {
        // Critical — 6 visits showing rapid decline
        Patient patient = createPatient(doctorId, "Rajesh Kumar", 58, "Male", "Thiruvannamalai", 12, true, true);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 18, 8.2, 0.9, 22.0, 142, 88, 45.0));
        visits.add(createVisit(patient, doctorId, 15, 8.5, 1.0, 26.0, 145, 90, 68.0));
        visits.add(createVisit(patient, doctorId, 12, 8.8, 1.2, 31.0, 148, 92, 120.0));
        visits.add(createVisit(patient, doctorId, 9, 9.1, 1.4, 38.0, 150, 94, 180.0));
        visits.add(createVisit(patient, doctorId, 6, 9.3, 1.7, 44.0, 152, 95, 250.0));
        visits.add(createVisit(patient, doctorId, 3, 9.6, 2.1, 52.0, 155, 96, 320.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient2(Long doctorId) {
        // High — 4 visits, moderate decline
        Patient patient = createPatient(doctorId, "Lakshmi Devi", 52, "Female", "Gingee", 8, false, true);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 12, 7.8, 1.1, 24.0, 138, 86, 55.0));
        visits.add(createVisit(patient, doctorId, 9, 7.9, 1.2, 28.0, 140, 88, 78.0));
        visits.add(createVisit(patient, doctorId, 6, 8.1, 1.3, 32.0, 142, 90, 110.0));
        visits.add(createVisit(patient, doctorId, 3, 8.3, 1.4, 36.0, 144, 91, 145.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient3(Long doctorId) {
        // Moderate — 3 visits, early warning signs
        Patient patient = createPatient(doctorId, "Murugan Selvam", 47, "Male", "Tindivanam", 5, false, false);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 9, 7.4, 0.9, 18.0, 128, 80, 22.0));
        visits.add(createVisit(patient, doctorId, 6, 7.6, 1.0, 20.0, 130, 82, 28.0));
        visits.add(createVisit(patient, doctorId, 3, 7.8, 1.1, 22.0, 132, 82, 35.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient4(Long doctorId) {
        // Low — 4 visits, stable
        Patient patient = createPatient(doctorId, "Saravanan Pillai", 45, "Male", "Kallakurichi", 4, false, false);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 12, 6.8, 0.8, 14.0, 120, 78, 12.0));
        visits.add(createVisit(patient, doctorId, 9, 6.9, 0.8, 15.0, 118, 76, 14.0));
        visits.add(createVisit(patient, doctorId, 6, 7.0, 0.9, 15.0, 122, 78, 15.0));
        visits.add(createVisit(patient, doctorId, 3, 6.7, 0.8, 14.0, 119, 77, 13.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient5(Long doctorId) {
        // Critical — 5 visits, severe decline
        Patient patient = createPatient(doctorId, "Kavitha Rangan", 62, "Female", "Ulundurpettai", 15, false, true);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 15, 8.8, 1.5, 35.0, 155, 95, 200.0));
        visits.add(createVisit(patient, doctorId, 12, 9.0, 1.7, 40.0, 158, 96, 280.0));
        visits.add(createVisit(patient, doctorId, 9, 9.2, 1.9, 45.0, 160, 98, 350.0));
        visits.add(createVisit(patient, doctorId, 6, 9.4, 2.2, 50.0, 162, 98, 420.0));
        visits.add(createVisit(patient, doctorId, 3, 9.6, 2.5, 56.0, 165, 100, 500.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient6(Long doctorId) {
        // Moderate — 2 visits
        Patient patient = createPatient(doctorId, "Anand Krishnan", 55, "Male", "Sankarapuram", 9, true, true);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 6, 8.0, 1.2, 25.0, 140, 88, 65.0));
        visits.add(createVisit(patient, doctorId, 3, 8.2, 1.3, 28.0, 142, 90, 85.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient7(Long doctorId) {
        // Low — 5 visits, stable
        Patient patient = createPatient(doctorId, "Meena Sundaram", 49, "Female", "Arakandanallur", 6, false, false);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 12, 7.2, 0.8, 16.0, 125, 80, 18.0));
        visits.add(createVisit(patient, doctorId, 9, 7.1, 0.8, 15.0, 124, 78, 16.0));
        visits.add(createVisit(patient, doctorId, 6, 7.3, 0.9, 16.0, 126, 80, 20.0));
        visits.add(createVisit(patient, doctorId, 3, 7.0, 0.8, 15.0, 122, 78, 17.0));
        visits.add(createVisit(patient, doctorId, 1, 7.1, 0.8, 16.0, 124, 79, 18.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    private void seedPatient8(Long doctorId) {
        // High — 3 visits, concerning trajectory
        Patient patient = createPatient(doctorId, "Venkatesh Iyer", 60, "Male", "Chinnasalem", 11, true, true);
        List<Visit> visits = new ArrayList<>();
        visits.add(createVisit(patient, doctorId, 9, 8.5, 1.3, 30.0, 145, 90, 95.0));
        visits.add(createVisit(patient, doctorId, 6, 8.7, 1.4, 34.0, 148, 92, 130.0));
        visits.add(createVisit(patient, doctorId, 3, 8.9, 1.6, 38.0, 150, 94, 175.0));
        runPredictionAndUpdate(patient, visits, doctorId);
    }

    // ========== Helper Methods ==========

    private Patient createPatient(Long doctorId, String name, int age, String gender, String village,
                                  int diabetesDuration, boolean smoking, boolean bp) {
        Patient patient = Patient.builder()
                .doctorId(doctorId)
                .fullName(name)
                .age(age)
                .gender(Patient.Gender.valueOf(gender))
                .village(village)
                .phc("Villupuram PHC")
                .diabetesDuration(diabetesDuration)
                .smokingStatus(smoking)
                .bpHistory(bp)
                .phone("")
                .build();
        return patientRepository.save(patient);
    }

    private Visit createVisit(Patient patient, Long doctorId, int monthsAgo,
                              double hba1c, double creatinine, double bloodUrea,
                              int systolicBP, int diastolicBP, double urineACR) {
        int eGFR = predictionService.calculateEGFR(creatinine, patient.getAge(), patient.getGender().name());
        int ckdStage = predictionService.getCKDStage(eGFR);

        Visit visit = Visit.builder()
                .patientId(patient.getId())
                .doctorId(doctorId)
                .visitDate(LocalDate.now().minusMonths(monthsAgo))
                .hba1c(hba1c)
                .creatinine(creatinine)
                .bloodUrea(bloodUrea)
                .eGFR(eGFR)
                .systolicBP(systolicBP)
                .diastolicBP(diastolicBP)
                .urineACR(urineACR)
                .ckdStageAtVisit(ckdStage)
                .notes("")
                .build();

        return visitRepository.save(visit);
    }

    private void runPredictionAndUpdate(Patient patient, List<Visit> visits, Long doctorId) {
        PredictionResult prediction = predictionService.predictCKDProgression(patient, visits);

        // Update last visit with prediction
        Visit lastVisit = visits.get(visits.size() - 1);
        lastVisit.setRiskScoreAtVisit(prediction.getScore());
        lastVisit.setRiskLevelAtVisit(prediction.getLevel());
        visitRepository.save(lastVisit);

        // Update patient
        patient.setCurrentCKDStage(predictionService.getCKDStage(lastVisit.getEGFR()));
        patient.setCurrentRiskLevel(Patient.RiskLevel.valueOf(prediction.getLevel()));
        patient.setCurrentRiskScore(prediction.getScore());
        patient.setLastVisitDate(lastVisit.getVisitDate());
        patient.setAlertActive("High".equals(prediction.getLevel()) || "Critical".equals(prediction.getLevel()));
        patientRepository.save(patient);

        // Create alert for high/critical patients
        if ("High".equals(prediction.getLevel()) || "Critical".equals(prediction.getLevel())) {
            Alert alert = Alert.builder()
                    .patientId(patient.getId())
                    .doctorId(doctorId)
                    .visitId(lastVisit.getId())
                    .riskLevel(prediction.getLevel())
                    .riskScore(prediction.getScore())
                    .explanation(prediction.getExplanation())
                    .recommendation(prediction.getRecommendation())
                    .read(false)
                    .build();
            alertRepository.save(alert);
        }

        log.info("  Created patient: {} ({} risk, score: {})", patient.getFullName(), prediction.getLevel(), prediction.getScore());
    }
}
