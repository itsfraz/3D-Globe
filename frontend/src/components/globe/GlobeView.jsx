import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { geoCentroid } from 'd3-geo';
import { scaleLog } from 'd3-scale';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw, Compass, Moon, Sun, Layers } from 'lucide-react';

export default function GlobeView({ 
  selectedCountry, 
  onSelectCountry, 
  compareCountries = [],
  isCompareMode = false,
  isQuizMode = false,
  quizModeType = null,
  quizTargetCountry = null,
  onQuizGlobeClick,
  countriesData, 
  onGlobeReady,
  isNightMode,
  setIsNightMode,
  showArcs,
  setShowArcs,
  activeLayer = 'borders'
}) {
  const globeRef = useRef();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const [arcsData, setArcsData] = useState([]);

  // Track user interaction to pause/resume rotation
  const interactionTimeout = useRef(null);

  // Generate random arcs once countries data is loaded
  useEffect(() => {
    if (countriesData && countriesData.length > 0 && arcsData.length === 0) {
      const generatedArcs = [];
      const numArcs = 40; // Number of glowing arcs
      for (let i = 0; i < numArcs; i++) {
        const startCountry = countriesData[Math.floor(Math.random() * countriesData.length)];
        const endCountry = countriesData[Math.floor(Math.random() * countriesData.length)];
        
        if (startCountry && endCountry) {
          const startCentroid = geoCentroid(startCountry);
          const endCentroid = geoCentroid(endCountry);
          
          if (!isNaN(startCentroid[0]) && !isNaN(endCentroid[0])) {
            generatedArcs.push({
              startLat: startCentroid[1],
              startLng: startCentroid[0],
              endLat: endCentroid[1],
              endLng: endCentroid[0],
              color: ['rgba(45, 212, 191, 0.1)', 'rgba(34, 211, 238, 0.9)'] // gradient from transparent teal to bright cyan
            });
          }
        }
      }
      setArcsData(generatedArcs);
    }
  }, [countriesData, arcsData.length]);

  // Handle window resize dynamically
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enablePan = false;
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom to selected or compared countries
  useEffect(() => {
    if (isCompareMode && compareCountries.length === 2 && globeRef.current && countriesData) {
      const f1 = countriesData.find(f => f.properties.name === compareCountries[0].name);
      const f2 = countriesData.find(f => f.properties.name === compareCountries[1].name);
      
      if (f1 && f2) {
        const c1 = geoCentroid(f1);
        const c2 = geoCentroid(f2);
        
        // Calculate midpoint
        // Handle wrap-around for longitude if difference > 180
        let lngDiff = c2[0] - c1[0];
        if (lngDiff > 180) lngDiff -= 360;
        else if (lngDiff < -180) lngDiff += 360;
        
        const midLng = c1[0] + (lngDiff / 2);
        const midLat = (c1[1] + c2[1]) / 2;
        
        // Rough heuristic for distance
        const maxDiff = Math.max(Math.abs(c1[1] - c2[1]), Math.abs(lngDiff));
        const altitude = Math.min(2.8, Math.max(1.2, maxDiff * 0.025 + 0.5));

        globeRef.current.pointOfView(
          { lat: midLat, lng: midLng, altitude: altitude },
          1500
        );
      }
    } else if (!isCompareMode && selectedCountry && globeRef.current && countriesData) {
      const feature = countriesData.find(f => f.properties.name === selectedCountry.name);
      if (feature) {
        const centroid = geoCentroid(feature);
        if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
          globeRef.current.pointOfView(
            { lat: centroid[1], lng: centroid[0], altitude: 1.6 },
            1200
          );
        }
      }
    }
  }, [selectedCountry, compareCountries, isCompareMode, countriesData]);

  const toggleRotation = () => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    const newState = !isRotating;
    controls.autoRotate = newState;
    setIsRotating(newState);
  };

  const handleZoom = (delta) => {
    if (!globeRef.current) return;
    const currentPov = globeRef.current.pointOfView();
    const newAltitude = Math.max(0.4, Math.min(4.0, currentPov.altitude + delta));
    globeRef.current.pointOfView({ ...currentPov, altitude: newAltitude }, 400);
  };

  const handleResetView = () => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1200);
  };

  const handleInteractionStart = () => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
    }
  };

  const handleInteractionEnd = () => {
    if (globeRef.current && isRotating) {
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
      interactionTimeout.current = setTimeout(() => {
        if (globeRef.current && isRotating) {
          globeRef.current.controls().autoRotate = true;
        }
      }, 4000);
    }
  };

  const onPolygonHover = (polygon) => {
    setHoveredCountry(polygon);
    if (globeRef.current) {
      globeRef.current.renderer().domElement.style.cursor = polygon ? 'pointer' : 'default';
    }
  };

  const onPolygonClick = (polygon) => {
    // Intercept click for Quiz "Locate Country" mode
    if (isQuizMode && quizModeType === 'locate_country') {
      if (onQuizGlobeClick) onQuizGlobeClick(polygon);
      return;
    }

    if (selectedCountry && selectedCountry.name === polygon.properties.name) {
      return;
    }
    onSelectCountry(polygon.properties);
  };

  return (
    <div 
      className="absolute inset-0 z-0 bg-[#070a12]"
      onPointerDown={handleInteractionStart}
      onPointerUp={handleInteractionEnd}
      onWheel={handleInteractionStart}
    >
      <Globe
        ref={globeRef}
        width={windowSize.width}
        height={windowSize.height}
        globeImageUrl={isNightMode ? "//unpkg.com/three-globe/example/img/earth-night.jpg" : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"}
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#06b6d4"
        atmosphereAltitude={0.15}
        polygonsData={countriesData}
        polygonAltitude={(d) => {
          if (activeLayer === 'population' && d.properties.population) {
            return Math.max(0.012, Math.min(0.1, d.properties.population / 1000000000));
          }
          if (activeLayer === 'density' && d.properties.population && d.properties.area) {
            return Math.max(0.012, Math.min(0.1, (d.properties.population / d.properties.area) / 1000));
          }
          return 0.012;
        }}
        polygonCapColor={(d) => {
          // Priority 1: Quiz Highlight
          if (isQuizMode && quizModeType === 'guess_country' && quizTargetCountry && quizTargetCountry.name === d.properties.name) {
            return 'rgba(234, 179, 8, 0.85)';
          }
          
          // Priority 2: Selection / Comparison Highlights
          if (isCompareMode) {
            const isCompared = compareCountries.some(c => c.name === d.properties.name);
            if (isCompared) return 'rgba(236, 72, 153, 0.85)';
          } else if (selectedCountry && selectedCountry.name === d.properties.name) {
            return 'rgba(45, 212, 191, 0.85)';
          }

          // Priority 3: Data Layers
          if (activeLayer === 'population') {
            const pop = d.properties.population;
            if (!pop) return 'rgba(100, 100, 100, 0.2)';
            const colorScale = scaleLog().domain([10000, 1400000000]).range(['#fef08a', '#b91c1c']).clamp(true);
            return colorScale(pop);
          }
          
          if (activeLayer === 'density') {
            const pop = d.properties.population;
            const area = d.properties.area;
            if (!pop || !area) return 'rgba(100, 100, 100, 0.2)';
            const density = pop / area;
            const colorScale = scaleLog().domain([1, 1000]).range(['#dcfce7', '#064e3b']).clamp(true);
            return colorScale(density);
          }
          
          if (activeLayer === 'timezones') {
            const centroid = geoCentroid(d);
            if (isNaN(centroid[0])) return 'rgba(100, 100, 100, 0.2)';
            // Geometric approximation: UTC time + Longitude shift
            const now = new Date();
            const utcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
            let localHour = utcHour + (centroid[0] / 15);
            if (localHour < 0) localHour += 24;
            if (localHour >= 24) localHour -= 24;
            // Day is roughly 6 AM to 6 PM
            const isDay = localHour >= 6 && localHour <= 18;
            return isDay ? 'rgba(250, 204, 21, 0.3)' : 'rgba(2, 6, 23, 0.7)';
          }

          // Default / Borders
          if (hoveredCountry && hoveredCountry.properties.name === d.properties.name) {
            return 'rgba(34, 211, 238, 0.45)';
          }
          return isNightMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(120, 144, 156, 0.12)'; 
        }}
        polygonSideColor={() => 'rgba(7, 10, 18, 0.6)'}
        polygonStrokeColor={(d) => {
          if (isQuizMode && quizModeType === 'guess_country' && quizTargetCountry && quizTargetCountry.name === d.properties.name) {
            return '#facc15';
          }
          if (isCompareMode) {
            const isCompared = compareCountries.some(c => c.name === d.properties.name);
            if (isCompared) return '#f472b6';
            return isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)';
          }
          if (selectedCountry && selectedCountry.name === d.properties.name) {
            return '#5eead4';
          }
          if (hoveredCountry && hoveredCountry.properties.name === d.properties.name) {
            return '#2dd4bf';
          }
          if (activeLayer !== 'borders') {
            return 'rgba(255, 255, 255, 0.05)'; // Dim borders when a layer is active
          }
          return isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)';
        }}
        polygonLabel={(d) => {
          if (isQuizMode && quizModeType === 'guess_country') return ''; // Hide label during quiz

          let extraInfo = '';
          if (activeLayer === 'population' && d.properties.population) {
            extraInfo = `<div style="font-size: 11px; color: #fbbf24; margin-top: 2px;">Population: ${(d.properties.population / 1000000).toFixed(1)}M</div>`;
          } else if (activeLayer === 'density' && d.properties.population && d.properties.area) {
            extraInfo = `<div style="font-size: 11px; color: #34d399; margin-top: 2px;">Density: ${Math.round(d.properties.population / d.properties.area)} / km²</div>`;
          } else if (activeLayer === 'timezones') {
            const centroid = geoCentroid(d);
            if (!isNaN(centroid[0])) {
              const now = new Date();
              const utcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
              let localHour = utcHour + (centroid[0] / 15);
              if (localHour < 0) localHour += 24;
              if (localHour >= 24) localHour -= 24;
              
              const hrs = Math.floor(localHour);
              const mins = Math.floor((localHour - hrs) * 60);
              const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
              
              extraInfo = `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Local Time: ~${timeStr}</div>`;
            }
          }

          return `
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); padding: 6px 10px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); font-family: sans-serif;">
              <b style="color: white; font-size: 13px;">${d.properties.name}</b>
              ${extraInfo}
            </div>
          `;
        }}
        onPolygonHover={onPolygonHover}
        onPolygonClick={onPolygonClick}
        onGlobeReady={onGlobeReady}
        
        // Arc settings
        arcsData={showArcs ? arcsData : []}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={4}
        arcDashInitialGap={() => Math.random() * 5}
        arcDashAnimateTime={2000}
        arcAltitude={() => Math.random() * 0.3 + 0.1}
        arcStroke={0.3}
      />

      {/* Floating Interactive Controls HUD */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-auto bg-[#0d1322]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl p-1.5 px-3">
        
        {/* Main Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleRotation} 
            title={isRotating ? "Pause Rotation" : "Auto Rotate"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isRotating ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          
          <div className="w-px h-4 bg-white/10 mx-1" />

          <button 
            onClick={() => handleZoom(-0.5)} 
            title="Zoom In"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn size={16} />
          </button>

          <button 
            onClick={() => handleZoom(0.5)} 
            title="Zoom Out"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut size={16} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button 
            onClick={handleResetView} 
            title="Reset Globe View"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Feature Toggles */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsNightMode(!isNightMode)} 
            title="Toggle Night Mode"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isNightMode ? 'bg-teal-500/20 text-teal-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            {isNightMode ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button 
            onClick={() => setShowArcs(!showArcs)} 
            title="Toggle Live Routes"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showArcs ? 'bg-teal-500/20 text-teal-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <Layers size={15} />
          </button>
        </div>

      </div>
      
      {/* Status Badge */}
      <div className="fixed bottom-6 left-6 hidden sm:flex glass-pill px-3 py-2 rounded-full items-center gap-2 text-xs font-medium text-gray-400">
        <Compass size={14} className="text-teal-400 animate-spin-slow" />
        <span>{countriesData?.length || 0} Sovereign Nations</span>
      </div>
    </div>
  );
}
