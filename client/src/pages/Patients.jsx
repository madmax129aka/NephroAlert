import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import api from '../services/api';
import RiskBadge from '../components/ui/RiskBadge';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data);
        setFiltered(res.data);
      } catch (error) {
        console.error('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    let result = patients;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => 
        p.fullName.toLowerCase().includes(s) || p.village.toLowerCase().includes(s)
      );
    }
    if (riskFilter) {
      result = result.filter(p => p.currentRiskLevel === riskFilter);
    }
    if (stageFilter) {
      result = result.filter(p => p.currentCKDStage === parseInt(stageFilter));
    }
    setFiltered(result);
  }, [search, riskFilter, stageFilter, patients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">All Patients</h1>
          <p className="text-text-muted">{patients.length} patients registered</p>
        </div>
        <button onClick={() => navigate('/patients/new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or village..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field w-40" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select className="input-field w-40" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">All CKD Stages</option>
            <option value="1">Stage 1</option>
            <option value="2">Stage 2</option>
            <option value="3">Stage 3</option>
            <option value="4">Stage 4</option>
            <option value="5">Stage 5</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">Patient Name</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">Age/Gender</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">Village</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">Diabetes</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">CKD Stage</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">Risk Level</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-text-muted uppercase">Last Visit</th>
              <th className="text-right py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(patient => (
              <tr 
                key={patient.id || patient._id} 
                className="border-b border-border/50 hover:bg-surface-alt transition-colors cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id || patient._id}`)}
              >
                <td className="py-3 px-3 font-medium text-sm">{patient.fullName}</td>
                <td className="py-3 px-3 text-sm text-text-muted">{patient.age}y, {patient.gender}</td>
                <td className="py-3 px-3 text-sm text-text-muted">{patient.village}</td>
                <td className="py-3 px-3 text-sm text-text-muted">{patient.diabetesDuration}y</td>
                <td className="py-3 px-3">
                  {patient.currentCKDStage && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-alt">
                      Stage {patient.currentCKDStage}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3"><RiskBadge level={patient.currentRiskLevel} /></td>
                <td className="py-3 px-3 text-sm text-text-muted">
                  {patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="py-3 px-3 text-right">
                  <button className="text-xs font-medium text-primary hover:underline">View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-text-muted">No patients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
