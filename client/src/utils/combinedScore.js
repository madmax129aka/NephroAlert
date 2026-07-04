/**
 * Stage 3 — Combined Risk Assessment.
 *
 * Combines the Stage 1 (home eye screening + physical signs) score with
 * the Stage 2 (blood test trajectory) score into a single weighted score.
 * Pure JavaScript math + pre-written bilingual template strings only.
 * No AI/ML API calls of any kind.
 */

export function calculateStage3Score(stage1Score, stage2Score) {
  return Math.round((stage1Score * 0.35) + (stage2Score * 0.65));
}

export function getStage3Level(stage3Score) {
  if (stage3Score >= 75) return 'Critical';
  if (stage3Score >= 50) return 'High';
  if (stage3Score >= 25) return 'Moderate';
  return 'Low';
}

export function getConfidencePercent(visitCount) {
  if (visitCount >= 5) return 92;
  if (visitCount === 4) return 82;
  if (visitCount === 3) return 72;
  if (visitCount === 2) return 60;
  if (visitCount === 1) return 45;
  return 0;
}

export function getScoreBarColorClass(score) {
  if (score >= 75) return 'bg-red-500';
  if (score >= 50) return 'bg-orange-500';
  if (score >= 25) return 'bg-yellow-500';
  return 'bg-green-500';
}

const STAGE3_RECOMMENDATIONS = {
  Low: {
    en: 'Continue routine monitoring every 3 months.',
    ta: 'ஒவ்வொரு 3 மாதங்களுக்கும் வழக்கமான கண்காணிப்பைத் தொடரவும்.'
  },
  Moderate: {
    en: 'Increase monitoring frequency. Repeat screening within 4-6 weeks.',
    ta: 'கண்காணிப்பு அதிர்வெண்ணை அதிகரிக்கவும். 4-6 வாரங்களுக்குள் மீண்டும் பரிசோதிக்கவும்.'
  },
  High: {
    en: 'Nephrology referral recommended within 90 days.',
    ta: '90 நாட்களுக்குள் சிறுநீரக நிபுணரை சந்திக்கவும்.'
  },
  Critical: {
    en: 'Immediate nephrology referral is strongly recommended.',
    ta: 'உடனடியாக சிறுநீரக நிபுணரை சந்திக்குமாறு கடுமையாக பரிந்துரைக்கப்படுகிறது.'
  }
};

export function getStage3Recommendation(stage3Level) {
  return STAGE3_RECOMMENDATIONS[stage3Level] || STAGE3_RECOMMENDATIONS.Low;
}

/**
 * English explanation template — pure JavaScript template strings,
 * no AI generation of any kind. Mirrors the structure requested:
 * eGFR % change and creatinine % change are computed from the
 * first vs latest blood test visit.
 */
export function generateExplanationEn(patient, stage1Score, stage1Level, stage2Score, stage2Level, stage3Score, stage3Level, visits) {
  if (!visits || visits.length === 0) {
    return `${patient.fullName}'s combined risk score is ${stage3Score}/100 (${stage3Level}).`;
  }

  const firstVisit = visits[0];
  const latestVisit = visits[visits.length - 1];

  const egfrChange = firstVisit.eGFR
    ? Math.round(((firstVisit.eGFR - latestVisit.eGFR) / firstVisit.eGFR) * 100)
    : 0;
  const crChange = firstVisit.creatinine
    ? Math.round(((latestVisit.creatinine - firstVisit.creatinine) / firstVisit.creatinine) * 100)
    : 0;

  const templates = {
    Low: `${patient.fullName}'s physical signs and blood test trajectory both indicate stable kidney function. eGFR has changed by ${egfrChange}% across ${visits.length} visits. Continue routine monitoring every 3 months.`,

    Moderate: `${patient.fullName} shows some early warning signs. Physical screening score is ${stage1Score}/100 and blood test trajectory score is ${stage2Score}/100. eGFR has declined ${egfrChange}% and creatinine has risen ${crChange}% since first visit. Increase monitoring frequency.`,

    High: `${patient.fullName} has concerning signs across both physical examination and blood test trajectory. eGFR has declined ${egfrChange}% and creatinine has risen ${crChange}% across ${visits.length} visits. Physical signs including ${stage1Level} pallor detected. Nephrology referral recommended within 90 days.`,

    Critical: `${patient.fullName} requires urgent attention. Both physical screening (${stage1Score}/100) and blood test trajectory (${stage2Score}/100) indicate critical CKD progression risk. eGFR has fallen ${egfrChange}% with creatinine rising ${crChange}%. Immediate nephrology referral is strongly recommended.`
  };

  return templates[stage3Level] || templates.Low;
}

/**
 * Tamil explanation template — same structure, pre-written Tamil
 * strings per risk level, numbers filled in dynamically.
 */
export function generateExplanationTa(patient, stage1Score, stage1Level, stage2Score, stage2Level, stage3Score, stage3Level, visits) {
  if (!visits || visits.length === 0) {
    return `${patient.fullName}-இன் இணைந்த ஆபத்து மதிப்பெண் ${stage3Score}/100 (${stage3Level}) ஆகும்.`;
  }

  const firstVisit = visits[0];
  const latestVisit = visits[visits.length - 1];

  const egfrChange = firstVisit.eGFR
    ? Math.round(((firstVisit.eGFR - latestVisit.eGFR) / firstVisit.eGFR) * 100)
    : 0;
  const crChange = firstVisit.creatinine
    ? Math.round(((latestVisit.creatinine - firstVisit.creatinine) / firstVisit.creatinine) * 100)
    : 0;

  const templates = {
    Low: `${patient.fullName}-இன் உடல் அறிகுறிகள் மற்றும் இரத்த பரிசோதனை போக்கு இரண்டும் நிலையான சிறுநீரக செயல்பாட்டைக் குறிக்கின்றன. ${visits.length} வருகைகளில் eGFR ${egfrChange}% மாறியுள்ளது. ஒவ்வொரு 3 மாதங்களுக்கும் வழக்கமான கண்காணிப்பைத் தொடரவும்.`,

    Moderate: `${patient.fullName}-க்கு சில ஆரம்பகால எச்சரிக்கை அறிகுறிகள் உள்ளன. உடல் பரிசோதனை மதிப்பெண் ${stage1Score}/100 மற்றும் இரத்த பரிசோதனை போக்கு மதிப்பெண் ${stage2Score}/100 ஆகும். முதல் வருகையிலிருந்து eGFR ${egfrChange}% குறைந்துள்ளது மற்றும் creatinine ${crChange}% அதிகரித்துள்ளது. கண்காணிப்பு அதிர்வெண்ணை அதிகரிக்கவும்.`,

    High: `${patient.fullName}-க்கு உடல் பரிசோதனை மற்றும் இரத்த பரிசோதனை போக்கு ஆகிய இரண்டிலும் கவலைக்குரிய அறிகுறிகள் உள்ளன. ${visits.length} வருகைகளில் eGFR ${egfrChange}% குறைந்துள்ளது மற்றும் creatinine ${crChange}% அதிகரித்துள்ளது. ${stage1Level} பாலர் (pallor) கண்டறியப்பட்டது. 90 நாட்களுக்குள் சிறுநீரக நிபுணரை சந்திக்குமாறு பரிந்துரைக்கப்படுகிறது.`,

    Critical: `${patient.fullName}-க்கு உடனடி கவனம் தேவை. உடல் பரிசோதனை (${stage1Score}/100) மற்றும் இரத்த பரிசோதனை போக்கு (${stage2Score}/100) இரண்டும் தீவிர CKD முன்னேற்ற ஆபத்தைக் குறிக்கின்றன. eGFR ${egfrChange}% குறைந்துள்ளது, creatinine ${crChange}% அதிகரித்துள்ளது. உடனடியாக சிறுநீரக நிபுணரை சந்திக்குமாறு கடுமையாக பரிந்துரைக்கப்படுகிறது.`
  };

  return templates[stage3Level] || templates.Low;
}

/**
 * Convenience wrapper computing the full Stage 3 result in one call.
 */
export function computeCombinedRisk(patient, stage1Score, stage1Level, stage2Score, stage2Level, visits) {
  const stage3Score = calculateStage3Score(stage1Score, stage2Score);
  const stage3Level = getStage3Level(stage3Score);
  const confidencePercent = getConfidencePercent(visits ? visits.length : 0);
  const explanationEn = generateExplanationEn(patient, stage1Score, stage1Level, stage2Score, stage2Level, stage3Score, stage3Level, visits);
  const explanationTa = generateExplanationTa(patient, stage1Score, stage1Level, stage2Score, stage2Level, stage3Score, stage3Level, visits);
  const recommendation = getStage3Recommendation(stage3Level);

  return {
    stage3Score,
    stage3Level,
    confidencePercent,
    explanationEn,
    explanationTa,
    recommendationEn: recommendation.en,
    recommendationTa: recommendation.ta
  };
}
