import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  AlertCircle
} from 'lucide-react';

const QUICK_SEARCH_ITEMS = [
  {
    id: 'puc-science',
    title: 'PUC Science Stream (PCMB / PCMC)',
    category: 'PUC Stream',
    level: 'PUC (11th–12th)',
    description: 'Prepares for Engineering, Medical, Pure Sciences & Technology careers in Karnataka.',
    path: '/pathways?stream=Science&level=PUC&pathway_id=puc-science-eng'
  },
  {
    id: 'puc-commerce',
    title: 'PUC Commerce Stream (CEBA / SEBA)',
    category: 'PUC Stream',
    level: 'PUC (11th–12th)',
    description: 'Prepares for Finance, CA, Business Administration, Economics & Banking.',
    path: '/pathways?stream=Commerce&level=PUC&pathway_id=puc-commerce-fin'
  },
  {
    id: 'puc-arts',
    title: 'PUC Arts & Humanities (HEPS / EGAS)',
    category: 'PUC Stream',
    level: 'PUC (11th–12th)',
    description: 'Prepares for Civil Services, Law, Journalism, Humanities & Design.',
    path: '/pathways?stream=Arts&level=PUC&pathway_id=puc-arts-hum'
  },
  {
    id: 'diploma-cs',
    title: 'Polytechnic Diploma in Computer Science',
    category: '3-Year Diploma',
    level: 'Post Class 10',
    description: 'Practical technical training in programming, hardware & software development.',
    path: '/pathways?level=Class%2010&pathway_id=c10-diploma'
  },
  {
    id: 'diploma-mech',
    title: 'Polytechnic Diploma in Mechanical Engineering',
    category: '3-Year Diploma',
    level: 'Post Class 10',
    description: 'Manufacturing, machine design, automobile mechanics & industry skills.',
    path: '/pathways?level=Class%2010&pathway_id=c10-diploma'
  },
  {
    id: 'iti-electrician',
    title: 'ITI Electrician Trade',
    category: 'Vocational Trade',
    level: 'Post Class 10',
    description: 'Electrical wiring, motor control, industrial installations & technician certification.',
    path: '/pathways?level=Class%2010&pathway_id=c10-iti'
  },
  {
    id: 'iti-fitter',
    title: 'ITI Fitter Trade',
    category: 'Vocational Trade',
    level: 'Post Class 10',
    description: 'Precision machining, assembly, plant maintenance & mechanical trade skills.',
    path: '/pathways?level=Class%2010&pathway_id=c10-iti'
  },
  {
    id: 'career-assessment',
    title: 'Career Discovery Assessment',
    category: 'Self Discovery',
    level: 'All Students',
    description: 'Take guided interest test mapping your natural aptitude across streams & subjects.',
    path: '/assessment'
  },
  {
    id: 'my-roadmap',
    title: 'My Career Roadmap & Goals',
    category: 'Action Plan',
    level: 'Personalized',
    description: 'View your target milestones, step-by-step guidance & progress tracker.',
    path: '/my-roadmap'
  }
];

export const Header = ({ onMenuClick, onEditProfileClick }) => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Dropdown Menu State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter Search Results
  const filteredResults = searchQuery.trim() === ''
    ? []
    : QUICK_SEARCH_ITEMS.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Close overlays on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (path) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (filteredResults.length > 0) {
        handleSelectSearchResult(filteredResults[0].path);
      } else {
        setIsSearchOpen(false);
        navigate('/pathways');
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Interactive Search Container */}
        <div className="relative w-full" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pathways, streams, ITI trades, SSLC options..."
              className="w-full bg-[#F8FAF8] border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#005F60] focus:bg-white transition-all placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {searchQuery.trim() === '' ? (
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">
                    Quick Suggestions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {QUICK_SEARCH_ITEMS.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSearchResult(item.path)}
                        className="text-left p-2.5 rounded-xl hover:bg-teal-50/70 border border-slate-100 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#005F60]">
                            {item.title}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#005F60]" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Found {filteredResults.length} result{filteredResults.length > 1 ? 's' : ''}
                  </div>
                  {filteredResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSearchResult(item.path)}
                      className="w-full text-left p-3 rounded-xl hover:bg-teal-50/70 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#005F60]">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-extrabold text-[#005F60] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#005F60] shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                  <AlertCircle className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="font-bold text-[#0F172A]">No matching options found</p>
                  <p className="text-[11px]">Try searching for 'Science', 'Commerce', 'Diploma', or 'ITI'</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0 relative" ref={dropdownRef}>
        {/* Student Profile Info trigger for popover */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-3 p-1.5 rounded-xl border border-transparent hover:bg-slate-50 transition-all cursor-pointer text-left focus:outline-none"
          title="Student Profile Menu"
        >
          <div className="w-8 h-8 rounded-full bg-[#005F60] text-white flex items-center justify-center font-black text-xs shadow-xs">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="text-left hidden md:flex items-center gap-1.5">
            <div>
              <span className="text-xs font-black text-[#0F172A] block leading-tight">
                {user?.full_name || 'Student User'}
              </span>
              <span className="text-[10px] text-[#005F60] font-extrabold block leading-tight">
                {profile?.current_level || 'Class 10'} {profile?.stream ? `• ${profile.stream}` : ''}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">▼</span>
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                if (onEditProfileClick) onEditProfileClick();
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50/70 hover:text-[#005F60] transition-colors"
            >
              Edit Profile
            </button>
            <hr className="border-slate-100 my-1" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
