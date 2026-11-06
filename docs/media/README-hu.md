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

## 🇭🇺 Magyar

### 📋 Áttekintés
Ez a projekt egy interaktív, böngészőben futó odontogram szerkesztő, amely a fogazati státuszrögzítést áttekinthető kezelőfelülettel támogatja. A rendszer rétegzett SVG fogsablonok segítségével jeleníti meg a pótlásokat, szuvasodásokat, endodonciai állapotokat, mobilitást és egyéb klinikai jellemzőket, miközben többfogos kiválasztást, kiválasztási szűrőket és előre definiált státusz mintákat is biztosít. Minden fogpozíciónak saját rajza van — tizenhat maradó oldalnézet, húsz rágófelszíni nézet és a tejfogazat —, és a frontfogak felülnézete teszi egyáltalán rögzíthetővé a metszőfog palatinális leletét, amelyet az oldalnézet nem tud megmutatni.

---
![Odontogram – előnézet (magyar)](screenshot_hu_odontogram.png)

🔗 **Test URL:** https://react-odontogram-modul.vercel.app/

---

### 📦 Használat npm csomagként

Az odontogram önálló React komponenskönyvtárként érhető el az npm-en:
`@cognovis/react-odontogram`.

#### Követelmények
- **React 18 vagy 19** (peer dependency-ként deklarálva — az alkalmazásod biztosítja).
- Egy **bundler**, amely érti az `exports` mezőt és az ESM-et: Vite, webpack 5, Next.js, Rollup, esbuild, Parcel. A csomag **kizárólag ESM**.
- Node **≥ 18** az eszközökhöz.

#### Telepítés

```bash
echo "@cognovis:registry=https://npm.cognovis.de" >> .npmrc
bun add @cognovis/react-odontogram @cognovis/fhir-sdk react react-dom
```

#### Alapvető használat

Renderelj `OdontogramShell`-t, és importáld a stíluslapot **egyszer**, bárhol az alkalmazásodban:

```tsx
import { OdontogramShell } from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";

export function Chart() {
  return (
    <OdontogramShell
      language="hu"          // hu | en | de | es | it | sk | pl | ru | pt-br | ar | zh | fr
      numberingSystem="FDI"  // FDI | Universal | Palmer
      darkMode={false}
    />
  );
}
```

#### Komponens propok

Az `OdontogramShell` egy vezérelt (controlled) komponens. A leggyakoribb propok:

| Prop | Típus | Alapértelmezett | Leírás |
|------|------|---------|-------------|
| `language` | `Language` | `"hu"` | UI nyelv (`hu`/`en`/`de`/`es`/`it`/`sk`/`pl`/`ru`/`pt-br`/`ar`/`zh`). |
| `numberingSystem` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` | Fogszámozási rendszer. |
| `darkMode` | `boolean` | `false` | Sötét téma kapcsoló. |
| `readOnly` | `boolean` | `false` | Minden szerkesztés letiltása (csak megtekintés). |
| `themeConfig` | `OdontogramThemeConfig` | — | Téma CSS változók felülírása (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | — | Egyedi állapot pluginek / extra rétegek regisztrálása. |
| `enableNotes` | `boolean` | `false` | Fogankénti megjegyzések engedélyezése. |
| `enableIcdas` | `boolean` | `false` | ICDAS II caries pontozás engedélyezése. |
| `onLanguageChange` / `onNumberingChange` / `onDarkModeChange` | `(value) => void` | — | Akkor hívódik meg, amikor a felhasználó módosítja a beállítást a felületen. |

Finomabb részletezettségi szintet meghatározó propok (`pulpDetailLevel`, `secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`, `wearDetailLevel`, `discolorationDetailLevel`, `surfaceNotation`, `showStatusCard`, `showOrthoCard`) is elfogadottak — a teljes, típusos listáért lásd a mellékelt `.d.ts` típusdefiníciókat.

#### Nyilvános API (elnevezett exportok)

Az `OdontogramShell` egyszerre alapértelmezett (default) export és elnevezett (named) export is. Az imperatív állapot API, az önálló `PerioChart` komponens, az irányított bemutató túra, valamint az összes nyilvános típus ugyanabból a belépési pontból elérhető elnevezett exportként:

```ts
import {
  OdontogramShell,           // egyben az alapértelmezett export is
  PerioChart,                // önálló parodontális diagram komponens
  // állapot olvasása
  getOdontogramSummary,
  getToothStateSummary,
  onStateChange,             // feliratkozás állapotváltozásokra
  // export / import
  exportSvg, exportImage,    // vektoros / raszteres diagram export
  // vezérlés
  setReadOnly, getReadOnly,
  clearSelection,
  registerPlugins, setPluginState, getPluginState,
  startIntroTour,            // bemutató túra indítása
  // …és még sok további setX/getX beállítás függvény
} from "@cognovis/react-odontogram";
```

A teljes felület (≈ 44 függvény + olyan típusok, mint az `OdontogramSummary`, `OdontogramThemeConfig`, `OdontogramPlugin`, `PerioViewMode`, …) teljesen típusosan szerepel a mellékelt deklarációkban.

#### Használat Next.js-szel (App Router)

A komponens kizárólag kliensoldali, ezért egy Client Component-ből kell renderelni:

```tsx
"use client";
import { OdontogramShell } from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";

export default function OdontogramClient() {
  return <OdontogramShell language="hu" numberingSystem="FDI" />;
}
```

Vagy töltsd be egy kizárólag kliensoldali dinamikus importtal: `dynamic(() => import("./OdontogramClient"), { ssr: false })`.

#### Fontos megjegyzések és jelenlegi korlátok
- **Kizárólag ESM** — a csomag fő ES modult (`dist/odontogram.js`) publikál, a megfelelő típusdeklarációkkal (`dist/index.d.ts`). A bundler modulfeloldást célozza; nincs CommonJS build.
- **A stíluslap külön van** — kötelező egyszer importálnod a `@cognovis/react-odontogram/style.css` fájlt; ez nem töltődik be automatikusan. A stílus globális CSS, amely a `.odontogram-root` alá van skálázva, és `--odon-*` CSS változók vezérlik. A még ki nem adott verzióban semmit sem állít a `:root`, `html` vagy `body` elemre: a gazdaoldal háttere, betűtípusa és saját tokenjei érintetlenek maradnak; a `<body>`-hoz fűzött felületek (bemutató, felugró ablakok) a `.odontogram-portal` osztályt kapják.
- **SSR / kizárólag kliensoldali** — a komponens csatoláskor (mount) olvassa a DOM-ot (`document`), ezért a böngészőben kell futnia. SSR keretrendszerekben egy Client Component-ben (`"use client"`) vagy kizárólag kliensoldali dinamikus importon keresztül kell renderelni.
- **Az eszközök (assets) önállóak** — a fog- és ikon-SVG-k build időben be vannak ágyazva a JavaScript bundle-be; **nincs futásidejű asset lekérés**, amit be kellene állítani, és semmi extrát nem kell átmásolni a public mappádba.
- **Több példány, egy élő szerkesztő** — minden beillesztett `<OdontogramShell>` saját klinikai állapotot tarthat egy elszigetelt munkameneten keresztül (`createOdontogramSession()`), és két munkamenet soha nem oszt meg adatot. Az interaktív DOM-szerkesztő továbbra is egyetlen globális motor, ezért egyszerre pontosan egy beillesztett példány vezérli: az rendereli a diagramot, a többi inaktív helyőrzőt rendel, és a munkamenet API-ján át továbbra is teljesen olvasható és írható. Az aktív példány leszerelésekor egy várakozó veszi át.

---

### ✨ Főbb funkciók
- 🖱️ Gyors fogkijelölés és többfogos kiválasztás (CMD/CTRL + kattintás)
- 🦷 Fogtípusok: maradó, tejfog, implantátum, ínyalatti, hiányzó
- 🍼 A tejfogazatnak saját anatómiája van: nyolc generált sablon fedi le mind a húsz tejfogat, saját mért gyökérarányokkal, hosszakkal és szélességekkel, viszonylag nagyobb pulpával és a maradó fogcsíra köré széttartó gyökerekkel. Ha egy fogat tejfogként rögzítenek, a tejfograjz kerül az utódja rajzának helyére. FHIR-ben a fog **51–85** azonosítót kap, mert az FDI-ben maga a szám mondja meg, melyik fogazathoz tartozik; importáláskor ez dönt, és csak a jelenlétet írja felül
- 🦷 Fogszubsztrátum (bármely pótlástól függetlenül): természetes, radix (gyökércsonk), törött, koronára előkészített
- 👑 Pótlások típus × anyag szerint: korona / inlay / onlay / héj (veneer) / híd e.max, arany, gradia, cirkon, fém, fémkerámia, teleszkópos vagy ideiglenes anyagból (az onlay csak okkluzális nézetben érhető el) — egyetlen kombinált, kevés kattintást igénylő „Korona – …” választóból kiválasztva; a korábbi `metal` koronák automatikusan `metal-ceramic` (fémkerámia) típusra migrálódnak; az implantátumok ugyanazt a típus × anyag modellt használják, kiegészítve egy implantátum-csatlakozó réteggel. A választó a fog típusától függően szűkül: implantátum esetén csak korona/híd választható (plusz az alábbi öt csatlakozási lehetőség), hiányzó/foghiány fog esetén csak híd-pontik (plusz kivehető részleges/teljes fogsor), `radix` szubsztrátum esetén a pótlás-választó teljesen elrejtve (gyökércsonkra nem rögzíthető pótlás)
- 🦿 Kivehető/csatlakozós protetika a dedikált `prosthesis` tengelyen (a kombinált választó „Kivehető:” bejegyzései): implantátum gyógyuló csavarja, lokátor, lokátor protézissel (overdenture), bár, bár protézissel; fogtámasztékú kivehető részleges vagy teljes fogsor
- 🌉 A hídtag fogak megjelenítik mind a koronát, mind a nyeregpántos (saddle) csatlakozót; egy több fogra kiterjedő híd-overlay egyetlen folytonos, ívhez igazodó csatlakozót jelenít meg az egymást követő hídtagokon (pontikok + pillérek) és a köztük lévő fogközi réseken keresztül (a felső és alsó fogsor tükrözött nyereg-geometriát használ, így a csatlakozó mindkét fogsoron illeszkedik), és a PNG/JPG/SVG exportban is szerepel; a híd Státusz mintán keresztüli alkalmazása azonnal újraszámítja az overlay-t
- 🔍 Szuvasodás rögzítése 6 felületen: meziális, disztális, bukkális, linguális, okkluzális, korona alatti
- 🪥 Tömőanyagok felületenként: amalgám, kompozit, GIC, ideiglenes
- 🏥 Egyetlen összevont "Pulpa / Endo státusz" választó (csoportosítva: vitális pulpa vs. kezelt/endo) a gyógyszeres, teljes vagy nem teljes gyökértöméshez, valamint egy külön választó a gyökércsap anyagához (`rootPostType`: none / glass-fiber / metal): az endodonciai kezelés és az AAE pulpa diagnózis (`pulpDx`: normal / reverzibilis / irreverzibilis pulpitis / necrosis) kölcsönösen kizárják egymást, míg a gyökércsap bármely gyökértömési állapottal együtt rögzíthető. Egy gyökérkezelt fogon (`endo` beállítva) nem szerepelhet egyidejűleg vitális pulpa diagnózis; kezelés esetén a `pulpDx` automatikusan `normal`-ra áll vissza, és a beteg pulpa jelölés eltűnik. A reverzibilis pulpitis csökkentett méretű pulpa jelölést jelenít meg. Az opcionális, 3 szintű pulpa részletezettségi beállítás (`pulpDetailLevel`: simple / AAE / gyakorlati latin) 9 gyakorlati latin pulpa altípust jelenít meg (pulpa sana … gangraena pulpae) a `pulpLatin` mezőn keresztül; a rezekció és a parapulpális csap továbbra is külön speciális jelzőként szerepel
- 🦴 Apikális diagnózis (`apicalDx`: tünetekkel járó/tünetmentes apikális periodontitis, akut/krónikus apikális tályog, condensing osteitis) közvetlenül meghatározza a periapikális jelölést; a granuloma/ciszta lézió-altípus minősítő csak tünetekkel járó/tünetmentes apikális periodontitis esetén jelenik meg (a redundáns "tályog" altípus törölve lett — ezt már az apikális diagnózis lefedi)
- 🩹 Összevont "Gyökér és fogágy" kártya (egyetlen összecsukható szekció a gyökér-/periapikális és parodontális leletekhez)
- ⚕️ Módosítók: periapikális gyulladás (csak hiányzó/extrakciós alveolus fogakon jelenik meg; meglévő fogakon rejtett, ahol az `apicalDx` önmagában határozza meg a periapikális jelölést, és implantátumokon, ahol a `periImplant` fedi le), parodontális betegség, mobilitási fokok (M1/M2/M3, implantátumokon rejtett)
- 🦷🔩 Peri-implantáris státusz (`periImplant`: `none` / `mucositis` / `peri-implantitis-mild` / `peri-implantitis-moderate` / `peri-implantitis-severe`) — 2018-as World Workshop staging, dedikált választóként jelenik meg implantátumokon; a mucositis újrahasznosítja a parodontális íny jelölést, a peri-implantitis egy fokozatos `peri-implant-bone-loss` réteget ad hozzá (átlátszóság 0,4/0,7/1,0). Az implantátumok többé nem jelenítik meg a periapikális lézió jelölést — a gyulladásukat ehelyett ez a tengely fejezi ki —, és a parodontális módosító jelölőnégyzetek rejtve vannak implantátumokon (az ad-hoc "Peri-implantitis" jelölőnégyzet-átcímkézés megszűnt)
- 🏷️ Speciális jelzők: korona szükséges, koronacsere szükséges, zárt foghiány, fogeltávolítási terv, barázdazárás, kontaktpont veszteség
- 👁️ Okkluzális nézet, bölcsességfog, csont és pulpa láthatóság kapcsolók
- 🔢 12 kiválasztási szűrő (összes, jelenlévő, maradó, tej, implantátum, hiányzó, felső/alsó, front/molárisok)
- 📊 Előre definiált státusz minták (alaphelyzet, tejfogazat, vegyes fogazat, fogatlan)
- 📦 34 előre definiált restaurációs sablon (hidak, kivehető protézisek, bár protézisek implantátumokkal)
- 💾 Állapot export/import JSON formátumban (2.20 verzió; az importálás továbbra is elfogadja a korábbi 1.4 és 2.0–2.19 verziókat, és automatikusan migrálja, plugin egyedi állapotokkal és fogankénti megjegyzésekkel)
- 🧭 **Az ortodoncia a harmadik klinikai nézet** (`odontogram-c51`): az `Odontogram | Parodontális Státusz | Ortodoncia` váltó (`#appViewToggle`) tartalmazza az alábbi modellelemzés-kártyát. Az odontogram sosem kerül lecsatolásra, csak elrejtésre, így a nézetváltás nem zavarhatja meg a leletet. Az ortodonciai nézetnek nincs saját ablaka, ezért ott is a váltó egyik szelvénye marad, ahol a parodontális státusz felugró ablakként van beállítva — ilyenkor csak annak a szelvénye tűnik el.
- 📐 **Modellkiértékelés** (`odontogram-c51.1`): Tonn és Bolton a meziodisztális fogszélességekből, cél metszőösszeggel, fogméret-eltéréssel és azzal, melyik állcsont hordozza a többletet. A szélességek fogívre vagy listába vihetők be — ugyanannak a rekordnak két nézete. A modellen nem szereplő fog (nem tört elő, elveszett, íny alatt) a kontralaterális párja szélességét veszi át, láthatóan feltételezésként jelölve. Ezen felül horizontális és vertikális lépcső, valamint állcsontonkénti középvonal-eltérés
- 🔗 Aidbox Dental Core `@cognovis/fhir-sdk` felett: a host egy gateway-t ad át; a munkamenet betölt és ment. JSON állapot export/import migrációkkal
- ✚ Kereszt/plusz felület-választó UI (B/M/O/D/L) szuvasodáshoz és tömésekhez
- 🧱 Felületenkénti tömőanyagok (vegyes tömések, pl. bukkális amalgám + disztális kompozit)
- 🖼️ PNG/JPG/SVG képexport az odontogramról (letölthető; a PNG/JPG vektoros SVG-ből raszterizált)
- 🦷 A caries/subcaries felületenkénti állapotgép: egy tömés nélküli szuvas felület elsődleges caries-ként jelenik meg (ICDAS-szintezett átlátszósággal); amint a felületen tömés is van, helyette szekunder (visszatérő) caries-ként jelenik meg (`subcaries-{surface}` réteg, CARS-pontszámmal) — a kettő soha nem lehet egyszerre aktív ugyanazon a felületen
- 🎯 Egységesített, felületenkénti súlyossági érték (`cariesSeverity`, 0–6, amely felváltja a korábbi külön ICDAS-mélység és CARS mezőket): elsődleges felületen ICDAS mélységként, szekunder felületen elnevezett CARS pontszámként (Ép … Kiterjedt üreg) olvasandó, egy kontextusfüggő felugró ablakon keresztül, amely mindig csak a felület aktuális állapotához tartozó skálát mutatja
- 🌱 Gyökér szuvasodás (`rootCaries`: none / active / arrested / active-cavitated), amely bekapcsolja a dedikált gyökér-szuvasodás grafikai réteget, a súlyosságtól függő átlátszósággal (active 0,5 / arrested 0,7 / active-cavitated teljes átlátszóság)
- 🎚️ Három szuvasodás-részletezettségi beállítás (`secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`), valamint egy `cariesDepthEnabled` kapcsoló, amelyek mindegyike egyszerűbb választó nézetre egyszerűsíti a saját skáláját a tárolt érték elvesztése nélkül
- 🩹 Subcaries-összegző sor a tömés panelen: a tömés vezérlők alatt felsorolja a kijelölt fogak közül azokat, amelyeken szekunder caries van, a felületeikkel együtt (pl. "36 (O) tömése mellett subcaries van beállítva.")
- 🪛 Felületenkénti tömésdefektus (`fillingDefect`: none / marginal / fracture / wear) közvetlen restaurációkon, függetlenül a szekunder caries-tól — a Tömések kártyán egy felületenkénti jelzővel rögzíthető (a caries-mélység jelzőt tükrözve, opciólistája függőlegesen egymás alatt), megjelenik a diagramon, valamint a tooltipben és a teljes szájüreg tömés-összegzésben explicit felirattal (pl. "36 (O) – Tömésdefektus: O: marginális"), ugyanúgy, ahogy a szekunder caries is fel van tüntetve a Caries soron; a Tömések kártya emellett egy figyelmeztető megjegyzést is mutat minden olyan kijelölt fogra, amelyen tömésdefektus van rögzítve (pl. "36-on tömésdefektus van rögzítve."), a meglévő subcaries figyelmeztető megjegyzéssel párhuzamosan
- 🔗 Rögzítő elemek, amelyek kivehető fogpótlást tartanak egy természetes fogon (`retention`, `retentionSide`) — három rögzítés, nem egy tengely: a **kapocs** csak a meglévő fogat igényli, a **csúszka** és a **gerenda-pillér** koronát. Egy érték fogaként, sosem halmaz. A kapocs negyedkörív-karként RAJZOLÓDIK a koronára (öble az íny felé, ívenként tükrözve); a csúszka és a gerenda charly jelöléseit viseli: `( G )` és `ste`. A **gerenda-szakasz származtatott**, sosem tárolt, és implantátum- és fogpillérre együtt is támaszkodhat
- 🎨 **A helyreállítások színei szabadon választhatók** (Beállítások → Színek). Minden kitöltőszín CSS-változó a szállított színnel mint tartalékkal; e.max és fém-kerámia kilencfokú átmenetből festődik, és a választás megőrzi a világossági ívet. Praxisbeállítás, nem a dokumentum része.
- 🔩 Az **üres implantátum-termékadat csak ott hiány, ahol a rendelő helyezte be az implantátumot** (`isImplantProductGap`) — a beteg által hozott implantátum teljes rekord, hiszen nem mindenkinek van implantátum-útlevele. A kiindulási leletből származtatva, sosem tárolva.
- 🦷🔻 Tömés vagy kariogén lézió nyaki érintettsége (`cervicalSurfaces`: halmaz a vesztibuláris és az orális felszín felett) — a fognyaki régió **nem** hatodik felszín, hanem jelölés egy meglévőn (a BEMA „vz"/„lz" utótagként írja), ezért soha nem változtatja meg a felszínszámot, amelyet egy tételbesorolás olvas (`getFillingSurfaceCount()`); ugyanabban a felszín-felugróban rögzítik, amelyet a caries- és a tömés-kereszt nyit meg, a felszín-cellán az utótagbetűvel jelölve, és megjelenik a tooltipben, valamint a teljes fogazat összefoglalójában annak a leletnek a sorában, amelyet minősít. Szándékosan nincs a fogtérképre rajzolva — az oldalnézetnek egyáltalán nincs linguális rétege
- 🦷💥 Fogkopás klinikai ok és hely szerint típusolva (`wearEdge`: none / attrition / erosion, metszőéli/rágófelszíni; `wearCervical`: none / abrasion / abfraction / erosion, cervikális) — felváltja a korábbi két be/ki bruxizmus-kopás jelzőt; két legördülő menüvel rögzíthető a kopás sorban, az eddigi kopás-grafikát használja, és megjelenik a tooltipben, valamint egy új, teljes szájüregre vonatkozó "Kopás" összegző szekcióban
- 🎨 Fogelszíneződés ok szerint (`discoloration`: none / tetracycline / fluorosis / nonvital / extrinsic / other) maradó és tejfogakon — a megjelenő természetes koronát egy jellemző színnel árnyalja, ha a fogon nincs pótlás és a szubsztrátuma természetes; megjelenik a tooltipben és egy új, teljes szájüregre vonatkozó "Elszíneződés" összegző szekcióban; a tömésdefektusok és a kopás mellett kiegészíti a felszíni és strukturális állapotok körét
- ✏️ A frontfogak (metszőfogak/szemfogak) a teljes felületen "metszőéli"-ként ("incisal") jelölik a rágófelszínüket (választó, felugró ablak, összegzések); a tárolt felület-kulcs továbbra is `occlusal` marad
- 🔤 Pozíciófüggő felület-jelölés (Beállítások → Fogadatok → "Felület-jelölés", egyszerű/teljes, alapértelmezett: teljes): teljes módban a caries/tömés felület betűjele és felirata a fog anatómiáját követi — okkluzális → I/metszőéli a frontfogakon, bukkális → L/labiális a frontfogakon, linguális → P/palatinális a felső fogakon és L/linguális az alsó fogakon (a meziális/disztális/korona alatti felületeket ez nem érinti); egyszerű mód mindig az általános B/M/O/D/L/SC jelölést használja, a fog pozíciójától függetlenül. A teljes szájüreg összegzésre, valamint mind a caries, mind a tömésdefektus felület-választóra vonatkozik (betű + felirat); a tárolt felület-kulcsot ez nem érinti
- 🦷↕️ Fogankénti ortodonciai rögzítés (`orthoAppliance`: none / bracket / band; `orthoDrift`: none / mesial / distal; `orthoVertical`: none / extrusion / intrusion; `orthoRotation`: logikai) egy meglévő természetes fogon (maradó vagy tejfog) — az alvó v2.5.0-s ortodonciai grafikát használja fel (nincs új SVG); megjelenik a diagramon, a tooltipben, és egy új, teljes szájüregre vonatkozó "Ortodoncia" összegző szekcióban
- 🪨 Fogkő, valamint belső vagy külső cervikális típusú gyökérreszorpció (`resorptionType`)
- 📏 Felületenkénti szuvasodás mélysége (felületes / dentin / mély), vagy opcionális ICDAS II pontozás (0–6) az `enableIcdas` proppal
- 🩹 Korona szegélyi rés (leakage) kapcsoló, csak korona vagy híd pótlás esetén jelenik meg
- 🧰 Egységes ikon-fejléc sor lapozott (tabos) Beállítások ablakkal (Általános / Panelek / Fogadatok / Caries / Pulpa / Jegyzetek / Periodontal — számozás, jegyzetek, panel-láthatóság, ICDAS, szuvasodás-mélység kapcsoló, gyökér-/radiológiai szuvasodás részletezettség, pulpa részletezettségi szint, fogkopás/elszíneződés részletezettségi szint, fogadatok)
- 🗂️ Beállítások → "Panelek" fül: a teljes szájüreg Státusz és Ortodoncia összegző panelek egymástól függetlenül elrejthetők/megjeleníthetők
- 🦷🩺 Beállítások → "Periodontal" fül: 16 index-szintű mutatás/elrejtés kapcsoló a parodontális diagram soraihoz (csoportosítva: tasak/higiénia/mukogingivális/tartás/peri-implantáris — PD/GM/CAL/BOP, plakk, PI, GI, CEJ láthatóság, gyökér-konkavitás, KG, GT, furkáció, mobilitás, Miller-osztály, mPI, mBI), mindegyik saját leírással, valamint egy fordított-vs-kanonikus index-név megjelenítési opcióval (kanonikus = egy rögzített angol/latin tudományos név minden UI-nyelven; a tooltipek ettől a beállítástól függetlenül mindig lokalizáltak maradnak). Mindkettő alkalmazás-szintű beállítás (mint a `perioViewMode`) — sosem része az export payloadnak
- 🩹 A szekunder caries (CARS) beállítások a Caries beállítási fülbe kerültek, a Radiológiai mélység fölé pozicionálva (a korábban különálló "Szekunder caries" fül megszűnt)
- 🎚️ Fogadatok részletezettségi szint (Beállítások → Fogadatok): egy egyszerű/összetett beállítás a fogkopásra és az elszíneződésre. Egyszerű mód igen/nem kapcsolót mutat leletenként (kopás be → attrition/abrasion, elszíneződés be → other); az összetett mód (alapértelmezett) megtartja a típus/ok legördülő menüket, és a tárolt érték megmarad a szintek közti váltáskor
- 📋 Fogadatok panel: élő szöveges összegzés a teljes státuszról (fogszámok, meglévő/hiányzó listák, szuvasodás beleértve a szekundert, tömések, gyökérkezelések, fogpótlások, implantátumok, parodontális státusz) — alaphelyzetben látszik, a Beállításokban kapcsolható
- 🗂️ Egységes Export legördülő menü (Státusz JSON / FHIR / PNG / JPG)
- 📥 Import legördülő menü FHIR importtal (visszatölti az exportált Bundle-öket)
- ⏳ Folyamatjelző overlay a képexport alatt
- 🎓 12 lépéses interaktív bemutató túra
- 🔢 Három számozási rendszer (FDI, Universal, Palmer)
- 🌐 I18n (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) választható nyelvvel (190+ fordítási kulcs nyelvenként)
- 🌗 Sötét mód támogatás váltógombbal (önálló vagy szülő alkalmazás által vezérelt)
- 🎨 Egyedi téma konfiguráció (`themeConfig` prop) CSS custom property-kkel (`--odon-*`)
- 📱 Mobil érintéses UX: koppintásos nagyítós felugró, hosszú nyomás helyi menü, csípéses zoom, WCAG 44px érintési célpontok, fogív navigáció
- 🔌 Egyedi SVG plugin rendszer: vizuális fedvények, foganként egyedi állapot, JSON export/import támogatás
- ⚠️ Állapot validáció figyelmeztetésekkel inkompatibilis fogállapot-kombinációkra
- 🏷️ Automatikus állapot tooltip a fogcsempéken (összes aktív állapot megjelenítése)
- 🩺 Modernizált fogankénti tooltip és teljes szájüreg összegző panel: mindkettő megjeleníti a klinikai leletek teljes körét (pulpa/apikális diagnózis + lézió altípus, gyökérreszorpció, peri-implantáris státusz, fokozatos gyökér szuvasodás, fogkő, korona szegélyi rés, törés, kontaktpont veszteség, típusolt metszőéli/rágófelszíni és cervikális kopás), a panelben egy dedikált "Diagnózisok" szekcióval, egy dedikált "Kopás" szekcióval, valamint egy durva caries-súlyossági minősítővel (felületes/közepes/mély)
- ♿ Billentyűzet akadálymentesítés (WCAG): ARIA listbox/option szerepkörök, Enter/Space kijelölés, nyílbillentyűs navigáció, focus-visible körvonalak
- 🔒 Csak olvasható mód: összes interakció letiltása nyomtatási/jelentés/megtekintési nézetekhez
- ✨ Kijelölési animációk: pulzáló szaggatott keret és ragyogó árnyék a kijelölt fogakon (prefers-reduced-motion támogatással)
- 📝 Fogankénti megjegyzések: dupla kattintás megjegyzés hozzáadásához/szerkesztéséhez, megjegyzés ikon a fogszám mellett, hover tooltip a megjegyzés szövegével, egy "Egyedi megjegyzések" sor a teljes szájüreg összegző panelen, JSON export/import
- 🔀 Státusz ↔ Terv diagram-felosztás: a diagram fejlécében lévő `Státusz | Terv` kapcsoló egy aktuális **státusz** diagram és egy **terv** (tervezett, kezelés utáni állapot) diagram között vált, mindkettő saját fogállapotokkal; a terv diagram az első váltáskor a státusz másolataként indul, és az egyik diagramon végzett szerkesztés sosem hat a másikra. Az export/import (`exportStatus`/fájl import) mindig a státusz diagramot célozza; a terv diagram külön, saját API-n keresztül olvasható/írható (lásd a Nyilvános API-t lentebb), és — ha eltér a státusztól — kiegészítő `plan` szekcióként szerepel a JSON exportban
- 📝 "Mi változik" doboz: amikor a terv eltér az aktuális státusztól, a Fogadatok panel alatti doboz fogankénti és kezelési tengelyenkénti (jelenlét, szubsztrátum, pótlás, protetika, tervezett korona, ortodoncia, pulpa/endo, apikális) bontásban felsorol minden eltérést `fog: tengely  ettől → erre` sor formájában; programozottan is elérhető a `getPlanChanges()` függvényen keresztül

![Parodontális státusz diagram (magyar)](screenshot_hu_perio.png)

- 🅿️ Javasolt (proposed) stílus: Terv módban azok a leletek, amelyeket a terv **hozzáad** az aktuális státuszhoz képest (tervezett korona, extrakció, ortodonciai elmozdulás, protetika, …), egy jellegzetes **szaggatott, színezett "javasolt" körvonallal** jelennek meg, hogy a terv szándékként és ne tényként olvasható — egy "szaggatott = javasolt" jelmagyarázattal a diagram kártyán. A Státusz módú megjelenítés byte-azonos marad; a kezelés csak a tervben létezik, és visszaváltáskor teljesen visszaáll
- 🚦 Terv módú szűrés (gating): a Terv diagram csak azt mutatja, amit a fogorvos *tenni* tud — az alap választó csak Hiányzó / Maradó / Implantátum opciókat kínál, és a csak-státusz leletek (caries, fogkopás, elszíneződés, valamint a teljes parodontális blokk — mobilitás, hat pontos szondázási rács, gyulladásos/parodontális módosítók, fogkő, peri-implantáris státusz) rejtve vannak; a Pulpa/Endo kezelőelem megtartja az endodonciai **kezelést** (gyökértömés / csap / rezekció / parapulpális csap), miközben elrejti a pulpa/apikális **diagnózist** és a gyökérreszorpciót. A pótlás, protetika, ortodoncia, korona-szükséges/csere és a fogeltávolítási terv továbbra is tervezhető marad
- 🧪 1746 automatizált teszt sikeres (1 további teszt kihagyva) (Vitest) 164 tesztfájlban (165 összesen): számozás, fordítások, presetek, i18n, App komponens, téma, érintés, pluginek, akadálymentesítés és klinikai tengelyek/diagnózisok paritása lefedésére
- 📖 TypeDoc API dokumentáció JSDoc kommentekkel minden publikus exporton (`bun run docs`)

### 📦 Modulok
- 🦷 Odontogram rács és fogcsempe UI
- 🎛️ Vezérlők és státusz panel
- 🎨 SVG rétegelő motor és fogsablonok
- 🔢 Fogszámozás és címke generálás (FDI/Universal/Palmer)
- 🌐 Lokalizáció (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- 💾 Státusz export/import
- 📋 Státusz extrák: előre definiált restaurációs sablonok
- 🎨 Téma konfiguráció: testreszabható színpaletta `--odon-*` CSS property-kkel
- 📱 Mobil érintéses interakciók (koppintásos nagyító, hosszú nyomás, csípéses zoom, fogív váltó)
- 🔌 Egyedi SVG plugin rendszer
- ⚠️ Állapot validáció és tooltip rendszer
- ♿ Billentyűzet akadálymentesítés és ARIA támogatás
- 🔒 Csak olvasható mód
- ✨ Kijelölési animációk
- 📝 Fogankénti megjegyzés rendszer
- 🧪 Automatizált tesztcsomag (Vitest + Testing Library)

### 🛠️ UI vezérlők

**🔝 Fejléc sáv:**
- Nyelvválasztó (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR legördülő)
- Sötét mód váltógomb (nap/hold ikon, világos és sötét téma között vált)
- Számozási rendszer választó (FDI/Universal/Palmer legördülő)
- Státusz exportálás / Státusz importálás gombok

**📊 Diagram fejléc:**
- Okkluzális nézet kapcsoló
- Bölcsességfog láthatóság kapcsoló
- Csont láthatóság kapcsoló
- Pulpa láthatóság kapcsoló
- Kiválasztás törlése gomb

**🔍 Kiválasztási szűrők:**
- Összes kiválasztása / Összes jelenlévő / Maradó / Tej / Implantátumok / Összes hiányzó
- Felső / Felső front 6 / Felső molárisok
- Alsó / Alsó front 6 / Alsó molárisok

**📋 Státusz minták:**
- Összes visszaállítása (szájüreg alaphelyzet)
- Tejfogazat
- Vegyes fogazat
- Fogatlan kapcsoló

**📦 Státusz extrák legördülő:**
- Felső/Alsó cirkon hidak (12-22, 13-23, 16-26, teljes ív)
- Felső/Alsó fém hidak (12-22, 13-23, 16-26, teljes ív)
- Felső/Alsó részleges kivehető protézisek
- Felső/Alsó teljes kivehető protézisek
- Felső/Alsó bár protézisek implantátumokkal

**🦷 Fog szerkesztő panel** (a kijelölt fog(ak)hoz, összecsukható kártyákba csoportosítva):
- **Alap sor:** fog kiválasztás (alaptípus, beleértve a törött-korona változatokat) és fogszubsztrátum (natural/radix/broken/crownprep)
- **Pótlás sor:** a kombinált pótlás-legördülő, fajta szerint csoportosítva (Korona / Híd / Inlay / Onlay / Héj / „Kivehető:"), ahol minden sor maga nevezi meg a fajtáját és az anyagát (`restorationType`×`restorationMaterial` fix opciók, plusz a `prosthesis` csatlakozós/kivehető opciók, a fog típusa szerint szűrve); korona szegélyi rés jelölőnégyzet (csak korona/híd); törött-korona hely jelölőnégyzetek; korona szükséges / koronacsere szükséges kapcsolók
- **Kopás és elszíneződés sor:** metszőéli/rágófelszíni kopás típus legördülő menü, cervikális kopás típus legördülő menü, elszíneződés ok legördülő menü (mindegyik egyszerű igen/nem kapcsolóra vált a Beállítások → Fogadatok → egyszerű mód alatt)
- **Ortodoncia kártya:** készülék, meziális/disztális elmozdulás, vertikális mozgás (extrúzió/intrúzió), rotáció kapcsoló — egy meglévő természetes fogon jelenik meg
- **Caries kártya:** caries-mélység mód legördülő menü, korona alatti caries jelölőnégyzet, gyökér-caries súlyosság legördülő menü, valamint a B/M/O/D/L felületenkénti caries választó egy kontextusfüggő ICDAS-mélység/CARS felugró ablakkal és egy radiológiai-mélység jelvénnyel
- **Tömések kártya:** tömőanyag legördülő menü, felületenkénti tömés választó (felületenkénti anyaggal), felületenkénti tömésdefektus jelző (marginális/törés/kopás), subcaries és tömésdefektus figyelmeztető megjegyzések
- **Gyökér és fogágy kártya:** összevont "Pulpa / Endo státusz" választó, apikális diagnózis választó, periapikális lézió altípus választó (csak tünetekkel járó/tünetmentes apikális periodontitis esetén), gyökérreszorpció típus választó, mobilitási fok választó, peri-implantáris státusz választó (csak implantátumokon)
- **Speciális jelzők:** fogeltávolítási terv/seb, zárt foghiány, barázdazárás, kontaktpont veszteség, fogkő, parapulpális csap, endo rezekció, hídpillér

### ⌨️ Leletfelvétel rövidítésekkel

A leletek másodpercek alatt születnek, gyakran diktálás után. 46 tengely és 129 érték mellett a
kattintási utak száma a szűk keresztmetszet, ezért a lelet úgy is bevihető, ahogy az ember amúgy
is gépel (`odontogram-t8y`):

```
13–23 kijelölése  húzás a fogak felett, Shift + nyíl vagy Shift + kattintás
E                 anyagmód: kerámia — beállítva marad
k                 hat korona, egyetlen billentyű
```

**Az anyag a lelet elé kerül és beállítva marad**, módként, nem utólagos kiegészítésként. Egy
anyagbillentyűnek két olvasata van, mert a tömés és a pótlás más értékkészletből merít: a `K mo`
kompozit tömés két felszínen, a `K k` Gradia korona. Ahol egy olvasat nem létezik, azt nem
találjuk ki.

**A Tabulátor a következő fogra lép**, a Shift+Tabulátor vissza, 18-tól indulva és a szájat
körbejárva (18–28, majd 38–48), körbefordulással. A kijelölést mozgatja, nem csupán a fókuszt, így
mindig látszik, melyik fognál tartunk. A nyílbillentyűk változatlanok.

```
G k    Tab    b          aranykorona, majd hídtag a szomszédon
A  mod Tab               egy amalgámtömés három felszínen
c mod K3                 caries három felszínen, súlyossággal
```

A leképezés a `src/shorthand.ts` fájlban él, DOM nélkül és a motortól függetlenül, mert ugyanaz a
leletkészlet háromféleképpen elérhető kell legyen: billentyűzetről, egy praxisrendszer elleni FHIR
lekérdezésből és beszédből.

A rövidítés a *charly* (solutio) leletbillentyűzetéről van átírva, nem kitalált.

A tartomány a **fogívet** követi, nem a geometriát (`odontogram-apn`): a középvonalon át (13-tól
23-ig) igen, a másik állcsontba soha.

### 🦷 Fogtípusok és állapotok

**Fog kiválasztás (alaptípus):**
| Érték | Leírás |
|---|---|
| `none` | Hiányzó fog |
| `tooth-base` | Maradó fog |
| `milktooth` | Tejfog |
| `implant` | Fogimplantátum |
| `tooth-under-gum` | Íny alatti (előbújatlan) fog |

**Tört fog változatok:**
`tooth-broken-inicisal`, `tooth-broken-distal-inicisal`, `tooth-broken-distal`, `tooth-broken-mesial-distal-inicisal`, `tooth-broken-mesial-distal`, `tooth-broken-mesial-inicisal`, `tooth-broken-mesial`, `no-tooth-after-extraction`

**Fogszubsztrátum (maradó fogak):**
`natural` (alapértelmezett), `radix` (gyökércsonk), `broken`, `crownprep` (koronaelőkészített)

**Pótlás típusa (maradó fogak):**
`none`, `crown`, `inlay`, `onlay` (csak okkluzális nézet), `veneer`, `bridge`

**Pótlás anyaga (maradó fogak):**
`none`, `emax`, `gold`, `gradia`, `zircon`, `metal`, `metal-ceramic` (a korábbi `metal` koronák ide migrálódnak), `telescope`, `temporary`

**A pótlási opciókat a fog típusa szűkíti** (`restorationOptions()`, `src/registry/restorations.ts`): egy implantátum csak `crown`/`bridge` pótlás típusokat kínál (kiegészítve egy implantátum-csatlakozó réteggel), plusz az alábbi öt `prosthesis` csatlakozási bejegyzést; egy hiányzó/foghiány fog csak `bridge` pontikot kínál, plusz a két kivehető fogsor `prosthesis` bejegyzést; egy `radix` szubsztrátum teljesen elrejti a pótlás-vezérlőt. A korábbi lapos `crownMaterial`/`bridgeUnit` mezők (a v1.14 előtti implantátum/híd csatlakozási értékek) megszűntek az élő modellből — csak írásvédett migrációs útként fogadja el a régi payloadokat.

**Protetika** (`prosthesis`; független kivehető/csatlakozós tengely, a kombinált pótlás legördülő menüben "Kivehető:" bejegyzésekként jelenik meg):
`none`, `healing-abutment`, `locator`, `locator-denture`, `bar`, `bar-denture` (implantátum csatlakozók, overdenture-rel vagy anélkül), `removable-partial`, `removable-full` (fogtámasztékú fogsorok egy hiányzó/foghiány fogon). Egy fognak vagy fix pótlása, vagy protetikája van, sosem mindkettő — az egyik beállítása törli a másikat.

**Korona szegélyi rés** (`crownLeakage`; logikai): csak akkor jelenik meg, ha a `restorationType` értéke `crown` vagy `bridge`; aktiválja a `crown-leakage` grafikai réteget.

**Endodonciai lehetőségek (maradó fogak):**
`none`, `endo-medical-filling`, `endo-filling`, `endo-filling-incomplete`

**Gyökércsap anyaga (maradó fogak, az `endo` értékétől függetlenül):**
`none`, `glass-fiber`, `metal`

**Endodonciai lehetőségek (tejfogak):**
`none`, `endo-medical-filling`

Az `endo` és a `pulpDx` egyetlen összevont "Pulpa / Endo státusz" `<select>` mezőn keresztül érhető el (csoportosítva: vitális pulpa vs. kezelt/endo), és kölcsönösen kizárják egymást — egy kezelt (`endo != none`) opció kiválasztása a `pulpDx` értékét `normal`-ra állítja vissza, egy pulpa diagnózis kiválasztása pedig az `endo` értékét `none`-ra állítja vissza.

**Tömőanyagok (maradó fogak):**
`amalgam`, `composite`, `gic`, `temporary`

**Tömőanyagok (tejfogak):**
`composite`, `gic`, `temporary`

**Tömés/szuvasodás felületek:**
`mesial`, `distal`, `buccal`, `lingual`, `occlusal`, `subcrown` (csak szuvasodáshoz)

**Módosítók:**
`inflammation` (periapikális), `parodontal` (parodontális), `mobility` (M1/M2/M3)

**Periapikális lézió típusa** (`periapicalType`; a periapikális jelölést minősíti, csak tünetekkel járó/tünetmentes apikális periodontitis esetén jelenik meg):
`none`, `granuloma`, `cyst` — rögzíthető opciók; a korábbi `abscess` érték továbbra is elfogadott/tárolt, de a választóban már nem kínált fel, mivel duplikálja az apikális diagnózist. Importáláskor eldobásra kerül: ha a fogon szerepel a gyulladás módosító, beleolvad az `apicalDx`-be, egyébként `none`-ra törlődik

**Pulpa diagnózis** (AAE terminológia; `pulpDx`):
`normal`, `reversible-pulpitis` (csökkentett méretű pulpa jelölést jelenít meg), `irreversible-pulpitis`, `necrosis` — kölcsönösen kizárja az `endo`-t; gyökérkezelt fogon `normal`-ra normalizálódik

**Pulpa diagnózis, gyakorlati latin** (`pulpLatin`; a pulpa választó csak akkor jeleníti meg, ha a `pulpDetailLevel` értéke `latin`):
`none`, `pulpa-sana`, `hyperaemia-pulpae`, `pulpitis-acuta-serosa`, `pulpitis-acuta-purulenta`, `pulpitis-chronica-clausa`, `pulpitis-chronica-ulcerosa`, `pulpitis-chronica-hyperplastica`, `necrosis-pulpae`, `gangraena-pulpae`

**Pulpa részletezettségi szint** (`pulpDetailLevel`, globális beállítás): `simple`, `aae` (alapértelmezett), `latin` — meghatározza, hogy a választó milyen pulpa terminológiát kínál

**Apikális diagnózis** (`apicalDx`; a periapikális jelölést határozza meg):
`normal`, `symptomatic-apical-periodontitis`, `asymptomatic-apical-periodontitis`, `acute-apical-abscess`, `chronic-apical-abscess`, `condensing-osteitis`

**Gyökérreszorpció típusa** (`resorptionType`):
`none`, `internal`, `external-cervical`

**Peri-implantáris státusz** (`periImplant`; csak implantátumokon, 2018-as World Workshop staging): a `mucositis` újrahasznosítja a parodontális íny jelölést; a `peri-implantitis-*` hozzáadja a `peri-implant-bone-loss` réteget, súlyosság szerint skálázott átlátszósággal (enyhe 0,4 / közepes 0,7 / súlyos 1,0). Az implantátumok többé nem jelenítik meg a periapikális lézió jelölést (a gyulladásukat ehelyett ez a tengely fejezi ki), és a `mods` gyulladás/parodontális jelölőnégyzetek rejtve vannak implantátumokon:
`none`, `mucositis`, `peri-implantitis-mild`, `peri-implantitis-moderate`, `peri-implantitis-severe`

**Caries súlyosság** (`cariesSeverity`; egységesített, felületenkénti mező, `0`–`6`): tömés nélküli felületen az ICDAS caries-mélység skálaként olvasandó (`superficial` / `dentin` / `deep`, vagy a nyers ICDAS II kódok `0–6`, ha az `enableIcdas` be van kapcsolva), és az elsődleges `caries-{surface}` réteget jeleníti meg; tömött felületen elnevezett CARS pontszámként olvasandó (`0` ép … `6` kiterjedt üreg), és helyette a `subcaries-{surface}` (szekunder caries) réteget jeleníti meg — egy felület soha nem elsődleges és szekunder egyszerre

**Gyökér szuvasodás** (`rootCaries`; bekapcsolja a `caries-root` grafikai réteget egy meglévő fogon, a súlyosságtól függő átlátszósággal — `active` 0,5 / `arrested` 0,7 / `active-cavitated` teljes átlátszóság):
`none`, `active`, `arrested`, `active-cavitated`

**Radiológiai szuvasodás mélység** (`radiographicDepth`; felületenként, független a vizuális ICDAS/CARS `cariesSeverity` skálától):
`none`, `E1`, `E2`, `D1`, `D2`, `D3`

**Szuvasodás-részletezettségi beállítások** (globális): `secondaryCariesMode` (`simple`/`standard`/`full`, alapértelmezett `standard`), `rootCariesMode` (`simple`/`severity`, alapértelmezett `simple`), `radiographicDepthMode` (`off`/`threeLevel`/`detailed`, alapértelmezett `off`), `cariesDepthEnabled` (logikai, alapértelmezett `true`) — mindegyik egyszerűbb választó nézetre egyszerűsíti a saját skáláját a tárolt érték módosítása nélkül

**Speciális jelzők:**
`crownNeeded`, `crownReplace`, `missingClosed`, `extractionPlan`, `extractionWound`, `bridgePillar`, `fissureSealing`, `contactMesial`, `contactDistal`, `endoResection`, `calculus`, `parapulpalPin`

**Fogkopás** (`wearEdge`, `wearCervical`; hely szerinti klinikai típus, feltétele: tooth-base + nincs pótlás + természetes szubsztrátum; a meglévő `tooth-bruxism-wear`/`tooth-bruxism-neck-wear` rétegeket rendereli):
`wearEdge`: `none`, `attrition`, `erosion` — `wearCervical`: `none`, `abrasion`, `abfraction`, `erosion`

**Elszíneződés** (`discoloration`; fogankénti ok, feltétele: természetes tooth-base vagy tejfog + nincs pótlás + természetes szubsztrátum; a megjelenő természetes korona kitöltését árnyalja — nincs új SVG):
`none`, `tetracycline`, `fluorosis`, `nonvital`, `extrinsic`, `other`

**Tömésdefektus** (`fillingDefect`; felületenként, közvetlen restauráció lelet, függetlenül a szekunder caries-tól — feltétele, hogy a felület szerepeljen a `fillingSurfaceMaterials`-ban; a `defect-{surface}` grafikai réteget rendereli):
`none`, `marginal`, `fracture`, `wear`

**Rögzítő elem** (`retention` + `retentionSide`; fogaként, elemenként feltételekkel; nincs grafikai réteg, a rács-overlayen rajzolva):
`none`, `clasp`, `attachment`, `bar-abutment` — `retentionSide`: `none`, `mesial`, `distal`, `both`. A **teleszkóp** korona-ANYAG marad, és rögzítő elemként ismerhető fel

**Nyaki érintettség** (`cervicalSurfaces`; halmaz a `buccal`/`lingual` felett, csak olyan felszínen, amely tömést, kariogén léziót vagy mindkettőt hordoz — nincs grafikai réteg, szándékosan nincs rajzolva):
`buccal`, `lingual` — jelölés a felszínen, soha nem önálló felszín: a `getFillingSurfaceCount()` érintetlen marad

**Ortodoncia** (`orthoAppliance`, `orthoDrift`, `orthoVertical`, `orthoRotation`; fogankénti, feltétele egy meglévő természetes fog — maradó vagy tej):
`orthoAppliance`: `none`, `bracket`, `band` — `orthoDrift`: `none`, `mesial`, `distal` — `orthoVertical`: `none`, `extrusion` (felfelé mutató nyíl jelölés), `intrusion` (lefelé mutató nyíl jelölés) — `orthoRotation`: logikai

**Fogadatok / jelölés beállítások** (globális munkamenet-beállítások, Beállítások → Fogadatok): `wearDetailLevel` és `discolorationDetailLevel` (`ToothDetailLevel`: `simple`/`complex`, alapértelmezett `complex` — egyszerű mód igen/nem kapcsolót mutat a teljes típus/ok legördülő menü helyett, a tárolt érték módosítása nélkül), valamint `surfaceNotation` (`simple`/`full`, alapértelmezett `full` — meghatározza, hogy a caries/tömés felület betűjelek/feliratok pozíciófüggőek-e; lásd a fenti "Pozíciófüggő felület-jelölés" részt)

### ⚙️ Beállítások
A fejléc fogaskerék ikonjával nyitható; egy focus-trapped, ARIA `dialog` lapozott (tabos) elrendezéssel (Esc/háttérre kattintás a bezáráshoz, nyílbillentyűk a fülek közti váltáshoz). Minden beállítás csak munkamenet-szintű UI állapot, hacsak másképp nincs jelezve — egyik sem módosítja a fogankénti adatokat vagy az export payloadot.

- **Általános:** számozási rendszer (FDI/Universal/Palmer), nyelv, sötét/világos téma, fogadatok panel láthatósága
- **Panelek:** a teljes szájüreg Státusz kártya és az Ortodoncia kártya egymástól függetlenül elrejthető/megjeleníthető (mindkettő alapértelmezésben látható)
- **Fogadatok:** kopás részletezettségi szint és elszíneződés részletezettségi szint (egyszerű/összetett, mindkettő alapértelmezetten összetett), felület-jelölés (egyszerű/teljes, alapértelmezett: teljes)
- **Caries:** ICDAS II pontozás kapcsoló (`enableIcdas`), caries-mélység kapcsoló (`cariesDepthEnabled`), gyökér-caries részletezettség (`rootCariesMode`: simple/severity), szekunder/CARS részletezettség (`secondaryCariesMode`: simple/standard/full), radiológiai-mélység részletezettség (`radiographicDepthMode`: off/threeLevel/detailed) — a korábban különálló "Szekunder caries" fül ebbe olvadt bele, a CARS vezérlő közvetlenül a radiológiai mélység fölé kerülve
- **Pulpa:** pulpa részletezettségi szint (`pulpDetailLevel`: simple/AAE/gyakorlati latin, alapértelmezett AAE) — meghatározza, hogy a "Pulpa / Endo státusz" választó milyen terminológiát kínál; módosításakor a teljes szájüreg összegzés és minden nyitott tooltip azonnal frissül
- **Jegyzetek:** fogankénti megjegyzések be/kikapcsolása (`enableNotes`)
- **Periodontal:** index-szintű mutatás/elrejtés kapcsolók mind a 16 parodontális diagram sorhoz (`perioRowVisibility`, alapértelmezetten mind látható), csoportosítva Tasak (PD/GM/CAL/BOP) / Higiénia (Plakk/PI/GI) / Mukogingivális (CEJ láthatóság/Gyökér-konkavitás/KG/GT) / Tartás (Furkáció/Mobilitás/Miller-osztály) / Peri-implantáris (mPI/mBI) csoportokba, mindegyik saját leírással; valamint egy fordított-vs-kanonikus index-név mód (`perioIndexNameMode`: alapértelmezetten `translated` / `canonical` — egy rögzített angol/latin tudományos név minden UI-nyelven). Csak alkalmazás-szintű beállítások (a `perioViewMode`-ot tükrözve) — sosem szerializálódnak, a tooltipek mindkét módban lokalizáltak maradnak

### 🖼️ SVG sablon rendszer

**Fogsablonok** (`src/assets/teeth-svgs/`):
| Sablon | Használó fogak |
|---|---|
| **Maradó fogak** | |
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
| **Tejfogak** | |
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

A tejfogként rögzített fog saját sablonból rajzolódik, amely a maradó sablon helyére kerül; a maradó sablonok az alsó állcsonthoz 180 fokkal elfordulnak és a bal oldalhoz vízszintesen tükröződnek, a tejfogsablonok ugyanezt a leképezést követik.

**Ikon SVG-k** (`src/assets/icon-svgs/`):
`icon_8.svg` (bölcsesség), `icon_gum.svg` (csont), `icon_no_selection.svg` (törlés), `icon_occl.svg` (okkluzális nézet), `icon_pulp.svg` (pulpa)

### 🔢 Számozási rendszerek

**FDI (ISO 3950):** Felnőtt fogak 11-18, 21-28, 31-38, 41-48. Tejfogak 51-55, 61-65, 71-75, 81-85.

**Universal (USA):** Felnőtt fogak 1-32 számozással. Tejfogak A-T betűkkel.

**Palmer (Zsigmondy-Palmer):** Kvadráns + pozíció formátum (pl. UR-1, LL-5). Tejfogak kvadránsonként A-E betűkkel.

### 🚀 Használat
Fejlesztés indítása:
```bash
bun install
bun run dev
```
Build:
```bash
bun run build
```
Előzetes megtekintés:
```bash
bun run preview
```

### 🔗 Integráció
A komponens beágyazható bármely React alkalmazásba.
Példa:
```tsx
import App from "./App";

export default function Host(){
  return (
    <App
      language="hu"
      onLanguageChange={(lang) => console.log(lang)}
      numberingSystem="FDI"
      onNumberingChange={(system) => console.log(system)}
      darkMode={false}
      onDarkModeChange={(dark) => console.log(dark)}
    />
  );
}
```

**Sötét mód integráció:**
- **Önálló mód:** A `darkMode` prop elhagyása — a komponens saját maga kezeli a téma állapotát a fejléc váltógombján keresztül, és hozzáadja/eltávolítja a `.dark` osztályt a `<html>` elemen.
- **Vezérelt mód:** A `darkMode` és `onDarkModeChange` átadása — a szülő alkalmazás vezérli a témát. A váltógomb továbbra is megjelenik, de a `onDarkModeChange` callbacket hívja a belső állapot kezelése helyett. A szülő alkalmazás felelős a `.dark` osztály hozzáadásáért/eltávolításáért a `<html>` elemen.

**Egyedi téma:**
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

**Plugin integráció:**
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

// Plugin állapot beállítása egy foghoz:
setPluginState(11, "implant-brand", "Straumann");
```

**Vezérelt integráció — a felületi tartomány dokumentuma (2.3.0-tól):**

A komponens klinikai állapota egy **felületi tartományú dokumentum**: ugyanaz a
verziózott JSON, amelyet az `exportStatus()` ír és az `importStatus()` olvas. Ez a
dokumentum — nem a FHIR — az, amit a React állapot tárol, és ami a gazdaalkalmazásé.

Kösd az példányt egy elszigetelt **munkamenethez**, hogy inicializálni és figyelni tudd,
és hogy két beillesztett fogtérkép független maradjon:

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

- `session.getDocument()` / `setDocument(doc)` / `subscribe(listener)` — ez a teljes
  szerződés; a `createOdontogramSession(initial?)` hoz létre egyet. HKP hosts read
  treatment intent from `session.getPlanChanges()`, not the module singleton.
- A `session` helyett megadott egyszerű `document` prop hatására a példány saját, abból
  inicializált munkamenetet hoz létre.
- Ha **egyiket sem** adod meg, a korábbi önálló viselkedés marad: a komponens a folyamat
  alapértelmezett munkamenetén (`getDefaultOdontogramSession()`) dolgozik, és minden
  modulszintű belépési pont változatlanul arra hat. **Migráció nem szükséges.**
- Egyszerre csak egy munkamenet *él* a DOM-motorban (egyetlen globális motor van egy
  fográcshoz kötve); a többi megőrzi saját dokumentumát, és a munkamenet API-ján keresztül
  továbbra is teljesen olvasható és írható.

**FHIR / Dental Core:**

A FHIR-konverzió a felhasználói felület dokumentumának tiszta, opcionális leképezése. A Dental Core `de.cognovis.fhir.dental.core#0.10.0` az egyetlen FHIR-szerződés; a felismert `odontogram-dental-core-0.6.0` jelölő az üres régi gyűjteményekhez továbbra is olvasható, az ismeretlen dialektusjelölők pedig elutasításra kerülnek. Az import, export és újraexport megőrzi a tizenegy forrástengelyt: `implantPosition`, `crownFractureType`, `orthoProgressive`, `rootResection`, `papillaLoss`, `orthoBracketSide`, `cantilever`, `endoCanals`, `rootFractureRoot`, `rootResectionRoot` és `apicalRoot`. A tervekben ezek a tengelyek hivatkozott célállapot-`Goal` erőforrást használnak; a meglévő tervmezők továbbra is profilozott tervezett Observations erőforrások maradnak. A tervezett állapot elkülönül a megfigyelttől, és nem hoz létre Devices vagy elvégzett Procedures erőforrásokat. A duplikált, ellentmondó, hibás, kétértelműen címzett vagy a foggal összeegyeztethetetlen állítások elutasításra kerülnek. A gyökércsapok a `rootPostType` révén függetlenek maradnak; a régi `endo-glass-pin` és `endo-metal-pin` értékek `endo-filling` plusz csapanyag formára migrálnak. A 5.0.0 óta az `extractionPlan`, `crownNeeded` és `crownReplace` mezők Dental Core 0.8 szerinti fogszintű megrendelésként íródnak (SNOMED CT 55162003 / 426222000, a koronánál `restoration-renewal` jelzéssel); a korábbi helyi kóddal írt megrendeléseket már nem olvassa be. Az 5.0.0 óta (a `@cognovis/fhir-sdk` 0.15.6 révén) minden fogállapot- és státuszlelet-érték kizárólag a Dental Core kódjaként íródik és olvasódik, helyi kódrendszer, tartalék vagy álnév nélkül; a rendszer-URL-ek a `@cognovis/fhir-sdk/terminology` modulból származnak.

**Aidbox élő mód (fejlesztés, 2.50.0-tól):**

Az önálló alkalmazásnak (`apps/standalone`) **egyetlen** belépési oldala van, és futásidőben választ módot: élő módban indul `?live` esetén, `?patient=<id>` esetén, vagy amikor Aidbox-konfiguráció van a környezetében — egyébként a fixture-játszóteret szolgálja ki. Élő módban egyetlen beteg fogazati kártyáját tölti be közvetlenül egy Aidbox-szerverről, a fenti munkamenet API-n keresztül a megszokott keretben jeleníti meg, és a változtatásokat Dental Core erőforrásokként írja vissza determinisztikus azonosítók alatt, így egy ismételt mentés frissít, nem duplikál.

Másolja az `apps/standalone/.env.example` fájlt `apps/standalone/.env` néven, és adjon meg egy korlátozott gépi klienst (lásd [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md)), majd a workspace gyökeréből:

```bash
bun install
bun run dev                                 # majd nyissa meg: http://localhost:5173/?live
```

Adminisztrátori hitelesítő adat soha ne kerüljön `VITE_*` kulcsba.

A HTTP-fél saját csomag, a [`@cognovis/react-odontogram-fhir`](../../odontogram-fhir): ez tartalmazza az Aidbox-transzportot és a gateway-gyárat, és egyedül ez függ a `@cognovis/fhir-sdk/client`-től. Ez a csomag a gateway-**SPI**-t és a munkamenet betöltés/mentés/írásterv delegáltjait szállítja — a HTTP-mentes felet —, és továbbra **sem** tartalmazza a `@cognovis/fhir-sdk/client`-et. Az 5.2.6-ös diagram és transzport kötelező SDK peer függősége `^0.22.0 || ^0.23.0`, pontos fejlesztői verziója `0.23.0` (Dental Core 0.10.0). A futtató alkalmazás az SDK `0.23.0` verzióját rögzíti, és felülírás nélkül egyetlen példányt használ. A beállítás és a betöltés/mentés mechanikája a [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md) fájlban található.

**Dátumozott vizsgálatok, felmérési státusz és peri-implantáris rögzítés (2.4.0-tól):**

Egy parodontális esetet éveken át újravizsgálnak, ezért a dokumentum mostantól hordozza a
vizsgálat saját azonosítóját és a korábbi vizsgálatok archívumát:

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

- Minden archivált vizsgálat a teljes fogazat leleteinek és az eset kontextusának **önálló
  pillanatfelvétele** a rögzítés pillanatában; a későbbi módosítások soha nem nyúlnak vissza
  bele, az ismételt rögzítés pedig utóvizsgálatot hoz létre ahelyett, hogy felülírná azt a
  kiindulási állapotot, amelyre a trend épül.
- A Státusz és a Terv továbbra is **a jelenlegit és a javasoltat jelenti egyetlen vizsgálaton
  belül** — a tervlap soha nem előzmény, és soha nem része egy pillanatfelvételnek.
- Minden azonosító mező átlátszatlan, a gazdaalkalmazás tulajdonában lévő szöveg, amelyet a
  komponens tárol és visszaad, de soha nem értelmez. A 2.21-es payload előtti dokumentumok
  nem tartalmaznak ilyet, és változatlanul betöltődnek.
- **Amit a beteg magával hozott, ebből az archívumból származik, sosem tárolt adat.** A LEGKORÁBBI archivált vizsgálatkor meglévő fogászati munka **sraffozva** jelenik meg, így a hozott korona nem téveszthető össze az általunk készítettel. Semmi új nem kerül szerializálásra. `getBaselineExamination()`, `getPreExistingAxes(toothNo)`, `getChangesSinceBaseline()`, `isToothPreExisting(toothNo)`.
- A sraffozás **munkát jelöl, sosem a fogat és sosem a betegséget** — restaurációk, tömések, gyökértömések és csapok, gyökércsúcs-reszekció, barázdazárás. A gyökérmaradvány vagy az implantátum fog, nem munka; a caries, a fogkő és a parodontális leletek betegségek.
- A **kiindulási lelet javítható**: `beginBaselineCorrection()`, `commitBaselineCorrection()`, `cancelBaselineCorrection()`. Szándékosan nincs fogankénti felülbírálás.
- Egy **saját archívum nélkül importált lelet kiindulási lelet lesz** (import menü, alapértelmezetten bekapcsolva). A saját archívumot hozó dokumentum megtartja azt.

A parodontális lap leleteket tárol, nem a vizsgálat tényét, így a "szondáztuk, nem vérzett"
és a "senki nem szondázta" eddig egyformán nézett ki. Az érintett tengelyek (PD, GM, BOP,
gennyedés, mozgathatóság, furkáció, plakk, PI, GI, mPI, mBI, KG) most már meg tudják mondani:

```ts
setAssessmentStatus(16, "bop", "MB", "assessed");
setAssessmentStatus(16, "pd", "DB", "unmeasurable");
getAssessmentStatus(16, "mpi", "buccal");
perioAxisApplies(16, "gm");
perioAxisApplies(11, "gm");
```

A "nem értelmezhető" abból vezetődik le, hogy a fog valójában mi, és a valódi mérés mindig
felülírja a rögzített hiányt. Exportáláskor a nem elérhető érték a FHIR saját
`dataAbsentReason` mezőjébe kerül — soha nem kitalált klinikai kódba —, a negatív lelet pedig
kifejezett `false` értékké vagy `0` fokozattá válik.

**Rögzítés (2.7.0-tól):** a parodontális karton fejlécében a **Vizsgálati állapot** kapcsoló
minden látható index-sor alá egy kísérősort tesz, mérési pontonként egy léptető gombbal —
mérőpont, felszín, furkációs bemenet vagy maga a fog. A sorok alapértelmezés szerint
kikapcsolva vannak. Ahol már van mért érték, a vezérlő zárolt (maga az érték a vizsgálat
bizonyítéka), a nem értelmezhető pozíció pedig letiltott, nem pedig némán figyelmen kívül
hagyott. A rögzített állapotok a fog tooltipjében és a teljes fogazati parodontális
összefoglalóban is megjelennek.

A teljes fogazatra kiterjedő parodontális lap mostantól helyenként rögzíti a **gennyedést**
is, az implantátumoszlop pedig támogatja a peri-implantáris vizsgálatot: hat ponton mért
szondázási mélység, vérzés, gennyedés, implantátum-mozgathatóság és keratinizált nyálkahártya
szélessége. Ott csak azok a tengelyek maradnak inaktívak, amelyekhez zománc-cement határ kell
(íny-szél és az abból számított CAL), valamint a természetes fog plakkindexei — ezek
peri-implantáris megfelelője az mPI és az mBI.
### 🧪 Tesztelés
```bash
bun run test           # Összes 1704 teszt futtatása (1 további teszt kihagyva)
bun run test:watch     # Figyelési mód
bun run test:coverage  # Lefedettségi jelentés
```

### 📖 API Dokumentáció
```bash
bun run docs           # TypeDoc dokumentáció generálása a docs/ mappába
```

### 📡 Nyilvános API

**Komponens propok:**

| Prop | Típus | Alapértelmezett | Leírás |
|---|---|---|---|
| `language` | `string` | `'hu'` | UI nyelv (hu/en/de/es/it/sk/pl/ru/pt-br) |
| `onLanguageChange` | `(lang) => void` | — | Callback nyelvváltáskor |
| `numberingSystem` | `string` | `'FDI'` | Számozási rendszer (FDI/Universal/Palmer) |
| `onNumberingChange` | `(system) => void` | — | Callback számozásváltáskor |
| `darkMode` | `boolean` | `undefined` | Sötét mód állapot. Elhagyva: önálló mód. |
| `onDarkModeChange` | `(dark) => void` | — | Callback sötét mód váltáskor. Szükséges vezérelt módhoz. |
| `themeConfig` | `OdontogramThemeConfig` | `undefined` | Egyedi szín felülírások CSS custom property-kkel (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | `undefined` | Egyedi SVG pluginek vizuális fedvényekhez és foganként egyedi állapothoz. |
| `readOnly` | `boolean` | `undefined` | Összes interakció letiltása (kattintás, érintés, billentyűzet). Nyomtatási/jelentés nézetekhez. |
| `enableNotes` | `boolean` | `undefined` | Fogankénti megjegyzések engedélyezése. Dupla kattintás a fogra megjegyzés hozzáadásához/szerkesztéséhez. |

**Exportált függvények külső vezérléshez:**

| Függvény | Leírás |
|---|---|
| `initOdontogram()` | Motor inicializálása és összes fog renderelése |
| `destroyOdontogram()` | Motor leállítása és eseménykezelők eltávolítása |
| `setNumberingSystem(system)` | Váltás FDI, Universal, Palmer között |
| `clearSelection()` | Összes fog kiválasztásának törlése |
| `setOcclusalVisible(on)` | Okkluzális nézet be/ki |
| `setWisdomVisible(on)` | Bölcsességfogak mutatása/elrejtése |
| `setShowBase(on)` | Csont réteg mutatása/elrejtése |
| `setHealthyPulpVisible(on)` | Egészséges pulpa mutatása/elrejtése |
| `registerPlugins(plugins)` | Egyedi SVG pluginek regisztrálása |
| `setPluginState(toothNo, pluginId, value)` | Plugin egyedi állapot beállítása egy foghoz |
| `getPluginState(toothNo, pluginId)` | Plugin egyedi állapot lekérdezése egy foghoz |
| `getToothStateSummary(toothNo)` | Lokalizált összesítés az összes aktív állapotról |
| `getOdontogramSummary()` | Strukturált, lokalizált szöveges összegzés a teljes státuszról (fogszámok, szekciók) |
| `onStateChange(callback)` | Feliratkozás állapotváltozásra; leiratkozó függvényt ad vissza |
| `setReadOnly(value)` | Csak olvasható mód be/kikapcsolása |
| `getReadOnly()` | Aktuális csak olvasható állapot lekérdezése |
| `setNotesEnabled(value)` | Fogankénti megjegyzések be/kikapcsolása |
| `getNotesEnabled()` | Aktuális megjegyzés-engedélyezés állapot lekérdezése |
| `setPulpDetailLevel(level)` | A pulpa választó terminológiájának beállítása — `"simple"`, `"aae"` vagy `"latin"` |
| `getPulpDetailLevel()` | Aktuális pulpa részletezettségi szint lekérdezése |
| `getChartMode()` | Az aktuálisan aktív diagram lekérdezése — `"status"` vagy `"plan"` |
| `setChartMode(mode)` | Az aktív diagram átváltása `"status"`-ra vagy `"plan"`-re; a terv diagram az első belépéskor mélymásolatként jön létre a státuszból |
| `getStatusChart()` | A státusz diagram payloadjának lekérdezése (`{version, globals, teeth}`), függetlenül attól, melyik diagram aktív éppen |
| `getPlanChart()` | A terv diagram payloadjának lekérdezése (`{version, globals, teeth}`), függetlenül attól, melyik diagram aktív éppen |
| `setPlanChart(payload)` | A terv diagram fogainak cseréje egy payloadból (a státusz érintetlen marad); a terv diagramot inicializáltnak jelöli |
| `getPlanChanges()` | A strukturált státusz→terv eltérés lekérdezése (`{ toothNo, axis, from, to }[]`) — egy bejegyzés fogankénti és kezelési tengelyenkénti eltérésre a státusz és terv diagram között; üres, ha nincs terv. A `getOdontogramSummary()`-n is megjelenik `plannedChanges` néven |
| `setPerioSite(toothNo, site, patch)` | Parodontális adat beállítása a hat pont egyikén (`patch` = `{ pd?, gm?, bop?, sup? }`); a `pd` null/`<1` értéke törli a pont rögzítettségét. Validál és korlátoz (PD 1–15, GM −10…+20) |
| `getToothPerio(toothNo)` | Egy fog pontonkénti parodontális rekordjának lekérdezése (csak a rögzített pontok) |
| `getToothCal(toothNo)` | Egy fog pontonkénti, levezetett CAL értékének lekérdezése (`pd + ínyszél`) |
| `getPerioSummary()` | Teljes szájüregi parodontális összesítők: rögzített pontok száma, vérzések száma, %BOP, legrosszabb CAL, max PD |
| `getPerioChart()` | Az aktív diagram fogankénti parodontális rekordjainak lekérdezése |
| `PerioChart` | React komponens (nevesített export) — a teljes szájüregre kiterjedő parodontális diagram overlay (`{ open, onClose }`), amely az `OdontogramShell`-től függetlenül is beágyazható a befogadó alkalmazás integrációjához |
| `openPerioOverlay()` / `closePerioOverlay()` / `isPerioOverlayOpen()` | A parodontális diagram overlay programozott megnyitása/bezárása/lekérdezése — lehetővé teszi, hogy a befogadó alkalmazás az odontogramtól külön hívja elő a parodontális diagramot (megosztott eset-állapot) |
| `getPerioViewMode()` / `setPerioViewMode(mode)` | A parodontális diagram megjelenítési módjának lekérdezése/beállítása — `"toggle"` (egy `Odontogram \| Dental Chart` nézetváltó, alapértelmezett) vagy `"popup"` (az overlay) |
| `getPerioOverlayLayer()` / `setPerioOverlayLayer(layer)` | A Dental Chart kiemelő overlay lekérdezése/beállítása — `"none"` (alapértelmezett) / `"pd"` / `"cal"` / `"gr"` / `"plaque"` / `"bop"` / `"pd5"` / `"pd6"` / `"cairo"`; az adott mérték szerint újrafesti a fogakat (csak megjelenítés, a meglévő adatok felett) |
| `getToothRecessionType(toothNo)` | A levezetett **Cairo recesszió típus** lekérdezése — `"none"` / `"rt1"` / `"rt2"` / `"rt3"` (a fog interproximális vs. bukkális CAL értékéből számítva) |
| `setCejVisibility(toothNo, v)` / `getCejVisibility(toothNo)` | Fogankénti CEJ láthatóság — `"none"` / `"detectable"` / `"not-detectable"` |
| `setRootConcavity(toothNo, v)` / `getRootConcavity(toothNo)` | Fogankénti gyökérfelszíni konkavitás — `"none"` / `"mild"` / `"deep"` |
| `setPlaqueIndex(toothNo, surface, grade)` / `getPlaqueIndex(toothNo, surface)` | Felületenkénti Silness-Löe Plakk Index fokozat — `0`-`3` |
| `setGingivalIndex(toothNo, surface, grade)` / `getGingivalIndex(toothNo, surface)` | Felületenkénti Löe-Silness Gingivális Index fokozat — `0`-`3` |
| `setKeratinizedWidth(toothNo, mm)` / `getKeratinizedWidth(toothNo)` | Fogankénti bukkális keratinizált íny szélesség mm-ben — `0`-`15`, vagy `null`, ha nincs rögzítve |
| `setGingivalThickness(toothNo, v)` / `getGingivalThickness(toothNo)` | Fogankénti íny vastagsági fenotípus — `"unknown"` / `"thin"` / `"medium"` / `"thick"` |
| `setMillerClass(toothNo, v)` / `getMillerClass(toothNo)` | Fogankénti Miller recesszió osztály — `"none"` / `"i"` / `"ii"` / `"iii"` / `"iv"` |
| `setPeriImplantPlaque(toothNo, surface, grade)` / `getPeriImplantPlaque(toothNo, surface)` | Csak implantátumon — felületenkénti Mombelli módosított Plakk Index (mPI) fokozat — `0`-`3`; nem-implantátum fogon hatástalan |
| `setPeriImplantBleeding(toothNo, surface, grade)` / `getPeriImplantBleeding(toothNo, surface)` | Csak implantátumon — felületenkénti Mombelli módosított Sulcus Vérzési Index (mBI) fokozat — `0`-`3`; nem-implantátum fogon hatástalan |
| `furcationEntrances(toothNo)` | Egy fog furkáció-bejáratai — `["mesial","distal","buccal"]` (felső őrlők), `["buccal","lingual"]` (alsó őrlők), `["mesial","distal"]` (felső első kis őrlők), egyébként `[]` |
| `setFurcation(toothNo, entrance, grade)` / `getToothFurcation(toothNo)` | Bejáratonkénti furkáció-érintettség beállítása/lekérdezése (Glickman `1`–`4`; `null` törli) |
| `setPlaque(toothNo, surface, present)` / `getToothPlaque(toothNo)` | O'Leary plakk-jelenlét beállítása/lekérdezése felületenként (meziális/disztális/bukkális/linguális); a teljes szájüregi PI%-ot táplálja a `getPerioSummary()`-ban |
| `getCaseMeta()` | Az eset-szintű metaadat objektum lekérdezése (`{age, smokingStatus, cigarettesPerDay, diabetesStatus, hba1c, toothLossPerio, maxRblPercent, patientName, patientDob, examDate}`) — egyetlen megosztott blokk, nem fogankénti/kettős állapotú (a felső szintű `globals` payload kulcsot tükrözi); a parodontális stádium/grádus klasszifikációt táplálja |
| `setPatientName(v)` | Az eset páciensnevének beállítása (körbevágva; üres string vagy `null` törli) — csak azonosítási adat, sosem kerül be a parodontális levezetésbe |
| `setPatientDob(v)` | Az eset páciens születési dátumának beállítása (`ÉÉÉÉ-HH-NN`; érvénytelen/üres törli)|
| `setExamDate(v)` | Az eset vizsgálati dátumának beállítása (`ÉÉÉÉ-HH-NN`; érvénytelen/üres törli) |
| `setCaseAge(v)` | Az eset páciens életkorának beállítása években — `0`-`120`, vagy `null` a törléshez |
| `setSmokingStatus(v)` | Az eset dohányzási státuszának beállítása — `"unknown"` / `"never"` / `"former"` / `"current"` |
| `setCigarettesPerDay(v)` | Napi cigaretta-szám beállítása (csak `"current"` dohányzási státusz esetén értelmezhető) — `0`-`99`, vagy `null` a törléshez |
| `setDiabetesStatus(v)` | Az eset diabétesz-státuszának beállítása — `"unknown"` / `"none"` / `"present"` |
| `setHba1c(v)` | HbA1c % beállítása (csak `"present"` diabétesz-státusz esetén értelmezhető) — `3.0`-`20.0` (egy tizedesjeggyel), vagy `null` a törléshez |
| `setToothLossPerio(v)` | Parodontitis miatt elveszített fogak számának beállítása — `0`-`32`, vagy `null` a törléshez |
| `setMaxRblPercent(v)` | Maximális radiológiai csontveszteség %-ának beállítása — `0`-`100`, vagy `null` a törléshez |
| `resetCaseMeta()` | Az eset-szintű metaadat objektum visszaállítása üres alapértékekre |
| `getPerioClassification()` | A 2017-es World Workshop parodontális klasszifikáció lekérdezése (`{diagnosis, stage, grade, extent, derived, overridden}`) — a diagnózis/stádium/grádus/kiterjedtség a rögzített parodontális adatokból és az eset metaadatokból van levezetve, mindegyik tengelyt a klinikus felülbírálása vált fel, ha be van állítva (a `derived` mindig az érintetlen számított értékeket adja, az `overridden` jelzi, mely tengelyek lettek felülbírálva) |
| `setDiagnosisOverride(v)` | A levezetett parodontális diagnózis felülbírálása — `"health"` / `"gingivitis"` / `"periodontitis"`, vagy `null` a törléshez (visszaáll a levezetett értékre) |
| `setStageOverride(v)` | A levezetett parodontális stádium felülbírálása — `"I"` / `"II"` / `"III"` / `"IV"`, vagy `null` a törléshez (visszaáll a levezetett értékre) |
| `setGradeOverride(v)` | A levezetett parodontális grádus felülbírálása — `"A"` / `"B"` / `"C"`, vagy `null` a törléshez (visszaáll a levezetett értékre) |
| `setExtentOverride(v)` | A levezetett parodontális kiterjedtség felülbírálása — `"localized"` / `"generalized"` / `"molar-incisor"`, vagy `null` a törléshez (visszaáll a levezetett értékre) |
| `exportImage(format)` | Az odontogram letöltése képként — `"png"` vagy `"jpg"` |
| `exportSvg()` | Az odontogram letöltése méretezhető SVG-ként (vektoros) |
| `hasAnyPerioData()` | `true`, ha bármely parodontális tengely rögzítve van bárhol a szájüregben — ez vezérli a parodontális export automatikus kihagyását, és üres diagram esetén letiltja a parodontális export-menüpontokat |
| `startIntroTour()` | A 12 lépéses interaktív bemutató túra indítása |

### 💾 Állapot Export/Import formátum
Az export egy JSON fájlt hoz létre (`2.20` verziójú; az importálás továbbra is elfogadja a korábbi `1.4` és `2.0`–`2.19` verziókat, és automatikusan migrálja őket), amely tartalmazza:

**Globális mezők:**
- `wisdomVisible` - bölcsességfogak láthatók
- `showBase` - csont réteg látható
- `occlusalVisible` - okkluzális nézet aktív
- `showHealthyPulp` - egészséges pulpa látható
- `edentulous` - fogatlan mód aktív

**Fogankénti mezők (32 fog):**
- `toothSelection` - alap fog típusa
- `toothSubstrate` - fogszubsztrátum (natural/radix/broken/crownprep), bármely pótlástól függetlenül
- `restorationType` - pótlás típusa (none/crown/inlay/onlay/veneer/bridge)
- `restorationMaterial` - pótlás anyaga (emax/gold/gradia/zircon/metal/metal-ceramic/telescope/temporary), a `restorationType`-hoz párosítva
- `prosthesis` - kivehető/csatlakozós tengely (none/healing-abutment/locator/locator-denture/bar/bar-denture/removable-partial/removable-full), kölcsönösen kizárja a fix korona/híd `restorationType`-ot
- `crownLeakage` - korona szegélyi rés jelző, csak akkor releváns, ha a `restorationType` korona vagy híd
- `endo` - endodonciai állapot; kölcsönösen kizárja a `pulpDx`-et (egyetlen összevont "Pulpa / Endo státusz" választón keresztül érhetők el együtt — egy fog kezelése a `pulpDx`-et `normal`-ra normalizálja)
- `rootPostType` - gyökércsap anyaga (`none`, `glass-fiber`, `metal`), az `endo` állapottól függetlenül
- `mods` - módosítók tömbje (inflammation, parodontal); az `inflammation` megszűnt a felületen meglévő fogaknál (ott az `apicalDx` határozza meg a jelölést), de továbbra is érvényes hiányzó/extrakciós alveolus fogaknál
- `caries` - aktív szuvasodási felületek
- `cariesActiveDepth` - a caries-mélység választó által ideiglenesen tárolt ICDAS-mélység érték új felület alkalmazásakor (nem felületenkénti tárolt érték; a felületenkénti mezőhöz lásd a `cariesSeverity`-t)
- `rootCaries` - gyökér szuvasodás súlyossága (none/active/arrested/active-cavitated)
- `cariesSeverity` - egységesített, felületenkénti súlyossági érték (0-6): ICDAS mélység egy elsődleges (tömés nélküli) felületen, CARS pontszám egy szekunder (tömött) felületen
- `radiographicDepth` - felületenkénti radiológiai szuvasodás mélység (none/E1/E2/D1/D2/D3), független a vizuális ICDAS/CARS skálától
- `fillingMaterial` - tömőanyag
- `fillingSurfaces` - tömött felületek
- `fillingSurfaceMaterials` - felületenkénti tömőanyag (vegyes tömések, pl. bukkális amalgám + disztális kompozit)
- `retention` - mi tartja a kivehető fogpótlást ezen a fogon (none/clasp/attachment/bar-abutment)
- `retentionSide` - a rögzítő elem támadási oldala (none/mesial/distal/both)
- `fillingDefect` - felületenkénti tömésdefektus (none/marginal/fracture/wear), feltétele egy tömött felület, függetlenül a szekunder caries-tól
- `cervicalSurfaces` - azok a felszínek, amelyek tömése vagy kariogén léziója a fognyaki régióba terjed (buccal/lingual); jelölés a felszínen, nem hatodik felszín
- `pulpDx` - AAE pulpa diagnózis (normal/reversible-pulpitis/irreversible-pulpitis/necrosis); a reversible-pulpitis csökkentett méretű jelölést jelenít meg
- `pulpLatin` - gyakorlati latin pulpa altípus (a pulpa választó csak akkor jeleníti meg, ha a `pulpDetailLevel` értéke `latin`)
- `apicalDx` - apikális diagnózis, amely meghatározza a periapikális jelölést
- `periapicalType` - periapikális lézió altípus (none/granuloma/cyst), csak tünetekkel járó/tünetmentes apikális periodontitis esetén jelenik meg; a korábbi `abscess` érték importáláskor még elfogadott
- `resorptionType` - gyökérreszorpció típusa (none/internal/external-cervical)
- `periImplant` - csak implantátumon értelmezett peri-implantáris státusz (none/mucositis/peri-implantitis-mild/-moderate/-severe), 2018-as World Workshop staging
- `endoResection` - rezekció jelzője
- `fissureSealing` - barázdazárás jelzője
- `calculus` - fogkő jelzője
- `contactMesial` - meziális kontaktpont veszteség
- `contactDistal` - disztális kontaktpont veszteség
- `wearEdge` - metszőéli/rágófelszíni kopás típusa (none/attrition/erosion)
- `wearCervical` - cervikális kopás típusa (none/abrasion/abfraction/erosion)
- `discoloration` - fogankénti elszíneződés oka (none/tetracycline/fluorosis/nonvital/extrinsic/other), a természetes koronát árnyalja egy pótlás nélküli, természetes szubsztrátumú tooth-base/tejfogon
- `orthoAppliance` - ortodonciai készülék (none/bracket/band)
- `orthoDrift` - ortodonciai elmozdulás (none/mesial/distal)
- `orthoVertical` - ortodonciai vertikális mozgás (none/extrusion/intrusion)
- `orthoRotation` - ortodonciai rotáció jelző
- `brokenMesial`, `brokenIncisal`, `brokenDistal` - törési helyek
- `extractionWound` - fogeltávolítás utáni seb
- `extractionPlan` - tervezett fogeltávolítás
- `parapulpalPin` - parapulpális csap jelzője
- `bridgePillar` - hídpillér fog
- `mobility` - mobilitási fok (none/m1/m2/m3)
- `crownNeeded` - korona szükséges jelzője
- `crownReplace` - koronacsere szükséges jelzője
- `missingClosed` - záródott foghiány a fogeltávolítás után
- `customStates` - plugin egyedi állapotok (objektum, plugin azonosító szerint kulcsozva)
- `note` - fogankénti szöveges megjegyzés (szöveg, opcionális — csak ha nem üres)

**Felső szintű `plan` mező (2.11-es verziótól):**
- `plan` - opcionális objektum, ugyanolyan alakú, mint a `teeth` (a fenti fogankénti mezők), amely a **terv** (tervezett, kezelés utáni állapot) diagramot tartalmazza. Csak akkor jelenik meg, ha a terv diagram inicializálva lett (a `Státusz | Terv` kapcsolót legalább egyszer Tervre váltották) ÉS tartalma eltér a státusz diagramtól — egy csak-státusz export teljesen kihagyja, és a verziószámon kívül byte-azonos marad egy 2.11 előtti exporttal. Importáláskor a `plan` hiánya törli/deinicializálja a terv diagramot (sosem éleszt fel egy, az import előttről megmaradt elavult tervet); a jelenlévő `plan` a státusszal együtt visszaállítja a terv diagramot is. A terv diagram az import/export mezőtől függetlenül is olvasható/írható a `getPlanChart()`/`setPlanChart()` függvényekkel (lásd a Nyilvános API-t fentebb), és a `getStatusChart()` mindig a státusz-elsődleges payloadot adja vissza, függetlenül az aktív diagram módtól.

**Felső szintű `case` objektum (2.17-es verziótól, bővítve 2.18-ban, 2.19-ben és 2.20-ban):**
- `case` - opcionális, eset-szintű metaadat objektum — NEM fogankénti és NEM kettős állapotú (ugyanaz az objektum osztott a státusz és a terv diagram között, a felső szintű `globals` payload kulcsot tükrözve). Tartalmazza a páciens életkorát (`age`, 0-120), a dohányzási státuszt (`smokingStatus`: unknown/never/former/current, `cigarettesPerDay` 0-99 értékkel), a diabétesz-státuszt (`diabetesStatus`: unknown/none/present, `hba1c` 3.0-20.0 értékkel), két parodontális kimenet-összegző mutatót (`toothLossPerio` 0-32 és `maxRblPercent` 0-100), a 2017-es parodontális klasszifikáció klinikusi felülbírálásait (`diagnosisOverride`/`stageOverride`/`gradeOverride`/`extentOverride`), valamint három eset-azonosító mezőt — (2.19-es verziótól) `patientName` (körbevágott szöveg vagy `null`) / `examDate` (`ÉÉÉÉ-HH-NN` vagy `null`); és (2.20-as verziótól) `patientDob` (`ÉÉÉÉ-HH-NN` vagy `null`); egyik sem része a FHIR exportnak. Az üres mezők kihagyásával szerializálódik, és a teljes `case` objektum hiányzik, ha minden mezője az alapértékén van. A `getCaseMeta()`/`resetCaseMeta()` és az egyedi setterek kezelik (lásd a Nyilvános API-t fentebb).

### 🖨️ Export
Az odontogram saját Státusz JSON / FHIR / PNG / JPG / SVG exportján túl a **parodontális diagramnak** saját export útvonala van:
- A páciensnév, a születési dátum és a vizsgálati dátum csak diagram-azonosító metaadat (payload `2.20`, additív) — **nem** része a FHIR exportnak.

### 📁 Mappastruktúra
- `src/App.tsx` - UI váz, fejléc vezérlők, nyelv/számozás/sötét mód/téma/plugin választó
- `src/odontogram.ts` - SVG rétegelő motor, fog állapotkezelés, érintéses interakciók, plugin fedvények, UI összekötés
- `src/plugin.ts` - `OdontogramPlugin` típus, `PluginLayer`, `getQuadrant()`, `LAYER_Z` z-index prioritások
- `src/theme.ts` - `OdontogramThemeConfig` típus és `applyThemeConfig()` segédfüggvény
- `src/status_extras.ts` - 34 előre definiált restaurációs sablon (hidak, protézisek, bár konstrukciók)
- `src/i18n/` - fordítások (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) és i18n hook
- `src/utils/numbering.ts` - FDI, Universal, Palmer számozási konverzió
- `src/registry/` - deklaratív klinikai tengely- és UI-regiszter: tengelymetaadatok, SVG-aktiválás, pótlás típus×anyag mátrix, értékkatalógus és opciólisták; a FHIR-megfeleltetések a `src/fhir/` felelőssége
- `src/fhir/` - az egyetlen Dental Core HL7 FHIR R4 kapcsolódási pont: `toFhirDentalCore.ts`/`fromFhirDentalCore.ts` kodek az `@cognovis/fhir-sdk` fölött, `dentalCoreContract.ts`, valamint `dentalCoreLocalCoding.ts` segédek
- `src/bridgeOverlay.ts` - több fogra kiterjedő híd-csatlakozó overlay (ívhez igazodó nyereg-geometria)
- `src/SettingsModal.tsx` - lapozott (tabos) Beállítások ablak (Általános/Panelek/Fogadatok/Caries/Pulpa/Jegyzetek/Periodontal)
- `src/__tests__/` + `src/registry/__tests__/` - Vitest tesztcsomag (1704 teszt sikeres, 1 kihagyva, 163 fájlban)
- `src/assets/teeth-svgs/` - SVG fogsablonok (40 fájl: pozíciónként egy sablon - 16 maradó oldalnézet, 10 tejfog, 14 okkluzális)
- `src/assets/icon-svgs/` - eszköztár ikon SVG-k (5 fájl)

### ⚙️ Technológia
- React 18 + Vite + TypeScript
- Tailwind CSS a UI stílusokhoz
- SVG rétegelés DOM manipulációval (nem React state, a teljesítmény érdekében)
- Egyszerű egyedi i18n rendszer
- Vitest + Testing Library automatizált tesztekhez
- TypeDoc API dokumentációhoz
- Vite útvonal alias: `@` a `./src` mappára képezve

### 📝 Megjegyzések
- A SVG sablonok `src/assets/teeth-svgs` és `src/assets/icon-svgs` mappa alól kerülnek betöltésre, ezért statikus hostingnál a public mappa elérhetősége kötelező.
- Az odontogram motor saját belső állapotot használ (nem React state) a teljesítmény és egyszerűség érdekében.
- A tejfogaknál szűkebb anyagválaszték áll rendelkezésre (nincs amalgám tömés, nincs csapos endodonciai kezelés).
- Az implantátum fogaknál a korona/felépítmény lehetőségek eltérnek a természetes fogakétól.

---

### 📖 Hivatkozás

Ha ezt a modult használod a munkádban, kérlek hivatkozz rá.

**Ez a verzió (v1.49.0):**
> Dul, Z. (2026). *React Advanced Odontogram* (v1.49.0). Zenodo. https://doi.org/10.5281/zenodo.21156787

**Összes verzió (koncepció DOI):** https://doi.org/10.5281/zenodo.21156787

> A fenti, összes verzióra vonatkozó koncepció DOI mindig a legutóbb archivált
> kiadásra mutat; egy verzió-specifikus DOI minden kiadáshoz akkor jön létre,
> amikor azt archiválják a Zenodón. Amíg a v1.49.0 nincs archiválva, a koncepció
> DOI-val hivatkozz rá.

A géppel olvasható hivatkozási metaadatok a [`CITATION.cff`](../../../CITATION.cff) fájlban találhatók.

## 📄 License

Created with ❤️ by Zoltan Dul (2026)
Released under the MIT License.
