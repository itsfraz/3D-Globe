import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Map, Compass, Calendar, Search, BookOpen, Utensils, TreePine, Plane, Landmark, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'Random', icon: <Compass size={16} />, color: 'bg-gradient-to-br from-gray-500 to-gray-700' },
  { id: 'History', icon: <BookOpen size={16} />, color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
  { id: 'Culture', icon: <Star size={16} />, color: 'bg-gradient-to-br from-purple-500 to-pink-600' },
  { id: 'Food', icon: <Utensils size={16} />, color: 'bg-gradient-to-br from-red-400 to-rose-600' },
  { id: 'Nature', icon: <TreePine size={16} />, color: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { id: 'Travel', icon: <Plane size={16} />, color: 'bg-gradient-to-br from-blue-400 to-cyan-600' },
  { id: 'Architecture', icon: <Landmark size={16} />, color: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
  { id: 'Interesting Facts', icon: <Sparkles size={16} />, color: 'bg-gradient-to-br from-teal-400 to-cyan-500' }
];

export default function ExploreMode({ isOpen, onClose, countriesData, onSelectCountry, userJourney }) {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'discovering', 'card'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [discoveryCountry, setDiscoveryCountry] = useState(null);
  const [discoveryFact, setDiscoveryFact] = useState('');
  
  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setView('dashboard');
      setDiscoveryCountry(null);
      setDiscoveryFact('');
      setSelectedCategory(null);
    }
  }, [isOpen]);

  // Deterministic Daily Country
  const dailyCountry = useMemo(() => {
    if (!countriesData || countriesData.length === 0) return null;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % countriesData.length;
    return countriesData[idx].properties;
  }, [countriesData]);

  // Discovery Logic
  useEffect(() => {
    if (view === 'discovering' && countriesData && countriesData.length > 0) {
      let isMounted = true;

      const runDiscovery = async () => {
        // 1. Pick a random country
        const randomIdx = Math.floor(Math.random() * countriesData.length);
        const selected = countriesData[randomIdx].properties;
        
        // 2. Pan globe to it instantly in the background
        onSelectCountry(selected);
        
        // 3. Fetch an AI fact based on category
        let fact = "Fetching a fascinating insight...";
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const topic = selectedCategory === 'Random' ? 'an interesting fact' : `an interesting fact about ${selectedCategory}`;
          const res = await fetch(`${apiUrl}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              country: selected.name,
              question: `Tell me one short, fascinating, 1-2 sentence fact about ${selected.name} specifically related to ${topic}. Do not include greetings. Just the fact.`,
              chatHistory: []
            })
          });
          const data = await res.json();
          if (res.ok && data.reply) {
            fact = data.reply;
          }
        } catch (e) {
          console.error("Fact fetch error:", e);
          fact = `${selected.name} is a beautiful sovereign nation waiting to be explored!`;
        }

        // Wait a minimum time for the animation
        await new Promise(r => setTimeout(r, 1500));

        if (isMounted) {
          setDiscoveryCountry(selected);
          setDiscoveryFact(fact);
          setView('card');
        }
      };

      runDiscovery();

      return () => { isMounted = false; };
    }
  }, [view, countriesData, selectedCategory, onSelectCountry]);

  const handleStartDiscovery = (categoryId) => {
    setSelectedCategory(categoryId);
    setView('discovering');
  };

  const handleDailyClick = () => {
    if (dailyCountry) {
      onSelectCountry(dailyCountry);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isFavorite = userJourney?.isFavorite && discoveryCountry ? userJourney.isFavorite(discoveryCountry.name) : false;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 top-auto md:inset-x-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-[#0d1322]/95 backdrop-blur-2xl border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col w-full md:w-[600px] h-[85vh] md:h-auto md:max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <Compass size={20} className="text-[#0d1322]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Explore the World</h1>
              <p className="text-xs text-teal-400 font-medium tracking-wider uppercase">Discovery Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Content Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW: DASHBOARD */}
            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-8"
              >
                {/* Daily Country Card */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} className="text-teal-400" /> 
                    Country of the Day
                  </h3>
                  {dailyCountry && (
                    <button 
                      onClick={handleDailyClick}
                      className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:bg-white/10 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(45,212,191,0.15)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <img 
                          src={`https://flagcdn.com/w80/${(dailyCountry.iso_a2 || dailyCountry.iso_a3 || '').toLowerCase()}.png`} 
                          alt="" 
                          className="w-16 h-auto rounded-md shadow-md"
                        />
                        <div>
                          <h2 className="text-2xl font-bold text-white group-hover:text-teal-300 transition-colors">{dailyCountry.name}</h2>
                          <p className="text-sm font-medium text-gray-400">Discover today's featured destination</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Map size={18} />
                      </div>
                      {/* Decorative gradient */}
                      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" /> 
                    Choose a Theme
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleStartDiscovery(cat.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
                          {cat.icon}
                        </div>
                        <span className="font-semibold text-gray-200 group-hover:text-white">{cat.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: DISCOVERING (Loading) */}
            {view === 'discovering' && (
              <motion.div 
                key="discovering"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-500/30 blur-xl rounded-full animate-pulse" />
                  <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-teal-400 animate-spin flex items-center justify-center relative z-10 bg-[#0d1322]">
                    <Compass size={32} className="text-teal-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-widest uppercase">Discovering</h2>
                  <p className="text-teal-400 font-medium">Flying to a random destination...</p>
                </div>
              </motion.div>
            )}

            {/* VIEW: CARD (Result) */}
            {view === 'card' && discoveryCountry && (
              <motion.div 
                key="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Result Card */}
                <div className="bg-gradient-to-br from-teal-500/10 via-white/5 to-transparent border border-teal-500/20 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(45,212,191,0.05)]">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Map size={120} />
                  </div>
                  
                  <div className="relative z-10 flex flex-col gap-4">
                    <img 
                      src={`https://flagcdn.com/w160/${(discoveryCountry.iso_a2 || discoveryCountry.iso_a3 || '').toLowerCase()}.png`} 
                      alt="" 
                      className="w-24 h-auto rounded-lg shadow-xl border border-white/10"
                    />
                    
                    <div>
                      <h2 className="text-4xl font-bold text-white tracking-tight mb-1">{discoveryCountry.name}</h2>
                      <div className="flex items-center gap-2 text-teal-300 font-medium uppercase tracking-wider text-sm">
                        <Map size={14} /> {selectedCategory} Discovery
                      </div>
                    </div>

                    <div className="bg-black/30 border border-white/10 p-4 rounded-2xl backdrop-blur-md mt-2">
                      <p className="text-gray-200 leading-relaxed text-sm md:text-base font-medium italic">
                        "{discoveryFact}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-3 mt-auto">
                  <button 
                    onClick={onClose} // Globe is already there, standard info panel is active
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <Search size={18} /> Explore Country
                  </button>
                  
                  <button 
                    onClick={() => setView('discovering')}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-6 rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Compass size={18} /> Next Country
                  </button>
                  
                  <button 
                    onClick={() => userJourney?.toggleFavorite && userJourney.toggleFavorite(discoveryCountry)}
                    className={`md:w-16 flex items-center justify-center py-3.5 rounded-xl border transition-all ${
                      isFavorite 
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-500' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-pink-400'
                    }`}
                  >
                    <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
