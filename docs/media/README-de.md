# 🦷 React Advanced Odontogram

[![Download](https://img.shields.io/badge/Download-React--Odontogram--Modul-blue?style=for-the-badge&logo=github)](https://github.com/ZoliQua/React-Odontogram-Modul/releases)
[![Version](https://img.shields.io/badge/version-5.2.6-green?style=for-the-badge)](https://github.com/ZoliQua/React-Odontogram-Modul)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](https://github.com/ZoliQua/React-Odontogram-Modul/blob/main/LICENSE)
[![DOI](../src/assets/zenodo.21156787.svg)](https://doi.org/10.5281/zenodo.21156787)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

> 🌐 **Languages:**  🇬🇧 [English](README-en.md) | 🇪🇸 [Español](README-es.md) | 🇩🇪 [Deutsch](README-de.md) | 🇭🇺 [Magyar](README-hu.md) | 🇮🇹 [Italiano](README-it.md) | 🇸🇰 [Slovenčina](README-sk.md) | 🇵🇱 [Polski](README-pl.md) | 🇷🇺 [Русский](README-ru.md) | 🇧🇷 [Português (BR)](README-pt-br.md) | 🇸🇦 [العربية](README-ar.md) | 🇨🇳 [简体中文](README-zh.md) | 🇫🇷 [Français](README-fr.md)

---

## 🇩🇪 Deutsch

*(Deutsche Version des README — übersetzt aus der englischen Ausgangsversion, Stand v1.49.0)*

### 📋 Übersicht
Dieses Projekt ist ein interaktiver, browserbasierter Odontogramm-Editor, der eine schnelle Zahnstatuserfassung mit einer übersichtlichen Benutzeroberfläche unterstützt. Es rendert geschichtete SVG-Zahnvorlagen zur Darstellung von Restaurationen, Karies, endodontischem Status, Mobilität und anderen klinischen Details, und bietet Mehrfachauswahl, Auswahlfilter und vordefinierte Statusvorlagen. Jede Zahnposition hat ihre eigene Zeichnung — sechzehn bleibende Seitenansichten, zwanzig Kauflächenansichten und das Milchgebiss — und die Draufsicht auf die Frontzähne macht einen palatinalen Befund am Schneidezahn überhaupt erst befundbar, den die Seitenansicht nicht zeigen kann.

---
![Odontogram – Vorschau (Deutsch)](screenshot_de_odontogram.png)

🔗 **Test URL:** https://react-odontogram-modul.vercel.app/

---

### 📦 Als npm-Paket verwenden

Das Odontogramm wird als eigenständige React-Komponentenbibliothek auf npm veröffentlicht:
`@cognovis/react-odontogram`.

#### Voraussetzungen
- **React 18 oder 19** (als Peer-Dependency deklariert — wird von Ihrer App bereitgestellt).
- Ein **Bundler**, der das `exports`-Feld und ESM versteht: Vite, webpack 5, Next.js, Rollup, esbuild, Parcel. Das Paket ist **nur ESM**.
- Node **≥ 18** für das Tooling.

#### Installation

```bash
echo "@cognovis:registry=https://npm.cognovis.de" >> .npmrc
bun add @cognovis/react-odontogram @cognovis/fhir-sdk react react-dom
```

#### Grundlegende Verwendung

Rendern Sie `OdontogramShell` und importieren Sie das Stylesheet **einmal** irgendwo in Ihrer App:

```tsx
import { OdontogramShell } from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";

export function Chart() {
  return (
    <OdontogramShell
      language="de"          // hu | en | de | es | it | sk | pl | ru | pt-br | ar | zh | fr
      numberingSystem="FDI"  // FDI | Universal | Palmer
      darkMode={false}
    />
  );
}
```

#### Komponenten-Props

`OdontogramShell` ist eine kontrollierte Komponente. Die gebräuchlichsten Props:

| Prop | Typ | Standard | Beschreibung |
|------|------|---------|-------------|
| `language` | `Language` | `"hu"` | UI-Sprache (`hu`/`en`/`de`/`es`/`it`/`sk`/`pl`/`ru`/`pt-br`/`ar`/`zh`). |
| `numberingSystem` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` | Zahnnummerierungssystem. |
| `darkMode` | `boolean` | `false` | Umschalter für dunkles Design. |
| `readOnly` | `boolean` | `false` | Deaktiviert jegliche Bearbeitung (nur Ansicht). |
| `themeConfig` | `OdontogramThemeConfig` | — | Überschreibt Theme-CSS-Variablen (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | — | Registriert benutzerdefinierte Zustands-Plugins / zusätzliche Ebenen. |
| `enableNotes` | `boolean` | `false` | Aktiviert Notizen pro Zahn. |
| `enableIcdas` | `boolean` | `false` | Aktiviert ICDAS-II-Kariesbewertung. |
| `onLanguageChange` / `onNumberingChange` / `onDarkModeChange` | `(value) => void` | — | Wird ausgelöst, wenn der Benutzer die Einstellung über die UI ändert. |

Feiner granulare Detailstufen-Props (`pulpDetailLevel`, `secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`, `wearDetailLevel`, `discolorationDetailLevel`, `surfaceNotation`, `showStatusCard`, `showOrthoCard`) werden ebenfalls akzeptiert — die vollständige, typisierte Liste finden Sie in den mitgelieferten `.d.ts`-Typen.

#### Öffentliche API (benannte Exporte)

`OdontogramShell` ist sowohl der Standardexport als auch ein benannter Export. Die imperative Zustands-API, die eigenständige `PerioChart`-Komponente, die geführte Tour und alle öffentlichen Typen sind benannte Exporte desselben Einstiegspunkts:

```ts
import {
  OdontogramShell,           // auch der Standardexport
  PerioChart,                // eigenständige Parodontalstatus-Komponente
  // Zustand lesen
  getOdontogramSummary,
  getToothStateSummary,
  onStateChange,             // Zustandsänderungen abonnieren
  // Export / Import
  exportSvg, exportImage,    // Vektor-/Raster-Befundexport
  // Steuerung
  setReadOnly, getReadOnly,
  clearSelection,
  registerPlugins, setPluginState, getPluginState,
  startIntroTour,            // startet die Einführungstour
  // …und viele weitere setX/getX-Einstellungsfunktionen
} from "@cognovis/react-odontogram";
```

Die vollständige Oberfläche (≈ 44 Funktionen + Typen wie `OdontogramSummary`, `OdontogramThemeConfig`, `OdontogramPlugin`, `PerioViewMode`, …) ist in den mitgelieferten Deklarationen vollständig typisiert.

#### Verwendung mit Next.js (App Router)

Die Komponente ist nur clientseitig, rendern Sie sie daher aus einer Client-Komponente:

```tsx
"use client";
import { OdontogramShell } from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";

export default function OdontogramClient() {
  return <OdontogramShell language="de" numberingSystem="FDI" />;
}
```

Oder laden Sie sie mit einem rein clientseitigen dynamischen Import: `dynamic(() => import("./OdontogramClient"), { ssr: false })`.

#### Wichtige Hinweise & aktuelle Einschränkungen
- **Nur ESM** — das Paket veröffentlicht einen Haupt-ES-Modul-Einstieg (`dist/odontogram.js`), jeweils mit Typdeklarationen (`dist/index.d.ts`). Es zielt auf die Bundler-Modulauflösung ab; es gibt keinen CommonJS-Build.
- **Das Stylesheet ist separat** — Sie **müssen** `@cognovis/react-odontogram/style.css` einmal importieren; es wird nicht automatisch eingebunden. Das Styling ist globales CSS, das unter `.odontogram-root` skoped ist und von `--odon-*`-CSS-Variablen gesteuert wird. In der unveröffentlichten Version setzt es nichts auf `:root`, `html` oder `body`: Seitenhintergrund, Schrift und die eigenen Tokens des Hosts bleiben unberührt; Flächen, die an `<body>` angehängt werden (Tour, Popover), tragen `.odontogram-portal`.
- **SSR / nur clientseitig** — die Komponente liest beim Mounten das DOM (`document`), daher muss sie im Browser laufen. Rendern Sie sie in SSR-Frameworks in einer Client-Komponente (`"use client"`) oder über einen rein clientseitigen dynamischen Import.
- **Assets sind eigenständig** — die Zahn- und Icon-SVGs werden zur Build-Zeit in das JavaScript-Bundle eingebettet; es gibt **keinen Laufzeit-Asset-Abruf**, den man konfigurieren müsste, und nichts Zusätzliches, das in Ihren öffentlichen Ordner kopiert werden müsste.
- **Mehrere Instanzen, ein aktiver Editor** — jede eingebundene `<OdontogramShell>` kann ihren eigenen klinischen Zustand über eine isolierte Session halten (`createOdontogramSession()`), und zwei Sessions teilen niemals Daten. Der interaktive DOM-Editor ist weiterhin eine einzige globale Engine, daher steuert sie genau eine eingebundene Instanz: diese rendert das Diagramm, die anderen rendern einen inaktiven Platzhalter und bleiben über ihre Session-API voll les- und schreibbar. Beim Aushängen der aktiven Instanz übernimmt eine wartende.

---

### ✨ Hauptmerkmale
- 🖱️ Schnelle Auswahl und Mehrfachauswahl (CMD/CTRL + Klick)
- 🦷 Zahntypen: bleibend, Milchzahn, Implantat, subgingival, fehlend
- 🍼 Das Milchgebiss hat eine eigene Anatomie: acht erzeugte Vorlagen decken alle zwanzig Milchzähne ab, mit eigenen gemessenen Wurzelanteilen, Längen und Breiten, verhältnismäßig größerer Pulpa und um den bleibenden Zahnkeim gespreizten Wurzeln. Wird ein Zahn als Milchzahn erfasst, tritt die Milchzahnzeichnung an die Stelle der Zeichnung seines Nachfolgers. In FHIR erscheint der Zahn als **51–85**, denn in der FDI-Notation sagt die Nummer selbst, zu welcher Dentition er gehört; beim Import entscheidet sie, und überstimmt wird nur die Anwesenheit
- 🦷 Zahnsubstrat (unabhängig von jeder Restauration): natürlich, Radix (Wurzelrest), frakturiert, für Krone präpariert
- 👑 Restaurationen nach Typ × Material: Krone / Inlay / Onlay / Veneer / Brücke in e.max, Gold, Gradia, Zirkon, Metall, Metallkeramik, Teleskop oder provisorisch (Onlay nur okklusale Ansicht) — Auswahl über einen einzigen kombinierten „Krone – …"-Picker mit wenigen Klicks; bestehende `metal`-Kronen migrieren zu `metal-ceramic` (Metallkeramik); Implantate verwenden dasselbe Typ-×-Material-Modell, kombiniert mit einer Implantat-Verbinder-Ebene. Der Picker ist nach Zahnart gestaffelt: ein Implantat bietet nur Krone/Brücke (plus die fünf Attachment-Optionen weiter unten); ein fehlender/Lücken-Zahn bietet nur ein Brückenglied (plus herausnehmbare Teil-/Vollprothese); ein `radix`-Substrat blendet die Restaurationssteuerung vollständig aus (an einem Wurzelrest kann keine Restauration angelegt werden)
- 🦿 Herausnehmbare/Abutment-Prothetik auf der eigenen `prosthesis`-Achse („Kivehető:"-Einträge im kombinierten Picker): Implantat-Heilabutment, Locator, Locator mit Suprakonstruktion, Steg, Steg mit Suprakonstruktion; zahngetragene herausnehmbare Teil- oder Vollprothese
- 🌉 Brückenzähne rendern sowohl die Kronenkappe als auch den Sattel-Verbinder; ein Mehrzahn-Brückenspann-Overlay rendert einen durchgehenden, bogenbewussten Verbinder über aufeinanderfolgende Brückenzähne (Glieder + Pfeiler) sowie die dazwischenliegenden Zahnzwischenräume (Ober- und Unterkiefer verwenden gespiegelte Sattelgeometrie, sodass der Verbinder auf beiden Bögen ausgerichtet bleibt), im PNG/JPG/SVG-Export enthalten; das Anwenden einer Brücke über eine Statusvorlage berechnet das Overlay sofort neu
- 🔍 Karieskartierung auf 6 Flächen: mesial, distal, bukkal, lingual, okklusal, subkronal
- 🪥 Füllungsmaterialien pro Fläche: Amalgam, Komposit, GIZ, provisorisch
- 🏥 Ein zusammengeführter „Pulpa-/Endo-Status"-Auswähler (gruppiert: vitale Pulpa vs. behandelt/endodontisch) für medikamentöse, vollständige oder inkomplette Wurzelfüllungen sowie ein eigenständiger Auswähler für das Wurzelstift-Material: endodontische Behandlung und AAE-Pulpadiagnose (`pulpDx`: normal / reversible / irreversible Pulpitis / Nekrose) schließen sich gegenseitig aus — ein wurzelbehandelter Zahn (`endo` gesetzt) kann nicht gleichzeitig eine vitale Pulpadiagnose tragen; bei einer Behandlung wird `pulpDx` auf `normal` normalisiert und das Glyph für die erkrankte Pulpa unterdrückt. Reversible Pulpitis rendert ein reduziertes Pulpa-Glyph. Eine optionale 3-stufige Pulpa-Detailstufe (`pulpDetailLevel`: simple / AAE / praktisches Latein) zeigt über `pulpLatin` 9 praktische lateinische Pulpa-Subtypen an (pulpa sana … gangraena pulpae); Resektion und parapulpaler Stift bleiben eigenständige Sonderindikatoren
- 🦴 Apikale Diagnose (`apicalDx`: symptomatische/asymptomatische apikale Parodontitis, akuter/chronischer apikaler Abszess, kondensierende Osteitis) steuert direkt den periapikalen Glyphen; ein Granulom-/Zysten-Läsionssubtyp-Qualifikator wird nur unter symptomatischer/asymptomatischer apikaler Parodontitis angezeigt (der redundante „Abszess"-Subtyp wurde entfernt — er ist bereits durch die apikale Diagnose abgedeckt)
- 🩹 Zusammengeführte Karte „Wurzel und Parodontium" (ein einzelner ausklappbarer Abschnitt für Wurzel-/periapikale und parodontale Befunde)
- ⚕️ Modifikationen: periapikale Entzündung (nur bei fehlenden/Extraktionsalveolen-Zähnen angezeigt; bei vorhandenen Zähnen ausgeblendet, wo `apicalDx` allein den periapikalen Glyphen steuert, sowie bei Implantaten, wo `periImplant` dies übernimmt), Parodontalerkrankung, Mobilitätsgrade (M1/M2/M3, bei Implantaten ausgeblendet)
- 🦷🔩 Periimplantärer Status (`periImplant`: `none` / `mucositis` / `peri-implantitis-mild` / `peri-implantitis-moderate` / `peri-implantitis-severe`) — Staging nach dem World Workshop 2018, angezeigt als eigener Auswähler bei Implantaten; Mukositis verwendet das parodontale Zahnfleisch-Glyph weiter, Periimplantitis fügt eine abgestufte `peri-implant-bone-loss`-Ebene hinzu (Deckkraft 0,4/0,7/1,0). Implantate rendern das periapikale Läsions-Glyph nicht mehr — ihre Entzündung wird stattdessen über diese Achse ausgedrückt — und die parodontalen Modifikator-Checkboxen sind bei Implantaten ausgeblendet (die behelfsmäßige Umbenennung der „Periimplantitis"-Checkbox entfällt)
- 🏷️ Spezielle Indikatoren: Krone erforderlich, Kronenwechsel erforderlich, geschlossene Lücke nach Extraktion, Extraktionsplan, Fissurenversiegelung, Kontaktpunktverlust
- 👁️ Okklusionsansicht, Weisheitszähne, Knochen- und Pulpa-Sichtbarkeit umschaltbar
- 🔢 12 Auswahlfilter (alle, vorhandene, bleibende, Milch, Implantate, fehlende, Ober-/Unterkiefer, Front/Molaren)
- 📊 Vordefinierte Statusvorlagen (Zurücksetzen, Milchgebiss, Wechselgebiss, zahnlos)
- 📦 34 vordefinierte Restaurationsvorlagen (Brücken, herausnehmbare Prothesen, Stegprothesen mit Implantaten)
- 💾 Status-Export/Import in JSON (Version 2.20; Importe akzeptieren weiterhin die Legacy-Version 1.4 sowie 2.0 bis 2.19 und werden automatisch migriert, mit Plugin Custom States und per-Zahn Notizen)
- 🧭 **Die Kieferorthopädie ist die dritte klinische Ansicht** (`odontogram-c51`): ein Umschalter `Odontogramm | Parodontalstatus | KFO` (`#appViewToggle`) trägt die folgende Karte der Modellauswertung. Das Odontogramm wird dabei nie ausgehängt, nur ausgeblendet — ein Ansichtswechsel kann den Befund also nicht stören. Die KFO-Ansicht hat kein eigenes Dialogfenster und bleibt deshalb auch dort ein Feld des Umschalters, wo der Parodontalstatus als Popup eingestellt ist; dann fällt nur dessen Feld weg.
- 📐 **Modellauswertung** (`odontogram-c51.1`): Tonn und Bolton aus den mesiodistalen Zahnbreiten, mit Soll-SI, Zahnbreitendifferenz und der Angabe, welcher Kiefer den Überschuss trägt. Eingabe wahlweise am Zahnbogen oder als Liste — zwei Ansichten auf denselben Datensatz. Ein Zahn, der nicht auf dem Modell ist (nicht durchgebrochen, verloren, unter der Gingiva), übernimmt die Breite des kontralateralen Zahns, sichtbar als Annahme markiert. Dazu horizontale und vertikale Stufe sowie die dentale Mittellinienverschiebung je Kiefer
- 🔗 Aidbox Dental Core über `@cognovis/fhir-sdk`: Hosts übergeben ein Gateway; die Session lädt und speichert. JSON-Status-Export/Import mit Migrationen
- ✚ Kreuz-/Plus-Oberflächenauswahl (B/M/O/D/L) für Karies und Füllungen
- 🧱 Füllungsmaterialien pro Fläche (gemischte Füllungen, z. B. bukkal Amalgam + distal Komposit)
- 🖼️ PNG/JPG/SVG-Bildexport des Befunds (herunterladbar; PNG/JPG aus Vektor-SVG gerastert)
- 🦷 Karies/Sekundärkaries als Zustandsautomat pro Fläche: eine kariöse Fläche ohne Füllung wird als primäre Karies dargestellt (ICDAS-gestufte Deckkraft); sobald diese Fläche eine Füllung hat, wird sie stattdessen als Sekundärkaries (rezidivierende Karies) dargestellt (`subcaries-{surface}`-Ebene, CARS-bewertet) — beide sind nie gleichzeitig auf derselben Fläche aktiv
- 🎯 Vereinheitlichter Schweregrad pro Fläche (`cariesSeverity`, 0–6, ersetzt die früheren getrennten ICDAS-Tiefe- und CARS-Felder): wird auf einer primären Fläche als ICDAS-Tiefe gelesen, auf einer rezidivierenden Fläche als benannter CARS-Score (Gesund … Ausgedehnte Kavität), über ein kontextabhängiges Popup, das jeweils nur die zum aktuellen Zustand der Fläche passende Skala zeigt
- 🌱 Wurzelkaries (`rootCaries`: none / active / arrested / active-cavitated), steuert die dedizierte Wurzelkaries-Bildebene mit einer vom Schweregrad abhängigen Deckkraft (active 0,5 / arrested 0,7 / active-cavitated volle Deckkraft)
- 🎚️ Drei Karies-Granularitätseinstellungen (`secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`) sowie ein `cariesDepthEnabled`-Umschalter, die jede Skala auf eine einfachere Auswahlansicht reduzieren, ohne den gespeicherten Wert zu verlieren
- 🩹 Sekundärkaries-Zusammenfassung im Füllungspanel: eine Zeile unterhalb der Füllungssteuerung listet jeden ausgewählten Zahn mit Sekundärkaries samt Flächen auf (z. B. „36 (O) hat Sekundärkaries an der Füllung.")
- 🪛 Füllungsdefekte pro Fläche (`fillingDefect`: none / marginal / fracture / wear) an direkten Restaurationen, unabhängig von Sekundärkaries — erfasst über einen Flächenindikator auf der Füllungskarte (analog zum Kariestiefe-Indikator, die Optionsliste vertikal gestapelt), auf dem Befund dargestellt und im Tooltip sowie in der Ganzmund-Füllungszusammenfassung mit einer expliziten Beschriftung angezeigt (z. B. „36 (O) – Füllungsdefekt: O: marginal"), auf dieselbe Weise, wie Sekundärkaries in der Kariologie-Zeile beschriftet wird; die Füllungskarte zeigt außerdem einen Hinweis für jeden ausgewählten Zahn mit erfasstem Füllungsdefekt (z. B. „36 hat einen erfassten Füllungsdefekt."), parallel zum bestehenden Sekundärkaries-Hinweis
- 🔗 Halteelemente, die eine herausnehmbare Prothese an einem natürlichen Zahn halten (`retention`: none / clasp / attachment / bar-abutment, dazu `retentionSide`) — drei Verankerungen, nicht eine Achse: eine **Klammer** braucht nur den vorhandenen Zahn (überkront oder nicht), **Geschiebe** und **Stegpfeiler** brauchen eine Krone, in die sie eingebaut werden. Ein Wert pro Zahn, nie ein Set — die Wahl des einen ersetzt das andere, und Kombinationen, die nicht vorkommen, müssen von keiner Regel verboten werden. Die Klammer wird als Viertelkreis-Arm auf der Krone GEZEICHNET (Bauch zur Gingiva, ein Ende am Kronenäquator, das andere am Interdentalraum, je Kiefer gespiegelt); Geschiebe und Steg tragen charlys eigene Marken `( G )` und `ste`. Die **Steg-Spanne wird abgeleitet**, nie gespeichert — Pfeiler werden über die zahnlose Strecke hinweg verbunden, für die der Steg da ist, und ein Steg darf auf Implantat- und Zahnpfeilern zugleich ruhen
- 🎨 **Restaurationsfarben sind wählbar** (Einstellungen → Farben). Jede Füllfarbe in den Assets ist eine CSS-Variable mit der ausgelieferten Farbe als Rückfall — unkonfiguriert ändert sich nichts, und eine gewählte Farbe schlägt über die Kaskade durch, ohne JavaScript im Renderpfad. e.max und Metall-Keramik malen aus einer Neun-Stopp-Rampe: die Wahl verschiebt den Farbton und ERHÄLT den Helligkeitsverlauf, damit Keramik weiter wie Keramik aussieht. Eine Praxiseinstellung, nicht Teil des Dokuments — ein anderswo geöffneter Fall erscheint in den dortigen Farben (`getRestorationPalette`/`setRestorationPalette` zum Persistieren). Die ausgelieferte Vorgabe für das Provisorium ist eine Zahnfarbe (`#c8b392`, A3 der VITA-classical-Reihe): Weiß war keine Materialfarbe, sondern gar keine — auf weißem Grund blieb vom provisorischen Brückenverbinder nur die Kontur übrig.
- 🔩 Ein **leeres Implantatprodukt ist nur dort eine Lücke, wo die Praxis das Implantat gesetzt hat** (`isImplantProductGap`) — ein mitgebrachtes ist ein vollständiger Datensatz, denn nicht jeder Patient hat einen Implantatpass. Aus dem Erstbefund abgeleitet, nie gespeichert, und stumm, solange kein Befund archiviert ist: ohne Erstbefund gibt es keine Provenienz, gegen die man urteilen könnte.
- 🦷🔻 Zahnhalsbeteiligung einer Füllung oder einer Karies (`cervicalSurfaces`: eine Mengenangabe über die vestibuläre und die orale Fläche) — der Zahnhalsbereich ist **keine** sechste Fläche, sondern eine Markierung an einer bestehenden (BEMA schreibt sie als Suffix „vz"/„lz"), er verändert die Flächenzahl, die eine Positionsstufe liest, also nie (`getFillingSurfaceCount()`); erfasst im selben Flächen-Popup, das Karies- und Füllungskreuz öffnen, an der Flächenzelle mit dem Suffixbuchstaben markiert und im Tooltip sowie in der Ganzmund-Zusammenfassung in der Zeile des Befundes gezeigt, den sie qualifiziert. Bewusst nicht auf dem Befund gezeichnet — die Seitenansicht hat gar keine linguale Ebene, eine für eine Fläche verfügbare und für die andere strukturell unmögliche Markierung läse sich als „keine orale Beteiligung"
- 🦷💥 Zahnabrieb typisiert nach klinischer Ursache und Lokalisation (`wearEdge`: none / attrition / erosion, inzisal/okklusal; `wearCervical`: none / abrasion / abfraction / erosion, zervikal) — ersetzt die beiden Ein-/Aus-Bruxismus-Abrieb-Flags; erfasst über zwei Dropdowns in der Abrieb-Zeile, verwendet die bestehende Abrieb-Grafik weiter und wird im Tooltip sowie in einem neuen Ganzmund-Zusammenfassungsabschnitt „Abrieb" angezeigt
- 🎨 Zahnverfärbung nach Ursache (`discoloration`: none / tetracycline / fluorosis / nonvital / extrinsic / other) bei bleibenden und Milchzähnen — färbt die dargestellte natürliche Zahnkrone in einer repräsentativen Farbe ein, wenn der Zahn keine Restauration und natürliches Substrat hat; wird im Tooltip und in einem neuen Ganzmund-Zusammenfassungsabschnitt „Verfärbung" angezeigt; vervollständigt zusammen mit Füllungsdefekten und Abrieb den Satz an Oberflächen- und Strukturbefunden
- ✏️ Frontzähne (Schneide- und Eckzähne) beschriften ihre Kaufläche in der gesamten Oberfläche (Auswahl, Popup, Zusammenfassungen) als „inzisal"; der gespeicherte Flächenschlüssel bleibt `occlusal`
- 🔤 Positionsbewusste Flächenbezeichnung (Einstellungen → Zahndetails → „Flächenbezeichnung", einfach/vollständig, Standard vollständig): im vollständigen Modus folgen der Kariologie-/Füllungs-Flächenbuchstabe und die -bezeichnung der Zahnanatomie — okklusal → I/inzisal bei Frontzähnen, bukkal → L/labial bei Frontzähnen, lingual → P/palatinal bei Oberkieferzähnen und L/lingual bei Unterkieferzähnen (mesial/distal/subkronal sind nicht betroffen); der einfache Modus verwendet immer den generischen B/M/O/D/L/SC-Satz unabhängig von der Zahnposition. Gilt für die Ganzmund-Zusammenfassung sowie für die Kariologie- und Füllungsdefekt-Flächenauswähler (Buchstabe + Beschriftung); der gespeicherte Flächenschlüssel bleibt unverändert
- 🦷↕️ Kieferorthopädische Erfassung pro Zahn (`orthoAppliance`: none / bracket / band; `orthoDrift`: none / mesial / distal; `orthoVertical`: none / extrusion / intrusion; `orthoRotation`: boolean) an einem vorhandenen natürlichen Zahn (bleibend oder Milchzahn) — verwendet die seit v2.5.0 ungenutzte KFO-Grafik weiter (keine neue SVG); wird auf dem Befund, im Tooltip und in einem neuen Ganzmund-Zusammenfassungsabschnitt „Kieferorthopädie" angezeigt
- 🪨 Zahnstein sowie Wurzelresorption, typisiert als intern oder extern-zervikal (`resorptionType`)
- 📏 Kariestiefe pro Fläche (oberflächlich / Dentin / tief), oder optionales ICDAS-II-Scoring (0–6) via `enableIcdas`
- 🩹 Kronenrand-Undichtigkeits-Umschalter, nur sichtbar bei Kronen- oder Brückenrestauration
- 🧰 Vereinheitlichte Topbar-Icon-Leiste mit einem tabbasierten Einstellungsdialog (Allgemein / Panels / Zahndetails / Karies / Pulpa / Notizen / Parodontal — Nummerierung, Notizen, Panel-Sichtbarkeit, ICDAS, Kariestiefe-Umschalter, Wurzel-/Radiologische-Karies-Granularität, Pulpa-Detailstufe, Zahnabrieb-/Verfärbungs-Detailstufe, Zahninformationen)
- 🗂️ Einstellungen → Tab „Panels": Ganzmund-Zusammenfassungspanels für Status und Kieferorthopädie unabhängig ein-/ausblenden
- 🦷🩺 Einstellungen → Tab „Parodontal": 16 Ein-/Ausblend-Umschalter pro Index für die Zeilen des Parodontalstatus-Charts (gruppiert nach Tasche/Hygiene/Mukogingival/Halt/Periimplantär — PD/GM/CAL/BOP, Plaque, PI, GI, CEJ-Sichtbarkeit, Wurzelkonkavität, KG, GT, Furkation, Mobilität, Miller-Klasse, mPI, mBI), jeweils mit einer Beschreibung, sowie eine Option für übersetzte vs. kanonische Indexnamen-Anzeige (kanonisch = ein fester englisch-lateinischer wissenschaftlicher Name in jeder UI-Sprache; Tooltips bleiben unabhängig von dieser Einstellung stets lokalisiert). Beide sind App-weite Einstellungen (wie `perioViewMode`) — nie Teil des Export-Payloads
- 🩹 Die Sekundärkaries-(CARS-)Einstellungen wurden in den Karies-Tab der Einstellungen zusammengeführt, oberhalb der radiologischen Tiefe positioniert (der separate „Sekundärkaries"-Tab entfällt)
- 🎚️ Zahndetails-Detailstufe (Einstellungen → Zahndetails): eine einfache/komplexe Einstellung für Zahnabrieb und für Verfärbung. Der einfache Modus zeigt pro Befund einen Ja/Nein-Umschalter (Abrieb an → Attrition/Abrasion, Verfärbung an → Sonstige); der komplexe Modus (Standard) behält die Typ-/Ursache-Dropdowns bei, und der gespeicherte Wert bleibt beim Wechsel der Stufe erhalten
- 📋 Zahninformationen-Panel: textuelle Live-Zusammenfassung des gesamten Befunds (Zahnzahlen, vorhandene/fehlende Zähne, Karies inkl. Sekundärkaries, Füllungen, Wurzelbehandlungen, Zahnersatz, Implantate, Parodontalstatus) — standardmäßig sichtbar, in den Einstellungen umschaltbar
- 🗂️ Konsolidiertes Export-Dropdown (Status JSON / PNG / JPG)
- 📥 Import-Dropdown mit FHIR-Import (liest exportierte Bundles zurück)
- ⏳ Fortschrittsanzeige beim Bildexport
- 🎓 12-stufige interaktive Einführungstour
- 🔢 Drei Nummerierungssysteme (FDI, Universal, Palmer)
- 🌐 I18n (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) mit Sprachumschalter (190+ Übersetzungsschlüssel pro Sprache)
- 🌗 Dunkler Modus mit Umschalt-Button (eigenständig oder von der übergeordneten App gesteuert)
- 🎨 Benutzerdefinierte Theme-Konfiguration (`themeConfig`-Prop) mit CSS Custom Properties (`--odon-*`)
- 📱 Mobile Touch-UX: Tap-to-Zoom-Popover, Langes-Drücken-Kontextmenü, Pinch-to-Zoom, WCAG 44px Berührungsziele, Kieferbogen-Umschalter
- 🔌 Benutzerdefiniertes SVG-Plugin-System: visuelle Overlays, per-Zahn Custom State, JSON Export/Import-Unterstützung
- ⚠️ Statusvalidierung mit Warnungen bei inkompatiblen Zahnzustandskombinationen
- 🏷️ Automatische Status-Tooltips auf Zahnkacheln (zeigt alle aktiven Zustände)
- 🩺 Modernisierter Tooltip pro Zahn und Ganzmund-Zusammenfassungspanel: beide zeigen den vollständigen Satz klinischer Befunde (Pulpa-/apikale Diagnose + Läsionssubtyp, Wurzelresorption, periimplantärer Status, abgestufte Wurzelkaries, Zahnstein, Kronenrand-Undichtigkeit, Fraktur, Kontaktverlust, typisierter Kanten-/Zervikalabrieb), mit einem eigenen Abschnitt „Diagnosen" im Panel, einem eigenen Abschnitt „Abrieb" und einem groben Kariesschweregrad-Qualifikator (oberflächlich/mäßig/tief)
- ♿ Tastaturzugänglichkeit (WCAG): ARIA listbox/option Rollen, Enter/Leertaste Auswahl, Pfeiltasten-Navigation, focus-visible Umrisse
- 🔒 Schreibgeschützter Modus: alle Interaktionen deaktivieren für Druck-/Berichtsansichten
- ✨ Auswahl-Animationen: pulsierende gestrichelte Umrandung und leuchtender Schatten auf ausgewählten Zähnen (mit Unterstützung für prefers-reduced-motion)
- 📝 Per-Zahn Notizen: Doppelklick zum Hinzufügen/Bearbeiten, Notiz-Symbol neben der Zahnnummer, Hover-Tooltip mit Notiztext, eine „Individuelle Notizen"-Zeile im Ganzmund-Zusammenfassungspanel, JSON Export/Import
- 🔀 Trennung Status- und Plan-Chart: ein `Status | Plan`-Umschalter im Diagramm-Header wechselt zwischen einem aktuellen **Status**-Chart und einem **Plan**-Chart (beabsichtigte Behandlung), jeweils mit eigenen Zahnzuständen; das Plan-Chart startet beim ersten Wechsel dorthin als Kopie des Status-Charts, und Änderungen in einem Chart wirken sich nie auf das andere aus. Export/Import (`exportStatus`/Datei-Import) beziehen sich immer auf das Status-Chart; das Plan-Chart wird über eine eigene API separat gelesen/geschrieben (siehe Öffentliche API weiter unten) und ist — sofern es vom Status abweicht — als zusätzlicher `plan`-Abschnitt im JSON-Export enthalten
- 📝 „Was ändert sich"-Box: sobald sich der Plan vom aktuellen Status unterscheidet, listet eine Box unterhalb des Zahninformationen-Panels jede Abweichung pro Zahn und pro Behandlungsachse (Vorhandensein, Substrat, Restauration, Prothetik, geplante Krone, Kieferorthopädie, Pulpa/Endo, apikal) als `Zahn: Achse  von → nach`-Zeile auf; auch programmatisch über `getPlanChanges()` verfügbar

![Parodontalstatus-Chart (Deutsch)](screenshot_de_perio.png)

- 🅿️ Vorschlags-Darstellung: im Plan-Modus rendern Befunde, die der Plan **gegenüber** dem aktuellen Status **hinzufügt** (geplante Krone, Extraktion, kieferorthopädische Bewegung, Prothetik, …) mit einer unterscheidbaren **gestrichelten, eingefärbten „Vorschlags"-Umrandung**, damit der Plan als Absicht und nicht als Tatsache gelesen wird — mit einer „gestrichelt = vorgeschlagen"-Legende in der Diagramm-Karte. Die Darstellung im Status-Modus ist byte-identisch; die Behandlung existiert nur im Plan und wird beim Zurückwechseln vollständig zurückgesetzt
- 🚦 Plan-Modus-Gating: das Plan-Chart zeigt nur, was ein Zahnarzt *tun* kann — der Basis-Auswähler bietet nur Fehlend / Bleibend / Implantat, und reine Statusbefunde (Karies, Zahnabrieb, Verfärbung sowie der gesamte parodontale Block — Mobilität, sechs-Punkte-Sondierungsraster, Entzündungs-/parodontale Modifikatoren, Zahnstein, periimplantärer Status) sind ausgeblendet; die Pulpa-/Endo-Steuerung behält die endodontische **Behandlung** (Wurzelkanal / Stift / Wurzelspitzenresektion / parapulpaler Stift) bei, während die Pulpa-/apikale **Diagnose** und die Wurzelresorption ausgeblendet werden. Restauration, Prothetik, Kieferorthopädie, Kronenbedarf/-wechsel und Extraktionsplan bleiben weiterhin planbar
- 🧪 1746 automatisierte Tests bestanden (1 zusätzlicher Test übersprungen) (Vitest) in 164 Testdateien (165 insgesamt) für Nummerierung, Übersetzungen, Vorlagen, i18n, App-Komponente, Theme, Touch, Plugins, Barrierefreiheit sowie Parität der klinischen Diagnose-/Befund-Achsen
- 📖 TypeDoc API-Dokumentation mit JSDoc-Kommentaren für alle öffentlichen Exporte (`bun run docs`)

### 📦 Module
- 🦷 Odontogramm-Raster und Zahngitter-UI
- 🎛️ Steuerung und Statuspanel
- 🎨 SVG-Schichtungsmotor und Vorlagen
- 🔢 Zahnnummerierung und Beschriftung (FDI/Universal/Palmer)
- 🌐 Lokalisierung (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- 💾 Status-Export/Import
- 📋 Status-Extras: vordefinierte Restaurationsvorlagen
- 🎨 Theme-Konfiguration: anpassbare Farbpalette über `--odon-*` CSS-Eigenschaften
- 📱 Mobile Touch-Interaktionen (Tap-to-Zoom, Langes Drücken, Pinch-to-Zoom, Kieferbogen-Umschalter)
- 🔌 Benutzerdefiniertes SVG-Plugin-System
- ⚠️ Statusvalidierung und Tooltip-System
- ♿ Tastaturzugänglichkeit und ARIA-Unterstützung
- 🔒 Schreibgeschützter Modus
- ✨ Auswahl-Animationen
- 📝 Per-Zahn Notizen
- 🧪 Automatisierte Testsuite (Vitest + Testing Library)

### 🛠️ UI-Steuerung

**🔝 Kopfleiste:**
- Sprachumschalter (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR Dropdown)
- Dunkelmodus-Umschalter (Sonnen-/Mond-Symbol, wechselt zwischen hellem und dunklem Thema)
- Nummerierungssystem-Umschalter (FDI/Universal/Palmer Dropdown)
- Status exportieren / Status importieren Buttons

**📊 Diagramm-Kopfzeile:**
- Okklusionsansicht-Umschalter
- Weisheitszahn-Sichtbarkeit-Umschalter
- Knochen-Sichtbarkeit-Umschalter
- Pulpa-Sichtbarkeit-Umschalter
- Auswahl löschen Button

**🔍 Auswahlfilter:**
- Alle auswählen / Alle vorhandenen / Bleibende / Milch / Implantate / Alle fehlenden
- Oberkiefer / Oberkiefer Front 6 / Oberkiefer Molaren
- Unterkiefer / Unterkiefer Front 6 / Unterkiefer Molaren

**📋 Statusvorlagen:**
- Alles zurücksetzen (Mund zurücksetzen)
- Milchgebiss
- Wechselgebiss
- Zahnlos-Umschalter

**📦 Status-Extras Dropdown:**
- Obere/Untere Zirkon-Brücken (12-22, 13-23, 16-26, Vollbogen)
- Obere/Untere Metall-Brücken (12-22, 13-23, 16-26, Vollbogen)
- Obere/Untere Teilprothesen
- Obere/Untere Totalprothesen
- Obere/Untere Stegprothesen mit Implantaten

**🦷 Zahn-Editor-Panel** (für den/die ausgewählten Zahn/Zähne, in ausklappbare Karten gruppiert):
- **Basis-Zeile:** Zahnauswahl (Basistyp inkl. Varianten mit gebrochener Krone) und Zahnsubstrat (natürlich/Radix/frakturiert/crownprep)
- **Restaurations-Zeile:** das kombinierte Restaurations-Dropdown, nach Art gruppiert (Krone / Brücke / Inlay / Onlay / Veneer / „Kivehető:"), wobei jede Zeile ihre Art und ihr Material selbst nennt (feste `restorationType`×`restorationMaterial`-Optionen plus die `prosthesis`-Attachment-/Herausnehmbar-Optionen, gestaffelt nach Zahnart); Kronenrand-Undichtigkeits-Checkbox (nur Krone/Brücke); Checkboxen für die Lage der gebrochenen Krone; Umschalter „Krone erforderlich"/„Kronenwechsel erforderlich"
- **Abrieb- und Verfärbungs-Zeile:** Dropdown für inzisalen/okklusalen Abriebtyp, Dropdown für zervikalen Abriebtyp, Dropdown für Verfärbungsursache (jedes wechselt unter Einstellungen → Zahndetails → einfacher Modus zu einem einfachen Ja/Nein-Umschalter)
- **Kieferorthopädie-Karte:** Apparatur, mesiale/distale Drift, vertikale Bewegung (Extrusion/Intrusion), Rotations-Umschalter — angezeigt bei einem vorhandenen natürlichen Zahn
- **Karies-Karte:** Dropdown für den Kariestiefe-Modus, Subkronal-Karies-Checkbox, Dropdown für den Wurzelkaries-Schweregrad sowie der B/M/O/D/L-Flächenauswähler für Karies mit einem kontextabhängigen ICDAS-Tiefe-/CARS-Popup und einem Badge für die radiologische Tiefe
- **Füllungen-Karte:** Dropdown für das Füllungsmaterial, Flächenauswähler für Füllungen (mit Material pro Fläche), Flächenindikator für Füllungsdefekte (marginal/Fraktur/Abrieb), Hinweise zu Sekundärkaries und Füllungsdefekten
- **Wurzel-und-Parodontium-Karte:** zusammengeführter „Pulpa-/Endo-Status"-Auswähler, eigenständiger Auswähler für das Wurzelstift-Material, Auswähler für apikale Diagnose, Auswähler für periapikalen Läsionssubtyp (nur symptomatische/asymptomatische apikale Parodontitis), Auswähler für den Wurzelresorptionstyp, Auswähler für den Mobilitätsgrad, Auswähler für den periimplantären Status (nur Implantate)
- **Spezielle Indikatoren:** Extraktionsplan/-wunde, Lücke geschlossen, Fissurenversiegelung, Kontaktpunktverlust, Zahnstein, parapulpaler Stift, Endo-Resektion, Brückenpfeiler

### ⌨️ Befundeingabe über Kürzel

Befunde werden im Sekundentakt aufgenommen, oft diktiert. Bei 46 Achsen und 129 Werten ist die
Zahl der Klickwege der eigentliche Engpass, deshalb lässt sich der Befund so eingeben, wie man
ohnehin tippt (`odontogram-t8y`):

```
13–23 markieren   über die Zähne ziehen, Umschalt+Pfeil oder Umschalt+Klick
E                 Materialmodus: Keramik — er bleibt stehen
k                 sechs Kronen, ein Anschlag
```

**Das Material steht vor dem Befund und bleibt stehen**, als Modus, nicht als Nachsatz. Eine
Materialtaste hat dabei zwei Lesarten, weil Füllung und Restauration verschiedene Werteräume
haben: `K mo` ist eine Composite-Füllung auf zwei Flächen, `K k` eine Krone aus Gradia. Wo eine
Lesart fehlt, wird keine erfunden.

**Tabulator geht zum nächsten Zahn**, Umschalt+Tabulator zurück, beginnend bei 18 und um den Mund
herum (18–28, dann 38–48), mit Umlauf. Er bewegt die Auswahl, nicht nur den Fokus, damit der Zahn
hervorgehoben ist, auf dem man gerade steht. Die Pfeiltasten bleiben, wie sie sind.

```
G k    Tab    b          Goldkrone, dann ein Brückenglied am Nachbarn
A  mod Tab               eine Amalgamfüllung über drei Flächen
c mod K3                 Karies auf drei Flächen, mit Schweregrad
```

Ein Tastendruck, der für sich ein Befund ist, wirkt sofort. Es wartet nur, was noch nicht
vollständig sein kann. Die Abbildung liegt in `src/shorthand.ts`, ohne DOM und unabhängig von der
Maschine, weil derselbe Befundsatz auf drei Wegen erreichbar sein muss: Tastatur, FHIR aus einem
Praxissystem und Sprache.

Die Kurzschrift ist nicht erfunden, sondern vom Befundtastenfeld von *charly* (solutio)
abgeschrieben. Sieben ihrer Tasten sind verstanden und
haben hier noch keine Achse; sie werden als solche gemeldet statt stillschweigend übergangen.

Eine Spanne folgt dem **Bogen**, nicht der Geometrie (`odontogram-apn`): über die Mitte hinweg
(13 nach 23) ja, über den Kiefer nie.

### 🦷 Zahntypen und Zustände

**Zahnauswahl (Basistyp):**
| Wert | Beschreibung |
|---|---|
| `none` | Fehlender Zahn |
| `tooth-base` | Bleibender Zahn |
| `milktooth` | Milchzahn |
| `implant` | Zahnimplantat |
| `tooth-under-gum` | Subgingivaler (nicht durchgebrochener) Zahn |

**Gebrochene Zahnvarianten:**
`tooth-broken-inicisal`, `tooth-broken-distal-inicisal`, `tooth-broken-distal`, `tooth-broken-mesial-distal-inicisal`, `tooth-broken-mesial-distal`, `tooth-broken-mesial-inicisal`, `tooth-broken-mesial`, `no-tooth-after-extraction`

**Zahnsubstrat (bleibende Zähne):**
`natural` (Standard), `radix` (Wurzelrest), `broken`, `crownprep` (für Krone präpariert)

**Restaurationstyp (bleibende Zähne):**
`none`, `crown`, `inlay`, `onlay` (nur okklusale Ansicht), `veneer`, `bridge`

**Restaurationsmaterial (bleibende Zähne):**
`none`, `emax`, `gold`, `gradia`, `zircon`, `metal`, `metal-ceramic` (bestehende `metal`-Kronen migrieren hierher), `telescope`, `temporary`

**Restaurationsoptionen sind nach Zahnart gestaffelt** (`restorationOptions()` in `src/registry/restorations.ts`): ein Implantat bietet nur die Restaurationstypen `crown`/`bridge` (kombiniert mit einer Implantat-Verbinder-Ebene) plus die fünf `prosthesis`-Attachment-Einträge unten; ein fehlender/Lücken-Zahn bietet nur ein `bridge`-Brückenglied plus die zwei herausnehmbaren `prosthesis`-Prothesen-Einträge; ein `radix`-Substrat blendet die Restaurationssteuerung vollständig aus. Die alten flachen Felder `crownMaterial`/`bridgeUnit` (Implantat-/Brücken-Attachment-Werte vor v1.14) sind aus dem aktiven Modell entfernt — sie werden nur noch als schreibgeschützter Migrationspfad für alte Payloads akzeptiert.

**Prothetik** (`prosthesis`; eigenständige herausnehmbare/Attachment-Achse, als „Kivehető:"-Einträge im kombinierten Restaurations-Dropdown dargestellt):
`none`, `healing-abutment`, `locator`, `locator-denture`, `bar`, `bar-denture` (Implantat-Attachments, mit oder ohne Suprakonstruktion), `removable-partial`, `removable-full` (zahngetragene Prothesen an einem fehlenden/Lücken-Zahn). Ein Zahn hat entweder eine feste Restauration oder eine Prothetik, nie beides — das Setzen des einen löscht das andere.

**Kronenrand-Undichtigkeit** (`crownLeakage`; boolean): nur sichtbar, wenn `restorationType` gleich `crown` oder `bridge` ist; aktiviert die `crown-leakage`-Bildebene.

**Endodontische Optionen (bleibende Zähne):**
`none`, `endo-medical-filling`, `endo-filling`, `endo-filling-incomplete`

**Wurzelstift-Material (vorhandene Zähne, unabhängig von `endo`):**
`none`, `glass-fiber`, `metal`

**Endodontische Optionen (Milchzähne):**
`none`, `endo-medical-filling`

`endo` und `pulpDx` werden über ein zusammengeführtes „Pulpa-/Endo-Status"-`<select>` dargestellt (gruppiert: vitale Pulpa vs. behandelt/endodontisch) und schließen sich gegenseitig aus — die Wahl einer behandelten Option (`endo != none`) setzt `pulpDx` auf `normal` zurück, und die Wahl einer Pulpadiagnose setzt `endo` auf `none` zurück.

**Füllungsmaterialien (bleibende Zähne):**
`amalgam`, `composite`, `gic`, `temporary`

**Füllungsmaterialien (Milchzähne):**
`composite`, `gic`, `temporary`

**Füllungs-/Kariesflächen:**
`mesial`, `distal`, `buccal`, `lingual`, `occlusal`, `subcrown` (nur Karies)

**Modifikationen:**
`inflammation` (periapikale), `parodontal` (parodontale), `mobility` (M1/M2/M3)

**Periapikaler Läsionstyp** (`periapicalType`; qualifiziert den periapikalen Glyphen, nur unter symptomatischer/asymptomatischer apikaler Parodontitis angezeigt):
`none`, `granuloma`, `cyst` — Erfassungsoptionen; der alte Wert `abscess` wird weiterhin akzeptiert/gespeichert, aber im Auswähler nicht mehr angeboten, da er die apikale Diagnose dupliziert. Beim Import wird er verworfen: bei einem Zahn mit dem Entzündungs-Modifikator in `apicalDx` eingefaltet, andernfalls auf `none` zurückgesetzt

**Pulpadiagnose** (AAE-Terminologie; `pulpDx`):
`normal`, `reversible-pulpitis` (rendert ein reduziertes Pulpa-Glyph), `irreversible-pulpitis`, `necrosis` — schließt sich gegenseitig mit `endo` aus; wird bei einem wurzelbehandelten Zahn auf `normal` normalisiert

**Pulpadiagnose, praktisches Latein** (`pulpLatin`; wird vom Pulpa-Auswähler nur angezeigt, wenn `pulpDetailLevel` gleich `latin` ist):
`none`, `pulpa-sana`, `hyperaemia-pulpae`, `pulpitis-acuta-serosa`, `pulpitis-acuta-purulenta`, `pulpitis-chronica-clausa`, `pulpitis-chronica-ulcerosa`, `pulpitis-chronica-hyperplastica`, `necrosis-pulpae`, `gangraena-pulpae`

**Pulpa-Detailstufe** (`pulpDetailLevel`, globale Einstellung): `simple`, `aae` (Standard), `latin` — steuert, welches Pulpa-Vokabular der Auswähler anbietet

**Apikale Diagnose** (`apicalDx`; steuert den periapikalen Glyphen):
`normal`, `symptomatic-apical-periodontitis`, `asymptomatic-apical-periodontitis`, `acute-apical-abscess`, `chronic-apical-abscess`, `condensing-osteitis`

**Wurzelresorptionstyp** (`resorptionType`):
`none`, `internal`, `external-cervical`

**Periimplantärer Status** (`periImplant`; nur Implantate, Staging nach dem World Workshop 2018): `mucositis` verwendet das parodontale Zahnfleisch-Glyph weiter; `peri-implantitis-*` fügt die `peri-implant-bone-loss`-Ebene mit schweregradabhängiger Deckkraft hinzu (leicht 0,4 / mäßig 0,7 / schwer 1,0). Implantate rendern das periapikale Läsions-Glyph nicht mehr (ihre Entzündung wird stattdessen über diese Achse ausgedrückt), und die `mods`-Checkboxen für Entzündung/parodontal sind bei Implantaten ausgeblendet:
`none`, `mucositis`, `peri-implantitis-mild`, `peri-implantitis-moderate`, `peri-implantitis-severe`

**Kariesschweregrad** (`cariesSeverity`; vereinheitlichtes Feld pro Fläche, `0`–`6`): auf einer Fläche ohne Füllung wird er als ICDAS-Kariestiefenskala gelesen (`superficial` / `dentin` / `deep`, oder die rohen ICDAS-II-Codes `0–6` bei aktiviertem `enableIcdas`) und steuert die primäre `caries-{surface}`-Ebene; auf einer Fläche mit Füllung wird er als benannter CARS-Score gelesen (`0` gesund … `6` ausgedehnte Kavität) und steuert stattdessen die `subcaries-{surface}`-Ebene (Sekundärkaries) — eine Fläche ist nie gleichzeitig primär und rezidivierend

**Wurzelkaries** (`rootCaries`; steuert die `caries-root`-Bildebene bei einem vorhandenen Zahn, Deckkraft abhängig vom Schweregrad — `active` 0,5 / `arrested` 0,7 / `active-cavitated` volle Deckkraft):
`none`, `active`, `arrested`, `active-cavitated`

**Radiologische Kariestiefe** (`radiographicDepth`; pro Fläche, unabhängig von der visuellen ICDAS-/CARS-Skala `cariesSeverity`):
`none`, `E1`, `E2`, `D1`, `D2`, `D3`

**Karies-Granularitätseinstellungen** (global): `secondaryCariesMode` (`simple`/`standard`/`full`, Standard `standard`), `rootCariesMode` (`simple`/`severity`, Standard `simple`), `radiographicDepthMode` (`off`/`threeLevel`/`detailed`, Standard `off`), `cariesDepthEnabled` (boolean, Standard `true`) — jede reduziert ihre Skala auf eine einfachere Auswahlansicht, ohne den gespeicherten Wert zu verändern

**Spezielle Indikatoren:**
`crownNeeded`, `crownReplace`, `missingClosed`, `extractionPlan`, `extractionWound`, `bridgePillar`, `fissureSealing`, `contactMesial`, `contactDistal`, `endoResection`, `calculus`, `parapulpalPin`

**Zahnabrieb** (`wearEdge`, `wearCervical`; klinischer Typ je Lokalisation, gestaffelt auf Zahnbasis + keine Restauration + natürliches Substrat; rendert die bestehenden `tooth-bruxism-wear`/`tooth-bruxism-neck-wear`-Ebenen):
`wearEdge`: `none`, `attrition`, `erosion` — `wearCervical`: `none`, `abrasion`, `abfraction`, `erosion`

**Verfärbung** (`discoloration`; Ursache pro Zahn, gestaffelt auf einen natürlichen Zahn (bleibend) oder Milchzahn + keine Restauration + natürliches Substrat; färbt die Füllfarbe der dargestellten natürlichen Zahnkrone ein — keine neue SVG):
`none`, `tetracycline`, `fluorosis`, `nonvital`, `extrinsic`, `other`

**Füllungsdefekt** (`fillingDefect`; pro Fläche, Befund an direkten Restaurationen unabhängig von Sekundärkaries — gestaffelt auf die in `fillingSurfaceMaterials` vorhandenen Flächen; rendert die `defect-{surface}`-Bildebene):
`none`, `marginal`, `fracture`, `wear`

**Halteelement** (`retention` + `retentionSide`; pro Zahn, je Element gestaffelt — eine Klammer braucht einen vorhandenen Zahn, Geschiebe und Steg eine Krone; keine Bildebene, im Gitter-Overlay gezeichnet):
`none`, `clasp`, `attachment`, `bar-abutment` — `retentionSide`: `none`, `mesial`, `distal`, `both`. Ein **Teleskop** bleibt Kronen-MATERIAL und wird als Halteelement erkannt, statt doppelt gespeichert zu werden

**Zahnhalsbeteiligung** (`cervicalSurfaces`; Mengenangabe über `buccal`/`lingual`, gestaffelt auf eine Fläche, die eine Füllung, eine Karies oder beides trägt — keine Bildebene, bewusst nicht gezeichnet):
`buccal`, `lingual` — eine Markierung an der Fläche, nie eine eigene Fläche: `getFillingSurfaceCount()` bleibt davon unberührt

**Kieferorthopädie** (`orthoAppliance`, `orthoDrift`, `orthoVertical`, `orthoRotation`; pro Zahn, gestaffelt auf einen vorhandenen natürlichen Zahn — bleibend oder Milchzahn):
`orthoAppliance`: `none`, `bracket`, `band` — `orthoDrift`: `none`, `mesial`, `distal` — `orthoVertical`: `none`, `extrusion` (Pfeil-nach-oben-Glyph), `intrusion` (Pfeil-nach-unten-Glyph) — `orthoRotation`: boolean

**Zahndetail-/Notationseinstellungen** (globale Sitzungseinstellungen, Einstellungen → Zahndetails): `wearDetailLevel` und `discolorationDetailLevel` (`ToothDetailLevel`: `simple`/`complex`, Standard `complex` — der einfache Modus zeigt statt des vollständigen Typ-/Ursache-Dropdowns einen Ja/Nein-Umschalter, ohne den gespeicherten Wert zu verändern) sowie `surfaceNotation` (`simple`/`full`, Standard `full` — steuert, ob Kariologie-/Füllungs-Flächenbuchstaben/-bezeichnungen positionsbewusst sind; siehe „Positionsbewusste Flächenbezeichnung" oben)

### ⚙️ Einstellungen
Wird über das Zahnrad-Symbol in der Kopfleiste geöffnet; ein fokus-gefangener, ARIA-`dialog` mit tabbasiertem Layout (Esc/Klick auf den Hintergrund zum Schließen, Pfeiltasten zum Wechseln der Tabs). Alle Einstellungen sind, sofern nicht anders angegeben, reiner Sitzungs-UI-Zustand — keine davon verändert Pro-Zahn-Daten oder den Export-Payload.

- **Allgemein:** Nummerierungssystem (FDI/Universal/Palmer), Sprache, dunkles/helles Theme, Sichtbarkeit des Zahninformationen-Panels
- **Panels:** Ganzmund-Statuskarte und Kieferorthopädie-Karte unabhängig ein-/ausblenden (beide standardmäßig sichtbar)
- **Zahndetails:** Abrieb-Detailstufe und Verfärbungs-Detailstufe (einfach/komplex, jeweils Standard komplex), Flächenbezeichnung (einfach/vollständig, Standard vollständig)
- **Karies:** ICDAS-II-Scoring-Umschalter (`enableIcdas`), Kariestiefe-Umschalter (`cariesDepthEnabled`), Wurzelkaries-Granularität (`rootCariesMode`: simple/severity), Sekundärkaries-/CARS-Granularität (`secondaryCariesMode`: simple/standard/full), Granularität der radiologischen Tiefe (`radiographicDepthMode`: off/threeLevel/detailed) — der frühere separate „Sekundärkaries"-Tab ist in diesen zusammengeführt, wobei die CARS-Steuerung direkt oberhalb der radiologischen Tiefe positioniert ist
- **Pulpa:** Pulpa-Detailstufe (`pulpDetailLevel`: simple/AAE/praktisches Latein, Standard AAE) — steuert, welches Vokabular der „Pulpa-/Endo-Status"-Auswähler anbietet; eine Änderung aktualisiert die Ganzmund-Zusammenfassung und jeden geöffneten Tooltip live
- **Notizen:** Per-Zahn-Notizen aktivieren/deaktivieren (`enableNotes`)
- **Parodontal:** Ein-/Ausblend-Umschalter pro Index für alle 16 Zeilen des Parodontalstatus-Charts (`perioRowVisibility`, Standard alle sichtbar), gruppiert nach Tasche (PD/GM/CAL/BOP) / Hygiene (Plaque/PI/GI) / Mukogingival (CEJ-Sichtbarkeit/Wurzelkonkavität/KG/GT) / Halt (Furkation/Mobilität/Miller-Klasse) / Periimplantär (mPI/mBI), jede Zeile mit eigener Beschreibung; zusätzlich ein Modus für übersetzte vs. kanonische Indexnamen (`perioIndexNameMode`: `translated` Standard / `canonical` — ein fester englisch-lateinischer wissenschaftlicher Name, angezeigt in jeder UI-Sprache). Nur App-weite Einstellungen (spiegelt `perioViewMode`) — werden nie serialisiert, Tooltips bleiben in beiden Modi lokalisiert

### 🖼️ SVG-Vorlagensystem

**Zahnvorlagen** (in `src/assets/teeth-svgs/`):
| Vorlage | Verwendende Zähne |
|---|---|
| **Bleibende Zähne** | |
| `11.svg` | 11, 21 |
| `12.svg` | 12, 22 |
| `13.svg` | 13, 23 |
| `14.svg` / `14_occl.svg` | 14, 24 |
| `15.svg` / `15_occl.svg` | 15, 25 |
| `16.svg` / `16_occl.svg` | 16, 26 |
| `17.svg` / `17_occl.svg` | 17, 27 |
| `18.svg` / `18_occl.svg` | 18, 28 |
| `41.svg` | 41, 31 |
| `42.svg` | 42, 32 |
| `43.svg` | 43, 33 |
| `44.svg` / `44_occl.svg` | 44, 34 |
| `45.svg` / `45_occl.svg` | 45, 35 |
| `46.svg` / `46_occl.svg` | 46, 36 |
| `47.svg` / `47_occl.svg` | 47, 37 |
| `48.svg` / `48_occl.svg` | 48, 38 |
| **Milchzähne** | |
| `51.svg` | 51, 61 |
| `52.svg` | 52, 62 |
| `53.svg` | 53, 63 |
| `54.svg` | 54, 64 |
| `55.svg` | 55, 65 |
| `81.svg` | 81, 71 |
| `82.svg` | 82, 72 |
| `83.svg` | 83, 73 |
| `84.svg` | 84, 74 |
| `85.svg` | 85, 75 |

Ein als Milchzahn erfasster Zahn wird aus einer eigenen Vorlage gezeichnet, die anstelle der bleibenden eingehängt wird; die bleibenden Vorlagen werden für den Unterkiefer um 180 Grad gedreht und für die linke Seite horizontal gespiegelt, die Milchzahnvorlagen folgen derselben Zuordnung.

**Icon-SVGs** (in `src/assets/icon-svgs/`):
`icon_8.svg` (Weisheitszahn), `icon_gum.svg` (Knochen), `icon_no_selection.svg` (Auswahl löschen), `icon_occl.svg` (Okklusionsansicht), `icon_pulp.svg` (Pulpa)

### 🔢 Nummerierungssysteme

**FDI (ISO 3950):** Erwachsenenzähne 11-18, 21-28, 31-38, 41-48. Milchzähne 51-55, 61-65, 71-75, 81-85.

**Universal (USA):** Erwachsenenzähne nummeriert 1-32. Milchzähne mit Buchstaben A-T.

**Palmer (Zsigmondy-Palmer):** Quadrant + Positionsformat (z. B. UR-1, LL-5). Milchzähne verwenden Buchstaben A-E pro Quadrant.

### 🚀 Verwendung
Entwicklung:
```bash
bun install
bun run dev
```
Build:
```bash
bun run build
```
Vorschau:
```bash
bun run preview
```

### 🔗 Integration
Die Komponente kann in jede React-App eingebettet werden.
Beispiel:
```tsx
import App from "./App";

export default function Host(){
  return (
    <App
      language="de"
      onLanguageChange={(lang) => console.log(lang)}
      numberingSystem="FDI"
      onNumberingChange={(system) => console.log(system)}
      darkMode={false}
      onDarkModeChange={(dark) => console.log(dark)}
    />
  );
}
```

**Dunkelmodus-Integration:**
- **Eigenständiger Modus:** `darkMode`-Prop weglassen — die Komponente verwaltet ihren eigenen Theme-Zustand über den Umschalter in der Kopfleiste und fügt die `.dark`-Klasse auf `<html>` hinzu bzw. entfernt sie.
- **Gesteuerter Modus:** `darkMode` und `onDarkModeChange` übergeben — die übergeordnete App steuert das Theme. Der Umschalter erscheint weiterhin, ruft aber `onDarkModeChange` auf, anstatt den internen Zustand zu verwalten. Die übergeordnete App ist für das Hinzufügen/Entfernen der `.dark`-Klasse auf `<html>` verantwortlich.

**Benutzerdefiniertes Theme:**
```tsx
<App
  themeConfig={{
    colors: {
      accent: '#e74c3c',
      background: '#fafafa',
      text: '#222222',
    },
  }}
/>
```

**Plugin-Integration:**
```tsx
import App, { type OdontogramPlugin, setPluginState } from "./App";

const myPlugin: OdontogramPlugin = {
  id: "implant-brand",
  label: { en: "Implant Brand", hu: "Implantátum márka" },
  layer: "overlay",
  renderSvg: (toothNo, _quadrant, state) => {
    if (!state) return null;
    return `<text x="16" y="60" font-size="6" fill="#3b7bff">${state}</text>`;
  },
};

<App plugins={[myPlugin]} />

// Plugin-Zustand für einen Zahn setzen:
setPluginState(11, "implant-brand", "Straumann");
```

**Kontrollierte Integration — das UI-Domain-Dokument (ab 2.3.0):**

Der klinische Zustand der Komponente ist ein **UI-Domain-Dokument**: dasselbe
versionierte JSON, das `exportStatus()` schreibt und `importStatus()` liest. Dieses
Dokument — nicht FHIR — ist der React-State und gehoert der Host-Anwendung.

Binden Sie eine Instanz an eine isolierte **Session**, um sie zu initialisieren und zu
beobachten und zwei eingebundene Odontogramme unabhaengig zu halten:

```tsx
import App, {
  createOdontogramSession,
  type OdontogramDocument, type OdontogramSession,
} from "./App";

const upper: OdontogramSession = createOdontogramSession(savedUpperDocument);
const lower: OdontogramSession = createOdontogramSession(savedLowerDocument);

<App session={upper} onDocumentChange={(doc: OdontogramDocument) => save("upper", doc)} />
<App session={lower} onDocumentChange={(doc: OdontogramDocument) => save("lower", doc)} />
```

- `session.getDocument()` / `setDocument(doc)` / `subscribe(listener)` ist der gesamte
  Vertrag; `createOdontogramSession(initial?)` erzeugt eine Session. Die
  Behandlungsabsicht liest ein HKP-Host aus `session.getPlanChanges()` (nicht
  aus den Modul-Funktionen, die an die gerade aktive Session binden).
- Ein einfaches `document`-Prop statt `session` laesst die Instanz eine eigene, daraus
  initialisierte Session anlegen.
- Wird **keines von beiden** uebergeben, bleibt das bisherige Standalone-Verhalten
  erhalten: die Komponente arbeitet auf der prozessweiten Default-Session
  (`getDefaultOdontogramSession()`), und alle modulweiten Einstiegspunkte wirken
  unveraendert auf sie. **Eine Migration ist nicht erforderlich.**
- Nur eine Session ist gleichzeitig in der DOM-Engine *aktiv* (es gibt genau eine
  globale Engine an einem Zahnraster); die uebrigen behalten ihr eigenes Dokument und
  bleiben ueber ihre Session-API voll les- und schreibbar.

**FHIR / Dental Core:**

Die FHIR-Konvertierung ist eine reine optionale Projektion des UI-Dokuments. Dental Core `de.cognovis.fhir.dental.core#0.10.0` ist der einzige FHIR-Vertrag; die bekannte Kennung `odontogram-dental-core-0.6.0` bleibt für leere Altsammlungen lesbar, unbekannte Dialektkennungen werden abgelehnt. Import, Export und erneuter Export erhalten die elf Quellachsen `implantPosition`, `crownFractureType`, `orthoProgressive`, `rootResection`, `papillaLoss`, `orthoBracketSide`, `cantilever`, `endoCanals`, `rootFractureRoot`, `rootResectionRoot` und `apicalRoot`. In Plänen verwenden diese Achsen ein referenziertes Zielbefund-`Goal`; bestehende Planfelder werden weiterhin als profilierte geplante Observations dargestellt. Plan und Befund bleiben getrennt, ohne Devices oder durchgeführte Procedures zu erfinden. Doppelte, widersprüchliche, fehlerhafte, mehrdeutig adressierte oder zum Zahn unpassende Angaben werden abgelehnt. Wurzelstifte bleiben über `rootPostType` unabhängig; ältere `endo-glass-pin`- und `endo-metal-pin`-Werte werden zu `endo-filling` plus Stiftmaterial migriert. Seit 5.0.0 werden `extractionPlan`, `crownNeeded` und `crownReplace` als zahnbezogene Aufträge nach Dental Core 0.8 geschrieben (SNOMED CT 55162003 / 426222000, bei der Kronenversorgung mit `restoration-renewal`); mit dem früheren lokalen Code geschriebene Aufträge werden nicht mehr gelesen. Seit 5.0.0 (über `@cognovis/fhir-sdk` 0.15.6) wird jeder Wert eines Zahnzustands oder Chart-Befunds ausschließlich als sein Dental-Core-Code geschrieben und gelesen – ohne lokales Codesystem, Fallback oder Alias; die System-URLs stammen aus `@cognovis/fhir-sdk/terminology`.

**Aidbox-Live-Modus (Entwicklung, ab 2.50.0):**

Die eigenstaendige Anwendung (`apps/standalone`) hat **eine** Einstiegsseite und waehlt ihren Modus zur Laufzeit: live bei `?live`, bei `?patient=<id>` oder sobald eine Aidbox-Konfiguration in ihrer Umgebung steht — sonst der Fixture-Spielplatz. Im Live-Modus laedt sie die Karte eines Patienten direkt aus einem Aidbox-Server, zeigt sie ueber die obige Session-Schnittstelle in der gewohnten Oberflaeche und schreibt Aenderungen als Dental-Core-Ressourcen unter abgeleiteten IDs zurueck — ein erneutes Speichern aktualisiert also, statt zu verdoppeln.

`apps/standalone/.env.example` nach `apps/standalone/.env` kopieren und einen eingeschraenkten Maschinen-Client eintragen (siehe [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md)), dann im Workspace-Wurzelverzeichnis:

```bash
bun install
bun run dev                                 # dann http://localhost:5173/?live oeffnen
```

Administrator-Zugangsdaten gehoeren nie in `VITE_*`.

Die HTTP-Haelfte ist ein eigenes Paket, [`@cognovis/react-odontogram-fhir`](../../odontogram-fhir): dort liegen der Aidbox-Transport und die Gateway-Fabrik, und nur dort haengt etwas an `@cognovis/fhir-sdk/client`. Dieses Paket liefert die Gateway-**SPI** und die Session-Delegierten fuer Laden, Speichern und Schreibplan — die HTTP-freie Haelfte — und enthaelt `@cognovis/fhir-sdk/client` weiterhin **nicht**. Chart und Transport 5.2.6 deklarieren den erforderlichen SDK-Peer `^0.22.0 || ^0.23.0` und die exakte Entwicklungsversion `0.23.0` (Dental Core 0.10.0). Die ausfuehrende Anwendung pinnt SDK `0.23.0` und teilt eine Kopie ohne Override. Einrichtung sowie Lade- und Schreibweg stehen in [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md).

**Datierte Untersuchungen, Erhebungsstatus und periimplantaere Erfassung (ab 2.4.0):**

Ein Parodontalfall wird ueber Jahre nachuntersucht. Ein Dokument traegt daher jetzt die
eigene Identitaet der Untersuchung und ein Archiv frueherer Untersuchungen:

```ts
setExaminationContext({
  id: "exam-2026-06-30", subject: "Patient/123", effectiveDateTime: "2026-06-30",
  performer: "Practitioner/dr-mueller", encounter: "Encounter/9912",
});

captureExamination({ effectiveDateTime: "2026-06-30" });
listExaminations();
getExamination(id);
loadExamination(id);
startExamination({ effectiveDateTime: "2027-01-15" });
```

- Jede archivierte Untersuchung ist eine **unabhaengige Momentaufnahme** der Befunde und des
  Fallkontexts zum Zeitpunkt der Erfassung; spaetere Aenderungen greifen nicht mehr hinein,
  und ein erneutes Erfassen legt eine Folgeuntersuchung an, statt den Ausgangsbefund zu
  ueberschreiben, auf dem der Verlauf beruht.
- Status und Plan bedeuten weiterhin **aktuell gegenueber geplant innerhalb einer
  Untersuchung** — der Planbefund ist keine Historie und nie Teil einer Momentaufnahme.
- Jedes Identitaetsfeld ist eine opake, der Host-Anwendung gehoerende Zeichenkette, die die
  Komponente speichert und zurueckgibt, aber nie interpretiert. Dokumente vor Payload-Version
  2.21 enthalten nichts davon und werden unveraendert geladen.
- **Was der Patient mitgebracht hat, wird aus diesem Archiv abgeleitet, nie gespeichert.** Zahnärztliche Arbeit, die beim ÄLTESTEN archivierten Befund vorlag, wird **schraffiert** gezeichnet, damit eine mitgebrachte Krone nicht mit einer selbst gesetzten verwechselt wird. Nichts wird zusätzlich serialisiert: kein Payload-Sprung, keine FHIR-Zuordnung, keine zweite Aufzeichnung, die dem Archiv widersprechen könnte. `getBaselineExamination()`, `getPreExistingAxes(toothNo)`, `getChangesSinceBaseline()`, `isToothPreExisting(toothNo)`.
- Die Schraffur markiert **Arbeit, nie den Zahn und nie die Krankheit** — Restaurationen, direkte Füllungen, Wurzelfüllungen und Stifte, WSR, Fissurenversiegelung. Ein Radix oder ein Implantat ist ein Zahn, keine Arbeit; Karies, Zahnstein und die parodontalen Befunde sind Krankheit. Die Ableitung bleibt breiter als die Zeichnung, Tooltip und Zusammenfassung melden weiterhin Zahnpräsenz, Substanz und Karies.
- Der **Erstbefund ist korrigierbar**: `beginBaselineCorrection()` legt den heutigen Befund beiseite und lädt den Erstbefund, `commitBaselineCorrection()` archiviert ihn unter seiner eigenen Kennung und seinem Datum neu, `cancelBaselineCorrection()` verwirft die Korrektur. Bewusst kein Schalter pro Zahn — eine Aussage darüber, was der Patient mitbrachte, nicht eine zweite Notiz daneben.
- Ein **importierter Befund ohne eigenes Archiv wird zum Erstbefund** (Import-Menü, „Dies ist der Erstbefund", standardmäßig an), denn so gelangt ein Fremdbefund normalerweise ins Programm. Ein Dokument, das sein eigenes Archiv mitbringt, behält es — ein Re-Import wird nie über das echte Aufnahmedatum des Patienten umdatiert.

Die Parodontalkarte speichert Befunde, nicht den Akt des Untersuchens: "sondiert, keine
Blutung" und "niemand hat sondiert" sahen bisher gleich aus. Jede betroffene Achse (PD, GM,
BOP, Pusaustritt, Lockerung, Furkation, Plaque, PI, GI, mPI, mBI, KG) kann das jetzt sagen:

```ts
setAssessmentStatus(16, "bop", "MB", "assessed");
setAssessmentStatus(16, "pd", "DB", "unmeasurable");
getAssessmentStatus(16, "mpi", "buccal");
perioAxisApplies(16, "gm");
perioAxisApplies(11, "gm");
```

"Nicht anwendbar" wird daraus abgeleitet, was der Zahn tatsaechlich ist, und ein echter
Messwert schlaegt immer eine vermerkte Luecke. Beim Export wird ein nicht verfuegbarer Wert
zum FHIR-eigenen `dataAbsentReason` — nie zu einem erfundenen klinischen Code — und ein
unauffaelliger Befund zu einem expliziten `false` bzw. Grad `0`.

**Erfassung (ab 2.7.0):** ein Schalter **Befundungsstatus** im Kopf der Parodontalkarte fuegt
unter jeder sichtbaren Indexzeile eine Begleitzeile ein, mit einem Umschaltknopf je Messpunkt —
Messstelle, Flaeche, Furkationseingang oder der ganze Zahn. Die Zeilen sind standardmaessig
ausgeschaltet. Wo bereits ein Messwert vorliegt, ist das Bedienelement gesperrt (der Wert selbst
belegt die Untersuchung), und eine nicht zutreffende Position ist deaktiviert statt still
ignoriert. Erfasste Status erscheinen auch im Zahn-Tooltip und in der Parodontal-Zusammenfassung.

Die Ganzkiefer-Parodontalkarte erfasst jetzt zusaetzlich **Pusaustritt** je Messstelle, und
eine Implantatspalte unterstuetzt die periimplantaere Untersuchung: Sondierungstiefe an sechs
Stellen, Blutung, Pusaustritt, Implantatlockerung und Breite der keratinisierten Mukosa.
Inaktiv bleiben dort nur die Achsen, die eine Schmelz-Zement-Grenze brauchen (Gingivarand und
das daraus abgeleitete CAL) sowie die Plaque-Indizes des natuerlichen Zahns — mPI und mBI sind
deren periimplantaere Entsprechungen.
### 🧪 Tests
```bash
bun run test           # Alle 1704 Tests ausführen (1 zusätzlicher Test übersprungen)
bun run test:watch     # Watch-Modus
bun run test:coverage  # Coverage-Bericht
```

### 📖 API-Dokumentation
```bash
bun run docs           # TypeDoc-Dokumentation in docs/ generieren
```

### 📡 Öffentliche API

**Komponenten-Props:**

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `language` | `string` | `'hu'` | UI-Sprache (hu/en/de/es/it/sk/pl/ru/pt-br) |
| `onLanguageChange` | `(lang) => void` | — | Callback bei Sprachänderung |
| `numberingSystem` | `string` | `'FDI'` | Nummerierungssystem (FDI/Universal/Palmer) |
| `onNumberingChange` | `(system) => void` | — | Callback bei Nummerierungsänderung |
| `darkMode` | `boolean` | `undefined` | Dunkelmodus-Zustand. Weglassen für eigenständigen Modus. |
| `onDarkModeChange` | `(dark) => void` | — | Callback beim Umschalten des Dunkelmodus. Erforderlich für gesteuerten Modus. |
| `themeConfig` | `OdontogramThemeConfig` | `undefined` | Benutzerdefinierte Farbüberschreibungen über CSS Custom Properties (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | `undefined` | Benutzerdefinierte SVG-Plugins für visuelle Overlays und per-Zahn Custom State. |
| `readOnly` | `boolean` | `undefined` | Alle Interaktionen deaktivieren (Klick, Touch, Tastatur). Nützlich für Druck-/Berichtsansichten. |
| `enableNotes` | `boolean` | `undefined` | Per-Zahn Notizen aktivieren. Doppelklick auf einen Zahn zum Hinzufügen/Bearbeiten. |

**Exportierte Funktionen zur externen Steuerung:**

| Funktion | Beschreibung |
|---|---|
| `initOdontogram()` | Motor initialisieren und alle Zähne rendern |
| `destroyOdontogram()` | Motor aufräumen und Ereignisbehandler entfernen |
| `setNumberingSystem(system)` | Zwischen FDI, Universal, Palmer wechseln |
| `clearSelection()` | Alle Zähne abwählen |
| `setOcclusalVisible(on)` | Okklusionsansicht ein-/ausschalten |
| `setWisdomVisible(on)` | Weisheitszähne anzeigen/verbergen |
| `setShowBase(on)` | Knochenschicht anzeigen/verbergen |
| `setHealthyPulpVisible(on)` | Gesunde Pulpa anzeigen/verbergen |
| `registerPlugins(plugins)` | Benutzerdefinierte SVG-Plugins registrieren |
| `setPluginState(toothNo, pluginId, value)` | Plugin Custom State für einen Zahn setzen |
| `getPluginState(toothNo, pluginId)` | Plugin Custom State eines Zahns abrufen |
| `getToothStateSummary(toothNo)` | Lokalisierte Zusammenfassung aller aktiven Zustände eines Zahns abrufen |
| `getOdontogramSummary()` | Strukturierte, lokalisierte Textzusammenfassung des gesamten Befunds abrufen (Zählungen, Abschnitte) |
| `onStateChange(callback)` | Auf Zustandsänderungen abonnieren; gibt eine Abmeldefunktion zurück |
| `setReadOnly(value)` | Schreibgeschützten Modus aktivieren/deaktivieren |
| `getReadOnly()` | Aktuellen Schreibgeschützt-Zustand abrufen |
| `setNotesEnabled(value)` | Per-Zahn Notizen aktivieren/deaktivieren |
| `getNotesEnabled()` | Aktuellen Notizen-Status abrufen |
| `setPulpDetailLevel(level)` | Vokabular des Pulpa-Auswählers festlegen — `"simple"`, `"aae"` oder `"latin"` |
| `getPulpDetailLevel()` | Aktuelle Pulpa-Detailstufe abrufen |
| `getChartMode()` | Das aktuell aktive Chart abrufen — `"status"` oder `"plan"` |
| `setChartMode(mode)` | Das aktive Chart auf `"status"` oder `"plan"` umschalten; das Plan-Chart wird beim ersten Betreten als Tiefenkopie des Status-Charts erstellt |
| `getStatusChart()` | Das Payload des Status-Charts abrufen (`{version, globals, teeth}`), unabhängig davon, welches Chart gerade aktiv ist |
| `getPlanChart()` | Das Payload des Plan-Charts abrufen (`{version, globals, teeth}`), unabhängig davon, welches Chart gerade aktiv ist |
| `setPlanChart(payload)` | Die Zähne des Plan-Charts aus einem Payload ersetzen (der Status bleibt unangetastet); markiert das Plan-Chart als initialisiert |
| `getPlanChanges()` | Den strukturierten Status→Plan-Diff abrufen (`{ toothNo, axis, from, to }[]`) — ein Eintrag pro Zahn und pro Behandlungsachse, die sich zwischen Status- und Plan-Chart unterscheidet; leer, wenn kein Plan existiert. Auch auf `getOdontogramSummary()` als `plannedChanges` verfügbar |
| `setPerioSite(toothNo, site, patch)` | Parodontale Daten für eine der sechs Messstellen setzen (`patch` = `{ pd?, gm?, bop?, sup? }`); `pd` null/`<1` löscht die Messstelle wieder aus der Erfassung. Validiert + begrenzt (PD 1–15, GM −10…+20) |
| `getToothPerio(toothNo)` | Den parodontalen Datensatz eines Zahns pro Messstelle abrufen (nur erfasste Messstellen) |
| `getToothCal(toothNo)` | Das abgeleitete CAL pro Messstelle (`pd + Gingivarand`) für einen Zahn abrufen |
| `getPerioSummary()` | Ganzmund-parodontale Kennzahlen: Anzahl erfasster Messstellen, Anzahl blutender Stellen, %BOP, schlechtestes CAL, maximale PD |
| `getPerioChart()` | Die parodontalen Datensätze pro Zahn des aktiven Charts abrufen |
| `PerioChart` | React-Komponente (benannter Export) — das Ganzmund-Parodontalstatus-Chart-Overlay (`{ open, onClose }`), unabhängig von `OdontogramShell` einbindbar für die Host-Integration |
| `openPerioOverlay()` / `closePerioOverlay()` / `isPerioOverlayOpen()` | Das Parodontalstatus-Chart-Overlay programmgesteuert öffnen/schließen/abfragen — erlaubt einer Host-App, das Parodontalstatus-Chart getrennt vom Basis-Odontogramm aufzurufen (gemeinsamer Fall-Zustand) |
| `getPerioViewMode()` / `setPerioViewMode(mode)` | Abrufen/Setzen, wie das Parodontalstatus-Chart dargestellt wird — `"toggle"` (ein `Odontogram \| Dental Chart`-Ansichtsumschalter, Standard) oder `"popup"` (das Overlay) |
| `getPerioOverlayLayer()` / `setPerioOverlayLayer(layer)` | Das Hervorhebungs-Overlay des Dental Chart abrufen/setzen — `"none"` (Standard) / `"pd"` / `"cal"` / `"gr"` / `"plaque"` / `"bop"` / `"pd5"` / `"pd6"` / `"cairo"`; färbt die Zähne nach diesem Maß neu ein (rein darstellend, über den vorhandenen Daten) |
| `getToothRecessionType(toothNo)` | Den abgeleiteten **Cairo-Rezessionstyp** abrufen — `"none"` / `"rt1"` / `"rt2"` / `"rt3"` (berechnet aus dem interproximalen vs. bukkalen CAL des Zahns) |
| `setCejVisibility(toothNo, v)` / `getCejVisibility(toothNo)` | CEJ-Sichtbarkeit pro Zahn — `"none"` / `"detectable"` / `"not-detectable"` |
| `setRootConcavity(toothNo, v)` / `getRootConcavity(toothNo)` | Wurzeloberflächen-Konkavität pro Zahn — `"none"` / `"mild"` / `"deep"` |
| `setPlaqueIndex(toothNo, surface, grade)` / `getPlaqueIndex(toothNo, surface)` | Silness-Löe-Plaque-Index-Grad pro Fläche — `0`-`3` |
| `setGingivalIndex(toothNo, surface, grade)` / `getGingivalIndex(toothNo, surface)` | Löe-Silness-Gingiva-Index-Grad pro Fläche — `0`-`3` |
| `setKeratinizedWidth(toothNo, mm)` / `getKeratinizedWidth(toothNo)` | Breite der bukkalen keratinisierten Gingiva pro Zahn in mm — `0`-`15`, oder `null`, falls nicht erfasst |
| `setGingivalThickness(toothNo, v)` / `getGingivalThickness(toothNo)` | Gingivadicke-Phänotyp pro Zahn — `"unknown"` / `"thin"` / `"medium"` / `"thick"` |
| `setMillerClass(toothNo, v)` / `getMillerClass(toothNo)` | Miller-Rezessionsklasse pro Zahn — `"none"` / `"i"` / `"ii"` / `"iii"` / `"iv"` |
| `setPeriImplantPlaque(toothNo, surface, grade)` / `getPeriImplantPlaque(toothNo, surface)` | Nur Implantate — Mombelli modifizierter Plaque-Index (mPI) pro Fläche — `0`-`3`; wirkungslos an einem Nicht-Implantatzahn |
| `setPeriImplantBleeding(toothNo, surface, grade)` / `getPeriImplantBleeding(toothNo, surface)` | Nur Implantate — Mombelli modifizierter Sulkus-Blutungs-Index (mBI) pro Fläche — `0`-`3`; wirkungslos an einem Nicht-Implantatzahn |
| `furcationEntrances(toothNo)` | Die Furkationseingänge eines Zahns — `["mesial","distal","buccal"]` (obere Molaren), `["buccal","lingual"]` (untere Molaren), `["mesial","distal"]` (obere erste Prämolaren), sonst `[]` |
| `setFurcation(toothNo, entrance, grade)` / `getToothFurcation(toothNo)` | Furkationsbeteiligung pro Eingang setzen/abrufen (Glickman `1`–`4`; `null` löscht) |
| `setPlaque(toothNo, surface, present)` / `getToothPlaque(toothNo)` | O'Leary-Plaquevorkommen pro Fläche setzen/abrufen (mesial/distal/bukkal/lingual); speist die Ganzmund-PI% in `getPerioSummary()` |
| `getCaseMeta()` | Das fallbezogene Metadaten-Objekt abrufen (`{age, smokingStatus, cigarettesPerDay, diabetesStatus, hba1c, toothLossPerio, maxRblPercent, patientName, patientDob, examDate}`) — ein einziger gemeinsamer Block, nicht pro Zahn/dual-state (spiegelt den obersten `globals`-Payload-Schlüssel); speist die parodontale Staging-/Grading-Klassifikation |
| `setPatientName(v)` | Den Patientennamen des Falls setzen (getrimmt; leerer String oder `null` löscht ihn) — nur Identität, fließt nie in die parodontale Ableitung ein |
| `setPatientDob(v)` | Das Geburtsdatum des Patienten im Fall setzen (`YYYY-MM-DD`; ungültig/leer löscht es)|
| `setExamDate(v)` | Das Untersuchungsdatum des Falls setzen (`YYYY-MM-DD`; ungültig/leer löscht es) |
| `setCaseAge(v)` | Das Patientenalter des Falls in Jahren setzen — `0`-`120`, oder `null` zum Löschen |
| `setSmokingStatus(v)` | Den Raucherstatus des Falls setzen — `"unknown"` / `"never"` / `"former"` / `"current"` |
| `setCigarettesPerDay(v)` | Zigaretten/Tag setzen (nur relevant, wenn der Raucherstatus `"current"` ist) — `0`-`99`, oder `null` zum Löschen |
| `setDiabetesStatus(v)` | Den Diabetesstatus des Falls setzen — `"unknown"` / `"none"` / `"present"` |
| `setHba1c(v)` | HbA1c % setzen (nur relevant, wenn der Diabetesstatus `"present"` ist) — `3.0`-`20.0` (eine Nachkommastelle), oder `null` zum Löschen |
| `setToothLossPerio(v)` | Durch Parodontitis verlorene Zähne setzen — `0`-`32`, oder `null` zum Löschen |
| `setMaxRblPercent(v)` | Maximalen radiologischen Knochenverlust % setzen — `0`-`100`, oder `null` zum Löschen |
| `resetCaseMeta()` | Das fallbezogene Metadaten-Objekt auf seine leeren Standardwerte zurücksetzen |
| `getPerioClassification()` | Die parodontale Klassifikation nach dem World Workshop 2017 abrufen (`{diagnosis, stage, grade, extent, derived, overridden}`) — Diagnose/Stadium/Grad/Ausdehnung werden aus den erfassten parodontalen Daten und den Fall-Metadaten abgeleitet, wobei jede Achse durch eine klinische Übersteuerung ersetzt wird, sobald diese gesetzt ist (`derived` liefert immer die unveränderten berechneten Werte, `overridden` markiert, welche Achsen übersteuert wurden) |
| `setDiagnosisOverride(v)` | Die abgeleitete parodontale Diagnose übersteuern — `"health"` / `"gingivitis"` / `"periodontitis"`, oder `null` zum Löschen (zurück zum abgeleiteten Wert) |
| `setStageOverride(v)` | Das abgeleitete parodontale Stadium übersteuern — `"I"` / `"II"` / `"III"` / `"IV"`, oder `null` zum Löschen (zurück zum abgeleiteten Wert) |
| `setGradeOverride(v)` | Den abgeleiteten parodontalen Grad übersteuern — `"A"` / `"B"` / `"C"`, oder `null` zum Löschen (zurück zum abgeleiteten Wert) |
| `setExtentOverride(v)` | Die abgeleitete parodontale Ausdehnung übersteuern — `"localized"` / `"generalized"` / `"molar-incisor"`, oder `null` zum Löschen (zurück zum abgeleiteten Wert) |
| `exportImage(format)` | Befund als Bild herunterladen — `"png"` oder `"jpg"` |
| `exportSvg()` | Befund als skalierbares SVG (Vektor) herunterladen |
| `hasAnyPerioData()` | `true`, sofern irgendeine parodontale Achse irgendwo im Mund erfasst ist — steuert das automatische Überspringen beim Parodontal-Export und deaktiviert die Parodontal-Export-Menüpunkte bei einem leeren Chart |
| `startIntroTour()` | Die 12-stufige interaktive Einführungstour starten |

### 💾 Status Export-/Importformat
Der Export erzeugt eine JSON-Datei (Version `2.20`; Importe akzeptieren weiterhin die Legacy-Version `1.4` sowie `2.0` bis `2.19` und werden automatisch migriert) mit folgenden Feldern:

**Globale Felder:**
- `wisdomVisible` - Weisheitszähne sichtbar
- `showBase` - Knochenschicht sichtbar
- `occlusalVisible` - Okklusionsansicht aktiv
- `showHealthyPulp` - Gesunde Pulpa sichtbar
- `edentulous` - Zahnloser Modus aktiv

**Pro-Zahn-Felder (32 Zähne):**
- `toothSelection` - Basiszahntyp
- `toothSubstrate` - Zahnsubstrat (natural/radix/broken/crownprep), unabhängig von jeder Restauration
- `restorationType` - Restaurationstyp (none/crown/inlay/onlay/veneer/bridge)
- `restorationMaterial` - Restaurationsmaterial (emax/gold/gradia/zircon/metal/metal-ceramic/telescope/temporary), gekoppelt an `restorationType`
- `prosthesis` - herausnehmbare/Attachment-Achse (none/healing-abutment/locator/locator-denture/bar/bar-denture/removable-partial/removable-full), schließt sich mit einer festen `restorationType` von Krone/Brücke gegenseitig aus
- `crownLeakage` - Kronenrand-Undichtigkeits-Flag, nur relevant, wenn `restorationType` gleich Krone oder Brücke ist
- `endo` - endodontischer Zustand; schließt sich mit `pulpDx` gegenseitig aus (über einen zusammengeführten „Pulpa-/Endo-Status"-Auswähler gemeinsam dargestellt — das Behandeln eines Zahns normalisiert `pulpDx` auf `normal`)
- `rootPostType` - Wurzelstiftmaterial (`none`, `glass-fiber`, `metal`), unabhängig von `endo`
- `mods` - Modifikations-Array (Entzündung, parodontal); `inflammation` ist bei vorhandenen Zähnen aus der UI entfernt (dort steuert `apicalDx` den Glyphen), gilt aber weiterhin für fehlende/Extraktionsalveolen-Zähne
- `caries` - aktive Kariesflächen
- `cariesActiveDepth` - der vom Kariestiefe-Auswähler vorgehaltene ICDAS-Tiefenwert beim Anwenden einer neuen Fläche (kein gespeicherter Wert pro Fläche; siehe `cariesSeverity` für das gespeicherte Feld pro Fläche)
- `rootCaries` - Wurzelkaries-Schweregrad (none/active/arrested/active-cavitated)
- `cariesSeverity` - vereinheitlichter Schweregrad pro Fläche (0-6): ICDAS-Tiefe auf einer primären (ungefüllten) Fläche, CARS-Score auf einer rezidivierenden (gefüllten) Fläche
- `radiographicDepth` - radiologische Kariestiefe pro Fläche (none/E1/E2/D1/D2/D3), unabhängig von der visuellen ICDAS-/CARS-Skala
- `fillingMaterial` - Füllungsmaterial
- `fillingSurfaces` - gefüllte Flächen
- `fillingSurfaceMaterials` - Füllungsmaterial pro Fläche (gemischte Füllungen, z. B. bukkal Amalgam + distal Komposit)
- `retention` - was eine herausnehmbare Prothese an diesem Zahn hält (none/clasp/attachment/bar-abutment); ein Wert, nie ein Set
- `retentionSide` - die Seite, an der das Halteelement angreift (none/mesial/distal/both), wie charly es erfasst
- `fillingDefect` - Füllungsdefekt pro Fläche (none/marginal/fracture/wear), an gefüllte Flächen gebunden, unabhängig von Sekundärkaries
- `cervicalSurfaces` - die Flächen, deren Füllung oder Karies in den Zahnhalsbereich reicht (buccal/lingual); eine Markierung an der Fläche statt einer sechsten Fläche
- `pulpDx` - AAE-Pulpadiagnose (normal/reversible-pulpitis/irreversible-pulpitis/necrosis); reversible-pulpitis rendert ein reduziertes Glyph
- `pulpLatin` - praktischer lateinischer Pulpa-Subtyp (wird vom Pulpa-Auswähler nur angezeigt, wenn `pulpDetailLevel` gleich `latin` ist)
- `apicalDx` - apikale Diagnose, steuert den periapikalen Glyphen
- `periapicalType` - periapikaler Läsionssubtyp (none/granuloma/cyst), nur unter symptomatischer/asymptomatischer apikaler Parodontitis angezeigt; der alte Wert `abscess` wird beim Import weiterhin akzeptiert
- `resorptionType` - Wurzelresorptionstyp (none/internal/external-cervical)
- `periImplant` - periimplantärer Status nur bei Implantaten (none/mucositis/peri-implantitis-mild/-moderate/-severe), Staging nach dem World Workshop 2018
- `endoResection` - Wurzelspitzenresektions-Flag
- `fissureSealing` - Fissurenversiegelungs-Flag
- `calculus` - Zahnstein-Flag
- `contactMesial` - mesialer Kontaktpunktverlust
- `contactDistal` - distaler Kontaktpunktverlust
- `wearEdge` - inzisaler/okklusaler Abriebtyp (none/attrition/erosion)
- `wearCervical` - zervikaler Abriebtyp (none/abrasion/abfraction/erosion)
- `discoloration` - Verfärbungsursache pro Zahn (none/tetracycline/fluorosis/nonvital/extrinsic/other), färbt die Füllfarbe der natürlichen Zahnkrone bei einem natürlichen Zahn (bleibend/Milchzahn) ohne Restauration
- `orthoAppliance` - kieferorthopädische Apparatur (none/bracket/band)
- `orthoDrift` - kieferorthopädische Drift (none/mesial/distal)
- `orthoVertical` - kieferorthopädische vertikale Bewegung (none/extrusion/intrusion)
- `orthoRotation` - kieferorthopädisches Rotations-Flag
- `brokenMesial`, `brokenIncisal`, `brokenDistal` - Fraktur-Lokalisierungen
- `extractionWound` - Post-Extraktionswunde
- `extractionPlan` - geplante Extraktion
- `parapulpalPin` - parapulpaler Stift-Flag
- `bridgePillar` - Brückenpfeilerzahn
- `mobility` - Mobilitätsgrad (none/m1/m2/m3)
- `crownNeeded` - Indikator „Krone erforderlich"
- `crownReplace` - Indikator „Kronenwechsel erforderlich"
- `missingClosed` - Lücke nach Extraktion geschlossen
- `customStates` - Plugin Custom States (Objekt, nach Plugin-ID indiziert)
- `note` - Textnotiz pro Zahn (String, optional — nur vorhanden, wenn nicht leer)

**Oberstes `plan`-Feld (ab Version 2.11):**
- `plan` - optionales Objekt, gleiche Struktur wie `teeth` (Pro-Zahn-Felder oben), enthält das **Plan**-Chart (beabsichtigte Behandlung). Nur vorhanden, wenn das Plan-Chart initialisiert wurde (der `Status | Plan`-Umschalter wurde mindestens einmal auf Plan gestellt) UND sich sein Inhalt vom Status-Chart unterscheidet — ein reiner Status-Export lässt es vollständig weg und bleibt bis auf die Versionsnummer byte-identisch zu einem Export vor Version 2.11. Beim Import löscht ein fehlendes `plan` das Plan-Chart bzw. macht es uninitialisiert (es lässt niemals einen veralteten Plan von vor dem Import wiederaufleben); ein vorhandenes `plan` stellt das Plan-Chart neben dem Status wieder her. Das Plan-Chart kann auch unabhängig von Export/Import über `getPlanChart()`/`setPlanChart()` gelesen/geschrieben werden (siehe Öffentliche API oben), und `getStatusChart()` liefert unabhängig vom aktiven Chart-Modus immer den status-primären Payload.

**Oberstes `case`-Feld (Version 2.17+, in 2.18, 2.19 und 2.20 erweitert):**
- `case` - optionales Objekt mit fallbezogenen (nicht pro Zahn) Metadaten, gemeinsam genutzt vom Status- und vom Plan-Chart (spiegelt den obersten `globals`-Schlüssel). Omit-when-empty: fehlt vollständig, wenn jedes Feld auf seinem Standardwert steht, sodass ein Export ohne Fallmetadaten bis auf die Versionsnummer byte-identisch bleibt. Felder (jeweils weggelassen, wenn auf Standardwert): `age`; `smokingStatus` (+ `cigarettesPerDay`); `diabetesStatus` (+ `hba1c`); `toothLossPerio`; `maxRblPercent`; die vier klinischen Übersteuerungen der 2017-Klassifikation pro Achse `diagnosisOverride` / `stageOverride` / `gradeOverride` / `extentOverride`; sowie (ab Version 2.19) `patientName` / `examDate`; und (ab Version 2.20) `patientDob`. Es speist die parodontale Staging-/Grading-Klassifikation; gelesen/geschrieben über `getCaseMeta()` und die `setCase*`-Setter (siehe Öffentliche API oben). Patientenname, Geburtsdatum und Untersuchungsdatum sind reine Chart-Identitätsmetadaten — sie sind **nicht** Teil des FHIR-Exports.

### 🖨️ Export
Über den eigenen Status-JSON-/FHIR-/PNG-/JPG-/SVG-Export des Odontogramms hinaus hat das **Parodontalstatus-Chart** einen eigenen Exportpfad:
- Patientenname, Geburtsdatum und Untersuchungsdatum sind reine chart-identitätsbezogene Metadaten (Payload `2.20`, additiv) — sie sind **nicht** Teil des FHIR-Exports.

### 📁 Ordnerstruktur
- `src/App.tsx` - UI-Hülle, Kopfleisten-Steuerung, Sprach-/Nummerierungs-/Dunkelmodus-/Theme-/Plugin-Umschalter
- `src/odontogram.ts` - SVG-Schichtungsmotor, Zahnstatusmanagement, Touch-Interaktionen, Plugin-Overlays, UI-Verdrahtung
- `src/plugin.ts` - `OdontogramPlugin`-Typ, `PluginLayer`, `getQuadrant()`, `LAYER_Z` Z-Index-Prioritäten
- `src/theme.ts` - `OdontogramThemeConfig`-Typ und `applyThemeConfig()`-Hilfsfunktion
- `src/status_extras.ts` - 34 vordefinierte Restaurationsvorlagen (Brücken, Prothesen, Stegkonstruktionen)
- `src/i18n/` - Übersetzungen (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) und i18n-Hook
- `src/utils/numbering.ts` - FDI, Universal, Palmer Nummerierungskonvertierung
- `src/registry/` - deklaratives Register für klinische Achsen und UI: Achsenmetadaten, SVG-Aktivierung, Restaurationstyp×Material-Matrix, Wertekatalog und Optionslisten; die FHIR-Zuordnungen liegen in `src/fhir/`
- `src/fhir/` - einzige Dental-Core-Naht für HL7 FHIR R4: Codec `toFhirDentalCore.ts`/`fromFhirDentalCore.ts` über `@cognovis/fhir-sdk`, `dentalCoreContract.ts` sowie Hilfen in `dentalCoreLocalCoding.ts`
- `src/bridgeOverlay.ts` - Mehrzahn-Brückenspann-Verbinder-Overlay (bogenbewusste Sattelgeometrie)
- `src/SettingsModal.tsx` - tabbasierter Einstellungsdialog (Allgemein/Panels/Zahndetails/Karies/Pulpa/Notizen/Parodontal)
- `src/__tests__/` + `src/registry/__tests__/` - Vitest-Testsuite (1704 bestandene Tests, 1 übersprungen, in 163 Dateien)
- `src/assets/teeth-svgs/` - SVG-Zahnvorlagen (40 Dateien: je eine Vorlage pro Position - 16 bleibende Seitenansichten, 10 Milchzähne, 14 Kauflächen)
- `src/assets/icon-svgs/` - Toolbar-Icon-SVGs (5 Dateien)

### ⚙️ Technologie-Stack
- React 18 + Vite + TypeScript
- Tailwind CSS für UI-Styling
- SVG-Schichtung über DOM-Manipulation (kein React-State für Performance)
- Leichtgewichtiges eigenes i18n-System
- Vitest + Testing Library für automatisierte Tests
- TypeDoc für API-Dokumentation
- Vite-Pfadalias: `@` auf `./src` abgebildet

### 📝 Hinweise
- SVG-Vorlagen werden aus `src/assets/teeth-svgs` und `src/assets/icon-svgs` geladen; daher muss statisches Hosting den öffentlichen Ordner bereitstellen.
- Der Odontogramm-Motor verwendet einen eigenen internen Zustand (kein React-State) für Performance und Einfachheit.
- Milchzähne verfügen über einen reduzierten Satz verfügbarer Materialien (kein Amalgam, kein stiftbasiertes Endo).
- Implantatzähne haben andere Kronen-/Abutment-Optionen als natürliche Zähne.

### 📖 Zitierung

Wenn Sie dieses Modul in Ihrer Arbeit verwenden, zitieren Sie es bitte.

**Diese Version (v1.49.0):**
> Dul, Z. (2026). *React Advanced Odontogram* (v1.49.0). Zenodo. https://doi.org/10.5281/zenodo.21156787

**Alle Versionen (Konzept-DOI):** https://doi.org/10.5281/zenodo.21156787

> Die obige versionsübergreifende Konzept-DOI verweist immer auf die zuletzt
> archivierte Version; eine versionsspezifische DOI wird bei jeder Version erst
> vergeben, wenn diese auf Zenodo archiviert wird. Solange v1.49.0 nicht archiviert
> ist, zitieren Sie sie bitte über die Konzept-DOI.

Maschinenlesbare Zitationsmetadaten finden Sie in [`CITATION.cff`](../../../CITATION.cff).
