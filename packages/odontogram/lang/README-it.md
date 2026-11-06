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

## 🇮🇹 Italiano

### 📋 Panoramica
Questo progetto è un editor di odontogramma interattivo basato su browser che supporta la registrazione rapida dello stato dentale con un'interfaccia pulita. Renderizza template SVG dentali a strati per rappresentare restauri, carie, stato endodontico, mobilità e altri dettagli clinici, offrendo selezione multipla, filtri di selezione e preset di stato predefiniti. Ogni posizione dentale ha il proprio disegno — sedici viste laterali permanenti, venti viste occlusali e la dentizione decidua — e la vista dall'alto dei denti anteriori è ciò che rende registrabile un reperto palatale su un incisivo, che la vista laterale non può mostrare.

---
![Odontogramma – anteprima (italiano)](screenshot_it_odontogram.png)

🔗 **Test URL:** https://react-odontogram-modul.vercel.app/

---

### 📦 Utilizzo come pacchetto npm

L'odontogramma è distribuito come libreria di componenti React autonoma su npm:
`@cognovis/odontogram`.

#### Requisiti
- **React 18 o 19** (dichiarato come peer dependency — fornito dalla tua app).
- Un **bundler** che comprenda il campo `exports` ed ESM: Vite, webpack 5, Next.js, Rollup, esbuild, Parcel. Il pacchetto è **solo ESM**.
- Node **≥ 18** per gli strumenti di build.

#### Installazione

```bash
bun add @cognovis/odontogram react react-dom
```

#### Utilizzo di base

Renderizza `OdontogramShell` e importa il foglio di stile **una sola volta** ovunque nella tua app:

```tsx
import { OdontogramShell } from "@cognovis/odontogram";
import "@cognovis/odontogram/style.css";

export function Chart() {
  return (
    <OdontogramShell
      language="it"          // hu | en | de | es | it | sk | pl | ru | pt-br | ar | zh | fr
      numberingSystem="FDI"  // FDI | Universal | Palmer
      darkMode={false}
    />
  );
}
```

#### Proprietà del componente

`OdontogramShell` è un componente controllato. Le proprietà più comuni:

| Proprietà | Tipo | Predefinito | Descrizione |
|------|------|---------|-------------|
| `language` | `Language` | `"hu"` | Lingua dell'interfaccia (`hu`/`en`/`de`/`es`/`it`/`sk`/`pl`/`ru`/`pt-br`/`ar`/`zh`). |
| `numberingSystem` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` | Sistema di numerazione dei denti. |
| `darkMode` | `boolean` | `false` | Attivazione del tema scuro. |
| `readOnly` | `boolean` | `false` | Disabilita tutte le modifiche (sola visualizzazione). |
| `themeConfig` | `OdontogramThemeConfig` | — | Sovrascrive le variabili CSS del tema (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | — | Registra plugin di stato personalizzati / livelli aggiuntivi. |
| `enableNotes` | `boolean` | `false` | Abilita le note per dente. |
| `enableIcdas` | `boolean` | `false` | Abilita il punteggio delle carie ICDAS II. |
| `onLanguageChange` / `onNumberingChange` / `onDarkModeChange` | `(value) => void` | — | Si attivano quando l'utente cambia l'impostazione dall'interfaccia. |

Sono accettate anche proprietà più granulari a livello di dettaglio (`pulpDetailLevel`, `secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`, `wearDetailLevel`, `discolorationDetailLevel`, `surfaceNotation`, `showStatusCard`, `showOrthoCard`) — consulta i tipi `.d.ts` distribuiti per l'elenco completo e tipizzato.

#### API pubblica (export con nome)

`OdontogramShell` è sia l'export predefinito sia un export con nome. L'API di stato imperativa, il componente autonomo `PerioChart`, il tour guidato e tutti i tipi pubblici sono export con nome dallo stesso punto di ingresso:

```ts
import {
  OdontogramShell,           // anche export predefinito
  PerioChart,                // componente grafico parodontale autonomo
  // lettura dello stato
  getOdontogramSummary,
  getToothStateSummary,
  onStateChange,             // sottoscrizione ai cambiamenti di stato
  // esportazione / importazione
  exportSvg, exportImage,    // esportazione vettoriale / raster del grafico
  // controllo
  setReadOnly, getReadOnly,
  clearSelection,
  registerPlugins, setPluginState, getPluginState,
  startIntroTour,            // avvia il tour di onboarding
  // …e molte altre funzioni di impostazione setX/getX
} from "@cognovis/odontogram";
```

La superficie completa (≈ 44 funzioni + tipi come `OdontogramSummary`, `OdontogramThemeConfig`, `OdontogramPlugin`, `PerioViewMode`, …) è completamente tipizzata nelle dichiarazioni incluse.

#### Utilizzo con Next.js (App Router)

Il componente è solo client-side, quindi renderizzalo da un Client Component:

```tsx
"use client";
import { OdontogramShell } from "@cognovis/odontogram";
import "@cognovis/odontogram/style.css";

export default function OdontogramClient() {
  return <OdontogramShell language="it" numberingSystem="FDI" />;
}
```

Oppure caricalo con un import dinamico solo client-side: `dynamic(() => import("./OdontogramClient"), { ssr: false })`.

#### Note importanti e limitazioni attuali
- **Solo ESM** — il pacchetto pubblica un modulo ES principale (`dist/odontogram.js`), con le corrispondenti dichiarazioni dei tipi (`dist/index.d.ts`). È destinato alla risoluzione dei moduli tramite bundler; non esiste una build CommonJS.
- **Il foglio di stile è separato** — **devi** importare `@cognovis/odontogram/style.css` una sola volta; non viene iniettato automaticamente. Lo stile è CSS globale ambito sotto `.odontogram-root` e guidato dalle variabili CSS `--odon-*`. Nella versione non ancora pubblicata non imposta nulla su `:root`, `html` o `body`: sfondo della pagina, font e token propri dell'host restano intatti; le superfici aggiunte a `<body>` (tour, popover) portano `.odontogram-portal`.
- **SSR / solo client** — il componente legge il DOM al montaggio (`document`), quindi deve essere eseguito nel browser. Nei framework SSR, renderizzalo in un Client Component (`"use client"`) oppure tramite un import dinamico solo client-side.
- **Risorse autonome** — gli SVG dei denti e delle icone sono incorporati nel bundle JavaScript in fase di build; non c'è **nessuna richiesta di risorse a runtime** da configurare e nulla da copiare in più nella tua cartella pubblica.
- **Più istanze, un solo editor attivo** — ogni `<OdontogramShell>` montato può mantenere il proprio stato clinico tramite una sessione isolata (`createOdontogramSession()`), e due sessioni non condividono mai i dati. L'editor DOM interattivo resta un unico motore globale, quindi lo controlla esattamente un'istanza montata alla volta: quella istanza renderizza il grafico, le altre renderizzano un segnaposto inattivo e restano pienamente leggibili e scrivibili tramite la loro API di sessione. Allo smontaggio dell'istanza attiva subentra una in attesa.

---

### ✨ Funzionalità principali
- 🖱️ Selezione rapida e selezione multipla (CMD/CTRL + clic)
- 🦷 Tipi di dente: permanente, deciduo (da latte), impianto, sottogengivale, mancante
- 🍼 La dentizione decidua ha un'anatomia propria: otto modelli generati coprono tutti i venti denti decidui con proporzioni radicolari, lunghezze e larghezze misurate, una polpa relativamente più ampia e radici divergenti attorno al germe permanente. Registrando un dente come deciduo, il suo disegno prende il posto di quello del successore. In FHIR il dente è identificato come **51–85**, perché in FDI è il numero stesso a dire a quale dentizione appartiene; in importazione decide quel numero e viene sovrascritta solo la presenza
- 🦷 Substrato dentale (ortogonale a qualsiasi restauro): naturale, radix (residuo radicolare), fratturato, preparato per corona
- 👑 Restauri per tipo × materiale: corona / inlay / onlay / faccetta / ponte in e.max, oro, gradia, zirconio, metallo, metalloceramica, telescopico o provvisorio (l'onlay è disponibile solo in vista occlusale) — scelti da un unico selettore combinato a basso numero di clic "Corona – …"; le corone `metal` esistenti migrano a `metal-ceramic` (PFM, metalloceramica); gli impianti utilizzano lo stesso modello tipo × materiale, composto con un livello connettore per impianto. Il selettore è delimitato in base al tipo di dente: un impianto offre solo corona/ponte (più le sue cinque opzioni di attacco, di seguito); un dente mancante/spazio offre solo un elemento intermedio di ponte (più protesi parziale/totale rimovibile); un substrato `radix` nasconde interamente il controllo del restauro (nessun restauro può essere assegnato a un residuo radicolare)
- 🦿 Protesi rimovibili/su attacco sull'asse dedicato `prosthesis` (voci "Kivehető:" nel selettore combinato): abutment di guarigione dell'impianto, locator, locator con overdenture, barra, barra con overdenture; protesi parziale o totale rimovibile supportata dai denti
- 🌉 I denti di ponte visualizzano sia la cappa della corona sia il connettore a sella; un overlay del tratto di ponte multi-dente disegna un unico connettore continuo, sensibile all'arcata, attraverso i denti di ponte consecutivi (elementi intermedi + pilastri) e gli spazi tra i denti (arcata superiore e inferiore usano una geometria a sella speculare, mantenendo il connettore allineato su entrambe le arcate), incluso nell'esportazione PNG/JPG/SVG; l'applicazione di un ponte tramite un preset di Stati ricalcola immediatamente l'overlay
- 🔍 Registrazione delle carie su 6 superfici: mesiale, distale, buccale, linguale, occlusale, sottocoronale
- 🪥 Materiali di otturazione per superficie: amalgama, composito, vetroionomero (GIC), provvisorio
- 🏥 Un unico selettore combinato "Stato polpa / endodonzia" (raggruppato: polpa vitale vs. trattata/endodonzia) per l'otturazione medicinale, completa o incompleta, più un selettore indipendente per il materiale del perno radicolare (`rootPostType`: none / glass-fiber / metal): il trattamento endodontico e la diagnosi pulpare AAE (`pulpDx`: normale / pulpite reversibile / irreversibile / necrosi) si escludono a vicenda, mentre il perno può coesistere con qualsiasi stato dell'otturazione radicolare. Un dente trattato endodonticamente (`endo` impostato) non può avere anche una diagnosi di polpa vitale; al momento del trattamento, `pulpDx` viene normalizzato a `normal` e il glifo di polpa malata viene soppresso. La pulpite reversibile visualizza un glifo di polpa ridotto. Un'impostazione opzionale a 3 livelli di dettaglio pulpare (`pulpDetailLevel`: simple / AAE / latino pratico) mostra 9 sottotipi in latino pratico (pulpa sana … gangraena pulpae) tramite `pulpLatin`; la resezione e il perno parapulpale restano indicatori speciali separati
- 🦴 La diagnosi apicale (`apicalDx`: parodontite apicale sintomatica/asintomatica, ascesso apicale acuto/cronico, osteite condensante) determina direttamente il glifo periapicale; un qualificatore di sottotipo di lesione granuloma/cisti viene mostrato solo in presenza di parodontite apicale sintomatica/asintomatica (il sottotipo ridondante "ascesso" è stato rimosso — è già coperto dalla diagnosi apicale)
- 🩹 Scheda unificata "Radice e parodonto" (un'unica sezione a comparsa per i reperti radicolari/periapicali e parodontali)
- ⚕️ Modifiche: infiammazione periapicale (mostrata solo sui denti mancanti/con alveolo post-estrattivo; nascosta sui denti presenti, dove è solo `apicalDx` a determinare il glifo periapicale, e sugli impianti, dove se ne occupa `periImplant`), malattia parodontale, gradi di mobilità (M1/M2/M3, nascosti sugli impianti)
- 🦷🔩 Stato peri-implantare (`periImplant`: none / mucositis / peri-implantitis-mild / -moderate / -severe) — stadiazione del World Workshop 2018, mostrata come selettore dedicato sugli impianti; la mucosite riutilizza il glifo gengivale parodontale, la perimplantite aggiunge un livello graduato `peri-implant-bone-loss` (opacità 0,4/0,7/1,0). Gli impianti non visualizzano più il glifo della lesione periapicale — la loro infiammazione viene invece espressa tramite questo asse — e le caselle di spunta dei modificatori parodontali sono nascoste sugli impianti (la rietichettatura ad hoc della casella "Perimplantite" è stata ritirata)
- 🏷️ Indicatori speciali: corona necessaria, sostituzione corona necessaria, spazio chiuso dopo estrazione, estrazione pianificata, sigillatura dei solchi, perdita del punto di contatto
- 👁️ Vista occlusale, denti del giudizio, attivazione/disattivazione visibilità di osso e polpa
- 🔢 12 filtri di selezione (tutti, presenti, permanenti, decidui, impianti, mancanti, superiori/inferiori, frontali/molari)
- 📊 Preset di stato predefiniti (ripristino, dentizione primaria, dentizione mista, edentulo)
- 📦 34 template di restauro predefiniti (ponti, protesi rimovibili, protesi su barra con impianti)
- 💾 Esportazione/importazione dello stato in JSON (versione 2.20; le importazioni continuano ad accettare le versioni legacy 1.4 e da 2.0 a 2.19 e vengono migrate automaticamente, con stati personalizzati dei plugin e note per dente)
- 🧭 **L'ortodonzia è la terza vista clinica** (`odontogram-c51`): un selettore `Odontogram | Stato parodontale | Ortodonzia` (`#appViewToggle`) ospita la scheda di analisi dei modelli seguente. L'odontogramma non viene mai smontato, solo nascosto, quindi cambiare vista non può alterare la cartella. La vista ortodontica non ha una finestra propria e resta perciò un segmento del selettore anche dove lo stato parodontale è configurato come popup: in tal caso scompare solo quel segmento.
- 📐 **Analisi dei modelli** (`odontogram-c51.1`): Tonn e Bolton dalle larghezze mesiodistali, con la somma incisiva target, la discrepanza dimensionale e quale arcata porta l'eccesso. Inserimento su un'arcata o come elenco — due viste dello stesso record. Un dente non presente sul modello (non erotto, perso, sotto gengiva) assume la larghezza del controlaterale, marcata visibilmente come ipotesi. In più overjet, overbite e deviazione della linea mediana per arcata
- 🔗 Aidbox Dental Core tramite `@cognovis/fhir-sdk`: l'host inietta un gateway; la sessione carica e salva. Export/import JSON dello stato con migrazioni
- ✚ Interfaccia di selezione superfici a croce (B/M/O/D/L) per carie e otturazioni
- 🧱 Materiali di restauro per superficie (otturazioni miste, es. buccale amalgama + distale composito)
- 🖼️ Esportazione immagine PNG/JPG/SVG dell'odontogramma (scaricabile; PNG/JPG rasterizzato da SVG vettoriale)
- 🦷 Carie/carie secondaria è una macchina a stati per superficie: una superficie cariata senza otturazione viene visualizzata come carie primaria (opacità a livelli ICDAS); non appena quella superficie ha un'otturazione, viene visualizzata invece come carie secondaria (ricorrente) (livello `subcaries-{surface}`, punteggio CARS) — le due non sono mai attive contemporaneamente sulla stessa superficie
- 🎯 Gravità unificata per superficie (`cariesSeverity`, 0–6, sostituisce i precedenti campi separati di profondità ICDAS e CARS): letta come profondità ICDAS su una superficie primaria, come punteggio CARS con nome (Sano … Cavità estesa) su una ricorrente, tramite un popup contestuale che mostra solo la scala pertinente allo stato attuale della superficie
- 🌱 Carie radicolare (`rootCaries`: none / active / arrested / active-cavitated), che attiva il livello grafico dedicato alla carie radicolare con un'opacità determinata dalla gravità (active 0,5 / arrested 0,7 / active-cavitated opacità piena)
- 🎚️ Tre impostazioni di granularità della carie (`secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`) più un interruttore `cariesDepthEnabled`, che riducono ciascuna scala a una selezione più semplice senza perdere il valore memorizzato
- 🩹 Riga di riepilogo delle carie secondarie nel pannello otturazioni: elenca, sotto i controlli delle otturazioni, ogni dente selezionato con carie secondaria e le relative superfici (es. "36 (O) ha carie secondaria sulla sua otturazione.")
- 🪛 Difetti di otturazione per superficie (`fillingDefect`: none / marginal / fracture / wear) sui restauri diretti, indipendenti dalla carie secondaria — inseriti tramite un indicatore per superficie sulla scheda Otturazioni (speculare all'indicatore di profondità carie, con il suo elenco di opzioni disposto verticalmente), visualizzati sull'odontogramma e mostrati nel tooltip e nel riepilogo otturazioni dell'intera bocca con un'etichetta esplicita (es. "36 (O) – Difetto di otturazione: O: marginal"), allo stesso modo in cui la carie secondaria viene etichettata sulla riga Carie; la scheda Otturazioni mostra anche una nota di suggerimento per ogni dente selezionato con un difetto di otturazione registrato (es. "36 ha un difetto di otturazione registrato."), analogamente alla nota di suggerimento esistente per la carie secondaria
- 🔗 Elementi di ritenzione che trattengono una protesi rimovibile su un dente naturale (`retention`, `retentionSide`) — tre ancoraggi, non un asse: un **gancio** richiede solo il dente presente, un **attacco** e un **pilastro di barra** richiedono una corona. UN valore per dente, mai un insieme. Il gancio è DISEGNATO come braccio a quarto d'arco sulla corona (ventre verso la gengiva, specchiato per arcata); attacco e barra portano i segni di charly `( G )` e `ste`. La **campata della barra è derivata**, mai memorizzata, e una barra può poggiare insieme su pilastri implantari e naturali
- 🎨 **I colori dei restauri sono scegliibili** (Impostazioni → Colori). Ogni riempimento è una variabile CSS con il colore di fabbrica come ripiego; e.max e metallo-ceramica dipingono da una rampa di nove stop e la scelta ne conserva la variazione di luminosità. Preferenza dello studio, non parte del documento.
- 🔩 Un **prodotto implantare vuoto è una lacuna solo dove è stato lo studio a inserire l'impianto** (`isImplantProductGap`) — quello con cui il paziente è arrivato è un record completo, perché non tutti hanno un passaporto implantare. Derivato dall'esame iniziale, mai memorizzato.
- 🦷🔻 Coinvolgimento cervicale di un'otturazione o di una lesione cariosa (`cervicalSurfaces`: un insieme sulle superfici vestibolare e orale) — la regione cervicale **non** è una sesta superficie ma un marcatore su una esistente (BEMA la scrive come suffisso "vz"/"lz"), quindi non cambia mai il conteggio delle superfici che un livello di posizione legge (`getFillingSurfaceCount()`); si registra nello stesso popup per superficie aperto dalla croce della carie e da quella delle otturazioni, è contrassegnato sulla cella della superficie con la lettera del suffisso e compare nel tooltip e nella riga del reperto che qualifica nel riepilogo dell'intera bocca. Deliberatamente non disegnato sul grafico — la vista laterale non ha alcuno strato linguale
- 🦷💥 Usura dentale tipizzata per causa clinica e localizzazione (`wearEdge`: none / attrition / erosion, incisale/occlusale; `wearCervical`: none / abrasion / abfraction / erosion, cervicale) — sostituisce i due flag on/off di usura da bruxismo; inserita tramite due menu a tendina sulla riga usura, riutilizza la grafica esistente e viene mostrata nel tooltip e in una nuova sezione di riepilogo "Usura" per l'intera bocca
- 🎨 Discromia dentale per causa (`discoloration`: none / tetracycline / fluorosis / nonvital / extrinsic / other) su denti permanenti e decidui — colora la corona naturale visualizzata con un colore rappresentativo quando il dente non ha restauro e ha substrato naturale; mostrata nel tooltip e in una nuova sezione di riepilogo "Discromia" per l'intera bocca; completa l'insieme delle condizioni di superficie e strutturali insieme ai difetti di otturazione e all'usura
- ✏️ I denti anteriori (incisivi/canini) etichettano la loro superficie occlusale come "incisale" in tutta l'interfaccia (selettore, popup, riepiloghi); la chiave di superficie memorizzata resta `occlusal`
- 🔤 Notazione delle superfici sensibile alla posizione (Impostazioni → Dettagli dentali → "Notazione superfici", simple/full, predefinito full): in modalità full la lettera e l'etichetta della superficie di carie/otturazione seguono l'anatomia del dente — occlusale → I/incisale sui denti anteriori, buccale → L/labiale sui denti anteriori, linguale → P/palatale sui denti superiori e L/linguale sui denti inferiori (mesiale/distale/sottocoronale non sono interessati); la modalità simple usa sempre l'insieme generico B/M/O/D/L/SC indipendentemente dalla posizione del dente. Si applica al riepilogo dell'intera bocca e a entrambi i selettori di superficie per carie e difetti di otturazione (lettera + didascalia); la chiave di superficie memorizzata non è interessata
- 🦷↕️ Registrazione ortodontica per dente (`orthoAppliance`: none / bracket / band; `orthoDrift`: none / mesial / distal; `orthoVertical`: none / extrusion / intrusion; `orthoRotation`: booleano) su un dente naturale presente (permanente o deciduo) — riutilizza la grafica ortodontica dormiente della v2.5.0 (nessun nuovo SVG); mostrata sull'odontogramma, nel tooltip e in una nuova sezione di riepilogo "Ortodonzia" per l'intera bocca
- 🪨 Tartaro, e riassorbimento radicolare tipizzato come interno o cervicale esterno (`resorptionType`)
- 📏 Profondità della carie per superficie (superficiale / dentina / profonda), o punteggio ICDAS II opzionale (0–6) tramite `enableIcdas`
- 🩹 Interruttore di microinfiltrazione marginale della corona, visibile solo con restauro a corona o ponte
- 🧰 Barra superiore di icone unificata con una finestra modale Impostazioni a schede (Generale / Pannelli / Dettagli dentali / Carie / Polpa / Note / Parodontale — numerazione, note, visibilità pannelli, ICDAS, interruttore profondità carie, granularità carie radicolare/radiografica, livello di dettaglio pulpare, livello di dettaglio usura/discromia dentale, informazioni dentali)
- 🗂️ Impostazioni → scheda "Pannelli": mostra/nasconde in modo indipendente i pannelli di riepilogo Stati e Ortodonzia per l'intera bocca
- 🦷🩺 Impostazioni → scheda "Parodontale": 16 interruttori mostra/nascondi per indice per le righe del grafico parodontale (raggruppati in tasca/igiene/mucogengivale/supporto/peri-implantare — PD/GM/CAL/BOP, placca, PI, GI, visibilità CEJ, concavità radicolare, KG, GT, forcazione, mobilità, classe di Miller, mPI, mBI), ciascuno con una descrizione, più un'opzione di visualizzazione del nome degli indici tradotta-vs-canonica (canonica = un nome scientifico fisso in inglese/latino in ogni lingua dell'interfaccia; i tooltip restano sempre localizzati indipendentemente da questa impostazione). Entrambe sono preferenze a livello di applicazione (come `perioViewMode`) — mai parte del payload di esportazione
- 🩹 Il controllo delle impostazioni di carie secondaria (CARS) è stato unito alla scheda Impostazioni Carie, posizionato sopra Profondità radiografica (la scheda separata "Carie secondaria" è stata ritirata)
- 🎚️ Livello di dettaglio dei dettagli dentali (Impostazioni → Dettagli dentali): un'impostazione simple/complex per l'usura dentale e per la discromia. La modalità simple mostra un interruttore sì/no per ciascun reperto (usura attiva → attrition/abrasion, discromia attiva → other); la modalità complex (predefinita) mantiene i menu a tendina di tipo/causa, e il valore memorizzato viene conservato passando da un livello all'altro
- 📋 Pannello informazioni dentali: riepilogo testuale in tempo reale dell'intero odontogramma (conteggio denti, elenchi presenti/mancanti, carie incl. secondaria, otturazioni, trattamenti canalari, protesi, impianti, stato parodontale) — visibile per impostazione predefinita, attivabile/disattivabile nelle Impostazioni
- 🗂️ Menu di esportazione unificato (Stato JSON / FHIR / PNG / JPG)
- 📥 Menu di importazione con importazione FHIR (ricarica Bundle esportati)
- ⏳ Overlay di avanzamento durante l'esportazione delle immagini
- 🎓 Tour introduttivo interattivo in 12 passi
- 🔢 Tre sistemi di numerazione (FDI, Universal, Palmer)
- 🌐 I18n (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) con selettore di lingua (190+ chiavi di traduzione per lingua)
- 🌗 Supporto modalità scura con pulsante di attivazione (autonoma o controllata dall'app principale)
- 🎨 Configurazione tema personalizzato (prop `themeConfig`) con proprietà CSS personalizzate (`--odon-*`)
- 📱 UX touch su mobile: popover zoom al tocco, menu contestuale con pressione prolungata, zoom a pizzico, target touch WCAG 44px, navigazione per arcata
- 🔌 Sistema di plugin SVG personalizzati: overlay visivi, stato personalizzato per dente, supporto esportazione/importazione JSON
- ⚠️ Avvisi di validazione dello stato per combinazioni di stati dentali incompatibili
- 🏷️ Tooltip automatico dello stato sui riquadri dentali (mostra tutti gli stati attivi)
- 🩺 Tooltip per dente e pannello di riepilogo per l'intera bocca modernizzati: entrambi mostrano l'intero set di reperti clinici (diagnosi pulpare/apicale + sottotipo di lesione, riassorbimento radicolare, stato peri-implantare, carie radicolare graduata, tartaro, microinfiltrazione marginale della corona, frattura, perdita di contatto, usura tipizzata del bordo/cervicale), con una sezione dedicata "Diagnosi" nel pannello, una sezione dedicata "Usura", e un qualificatore grossolano di gravità della carie (superficiale/moderata/profonda)
- ♿ Accessibilità da tastiera (WCAG): ruoli ARIA listbox/option, selezione con Invio/Spazio, navigazione con tasti freccia, contorni focus-visible
- 🔒 Modalità sola lettura: disabilita tutte le interazioni per casi d'uso di stampa/report/visualizzazione
- ✨ Animazioni di selezione: bordo tratteggiato pulsante e ombra luminosa sui denti selezionati (con supporto prefers-reduced-motion)
- 📝 Note per dente: doppio clic per aggiungere/modificare note, icona nota accanto al numero del dente, tooltip al passaggio del cursore con il testo della nota, una riga "Note individuali" nel pannello di riepilogo dell'intera bocca, esportazione/importazione JSON
- 🔀 Divisione tra grafico Stato e Piano: un interruttore `Status | Plan` nell'intestazione del grafico passa tra un grafico dello **stato** attuale e un grafico del **piano** (trattamento post-operatorio previsto), ciascuno con i propri stati dentali; il grafico del piano parte come copia dello stato la prima volta che vi si passa, e le modifiche in un grafico non influenzano mai l'altro. Esportazione/importazione (`exportStatus`/importazione file) hanno sempre come destinazione il grafico dello stato; il grafico del piano viene letto/scritto separatamente tramite la propria API (vedi API pubblica di seguito) e — quando differisce dallo stato — viene incluso come sezione aggiuntiva `plan` nell'esportazione JSON
- 📝 Riquadro "Cosa cambia": ogni volta che il piano differisce dallo stato attuale, un riquadro sotto il pannello informazioni dentali elenca ogni differenza per dente e per asse di trattamento (presenza, substrato, restauro, protesi, corona pianificata, ortodonzia, polpa/endodonzia, apicale) come riga `dente: asse  da → a`; disponibile anche a livello di programmazione tramite `getPlanChanges()`

![Grafico parodontale a bocca intera (italiano)](screenshot_it_perio.png)

- 🅿️ Stile "proposto": in modalità Piano, i reperti che il piano **aggiunge** rispetto allo stato attuale (corona pianificata, estrazione, movimento ortodontico, protesi, …) vengono visualizzati con un distinto **contorno tratteggiato e colorato "proposto"**, in modo che il piano si legga come intenzione e non come fatto — con una legenda "tratteggiato = proposto" nella scheda del grafico. Il rendering in modalità Stato è identico byte per byte; il trattamento è solo del piano e viene completamente ripristinato tornando indietro
- 🚦 Restrizioni in modalità Piano: il grafico del Piano mostra solo ciò che un dentista può *fare* — il selettore di base offre solo Assente / Permanente / Impianto, e i reperti di sola diagnosi (carie, usura dentale, discromia, e l'intero blocco parodontale — mobilità, griglia di sondaggio a sei siti, modificatori di infiammazione/parodontali, tartaro, stato peri-implantare) sono nascosti; il controllo polpa/endodonzia mantiene il **trattamento** endodontico (canalare / perno / apicectomia / perno parapulpare) nascondendo invece la **diagnosi** pulpare/apicale e il riassorbimento radicolare. Restauro, protesi, ortodonzia, necessità/sostituzione della corona e piano di estrazione restano pianificabili
- 🧪 1746 test automatizzati superati (1 test aggiuntivo saltato) (Vitest) in 164 file di test (165 totali) che coprono numerazione, traduzioni, preset, i18n, componente App, tema, touch, plugin, accessibilità e parità degli assi clinici/diagnosi
- 📖 Documentazione API TypeDoc con commenti JSDoc su tutti gli export pubblici (`bun run docs`)

### 📦 Moduli
- 🦷 Griglia dell'odontogramma e interfaccia dei riquadri dentali
- 🎛️ Pannello di controllo e stato
- 🎨 Motore di stratificazione SVG e template
- 🔢 Numerazione dentale e mappatura delle etichette (FDI/Universal/Palmer)
- 🌐 Localizzazione (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- 💾 Esportazione/importazione dello stato
- 📋 Extra di stato: template di restauro predefiniti
- 🎨 Configurazione del tema: palette di colori personalizzabile tramite proprietà CSS `--odon-*`
- 📱 Interazioni touch su mobile (zoom al tocco, pressione prolungata, zoom a pizzico, selettore arcata)
- 🔌 Sistema di plugin SVG personalizzati
- ⚠️ Sistema di validazione dello stato e tooltip
- ♿ Accessibilità da tastiera e supporto ARIA
- 🔒 Modalità sola lettura
- ✨ Animazioni di selezione
- 📝 Sistema di note per dente
- 🧪 Suite di test automatizzati (Vitest + Testing Library)

### 🛠️ Controlli dell'interfaccia

**🔝 Barra superiore:**
- Selettore di lingua (menu a tendina HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- Pulsante modalità scura (icona sole/luna, alterna tra tema chiaro e scuro)
- Selettore del sistema di numerazione (menu a tendina FDI/Universal/Palmer)
- Pulsanti Esporta stato / Importa stato

**📊 Intestazione del grafico:**
- Attivazione/disattivazione vista occlusale
- Attivazione/disattivazione visibilità denti del giudizio
- Attivazione/disattivazione visibilità osso
- Attivazione/disattivazione visibilità polpa
- Pulsante cancella selezione

**🔍 Filtri di selezione:**
- Seleziona tutti / Tutti i presenti / Permanenti / Decidui / Impianti / Tutti i mancanti
- Superiori / Superiori 6 frontali / Molari superiori
- Inferiori / Inferiori 6 frontali / Molari inferiori

**📋 Preset di stato:**
- Ripristina tutto (ripristina bocca)
- Dentizione primaria
- Dentizione mista
- Attivazione/disattivazione edentulo

**📦 Menu a tendina extra di stato:**
- Ponti in zirconio superiori/inferiori (12-22, 13-23, 16-26, arcata completa)
- Ponti in metallo superiori/inferiori (12-22, 13-23, 16-26, arcata completa)
- Protesi parziali rimovibili superiori/inferiori
- Protesi totali rimovibili superiori/inferiori
- Protesi su barra superiori/inferiori con impianti

**🦷 Pannello editor dente** (per il dente/i denti selezionati, raggruppato in schede a comparsa):
- **Riga base:** selezione del dente (tipo base incl. varianti di corona fratturata) e substrato dentale (natural/radix/broken/crownprep)
- **Riga restauro:** il menu a tendina combinato di restauro raggruppato per tipo (Corona / Ponte / Intarsio / Onlay / Faccetta / «Kivehető:»), con ogni riga che nomina il proprio tipo e materiale (opzioni fisse `restorationType`×`restorationMaterial` più le opzioni di attacco/rimovibili `prosthesis`, filtrate in base al tipo di dente); casella di spunta microinfiltrazione marginale della corona (solo corona/ponte); caselle di spunta per la localizzazione della corona fratturata; interruttori corona necessaria / sostituzione corona necessaria
- **Riga usura e discromia:** menu a tendina tipo di usura incisale/occlusale, menu a tendina tipo di usura cervicale, menu a tendina causa di discromia (ciascuno si trasforma in un semplice interruttore sì/no in Impostazioni → Dettagli dentali → modalità simple)
- **Scheda Ortodonzia:** apparecchio, deriva mesiale/distale, movimento verticale (estrusione/intrusione), interruttore rotazione — mostrata su un dente naturale presente
- **Scheda Carie:** menu a tendina modalità profondità carie, casella di spunta carie sottocoronale, menu a tendina gravità carie radicolare, e il selettore di carie per superficie B/M/O/D/L con un popup contestuale profondità ICDAS/CARS e un badge di profondità radiografica
- **Scheda Otturazioni:** menu a tendina materiale otturazione, selettore otturazione per superficie (con materiale per superficie), indicatore di difetto di otturazione per superficie (marginal/fracture/wear), note di suggerimento per carie secondaria e difetto di otturazione
- **Scheda Radice e parodonto:** selettore combinato "Stato polpa / endodonzia", selettore diagnosi apicale, selettore sottotipo di lesione periapicale (solo parodontite apicale sintomatica/asintomatica), selettore tipo di riassorbimento radicolare, selettore grado di mobilità, selettore stato peri-implantare (solo impianti)
- **Indicatori speciali:** piano/ferita di estrazione, spazio chiuso, sigillatura dei solchi, perdita del punto di contatto, tartaro, perno parapulpale, resezione endodontica, pilastro di ponte

### ⌨️ Rilevazione tramite abbreviazioni

I rilievi si prendono in pochi secondi, spesso dettati. Con 46 assi e 129 valori il numero di
percorsi a clic è il vero collo di bottiglia, quindi la cartella si compila come si digita già
(`odontogram-t8y`):

```
selezionare 13–23  trascinare sui denti, Maiusc + freccia o Maiusc + clic
E                  modo materiale: ceramica — resta impostato
k                  sei corone, un solo tasto
```

**Il materiale precede il rilievo e resta impostato**, come modalità e non come aggiunta. Un tasto
materiale ha due letture, perché otturazione e restauro attingono a insiemi di valori diversi:
`K mo` è un'otturazione in composito su due superfici, `K k` una corona in Gradia. Dove una lettura
non esiste, non se ne inventa alcuna.

**Il tabulatore passa al dente successivo**, Maiusc+tabulatore torna indietro, partendo da 18 e
girando intorno alla bocca (18–28, poi 38–48), con ritorno ciclico. Sposta la selezione, non solo
il fuoco, così il dente su cui ci si trova è evidenziato. Le frecce restano invariate.

```
G k    Tab    b          corona in oro, poi un elemento intermedio sul vicino
A  mod Tab               un'otturazione in amalgama su tre superfici
c mod K3                 carie su tre superfici, con gravità
```

La corrispondenza vive in `src/shorthand.ts`, senza DOM e indipendente dal motore, perché lo stesso
insieme di rilievi deve essere raggiungibile in tre modi: tastiera, interrogazione FHIR verso un
gestionale e voce.

L'abbreviazione è trascritta dal tastierino dei rilievi di *charly* (solutio), non inventata.

Un tratto segue l'**arcata**, non la geometria (`odontogram-apn`): attraverso la linea mediana (da
13 a 23) sì, tra le arcate mai.

### 🦷 Tipi di dente e stati

**Selezione del dente (tipo base):**
| Valore | Descrizione |
|---|---|
| `none` | Dente mancante |
| `tooth-base` | Dente permanente |
| `milktooth` | Dente deciduo (da latte) |
| `implant` | Impianto dentale |
| `tooth-under-gum` | Dente sottogengivale (non erotto) |

**Varianti di dente fratturato:**
`tooth-broken-inicisal`, `tooth-broken-distal-inicisal`, `tooth-broken-distal`, `tooth-broken-mesial-distal-inicisal`, `tooth-broken-mesial-distal`, `tooth-broken-mesial-inicisal`, `tooth-broken-mesial`, `no-tooth-after-extraction`

**Substrato dentale (denti permanenti):**
`natural` (predefinito), `radix` (residuo radicolare), `broken`, `crownprep` (preparato per corona)

**Tipo di restauro (denti permanenti):**
`none`, `crown`, `inlay`, `onlay` (solo vista occlusale), `veneer`, `bridge`

**Materiale del restauro (denti permanenti):**
`none`, `emax`, `gold`, `gradia`, `zircon`, `metal`, `metal-ceramic` (le corone `metal` esistenti migrano qui), `telescope`, `temporary`

**Le opzioni di restauro sono filtrate in base al tipo di dente** (`restorationOptions()` in `src/registry/restorations.ts`): un impianto offre solo i tipi di restauro `crown`/`bridge` (composti con un livello connettore per impianto) più le cinque voci di attacco `prosthesis` di seguito; un dente mancante/spazio offre solo un elemento intermedio `bridge` più le due voci di protesi rimovibile `prosthesis`; un substrato `radix` nasconde interamente il controllo del restauro. I vecchi campi piatti `crownMaterial`/`bridgeUnit` (valori di attacco impianto/ponte precedenti alla v1.14) sono stati ritirati dal modello attivo — vengono accettati solo come percorso di migrazione in sola lettura per i vecchi payload.

**Protesi** (`prosthesis`; asse ortogonale rimovibile/attacco, mostrato come voci "Kivehető:" nel menu a tendina di restauro combinato):
`none`, `healing-abutment`, `locator`, `locator-denture`, `bar`, `bar-denture` (attacchi implantari, con o senza overdenture), `removable-partial`, `removable-full` (protesi supportate dai denti su un dente mancante/spazio). Un dente ha o un restauro fisso o una protesi, mai entrambi — impostarne uno cancella l'altro.

**Microinfiltrazione marginale della corona** (`crownLeakage`; booleano): mostrata solo quando `restorationType` è `crown` o `bridge`; attiva il livello grafico `crown-leakage`.

**Opzioni endodontiche (denti permanenti):**
`none`, `endo-medical-filling`, `endo-filling`, `endo-filling-incomplete`

**Materiale del perno radicolare (denti permanenti, indipendente da `endo`):**
`none`, `glass-fiber`, `metal`

**Opzioni endodontiche (denti decidui):**
`none`, `endo-medical-filling`

`endo` e `pulpDx` vengono presentati tramite un unico `<select>` combinato "Stato polpa / endodonzia" (raggruppato: polpa vitale vs. trattata/endodonzia) e si escludono a vicenda — scegliendo un'opzione trattata (`endo != none`) `pulpDx` viene reimpostato a `normal`, e scegliendo una diagnosi pulpare `endo` viene reimpostato a `none`.

**Materiali di otturazione (denti permanenti):**
`amalgam`, `composite`, `gic`, `temporary`

**Materiali di otturazione (denti decidui):**
`composite`, `gic`, `temporary`

**Superfici di otturazione/carie:**
`mesial`, `distal`, `buccal`, `lingual`, `occlusal`, `subcrown` (solo carie)

**Modifiche:**
`inflammation` (periapicale), `parodontal` (parodontale), `mobility` (M1/M2/M3)

**Tipo di lesione periapicale** (`periapicalType`; qualifica il glifo periapicale, mostrato solo in presenza di parodontite apicale sintomatica/asintomatica):
`none`, `granuloma`, `cyst` — opzioni disponibili nel selettore; il vecchio valore `abscess` è ancora accettato/memorizzato ma non più offerto nel selettore, poiché duplica la diagnosi apicale. In importazione viene eliminato: incorporato in `apicalDx` quando il dente presenta il modificatore di infiammazione, altrimenti azzerato a `none`

**Diagnosi pulpare** (terminologia AAE; `pulpDx`):
`normal`, `reversible-pulpitis` (visualizza un glifo di polpa ridotto), `irreversible-pulpitis`, `necrosis` — si esclude reciprocamente con `endo`; normalizzata a `normal` su un dente trattato endodonticamente

**Diagnosi pulpare, latino pratico** (`pulpLatin`; mostrata dal selettore di pulpa solo quando `pulpDetailLevel` è `latin`):
`none`, `pulpa-sana`, `hyperaemia-pulpae`, `pulpitis-acuta-serosa`, `pulpitis-acuta-purulenta`, `pulpitis-chronica-clausa`, `pulpitis-chronica-ulcerosa`, `pulpitis-chronica-hyperplastica`, `necrosis-pulpae`, `gangraena-pulpae`

**Livello di dettaglio pulpare** (`pulpDetailLevel`, impostazione globale): `simple`, `aae` (predefinito), `latin` — controlla il vocabolario offerto dal selettore di pulpa

**Diagnosi apicale** (`apicalDx`; determina il glifo periapicale):
`normal`, `symptomatic-apical-periodontitis`, `asymptomatic-apical-periodontitis`, `acute-apical-abscess`, `chronic-apical-abscess`, `condensing-osteitis`

**Tipo di riassorbimento radicolare** (`resorptionType`):
`none`, `internal`, `external-cervical`

**Stato peri-implantare** (`periImplant`; solo impianti, stadiazione del World Workshop 2018): `mucositis` riutilizza il glifo gengivale parodontale; `peri-implantitis-*` aggiunge il livello `peri-implant-bone-loss` con un'opacità scalata in base alla gravità (mild 0,4 / moderate 0,7 / severe 1,0). Gli impianti non visualizzano più il glifo della lesione periapicale (la loro infiammazione viene invece espressa tramite questo asse), e le caselle di spunta `mods` di infiammazione/parodontale sono nascoste sugli impianti:
`none`, `mucositis`, `peri-implantitis-mild`, `peri-implantitis-moderate`, `peri-implantitis-severe`

**Gravità della carie** (`cariesSeverity`; campo unificato per superficie, `0`–`6`): su una superficie senza otturazione viene letta come scala di profondità ICDAS (`superficial` / `dentin` / `deep`, oppure i codici ICDAS II grezzi `0–6` quando `enableIcdas` è attivo) e visualizza il livello primario `caries-{surface}`; su una superficie con otturazione viene letta come punteggio CARS con nome (`0` sano … `6` cavità estesa) e visualizza invece il livello `subcaries-{surface}` (carie ricorrente) — una superficie non è mai contemporaneamente primaria e ricorrente

**Carie radicolare** (`rootCaries`; attiva il livello grafico `caries-root` su un dente presente, con opacità determinata dalla gravità — `active` 0,5 / `arrested` 0,7 / `active-cavitated` opacità piena):
`none`, `active`, `arrested`, `active-cavitated`

**Profondità radiografica della carie** (`radiographicDepth`; per superficie, indipendente dalla scala visiva ICDAS/CARS `cariesSeverity`):
`none`, `E1`, `E2`, `D1`, `D2`, `D3`

**Impostazioni di granularità della carie** (globali): `secondaryCariesMode` (`simple`/`standard`/`full`, predefinito `standard`), `rootCariesMode` (`simple`/`severity`, predefinito `simple`), `radiographicDepthMode` (`off`/`threeLevel`/`detailed`, predefinito `off`), `cariesDepthEnabled` (booleano, predefinito `true`) — ciascuna riduce la propria scala a una selezione più semplice senza alterare il valore memorizzato

**Indicatori speciali:**
`crownNeeded`, `crownReplace`, `missingClosed`, `extractionPlan`, `extractionWound`, `bridgePillar`, `fissureSealing`, `contactMesial`, `contactDistal`, `endoResection`, `calculus`, `parapulpalPin`

**Usura dentale** (`wearEdge`, `wearCervical`; tipo clinico per localizzazione, condizionato a dente-base + nessun restauro + substrato naturale; attiva i livelli esistenti `tooth-bruxism-wear`/`tooth-bruxism-neck-wear`):
`wearEdge`: `none`, `attrition`, `erosion` — `wearCervical`: `none`, `abrasion`, `abfraction`, `erosion`

**Discromia** (`discoloration`; causa per dente, condizionata a un dente-base naturale o dente deciduo + nessun restauro + substrato naturale; colora il riempimento della corona naturale visualizzata — nessun nuovo SVG):
`none`, `tetracycline`, `fluorosis`, `nonvital`, `extrinsic`, `other`

**Difetto di otturazione** (`fillingDefect`; per superficie, reperto su restauro diretto indipendente dalla carie ricorrente — condizionato alle superfici presenti in `fillingSurfaceMaterials`; attiva il livello grafico `defect-{surface}`):
`none`, `marginal`, `fracture`, `wear`

**Elemento di ritenzione** (`retention` + `retentionSide`; per dente, vincolato per elemento; nessuno strato grafico, disegnato nell'overlay della griglia):
`none`, `clasp`, `attachment`, `bar-abutment` — `retentionSide`: `none`, `mesial`, `distal`, `both`. Una **telescopica** resta MATERIALE di corona ed è riconosciuta come ritenzione

**Coinvolgimento cervicale** (`cervicalSurfaces`; insieme su `buccal`/`lingual`, vincolato a una superficie che porti un'otturazione, una lesione cariosa o entrambe — nessuno strato grafico, deliberatamente non disegnato):
`buccal`, `lingual` — un marcatore sulla superficie, mai una superficie a sé: `getFillingSurfaceCount()` resta intatto

**Ortodonzia** (`orthoAppliance`, `orthoDrift`, `orthoVertical`, `orthoRotation`; per dente, condizionata a un dente naturale presente — permanente o deciduo):
`orthoAppliance`: `none`, `bracket`, `band` — `orthoDrift`: `none`, `mesial`, `distal` — `orthoVertical`: `none`, `extrusion` (glifo freccia su), `intrusion` (glifo freccia giù) — `orthoRotation`: booleano

**Impostazioni di dettaglio/notazione dentale** (impostazioni globali di sessione, Impostazioni → Dettagli dentali): `wearDetailLevel` e `discolorationDetailLevel` (`ToothDetailLevel`: `simple`/`complex`, predefinito `complex` — la modalità simple mostra un interruttore sì/no invece del menu a tendina completo di tipo/causa, senza modificare il valore memorizzato) e `surfaceNotation` (`simple`/`full`, predefinito `full` — controlla se le lettere/etichette di superficie di carie/otturazione sono sensibili alla posizione; vedi "Notazione delle superfici sensibile alla posizione" sopra)

### ⚙️ Impostazioni
Si apre dall'icona a ingranaggio nella barra superiore; un `dialog` ARIA con focus intrappolato e layout a schede (Esc/clic sullo sfondo per chiudere, tasti freccia per cambiare scheda). Tutte le impostazioni sono stato dell'interfaccia a livello di sessione, salvo diversa indicazione — nessuna di esse modifica i dati per dente o il payload di esportazione.

- **Generale:** sistema di numerazione (FDI/Universal/Palmer), lingua, tema chiaro/scuro, visibilità del pannello informazioni dentali
- **Pannelli:** mostra/nasconde in modo indipendente la scheda Stati per l'intera bocca e la scheda Ortodonzia (entrambe visibili per impostazione predefinita)
- **Dettagli dentali:** livello di dettaglio dell'usura e livello di dettaglio della discromia (simple/complex, ciascuno predefinito complex), notazione delle superfici (simple/full, predefinito full)
- **Carie:** interruttore punteggio ICDAS II (`enableIcdas`), interruttore profondità carie (`cariesDepthEnabled`), granularità carie radicolare (`rootCariesMode`: simple/severity), granularità secondaria/CARS (`secondaryCariesMode`: simple/standard/full), granularità profondità radiografica (`radiographicDepthMode`: off/threeLevel/detailed) — la precedente scheda separata "Carie secondaria" è stata unita a questa, con il controllo CARS posizionato direttamente sopra la profondità radiografica
- **Polpa:** livello di dettaglio pulpare (`pulpDetailLevel`: simple/AAE/latino pratico, predefinito AAE) — controlla quale vocabolario offre il selettore "Stato polpa / endodonzia"; modificarlo aggiorna in tempo reale il riepilogo dell'intera bocca e ogni tooltip aperto
- **Note:** abilita/disabilita le note per dente (`enableNotes`)
- **Parodontale:** interruttori mostra/nascondi per indice per tutte le 16 righe del grafico parodontale (`perioRowVisibility`, predefinito tutte visibili), raggruppate in Tasca (PD/GM/CAL/BOP) / Igiene (Placca/PI/GI) / Mucogengivale (visibilità CEJ/concavità radicolare/KG/GT) / Supporto (Forcazione/Mobilità/Classe di Miller) / Peri-implantare (mPI/mBI), ciascuna riga con la propria descrizione; più una modalità tradotta-vs-canonica per il nome degli indici (`perioIndexNameMode`: `translated` predefinito / `canonical` — un nome scientifico fisso in inglese/latino mostrato in ogni lingua dell'interfaccia). Solo preferenze a livello di applicazione (rispecchia `perioViewMode`) — mai serializzate, i tooltip restano localizzati in entrambe le modalità

### 🖼️ Sistema di template SVG

**Template dentali** (in `src/assets/teeth-svgs/`):
| Template | Denti che lo utilizzano |
|---|---|
| **Denti permanenti** | |
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
| **Denti decidui** | |
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

Un dente registrato come deciduo viene disegnato da un proprio modello, montato al posto di quello permanente; i modelli permanenti sono ruotati di 180 gradi per l'arcata inferiore e specchiati orizzontalmente per il lato sinistro, e quelli decidui seguono la stessa corrispondenza.

**SVG icone** (in `src/assets/icon-svgs/`):
`icon_8.svg` (giudizio), `icon_gum.svg` (osso), `icon_no_selection.svg` (cancella), `icon_occl.svg` (vista occlusale), `icon_pulp.svg` (polpa)

### 🔢 Sistemi di numerazione

**FDI (ISO 3950):** Denti adulti 11-18, 21-28, 31-38, 41-48. Denti decidui 51-55, 61-65, 71-75, 81-85.

**Universal (USA):** Denti adulti numerati 1-32. Denti decidui con lettere A-T.

**Palmer (Zsigmondy-Palmer):** Formato quadrante + posizione (es. UR-1, LL-5). I denti decidui usano le lettere A-E per quadrante.

### 🚀 Utilizzo
Sviluppo:
```bash
bun install
bun run dev
```
Build:
```bash
bun run build
```
Anteprima:
```bash
bun run preview
```

### 🔗 Integrazione
Il componente può essere incorporato in qualsiasi app React.
Esempio:
```tsx
import App from "./App";

export default function Host(){
  return (
    <App
      language="en"
      onLanguageChange={(lang) => console.log(lang)}
      numberingSystem="FDI"
      onNumberingChange={(system) => console.log(system)}
      darkMode={false}
      onDarkModeChange={(dark) => console.log(dark)}
    />
  );
}
```

**Integrazione modalità scura:**
- **Modalità autonoma:** Omettere la prop `darkMode` — il componente gestisce il proprio stato del tema tramite il pulsante di attivazione nella barra superiore e aggiunge/rimuove la classe `.dark` sull'elemento `<html>`.
- **Modalità controllata:** Passare `darkMode` e `onDarkModeChange` — l'app principale controlla il tema. Il pulsante di attivazione continua ad apparire, ma chiama `onDarkModeChange` invece di gestire lo stato interno. L'app principale è responsabile dell'aggiunta/rimozione della classe `.dark` sull'elemento `<html>`.

**Tema personalizzato:**
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

**Integrazione plugin:**
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

// Set plugin state for a tooth:
setPluginState(11, "implant-brand", "Straumann");
```

**Integrazione controllata — il documento di dominio dell'interfaccia (dalla 2.3.0):**

Lo stato clinico del componente è un **documento di dominio dell'interfaccia**: lo stesso
JSON versionato che `exportStatus()` scrive e `importStatus()` legge. Quel documento — non
FHIR — è ciò che lo stato React contiene e ciò che l'applicazione ospite possiede.

Collega un'istanza a una **sessione** isolata per inizializzarla e osservarla, e per
mantenere indipendenti due odontogrammi montati:

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

- `session.getDocument()` / `setDocument(doc)` / `subscribe(listener)` è l'intero
  contratto; `createOdontogramSession(initial?)` ne crea una. HKP hosts read
  treatment intent from `session.getPlanChanges()`, not the module singleton.
- Una semplice prop `document` al posto di `session` fa creare all'istanza una sessione
  privata inizializzata da essa.
- Non passando **nessuna delle due** si conserva il comportamento autonomo storico: il
  componente lavora sulla sessione predefinita del processo
  (`getDefaultOdontogramSession()`) e tutti i punti di ingresso del modulo si applicano ad
  essa esattamente come prima. **Nessuna migrazione è necessaria.**
- Solo una sessione è *attiva* nel motore DOM alla volta (è un unico motore globale legato
  a una griglia dentale); le altre conservano il proprio documento e restano pienamente
  leggibili e scrivibili tramite la loro API di sessione.

**FHIR / Dental Core:**

La conversione FHIR è una proiezione opzionale e pura del documento UI. Dental Core `de.cognovis.fhir.dental.core#0.10.0` è l’unico contratto FHIR; il marcatore riconosciuto `odontogram-dental-core-0.6.0` resta leggibile per le raccolte legacy vuote, mentre i marcatori di dialetto sconosciuti vengono rifiutati. Importazione, esportazione e riesportazione conservano gli undici assi sorgente `implantPosition`, `crownFractureType`, `orthoProgressive`, `rootResection`, `papillaLoss`, `orthoBracketSide`, `cantilever`, `endoCanals`, `rootFractureRoot`, `rootResectionRoot` e `apicalRoot`. Nei piani questi assi usano un `Goal` di stato obiettivo referenziato; i campi di piano esistenti continuano a usare Observations pianificate profilate. Lo stato pianificato resta separato da quello osservato e non crea Devices o Procedures eseguite. Le asserzioni duplicate, in conflitto, malformate, indirizzate in modo ambiguo o incompatibili con il dente vengono rifiutate. I perni restano indipendenti tramite `rootPostType`; i vecchi valori `endo-glass-pin` e `endo-metal-pin` migrano a `endo-filling` più il materiale del perno. Dalla 5.0.0, `extractionPlan`, `crownNeeded` e `crownReplace` vengono scritti come richieste a livello di dente secondo Dental Core 0.8 (SNOMED CT 55162003 / 426222000, con `restoration-renewal` sulla corona); le richieste scritte con il precedente codice locale non vengono più lette. Dalla 5.0.0 (tramite `@cognovis/fhir-sdk` 0.15.6) ogni valore di stato del dente o di reperto del grafico viene scritto e letto solo come il suo codice Dental Core, senza sistema di codici locale, fallback o alias; gli URL di sistema provengono da `@cognovis/fhir-sdk/terminology`.

**Modalità live con Aidbox (sviluppo, dalla 2.50.0):**

L'applicazione autonoma (`apps/standalone`) ha **una sola** pagina di ingresso e sceglie la modalità a runtime: parte in modalità live con `?live`, con `?patient=<id>`, o ogni volta che nel suo ambiente è presente una configurazione Aidbox; altrimenti serve il banco di prova con i dati di esempio. In modalità live carica la cartella di un paziente direttamente da un server Aidbox, la visualizza nella shell abituale tramite l'API di sessione sopra descritta, e scrive le modifiche come risorse Dental Core con id deterministici, così un nuovo salvataggio aggiorna anziché duplicare.

Copiare `apps/standalone/.env.example` in `apps/standalone/.env` e inserire un client macchina con ambito limitato (vedi [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md)), poi, dalla radice del workspace:

```bash
bun install
bun run dev                                 # poi aprire http://localhost:5173/?live
```

Non inserire mai una credenziale amministrativa in `VITE_*`.

La metà HTTP è un pacchetto a sé, [`@cognovis/odontogram-fhir`](../../odontogram-fhir): contiene il transport Aidbox e la factory del gateway, ed è l'unico a dipendere da `@cognovis/fhir-sdk/client`. Questo pacchetto fornisce la **SPI** del gateway e i delegati di sessione per caricamento, salvataggio e piano di scrittura — la metà senza HTTP — e continua a **non** includere `@cognovis/fhir-sdk/client`. Il diagramma e il trasporto 5.2.6 dichiarano il peer SDK obbligatorio `^0.22.0 || ^0.23.0` e la versione esatta di sviluppo `0.23.0` (Dental Core 0.10.0). L'applicazione eseguibile fissa l'SDK `0.23.0` e condivide una sola copia senza override. La configurazione e la meccanica di caricamento/salvataggio si trovano in [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md).

**Esami datati, stato di valutazione e rilevazione perimplantare (dalla 2.4.0):**

Un caso parodontale viene rivalutato negli anni, perciò un documento può ora portare
l'identità propria dell'esame e un archivio degli esami precedenti:

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

- Ogni esame archiviato è un'**istantanea indipendente** dei rilievi dell'intera bocca e del
  contesto del caso al momento della cattura; le modifiche successive non vi rientrano mai, e
  catturare di nuovo registra un esame di controllo invece di sovrascrivere la linea di base su
  cui si basa l'andamento.
- Stato e piano continuano a significare **attuale rispetto a proposto all'interno di un unico
  esame**: il piano non è mai storia e non fa mai parte di un'istantanea.
- Ogni campo identificativo è una stringa opaca, di proprietà dell'applicazione ospite, che il
  componente memorizza e restituisce ma non interpreta mai. I documenti precedenti alla versione
  di payload 2.21 non ne contengono e si caricano invariati.
- **Ciò che il paziente ha portato con sé è derivato da quell'archivio, mai memorizzato.** Il lavoro restaurativo presente nell'esame archiviato PIÙ VECCHIO è disegnato **tratteggiato**. `getBaselineExamination()`, `getPreExistingAxes(toothNo)`, `getChangesSinceBaseline()`, `isToothPreExisting(toothNo)`.
- Il tratteggio marca **il lavoro, mai il dente e mai la malattia** — restauri, otturazioni dirette, otturazioni canalari e perni, apicectomia, sigillatura dei solchi. Un residuo radicolare o un impianto è un dente, non un lavoro; carie, tartaro e i reperti parodontali sono malattia.
- L'**esame iniziale è correggibile**: `beginBaselineCorrection()`, `commitBaselineCorrection()`, `cancelBaselineCorrection()`. Deliberatamente nessuna sovrascrittura per dente.
- Un **grafico importato senza archivio proprio diventa l'esame iniziale** (menu di importazione, attivo per impostazione predefinita). Un documento che porta il proprio archivio lo mantiene.

La cartella parodontale registra i rilievi, non l'atto di guardare: "sondato, nessun
sanguinamento" e "nessuno ha sondato" apparivano identici. Ogni asse interessato (PD, GM, BOP,
suppurazione, mobilità, forcazione, placca, PI, GI, mPI, mBI, KG) può ora dirlo:

```ts
setAssessmentStatus(16, "bop", "MB", "assessed");
setAssessmentStatus(16, "pd", "DB", "unmeasurable");
getAssessmentStatus(16, "mpi", "buccal");
perioAxisApplies(16, "gm");
perioAxisApplies(11, "gm");
```

"Non applicabile" deriva da ciò che il dente è davvero, e una misura reale vince sempre su una
lacuna registrata. In esportazione un valore non disponibile diventa il `dataAbsentReason`
proprio di FHIR — mai un codice clinico inventato — e un rilievo normale diventa un `false`
esplicito o il grado `0`.

**Registrazione (dalla 2.7.0):** un interruttore **Stato di valutazione** nell'intestazione della
cartella parodontale aggiunge una riga di accompagnamento sotto ogni riga di indice visibile, con
un pulsante ciclico per punto di misurazione: sito, superficie, ingresso di forcazione o l'intero
dente. Le righe sono disattivate per impostazione predefinita. Un punto che contiene già una
misurazione è bloccato (il valore stesso prova l'esame) e una posizione non applicabile è
disabilitata anziché ignorata in silenzio. Gli stati registrati compaiono anche nel tooltip del
dente e nel riepilogo parodontale di tutta la bocca.

La cartella parodontale a bocca intera registra ora anche la **suppurazione** per sito, e una
colonna implantare supporta l'esame perimplantare: profondità di sondaggio in sei siti,
sanguinamento, suppurazione, mobilità dell'impianto e ampiezza della mucosa cheratinizzata.
Restano inattivi solo gli assi che richiedono la giunzione amelo-cementizia (margine gengivale
e il CAL da esso derivato) e gli indici di placca del dente naturale: mPI e mBI ne sono gli
equivalenti perimplantari.
### 🧪 Test
```bash
bun run test           # Esegui tutti i 1704 test (1 test aggiuntivo saltato)
bun run test:watch     # Modalità watch
bun run test:coverage  # Report di copertura
```

### 📖 Documentazione API
```bash
bun run docs           # Genera la documentazione TypeDoc in docs/
```

### 📡 API pubblica

**Props del componente:**

| Prop | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `language` | `string` | `'hu'` | Lingua dell'interfaccia (hu/en/de/es/it/sk/pl/ru/pt-br) |
| `onLanguageChange` | `(lang) => void` | — | Callback quando cambia la lingua |
| `numberingSystem` | `string` | `'FDI'` | Sistema di numerazione (FDI/Universal/Palmer) |
| `onNumberingChange` | `(system) => void` | — | Callback quando cambia la numerazione |
| `darkMode` | `boolean` | `undefined` | Stato modalità scura. Omettere per la modalità autonoma. |
| `onDarkModeChange` | `(dark) => void` | — | Callback quando si attiva/disattiva la modalità scura. Obbligatorio per la modalità controllata. |
| `themeConfig` | `OdontogramThemeConfig` | `undefined` | Override dei colori personalizzati tramite proprietà CSS personalizzate (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | `undefined` | Plugin SVG personalizzati per overlay visivi e stato personalizzato per dente. |
| `readOnly` | `boolean` | `undefined` | Disabilita tutte le interazioni (clic, touch, tastiera). Utile per visualizzazioni di stampa/report. |
| `enableNotes` | `boolean` | `undefined` | Abilita le note per dente. Doppio clic su un dente per aggiungere/modificare note. |

**Funzioni esportate per il controllo esterno:**

| Funzione | Descrizione |
|---|---|
| `initOdontogram()` | Inizializza il motore e renderizza tutti i denti |
| `destroyOdontogram()` | Arresta il motore e rimuove i listener degli eventi |
| `setNumberingSystem(system)` | Passa tra FDI, Universal, Palmer |
| `clearSelection()` | Deseleziona tutti i denti |
| `setOcclusalVisible(on)` | Attiva/disattiva la vista occlusale |
| `setWisdomVisible(on)` | Mostra/nasconde i denti del giudizio |
| `setShowBase(on)` | Mostra/nasconde il livello osseo |
| `setHealthyPulpVisible(on)` | Mostra/nasconde la polpa sana |
| `registerPlugins(plugins)` | Registra plugin SVG personalizzati |
| `setPluginState(toothNo, pluginId, value)` | Imposta lo stato personalizzato di un plugin per un dente |
| `getPluginState(toothNo, pluginId)` | Ottiene lo stato personalizzato di un plugin per un dente |
| `getToothStateSummary(toothNo)` | Ottiene un riepilogo localizzato di tutti gli stati attivi |
| `getOdontogramSummary()` | Ottiene un riepilogo testuale strutturato e localizzato dell'intero odontogramma (conteggi, sezioni) |
| `onStateChange(callback)` | Sottoscrive le modifiche di stato; restituisce una funzione di annullamento |
| `setReadOnly(value)` | Abilita/disabilita la modalità sola lettura |
| `getReadOnly()` | Ottiene lo stato corrente di sola lettura |
| `setNotesEnabled(value)` | Abilita/disabilita le note per dente |
| `getNotesEnabled()` | Ottiene lo stato corrente delle note |
| `setPulpDetailLevel(level)` | Imposta il vocabolario del selettore di pulpa — `"simple"`, `"aae"` o `"latin"` |
| `getPulpDetailLevel()` | Ottiene il livello di dettaglio pulpare corrente |
| `getChartMode()` | Ottiene il grafico attualmente attivo — `"status"` o `"plan"` |
| `setChartMode(mode)` | Passa il grafico attivo a `"status"` o `"plan"`; il grafico del piano viene copiato in profondità dallo stato la prima volta che viene attivato |
| `getStatusChart()` | Ottiene il payload del grafico dello stato (`{version, globals, teeth}`), indipendentemente da quale grafico sia attualmente attivo |
| `getPlanChart()` | Ottiene il payload del grafico del piano (`{version, globals, teeth}`), indipendentemente da quale grafico sia attualmente attivo |
| `setPlanChart(payload)` | Sostituisce i denti del grafico del piano a partire da un payload (lo stato resta invariato); segna il grafico del piano come inizializzato |
| `getPlanChanges()` | Ottiene il diff strutturato stato→piano (`{ toothNo, axis, from, to }[]`) — una voce per dente per ogni asse di trattamento che differisce tra il grafico dello stato e quello del piano; vuoto quando non esiste ancora un piano. Disponibile anche su `getOdontogramSummary()` come `plannedChanges` |
| `setPerioSite(toothNo, site, patch)` | Imposta i dati parodontali per uno dei sei siti (`patch` = `{ pd?, gm?, bop?, sup? }`); `pd` null/`<1` de-registra il sito. Valida e limita (PD 1–15, GM −10…+20) |
| `getToothPerio(toothNo)` | Ottiene il record parodontale per sito di un dente (solo siti registrati) |
| `getToothCal(toothNo)` | Ottiene il CAL derivato per sito (`pd + margine gengivale`) di un dente |
| `getPerioSummary()` | Aggregati parodontali per l'intera bocca: numero di siti registrati, numero di siti sanguinanti, %BOP, CAL peggiore, PD massimo |
| `getPerioChart()` | Ottiene i record parodontali per dente del grafico attivo |
| `PerioChart` | Componente React (export con nome) — l'overlay del grafico parodontale per l'intera bocca (`{ open, onClose }`), montabile indipendentemente da `OdontogramShell` per l'integrazione con l'app ospitante |
| `openPerioOverlay()` / `closePerioOverlay()` / `isPerioOverlayOpen()` | Apre/chiude/interroga a livello di programmazione l'overlay del grafico parodontale — permette a un'app ospitante di richiamare il grafico parodontale separatamente dall'odontogramma di base (stato del caso condiviso) |
| `getPerioViewMode()` / `setPerioViewMode(mode)` | Ottiene/imposta come viene presentato il grafico parodontale — `"toggle"` (un interruttore di visualizzazione `Odontogramma \| Grafico dentale`, predefinito) o `"popup"` (l'overlay) |
| `getPerioOverlayLayer()` / `setPerioOverlayLayer(layer)` | Ottiene/imposta l'overlay evidenziato del Grafico dentale — `"none"` (predefinito) / `"pd"` / `"cal"` / `"gr"` / `"plaque"` / `"bop"` / `"pd5"` / `"pd6"` / `"cairo"`; ridisegna i denti secondo quella misura (solo visualizzazione sui dati esistenti) |
| `getToothRecessionType(toothNo)` | Ottiene il **tipo di recessione di Cairo** derivato — `"none"` / `"rt1"` / `"rt2"` / `"rt3"` (calcolato dal CAL interprossimale rispetto a quello buccale del dente) |
| `setCejVisibility(toothNo, v)` / `getCejVisibility(toothNo)` | Visibilità della CEJ per dente — `"none"` / `"detectable"` / `"not-detectable"` |
| `setRootConcavity(toothNo, v)` / `getRootConcavity(toothNo)` | Concavità della superficie radicolare per dente — `"none"` / `"mild"` / `"deep"` |
| `setPlaqueIndex(toothNo, surface, grade)` / `getPlaqueIndex(toothNo, surface)` | Grado dell'Indice di Placca di Silness-Löe per superficie — `0`-`3` |
| `setGingivalIndex(toothNo, surface, grade)` / `getGingivalIndex(toothNo, surface)` | Grado dell'Indice Gengivale di Löe-Silness per superficie — `0`-`3` |
| `setKeratinizedWidth(toothNo, mm)` / `getKeratinizedWidth(toothNo)` | Larghezza della gengiva cheratinizzata buccale per dente in mm — `0`-`15`, o `null` se non registrata |
| `setGingivalThickness(toothNo, v)` / `getGingivalThickness(toothNo)` | Fenotipo di spessore gengivale per dente — `"unknown"` / `"thin"` / `"medium"` / `"thick"` |
| `setMillerClass(toothNo, v)` / `getMillerClass(toothNo)` | Classe di recessione di Miller per dente — `"none"` / `"i"` / `"ii"` / `"iii"` / `"iv"` |
| `setPeriImplantPlaque(toothNo, surface, grade)` / `getPeriImplantPlaque(toothNo, surface)` | Solo impianti — grado dell'Indice di Placca modificato di Mombelli (mPI) per superficie — `0`-`3`; nessun effetto su un dente non implantare |
| `setPeriImplantBleeding(toothNo, surface, grade)` / `getPeriImplantBleeding(toothNo, surface)` | Solo impianti — grado dell'Indice di Sanguinamento del Solco modificato di Mombelli (mBI) per superficie — `0`-`3`; nessun effetto su un dente non implantare |
| `furcationEntrances(toothNo)` | Gli ingressi di forcazione per un dente — `["mesial","distal","buccal"]` (molari superiori), `["buccal","lingual"]` (molari inferiori), `["mesial","distal"]` (primi premolari superiori), altrimenti `[]` |
| `setFurcation(toothNo, entrance, grade)` / `getToothFurcation(toothNo)` | Imposta/ottiene il coinvolgimento di forcazione per ingresso (Glickman `1`–`4`; `null` cancella) |
| `setPlaque(toothNo, surface, present)` / `getToothPlaque(toothNo)` | Imposta/ottiene la presenza di placca O'Leary per superficie (mesiale/distale/buccale/linguale); alimenta il PI% per l'intera bocca in `getPerioSummary()` |
| `getCaseMeta()` | Ottiene l'oggetto di metadati a livello di caso (`{age, smokingStatus, cigarettesPerDay, diabetesStatus, hba1c, toothLossPerio, maxRblPercent, patientName, patientDob, examDate}`) — un unico blocco condiviso, non per dente/a doppio stato (rispecchia la chiave `globals` di livello superiore del payload); alimenta la classificazione di stadiazione/grading parodontale |
| `setPatientName(v)` | Imposta il nome del paziente del caso (troncato; stringa vuota o `null` lo cancella) — solo identità, mai utilizzato nella derivazione parodontale |
| `setPatientDob(v)` | Imposta la data di nascita del paziente del caso (`YYYY-MM-DD`; non valida/vuota la cancella)|
| `setExamDate(v)` | Imposta la data dell'esame del caso (`YYYY-MM-DD`; non valida/vuota la cancella) |
| `setCaseAge(v)` | Imposta l'età del paziente del caso in anni — `0`-`120`, o `null` per cancellare |
| `setSmokingStatus(v)` | Imposta lo stato di fumatore del caso — `"unknown"` / `"never"` / `"former"` / `"current"` |
| `setCigarettesPerDay(v)` | Imposta le sigarette/giorno (significativo solo quando lo stato di fumatore è `"current"`) — `0`-`99`, o `null` per cancellare |
| `setDiabetesStatus(v)` | Imposta lo stato diabetico del caso — `"unknown"` / `"none"` / `"present"` |
| `setHba1c(v)` | Imposta l'HbA1c % (significativo solo quando lo stato diabetico è `"present"`) — `3.0`-`20.0` (una cifra decimale), o `null` per cancellare |
| `setToothLossPerio(v)` | Imposta i denti persi per parodontite — `0`-`32`, o `null` per cancellare |
| `setMaxRblPercent(v)` | Imposta la percentuale massima di perdita ossea radiografica — `0`-`100`, o `null` per cancellare |
| `resetCaseMeta()` | Ripristina l'oggetto di metadati a livello di caso ai suoi valori predefiniti vuoti |
| `getPerioClassification()` | Ottiene la classificazione parodontale del World Workshop 2017 (`{diagnosis, stage, grade, extent, derived, overridden}`) — diagnosi/stadio/grado/estensione derivati dai dati parodontali registrati e dai metadati del caso, ciascun asse sostituito dall'override del clinico quando impostato (`derived` espone sempre i valori calcolati non modificati, `overridden` indica quali assi sono stati sovrascritti) |
| `setDiagnosisOverride(v)` | Sovrascrive la diagnosi parodontale derivata — `"health"` / `"gingivitis"` / `"periodontitis"`, o `null` per cancellare (ripristina il valore derivato) |
| `setStageOverride(v)` | Sovrascrive lo stadio parodontale derivato — `"I"` / `"II"` / `"III"` / `"IV"`, o `null` per cancellare (ripristina il valore derivato) |
| `setGradeOverride(v)` | Sovrascrive il grado parodontale derivato — `"A"` / `"B"` / `"C"`, o `null` per cancellare (ripristina il valore derivato) |
| `setExtentOverride(v)` | Sovrascrive l'estensione parodontale derivata — `"localized"` / `"generalized"` / `"molar-incisor"`, o `null` per cancellare (ripristina il valore derivato) |
| `exportImage(format)` | Scarica l'odontogramma come immagine — `"png"` o `"jpg"` |
| `exportSvg()` | Scarica l'odontogramma come SVG scalabile (vettoriale) |
| `hasAnyPerioData()` | `true` se e solo se è registrato qualsiasi asse parodontale in un punto qualsiasi della bocca — determina il salto automatico dell'esportazione parodontale e disabilita le voci del menu di esportazione parodontale su un grafico vuoto |
| `startIntroTour()` | Avvia il tour introduttivo interattivo in 12 passi |

### 💾 Formato di esportazione/importazione dello stato
L'esportazione crea un file JSON (versione `2.20`; le importazioni accettano anche le versioni legacy `1.4` e da `2.0` a `2.19` e vengono migrate automaticamente) contenente:

**Campi globali:**
- `wisdomVisible` - denti del giudizio visibili
- `showBase` - livello osseo visibile
- `occlusalVisible` - vista occlusale attiva
- `showHealthyPulp` - polpa sana visibile
- `edentulous` - modalità edentulo attiva

**Campi per dente (32 denti):**
- `toothSelection` - tipo base del dente
- `toothSubstrate` - substrato dentale (natural/radix/broken/crownprep), ortogonale a qualsiasi restauro
- `restorationType` - tipo di restauro (none/crown/inlay/onlay/veneer/bridge)
- `restorationMaterial` - materiale del restauro (emax/gold/gradia/zircon/metal/metal-ceramic/telescope/temporary), abbinato a `restorationType`
- `prosthesis` - asse rimovibile/attacco (none/healing-abutment/locator/locator-denture/bar/bar-denture/removable-partial/removable-full), si esclude reciprocamente con un `restorationType` fisso di crown/bridge
- `crownLeakage` - flag di microinfiltrazione marginale della corona, significativo solo quando `restorationType` è crown o bridge
- `endo` - stato endodontico; si esclude reciprocamente con `pulpDx` (presentati insieme tramite un unico selettore combinato "Stato polpa / endodonzia" — trattare un dente normalizza `pulpDx` a `normal`)
- `rootPostType` - materiale del perno radicolare (`none`, `glass-fiber`, `metal`), indipendente da `endo`
- `mods` - array di modifiche (inflammation, parodontal); `inflammation` è stato ritirato dall'interfaccia sui denti presenti (lì è `apicalDx` a determinare il glifo) ma si applica ancora ai denti mancanti/con alveolo post-estrattivo
- `caries` - superfici con carie attiva
- `cariesActiveDepth` - il valore di profondità ICDAS predisposto dal selettore di profondità carie quando viene applicata una nuova superficie (non è un valore memorizzato per superficie; vedi `cariesSeverity` per il campo memorizzato per superficie)
- `rootCaries` - gravità della carie radicolare (none/active/arrested/active-cavitated)
- `cariesSeverity` - gravità unificata per superficie (0-6): profondità ICDAS su una superficie primaria (senza otturazione), punteggio CARS su una superficie ricorrente (con otturazione)
- `radiographicDepth` - profondità radiografica della carie per superficie (none/E1/E2/D1/D2/D3), indipendente dalla scala visiva ICDAS/CARS
- `fillingMaterial` - materiale dell'otturazione
- `fillingSurfaces` - superfici otturate
- `fillingSurfaceMaterials` - materiale dell'otturazione per superficie (otturazioni miste, es. buccale amalgama + distale composito)
- `retention` - cosa trattiene una protesi rimovibile su questo dente (none/clasp/attachment/bar-abutment)
- `retentionSide` - il lato su cui ingrana l'elemento di ritenzione (none/mesial/distal/both)
- `fillingDefect` - difetto di otturazione per superficie (none/marginal/fracture/wear), condizionato alla presenza di una superficie otturata, indipendente dalla carie ricorrente
- `cervicalSurfaces` - le superfici la cui otturazione o lesione cariosa si estende alla regione cervicale (buccal/lingual); un marcatore sulla superficie anziché una sesta superficie
- `pulpDx` - diagnosi pulpare AAE (normal/reversible-pulpitis/irreversible-pulpitis/necrosis); reversible-pulpitis visualizza un glifo ridotto
- `pulpLatin` - sottotipo pulpare in latino pratico (mostrato dal selettore di pulpa solo quando `pulpDetailLevel` è `latin`)
- `apicalDx` - diagnosi apicale che determina il glifo periapicale
- `periapicalType` - sottotipo di lesione periapicale (none/granuloma/cyst), mostrato solo in presenza di parodontite apicale sintomatica/asintomatica; il vecchio valore `abscess` è ancora accettato in importazione
- `resorptionType` - tipo di riassorbimento radicolare (none/internal/external-cervical)
- `periImplant` - stato peri-implantare solo per impianti (none/mucositis/peri-implantitis-mild/-moderate/-severe), stadiazione del World Workshop 2018
- `endoResection` - flag apicectomia
- `fissureSealing` - flag sigillante per solchi
- `calculus` - flag tartaro
- `contactMesial` - perdita del punto di contatto mesiale
- `contactDistal` - perdita del punto di contatto distale
- `wearEdge` - tipo di usura incisale/occlusale (none/attrition/erosion)
- `wearCervical` - tipo di usura cervicale (none/abrasion/abfraction/erosion)
- `discoloration` - causa di discromia per dente (none/tetracycline/fluorosis/nonvital/extrinsic/other), colora il riempimento della corona naturale su un dente-base naturale/dente deciduo senza restauro
- `orthoAppliance` - apparecchio ortodontico (none/bracket/band)
- `orthoDrift` - deriva ortodontica (none/mesial/distal)
- `orthoVertical` - movimento verticale ortodontico (none/extrusion/intrusion)
- `orthoRotation` - flag di rotazione ortodontica
- `brokenMesial`, `brokenIncisal`, `brokenDistal` - posizioni delle fratture
- `extractionWound` - ferita post-estrazione
- `extractionPlan` - estrazione pianificata
- `parapulpalPin` - flag perno parapulpale
- `bridgePillar` - dente pilastro del ponte
- `mobility` - grado di mobilità (none/m1/m2/m3)
- `crownNeeded` - indicatore corona necessaria
- `crownReplace` - indicatore sostituzione corona necessaria
- `missingClosed` - spazio chiuso dopo estrazione
- `customStates` - stati personalizzati del plugin (oggetto, indicizzato per ID plugin)
- `note` - nota testuale per dente (stringa, opzionale — presente solo se non vuota)

**Campo di livello superiore `plan` (versione 2.11+):**
- `plan` - oggetto opzionale, con la stessa forma di `teeth` (i campi per dente sopra), che contiene il grafico del **piano** (trattamento post-operatorio previsto). Presente solo quando il grafico del piano è stato inizializzato (l'interruttore `Status | Plan` è stato commutato su Plan almeno una volta) E il suo contenuto differisce dal grafico dello stato — un'esportazione di solo stato lo omette interamente e resta identica byte per byte a un'esportazione precedente alla 2.11, a parte il numero di versione. In importazione, un `plan` assente cancella/deinizializza il grafico del piano (non fa mai risorgere un piano obsoleto rimasto da prima dell'importazione); un `plan` presente ripristina il grafico del piano insieme allo stato. Il grafico del piano può anche essere letto/scritto indipendentemente dall'importazione/esportazione tramite `getPlanChart()`/`setPlanChart()` (vedi API pubblica sopra), e `getStatusChart()` restituisce sempre il payload primario dello stato indipendentemente dalla modalità di grafico attiva.

**Oggetto di livello superiore `case` (versione 2.17+, ampliato in 2.18, 2.19 e 2.20):**
- `case` - oggetto opzionale di metadati a livello di caso — NON è per dente né a doppio stato (lo stesso oggetto è condiviso tra il grafico dello stato e quello del piano, rispecchiando la chiave `globals` di livello superiore). Contiene l'età del paziente (`age`, 0-120), lo stato di fumatore (`smokingStatus`: unknown/never/former/current, con `cigarettesPerDay` 0-99), lo stato diabetico (`diabetesStatus`: unknown/none/present, con `hba1c` 3.0-20.0), due statistiche riassuntive dell'esito parodontale (`toothLossPerio` 0-32 e `maxRblPercent` 0-100), le sovrascritture cliniche della classificazione parodontale 2017 (`diagnosisOverride`/`stageOverride`/`gradeOverride`/`extentOverride`), e tre campi di identità del caso — `patientName` (stringa troncata o `null`), `patientDob` (`YYYY-MM-DD` o `null`) e `examDate` (`YYYY-MM-DD` o `null`); nessuno dei tre fa parte dell'esportazione FHIR. Viene serializzato omettendo i campi vuoti, e l'intero oggetto `case` è assente quando tutti i suoi campi sono al valore predefinito. Viene gestito tramite `getCaseMeta()`/`resetCaseMeta()` e i singoli setter (vedi API pubblica sopra).

### 🖨️ Esportazione
Oltre all'esportazione propria dell'odontogramma in Stato JSON / FHIR / PNG / JPG / SVG, il **grafico parodontale** ha un proprio percorso di esportazione:
- Il nome del paziente, la data di nascita e la data dell'esame sono solo metadati di identità del caso (payload `2.20`, additivi) — **non** fanno parte dell'esportazione FHIR.

### 📁 Struttura delle cartelle
- `src/App.tsx` - interfaccia della shell, controlli della barra superiore, selettore lingua/numerazione/modalità scura/tema/plugin
- `src/odontogram.ts` - motore di stratificazione SVG, gestione dello stato dentale, interazioni touch, overlay plugin, collegamento UI
- `src/plugin.ts` - tipo `OdontogramPlugin`, `PluginLayer`, `getQuadrant()`, priorità z-index `LAYER_Z`
- `src/theme.ts` - tipo `OdontogramThemeConfig` e utilità `applyThemeConfig()`
- `src/status_extras.ts` - 34 template di restauro predefiniti (ponti, protesi, costruzioni su barra)
- `src/i18n/` - traduzioni (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) e hook i18n
- `src/utils/numbering.ts` - conversione della numerazione FDI, Universal, Palmer
- `src/registry/` - registro dichiarativo degli assi clinici e della UI: metadati degli assi, attivazione SVG, matrice tipo×materiale del restauro, catalogo valori ed elenchi di opzioni; le mappature FHIR appartengono a `src/fhir/`
- `src/fhir/` - unico confine Dental Core per HL7 FHIR R4: codec `toFhirDentalCore.ts`/`fromFhirDentalCore.ts` su `@cognovis/fhir-sdk`, `dentalCoreContract.ts` e gli helper `dentalCoreLocalCoding.ts`
- `src/bridgeOverlay.ts` - overlay connettore del tratto di ponte multi-dente (geometria a sella sensibile all'arcata)
- `src/SettingsModal.tsx` - finestra di dialogo Impostazioni a schede (Generale/Pannelli/Dettagli dentali/Carie/Polpa/Note/Parodontale)
- `src/__tests__/` + `src/registry/__tests__/` - suite di test Vitest (1704 test superati, 1 saltato, in 163 file)
- `src/assets/teeth-svgs/` - template SVG dentali (6 file: incisivi, canini, premolari, molari + viste occlusali)
- `src/assets/icon-svgs/` - SVG delle icone della barra degli strumenti (5 file)

### ⚙️ Stack tecnologico
- React 18 + Vite + TypeScript
- Tailwind CSS per lo stile dell'interfaccia
- Stratificazione SVG tramite manipolazione del DOM (stato non-React per le prestazioni)
- Sistema i18n personalizzato leggero
- Vitest + Testing Library per i test automatizzati
- TypeDoc per la documentazione API
- Alias di percorso Vite: `@` mappato su `./src`

### 📝 Note
- I template SVG vengono caricati da `src/assets/teeth-svgs` e `src/assets/icon-svgs`, pertanto l'hosting statico deve servire la cartella pubblica.
- Il motore dell'odontogramma utilizza il proprio stato interno (non lo stato React) per prestazioni e semplicità.
- I denti decidui dispongono di un set ridotto di materiali disponibili (nessuna otturazione in amalgama, nessun trattamento endodontico con perni).
- I denti con impianto dispongono di un diverso set di opzioni per corona/abutment rispetto ai denti naturali.

### 📖 Come citare

Se utilizzi questo modulo nel tuo lavoro, per favore citalo.

**Questa versione (v1.49.0):**
> Dul, Z. (2026). *React Advanced Odontogram* (v1.49.0). Zenodo. https://doi.org/10.5281/zenodo.21156787

**Tutte le versioni (DOI concettuale):** https://doi.org/10.5281/zenodo.21156787

> Il DOI concettuale per tutte le versioni riportato sopra rimanda sempre alla release
> archiviata più recente; un DOI specifico per versione viene assegnato a ogni release
> quando viene archiviata su Zenodo. Finché la v1.49.0 non sarà archiviata, citarla
> tramite il DOI concettuale.

I metadati di citazione leggibili dalla macchina si trovano in [`CITATION.cff`](../../../CITATION.cff).
