import React, { useState, useEffect } from 'react';
import GlobeView from './components/GlobeView';
import CountryInfoPanel from './components/CountryInfoPanel';
import SearchBar from './components/SearchBar';
import { Globe2, Shuffle, Sparkles } from 'lucide-react';
import { feature } from 'topojson-client';
import iso3166 from 'iso-3166-1';

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Loading states
  const [countriesData, setCountriesData] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);

  const loadingQuotes = [
    "Mapping sovereign boundaries...",
    "Initializing 3D orbital canvas...",
    "Connecting AI country guide...",
    "Preparing satellite textures..."
  ];

  // Rotate loading quotes
  useEffect(() => {
    if (isAppReady) return;
    const interval = setInterval(() => {
      setLoadingQuoteIndex(prev => (prev + 1) % loadingQuotes.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isAppReady]);

  // Load TopoJSON data asynchronously
  useEffect(() => {
    async function loadData() {
      try {
        const module = await import('world-atlas/countries-110m.json');
        const countriesTopoJson = module.default || module;
        const geoJson = feature(countriesTopoJson, countriesTopoJson.objects.countries);
        
        const mappedData = geoJson.features.map(f => {
          let iso_a2 = null;
          if (f.id) {
            const countryData = iso3166.whereNumeric(f.id.toString().padStart(3, '0'));
            if (countryData) {
              iso_a2 = countryData.alpha2;
            }
          }
          return {
            ...f,
            properties: { ...f.properties, iso_a2 }
          };
        }).filter(f => f.properties && f.properties.name);

        setCountriesData(mappedData);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Failed to load country data", err);
      }
    }
    loadData();
  }, []);

  // Wait for both globe textures and data
  useEffect(() => {
    if (isDataLoaded && isGlobeReady) {
      setTimeout(() => setIsAppReady(true), 300);
    }
  }, [isDataLoaded, isGlobeReady]);

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
        countriesData={countriesData}
        onGlobeReady={() => setIsGlobeReady(true)}
      />
      
      {/* Top Floating Glass Header */}
      <header className="fixed top-4 left-4 right-4 sm:left-6 sm:right-6 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 px-4 py-3 sm:px-6 sm:py-0 sm:h-16 glass-pill rounded-2xl sm:rounded-full pointer-events-auto">
        
        {/* Top Row on Mobile / Left Side on Desktop */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center glow-teal shrink-0">
              <Globe2 className="text-teal-400 animate-pulse-glow" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[15px] sm:text-lg font-extrabold tracking-tight gradient-text whitespace-nowrap leading-none flex items-center gap-1.5">
                World Globe AI
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase">
                  AI 3D
                </span>
              </h1>
              <span className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block mt-0.5">Explore Earth with Interactive AI</span>
            </div>
          </div>

          {/* Random Country Shuffle Button (Mobile) */}
          <button 
            onClick={handleRandomCountry}
            title="Discover a Random Country"
            className="sm:hidden glass-pill w-9 h-9 rounded-full flex items-center justify-center text-teal-300 hover:text-white transition-all shadow-md active:scale-95 shrink-0"
          >
            <Shuffle size={14} className="text-teal-400" />
          </button>
        </div>

        {/* Bottom Row on Mobile / Right Side on Desktop */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Random Country Shuffle Button (Desktop) */}
          <button 
            onClick={handleRandomCountry}
            title="Discover a Random Country"
            className="hidden sm:flex glass-pill px-3 py-2 rounded-full items-center gap-2 text-xs font-semibold text-teal-300 hover:text-white transition-all shadow-md active:scale-95 shrink-0"
          >
            <Shuffle size={14} className="text-teal-400" />
            <span className="hidden md:inline">Random Nation</span>
          </button>

          {/* Search Bar */}
          <div className="w-full sm:w-64 md:w-72">
            <SearchBar countries={countriesData} onSelectCountry={setSelectedCountry} />
          </div>
        </div>
      </header>

      {/* Side Panel for Country Info & Chat */}
      <CountryInfoPanel 
        country={selectedCountry} 
        onClose={() => setSelectedCountry(null)} 
      />

      {/* Fullscreen Loading Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-[#070a12] flex flex-col items-center justify-center transition-all duration-500 ${
          isAppReady ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
        }`}
      >
        <div className="relative flex items-center justify-center mb-8">
          {/* Glowing Aura Ring */}
          <div className="absolute w-36 h-36 rounded-full bg-teal-500/20 blur-2xl animate-pulse" />
          <div className="w-24 h-24 rounded-full border border-teal-500/30 flex items-center justify-center bg-white/5 backdrop-blur-md glow-teal">
            <Globe2 className="text-teal-400 animate-spin-slow" size={48} />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight gradient-text mb-2 flex items-center gap-2">
          World Globe AI
          <Sparkles className="text-cyan-400" size={20} />
        </h2>
        <p className="text-gray-400 text-sm font-medium animate-pulse transition-all h-6">
          {loadingQuotes[loadingQuoteIndex]}
        </p>
      </div>
    </div>
  );
}

export default App;
