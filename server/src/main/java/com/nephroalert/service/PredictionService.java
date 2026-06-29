package com.nephroalert.service;

import com.nephroalert.dto.PredictionResult;
import com.nephroalert.entity.Patient;
import com.nephroalert.entity.Visit;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * NephroAlert CKD Progression Prediction Service
 * ML-powered prediction using rule-based scoring derived from clinical research.
 * 
 * Algorithms:
 * 1. Linear Regression Slope — trend direction & speed
 * 2. CKD-EPI 2021 eGFR Calculation — kidney function from creatinine
 * 3. Multi-factor Scoring System — weighted risk assessment
 * 4. Percentage Change Analysis — biomarker trajectory detection
 */
@Service
public class PredictionService {

    // ========================
    // Algorithm 1: Linear Regression Slope
    // ========================
    public double linearRegressionSlope(List<Double> values) {
        int n = values.size();
        if (n < 2) return 0.0;

        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += values.get(i);
            sumXY += i * values.get(i);
            sumX2 += (double) i * i;
        }

        double denominator = n * sumX2 - sumX * sumX;
        if (denominator == 0) return 0.0;
        return (n * sumXY - sumX * sumY) / denominator;
    }

    // ========================
    // Algorithm 2: CKD-EPI 2021 eGFR Calculation
    // ========================
    public int calculateEGFR(double creatinine, int age, String gender) {
        double kappa = gender.equals("Female") ? 0.7 : 0.9;
        double alpha = gender.equals("Female") ? -0.241 : -0.302;
        double crRatio = creatinine / kappa;

        double eGFR;
        if (crRatio < 1) {
            eGFR = 142 * Math.pow(crRatio, alpha) * Math.pow(0.9938, age);
        } else {
            eGFR = 142 * Math.pow(crRatio, -1.200) * Math.pow(0.9938, age);
        }
        if (gender.equals("Female")) {
            eGFR *= 1.012;
        }

        return (int) Math.round(eGFR);
    }

    // ========================
    // CKD Stage from eGFR
    // ========================
    public int getCKDStage(int eGFR) {
        if (eGFR >= 90) return 1;
        if (eGFR >= 60) return 2;
        if (eGFR >= 45) return 3;
        if (eGFR >= 30) return 3;
        if (eGFR >= 15) return 4;
        return 5;
    }

    public String getCKDStageLabel(int eGFR) {
        if (eGFR >= 90) return "Stage 1";
        if (eGFR >= 60) return "Stage 2";
        if (eGFR >= 45) return "Stage 3a";
        if (eGFR >= 30) return "Stage 3b";
        if (eGFR >= 15) return "Stage 4";
        return "Stage 5";
    }

    public String getCKDStageDescription(int eGFR) {
        if (eGFR >= 90) return "Kidney damage with normal function";
        if (eGFR >= 60) return "Mildly reduced";
        if (eGFR >= 45) return "Mildly to moderately reduced";
        if (eGFR >= 30) return "Moderately to severely reduced";
        if (eGFR >= 15) return "Severely reduced";
        return "Kidney failure";
    }

    // ========================
    // Confidence calculation
    // ========================
    public int calculateConfidence(int visitCount) {
        if (visitCount >= 6) return 92;
        if (visitCount >= 4) return 80;
        if (visitCount >= 3) return 68;
        return 55;
    }

    // ========================
    // Algorithm 3 + 4: Main Prediction (Scoring System + % Change Analysis)
    // ========================
    public PredictionResult predictCKDProgression(Patient patient, List<Visit> allVisits) {
        if (allVisits == null || allVisits.size() < 2) {
            return PredictionResult.builder()
                    .score(10)
                    .level("Low")
                    .recommendation("Continue routine monitoring every 3 months.")
                    .factors(new ArrayList<>())
                    .explanation("Insufficient visit history for trend analysis. At least 2 visits are needed for pattern detection. Continue monitoring.")
                    .confidence(55)
                    .build();
        }

        // Sort visits by date ascending
        List<Visit> visits = allVisits.stream()
                .sorted(Comparator.comparing(Visit::getVisitDate))
                .toList();

        // Extract biomarker arrays
        List<Double> eGFRValues = visits.stream().map(v -> (double) v.getEGFR()).toList();
        List<Double> creatinineValues = visits.stream().map(Visit::getCreatinine).toList();
        List<Double> hba1cValues = visits.stream().map(Visit::getHba1c).toList();
        List<Double> acrValues = visits.stream().map(Visit::getUrineACR).toList();
        List<Double> bpValues = visits.stream().map(v -> (double) v.getSystolicBP()).toList();

        // Algorithm 1: Calculate slopes
        double eGFRSlope = linearRegressionSlope(eGFRValues);
        double creatinineSlope = linearRegressionSlope(creatinineValues);

        // Algorithm 4: Calculate percentage changes
        double firstEGFR = eGFRValues.get(0);
        double lastEGFR = eGFRValues.get(eGFRValues.size() - 1);
        double eGFRPctChange = ((lastEGFR - firstEGFR) / firstEGFR) * 100;

        double firstCr = creatinineValues.get(0);
        double lastCr = creatinineValues.get(creatinineValues.size() - 1);
        double creatininePctChange = ((lastCr - firstCr) / firstCr) * 100;

        double hba1cAvg = hba1cValues.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double acrLatest = acrValues.get(acrValues.size() - 1);
        double bpAvg = bpValues.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        int latestEGFR = (int) lastEGFR;

        // Algorithm 3: Multi-factor scoring system
        int score = 0;
        List<String> factors = new ArrayList<>();

        // Factor 1: eGFR absolute level (0-20 points)
        int eGFRScore;
        if (latestEGFR >= 90) eGFRScore = 0;
        else if (latestEGFR >= 60) eGFRScore = 10;
        else if (latestEGFR >= 45) eGFRScore = 14;
        else if (latestEGFR >= 30) eGFRScore = 17;
        else if (latestEGFR >= 15) eGFRScore = 19;
        else eGFRScore = 20;
        score += eGFRScore;
        if (eGFRScore >= 14) factors.add("eGFR at " + latestEGFR + " indicates reduced kidney function");

        // Factor 2: eGFR decline rate (0-20 points)
        int slopeScore;
        if (eGFRPctChange > -10) {
            slopeScore = 0;
        } else if (eGFRPctChange > -25) {
            slopeScore = 8;
            factors.add("eGFR declining moderately");
        } else if (eGFRPctChange > -40) {
            slopeScore = 14;
            factors.add("eGFR declining significantly");
        } else {
            slopeScore = 20;
            factors.add("Rapid eGFR decline detected");
        }
        score += slopeScore;

        // Factor 3: Creatinine rise (0-20 points)
        int crScore;
        if (creatininePctChange < 20) {
            crScore = 0;
        } else if (creatininePctChange < 50) {
            crScore = 8;
            factors.add("Creatinine rising");
        } else if (creatininePctChange < 100) {
            crScore = 14;
            factors.add("Creatinine significantly elevated");
        } else {
            crScore = 20;
            factors.add("Creatinine doubled — serious concern");
        }
        score += crScore;

        // Factor 4: HbA1c control (0-20 points)
        int hba1cScore;
        if (hba1cAvg < 7) {
            hba1cScore = 0;
        } else if (hba1cAvg < 8) {
            hba1cScore = 5;
        } else if (hba1cAvg < 9) {
            hba1cScore = 10;
            factors.add("Poor glycemic control");
        } else {
            hba1cScore = 20;
            factors.add("Very poor glycemic control accelerating kidney damage");
        }
        score += hba1cScore;

        // Factor 5: Urine ACR - proteinuria (0-20 points)
        int acrScore;
        if (acrLatest < 30) {
            acrScore = 0;
        } else if (acrLatest < 300) {
            acrScore = 10;
            factors.add("Microalbuminuria detected");
        } else {
            acrScore = 20;
            factors.add("Macroalbuminuria — significant kidney damage marker");
        }
        score += acrScore;

        // Bonus risk modifiers
        if (Boolean.TRUE.equals(patient.getSmokingStatus())) {
            score = Math.min(100, score + 5);
            factors.add("Smoking increases progression risk");
        }
        if (patient.getDiabetesDuration() > 10) {
            score = Math.min(100, score + 5);
            factors.add("Long diabetes duration (>10 years) compounds risk");
        }
        if (bpAvg > 140) {
            score = Math.min(100, score + 5);
            factors.add("Hypertension worsening progression");
        }

        // Determine level and recommendation
        String level;
        String recommendation;
        if (score < 25) {
            level = "Low";
            recommendation = "Continue routine monitoring every 3 months.";
        } else if (score < 50) {
            level = "Moderate";
            recommendation = "Increase monitoring frequency to every 6 weeks. Optimize glycemic and BP control.";
        } else if (score < 75) {
            level = "High";
            recommendation = "Consider nephrology referral within 90 days. Aggressive risk factor management required.";
        } else {
            level = "Critical";
            recommendation = "URGENT: Nephrology referral recommended within 30 days. Patient at high risk of kidney failure.";
        }

        // Generate explanation
        String explanation = generateExplanation(patient, visits, factors, score, level, eGFRPctChange, creatininePctChange, latestEGFR);

        return PredictionResult.builder()
                .score(score)
                .level(level)
                .recommendation(recommendation)
                .factors(factors)
                .explanation(explanation)
                .confidence(calculateConfidence(visits.size()))
                .build();
    }

    // ========================
    // Explanation Generator
    // ========================
    private String generateExplanation(Patient patient, List<Visit> visits, List<String> factors,
                                       int score, String level, double eGFRChange, double crChange, int latestEGFR) {
        String stageLabel = getCKDStageLabel(latestEGFR);
        String stageDesc = getCKDStageDescription(latestEGFR);
        int visitCount = visits.size();

        long months = ChronoUnit.MONTHS.between(
                visits.get(0).getVisitDate().atStartOfDay(),
                visits.get(visits.size() - 1).getVisitDate().atStartOfDay()
        );
        if (months == 0) months = 1;

        StringBuilder explanation = new StringBuilder();
        explanation.append(String.format(
                "This patient's eGFR of %d mL/min/1.73m² places them at CKD %s (%s). ",
                latestEGFR, stageLabel, stageDesc));

        if (visitCount >= 2) {
            explanation.append(String.format("Over %d visits spanning %d months, ", visitCount, months));

            List<String> trends = new ArrayList<>();
            if (Math.abs(eGFRChange) > 5) {
                trends.add(String.format("eGFR has %s by %d%%",
                        eGFRChange < 0 ? "declined" : "improved",
                        (int) Math.abs(Math.round(eGFRChange))));
            }
            if (Math.abs(crChange) > 10) {
                trends.add(String.format("creatinine has %s by %d%%",
                        crChange > 0 ? "risen" : "decreased",
                        (int) Math.abs(Math.round(crChange))));
            }

            if (!trends.isEmpty()) {
                explanation.append(String.join(" and ", trends)).append(", ");
                if (eGFRChange < -20) {
                    explanation.append("indicating progressive nephron loss. ");
                } else if (eGFRChange < -10) {
                    explanation.append("suggesting gradual kidney function decline. ");
                } else {
                    explanation.append("with kidney function relatively maintained. ");
                }
            } else {
                explanation.append("biomarker levels have remained relatively stable. ");
            }
        }

        if (!factors.isEmpty()) {
            explanation.append("Key concerns: ").append(String.join("; ", factors)).append(". ");
        }

        switch (level) {
            case "Critical" -> explanation.append("URGENT: Immediate nephrology referral is strongly recommended.");
            case "High" -> explanation.append("A nephrology consultation should be arranged within the next 90 days.");
            case "Moderate" -> explanation.append("Increased monitoring frequency and aggressive risk factor management are advised.");
            default -> explanation.append("Continue routine monitoring every 3 months.");
        }

        return explanation.toString();
    }
}
