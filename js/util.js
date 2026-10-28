export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);

const pad = (n) => String(n).padStart(2, '0');
export const ds = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ds();
export const parseDs = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parseDs(s);
  d.setDate(d.getDate() + n);
  return ds(d);
};

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export function dayLabel(s, long = false) {
  const t = today();
  if (s === t) return 'Heute';
  if (s === addDays(t, -1)) return 'Gestern';
  if (s === addDays(t, 1)) return 'Morgen';
  const d = parseDs(s);
  return `${(long ? WD_LONG : WD)[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`;
}

// Zahlen hübsch: kleine Werte mit Nachkommastelle, große gerundet.
export function num(v, digits) {
  if (v == null || Number.isNaN(v)) return '–';
  const d = digits ?? (Math.abs(v) < 10 ? 1 : 0);
  return v.toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

export const parseNum = (s) => {
  if (s == null || s === '') return null;
  const v = Number(String(s).replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};

// Für die Suche: klein, ohne Umlaute/Akzente.
export const norm = (s) =>
  (s || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

export const MEALS = [
  { key: 'breakfast', label: 'Frühstück', emoji: '🥞', main: true },
  { key: 'snack1', label: 'Snack', emoji: '🍓', main: false },
  { key: 'lunch', label: 'Mittagessen', emoji: '🥗', main: true },
  { key: 'snack2', label: 'Snack', emoji: '🍪', main: false },
  { key: 'dinner', label: 'Abendessen', emoji: '🍝', main: true },
  { key: 'snack3', label: 'Snack', emoji: '🍫', main: false },
];
export const mealLabel = (k) => MEALS.find((m) => m.key === k)?.label ?? k;

// Welche Mahlzeit passt gerade zur Uhrzeit?
export function mealForNow() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 17) return 'snack2';
  return 'dinner';
}
