import React, { useState, useEffect } from 'react';
import GlobeView from './components/globe/GlobeView';
import CountryInfoPanel from './components/country/CountryInfoPanel';
import CommandPalette from './components/search/CommandPalette';
import JourneyPanel from './components/journey/JourneyPanel';
import ComparePanel from './components/compare/ComparePanel';
import { Globe2, Sparkles, Heart, User, Search, Menu, Command } from 'lucide-react';
import { useGlobeData } from './hooks/useGlobeData';
import { useUserJourney } from './hooks/useUserJourney';

const loadingQuotes = [
  "Mapping sovereign boundaries...",
  "Initializing 3D orbital canvas...",
  "Connecting AI country guide...",
  "Preparing satellite textures..."
];

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Loading states
  const { countriesData, isDataLoaded } = useGlobeData();
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isJourneyPanelOpen, setIsJourneyPanelOpen] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareCountries, setCompareCountries] = useState([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [showArcs, setShowArcs] = useState(true);

  const userJourney = useUserJourney();

  // Rotate loading quotes
  useEffect(() => {
    if (isAppReady) return;
    const interval = setInterval(() => {
      setLoadingQuoteIndex(prev => (prev + 1) % loadingQuotes.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isAppReady]);

  // Wait for both globe textures and data
  useEffect(() => {
    if (isDataLoaded && isGlobeReady) {
      setTimeout(() => setIsAppReady(true), 300);
    }
  }, [isDataLoaded, isGlobeReady]);

  // URL Parsing for Compare Mode
  useEffect(() => {
    if (countriesData && countriesData.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const compareParam = params.get('compare');
      if (compareParam) {
        const [iso1, iso2] = compareParam.split('-');
        const c1 = countriesData.find(c => c.properties.iso_a2 === iso1 || c.properties.iso_a3 === iso1);
        const c2 = countriesData.find(c => c.properties.iso_a2 === iso2 || c.properties.iso_a3 === iso2);
        
        if (c1 || c2) {
          setCompareCountries([c1?.properties, c2?.properties].filter(Boolean));
          setIsCompareMode(true);
        }
      }
    }
  }, [countriesData]);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K) to open palette
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Random Country Selection
  const handleRandomCountry = () => {
    if (!countriesData || countriesData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * countriesData.length);
    const randomCountry = countriesData[randomIndex];
    setSelectedCountry(randomCountry.properties);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans bg-[#070a12] text-white">
      
      {/* 3D Globe Background */}
      <GlobeView 
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        compareCountries={compareCountries}
        isCompareMode={isCompareMode}
        countriesData={countriesData}
        onGlobeReady={() => setIsGlobeReady(true)}
        isNightMode={isNightMode}
        setIsNightMode={setIsNightMode}
        showArcs={showArcs}
        setShowArcs={setShowArcs}
      />
      
      {/* Top Floating Glass Header */}
      <header className="fixed top-4 left-4 right-4 sm:left-8 sm:right-8 z-30 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-0 sm:h-16 glass-panel rounded-2xl sm:rounded-full pointer-events-auto transition-all">
        
        {/* LEFT: Brand Logo & Name */}
        <div className="flex items-center gap-3 w-auto sm:w-[280px]">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-400/20 flex items-center justify-center glow-subtle shrink-0">
            <Globe2 className="text-teal-400 animate-pulse-glow" size={22} />
          </div>
          <div className="flex-col hidden sm:flex">
            <h1 className="text-[16px] sm:text-[18px] font-bold tracking-tight gradient-text whitespace-nowrap leading-none flex items-center gap-2">
              World Globe AI
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-white/5 text-teal-300 border border-white/10 uppercase">
                AI 3D
              </span>
            </h1>
          </div>
        </div>

        {/* CENTER: Search Bar Trigger Button */}
        <div className="flex-1 max-w-xl flex justify-center transition-all duration-300">
          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full max-w-[400px] bg-[#0d1322]/80 hover:bg-[#0d1322] border border-white/10 rounded-xl py-2 px-4 flex items-center justify-between text-sm text-gray-500 transition-all shadow-2xl backdrop-blur-2xl group"
          >
            <div className="flex items-center gap-2">
              <Search size={16} className="text-gray-500 group-hover:text-teal-500 transition-colors" />
              <span className="hidden sm:inline">Search countries, cities or actions...</span>
              <span className="inline sm:hidden">Search...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
              <Command size={10} className="text-gray-400" />
              <span className="text-gray-400">K</span>
            </div>
          </button>
        </div>

        {/* RIGHT: Navigation & Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-auto sm:w-[280px]">

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 mr-2 bg-white/5 rounded-full p-1 border border-white/5">
            <button className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Explore</button>
            <button 
              onClick={() => setIsCompareMode(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Compare
            </button>
            <button className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">AI</button>
          </div>

          <button 
            onClick={() => setIsJourneyPanelOpen(true)}
            className="hidden sm:flex p-2.5 text-gray-400 hover:text-teal-300 hover:bg-white/10 rounded-full transition-colors relative" 
            title="My Journey"
          >
            <Heart size={18} />
            {userJourney.favorites.length > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
            )}
          </button>
          
          <button 
            onClick={() => setIsJourneyPanelOpen(true)}
            className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors border border-white/10" 
            title="Profile"
          >
            <User size={18} />
          </button>

          {/* Mobile Menu */}
          <button className="sm:hidden p-2 text-gray-300 hover:text-white bg-white/5 rounded-full">
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Side Panel for Country Information */}
      <CountryInfoPanel 
        country={selectedCountry} 
        onClose={() => setSelectedCountry(null)} 
        userJourney={userJourney}
      />

      {/* Background Aura */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.05) 0%, rgba(7, 10, 18, 0) 60%)'
      }} />

      {/* Fullscreen Loading Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-[#070a12] flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
          isAppReady ? 'opacity-0 pointer-events-none scale-105 blur-xl' : 'opacity-100 scale-100 blur-0'
        }`}
      >
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute w-40 h-40 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
          <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-xl shadow-2xl glow-subtle">
            <Globe2 className="text-teal-400 animate-spin-slow" size={48} />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-3 flex items-center gap-2">
          World Globe AI
          <Sparkles className="text-teal-400" size={18} />
        </h2>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest animate-pulse transition-all h-6">
          {loadingQuotes[loadingQuoteIndex]}
        </p>
      </div>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        countries={countriesData}
        onSelectCountry={setSelectedCountry}
        onRandomCountry={handleRandomCountry}
        onOpenFavorites={() => setIsJourneyPanelOpen(true)}
        onOpenCompare={() => setIsCompareMode(true)}
        isNightMode={isNightMode}
        onToggleNightMode={() => setIsNightMode(!isNightMode)}
        showArcs={showArcs}
        onToggleArcs={() => setShowArcs(!showArcs)}
      />

      {/* Global Journey Panel */}
      <JourneyPanel 
        isOpen={isJourneyPanelOpen}
        onClose={() => setIsJourneyPanelOpen(false)}
        userJourney={userJourney}
        onSelectCountry={setSelectedCountry}
      />

      {/* Global Compare Panel */}
      <ComparePanel
        isOpen={isCompareMode}
        onClose={() => setIsCompareMode(false)}
        compareCountries={compareCountries}
        setCompareCountries={setCompareCountries}
        countriesData={countriesData}
      />
    </div>
  );
}

export default App;
