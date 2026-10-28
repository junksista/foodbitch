// Open Food Facts: Produktsuche und Barcode. Mikronährstoffe stehen dort in Gramm pro 100 g.
const FIELDS = 'code,product_name,product_name_de,brands,nutriments,labels_tags,ingredients_analysis_tags,serving_quantity';

const MAP = {
  protein: ['proteins', 1],
  carbs: ['carbohydrates', 1],
  fat: ['fat', 1],
  fiber: ['fiber', 1],
  sugar: ['sugars', 1],
  salt: ['salt', 1],
  b12: ['vitamin-b12', 1e6],
  vitd: ['vitamin-d', 1e6],
  iron: ['iron', 1e3],
  zinc: ['zinc', 1e3],
  calcium: ['calcium', 1e3],
  iodine: ['iodine', 1e6],
  selenium: ['selenium', 1e6],
  ala: ['alpha-linolenic-acid', 1],
  b2: ['vitamin-b2', 1e3],
  magnesium: ['magnesium', 1e3],
  folate: ['folates', 1e6],
  vitc: ['vitamin-c', 1e3],
  potassium: ['potassium', 1e3],
};

function veganOf(p) {
  const tags = [...(p.labels_tags || []), ...(p.ingredients_analysis_tags || [])];
  if (tags.includes('en:vegan')) return true;
  if (tags.includes('en:non-vegan')) return false;
  return null;
}

export function mapProduct(p) {
  const n = p.nutriments || {};
  const val = (k) => {
    const v = n[`${k}_100g`];
    return v === undefined || v === '' || v === null ? null : Number(v);
  };
  let kcal = val('energy-kcal');
  if (kcal == null && val('energy') != null) kcal = val('energy') / 4.184;
  if (kcal == null) return null;
  const per100 = { kcal };
  for (const [key, [offKey, mult]] of Object.entries(MAP)) {
    const v = val(offKey);
    per100[key] = v == null ? null : v * mult;
  }
  const serving = Number(p.serving_quantity);
  return {
    id: 'off:' + p.code,
    name: p.product_name_de || p.product_name || 'Unbenanntes Produkt',
    brand: (p.brands || '').split(',')[0].trim(),
    barcode: p.code,
    source: 'off',
    vegan: veganOf(p),
    per100,
    unit: serving > 0 ? { label: 'Portion', g: serving } : null,
  };
}

// Die Such-API erlaubt nur ca. 10 Anfragen pro Minute → Ergebnisse merken.
const cache = new Map();

export async function searchOFF(q, signal) {
  const key = q.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const url = `https://de.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=30&fields=${FIELDS}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Open Food Facts antwortet nicht');
  const data = await res.json();
  const list = (data.products || []).map(mapProduct).filter((f) => f && f.name);
  // vegan zuerst, nicht-vegan zuletzt
  const rank = (f) => (f.vegan === true ? 0 : f.vegan === null ? 1 : 2);
  list.sort((a, b) => rank(a) - rank(b));
  cache.set(key, list);
  return list;
}

export async function lookupBarcode(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.status === 1 && data.product ? mapProduct({ ...data.product, code }) : null;
}
