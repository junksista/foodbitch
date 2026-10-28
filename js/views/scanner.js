// Barcode-Scanner über die Kamera (zxing, wird erst beim Öffnen geladen).
import { html, useState, useEffect, useRef } from '../lib.js';
import { getState } from '../store.js';
import { lookupBarcode } from '../off.js';
import { openSheet, SheetHeader } from '../ui.js';
import { openFoodEditor } from './food-edit.js';

const ZXING = 'https://esm.sh/@zxing/browser@0.1.5';

export function openScanner(onFood) {
  openSheet((close) => html`<${Scanner} close=${close} onFood=${(f) => { close(); onFood(f); }} />`, { full: true });
}

function Scanner({ close, onFood }) {
  const videoRef = useRef();
  const [status, setStatus] = useState('Kamera startet…');
  const [manual, setManual] = useState('');
  const [notFound, setNotFound] = useState(null);
  const busy = useRef(false);

  const handle = async (code) => {
    if (busy.current) return;
    busy.current = true;
    setStatus(`Suche ${code}…`);
    // schon mal gescannt oder selbst angelegt?
    const own = Object.values(getState().foods).find((f) => f.barcode === code);
    if (own) { onFood(own); return; }
    try {
      const food = await lookupBarcode(code);
      if (food) { onFood(food); return; }
      setNotFound(code);
      setStatus('Produkt nicht gefunden.');
    } catch {
      setStatus('Keine Verbindung zu Open Food Facts.');
    }
    busy.current = false;
  };

  useEffect(() => {
    let controls;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import(ZXING);
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => { if (result) handle(result.getText()); },
        );
        if (cancelled) controls.stop();
        else setStatus('Barcode in den Rahmen halten');
      } catch (e) {
        console.error(e);
        setStatus('Kamera nicht verfügbar. Gib den Barcode unten ein.');
      }
    })();
    return () => { cancelled = true; controls?.stop(); };
  }, []);

  return html`
    <${SheetHeader} title="Barcode scannen" onClose=${close} />
    <div class="sheet-body">
      <div class="scanner">
        <video ref=${videoRef} playsinline muted></video>
        <div class="scanner-frame"></div>
      </div>
      <p class="center muted">${status}</p>
      ${notFound && html`
        <div class="card">
          <p>Das Produkt kennt Open Food Facts noch nicht. Leg es einfach selbst an, dann findest du es beim nächsten Scan.</p>
          <button class="btn primary wide" onClick=${() => openFoodEditor({ barcode: notFound, onSaved: onFood })}>Selbst anlegen</button>
        </div>`}
      <div class="search-bar">
        <input inputmode="numeric" placeholder="Barcode eintippen" value=${manual} onInput=${(e) => setManual(e.target.value.trim())} />
        <button class="btn primary" disabled=${manual.length < 6} onClick=${() => { busy.current = false; handle(manual); }}>Suchen</button>
      </div>
    </div>`;
}
