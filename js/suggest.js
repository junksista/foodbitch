// Smarte Vorschläge: Lebensmittel-Kombinationen, die mehrmals zusammen in einer Mahlzeit vorkommen,
// aber noch kein Gericht sind → "Als Gericht speichern?"
import { getState } from './store.js';
import { addDays, today, mealLabel } from './util.js';
import { getFood } from './foods.js';

const MIN_DAYS = 3;
const WINDOW = 14;

const sig = (ids) => [...ids].sort().join('|');

export function recipeSuggestions() {
  const { entries, recipes, dismissed } = getState();
  const until = today();
  const since = addDays(until, -WINDOW);

  // Mahlzeiten sammeln: date+meal → { foodId → grams }
  const meals = {};
  for (const e of entries) {
    // nur vergangene Tage + heute: vorausgeplante (kopierte) Mahlzeiten zählen nicht
    if (e.kind !== 'food' || e.date < since || e.date > until) continue;
    const k = `${e.date}#${e.meal}`;
    (meals[k] ||= { date: e.date, meal: e.meal, items: {} }).items[e.refId] =
      (meals[k]?.items[e.refId] || 0) + e.grams;
  }
  const occ = Object.values(meals).filter((m) => Object.keys(m.items).length >= 2);

  const existing = new Set(Object.values(recipes).map((r) => sig(r.items.map((i) => i.foodId))));
  const skip = new Set(dismissed);

  // Kandidaten = vollständige Mahlzeiten + paarweise Schnittmengen (≥ 2 Zutaten)
  const cands = new Map();
  const addCand = (ids) => { if (ids.length >= 2) cands.set(sig(ids), ids); };
  occ.forEach((m, i) => {
    const a = Object.keys(m.items);
    addCand(a);
    for (let j = i + 1; j < occ.length; j++) addCand(a.filter((id) => id in occ[j].items));
  });

  const out = [];
  for (const [s, ids] of cands) {
    if (existing.has(s) || skip.has(s)) continue;
    const hits = occ.filter((m) => ids.every((id) => id in m.items));
    const days = new Set(hits.map((m) => m.date));
    if (days.size < MIN_DAYS) continue;

    // häufigste Mahlzeit + durchschnittliche Menge je Zutat
    const mealCount = {};
    hits.forEach((m) => { mealCount[m.meal] = (mealCount[m.meal] || 0) + 1; });
    const meal = Object.entries(mealCount).sort((a, b) => b[1] - a[1])[0][0];
    const items = ids.map((id) => ({
      foodId: id,
      grams: Math.round(hits.reduce((sum, m) => sum + m.items[id], 0) / hits.length),
    }));
    out.push({ sig: s, items, meal, days: days.size });
  }

  // größte Kombination zuerst; Teilmengen einer bereits gewählten weglassen
  out.sort((a, b) => b.items.length - a.items.length || b.days - a.days);
  const chosen = [];
  for (const c of out) {
    if (chosen.some((x) => c.items.every((i) => x.items.some((y) => y.foodId === i.foodId)))) continue;
    chosen.push(c);
  }
  return chosen.slice(0, 2);
}

export function suggestionName(s) {
  const names = s.items.map((i) => getFood(i.foodId)?.name.split(/[ ,(]/)[0]).filter(Boolean);
  const base = names.slice(0, 2).join(' & ');
  return `${mealLabel(s.meal)}: ${base}${names.length > 2 ? ' & Co.' : ''}`;
}
