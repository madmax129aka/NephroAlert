package com.nephroalert.repository;

import com.nephroalert.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByDoctorIdOrderByLastVisitDateDesc(Long doctorId);
    Optional<Patient> findByIdAndDoctorId(Long id, Long doctorId);
    long countByDoctorId(Long doctorId);
    long countByDoctorIdAndCurrentRiskLevel(Long doctorId, Patient.RiskLevel riskLevel);
    List<Patient> findTop5ByDoctorIdOrderByLastVisitDateDesc(Long doctorId);
    void deleteByIdAndDoctorId(Long id, Long doctorId);
}
