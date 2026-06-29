package com.nephroalert.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Designation designation;

    @Column(nullable = false)
    private String phcName;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    @Builder.Default
    private String state = "Tamil Nadu";

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String medicalRegNumber;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Designation {
        Doctor, Nurse, Health_Worker;

        public String getDisplayName() {
            return this.name().replace("_", " ");
        }
    }
}
