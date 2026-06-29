package com.nephroalert.repository;

import com.nephroalert.entity.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    List<Visit> findByPatientIdOrderByVisitDateAsc(Long patientId);
    List<Visit> findByPatientIdAndDoctorIdOrderByVisitDateAsc(Long patientId, Long doctorId);
    long countByDoctorIdAndVisitDateGreaterThanEqual(Long doctorId, LocalDate startDate);
    void deleteByPatientId(Long patientId);
}
