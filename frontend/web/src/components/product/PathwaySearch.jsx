import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Compass, ChevronRight, Layers } from 'lucide-react';
import { buildSearchIndex } from '../../utils/pathwayAdapter';

const PathwaySearch = ({ apiPathways = [], onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);

  // Build index from apiPathways
  const searchIndexRef = useRef([]);

  useEffect(() => {
    if (apiPathways && apiPathways.length > 0) {
      searchIndexRef.current = buildSearchIndex(apiPathways);
    }
  }, [apiPathways]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const clean = query.trim().toLowerCase();
    const matches = [];
    const seen = new Set();

    searchIndexRef.current.forEach((item) => {
      if (item.term.toLowerCase().includes(clean)) {
        const key = `${item.pathwayId}-${item.term}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push(item);
        }
      }
    });

    setResults(matches.slice(0, 8)); // Top 8 matches
    setIsOpen(matches.length > 0);
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.term);
    setIsOpen(false);
    onSelectResult({
      pathwayId: item.pathwayId,
      pathway: item.pathway,
      option: item.option || null
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full font-sans">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder="Search course or career (e.g. MBBS, NEET, BCA, CSE, CA, Law, Nursing, DCET)..."
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 text-xs font-semibold placeholder:text-slate-400 pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 focus:border-[#005F60] focus:ring-2 focus:ring-[#005F60]/20 transition-all outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
          {results.map((item, idx) => (
            <div
              key={`${item.pathwayId}-${item.term}-${idx}`}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-teal-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {item.term}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold truncate">
                  {item.subtitle}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-black text-[#005F60] shrink-0">
                <span>View</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PathwaySearch;
