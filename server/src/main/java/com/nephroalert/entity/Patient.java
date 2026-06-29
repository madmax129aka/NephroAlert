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

    public enum Gender {
        Male, Female, Other
    }

    public enum RiskLevel {
        Low, Moderate, High, Critical
    }
}
