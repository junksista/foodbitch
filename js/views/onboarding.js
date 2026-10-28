// Erster Start: Name, Gewicht, Ziele.
import { html, useState } from '../lib.js';
import { getState, mutate } from '../store.js';
import { parseNum, today } from '../util.js';
import { GoalFields } from './settings.js';

export function Onboarding() {
  const p = getState().profile;
  const [kg, setKg] = useState('');
  const start = () => {
    mutate((s) => {
      const v = parseNum(kg);
      if (v) s.weights.push({ date: today(), kg: v });
      s.profile.onboarded = true;
    });
    window.scrollTo(0, 0);
  };
  return html`
    <div class="onboarding">
      <div class="hero">
        <img src="icons/icon.svg" alt="" width="96" height="96" />
        <h1>Hi, bitch 💖</h1>
        <p>Willkommen bei FoodBitch. Kurz einrichten, dann geht's los.</p>
      </div>
      <div class="card fields">
        <label class="field"><span>Dein Name</span>
          <input value=${p.name} onInput=${(e) => mutate((s) => { s.profile.name = e.target.value; })} /></label>
        <label class="field"><span>Gewicht (optional)</span>
          <span class="field-input"><input inputmode="decimal" value=${kg} onInput=${(e) => setKg(e.target.value)} /><small>kg</small></span></label>
      </div>
      <${GoalFields} />
      <button class="btn primary wide big" onClick=${start}>Los geht's ✨</button>
    </div>`;
}
