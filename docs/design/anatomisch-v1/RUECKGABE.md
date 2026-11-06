# Rückgabe · anatomische Ansicht · Entwurf v1

Von Claude Design an Claude Code · 25.09.2026 · **nicht freigegeben**

## Auftrag

Im Odontogramm den Entwurf als **dritte Variante** der anatomischen Ansicht einbauen, neben den beiden vorhandenen. Er soll nichts ersetzen.

- Die vorhandenen Varianten bleiben unverändert. Die bisherige Voreinstellung bleibt der Standard.
- Die Variante erscheint in derselben Auswahl wie die bestehenden, als `Entwurf v1`. Speichern je Benutzer.
- Alles Neue gilt nur in dieser Variante: Bühne, Befundfarben, Zeichen, Kopfzeile, Kartenkopf, Dock, Detailblatt, dunkles Thema.
- Die Zahnzeichnungen bleiben dieselben. Die Platzhalterzähne im Entwurf werden **nicht** übernommen.
- Die Materialfarben je Praxis bleiben erhalten. Die neue Standardpalette gilt nur dort, wo die Praxis nichts eingestellt hat.

## Inhalt

- `UEBERGABE.md`: alle Werte (Farben, Strichstärken, Abstände, Aufbau)
- `bilder/`: Zeichenflächen 1a–1i als PNG in 2×
- `referenz/`: Entwurfsdateien zum Öffnen im Browser (`Odontogramm Anatomisch.dc.html`); Umschalter für Kacheln A/B, Palette und Pulpa

## Reihenfolge

1. Dritte Variante in der vorhandenen Auswahl anlegen, zunächst mit dem Inhalt der Standardvariante
2. Bühne: SVG-viewBox, Skalierung, Zeichenzeile, Auswahl, Leerstellen
3. Befundebenen: Palette, drei Zustände, Signale, Zeichen
4. Bedienung: Kopfzeile, Kartenkopf, Kürzelpuffer am Zahn, Dock, Detailblatt
5. Dunkles Thema

## Noch offen, bitte nicht festlegen

- Pulpa standardmäßig an oder aus: zunächst an, als Anzeige-Schalter
- Kacheln A oder B: A bauen, B als interne Option
- Arabisch (RTL): Kopf, Dock und Detailblatt spiegeln, das Gebiss bleibt links→rechts

## Abnahme

- Die beiden vorhandenen Varianten sehen aus wie vorher (Vergleich mit den Bildern aus `uploads/uebergabe-anatomisch/bilder/`)
- In der dritten Variante entsprechen 1a–1f den Bildern, abgesehen von den echten Zähnen
- Tastatur: Tab 18→28, 38→48, die Kürzel funktionieren in allen Varianten unverändert
