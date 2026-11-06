# Anatomische Ansicht – Entwurf v1 (Claude Design)

Rückgabe von Claude Design vom 25.09.2026 auf unsere Übergabe (Auftrag und
14 Aufnahmen des Stands 4.3.0; nicht versioniert).

- `RUECKGABE.md` – Auftrag an Claude Code, Reihenfolge, offene Punkte, Abnahme
- `UEBERGABE.md` – alle Werte: Farben, Strichstärken, Abstände, Aufbau
- `bilder/1a-arbeitsansicht.png`, `bilder/1h-legende.png` – zwei der
  Zeichenflächen (das ganze Paket mit allen Bildern und den Referenzdateien lag
  als `docs/Anatomical handover files.zip` bei)

**Die Zähne im Entwurf sind Platzhalter.** Übernommen werden Bühne,
Befundebenen, Zeichen, Farben und Bedienung – die gezeichneten Zähne bleiben.

## Umsetzung

Als Einstellung *Anatomische Darstellung: Klassisch | Entwurf v1* (Settings →
Zahndetails), Standard Klassisch, jederzeit zurückschaltbar – Dirk,
26.09.2026: „wenn wir nicht kaputt machen“. Alles hängt an der Klasse
`odon-style-v1` auf `#toothGrid` und an `DRAFT_V1_PALETTE`.

| Stufe | Inhalt | Stand |
|---|---|---|
| 1 | Palette, Signale (Rot nur Karies, Entzündung orange, Extraktion Tusche), entsättigte Gingiva/Knochen/Pulpa, Kacheln ohne Rahmen, dunkles Thema | 4.4.0 |
| 2 | Skalierung mit der Fensterbreite | offen |
| 3 | Zeichenzeile (Lockerung, Ex, Kürzel-Pille), Auswahl über den Kiefer, Randspalt als Keil, Metallrand der VMK | offen |
| 4 | Planmodus (Bestand 36 %, Ex-Plakette), feine Schraffur für Mitgebrachtes | offen |
| 5 | Anzeige-Kontrollkästchen, Kopfzeile des Docks | offen |
| 6 | Detailblatt „Alle Optionen“ | eigenes Vorhaben |

Nicht übernommen, weil fachlich zu entscheiden oder gegen feste Regeln:

- Kopfzeile mit Patientendaten – gehört ins einbindende Programm.
- Rückfrage im Planmodus nur als Hinweis – ändert die Logik (DS-1), nicht nur
  das Aussehen; Dirks Entscheidung steht aus.
- Spalte schrumpft bei geschlossener Lücke – bricht „Spalte = Zahn + 6“.
