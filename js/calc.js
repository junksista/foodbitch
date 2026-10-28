// Nährwertberechnung. Ein "Acc" sammelt Summen, Gramm gesamt und Gramm ohne Angabe je Nährstoff.
import { FIELDS, refFor } from './nutrients.js';
import { getFood } from './foods.js';
import { getState } from './store.js';
import { addDays } from './util.js';

export const emptyAcc = () => ({ n: Object.fromEntries(FIELDS.map((k) => [k, 0])), g: 0, unknownG: {} });

export function addFood(acc, food, grams) {
  if (!food || !grams) return acc;
  acc.g += grams;
  for (const k of FIELDS) {
    const v = food.per100[k];
    if (v == null) acc.unknownG[k] = (acc.unknownG[k] || 0) + grams;
    else acc.n[k] += (v * grams) / 100;
  }
  return acc;
}

function addScaled(acc, src, f) {
  acc.g += src.g * f;
  for (const k of FIELDS) acc.n[k] += src.n[k] * f;
  for (const [k, v] of Object.entries(src.unknownG)) acc.unknownG[k] = (acc.unknownG[k] || 0) + v * f;
  return acc;
}

export function recipeTotal(recipe) {
  const acc = emptyAcc();
  for (const it of recipe.items) addFood(acc, getFood(it.foodId), it.grams);
  return acc;
}

export function recipePortion(recipe) {
  const t = recipeTotal(recipe);
  return addScaled(emptyAcc(), t, 1 / (recipe.portions || 1));
}

export function entryAcc(e) {
  const acc = emptyAcc();
  if (e.kind === 'food') return addFood(acc, getFood(e.refId), e.grams);
  const r = getState().recipes[e.refId];
  if (!r) return acc;
  return addScaled(acc, recipeTotal(r), (e.portions || 0) / (r.portions || 1));
}

export function sumEntries(list) {
  const acc = emptyAcc();
  for (const e of list) addScaled(acc, entryAcc(e), 1);
  return acc;
}

export const entriesOf = (date, meal) =>
  getState().entries.filter((e) => e.date === date && (!meal || e.meal === meal));

// Tag inkl. aktiver Supplements (zählen nur an Tagen mit Einträgen).
export function dayAcc(date, { supplements = true } = {}) {
  const list = entriesOf(date);
  const acc = sumEntries(list);
  if (supplements && list.length) {
    for (const s of getState().supplements) {
      if (!s.active) continue;
      for (const [k, v] of Object.entries(s.n)) acc.n[k] += Number(v) || 0;
    }
  }
  return acc;
}

// Durchschnitt über die letzten n Tage mit Einträgen (bis einschließlich date).
export function avgAcc(date, days = 7) {
  const out = emptyAcc();
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(date, -i);
    if (!entriesOf(d).length) continue;
    addScaled(out, dayAcc(d), 1);
    count++;
  }
  return count ? { ...addScaled(emptyAcc(), out, 1 / count), days: count } : { ...out, days: 0 };
}

export function latestWeight() {
  const w = [...getState().weights].sort((a, b) => a.date.localeCompare(b.date));
  return w.length ? w[w.length - 1].kg : null;
}

export function goals() {
  const p = getState().profile;
  const g = p.goals;
  const kg = latestWeight();
  const protein = g.proteinMode === 'gkg' && kg ? Math.round(kg * g.proteinPerKg) : g.proteinG;
  return { kcal: g.kcal, protein, carbs: g.carbsG, fat: g.fatG, tolerance: g.kcalTolerance };
}

// Anteil eines Nährstoffs ohne Angabe (0..1), gemessen an Gramm.
export const unknownShare = (acc, k) => (acc.g ? (acc.unknownG[k] || 0) / acc.g : 0);

export function nutrientStatus(acc, k) {
  const p = getState().profile;
  const ref = refFor(k, p);
  const v = acc.n[k];
  return { ref, v, pct: ref ? v / ref : null, incomplete: unknownShare(acc, k) > 0.3 };
}

// Tagesziel erreicht? Abendessen eingetragen, Protein erreicht, kcal im Toleranzbereich.
export function dayDone(date) {
  if (!entriesOf(date, 'dinner').length) return false;
  const g = goals();
  const acc = dayAcc(date);
  const tol = (g.tolerance || 10) / 100;
  return acc.n.protein >= g.protein && acc.n.kcal >= g.kcal * (1 - tol) && acc.n.kcal <= g.kcal * (1 + tol);
}
