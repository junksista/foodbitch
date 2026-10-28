// "Well done, bitch!" mit Konfetti.
import { html } from '../lib.js';
import { openSheet } from '../ui.js';

const COLORS = ['#ff5fa8', '#ffb3d9', '#c9a7ff', '#ffd166', '#ffffff', '#ff8fc7'];

export function celebrate() {
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 2.2 + Math.random() * 1.6,
    color: COLORS[i % COLORS.length],
    rot: Math.random() * 360,
    shape: i % 3,
  }));
  const close = openSheet((close) => html`
    <div class="celebrate" onClick=${close}>
      ${pieces.map((p) => html`<i class=${'confetti s' + p.shape} style=${{
        left: p.left + '%', background: p.color, animationDelay: p.delay + 's', animationDuration: p.dur + 's',
        transform: `rotate(${p.rot}deg)`,
      }}></i>`)}
      <div class="celebrate-text">
        <div class="celebrate-emoji">💅✨</div>
        <h1>Well done, bitch!</h1>
        <p>Ziel erreicht. Du bist großartig.</p>
      </div>
    </div>`, { bare: true });
  setTimeout(close, 5000);
}
