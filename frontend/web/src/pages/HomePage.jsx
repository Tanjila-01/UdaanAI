import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkGatewayHealth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  Database, 
  ShieldCheck,
  Compass,
  ArrowRight,
  UserPlus,
  LogIn,
  LayoutDashboard
} from 'lucide-react';

const HomePage = () => {
  const { user, profile } = useAuth();
  const [gatewayStatus, setGatewayStatus] = useState({
    loading: true,
    connected: false,
    data: null,
    error: null,
  });

  const fetchHealth = async () => {
    setGatewayStatus((prev) => ({ ...prev, loading: true }));
    const result = await checkGatewayHealth();
    if (result.success) {
      setGatewayStatus({
        loading: false,
        connected: true,
        data: result.data,
        error: null,
      });
    } else {
      setGatewayStatus({
        loading: false,
        connected: false,
        data: null,
        error: result.error,
      });
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const microservices = [
    { name: 'API Gateway Service', folder: 'api-gateway', port: 8000, schema: 'N/A', status: 'Active Proxy', role: 'Entry point & API proxy router' },
    { name: 'Authentication Service', folder: 'auth-service', port: 8001, schema: 'auth', status: 'Phase 2 Active', role: 'JWT identity, login & registration' },
    { name: 'Student Profile Service', folder: 'student-service', port: 8002, schema: 'student', status: 'Phase 2 Active', role: 'Class 8-12 profile & onboarding' },
    { name: 'Assessment Service', folder: 'assessment-service', port: 8003, schema: 'assessment', status: 'Phase 1 Skeleton', role: 'Interests, skills & personality scoring' },
    { name: 'AI Career Intelligence Service', folder: 'ai-career-service', port: 8004, schema: 'career_ai', status: 'Phase 1 Skeleton', role: 'Career recommendations & insights' },
    { name: 'Career Roadmap Service', folder: 'roadmap-service', port: 8005, schema: 'roadmap', status: 'Phase 1 Skeleton', role: 'Path After Class 10 explorer & goals' },
    { name: 'Institution Service', folder: 'institution-service', port: 8006, schema: 'institution', status: 'Phase 1 Skeleton', role: 'Public institution info & workshops' },
    { name: 'Admin and Analytics Service', folder: 'admin-analytics-service', port: 8007, schema: 'admin_analytics', status: 'Phase 1 Skeleton', role: 'Platform metrics & admin dashboard' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Compass className="w-3.5 h-3.5" />
              <span>Karnataka Career Exploration & Education Pathway Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              AI-Powered Future Skills & Path Explorer for Karnataka Students
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Empowering Karnataka Board students in **Classes 8–10** and **Classes 11–12 (PUC)** to discover their strengths, explore post-Class 10 education pathways (PUC, Diploma, ITI, Skill routes), and set actionable goals.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              {user ? (
                <Link
                  to={profile ? "/dashboard" : "/onboarding"}
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Student Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register as Student</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Student Sign In</span>
                  </Link>
                </>
              )}

              <a 
                href="http://localhost:8000/docs" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-4 py-3 rounded-xl font-medium text-xs transition-colors"
              >
                <span>API Gateway Swagger Docs</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Gateway Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gateway Health Status</span>
              {gatewayStatus.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-white">
              {gatewayStatus.loading ? (
                <span className="text-slate-400 text-base font-normal">Pinging Gateway...</span>
              ) : gatewayStatus.connected ? (
                <span className="text-emerald-400">API Gateway: Connected</span>
              ) : (
                <span className="text-rose-400">API Gateway: Unavailable</span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {gatewayStatus.connected 
                ? `Response: HTTP 200 | Service: ${gatewayStatus.data?.service} (v${gatewayStatus.data?.version})`
                : gatewayStatus.error || 'Could not connect to API Gateway at http://localhost:8000.'}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Phase 2 Status</span>
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              Auth & Profile Active
            </div>
            <p className="text-xs text-slate-400">
              Student Registration, Login, JWT Tokens, and Academic Profile Onboarding implemented.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Boundaries</span>
              <ShieldCheck className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              Isolated Schemas
            </div>
            <p className="text-xs text-slate-400">
              PostgreSQL isolated schemas (`auth` & `student` populated for Phase 2).
            </p>
          </div>
        </div>

        {/* Microservices Matrix */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Microservice Architecture Matrix</h2>
              <p className="text-sm text-slate-400 mt-1">Static Architecture Specification & Port Mappings (Frontend connects strictly via API Gateway)</p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              Total Services: 8 Backend + 1 Frontend + 1 Postgres
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Service Name</th>
                  <th className="px-6 py-4">Directory</th>
                  <th className="px-6 py-4">Port</th>
                  <th className="px-6 py-4">Schema</th>
                  <th className="px-6 py-4">Phase 2 Status</th>
                  <th className="px-6 py-4">Responsibility & Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {microservices.map((svc) => (
                  <tr key={svc.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center space-x-2">
                      <Server className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>{svc.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{svc.folder}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300">
                        {svc.port}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-violet-300">
                        {svc.schema}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2.5 py-0.5 rounded-full ${
                        svc.status.includes('Active')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {svc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{svc.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            Udaan AI — AI-Powered Career Exploration and Education Pathway Platform for Karnataka Students
          </div>
          <div>
            Phase 2 Authentication & Profile Foundation Active
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
