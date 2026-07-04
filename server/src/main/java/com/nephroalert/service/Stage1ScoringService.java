package com.nephroalert.service;

import org.springframework.stereotype.Service;

/**
 * Stage 1 — Home Eye Screening + Physical Sign Scoring.
 *
 * Pure rule-based JavaScript-equivalent scoring, re-implemented in Java
 * so the server can independently validate/recompute scores submitted
 * by the client (defense in depth — never trust a raw score from a
 * public, unauthenticated endpoint).
 *
 * No AI/ML APIs of any kind are used here — just arithmetic, matching
 * the pure-JS scoring rules used on the client.
 */
@Service
public class Stage1ScoringService {

    public static final int MAX_EYE_POINTS = 3;
    public static final int MAX_SYMPTOM_POINTS = 14;
    public static final int STAGE1_MAX_SCORE = 17;

    /**
     * stage1Score = round(((eyePoints + symptomPoints) / 17) * 100)
     */
    public int calculateStage1Score(int eyePoints, int symptomPoints) {
        int rawScore = eyePoints + symptomPoints;
        return (int) Math.round((rawScore / (double) STAGE1_MAX_SCORE) * 100);
    }

    public String getStage1Level(int stage1Score) {
        if (stage1Score >= 75) return "Critical";
        if (stage1Score >= 55) return "High";
        if (stage1Score >= 30) return "Moderate";
        return "Low";
    }

    public String getRecommendationEn(String level) {
        return switch (level) {
            case "Critical" -> "Serious signs detected. Visit PHC immediately and show this report.";
            case "High" -> "Multiple concerning signs. Visit PHC for blood test this week.";
            case "Moderate" -> "Some signs observed. Visit PHC for blood test within 2 weeks.";
            default -> "No immediate action needed. Screen again in 3 months.";
        };
    }

    public String getRecommendationTa(String level) {
        return switch (level) {
            case "Critical" -> "தீவிர அறிகுறிகள் கண்டறியப்பட்டன. உடனடியாக PHC-ஐ சந்திக்கவும்.";
            case "High" -> "பல கவலைக்குரிய அறிகுறிகள். இந்த வாரம் PHC-ஐ சந்திக்கவும்.";
            case "Moderate" -> "சில அறிகுறிகள் காணப்படுகின்றன. 2 வாரங்களுக்குள் PHC-ஐ சந்திக்கவும்.";
            default -> "உடனடி நடவடிக்கை தேவையில்லை. 3 மாதங்களில் மீண்டும் பரிசோதிக்கவும்.";
        };
    }

    public String getColour(String level) {
        return switch (level) {
            case "Critical" -> "red";
            case "High" -> "orange";
            case "Moderate" -> "yellow";
            default -> "green";
        };
    }
}
