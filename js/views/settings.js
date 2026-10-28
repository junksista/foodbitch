// Profil, Ziele, Supplements, eigene Lebensmittel, Backup.
import { html, useState } from '../lib.js';
import { getState, mutate, replaceState } from '../store.js';
import { goals, latestWeight } from '../calc.js';
import { NUTRIENTS, MICROS } from '../nutrients.js';
import { uid, num, parseNum, today } from '../util.js';
import { openSheet, SheetHeader, toast } from '../ui.js';
import { openFoodEditor } from './food-edit.js';

const setProfile = (patch) => mutate((s) => Object.assign(s.profile, patch));
const setGoal = (patch) => mutate((s) => Object.assign(s.profile.goals, patch));

function NumField({ label, unit, value, onChange, placeholder }) {
  return html`
    <label class="field"><span>${label}</span>
      <span class="field-input">
        <input inputmode="decimal" value=${value ?? ''} placeholder=${placeholder || ''}
          onChange=${(e) => onChange(parseNum(e.target.value))} />
        ${unit && html`<small>${unit}</small>`}
      </span>
    </label>`;
}

export function GoalFields() {
  const p = getState().profile;
  const g = p.goals;
  const kg = latestWeight();
  return html`
    <div class="card fields">
      <${NumField} label="Kalorien pro Tag" unit="kcal" value=${g.kcal} onChange=${(v) => setGoal({ kcal: v || 2000 })} />
      <div class="field"><span>Protein-Ziel</span>
        <div class="seg small">
          <button class=${g.proteinMode === 'g' ? 'on' : ''} onClick=${() => setGoal({ proteinMode: 'g' })}>Gramm</button>
          <button class=${g.proteinMode === 'gkg' ? 'on' : ''} onClick=${() => setGoal({ proteinMode: 'gkg' })}>g pro kg</button>
        </div>
      </div>
      ${g.proteinMode === 'g'
        ? html`<${NumField} label="Protein pro Tag" unit="g" value=${g.proteinG} onChange=${(v) => setGoal({ proteinG: v || 0 })} />`
        : html`<${NumField} label="Protein pro kg" unit="g/kg" value=${g.proteinPerKg} onChange=${(v) => setGoal({ proteinPerKg: v || 0 })} />
          <p class="muted small">${kg ? `Bei ${num(kg)} kg sind das ${goals().protein} g pro Tag.` : 'Trag dein Gewicht ein, dann wird daraus dein Ziel in Gramm.'}</p>`}
      <${NumField} label="Kohlenhydrate (optional)" unit="g" value=${g.carbsG} onChange=${(v) => setGoal({ carbsG: v })} placeholder="–" />
      <${NumField} label="Fett (optional)" unit="g" value=${g.fatG} onChange=${(v) => setGoal({ fatG: v })} placeholder="–" />
      <${NumField} label="Kalorien-Spielraum" unit="± %" value=${g.kcalTolerance} onChange=${(v) => setGoal({ kcalTolerance: v ?? 10 })} />
      <p class="muted small">„Well done, bitch!“ gibt's, wenn das Abendessen eingetragen ist, das Protein-Ziel erreicht ist und die Kalorien im Spielraum liegen.</p>
    </div>`;
}

export function SettingsView() {
  const s = getState();
  const p = s.profile;
  const customFoods = Object.values(s.foods).filter((f) => f.source === 'custom');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `foodbitch-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((t) => {
      const data = JSON.parse(t);
      if (!data.profile || !Array.isArray(data.entries)) throw new Error('kein Backup');
      if (!confirm('Backup einspielen? Die aktuellen Daten auf diesem Gerät werden ersetzt.')) return;
      replaceState(data);
      toast('Backup eingespielt 💾');
    }).catch(() => alert('Die Datei ist kein FoodBitch-Backup.'));
    e.target.value = '';
  };

  return html`
    <header class="page-head"><h1>Ich</h1></header>

    <h3 class="section-title">Profil</h3>
    <div class="card fields">
      <label class="field"><span>Name</span><input value=${p.name} onChange=${(e) => setProfile({ name: e.target.value })} /></label>
      <div class="field"><span>Richtwerte für</span>
        <div class="seg small">
          <button class=${p.sex === 'f' ? 'on' : ''} onClick=${() => setProfile({ sex: 'f' })}>Frauen</button>
          <button class=${p.sex === 'm' ? 'on' : ''} onClick=${() => setProfile({ sex: 'm' })}>Männer</button>
        </div>
      </div>
      <label class="toggle"><input type="checkbox" checked=${p.sassy} onChange=${(e) => setProfile({ sassy: e.target.checked })} /> Freche Sprüche 💅</label>
    </div>

    <h3 class="section-title">Ziele</h3>
    <${GoalFields} />

    <h3 class="section-title">Supplements</h3>
    <p class="muted small">Zählen jeden Tag automatisch mit, an dem du etwas einträgst.</p>
    <div class="list">
      ${s.supplements.map((sup) => html`
        <div class="row static" key=${sup.id}>
          <label class="toggle inline"><input type="checkbox" checked=${sup.active}
            onChange=${(e) => mutate((st) => { st.supplements.find((x) => x.id === sup.id).active = e.target.checked; })} /></label>
          <button class="row-main plain" onClick=${() => openSupplement(sup)}>
            <div class="row-title">${sup.name}</div>
            <div class="row-sub">${Object.entries(sup.n).map(([k, v]) => `${NUTRIENTS[k].label} ${num(v)} ${NUTRIENTS[k].unit}`).join(' · ')}</div>
          </button>
        </div>`)}
    </div>
    <button class="btn ghost wide" onClick=${() => openSupplement()}>+ Supplement hinzufügen</button>

    <h3 class="section-title">Eigene Lebensmittel</h3>
    <div class="list">
      ${customFoods.length === 0 && html`<p class="muted">Noch keine.</p>`}
      ${customFoods.map((f) => html`
        <button class="row" key=${f.id} onClick=${() => openFoodEditor({ food: f })}>
          <div class="row-main"><div class="row-title">${f.name}</div>
            <div class="row-sub">${num(f.per100.kcal, 0)} kcal · ${num(f.per100.protein)} g P /100 g</div></div>
          <span class="row-plus">›</span>
        </button>`)}
    </div>

    <h3 class="section-title">Daten</h3>
    <div class="card">
      <p class="small">Deine Daten liegen im Moment nur auf diesem Gerät. Mach ab und zu ein Backup.</p>
      <button class="btn primary wide" onClick=${exportData}>Backup exportieren</button>
      <label class="btn ghost wide">Backup einspielen<input type="file" accept="application/json,.json" hidden onChange=${importData} /></label>
    </div>
    <p class="muted small center">FoodBitch 0.1 · made with 💖 · Produktdaten: Open Food Facts (ODbL)</p>
  `;
}

function openSupplement(sup) {
  openSheet((close) => html`<${SupplementEditor} sup=${sup} close=${close} />`);
}

function SupplementEditor({ sup, close }) {
  const [name, setName] = useState(sup?.name ?? '');
  const [n, setN] = useState(() => Object.fromEntries(Object.entries(sup?.n ?? { b12: '' }).map(([k, v]) => [k, String(v)])));
  const [add, setAdd] = useState('');
  const save = () => {
    const vals = Object.fromEntries(Object.entries(n).map(([k, v]) => [k, parseNum(v)]).filter(([, v]) => v));
    mutate((s) => {
      const obj = { id: sup?.id ?? uid(), name: name.trim(), active: sup?.active ?? true, n: vals };
      s.supplements = sup ? s.supplements.map((x) => (x.id === sup.id ? obj : x)) : [...s.supplements, obj];
    });
    close();
  };
  const del = () => { mutate((s) => { s.supplements = s.supplements.filter((x) => x.id !== sup.id); }); close(); };
  return html`
    <${SheetHeader} title=${sup ? 'Supplement' : 'Neues Supplement'} onClose=${close} />
    <div class="sheet-body">
      <label class="field col"><span>Name</span><input value=${name} placeholder="z. B. B12-Tropfen" onInput=${(e) => setName(e.target.value)} /></label>
      <h3 class="section-title">Menge pro Tag</h3>
      <div class="card fields">
        ${Object.keys(n).map((k) => html`
          <label class="field"><span>${NUTRIENTS[k].label}</span>
            <span class="field-input"><input inputmode="decimal" value=${n[k]} onInput=${(e) => setN({ ...n, [k]: e.target.value })} /><small>${NUTRIENTS[k].unit}</small></span>
          </label>`)}
        <label class="field"><span>Nährstoff hinzufügen</span>
          <select value=${add} onChange=${(e) => { if (e.target.value) setN({ ...n, [e.target.value]: '' }); setAdd(''); }}>
            <option value="">wählen…</option>
            ${MICROS.filter((k) => !(k in n)).map((k) => html`<option value=${k}>${NUTRIENTS[k].label}</option>`)}
          </select>
        </label>
      </div>
      <button class="btn primary wide" disabled=${!name.trim()} onClick=${save}>Speichern</button>
      ${sup && html`<button class="btn danger wide" onClick=${del}>Löschen</button>`}
    </div>`;
}
