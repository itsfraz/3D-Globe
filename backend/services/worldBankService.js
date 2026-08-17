/**
 * World Bank API Service
 * Fetches, cleans, and formats the latest GDP data for all countries.
 */

let gdpCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Fetches the latest GDP in current US Dollars for all countries.
 * - Filters out null GDP values
 * - Filters out non-country aggregates (e.g., regions like "World" which lack an ISO3 code)
 * - Formats the GDP as a USD currency string
 * - Sorts the results in descending order by GDP
 * 
 * @returns {Promise<Array>} Sorted and cleaned array of country GDP data
 */
async function fetchLatestGDP() {
  if (gdpCache && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return gdpCache;
  }

  const url = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&mrnev=1&per_page=300';
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`World Bank API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const records = data[1];
    if (!Array.isArray(records)) {
      throw new Error('Unexpected API response format');
    }

    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });

    const cleanedData = records
      .filter(record => 
        record.value !== null && 
        record.countryiso3code && 
        record.countryiso3code.trim() !== ''
      )
      .map(record => ({
        country: record.country.value,
        iso3Code: record.countryiso3code,
        year: record.date,
        rawGdp: record.value,
        formattedGdp: usdFormatter.format(record.value)
      }))
      .sort((a, b) => b.rawGdp - a.rawGdp);

    gdpCache = cleanedData;
    lastFetchTime = Date.now();
    return cleanedData;

  } catch (error) {
    console.error('Error in fetchLatestGDP:', error.message);
    throw error;
  }
}

/**
 * Looks up GDP data for a specific country by ISO3 code or Name.
 */
async function getCountryGDP(identifier) {
  try {
    const allData = await fetchLatestGDP();
    if (!identifier) return null;
    const search = identifier.toLowerCase();
    return allData.find(c => 
      c.iso3Code.toLowerCase() === search || 
      c.country.toLowerCase() === search
    ) || null;
  } catch (err) {
    console.error("Error looking up GDP:", err);
    return null;
  }
}

module.exports = {
  fetchLatestGDP,
  getCountryGDP
};
