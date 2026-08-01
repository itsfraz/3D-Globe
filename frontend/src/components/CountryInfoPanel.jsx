import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AIChat from './AIChat';

export default function CountryInfoPanel({ country, onClose }) {
  const [countryDetails, setCountryDetails] = useState(null);

  useEffect(() => {
    if (!country) return;
    
    // Reset details when a new country is selected
    setCountryDetails(null);

    async function fetchCountryData() {
      // Use iso_a2 if available, fallback to name
      const query = country.iso_a2 ? `alpha/${country.iso_a2}` : `name/${country.name}?fullText=true`;
      try {
        const res = await fetch(`https://restcountries.com/v3.1/${query}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        // The API returns an array for name searches, or a single object/array for alpha
        const details = Array.isArray(data) ? data[0] : data;
        setCountryDetails(details);
      } catch (err) {
        console.error("Error fetching country data:", err);
        // Provide some fallback empty state
        setCountryDetails({ error: true });
      }
    }
    
    fetchCountryData();
  }, [country]);

  // Derived display values
  const flagUrl = countryDetails?.flags?.svg || (country?.iso_a2 ? `https://flagcdn.com/w160/${country.iso_a2.toLowerCase()}.png` : null);
  const capital = countryDetails?.capital?.[0] || "Unknown";
  const region = countryDetails?.region || "Unknown";
  const population = countryDetails?.population?.toLocaleString() || "Unknown";

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 500, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-16 right-0 bottom-0 w-full md:w-[420px] z-40 flex flex-col
                     bg-white/5 backdrop-blur-xl border-l border-white/10 
                     md:rounded-tl-2xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-4 pr-8">
                {flagUrl ? (
                  <img src={flagUrl} alt={`${country.name} flag`} className="w-16 h-auto rounded shadow-sm border border-white/20 object-cover" />
                ) : (
                  <div className="w-16 h-10 bg-white/10 rounded border border-white/20 animate-pulse"></div>
                )}
                <h2 className="text-3xl font-bold text-white leading-tight">
                  {country.name}
                </h2>
              </div>
              
              {/* Stats Chips */}
              <div className="flex flex-wrap gap-2 mt-2">
                <StatChip label="Capital" value={!countryDetails && !countryDetails?.error ? "Loading..." : capital} />
                <StatChip label="Region" value={!countryDetails && !countryDetails?.error ? "Loading..." : region} />
                <StatChip label="Pop." value={!countryDetails && !countryDetails?.error ? "Loading..." : population} />
              </div>
            </div>

            {/* About & History Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-teal-400 font-semibold mb-3 text-lg">About & History</h3>
              <div className="text-[15px] text-gray-200 leading-relaxed space-y-4">
                <p>
                  Explore the rich history and culture of {country.name}. Use the AI chat below to discover fascinating facts, top tourist destinations, and local customs.
                </p>
              </div>
            </div>

            {/* AI Chat Section */}
            <div className="border-t border-white/10 pt-6 flex-1 flex flex-col min-h-[300px]">
              <h3 className="text-teal-400 font-semibold mb-4 text-lg shrink-0">Ask AI about {country.name}</h3>
              <AIChat countryName={country.name} />
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="bg-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/5 shadow-inner">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
