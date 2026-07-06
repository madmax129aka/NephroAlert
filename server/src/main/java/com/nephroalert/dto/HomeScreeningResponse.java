package com.nephroalert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeScreeningResponse {
    private String screeningId;
    private String pallourLevel;
    private Integer pallourPoints;
    private Integer symptomPoints;
    private Integer stage1Score;
    private String stage1Level;
    private String colour;
    private String recommendationEn;
    private String recommendationTa;
    private Long linkedPatientId;
    private LocalDateTime createdAt;
}
