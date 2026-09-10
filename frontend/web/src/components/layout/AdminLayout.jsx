import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  School,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Workshop Requests', path: '/admin/requests', icon: ClipboardList },
    { label: 'Scheduled', path: '/admin/scheduled', icon: CalendarCheck },
    { label: 'Completed', path: '/admin/completed', icon: CheckCircle2 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#005F60] flex items-center justify-center text-white shadow-sm">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">Udaan AI</span>
                <span className="bg-[#005F60] text-teal-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Workshop Operations</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors px-2 py-1 rounded"
              title="View public website in new tab"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center space-x-2 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-slate-300 font-medium hidden sm:inline">{user?.email || 'admin@udaan.ai'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Left Operational Navigation */}
        <aside className="w-60 flex-shrink-0 hidden md:block">
          <nav className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs sticky top-24 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Operations Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#005F60] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 px-2 py-1 flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1.5 px-2 text-[10px] font-bold ${
                  isActive ? 'text-teal-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Operational Workspace View */}
        <main className="flex-1 min-w-0 pb-16 md:pb-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
