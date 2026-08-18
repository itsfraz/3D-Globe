import { useState, useEffect } from 'react';

// In-memory cache for country dataset so it only fetches once globally
let cachedCountriesDb = null;
let cachedMledozeDb = null;

export function useCountryDetails(country) {
  const [countryDetails, setCountryDetails] = useState(null);
  const [wikiData, setWikiData] = useState(null);
  const [localTime, setLocalTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [wikiLoading, setWikiLoading] = useState(true);

  useEffect(() => {
    if (!country) return;
    
    setLoading(true);
    setWikiLoading(true);
    setCountryDetails(null);
    setWikiData(null);
    setLocalTime("");

    async function getCountryInfo() {
      try {
        // Fetch primary database if not already cached
        if (!cachedCountriesDb) {
          const res = await fetch('https://cdn.jsdelivr.net/gh/dr5hn/countries-states-cities-database@master/json/countries.json');
          if (res.ok) {
            cachedCountriesDb = await res.json();
          }
        }
        
        // Fetch fallback database if not already cached
        if (!cachedMledozeDb) {
          const fallbackRes = await fetch(`https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json`);
          if (fallbackRes.ok) {
            cachedMledozeDb = await fallbackRes.json();
          }
        }

        const targetName = country.name.toLowerCase();
        const targetIso = country.iso_a2 ? country.iso_a2.toUpperCase() : null;

        let primaryMatch = null;
        let mledozeMatch = null;

        if (cachedCountriesDb && cachedCountriesDb.length > 0) {
          primaryMatch = cachedCountriesDb.find(c => targetIso && c.iso2 === targetIso);
          if (!primaryMatch) primaryMatch = cachedCountriesDb.find(c => c.name.toLowerCase() === targetName);
          if (!primaryMatch) primaryMatch = cachedCountriesDb.find(c => c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase()));
        }

        if (cachedMledozeDb && cachedMledozeDb.length > 0) {
          mledozeMatch = cachedMledozeDb.find(c => (targetIso && c.cca2 === targetIso) || c.name.common.toLowerCase() === targetName);
        }

        if (primaryMatch || mledozeMatch) {
          const currKey = mledozeMatch?.currencies ? Object.keys(mledozeMatch.currencies)[0] : null;
          const currObj = currKey ? mledozeMatch.currencies[currKey] : null;
          
          let languagesStr = 'N/A';
          if (mledozeMatch?.languages) {
             languagesStr = Object.values(mledozeMatch.languages).slice(0, 3).join(', ');
          }

          const combinedDetails = {
            capital: primaryMatch?.capital || (mledozeMatch?.capital ? mledozeMatch.capital[0] : 'N/A'),
            region: primaryMatch?.region || mledozeMatch?.region || 'N/A',
            subregion: primaryMatch?.subregion || mledozeMatch?.subregion || 'N/A',
            population: mledozeMatch?.population || primaryMatch?.population || 'N/A',
            currency_name: primaryMatch?.currency_name || (currObj ? currObj.name : 'N/A'),
            currency_symbol: primaryMatch?.currency_symbol || (currObj ? currObj.symbol : ''),
            currency_code: primaryMatch?.currency || currKey || 'N/A',
            iso2: primaryMatch?.iso2 || mledozeMatch?.cca2,
            area: mledozeMatch?.area || 'N/A',
            languages: languagesStr,
          };

          setCountryDetails(combinedDetails);
          
          // Calculate local time if timezones are available
          if (primaryMatch?.timezones && primaryMatch.timezones.length > 0) {
            const tz = primaryMatch.timezones[0]; // Take primary timezone
            try {
              const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz.zoneName,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
              setLocalTime(formatter.format(new Date()));
            } catch (e) {
              console.warn("Timezone formatting failed:", e);
              setLocalTime("N/A");
            }
          } else {
            setLocalTime("N/A");
          }
        }
      } catch (err) {
        console.error("Error retrieving country details:", err);
      } finally {
        setLoading(false);
      }
      
      // Fetch Wikipedia Summary
      try {
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country.name)}`);
        if (wikiRes.ok) {
          const wikiJson = await wikiRes.json();
          setWikiData(wikiJson);
        }
      } catch (err) {
        console.error("Failed to fetch wiki data", err);
      } finally {
        setWikiLoading(false);
      }
    }

    getCountryInfo();
  }, [country]);

  return { countryDetails, wikiData, localTime, loading, wikiLoading };
}
