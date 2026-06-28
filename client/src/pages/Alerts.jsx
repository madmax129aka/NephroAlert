import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import RiskBadge from '../components/ui/RiskBadge';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/alerts/read-all');
      setAlerts(alerts.map(a => ({ ...a, read: true })));
      toast.success('All alerts marked as read');
    } catch {
      toast.error('Failed to update alerts');
    }
  };

  const markRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts(alerts.map(a => a._id === alertId ? { ...a, read: true } : a));
    } catch {}
  };

  const filtered = filter === 'unread' ? alerts.filter(a => !a.read) : alerts;
  const unreadCount = alerts.filter(a => !a.read).length;

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
          <h1 className="text-2xl font-bold text-text-primary">Alerts</h1>
          <p className="text-text-muted">{unreadCount} unread alerts</p>
        </div>
        <div className="flex gap-3">
          <select className="input-field w-36" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Alerts</option>
            <option value="unread">Unread Only</option>
          </select>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary flex items-center gap-2">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted">No alerts to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <div
              key={alert._id}
              className={`card cursor-pointer hover:shadow-md transition-shadow ${
                !alert.read ? 'border-l-4 border-l-primary' : ''
              }`}
              onClick={() => {
                markRead(alert._id);
                navigate(`/patients/${alert.patientId?._id || alert.patientId}`);
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.riskLevel === 'Critical' ? 'bg-risk-critical' : 'bg-risk-high'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-text-primary">
                      {alert.patientId?.fullName || 'Patient'}
                    </span>
                    <RiskBadge level={alert.riskLevel} />
                    <span className="text-xs text-text-muted ml-auto">
                      {new Date(alert.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2">{alert.explanation}</p>
                  <p className="text-xs text-text-muted mt-1 font-medium">
                    Score: {alert.riskScore}/100
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
