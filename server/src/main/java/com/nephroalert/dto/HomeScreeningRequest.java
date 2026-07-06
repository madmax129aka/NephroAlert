package com.nephroalert.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Body for POST /api/screening/home (PUBLIC — no auth required).
 * Submitted by a patient completing the eye scan + symptom
 * questionnaire at home in the browser. The client sends the
 * points it computed; the server independently recomputes the
 * score/level so nothing sensitive relies on a client-side value.
 */
@Data
public class HomeScreeningRequest {

    @NotNull(message = "Pallour level is required")
    private String pallourLevel; // None | Mild | Moderate | Severe

    @NotNull(message = "Pallour points is required")
    @Min(value = 0, message = "Pallour points must be non-negative")
    private Integer pallourPoints; // 0-3

    @NotNull(message = "Symptom points is required")
    @Min(value = 0, message = "Symptom points must be non-negative")
    private Integer symptomPoints; // 0-14
}
