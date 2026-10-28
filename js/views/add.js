// Eintragen: Suche (lokal + Open Food Facts), Menge wählen, Gericht für mehrere Mahlzeiten eintragen.
import { html, useState, useEffect, useRef } from '../lib.js';
import { getState, mutate } from '../store.js';
import { searchLocal, searchRecipes, usage, defaultGrams, getFood } from '../foods.js';
import { searchOFF } from '../off.js';
import { addFood, emptyAcc, recipePortion } from '../calc.js';
import { uid, num, MEALS, mealLabel, addDays, dayLabel } from '../util.js';
import { openSheet, SheetHeader, toast, Stepper, MacroLine } from '../ui.js';
import { openScanner } from './scanner.js';
import { openFoodEditor } from './food-edit.js';

export function cacheFood(food) {
  if (food.source === 'base') return;
  mutate((s) => { if (!s.foods[food.id]) s.foods[food.id] = food; });
}

export function logFood(date, meal, food, grams) {
  cacheFood(food);
  mutate((s) => s.entries.push({ id: uid(), date, meal, kind: 'food', refId: food.id, grams, createdAt: Date.now() }));
}

export function logRecipe(slots, recipe) {
  mutate((s) => {
    for (const sl of slots) {
      s.entries.push({ id: uid(), date: sl.date, meal: sl.meal, kind: 'recipe', refId: recipe.id, portions: sl.portions, createdAt: Date.now() });
    }
  });
}

export function openAdd({ date, meal, onPick }) {
  openSheet((close) => html`<${AddSheet} date=${date} meal=${meal} onPick=${onPick} close=${close} />`, { full: true });
}

function VeganBadge({ v }) {
  if (v === true) return html`<span class="badge vegan">vegan</span>`;
  if (v === false) return html`<span class="badge nonvegan">nicht vegan</span>`;
  return html`<span class="badge unknown">vegan?</span>`;
}

export function FoodRow({ food, onClick, extra }) {
  return html`
    <button class="row" onClick=${onClick}>
      <div class="row-main">
        <div class="row-title">${food.name}</div>
        <div class="row-sub">
          ${food.brand ? html`<span>${food.brand}</span>` : ''}
          <span>${num(food.per100.kcal, 0)} kcal · ${num(food.per100.protein)} g P /100 g</span>
          ${food.source !== 'base' && html`<${VeganBadge} v=${food.vegan} />`}
        </div>
      </div>
      ${extra || html`<span class="row-plus">+</span>`}
    </button>`;
}

function RecipeRow({ recipe, onClick }) {
  const p = recipePortion(recipe);
  return html`
    <button class="row" onClick=${onClick}>
      <div class="row-main">
        <div class="row-title">${recipe.favorite ? '💖 ' : '🍲 '}${recipe.name}</div>
        <div class="row-sub"><span>pro Portion ${num(p.n.kcal, 0)} kcal · ${num(p.n.protein)} g P</span></div>
      </div>
      <span class="row-plus">+</span>
    </button>`;
}

function AddSheet({ date, meal, onPick, close }) {
  const [q, setQ] = useState('');
  const [online, setOnline] = useState({ loading: false, list: [], error: null, q: '' });
  const [sel, setSel] = useState(null); // {food} | {recipe}
  const [retry, setRetry] = useState(0);
  const inputRef = useRef();
  const pickMode = !!onPick;

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 250); }, []);

  // Online-Suche mit Verzögerung ab 3 Zeichen
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { setOnline({ loading: false, list: [], error: null, q: '' }); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setOnline((o) => ({ ...o, loading: true, error: null }));
      try {
        const list = await searchOFF(term, ctrl.signal);
        setOnline({ loading: false, list, error: null, q: term });
      } catch (e) {
        if (e.name !== 'AbortError') setOnline({ loading: false, list: [], error: 'Open Food Facts ist gerade überlastet. Barcode-Scan geht trotzdem, oder kurz warten und nochmal versuchen.', q: term });
      }
    }, 900);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, retry]);

  const confirmFood = (food, grams) => {
    if (pickMode) { cacheFood(food); onPick(food, grams); close(); return; }
    logFood(date, meal, food, grams);
    toast(`${food.name} eingetragen 💕`);
    close();
  };

  if (sel?.food) {
    return html`<${AmountView} food=${sel.food} onBack=${() => setSel(null)} onConfirm=${(g) => confirmFood(sel.food, g)}
      confirmLabel=${pickMode ? 'Hinzufügen' : `Zu ${mealLabel(meal)}`} />`;
  }
  if (sel?.recipe) {
    return html`<${RecipeLogView} recipe=${sel.recipe} date=${date} meal=${meal} onBack=${() => setSel(null)} close=${close} />`;
  }

  const use = usage({ meal });
  const local = q ? searchLocal(q) : [];
  const localIds = new Set(local.map((f) => f.id));
  const onlineList = online.list.filter((f) => !localIds.has(f.id));
  const recipes = pickMode ? [] : searchRecipes(q)
    .sort((a, b) => (b.favorite - a.favorite) || ((use[b.id]?.mealCount || 0) - (use[a.id]?.mealCount || 0)));

  // Häufig in dieser Mahlzeit (nur ohne Suchbegriff)
  const frequent = q ? [] : Object.entries(use)
    .filter(([id, u]) => u.mealCount > 0 && getFood(id))
    .sort((a, b) => b[1].mealCount - a[1].mealCount)
    .slice(0, 8)
    .map(([id]) => getFood(id));

  const scan = () => openScanner((food) => setSel({ food }));

  return html`
    <${SheetHeader} title=${pickMode ? 'Zutat hinzufügen' : `${mealLabel(meal)} · ${dayLabel(date)}`} onClose=${close} />
    <div class="search-bar">
      <input ref=${inputRef} type="search" placeholder="Suchen: Tofu, Haferflocken, Alpro…" value=${q}
        onInput=${(e) => setQ(e.target.value)} />
      <button class="scan-btn" onClick=${scan} aria-label="Barcode scannen">▥</button>
    </div>
    <div class="sheet-body">
      ${recipes.length > 0 && html`
        <h3 class="section-title">Deine Gerichte</h3>
        <div class="list">${recipes.slice(0, q ? 10 : 6).map((r) => html`<${RecipeRow} key=${r.id} recipe=${r} onClick=${() => setSel({ recipe: r })} />`)}</div>`}

      ${frequent.length > 0 && html`
        <h3 class="section-title">Oft bei ${mealLabel(meal)}</h3>
        <div class="list">${frequent.map((f) => html`<${FoodRow} key=${f.id} food=${f} onClick=${() => setSel({ food: f })} />`)}</div>`}

      ${q && html`
        <h3 class="section-title">Treffer</h3>
        ${local.length === 0 && html`<p class="muted">Nichts in deiner Liste. Online wird gesucht…</p>`}
        <div class="list">${local.map((f) => html`<${FoodRow} key=${f.id} food=${f} onClick=${() => setSel({ food: f })} />`)}</div>
        <h3 class="section-title">Open Food Facts ${online.loading ? html`<span class="spinner"></span>` : ''}</h3>
        ${online.error && html`<p class="muted">${online.error}</p>
          <button class="btn ghost small" onClick=${() => setRetry(retry + 1)}>Nochmal versuchen</button>`}
        ${!online.loading && online.q && onlineList.length === 0 && !online.error && html`<p class="muted">Keine Produkte gefunden.</p>`}
        <div class="list">${onlineList.map((f) => html`<${FoodRow} key=${f.id} food=${f} onClick=${() => setSel({ food: f })} />`)}</div>`}

      ${!q && recipes.length === 0 && frequent.length === 0 && html`
        <div class="empty">
          <div class="empty-emoji">🔎</div>
          <p>Such oben nach einem Lebensmittel oder scanne einen Barcode.</p>
        </div>`}

      <button class="btn ghost wide" onClick=${() => openFoodEditor({ name: q, onSaved: (f) => setSel({ food: f }) })}>
        + Eigenes Lebensmittel anlegen
      </button>
    </div>`;
}

export function AmountView({ food, onBack, onConfirm, confirmLabel, initial }) {
  const [grams, setGrams] = useState(initial ?? defaultGrams(food));
  const acc = addFood(emptyAcc(), food, grams);
  const quick = [
    food.unit && { label: `1 ${food.unit.label}`, g: food.unit.g },
    food.unit && { label: `2× ${food.unit.label}`, g: food.unit.g * 2 },
    { label: '50 g', g: 50 }, { label: '100 g', g: 100 }, { label: '200 g', g: 200 },
  ].filter(Boolean);
  return html`
    <${SheetHeader} title="Menge" onClose=${onBack} />
    <div class="sheet-body">
      <div class="card">
        <div class="row-title big">${food.name}</div>
        ${food.brand && html`<div class="muted">${food.brand}</div>`}
        ${food.vegan === false && html`<p class="warn-text">⚠️ Laut Open Food Facts nicht vegan.</p>`}
      </div>
      <${Stepper} value=${grams} onChange=${setGrams} step=${food.unit && food.unit.g < 20 ? food.unit.g : 10} unit="g" />
      <div class="chips">${quick.map((x) => html`<button class="chip" onClick=${() => setGrams(x.g)}>${x.label}</button>`)}</div>
      <div class="card center"><${MacroLine} acc=${acc} /></div>
      <button class="btn primary wide" disabled=${!grams} onClick=${() => onConfirm(grams)}>${confirmLabel || 'Eintragen'}</button>
    </div>`;
}

// Gericht eintragen: Portionen + beliebig viele Mahlzeiten (heute bis übermorgen) auf einmal.
export function RecipeLogView({ recipe, date, meal, onBack, close }) {
  const [portions, setPortions] = useState(1);
  const [slots, setSlots] = useState({ [`${date}#${meal}`]: true });
  const [byGrams, setByGrams] = useState(false);
  const [grams, setGrams] = useState(recipe.cookedG ? Math.round(recipe.cookedG / recipe.portions) : 300);
  const per = recipePortion(recipe);
  const effPortions = byGrams && recipe.cookedG ? (grams / recipe.cookedG) * recipe.portions : portions;
  const days = [date, addDays(date, 1), addDays(date, 2)];
  const mealsShown = MEALS.filter((m) => m.main || m.key === 'snack2');
  const chosen = Object.keys(slots).filter((k) => slots[k]);
  const toggle = (k) => setSlots({ ...slots, [k]: !slots[k] });

  const save = () => {
    const list = chosen.map((k) => { const [d, m] = k.split('#'); return { date: d, meal: m, portions: Math.round(effPortions * 100) / 100 }; });
    logRecipe(list, recipe);
    toast(list.length > 1 ? `${recipe.name} für ${list.length} Mahlzeiten eingetragen 💕` : `${recipe.name} eingetragen 💕`);
    close();
  };

  return html`
    <${SheetHeader} title=${recipe.name} onClose=${onBack} />
    <div class="sheet-body">
      ${recipe.cookedG ? html`
        <div class="seg">
          <button class=${!byGrams ? 'on' : ''} onClick=${() => setByGrams(false)}>Portionen</button>
          <button class=${byGrams ? 'on' : ''} onClick=${() => setByGrams(true)}>Gramm</button>
        </div>` : ''}
      ${byGrams
        ? html`<${Stepper} value=${grams} onChange=${setGrams} step=${10} unit="g" />`
        : html`<${Stepper} value=${portions} onChange=${setPortions} step=${0.5} unit=${portions === 1 ? 'Portion' : 'Portionen'} />`}
      <div class="card center"><span class="macro-line">je Mahlzeit ${num(per.n.kcal * effPortions, 0)} kcal · <b>${num(per.n.protein * effPortions)} g P</b></span></div>

      <h3 class="section-title">Für welche Mahlzeiten?</h3>
      <div class="slot-grid">
        ${days.map((d) => html`
          <div class="slot-day">
            <div class="slot-day-label">${dayLabel(d)}</div>
            ${mealsShown.map((m) => {
              const k = `${d}#${m.key}`;
              return html`<button class=${'chip' + (slots[k] ? ' on' : '')} onClick=${() => toggle(k)}>${m.emoji} ${m.label}</button>`;
            })}
          </div>`)}
      </div>
      <button class="btn primary wide" disabled=${!chosen.length || !effPortions} onClick=${save}>
        ${chosen.length > 1 ? `In ${chosen.length} Mahlzeiten eintragen` : 'Eintragen'}
      </button>
    </div>`;
}
