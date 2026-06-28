/**
 * NephroAlert CKD Progression Prediction Service
 * ML-powered prediction using rule-based scoring derived from clinical research
 */

function linearRegressionSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

function calculateEGFR(creatinine, age, gender) {
  // CKD-EPI 2021 equation
  const kappa = gender === 'Female' ? 0.7 : 0.9;
  const alpha = gender === 'Female' ? -0.241 : -0.302;
  const crRatio = creatinine / kappa;
  
  let eGFR;
  if (crRatio < 1) {
    eGFR = 142 * Math.pow(crRatio, alpha) * Math.pow(0.9938, age);
  } else {
    eGFR = 142 * Math.pow(crRatio, -1.200) * Math.pow(0.9938, age);
  }
  if (gender === 'Female') eGFR *= 1.012;
  
  return Math.round(eGFR);
}

function getCKDStage(eGFR) {
  if (eGFR >= 90) return 1;
  if (eGFR >= 60) return 2;
  if (eGFR >= 45) return 3; // 3a
  if (eGFR >= 30) return 3; // 3b (we use substages in label)
  if (eGFR >= 15) return 4;
  return 5;
}

function getCKDStageDetailed(eGFR) {
  if (eGFR >= 90) return { stage: 1, label: 'Stage 1', description: 'Kidney damage with normal function' };
  if (eGFR >= 60) return { stage: 2, label: 'Stage 2', description: 'Mildly reduced' };
  if (eGFR >= 45) return { stage: 3, label: 'Stage 3a', description: 'Mildly to moderately reduced' };
  if (eGFR >= 30) return { stage: 3, label: 'Stage 3b', description: 'Moderately to severely reduced' };
  if (eGFR >= 15) return { stage: 4, label: 'Stage 4', description: 'Severely reduced' };
  return { stage: 5, label: 'Stage 5', description: 'Kidney failure' };
}

function calculateConfidence(visitCount) {
  if (visitCount >= 6) return 92;
  if (visitCount >= 4) return 80;
  if (visitCount >= 3) return 68;
  return 55;
}

function generateExplanation(patient, visits, factors, score, level, eGFRChange, crChange, latestEGFR) {
  const stageInfo = getCKDStageDetailed(latestEGFR);
  const visitCount = visits.length;
  
  // Calculate time span in months
  const firstVisit = new Date(visits[0].visitDate);
  const lastVisit = new Date(visits[visits.length - 1].visitDate);
  const months = Math.round((lastVisit - firstVisit) / (1000 * 60 * 60 * 24 * 30));
  
  let explanation = `This patient's eGFR of ${latestEGFR} mL/min/1.73m² places them at CKD ${stageInfo.label} (${stageInfo.description}). `;
  
  if (visitCount >= 2 && months > 0) {
    explanation += `Over ${visitCount} visits spanning ${months} months, `;
    
    const trends = [];
    if (Math.abs(eGFRChange) > 5) {
      trends.push(`eGFR has ${eGFRChange < 0 ? 'declined' : 'improved'} by ${Math.abs(Math.round(eGFRChange))}%`);
    }
    if (Math.abs(crChange) > 10) {
      trends.push(`creatinine has ${crChange > 0 ? 'risen' : 'decreased'} by ${Math.abs(Math.round(crChange))}%`);
    }
    
    if (trends.length > 0) {
      explanation += trends.join(' and ') + ', ';
      if (eGFRChange < -20) {
        explanation += 'indicating progressive nephron loss. ';
      } else if (eGFRChange < -10) {
        explanation += 'suggesting gradual kidney function decline. ';
      } else {
        explanation += 'with kidney function relatively maintained. ';
      }
    } else {
      explanation += 'biomarker levels have remained relatively stable. ';
    }
  }
  
  if (factors.length > 0) {
    explanation += `Key concerns: ${factors.join('; ')}. `;
  }
  
  // Add recommendation based on level
  if (level === 'Critical') {
    explanation += 'URGENT: Immediate nephrology referral is strongly recommended.';
  } else if (level === 'High') {
    explanation += 'A nephrology consultation should be arranged within the next 90 days.';
  } else if (level === 'Moderate') {
    explanation += 'Increased monitoring frequency and aggressive risk factor management are advised.';
  } else {
    explanation += 'Continue routine monitoring every 3 months.';
  }
  
  return explanation;
}

function predictCKDProgression(patient, allVisits) {
  if (!allVisits || allVisits.length < 2) {
    return {
      score: 10,
      level: 'Low',
      recommendation: 'Continue routine monitoring every 3 months.',
      factors: [],
      explanation: 'Insufficient visit history for trend analysis. At least 2 visits are needed for pattern detection. Continue monitoring.',
      confidence: 55
    };
  }
  
  // Sort visits by date ascending
  const visits = [...allVisits].sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
  
  // Extract biomarker arrays
  const eGFR_values = visits.map(v => v.eGFR);
  const creatinine_values = visits.map(v => v.creatinine);
  const hba1c_values = visits.map(v => v.hba1c);
  const acr_values = visits.map(v => v.urineACR);
  const bp_values = visits.map(v => v.systolicBP);
  
  // Calculate slopes
  const eGFR_slope = linearRegressionSlope(eGFR_values);
  const creatinine_slope = linearRegressionSlope(creatinine_values);
  const hba1c_avg = hba1c_values.reduce((a, b) => a + b, 0) / hba1c_values.length;
  const acr_latest = acr_values[acr_values.length - 1];
  const bp_avg = bp_values.reduce((a, b) => a + b, 0) / bp_values.length;
  
  // Calculate percentage changes
  const eGFR_pct_change = ((eGFR_values[eGFR_values.length - 1] - eGFR_values[0]) / eGFR_values[0]) * 100;
  const creatinine_pct_change = ((creatinine_values[creatinine_values.length - 1] - creatinine_values[0]) / creatinine_values[0]) * 100;
  const latest_eGFR = eGFR_values[eGFR_values.length - 1];
  
  let score = 0;
  const factors = [];
  
  // Factor 1: eGFR absolute level (0-20 points)
  let eGFR_score;
  if (latest_eGFR >= 90) eGFR_score = 0;
  else if (latest_eGFR >= 60) eGFR_score = 10;
  else if (latest_eGFR >= 45) eGFR_score = 14;
  else if (latest_eGFR >= 30) eGFR_score = 17;
  else if (latest_eGFR >= 15) eGFR_score = 19;
  else eGFR_score = 20;
  score += eGFR_score;
  if (eGFR_score >= 14) factors.push(`eGFR at ${latest_eGFR} indicates reduced kidney function`);
  
  // Factor 2: eGFR decline rate (0-20 points)
  let slope_score;
  if (eGFR_pct_change > -10) {
    slope_score = 0;
  } else if (eGFR_pct_change > -25) {
    slope_score = 8;
    factors.push('eGFR declining moderately');
  } else if (eGFR_pct_change > -40) {
    slope_score = 14;
    factors.push('eGFR declining significantly');
  } else {
    slope_score = 20;
    factors.push('Rapid eGFR decline detected');
  }
  score += slope_score;
  
  // Factor 3: Creatinine rise (0-20 points)
  let cr_score;
  if (creatinine_pct_change < 20) {
    cr_score = 0;
  } else if (creatinine_pct_change < 50) {
    cr_score = 8;
    factors.push('Creatinine rising');
  } else if (creatinine_pct_change < 100) {
    cr_score = 14;
    factors.push('Creatinine significantly elevated');
  } else {
    cr_score = 20;
    factors.push('Creatinine doubled — serious concern');
  }
  score += cr_score;
  
  // Factor 4: HbA1c control (0-20 points)
  let hba1c_score;
  if (hba1c_avg < 7) {
    hba1c_score = 0;
  } else if (hba1c_avg < 8) {
    hba1c_score = 5;
  } else if (hba1c_avg < 9) {
    hba1c_score = 10;
    factors.push('Poor glycemic control');
  } else {
    hba1c_score = 20;
    factors.push('Very poor glycemic control accelerating kidney damage');
  }
  score += hba1c_score;
  
  // Factor 5: Urine ACR - proteinuria (0-20 points)
  let acr_score;
  if (acr_latest < 30) {
    acr_score = 0;
  } else if (acr_latest < 300) {
    acr_score = 10;
    factors.push('Microalbuminuria detected');
  } else {
    acr_score = 20;
    factors.push('Macroalbuminuria — significant kidney damage marker');
  }
  score += acr_score;
  
  // Bonus risk modifiers
  if (patient.smokingStatus) {
    score = Math.min(100, score + 5);
    factors.push('Smoking increases progression risk');
  }
  if (patient.diabetesDuration > 10) {
    score = Math.min(100, score + 5);
    factors.push('Long diabetes duration (>10 years) compounds risk');
  }
  if (bp_avg > 140) {
    score = Math.min(100, score + 5);
    factors.push('Hypertension worsening progression');
  }
  
  // Determine level and recommendation
  let level, recommendation;
  if (score < 25) {
    level = 'Low';
    recommendation = 'Continue routine monitoring every 3 months.';
  } else if (score < 50) {
    level = 'Moderate';
    recommendation = 'Increase monitoring frequency to every 6 weeks. Optimize glycemic and BP control.';
  } else if (score < 75) {
    level = 'High';
    recommendation = 'Consider nephrology referral within 90 days. Aggressive risk factor management required.';
  } else {
    level = 'Critical';
    recommendation = 'URGENT: Nephrology referral recommended within 30 days. Patient at high risk of kidney failure.';
  }
  
  // Generate explanation
  const explanation = generateExplanation(patient, visits, factors, score, level, eGFR_pct_change, creatinine_pct_change, latest_eGFR);
  
  return {
    score,
    level,
    recommendation,
    factors,
    explanation,
    confidence: calculateConfidence(visits.length)
  };
}

module.exports = {
  predictCKDProgression,
  calculateEGFR,
  getCKDStage,
  getCKDStageDetailed,
  linearRegressionSlope,
  generateExplanation,
  calculateConfidence
};
