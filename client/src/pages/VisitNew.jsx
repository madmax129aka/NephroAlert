import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import api from '../services/api';
import { calculateEGFR, getCKDStageInfo } from '../utils/egfr';
import toast from 'react-hot-toast';

export default function VisitNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eGFR, setEGFR] = useState(null);
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    hba1c: '', creatinine: '', bloodUrea: '',
    systolicBP: '', diastolicBP: '', urineACR: '', notes: ''
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${id}`);
        setPatient(res.data.patient);
      } catch {
        toast.error('Patient not found');
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  // Live eGFR calculation
  useEffect(() => {
    if (form.creatinine && patient) {
      const value = calculateEGFR(parseFloat(form.creatinine), patient.age, patient.gender);
      setEGFR(value);
    } else {
      setEGFR(null);
    }
  }, [form.creatinine, patient]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/patients/${id}/visits`, {
        ...form,
        hba1c: parseFloat(form.hba1c),
        creatinine: parseFloat(form.creatinine),
        bloodUrea: parseFloat(form.bloodUrea),
        systolicBP: parseInt(form.systolicBP),
        diastolicBP: parseInt(form.diastolicBP),
        urineACR: parseFloat(form.urineACR)
      });
      toast.success('Visit recorded! AI analysis complete.');
      navigate(`/patients/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save visit');
    } finally {
      setSubmitting(false);
    }
  };

  const stageInfo = eGFR ? getCKDStageInfo(eGFR) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add New Visit</h1>
      <p className="text-text-muted mb-6">Patient: <span className="font-medium text-text-primary">{patient?.fullName}</span> ({patient?.age}y, {patient?.gender})</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Visit Date */}
          <div>
            <label className="label">Visit Date</label>
            <input name="visitDate" type="date" className="input-field" value={form.visitDate} onChange={handleChange} required />
          </div>

          {/* Biomarkers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">HbA1c (%)
                <span className="text-text-muted font-normal ml-1">Normal: &lt;7.0</span>
              </label>
              <input name="hba1c" type="number" step="0.1" className="input-field" value={form.hba1c} onChange={handleChange} required placeholder="e.g. 7.5" min="3" max="20" />
            </div>
            <div>
              <label className="label">Serum Creatinine (mg/dL)
                <span className="text-text-muted font-normal ml-1">Normal: 0.7-1.2</span>
              </label>
              <input name="creatinine" type="number" step="0.01" className="input-field" value={form.creatinine} onChange={handleChange} required placeholder="e.g. 1.1" min="0.1" max="30" />
            </div>
            <div>
              <label className="label">Blood Urea (mg/dL)
                <span className="text-text-muted font-normal ml-1">Normal: 7-20</span>
              </label>
              <input name="bloodUrea" type="number" step="0.1" className="input-field" value={form.bloodUrea} onChange={handleChange} required placeholder="e.g. 18" min="1" max="300" />
            </div>
            <div>
              <label className="label">Urine ACR (mg/g)
                <span className="text-text-muted font-normal ml-1">Normal: &lt;30</span>
              </label>
              <input name="urineACR" type="number" step="0.1" className="input-field" value={form.urineACR} onChange={handleChange} required placeholder="e.g. 25" min="0" max="10000" />
            </div>
            <div>
              <label className="label">Systolic BP (mmHg)
                <span className="text-text-muted font-normal ml-1">Normal: &lt;120</span>
              </label>
              <input name="systolicBP" type="number" className="input-field" value={form.systolicBP} onChange={handleChange} required placeholder="e.g. 130" min="60" max="300" />
            </div>
            <div>
              <label className="label">Diastolic BP (mmHg)
                <span className="text-text-muted font-normal ml-1">Normal: &lt;80</span>
              </label>
              <input name="diastolicBP" type="number" className="input-field" value={form.diastolicBP} onChange={handleChange} required placeholder="e.g. 85" min="30" max="200" />
            </div>
          </div>

          {/* Auto-calculated eGFR */}
          <div className={`p-4 rounded-lg border-2 ${eGFR ? (eGFR >= 60 ? 'border-green-200 bg-green-50' : eGFR >= 30 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50') : 'border-border bg-surface-alt'}`}>
            <div className="flex items-center gap-3">
              <Calculator className={`w-5 h-5 ${eGFR ? 'text-primary' : 'text-text-muted'}`} />
              <div className="flex-1">
                <p className="text-xs font-medium text-text-muted">eGFR (Auto-calculated using CKD-EPI 2021)</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-text-primary">
                    {eGFR !== null ? eGFR : '—'}
                  </span>
                  <span className="text-sm text-text-muted">mL/min/1.73m²</span>
                  {stageInfo && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: stageInfo.color }}>
                      {stageInfo.label}
                    </span>
                  )}
                </div>
                {stageInfo && <p className="text-xs text-text-muted mt-0.5">{stageInfo.description}</p>}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Doctor Notes (Optional)</label>
            <textarea name="notes" className="input-field h-20 resize-none" value={form.notes} onChange={handleChange} placeholder="Any additional observations..." />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? 'Analyzing patient data...' : 'Save Visit & Run AI Analysis'}
            </button>
            <button type="button" onClick={() => navigate(`/patients/${id}`)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
