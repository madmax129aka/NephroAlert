package com.nephroalert.repository;

import com.nephroalert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    long countByDoctorIdAndReadFalse(Long doctorId);
    List<Alert> findTop5ByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    Optional<Alert> findByIdAndDoctorId(Long id, Long doctorId);
    void deleteByPatientId(Long patientId);

    @Modifying
    @Query("UPDATE Alert a SET a.read = true WHERE a.doctorId = :doctorId AND a.read = false")
    void markAllAsRead(Long doctorId);
}
