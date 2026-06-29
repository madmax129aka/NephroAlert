package com.nephroalert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private long totalPatients;
    private Map<String, Long> riskBreakdown;
    private long visitsThisMonth;
    private long activeAlerts;
    private List<AlertSummary> recentAlerts;
    private List<Object> recentPatients;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertSummary {
        private Long _id;
        private String patientName;
        private Long patientId;
        private String riskLevel;
        private Integer riskScore;
        private String explanation;
        private String createdAt;
        private Boolean read;
    }
}
