import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Map, Users, Coins, Sparkles } from 'lucide-react';
import AIChat from './AIChat';

// In-memory cache for country dataset so it only fetches once
let cachedCountriesDb = null;

export default function CountryInfoPanel({ country, onClose }) {
  const [countryDetails, setCountryDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!country) return;
    
    setLoading(true);
    setCountryDetails(null);

    async function getCountryInfo() {
      try {
        // Fetch database if not already cached
        if (!cachedCountriesDb) {
          const res = await fetch('https://cdn.jsdelivr.net/gh/dr5hn/countries-states-cities-database@master/json/countries.json');
          if (res.ok) {
            cachedCountriesDb = await res.json();
          }
        }

        if (cachedCountriesDb && cachedCountriesDb.length > 0) {
          const targetName = country.name.toLowerCase();
          const targetIso = country.iso_a2 ? country.iso_a2.toUpperCase() : null;

          // Find best match by ISO2 code or name
          let match = cachedCountriesDb.find(c => targetIso && c.iso2 === targetIso);
          
          if (!match) {
            match = cachedCountriesDb.find(c => c.name.toLowerCase() === targetName);
          }

          if (!match) {
            match = cachedCountriesDb.find(c => 
              c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase())
            );
          }

          if (match) {
            setCountryDetails(match);
            setLoading(false);
            return;
          }
        }

        // Fallback fetch if match not found in primary DB
        const fallbackRes = await fetch(`https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json`);
        if (fallbackRes.ok) {
          const mledozeData = await fallbackRes.json();
          const targetIso = country.iso_a2 ? country.iso_a2.toUpperCase() : null;
          const match = mledozeData.find(c => (targetIso && c.cca2 === targetIso) || c.name.common.toLowerCase() === country.name.toLowerCase());
          if (match) {
            const currKey = match.currencies ? Object.keys(match.currencies)[0] : null;
            const currObj = currKey ? match.currencies[currKey] : null;
            setCountryDetails({
              capital: match.capital ? match.capital[0] : 'N/A',
              region: match.region || 'N/A',
              subregion: match.subregion || match.region || 'N/A',
              population: match.population || 'N/A',
              currency_name: currObj ? currObj.name : 'N/A',
              currency_symbol: currObj ? currObj.symbol : '',
              iso2: match.cca2
            });
          }
        }
      } catch (err) {
        console.error("Error retrieving country details:", err);
      } finally {
        setLoading(false);
      }
    }

    getCountryInfo();
  }, [country]);

  // Derived display values with clean formatting
  const iso2Code = countryDetails?.iso2 || country?.iso_a2;
  const flagUrl = iso2Code 
    ? `https://flagcdn.com/w160/${iso2Code.toLowerCase()}.png`
    : null;

  const capital = countryDetails?.capital || "N/A";
  const region = countryDetails?.region || "N/A";
  const subregion = countryDetails?.subregion || countryDetails?.region || "N/A";
  
  const population = countryDetails?.population 
    ? Number(countryDetails.population).toLocaleString() 
    : "N/A";
  
  const currencyStr = countryDetails?.currency_name 
    ? `${countryDetails.currency_name} ${countryDetails.currency_symbol ? `(${countryDetails.currency_symbol})` : ''}` 
    : "N/A";

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed bottom-0 right-0 top-auto md:top-24 md:bottom-6 left-0 md:left-auto
                     w-full md:w-[440px] max-h-[85vh] md:max-h-none h-auto md:h-auto
                     z-40 flex flex-col glass-panel md:rounded-3xl border-t md:border border-white/15 
                     shadow-2xl overflow-hidden md:mr-6"
        >
          {/* Mobile Drag Handle */}
          <div className="flex md:hidden items-center justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Panel Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20 backdrop-blur-md"
          >
            <X size={18} />
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
            
            {/* Country Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 pr-10">
                {flagUrl ? (
                  <img 
                    src={flagUrl} 
                    alt={`${country.name} flag`} 
                    className="w-14 h-10 rounded-lg shadow-md border border-white/20 object-cover shrink-0" 
                  />
                ) : (
                  <div className="w-14 h-10 bg-white/10 rounded-lg border border-white/20 animate-pulse shrink-0" />
                )}
                <div className="flex flex-col">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                    {country.name}
                  </h2>
                  <span className="text-xs text-teal-300/80 font-medium tracking-wide uppercase">
                    {loading ? "Loading info..." : subregion}
                  </span>
                </div>
              </div>
              
              {/* 2x2 Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <MetricCard 
                  icon={<Building2 size={16} className="text-teal-400" />} 
                  label="Capital" 
                  value={loading ? "Loading..." : capital} 
                />
                <MetricCard 
                  icon={<Map size={16} className="text-cyan-400" />} 
                  label="Region" 
                  value={loading ? "Loading..." : region} 
                />
                <MetricCard 
                  icon={<Users size={16} className="text-teal-400" />} 
                  label="Population" 
                  value={loading ? "Loading..." : population} 
                />
                <MetricCard 
                  icon={<Coins size={16} className="text-cyan-400" />} 
                  label="Currency" 
                  value={loading ? "Loading..." : currencyStr} 
                />
              </div>
            </div>

            {/* AI Assistant Chat Section */}
            <div className="border-t border-white/10 pt-5 flex-1 flex flex-col min-h-[340px]">
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <Sparkles className="text-teal-400" size={18} />
                <h3 className="text-teal-300 font-bold text-base tracking-wide">
                  Ask AI Guide about {country.name}
                </h3>
              </div>

              <AIChat countryName={country.name} />
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 flex flex-col gap-1 transition-all shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-white truncate" title={value}>
        {value}
      </span>
    </div>
  );
}
