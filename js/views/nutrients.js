// Alle Nährstoffe eines Tages oder als 7-Tage-Schnitt, mit Richtwerten und Tipps.
import { html, useState } from '../lib.js';
import { dayAcc, avgAcc, goals, nutrientStatus } from '../calc.js';
import { NUTRIENTS, MICROS } from '../nutrients.js';
import { dayLabel, num } from '../util.js';
import { SheetHeader, openSheet } from '../ui.js';

export function openNutrients(date) {
  openSheet((close) => html`<${NutrientsView} date=${date} close=${close} />`, { full: true });
}

function NutrientsView({ date, close }) {
  const [mode, setMode] = useState('day');
  const acc = mode === 'day' ? dayAcc(date) : avgAcc(date, 7);
  const g = goals();
  const [open, setOpen] = useState(null);

  const macroRow = (k, goal) => {
    const v = acc.n[k];
    const pct = goal ? v / goal : null;
    return html`
      <div class="nrow">
        <div class="nrow-top"><span>${NUTRIENTS[k].label}</span>
          <span>${num(v)} ${goal ? `/ ${num(goal)}` : ''} ${NUTRIENTS[k].unit}</span></div>
        ${goal && html`<div class="bar-track"><div class="bar-fill" style=${{ width: Math.min(pct, 1) * 100 + '%' }}></div></div>`}
      </div>`;
  };

  const microRow = (k) => {
    const def = NUTRIENTS[k];
    const st = nutrientStatus(acc, k);
    const max = def.max;
    let cls = 'ok';
    if (max) cls = st.v > max ? 'low' : 'ok';
    else if (st.pct != null) cls = st.pct < 0.5 ? 'low' : st.pct < 0.9 ? 'mid' : 'ok';
    const width = max ? Math.min(st.v / max, 1) : Math.min(st.pct ?? 0, 1);
    return html`
      <div class="nrow" onClick=${() => setOpen(open === k ? null : k)}>
        <div class="nrow-top">
          <span>${def.vegan ? '🌱 ' : ''}${def.label}${st.incomplete ? html` <small class="muted">(unvollständig)</small>` : ''}</span>
          <span>${num(st.v)} ${max ? `/ max. ${num(max)}` : `/ ${num(st.ref)}`} ${def.unit}
            ${st.pct != null && !max ? html` · <b>${num(st.pct * 100, 0)} %</b>` : ''}</span>
        </div>
        <div class="bar-track"><div class=${'bar-fill ' + cls} style=${{ width: width * 100 + '%' }}></div></div>
        ${open === k && def.tip && html`<p class="tip">${def.tip}</p>`}
      </div>`;
  };

  return html`
    <${SheetHeader} title=${mode === 'day' ? `Nährstoffe · ${dayLabel(date)}` : 'Nährstoffe · 7 Tage'} onClose=${close} />
    <div class="sheet-body">
      <div class="seg">
        <button class=${mode === 'day' ? 'on' : ''} onClick=${() => setMode('day')}>Tag</button>
        <button class=${mode === 'week' ? 'on' : ''} onClick=${() => setMode('week')}>Ø 7 Tage</button>
      </div>
      ${mode === 'week' && html`<p class="muted small center">Durchschnitt aus ${acc.days} Tagen mit Einträgen. Für Mikros aussagekräftiger als ein einzelner Tag.</p>`}

      <h3 class="section-title">Makros</h3>
      <div class="card">
        ${macroRow('kcal', g.kcal)}${macroRow('protein', g.protein)}${macroRow('carbs', g.carbs)}${macroRow('fat', g.fat)}
      </div>

      <h3 class="section-title">Mikros & mehr</h3>
      <p class="muted small">🌱 = bei veganer Ernährung besonders wichtig. Tippen für Tipps.</p>
      <div class="card">${MICROS.map(microRow)}</div>
      <p class="muted small">Richtwerte nach DGE für Erwachsene, gerundet. Die Lebensmittelwerte sind Durchschnittswerte, Fertigprodukte haben oft keine Mikro-Angaben. Das ist eine Orientierung, keine medizinische Beratung.</p>
    </div>`;
}
