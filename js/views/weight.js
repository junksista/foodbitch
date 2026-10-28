// Gewichtsverlauf.
import { html, useState } from '../lib.js';
import { getState, mutate } from '../store.js';
import { today, num, parseNum, dayLabel, parseDs } from '../util.js';
import { toast } from '../ui.js';

function Chart({ points }) {
  if (points.length < 2) return html`<p class="muted center">Ab zwei Einträgen siehst du hier deine Kurve.</p>`;
  const W = 320, H = 160, P = 24;
  const xs = points.map((p) => parseDs(p.date).getTime());
  const ys = points.map((p) => p.kg);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys) - 0.5, Math.max(...ys) + 0.5];
  const X = (x) => P + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * P);
  const Y = (y) => H - P - ((y - y0) / (y1 - y0 || 1)) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.kg).toFixed(1)}`).join(' ');
  const area = `${d} L${X(xs[xs.length - 1])},${H - P} L${X(xs[0])},${H - P} Z`;
  return html`
    <svg class="chart" viewBox=${`0 0 ${W} ${H}`}>
      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--pink)" stop-opacity=".35" /><stop offset="1" stop-color="var(--pink)" stop-opacity="0" />
      </linearGradient></defs>
      <path d=${area} fill="url(#wg)" />
      <path d=${d} fill="none" stroke="var(--pink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${points.map((p, i) => html`<circle cx=${X(xs[i])} cy=${Y(p.kg)} r="4" fill="#fff" stroke="var(--pink)" stroke-width="2" />`)}
      <text x=${P} y="14" class="chart-label">${num(y1 - 0.5)} kg</text>
      <text x=${P} y=${H - 6} class="chart-label">${num(y0 + 0.5)} kg</text>
    </svg>`;
}

export function WeightView() {
  const weights = [...getState().weights].sort((a, b) => a.date.localeCompare(b.date));
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(today());

  const add = () => {
    const v = parseNum(kg);
    if (!v) return;
    mutate((s) => {
      s.weights = s.weights.filter((w) => w.date !== date);
      s.weights.push({ date, kg: v });
    });
    setKg('');
    toast('Gewicht gespeichert');
  };
  const first = weights[0];
  const last = weights[weights.length - 1];

  return html`
    <header class="page-head"><h1>Gewicht</h1></header>
    <section class="card">
      ${last && html`<div class="weight-now"><strong>${num(last.kg)} kg</strong>
        ${first && first !== last && html`<span class="muted">${last.kg - first.kg > 0 ? '+' : ''}${num(last.kg - first.kg)} kg seit ${dayLabel(first.date)}</span>`}</div>`}
      <${Chart} points=${weights.slice(-60)} />
    </section>
    <section class="card fields">
      <label class="field"><span>Datum</span><input type="date" value=${date} max=${today()} onInput=${(e) => setDate(e.target.value)} /></label>
      <label class="field"><span>Gewicht</span><input inputmode="decimal" placeholder="kg" value=${kg} onInput=${(e) => setKg(e.target.value)} /></label>
      <button class="btn primary wide" disabled=${!parseNum(kg)} onClick=${add}>Eintragen</button>
    </section>
    <div class="list">
      ${[...weights].reverse().slice(0, 30).map((w) => html`
        <div class="row static" key=${w.date}>
          <div class="row-main"><div class="row-title">${num(w.kg)} kg</div><div class="row-sub">${dayLabel(w.date, true)}</div></div>
          <button class="icon-btn" onClick=${() => mutate((s) => { s.weights = s.weights.filter((x) => x.date !== w.date); })} aria-label="Löschen">✕</button>
        </div>`)}
    </div>`;
}
