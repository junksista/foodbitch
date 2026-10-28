// Gemeinsame UI-Bausteine: Sheets (von unten), Toasts, Ringe, Balken.
import { html, useState, useEffect } from './lib.js';
import { uid, num } from './util.js';

let sheets = [];
let toasts = [];
const subs = new Set();
const emit = () => subs.forEach((f) => f());

function useSub() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);
}

// renderFn(close) → vnode. Gibt eine close-Funktion zurück.
export function openSheet(renderFn, opts = {}) {
  const id = uid();
  const close = () => { sheets = sheets.filter((s) => s.id !== id); emit(); };
  sheets = [...sheets, { id, renderFn, close, full: opts.full, bare: opts.bare }];
  emit();
  return close;
}

export const closeAllSheets = () => { sheets = []; emit(); };

export function toast(text) {
  const id = uid();
  toasts = [...toasts, { id, text }];
  emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, 2600);
}

export function Overlays() {
  useSub();
  return html`
    ${sheets.map((s) => s.bare ? html`<div key=${s.id}>${s.renderFn(s.close)}</div>` : html`
      <div class="backdrop" key=${s.id} onClick=${s.close}>
        <div class=${'sheet' + (s.full ? ' full' : '')} onClick=${(e) => e.stopPropagation()}>
          <div class="grabber"></div>
          ${s.renderFn(s.close)}
        </div>
      </div>`)}
    <div class="toasts">${toasts.map((t) => html`<div class="toast" key=${t.id}>${t.text}</div>`)}</div>
  `;
}

export function SheetHeader({ title, onClose, right }) {
  return html`
    <div class="sheet-head">
      <button class="icon-btn" onClick=${onClose} aria-label="Schließen">✕</button>
      <h2>${title}</h2>
      <div class="sheet-head-right">${right || ''}</div>
    </div>`;
}

export function Ring({ value, goal, label, unit, size = 132, color = 'var(--pink)', warnOver }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = goal ? Math.min(value / goal, 1) : 0;
  const over = warnOver && goal && value > goal * 1.1;
  return html`
    <div class="ring" style=${{ width: size + 'px' }}>
      <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`}>
        <circle cx=${size / 2} cy=${size / 2} r=${r} class="ring-bg" />
        <circle cx=${size / 2} cy=${size / 2} r=${r} class="ring-fg"
          style=${{ stroke: over ? 'var(--warn)' : color, strokeDasharray: c, strokeDashoffset: c * (1 - pct) }}
          transform=${`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div class="ring-text">
        <strong>${num(value, 0)}</strong>
        <span>von ${num(goal, 0)} ${unit}</span>
      </div>
      <div class="ring-label">${label}</div>
    </div>`;
}

export function Bar({ value, goal, label, unit, warn }) {
  const pct = goal ? Math.min(value / goal, 1) : 0;
  return html`
    <div class="bar">
      <div class="bar-top"><span>${label}</span><span>${num(value)}${goal ? ` / ${num(goal)}` : ''} ${unit}</span></div>
      <div class="bar-track"><div class=${'bar-fill' + (warn ? ' warn' : '')} style=${{ width: pct * 100 + '%' }}></div></div>
    </div>`;
}

export function Stepper({ value, onChange, step = 1, min = 0, unit }) {
  const set = (v) => onChange(Math.max(min, Math.round(v * 100) / 100));
  return html`
    <div class="stepper">
      <button onClick=${() => set(value - step)}>−</button>
      <input inputmode="decimal" value=${String(value).replace('.', ',')}
        onInput=${(e) => { const v = Number(e.target.value.replace(',', '.')); if (Number.isFinite(v)) onChange(v); }} />
      ${unit && html`<span class="stepper-unit">${unit}</span>`}
      <button onClick=${() => set(value + step)}>+</button>
    </div>`;
}

export function MacroLine({ acc }) {
  const n = acc.n;
  return html`<span class="macro-line">${num(n.kcal, 0)} kcal · <b>${num(n.protein)} g P</b> · ${num(n.carbs)} g KH · ${num(n.fat)} g F</span>`;
}
