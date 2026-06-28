import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nephroalert_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setDoctor(res.data.doctor);
        } catch {
          localStorage.removeItem('nephroalert_token');
          localStorage.removeItem('nephroalert_doctor');
          setToken(null);
          setDoctor(null);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, doctor: doc } = res.data;
    localStorage.setItem('nephroalert_token', newToken);
    localStorage.setItem('nephroalert_doctor', JSON.stringify(doc));
    setToken(newToken);
    setDoctor(doc);
    return doc;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('nephroalert_token');
    localStorage.removeItem('nephroalert_doctor');
    setToken(null);
    setDoctor(null);
  };

  const isAuthenticated = !!token && !!doctor;

  return (
    <AuthContext.Provider value={{ doctor, token, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
