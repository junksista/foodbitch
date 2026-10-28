# FoodBitch

Private Ernährungs-Tracking-App (Yazio-Ersatz) für zwei Personen. Kein Produkt, keine Vermarktung.
Beide Nutzerinnen ernähren sich **vegan**, nutzen **iPhones** und die App als **Web-App vom Homescreen** (PWA).

## Arbeitsweise

- Sprache der App und der Kommunikation: **Deutsch**, locker, du-Form. Frecher Ton ist gewollt („Well done, bitch!“).
- Optik: **sehr girly, viel Rosa**, runde Formen, Konfetti bei erreichtem Tagesziel. Farben nur über die CSS-Variablen in `css/app.css`.
- Mobile first: Ziel ist das iPhone (Safari, Homescreen-App). Safe Areas beachten, Touch-Ziele ≥ 44 px.
- Kleine Schritte: nach jeder Funktion im Browser testen (`.claude/launch.json` → Server `foodbitch`, Port 5173).
- **Erst selbst testen, dann übergeben.** Jede Änderung wird vor der Übergabe selbst geprüft (Browser in iPhone-Größe,
  echte Klicks, Konsole auf Fehler). Erst wenn das erfolgreich war, als fertig melden. Was sich nicht selbst testen lässt
  (z. B. Kamera am iPhone), ausdrücklich als „nicht getestet“ benennen.
- Neue Ideen und Wünsche kommen in `docs/ROADMAP.md`, erledigte Änderungen in `CHANGELOG.md`.

## Technik

- **Kein Build-Schritt, kein Node.** Reines ES-Modul-JavaScript mit Preact + htm (`vendor/preact-htm.js`, eingebunden über `js/lib.js`).
  Komponenten schreiben wir mit `html\`...\`` statt JSX.
- Lokal starten: `python3 scripts/serve.py` (ohne Browser-Cache), dann http://localhost:5173.
- Daten liegen aktuell **nur lokal** in IndexedDB (ein JSON-Objekt, siehe `js/store.js`). Sync über Supabase ist Phase 2.
- `sw.js` ist network-first: Änderungen sind beim Neuladen sofort da. Bei Änderungen am Cache-Verhalten `CACHE` hochzählen.
- Open Food Facts: Die Such-API (`cgi/search.pl`) erlaubt nur ca. 10 Anfragen/Minute und antwortet bei Überlast mit 503 ohne CORS-Header
  (im Browser: „CORS blocked“). Deshalb Debounce + Cache in `off.js`. Die Barcode-API ist großzügiger (ca. 100/Minute).
  `search.openfoodfacts.org` erlaubt kein CORS, also nicht vom Browser aus nutzbar.
- Barcode-Scanner: `@zxing/browser` wird erst beim Öffnen des Scanners von esm.sh geladen. Kamera braucht HTTPS (oder localhost).

## Struktur

```
index.html            Einstieg, Fonts, Manifest
css/app.css           gesamtes Styling (Farbvariablen oben)
js/app.js             Root, Tab-Navigation, Service-Worker-Registrierung
js/lib.js             Re-Export von Preact/htm
js/store.js           Zustand + Persistenz (mutate/commit/useStore), Datenmodell
js/nutrients.js       Nährstoff-Definitionen, DGE-Richtwerte, vegane Tipps
js/base-foods.js      kuratierte vegane Grundnahrungsmittel inkl. Mikros (Richtwerte)
js/foods.js           Lebensmittel nachschlagen, lokale Suche, Standardmengen
js/off.js             Open Food Facts: Suche + Barcode
js/calc.js            Nährwert-Berechnung (Einträge, Gerichte, Tag, Ziele)
js/suggest.js         smarte Vorschläge (wiederkehrende Kombinationen → Gericht)
js/util.js            Datum, Formatierung, IDs
js/ui.js              Sheets (Bottom-Sheets/Modals), Toasts, Ringe, Balken
js/views/*.js         Screens und Sheets
```

## Datenmodell (`js/store.js`)

- `profile`: Name, Referenzwerte (`sex`: f/m), Ziele (`kcal`, Protein fix oder g/kg, optional KH/Fett, Toleranz), `sassy`.
- `foods`: eigene und von Open Food Facts übernommene Lebensmittel `{id, name, brand, source, barcode, vegan, per100, unit}`.
  Grundnahrungsmittel stehen in `base-foods.js` (IDs `b:...`) und werden **nicht** im State gespeichert.
- `recipes`: Gerichte `{id, name, items:[{foodId, grams}], portions, cookedG?, favorite}`.
- `entries`: Tagebuch `{id, date:'YYYY-MM-DD', meal, kind:'food'|'recipe', refId, grams?, portions?}`.
  Mahlzeiten: `breakfast, snack1, lunch, snack2, dinner, snack3`.
- `supplements`: täglich mitgezählte Nahrungsergänzungen `{id, name, active, n:{b12: 250}}`.
- `weights`: `{date, kg}`; `dismissed`: abgelehnte Vorschläge; `celebrated`: Tage mit „Well done“-Anzeige.
- Nährwerte immer **pro 100 g**; `null` heißt „unbekannt“ (nicht 0). Fehlende Mikros werden als „Daten unvollständig“ angezeigt.
- Kohlenhydrate nach EU-Konvention (ohne Ballaststoffe).

## Wichtig

- Nährwerte in `base-foods.js` sind gerundete Richtwerte (USDA/BLS-Größenordnung), keine Laborwerte.
  Geplanter Ersatz: offizieller Datensatz (BLS 4.0 oder USDA FoodData Central), siehe Roadmap.
- Die Hinweise auf Mängel sind Orientierung, keine medizinische Beratung. Texte entsprechend formulieren.
