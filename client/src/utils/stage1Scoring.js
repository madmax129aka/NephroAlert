/**
 * Stage 1 — Home Eye Screening + Physical Sign Scoring.
 *
 * Pure JavaScript, rule-based scoring. No AI/ML API calls of any kind.
 * This module is purely additive — it does not touch Stage 2 blood
 * test scoring (see utils/egfr.js / server PredictionService).
 */

// ============================================================
// Pallor classification (Step 3 of eye scan — see eyeImageAnalysis.js)
// ============================================================
export const PALLOR_LEVELS = {
  None: {
    pallourLevel: 'None',
    colour: 'Deep Pink',
    anaemiaRisk: 'Low',
    points: 0,
    badgeColor: '#16A34A',
    messageEn: 'Your inner eyelid appears healthy pink. No signs of pallor detected. Continue routine monitoring.',
    messageTa: 'உங்கள் கண் உள்பகுதி ஆரோக்கியமான இளஞ்சிவப்பு நிறத்தில் உள்ளது. வழக்கமான கண்காணிப்பை தொடரவும்.'
  },
  Mild: {
    pallourLevel: 'Mild',
    colour: 'Pink',
    anaemiaRisk: 'Low',
    points: 1,
    badgeColor: '#84CC16',
    messageEn: 'Your inner eyelid appears slightly pale. This may be normal. Complete the symptom questionnaire below.',
    messageTa: 'உங்கள் கண் உள்பகுதி சற்று வெளிர்ந்துள்ளது. கீழே உள்ள அறிகுறி படிவத்தை பூர்த்தி செய்யவும்.'
  },
  Moderate: {
    pallourLevel: 'Moderate',
    colour: 'Pale Pink',
    anaemiaRisk: 'Moderate',
    points: 2,
    badgeColor: '#D97706',
    messageEn: 'Your inner eyelid looks paler than normal. This may suggest low haemoglobin. Please complete the questionnaire and consider visiting your PHC.',
    messageTa: 'உங்கள் கண் உள்பகுதி இயல்பை விட வெளிர்ந்து காணப்படுகிறது. உங்கள் அருகிலுள்ள PHC-ஐ சந்திக்கவும்.'
  },
  Severe: {
    pallourLevel: 'Severe',
    colour: 'White/Grey',
    anaemiaRisk: 'High',
    points: 3,
    badgeColor: '#DC2626',
    messageEn: 'Your inner eyelid appears very pale. This is a concerning sign. Please visit your PHC for a blood test as soon as possible.',
    messageTa: 'உங்கள் கண் உள்பகுதி மிகவும் வெளிர்ந்து உள்ளது. இது கவலைக்குரிய அறிகுறி. உடனடியாக PHC-ஐ சந்திக்கவும்.'
  }
};

/**
 * Classify pallourIndex (meanR - (meanG+meanB)/2) into a pallor level.
 */
export function classifyPallourIndex(pallourIndex) {
  if (pallourIndex > 60) return PALLOR_LEVELS.None;
  if (pallourIndex >= 40) return PALLOR_LEVELS.Mild;
  if (pallourIndex >= 20) return PALLOR_LEVELS.Moderate;
  return PALLOR_LEVELS.Severe;
}

// ============================================================
// Stage 1B — Symptom Questionnaire (6 questions)
// ============================================================
export const SYMPTOM_QUESTIONS = [
  {
    id: 'perioribitalOedema',
    en: 'Are your eyes puffy when you wake up in the morning?',
    ta: 'காலையில் எழுந்திருக்கும்போது உங்கள் கண்களை சுற்றி வீக்கம் இருக்கிறதா?',
    options: [
      { value: 'Never', labelEn: 'Never', labelTa: 'ஒருபோதும் இல்லை', points: 0 },
      { value: 'Sometimes', labelEn: 'Sometimes', labelTa: 'சில நேரங்களில்', points: 1 },
      { value: 'Every morning', labelEn: 'Every morning', labelTa: 'ஒவ்வொரு காலையிலும்', points: 3 }
    ]
  },
  {
    id: 'oedemaPittingAnkle',
    en: 'Press your thumb on your ankle for 5 seconds. Does a dent remain?',
    ta: 'உங்கள் கணுக்கால் மீது 5 நொடி கட்டைவிரலை அழுத்துங்கள். தழும்பு தங்குகிறதா?',
    options: [
      { value: 'No dent', labelEn: 'No dent', labelTa: 'தழும்பு இல்லை', points: 0 },
      { value: 'Dent disappears within 15 seconds', labelEn: 'Dent disappears within 15 seconds', labelTa: '15 நொடிகளுக்குள் தழும்பு மறைகிறது', points: 1 },
      { value: 'Dent stays longer than 30 seconds', labelEn: 'Dent stays longer than 30 seconds', labelTa: '30 நொடிகளுக்கும் மேலாக தழும்பு தங்குகிறது', points: 3 }
    ]
  },
  {
    id: 'foamyUrine',
    en: 'Do you notice foam or bubbles in your urine?',
    ta: 'சிறுநீரில் நுரை அல்லது குமிழிகள் தெரிகிறதா?',
    options: [
      { value: 'Never', labelEn: 'Never', labelTa: 'ஒருபோதும் இல்லை', points: 0 },
      { value: 'Sometimes', labelEn: 'Sometimes', labelTa: 'சில நேரங்களில்', points: 1 },
      { value: 'Always', labelEn: 'Always', labelTa: 'எப்போதும்', points: 3 }
    ]
  },
  {
    id: 'restlessLegs',
    en: 'Do your legs feel restless or crawling at night?',
    ta: 'இரவில் கால்களில் அமைதியின்மை அல்லது ஊர்வது போன்ற உணர்வு இருக்கிறதா?',
    options: [
      { value: 'Never', labelEn: 'Never', labelTa: 'ஒருபோதும் இல்லை', points: 0 },
      { value: 'Sometimes', labelEn: 'Sometimes', labelTa: 'சில நேரங்களில்', points: 1 },
      { value: 'Every night', labelEn: 'Every night', labelTa: 'ஒவ்வொரு இரவும்', points: 2 }
    ]
  },
  {
    id: 'nocturia',
    en: 'How many times do you wake up to urinate at night?',
    ta: 'இரவில் சிறுநீர் கழிக்க எத்தனை முறை எழுகிறீர்கள்?',
    options: [
      { value: '0 to 1 times', labelEn: '0 to 1 times', labelTa: '0 முதல் 1 முறை', points: 0 },
      { value: '2 to 3 times', labelEn: '2 to 3 times', labelTa: '2 முதல் 3 முறை', points: 1 },
      { value: '4 or more times', labelEn: '4 or more times', labelTa: '4 அல்லது அதற்கு மேற்பட்ட முறை', points: 2 }
    ]
  },
  {
    id: 'fatigue',
    en: 'How would you describe your energy levels?',
    ta: 'உங்கள் சக்தி நிலையை எவ்வாறு விவரிப்பீர்கள்?',
    options: [
      { value: 'Normal', labelEn: 'Normal', labelTa: 'சாதாரணமாக', points: 0 },
      { value: 'More tired than usual', labelEn: 'More tired than usual', labelTa: 'வழக்கத்தை விட அதிக சோர்வு', points: 1 },
      { value: 'Exhausted always', labelEn: 'Exhausted always', labelTa: 'எப்போதும் மிகவும் சோர்வாக', points: 2 }
    ]
  }
];

// These constants are specified explicitly (not derived) to match the
// exact scoring spec: maxEyePoints = 3, maxSymptomPoints = 14,
// stage1MaxScore = 17 (3 + 14).
export const MAX_EYE_POINTS = 3;
export const MAX_SYMPTOM_POINTS = 14;
export const STAGE1_MAX_SCORE = 17;

export function calculateSymptomPoints(answers) {
  return SYMPTOM_QUESTIONS.reduce((sum, q) => {
    const selected = answers[q.id];
    const option = q.options.find(o => o.value === selected);
    return sum + (option ? option.points : 0);
  }, 0);
}

// ============================================================
// Stage 1 overall score + risk level
// ============================================================
export const STAGE1_LEVELS = {
  Low: {
    level: 'Low',
    colour: 'green',
    badgeColor: '#16A34A',
    recommendationEn: 'No immediate action needed. Screen again in 3 months.',
    recommendationTa: 'உடனடி நடவடிக்கை தேவையில்லை. 3 மாதங்களில் மீண்டும் பரிசோதிக்கவும்.'
  },
  Moderate: {
    level: 'Moderate',
    colour: 'yellow',
    badgeColor: '#D97706',
    recommendationEn: 'Some signs observed. Visit PHC for blood test within 2 weeks.',
    recommendationTa: 'சில அறிகுறிகள் காணப்படுகின்றன. 2 வாரங்களுக்குள் PHC-ஐ சந்திக்கவும்.'
  },
  High: {
    level: 'High',
    colour: 'orange',
    badgeColor: '#EA580C',
    recommendationEn: 'Multiple concerning signs. Visit PHC for blood test this week.',
    recommendationTa: 'பல கவலைக்குரிய அறிகுறிகள். இந்த வாரம் PHC-ஐ சந்திக்கவும்.'
  },
  Critical: {
    level: 'Critical',
    colour: 'red',
    badgeColor: '#DC2626',
    recommendationEn: 'Serious signs detected. Visit PHC immediately and show this report.',
    recommendationTa: 'தீவிர அறிகுறிகள் கண்டறியப்பட்டன. உடனடியாக PHC-ஐ சந்திக்கவும்.'
  }
};

export function calculateStage1Score(eyePoints, symptomPoints) {
  const stage1RawScore = eyePoints + symptomPoints;
  return Math.round((stage1RawScore / STAGE1_MAX_SCORE) * 100);
}

export function getStage1Level(stage1Score) {
  if (stage1Score >= 75) return STAGE1_LEVELS.Critical;
  if (stage1Score >= 55) return STAGE1_LEVELS.High;
  if (stage1Score >= 30) return STAGE1_LEVELS.Moderate;
  return STAGE1_LEVELS.Low;
}

/**
 * Tailwind background-color class for a 0-100 score bar, matching the
 * Stage 3 combined score UI color thresholds.
 */
export function getScoreBarColorClass(score) {
  if (score >= 75) return 'bg-red-500';
  if (score >= 50) return 'bg-orange-500';
  if (score >= 25) return 'bg-yellow-500';
  return 'bg-green-500';
}
