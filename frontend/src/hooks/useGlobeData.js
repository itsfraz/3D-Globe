import { useState, useEffect } from 'react';
import { feature } from 'topojson-client';
import iso3166 from 'iso-3166-1';

// Cache to prevent refetching
let cachedMledozeDb = null;

export function useGlobeData() {
  const [countriesData, setCountriesData] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const module = await import('world-atlas/countries-110m.json');
        const countriesTopoJson = module.default || module;
        const geoJson = feature(countriesTopoJson, countriesTopoJson.objects.countries);
        
        // Fetch extended data
        if (!cachedMledozeDb) {
          const fallbackRes = await fetch(`https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json`);
          if (fallbackRes.ok) {
            cachedMledozeDb = await fallbackRes.json();
          }
        }

        const mappedData = geoJson.features.map(f => {
          let iso_a2 = null;
          let extendedData = null;

          if (f.id) {
            const countryData = iso3166.whereNumeric(f.id.toString().padStart(3, '0'));
            if (countryData) {
              iso_a2 = countryData.alpha2;
              
              if (cachedMledozeDb) {
                extendedData = cachedMledozeDb.find(c => c.cca2 === iso_a2);
              }
            }
          }
          
          return {
            ...f,
            properties: { 
              ...f.properties, 
              iso_a2,
              population: extendedData?.population || null,
              area: extendedData?.area || null,
              region: extendedData?.region || null
            }
          };
        }).filter(f => f.properties && f.properties.name);

        setCountriesData(mappedData);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Failed to load country data", err);
        setError(err);
      }
    }
    loadData();
  }, []);

  return { countriesData, isDataLoaded, error };
}
