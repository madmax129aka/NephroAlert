import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, RotateCcw, Download, MessageCircle, MapPin, CheckCircle2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { analyzeEyeCapture } from '../utils/eyeImageAnalysis';
import {
  classifyPallourIndex,
  SYMPTOM_QUESTIONS,
  calculateSymptomPoints,
  calculateStage1Score,
  getStage1Level,
  getScoreBarColorClass
} from '../utils/stage1Scoring';
import { generateStage1PDF } from '../utils/pdfExport';

// Guide box size (in canvas pixels) shown to the patient — the region
// that all quality checks + pallor analysis are performed on.
const GUIDE_BOX_SIZE = { width: 220, height: 140 };

export default function EyeScan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // data URL for preview
  const [analyzing, setAnalyzing] = useState(false);
  const [qualityError, setQualityError] = useState(null);
  const [eyeResult, setEyeResult] = useState(null); // { pallourLevel, colour, anaemiaRisk, points, badgeColor, messageEn, messageTa }

  const [answers, setAnswers] = useState({});
  const [stage1Result, setStage1Result] = useState(null); // { stage1Score, level info }
  const [screeningId, setScreeningId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [patientName, setPatientName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const symptomSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  // ---------------------------------------------------------
  // Camera setup
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError(
          'Could not access camera. Please allow camera permission and use Chrome on Android, or check your camera is not in use by another app.'
        );
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ---------------------------------------------------------
  // Capture + analyze
  // ---------------------------------------------------------
  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setAnalyzing(true);
    setQualityError(null);
    setEyeResult(null);

    // Draw the full video frame onto the canvas at its native resolution.
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);

    // The guide box is rendered in the DOM centred over the video element
    // (see overlay below) sized as a % of the displayed video. Map that
    // same centred region onto the canvas's native pixel coordinates.
    const boxWidthRatio = GUIDE_BOX_SIZE.width / (video.clientWidth || vw);
    const boxHeightRatio = GUIDE_BOX_SIZE.height / (video.clientHeight || vh);
    const regionWidth = Math.round(vw * boxWidthRatio);
    const regionHeight = Math.round(vh * boxHeightRatio);
    const region = {
      x: Math.max(0, Math.round((vw - regionWidth) / 2)),
      y: Math.max(0, Math.round((vh - regionHeight) / 2)),
      width: Math.min(regionWidth, vw),
      height: Math.min(regionHeight, vh)
    };

    try {
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));

      const { quality, pallor } = await analyzeEyeCapture(canvas, region);

      if (!quality.pass) {
        setQualityError(quality);
        setAnalyzing(false);
        return;
      }

      const levelInfo = classifyPallourIndex(pallor.pallourIndex);
      setEyeResult(levelInfo);
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Could not analyse the image. Please try capturing again.');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleRetake = () => {
    setCapturedImage(null);
    setEyeResult(null);
    setQualityError(null);
  };

  const scrollToSymptoms = () => {
    symptomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------------------------------------------------------
  // Symptom questionnaire
  // ---------------------------------------------------------
  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = SYMPTOM_QUESTIONS.every(q => answers[q.id]);

  const handleCalculateRisk = async () => {
    if (!eyeResult) {
      toast.error('Please complete the eye scan first.');
      return;
    }
    if (!allAnswered) {
      toast.error('Please answer all 6 questions.');
      return;
    }

    const symptomPoints = calculateSymptomPoints(answers);
    const eyePoints = eyeResult.points;
    const stage1Score = calculateStage1Score(eyePoints, symptomPoints);
    const levelInfo = getStage1Level(stage1Score);

    setStage1Result({ eyePoints, symptomPoints, stage1Score, ...levelInfo });

    // Submit anonymously to the backend to obtain a screeningId.
    setSubmitting(true);
    try {
      const res = await api.post('/screening/home', {
        pallourLevel: eyeResult.pallourLevel,
        pallourPoints: eyePoints,
        symptomPoints
      });
      setScreeningId(res.data.screeningId);
    } catch (err) {
      console.error('Failed to submit home screening:', err);
      // Still show the locally computed result even if the network call
      // fails — the public tool should degrade gracefully.
      setScreeningId('NS' + Date.now());
      toast.error('Could not reach server, but your result is shown below. Please note your screening ID may not be saved.');
    } finally {
      setSubmitting(false);
      setTimeout(() => resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  // ---------------------------------------------------------
  // Result actions: PDF, WhatsApp, Maps
  // ---------------------------------------------------------
  const handleDownloadReport = () => {
    if (!patientName.trim()) {
      setShowNamePrompt(true);
      return;
    }
    generateStage1PDF({
      patientName,
      capturedImage,
      eyeResult,
      answers,
      stage1Result,
      screeningId
    });
  };

  const confirmNameAndDownload = () => {
    if (!patientName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    setShowNamePrompt(false);
    generateStage1PDF({
      patientName,
      capturedImage,
      eyeResult,
      answers,
      stage1Result,
      screeningId
    });
  };

  const handleWhatsAppShare = () => {
    if (!stage1Result) return;
    const text = `My NephroAlert screening result: Risk Level ${stage1Result.level}, Score ${stage1Result.stage1Score}/100. Recommendation: ${stage1Result.recommendationEn} Date: ${new Date().toLocaleDateString('en-IN')}`;
    window.open(`whatsapp://send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFindPHC = () => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent('Primary Health Centre near me')}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top bar */}
      <div className="bg-primary px-4 py-4 flex items-center gap-3 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">NephroAlert</span>
        </Link>
        <span className="text-white/70 text-sm ml-2">Home Screening</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ============================ */}
        {/* STAGE 1A — Camera + capture */}
        {/* ============================ */}
        <div className="card mb-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">Home Eye Screening</h1>
          <p className="text-sm text-text-muted mb-1">வீட்டில் கண் பரிசோதனை</p>
          <p className="text-xs text-text-muted mb-4">Free · No login required · 2 minutes</p>

          {!capturedImage ? (
            <>
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <p className="text-white text-sm">{cameraError}</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    {/* Guide box overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="border-4 border-accent rounded-2xl"
                        style={{ width: `${GUIDE_BOX_SIZE.width}px`, height: `${GUIDE_BOX_SIZE.height}px` }}
                      />
                    </div>
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 p-3 bg-surface-alt rounded-lg border border-border">
                <p className="text-sm text-text-primary font-medium">
                  Pull down your lower eyelid gently. Look upward. Hold still.
                </p>
                <p className="text-sm text-text-muted mt-1">
                  உங்கள் கீழ் இமையை மெதுவாக இழுக்கவும். மேல்நோக்கி பாருங்கள். அசைவின்றி இருங்கள்.
                </p>
              </div>

              <button
                onClick={handleCapture}
                disabled={!cameraReady || analyzing}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-3.5 text-base disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                {analyzing ? 'Analysing...' : 'Capture'}
              </button>
            </>
          ) : (
            <>
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black relative">
                <img src={capturedImage} alt="Captured eye" className="w-full h-full object-cover" />
              </div>

              {qualityError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">{qualityError.errorEn}</p>
                  <p className="text-sm text-red-700 mt-1">{qualityError.errorTa}</p>
                </div>
              )}

              {analyzing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-text-muted text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Analysing image...
                </div>
              )}

              {eyeResult && (
                <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: eyeResult.badgeColor, backgroundColor: `${eyeResult.badgeColor}10` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase"
                      style={{ backgroundColor: eyeResult.badgeColor }}
                    >
                      {eyeResult.pallourLevel} pallor
                    </span>
                    <span className="text-xs text-text-muted">Points: {eyeResult.points}/3</span>
                  </div>
                  <p className="text-sm text-text-primary font-medium mb-1">{eyeResult.colour} · Anaemia risk: {eyeResult.anaemiaRisk}</p>
                  <p className="text-sm text-text-primary">{eyeResult.messageEn}</p>
                  <p className="text-sm text-text-muted mt-1">{eyeResult.messageTa}</p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={handleRetake} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Retake
                </button>
                {eyeResult && (
                  <button onClick={scrollToSymptoms} className="btn-primary flex-1">
                    Continue to Symptoms
                  </button>
                )}
              </div>
            </>
          )}

          {/* Hidden canvas used for capture + pixel analysis */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* ============================ */}
        {/* STAGE 1B — Symptom Questionnaire */}
        {/* ============================ */}
        {eyeResult && (
          <div className="card mb-6" ref={symptomSectionRef}>
            <h2 className="text-lg font-bold text-text-primary mb-1">Symptom Questionnaire</h2>
            <p className="text-sm text-text-muted mb-4">அறிகுறி கேள்விகள்</p>

            <div className="space-y-6">
              {SYMPTOM_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="pb-5 border-b border-border last:border-b-0 last:pb-0">
                  <p className="text-sm font-medium text-text-primary mb-0.5">{idx + 1}. {q.en}</p>
                  <p className="text-sm text-text-muted mb-3">{q.ta}</p>
                  <div className="space-y-2">
                    {q.options.map(opt => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          answers[q.id] === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-surface-alt'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() => handleAnswer(q.id, opt.value)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-text-primary">
                          {opt.labelEn} <span className="text-text-muted">/ {opt.labelTa}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCalculateRisk}
              disabled={!allAnswered || submitting}
              className="btn-primary w-full mt-6 py-3.5 text-base disabled:opacity-50"
            >
              {submitting ? 'Calculating...' : 'Calculate My Risk'}
            </button>
          </div>
        )}

        {/* ============================ */}
        {/* STAGE 1 RESULT */}
        {/* ============================ */}
        {stage1Result && (
          <div className="card" ref={resultSectionRef}>
            <div className="text-center mb-5">
              <p className="text-sm text-text-muted mb-1">Your Stage 1 Score</p>
              <p className="text-5xl font-bold" style={{ color: stage1Result.badgeColor }}>
                {stage1Result.stage1Score}
              </p>
              <span
                className="inline-block mt-2 px-4 py-1.5 rounded-full text-white text-sm font-bold uppercase"
                style={{ backgroundColor: stage1Result.badgeColor }}
              >
                {stage1Result.level} Risk
              </span>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div
                className={getScoreBarColorClass(stage1Result.stage1Score)}
                style={{ width: `${stage1Result.stage1Score}%`, height: '100%' }}
              />
            </div>

            <div className="p-4 bg-surface-alt rounded-lg border border-border mb-4">
              <p className="text-sm font-medium text-text-primary mb-1">Recommendation</p>
              <p className="text-sm text-text-primary">{stage1Result.recommendationEn}</p>
              <p className="text-sm text-text-muted mt-1">{stage1Result.recommendationTa}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-text-primary mb-2">What was detected</p>
              <ul className="space-y-1.5 text-sm text-text-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  Eye pallor level: {eyeResult.pallourLevel} ({stage1Result.eyePoints} pts)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  Symptom questionnaire score: {stage1Result.symptomPoints} pts
                </li>
              </ul>
            </div>

            {screeningId && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4 text-center">
                <p className="text-xs text-text-muted">Your Screening ID</p>
                <p className="text-lg font-bold text-primary tracking-wide">{screeningId}</p>
                <p className="text-xs text-text-muted mt-1">Show this ID to your doctor at the PHC.</p>
              </div>
            )}

            {showNamePrompt && (
              <div className="p-3 bg-surface-alt border border-border rounded-lg mb-4">
                <label className="label text-sm">Enter your name for the report</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="Your name"
                  />
                  <button onClick={confirmNameAndDownload} className="btn-primary whitespace-nowrap">
                    Download
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={handleDownloadReport} className="btn-secondary flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download Report
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Share via WhatsApp
              </button>
            </div>

            {(stage1Result.level === 'High' || stage1Result.level === 'Critical') && (
              <button
                onClick={handleFindPHC}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-risk-high hover:opacity-90 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" /> Find Nearest PHC
              </button>
            )}

            <p className="text-xs text-text-muted text-center mt-5">
              This is a screening tool only, not a medical diagnosis. Please show this report to your doctor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
