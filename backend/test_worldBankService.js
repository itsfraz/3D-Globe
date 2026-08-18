const { getCountryGDPByISO } = require('./services/worldBankService');

async function test() {
  const tests = ['IND', 'USA', 'FRA', 'JPN', 'DEU', 'GBR', 'INVALID', null];
  
  for (const iso of tests) {
    console.log(`Testing ISO: ${iso}`);
    const result = await getCountryGDPByISO(iso);
    if (result) {
      console.log(`  -> SUCCESS: ${result.country} - ${result.formattedGdp} (${result.year})`);
    } else {
      console.log(`  -> FAILED: returned null`);
    }
  }
}

test();
