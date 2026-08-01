import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { geoCentroid } from 'd3-geo';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw, Compass } from 'lucide-react';

export default function GlobeView({ selectedCountry, onSelectCountry, countriesData, onGlobeReady }) {
  const globeRef = useRef();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [isRotating, setIsRotating] = useState(true);

  // Track user interaction to pause/resume rotation
  const interactionTimeout = useRef(null);

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
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom to selected country whenever it changes
  useEffect(() => {
    if (selectedCountry && globeRef.current && countriesData) {
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
  }, [selectedCountry, countriesData]);

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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#2dd4bf"
        atmosphereAltitude={0.16}
        polygonsData={countriesData}
        polygonAltitude={0.012}
        polygonCapColor={(d) => {
          if (selectedCountry && selectedCountry.name === d.properties.name) {
            return 'rgba(45, 212, 191, 0.85)'; // Neon teal fill for selected
          }
          if (hoveredCountry && hoveredCountry.properties.name === d.properties.name) {
            return 'rgba(34, 211, 238, 0.45)'; // Soft cyan fill for hover
          }
          return 'rgba(120, 144, 156, 0.12)'; // Ultra clean subtle base fill
        }}
        polygonSideColor={() => 'rgba(7, 10, 18, 0.6)'}
        polygonStrokeColor={(d) => {
          if (selectedCountry && selectedCountry.name === d.properties.name) {
            return '#5eead4';
          }
          if (hoveredCountry && hoveredCountry.properties.name === d.properties.name) {
            return '#2dd4bf';
          }
          return 'rgba(255, 255, 255, 0.25)';
        }}
        onPolygonHover={onPolygonHover}
        onPolygonClick={onPolygonClick}
        onGlobeReady={onGlobeReady}
      />

      {/* Floating Interactive Controls HUD */}
      <div className="fixed bottom-6 left-6 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="glass-pill p-1.5 flex items-center gap-1 rounded-full shadow-2xl">
          <button 
            onClick={toggleRotation} 
            title={isRotating ? "Pause Rotation" : "Auto Rotate"}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-teal-300 hover:bg-white/10 transition-all"
          >
            {isRotating ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          
          <div className="w-px h-5 bg-white/10" />

          <button 
            onClick={() => handleZoom(-0.5)} 
            title="Zoom In"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-teal-300 hover:bg-white/10 transition-all"
          >
            <ZoomIn size={16} />
          </button>

          <button 
            onClick={() => handleZoom(0.5)} 
            title="Zoom Out"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-teal-300 hover:bg-white/10 transition-all"
          >
            <ZoomOut size={16} />
          </button>

          <div className="w-px h-5 bg-white/10" />

          <button 
            onClick={handleResetView} 
            title="Reset Globe View"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-teal-300 hover:bg-white/10 transition-all"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="hidden sm:flex glass-pill px-3 py-2 rounded-full items-center gap-2 text-xs text-gray-300">
          <Compass size={14} className="text-teal-400 animate-spin-slow" />
          <span>{countriesData?.length || 0} Sovereign Nations</span>
        </div>
      </div>
    </div>
  );
}
