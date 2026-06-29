package com.nephroalert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResult {
    private int score;
    private String level;
    private String recommendation;
    private List<String> factors;
    private String explanation;
    private int confidence;
}
