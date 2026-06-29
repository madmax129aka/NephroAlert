package com.nephroalert.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "visits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false)
    private Double hba1c;

    @Column(nullable = false)
    private Double creatinine;

    @Column(nullable = false)
    private Double bloodUrea;

    @Column(nullable = false)
    private Integer eGFR;

    @Column(nullable = false)
    private Integer systolicBP;

    @Column(nullable = false)
    private Integer diastolicBP;

    @Column(nullable = false)
    private Double urineACR;

    private Integer ckdStageAtVisit;

    private Integer riskScoreAtVisit;

    private String riskLevelAtVisit;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
