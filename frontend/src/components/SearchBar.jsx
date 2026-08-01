import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({ countries, onSelectCountry }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K) to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter countries
  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    const lowerQuery = debouncedQuery.toLowerCase();
    const matches = countries
      .filter(c => c.properties.name.toLowerCase().includes(lowerQuery))
      .slice(0, 5);
      
    setResults(matches);
    setSelectedIndex(-1);
    setIsOpen(matches.length > 0);
  }, [debouncedQuery, countries]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (country) => {
    onSelectCountry(country.properties);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-50">
      <div className="relative flex items-center">
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Search country..." 
          className="w-full bg-white/5 border border-white/15 rounded-full py-2.5 pl-10 pr-16 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80 focus:border-teal-400 transition-all shadow-lg backdrop-blur-xl"
        />
        <Search className="absolute left-3.5 text-gray-400 pointer-events-none" size={16} />

        {/* Clear Button or Hotkey Badge */}
        <div className="absolute right-3 flex items-center">
          {query ? (
            <button 
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="p-1 text-gray-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={13} />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
              <Command size={10} /> K
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul 
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl overflow-hidden shadow-2xl py-1 z-50 divide-y divide-white/5"
          >
            {results.map((country, index) => {
              const isSelected = index === selectedIndex;
              const iso = country.properties.iso_a2;
              return (
                <li 
                  key={country.properties.name}
                  onClick={() => handleSelect(country)}
                  className={`px-4 py-2.5 cursor-pointer transition-all flex items-center justify-between group
                    ${isSelected ? 'bg-teal-500/25 text-teal-300 pl-5' : 'text-gray-200 hover:bg-white/10 hover:pl-5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {iso ? (
                      <img 
                        src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`} 
                        alt={country.properties.name}
                        className="w-5 h-3.5 object-cover rounded shadow-sm border border-white/20"
                      />
                    ) : (
                      <div className="w-5 h-3.5 bg-white/10 rounded" />
                    )}
                    <span className="font-medium text-sm">{country.properties.name}</span>
                  </div>
                  
                  {iso && (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">
                      {iso}
                    </span>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
