// Gerichte: Liste und Editor.
import { html, useState } from '../lib.js';
import { getState, mutate } from '../store.js';
import { getFood } from '../foods.js';
import { recipePortion, recipeTotal } from '../calc.js';
import { uid, num, today, mealForNow, norm } from '../util.js';
import { openSheet, SheetHeader, toast, Stepper, MacroLine } from '../ui.js';
import { openAdd, RecipeLogView } from './add.js';

export function openRecipeEditor({ recipe, items, name } = {}) {
  openSheet((close) => html`<${RecipeEditor} recipe=${recipe} items=${items} name=${name} close=${close} />`, { full: true });
}

export function openRecipeLog(recipe, date = today(), meal = mealForNow()) {
  openSheet((close) => html`<${RecipeLogView} recipe=${recipe} date=${date} meal=${meal} onBack=${close} close=${close} />`, { full: true });
}

export function RecipesView() {
  const [q, setQ] = useState('');
  const list = Object.values(getState().recipes)
    .filter((r) => norm(r.name).includes(norm(q)))
    .sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name));

  return html`
    <header class="page-head"><h1>Gerichte</h1>
      <button class="btn primary small" onClick=${() => openRecipeEditor()}>+ Neu</button></header>
    ${list.length > 4 && html`<div class="search-bar"><input type="search" placeholder="Gericht suchen" value=${q} onInput=${(e) => setQ(e.target.value)} /></div>`}
    ${list.length === 0 && html`
      <div class="empty">
        <div class="empty-emoji">🍲</div>
        <p>Noch keine Gerichte. Leg dein Lieblingsessen einmal an und trag es danach mit einem Tipp ein.</p>
        <p class="muted">Tipp: Du kannst auch eine eingetragene Mahlzeit direkt als Gericht speichern.</p>
      </div>`}
    <div class="list cards">
      ${list.map((r) => {
        const p = recipePortion(r);
        return html`
          <div class="card recipe-card" key=${r.id}>
            <button class="recipe-main" onClick=${() => openRecipeEditor({ recipe: r })}>
              <div class="row-title">${r.favorite ? '💖 ' : ''}${r.name}</div>
              <div class="row-sub">${r.items.length} Zutaten · ${r.portions} ${r.portions === 1 ? 'Portion' : 'Portionen'}</div>
              <div class="row-sub">pro Portion: <${MacroLine} acc=${p} /></div>
            </button>
            <button class="btn primary small" onClick=${() => openRecipeLog(r)}>Eintragen</button>
          </div>`;
      })}
    </div>`;
}

function RecipeEditor({ recipe, items: initItems, name: initName, close }) {
  const [r, setR] = useState(() => recipe
    ? JSON.parse(JSON.stringify(recipe))
    : { id: 'r:' + uid(), name: initName || '', items: initItems || [], portions: 1, cookedG: null, favorite: false });
  const set = (patch) => setR({ ...r, ...patch });
  const setItem = (i, patch) => set({ items: r.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });

  const addIngredient = () => openAdd({
    onPick: (food, grams) => setR((cur) => ({ ...cur, items: [...cur.items, { foodId: food.id, grams }] })),
  });

  const save = () => {
    mutate((s) => { s.recipes[r.id] = { ...r, name: r.name.trim() }; });
    toast('Gericht gespeichert 💖');
    close();
  };
  const remove = () => {
    if (!confirm(`„${r.name}“ löschen? Bereits eingetragene Mahlzeiten verschwinden dann auch.`)) return;
    mutate((s) => {
      delete s.recipes[r.id];
      s.entries = s.entries.filter((e) => !(e.kind === 'recipe' && e.refId === r.id));
    });
    close();
  };

  const total = recipeTotal(r);
  const per = recipePortion(r);

  return html`
    <${SheetHeader} title=${recipe ? 'Gericht bearbeiten' : 'Neues Gericht'} onClose=${close}
      right=${html`<button class=${'icon-btn' + (r.favorite ? ' fav' : '')} onClick=${() => set({ favorite: !r.favorite })} aria-label="Favorit">${r.favorite ? '💖' : '🤍'}</button>`} />
    <div class="sheet-body">
      <label class="field col"><span>Name</span>
        <input value=${r.name} placeholder="z. B. Overnight Oats" onInput=${(e) => set({ name: e.target.value })} /></label>

      <h3 class="section-title">Zutaten</h3>
      <div class="list">
        ${r.items.map((it, i) => {
          const f = getFood(it.foodId);
          return html`
            <div class="row static" key=${i}>
              <div class="row-main"><div class="row-title">${f?.name || 'Unbekannt'}</div></div>
              <input class="grams-input" inputmode="decimal" value=${it.grams}
                onInput=${(e) => setItem(i, { grams: Number(e.target.value.replace(',', '.')) || 0 })} />
              <span class="muted">g</span>
              <button class="icon-btn" onClick=${() => set({ items: r.items.filter((_, j) => j !== i) })} aria-label="Entfernen">✕</button>
            </div>`;
        })}
      </div>
      <button class="btn ghost wide" onClick=${addIngredient}>+ Zutat hinzufügen</button>

      <h3 class="section-title">Wie viele Portionen ergibt das?</h3>
      <${Stepper} value=${r.portions} onChange=${(v) => set({ portions: Math.max(1, v) })} step=${1} min=${1} unit=${r.portions === 1 ? 'Portion' : 'Portionen'} />
      <label class="field">
        <span>Topf gewogen (fertig gekocht, optional)</span>
        <input inputmode="decimal" placeholder="g" value=${r.cookedG ?? ''}
          onInput=${(e) => set({ cookedG: Number(e.target.value.replace(',', '.')) || null })} />
      </label>
      <p class="muted small">Wenn du den fertigen Topf wiegst, kannst du später auch einfach Gramm eintragen.</p>

      <div class="card">
        <div class="row-sub">Gesamt (${num(total.g, 0)} g roh): <${MacroLine} acc=${total} /></div>
        <div class="row-title">Pro Portion: <${MacroLine} acc=${per} /></div>
      </div>

      <button class="btn primary wide" disabled=${!r.name.trim() || !r.items.length} onClick=${save}>Speichern</button>
      ${recipe && html`<button class="btn danger wide" onClick=${remove}>Gericht löschen</button>`}
    </div>`;
}
