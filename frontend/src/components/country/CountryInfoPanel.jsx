import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, Coins, Clock, BookOpen, Heart, Map, Globe, Sparkles, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';
import { useCountryDetails } from '../../hooks/useCountryDetails';
import { geoCentroid } from 'd3-geo';
import InlineAIChat from '../ai/InlineAIChat';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function getDistance(c1, c2) {
  const R = 6371; // km
  const dLat = (c2[1] - c1[1]) * Math.PI / 180;
  const dLon = (c2[0] - c1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(c1[1] * Math.PI / 180) * Math.cos(c2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export default function CountryInfoPanel({ country, onClose, userJourney, countriesData, onSelectCountry }) {
  const { countryDetails, wikiData, localTime, loading, wikiLoading } = useCountryDetails(country);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // World Bank Profile State
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [chartTab, setChartTab] = useState('gdp'); // 'gdp' or 'population'

  const { isFavorite, toggleFavorite, addExploration } = userJourney || {};

  // Fetch World Bank Profile
  useEffect(() => {
    if (!country) return;
    
    setIsChatOpen(false);
    setProfileData(null);
    setProfileError(null);
    
    const iso = country.iso_a3 || country.iso_a2;
    if (!iso) {
      setProfileError("No ISO code available");
      return;
    }

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/gdp/profile/${iso}`);
        if (!res.ok) throw new Error("Profile data unavailable");
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        setProfileError(err.message);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfile();
  }, [country]);

  // Nearby Countries logic
  const nearbyCountries = useMemo(() => {
    if (!country || !countriesData) return [];
    const currentFeature = countriesData.find(f => f.properties.name === country.name);
    if (!currentFeature) return [];
    
    const center = geoCentroid(currentFeature);
    if (isNaN(center[0])) return [];

    const distances = countriesData
      .filter(f => f.properties.name !== country.name)
      .map(f => {
        const c = geoCentroid(f);
        if (isNaN(c[0])) return null;
        return {
          country: f.properties,
          dist: getDistance(center, c)
        };
      })
      .filter(Boolean);

    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, 5);
  }, [country, countriesData]);

  // Log exploration side-effect
  useEffect(() => {
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
  
  // Use WB population if available, else fallback
  const population = profileData?.current?.population 
    ? Number(profileData.current.population).toLocaleString()
    : (countryDetails?.population ? Number(countryDetails.population).toLocaleString() : "N/A");
  
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
          className="fixed bottom-0 right-0 md:top-20 md:right-6 md:bottom-6 w-full md:w-[480px] max-h-[85vh] md:max-h-none z-40 flex flex-col bg-[#0a1120]/90 backdrop-blur-2xl rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          {/* Mobile Drag Handle */}
          <div className="flex md:hidden items-center justify-center pt-3 pb-1 bg-gradient-to-b from-white/5 to-transparent">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <button 
              onClick={() => toggleFavorite && toggleFavorite(country)}
              className={`p-2.5 rounded-full transition-all backdrop-blur-md border ${
                saved 
                  ? 'text-pink-500 bg-pink-500/10 border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-110' 
                  : 'text-gray-400 hover:text-pink-400 bg-white/5 hover:bg-white/10 border-white/5'
              }`}
              title={saved ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={16} className={saved ? 'fill-current' : ''} />
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
            
            {/* Country Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 pr-24">
                {flagUrl ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                    <img 
                      src={flagUrl} 
                      alt={`${country.name} flag`} 
                      className="w-16 h-12 rounded-xl shadow-lg border border-white/20 object-cover shrink-0 relative z-10" 
                    />
                  </div>
                ) : (
                  <div className="w-16 h-12 bg-white/10 rounded-xl border border-white/20 animate-pulse shrink-0" />
                )}
                <div className="flex flex-col">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 leading-tight tracking-tight">
                    {country.name}
                  </h2>
                  <span className="text-sm text-teal-400/90 font-medium tracking-widest uppercase">
                    {loading ? "Loading..." : subregion}
                  </span>
                </div>
              </div>
              
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <MetricCard 
                  icon={<Building2 size={16} className="text-indigo-400" />} 
                  label="Capital" 
                  value={loading ? "..." : capital} 
                />
                <MetricCard 
                  icon={<Clock size={16} className="text-blue-400" />} 
                  label="Local Time" 
                  value={loading ? "..." : localTime || "N/A"} 
                />
                <MetricCard 
                  icon={<Globe size={16} className="text-teal-400" />} 
                  label="Languages" 
                  value={loading ? "..." : languagesStr} 
                />
                <MetricCard 
                  icon={<Map size={16} className="text-emerald-400" />} 
                  label="Area" 
                  value={loading ? "..." : areaStr} 
                />
              </div>
            </div>

            {/* Economy & Demographics Section */}
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-5 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <BarChart2 className="text-teal-400" size={18} />
                  <h3 className="text-sm font-bold text-white tracking-wide">Economy & Demographics</h3>
                </div>
                {profileData?.current?.gdpYear && (
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Data: {profileData.current.gdpYear}
                  </span>
                )}
              </div>

              {profileLoading ? (
                <div className="flex flex-col gap-4 animate-pulse py-2">
                  <div className="flex items-center gap-3 text-teal-400/80 font-medium text-xs mb-2">
                    <Activity size={16} className="animate-spin" />
                    Fetching 20-year World Bank data...
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-white/20 rounded-xl"></div>
                    <div className="h-20 bg-white/20 rounded-xl"></div>
                  </div>
                  <div className="h-40 bg-white/20 rounded-xl"></div>
                </div>
              ) : profileError ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <Activity size={14} />
                  Detailed metrics not available.
                </div>
              ) : profileData ? (
                <>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 uppercase tracking-wider">
                          <Coins size={14} className="text-yellow-500" />
                          <span>GDP</span>
                        </div>
                        {profileData.rankings?.gdpGlobal && (
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">#{profileData.rankings.gdpGlobal} Global</span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-white mt-1">
                        {profileData.current.formattedGdp || 'N/A'}
                      </span>
                      {profileData.current.gdpGrowth !== null && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {profileData.current.gdpGrowth > 0 ? (
                            <TrendingUp size={12} className="text-green-400" />
                          ) : (
                            <TrendingDown size={12} className="text-red-400" />
                          )}
                          <span className={`text-xs font-medium ${profileData.current.gdpGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {Math.abs(profileData.current.gdpGrowth).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 uppercase tracking-wider">
                          <Users size={14} className="text-blue-400" />
                          <span>Population</span>
                        </div>
                        {profileData.rankings?.popGlobal && (
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">#{profileData.rankings.popGlobal} Global</span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-white mt-1">
                        {population}
                      </span>
                      {profileData.current.popGrowth !== null && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {profileData.current.popGrowth > 0 ? (
                            <TrendingUp size={12} className="text-green-400" />
                          ) : (
                            <TrendingDown size={12} className="text-red-400" />
                          )}
                          <span className={`text-xs font-medium ${profileData.current.popGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {Math.abs(profileData.current.popGrowth).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="flex justify-between items-center px-2 relative z-10 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Per Capita:</span>
                      <span className="font-semibold text-white">{profileData.current.formattedGdpPerCapita || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Currency:</span>
                      <span className="font-semibold text-white">{currencyStr}</span>
                    </div>
                  </div>

                  {/* Historical Charts */}
                  {profileData.history && profileData.history.length > 0 && (
                    <div className="mt-2 bg-black/20 rounded-xl p-3 border border-white/5 relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">20-Year Trend</span>
                        <div className="flex bg-white/5 rounded-lg p-0.5">
                          <button 
                            onClick={() => setChartTab('gdp')}
                            className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors ${chartTab === 'gdp' ? 'bg-teal-500/20 text-teal-300' : 'text-gray-500 hover:text-white'}`}
                          >
                            GDP
                          </button>
                          <button 
                            onClick={() => setChartTab('population')}
                            className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors ${chartTab === 'population' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500 hover:text-white'}`}
                          >
                            POP
                          </button>
                        </div>
                      </div>
                      
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={profileData.history}>
                            <defs>
                              <linearGradient id="colorGdp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0d1322', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                              itemStyle={{ color: '#fff' }}
                              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                              formatter={(value) => {
                                if (chartTab === 'gdp') {
                                  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                                }
                                return Number(value).toLocaleString();
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey={chartTab === 'gdp' ? 'gdp' : 'population'} 
                              stroke={chartTab === 'gdp' ? '#2dd4bf' : '#60a5fa'} 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill={`url(#${chartTab === 'gdp' ? 'colorGdp' : 'colorPop'})`} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Wikipedia Summary Section */}
            {(!wikiLoading && wikiData && wikiData.extract) && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-teal-400" size={16} />
                  <h3 className="text-sm font-bold text-white tracking-wide">Overview</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {wikiData.thumbnail && (
                    <img 
                      src={wikiData.thumbnail.source} 
                      alt="Wikipedia" 
                      className="w-full sm:w-28 h-28 object-cover rounded-xl border border-white/20 shadow-md shrink-0"
                    />
                  )}
                  <p className="text-sm text-gray-300 leading-relaxed overflow-hidden text-ellipsis line-clamp-5">
                    {wikiData.extract}
                  </p>
                </div>
              </div>
            )}

            {/* Nearby Countries Section */}
            {nearbyCountries.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Map className="text-emerald-400" size={16} />
                  <h3 className="text-sm font-bold text-white tracking-wide">Nearby Countries</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nearbyCountries.map(({ country: neighbor }) => {
                    const nIso = neighbor.iso_a2 || neighbor.iso_a3;
                    return (
                      <button
                        key={neighbor.name}
                        onClick={() => onSelectCountry && onSelectCountry(neighbor)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
                      >
                        {nIso && (
                          <img 
                            src={`https://flagcdn.com/w20/${nIso.toLowerCase()}.png`} 
                            className="w-5 rounded shadow-sm" 
                            alt="" 
                            onError={(e) => e.target.style.display='none'}
                          />
                        )}
                        <span className="text-xs font-semibold text-gray-200">{neighbor.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inline AI Assistant */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`group relative overflow-hidden bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-purple-500/10 hover:from-teal-500/20 hover:to-purple-500/20 border ${isChatOpen ? 'border-teal-500/40 rounded-t-2xl rounded-b-sm' : 'border-white/10 hover:border-teal-500/30 rounded-2xl'} p-5 flex flex-col gap-1 transition-all shadow-[0_0_20px_rgba(45,212,191,0.05)] text-left`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-teal-400/10 blur-[50px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-teal-500/20 rounded-lg">
                      <Sparkles className="text-teal-400" size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Ask AI About {country.name}
                    </h3>
                  </div>
                  {isChatOpen ? (
                    <ChevronDown size={18} className="text-teal-400 transition-all" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-teal-300 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
                {!isChatOpen && (
                  <p className="text-xs text-gray-400 mt-2 relative z-10 ml-9">
                    Discover culture, history, travel itineraries, and facts.
                  </p>
                )}
              </button>
              
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#0d1322] border border-white/5 border-t-0 rounded-b-2xl shadow-inner"
                  >
                    <InlineAIChat country={country} countryDetails={countryDetails} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Bottom Padding */}
            <div className="h-4 w-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors backdrop-blur-md">
      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-white truncate" title={value}>
        {value}
      </span>
    </div>
  );
}
