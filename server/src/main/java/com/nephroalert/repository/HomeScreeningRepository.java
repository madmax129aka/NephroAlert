package com.nephroalert.repository;

import com.nephroalert.entity.HomeScreening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HomeScreeningRepository extends JpaRepository<HomeScreening, Long> {
    Optional<HomeScreening> findByScreeningId(String screeningId);

    List<HomeScreening> findAllByOrderByCreatedAtDesc();

    long countByCreatedAtGreaterThanEqual(LocalDateTime start);

    List<HomeScreening> findByLinkedPatientIdIsNullAndStage1LevelInAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            List<String> levels, LocalDateTime since);
}
