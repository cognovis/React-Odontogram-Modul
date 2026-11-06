# Odontogramm – anatomische Ansicht · Entwurf

Übergabe von Claude Design an Claude Code · 25.09.2026
Referenz: `Odontogramm Anatomisch.dc.html` (Zeichenflächen 1a–1i), Bilder in `bilder/`.

**Wichtig:** Die Zähne in den Entwürfen sind vereinfachte Platzhalter (Rechtecke/Wurzelkeile in echten Zahnbreiten). In der Umsetzung bleiben die Originalzeichnungen. Übernommen werden Bühne, Befundebenen, Zeichen, Farben und Bedienung.

## Zeichenflächen

- 1a Arbeitsansicht 1512 × 860, Zahn 46 gewählt, Kürzel „Kst“ getippt
- 1b „Alle Optionen“ als Detailblatt rechts (ersetzt Kartenstapel und klassische Seitenleiste)
- 1c Plan A Implantat · 1d Plan B Brücke 45–47 (Spanne)
- 1e Mitgebracht (neu nur Goldkrone 14, Füllung 33)
- 1f Dunkles Thema
- 1g Kacheln A (ohne Rahmen, empfohlen) / B (leise Flächen)
- 1h Befund-Legende: Palette, drei Zustände, Befunde, Zeichen, Leerstellen
- 1i Werte (dieselben wie unten)

## A · Bühne

- Bleibt fest: 4 Reihen, FDI, Spalte = Zahn + 6, Kontakt 10, Eckzahnverzahnung. Mittellinie = ein Kontakt (10), beide Kiefer von der Mitte aus gelegt.
- Ganzes Gebiss als **ein SVG mit viewBox**, Breite 100 %. Basismaß 6 Einheiten/mm → ≈ 1040 × 574 Einheiten.
- Skalierung: `breite = min(verfügbare Breite, verfügbare Höhe × 1,81)`. Bei 1512 × 860 ≈ 960 px (heute ~650), bei 1920 × 1080 ≈ 1300 px. Schrift, Strich und Zeichen skalieren mit; Nummern nie unter 11 px Bildschirm.
- Vertikale Aufteilung (Einheiten): Nummern 0–20 · OK-Seite 22–192 (Schmelz-Zement-Grenze y 130) · Zeichenzeile 196–212 · OK-Aufsicht 216–272 · Okklusionsspalt 12 · UK-Aufsicht 288–344 · Zeichenzeile 348–364 · UK-Seite 372–548 (SZG y 434) · Nummern 552–574.
- **Zeichenzeile** (neu, 16 hoch) zwischen Seitenansicht und Aufsicht je Kiefer: Lockerungsplakette, Plan-„Ex“, Kürzelpuffer. Nichts davon liegt mehr auf dem Zahn.
- Kacheln: Variante A ohne Rahmen. Knochen- (y 44–128 / 440–524) und Gingivaband (19 hoch, r 6) laufen durchgehend. Variante B: randlose Fläche je Zahnansicht `#f6f5f1`, r 8.
- Auswahl: eine Fläche über alle Reihen des Kiefers (OK y 20–276, UK 284–552), r 9, Tusche 1,5 + Füllung Tusche 4,5 % (dunkel 7 %). Spanne = eine durchgehende Fläche. Nummer als Pille (26 × 16, r 8, Tusche, Text weiß).
- Leerstellen:
  - fehlt: kurzer Strich (40 % Zahnbreite, 1,6, `#9a9ea6`) in Kronenhöhe + gepunkteter Umriss in der Aufsicht (1, 2/3); Nummer leise.
  - nicht durchgebrochen: Zahn um 46 Einheiten in den Knochen versetzt, gestrichelt 3/2,5, Deckkraft 60 %, Aufsicht gepunktet.
  - Lücke geschlossen: Spalte schrumpft auf 16, Doppelstrich (Abstand 6, 1,4), Nummer 9 px leise.

## B · Befunde

### Materialien (Standard; je Praxis weiter einstellbar)

| Material | Kürzel | Füllung | Kontur | Verwendung |
|---|---|---|---|---|
| Komposit | Kst | `#8fb0dc` | `#4f78ad` | Füllung |
| GIZ | GIZ | `#c1b1e0` | `#7f68b8` | Füllung |
| Amalgam | Am | `#666d77` | `#3f454d` | Füllung |
| Gold | Go | `#dca72a` | `#9c730c` | Füllung, Inlay, Krone |
| Keramik (e.max) | Ker | `#f0e2c6` | `#b39a6c` | Krone, Veneer, Inlay |
| Zirkon | Zr | `#ddecf3` | `#7c9db1` | Krone, Brücke |
| Metallkeramik | VMK | `#ece0c8` | `#8b9098` | + zervikaler Metallrand `#666d77`, 3,5 |
| NEM | NEM | `#a3abb5` | `#646c77` | Krone, Brücke, Geschiebe |
| Provisorium | Pro | `#f2c9a0` | `#bf8a57` | Krone, Brücke |
| Teleskop | Tel | `#dca72a` | `#9c730c` | + Innenkontur 1, Einzug 4 |

- Kein Grün, kein Rot, kein Verlauf. Metallkeramik ist kein Wärmekarten-Verlauf mehr.
- Schema-Bezug: Schalter „einheitlich wie Schema B“ färbt alle Materialien `#aab8ca` / Kontur `#7d8ca1`, Karies bleibt `#d32f2f`. Formen und Zeichen sind in beiden Modi gleich.

### Drei Zustände (Füllfarbe bleibt immer voll)

| Zustand | Kontur | Überlagerung |
|---|---|---|
| vorhanden | Materialkontur 1,2 solid | – |
| mitgebracht | Materialkontur 1,2 solid | Schraffur 45°, Linie 1,4, Raster 5, Farbe Karte (`#fff` / `#1a1d21`) 80 % |
| geplant | Planblau `#2563eb` 2,0, Strich 4/2,5 | – ; Nummer mit Planpunkt r 2,8 |

- Planmodus: Bestand auf 36 % Deckkraft, Geplantes voll. Zu extrahierender Zahn wird Geist (30 %, gestrichelt), **kein Kreuz über dem Ersatz**; stattdessen Plakette „Ex“ in der Zeichenzeile (Planblau, gestrichelt 3/2).
- Status mit vorhandenem Plan: Planpunkt an der Nummer. Die Rückfrage (Bild 15) wird zum Hinweis im Dock („in Plan A und B verplant – Änderung weicht vom Plan ab“), kein Modal.

### Signale (hell / dunkel)

| Bedeutung | hell | dunkel | Form |
|---|---|---|---|
| Karies | `#d32f2f` | `#ff5147` | Fläche (Aufsicht), Anschnitt Kreis r = 12 % Zahnbreite, tief 18 % |
| Extraktion | `#1d2127` | `#f1eee8` | Kreuz 2,6 round, Seite + Aufsicht |
| Entzündung | `#e8781e` | `#ff9a3d` | Ring 2,2 + Füllung 14 % (apikal r 10, periimplantär Rahmen r 9) |
| Plan | `#2563eb` | `#6ea0ff` | Kontur 2 gestrichelt, Ex-Plakette, Punkt |
| Auswahl | Tusche | Tusche hell | Spaltenfläche 1,5 |

Rot ausschließlich für Karies. Gingiva und Pulpa werden entsättigt (siehe Werte), damit sie nicht als Signal gelesen werden.

### Zeichen (eigene Ebene, Tusche)

- Lockerung I–III: Plakette 26 × 16, r 8, Kontur 1,3, römische Ziffer 10/700, in der Zeichenzeile.
- Randspalt: gefüllter Keil 8 × 15 an der zervikalen Kronenkante (m oder d). Ersetzt die lila Linie.
- Klammer: Bügel 2,0 in 55 % Kronenhöhe, 4 über die Kontur hinaus, Enden 7.
- Geschiebe: Quadrat 9 × 9, Kontur 1,6, an der distalen Kante.
- Steg: Balken 6 hoch, r 2, zwischen den Zahnmitten, direkt unter der Krone.
- Brückenverbinder: 12 hoch (Seite), 10 (Aufsicht), r 3, in Materialfarbe und Zustand der Brücke.
- Papillenverlust: kleiner gefüllter Keil 10 × 11 am Gingivarand, interdental.
- Fraktur: Zickzack 1,8 über die Krone.
- Wurzelfüllung: 3,4 `#2b3440`, unvollständig bis halbe Wurzellänge; Stift 5,2 × 54 `#8b95a2`.

## C · Bedienung

- **Kopfzeile 52**: Patient, Alter, Pat.-Nr., Befunddatum links · Ansichten Anatomisch / Schema / Parodontal / KFO als Segment · Sprache, Thema, Export als Textknöpfe. Keine Entwicklerzeile.
- **Kartenkopf 52**: Status | Plan (Plan aktiv = Planblau). Im Plan: Alternativen als Reiter „A Implantat“, „B Brücke 45–47“, „+ Alternative“, dazu Mini-Legende. Rechts „Anzeige“ mit beschrifteten Kontrollkästchen (Aufsicht, 8er, Knochen & Gingiva, Pulpa, Basis) statt lila Symbolen.
- **Kürzelpuffer**: nur noch an einer Stelle – als Pille am gewählten Zahn in der Zeichenzeile (Tusche, Mono 12/600, Cursor, Vorschau „Komposit“ 10,5 / 72 %). Die passende Taste im Dock bekommt Kontur + Ring 2. Keine zweite Anzeige.
- **Dock ≈ 158**: Kopfzeile mit Zahn (16/700), Lage, aktuellen Befunden als Chips, Planhinweis, Tastaturhilfe (Tab, ⏎, Esc), „Alle Optionen ›“. Darunter 5 Spalten à 2 Gruppen: Befund · Durchbruch/Gebiss | Restauration · Material (mit Farbfeld) | Flächen · Karies | Endo · Apikal | Retention · Vitalität. Taste 26 hoch, min. 26 breit, r 6. An = Tusche gefüllt.
- **Alle Optionen**: Detailblatt 392 breit rechts über der Bühne (Bühne rückt nach links, Dock bleibt sichtbar). Suche „/“, Abschnitte aufklappbar (Zahn, Krone & Restauration, Karies offen; Endo & Wurzel, Parodont, KFO, Produkt zu, mit Füllstand). Ersetzt den 3500-px-Kartenstapel und die klassische Seitenleiste.
- Tab-Reihenfolge unverändert 18→28, 38→48.

## D · Dunkles Thema

| Rolle | Wert |
|---|---|
| Seite / Karte / Dock | `#121417` / `#1a1d21` / `#16191c` |
| Linie / Linie stark | `#2a2e34` / `#3a3f47` |
| Text / leise | `#eceae5` / `#9197a0` |
| Zahnkörper / Kontur | `#cdc7bc` / `#8a8479` (gedämpft, blendet nicht) |
| Knochen / Gingiva / Pulpa | `#28251f` / `#4a3538` / `#a4706a` |
| Implantat / Kontur | `#8e97a3` / `#d0d6de` |
| Schraffur | `#1a1d21` (dunkle Linien auf hellem Material) |

Fehlende Zähne bleiben leer (keine grauen Blöcke). Materialfarben wie hell.

## UI hell

Seite `#f3f2ee` · Karte `#ffffff` · Dock `#fbfaf8` · Linie `#e7e4de` / `#d6d2ca` · Text `#1d2127` / `#6b7079` · Fläche `#f1efeb`. Schrift IBM Plex Sans, Kürzel IBM Plex Mono.

## Offen

- Pulpa standardmäßig an oder aus? (Tweak in der Referenz.)
- Kacheln A oder B – A empfohlen, B für Tablet denkbar.
- Arabisch: Kopf, Dock und Detailblatt spiegeln; Bühne bleibt links→rechts.
