import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', designation: 'Doctor', phcName: '', district: '',
    state: 'Tamil Nadu', email: '', password: '', confirmPassword: '', medicalRegNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-text-primary">NephroAlert</span>
          </Link>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Create Account</h2>
          <p className="text-text-muted mb-6">Register to start monitoring your patients</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input name="fullName" className="input-field" value={form.fullName} onChange={handleChange} required placeholder="Dr. Full Name" />
              </div>
              <div>
                <label className="label">Designation</label>
                <select name="designation" className="input-field" value={form.designation} onChange={handleChange}>
                  <option>Doctor</option>
                  <option>Nurse</option>
                  <option>Health Worker</option>
                </select>
              </div>
              <div>
                <label className="label">Medical Reg. Number</label>
                <input name="medicalRegNumber" className="input-field" value={form.medicalRegNumber} onChange={handleChange} placeholder="Optional" />
              </div>
              <div>
                <label className="label">PHC Name</label>
                <input name="phcName" className="input-field" value={form.phcName} onChange={handleChange} required placeholder="Primary Health Center" />
              </div>
              <div>
                <label className="label">District</label>
                <input name="district" className="input-field" value={form.district} onChange={handleChange} required placeholder="District" />
              </div>
              <div className="col-span-2">
                <label className="label">State</label>
                <input name="state" className="input-field" value={form.state} onChange={handleChange} />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input name="email" type="email" className="input-field" value={form.email} onChange={handleChange} required placeholder="email@example.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" className="input-field" value={form.password} onChange={handleChange} required placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input name="confirmPassword" type="password" className="input-field" value={form.confirmPassword} onChange={handleChange} required placeholder="Confirm" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-text-muted text-sm">
            Already registered?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
