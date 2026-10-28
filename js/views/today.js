// Tagesansicht: Ringe, Makros, Mahlzeiten, Vorschläge, Nährstoff-Hinweise.
import { html, useEffect, useState } from '../lib.js';
import { getState, mutate } from '../store.js';
import { getFood } from '../foods.js';
import { dayAcc, entriesOf, entryAcc, goals, sumEntries, dayDone, nutrientStatus } from '../calc.js';
import { MICROS, NUTRIENTS } from '../nutrients.js';
import { recipeSuggestions, suggestionName } from '../suggest.js';
import { MEALS, addDays, dayLabel, today, num, uid } from '../util.js';
import { Ring, Bar, openSheet, SheetHeader, Stepper, toast, MacroLine } from '../ui.js';
import { openAdd, SlotPicker } from './add.js';
import { openRecipeEditor } from './recipes.js';
import { celebrate } from './celebrate.js';

export function TodayView({ date, setDate, openNutrients }) {
  const g = goals();
  const acc = dayAcc(date);
  const n = acc.n;
  const done = dayDone(date);
  const sassy = getState().profile.sassy;
  const suggestions = date === today() ? recipeSuggestions() : [];

  // "Well done, bitch!" einmal pro Tag, sobald das Ziel erreicht ist
  useEffect(() => {
    if (done && !getState().celebrated[date]) {
      mutate((s) => { s.celebrated[date] = true; });
      celebrate();
    }
  }, [done, date]);

  const hasEntries = entriesOf(date).length > 0;
  const hints = !hasEntries ? [] : MICROS
    .filter((k) => NUTRIENTS[k].vegan)
    .map((k) => ({ k, ...nutrientStatus(acc, k) }))
    .filter((x) => x.pct != null && x.pct < 0.7)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  const proteinLeft = Math.max(0, g.protein - n.protein);

  return html`
    <header class="day-head">
      <button class="icon-btn" onClick=${() => setDate(addDays(date, -1))} aria-label="Vorheriger Tag">‹</button>
      <button class="day-title" onClick=${() => setDate(today())}>
        <span class="logo">FoodBitch</span>
        <span>${dayLabel(date, true)}</span>
      </button>
      <button class="icon-btn" onClick=${() => setDate(addDays(date, 1))} aria-label="Nächster Tag">›</button>
    </header>

    ${done && html`<div class="done-banner" onClick=${celebrate}>✨ Well done, bitch! ✨</div>`}

    <section class="card rings">
      <${Ring} value=${n.kcal} goal=${g.kcal} label="Kalorien" unit="kcal" warnOver />
      <${Ring} value=${n.protein} goal=${g.protein} label="Protein" unit="g" color="var(--berry)" />
    </section>
    <section class="card macros">
      <${Bar} label="Kohlenhydrate" value=${n.carbs} goal=${g.carbs} unit="g" />
      <${Bar} label="Fett" value=${n.fat} goal=${g.fat} unit="g" />
      <${Bar} label="Ballaststoffe" value=${n.fiber} goal=${30} unit="g" />
    </section>

    ${sassy && !done && entriesOf(date, 'dinner').length > 0 && proteinLeft > 0 && html`
      <div class="sassy">Noch ${num(proteinLeft, 0)} g Protein, bitch. Du schaffst das 💪</div>`}

    ${suggestions.map((s) => html`<${SuggestionCard} key=${s.sig} s=${s} />`)}

    ${MEALS.map((m, i) => {
      const list = entriesOf(date, m.key);
      if (m.main) return html`<${MealCard} key=${m.key} meal=${m} date=${date} list=${list} />`;
      if (list.length) return html`<${MealCard} key=${m.key} meal=${m} date=${date} list=${list} />`;
      return html`<button key=${m.key} class="snack-pill" onClick=${() => openAdd({ date, meal: m.key })}>+ Snack</button>`;
    })}

    <section class="card hints" onClick=${openNutrients}>
      <div class="card-head"><h3>Nährstoffe</h3><span class="link">Alle ansehen ›</span></div>
      ${!entriesOf(date).length && html`<p class="muted">Trag etwas ein, dann siehst du hier, was noch fehlt.</p>`}
      ${entriesOf(date).length > 0 && hints.length === 0 && html`<p>Bei den veganen Kritikern siehst du heute gut aus 💅</p>`}
      ${hints.map((h) => html`
        <div class="hint">
          <span>${NUTRIENTS[h.k].label}</span>
          <span class="hint-pct">${num(h.pct * 100, 0)} %${h.incomplete ? '*' : ''}</span>
        </div>`)}
      ${hints.some((h) => h.incomplete) && html`<p class="muted small">* Für einige Produkte fehlen Daten, der Wert ist eher zu niedrig.</p>`}
    </section>
  `;
}

function MealCard({ meal, date, list }) {
  const acc = sumEntries(list);
  const yesterday = entriesOf(addDays(date, -1), meal.key);
  const foodItems = list.filter((e) => e.kind === 'food');

  const copyYesterday = () => {
    mutate((s) => yesterday.forEach((e) => s.entries.push({ ...e, id: uid(), date, createdAt: Date.now() })));
    toast('Wie gestern eingetragen 💕');
  };
  const saveAsRecipe = () => openRecipeEditor({
    items: foodItems.map((e) => ({ foodId: e.refId, grams: e.grams })),
  });

  return html`
    <section class="card meal">
      <div class="card-head">
        <h3>${meal.emoji} ${meal.label}</h3>
        <span class="muted">${list.length ? `${num(acc.n.kcal, 0)} kcal · ${num(acc.n.protein)} g P` : ''}</span>
      </div>
      ${list.map((e) => html`<${EntryRow} key=${e.id} e=${e} />`)}
      <div class="meal-actions">
        <button class="btn primary small" onClick=${() => openAdd({ date, meal: meal.key })}>+ Hinzufügen</button>
        ${!list.length && yesterday.length > 0 && html`<button class="btn ghost small" onClick=${copyYesterday}>↺ Wie gestern</button>`}
        ${list.length > 0 && html`<button class="btn ghost small" onClick=${() => openCopy(date, meal.key, list)}>⧉ Kopieren</button>`}
        ${foodItems.length >= 2 && html`<button class="btn ghost small" onClick=${saveAsRecipe}>Als Gericht speichern</button>`}
      </div>
    </section>`;
}

// Mahlzeit kopieren: Standard ist dieselbe Mahlzeit am nächsten Tag, weitere Ziele wählbar.
function openCopy(date, meal, list) {
  openSheet((close) => html`<${CopySheet} date=${date} meal=${meal} list=${list} close=${close} />`);
}

function CopySheet({ date, meal, list, close }) {
  const [slots, setSlots] = useState({ [`${addDays(date, 1)}#${meal}`]: true });
  const chosen = Object.keys(slots).filter((k) => slots[k] && k !== `${date}#${meal}`);
  const copy = () => {
    mutate((s) => {
      for (const k of chosen) {
        const [d, m] = k.split('#');
        list.forEach((e) => s.entries.push({ ...e, id: uid(), date: d, meal: m, createdAt: Date.now() }));
      }
    });
    toast(chosen.length > 1 ? `In ${chosen.length} Mahlzeiten kopiert 💕` : 'Kopiert 💕');
    close();
  };
  return html`
    <${SheetHeader} title="Mahlzeit kopieren" onClose=${close} />
    <div class="sheet-body">
      <div class="card">
        ${list.map((e) => html`<div class="row-sub copy-item">${e.kind === 'recipe' ? '🍲 ' : ''}${entryName(e)}</div>`)}
      </div>
      <h3 class="section-title">Wohin kopieren?</h3>
      <${SlotPicker} from=${date} meal=${meal} slots=${slots} setSlots=${setSlots} />
      <button class="btn primary wide" disabled=${!chosen.length} onClick=${copy}>
        ${chosen.length > 1 ? `In ${chosen.length} Mahlzeiten kopieren` : 'Kopieren'}
      </button>
    </div>`;
}

function entryName(e) {
  if (e.kind === 'food') return getFood(e.refId)?.name ?? 'Gelöschtes Lebensmittel';
  return getState().recipes[e.refId]?.name ?? 'Gelöschtes Gericht';
}

function EntryRow({ e }) {
  const acc = entryAcc(e);
  const amount = e.kind === 'food' ? `${num(e.grams, 0)} g` : `${num(e.portions)} ${e.portions === 1 ? 'Portion' : 'Port.'}`;
  return html`
    <button class="entry" onClick=${() => openSheet((close) => html`<${EntryEdit} e=${e} close=${close} />`)}>
      <span class="entry-name">${e.kind === 'recipe' ? '🍲 ' : ''}${entryName(e)}</span>
      <span class="entry-amount">${amount}</span>
      <span class="entry-kcal">${num(acc.n.kcal, 0)} kcal</span>
    </button>`;
}

function EntryEdit({ e, close }) {
  const isFood = e.kind === 'food';
  const [val, setVal] = useState(isFood ? e.grams : e.portions);
  const preview = entryAcc(isFood ? { ...e, grams: val } : { ...e, portions: val });
  const save = () => {
    mutate((s) => {
      const x = s.entries.find((y) => y.id === e.id);
      if (isFood) x.grams = val; else x.portions = val;
    });
    close();
  };
  const del = () => { mutate((s) => { s.entries = s.entries.filter((y) => y.id !== e.id); }); toast('Gelöscht'); close(); };
  return html`
    <${SheetHeader} title=${entryName(e)} onClose=${close} />
    <div class="sheet-body">
      <${Stepper} value=${val} onChange=${setVal} step=${isFood ? 5 : 0.5} unit=${isFood ? 'g' : 'Portionen'} />
      <div class="card center"><${MacroLine} acc=${preview} /></div>
      <button class="btn primary wide" onClick=${save}>Speichern</button>
      <button class="btn danger wide" onClick=${del}>Löschen</button>
    </div>`;
}

function SuggestionCard({ s }) {
  const names = s.items.map((i) => getFood(i.foodId)?.name).filter(Boolean);
  return html`
    <section class="card suggestion">
      <div class="suggestion-title">💡 Das isst du oft</div>
      <p>${names.join(', ')}, an ${s.days} Tagen in den letzten 2 Wochen. Als Gericht speichern? Dann reicht künftig ein Tipp.</p>
      <div class="meal-actions">
        <button class="btn primary small" onClick=${() => openRecipeEditor({ items: s.items, name: suggestionName(s) })}>Als Gericht speichern</button>
        <button class="btn ghost small" onClick=${() => mutate((st) => st.dismissed.push(s.sig))}>Nein danke</button>
      </div>
    </section>`;
}
