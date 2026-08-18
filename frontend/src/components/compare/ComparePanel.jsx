import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Map, Users, CircleDollarSign, Languages, Globe, Scale, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountryDetails } from '../../hooks/useCountryDetails';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function useWorldBankProfile(iso) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!iso) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${apiUrl}/api/gdp/profile/${iso}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [iso]);

  return { data, loading };
}

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

function MetricRow({ label, val1, val2, formatFn, isLowerBetter = false }) {
  const parseVal = (v) => {
    if (v === null || v === undefined || v === 'N/A') return null;
    if (typeof v === 'number') return v;
    return parseFloat(v.toString().replace(/,/g, ''));
  };

  const n1 = parseVal(val1);
  const n2 = parseVal(val2);
  
  let w1 = 0, w2 = 0;
  let winner = 0; // 1 for A, 2 for B
  
  if (n1 !== null && n2 !== null) {
    const max = Math.max(n1, n2);
    if (max > 0) {
      if (isLowerBetter) {
        w1 = (n1 / max) * 100;
        w2 = (n2 / max) * 100;
        winner = n1 < n2 ? 1 : (n2 < n1 ? 2 : 0);
      } else {
        w1 = (n1 / max) * 100;
        w2 = (n2 / max) * 100;
        winner = n1 > n2 ? 1 : (n2 > n1 ? 2 : 0);
      }
    }
  } else if (n1 !== null) {
    w1 = 100;
    winner = 1;
  } else if (n2 !== null) {
    w2 = 100;
    winner = 2;
  }

  const display1 = formatFn && n1 !== null ? formatFn(n1) : val1 || 'N/A';
  const display2 = formatFn && n2 !== null ? formatFn(n2) : val2 || 'N/A';

  return (
    <div className="grid grid-cols-[100px_1fr_1fr] sm:grid-cols-[140px_1fr_1fr] gap-3 sm:gap-6 py-3 border-b border-white/5 items-center">
      <div className="text-xs sm:text-sm text-gray-400 font-medium">{label}</div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className={`text-sm truncate ${winner === 1 ? 'font-bold text-teal-400' : 'text-gray-200'}`}>
          {display1}
        </span>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shrink-0">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${w1}%` }} transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-teal-400 rounded-full"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className={`text-sm truncate ${winner === 2 ? 'font-bold text-purple-400' : 'text-gray-200'}`}>
          {display2}
        </span>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shrink-0">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${w2}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            className="h-full bg-purple-400 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

function TextRow({ label, val1, val2 }) {
  return (
    <div className="grid grid-cols-[100px_1fr_1fr] sm:grid-cols-[140px_1fr_1fr] gap-3 sm:gap-6 py-3 border-b border-white/5 items-center">
      <div className="text-xs sm:text-sm text-gray-400 font-medium">{label}</div>
      <div className="text-sm text-gray-200 truncate pr-2" title={val1 || 'N/A'}>{val1 || 'N/A'}</div>
      <div className="text-sm text-gray-200 truncate pr-2" title={val2 || 'N/A'}>{val2 || 'N/A'}</div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
      <h3 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
}

function ComparisonView({ c1, c2 }) {
  const data1 = useCountryDetails(c1);
  const data2 = useCountryDetails(c2);

  const getIso3 = (c, data) => data?.countryDetails?.iso3 || c?.iso_a3;
  const getIso2 = (c, data) => data?.countryDetails?.iso2 || c?.iso_a2;

  const iso3_1 = getIso3(c1, data1);
  const iso3_2 = getIso3(c2, data2);
  const iso2_1 = getIso2(c1, data1);
  const iso2_2 = getIso2(c2, data2);

  const wb1 = useWorldBankProfile(iso3_1);
  const wb2 = useWorldBankProfile(iso3_2);

  const popFormat = (val) => val >= 1000000 ? (val / 1000000).toFixed(1) + ' M' : new Intl.NumberFormat('en-US').format(val);
  const areaFormat = (val) => new Intl.NumberFormat('en-US').format(val) + ' km²';
  const gdpFormat = (val) => val >= 1000000000000 ? '$' + (val / 1000000000000).toFixed(2) + ' T' : (val >= 1000000000 ? '$' + (val / 1000000000).toFixed(2) + ' B' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val));
  const currencyFormat = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const pctFormat = (val) => val.toFixed(1) + '%';
  const rankFormat = (val) => '#' + val;

  const d1 = data1.countryDetails || {};
  const d2 = data2.countryDetails || {};
  const w1d = wb1.data?.current || {};
  const w2d = wb2.data?.current || {};

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 mt-4 flex flex-col gap-6 pb-6">
      {/* Sticky Header Cards */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row gap-4 bg-[#0d1322] pb-4 pt-1 border-b border-white/10 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
        {/* Country 1 */}
        <div className="flex-1 bg-gradient-to-br from-teal-500/10 to-[#0d1322] border border-teal-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
          {iso2_1 && <img src={`https://flagcdn.com/w80/${iso2_1.toLowerCase()}.png`} className="w-12 sm:w-16 h-auto rounded shadow-md shrink-0" alt="" />}
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{c1.name}</h2>
            <p className="text-teal-300 font-medium text-xs sm:text-sm truncate">{d1.capital || 'N/A'}</p>
          </div>
        </div>

        {/* VS Badge */}
        <div className="hidden md:flex items-center justify-center -mx-2 z-10 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#0d1322] border border-white/20 flex items-center justify-center font-bold text-gray-400 text-sm shadow-xl">VS</div>
        </div>

        {/* Country 2 */}
        <div className="flex-1 bg-gradient-to-bl from-purple-500/10 to-[#0d1322] border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
          {iso2_2 && <img src={`https://flagcdn.com/w80/${iso2_2.toLowerCase()}.png`} className="w-12 sm:w-16 h-auto rounded shadow-md shrink-0" alt="" />}
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{c2.name}</h2>
            <p className="text-purple-300 font-medium text-xs sm:text-sm truncate">{d2.capital || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Overview Table Header */}
      <div className="grid grid-cols-[100px_1fr_1fr] sm:grid-cols-[140px_1fr_1fr] gap-3 sm:gap-6 px-4 sm:px-6 mb-[-16px]">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Metric</div>
        <div className="text-xs font-bold text-teal-500 uppercase tracking-widest truncate pr-2">{c1.name}</div>
        <div className="text-xs font-bold text-purple-500 uppercase tracking-widest truncate pr-2">{c2.name}</div>
      </div>

      <Section title="Economy" icon={<CircleDollarSign size={16} />}>
        <MetricRow label="GDP" val1={w1d.gdp} val2={w2d.gdp} formatFn={gdpFormat} />
        <MetricRow label="GDP Rank" val1={wb1.data?.rankings?.gdpGlobal} val2={wb2.data?.rankings?.gdpGlobal} formatFn={rankFormat} isLowerBetter={true} />
        <MetricRow label="GDP per Capita" val1={w1d.gdpPerCapita} val2={w2d.gdpPerCapita} formatFn={currencyFormat} />
        <MetricRow label="GDP Growth" val1={w1d.gdpGrowth} val2={w2d.gdpGrowth} formatFn={pctFormat} />
        <MetricRow label="Inflation" val1={w1d.inflation} val2={w2d.inflation} formatFn={pctFormat} isLowerBetter={true} />
        <MetricRow label="Unemployment" val1={w1d.unemployment} val2={w2d.unemployment} formatFn={pctFormat} isLowerBetter={true} />
      </Section>

      <Section title="Demographics" icon={<Users size={16} />}>
        <MetricRow label="Population" val1={w1d.population || d1.population} val2={w2d.population || d2.population} formatFn={popFormat} />
        <MetricRow label="Pop. Rank" val1={wb1.data?.rankings?.popGlobal} val2={wb2.data?.rankings?.popGlobal} formatFn={rankFormat} isLowerBetter={true} />
        <MetricRow label="Pop. Growth" val1={w1d.popGrowth} val2={w2d.popGrowth} formatFn={pctFormat} />
        <MetricRow label="Area" val1={d1.area} val2={d2.area} formatFn={areaFormat} />
      </Section>

      <Section title="Society & Education" icon={<BookOpen size={16} />}>
        <MetricRow label="Life Expectancy" val1={w1d.lifeExpectancy} val2={w2d.lifeExpectancy} formatFn={v => v.toFixed(1) + ' yrs'} />
        <MetricRow label="Literacy Rate" val1={w1d.literacy} val2={w2d.literacy} formatFn={pctFormat} />
      </Section>

      <Section title="Geography" icon={<Map size={16} />}>
        <TextRow label="Region" val1={d1.region} val2={d2.region} />
        <TextRow label="Subregion" val1={d1.subregion} val2={d2.subregion} />
        <TextRow label="Capital" val1={d1.capital} val2={d2.capital} />
        <TextRow label="Currency" 
          val1={d1.currency_name && d1.currency_name !== 'N/A' ? `${d1.currency_name} (${d1.currency_code})` : 'N/A'} 
          val2={d2.currency_name && d2.currency_name !== 'N/A' ? `${d2.currency_name} (${d2.currency_code})` : 'N/A'} 
        />
        <TextRow label="Languages" val1={d1.languages} val2={d2.languages} />
      </Section>
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
      else if (newArr.length === 1) newArr[1] = null;
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
        className="fixed inset-2 sm:inset-4 lg:inset-10 z-40 bg-[#0d1322]/95 backdrop-blur-2xl border border-white/10 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Scale size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">Country Comparison</h1>
              <p className="hidden sm:block text-xs text-gray-400 font-medium">Analyze up to two countries side-by-side</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
          
          {/* Selection Controls */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-2 shrink-0">
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

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 shrink-0"></div>

          {/* Comparison View or Empty State */}
          {compareCountries.length === 2 && compareCountries[0] && compareCountries[1] ? (
            <ComparisonView c1={compareCountries[0]} c2={compareCountries[1]} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-[300px]">
              <Scale size={48} className="text-white/10 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select Two Countries</h3>
              <p className="text-gray-400 max-w-sm text-sm">Use the search fields above to select two countries to begin a detailed comparison across economy, demographics, education, and geography.</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
