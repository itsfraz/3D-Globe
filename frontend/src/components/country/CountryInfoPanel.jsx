import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, Coins, Sparkles, Clock, BookOpen, Heart, Map, Globe } from 'lucide-react';
import AIChat from '../ai/AIChat';
import { useCountryDetails } from '../../hooks/useCountryDetails';

export default function CountryInfoPanel({ country, onClose, userJourney }) {
  const { countryDetails, wikiData, localTime, loading, wikiLoading } = useCountryDetails(country);

  const { isFavorite, toggleFavorite, addExploration } = userJourney || {};

  // Log exploration side-effect
  React.useEffect(() => {
    if (country && addExploration) {
      addExploration(country);
    }
  }, [country, addExploration]);

  // Derived display values with clean formatting
  const iso2Code = countryDetails?.iso2 || country?.iso_a2;
  const flagUrl = iso2Code 
    ? `https://flagcdn.com/w160/${iso2Code.toLowerCase()}.png`
    : null;

  const saved = isFavorite ? isFavorite(country?.name) : false;

  const capital = countryDetails?.capital || "N/A";
  const subregion = countryDetails?.subregion || countryDetails?.region || "N/A";
  
  const population = countryDetails?.population 
    ? Number(countryDetails.population).toLocaleString() 
    : "N/A";
  
  const currencyStr = countryDetails?.currency_name 
    ? `${countryDetails.currency_name} ${countryDetails.currency_symbol ? `(${countryDetails.currency_symbol})` : ''}` 
    : "N/A";

  const areaStr = countryDetails?.area && countryDetails.area !== 'N/A'
    ? `${Number(countryDetails.area).toLocaleString()} km²`
    : "N/A";

  const languagesStr = countryDetails?.languages || "N/A";

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 right-0 md:top-20 md:right-6 md:bottom-6 w-full md:w-[420px] z-40 flex flex-col bg-[#0d1322]/85 backdrop-blur-3xl md:rounded-2xl border-t md:border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Mobile Drag Handle */}
          <div className="flex md:hidden items-center justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <button 
              onClick={() => toggleFavorite && toggleFavorite(country)}
              className={`p-2 rounded-full transition-all backdrop-blur-md border ${
                saved 
                  ? 'text-pink-500 bg-pink-500/10 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-110' 
                  : 'text-gray-400 hover:text-pink-400 bg-white/5 hover:bg-white/10 border-white/5'
              }`}
              title={saved ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={16} className={saved ? 'fill-current' : ''} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/5"
            >
              <X size={16} />
            </button>
          </div>

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
              
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <MetricCard 
                  icon={<Building2 size={15} className="text-teal-500" />} 
                  label="Capital" 
                  value={loading ? "..." : capital} 
                />
                <MetricCard 
                  icon={<Users size={15} className="text-teal-500" />} 
                  label="Population" 
                  value={loading ? "..." : population} 
                />
                <MetricCard 
                  icon={<Coins size={15} className="text-cyan-500" />} 
                  label="Currency" 
                  value={loading ? "..." : currencyStr} 
                />
                <MetricCard 
                  icon={<Clock size={15} className="text-cyan-500" />} 
                  label="Local Time" 
                  value={loading ? "..." : localTime || "N/A"} 
                />
                <MetricCard 
                  icon={<Map size={15} className="text-teal-500" />} 
                  label="Area" 
                  value={loading ? "..." : areaStr} 
                />
                <MetricCard 
                  icon={<Globe size={15} className="text-cyan-500" />} 
                  label="Languages" 
                  value={loading ? "..." : languagesStr} 
                />
              </div>
            </div>

            {/* Wikipedia Summary Section */}
            {(!wikiLoading && wikiData && wikiData.extract) && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-teal-400" size={16} />
                  <h3 className="text-sm font-bold text-white tracking-wide">Overview</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {wikiData.thumbnail && (
                    <img 
                      src={wikiData.thumbnail.source} 
                      alt="Wikipedia" 
                      className="w-full sm:w-24 h-24 object-cover rounded-lg border border-white/20 shadow-sm shrink-0"
                    />
                  )}
                  <p className="text-xs text-gray-300 leading-relaxed overflow-hidden text-ellipsis line-clamp-5">
                    {wikiData.extract}
                  </p>
                </div>
              </div>
            )}

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
    <div className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-xl p-3 flex flex-col gap-1 transition-colors backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-100 truncate" title={value}>
        {value}
      </span>
    </div>
  );
}
