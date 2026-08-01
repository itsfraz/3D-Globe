import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { geoCentroid } from 'd3-geo';

export default function GlobeView({ selectedCountry, onSelectCountry, countriesData, onGlobeReady }) {
  const globeRef = useRef();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [hoveredCountry, setHoveredCountry] = useState(null);

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
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom to selected country whenever it changes (handles both clicks and search selections)
  useEffect(() => {
    if (selectedCountry && globeRef.current && countriesData) {
      const feature = countriesData.find(f => f.properties.name === selectedCountry.name);
      if (feature) {
        // Calculate centroid using d3-geo
        const centroid = geoCentroid(feature);
        if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
          globeRef.current.pointOfView(
            { lat: centroid[1], lng: centroid[0], altitude: 1.5 },
            1000
          );
        }
      }
    }
  }, [selectedCountry, countriesData]);

  const handleInteractionStart = () => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
    }
  };

  const handleInteractionEnd = () => {
    if (globeRef.current) {
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current);
      }
      interactionTimeout.current = setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.controls().autoRotate = true;
        }
      }, 3000); // Resume after 3 seconds of inactivity
    }
  };

  const onPolygonHover = (polygon) => {
    setHoveredCountry(polygon);
    if (globeRef.current) {
      globeRef.current.renderer().domElement.style.cursor = polygon ? 'pointer' : 'default';
    }
  };

  const onPolygonClick = (polygon) => {
    // Zoom logic is now handled in the useEffect watching selectedCountry
    if (selectedCountry && selectedCountry.name === polygon.properties.name) {
      return;
    }
    onSelectCountry(polygon.properties);
  };

  return (
    <div 
      className="absolute inset-0 z-0 bg-black"
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
        polygonsData={countriesData}
        polygonAltitude={0.01}
        polygonCapColor={(d) => {
          if (selectedCountry && selectedCountry.name === d.properties.name) {
            return 'rgba(20, 184, 166, 0.8)'; // Bright teal for selected
          }
          if (hoveredCountry && hoveredCountry.properties.name === d.properties.name) {
            return 'rgba(20, 184, 166, 0.4)'; // Soft teal for hovered
          }
          return 'rgba(100, 100, 100, 0.15)'; // Default
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.4)'}
        polygonStrokeColor={() => '#d1d5db'}
        onPolygonHover={onPolygonHover}
        onPolygonClick={onPolygonClick}
        onGlobeReady={onGlobeReady}
      />
    </div>
  );
}
