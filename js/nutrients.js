// Nährstoffe, Einheiten und Richtwerte (DGE, Erwachsene 25–51 J., gerundet).
// ref: Zielwert pro Tag (f/m), max: Obergrenze. vegan: bei veganer Ernährung kritisch.

export const FIELDS = [
  'kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'salt',
  'b12', 'vitd', 'iron', 'zinc', 'calcium', 'iodine', 'selenium', 'ala',
  'b2', 'magnesium', 'folate', 'vitc', 'potassium',
];

export const MACROS = ['kcal', 'protein', 'carbs', 'fat'];

export const NUTRIENTS = {
  kcal: { label: 'Kalorien', unit: 'kcal' },
  protein: { label: 'Eiweiß', unit: 'g' },
  carbs: { label: 'Kohlenhydrate', unit: 'g' },
  fat: { label: 'Fett', unit: 'g' },
  fiber: { label: 'Ballaststoffe', unit: 'g', ref: { f: 30, m: 30 } },
  sugar: { label: 'Zucker', unit: 'g', max: 50 },
  salt: { label: 'Salz', unit: 'g', max: 6 },

  b12: { label: 'Vitamin B12', unit: 'µg', ref: { f: 4, m: 4 }, vegan: true,
    tip: 'Kommt in pflanzlicher Kost praktisch nicht vor. Angereicherte Drinks helfen, meist braucht es ein Supplement.' },
  vitd: { label: 'Vitamin D', unit: 'µg', ref: { f: 20, m: 20 }, vegan: true,
    tip: 'Über Essen kaum zu schaffen, im Sommer hilft die Sonne. Im Winter wird oft supplementiert.' },
  iron: { label: 'Eisen', unit: 'mg', ref: { f: 16, m: 11 }, vegan: true,
    tip: 'Linsen, Kichererbsen, Haferflocken, Kürbiskerne. Mit Vitamin C (Paprika, Orange) wird es besser aufgenommen.' },
  zinc: { label: 'Zink', unit: 'mg', ref: { f: 10, m: 16 }, vegan: true,
    tip: 'Haferflocken, Kürbiskerne, Cashews, Linsen. Einweichen und Keimen hilft der Aufnahme.' },
  calcium: { label: 'Kalzium', unit: 'mg', ref: { f: 1000, m: 1000 }, vegan: true,
    tip: 'Angereicherte Pflanzendrinks und -joghurts, Tofu, Grünkohl, calciumreiches Mineralwasser.' },
  iodine: { label: 'Jod', unit: 'µg', ref: { f: 200, m: 200 }, vegan: true,
    tip: 'Mit Jodsalz kochen. Algen (z. B. Nori) enthalten viel, aber sehr schwankend.' },
  selenium: { label: 'Selen', unit: 'µg', ref: { f: 60, m: 70 }, vegan: true,
    tip: 'Eine einzige Paranuss deckt oft den ganzen Tagesbedarf.' },
  ala: { label: 'Omega-3 (ALA)', unit: 'g', refFromKcal: 0.005, vegan: true,
    tip: 'Leinöl, geschrotete Leinsamen, Chia, Walnüsse, Rapsöl.' },
  b2: { label: 'Vitamin B2', unit: 'mg', ref: { f: 1.0, m: 1.3 }, vegan: true,
    tip: 'Mandeln, Pilze, Hefeflocken, Hülsenfrüchte, angereicherte Drinks.' },
  magnesium: { label: 'Magnesium', unit: 'mg', ref: { f: 300, m: 350 } },
  folate: { label: 'Folat', unit: 'µg', ref: { f: 300, m: 300 } },
  vitc: { label: 'Vitamin C', unit: 'mg', ref: { f: 95, m: 110 } },
  potassium: { label: 'Kalium', unit: 'mg', ref: { f: 4000, m: 4000 } },
};

export const MICROS = FIELDS.filter((k) => !MACROS.includes(k));

// Tages-Richtwert für einen Nährstoff, abhängig vom Profil.
export function refFor(key, profile) {
  const n = NUTRIENTS[key];
  if (n.refFromKcal) return (profile.goals.kcal * n.refFromKcal) / 9;
  return n.ref ? n.ref[profile.sex] ?? n.ref.f : null;
}
