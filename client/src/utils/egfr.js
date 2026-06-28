/**
 * CKD-EPI 2021 eGFR calculation
 */
export function calculateEGFR(creatinine, age, gender) {
  if (!creatinine || !age || !gender) return null;
  
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

/**
 * Get CKD Stage info from eGFR value
 */
export function getCKDStageInfo(eGFR) {
  if (eGFR === null || eGFR === undefined) return null;
  
  if (eGFR >= 90) return { stage: 1, label: 'Stage 1', description: 'Normal or high function', color: '#16A34A' };
  if (eGFR >= 60) return { stage: 2, label: 'Stage 2', description: 'Mildly reduced', color: '#84CC16' };
  if (eGFR >= 45) return { stage: 3, label: 'Stage 3a', description: 'Mildly to moderately reduced', color: '#D97706' };
  if (eGFR >= 30) return { stage: 3, label: 'Stage 3b', description: 'Moderately to severely reduced', color: '#EA580C' };
  if (eGFR >= 15) return { stage: 4, label: 'Stage 4', description: 'Severely reduced', color: '#DC2626' };
  return { stage: 5, label: 'Stage 5', description: 'Kidney failure', color: '#991B1B' };
}

/**
 * Get risk level color
 */
export function getRiskColor(level) {
  switch (level) {
    case 'Low': return '#16A34A';
    case 'Moderate': return '#D97706';
    case 'High': return '#EA580C';
    case 'Critical': return '#DC2626';
    default: return '#64748B';
  }
}
