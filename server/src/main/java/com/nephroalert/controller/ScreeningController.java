package com.nephroalert.controller;

import com.nephroalert.dto.HomeScreeningRequest;
import com.nephroalert.dto.HomeScreeningResponse;
import com.nephroalert.entity.HomeScreening;
import com.nephroalert.entity.Patient;
import com.nephroalert.repository.HomeScreeningRepository;
import com.nephroalert.repository.PatientRepository;
import com.nephroalert.service.Stage1ScoringService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Stage 1 — Home Eye Screening endpoints.
 *
 * POST /api/screening/home is PUBLIC (no auth) — this is the anonymous
 * home-screening submission endpoint used by the public /eye-scan page
 * so patients without an account can screen themselves.
 *
 * All other routes require auth — a doctor at the PHC looks up a
 * screeningId when the patient arrives and links it to a patient record.
 */
@RestController
@RequestMapping("/api/screening")
public class ScreeningController {

    private final HomeScreeningRepository homeScreeningRepository;
    private final PatientRepository patientRepository;
    private final Stage1ScoringService stage1ScoringService;

    public ScreeningController(HomeScreeningRepository homeScreeningRepository,
                                PatientRepository patientRepository,
                                Stage1ScoringService stage1ScoringService) {
        this.homeScreeningRepository = homeScreeningRepository;
        this.patientRepository = patientRepository;
        this.stage1ScoringService = stage1ScoringService;
    }

    // POST /api/screening/home — PUBLIC, no auth required
    @PostMapping("/home")
    public ResponseEntity<?> submitHomeScreening(@Valid @RequestBody HomeScreeningRequest request) {
        try {
            int pallourPoints = request.getPallourPoints();
            int symptomPoints = request.getSymptomPoints();

            // Server independently recomputes the score — never trust the
            // client alone on a public, unauthenticated endpoint.
            int stage1Score = stage1ScoringService.calculateStage1Score(pallourPoints, symptomPoints);
            String stage1Level = stage1ScoringService.getStage1Level(stage1Score);

            HomeScreening screening = HomeScreening.builder()
                    .screeningId("NS" + System.currentTimeMillis())
                    .pallourLevel(request.getPallourLevel())
                    .pallourPoints(pallourPoints)
                    .symptomPoints(symptomPoints)
                    .stage1Score(stage1Score)
                    .stage1Level(stage1Level)
                    .build();

            screening = homeScreeningRepository.save(screening);

            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(screening));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/screening/home — auth required (admin screenings list)
    @GetMapping("/home")
    public ResponseEntity<List<HomeScreeningResponse>> listHomeScreenings() {
        List<HomeScreeningResponse> results = homeScreeningRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    // GET /api/screening/home/:screeningId — auth required, doctor lookup at PHC
    @GetMapping("/home/{screeningId}")
    public ResponseEntity<?> getHomeScreening(@PathVariable String screeningId) {
        Optional<HomeScreening> screeningOpt = homeScreeningRepository.findByScreeningId(screeningId);
        if (screeningOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Screening ID not found"));
        }
        return ResponseEntity.ok(toResponse(screeningOpt.get()));
    }

    // PUT /api/screening/home/:screeningId/link/:patientId — auth required
    // Doctor links an anonymous home screening to a known patient record,
    // copying the Stage 1 result into the patient's physicalSigns fields.
    @PutMapping("/home/{screeningId}/link/{patientId}")
    @Transactional
    public ResponseEntity<?> linkToPatient(@PathVariable String screeningId, @PathVariable Long patientId) {
        Optional<HomeScreening> screeningOpt = homeScreeningRepository.findByScreeningId(screeningId);
        if (screeningOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Screening ID not found"));
        }
        Optional<Patient> patientOpt = patientRepository.findById(patientId);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));
        }

        HomeScreening screening = screeningOpt.get();
        Patient patient = patientOpt.get();

        if (screening.getPallourLevel() != null) {
            patient.setConjunctivalPallor(Patient.ConjunctivalPallor.valueOf(screening.getPallourLevel()));
        }
        patient.setPallourPoints(screening.getPallourPoints());
        patient.setSymptomPoints(screening.getSymptomPoints());
        patient.setStage1Score(screening.getStage1Score());
        patient.setStage1Level(screening.getStage1Level());
        patient.setStage1RecordedAt(LocalDateTime.now());
        patientRepository.save(patient);

        screening.setLinkedPatientId(patient.getId());
        screening.setLinkedAt(LocalDateTime.now());
        homeScreeningRepository.save(screening);

        return ResponseEntity.ok(Map.of(
                "message", "Screening linked to patient successfully",
                "patient", patient,
                "screening", toResponse(screening)
        ));
    }

    private HomeScreeningResponse toResponse(HomeScreening s) {
        String level = s.getStage1Level();
        return HomeScreeningResponse.builder()
                .screeningId(s.getScreeningId())
                .pallourLevel(s.getPallourLevel())
                .pallourPoints(s.getPallourPoints())
                .symptomPoints(s.getSymptomPoints())
                .stage1Score(s.getStage1Score())
                .stage1Level(level)
                .colour(stage1ScoringService.getColour(level))
                .recommendationEn(stage1ScoringService.getRecommendationEn(level))
                .recommendationTa(stage1ScoringService.getRecommendationTa(level))
                .linkedPatientId(s.getLinkedPatientId())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
