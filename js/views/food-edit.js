// Eigenes Lebensmittel anlegen/bearbeiten (Werte pro 100 g).
import { html, useState } from '../lib.js';
import { mutate } from '../store.js';
import { FIELDS, NUTRIENTS, MACROS } from '../nutrients.js';
import { uid, parseNum } from '../util.js';
import { openSheet, SheetHeader, toast } from '../ui.js';

export function openFoodEditor({ food, name, barcode, onSaved }) {
  openSheet((close) => html`<${FoodEditor} food=${food} name=${name} barcode=${barcode} close=${close} onSaved=${onSaved} />`, { full: true });
}

const MAIN = [...MACROS, 'fiber', 'sugar', 'salt'];
const toStr = (v) => (v == null ? '' : String(Math.round(v * 1000) / 1000).replace('.', ','));

function FoodEditor({ food, name, barcode, close, onSaved }) {
  const [f, setF] = useState(() => ({
    name: food?.name ?? name ?? '',
    brand: food?.brand ?? '',
    barcode: food?.barcode ?? barcode ?? '',
    vegan: food?.vegan ?? true,
    unitLabel: food?.unit?.label ?? '',
    unitG: toStr(food?.unit?.g),
    vals: Object.fromEntries(FIELDS.map((k) => [k, toStr(food?.per100[k])])),
  }));
  const [showMicros, setShowMicros] = useState(false);
  const set = (patch) => setF({ ...f, ...patch });
  const setVal = (k, v) => setF({ ...f, vals: { ...f.vals, [k]: v } });

  const save = () => {
    const per100 = Object.fromEntries(FIELDS.map((k) => [k, parseNum(f.vals[k])]));
    for (const k of MACROS) per100[k] ??= 0;
    const unitG = parseNum(f.unitG);
    const out = {
      id: food?.id && food.source === 'custom' ? food.id : 'c:' + uid(),
      name: f.name.trim(),
      brand: f.brand.trim(),
      barcode: f.barcode.trim() || null,
      source: 'custom',
      vegan: f.vegan,
      per100,
      unit: unitG ? { label: f.unitLabel.trim() || 'Portion', g: unitG } : null,
    };
    mutate((s) => { s.foods[out.id] = out; });
    toast('Gespeichert 💾');
    close();
    onSaved?.(out);
  };

  const field = (k) => html`
    <label class="field">
      <span>${NUTRIENTS[k].label} <small>${NUTRIENTS[k].unit}</small></span>
      <input inputmode="decimal" value=${f.vals[k]} placeholder=${MACROS.includes(k) ? '0' : 'unbekannt'}
        onInput=${(e) => setVal(k, e.target.value)} />
    </label>`;

  return html`
    <${SheetHeader} title=${food ? 'Lebensmittel bearbeiten' : 'Neues Lebensmittel'} onClose=${close} />
    <div class="sheet-body">
      <label class="field col"><span>Name</span>
        <input value=${f.name} onInput=${(e) => set({ name: e.target.value })} placeholder="z. B. Protein-Müsli" /></label>
      <label class="field col"><span>Marke (optional)</span>
        <input value=${f.brand} onInput=${(e) => set({ brand: e.target.value })} /></label>
      <label class="field col"><span>Barcode (optional)</span>
        <input inputmode="numeric" value=${f.barcode} onInput=${(e) => set({ barcode: e.target.value })} /></label>

      <h3 class="section-title">Nährwerte pro 100 g</h3>
      <div class="card fields">${MAIN.map(field)}</div>
      <button class="btn ghost wide" onClick=${() => setShowMicros(!showMicros)}>
        ${showMicros ? 'Mikronährstoffe ausblenden' : 'Mikronährstoffe eintragen (optional)'}
      </button>
      ${showMicros && html`<div class="card fields">${FIELDS.filter((k) => !MAIN.includes(k)).map(field)}</div>`}

      <h3 class="section-title">Portion (optional)</h3>
      <div class="card fields">
        <label class="field"><span>Bezeichnung</span><input value=${f.unitLabel} placeholder="Riegel" onInput=${(e) => set({ unitLabel: e.target.value })} /></label>
        <label class="field"><span>Gramm</span><input inputmode="decimal" value=${f.unitG} onInput=${(e) => set({ unitG: e.target.value })} /></label>
      </div>
      <label class="toggle"><input type="checkbox" checked=${f.vegan} onChange=${(e) => set({ vegan: e.target.checked })} /> Vegan</label>
      <button class="btn primary wide" disabled=${!f.name.trim()} onClick=${save}>Speichern</button>
    </div>`;
}
