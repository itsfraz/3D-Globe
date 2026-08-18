import React, { useState, useEffect } from 'react';
import GlobeView from './components/globe/GlobeView';
import CountryInfoPanel from './components/country/CountryInfoPanel';
import CommandPalette from './components/search/CommandPalette';
import JourneyPanel from './components/journey/JourneyPanel';
import ComparePanel from './components/compare/ComparePanel';
import ExploreMode from './components/explore/ExploreMode';
import GeoChallenge from './components/quiz/GeoChallenge';
import AIWorldGuide from './components/ai/AIWorldGuide';
import GlobalLayersPanel from './components/layers/GlobalLayersPanel';
import MobileSidebar from './components/navigation/MobileSidebar';
import { Globe2, Sparkles, Heart, User, Search, Menu, Command, Trophy, Layers } from 'lucide-react';
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
  const [isExploreModeOpen, setIsExploreModeOpen] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareCountries, setCompareCountries] = useState([]);
  
  // Quiz states
  const [isQuizModeOpen, setIsQuizModeOpen] = useState(false);
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const [quizModeType, setQuizModeType] = useState(null);
  const [quizTargetCountry, setQuizTargetCountry] = useState(null);
  const [quizClickedPolygon, setQuizClickedPolygon] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);

  const [isNightMode, setIsNightMode] = useState(false);
  const [showArcs, setShowArcs] = useState(true);
  
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState('borders');
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        isQuizMode={isQuizModeOpen}
        quizModeType={quizModeType}
        quizTargetCountry={quizTargetCountry}
        quizFeedback={quizFeedback}
        onQuizGlobeClick={setQuizClickedPolygon}
        countriesData={countriesData}
        onGlobeReady={() => setIsGlobeReady(true)}
        isNightMode={isNightMode}
        setIsNightMode={setIsNightMode}
        showArcs={showArcs}
        setShowArcs={setShowArcs}
        activeLayer={activeLayer}
      />
      
      {/* Global Layers Panel */}
      <GlobalLayersPanel 
        isOpen={isLayersPanelOpen}
        onClose={() => setIsLayersPanelOpen(false)}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        selectedCountry={selectedCountry}
      />
      
      {/* Top Floating Glass Header */}
      <header className="fixed top-4 left-4 right-4 sm:left-8 sm:right-8 z-30 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-0 sm:h-16 glass-panel rounded-2xl sm:rounded-full pointer-events-auto transition-all shadow-lg">
        
        {/* LEFT: Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/10 border border-teal-400/20 flex items-center justify-center glow-subtle shrink-0">
            <Globe2 className="text-teal-400 animate-pulse-glow" size={20} />
          </div>
          <div className="flex-col hidden sm:flex">
            <h1 className="text-[15px] sm:text-[18px] font-bold tracking-tight gradient-text whitespace-nowrap leading-none flex items-center gap-2">
              World Globe AI
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-white/5 text-teal-300 border border-white/10 uppercase">
                AI 3D
              </span>
            </h1>
          </div>
        </div>

        {/* CENTER: Search Bar Trigger Button */}
        <div className="flex-1 max-w-[300px] sm:max-w-[400px] xl:max-w-[500px] flex justify-center transition-all duration-300 mx-3 sm:mx-6 min-w-[120px]">
          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full bg-[#0d1322]/80 hover:bg-[#0d1322] border border-white/10 hover:border-teal-500/30 rounded-xl sm:rounded-full py-2 px-3 sm:px-4 flex items-center justify-between text-sm text-gray-400 transition-all shadow-inner backdrop-blur-xl group"
          >
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              <Search size={16} className="text-gray-400 group-hover:text-teal-400 transition-colors shrink-0" />
              <span className="hidden sm:inline truncate">Search countries, cities or actions...</span>
              <span className="inline sm:hidden truncate text-xs">Search...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium bg-white/10 px-1.5 py-0.5 rounded border border-white/10 shrink-0 ml-2">
              <Command size={10} className="text-gray-400" />
              <span className="text-gray-400">K</span>
            </div>
          </button>
        </div>

        {/* RIGHT: Navigation & Actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-1 mr-2 bg-white/5 rounded-full p-1 border border-white/5">
            <button 
              onClick={() => setIsExploreModeOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-teal-300 hover:text-white hover:bg-teal-500/20 transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={12} /> Explore the World
            </button>
            <button 
              onClick={() => setIsCompareMode(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Compare
            </button>
            <button 
              onClick={() => setIsQuizModeOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-yellow-400 hover:text-white hover:bg-yellow-500/20 transition-colors flex items-center gap-1.5"
            >
              <Trophy size={12} /> Geo Challenge
            </button>
            <button 
              onClick={() => setIsAIGuideOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={12} /> AI Guide
            </button>
          </div>

          <button 
            onClick={() => setIsLayersPanelOpen(true)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all font-medium text-xs sm:text-sm"
          >
            <Layers size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Layers</span>
          </button>
          
          <button 
            onClick={() => setIsJourneyPanelOpen(true)}
            className="hidden sm:flex p-2 text-gray-400 hover:text-teal-300 hover:bg-white/10 rounded-full transition-colors relative border border-transparent" 
            title="My Journey"
          >
            <Heart size={16} className="sm:w-[18px] sm:h-[18px]" />
            {userJourney.favorites.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
            )}
          </button>
          
          <button 
            onClick={() => setIsJourneyPanelOpen(true)}
            className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors border border-white/10" 
            title="Profile"
          >
            <User size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          {/* Mobile Menu */}
          <button 
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileSidebarOpen}
            aria-controls="mobile-sidebar"
            className="xl:hidden p-1.5 sm:p-2 text-gray-300 hover:text-white bg-white/5 rounded-full border border-transparent hover:border-white/10 transition-colors"
          >
            <Menu size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Side Panel for Country Information */}
      <CountryInfoPanel 
        country={selectedCountry} 
        onClose={() => setSelectedCountry(null)} 
        userJourney={userJourney}
        countriesData={countriesData}
        onSelectCountry={setSelectedCountry}
      />

      {/* Background Aura */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.05) 0%, rgba(7, 10, 18, 0) 60%)'
      }} />

      {/* AI World Guide */}
      <AIWorldGuide 
        isOpen={isAIGuideOpen} 
        onClose={() => setIsAIGuideOpen(false)} 
        selectedCountry={selectedCountry}
        compareCountries={compareCountries}
        isCompareMode={isCompareMode}
      />

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
        onOpenExplore={() => setIsExploreModeOpen(true)}
        onOpenQuiz={() => setIsQuizModeOpen(true)}
        onOpenAIGuide={() => setIsAIGuideOpen(true)}
        onOpenLayers={() => setIsLayersPanelOpen(true)}
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

      {/* Global Explore Mode */}
      <ExploreMode 
        isOpen={isExploreModeOpen}
        onClose={() => setIsExploreModeOpen(false)}
        countriesData={countriesData}
        onSelectCountry={setSelectedCountry}
        userJourney={userJourney}
      />

      {/* Global Geo Challenge */}
      <GeoChallenge 
        isOpen={isQuizModeOpen}
        onClose={() => {
          setIsQuizModeOpen(false);
          setQuizClickedPolygon(null);
        }}
        countriesData={countriesData}
        userJourney={userJourney}
        setQuizModeType={setQuizModeType}
        setQuizTargetCountry={setQuizTargetCountry}
        setQuizFeedback={setQuizFeedback}
        quizClickedPolygon={quizClickedPolygon}
        clearQuizClickedPolygon={() => setQuizClickedPolygon(null)}
      />

      {/* Global Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenExplore={() => setIsExploreModeOpen(true)}
        onOpenCompare={() => setIsCompareMode(true)}
        onOpenQuiz={() => setIsQuizModeOpen(true)}
        onOpenAIGuide={() => setIsAIGuideOpen(true)}
        onOpenLayers={() => setIsLayersPanelOpen(true)}
        onOpenJourney={() => setIsJourneyPanelOpen(true)}
        userJourneyFavoritesCount={userJourney?.favorites?.length || 0}
      />
    </div>
  );
}

export default App;
