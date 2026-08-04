import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Zap, Menu } from 'lucide-react';

const Header = ({ onMenuClick, onEditProfileClick }) => {
  const { user, profile } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input UI Placeholder */}
        <div className="relative hidden sm:block w-72 lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            readOnly
            placeholder="Search pathways, streams, ITI trades, SSLC options..."
            className="w-full bg-[#F8FAF8] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-[#0F172A] focus:outline-none cursor-not-allowed placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Navigation & Profile Controls */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Progress XP Badge */}
        <div className="flex items-center space-x-1.5 bg-orange-50 border border-orange-200 text-[#F97316] px-3 py-1.5 rounded-full text-xs font-extrabold shadow-2xs">
          <Zap className="w-3.5 h-3.5 fill-[#F97316] text-[#F97316]" />
          <span>150 Trail Points</span>
        </div>

        {/* Notification Bell */}
        <button 
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#005F60]"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* Student Profile Trigger Button */}
        <button
          onClick={onEditProfileClick}
          className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-teal-50/50 transition-colors border border-transparent hover:border-teal-200 cursor-pointer"
          title="View & Edit Student Profile"
        >
          <div className="w-8 h-8 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-xs shadow-xs">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="text-left hidden md:block">
            <span className="text-xs font-black text-[#0F172A] block leading-tight">
              {user?.full_name || 'Student User'}
            </span>
            <span className="text-[10px] text-[#005F60] font-extrabold block leading-tight">
              {profile?.current_level || 'Class 10'} {profile?.stream ? `• ${profile.stream}` : ''}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
