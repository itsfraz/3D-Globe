import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ countries, onSelectCountry }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  
  const wrapperRef = useRef(null);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
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
    setSelectedIndex(-1); // reset selection
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
    <div ref={wrapperRef} className="relative w-full sm:w-64 z-50">
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        placeholder="Search country..." 
        className="w-full bg-white/10 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all shadow-sm backdrop-blur-md"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />

      {isOpen && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-navy/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl py-1">
          {results.map((country, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li 
                key={country.properties.name}
                onClick={() => handleSelect(country)}
                className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                  ${isSelected ? 'bg-teal-500/20 text-teal-300' : 'text-gray-200 hover:bg-white/10'}
                `}
              >
                <span>{country.properties.name}</span>
                {country.properties.iso_a2 && (
                  <span className="text-xs opacity-50">{country.properties.iso_a2}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
