import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { 
  Home, 
  Compass, 
  Sparkles, 
  Map, 
  LogOut, 
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Career Discovery Assessment', icon: Sparkles, path: '/assessment' },
    { label: 'Explore Pathways', icon: Compass, path: '/pathways' },
    { label: 'My Career Roadmap', icon: Map, path: '/my-roadmap' },
  ];

  const handleNavClick = (path) => {
    if (path) {
      navigate(path);
      if (onClose) onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
          
          {/* Logo & Toggle Header */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center lg:justify-center' : 'justify-between'} px-1`}>
            
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2.5 group" title="Udaan AI Dashboard">
              <div className="w-10 h-10 rounded-2xl bg-[#005F60] flex items-center justify-center text-white shadow-md shadow-[#005F60]/20 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              
              {!isCollapsed && (
                <div className="hidden lg:block overflow-hidden">
                  <span className="font-black text-lg tracking-tight text-[#0F172A] block leading-tight">
                    Udaan AI
                  </span>
                  <span className="text-[9px] text-[#005F60] font-extrabold uppercase tracking-wider block">
                    Karnataka Student
                  </span>
                </div>
              )}
              {/* Mobile text */}
              <div className="lg:hidden">
                <span className="font-black text-lg tracking-tight text-[#0F172A] block leading-tight">
                  Udaan AI
                </span>
                <span className="text-[9px] text-[#005F60] font-extrabold uppercase tracking-wider block">
                  Karnataka Student
                </span>
              </div>
            </Link>

            {/* Desktop Collapse/Expand Toggle Button */}
            {!isCollapsed ? (
              <button 
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:flex text-slate-400 hover:text-[#005F60] hover:bg-teal-50 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:flex text-slate-400 hover:text-[#005F60] hover:bg-teal-50 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 mt-2"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Close Button */}
            <button 
              type="button"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px bg-slate-100 my-1"></div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0 lg:px-0 py-2.5' : 'space-x-3 px-3 py-2.5'
                  } rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-[#005F60] border border-teal-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-[#F8FAF8] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#005F60]' : 'text-slate-400'}`} />
                  
                  {!isCollapsed && (
                    <span className="hidden lg:inline truncate">{item.label}</span>
                  )}
                  {/* Mobile label */}
                  <span className="lg:hidden truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Sign Out */}
        <div className="p-3 border-t border-slate-100 bg-[#F8FAF8] space-y-2">
          
          {/* Badge */}
          {!isCollapsed ? (
            <div className="hidden lg:flex px-3 py-2 rounded-xl bg-teal-50/80 border border-teal-100 text-[11px] text-[#005F60] items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#005F60] animate-pulse shrink-0"></div>
              <span className="font-extrabold truncate">Karnataka Edition</span>
            </div>
          ) : (
            <div className="hidden lg:flex justify-center py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#005F60] animate-pulse" title="Karnataka Student Edition"></div>
            </div>
          )}

          {/* Mobile Badge */}
          <div className="lg:hidden px-3 py-2 rounded-xl bg-teal-50/80 border border-teal-100 text-[11px] text-[#005F60] flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#005F60] animate-pulse shrink-0"></div>
            <span className="font-extrabold truncate">Karnataka Edition</span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center py-2' : 'justify-center space-x-2 px-3 py-2'
            } rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/60 cursor-pointer`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span className="hidden lg:inline">Sign Out</span>}
            <span className="lg:hidden">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
