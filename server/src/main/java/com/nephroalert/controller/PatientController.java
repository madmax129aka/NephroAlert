package com.nephroalert.controller;

import com.nephroalert.dto.*;
import com.nephroalert.entity.*;
import com.nephroalert.repository.*;
import com.nephroalert.service.PredictionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final AlertRepository alertRepository;
    private final PredictionService predictionService;

    public PatientController(PatientRepository patientRepository, VisitRepository visitRepository,
                             AlertRepository alertRepository, PredictionService predictionService) {
        this.patientRepository = patientRepository;
        this.visitRepository = visitRepository;
        this.alertRepository = alertRepository;
        this.predictionService = predictionService;
    }

    private Long getDoctorId(Authentication auth) {
        return ((Doctor) auth.getPrincipal()).getId();
    }

    // GET /api/patients
    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients(Authentication auth) {
        List<Patient> patients = patientRepository.findByDoctorIdOrderByLastVisitDateDesc(getDoctorId(auth));
        return ResponseEntity.ok(patients);
    }

    // POST /api/patients
    @PostMapping
    public ResponseEntity<?> createPatient(@Valid @RequestBody PatientRequest request, Authentication auth) {
        try {
            Patient patient = Patient.builder()
                    .doctorId(getDoctorId(auth))
                    .fullName(request.getFullName())
                    .age(request.getAge())
                    .gender(Patient.Gender.valueOf(request.getGender()))
                    .village(request.getVillage())
                    .phc(request.getPhc())
                    .diabetesDuration(request.getDiabetesDuration())
                    .smokingStatus(request.getSmokingStatus() != null ? request.getSmokingStatus() : false)
                    .bpHistory(request.getBpHistory() != null ? request.getBpHistory() : false)
                    .phone(request.getPhone() != null ? request.getPhone() : "")
                    .build();

            patient = patientRepository.save(patient);
            return ResponseEntity.status(HttpStatus.CREATED).body(patient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/patients/:id
    @GetMapping("/{id}")
    public ResponseEntity<?> getPatientDetail(@PathVariable Long id, Authentication auth) {
        Optional<Patient> patientOpt = patientRepository.findByIdAndDoctorId(id, getDoctorId(auth));
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));
        }

        Patient patient = patientOpt.get();
        List<Visit> visits = visitRepository.findByPatientIdOrderByVisitDateAsc(patient.getId());

        PredictionResult prediction = null;
        if (visits.size() >= 2) {
            prediction = predictionService.predictCKDProgression(patient, visits);
        }

        PatientDetailResponse response = PatientDetailResponse.builder()
                .patient(patient)
                .visits(visits)
                .prediction(prediction)
                .build();

        return ResponseEntity.ok(response);
    }

    // PUT /api/patients/:id
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePatient(@PathVariable Long id, @RequestBody PatientRequest request, Authentication auth) {
        Optional<Patient> patientOpt = patientRepository.findByIdAndDoctorId(id, getDoctorId(auth));
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));
        }

        Patient patient = patientOpt.get();
        if (request.getFullName() != null) patient.setFullName(request.getFullName());
        if (request.getAge() != null) patient.setAge(request.getAge());
        if (request.getGender() != null) patient.setGender(Patient.Gender.valueOf(request.getGender()));
        if (request.getVillage() != null) patient.setVillage(request.getVillage());
        if (request.getPhc() != null) patient.setPhc(request.getPhc());
        if (request.getDiabetesDuration() != null) patient.setDiabetesDuration(request.getDiabetesDuration());
        if (request.getSmokingStatus() != null) patient.setSmokingStatus(request.getSmokingStatus());
        if (request.getBpHistory() != null) patient.setBpHistory(request.getBpHistory());
        if (request.getPhone() != null) patient.setPhone(request.getPhone());

        patient = patientRepository.save(patient);
        return ResponseEntity.ok(patient);
    }

    // DELETE /api/patients/:id
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePatient(@PathVariable Long id, Authentication auth) {
        Optional<Patient> patientOpt = patientRepository.findByIdAndDoctorId(id, getDoctorId(auth));
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));
        }

        visitRepository.deleteByPatientId(id);
        alertRepository.deleteByPatientId(id);
        patientRepository.delete(patientOpt.get());

        return ResponseEntity.ok(Map.of("message", "Patient deleted successfully"));
    }

    // POST /api/patients/:id/visits — add visit + run prediction
    @PostMapping("/{id}/visits")
    @Transactional
    public ResponseEntity<?> addVisit(@PathVariable Long id, @Valid @RequestBody VisitRequest request, Authentication auth) {
        try {
            Long doctorId = getDoctorId(auth);
            Optional<Patient> patientOpt = patientRepository.findByIdAndDoctorId(id, doctorId);
            if (patientOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));
            }

            Patient patient = patientOpt.get();

            // Algorithm 2: Calculate eGFR
            int eGFR = predictionService.calculateEGFR(request.getCreatinine(), patient.getAge(), patient.getGender().name());
            int ckdStage = predictionService.getCKDStage(eGFR);

            // Create visit
            Visit visit = Visit.builder()
                    .patientId(patient.getId())
                    .doctorId(doctorId)
                    .visitDate(LocalDate.parse(request.getVisitDate()))
                    .hba1c(request.getHba1c())
                    .creatinine(request.getCreatinine())
                    .bloodUrea(request.getBloodUrea())
                    .eGFR(eGFR)
                    .systolicBP(request.getSystolicBP())
                    .diastolicBP(request.getDiastolicBP())
                    .urineACR(request.getUrineACR())
                    .ckdStageAtVisit(ckdStage)
                    .notes(request.getNotes() != null ? request.getNotes() : "")
                    .build();

            visit = visitRepository.save(visit);

            // Fetch all visits for prediction
            List<Visit> allVisits = visitRepository.findByPatientIdOrderByVisitDateAsc(patient.getId());

            // Algorithm 3+4: Run prediction
            PredictionResult prediction = predictionService.predictCKDProgression(patient, allVisits);

            // Update visit with prediction result
            visit.setRiskScoreAtVisit(prediction.getScore());
            visit.setRiskLevelAtVisit(prediction.getLevel());
            visitRepository.save(visit);

            // Track if risk increased
            String previousRiskLevel = patient.getCurrentRiskLevel().name();
            List<String> riskLevels = List.of("Low", "Moderate", "High", "Critical");
            boolean riskIncreased = riskLevels.indexOf(prediction.getLevel()) > riskLevels.indexOf(previousRiskLevel);

            // Update patient
            patient.setCurrentCKDStage(ckdStage);
            patient.setCurrentRiskLevel(Patient.RiskLevel.valueOf(prediction.getLevel()));
            patient.setCurrentRiskScore(prediction.getScore());
            patient.setLastVisitDate(LocalDate.parse(request.getVisitDate()));
            patient.setAlertActive("High".equals(prediction.getLevel()) || "Critical".equals(prediction.getLevel()));
            patientRepository.save(patient);

            // Create alert if risk is high/critical and increased
            if (("High".equals(prediction.getLevel()) || "Critical".equals(prediction.getLevel())) && riskIncreased) {
                Alert alert = Alert.builder()
                        .patientId(patient.getId())
                        .doctorId(doctorId)
                        .visitId(visit.getId())
                        .riskLevel(prediction.getLevel())
                        .riskScore(prediction.getScore())
                        .explanation(prediction.getExplanation())
                        .recommendation(prediction.getRecommendation())
                        .read(false)
                        .build();
                alertRepository.save(alert);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("visit", visit, "prediction", prediction));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/patients/:id/visits
    @GetMapping("/{id}/visits")
    public ResponseEntity<?> getVisits(@PathVariable Long id, Authentication auth) {
        Long doctorId = getDoctorId(auth);
        Optional<Patient> patientOpt = patientRepository.findByIdAndDoctorId(id, doctorId);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));
        }
        List<Visit> visits = visitRepository.findByPatientIdOrderByVisitDateAsc(id);
        return ResponseEntity.ok(visits);
    }
}
