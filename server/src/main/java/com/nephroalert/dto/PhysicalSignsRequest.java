package com.nephroalert.dto;

import lombok.Data;

/**
 * Body for PUT /api/patients/{id}/physical-signs
 * Used by a doctor recording Stage 1 physical signs directly at the PHC.
 */
@Data
public class PhysicalSignsRequest {
    private String conjunctivalPallor; // None | Mild | Moderate | Severe
    private Integer pallourPoints;     // 0-3

    private String perioribitalOedema;
    private String oedemaPittingAnkle;
    private String foamyUrine;
    private String restlessLegs;
    private String nocturia;
    private String fatigue;

    private Integer symptomPoints;     // 0-14 (sum of the 6 questionnaire answers)
}
