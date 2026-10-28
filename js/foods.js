import { getState } from './store.js';
import { BASE_FOODS } from './base-foods.js';
import { norm } from './util.js';

export const getFood = (id) => getState().foods[id] || BASE_FOODS[id] || null;

export const allFoods = () => [...Object.values(BASE_FOODS), ...Object.values(getState().foods)];

// Wie oft wurde ein Lebensmittel/Gericht in den letzten 60 Tagen gegessen (optional nur in einer Mahlzeit)?
export function usage({ meal, days = 60 } = {}) {
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const map = {};
  for (const e of getState().entries) {
    if (e.date < since) continue;
    const k = e.refId;
    const u = (map[k] ||= { count: 0, mealCount: 0, last: '' });
    u.count++;
    if (meal && e.meal === meal) u.mealCount++;
    if (e.date >= u.last) u.last = e.date;
  }
  return map;
}

// Übliche Menge: zuletzt verwendete Grammzahl, sonst Portion, sonst 100 g.
export function defaultGrams(food) {
  const { entries, recipes } = getState();
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.kind === 'food' && e.refId === food.id) return e.grams;
  }
  for (const r of Object.values(recipes)) {
    const it = r.items.find((x) => x.foodId === food.id);
    if (it) return it.grams;
  }
  return food.unit?.g ?? 100;
}

export function searchLocal(q, limit = 30) {
  const nq = norm(q).trim();
  if (!nq) return [];
  const words = nq.split(/\s+/);
  const use = usage();
  const scored = [];
  for (const f of allFoods()) {
    const hay = norm(`${f.name} ${f.brand || ''} ${f.alias || ''}`);
    if (!words.every((w) => hay.includes(w))) continue;
    const name = norm(f.name);
    let score = name.startsWith(words[0]) ? 30 : 0;
    score += (use[f.id]?.count || 0) * 5;
    if (f.source !== 'off') score += 5;
    if (f.vegan === false) score -= 50;
    scored.push({ f, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.f);
}

export function searchRecipes(q) {
  const nq = norm(q).trim();
  return Object.values(getState().recipes).filter((r) => !nq || norm(r.name).includes(nq));
}
