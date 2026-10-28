import { html, render, useState } from './lib.js';
import { initStore, useStore } from './store.js';
import { today } from './util.js';
import { Overlays } from './ui.js';
import { TodayView } from './views/today.js';
import { RecipesView } from './views/recipes.js';
import { WeightView } from './views/weight.js';
import { SettingsView } from './views/settings.js';
import { Onboarding } from './views/onboarding.js';
import { openNutrients } from './views/nutrients.js';

const TABS = [
  { key: 'today', label: 'Tagebuch', icon: '📖' },
  { key: 'recipes', label: 'Gerichte', icon: '🍲' },
  { key: 'weight', label: 'Gewicht', icon: '⚖️' },
  { key: 'me', label: 'Ich', icon: '💖' },
];

function App() {
  const s = useStore();
  const [tab, setTab] = useState('today');
  const [date, setDate] = useState(today());

  if (!s.profile.onboarded) return html`<main class="page"><${Onboarding} /></main><${Overlays} />`;

  return html`
    <main class="page">
      ${tab === 'today' && html`<${TodayView} date=${date} setDate=${setDate} openNutrients=${() => openNutrients(date)} />`}
      ${tab === 'recipes' && html`<${RecipesView} />`}
      ${tab === 'weight' && html`<${WeightView} />`}
      ${tab === 'me' && html`<${SettingsView} />`}
    </main>
    <nav class="tabbar">
      ${TABS.map((t) => html`
        <button class=${tab === t.key ? 'on' : ''} onClick=${() => { setTab(t.key); window.scrollTo(0, 0); }}>
          <span class="tab-icon">${t.icon}</span><span>${t.label}</span>
        </button>`)}
    </nav>
    <${Overlays} />`;
}

await initStore();
render(html`<${App} />`, document.getElementById('app'));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
