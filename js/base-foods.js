// Vegane Grundnahrungsmittel mit Richtwerten pro 100 g (gerundet, Größenordnung USDA/BLS).
// Kohlenhydrate ohne Ballaststoffe (EU). Werte sind Orientierung, keine Laborwerte.
// Reihenfolge der Zahlen = FIELDS in nutrients.js:
// kcal, protein, carbs, fat, fiber, sugar, salt, b12 µg, vitd µg, iron mg, zinc mg, calcium mg,
// iodine µg, selenium µg, ala g, b2 mg, magnesium mg, folate µg, vitc mg, potassium mg
import { FIELDS } from './nutrients.js';

// [id, Name, Kategorie, Werte, Portion [Label, g]?, Suchbegriffe?]
const ROWS = [
  // Getreide & Beilagen
  ['haferflocken', 'Haferflocken', 'Getreide', [372, 13.5, 58.7, 7, 10, 0.7, 0, 0, 0, 4.5, 3.6, 54, 4, 10, 0.1, 0.15, 138, 32, 0, 374], ['Portion', 50], 'oats porridge'],
  ['nudeln', 'Nudeln, Hartweizen (trocken)', 'Getreide', [357, 12.5, 71, 1.5, 3, 3, 0, 0, 0, 1.5, 1.3, 20, 2, 6, 0.03, 0.06, 50, 20, 0, 200], ['Portion', 100], 'pasta spaghetti'],
  ['nudeln-vk', 'Vollkornnudeln (trocken)', 'Getreide', [348, 13, 64, 2.5, 9, 3, 0, 0, 0, 3.6, 2.8, 40, 4, 8, 0.05, 0.1, 120, 40, 0, 300], ['Portion', 100], 'pasta'],
  ['nudeln-gek', 'Nudeln (gekocht)', 'Getreide', [150, 5.5, 29, 0.8, 1.5, 0.6, 0, 0, 0, 0.6, 0.5, 7, 1, 3, 0.01, 0.02, 18, 7, 0, 45], null, 'pasta'],
  ['reis', 'Reis, weiß (trocken)', 'Getreide', [349, 7, 78, 0.6, 1.4, 0.1, 0, 0, 0, 0.8, 1.2, 8, 2, 5, 0.02, 0.03, 25, 9, 0, 110], ['Portion', 75], 'basmati jasmin'],
  ['reis-vk', 'Vollkornreis (trocken)', 'Getreide', [350, 7.5, 74, 2.7, 3.5, 0.7, 0, 0, 0, 1.5, 2, 12, 2, 8, 0.03, 0.05, 140, 20, 0, 250], ['Portion', 75], 'naturreis'],
  ['reis-gek', 'Reis (gekocht)', 'Getreide', [130, 2.7, 28, 0.3, 0.4, 0, 0, 0, 0, 0.2, 0.5, 3, 1, 2, 0.01, 0.01, 12, 3, 0, 35], null, ''],
  ['quinoa', 'Quinoa (trocken)', 'Getreide', [368, 14, 57, 6, 7, 0, 0, 0, 0, 4.6, 3.1, 47, 2, 8, 0.26, 0.32, 197, 184, 0, 563], ['Portion', 70], ''],
  ['couscous', 'Couscous (trocken)', 'Getreide', [376, 13, 72, 0.6, 5, 0, 0, 0, 0, 1.1, 0.8, 24, 2, 5, 0.02, 0.08, 44, 20, 0, 166], ['Portion', 70], 'bulgur'],
  ['vollkornbrot', 'Vollkornbrot', 'Getreide', [220, 7.5, 38, 1.5, 7.5, 3, 1.1, 0, 0, 2.2, 1.6, 30, 8, 4, 0.05, 0.1, 60, 30, 0, 250], ['Scheibe', 50], 'brot'],
  ['broetchen', 'Brötchen (Weizen)', 'Getreide', [270, 9, 52, 1.5, 3, 2, 1.2, 0, 0, 1, 0.8, 25, 6, 4, 0.03, 0.06, 25, 25, 0, 130], ['Stück', 60], 'semmel'],
  ['kartoffeln', 'Kartoffeln', 'Getreide', [72, 2, 15.5, 0.1, 2, 0.8, 0, 0, 0, 0.4, 0.3, 6, 2, 0.5, 0.01, 0.04, 21, 15, 17, 420], ['Stück', 100], ''],
  ['suesskartoffel', 'Süßkartoffel', 'Getreide', [86, 1.6, 17, 0.1, 3, 4.2, 0.1, 0, 0, 0.6, 0.3, 30, 2, 0.6, 0, 0.06, 25, 11, 2.4, 337], ['Stück', 250], ''],

  // Hülsenfrüchte
  ['linsen-rot', 'Rote Linsen (trocken)', 'Hülsenfrüchte', [340, 25, 50, 1.5, 11, 2, 0, 0, 0, 7.4, 3.6, 35, 4, 8, 0.1, 0.11, 60, 204, 1.7, 580], ['Portion', 60], 'dal'],
  ['linsen', 'Linsen, braun/Beluga (trocken)', 'Hülsenfrüchte', [330, 24, 48, 1.4, 17, 2, 0, 0, 0, 6.5, 3.3, 56, 4, 8, 0.1, 0.2, 47, 479, 4, 677], ['Portion', 60], 'tellerlinsen'],
  ['linsen-gek', 'Linsen (gekocht)', 'Hülsenfrüchte', [116, 9, 17, 0.4, 8, 1.8, 0, 0, 0, 3.3, 1.3, 19, 1, 2.8, 0.04, 0.07, 36, 181, 1.5, 369], null, ''],
  ['kichererbsen', 'Kichererbsen (trocken)', 'Hülsenfrüchte', [364, 19, 50, 6, 12, 10.7, 0, 0, 0, 6.2, 3.4, 105, 2, 8, 0.1, 0.21, 115, 557, 4, 875], ['Portion', 60], ''],
  ['kichererbsen-dose', 'Kichererbsen (Dose, abgetropft)', 'Hülsenfrüchte', [139, 7, 17, 2.6, 7, 0.3, 0.6, 0, 0, 1.8, 1.2, 40, 1, 3, 0.04, 0.06, 30, 80, 0, 170], ['Dose', 240], ''],
  ['kidney', 'Kidneybohnen (Dose)', 'Hülsenfrüchte', [105, 7, 14, 0.5, 6, 0.4, 0.5, 0, 0, 1.6, 0.8, 30, 1, 1, 0.1, 0.05, 30, 60, 1, 250], ['Dose', 250], 'bohnen'],
  ['schwarze-bohnen', 'Schwarze Bohnen (Dose)', 'Hülsenfrüchte', [110, 7, 15, 0.5, 7, 0.3, 0.5, 0, 0, 2, 0.9, 35, 1, 1, 0.1, 0.05, 40, 90, 0, 300], ['Dose', 250], 'bohnen'],
  ['edamame', 'Edamame (TK)', 'Hülsenfrüchte', [121, 12, 9, 5, 5, 2, 0, 0, 0, 2.3, 1.4, 63, 1, 1, 0.3, 0.15, 64, 311, 6, 436], ['Portion', 100], 'sojabohnen'],
  ['erbsen', 'Erbsen (TK)', 'Hülsenfrüchte', [81, 5.4, 9, 0.4, 5, 5.7, 0, 0, 0, 1.5, 1.2, 25, 1, 1.8, 0.03, 0.13, 33, 65, 40, 244], ['Portion', 100], ''],
  ['hummus', 'Hummus', 'Hülsenfrüchte', [220, 7, 10, 16, 5, 0.5, 1, 0, 0, 2.4, 1.8, 38, 2, 2, 0.1, 0.06, 71, 83, 0, 228], ['EL', 20], ''],

  // Soja & Protein
  ['tofu', 'Tofu natur', 'Protein', [145, 15, 1.5, 8.5, 1, 0.5, 0, 0, 0, 2.7, 1.6, 160, 2, 10, 0.6, 0.06, 58, 20, 0, 150], ['Packung', 200], ''],
  ['raeuchertofu', 'Räuchertofu', 'Protein', [165, 17, 2, 9.5, 1, 1, 1.5, 0, 0, 2.7, 1.6, 160, 2, 10, 0.6, 0.06, 58, 20, 0, 150], ['Packung', 200], 'tofu'],
  ['tempeh', 'Tempeh', 'Protein', [192, 20, 7.6, 10.8, 5, 0, 0, 0, 0, 2.7, 1.1, 111, 2, 9, 0.1, 0.36, 81, 24, 0, 412], ['Packung', 200], ''],
  ['seitan', 'Seitan', 'Protein', [120, 24, 4, 1.5, 1, 0.5, 1, 0, 0, 1.5, 0.8, 25, 2, 5, 0, 0.05, 15, 15, 0, 80], ['Portion', 100], 'weizeneiweiss'],
  ['sojaschnetzel', 'Sojaschnetzel (trocken)', 'Protein', [330, 50, 15, 1.5, 18, 8, 0.05, 0, 0, 9, 4.5, 250, 4, 3, 0.3, 0.25, 280, 330, 0, 2200], ['Portion', 50], 'tvp sojagranulat sojahack'],
  ['erbsenprotein', 'Erbsenprotein-Pulver', 'Protein', [380, 80, 3, 6, 1, 0, 2.5, 0, 0, 20, 6, 100, 1, 5, 0.1, 0.1, 60, 0, 0, 200], ['Scoop', 30], 'proteinpulver shake'],
  ['sojaprotein', 'Sojaprotein-Isolat', 'Protein', [370, 88, 3, 1, 0.5, 0, 2.5, 0, 0, 14.5, 4, 178, 1, 0.8, 0.1, 0.1, 39, 176, 0, 81], ['Scoop', 30], 'proteinpulver shake'],
  ['sojajoghurt', 'Sojajoghurt natur (angereichert)', 'Protein', [50, 4, 2.1, 2.3, 0.9, 2.1, 0.1, 0.38, 0.75, 0.4, 0.3, 120, 0, 1, 0.15, 0.21, 20, 10, 0, 140], ['Becher', 150], 'skyr joghurt'],
  ['sojadrink', 'Sojadrink (angereichert)', 'Protein', [39, 3.3, 2.5, 1.8, 0.5, 2.5, 0.09, 0.38, 0.75, 0.4, 0.2, 120, 0, 1, 0.15, 0.21, 15, 10, 0, 120], ['Glas', 200], 'sojamilch milch'],
  ['haferdrink', 'Haferdrink (angereichert)', 'Getreide', [46, 1, 6.7, 1.5, 0.8, 4.1, 0.1, 0.38, 1.1, 0.1, 0.1, 120, 0, 1, 0.1, 0.21, 6, 3, 0, 40], ['Glas', 200], 'hafermilch milch'],

  // Nüsse & Samen
  ['leinsamen', 'Leinsamen, geschrotet', 'Nüsse & Samen', [534, 18, 1.6, 42, 27, 1.6, 0.08, 0, 0, 5.7, 4.3, 255, 2, 25, 22.8, 0.16, 392, 87, 0.6, 813], ['EL', 10], 'leinsaat'],
  ['chia', 'Chiasamen', 'Nüsse & Samen', [486, 17, 7.7, 31, 34, 0, 0, 0, 0, 7.7, 4.6, 631, 2, 55, 17.8, 0.17, 335, 49, 1.6, 407], ['EL', 12], ''],
  ['hanfsamen', 'Hanfsamen, geschält', 'Nüsse & Samen', [553, 32, 1.5, 49, 4, 1.5, 0, 0, 0, 8, 9.9, 70, 2, 0, 8.7, 0.29, 700, 110, 0.5, 1200], ['EL', 10], ''],
  ['walnuesse', 'Walnüsse', 'Nüsse & Samen', [654, 15, 7, 65, 6.7, 2.6, 0, 0, 0, 2.9, 3.1, 98, 3, 5, 9.1, 0.15, 158, 98, 1.3, 441], ['Handvoll', 25], ''],
  ['mandeln', 'Mandeln', 'Nüsse & Samen', [579, 21, 9.1, 50, 12.5, 4.4, 0, 0, 0, 3.7, 3.1, 269, 2, 4, 0, 1.14, 270, 44, 0, 733], ['Handvoll', 25], ''],
  ['cashews', 'Cashews', 'Nüsse & Samen', [553, 18, 30, 44, 3.3, 6, 0, 0, 0, 6.7, 5.8, 37, 2, 20, 0.06, 0.06, 292, 25, 0.5, 660], ['Handvoll', 25], ''],
  ['paranuss', 'Paranüsse', 'Nüsse & Samen', [659, 14, 4.2, 67, 7.5, 2.3, 0, 0, 0, 2.4, 4.1, 160, 2, 1917, 0, 0.04, 376, 22, 0.7, 659], ['Stück', 5], ''],
  ['erdnussmus', 'Erdnussmus', 'Nüsse & Samen', [588, 25, 16, 50, 6, 9, 0, 0, 0, 1.9, 2.9, 43, 2, 4, 0, 0.1, 168, 87, 0, 558], ['EL', 15], 'erdnussbutter peanut'],
  ['erdnuesse', 'Erdnüsse, geröstet', 'Nüsse & Samen', [585, 25, 13, 49, 8, 4, 0, 0, 0, 2.3, 3.3, 54, 2, 7, 0, 0.1, 176, 145, 0, 658], ['Handvoll', 25], ''],
  ['kuerbiskerne', 'Kürbiskerne', 'Nüsse & Samen', [559, 30, 4.7, 49, 6, 1.4, 0, 0, 0, 8.8, 7.8, 46, 2, 9, 0.1, 0.15, 592, 58, 1.9, 809], ['EL', 10], ''],
  ['sonnenblumenkerne', 'Sonnenblumenkerne', 'Nüsse & Samen', [584, 21, 11, 51, 8.6, 2.6, 0, 0, 0, 5.3, 5, 78, 2, 53, 0.07, 0.36, 325, 227, 1.4, 645], ['EL', 10], ''],
  ['tahin', 'Tahin (Sesammus)', 'Nüsse & Samen', [595, 17, 12, 54, 9.3, 0.5, 0.2, 0, 0, 8.9, 4.6, 140, 2, 34, 0.4, 0.47, 95, 98, 0, 414], ['EL', 15], 'tahini sesam'],

  // Gemüse
  ['brokkoli', 'Brokkoli', 'Gemüse', [34, 2.8, 4, 0.4, 2.6, 1.7, 0.08, 0, 0, 0.7, 0.4, 47, 2, 2.5, 0.02, 0.12, 21, 63, 89, 316], ['Portion', 150], ''],
  ['spinat', 'Spinat', 'Gemüse', [23, 2.9, 1.4, 0.4, 2.2, 0.4, 0.2, 0, 0, 2.7, 0.5, 99, 3, 1, 0.14, 0.19, 79, 194, 28, 558], ['Portion', 100], 'blattspinat'],
  ['gruenkohl', 'Grünkohl', 'Gemüse', [43, 4.3, 4, 0.9, 4.1, 1, 0.1, 0, 0, 1.6, 0.4, 212, 2, 1, 0.18, 0.13, 33, 62, 105, 450], ['Portion', 150], 'kale'],
  ['paprika', 'Paprika, rot', 'Gemüse', [31, 1, 4.7, 0.3, 2.1, 4.2, 0, 0, 0, 0.4, 0.25, 7, 1, 0.1, 0.03, 0.09, 12, 46, 128, 211], ['Stück', 150], ''],
  ['tomaten', 'Tomaten', 'Gemüse', [18, 0.9, 2.7, 0.2, 1.2, 2.6, 0, 0, 0, 0.3, 0.2, 10, 1, 0, 0, 0.02, 11, 15, 14, 237], ['Stück', 100], ''],
  ['passata', 'Tomaten, passiert', 'Gemüse', [32, 1.4, 5.5, 0.2, 1, 4.5, 0.1, 0, 0, 0.9, 0.2, 15, 1, 0.3, 0, 0.05, 19, 13, 9, 370], ['Packung', 500], 'passata tomatensosse'],
  ['zucchini', 'Zucchini', 'Gemüse', [17, 1.2, 2.1, 0.3, 1, 1.7, 0, 0, 0, 0.4, 0.3, 16, 1, 0.2, 0.02, 0.09, 18, 24, 18, 261], ['Stück', 250], ''],
  ['karotten', 'Karotten', 'Gemüse', [41, 0.9, 7, 0.2, 2.8, 4.7, 0.2, 0, 0, 0.3, 0.2, 33, 2, 0.1, 0, 0.06, 12, 19, 6, 320], ['Stück', 80], 'moehren'],
  ['zwiebeln', 'Zwiebeln', 'Gemüse', [40, 1.1, 7.6, 0.1, 1.7, 4.2, 0, 0, 0, 0.2, 0.2, 23, 1, 0.5, 0, 0.03, 10, 19, 7, 146], ['Stück', 80], ''],
  ['champignons', 'Champignons', 'Gemüse', [22, 3.1, 2.3, 0.3, 1, 2, 0, 0, 0.2, 0.5, 0.5, 3, 2, 9.3, 0, 0.4, 9, 17, 2, 318], ['Portion', 150], 'pilze'],
  ['blumenkohl', 'Blumenkohl', 'Gemüse', [25, 1.9, 3, 0.3, 2, 1.9, 0.1, 0, 0, 0.4, 0.3, 22, 1, 0.6, 0.04, 0.06, 15, 57, 48, 299], ['Portion', 150], ''],
  ['rosenkohl', 'Rosenkohl', 'Gemüse', [43, 3.4, 5.2, 0.3, 3.8, 2.2, 0, 0, 0, 1.4, 0.4, 42, 1, 1.6, 0.1, 0.09, 23, 61, 85, 389], ['Portion', 150], ''],
  ['avocado', 'Avocado', 'Gemüse', [160, 2, 1.9, 14.7, 6.7, 0.7, 0, 0, 0, 0.55, 0.64, 12, 2, 0.4, 0.11, 0.13, 29, 81, 10, 485], ['Stück', 150], ''],
  ['gurke', 'Gurke', 'Gemüse', [15, 0.65, 2.6, 0.1, 0.5, 1.7, 0, 0, 0, 0.3, 0.2, 16, 1, 0.3, 0, 0.03, 13, 7, 2.8, 147], ['Stück', 300], ''],
  ['salat', 'Blattsalat', 'Gemüse', [15, 1.4, 1.8, 0.2, 1.3, 0.8, 0.05, 0, 0, 0.9, 0.2, 36, 1, 0.6, 0.06, 0.08, 13, 38, 9, 194], ['Portion', 80], 'rucola feldsalat'],
  ['nori', 'Nori (getrocknet)', 'Gemüse', [300, 35, 20, 2, 34, 0.5, 1.5, 0, 0, 20, 3, 280, 1500, 5, 0.1, 2.5, 300, 1500, 40, 2500], ['Blatt', 2.5], 'algen sushi'],

  // Obst
  ['banane', 'Banane', 'Obst', [93, 1.1, 20, 0.2, 2, 17, 0, 0, 0, 0.3, 0.15, 5, 2, 1, 0.03, 0.07, 27, 20, 9, 360], ['Stück', 120], ''],
  ['apfel', 'Apfel', 'Obst', [54, 0.3, 12, 0.2, 2.3, 10, 0, 0, 0, 0.1, 0.04, 6, 1, 0, 0.01, 0.03, 5, 3, 7, 107], ['Stück', 180], ''],
  ['beeren', 'Beeren, gemischt (TK)', 'Obst', [45, 1, 7, 0.4, 5, 6, 0, 0, 0, 0.8, 0.3, 25, 1, 0.3, 0.1, 0.04, 20, 25, 25, 170], ['Portion', 100], 'himbeeren heidelbeeren erdbeeren'],
  ['orange', 'Orange', 'Obst', [47, 1, 9, 0.1, 2.2, 9, 0, 0, 0, 0.1, 0.07, 40, 1, 0.5, 0.01, 0.04, 10, 30, 53, 181], ['Stück', 150], 'apfelsine'],
  ['mango', 'Mango', 'Obst', [60, 0.8, 13.7, 0.4, 1.6, 13.7, 0, 0, 0, 0.16, 0.09, 11, 1, 0.6, 0.05, 0.04, 10, 43, 36, 168], ['Stück', 300], ''],
  ['kiwi', 'Kiwi', 'Obst', [61, 1.1, 12, 0.5, 3, 9, 0, 0, 0, 0.3, 0.14, 34, 1, 0.2, 0.04, 0.03, 17, 25, 93, 312], ['Stück', 75], ''],
  ['datteln', 'Datteln, getrocknet', 'Obst', [290, 2, 65, 0.4, 8, 63, 0, 0, 0, 1, 0.3, 39, 2, 3, 0, 0.07, 43, 19, 0.4, 656], ['Stück', 8], ''],

  // Fette & Sonstiges
  ['rapsoel', 'Rapsöl', 'Fette & Sonstiges', [884, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9.1, 0, 0, 0, 0, 0], ['EL', 10], 'oel'],
  ['olivenoel', 'Olivenöl', 'Fette & Sonstiges', [884, 0, 0, 100, 0, 0, 0, 0, 0, 0.6, 0, 1, 0, 0, 0.76, 0, 0, 0, 0, 1], ['EL', 10], 'oel'],
  ['leinoel', 'Leinöl', 'Fette & Sonstiges', [884, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53, 0, 0, 0, 0, 0], ['EL', 10], 'oel omega'],
  ['kokosmilch', 'Kokosmilch (Dose)', 'Fette & Sonstiges', [197, 2, 2.8, 21, 0, 2, 0, 0, 0, 1.6, 0.6, 18, 1, 6, 0, 0, 46, 14, 1, 220], ['Dose', 400], ''],
  ['jodsalz', 'Jodsalz', 'Fette & Sonstiges', [0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 2000, 0, 0, 0, 0, 0, 0, 0], ['Prise', 1], 'salz'],
  ['sojasauce', 'Sojasauce', 'Fette & Sonstiges', [53, 8, 5, 0.6, 0.8, 0.4, 14.5, 0, 0, 1.5, 0.4, 33, 1, 0.8, 0, 0.15, 40, 18, 0, 435], ['EL', 15], 'tamari'],
  ['hefeflocken', 'Hefeflocken', 'Fette & Sonstiges', [350, 50, 15, 5, 20, 0, 0.1, 0, 0, 3, 8, 20, 1, 10, 0, 3, 150, 1500, 0, 1800], ['EL', 5], 'nährhefe'],
  ['kakao', 'Kakaopulver, entölt', 'Fette & Sonstiges', [350, 20, 12, 21, 30, 1, 0.05, 0, 0, 13.9, 6.8, 128, 2, 14, 0.03, 0.24, 499, 32, 0, 1524], ['TL', 5], ''],
  ['zartbitter', 'Zartbitterschokolade 70 %', 'Fette & Sonstiges', [598, 7.8, 35, 43, 10.9, 24, 0.03, 0, 0, 11.9, 3.3, 73, 2, 6.8, 0.04, 0.08, 228, 12, 0, 715], ['Rippe', 10], 'schokolade'],
  ['ahornsirup', 'Ahornsirup', 'Fette & Sonstiges', [260, 0, 67, 0, 0, 60, 0.02, 0, 0, 0.1, 1.5, 102, 0, 0.6, 0, 1.27, 21, 0, 0, 212], ['EL', 20], 'sirup'],
];

export const BASE_FOODS = {};
for (const [id, name, cat, vals, unit, alias] of ROWS) {
  const per100 = {};
  FIELDS.forEach((k, i) => { per100[k] = vals[i]; });
  BASE_FOODS['b:' + id] = {
    id: 'b:' + id,
    name,
    cat,
    source: 'base',
    vegan: true,
    per100,
    unit: unit ? { label: unit[0], g: unit[1] } : null,
    alias: alias || '',
  };
}
