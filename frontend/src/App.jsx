import React, { useState, useEffect } from 'react';
import GlobeView from './components/GlobeView';
import CountryInfoPanel from './components/CountryInfoPanel';
import SearchBar from './components/SearchBar';
import { Globe2 } from 'lucide-react';
import { feature } from 'topojson-client';
import iso3166 from 'iso-3166-1';

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Loading states
  const [countriesData, setCountriesData] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
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
      // Small delay just to ensure rendering is smooth
      setTimeout(() => setIsAppReady(true), 200);
    }
  }, [isDataLoaded, isGlobeReady]);

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans bg-navy text-white">
      
      {/* 3D Globe Background */}
      <GlobeView 
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        countriesData={countriesData}
        onGlobeReady={() => setIsGlobeReady(true)}
      />
      
      {/* Top Bar Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/30 backdrop-blur-md border-b border-white/10 z-30 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Globe2 className="text-teal-400" size={24} />
          <h1 className="text-lg sm:text-xl font-bold tracking-wide text-white whitespace-nowrap">
            World Globe AI
          </h1>
        </div>

        {/* Search Bar */}
        <div className="w-48 sm:w-64 ml-4">
          <SearchBar countries={countriesData} onSelectCountry={setSelectedCountry} />
        </div>
      </header>

      {/* Side Panel for Country Info & Chat */}
      <CountryInfoPanel 
        country={selectedCountry} 
        onClose={() => setSelectedCountry(null)} 
      />

      {/* Loading Screen Overlay */}
      <div 
        className={`absolute inset-0 z-50 bg-[#0a0e17] flex flex-col items-center justify-center transition-opacity duration-400 ${
          isAppReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Globe2 className="text-teal-400 animate-spin-slow mb-4" size={64} style={{ animationDuration: '3s' }} />
        <h2 className="text-2xl font-bold tracking-wider mb-2">World Globe AI</h2>
        <p className="text-gray-400 text-sm animate-pulse">Loading world data...</p>
      </div>
    </div>
  );
}

export default App;
