import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FileText, MapPin, Calendar, Clock } from 'lucide-react';
import api from '../services/api';
import RiskBadge from '../components/ui/RiskBadge';
import AlertBanner from '../components/ui/AlertBanner';
import BiomarkerChart from '../components/charts/BiomarkerChart';
import RiskGauge from '../components/charts/RiskGauge';
import TrendArrow, { InverseTrendArrow } from '../components/ui/TrendArrow';
import { getCKDStageInfo } from '../utils/egfr';
import { generatePDF } from '../utils/pdfExport';
import { computeCombinedRisk, getScoreBarColorClass } from '../utils/combinedScore';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/patients/${id}`);
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch patient');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <p className="text-text-muted">Patient not found</p>;

  const { patient, visits, prediction } = data;
  const stageInfo = getCKDStageInfo(visits[visits.length - 1]?.eGFR);

  // Calculate trends
  const calcPctChange = (field) => {
    if (visits.length < 2) return null;
    const first = visits[0][field];
    const last = visits[visits.length - 1][field];
    if (!first) return null;
    return ((last - first) / first) * 100;
  };

  const trends = [
    { name: 'eGFR', first: visits[0]?.eGFR, last: visits[visits.length-1]?.eGFR, unit: 'mL/min', pctChange: calcPctChange('eGFR'), isInverse: false },
    { name: 'Creatinine', first: visits[0]?.creatinine, last: visits[visits.length-1]?.creatinine, unit: 'mg/dL', pctChange: calcPctChange('creatinine'), isInverse: true },
    { name: 'HbA1c', first: visits[0]?.hba1c, last: visits[visits.length-1]?.hba1c, unit: '%', pctChange: calcPctChange('hba1c'), isInverse: true },
    { name: 'Blood Urea', first: visits[0]?.bloodUrea, last: visits[visits.length-1]?.bloodUrea, unit: 'mg/dL', pctChange: calcPctChange('bloodUrea'), isInverse: true },
    { name: 'Urine ACR', first: visits[0]?.urineACR, last: visits[visits.length-1]?.urineACR, unit: 'mg/g', pctChange: calcPctChange('urineACR'), isInverse: true },
    { name: 'Systolic BP', first: visits[0]?.systolicBP, last: visits[visits.length-1]?.systolicBP, unit: 'mmHg', pctChange: calcPctChange('systolicBP'), isInverse: true },
  ];

  return (
    <div id="patient-report">
      {/* Patient Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{patient.fullName}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
            <span>{patient.age}y, {patient.gender}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{patient.village}</span>
            <span>Diabetes: {patient.diabetesDuration}y</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => generatePDF(patient, visits, prediction)} className="btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => navigate(`/patients/${id}/visit/new`)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Visit
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-text-muted mb-1">CKD Stage</p>
            {stageInfo && (
              <div className="px-3 py-1.5 rounded-lg text-white font-bold text-lg" style={{ backgroundColor: stageInfo.color }}>
                {stageInfo.label}
              </div>
            )}
            <p className="text-xs text-text-muted mt-1">{stageInfo?.description}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="text-center w-full">
            <p className="text-xs text-text-muted mb-1">Risk Level</p>
            <RiskBadge level={patient.currentRiskLevel} size="lg" />
          </div>
        </div>
        <div className="card flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-text-muted mb-1">Total Visits</p>
            <p className="text-3xl font-bold text-primary">{visits.length}</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {(patient.currentRiskLevel === 'High' || patient.currentRiskLevel === 'Critical') && prediction && (
        <div className="mb-6">
          <AlertBanner
            level={patient.currentRiskLevel}
            explanation={prediction.explanation}
            recommendation={prediction.recommendation}
          />
        </div>
      )}

      {/* Biomarker Charts */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Biomarker Trends</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <BiomarkerChart data={visits} field="eGFR" label="eGFR (mL/min/1.73m²)" normalMin={60} normalMax={120} color="#0F4C81" unit="mL/min" />
        <BiomarkerChart data={visits} field="creatinine" label="Serum Creatinine" normalMin={0.7} normalMax={1.2} color="#7C3AED" unit="mg/dL" />
        <BiomarkerChart data={visits} field="hba1c" label="HbA1c (%)" normalMax={7.0} color="#D97706" unit="%" />
        <BiomarkerChart data={visits} field="bloodUrea" label="Blood Urea" normalMin={7} normalMax={20} color="#059669" unit="mg/dL" />
        <BiomarkerChart data={visits} field="systolicBP" label="Systolic BP" normalMax={120} color="#DC2626" unit="mmHg" />
        <BiomarkerChart data={visits} field="urineACR" label="Urine ACR" normalMax={30} color="#0891B2" unit="mg/g" />
      </div>

      {/* Trend Analysis Table */}
      <div className="card mb-8">
        <h3 className="font-semibold text-text-primary mb-4">Trend Analysis</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Biomarker</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">First</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Latest</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Change</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Trend</th>
            </tr>
          </thead>
          <tbody>
            {trends.map(t => (
              <tr key={t.name} className="border-b border-border/50">
                <td className="py-2.5 px-2 font-medium text-sm">{t.name}</td>
                <td className="py-2.5 px-2 text-sm text-text-muted">{t.first} {t.unit}</td>
                <td className="py-2.5 px-2 text-sm font-semibold">{t.last} {t.unit}</td>
                <td className="py-2.5 px-2">
                  {t.isInverse 
                    ? <InverseTrendArrow pctChange={t.pctChange} />
                    : <TrendArrow pctChange={t.pctChange} />
                  }
                </td>
                <td className="py-2.5 px-2">
                  <StatusBadge pctChange={t.pctChange} isInverse={t.isInverse} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Prediction Panel */}
      {prediction && (
        <div className="card mb-8">
          <h3 className="font-semibold text-text-primary mb-4">AI Risk Assessment</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <RiskGauge score={prediction.score} size={180} />
              <RiskBadge level={prediction.level} size="lg" />
              <p className="text-xs text-text-muted mt-2">Confidence: {prediction.confidence}%</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-sm text-text-primary mb-2">Analysis</h4>
              <p className="text-sm text-text-muted leading-relaxed mb-4">{prediction.explanation}</p>
              
              {prediction.factors?.length > 0 && (
                <>
                  <h4 className="font-medium text-sm text-text-primary mb-2">Key Risk Factors</h4>
                  <ul className="space-y-1 mb-4">
                    {prediction.factors.map((f, i) => (
                      <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-risk-high mt-1.5 flex-shrink-0"></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="p-3 bg-surface-alt rounded-lg border border-border">
                <p className="text-sm font-medium text-text-primary">Recommendation</p>
                <p className="text-sm text-text-muted">{prediction.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3 — Combined Risk Assessment */}
      <CombinedRiskAssessment patient={patient} visits={visits} />

      {/* Visit History */}
      <div className="card">
        <h3 className="font-semibold text-text-primary mb-4">Visit History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Date</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">HbA1c</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Creatinine</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">eGFR</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Urea</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">ACR</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">BP</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">CKD</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-text-muted uppercase">Risk</th>
              </tr>
            </thead>
            <tbody>
              {[...visits].reverse().map(visit => (
                <tr key={visit.id || visit._id} className="border-b border-border/50">
                  <td className="py-2 px-2 text-sm">{new Date(visit.visitDate).toLocaleDateString('en-IN')}</td>
                  <td className="py-2 px-2 text-sm font-mono">{visit.hba1c}%</td>
                  <td className="py-2 px-2 text-sm font-mono">{visit.creatinine}</td>
                  <td className="py-2 px-2 text-sm font-mono font-semibold">{visit.eGFR}</td>
                  <td className="py-2 px-2 text-sm font-mono">{visit.bloodUrea}</td>
                  <td className="py-2 px-2 text-sm font-mono">{visit.urineACR}</td>
                  <td className="py-2 px-2 text-sm font-mono">{visit.systolicBP}/{visit.diastolicBP}</td>
                  <td className="py-2 px-2 text-sm">{visit.ckdStageAtVisit && `Stage ${visit.ckdStageAtVisit}`}</td>
                  <td className="py-2 px-2">{visit.riskLevelAtVisit && <RiskBadge level={visit.riskLevelAtVisit} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ pctChange, isInverse }) {
  if (pctChange === null) return <span className="text-xs text-text-muted">—</span>;
  
  let status, color;
  const absChange = Math.abs(pctChange);
  
  if (isInverse) {
    if (pctChange <= -5) { status = 'Improving'; color = 'bg-green-100 text-green-800'; }
    else if (pctChange < 15) { status = 'Normal'; color = 'bg-gray-100 text-gray-800'; }
    else if (pctChange < 50) { status = 'Concerning'; color = 'bg-orange-100 text-orange-800'; }
    else { status = 'Critical'; color = 'bg-red-100 text-red-800'; }
  } else {
    if (pctChange >= 5) { status = 'Improving'; color = 'bg-green-100 text-green-800'; }
    else if (pctChange > -15) { status = 'Normal'; color = 'bg-gray-100 text-gray-800'; }
    else if (pctChange > -30) { status = 'Concerning'; color = 'bg-orange-100 text-orange-800'; }
    else { status = 'Critical'; color = 'bg-red-100 text-red-800'; }
  }

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{status}</span>
  );
}

// ==========================================================
// Stage 3 — Combined Risk Assessment
// Combines Stage 1 (home eye screening + physical signs) with
// Stage 2 (blood test trajectory) scores. Purely additive —
// renders nothing that touches Stage 2 scoring logic itself.
// ==========================================================
function CombinedRiskAssessment({ patient, visits }) {
  const stage1Score = patient?.stage1Score;
  const stage1Level = patient?.stage1Level;
  const stage2Score = patient?.currentRiskScore;
  const stage2Level = patient?.currentRiskLevel;

  const hasStage1 = stage1Score !== null && stage1Score !== undefined;
  const hasStage2 = stage2Score !== null && stage2Score !== undefined;

  if (!hasStage1 && !hasStage2) return null;

  return (
    <div className="card mb-8">
      <h3 className="font-semibold text-text-primary mb-1">Combined Risk Assessment</h3>
      <p className="text-xs text-text-muted mb-5">Stage 3 — combines home eye screening with blood test trajectory</p>

      {hasStage1 && (
        <ScoreRow
          label="Stage 1 Score"
          sublabel="Physical Signs"
          score={stage1Score}
          level={stage1Level}
        />
      )}

      {hasStage2 && (
        <ScoreRow
          label="Stage 2 Score"
          sublabel="Blood Tests"
          score={stage2Score}
          level={stage2Level}
        />
      )}

      {hasStage1 && !hasStage2 && (
        <p className="text-sm text-text-muted italic mt-2">
          Add blood test results to get combined score
        </p>
      )}

      {!hasStage1 && hasStage2 && (
        <p className="text-sm text-text-muted italic mt-2">
          Complete home eye screening to get combined score
        </p>
      )}

      {hasStage1 && hasStage2 && (
        <CombinedResult
          patient={patient}
          stage1Score={stage1Score}
          stage1Level={stage1Level}
          stage2Score={stage2Score}
          stage2Level={stage2Level}
          visits={visits}
        />
      )}
    </div>
  );
}

function ScoreRow({ label, sublabel, score, level }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm font-semibold text-text-primary">{label}</span>
          <span className="text-xs text-text-muted ml-2">{sublabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-text-primary">{score}</span>
          <RiskBadge level={level} />
        </div>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={getScoreBarColorClass(score)}
          style={{ width: `${score}%`, height: '100%' }}
        />
      </div>
    </div>
  );
}

function CombinedResult({ patient, stage1Score, stage1Level, stage2Score, stage2Level, visits }) {
  const result = computeCombinedRisk(patient, stage1Score, stage1Level, stage2Score, stage2Level, visits);

  return (
    <>
      <div className="border-t border-border my-4"></div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <span className="text-sm font-bold text-text-primary">Stage 3 Score</span>
            <span className="text-xs text-text-muted ml-2">Combined Final</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-text-primary">{result.stage3Score}</span>
            <RiskBadge level={result.stage3Level} size="lg" />
          </div>
        </div>
        <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={getScoreBarColorClass(result.stage3Score)}
            style={{ width: `${result.stage3Score}%`, height: '100%' }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1.5">Confidence: {result.confidencePercent}%</p>
      </div>

      <div className="p-3 bg-surface-alt rounded-lg border border-border mb-3">
        <p className="text-sm text-text-primary leading-relaxed">{result.explanationEn}</p>
      </div>
      <div className="p-3 bg-surface-alt rounded-lg border border-border mb-4">
        <p className="text-sm text-text-primary leading-relaxed">{result.explanationTa}</p>
      </div>

      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm font-medium text-text-primary">Recommendation:</p>
        <p className="text-sm text-text-muted mb-2">{result.recommendationEn}</p>
        <p className="text-sm font-medium text-text-primary">உங்கள் பரிந்துரை:</p>
        <p className="text-sm text-text-muted">{result.recommendationTa}</p>
      </div>
    </>
  );
}
