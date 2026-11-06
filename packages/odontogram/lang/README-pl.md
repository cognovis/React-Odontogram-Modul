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

## 🇵🇱 Polski

### 📋 Przegląd
Ten projekt to interaktywny edytor odontogramu oparty na przeglądarce, umożliwiający szybkie dokumentowanie statusu stomatologicznego w przejrzystym interfejsie. Renderuje warstwowe szablony SVG zębów w celu reprezentowania uzupełnień, próchnicy, stanu endodontycznego, ruchomości i innych szczegółów klinicznych, oferując wielokrotne zaznaczanie, filtry wyboru i predefiniowane presety statusu. Każda pozycja zęba ma własny rysunek — szesnaście widoków bocznych zębów stałych, dwadzieścia widoków powierzchni żującej oraz uzębienie mleczne — a widok od góry zębów przednich pozwala w ogóle odnotować zmianę podniebienną na siekaczu, której widok boczny nie jest w stanie pokazać.

---
![Odontogram – podgląd (polski)](screenshot_pl_odontogram.png)

🔗 **Test URL:** https://react-odontogram-modul.vercel.app/

---

### 📦 Użycie jako pakiet npm

Odontogram jest dostępny jako samodzielna biblioteka komponentów React na npm:
`@cognovis/react-odontogram`.

#### Wymagania
- **React 18 lub 19** (zadeklarowany jako peer dependency — dostarczany przez Twoją aplikację).
- **Bundler** rozumiejący pole `exports` oraz ESM: Vite, webpack 5, Next.js, Rollup, esbuild, Parcel. Pakiet jest dostępny **wyłącznie jako ESM**.
- Node **≥ 18** do narzędzi deweloperskich.

#### Instalacja

```bash
echo "@cognovis:registry=https://npm.cognovis.de" >> .npmrc
bun add @cognovis/react-odontogram @cognovis/fhir-sdk react react-dom
```

#### Podstawowe użycie

Wyrenderuj `OdontogramShell` i zaimportuj arkusz stylów **raz** w dowolnym miejscu swojej aplikacji:

```tsx
import { OdontogramShell } from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";

export function Chart() {
  return (
    <OdontogramShell
      language="pl"          // hu | en | de | es | it | sk | pl | ru | pt-br | ar | zh | fr
      numberingSystem="FDI"  // FDI | Universal | Palmer
      darkMode={false}
    />
  );
}
```

#### Właściwości (props) komponentu

`OdontogramShell` jest komponentem kontrolowanym. Najczęściej używane propsy:

| Prop | Typ | Domyślnie | Opis |
|------|------|---------|-------------|
| `language` | `Language` | `"hu"` | Język interfejsu (`hu`/`en`/`de`/`es`/`it`/`sk`/`pl`/`ru`/`pt-br`/`ar`/`zh`). |
| `numberingSystem` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` | System numeracji zębów. |
| `darkMode` | `boolean` | `false` | Przełącznik trybu ciemnego. |
| `readOnly` | `boolean` | `false` | Wyłącza całą edycję (tylko podgląd). |
| `themeConfig` | `OdontogramThemeConfig` | — | Nadpisuje zmienne CSS motywu (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | — | Rejestruje niestandardowe wtyczki stanu / dodatkowe warstwy. |
| `enableNotes` | `boolean` | `false` | Włącza notatki dla poszczególnych zębów. |
| `enableIcdas` | `boolean` | `false` | Włącza ocenę próchnicy wg ICDAS II. |
| `onLanguageChange` / `onNumberingChange` / `onDarkModeChange` | `(value) => void` | — | Wywoływane, gdy użytkownik zmienia ustawienie z poziomu interfejsu. |

Akceptowane są także bardziej szczegółowe propsy poziomu detali (`pulpDetailLevel`, `secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`, `wearDetailLevel`, `discolorationDetailLevel`, `surfaceNotation`, `showStatusCard`, `showOrthoCard`) — pełną, otypowaną listę znajdziesz w dołączonych typach `.d.ts`.

#### Publiczne API (eksporty nazwane)

`OdontogramShell` jest zarówno eksportem domyślnym, jak i eksportem nazwanym. Imperatywne API stanu, samodzielny komponent `PerioChart`, prowadzona wycieczka po interfejsie oraz wszystkie publiczne typy są eksportami nazwanymi z tego samego punktu wejścia:

```ts
import {
  OdontogramShell,           // również eksport domyślny
  PerioChart,                // samodzielny komponent karty periodontologicznej
  // odczyt stanu
  getOdontogramSummary,
  getToothStateSummary,
  onStateChange,             // subskrypcja zmian stanu
  // eksport / import
  exportSvg, exportImage,    // eksport wykresu wektorowy / rastrowy
  // sterowanie
  setReadOnly, getReadOnly,
  clearSelection,
  registerPlugins, setPluginState, getPluginState,
  startIntroTour,            // uruchamia wprowadzającą wycieczkę
  // …i wiele innych funkcji ustawień setX/getX
} from "@cognovis/react-odontogram";
```

Pełny zakres API (≈ 44 funkcje + typy takie jak `OdontogramSummary`, `OdontogramThemeConfig`, `OdontogramPlugin`, `PerioViewMode`, …) jest w pełni otypowany w dołączonych deklaracjach.

#### Użycie z Next.js (App Router)

Komponent działa wyłącznie po stronie klienta, dlatego renderuj go w komponencie klienckim:

```tsx
"use client";
import { OdontogramShell } from "@cognovis/react-odontogram";
import "@cognovis/react-odontogram/style.css";

export default function OdontogramClient() {
  return <OdontogramShell language="pl" numberingSystem="FDI" />;
}
```

Ewentualnie załaduj go za pomocą dynamicznego importu tylko po stronie klienta: `dynamic(() => import("./OdontogramClient"), { ssr: false })`.

#### Ważne uwagi i obecne ograniczenia
- **Wyłącznie ESM** — pakiet publikuje główny moduł ES (`dist/odontogram.js`) z odpowiadającymi deklaracjami typów (`dist/index.d.ts`). Jest przeznaczony dla rozwiązywania modułów przez bundler; nie ma builda CommonJS.
- **Arkusz stylów jest oddzielny** — **musisz** zaimportować `@cognovis/react-odontogram/style.css` raz; nie jest on wstrzykiwany automatycznie. Stylowanie to globalny CSS ograniczony do `.odontogram-root` i sterowany zmiennymi CSS `--odon-*`. W nieopublikowanej wersji nie ustawia niczego na `:root`, `html` ani `body`: tło strony, czcionka i własne tokeny hosta pozostają nietknięte; elementy dołączane do `<body>` (przewodnik, wyskakujące okna) mają klasę `.odontogram-portal`.
- **SSR / tylko po stronie klienta** — komponent odczytuje DOM przy montowaniu (`document`), więc musi działać w przeglądarce. W frameworkach SSR renderuj go w komponencie klienckim (`"use client"`) lub poprzez dynamiczny import tylko po stronie klienta.
- **Zasoby są samodzielne** — pliki SVG zębów i ikon są osadzane w pakiecie JavaScript w czasie budowania; **nie ma żadnego pobierania zasobów w czasie działania** do konfigurowania ani niczego dodatkowego do skopiowania do folderu publicznego.
- **Wiele instancji, jeden aktywny edytor** — każda zamontowana `<OdontogramShell>` może utrzymywać własny stan kliniczny poprzez odizolowaną sesję (`createOdontogramSession()`), a dwie sesje nigdy nie współdzielą danych. Interaktywny edytor DOM pozostaje jednym globalnym silnikiem, więc steruje nim dokładnie jedna zamontowana instancja naraz: to ona renderuje wykres, pozostałe renderują nieaktywny znacznik i pozostają w pełni czytelne oraz zapisywalne przez swoje API sesji. Po odmontowaniu aktywnej instancji przejmuje ją oczekująca.

---

### ✨ Kluczowe funkcje
- 🖱️ Szybkie zaznaczanie i wielokrotne zaznaczanie (CMD/CTRL + klik)
- 🦷 Typy zębów: stały, mleczny, implant, poddziąsłowy, brakujący
- 🍼 Uzębienie mleczne ma własną anatomię: osiem wygenerowanych szablonów obejmuje wszystkie dwadzieścia zębów mlecznych z własnymi zmierzonymi proporcjami korzenia, długościami i szerokościami, względnie większą miazgą i korzeniami rozchodzącymi się wokół zawiązka zęba stałego. Zapisanie zęba jako mlecznego osadza jego rysunek w miejscu rysunku następcy. W FHIR ząb jest oznaczany jako **51–85**, ponieważ w FDI sam numer mówi, do którego uzębienia należy; przy imporcie to on rozstrzyga, a nadpisywana jest wyłącznie obecność
- 🦷 Podłoże zęba (niezależne od jakiejkolwiek odbudowy): naturalne, radix (pozostałość korzenia), złamane, przygotowane pod koronę
- 👑 Odbudowy według typu × materiału: korona / wkład (inlay) / nakład (onlay) / licówka / most z e.max, złota, gradii, cyrkonu, metalu, metalowo-ceramicznego, teleskopowego lub tymczasowego (nakład dostępny tylko w widoku okluzyjnym) — wybierane z jednego połączonego, niskoklikowego selektora „Korona – …”; istniejące korony `metal` migrują automatycznie do `metal-ceramic` (metalowo-ceramicznej); implanty korzystają z tego samego modelu typ × materiał, złożonego z warstwą łącznika implantu. Selektor jest zawężany wg rodzaju zęba: implant oferuje tylko koronę/most (plus pięć opcji łącznikowych opisanych poniżej); ząb brakujący/luka oferuje tylko przęsło mostowe (plus protezę ruchomą częściową/całkowitą); podłoże `radix` całkowicie ukrywa kontrolkę odbudowy (na pozostałości korzenia nie można zapisać żadnej odbudowy)
- 🦿 Protetyka ruchoma/na łącznikach na dedykowanej osi `prosthesis` (wpisy „Kivehető:” w połączonym selektorze): śruba gojąca implantu, lokator, lokator z protezą nakładaną, belka, belka z protezą nakładaną; ruchoma proteza częściowa lub całkowita wsparta na zębach
- 🌉 Zęby mostowe renderują zarówno koronę, jak i łącznik siodłowy; nakładka odcinka mostu wielozębowego renderuje jeden ciągły, uwzględniający łuk łącznik przez kolejne zęby mostu (przęsła + filary) oraz przerwy między nimi (górny i dolny łuk używają lustrzanej geometrii siodła, dzięki czemu łącznik pozostaje wyrównany na obu łukach), uwzględniona w eksporcie PNG/JPG/SVG; zastosowanie mostu przez preset Statusów natychmiast przelicza nakładkę na nowo
- 🔍 Dokumentowanie próchnicy na 6 powierzchniach: mezjalnej, dystalnej, policzkowej, językowej, okluzyjnej, podkoronowej
- 🪥 Materiały wypełnień na powierzchnię: amalgamat, kompozyt, GIC, tymczasowe
- 🏥 Jeden połączony selektor „Stan miazgi / endodontyczny” (zgrupowany: żywa miazga vs. leczona/endo) dla wypełnienia leczniczego, pełnego lub niekompletnego oraz osobny selektor materiału wkładu korzeniowego (`rootPostType`: none / glass-fiber / metal): leczenie endodontyczne i diagnoza miazgi wg AAE (`pulpDx`: normalna / odwracalne / nieodwracalne zapalenie miazgi / martwica) wykluczają się wzajemnie, natomiast wkład może współistnieć z każdym stanem wypełnienia kanałowego. Ząb leczony kanałowo (ustawione `endo`) nie może jednocześnie mieć diagnozy żywej miazgi; przy leczeniu `pulpDx` jest normalizowane do wartości `normal`, a symbol chorej miazgi jest ukrywany. Odwracalne zapalenie miazgi renderuje zredukowany symbol miazgi. Opcjonalne 3-poziomowe ustawienie szczegółowości miazgi (`pulpDetailLevel`: proste / AAE / praktyczna łacina) udostępnia 9 praktycznych łacińskich podtypów miazgi (pulpa sana … gangraena pulpae) za pomocą `pulpLatin`; resekcja i wkład parapulpalny pozostają osobnymi wskaźnikami specjalnymi
- 🦴 Diagnoza okołowierzchołkowa (`apicalDx`: objawowe/bezobjawowe zapalenie ozębnej wierzchołkowej, ostry/przewlekły ropień okołowierzchołkowy, osteoskleroza) bezpośrednio determinuje symbol okołowierzchołkowy; kwalifikator podtypu zmiany ziarniniak/torbiel jest pokazywany tylko przy objawowym/bezobjawowym zapaleniu ozębnej wierzchołkowej (zbędny podtyp „ropień” został usunięty — jest już pokryty przez diagnozę okołowierzchołkową)
- 🩹 Połączona karta „Korzeń i przyzębie” (jedna zwijana sekcja dla wyników dotyczących korzenia/okołowierzchołkowych i przyzębia)
- ⚕️ Modyfikacje: zapalenie okołowierzchołkowe (widoczne tylko przy zębach brakujących/w zębodole poekstrakcyjnym; ukryte przy zębach obecnych, gdzie symbol okołowierzchołkowy determinuje wyłącznie `apicalDx`, oraz przy implantach, gdzie pokrywa to `periImplant`), choroba przyzębia, stopnie ruchomości (M1/M2/M3, ukryte przy implantach)
- 🦷🔩 Stan okołowszczepowy (`periImplant`: `none` / `mucositis` / `peri-implantitis-mild` / `peri-implantitis-moderate` / `peri-implantitis-severe`) — klasyfikacja wg World Workshop 2018, pokazywana jako dedykowany selektor przy implantach; zapalenie śluzówki wykorzystuje symbol dziąsła przyzębnego, zapalenie tkanek okołowszczepowych dodaje stopniowaną warstwę `peri-implant-bone-loss` (nieprzezroczystość 0,4/0,7/1,0). Implanty nie renderują już symbolu zmiany okołowierzchołkowej — ich stan zapalny jest teraz wyrażany przez tę oś — a pola wyboru modyfikatorów przyzębnych są ukryte przy implantach (doraźne przeetykietowanie pola wyboru „Zapalenie tkanek okołowszczepowych” zostało wycofane)
- 🏷️ Wskaźniki specjalne: korona wymagana, wymiana korony konieczna, zamknięta luka, plan ekstrakcji, lakowanie bruzd, utrata punktu stycznego
- 👁️ Przełączniki widoku okluzyjnego, zębów mądrości, widoczności kości i miazgi
- 🔢 12 filtrów wyboru (wszystkie, obecne, stałe, mleczne, implanty, brakujące, górne/dolne, przednie/trzonowe)
- 📊 Predefiniowane presety statusu (reset, uzębienie mleczne, uzębienie mieszane, bezzębny)
- 📦 34 predefiniowane szablony uzupełnień (mosty, protezy ruchome, protezy na belce z implantami)
- 💾 Eksport/import statusu w formacie JSON (wersja 2.20; import nadal akceptuje starsze wersje 1.4 oraz 2.0 do 2.19 i migruje je automatycznie, wraz z niestandardowymi stanami wtyczek i notatkami do zębów)
- 🧭 **Ortodoncja jest trzecim widokiem klinicznym** (`odontogram-c51`): przełącznik `Odontogram | Stan przyzębia | Ortodoncja` (`#appViewToggle`) mieści poniższą kartę analizy modeli. Odontogram nigdy nie jest odmontowywany, tylko ukrywany, więc zmiana widoku nie może zaburzyć zapisu. Widok ortodontyczny nie ma własnego okna, dlatego pozostaje segmentem przełącznika także tam, gdzie stan przyzębia skonfigurowano jako okno wyskakujące — znika wtedy tylko jego segment.
- 📐 **Analiza modeli** (`odontogram-c51.1`): Tonn i Bolton z szerokości mezjodystalnych, z docelową sumą siekaczy, rozbieżnością szerokości zębów i wskazaniem, który łuk niesie nadmiar. Szerokości wprowadza się na łuku lub jako listę — dwa widoki jednego rekordu. Ząb nieobecny na modelu (niewyrznięty, utracony, pod dziąsłem) przejmuje szerokość zęba przeciwstronnego, widocznie oznaczoną jako założenie. Do tego nagryz poziomy i pionowy oraz odchylenie linii pośrodkowej dla każdego łuku
- 🔗 Aidbox Dental Core przez `@cognovis/fhir-sdk`: host wstrzykuje gateway; sesja wczytuje i zapisuje. Eksport/import JSON stanu z migracjami
- ✚ Interfejs wyboru powierzchni w układzie krzyżowym (B/M/O/D/L) dla próchnicy i wypełnień
- 🧱 Materiały wypełnień na powierzchnię (mieszane wypełnienia, np. policzkowe amalgamat + dystalne kompozyt)
- 🖼️ Eksport obrazu PNG/JPG/SVG wykresu (do pobrania; PNG/JPG rastrowane z wektorowego SVG)
- 🦷 Próchnica/próchnica wtórna jako maszyna stanów per powierzchnia: spróchniała powierzchnia bez wypełnienia jest renderowana jako próchnica pierwotna (nieprzezroczystość warstwowana wg ICDAS); gdy tylko ta powierzchnia ma wypełnienie, jest renderowana zamiast tego jako próchnica wtórna (nawracająca) (warstwa `subcaries-{surface}`, punktowana wg CARS) — obie nigdy nie są aktywne jednocześnie na tej samej powierzchni
- 🎯 Ujednolicona wartość ciężkości na powierzchnię (`cariesSeverity`, 0–6, zastępująca dawne osobne pola głębokości ICDAS i CARS): odczytywana jako głębokość ICDAS na powierzchni pierwotnej, jako nazwany wynik CARS (Zdrowy … Rozległy ubytek) na powierzchni wtórnej, poprzez kontekstowy popup pokazujący tylko skalę odpowiednią dla aktualnego stanu powierzchni
- 🌱 Próchnica korzenia (`rootCaries`: `none` / `active` / `arrested` / `active-cavitated`), uruchamiająca dedykowaną warstwę grafiki próchnicy korzenia z nieprzezroczystością zależną od ciężkości (active 0,5 / arrested 0,7 / active-cavitated pełna nieprzezroczystość)
- 🎚️ Trzy ustawienia szczegółowości próchnicy (`secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`) oraz przełącznik `cariesDepthEnabled`, zwijające każdą skalę do prostszego widoku wyboru bez utraty zapisanej wartości
- 🩹 Wiersz podsumowania próchnicy wtórnej w panelu wypełnień: pod kontrolkami wypełnień wymienia każdy wybrany ząb z próchnicą wtórną i jego powierzchnie (np. „36 (O) ma próchnicę wtórną przy wypełnieniu.”)
- 🪛 Wady wypełnienia na powierzchnię (`fillingDefect`: `none` / `marginal` / `fracture` / `wear`) w bezpośrednich odbudowach, niezależne od próchnicy wtórnej — dokumentowane za pomocą wskaźnika na powierzchnię na karcie Wypełnień (analogicznie do wskaźnika głębokości próchnicy, z listą opcji ułożoną pionowo), renderowane na wykresie oraz pokazywane w etykietce i w podsumowaniu wypełnień całej jamy ustnej z jawną etykietą (np. „36 (O) – Wada wypełnienia: O: brzeżna”), w ten sam sposób, w jaki próchnica wtórna jest opisywana w wierszu Próchnicy; karta Wypełnień pokazuje też notatkę pomocniczą dla każdego wybranego zęba z odnotowaną wadą wypełnienia (np. „36 ma odnotowaną wadę wypełnienia.”), analogicznie do istniejącej notatki pomocniczej dot. próchnicy wtórnej
- 🔗 Elementy retencyjne utrzymujące protezę ruchomą na zębie własnym (`retention`, `retentionSide`) — trzy zakotwiczenia, nie jedna oś: **klamra** wymaga tylko obecnego zęba, **zasuwa** i **filar belki** wymagają korony. JEDNA wartość na ząb, nigdy zbiór. Klamra jest RYSOWANA jako ramię ćwierćłuku na koronie (brzuchem ku dziąsłu, odbite lustrzanie dla każdego łuku); zasuwa i belka noszą oznaczenia charly `( G )` i `ste`. **Rozpiętość belki jest wyprowadzana**, nigdy zapisywana, a jedna belka może wspierać się jednocześnie na filarach implantologicznych i własnych
- 🎨 **Kolory odbudów są wybieralne** (Ustawienia → Kolory). Każde wypełnienie to zmienna CSS z fabrycznym kolorem jako wartością zapasową; e.max i metal-ceramika malują z dziewięciostopniowej rampy, a wybór zachowuje jej przebieg jasności. Ustawienie gabinetu, nie część dokumentu.
- 🔩 **Pusty produkt implantu jest luką tylko tam, gdzie gabinet wszczepił implant** (`isImplantProductGap`) — ten, z którym pacjent przyszedł, to komplet. Wyprowadzane z badania wstępnego, nigdy zapisywane.
- 🦷🔻 Zajęcie przyszyjkowe wypełnienia lub zmiany próchnicowej (`cervicalSurfaces`: zbiór nad powierzchnią przedsionkową i jamową) — okolica przyszyjkowa **nie jest** szóstą powierzchnią, lecz oznaczeniem na istniejącej (BEMA zapisuje je jako przyrostek „vz"/„lz"), więc nigdy nie zmienia liczby powierzchni, którą odczytuje stopień pozycji (`getFillingSurfaceCount()`); dokumentowane w tym samym okienku powierzchni, które otwierają krzyż próchnicy i krzyż wypełnień, oznaczone na komórce powierzchni literą przyrostka i pokazywane w etykietce oraz w wierszu wyniku, który uściśla, w podsumowaniu całej jamy ustnej. Celowo nierysowane na wykresie — widok boczny nie ma żadnej warstwy językowej
- 🦷💥 Starcie zęba typowane wg przyczyny klinicznej i lokalizacji (`wearEdge`: `none` / `attrition` / `erosion`, sieczne/okluzyjne; `wearCervical`: `none` / `abrasion` / `abfraction` / `erosion`, szyjkowe) — zastępujące dwie dawne flagi włącz/wyłącz starcia bruksistycznego; dokumentowane za pomocą dwóch list rozwijanych w wierszu starcia, wykorzystuje istniejącą grafikę starcia i jest pokazywane w etykietce oraz w nowej sekcji podsumowania „Starcie” dla całej jamy ustnej
- 🎨 Przebarwienie zęba wg przyczyny (`discoloration`: `none` / `tetracycline` / `fluorosis` / `nonvital` / `extrinsic` / `other`) na zębach stałych i mlecznych — zabarwia widoczną naturalną koronę reprezentatywnym kolorem, gdy ząb nie ma odbudowy i ma naturalne podłoże; pokazywane w etykietce oraz w nowej sekcji podsumowania „Przebarwienie” dla całej jamy ustnej; uzupełnia zestaw stanów powierzchniowych i strukturalnych obok wad wypełnienia i starcia
- ✏️ Zęby przednie (siekacze/kły) etykietują swoją powierzchnię żującą jako „sieczną” w całym interfejsie (selektor, popup, podsumowania); przechowywany klucz powierzchni pozostaje `occlusal`
- 🔤 Notacja powierzchni zależna od pozycji zęba (Ustawienia → Szczegóły zęba → „Notacja powierzchni”, prosta/pełna, domyślnie pełna): w trybie pełnym litera i etykieta powierzchni próchnicy/wypełnienia podążają za anatomią zęba — okluzyjna → I/sieczna na zębach przednich, policzkowa → L/wargowa na zębach przednich, językowa → P/podniebienna na zębach górnych i L/językowa na zębach dolnych (mezjalna/dystalna/podkoronowa są niezmienione); tryb prosty zawsze używa ogólnego zestawu B/M/O/D/L/SC niezależnie od pozycji zęba. Dotyczy podsumowania całej jamy ustnej oraz obu selektorów powierzchni (próchnicy i wady wypełnienia) (litera + podpis); przechowywany klucz powierzchni pozostaje bez zmian
- 🦷↕️ Dokumentowanie ortodontyczne na ząb (`orthoAppliance`: `none` / `bracket` / `band`; `orthoDrift`: `none` / `mesial` / `distal`; `orthoVertical`: `none` / `extrusion` / `intrusion`; `orthoRotation`: wartość logiczna) na obecnym, naturalnym zębie (stałym lub mlecznym) — wykorzystuje uśpioną grafikę ortodontyczną z wersji 2.5.0 (bez nowego SVG); pokazywane na wykresie, w etykietce oraz w nowej sekcji podsumowania „Ortodoncja” dla całej jamy ustnej
- 🪨 Kamień nazębny oraz resorpcja korzenia typowana jako wewnętrzna lub zewnętrzna szyjkowa (`resorptionType`)
- 📏 Głębokość próchnicy na powierzchnię (powierzchowna / zębina / głęboka), lub opcjonalne punktowanie ICDAS II (0–6) za pomocą `enableIcdas`
- 🩹 Przełącznik nieszczelności brzeżnej korony, widoczny tylko przy odbudowie koronowej lub mostowej
- 🧰 Ujednolicony wiersz ikon paska górnego z zakładkowym oknem modalnym Ustawień (Ogólne / Panele / Szczegóły zęba / Próchnica / Miazga / Notatki / Periodontologia — numeracja, notatki, widoczność paneli, ICDAS, przełącznik głębokości próchnicy, szczegółowość próchnicy korzenia/radiologicznej, poziom szczegółowości miazgi, poziom szczegółowości starcia/przebarwienia zęba, informacje o zębach)
- 🗂️ Zakładka Ustawienia → „Panele”: niezależne pokazywanie/ukrywanie paneli podsumowania Statusów i Ortodoncji dla całej jamy ustnej
- 🦷🩺 Zakładka Ustawienia → „Periodontologia”: 16 przełączników pokazywania/ukrywania na indeks dla wierszy odontogramu periodontalnego (zgrupowanych: kieszonka/higiena/śluzówkowo-dziąsłowe/podparcie/okołowszczepowe — PD/GM/CAL/BOP, płytka, PI, GI, widoczność CEJ, konkawność korzenia, KG, GT, furkacja, ruchomość, klasa Millera, mPI, mBI), każdy z własnym opisem, oraz opcja wyświetlania nazw indeksów przetłumaczonych vs. kanonicznych (kanoniczna = stała naukowa nazwa angielska/łacińska w każdym języku interfejsu; etykietki zawsze pozostają zlokalizowane niezależnie od tego ustawienia). Oba są preferencjami na poziomie aplikacji (jak `perioViewMode`) — nigdy nie stanowią części ładunku eksportu
- 🩹 Kontrolka ustawień próchnicy wtórnej (CARS) połączona z zakładką ustawień Próchnicy, umieszczona nad Głębokością radiologiczną (osobna zakładka „Próchnica wtórna” została wycofana)
- 🎚️ Poziom szczegółowości szczegółów zęba (Ustawienia → Szczegóły zęba): ustawienie prosty/złożony dla starcia zęba i dla przebarwienia. Tryb prosty pokazuje przełącznik tak/nie dla każdego wyniku (starcie włączone → atrycja/abrazja, przebarwienie włączone → inne); tryb złożony (domyślny) zachowuje listy rozwijane typu/przyczyny, a zapisana wartość jest zachowywana przy przełączaniu poziomów
- 📋 Panel informacji o zębach: na żywo tekstowe podsumowanie całego wykresu (liczba zębów, listy obecnych/brakujących, próchnica w tym wtórna, wypełnienia, kanały korzeniowe, protetyka, implanty, stan przyzębia) — wyświetlany domyślnie, przełączany w Ustawieniach
- 🗂️ Skonsolidowane menu Eksportu (Status JSON / PNG / JPG)
- 📥 Menu Importu z importem FHIR (zwrotne wczytywanie wyeksportowanych Bundli)
- ⏳ Nakładka postępu podczas eksportu obrazu
- 🎓 12-krokowy interaktywny samouczek wprowadzający
- 🔢 Trzy systemy numeracji (FDI, Universal, Palmer)
- 🌐 I18n (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) z przełącznikiem języka (190+ kluczy tłumaczeń na język)
- 🌗 Obsługa trybu ciemnego z przyciskiem przełączania (samodzielny lub kontrolowany przez aplikację nadrzędną)
- 🎨 Konfiguracja niestandardowego motywu (właściwość `themeConfig`) z właściwościami niestandardowymi CSS (`--odon-*`)
- 📱 Mobilny interfejs dotykowy: wyskakujące okno powiększenia przy dotknięciu, menu kontekstowe przy długim przytrzymaniu, powiększanie szczypnięciem, cele dotykowe WCAG 44px, nawigacja po łukach
- 🔌 Niestandardowy system wtyczek SVG: wstrzykiwanie nakładek wizualnych, niestandardowy stan na ząb, obsługa eksportu/importu JSON
- ⚠️ Ostrzeżenia walidacyjne stanu dla niezgodnych kombinacji stanów zębów
- 🏷️ Automatyczna etykietka stanu na kafelkach zębów (pokazuje wszystkie aktywne stany)
- 🩺 Zmodernizowana etykietka na ząb i panel podsumowania całej jamy ustnej: oba prezentują pełny zestaw wyników klinicznych (diagnoza miazgi/okołowierzchołkowa + podtyp zmiany, resorpcja korzenia, stan okołowszczepowy, stopniowana próchnica korzenia, kamień nazębny, nieszczelność brzeżna korony, złamanie, utrata punktu stycznego, typowane starcie sieczne/szyjkowe), z dedykowaną sekcją „Diagnozy” w panelu, dedykowaną sekcją „Starcie” oraz ogólnym kwalifikatorem ciężkości próchnicy (powierzchowna/umiarkowana/głęboka)
- ♿ Dostępność klawiaturowa (WCAG): role ARIA listbox/option, wybór Enter/Spacja, nawigacja strzałkami, kontury focus-visible
- 🔒 Tryb tylko do odczytu: wyłączenie wszystkich interakcji do drukowania/raportowania/przeglądania
- ✨ Animacje zaznaczenia: pulsująca przerywana ramka i świecący cień na zaznaczonych zębach (z obsługą prefers-reduced-motion)
- 📝 Notatki do zębów: dwuklik, aby dodać/edytować notatki, ikona notatki obok numeru zęba, etykietka po najechaniu z tekstem notatki, wiersz „Notatki indywidualne” w panelu podsumowania całej jamy ustnej, eksport/import JSON
- 🔀 Podział odontogramu Status ↔ Plan: przełącznik `Status | Plan` w nagłówku wykresu przełącza między wykresem bieżącego **statusu** a wykresem **planu** (zamierzonego leczenia), każdy z własnymi stanami zębów; wykres planu przy pierwszym przełączeniu startuje jako kopia statusu, a edycje w jednym wykresie nigdy nie wpływają na drugi. Eksport/import (`exportStatus`/import pliku) zawsze dotyczą wykresu statusu; wykres planu jest odczytywany/zapisywany osobno za pomocą własnego API (zob. Publiczne API poniżej) i — gdy różni się od statusu — jest dołączany jako dodatkowa sekcja `plan` w eksporcie JSON
- 📝 Panel „Co się zmienia”: gdy plan różni się od bieżącego statusu, panel pod panelem informacji o zębach wymienia każdą różnicę na ząb i oś leczenia (obecność, podłoże, odbudowa, protetyka, planowana korona, ortodoncja, miazga/endo, okołowierzchołkowe) jako wiersz `ząb: oś  z → na`; dostępne również programowo za pomocą `getPlanChanges()`

![Wykres periodontologiczny całej jamy ustnej (polski)](screenshot_pl_perio.png)

- 🅿️ Stylizacja propozycji: w trybie Plan wyniki, które plan **dodaje** względem bieżącego statusu (planowana korona, ekstrakcja, ruch ortodontyczny, protetyka, …) są renderowane z wyraźnym **przerywanym, zabarwionym konturem „propozycji”**, dzięki czemu plan czyta się jako zamiar, a nie fakt — z legendą „przerywana linia = propozycja” na karcie wykresu. Renderowanie w trybie Status jest identyczne co do bajtu; leczenie dotyczy wyłącznie planu i jest w pełni resetowane przy powrocie do statusu
- 🚦 Blokowanie trybu Plan: wykres Planu pokazuje tylko to, co dentysta może *zrobić* — podstawowy selektor oferuje wyłącznie Brak / Stały / Implant, a wyniki dotyczące wyłącznie statusu (próchnica, starcie zęba, przebarwienie oraz cały blok periodontologiczny — ruchomość, sześciopunktowa siatka sondowania, modyfikatory zapalenia/przyzębia, kamień nazębny, stan okołowszczepowy) są ukryte; kontrolka miazgi/endo zachowuje endodontyczne **leczenie** (leczenie kanałowe / wkład / resekcja endodontyczna / wkład parapulpalny), ukrywając jednocześnie **diagnozę** miazgi/okołowierzchołkową oraz resorpcję korzenia. Odbudowa, protetyka, ortodoncja, potrzeba/wymiana korony oraz plan ekstrakcji pozostają możliwe do zaplanowania
- 🧪 1746 testów automatycznych zaliczonych (1 dodatkowy test pominięty) (Vitest) w 164 plikach testowych (165 łącznie) obejmujących numerację, tłumaczenia, presety, i18n, komponent App, motyw, dotyk, wtyczki, dostępność oraz parytet osi klinicznych/diagnostycznych
- 📖 Dokumentacja API TypeDoc z komentarzami JSDoc dla wszystkich publicznych eksportów (`bun run docs`)

### 📦 Moduły
- 🦷 Siatka odontogramu i interfejs kafelków zębów
- 🎛️ Panel sterowania i statusu
- 🎨 Silnik warstwowania SVG i szablony
- 🔢 Numeracja zębów i mapowanie etykiet (FDI/Universal/Palmer)
- 🌐 Lokalizacja (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- 💾 Eksport/import statusu
- 📋 Dodatki statusu: predefiniowane szablony uzupełnień
- 🎨 Konfiguracja motywu: konfigurowalna paleta kolorów za pomocą właściwości CSS `--odon-*`
- 📱 Mobilne interakcje dotykowe (powiększenie przy dotknięciu, długie przytrzymanie, powiększanie szczypnięciem, przełącznik łuku)
- 🔌 Niestandardowy system wtyczek SVG
- ⚠️ System walidacji stanu i etykietek
- ♿ Dostępność klawiaturowa i obsługa ARIA
- 🔒 Tryb tylko do odczytu
- ✨ Animacje zaznaczenia
- 📝 System notatek do zębów
- 🧪 Zautomatyzowany zestaw testów (Vitest + Testing Library)

### 🛠️ Kontrolki interfejsu

**🔝 Pasek górny:**
- Przełącznik języka (lista rozwijana HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- Przycisk przełączania trybu ciemnego (ikona słońca/księżyca, przełącza między jasnym i ciemnym motywem)
- Przełącznik systemu numeracji (lista rozwijana FDI/Universal/Palmer)
- Przyciski Eksportuj status / Importuj status

**📊 Nagłówek wykresu:**
- Przełącznik widoku okluzyjnego
- Przełącznik widoczności zębów mądrości
- Przełącznik widoczności kości
- Przełącznik widoczności miazgi
- Przycisk wyczyść zaznaczenie

**🔍 Filtry wyboru:**
- Zaznacz wszystkie / Wszystkie obecne / Stałe / Mleczne / Implanty / Wszystkie brakujące
- Zaznacz górne / Górne 6 przednich / Trzonowce górne
- Zaznacz dolne / Dolne 6 przednich / Trzonowce dolne

**📋 Presety statusu:**
- Resetuj wszystko (resetuj jamę ustną)
- Uzębienie mleczne
- Uzębienie mieszane
- Przełącznik bezzębności

**📦 Lista rozwijana Dodatki statusu:**
- Górne/dolne mosty cyrkonowe (12-22, 13-23, 16-26, pełny łuk)
- Górne/dolne mosty metalowe (12-22, 13-23, 16-26, pełny łuk)
- Górne/dolne częściowe protezy ruchome
- Górne/dolne całkowite protezy ruchome
- Górne/dolne protezy na belce z implantami

**🦷 Panel edycji zęba** (dla wybranego zęba/zębów, pogrupowany w zwijane karty):
- **Wiersz podstawowy:** wybór zęba (typ podstawowy z wariantami złamanej korony) i podłoże zęba (naturalne/radix/złamane/crownprep)
- **Wiersz odbudowy:** połączona lista rozwijana odbudowy pogrupowane wg rodzaju (Korona / Most / Inlay / Onlay / Licówka / „Kivehető:”), gdzie każdy wiersz sam nazywa swój rodzaj i materiał (stałe opcje `restorationType`×`restorationMaterial` plus opcje łącznikowe/ruchome `prosthesis`, zawężane wg rodzaju zęba); pole wyboru nieszczelności brzeżnej korony (tylko korona/most); pola wyboru lokalizacji złamanej korony; przełączniki korona wymagana / wymiana korony konieczna
- **Wiersz starcia i przebarwienia:** lista rozwijana typu starcia siecznego/okluzyjnego, lista rozwijana typu starcia szyjkowego, lista rozwijana przyczyny przebarwienia (każda zamienia się na prosty przełącznik tak/nie w trybie Ustawienia → Szczegóły zęba → tryb prosty)
- **Karta Ortodoncja:** aparat, przemieszczenie mezjalne/dystalne, ruch pionowy (ekstruzja/intruzja), przełącznik rotacji — pokazywana przy obecnym, naturalnym zębie
- **Karta Próchnica:** lista rozwijana trybu głębokości próchnicy, pole wyboru próchnicy podkoronowej, lista rozwijana ciężkości próchnicy korzenia oraz selektor powierzchni próchnicy B/M/O/D/L z kontekstowym popupem ICDAS-głębokość/CARS i odznaką głębokości radiologicznej
- **Karta Wypełnienia:** lista rozwijana materiału wypełnienia, selektor wypełnień na powierzchnię (z materiałem na powierzchnię), wskaźnik wady wypełnienia na powierzchnię (brzeżna/złamanie/starcie), notatki pomocnicze dot. próchnicy wtórnej i wady wypełnienia
- **Karta Korzeń i przyzębie:** połączony selektor „Stan miazgi / endodontyczny”, selektor diagnozy okołowierzchołkowej, selektor podtypu zmiany okołowierzchołkowej (tylko objawowe/bezobjawowe zapalenie ozębnej wierzchołkowej), selektor typu resorpcji korzenia, selektor stopnia ruchomości, selektor stanu okołowszczepowego (tylko implanty)
- **Wskaźniki specjalne:** plan ekstrakcji/rana, luka zamknięta, lakowanie bruzd, utrata punktu stycznego, kamień nazębny, wkład parapulpalny, resekcja endodontyczna, filar mostu

### ⌨️ Wprowadzanie badania skrótami

Badanie zapisuje się w sekundach, często z dyktowania. Przy 46 osiach i 129 wartościach to liczba
kliknięć jest wąskim gardłem, dlatego diagram można wypełnić tak, jak i tak się pisze
(`odontogram-t8y`):

```
zaznacz 13–23     przeciągnięcie po zębach, Shift + strzałka lub Shift + klik
E                 tryb materiału: ceramika — pozostaje ustawiony
k                 sześć koron, jedno naciśnięcie
```

**Materiał stoi przed badaniem i pozostaje ustawiony**, jako tryb, nie jako dodatek. Jeden klawisz
materiału ma dwa odczyty, bo wypełnienie i uzupełnienie czerpią z różnych zbiorów wartości: `K mo`
to wypełnienie kompozytowe na dwóch powierzchniach, `K k` korona z Gradii. Gdzie odczytu nie ma,
nie jest wymyślany.

**Tabulator przechodzi do następnego zęba**, Shift+tabulator wstecz, od 18 i dookoła jamy ustnej
(18–28, potem 38–48), z zawinięciem. Przesuwa zaznaczenie, nie tylko fokus, więc ząb, na którym
się stoi, jest wyróżniony. Strzałki pozostają bez zmian.

```
G k    Tab    b          korona złota, potem przęsło na sąsiednim zębie
A  mod Tab               jedno wypełnienie amalgamatowe na trzech powierzchniach
c mod K3                 próchnica na trzech powierzchniach, ze stopniem
```

Odwzorowanie mieszka w `src/shorthand.ts`, bez DOM i niezależnie od silnika, ponieważ ten sam zbiór
rozpoznań musi być osiągalny trzema drogami: z klawiatury, z zapytania FHIR do systemu
gabinetowego i głosem.

Skrót jest przepisany z klawiatury badania programu *charly* (solutio), nie wymyślony.

Odcinek podąża za **łukiem**, nie za geometrią (`odontogram-apn`): przez linię pośrodkową (13 do
23) tak, przez szczękę nigdy.

### 🦷 Typy zębów i stany

**Wybór zęba (typ podstawowy):**
| Wartość | Opis |
|---|---|
| `none` | Ząb brakujący |
| `tooth-base` | Ząb stały |
| `milktooth` | Ząb mleczny (mleczak) |
| `implant` | Implant stomatologiczny |
| `tooth-under-gum` | Ząb poddziąsłowy (niewyrznienty) |

**Warianty zęba złamanego:**
`tooth-broken-inicisal`, `tooth-broken-distal-inicisal`, `tooth-broken-distal`, `tooth-broken-mesial-distal-inicisal`, `tooth-broken-mesial-distal`, `tooth-broken-mesial-inicisal`, `tooth-broken-mesial`, `no-tooth-after-extraction`

**Podłoże zęba (zęby stałe):**
`natural` (domyślne), `radix` (pozostałość korzenia), `broken`, `crownprep` (przygotowany pod koronę)

**Typ odbudowy (zęby stałe):**
`none`, `crown`, `inlay`, `onlay` (tylko widok okluzyjny), `veneer`, `bridge`

**Materiał odbudowy (zęby stałe):**
`none`, `emax`, `gold`, `gradia`, `zircon`, `metal`, `metal-ceramic` (istniejące korony `metal` migrują tutaj), `telescope`, `temporary`

**Opcje odbudowy są zawężane wg rodzaju zęba** (`restorationOptions()` w `src/registry/restorations.ts`): implant oferuje tylko typy odbudowy `crown`/`bridge` (złożone z warstwą łącznika implantu) plus pięć poniższych wpisów łącznikowych `prosthesis`; ząb brakujący/luka oferuje tylko przęsło `bridge` plus dwa wpisy protez ruchomych `prosthesis`; podłoże `radix` całkowicie ukrywa kontrolkę odbudowy. Dawne płaskie pola `crownMaterial`/`bridgeUnit` (wartości łączników implantu/mostu sprzed v1.14) zostały wycofane z aktywnego modelu — są akceptowane wyłącznie jako tylko-do-odczytu ścieżka migracji dla starych danych.

**Protetyka ruchoma** (`prosthesis`; niezależna oś ruchoma/łącznikowa, prezentowana jako wpisy „Kivehető:” w połączonej liście rozwijanej odbudowy):
`none`, `healing-abutment`, `locator`, `locator-denture`, `bar`, `bar-denture` (łączniki implantu, z protezą nakładaną lub bez), `removable-partial`, `removable-full` (protezy wsparte na zębach przy zębie brakującym/luce). Ząb ma albo stałą odbudowę, albo protezę ruchomą, nigdy jedno i drugie jednocześnie — ustawienie jednej opcji czyści drugą.

**Nieszczelność brzeżna korony** (`crownLeakage`; wartość logiczna): pokazywana tylko gdy `restorationType` to `crown` lub `bridge`; aktywuje warstwę grafiki `crown-leakage`.

**Opcje endodontyczne (zęby stałe):**
`none`, `endo-medical-filling`, `endo-filling`, `endo-filling-incomplete`

**Materiał wkładu korzeniowego (zęby stałe, niezależnie od `endo`):**
`none`, `glass-fiber`, `metal`

**Opcje endodontyczne (zęby mleczne):**
`none`, `endo-medical-filling`

`endo` i `pulpDx` są prezentowane przez jeden połączony `<select>` „Stan miazgi / endodontyczny” (zgrupowany: żywa miazga vs. leczona/endo) i wykluczają się wzajemnie — wybór opcji leczonej (`endo != none`) resetuje `pulpDx` do `normal`, a wybór diagnozy miazgi resetuje `endo` do `none`.

**Materiały wypełnień (zęby stałe):**
`amalgam`, `composite`, `gic`, `temporary`

**Materiały wypełnień (zęby mleczne):**
`composite`, `gic`, `temporary`

**Powierzchnie wypełnienia/próchnicy:**
`mesial`, `distal`, `buccal`, `lingual`, `occlusal`, `subcrown` (tylko próchnica)

**Modyfikacje:**
`inflammation` (okołowierzchołkowe), `parodontal` (przyzębia), `mobility` (M1/M2/M3)

**Typ zmiany okołowierzchołkowej** (`periapicalType`; kwalifikuje symbol okołowierzchołkowy, pokazywany tylko przy objawowym/bezobjawowym zapaleniu ozębnej wierzchołkowej):
`none`, `granuloma`, `cyst` — opcje dostępne do wyboru; dawna wartość `abscess` jest nadal akceptowana/przechowywana, ale nie jest już oferowana w selektorze, ponieważ dubluje diagnozę okołowierzchołkową. Przy imporcie jest usuwana: włączana do `apicalDx`, gdy ząb ma modyfikator zapalenia, w przeciwnym razie czyszczona do `none`

**Diagnoza miazgi** (terminologia AAE; `pulpDx`):
`normal`, `reversible-pulpitis` (renderuje zredukowany symbol miazgi), `irreversible-pulpitis`, `necrosis` — wyklucza się wzajemnie z `endo`; normalizowana do `normal` przy zębie leczonym kanałowo

**Diagnoza miazgi, praktyczna łacina** (`pulpLatin`; selektor miazgi pokazuje ją tylko wtedy, gdy `pulpDetailLevel` ma wartość `latin`):
`none`, `pulpa-sana`, `hyperaemia-pulpae`, `pulpitis-acuta-serosa`, `pulpitis-acuta-purulenta`, `pulpitis-chronica-clausa`, `pulpitis-chronica-ulcerosa`, `pulpitis-chronica-hyperplastica`, `necrosis-pulpae`, `gangraena-pulpae`

**Poziom szczegółowości miazgi** (`pulpDetailLevel`, ustawienie globalne): `simple`, `aae` (domyślne), `latin` — kontroluje słownictwo oferowane przez selektor miazgi

**Diagnoza okołowierzchołkowa** (`apicalDx`; determinuje symbol okołowierzchołkowy):
`normal`, `symptomatic-apical-periodontitis`, `asymptomatic-apical-periodontitis`, `acute-apical-abscess`, `chronic-apical-abscess`, `condensing-osteitis`

**Typ resorpcji korzenia** (`resorptionType`):
`none`, `internal`, `external-cervical`

**Stan okołowszczepowy** (`periImplant`; tylko przy implantach, klasyfikacja World Workshop 2018): `mucositis` wykorzystuje symbol dziąsła przyzębnego; `peri-implantitis-*` dodaje warstwę `peri-implant-bone-loss` przy nieprzezroczystości skalowanej wg ciężkości (łagodne 0,4 / umiarkowane 0,7 / ciężkie 1,0). Implanty nie renderują już symbolu zmiany okołowierzchołkowej (ich stan zapalny jest teraz wyrażany za pomocą tej osi), a pola wyboru `mods` zapalenie/przyzębie są ukryte przy implantach:
`none`, `mucositis`, `peri-implantitis-mild`, `peri-implantitis-moderate`, `peri-implantitis-severe`

**Ciężkość próchnicy** (`cariesSeverity`; ujednolicone pole na powierzchnię, `0`–`6`): na powierzchni bez wypełnienia jest odczytywana jako skala głębokości ICDAS (`superficial` / `dentin` / `deep`, lub surowe kody ICDAS II `0–6` przy włączonym `enableIcdas`) i renderuje warstwę pierwotną `caries-{surface}`; na powierzchni z wypełnieniem jest odczytywana jako nazwany wynik CARS (`0` zdrowa … `6` rozległy ubytek) i renderuje zamiast tego warstwę `subcaries-{surface}` (próchnica wtórna) — powierzchnia nigdy nie jest jednocześnie pierwotna i wtórna

**Próchnica korzenia** (`rootCaries`; uruchamia warstwę grafiki `caries-root` na obecnym zębie, z nieprzezroczystością zależną od ciężkości — `active` 0,5 / `arrested` 0,7 / `active-cavitated` pełna nieprzezroczystość):
`none`, `active`, `arrested`, `active-cavitated`

**Radiologiczna głębokość próchnicy** (`radiographicDepth`; na powierzchnię, niezależna od wizualnej skali ICDAS/CARS `cariesSeverity`):
`none`, `E1`, `E2`, `D1`, `D2`, `D3`

**Ustawienia szczegółowości próchnicy** (globalne): `secondaryCariesMode` (`simple`/`standard`/`full`, domyślnie `standard`), `rootCariesMode` (`simple`/`severity`, domyślnie `simple`), `radiographicDepthMode` (`off`/`threeLevel`/`detailed`, domyślnie `off`), `cariesDepthEnabled` (wartość logiczna, domyślnie `true`) — każde z nich zwija odpowiednią skalę do prostszego widoku wyboru bez zmiany zapisanej wartości

**Wskaźniki specjalne:**
`crownNeeded`, `crownReplace`, `missingClosed`, `extractionPlan`, `extractionWound`, `bridgePillar`, `fissureSealing`, `contactMesial`, `contactDistal`, `endoResection`, `calculus`, `parapulpalPin`

**Starcie zęba** (`wearEdge`, `wearCervical`; typ kliniczny wg lokalizacji, uwarunkowane obecnością zęba podstawowego + brakiem odbudowy + naturalnym podłożem; renderuje istniejące warstwy `tooth-bruxism-wear`/`tooth-bruxism-neck-wear`):
`wearEdge`: `none`, `attrition`, `erosion` — `wearCervical`: `none`, `abrasion`, `abfraction`, `erosion`

**Przebarwienie** (`discoloration`; przyczyna na ząb, uwarunkowane naturalnym zębem stałym lub mlecznym + brakiem odbudowy + naturalnym podłożem; zabarwia wypełnienie widocznej naturalnej korony — bez nowego SVG):
`none`, `tetracycline`, `fluorosis`, `nonvital`, `extrinsic`, `other`

**Wada wypełnienia** (`fillingDefect`; na powierzchnię, wynik dotyczący bezpośredniej odbudowy, niezależny od próchnicy wtórnej — uwarunkowany obecnością powierzchni w `fillingSurfaceMaterials`; renderuje warstwę grafiki `defect-{surface}`):
`none`, `marginal`, `fracture`, `wear`

**Element retencyjny** (`retention` + `retentionSide`; na ząb, uwarunkowany dla każdego elementu; brak warstwy graficznej, rysowany w nakładce siatki):
`none`, `clasp`, `attachment`, `bar-abutment` — `retentionSide`: `none`, `mesial`, `distal`, `both`. **Teleskop** pozostaje MATERIAŁEM korony i jest rozpoznawany jako retencja

**Zajęcie przyszyjkowe** (`cervicalSurfaces`; zbiór nad `buccal`/`lingual`, uwarunkowany powierzchnią niosącą wypełnienie, zmianę próchnicową lub oba — brak warstwy graficznej, celowo nierysowane):
`buccal`, `lingual` — oznaczenie na powierzchni, nigdy własna powierzchnia: `getFillingSurfaceCount()` pozostaje nietknięte

**Ortodoncja** (`orthoAppliance`, `orthoDrift`, `orthoVertical`, `orthoRotation`; na ząb, uwarunkowane obecnym, naturalnym zębem — stałym lub mlecznym):
`orthoAppliance`: `none`, `bracket`, `band` — `orthoDrift`: `none`, `mesial`, `distal` — `orthoVertical`: `none`, `extrusion` (symbol strzałki w górę), `intrusion` (symbol strzałki w dół) — `orthoRotation`: wartość logiczna

**Ustawienia szczegółów / notacji zęba** (globalne ustawienia sesji, Ustawienia → Szczegóły zęba): `wearDetailLevel` i `discolorationDetailLevel` (`ToothDetailLevel`: `simple`/`complex`, domyślnie `complex` — tryb prosty pokazuje przełącznik tak/nie zamiast pełnej listy rozwijanej typu/przyczyny, bez zmiany zapisanej wartości) oraz `surfaceNotation` (`simple`/`full`, domyślnie `full` — kontroluje, czy litery/etykiety powierzchni próchnicy/wypełnienia są zależne od pozycji zęba; zob. „Notacja powierzchni zależna od pozycji zęba” powyżej)

### ⚙️ Ustawienia
Otwierane za pomocą ikony trybika na pasku górnym; okno dialogowe ARIA `dialog` z pułapką fokusu i układem zakładkowym (Esc/klik w tło zamyka, strzałki przełączają zakładki). Wszystkie ustawienia są wyłącznie stanem interfejsu na poziomie sesji, chyba że zaznaczono inaczej — żadne z nich nie zmienia danych na ząb ani struktury eksportu.

- **Ogólne:** system numeracji (FDI/Universal/Palmer), język, motyw jasny/ciemny, widoczność panelu informacji o zębach
- **Panele:** niezależne pokazywanie/ukrywanie karty podsumowania Statusów oraz karty Ortodoncji dla całej jamy ustnej (obie domyślnie widoczne)
- **Szczegóły zęba:** poziom szczegółowości starcia i poziom szczegółowości przebarwienia (prosty/złożony, oba domyślnie złożone), notacja powierzchni (prosta/pełna, domyślnie pełna)
- **Próchnica:** przełącznik punktowania ICDAS II (`enableIcdas`), przełącznik głębokości próchnicy (`cariesDepthEnabled`), szczegółowość próchnicy korzenia (`rootCariesMode`: simple/severity), szczegółowość wtórna/CARS (`secondaryCariesMode`: simple/standard/full), szczegółowość głębokości radiologicznej (`radiographicDepthMode`: off/threeLevel/detailed) — dawna osobna zakładka „Próchnica wtórna” została połączona z tą zakładką, a kontrolka CARS umieszczona bezpośrednio nad głębokością radiologiczną
- **Miazga:** poziom szczegółowości miazgi (`pulpDetailLevel`: simple/AAE/practical-Latin, domyślnie AAE) — kontroluje, jakie słownictwo oferuje selektor „Stan miazgi / endodontyczny”; zmiana na żywo odświeża podsumowanie całej jamy ustnej oraz każdą otwartą etykietkę
- **Notatki:** włącz/wyłącz notatki do zębów (`enableNotes`)
- **Periodontologia:** przełączniki pokazywania/ukrywania na indeks dla wszystkich 16 wierszy odontogramu periodontalnego (`perioRowVisibility`, domyślnie wszystkie widoczne), zgrupowane Kieszonka (PD/GM/CAL/BOP) / Higiena (Płytka/PI/GI) / Śluzówkowo-dziąsłowe (widoczność CEJ/konkawność korzenia/KG/GT) / Podparcie (Furkacja/Ruchomość/Klasa Millera) / Okołowszczepowe (mPI/mBI), każdy wiersz z własnym opisem; plus tryb nazw indeksów przetłumaczonych vs. kanonicznych (`perioIndexNameMode`: `translated` domyślnie / `canonical` — stała naukowa nazwa angielska/łacińska pokazywana w każdym języku interfejsu). Wyłącznie preferencje na poziomie aplikacji (odzwierciedla `perioViewMode`) — nigdy nie są serializowane, etykietki pozostają zlokalizowane w obu trybach

### 🖼️ System szablonów SVG

**Szablony zębów** (w `src/assets/teeth-svgs/`):
| Szablon | Zęby używające go |
|---|---|
| **Zęby stałe** | |
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
| **Zęby mleczne** | |
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

Ząb zapisany jako mleczny rysowany jest z własnego szablonu, osadzanego w miejsce stałego; szablony stałe są obracane o 180 stopni dla żuchwy i odbijane poziomo dla strony lewej, a mleczne stosują to samo przypisanie.

**Ikony SVG** (w `src/assets/icon-svgs/`):
`icon_8.svg` (mądrość), `icon_gum.svg` (kość), `icon_no_selection.svg` (wyczyść), `icon_occl.svg` (widok okluzyjny), `icon_pulp.svg` (miazga)

### 🔢 Systemy numeracji

**FDI (ISO 3950):** Zęby dorosłych 11-18, 21-28, 31-38, 41-48. Zęby mleczne 51-55, 61-65, 71-75, 81-85.

**Universal (USA):** Zęby dorosłych numerowane 1-32. Zęby mleczne oznaczone literami A-T.

**Palmer (Zsigmondy-Palmer):** Format kwadrant + pozycja (np. UR-1, LL-5). Zęby mleczne używają liter A-E na kwadrant.

### 🚀 Użycie
Programowanie:
```bash
bun install
bun run dev
```
Kompilacja:
```bash
bun run build
```
Podgląd:
```bash
bun run preview
```

### 🔗 Integracja
Komponent może być osadzony w dowolnej aplikacji React.
Przykład:
```tsx
import App from "./App";

export default function Host(){
  return (
    <App
      language="pl"
      onLanguageChange={(lang) => console.log(lang)}
      numberingSystem="FDI"
      onNumberingChange={(system) => console.log(system)}
      darkMode={false}
      onDarkModeChange={(dark) => console.log(dark)}
    />
  );
}
```

**Integracja trybu ciemnego:**
- **Tryb samodzielny:** Pomiń właściwość `darkMode` — komponent zarządza własnym stanem motywu za pomocą przycisku przełączania na pasku górnym i dodaje/usuwa klasę `.dark` na `<html>`.
- **Tryb kontrolowany:** Przekaż `darkMode` i `onDarkModeChange` — aplikacja nadrzędna kontroluje motyw. Przycisk przełączania nadal jest widoczny, ale wywołuje `onDarkModeChange` zamiast zarządzać stanem wewnętrznym. Aplikacja nadrzędna jest odpowiedzialna za dodawanie/usuwanie klasy `.dark` na `<html>`.

**Niestandardowy motyw:**
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

**Integracja wtyczki:**
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

**Integracja kontrolowana — dokument domeny interfejsu (od 2.3.0):**

Stan kliniczny komponentu to **dokument domeny interfejsu**: ten sam wersjonowany JSON,
który zapisuje `exportStatus()` i odczytuje `importStatus()`. To ten dokument — a nie FHIR
— przechowuje stan Reacta i należy do aplikacji hosta.

Powiąż instancję z odizolowaną **sesją**, aby ją zainicjować i obserwować oraz zachować
niezależność dwóch osadzonych odontogramów:

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

- `session.getDocument()` / `setDocument(doc)` / `subscribe(listener)` to cały kontrakt;
  `createOdontogramSession(initial?)` tworzy sesję. HKP hosts read treatment
  intent from `session.getPlanChanges()`, not the module singleton.
- Zwykły prop `document` zamiast `session` sprawia, że instancja tworzy własną sesję
  zainicjowaną tym dokumentem.
- Pominięcie **obu** zachowuje dotychczasowe zachowanie samodzielne: komponent działa na
  domyślnej sesji procesu (`getDefaultOdontogramSession()`), a wszystkie modułowe punkty
  wejścia działają na nią dokładnie tak jak wcześniej. **Migracja nie jest wymagana.**
- W silniku DOM *aktywna* jest naraz tylko jedna sesja (jest jeden globalny silnik
  powiązany z jedną siatką zębów); pozostałe zachowują własny dokument i pozostają w pełni
  czytelne i zapisywalne przez swoje API sesji.

**FHIR / Dental Core:**

Konwersja FHIR jest czystą, opcjonalną projekcją dokumentu interfejsu. Dental Core `de.cognovis.fhir.dental.core#0.10.0` jest jedynym kontraktem FHIR; rozpoznawany znacznik `odontogram-dental-core-0.6.0` pozostaje obsługiwany dla pustych starszych kolekcji, a nieznane znaczniki dialektu są odrzucane. Import, eksport i ponowny eksport zachowują jedenaście osi źródłowych: `implantPosition`, `crownFractureType`, `orthoProgressive`, `rootResection`, `papillaLoss`, `orthoBracketSide`, `cantilever`, `endoCanals`, `rootFractureRoot`, `rootResectionRoot` i `apicalRoot`. W planach osie te używają wskazanego `Goal` stanu docelowego; istniejące pola planu nadal używają profilowanych planowanych Observations. Stan planowany pozostaje oddzielony od zaobserwowanego i nie tworzy Devices ani wykonanych Procedures. Zduplikowane, sprzeczne, błędne, niejednoznacznie zaadresowane lub niezgodne z zębem wpisy są odrzucane. Wkłady pozostają niezależne dzięki `rootPostType`; starsze wartości `endo-glass-pin` i `endo-metal-pin` migrują do `endo-filling` wraz z materiałem wkładu. Od wersji 5.0.0 `extractionPlan`, `crownNeeded` i `crownReplace` są zapisywane jako zlecenia na poziomie zęba zgodnie z Dental Core 0.8 (SNOMED CT 55162003 / 426222000, przy koronie z `restoration-renewal`); zlecenia zapisane dawnym kodem lokalnym nie są już odczytywane. Od 5.0.0 (przez `@cognovis/fhir-sdk` 0.15.6) każda wartość stanu zęba lub znaleziska na diagramie jest zapisywana i odczytywana wyłącznie jako jej kod Dental Core, bez lokalnego systemu kodów, zastępstwa ani aliasu; adresy URL systemów pochodzą z `@cognovis/fhir-sdk/terminology`.

**Tryb live Aidbox (rozwój, od 2.50.0):**

Samodzielna aplikacja (`apps/standalone`) ma **jedną** stronę wejściową i wybiera tryb w czasie działania: uruchamia się w trybie live przy `?live`, przy `?patient=<id>` albo gdy w jej środowisku jest konfiguracja Aidboxa — w przeciwnym razie serwuje piaskownicę na danych przykładowych. W trybie live wczytuje kartę jednego pacjenta bezpośrednio z serwera Aidbox, renderuje ją w zwykłej powłoce przez opisane wyżej API sesji i zapisuje zmiany z powrotem jako zasoby Dental Core pod deterministycznymi id, dzięki czemu ponowny zapis aktualizuje, zamiast duplikować.

Skopiuj `apps/standalone/.env.example` do `apps/standalone/.env` i uzupełnij ograniczonego klienta maszynowego (zob. [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md)), a następnie z katalogu głównego workspace:

```bash
bun install
bun run dev                                 # następnie otwórz http://localhost:5173/?live
```

Nigdy nie umieszczaj danych administratora w `VITE_*`.

Połowa HTTP to osobny pakiet, [`@cognovis/react-odontogram-fhir`](../../odontogram-fhir): zawiera transport Aidboxa i fabrykę bramy i jako jedyny zależy od `@cognovis/fhir-sdk/client`. Ten pakiet dostarcza **SPI** bramy oraz delegaty sesji dla wczytywania, zapisu i planu zapisu — połowę bez HTTP — i nadal **nie** zawiera `@cognovis/fhir-sdk/client`. Diagram i transport 5.2.6 deklarują wymagany peer SDK `^0.22.0 || ^0.23.0` i dokładną wersję deweloperską `0.23.0` (Dental Core 0.10.0). Aplikacja wykonywalna przypina SDK `0.23.0` i współdzieli jedną kopię bez override. Konfiguracja i mechanika wczytywania/zapisu znajdują się w [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md).

**Datowane badania, status oceny i zapis okołowszczepowy (od 2.4.0):**

Przypadek periodontologiczny bada się ponownie przez lata, dlatego dokument może teraz nieść
własną tożsamość badania oraz archiwum wcześniejszych badań:

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

- Każde zarchiwizowane badanie jest **niezależną migawką** wyników całej jamy ustnej i kontekstu
  przypadku z chwili zapisu; późniejsze zmiany nigdy do niego nie wracają, a ponowny zapis
  zakłada badanie kontrolne zamiast nadpisywać stan wyjściowy, na którym opiera się trend.
- Status i plan nadal znaczą **obecny wobec proponowanego w obrębie jednego badania** — plan
  nigdy nie jest historią i nigdy nie wchodzi w skład migawki.
- Każde pole tożsamości to nieprzejrzysty ciąg znaków należący do aplikacji hosta, który
  komponent przechowuje i zwraca, lecz nigdy nie interpretuje. Dokumenty sprzed wersji ładunku
  2.21 nie zawierają tego i wczytują się bez zmian.
- **To, z czym pacjent przyszedł, wywodzi się z tego archiwum, nigdy nie jest zapisywane.** Praca odtwórcza obecna w NAJSTARSZYM zarchiwizowanym badaniu jest rysowana **kreskowaniem**. `getBaselineExamination()`, `getPreExistingAxes(toothNo)`, `getChangesSinceBaseline()`, `isToothPreExisting(toothNo)`.
- Kreskowanie oznacza **pracę, nigdy ząb i nigdy chorobę** — wypełnienia, wypełnienia kanałowe i wkłady, resekcja wierzchołka, lakowanie bruzd. Korzeń lub implant to ząb, nie praca; próchnica, kamień i wyniki periodontologiczne to choroba.
- **Badanie wstępne można poprawić**: `beginBaselineCorrection()`, `commitBaselineCorrection()`, `cancelBaselineCorrection()`. Celowo bez nadpisania na pojedynczym zębie.
- **Zaimportowany wykres bez własnego archiwum staje się badaniem wstępnym** (menu importu, domyślnie włączone). Dokument z własnym archiwum je zachowuje.

Karta periodontologiczna zapisuje wyniki, a nie sam fakt badania, więc "zgłębnikowano, bez
krwawienia" i "nikt nie zgłębnikował" wyglądały identycznie. Każda objęta oś (PD, GM, BOP,
wysięk ropny, ruchomość, furkacja, płytka, PI, GI, mPI, mBI, KG) potrafi to teraz powiedzieć:

```ts
setAssessmentStatus(16, "bop", "MB", "assessed");
setAssessmentStatus(16, "pd", "DB", "unmeasurable");
getAssessmentStatus(16, "mpi", "buccal");
perioAxisApplies(16, "gm");
perioAxisApplies(11, "gm");
```

"Nie dotyczy" wynika z tego, czym ząb faktycznie jest, a rzeczywisty pomiar zawsze wygrywa z
zapisaną luką. Przy eksporcie niedostępna wartość staje się własnym `dataAbsentReason` FHIR —
nigdy wymyślonym kodem klinicznym — a wynik prawidłowy jawnym `false` lub stopniem `0`.

**Zapisywanie (od 2.7.0):** przełącznik **Status oceny** w nagłówku karty periodontologicznej
dodaje pod każdym widocznym wierszem wskaźnika wiersz towarzyszący z jednym przyciskiem cyklicznym
na punkt pomiarowy — punkt, powierzchnia, wejście furkacji albo cały ząb. Wiersze są domyślnie
wyłączone. Punkt, który ma już pomiar, jest zablokowany (sama wartość dowodzi badania), a pozycja
nieadekwatna jest wyłączona, a nie po cichu ignorowana. Zapisane statusy pojawiają się też w
dymku zęba i w podsumowaniu periodontologicznym całej jamy ustnej.

Karta periodontologiczna całej jamy ustnej rejestruje teraz również **wysięk ropny** dla
każdego miejsca, a kolumna wszczepu obsługuje badanie okołowszczepowe: głębokość zgłębnikowania
w sześciu miejscach, krwawienie, wysięk ropny, ruchomość wszczepu i szerokość dziąsła
zrogowaciałego. Nieaktywne pozostają tam wyłącznie osie wymagające granicy szkliwno-cementowej
(brzeg dziąsła i wyliczany z niego CAL) oraz wskaźniki płytki zęba naturalnego — mPI i mBI są
ich okołowszczepowymi odpowiednikami.
### 🧪 Testowanie
```bash
bun run test           # Uruchom wszystkie 1704 testy (1 dodatkowy test pominięty)
bun run test:watch     # Tryb obserwowania
bun run test:coverage  # Raport pokrycia
```

### 📖 Dokumentacja API
```bash
bun run docs           # Generuj dokumentację TypeDoc w docs/
```

### 📡 Publiczne API

**Właściwości komponentu:**

| Właściwość | Typ | Domyślna | Opis |
|---|---|---|---|
| `language` | `string` | `'hu'` | Język interfejsu (hu/en/de/es/it/sk/pl/ru/pt-br) |
| `onLanguageChange` | `(lang) => void` | — | Wywołanie zwrotne przy zmianie języka |
| `numberingSystem` | `string` | `'FDI'` | System numeracji (FDI/Universal/Palmer) |
| `onNumberingChange` | `(system) => void` | — | Wywołanie zwrotne przy zmianie numeracji |
| `darkMode` | `boolean` | `undefined` | Stan trybu ciemnego. Pomiń dla trybu samodzielnego. |
| `onDarkModeChange` | `(dark) => void` | — | Wywołanie zwrotne przy przełączeniu trybu ciemnego. Wymagane dla trybu kontrolowanego. |
| `themeConfig` | `OdontogramThemeConfig` | `undefined` | Niestandardowe zastąpienia kolorów za pomocą właściwości niestandardowych CSS (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | `undefined` | Niestandardowe wtyczki SVG do nakładek wizualnych i niestandardowego stanu na ząb. |
| `readOnly` | `boolean` | `undefined` | Wyłączenie wszystkich interakcji (klik, dotyk, klawiatura). Przydatne do drukowania/raportowania. |
| `enableNotes` | `boolean` | `undefined` | Włącz notatki do zębów. Dwuklik na ząb, aby dodać/edytować notatki. |

**Eksportowane funkcje do kontroli zewnętrznej:**

| Funkcja | Opis |
|---|---|
| `initOdontogram()` | Zainicjuj silnik i wyrenderuj wszystkie zęby |
| `destroyOdontogram()` | Wyczyść silnik i usuń nasłuchiwacze zdarzeń |
| `setNumberingSystem(system)` | Przełącz między FDI, Universal, Palmer |
| `clearSelection()` | Odznacz wszystkie zęby |
| `setOcclusalVisible(on)` | Włącz/wyłącz widok okluzyjny |
| `setWisdomVisible(on)` | Pokaż/ukryj zęby mądrości |
| `setShowBase(on)` | Pokaż/ukryj warstwę kości |
| `setHealthyPulpVisible(on)` | Pokaż/ukryj zdrową miazgę |
| `registerPlugins(plugins)` | Zarejestruj niestandardowe wtyczki SVG |
| `setPluginState(toothNo, pluginId, value)` | Ustaw niestandardowy stan wtyczki dla zęba |
| `getPluginState(toothNo, pluginId)` | Pobierz niestandardowy stan wtyczki dla zęba |
| `getToothStateSummary(toothNo)` | Pobierz zlokalizowane podsumowanie wszystkich aktywnych stanów |
| `getOdontogramSummary()` | Pobierz ustrukturyzowane, zlokalizowane tekstowe podsumowanie całego wykresu (liczby, sekcje) |
| `onStateChange(callback)` | Subskrybuj zmiany stanu; zwraca funkcję anulowania subskrypcji |
| `setReadOnly(value)` | Włącz/wyłącz tryb tylko do odczytu |
| `getReadOnly()` | Pobierz bieżący stan tylko do odczytu |
| `setNotesEnabled(value)` | Włącz/wyłącz notatki do zębów |
| `getNotesEnabled()` | Pobierz bieżący stan włączenia notatek |
| `setPulpDetailLevel(level)` | Ustaw słownictwo selektora miazgi — `"simple"`, `"aae"` lub `"latin"` |
| `getPulpDetailLevel()` | Pobierz bieżący poziom szczegółowości miazgi |
| `getChartMode()` | Pobierz aktualnie aktywny wykres — `"status"` lub `"plan"` |
| `setChartMode(mode)` | Przełącz aktywny wykres na `"status"` lub `"plan"`; wykres planu jest głęboko kopiowany ze statusu przy pierwszym wejściu |
| `getStatusChart()` | Pobierz ładunek wykresu statusu (`{version, globals, teeth}`), niezależnie od tego, który wykres jest aktualnie aktywny |
| `getPlanChart()` | Pobierz ładunek wykresu planu (`{version, globals, teeth}`), niezależnie od tego, który wykres jest aktualnie aktywny |
| `setPlanChart(payload)` | Zastąp zęby wykresu planu na podstawie ładunku (status pozostaje nietknięty); oznacza wykres planu jako zainicjowany |
| `getPlanChanges()` | Pobierz ustrukturyzowaną różnicę status→plan (`{ toothNo, axis, from, to }[]`) — jeden wpis na ząb i na oś leczenia różniącą się między wykresem statusu a planu; pusta tablica, gdy plan nie istnieje. Dostępne również w `getOdontogramSummary()` jako `plannedChanges` |
| `setPerioSite(toothNo, site, patch)` | Ustaw dane periodontalne dla jednego z sześciu miejsc (`patch` = `{ pd?, gm?, bop?, sup? }`); `pd` równe null/`<1` usuwa dokumentację miejsca. Waliduje i ogranicza (PD 1–15, GM −10…+20) |
| `getToothPerio(toothNo)` | Pobierz rekord periodontalny zęba na miejsce (tylko udokumentowane miejsca) |
| `getToothCal(toothNo)` | Pobierz pochodny CAL na miejsce (`pd + brzeg dziąsłowy`) dla zęba |
| `getPerioSummary()` | Zbiorcze dane periodontalne całej jamy ustnej: liczba udokumentowanych miejsc, liczba krwawień, %BOP, najgorszy CAL, maksymalne PD |
| `getPerioChart()` | Pobierz rekordy periodontalne na ząb aktywnego wykresu |
| `PerioChart` | Komponent React (eksport nazwany) — nakładka odontogramu periodontalnego całej jamy ustnej (`{ open, onClose }`), montowalna niezależnie od `OdontogramShell` do integracji z aplikacją hostującą |
| `openPerioOverlay()` / `closePerioOverlay()` / `isPerioOverlayOpen()` | Programowo otwórz/zamknij/sprawdź nakładkę odontogramu periodontalnego — pozwala aplikacji hostującej wywołać wykres periodontalny osobno od podstawowego odontogramu (współdzielony stan przypadku) |
| `getPerioViewMode()` / `setPerioViewMode(mode)` | Pobierz/ustaw sposób prezentacji wykresu periodontalnego — `"toggle"` (przełącznik widoku `Odontogram \| Dental Chart`, domyślny) lub `"popup"` (nakładka) |
| `getPerioOverlayLayer()` / `setPerioOverlayLayer(layer)` | Pobierz/ustaw nakładkę podświetlenia Dental Chart — `"none"` (domyślnie) / `"pd"` / `"cal"` / `"gr"` / `"plaque"` / `"bop"` / `"pd5"` / `"pd6"` / `"cairo"`; przemalowuje zęby wg tej miary (tylko wyświetlanie na podstawie istniejących danych) |
| `getToothRecessionType(toothNo)` | Pobierz pochodny **typ recesji wg Cairo** — `"none"` / `"rt1"` / `"rt2"` / `"rt3"` (obliczany z CAL międzyzębowego vs. policzkowego zęba) |
| `setCejVisibility(toothNo, v)` / `getCejVisibility(toothNo)` | Widoczność CEJ na ząb — `"none"` / `"detectable"` / `"not-detectable"` |
| `setRootConcavity(toothNo, v)` / `getRootConcavity(toothNo)` | Konkawność powierzchni korzenia na ząb — `"none"` / `"mild"` / `"deep"` |
| `setPlaqueIndex(toothNo, surface, grade)` / `getPlaqueIndex(toothNo, surface)` | Ocena wskaźnika płytki Silness-Löe na powierzchnię — `0`-`3` |
| `setGingivalIndex(toothNo, surface, grade)` / `getGingivalIndex(toothNo, surface)` | Ocena wskaźnika dziąsłowego Löe-Silness na powierzchnię — `0`-`3` |
| `setKeratinizedWidth(toothNo, mm)` / `getKeratinizedWidth(toothNo)` | Szerokość dziąsła zrogowaciałego policzkowego na ząb w mm — `0`-`15`, lub `null`, jeśli nie udokumentowano |
| `setGingivalThickness(toothNo, v)` / `getGingivalThickness(toothNo)` | Fenotyp grubości dziąsła na ząb — `"unknown"` / `"thin"` / `"medium"` / `"thick"` |
| `setMillerClass(toothNo, v)` / `getMillerClass(toothNo)` | Klasa recesji wg Millera na ząb — `"none"` / `"i"` / `"ii"` / `"iii"` / `"iv"` |
| `setPeriImplantPlaque(toothNo, surface, grade)` / `getPeriImplantPlaque(toothNo, surface)` | Tylko implanty — ocena zmodyfikowanego wskaźnika płytki Mombelli (mPI) na powierzchnię — `0`-`3`; brak działania na zębie nieimplantowym |
| `setPeriImplantBleeding(toothNo, surface, grade)` / `getPeriImplantBleeding(toothNo, surface)` | Tylko implanty — ocena zmodyfikowanego wskaźnika krwawienia z bruzdy Mombelli (mBI) na powierzchnię — `0`-`3`; brak działania na zębie nieimplantowym |
| `furcationEntrances(toothNo)` | Wejścia furkacji dla zęba — `["mesial","distal","buccal"]` (górne trzonowce), `["buccal","lingual"]` (dolne trzonowce), `["mesial","distal"]` (górne pierwsze przedtrzonowce), w innym wypadku `[]` |
| `setFurcation(toothNo, entrance, grade)` / `getToothFurcation(toothNo)` | Ustaw/pobierz zajęcie furkacji na wejście (Glickman `1`–`4`; `null` czyści) |
| `setPlaque(toothNo, surface, present)` / `getToothPlaque(toothNo)` | Ustaw/pobierz obecność płytki wg O'Leary'ego na powierzchnię (mezjalna/dystalna/policzkowa/językowa); zasila wskaźnik PI% całej jamy ustnej w `getPerioSummary()` |
| `getCaseMeta()` | Pobierz obiekt metadanych na poziomie przypadku (`{age, smokingStatus, cigarettesPerDay, diabetesStatus, hba1c, toothLossPerio, maxRblPercent, patientName, patientDob, examDate}`) — jeden współdzielony blok, nie na ząb/dual-state (odzwierciedla klucz najwyższego poziomu `globals`); zasila klasyfikację stopnia/klasy periodontalnej |
| `setPatientName(v)` | Ustaw imię i nazwisko pacjenta w przypadku (przycięte; pusty ciąg lub `null` czyści) — wyłącznie tożsamość, nigdy nie wpływa na wyprowadzenie periodontalne |
| `setPatientDob(v)` | Ustaw datę urodzenia pacjenta w przypadku (`YYYY-MM-DD`; nieprawidłowa/pusta czyści)|
| `setExamDate(v)` | Ustaw datę badania przypadku (`YYYY-MM-DD`; nieprawidłowa/pusta czyści) |
| `setCaseAge(v)` | Ustaw wiek pacjenta w przypadku, w latach — `0`-`120`, lub `null`, aby wyczyścić |
| `setSmokingStatus(v)` | Ustaw status palenia przypadku — `"unknown"` / `"never"` / `"former"` / `"current"` |
| `setCigarettesPerDay(v)` | Ustaw liczbę papierosów dziennie (istotne tylko przy statusie palenia `"current"`) — `0`-`99`, lub `null`, aby wyczyścić |
| `setDiabetesStatus(v)` | Ustaw status cukrzycy przypadku — `"unknown"` / `"none"` / `"present"` |
| `setHba1c(v)` | Ustaw HbA1c % (istotne tylko przy statusie cukrzycy `"present"`) — `3.0`-`20.0` (jedno miejsce po przecinku), lub `null`, aby wyczyścić |
| `setToothLossPerio(v)` | Ustaw liczbę zębów utraconych z powodu periodontitis — `0`-`32`, lub `null`, aby wyczyścić |
| `setMaxRblPercent(v)` | Ustaw maksymalny procent radiologicznego zaniku kości — `0`-`100`, lub `null`, aby wyczyścić |
| `resetCaseMeta()` | Zresetuj obiekt metadanych na poziomie przypadku do jego pustych wartości domyślnych |
| `getPerioClassification()` | Pobierz klasyfikację periodontalną World Workshop 2017 (`{diagnosis, stage, grade, extent, derived, overridden}`) — diagnoza/stopień/klasa/zasięg wyprowadzone z udokumentowanych danych periodontalnych i metadanych przypadku, każda oś zastąpiona przeceną klinicysty, gdy jest ustawiona (`derived` zawsze udostępnia nienaruszone wartości obliczone, `overridden` oznacza, które osie zostały nadpisane) |
| `setDiagnosisOverride(v)` | Nadpisz wyprowadzoną diagnozę periodontalną — `"health"` / `"gingivitis"` / `"periodontitis"`, lub `null`, aby wyczyścić (powrót do wyprowadzonej) |
| `setStageOverride(v)` | Nadpisz wyprowadzony stopień periodontalny — `"I"` / `"II"` / `"III"` / `"IV"`, lub `null`, aby wyczyścić (powrót do wyprowadzonego) |
| `setGradeOverride(v)` | Nadpisz wyprowadzoną klasę periodontalną — `"A"` / `"B"` / `"C"`, lub `null`, aby wyczyścić (powrót do wyprowadzonej) |
| `setExtentOverride(v)` | Nadpisz wyprowadzony zasięg periodontalny — `"localized"` / `"generalized"` / `"molar-incisor"`, lub `null`, aby wyczyścić (powrót do wyprowadzonego) |
| `exportImage(format)` | Pobierz wykres jako obraz — `"png"` lub `"jpg"` |
| `exportSvg()` | Pobierz wykres jako skalowalny SVG (wektorowy) |
| `hasAnyPerioData()` | `true`, jeśli jakakolwiek oś periodontalna jest udokumentowana gdziekolwiek w jamie ustnej — steruje automatycznym pominięciem eksportu periodontalnego i wyłącza pozycje menu eksportu periodontalnego na pustym wykresie |
| `startIntroTour()` | Uruchom 12-krokowy interaktywny samouczek wprowadzający |

### 💾 Format eksportu/importu statusu
Eksport tworzy plik JSON (wersja `2.20`; import akceptuje też starsze wersje `1.4` oraz `2.0` do `2.19` i migruje je automatycznie) zawierający:

**Pola globalne:**
- `wisdomVisible` - widoczność zębów mądrości
- `showBase` - widoczność warstwy kości
- `occlusalVisible` - aktywny widok okluzyjny
- `showHealthyPulp` - widoczność zdrowej miazgi
- `edentulous` - aktywny tryb bezzębności

**Pola na ząb (32 zęby):**
- `toothSelection` - podstawowy typ zęba
- `toothSubstrate` - podłoże zęba (naturalne/radix/złamane/crownprep), niezależne od jakiejkolwiek odbudowy
- `restorationType` - typ odbudowy (none/crown/inlay/onlay/veneer/bridge)
- `restorationMaterial` - materiał odbudowy (emax/gold/gradia/zircon/metal/metal-ceramic/telescope/temporary), powiązany z `restorationType`
- `prosthesis` - oś ruchoma/łącznikowa (none/healing-abutment/locator/locator-denture/bar/bar-denture/removable-partial/removable-full), wykluczająca się wzajemnie ze stałym `restorationType` korona/most
- `crownLeakage` - flaga nieszczelności brzeżnej korony, istotna tylko gdy `restorationType` to korona lub most
- `endo` - stan endodontyczny; wyklucza się wzajemnie z `pulpDx` (prezentowane razem za pomocą jednego połączonego selektora „Stan miazgi / endodontyczny” — leczenie zęba normalizuje `pulpDx` do `normal`)
- `rootPostType` - materiał wkładu korzeniowego (`none`, `glass-fiber`, `metal`), niezależny od `endo`
- `mods` - tablica modyfikacji (zapalenie, przyzębie); `inflammation` zostało wycofane z interfejsu przy zębach obecnych (tam symbol determinuje `apicalDx`), ale nadal dotyczy zębów brakujących/w zębodole poekstrakcyjnym
- `caries` - aktywne powierzchnie z próchnicą
- `cariesActiveDepth` - wartość głębokości ICDAS przygotowywana przez selektor głębokości próchnicy przy zastosowaniu nowej powierzchni (nie jest wartością przechowywaną na powierzchnię; zob. `cariesSeverity` dla przechowywanego pola na powierzchnię)
- `rootCaries` - stopień zaawansowania próchnicy korzenia (none/active/arrested/active-cavitated)
- `cariesSeverity` - ujednolicona ciężkość na powierzchnię (0-6): głębokość ICDAS na powierzchni pierwotnej (bez wypełnienia), wynik CARS na powierzchni wtórnej (z wypełnieniem)
- `radiographicDepth` - radiologiczna głębokość próchnicy na powierzchnię (none/E1/E2/D1/D2/D3), niezależna od wizualnej skali ICDAS/CARS
- `fillingMaterial` - materiał wypełnienia
- `fillingSurfaces` - powierzchnie wypełnione
- `fillingSurfaceMaterials` - materiał wypełnienia na powierzchnię (mieszane wypełnienia, np. policzkowe amalgamat + dystalne kompozyt)
- `retention` - co utrzymuje protezę ruchomą na tym zębie (none/clasp/attachment/bar-abutment)
- `retentionSide` - strona, na której działa element retencyjny (none/mesial/distal/both)
- `fillingDefect` - wada wypełnienia na powierzchnię (none/marginal/fracture/wear), uwarunkowana wypełnioną powierzchnią, niezależna od próchnicy wtórnej
- `cervicalSurfaces` - powierzchnie, których wypełnienie lub zmiana próchnicowa sięga okolicy przyszyjkowej (buccal/lingual); oznaczenie na powierzchni zamiast szóstej powierzchni
- `pulpDx` - diagnoza miazgi wg AAE (normal/reversible-pulpitis/irreversible-pulpitis/necrosis); odwracalne zapalenie miazgi renderuje zredukowany symbol
- `pulpLatin` - praktyczny łaciński podtyp miazgi (pokazywany przez selektor miazgi tylko gdy `pulpDetailLevel` ma wartość `latin`)
- `apicalDx` - diagnoza okołowierzchołkowa determinująca symbol okołowierzchołkowy
- `periapicalType` - podtyp zmiany okołowierzchołkowej (none/granuloma/cyst), pokazywany tylko przy objawowym/bezobjawowym zapaleniu ozębnej wierzchołkowej; dawna wartość `abscess` nadal akceptowana przy imporcie
- `resorptionType` - typ resorpcji korzenia (none/internal/external-cervical)
- `periImplant` - stan okołowszczepowy tylko dla implantów (none/mucositis/peri-implantitis-mild/-moderate/-severe), klasyfikacja World Workshop 2018
- `endoResection` - flaga apikoektomii
- `fissureSealing` - flaga lakowania bruzd
- `calculus` - flaga kamienia nazębnego
- `contactMesial` - utrata punktu stycznego mezjalnego
- `contactDistal` - utrata punktu stycznego dystalnego
- `wearEdge` - typ starcia siecznego/okluzyjnego (none/attrition/erosion)
- `wearCervical` - typ starcia szyjkowego (none/abrasion/abfraction/erosion)
- `discoloration` - przyczyna przebarwienia na ząb (none/tetracycline/fluorosis/nonvital/extrinsic/other), zabarwia wypełnienie naturalnej korony przy naturalnym zębie stałym/mlecznym bez odbudowy
- `orthoAppliance` - aparat ortodontyczny (none/bracket/band)
- `orthoDrift` - przemieszczenie ortodontyczne (none/mesial/distal)
- `orthoVertical` - pionowy ruch ortodontyczny (none/extrusion/intrusion)
- `orthoRotation` - flaga rotacji ortodontycznej
- `brokenMesial`, `brokenIncisal`, `brokenDistal` - lokalizacje złamań
- `extractionWound` - rana po ekstrakcji
- `extractionPlan` - planowana ekstrakcja
- `parapulpalPin` - flaga wkładu parapulpalnego
- `bridgePillar` - ząb jako filar mostu
- `mobility` - stopień ruchomości (none/m1/m2/m3)
- `crownNeeded` - wskaźnik wymaganej korony
- `crownReplace` - wskaźnik konieczności wymiany korony
- `missingClosed` - luka zamknięta po ekstrakcji
- `customStates` - niestandardowe stany wtyczek (obiekt, indeksowany po identyfikatorze wtyczki)
- `note` - tekstowa notatka do zęba (ciąg znakowy, opcjonalny — obecny tylko gdy niepusty)

**Pole najwyższego poziomu `plan` (wersja 2.11+):**
- `plan` - opcjonalny obiekt o tym samym kształcie co `teeth` (pola na ząb powyżej), przechowujący wykres **planu** (zamierzonego leczenia). Obecny tylko wtedy, gdy wykres planu został zainicjowany (przełącznik `Status | Plan` został przynajmniej raz przełączony na Plan) ORAZ jego zawartość różni się od wykresu statusu — eksport zawierający wyłącznie status całkowicie go pomija i pozostaje identyczny co do bajtu z eksportem sprzed wersji 2.11, poza numerem wersji. Przy imporcie brak `plan` czyści/dezinicjalizuje wykres planu (nigdy nie przywraca nieaktualnego planu sprzed importu); obecność `plan` przywraca wykres planu obok statusu. Wykres planu można też odczytywać/zapisywać niezależnie od importu/eksportu za pomocą `getPlanChart()`/`setPlanChart()` (zob. Publiczne API powyżej), a `getStatusChart()` zawsze zwraca ładunek statusu, niezależnie od aktywnego trybu wykresu.

**Pole najwyższego poziomu `case` (wersja 2.17+, rozszerzone w 2.18, 2.19 i 2.20):**
- `case` - opcjonalny obiekt przechowujący metadane na poziomie przypadku (nie na ząb), współdzielone zarówno przez wykres statusu, jak i planu (odzwierciedla klucz najwyższego poziomu `globals`). Pomijany, gdy pusty: całkowicie nieobecny, gdy każde pole ma wartość domyślną, dzięki czemu eksport bez przypadku pozostaje identyczny co do bajtu poza numerem wersji. Pola (każde pomijane, gdy ma wartość domyślną): `age`; `smokingStatus` (+ `cigarettesPerDay`); `diabetesStatus` (+ `hba1c`); `toothLossPerio`; `maxRblPercent`; cztery przeceny klinicysty na oś klasyfikacji z 2017 r. — `diagnosisOverride` / `stageOverride` / `gradeOverride` / `extentOverride`; (wersja 2.19) `patientName` / `examDate`; oraz (wersja 2.20) `patientDob`. Zasila klasyfikację stopnia/klasy periodontalnej; odczytywane/zapisywane za pomocą `getCaseMeta()` oraz metod `setCase*` (zob. Publiczne API powyżej). Imię i nazwisko pacjenta, data urodzenia oraz data badania to wyłącznie metadane tożsamości wykresu — **nie** są częścią eksportu FHIR.

### 🖨️ Eksport
Poza własnym eksportem Status JSON / PNG / JPG / SVG odontogramu, **wykres periodontalny** ma własną ścieżkę eksportu:
- Imię i nazwisko pacjenta, data urodzenia oraz data badania to wyłącznie metadane tożsamości wykresu (ładunek `2.20`, addytywny) — **nie** są częścią eksportu FHIR.

### 📁 Struktura folderów
- `src/App.tsx` - powłoka interfejsu, kontrolki paska górnego, przełącznik języka/numeracji/trybu ciemnego/motywu/wtyczki
- `src/odontogram.ts` - silnik warstwowania SVG, zarządzanie stanem zębów, interakcje dotykowe, nakładki wtyczek, okablowanie interfejsu
- `src/plugin.ts` - typ `OdontogramPlugin`, `PluginLayer`, `getQuadrant()`, priorytety z-index `LAYER_Z`
- `src/theme.ts` - typ `OdontogramThemeConfig` i narzędzie `applyThemeConfig()`
- `src/status_extras.ts` - 34 predefiniowane szablony uzupełnień (mosty, protezy, konstrukcje belkowe)
- `src/i18n/` - tłumaczenia (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) i hook i18n
- `src/utils/numbering.ts` - konwersja numeracji FDI, Universal, Palmer
- `src/registry/` - deklaratywny rejestr osi klinicznych i UI: metadane osi, aktywacja SVG, macierz typ×materiał odbudowy, katalog wartości i listy opcji; mapowania FHIR należą do `src/fhir/`
- `src/fhir/` - jedyna warstwa Dental Core dla HL7 FHIR R4: kodek `toFhirDentalCore.ts`/`fromFhirDentalCore.ts` nad `@cognovis/fhir-sdk`, `dentalCoreContract.ts` oraz pomocniczy `dentalCoreLocalCoding.ts`
- `src/bridgeOverlay.ts` - nakładka łącznika odcinka mostu wielozębowego (geometria siodła uwzględniająca łuk)
- `src/SettingsModal.tsx` - zakładkowe okno dialogowe Ustawień (Ogólne/Panele/Szczegóły zęba/Próchnica/Miazga/Notatki/Periodontologia)
- `src/__tests__/` + `src/registry/__tests__/` - zestaw testów Vitest (1704 testy zaliczone, 1 pominięty, w 163 plikach)
- `src/assets/teeth-svgs/` - szablony SVG zębów (6 plików: siekacze, kły, zęby przedtrzonowe, trzonowce + widoki okluzyjne)
- `src/assets/icon-svgs/` - ikony SVG paska narzędzi (5 plików)

### ⚙️ Stos technologiczny
- React 18 + Vite + TypeScript
- Tailwind CSS do stylowania interfejsu
- Warstwowanie SVG przez manipulację DOM (nie stan React dla wydajności)
- Lekki niestandardowy system i18n
- Vitest + Testing Library do testów automatycznych
- TypeDoc do dokumentacji API
- Alias ścieżki Vite: `@` mapowany na `./src`

### 📝 Uwagi
- Szablony SVG są ładowane z `src/assets/teeth-svgs` i `src/assets/icon-svgs`, więc statyczny hosting musi serwować folder publiczny.
- Silnik odontogramu używa własnego stanu wewnętrznego (nie stanu React) dla wydajności i prostoty.
- Zęby mleczne mają ograniczony zestaw dostępnych materiałów (bez wypełnień amalgamatowych, bez endodoncji opartej na wkładach).
- Zęby z implantami mają inny zestaw opcji korony/filara niż zęby naturalne.

### 📖 Jak cytować

Jeśli używasz tego modułu w swojej pracy, zacytuj go.

**Ta wersja (v1.49.0):**
> Dul, Z. (2026). *React Advanced Odontogram* (v1.49.0). Zenodo. https://doi.org/10.5281/zenodo.21156787

**Wszystkie wersje (DOI koncepcyjny):** https://doi.org/10.5281/zenodo.21156787

> Powyższy koncepcyjny DOI obejmujący wszystkie wersje zawsze prowadzi do najnowszego
> zarchiwizowanego wydania; DOI dla konkretnej wersji jest nadawany przy każdym wydaniu
> w momencie jego archiwizacji na Zenodo. Do czasu zarchiwizowania wersji v1.49.0 należy
> cytować ją za pomocą DOI koncepcyjnego.

Metadane cytowania w formacie maszynowym znajdują się w [`CITATION.cff`](../../../CITATION.cff).
