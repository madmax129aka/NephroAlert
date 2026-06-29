import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PatientNew() {
  const [form, setForm] = useState({
    fullName: '', age: '', gender: 'Male', village: '',
    phc: '', diabetesDuration: '', smokingStatus: false, bpHistory: false, phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/patients', {
        ...form,
        age: parseInt(form.age),
        diabetesDuration: parseInt(form.diabetesDuration)
      });
      toast.success('Patient created! Now add their first blood test results.');
      navigate(`/patients/${res.data.id || res.data._id}/visit/new`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Add New Patient</h1>
      <p className="text-text-muted mb-6">Register a new patient for CKD monitoring</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Full Name *</label>
            <input name="fullName" className="input-field" value={form.fullName} onChange={handleChange} required placeholder="Patient full name" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Age *</label>
              <input name="age" type="number" className="input-field" value={form.age} onChange={handleChange} required min="1" max="120" placeholder="Age" />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select name="gender" className="input-field" value={form.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Diabetes Duration (years) *</label>
              <input name="diabetesDuration" type="number" className="input-field" value={form.diabetesDuration} onChange={handleChange} required min="0" placeholder="Years" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Village *</label>
              <input name="village" className="input-field" value={form.village} onChange={handleChange} required placeholder="Village name" />
            </div>
            <div>
              <label className="label">PHC *</label>
              <input name="phc" className="input-field" value={form.phc} onChange={handleChange} required placeholder="Primary Health Center" />
            </div>
          </div>

          <div>
            <label className="label">Phone (Optional)</label>
            <input name="phone" className="input-field" value={form.phone} onChange={handleChange} placeholder="Contact number" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="smokingStatus" checked={form.smokingStatus} onChange={handleChange} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm">Smoker</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="bpHistory" checked={form.bpHistory} onChange={handleChange} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm">BP History</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Patient & Add Visit'}
            </button>
            <button type="button" onClick={() => navigate('/patients')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
