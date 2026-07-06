import { useState, useEffect } from 'react';
import { Search, Link2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const levelColor = {
  Low: 'bg-risk-low',
  Moderate: 'bg-risk-moderate',
  High: 'bg-risk-high',
  Critical: 'bg-risk-critical'
};

export default function AdminScreenings() {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unlinked | high-critical
  const [search, setSearch] = useState('');

  const [linkModalScreening, setLinkModalScreening] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchScreenings();
  }, []);

  const fetchScreenings = async () => {
    try {
      const res = await api.get('/screening/home');
      setScreenings(res.data);
    } catch {
      toast.error('Failed to load home screenings');
    } finally {
      setLoading(false);
    }
  };

  const openLinkModal = async (screening) => {
    setLinkModalScreening(screening);
    setSelectedPatientId('');
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch {
      toast.error('Failed to load patients');
    }
  };

  const handleLink = async () => {
    if (!selectedPatientId || !linkModalScreening) return;
    setLinking(true);
    try {
      await api.put(`/screening/home/${linkModalScreening.screeningId}/link/${selectedPatientId}`);
      toast.success('Screening linked to patient');
      setLinkModalScreening(null);
      fetchScreenings();
    } catch {
      toast.error('Failed to link screening');
    } finally {
      setLinking(false);
    }
  };

  const filtered = screenings.filter(s => {
    if (search && !s.screeningId.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'unlinked' && s.linkedPatientId) return false;
    if (filter === 'high-critical' && !['High', 'Critical'].includes(s.stage1Level)) return false;
    return true;
  });

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
          <h1 className="text-2xl font-bold text-text-primary">Home Screenings</h1>
          <p className="text-text-muted">Stage 1 anonymous home eye screening submissions</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by Screening ID (e.g. NS1234567)"
            className="input-field pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-48" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Screenings</option>
          <option value="unlinked">Not Linked</option>
          <option value="high-critical">High / Critical</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No home screenings found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Screening ID</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Date</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Score</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Level</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="text-right py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.screeningId} className="border-b border-border/50">
                  <td className="py-3 px-2 font-mono text-sm font-semibold">{s.screeningId}</td>
                  <td className="py-3 px-2 text-sm text-text-muted">
                    {s.createdAt ? new Date(s.createdAt).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold">{s.stage1Score}/100</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center font-bold uppercase text-white rounded-full px-2.5 py-0.5 text-xs ${levelColor[s.stage1Level] || 'bg-gray-400'}`}>
                      {s.stage1Level}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {s.linkedPatientId ? (
                      <span className="text-green-700 font-medium">Linked (Patient #{s.linkedPatientId})</span>
                    ) : (
                      <span className="text-text-muted">Not linked</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {!s.linkedPatientId && (
                      <button
                        onClick={() => openLinkModal(s)}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1 justify-end w-full"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Link to Patient
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link modal */}
      {linkModalScreening && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Link {linkModalScreening.screeningId} to a Patient</h3>
              <button onClick={() => setLinkModalScreening(null)}>
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Score {linkModalScreening.stage1Score}/100 · {linkModalScreening.stage1Level} risk
            </p>
            <label className="label">Select Patient</label>
            <select
              className="input-field mb-4"
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
            >
              <option value="">-- Select a patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.age}y, {p.gender})</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setLinkModalScreening(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleLink}
                disabled={!selectedPatientId || linking}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {linking ? 'Linking...' : 'Link Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
