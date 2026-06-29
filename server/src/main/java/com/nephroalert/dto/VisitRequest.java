package com.nephroalert.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VisitRequest {
    @NotBlank(message = "Visit date is required")
    private String visitDate;

    @NotNull(message = "HbA1c is required")
    @DecimalMin(value = "3.0", message = "HbA1c must be at least 3.0")
    @DecimalMax(value = "20.0", message = "HbA1c must be at most 20.0")
    private Double hba1c;

    @NotNull(message = "Creatinine is required")
    @DecimalMin(value = "0.1", message = "Creatinine must be at least 0.1")
    @DecimalMax(value = "30.0", message = "Creatinine must be at most 30.0")
    private Double creatinine;

    @NotNull(message = "Blood urea is required")
    @DecimalMin(value = "1.0", message = "Blood urea must be at least 1.0")
    @DecimalMax(value = "300.0", message = "Blood urea must be at most 300.0")
    private Double bloodUrea;

    @NotNull(message = "Systolic BP is required")
    @Min(value = 60, message = "Systolic BP must be at least 60")
    @Max(value = 300, message = "Systolic BP must be at most 300")
    private Integer systolicBP;

    @NotNull(message = "Diastolic BP is required")
    @Min(value = 30, message = "Diastolic BP must be at least 30")
    @Max(value = 200, message = "Diastolic BP must be at most 200")
    private Integer diastolicBP;

    @NotNull(message = "Urine ACR is required")
    @DecimalMin(value = "0.0", message = "Urine ACR must be non-negative")
    @DecimalMax(value = "10000.0", message = "Urine ACR must be at most 10000")
    private Double urineACR;

    private String notes;
}
