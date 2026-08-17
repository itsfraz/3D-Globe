import React, { useState, useMemo } from 'react';
import { X, Search, Map, Users, CircleDollarSign, Languages, Globe, Scale, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AICompareChat from './AICompareChat';
import { useCountryDetails } from '../../hooks/useCountryDetails';

// Simple Search Dropdown Component
function CountrySearch({ label, value, onChange, countriesData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!searchTerm) return countriesData?.slice(0, 50) || [];
    return (countriesData || []).filter(c => 
      c.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.properties.iso_a3?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [searchTerm, countriesData]);

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider pl-1">{label}</label>
      {value ? (
        <div className="flex items-center justify-between bg-white/10 border border-white/20 p-3 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img src={`https://flagcdn.com/w40/${(value.iso_a2 || value.iso_a3 || '').toLowerCase()}.png`} alt="" className="w-8 h-auto rounded-sm shadow-sm" onError={(e) => e.target.style.display='none'} />
            <span className="font-semibold text-white text-lg">{value.name}</span>
          </div>
          <button onClick={() => onChange(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder={`Search for a country...`}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className="w-full bg-black/40 border border-white/15 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all"
          />
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#0d1322]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar">
              {filtered.map(c => (
                <div 
                  key={c.properties.name}
                  onMouseDown={(e) => { 
                    e.preventDefault(); 
                    onChange(c.properties); 
                    setSearchTerm(''); 
                    setIsOpen(false); 
                  }}
                  className="px-4 py-2.5 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                >
                  <span className="text-white font-medium">{c.properties.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{c.properties.iso_a3}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Visual Data Bar Component
function CompareBar({ label, val1, val2, formatFn, icon }) {
  // Normalize parsing
  const parseVal = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    return parseFloat(v.toString().replace(/,/g, '')) || 0;
  };

  const n1 = parseVal(val1);
  const n2 = parseVal(val2);
  const max = Math.max(n1, n2);
  
  const w1 = max > 0 ? (n1 / max) * 100 : 0;
  const w2 = max > 0 ? (n2 / max) * 100 : 0;

  return (
    <div className="flex flex-col gap-1 mt-4">
      <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider mb-1">
        <span className="flex items-center gap-1.5">{icon} {label}</span>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">{formatFn && n1 ? formatFn(n1) : val1 || 'N/A'}</span>
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${w1}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-teal-400 rounded-full"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">{formatFn && n2 ? formatFn(n2) : val2 || 'N/A'}</span>
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${w2}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-purple-400 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner comparison logic component to safely call hooks unconditionally
function ComparisonView({ c1, c2 }) {
  const data1 = useCountryDetails(c1);
  const data2 = useCountryDetails(c2);

  const getIso2 = (c, data) => data?.countryDetails?.iso2 || c?.iso_a2;

  const iso1 = getIso2(c1, data1);
  const iso2 = getIso2(c2, data2);

  const popFormat = (val) => new Intl.NumberFormat('en-US').format(val);
  const areaFormat = (val) => new Intl.NumberFormat('en-US').format(val) + ' km²';

  const d1 = data1.countryDetails || {};
  const d2 = data2.countryDetails || {};

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4 flex flex-col gap-6 pb-6">
      {/* Header Cards */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Country 1 */}
        <div className="flex-1 bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
          {iso1 && <img src={`https://flagcdn.com/w80/${iso1.toLowerCase()}.png`} className="w-16 rounded shadow-md" alt="" />}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white">{c1.name}</h2>
            <p className="text-teal-300 font-medium text-sm">{d1.capital || 'N/A'}</p>
          </div>
        </div>

        {/* VS Badge Mobile */}
        <div className="hidden md:flex items-center justify-center -mx-2 z-10 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#0d1322] border border-white/20 flex items-center justify-center font-bold text-gray-400 text-sm shadow-xl">VS</div>
        </div>

        {/* Country 2 */}
        <div className="flex-1 bg-gradient-to-bl from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
          {iso2 && <img src={`https://flagcdn.com/w80/${iso2.toLowerCase()}.png`} className="w-16 rounded shadow-md" alt="" />}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white">{c2.name}</h2>
            <p className="text-purple-300 font-medium text-sm">{d2.capital || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Categorical Data side-by-side */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1"><Map size={12}/> Region</span>
          <div className="text-sm font-medium text-white">{d1.region || 'N/A'}</div>
          <div className="text-xs text-teal-400 mt-1">{d1.subregion}</div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1"><Map size={12}/> Region</span>
          <div className="text-sm font-medium text-white">{d2.region || 'N/A'}</div>
          <div className="text-xs text-purple-400 mt-1">{d2.subregion}</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1"><CircleDollarSign size={12}/> Currency</span>
          <div className="text-sm font-medium text-white">{d1.currencyName || 'N/A'}</div>
          <div className="text-xs text-teal-400 mt-1">{d1.currencySymbol}</div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1"><CircleDollarSign size={12}/> Currency</span>
          <div className="text-sm font-medium text-white">{d2.currencyName || 'N/A'}</div>
          <div className="text-xs text-purple-400 mt-1">{d2.currencySymbol}</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10 col-span-2">
          <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1"><Languages size={12}/> Languages</span>
          <div className="text-sm font-medium text-white">{d1.languages || 'N/A'}</div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 col-span-2">
          <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1"><Languages size={12}/> Languages</span>
          <div className="text-sm font-medium text-white">{d2.languages || 'N/A'}</div>
        </div>
      </div>

      {/* Quantitative Data (Bars) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Quantitative Metrics</h3>
        <CompareBar 
          icon={<Users size={14} />} 
          label="Population" 
          val1={d1.population} 
          val2={d2.population} 
          formatFn={popFormat} 
        />
        <CompareBar 
          icon={<Globe size={14} />} 
          label="Area" 
          val1={d1.area} 
          val2={d2.area} 
          formatFn={areaFormat} 
        />
      </div>

      {/* AI Comparison Chat */}
      <div className="flex-1 min-h-[400px] flex flex-col">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-pink-400" />
          AI Comparison Engine
        </h3>
        <AICompareChat countryA={c1.name} countryB={c2.name} />
      </div>

    </div>
  );
}


export default function ComparePanel({ isOpen, onClose, compareCountries, setCompareCountries, countriesData }) {
  if (!isOpen) return null;

  const handleSetC1 = (c) => {
    const newArr = [...compareCountries];
    if (c) {
      newArr[0] = c;
    } else {
      newArr.splice(0, 1);
    }
    setCompareCountries(newArr);
  };

  const handleSetC2 = (c) => {
    const newArr = [...compareCountries];
    if (c) {
      newArr[1] = c;
    } else {
      if (newArr.length === 2) newArr.splice(1, 1);
      else if (newArr.length === 1) newArr[1] = null; // edge case
    }
    setCompareCountries(newArr);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-4 sm:inset-10 z-40 bg-[#0d1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:max-w-5xl lg:mx-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Scale size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Country Comparison</h1>
              <p className="text-xs text-gray-400 font-medium">Analyze up to two countries side-by-side</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col min-h-0">
          
          {/* Selection Controls */}
          <div className="flex flex-col md:flex-row gap-6 mb-2 shrink-0">
            <div className="flex-1 z-20">
              <CountrySearch 
                label="Country A" 
                value={compareCountries[0]} 
                onChange={handleSetC1} 
                countriesData={countriesData} 
              />
            </div>
            <div className="hidden md:flex items-center justify-center pt-6 shrink-0">
              <div className="text-gray-500 font-bold uppercase tracking-widest px-2">VS</div>
            </div>
            <div className="flex-1 z-10">
              <CountrySearch 
                label="Country B" 
                value={compareCountries[1]} 
                onChange={handleSetC2} 
                countriesData={countriesData} 
              />
            </div>
          </div>

          {/* Separation Line */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 shrink-0"></div>

          {/* Comparison View or Empty State */}
          {compareCountries.length === 2 && compareCountries[0] && compareCountries[1] ? (
            <ComparisonView c1={compareCountries[0]} c2={compareCountries[1]} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <Scale size={48} className="text-white/10 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select Two Countries</h3>
              <p className="text-gray-400 max-w-sm text-sm">Use the search fields above to select two countries to begin a detailed comparison, including AI-powered insights.</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
