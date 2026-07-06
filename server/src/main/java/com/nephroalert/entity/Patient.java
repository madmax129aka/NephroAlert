package com.nephroalert.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(nullable = false)
    private String village;

    @Column(nullable = false)
    private String phc;

    @Column(nullable = false)
    private Integer diabetesDuration;

    @Builder.Default
    private Boolean smokingStatus = false;

    @Builder.Default
    private Boolean bpHistory = false;

    private String phone;

    private Integer currentCKDStage;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskLevel currentRiskLevel = RiskLevel.Low;

    @Builder.Default
    private Integer currentRiskScore = 0;

    private LocalDate lastVisitDate;

    @Builder.Default
    private Boolean alertActive = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ==========================================================
    // Stage 1 — Home Eye Screening + Physical Sign Scoring
    // ADDITIVE ONLY. Recorded by a doctor at the PHC (or copied
    // over from a linked anonymous HomeScreening record).
    // Does not affect any existing Stage 2 blood test fields
    // or scoring logic above.
    // ==========================================================

    @Enumerated(EnumType.STRING)
    private ConjunctivalPallor conjunctivalPallor;

    @Builder.Default
    private Integer pallourPoints = 0;

    private String perioribitalOedema;

    private String oedemaPittingAnkle;

    private String foamyUrine;

    private String restlessLegs;

    private String nocturia;

    private String fatigue;

    @Builder.Default
    private Integer symptomPoints = 0;

    private Integer stage1Score;

    private String stage1Level;

    private LocalDateTime stage1RecordedAt;

    public enum Gender {
        Male, Female, Other
    }

    public enum RiskLevel {
        Low, Moderate, High, Critical
    }

    public enum ConjunctivalPallor {
        None, Mild, Moderate, Severe
    }
}
