package com.nephroalert.controller;

import com.nephroalert.entity.Alert;
import com.nephroalert.entity.Doctor;
import com.nephroalert.entity.Patient;
import com.nephroalert.repository.AlertRepository;
import com.nephroalert.repository.PatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;
    private final PatientRepository patientRepository;

    public AlertController(AlertRepository alertRepository, PatientRepository patientRepository) {
        this.alertRepository = alertRepository;
        this.patientRepository = patientRepository;
    }

    private Long getDoctorId(Authentication auth) {
        return ((Doctor) auth.getPrincipal()).getId();
    }

    // GET /api/alerts
    @GetMapping
    public ResponseEntity<?> getAlerts(Authentication auth) {
        List<Alert> alerts = alertRepository.findByDoctorIdOrderByCreatedAtDesc(getDoctorId(auth));

        // Enrich with patient info to match frontend expectations
        List<Map<String, Object>> enriched = alerts.stream().map(alert -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", alert.getId());
            map.put("patientId", buildPatientRef(alert.getPatientId()));
            map.put("doctorId", alert.getDoctorId());
            map.put("visitId", alert.getVisitId());
            map.put("riskLevel", alert.getRiskLevel());
            map.put("riskScore", alert.getRiskScore());
            map.put("explanation", alert.getExplanation());
            map.put("recommendation", alert.getRecommendation());
            map.put("read", alert.getRead());
            map.put("createdAt", alert.getCreatedAt() != null ? alert.getCreatedAt().toString() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(enriched);
    }

    // PUT /api/alerts/:id/read
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication auth) {
        Optional<Alert> alertOpt = alertRepository.findByIdAndDoctorId(id, getDoctorId(auth));
        if (alertOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Alert alert = alertOpt.get();
        alert.setRead(true);
        alertRepository.save(alert);
        return ResponseEntity.ok(alert);
    }

    // PUT /api/alerts/read-all
    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead(Authentication auth) {
        alertRepository.markAllAsRead(getDoctorId(auth));
        return ResponseEntity.ok(Map.of("message", "All alerts marked as read"));
    }

    private Map<String, Object> buildPatientRef(Long patientId) {
        Map<String, Object> ref = new LinkedHashMap<>();
        ref.put("_id", patientId);
        Optional<Patient> patientOpt = patientRepository.findById(patientId);
        if (patientOpt.isPresent()) {
            Patient p = patientOpt.get();
            ref.put("fullName", p.getFullName());
            ref.put("age", p.getAge());
            ref.put("gender", p.getGender().name());
            ref.put("village", p.getVillage());
        }
        return ref;
    }
}
