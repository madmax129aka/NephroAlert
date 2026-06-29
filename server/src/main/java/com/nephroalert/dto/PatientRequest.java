package com.nephroalert.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PatientRequest {
    @NotBlank(message = "Patient name is required")
    private String fullName;

    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotBlank(message = "Village is required")
    private String village;

    @NotBlank(message = "PHC is required")
    private String phc;

    @NotNull(message = "Diabetes duration is required")
    @Min(value = 0, message = "Diabetes duration must be non-negative")
    private Integer diabetesDuration;

    private Boolean smokingStatus = false;
    private Boolean bpHistory = false;
    private String phone;
}
