package com.nephroalert.dto;

import com.nephroalert.entity.Patient;
import com.nephroalert.entity.Visit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDetailResponse {
    private Patient patient;
    private List<Visit> visits;
    private PredictionResult prediction;
}
