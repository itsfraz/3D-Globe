import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Users, Map, Globe, DollarSign, Clock, CloudRain, Plane, AlertTriangle, Activity } from 'lucide-react';

const AVAILABLE_LAYERS = [
  { id: 'borders', label: 'Country Borders', icon: <Globe size={14} />, type: 'static' },
  { id: 'population', label: 'Population', icon: <Users size={14} />, type: 'static' },
  { id: 'density', label: 'Population Density', icon: <Map size={14} />, type: 'static' },
  { id: 'timezones', label: 'Time Zones (Day/Night)', icon: <Clock size={14} />, type: 'live' },
  { id: 'gdp', label: 'GDP', icon: <DollarSign size={14} />, type: 'dynamic' },
  { id: 'weather', label: 'Live Weather', icon: <CloudRain size={14} />, type: 'api_required' },
  { id: 'tourism', label: 'Tourism Data', icon: <Plane size={14} />, type: 'api_required' },
  { id: 'earthquakes', label: 'Live Earthquakes', icon: <Activity size={14} />, type: 'api_required' },
];

export default function GlobalLayersPanel({ isOpen, onClose, activeLayer, setActiveLayer, selectedCountry }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // GDP State
  const [gdpData, setGdpData] = useState(null);
  const [gdpLoading, setGdpLoading] = useState(false);
  const [gdpError, setGdpError] = useState(null);

  // Update clock for Time Zones layer
  useEffect(() => {
    if (activeLayer !== 'timezones') return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [activeLayer]);

  // Fetch GDP Data
  useEffect(() => {
    if (activeLayer !== 'gdp') return;
    
    if (!selectedCountry) {
      setGdpData(null);
      setGdpError(null);
      return;
    }

    const fetchGdp = async () => {
      setGdpLoading(true);
      setGdpError(null);
      try {
        const iso = selectedCountry.iso_a3 || selectedCountry.iso_a2;
        if (!iso) throw new Error("No ISO code for this country.");
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/gdp/${iso}`);
        if (!res.ok) {
          throw new Error('Failed to fetch GDP data');
        }
        const data = await res.json();
        setGdpData(data);
      } catch (err) {
        setGdpError(err.message);
      } finally {
        setGdpLoading(false);
      }
    };

    fetchGdp();
  }, [activeLayer, selectedCountry]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed left-4 bottom-4 md:top-24 md:bottom-auto md:w-80 z-40 bg-[#0d1322]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-teal-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">Global Layers</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {AVAILABLE_LAYERS.map(layer => {
            const isActive = activeLayer === layer.id;
            const isApiRequired = layer.type === 'api_required';

            return (
              <div key={layer.id} className="flex flex-col gap-1">
                <button
                  disabled={isApiRequired}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                    isActive
                      ? 'bg-teal-500/10 border-teal-500/30 text-white shadow-[0_0_15px_rgba(45,212,191,0.1)]'
                      : isApiRequired
                      ? 'bg-transparent border-transparent text-gray-600 cursor-not-allowed'
                      : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? 'text-teal-400' : isApiRequired ? 'text-gray-600' : 'text-gray-400'}`}>
                      {layer.icon}
                    </div>
                    <span className="text-sm font-medium">{layer.label}</span>
                  </div>
                  
                  {isActive && !isApiRequired && (
                    <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                  )}
                  {isApiRequired && (
                    <AlertTriangle size={12} className="text-yellow-600/50" />
                  )}
                </button>

                {/* Specific Layer Legends/UI */}
                <AnimatePresence>
                  {isActive && layer.id === 'population' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 py-2 bg-black/20 rounded-lg mx-1 mt-1 border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Legend: Population Size</div>
                      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-yellow-100 via-orange-400 to-red-600 mb-1" />
                      <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </motion.div>
                  )}

                  {isActive && layer.id === 'density' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 py-2 bg-black/20 rounded-lg mx-1 mt-1 border border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Legend: Pop / Area (km²)</div>
                      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-green-100 via-green-500 to-emerald-900 mb-1" />
                      <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                        <span>Sparse</span>
                        <span>Dense</span>
                      </div>
                    </motion.div>
                  )}

                  {isActive && layer.id === 'timezones' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 py-2 bg-black/20 rounded-lg mx-1 mt-1 border border-white/5 flex flex-col gap-2">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">Current UTC Time</div>
                      <div className="text-xl font-bold font-mono text-teal-300 tracking-wider">
                        {currentTime.toISOString().substring(11, 19)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-3 h-3 rounded-sm bg-[#ffd700] border border-white/10" /> <span className="text-[10px] text-gray-400">Day</span>
                        <div className="w-3 h-3 rounded-sm bg-[#0a192f] border border-white/10 ml-2" /> <span className="text-[10px] text-gray-400">Night</span>
                      </div>
                    </motion.div>
                  )}

                  {isActive && layer.id === 'gdp' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-3 py-3 bg-black/20 rounded-lg mx-1 mt-1 border border-teal-500/20 flex flex-col gap-2 shadow-inner">
                      {!selectedCountry ? (
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <Globe size={14} className="text-teal-400 animate-pulse" />
                          Select a country on the globe to view its GDP.
                        </div>
                      ) : gdpLoading ? (
                        <div className="flex flex-col gap-2 animate-pulse">
                          <div className="h-3 w-24 bg-white/10 rounded"></div>
                          <div className="h-6 w-40 bg-teal-500/20 rounded"></div>
                        </div>
                      ) : gdpError ? (
                        <div className="text-xs text-red-400 flex items-center gap-2">
                          <AlertTriangle size={14} />
                          GDP data not available for this region.
                        </div>
                      ) : gdpData ? (
                        <div className="flex flex-col">
                          <div className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                            <DollarSign size={12} />
                            {gdpData.country} GDP ({gdpData.year})
                          </div>
                          <div className="text-xl font-bold text-white tracking-tight">
                            {gdpData.formattedGdp}
                          </div>
                          <div className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">Source: World Bank</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No data available.</div>
                      )}
                    </motion.div>
                  )}

                  {isApiRequired && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2 text-[10px] text-yellow-500/70 ml-8 border-l border-yellow-500/20 pl-2">
                      Requires external API configuration to enable.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
