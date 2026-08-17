import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Clock, Award, BarChart2, Flame, Map, Globe2, Trash2, Compass } from 'lucide-react';

export default function JourneyPanel({ isOpen, onClose, userJourney, onSelectCountry }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!userJourney) return null;

  const {
    favorites,
    removeFavorite,
    clearFavorites,
    recentHistory,
    stats,
    streak,
    achievements
  } = userJourney;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={16} /> },
    { id: 'recent', label: 'Recent', icon: <Clock size={16} /> },
    { id: 'achievements', label: 'Awards', icon: <Award size={16} /> }
  ];

  const handleCountryClick = (country) => {
    onSelectCountry(country);
    // On mobile, maybe close the panel? Let's leave it open or close it based on preference.
    // Usually selecting a country from a side panel feels better if it closes to show the globe.
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#070a12]/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full md:top-20 md:right-6 md:bottom-6 md:w-[420px] z-50 flex flex-col bg-[#0d1322]/95 backdrop-blur-3xl md:rounded-2xl border-l md:border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 bg-[#0d1322]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-400/20 flex items-center justify-center glow-subtle">
                  <Compass className="text-teal-400" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight leading-none">My Journey</h2>
                  <p className="text-xs text-gray-400 mt-1">Your world exploration passport</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-2 pt-2 gap-1 border-b border-white/10 overflow-x-auto custom-scrollbar shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'text-teal-400 border-teal-400' 
                      : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5 rounded-t-lg'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  
                  {/* Streak Banner */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/5 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-3xl -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                      <Flame className="text-orange-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-orange-100 font-bold text-lg">{streak} Day Streak</h3>
                      <p className="text-xs text-orange-200/60">Keep exploring daily to build your streak!</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">World Explorer Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard icon={<Globe2 size={16} className="text-blue-400"/>} label="Countries Explored" value={stats.totalExplored} />
                      <StatCard icon={<Heart size={16} className="text-pink-400"/>} label="Favorites Saved" value={stats.totalFavorites} />
                      <StatCard icon={<Compass size={16} className="text-teal-400"/>} label="Explored This Week" value={stats.exploredThisWeek} />
                      <StatCard icon={<Map size={16} className="text-purple-400"/>} label="Unique Regions" value={stats.uniqueRegions} />
                    </div>
                  </div>

                </div>
              )}

              {/* FAVORITES TAB */}
              {activeTab === 'favorites' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300 h-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">My World</h3>
                    {favorites.length > 0 && (
                      <button onClick={clearFavorites} className="text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors uppercase">
                        Clear All
                      </button>
                    )}
                  </div>

                  {favorites.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-gray-500 pb-10">
                      <Heart size={32} className="opacity-20" />
                      <div>
                        <p className="font-medium text-gray-400">Your world is empty.</p>
                        <p className="text-xs mt-1">Explore a country and save it here.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {favorites.map(country => (
                        <CountryRow 
                          key={`fav-${country.name}`} 
                          country={country} 
                          onClick={() => handleCountryClick(country)}
                          onRemove={(e) => {
                            e.stopPropagation();
                            removeFavorite(country.name);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RECENTLY VIEWED TAB */}
              {activeTab === 'recent' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300 h-full">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recently Explored</h3>
                  
                  {recentHistory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-gray-500 pb-10">
                      <Clock size={32} className="opacity-20" />
                      <div>
                        <p className="font-medium text-gray-400">No recent history.</p>
                        <p className="text-xs mt-1">Click on the globe to start exploring.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {recentHistory.map((country, idx) => (
                        <CountryRow 
                          key={`recent-${country.name}-${idx}`} 
                          country={country} 
                          onClick={() => handleCountryClick(country)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACHIEVEMENTS TAB */}
              {activeTab === 'achievements' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Explorer Badges</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {achievements.map(ach => (
                      <div 
                        key={ach.id} 
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                          ach.unlocked 
                            ? 'bg-teal-500/10 border-teal-500/20' 
                            : 'bg-white/5 border-white/5 opacity-60 grayscale'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                          ach.unlocked ? 'bg-gradient-to-br from-teal-400 to-cyan-600 text-white' : 'bg-gray-800 text-gray-500'
                        }`}>
                          <Award size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${ach.unlocked ? 'text-teal-100' : 'text-gray-400'}`}>
                            {ach.title}
                          </span>
                          <span className={`text-xs ${ach.unlocked ? 'text-teal-300/70' : 'text-gray-600'}`}>
                            {ach.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-components
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute -right-2 -bottom-2 opacity-10 blur-sm pointer-events-none transform scale-150">
        {icon}
      </div>
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function CountryRow({ country, onClick, onRemove }) {
  const iso = country.iso_a2;
  
  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {iso ? (
          <img 
            src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`} 
            alt={country.name}
            className="w-8 h-6 object-cover rounded shadow-sm border border-white/20 shrink-0"
          />
        ) : (
          <div className="w-8 h-6 bg-white/10 rounded shrink-0" />
        )}
        <div className="flex flex-col truncate">
          <span className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors truncate">{country.name}</span>
          {country.region && (
            <span className="text-[10px] text-gray-500 truncate">{country.region}</span>
          )}
        </div>
      </div>
      
      {onRemove ? (
        <button 
          onClick={onRemove}
          className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Remove from favorites"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        iso && (
          <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-white/5 text-gray-500 border border-white/5 shrink-0">
            {iso}
          </span>
        )
      )}
    </div>
  );
}
