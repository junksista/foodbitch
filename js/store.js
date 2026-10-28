// Zustand der App: ein Objekt, in IndexedDB gespeichert.
// Ändern immer über mutate(fn); Komponenten lesen über getState() bzw. useStore() im Root.
import { useState, useEffect } from './lib.js';

const DB_NAME = 'foodbitch';
const OBJ = 'kv';
const KEY = 'state';

const defaults = () => ({
  version: 1,
  profile: {
    name: '',
    partnerName: '',
    sex: 'f',
    onboarded: false,
    sassy: true,
    goals: {
      kcal: 2000,
      proteinMode: 'g', // 'g' | 'gkg'
      proteinG: 100,
      proteinPerKg: 1.6,
      carbsG: null,
      fatG: null,
      kcalTolerance: 10, // ± Prozent für "Ziel erreicht"
    },
  },
  foods: {},
  recipes: {},
  entries: [],
  supplements: [],
  weights: [],
  dismissed: [],
  celebrated: {},
});

let state = defaults();
const subs = new Set();

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(OBJ);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readSaved() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(OBJ).objectStore(OBJ).get(KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function save() {
  const db = await openDb();
  db.transaction(OBJ, 'readwrite').objectStore(OBJ).put(state, KEY);
}

function withDefaults(saved) {
  const d = defaults();
  return {
    ...d,
    ...saved,
    profile: { ...d.profile, ...saved.profile, goals: { ...d.profile.goals, ...saved.profile?.goals } },
  };
}

export async function initStore() {
  try {
    const saved = await readSaved();
    if (saved) state = withDefaults(saved);
  } catch (e) {
    console.error('Laden fehlgeschlagen', e);
  }
  navigator.storage?.persist?.();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save().catch(console.error);
  });
}

export const getState = () => state;

let timer;
export function mutate(fn) {
  fn(state);
  subs.forEach((f) => f());
  clearTimeout(timer);
  timer = setTimeout(() => save().catch(console.error), 150);
}

export function replaceState(next) {
  mutate(() => { state = withDefaults(next); });
}

export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);
  return state;
}
