package com.nephroalert.controller;

import com.nephroalert.dto.DashboardResponse;
import com.nephroalert.entity.Alert;
import com.nephroalert.entity.Doctor;
import com.nephroalert.entity.Patient;
import com.nephroalert.repository.AlertRepository;
import com.nephroalert.repository.PatientRepository;
import com.nephroalert.repository.VisitRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final AlertRepository alertRepository;

    public DashboardController(PatientRepository patientRepository, VisitRepository visitRepository, AlertRepository alertRepository) {
        this.patientRepository = patientRepository;
        this.visitRepository = visitRepository;
        this.alertRepository = alertRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardResponse> getStats(Authentication auth) {
        Long doctorId = ((Doctor) auth.getPrincipal()).getId();

        long totalPatients = patientRepository.countByDoctorId(doctorId);

        Map<String, Long> riskBreakdown = new LinkedHashMap<>();
        riskBreakdown.put("Low", patientRepository.countByDoctorIdAndCurrentRiskLevel(doctorId, Patient.RiskLevel.Low));
        riskBreakdown.put("Moderate", patientRepository.countByDoctorIdAndCurrentRiskLevel(doctorId, Patient.RiskLevel.Moderate));
        riskBreakdown.put("High", patientRepository.countByDoctorIdAndCurrentRiskLevel(doctorId, Patient.RiskLevel.High));
        riskBreakdown.put("Critical", patientRepository.countByDoctorIdAndCurrentRiskLevel(doctorId, Patient.RiskLevel.Critical));

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        long visitsThisMonth = visitRepository.countByDoctorIdAndVisitDateGreaterThanEqual(doctorId, startOfMonth);

        long activeAlerts = alertRepository.countByDoctorIdAndReadFalse(doctorId);

        List<Alert> recentAlertEntities = alertRepository.findTop5ByDoctorIdOrderByCreatedAtDesc(doctorId);
        List<DashboardResponse.AlertSummary> recentAlerts = recentAlertEntities.stream().map(a -> {
            String patientName = "Unknown";
            Long patientId = a.getPatientId();
            var patientOpt = patientRepository.findById(a.getPatientId());
            if (patientOpt.isPresent()) {
                patientName = patientOpt.get().getFullName();
            }
            return DashboardResponse.AlertSummary.builder()
                    ._id(a.getId())
                    .patientName(patientName)
                    .patientId(patientId)
                    .riskLevel(a.getRiskLevel())
                    .riskScore(a.getRiskScore())
                    .explanation(a.getExplanation())
                    .createdAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : "")
                    .read(a.getRead())
                    .build();
        }).collect(Collectors.toList());

        List<Patient> recentPatientEntities = patientRepository.findTop5ByDoctorIdOrderByLastVisitDateDesc(doctorId);
        List<Object> recentPatients = recentPatientEntities.stream().map(p -> (Object) p).collect(Collectors.toList());

        DashboardResponse response = DashboardResponse.builder()
                .totalPatients(totalPatients)
                .riskBreakdown(riskBreakdown)
                .visitsThisMonth(visitsThisMonth)
                .activeAlerts(activeAlerts)
                .recentAlerts(recentAlerts)
                .recentPatients(recentPatients)
                .build();

        return ResponseEntity.ok(response);
    }
}
