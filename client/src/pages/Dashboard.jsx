import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, AlertTriangle, Bell, Plus } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/ui/StatCard';
import RiskBadge from '../components/ui/RiskBadge';
import RiskDonut from '../components/charts/RiskDonut';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">CKD Progression Monitoring Overview</p>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Patients" value={stats?.totalPatients || 0} color="#0F4C81" icon={Users} />
        <StatCard title="Critical Risk" value={stats?.riskBreakdown?.Critical || 0} color="#DC2626" icon={AlertCircle} />
        <StatCard title="High Risk" value={stats?.riskBreakdown?.High || 0} color="#EA580C" icon={AlertTriangle} />
        <StatCard title="Active Alerts" value={stats?.activeAlerts || 0} color="#D97706" icon={Bell} />
      </div>

      {/* Charts + Alerts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Risk Distribution */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Patient Risk Distribution</h3>
          <RiskDonut data={stats?.riskBreakdown} />
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Recent Alerts</h3>
          {stats?.recentAlerts?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAlerts.map(alert => (
                <div
                  key={alert._id || alert.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-alt cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate(`/patients/${alert.patientId}`)}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    alert.riskLevel === 'Critical' ? 'bg-risk-critical' : 'bg-risk-high'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{alert.patientName}</p>
                    <p className="text-xs text-text-muted truncate">{alert.explanation?.slice(0, 80)}...</p>
                  </div>
                  <RiskBadge level={alert.riskLevel} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No recent alerts</p>
          )}
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">Recent Patients</h3>
          <button onClick={() => navigate('/patients')} className="text-sm text-primary hover:underline font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Name</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Age</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">CKD Stage</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Risk Level</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-text-muted uppercase">Last Visit</th>
                <th className="text-right py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentPatients?.map(patient => (
                <tr key={patient.id || patient._id} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                  <td className="py-3 px-2 font-medium text-sm">{patient.fullName}</td>
                  <td className="py-3 px-2 text-sm text-text-muted">{patient.age}y, {patient.gender}</td>
                  <td className="py-3 px-2">
                    {patient.currentCKDStage && (
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-alt">
                        Stage {patient.currentCKDStage}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2"><RiskBadge level={patient.currentRiskLevel} /></td>
                  <td className="py-3 px-2 text-sm text-text-muted">
                    {patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => navigate(`/patients/${patient.id || patient._id}`)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
