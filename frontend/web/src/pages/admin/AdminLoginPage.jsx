import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const AdminLoginPage = () => {
  const { user, loading: authLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated:
  // Admin -> redirect to /admin
  // Student -> redirect to /dashboard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center font-sans">
        <div className="text-xs font-bold text-teal-400 animate-pulse flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = formData.email.trim().toLowerCase();

    try {
      const data = await login(cleanEmail, formData.password);
      if (data.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        // Authenticated user is not an administrator.
        // Safely clear session to avoid retaining student token from failed admin sign in.
        await logout();
        setError('This account does not have administrator access.');
      }
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#005F60] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#005F60] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-tight text-white">Udaan AI</span>
                <span className="bg-[#005F60]/40 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                  ADMIN CONSOLE
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316]"></span>
            <span className="text-[11px] font-medium text-slate-400">Restricted Operational Portal</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-teal-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Operations Management</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Admin Sign In</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access workshop operations and institution requests.
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-start space-x-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="admin-email-input"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your admin email"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#005F60] focus:ring-1 focus:ring-[#005F60] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="admin-password-input"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#005F60] focus:ring-1 focus:ring-[#005F60] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              id="admin-submit-button"
              disabled={loading}
              className="w-full bg-[#005F60] hover:bg-[#004d4e] active:bg-[#004041] text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-teal-950/40 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 cursor-pointer"
            >
              <span>{loading ? 'Authenticating Admin...' : 'Sign In to Admin Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center space-y-3">
            <p className="text-[11px] text-slate-500 font-medium">
              Authorized administrators only.
            </p>
            <div className="pt-1">
              <Link
                to="/login"
                className="inline-flex items-center text-xs text-slate-400 hover:text-teal-400 transition-colors"
              >
                ← Back to Student Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        Udaan AI — Workshop Operations Administration
      </footer>
    </div>
  );
};

export default AdminLoginPage;
