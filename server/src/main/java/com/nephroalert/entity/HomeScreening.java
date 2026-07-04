package com.nephroalert.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stage 1 — Anonymous home eye screening record.
 * Patients complete the eye scan + symptom questionnaire at home
 * (no login required) and are given a screeningId. A doctor at the
 * PHC can later look up that screeningId and link it to a Patient
 * record via HomeScreeningController.
 *
 * This is an ADDITIVE feature — it does not touch the existing
 * Patient/Visit/Alert Stage 2 blood-test tables or logic.
 */
@Entity
@Table(name = "home_screenings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeScreening {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String screeningId;

    private String pallourLevel;

    @Builder.Default
    private Integer pallourPoints = 0;

    @Builder.Default
    private Integer symptomPoints = 0;

    private Integer stage1Score;

    private String stage1Level;

    /**
     * Set once a doctor links this anonymous screening to a known patient.
     */
    private Long linkedPatientId;

    private LocalDateTime linkedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
