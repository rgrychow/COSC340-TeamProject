// macro.cjs (CommonJS)
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// quick sanity print
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Did not find .env at:', envPath);
  process.exit(1);
}

const USDA_KEY = process.env.USDA_API_KEY;
if (!USDA_KEY) {
  console.error('USDA_API_KEY not found in .env at:', envPath);
  console.error('Example line (no quotes, no spaces):');
  console.error('USDA_API_KEY=YOUR_REAL_FDC_KEY');
  process.exit(1);
}


// USDA nutrient numbers we care about
const NUM = { kcal: '208', protein: '203', carbs: '205', fat: '204' };

function pickUSDA(nutrients) {
  const out = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  for (const n of nutrients || []) {
    const number = n?.nutrient?.number || n?.number;
    const amount = n?.amount ?? n?.value ?? 0;
    if (number === NUM.kcal) out.kcal = amount;
    if (number === NUM.protein) out.protein_g = amount;
    if (number === NUM.carbs) out.carbs_g = amount;
    if (number === NUM.fat) out.fat_g = amount;
  }
  return out;
}

function r1(x) { return Math.round(x * 10) / 10; }

async function run() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.log('Usage: node macro.js "chicken breast"');
    process.exit(0);
  }

  // 1) Search for the top match
  const s = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  s.searchParams.set('query', query);
  s.searchParams.set('pageSize', '1');
  s.searchParams.set('api_key', USDA_KEY);

  const rs = await fetch(s);
  if (!rs.ok) throw new Error(`USDA search ${rs.status}`);
  const js = await rs.json();
  if (!js.foods?.length) throw new Error('No USDA results');

  const first = js.foods[0];

  // 2) Get detail → nutrients + serving options
  const rd = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${first.fdcId}?api_key=${USDA_KEY}`);
  if (!rd.ok) throw new Error(`USDA detail ${rd.status}`);
  const detail = await rd.json();

  // Base macros per 100 g
  const per100 = pickUSDA(detail.foodNutrients);

  // Prefer a real serving if USDA provides gramWeight; otherwise use 100 g
  let label = 'per 100 g';
  let macros = per100;
  if (detail.foodPortions?.length) {
    const p = detail.foodPortions.find(x => x.gramWeight) || detail.foodPortions[0];
    if (p?.gramWeight) {
      const g = p.gramWeight;
      label = `per serving (${p.portionDescription || p.modifier || 'serving'} = ${g} g)`;
      macros = {
        kcal: (per100.kcal * g) / 100,
        protein_g: (per100.protein_g * g) / 100,
        carbs_g: (per100.carbs_g * g) / 100,
        fat_g: (per100.fat_g * g) / 100,
      };
    }
  }

  const title = `${detail.description}${detail.brandOwner ? ' — ' + detail.brandOwner : ''}`;
  console.log(`\n${title}\n  ${label}`);
  console.log(`  kcal: ${r1(macros.kcal)} | P: ${r1(macros.protein_g)}g | C: ${r1(macros.carbs_g)}g | F: ${r1(macros.fat_g)}g\n`);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(2);
});

