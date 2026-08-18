/**
 * World Bank API Service
 * Fetches, cleans, and formats the latest GDP data for all countries.
 */

let gdpCache = null;
let lastFetchTime = 0;
let popCache = null;
let lastPopFetchTime = 0;
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
 * Fetches the latest Population for all countries.
 */
async function fetchLatestPopulation() {
  if (popCache && (Date.now() - lastPopFetchTime < CACHE_TTL)) {
    return popCache;
  }
  const url = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=300';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`World Bank API error! status: ${response.status}`);
    const data = await response.json();
    const records = data[1];
    if (!Array.isArray(records)) throw new Error('Unexpected API response format');
    
    const cleanedData = records
      .filter(record => record.value !== null && record.countryiso3code && record.countryiso3code.trim() !== '')
      .map(record => ({
        country: record.country.value,
        iso3Code: record.countryiso3code,
        year: record.date,
        population: record.value
      }))
      .sort((a, b) => b.population - a.population);
      
    popCache = cleanedData;
    lastPopFetchTime = Date.now();
    return cleanedData;
  } catch (error) {
    console.error('Error in fetchLatestPopulation:', error.message);
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

/**
 * Fetches detailed profile containing historical charts and current statistics.
 */
async function getCountryProfile(iso) {
  if (!iso) return null;
  
  try {
    const code = iso.toLowerCase();
    
    // Fetch background rankings data
    const [allGdp, allPop] = await Promise.all([
      fetchLatestGDP(),
      fetchLatestPopulation()
    ]);
    
    const gdpRank = allGdp.findIndex(c => c.iso3Code.toLowerCase() === code) + 1;
    const popRank = allPop.findIndex(c => c.iso3Code.toLowerCase() === code) + 1;
    const gdpDataLatest = allGdp.find(c => c.iso3Code.toLowerCase() === code);
    const popDataLatest = allPop.find(c => c.iso3Code.toLowerCase() === code);
    
    if (!gdpDataLatest && !popDataLatest) return null;
    
    // Fetch historical data
    const fetchHistorical = async (indicator) => {
      const res = await fetch(`https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&per_page=20`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data[1]) ? data[1] : [];
    };
    
    const [histGdp, histGdpPc, histPop, histGdpGrowth, histPopGrowth] = await Promise.all([
      fetchHistorical('NY.GDP.MKTP.CD'),
      fetchHistorical('NY.GDP.PCAP.CD'),
      fetchHistorical('SP.POP.TOTL'),
      fetchHistorical('NY.GDP.MKTP.KD.ZG'),
      fetchHistorical('SP.POP.GROW')
    ]);
    
    // Format history
    const years = new Set([...histGdp.map(d=>d.date), ...histPop.map(d=>d.date)]);
    const history = Array.from(years).sort().map(year => {
      const gdpObj = histGdp.find(d => d.date === year);
      const popObj = histPop.find(d => d.date === year);
      return {
        year,
        gdp: gdpObj ? gdpObj.value : null,
        population: popObj ? popObj.value : null
      };
    }).filter(d => d.gdp !== null || d.population !== null);

    const latestGdpPc = histGdpPc.find(d => d.value !== null)?.value || null;
    const latestGdpGrowth = histGdpGrowth.find(d => d.value !== null)?.value || null;
    const latestPopGrowth = histPopGrowth.find(d => d.value !== null)?.value || null;
    
    const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return {
      country: gdpDataLatest?.country || popDataLatest?.country,
      iso3Code: gdpDataLatest?.iso3Code || popDataLatest?.iso3Code,
      current: {
        gdp: gdpDataLatest ? gdpDataLatest.rawGdp : null,
        formattedGdp: gdpDataLatest ? gdpDataLatest.formattedGdp : null,
        gdpYear: gdpDataLatest ? gdpDataLatest.year : null,
        population: popDataLatest ? popDataLatest.population : null,
        popYear: popDataLatest ? popDataLatest.year : null,
        gdpPerCapita: latestGdpPc,
        formattedGdpPerCapita: latestGdpPc ? usdFormatter.format(latestGdpPc) : null,
        gdpGrowth: latestGdpGrowth,
        popGrowth: latestPopGrowth
      },
      history,
      rankings: {
        gdpGlobal: gdpRank > 0 ? gdpRank : null,
        popGlobal: popRank > 0 ? popRank : null
      }
    };
  } catch (err) {
    console.error("Error in getCountryProfile:", err);
    return null;
  }
}

module.exports = {
  fetchLatestGDP,
  getCountryGDP,
  getCountryProfile
};
