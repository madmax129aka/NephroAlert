import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientNew from './pages/PatientNew';
import PatientDetail from './pages/PatientDetail';
import VisitNew from './pages/VisitNew';
import Alerts from './pages/Alerts';
import Export from './pages/Export';
import EyeScan from './pages/EyeScan';
import AdminScreenings from './pages/AdminScreenings';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading NephroAlert...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Stage 1 — public home eye screening tool, no login required */}
      <Route path="/eye-scan" element={<EyeScan />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/new" element={<PatientNew />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/patients/:id/visit/new" element={<VisitNew />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/export" element={<Export />} />
          <Route path="/admin-screenings" element={<AdminScreenings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
