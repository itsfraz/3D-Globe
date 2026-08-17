import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Shuffle, Heart, Scale, GraduationCap, Sparkles, Moon, Sun, Layers, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  countries, 
  onSelectCountry,
  onRandomCountry,
  onOpenFavorites,
  onOpenCompare,
  isNightMode,
  onToggleNightMode,
  showArcs,
  onToggleArcs
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent_countries');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load recents:", e);
    }
  }, []);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Quick Actions Definition
  const quickActions = useMemo(() => [
    { id: 'random', label: 'Explore Random Country', icon: <Shuffle size={16} className="text-teal-400" />, action: onRandomCountry },
    { id: 'favorites', label: 'Open Favorites', icon: <Heart size={16} className="text-pink-400" />, action: onOpenFavorites },
    { id: 'compare', label: 'Compare Countries', icon: <Scale size={16} className="text-purple-400" />, action: onOpenCompare },
    { id: 'quiz', label: 'Start Geography Quiz', icon: <GraduationCap size={16} className="text-yellow-400" />, action: () => console.log('Quiz') },
    { id: 'ai', label: 'Open AI Guide', icon: <Sparkles size={16} className="text-blue-400" />, action: () => console.log('AI') },
    { id: 'night', label: isNightMode ? 'Disable Night Mode' : 'Enable Night Mode', icon: isNightMode ? <Sun size={16} className="text-orange-400" /> : <Moon size={16} className="text-indigo-400" />, action: onToggleNightMode },
    { id: 'layers', label: showArcs ? 'Hide Live Routes' : 'Show Live Routes', icon: <Layers size={16} className="text-cyan-400" />, action: onToggleArcs },
  ], [isNightMode, showArcs, onRandomCountry, onOpenFavorites, onOpenCompare, onToggleNightMode, onToggleArcs]);

  // Filter countries and actions
  const results = useMemo(() => {
    if (debouncedQuery.trim() === '') {
      return { countries: [], actions: [] };
    }
    
    const lowerQuery = debouncedQuery.toLowerCase();
    
    // Filter actions
    const filteredActions = quickActions.filter(a => a.label.toLowerCase().includes(lowerQuery));

    // Filter countries (name, iso2, iso3, region, subregion, capital)
    const filteredCountries = (countries || []).filter(c => {
      const p = c.properties;
      return (
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.iso_a2 && p.iso_a2.toLowerCase().includes(lowerQuery)) ||
        (p.iso_a3 && p.iso_a3.toLowerCase().includes(lowerQuery)) ||
        (p.region && p.region.toLowerCase().includes(lowerQuery)) ||
        (p.subregion && p.subregion.toLowerCase().includes(lowerQuery)) ||
        (p.capital && p.capital.toLowerCase().includes(lowerQuery))
      );
    }).slice(0, 15); // limit to 15 results for performance
      
    return { countries: filteredCountries, actions: filteredActions };
  }, [debouncedQuery, countries, quickActions]);

  // Aggregate the total flat list of results for keyboard navigation
  const flatResults = useMemo(() => {
    const list = [];
    if (debouncedQuery.trim() === '') {
      // Show recents if empty
      recentSearches.forEach(c => list.push({ type: 'recent', data: c }));
      quickActions.forEach(a => list.push({ type: 'action', data: a }));
    } else {
      results.actions.forEach(a => list.push({ type: 'action', data: a }));
      results.countries.forEach(c => list.push({ type: 'country', data: c }));
    }
    return list;
  }, [debouncedQuery, results, recentSearches, quickActions]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults.length, debouncedQuery]);

  const handleSelectCountry = (countryProps) => {
    // Add to recents
    setRecentSearches(prev => {
      const filtered = prev.filter(c => c.name !== countryProps.name);
      const updated = [countryProps, ...filtered].slice(0, 5); // Keep last 5
      try {
        localStorage.setItem('recent_countries', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    onSelectCountry(countryProps);
    onClose();
  };

  const handleExecuteAction = (actionObj) => {
    actionObj.action();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults.length > 0 && selectedIndex >= 0 && selectedIndex < flatResults.length) {
        const item = flatResults[selectedIndex];
        if (item.type === 'country' || item.type === 'recent') {
          handleSelectCountry(item.data.properties || item.data); // item.data is raw country for recent
        } else if (item.type === 'action') {
          handleExecuteAction(item.data);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const clearRecents = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('recent_countries');
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 sm:px-0 pointer-events-auto">
          
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#070a12]/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#0d1322]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Search Input Area */}
            <div className="relative flex items-center px-4 border-b border-white/10 shrink-0">
              <Search className="text-gray-400 shrink-0" size={20} />
              <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search countries, cities or actions..." 
                className="w-full bg-transparent border-none py-5 px-4 text-base sm:text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                role="combobox"
                aria-expanded={flatResults.length > 0}
                aria-controls="command-palette-results"
                aria-activedescendant={`cmd-item-${selectedIndex}`}
              />
              
              {query && (
                <button 
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              )}
              
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium bg-white/5 px-2 py-1 rounded border border-white/10 ml-2 shrink-0 pointer-events-none">
                <span className="text-gray-400">ESC</span>
              </div>
            </div>

            {/* Results Area */}
            <div 
              id="command-palette-results"
              className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar p-2"
              role="listbox"
            >
              {flatResults.length === 0 ? (
                <div className="py-10 text-center text-gray-500 flex flex-col items-center gap-3">
                  <Globe2 size={32} className="opacity-20" />
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  
                  {/* If query is empty, show sections for Recents and Actions */}
                  {debouncedQuery.trim() === '' && (
                    <>
                      {recentSearches.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recently Viewed</span>
                            <button onClick={clearRecents} className="text-[10px] font-semibold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider">Clear</button>
                          </div>
                          {flatResults.filter(r => r.type === 'recent').map((item) => {
                            const globalIdx = flatResults.indexOf(item);
                            return <ResultItem 
                                      key={`recent-${item.data.name}`} 
                                      item={item} 
                                      isActive={globalIdx === selectedIndex} 
                                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                                      onClick={() => handleSelectCountry(item.data)} 
                                      globalIdx={globalIdx}
                                   />
                          })}
                        </div>
                      )}
                      
                      <div>
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quick Actions</div>
                        {flatResults.filter(r => r.type === 'action').map((item) => {
                          const globalIdx = flatResults.indexOf(item);
                          return <ResultItem 
                                    key={`action-${item.data.id}`} 
                                    item={item} 
                                    isActive={globalIdx === selectedIndex} 
                                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    onClick={() => handleExecuteAction(item.data)} 
                                    globalIdx={globalIdx}
                                 />
                        })}
                      </div>
                    </>
                  )}

                  {/* If query is NOT empty, show Actions first, then Countries */}
                  {debouncedQuery.trim() !== '' && (
                    <>
                      {results.actions.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</div>
                          {flatResults.filter(r => r.type === 'action').map((item) => {
                            const globalIdx = flatResults.indexOf(item);
                            return <ResultItem 
                                      key={`search-action-${item.data.id}`} 
                                      item={item} 
                                      isActive={globalIdx === selectedIndex} 
                                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                                      onClick={() => handleExecuteAction(item.data)} 
                                      globalIdx={globalIdx}
                                   />
                          })}
                        </div>
                      )}

                      {results.countries.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Countries</div>
                          {flatResults.filter(r => r.type === 'country').map((item) => {
                            const globalIdx = flatResults.indexOf(item);
                            return <ResultItem 
                                      key={`search-country-${item.data.properties.name}`} 
                                      item={item} 
                                      isActive={globalIdx === selectedIndex} 
                                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                                      onClick={() => handleSelectCountry(item.data.properties)} 
                                      globalIdx={globalIdx}
                                   />
                          })}
                        </div>
                      )}
                    </>
                  )}

                </div>
              )}
            </div>

            {/* Footer Keyboard Hints */}
            <div className="hidden sm:flex items-center justify-between px-4 py-3 bg-[#070a12]/50 border-t border-white/10 shrink-0">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <span className="bg-white/5 border border-white/10 rounded px-1 text-[10px]">↑</span>
                    <span className="bg-white/5 border border-white/10 rounded px-1 text-[10px]">↓</span>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-white/5 border border-white/10 rounded px-1.5 text-[10px]">↵</span>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-white/5 border border-white/10 rounded px-1.5 text-[10px]">esc</span>
                  <span>Close</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium tracking-wide flex items-center gap-1">
                World Globe AI
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Sub-component for rendering individual result rows
function ResultItem({ item, isActive, onClick, onMouseEnter, globalIdx }) {
  // Use a ref to scroll into view when navigating via keyboard
  const itemRef = useRef(null);

  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isActive]);

  if (item.type === 'action') {
    return (
      <div 
        ref={itemRef}
        id={`cmd-item-${globalIdx}`}
        role="option"
        aria-selected={isActive}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
          isActive ? 'bg-teal-500/10 text-teal-300' : 'text-gray-300 hover:bg-white/5'
        }`}
      >
        <div className={`w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0 ${isActive ? 'bg-teal-500/20' : ''}`}>
          {item.data.icon}
        </div>
        <span className="font-medium text-sm">{item.data.label}</span>
      </div>
    );
  }

  // Country or Recent Country
  const countryData = item.type === 'country' ? item.data.properties : item.data;
  const iso = countryData.iso_a2;

  return (
    <div 
      ref={itemRef}
      id={`cmd-item-${globalIdx}`}
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
        isActive ? 'bg-teal-500/10 text-teal-300' : 'text-gray-300 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {iso ? (
          <img 
            src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`} 
            alt={countryData.name}
            className="w-5 h-3.5 object-cover rounded shadow-sm border border-white/20 shrink-0"
          />
        ) : (
          <div className="w-5 h-3.5 bg-white/10 rounded shrink-0" />
        )}
        <div className="flex flex-col truncate">
          <span className="font-medium text-sm truncate">{countryData.name}</span>
          {(countryData.capital || countryData.region) && (
            <span className={`text-[10px] truncate ${isActive ? 'text-teal-500/70' : 'text-gray-500'}`}>
              {[countryData.capital, countryData.region].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>
      </div>
      
      {iso && (
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ml-2 shrink-0 border ${
          isActive ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-white/5 text-gray-400 border-white/10'
        }`}>
          {iso}
        </span>
      )}
    </div>
  );
}
