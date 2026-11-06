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

## 🇧🇷 Português (Brasil)

### 📋 Visão geral
Este projeto é um editor de odontograma interativo, executado no navegador, que agiliza o registro dentário com uma interface limpa. Ele renderiza modelos de dentes em SVG por camadas para representar restaurações, cáries, estado endodôntico, mobilidade e outros detalhes clínicos, oferecendo seleção múltipla, filtros de seleção e predefinições de estado prontas para uso. Cada posição dentária tem o seu próprio desenho — dezesseis vistas laterais permanentes, vinte vistas oclusais e a dentição decídua — e a vista superior dos dentes anteriores é o que torna possível registrar um achado palatino em um incisivo, algo que a vista lateral não consegue mostrar.

---
![Odontograma – prévia (português)](screenshot_pt-br_odontogram.png)

🔗 **URL de teste:** https://react-odontogram-modul.vercel.app/

---

### 📦 Usar como pacote npm

O odontograma é distribuído como uma biblioteca de componentes React autocontida no npm:
`@cognovis/odontogram`.

#### Requisitos
- **React 18 ou 19** (declarado como peer dependency — fornecido pela sua aplicação).
- Um **bundler** que entenda o campo `exports` e ESM: Vite, webpack 5, Next.js, Rollup, esbuild, Parcel. O pacote é **somente ESM**.
- Node **≥ 18** para as ferramentas.

#### Instalação

```bash
bun add @cognovis/odontogram react react-dom
```

#### Uso básico

Renderize o `OdontogramShell` e importe a folha de estilos **uma única vez** em qualquer lugar da sua aplicação:

```tsx
import { OdontogramShell } from "@cognovis/odontogram";
import "@cognovis/odontogram/style.css";

export function Chart() {
  return (
    <OdontogramShell
      language="pt-br"       // hu | en | de | es | it | sk | pl | ru | pt-br | ar | zh | fr
      numberingSystem="FDI"  // FDI | Universal | Palmer
      darkMode={false}
    />
  );
}
```

#### Props do componente

`OdontogramShell` é um componente controlado. As props mais comuns:

| Prop | Tipo | Padrão | Descrição |
|------|------|---------|-------------|
| `language` | `Language` | `"hu"` | Idioma da interface (`hu`/`en`/`de`/`es`/`it`/`sk`/`pl`/`ru`/`pt-br`/`ar`/`zh`). |
| `numberingSystem` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` | Sistema de numeração dentária. |
| `darkMode` | `boolean` | `false` | Alterna o tema escuro. |
| `readOnly` | `boolean` | `false` | Desativa toda a edição (somente visualização). |
| `themeConfig` | `OdontogramThemeConfig` | — | Sobrescreve as variáveis CSS do tema (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | — | Registra plugins de estado personalizados / camadas extras. |
| `enableNotes` | `boolean` | `false` | Habilita anotações por dente. |
| `enableIcdas` | `boolean` | `false` | Habilita a pontuação de cárie ICDAS II. |
| `onLanguageChange` / `onNumberingChange` / `onDarkModeChange` | `(value) => void` | — | Disparado quando o usuário altera a configuração pela interface. |

Props de nível de detalhe mais granulares (`pulpDetailLevel`, `secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`, `wearDetailLevel`, `discolorationDetailLevel`, `surfaceNotation`, `showStatusCard`, `showOrthoCard`) também são aceitas — veja os tipos `.d.ts` fornecidos para a lista completa e tipada.

#### API pública (exportações nomeadas)

`OdontogramShell` é tanto a exportação padrão quanto uma exportação nomeada. A API imperativa de estado, o componente independente `PerioChart`, o tour guiado e todos os tipos públicos são exportações nomeadas do mesmo ponto de entrada:

```ts
import {
  OdontogramShell,           // também a exportação padrão
  PerioChart,                // componente independente de gráfico periodontal
  // ler estado
  getOdontogramSummary,
  getToothStateSummary,
  onStateChange,             // inscrever-se em mudanças de estado
  // exportar / importar
  exportSvg, exportImage,    // exportação vetorial / raster do gráfico
  // controle
  setReadOnly, getReadOnly,
  clearSelection,
  registerPlugins, setPluginState, getPluginState,
  startIntroTour,            // inicia o tour de integração
  // …e muitas outras funções de configuração setX/getX
} from "@cognovis/odontogram";
```

A superfície completa (≈ 44 funções + tipos como `OdontogramSummary`, `OdontogramThemeConfig`, `OdontogramPlugin`, `PerioViewMode`, …) está totalmente tipada nas declarações incluídas.

#### Usando com Next.js (App Router)

O componente é somente client-side, então renderize-o a partir de um Client Component:

```tsx
"use client";
import { OdontogramShell } from "@cognovis/odontogram";
import "@cognovis/odontogram/style.css";

export default function OdontogramClient() {
  return <OdontogramShell language="pt-br" numberingSystem="FDI" />;
}
```

Ou carregue-o com um import dinâmico somente client-side: `dynamic(() => import("./OdontogramClient"), { ssr: false })`.

#### Notas importantes e limitações atuais
- **Somente ESM** — o pacote publica um módulo ES principal (`dist/odontogram.js`), com declarações de tipos correspondentes (`dist/index.d.ts`). Ele é voltado para a resolução de módulos de bundlers; não há build CommonJS.
- **A folha de estilos é separada** — você **deve** importar `@cognovis/odontogram/style.css` uma vez; ela não é injetada automaticamente. A estilização é CSS global escopado sob `.odontogram-root` e controlado pelas variáveis CSS `--odon-*`. Na versão ainda não publicada ela não define nada em `:root`, `html` ou `body`: o fundo da página, a fonte e os tokens do host ficam intactos; superfícies anexadas ao `<body>` (tour, popovers) levam `.odontogram-portal`.
- **SSR / somente client-side** — o componente lê o DOM na montagem (`document`), portanto deve rodar no navegador. Em frameworks com SSR, renderize-o em um Client Component (`"use client"`) ou via um import dinâmico somente client-side.
- **Recursos autocontidos** — os SVGs de dentes e ícones são embutidos (inline) no bundle JavaScript em tempo de build; **não há busca de recursos em tempo de execução** a configurar e nada extra para copiar para sua pasta pública.
- **Várias instâncias, um editor ativo** — cada `<OdontogramShell>` montado pode manter seu próprio estado clínico por meio de uma sessão isolada (`createOdontogramSession()`), e duas sessões nunca compartilham dados. O editor DOM interativo continua sendo um único engine global, portanto exatamente uma instância montada o controla por vez: essa instância renderiza o gráfico, as demais renderizam um marcador inativo e seguem totalmente legíveis e graváveis pela sua API de sessão. Ao desmontar a instância ativa, uma em espera assume.

---

### ✨ Principais recursos
- 🖱️ Seleção rápida e seleção múltipla (CMD/CTRL + clique)
- 🦷 Tipos de dente: permanente, decíduo (de leite), implante, subgengival, ausente
- 🍼 A dentição decídua tem anatomia própria: oito modelos gerados cobrem todos os vinte dentes decíduos com proporções radiculares, comprimentos e larguras medidos, polpa relativamente maior e raízes divergentes ao redor do germe permanente. Registrar um dente como decíduo monta seu desenho no lugar do desenho do sucessor. No FHIR o dente é identificado como **51–85**, porque no FDI o próprio número diz a qual dentição ele pertence; na importação esse número decide e apenas a presença é sobreposta
- 🦷 Substrato dentário (ortogonal a qualquer restauração): natural, resto radicular (radix), fraturado, preparado para coroa
- 👑 Restaurações por tipo × material: coroa / inlay / onlay / faceta / ponte em e.max, ouro, gradia, zircônia, metal, metalocerâmica, telescópica ou provisória (o onlay está disponível apenas em vista oclusal) — selecionadas em um único seletor combinado de poucos cliques "Coroa – …"; coroas `metal` legadas migram automaticamente para `metal-ceramic` (metalocerâmica); implantes usam o mesmo modelo tipo × material, composto com uma camada de conector de implante. O seletor é filtrado pelo tipo de dente: um implante oferece apenas coroa/ponte (além das cinco opções de fixação, abaixo); um dente ausente/espaço oferece apenas um pôntico de ponte (além de prótese parcial/total removível); um substrato `radix` oculta totalmente o controle de restauração (nenhuma restauração pode ser registrada em um resto radicular)
- 🦿 Prótese removível/de encaixe no eixo dedicado `prosthesis` (entradas "Kivehető:" no seletor combinado): cicatrizador do implante, locator, locator com sobredentadura, barra, barra com sobredentadura; prótese parcial ou total removível suportada por dentes
- 🌉 Os dentes de ponte renderizam tanto a capa da coroa quanto o conector do vão (saddle); um overlay de vão de ponte multi-dente renderiza um conector único e contínuo, sensível ao arco, ao longo de dentes de ponte consecutivos (pônticos + pilares) e dos espaços entre eles (as arcadas superior e inferior usam geometria de vão espelhada, mantendo o conector alinhado em ambas as arcadas), incluído na exportação PNG/JPG/SVG; aplicar uma ponte por uma predefinição de Estados recalcula o overlay imediatamente
- 🔍 Registro de cárie em 6 faces: mesial, distal, vestibular, lingual, oclusal, subcoroa
- 🪥 Materiais de restauração por face: amálgama, resina composta, ionômero de vidro (GIC), provisória
- 🏥 Um seletor unificado de "Estado pulpar/endodôntico" (agrupado: polpa vital vs. tratada/endo) para obturação medicamentosa, completa ou incompleta, mais um seletor independente para o material do pino radicular (`rootPostType`: none / glass-fiber / metal): o tratamento endodôntico e o diagnóstico pulpar AAE (`pulpDx`: normal / pulpite reversível / irreversível / necrose) são mutuamente exclusivos, enquanto o pino pode coexistir com qualquer estado da obturação radicular. Um dente tratado endodonticamente (`endo` definido) não pode também ter um diagnóstico de polpa vital; ao tratar, `pulpDx` é normalizado para `normal` e o glifo de polpa doente é suprimido. A pulpite reversível renderiza um glifo de polpa reduzido. Um ajuste opcional de 3 níveis de detalhe pulpar (`pulpDetailLevel`: simple / AAE / latim prático) exibe 9 subtipos em latim prático (pulpa sana … gangraena pulpae) via `pulpLatin`; a resecção e o pino parapulpar continuam sendo indicadores especiais separados
- 🦴 O diagnóstico apical (`apicalDx`: periodontite apical sintomática/assintomática, abscesso apical agudo/crônico, osteíte condensante) determina diretamente o glifo periapical; um qualificador de subtipo de lesão granuloma/cisto é exibido apenas sob periodontite apical sintomática/assintomática (o subtipo redundante "abscesso" foi removido — já é coberto pelo diagnóstico apical)

![Gráfico periodontal de boca completa (português)](screenshot_pt-br_perio.png)

- 🩹 Cartão unificado "Raiz e periodonto" (uma única seção recolhível para achados radiculares/periapicais e periodontais)
- ⚕️ Modificações: inflamação periapical (exibida apenas em dentes ausentes/alvéolo de extração; oculta em dentes presentes, onde apenas `apicalDx` determina o glifo periapical, e em implantes, onde `periImplant` cobre isso), doença periodontal, graus de mobilidade (M1/M2/M3, ocultos em implantes)
- 🦷🔩 Estado peri-implantar (`periImplant`: `none` / `mucositis` / `peri-implantitis-mild` / `peri-implantitis-moderate` / `peri-implantitis-severe`) — estadiamento do World Workshop de 2018, exibido como um seletor dedicado em implantes; a mucosite reutiliza o glifo gengival periodontal, a peri-implantite adiciona uma camada gradual `peri-implant-bone-loss` (opacidade 0,4/0,7/1,0). Os implantes não renderizam mais o glifo de lesão periapical — sua inflamação passa a ser expressa por esse eixo — e as caixas de seleção de modificadores periodontais ficam ocultas em implantes (a rotulagem improvisada da caixa "Peri-implantite" foi aposentada)
- 🏷️ Indicadores especiais: coroa necessária, substituição de coroa necessária, espaço fechado, extração planejada, selante de fissura, perda de ponto de contato
- 👁️ Alternância de visibilidade da vista oclusal, dos sisos, do osso e da polpa
- 🔢 12 filtros de seleção (todos, presentes, permanentes, decíduos, implantes, ausentes, superiores/inferiores, anteriores/molares)
- 📊 Predefinições de estado prontas (redefinir, dentição decídua, dentição mista, edêntulo)
- 📦 34 modelos de restauração predefinidos (pontes, próteses removíveis, próteses sobre barra com implantes)
- 💾 Exportação/importação de estado em JSON (versão 2.10; as importações continuam aceitando as versões legadas 1.4, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8 e 2.9 e são migradas automaticamente, com estados personalizados de plugins e anotações por dente)
- 🧭 **A ortodontia é a terceira visão clínica** (`odontogram-c51`): um seletor `Odontogram | Estado periodontal | Ortodontia` (`#appViewToggle`) abriga o cartão de análise de modelos seguinte. O odontograma nunca é desmontado, apenas oculto, de modo que trocar de visão não pode perturbar o registro. A visão ortodôntica não tem janela própria e por isso continua sendo um segmento do seletor mesmo onde o estado periodontal está configurado como popup — apenas o segmento periodontal desaparece.
- 📐 **Análise de modelos** (`odontogram-c51.1`): Tonn e Bolton a partir das larguras mesiodistais, com a soma incisiva alvo, a discrepância de tamanho dentário e qual arco carrega o excesso. As larguras são inseridas em um arco ou como lista — duas visões do mesmo registro. Um dente ausente do modelo (não irrompido, perdido, sob a gengiva) assume a largura do contralateral, marcada visivelmente como suposição. Além disso sobressaliência, sobremordida e desvio da linha média dentária por arco
- 🔗 Aidbox Dental Core via `@cognovis/fhir-sdk`: o anfitrião injeta um gateway; a sessão carrega e salva. Exportação/importação JSON de status com migrações
- ✚ Interface de seleção de faces em cruz/mais (B/M/O/D/L) para cáries e restaurações
- 🧱 Materiais de restauração por face (restaurações mistas, por exemplo amálgama vestibular + resina distal)
- 🖼️ Exportação da imagem do odontograma em PNG/JPG/SVG (para download; PNG/JPG rasterizados a partir do SVG vetorial)
- 🦷 Cárie/subcárie como uma máquina de estados por face: uma face cariada sem restauração é renderizada como cárie primária (opacidade em níveis ICDAS); assim que essa face tem uma restauração, ela é renderizada como cárie secundária (recorrente) (camada `subcaries-{surface}`, pontuada por CARS) — as duas nunca ficam ativas ao mesmo tempo na mesma face
- 🎯 Gravidade unificada por face (`cariesSeverity`, 0–6, substituindo os antigos campos separados de profundidade ICDAS e CARS): lida como profundidade ICDAS em uma face primária, como pontuação CARS nomeada (Hígido … Cavidade extensa) em uma recorrente, por meio de um popup contextual que mostra apenas a escala relevante para o estado atual da face
- 🌱 Cárie radicular (`rootCaries`: none / active / arrested / active-cavitated), que ativa a camada de ilustração dedicada de cárie radicular com opacidade determinada pela gravidade (active 0,5 / arrested 0,7 / active-cavitated opacidade total)
- 🎚️ Três configurações de granularidade de cárie (`secondaryCariesMode`, `rootCariesMode`, `radiographicDepthMode`) além de um alternador `cariesDepthEnabled`, que reduzem cada escala a uma visão de seletor mais simples sem perder o valor armazenado
- 🩹 Linha de resumo de subcárie no painel de restaurações: lista, abaixo dos controles de restauração, qualquer dente selecionado com cárie secundária e suas faces (ex.: "36 (O) tem subcárie na restauração.")
- 🪛 Defeitos de restauração por face (`fillingDefect`: none / marginal / fracture / wear) em restaurações diretas, independentes da cárie secundária — registrados por meio de um indicador por face no cartão de Restaurações (espelhando o indicador de profundidade de cárie, com sua lista de opções empilhada verticalmente), renderizados no odontograma e exibidos na dica (tooltip) e no resumo de restaurações de boca inteira com um rótulo explícito (ex.: "36 (O) – Defeito de restauração: O: marginal"), da mesma forma que a cárie secundária é rotulada na linha de Cárie; o cartão de Restaurações também exibe uma nota de dica para qualquer dente selecionado com um defeito de restauração registrado (ex.: "O dente 36 tem um defeito de restauração registrado."), em paralelo à nota de dica de subcárie já existente
- 🔗 Elementos de retenção que prendem uma prótese removível a um dente natural (`retention`, `retentionSide`) — três ancoragens, não um eixo: um **grampo** exige apenas o dente presente, um **encaixe** e um **pilar de barra** exigem uma coroa. UM valor por dente, nunca um conjunto. O grampo é DESENHADO como um braço em quarto de arco sobre a coroa (ventre para a gengiva, espelhado por arcada); encaixe e barra levam as marcas do charly `( G )` e `ste`. O **vão da barra é derivado**, nunca armazenado, e uma barra pode apoiar-se em pilares implantares e naturais ao mesmo tempo
- 🎨 **As cores das restaurações são escolhíveis** (Configurações → Cores). Cada preenchimento é uma variável CSS com a cor de fábrica como reserva; e.max e metalocerâmica pintam a partir de uma rampa de nove paradas e a escolha preserva sua variação de luminosidade. Preferência da clínica, não parte do documento.
- 🔩 Um **produto de implante vazio só é lacuna onde a clínica colocou o implante** (`isImplantProductGap`) — aquele com que o paciente chegou é um registro completo. Derivado do exame inicial, nunca armazenado.
- 🦷🔻 Envolvimento cervical de uma restauração ou de uma lesão de cárie (`cervicalSurfaces`: um conjunto sobre as superfícies vestibular e oral) — a região cervical **não** é uma sexta superfície, mas um marcador sobre uma existente (o BEMA a escreve como o sufixo "vz"/"lz"), portanto nunca altera a contagem de superfícies que um nível de posição lê (`getFillingSurfaceCount()`); é registrada no mesmo pop-up por superfície que a cruz de cárie e a de restaurações abrem, sinalizada na célula da superfície com a letra do sufixo e mostrada na dica e na linha do achado que qualifica no resumo de boca completa. Deliberadamente não desenhada no odontograma — a vista lateral não tem camada lingual alguma
- 🦷💥 Desgaste dentário tipificado por causa clínica e localização (`wearEdge`: none / attrition / erosion, incisal/oclusal; `wearCervical`: none / abrasion / abfraction / erosion, cervical) — substituindo os dois alternadores liga/desliga de desgaste por bruxismo; registrado por meio de dois menus suspensos na linha de desgaste, reaproveita a ilustração de desgaste já existente e é exibido na dica e em uma nova seção de resumo de boca inteira "Desgaste"
- 🎨 Descoloração dentária por causa (`discoloration`: none / tetracycline / fluorosis / nonvital / extrinsic / other) em dentes permanentes e decíduos — tinge a coroa natural exibida com uma cor representativa quando o dente não tem restauração e tem substrato natural; exibida na dica e em uma nova seção de resumo de boca inteira "Descoloração"; completa o conjunto de condições de superfície e estruturais junto com os defeitos de restauração e o desgaste
- ✏️ Os dentes anteriores (incisivos/caninos) rotulam sua face oclusal como "incisal" em toda a interface (seletor, popup, resumos); a chave de face armazenada permanece `occlusal`
- 🔤 Notação de face sensível à posição (Configurações → Detalhes do dente → "Notação de face", simples/completa, padrão completa): no modo completo, a letra e o rótulo da face de cárie/restauração seguem a anatomia do dente — oclusal → I/incisal em dentes anteriores, vestibular → L/labial em dentes anteriores, lingual → P/palatina em dentes superiores e L/lingual em dentes inferiores (mesial/distal/subcoroa não são afetadas); o modo simples sempre usa o conjunto genérico B/M/O/D/L/SC, independentemente da posição do dente. Aplica-se ao resumo de boca inteira e aos seletores de face de cárie e de defeito de restauração (letra + legenda); a chave de face armazenada não é afetada
- 🦷↕️ Registro ortodôntico por dente (`orthoAppliance`: none / bracket / band; `orthoDrift`: none / mesial / distal; `orthoVertical`: none / extrusion / intrusion; `orthoRotation`: booleano) em um dente natural presente (permanente ou decíduo) — reaproveita a ilustração ortodôntica dormente da v2.5.0 (nenhum SVG novo); exibido no odontograma, na dica e em uma nova seção de resumo de boca inteira "Ortodontia"
- 🪨 Cálculo, e reabsorção radicular tipificada como interna ou cervical externa (`resorptionType`)
- 📏 Profundidade da cárie por face (superficial / dentina / profunda), ou pontuação ICDAS II opcional (0–6) via `enableIcdas`
- 🩹 Alternador de infiltração marginal de coroa, exibido apenas para restauração de coroa ou ponte
- 🧰 Barra superior unificada de ícones com um modal de Configurações por abas (Geral / Painéis / Detalhes do dente / Cárie / Polpa / Notas — numeração, anotações, visibilidade de painéis, ICDAS, alternador de profundidade de cárie, granularidade de cárie radicular/radiográfica, nível de detalhe pulpar, nível de detalhe de desgaste/descoloração dentária, informações do dente)
- 🗂️ Aba Configurações → "Painéis": exibe/oculta de forma independente os painéis de resumo de boca inteira de Estados e Ortodontia
- 🩹 Configurações de cárie secundária (CARS) unificadas na aba de configurações de Cárie, posicionadas acima da Profundidade radiográfica (a aba separada "Cárie secundária" foi aposentada)
- 🎚️ Nível de detalhe dos detalhes do dente (Configurações → Detalhes do dente): um ajuste simples/complexo para o desgaste dentário e para a descoloração. O modo simples exibe um alternador sim/não por achado (desgaste ligado → attrition/abrasion, descoloração ligada → other); o modo complexo (padrão) mantém os menus suspensos de tipo/causa, e o valor armazenado é preservado ao alternar entre os níveis
- 📋 Painel de informações do dente: resumo textual ao vivo de todo o odontograma (contagens de dentes, listas de presentes/ausentes, cáries incl. secundárias, restaurações, tratamentos de canal, próteses, implantes, estado periodontal) — exibido por padrão, alternável em Configurações
- 🗂️ Menu de Exportação consolidado (Estado JSON / FHIR / PNG / JPG)
- 📥 Menu de Importação com importação FHIR (reimporta Bundles exportados)
- ⏳ Sobreposição de progresso durante a exportação de imagens
- 🎓 Tour interativo de introdução em 12 etapas
- 🔢 Três sistemas de numeração (FDI, Universal, Palmer)
- 🌐 Internacionalização (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) com seletor de idioma (190+ chaves de tradução por idioma)
- 🌗 Suporte a modo escuro com botão de alternância (autônomo ou controlado pelo app pai)
- 🎨 Configuração de tema personalizada (prop `themeConfig`) com propriedades CSS personalizadas (`--odon-*`)
- 📱 UX de toque em dispositivos móveis: popover de toque para ampliar, menu de contexto por pressão longa, pinça para ampliar, alvos de toque de 44px (WCAG), navegação por alternância de arcada
- 🔌 Sistema de plugins SVG personalizados: injete sobreposições visuais, estado personalizado por dente, suporte a exportação/importação em JSON
- ⚠️ Avisos de validação de estado para combinações incompatíveis de estados do dente
- 🏷️ Dica de estado automática nos blocos de dente (mostra todos os estados ativos)
- 🩺 Dica por dente e painel de resumo de boca inteira modernizados: ambos exibem o conjunto completo de achados clínicos (diagnóstico pulpar/apical + subtipo de lesão, reabsorção radicular, estado peri-implantar, cárie radicular graduada, cálculo, infiltração marginal de coroa, fratura, perda de contato, desgaste de borda/cervical tipificado), com uma seção dedicada "Diagnósticos" no painel, uma seção dedicada "Desgaste", e um qualificador de gravidade de cárie simplificado (superficial/moderada/profunda)
- ♿ Acessibilidade por teclado (WCAG): papéis ARIA listbox/option, seleção com Enter/Espaço, navegação com setas, contornos focus-visible
- 🔒 Modo somente leitura: desativa todas as interações para casos de impressão/laudo/visualização
- ✨ Animações de seleção: borda tracejada pulsante e sombra brilhante nos dentes selecionados (com suporte a prefers-reduced-motion)
- 📝 Anotações por dente: clique duplo para adicionar/editar anotações, ícone de anotação ao lado do número do dente, dica ao passar o mouse com o texto da anotação, exportação/importação em JSON
- 🧪 1746 testes automatizados aprovados (1 teste adicional ignorado) (Vitest) em 164 arquivos de teste (165 no total) cobrindo numeração, traduções, predefinições, i18n, componente App, tema, toque, plugins, acessibilidade e paridade dos eixos clínicos/diagnósticos
- 📖 Documentação de API em TypeDoc com comentários JSDoc em todos os exports públicos (`bun run docs`)

### 📦 Módulos
- 🦷 Grade do odontograma e interface dos blocos de dente
- 🎛️ Painel de controles e de estado
- 🎨 Motor de camadas SVG e modelos
- 🔢 Numeração de dentes e mapeamento de rótulos (FDI/Universal/Palmer)
- 🌐 Localização (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- 💾 Exportação/importação de estado
- 📋 Extras de estado: modelos de restauração predefinidos
- 🎨 Configuração de tema: paleta de cores personalizável via propriedades CSS `--odon-*`
- 📱 Interações de toque em dispositivos móveis (toque para ampliar, pressão longa, pinça para ampliar, alternância de arcada)
- 🔌 Sistema de plugins SVG personalizados
- ⚠️ Sistema de validação de estado e de dicas
- ♿ Acessibilidade por teclado e suporte a ARIA
- 🔒 Modo somente leitura
- ✨ Animações de seleção
- 📝 Sistema de anotações por dente
- 🧪 Suíte de testes automatizados (Vitest + Testing Library)

### 🛠️ Controles da interface

**🔝 Barra superior:**
- Seletor de idioma (menu suspenso HU/EN/DE/ES/IT/SK/PL/RU/PT-BR)
- Botão de alternância do modo escuro (ícone de sol/lua, alterna entre tema claro e escuro)
- Seletor do sistema de numeração (menu suspenso FDI/Universal/Palmer)
- Botões Exportar estado / Importar estado

**📊 Cabeçalho do odontograma:**
- Alternância da vista oclusal
- Alternância da visibilidade dos sisos
- Alternância da visibilidade do osso
- Alternância da visibilidade da polpa
- Botão de limpar seleção

**🔍 Filtros de seleção:**
- Selecionar Todos / Todos Presentes / Permanentes / Decíduos / Implantes / Todos Ausentes
- Selecionar Superiores / 6 Anteriores Superiores / Molares Superiores
- Selecionar Inferiores / 6 Anteriores Inferiores / Molares Inferiores

**📋 Predefinições de estado:**
- Redefinir Tudo (redefinir boca)
- Dentição Decídua
- Dentição Mista
- Alternância Edêntulo

**📦 Menu de extras de estado:**
- Pontes de zircônia superiores/inferiores (12-22, 13-23, 16-26, arcada completa)
- Pontes metálicas superiores/inferiores (12-22, 13-23, 16-26, arcada completa)
- Próteses removíveis parciais superiores/inferiores
- Próteses removíveis totais superiores/inferiores
- Próteses sobre barra com implantes superiores/inferiores

**🦷 Painel de edição do dente** (para o(s) dente(s) selecionado(s), agrupado em cartões recolhíveis):
- **Linha base:** seleção do dente (tipo base incl. variantes de coroa fraturada) e substrato dentário (natural/radix/fraturado/crownprep)
- **Linha de restauração:** o menu suspenso combinado de restauração agrupado por tipo (Coroa / Ponte / Inlay / Onlay / Faceta / «Kivehető:»), com cada linha nomeando o próprio tipo e material (opções fixas `restorationType`×`restorationMaterial` mais as opções de fixação/removível de `prosthesis`, filtradas pelo tipo de dente); caixa de seleção de infiltração marginal de coroa (apenas coroa/ponte); caixas de seleção de localização de coroa fraturada; alternadores de coroa necessária / substituição de coroa necessária
- **Linha de desgaste e descoloração:** menu suspenso de tipo de desgaste incisal/oclusal, menu suspenso de tipo de desgaste cervical, menu suspenso de causa de descoloração (cada um alterna para um toggle simples sim/não em Configurações → Detalhes do dente → modo simples)
- **Cartão de Ortodontia:** aparelho, desvio mesial/distal, movimento vertical (extrusão/intrusão), alternador de rotação — exibido em um dente natural presente
- **Cartão de Cárie:** menu suspenso de modo de profundidade de cárie, caixa de seleção de cárie subcoroa, menu suspenso de gravidade de cárie radicular, e o seletor de cárie por face B/M/O/D/L com um popup contextual de profundidade ICDAS/CARS e um emblema de profundidade radiográfica
- **Cartão de Restaurações:** menu suspenso de material de restauração, seletor de restauração por face (com material por face), indicador de defeito de restauração por face (marginal/fratura/desgaste), notas de dica de subcárie e de defeito de restauração
- **Cartão de Raiz e periodonto:** seletor unificado de "Estado pulpar/endodôntico", seletor de diagnóstico apical, seletor de subtipo de lesão periapical (apenas periodontite apical sintomática/assintomática), seletor de tipo de reabsorção radicular, seletor de grau de mobilidade, seletor de estado peri-implantar (apenas implantes)
- **Indicadores especiais:** plano/ferida de extração, espaço fechado, selamento de fissura, perda de ponto de contato, cálculo, pino parapulpar, resecção endodôntica, pilar de ponte

### ⌨️ Registro por abreviaturas

Os achados são registrados em segundos, muitas vezes ditados. Com 46 eixos e 129 valores, o
número de cliques é o verdadeiro gargalo, então o odontograma pode ser preenchido do jeito que já
se digita (`odontogram-t8y`):

```
marcar 13–23      arrastar sobre os dentes, Shift + seta ou Shift + clique
E                 modo material: cerâmica — permanece ativo
k                 seis coroas, uma única tecla
```

**O material vem antes do achado e permanece**, como modo e não como acréscimo. Uma tecla de
material tem duas leituras, porque restauração direta e indireta usam conjuntos de valores
distintos: `K mo` é uma restauração de resina em duas faces, `K k` uma coroa de Gradia. Onde uma
leitura não existe, nenhuma é inventada.

**Tab passa ao próximo dente**, Shift+Tab volta, começando em 18 e dando a volta na boca (18–28,
depois 38–48), com retorno cíclico. Move a seleção, não apenas o foco, de modo que o dente em que
se está fica destacado. As setas permanecem inalteradas.

```
G k    Tab    b          coroa de ouro e depois um pôntico no vizinho
A  mod Tab               uma restauração de amálgama em três faces
c mod K3                 cárie em três faces, com gravidade
```

O mapeamento vive em `src/shorthand.ts`, sem DOM e independente do motor, porque o mesmo conjunto
de achados precisa ser alcançável por três vias: teclado, consulta FHIR a um sistema de gestão e
voz.

A abreviatura é transcrita do teclado de achados do *charly* (solutio), não inventada.

Um trecho segue o **arco**, não a geometria (`odontogram-apn`): pela linha média (13 a 23) sim,
entre arcos nunca.

### 🦷 Tipos e estados do dente

**Seleção do dente (tipo base):**
| Valor | Descrição |
|---|---|
| `none` | Dente ausente |
| `tooth-base` | Dente permanente |
| `milktooth` | Dente decíduo (de leite) |
| `implant` | Implante dentário |
| `tooth-under-gum` | Dente subgengival (não irrompido) |

**Variantes de dente fraturado:**
`tooth-broken-inicisal`, `tooth-broken-distal-inicisal`, `tooth-broken-distal`, `tooth-broken-mesial-distal-inicisal`, `tooth-broken-mesial-distal`, `tooth-broken-mesial-inicisal`, `tooth-broken-mesial`, `no-tooth-after-extraction`

**Substrato dentário (dentes permanentes):**
`natural` (padrão), `radix` (resto radicular), `broken`, `crownprep` (preparada para coroa)

**Tipo de restauração (dentes permanentes):**
`none`, `crown`, `inlay`, `onlay` (apenas vista oclusal), `veneer`, `bridge`

**Material da restauração (dentes permanentes):**
`none`, `emax`, `gold`, `gradia`, `zircon`, `metal`, `metal-ceramic` (coroas `metal` legadas migram para cá), `telescope`, `temporary`

**As opções de restauração são filtradas pelo tipo de dente** (`restorationOptions()` em `src/registry/restorations.ts`): um implante oferece apenas os tipos de restauração `crown`/`bridge` (compostos com uma camada de conector de implante) mais as cinco entradas de fixação `prosthesis` abaixo; um dente ausente/espaço oferece apenas um pôntico `bridge` mais as duas entradas de prótese removível `prosthesis`; um substrato `radix` oculta totalmente o controle de restauração. Os antigos campos planos `crownMaterial`/`bridgeUnit` (valores de fixação de implante/ponte anteriores à v1.14) foram aposentados do modelo ativo — são aceitos apenas como caminho de migração somente leitura para payloads antigos.

**Prosthesis** (`prosthesis`; eixo ortogonal removível/de fixação, exibido como entradas "Kivehető:" no menu suspenso de restauração combinado):
`none`, `healing-abutment`, `locator`, `locator-denture`, `bar`, `bar-denture` (fixações de implante, com ou sem sobredentadura), `removable-partial`, `removable-full` (próteses suportadas por dentes em um dente ausente/espaço). Um dente tem ou uma restauração fixa ou uma prótese, nunca ambas — definir uma limpa a outra.

**Infiltração marginal de coroa** (`crownLeakage`; booleano): exibida apenas quando `restorationType` é `crown` ou `bridge`; ativa a camada de ilustração `crown-leakage`.

**Opções endodônticas (dentes permanentes):**
`none`, `endo-medical-filling`, `endo-filling`, `endo-filling-incomplete`

**Material do pino radicular (dentes permanentes, independente de `endo`):**
`none`, `glass-fiber`, `metal`

**Opções endodônticas (dentes decíduos):**
`none`, `endo-medical-filling`

`endo` e `pulpDx` são exibidos por meio de um único `<select>` unificado de "Estado pulpar/endodôntico" (agrupado: polpa vital vs. tratada/endo) e são mutuamente exclusivos — escolher uma opção tratada (`endo != none`) redefine `pulpDx` para `normal` e escolher um diagnóstico pulpar redefine `endo` para `none`.

**Materiais de restauração (dentes permanentes):**
`amalgam`, `composite`, `gic`, `temporary`

**Materiais de restauração (dentes decíduos):**
`composite`, `gic`, `temporary`

**Faces de restauração/cárie:**
`mesial`, `distal`, `buccal`, `lingual`, `occlusal`, `subcrown` (apenas cárie)

**Modificações:**
`inflammation` (periapical), `parodontal` (periodontal), `mobility` (M1/M2/M3)

**Tipo de lesão periapical** (`periapicalType`; qualifica o glifo periapical, exibido apenas sob periodontite apical sintomática/assintomática):
`none`, `granuloma`, `cyst` — opções de registro; o valor legado `abscess` ainda é aceito/armazenado, mas não é mais oferecido no seletor, já que duplica o diagnóstico apical. Na importação ele é descartado: incorporado a `apicalDx` quando o dente carrega o modificador de inflamação, caso contrário é limpo para `none`

**Diagnóstico pulpar** (terminologia AAE; `pulpDx`):
`normal`, `reversible-pulpitis` (renderiza um glifo de polpa reduzido), `irreversible-pulpitis`, `necrosis` — mutuamente exclusivo com `endo`; normalizado para `normal` em um dente tratado endodonticamente

**Diagnóstico pulpar, latim prático** (`pulpLatin`; exibido pelo seletor de polpa apenas quando `pulpDetailLevel` é `latin`):
`none`, `pulpa-sana`, `hyperaemia-pulpae`, `pulpitis-acuta-serosa`, `pulpitis-acuta-purulenta`, `pulpitis-chronica-clausa`, `pulpitis-chronica-ulcerosa`, `pulpitis-chronica-hyperplastica`, `necrosis-pulpae`, `gangraena-pulpae`

**Nível de detalhe pulpar** (`pulpDetailLevel`, ajuste global): `simple`, `aae` (padrão), `latin` — controla o vocabulário oferecido pelo seletor de polpa

**Diagnóstico apical** (`apicalDx`; determina o glifo periapical):
`normal`, `symptomatic-apical-periodontitis`, `asymptomatic-apical-periodontitis`, `acute-apical-abscess`, `chronic-apical-abscess`, `condensing-osteitis`

**Tipo de reabsorção radicular** (`resorptionType`):
`none`, `internal`, `external-cervical`

**Estado peri-implantar** (`periImplant`; apenas implante, estadiamento do World Workshop de 2018): `mucositis` reutiliza o glifo gengival periodontal; `peri-implantitis-*` adiciona a camada `peri-implant-bone-loss` com opacidade proporcional à gravidade (leve 0,4 / moderada 0,7 / severa 1,0). Os implantes não renderizam mais o glifo de lesão periapical (sua inflamação é expressa por esse eixo em vez disso), e as caixas de seleção de modificadores `mods` de inflamação/periodontal ficam ocultas em implantes:
`none`, `mucositis`, `peri-implantitis-mild`, `peri-implantitis-moderate`, `peri-implantitis-severe`

**Gravidade da cárie** (`cariesSeverity`; campo unificado por face, `0`–`6`): em uma face sem restauração, é lida como a escala de profundidade ICDAS (`superficial` / `dentin` / `deep`, ou os códigos ICDAS II brutos `0–6` quando `enableIcdas` está ativado) e renderiza a camada primária `caries-{surface}`; em uma face com restauração, é lida como uma pontuação CARS nomeada (`0` sã … `6` cavidade extensa) e renderiza em vez disso a camada `subcaries-{surface}` (cárie secundária) — uma face nunca é primária e recorrente ao mesmo tempo

**Cárie radicular** (`rootCaries`; ativa a camada de ilustração `caries-root` em um dente presente, com opacidade determinada pela gravidade — `active` 0,5 / `arrested` 0,7 / `active-cavitated` opacidade total):
`none`, `active`, `arrested`, `active-cavitated`

**Profundidade radiográfica da cárie** (`radiographicDepth`; por face, independente da escala visual ICDAS/CARS `cariesSeverity`):
`none`, `E1`, `E2`, `D1`, `D2`, `D3`

**Configurações de granularidade de cárie** (globais): `secondaryCariesMode` (`simple`/`standard`/`full`, padrão `standard`), `rootCariesMode` (`simple`/`severity`, padrão `simple`), `radiographicDepthMode` (`off`/`threeLevel`/`detailed`, padrão `off`), `cariesDepthEnabled` (booleano, padrão `true`) — cada um reduz sua escala a uma visão de seletor mais simples sem alterar o valor armazenado

**Indicadores especiais:**
`crownNeeded`, `crownReplace`, `missingClosed`, `extractionPlan`, `extractionWound`, `bridgePillar`, `fissureSealing`, `contactMesial`, `contactDistal`, `endoResection`, `calculus`, `parapulpalPin`

**Desgaste dentário** (`wearEdge`, `wearCervical`; tipo clínico por localização, filtrado por dente-base + sem restauração + substrato natural; renderiza as camadas já existentes `tooth-bruxism-wear`/`tooth-bruxism-neck-wear`):
`wearEdge`: `none`, `attrition`, `erosion` — `wearCervical`: `none`, `abrasion`, `abfraction`, `erosion`

**Descoloração** (`discoloration`; causa por dente, filtrada por um dente-base natural ou dente decíduo + sem restauração + substrato natural; tinge o preenchimento da coroa natural exibida — nenhum SVG novo):
`none`, `tetracycline`, `fluorosis`, `nonvital`, `extrinsic`, `other`

**Defeito de restauração** (`fillingDefect`; por face, achado de restauração direta independente da cárie secundária — filtrado às faces presentes em `fillingSurfaceMaterials`; renderiza a camada de ilustração `defect-{surface}`):
`none`, `marginal`, `fracture`, `wear`

**Elemento de retenção** (`retention` + `retentionSide`; por dente, condicionado por elemento; sem camada gráfica, desenhado na sobreposição da grade):
`none`, `clasp`, `attachment`, `bar-abutment` — `retentionSide`: `none`, `mesial`, `distal`, `both`. Uma **telescópica** continua sendo MATERIAL de coroa e é reconhecida como retenção

**Envolvimento cervical** (`cervicalSurfaces`; conjunto sobre `buccal`/`lingual`, condicionado a uma superfície que carregue uma restauração, uma lesão de cárie ou ambas — sem camada gráfica, deliberadamente não desenhada):
`buccal`, `lingual` — um marcador sobre a superfície, nunca uma superfície própria: `getFillingSurfaceCount()` permanece intocado

**Ortodontia** (`orthoAppliance`, `orthoDrift`, `orthoVertical`, `orthoRotation`; por dente, filtrado a um dente natural presente — permanente ou decíduo):
`orthoAppliance`: `none`, `bracket`, `band` — `orthoDrift`: `none`, `mesial`, `distal` — `orthoVertical`: `none`, `extrusion` (glifo de seta para cima), `intrusion` (glifo de seta para baixo) — `orthoRotation`: booleano

**Configurações de detalhe/notação do dente** (configurações de sessão globais, Configurações → Detalhes do dente): `wearDetailLevel` e `discolorationDetailLevel` (`ToothDetailLevel`: `simple`/`complex`, padrão `complex` — o modo simples exibe um toggle sim/não em vez do menu suspenso completo de tipo/causa, sem alterar o valor armazenado) e `surfaceNotation` (`simple`/`full`, padrão `full` — controla se as letras/rótulos de face de cárie/restauração são sensíveis à posição; ver "Notação de face sensível à posição" acima)

### ⚙️ Configurações
Aberta a partir do ícone de engrenagem na barra superior; um diálogo ARIA `dialog` com captura de foco e layout em abas (Esc/clique fora para fechar, setas para alternar entre abas). Todas as configurações são apenas estado de UI de nível de sessão, salvo indicação em contrário — nenhuma delas altera os dados por dente ou o payload de exportação.

- **Geral:** sistema de numeração (FDI/Universal/Palmer), idioma, tema claro/escuro, visibilidade do painel de informações do dente
- **Painéis:** exibe/oculta de forma independente o cartão de Estados de boca inteira e o cartão de Ortodontia (ambos visíveis por padrão)
- **Detalhes do dente:** nível de detalhe de desgaste e nível de detalhe de descoloração (simples/complexo, ambos padrão complexo), notação de face (simples/completa, padrão completa)
- **Cárie:** alternador de pontuação ICDAS II (`enableIcdas`), alternador de profundidade de cárie (`cariesDepthEnabled`), granularidade de cárie radicular (`rootCariesMode`: simple/severity), granularidade secundária/CARS (`secondaryCariesMode`: simple/standard/full), granularidade de profundidade radiográfica (`radiographicDepthMode`: off/threeLevel/detailed) — a antiga aba separada "Cárie secundária" foi unificada nesta, com o controle CARS posicionado logo acima da profundidade radiográfica
- **Polpa:** nível de detalhe pulpar (`pulpDetailLevel`: simple/AAE/latim prático, padrão AAE) — controla o vocabulário oferecido pelo seletor de "Estado pulpar/endodôntico"; alterá-lo atualiza em tempo real o resumo de boca inteira e todas as dicas abertas
- **Notas:** ativar/desativar anotações por dente (`enableNotes`)

### 🖼️ Sistema de modelos SVG

**Modelos de dente** (em `src/assets/teeth-svgs/`):
| Modelo | Dentes que o utilizam |
|---|---|
| **Dentes permanentes** | |
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
| **Dentes decíduos** | |
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

Um dente registrado como decíduo é desenhado a partir de um modelo próprio, montado no lugar do permanente; os modelos permanentes são girados 180 graus para a arcada inferior e espelhados horizontalmente para o lado esquerdo, e os decíduos seguem o mesmo mapeamento.

**SVGs de ícones** (em `src/assets/icon-svgs/`):
`icon_8.svg` (sisos), `icon_gum.svg` (osso), `icon_no_selection.svg` (limpar), `icon_occl.svg` (vista oclusal), `icon_pulp.svg` (polpa)

### 🔢 Sistemas de numeração

**FDI (ISO 3950):** Dentes permanentes 11-18, 21-28, 31-38, 41-48. Dentes decíduos 51-55, 61-65, 71-75, 81-85.

**Universal (EUA):** Dentes permanentes numerados de 1 a 32. Dentes decíduos com letras de A a T.

**Palmer (Zsigmondy-Palmer):** Formato quadrante + posição (por exemplo, UR-1, LL-5). Os dentes decíduos usam letras de A a E por quadrante.

### 🚀 Uso
Desenvolvimento:
```bash
bun install
bun run dev
```
Build:
```bash
bun run build
```
Pré-visualização:
```bash
bun run preview
```

### 🔗 Integração
O componente pode ser incorporado em qualquer app React.
Exemplo:
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

**Integração do modo escuro:**
- **Modo autônomo:** Omita a prop `darkMode` — o componente gerencia seu próprio estado de tema pelo botão de alternância da barra superior e adiciona/remove a classe `.dark` no `<html>`.
- **Modo controlado:** Passe `darkMode` e `onDarkModeChange` — o app pai controla o tema. O botão de alternância continua aparecendo, mas chama `onDarkModeChange` em vez de gerenciar o estado interno. O app pai é responsável por adicionar/remover a classe `.dark` no `<html>`.

**Tema personalizado:**
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

**Integração de plugin:**
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

// Define o estado do plugin para um dente:
setPluginState(11, "implant-brand", "Straumann");
```

**Integração controlada — o documento de domínio da interface (a partir da 2.3.0):**

O estado clínico do componente é um **documento de domínio da interface**: o mesmo JSON
versionado que `exportStatus()` grava e `importStatus()` lê. Esse documento — e não o FHIR
— é o que o estado do React guarda e o que a aplicação hospedeira possui.

Vincule uma instância a uma **sessão** isolada para inicializá-la e observá-la, e para
manter independentes dois odontogramas montados:

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

- `session.getDocument()` / `setDocument(doc)` / `subscribe(listener)` é todo o contrato;
  `createOdontogramSession(initial?)` cria uma sessão. HKP hosts read treatment
  intent from `session.getPlanChanges()`, not the module singleton.
- Uma prop `document` simples em vez de `session` faz a instância criar e possuir uma
  sessão privada inicializada a partir dela.
- Não passar **nenhuma das duas** preserva o comportamento autônomo histórico: o componente
  funciona sobre a sessão padrão do processo (`getDefaultOdontogramSession()`) e todos os
  pontos de entrada do módulo se aplicam a ela exatamente como antes. **Nenhuma migração é
  necessária.**
- Apenas uma sessão fica *ativa* no motor DOM por vez (é um único motor global ligado a uma
  grade dentária); as demais mantêm seu próprio documento e continuam totalmente legíveis e
  graváveis pela sua API de sessão.

**FHIR / Dental Core:**

A conversão FHIR é uma projeção opcional e pura do documento da interface. O Dental Core `de.cognovis.fhir.dental.core#0.10.0` é o único contrato FHIR; o marcador reconhecido `odontogram-dental-core-0.6.0` continua legível para coleções legadas vazias, enquanto marcadores de dialeto desconhecidos são rejeitados. Importação, exportação e reexportação preservam os onze eixos de origem `implantPosition`, `crownFractureType`, `orthoProgressive`, `rootResection`, `papillaLoss`, `orthoBracketSide`, `cantilever`, `endoCanals`, `rootFractureRoot`, `rootResectionRoot` e `apicalRoot`. Nos planos, esses eixos usam um `Goal` de estado-alvo referenciado; os campos de plano existentes continuam usando Observations planejadas com perfil. O estado planejado permanece separado do observado e não cria Devices nem Procedures realizadas. Declarações duplicadas, conflitantes, inválidas, com endereço ambíguo ou incompatíveis com o dente são rejeitadas. Os pinos continuam independentes por meio de `rootPostType`; valores antigos `endo-glass-pin` e `endo-metal-pin` migram para `endo-filling` mais o material do pino. Desde a 5.0.0, `extractionPlan`, `crownNeeded` e `crownReplace` são gravados como pedidos por dente do Dental Core 0.8 (SNOMED CT 55162003 / 426222000, com `restoration-renewal` na coroa); pedidos gravados com o código local anterior não são mais lidos. Desde a 5.0.0 (via `@cognovis/fhir-sdk` 0.15.6), cada valor de estado do dente ou de achado do odontograma é gravado e lido apenas como seu código Dental Core, sem sistema de códigos local, alternativa ou alias; as URLs de sistema vêm de `@cognovis/fhir-sdk/terminology`.

**Modo live do Aidbox (desenvolvimento, a partir de 2.50.0):**

O aplicativo autônomo (`apps/standalone`) tem **uma única** página de entrada e escolhe o modo em tempo de execução: inicia em modo ao vivo com `?live`, com `?patient=<id>`, ou sempre que houver uma configuração do Aidbox em seu ambiente; caso contrário, serve o ambiente de testes com dados de exemplo. No modo ao vivo, carrega a ficha de um paciente diretamente de um servidor Aidbox, renderiza-a na interface habitual por meio da API de sessão descrita acima, e grava as alterações de volta como recursos Dental Core sob ids determinísticos, de modo que salvar novamente atualiza em vez de duplicar.

Copie `apps/standalone/.env.example` para `apps/standalone/.env` e preencha um cliente de máquina com escopo (veja [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md)) e, a partir da raiz do workspace:

```bash
bun install
bun run dev                                 # depois abra http://localhost:5173/?live
```

Nunca coloque uma credencial de administrador em `VITE_*`.

A metade HTTP é um pacote próprio, [`@cognovis/odontogram-fhir`](../../odontogram-fhir): contém o transporte do Aidbox e a fábrica do gateway, e é o único que depende de `@cognovis/fhir-sdk/client`. Este pacote entrega a **SPI** do gateway e os delegados de sessão de carregamento/gravação/plano de escrita — a metade sem HTTP — e continua **não** incluindo `@cognovis/fhir-sdk/client`. O diagrama e o transporte 5.2.6 declaram o peer obrigatório do SDK `^0.22.0 || ^0.23.0` e a versão exata de desenvolvimento `0.23.0` (Dental Core 0.10.0). A aplicação executável fixa o SDK `0.23.0` e compartilha uma única cópia sem overrides. A configuração e a mecânica de carregamento/gravação estão em [`docs/aidbox-live-mode.md`](../../../docs/aidbox-live-mode.md).

**Exames datados, status de avaliação e registro peri-implantar (a partir de 2.4.0):**

Um caso periodontal é reexaminado ao longo de anos, então um documento pode agora carregar a
identidade própria do exame e um arquivo de exames anteriores:

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

- Cada exame arquivado é um **instantâneo independente** dos achados de boca toda e do contexto
  do caso no momento da captura; edições posteriores nunca voltam a ele, e capturar de novo
  registra um exame de acompanhamento em vez de sobrescrever a linha de base da qual a evolução
  depende.
- Status e plano continuam significando **atual versus proposto dentro de um mesmo exame** — o
  plano nunca é histórico e nunca faz parte de um instantâneo.
- Cada campo de identidade é uma string opaca, de propriedade da aplicação hospedeira, que o
  componente armazena e devolve mas nunca interpreta. Documentos anteriores à versão de payload
  2.21 não trazem nada disso e carregam sem alteração.
- **O que o paciente trouxe consigo é derivado desse arquivo, nunca armazenado.** O trabalho restaurador presente no exame arquivado MAIS ANTIGO é desenhado **hachurado**. `getBaselineExamination()`, `getPreExistingAxes(toothNo)`, `getChangesSinceBaseline()`, `isToothPreExisting(toothNo)`.
- A hachura marca **trabalho, nunca o dente e nunca a doença** — restaurações, obturações diretas, obturações de canal e pinos, apicectomia, selamento de fóssulas. Um resto radicular ou implante é dente, não trabalho; cárie, cálculo e os achados periodontais são doença.
- O **exame inicial é corrigível**: `beginBaselineCorrection()`, `commitBaselineCorrection()`, `cancelBaselineCorrection()`. Deliberadamente sem sobreposição por dente.
- Um **odontograma importado sem arquivo próprio torna-se o exame inicial** (menu de importação, ativado por padrão). Um documento que traz seu próprio arquivo o mantém.

O registro periodontal guarda achados, não o ato de olhar, então "sondado, sem sangramento" e
"ninguém sondou" pareciam idênticos. Cada eixo no escopo (PD, GM, BOP, supuração, mobilidade,
furca, placa, PI, GI, mPI, mBI, KG) já consegue dizer qual é o caso:

```ts
setAssessmentStatus(16, "bop", "MB", "assessed");
setAssessmentStatus(16, "pd", "DB", "unmeasurable");
getAssessmentStatus(16, "mpi", "buccal");
perioAxisApplies(16, "gm");
perioAxisApplies(11, "gm");
```

"Não aplicável" é derivado do que o dente realmente é, e uma medição real sempre vence uma
lacuna registrada. Na exportação, um valor indisponível vira o próprio `dataAbsentReason` do
FHIR — nunca um código clínico inventado — e um achado normal vira um `false` explícito ou o
grau `0`.

**Registro (a partir da 2.7.0):** um seletor **Status de avaliação** no cabeçalho da carta
periodontal adiciona uma linha acompanhante sob cada linha de índice visível, com um botão cíclico
por ponto de medição — sítio, superfície, entrada de furca ou o dente inteiro. As linhas vêm
desligadas por padrão. Um ponto que já tem medição fica bloqueado (o próprio valor comprova o
exame) e uma posição não aplicável é desabilitada em vez de ignorada em silêncio. Os status
registrados aparecem também no tooltip do dente e no resumo periodontal de boca toda.

A carta periodontal de boca toda passa a registrar também a **supuração** por sítio, e uma
coluna de implante suporta o exame peri-implantar: profundidade de sondagem em seis sítios,
sangramento, supuração, mobilidade do implante e largura de mucosa queratinizada. Ali só ficam
inativos os eixos que precisam da junção amelocementária (margem gengival e o CAL derivado dela)
e os índices de placa do dente natural — mPI e mBI são seus equivalentes peri-implantares.
### 🧪 Testes
```bash
bun run test           # Executa todos os 864 testes (1 teste adicional ignorado)
bun run test:watch     # Modo watch
bun run test:coverage  # Relatório de cobertura
```

### 📖 Documentação da API
```bash
bun run docs           # Gera a documentação TypeDoc em docs/
```

### 📡 API pública

**Props do componente:**

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `language` | `string` | `'hu'` | Idioma da interface (hu/en/de/es/it/sk/pl/ru/pt-br) |
| `onLanguageChange` | `(lang) => void` | — | Callback quando o idioma muda |
| `numberingSystem` | `string` | `'FDI'` | Sistema de numeração (FDI/Universal/Palmer) |
| `onNumberingChange` | `(system) => void` | — | Callback quando a numeração muda |
| `darkMode` | `boolean` | `undefined` | Estado do modo escuro. Omita para o modo autônomo. |
| `onDarkModeChange` | `(dark) => void` | — | Callback quando o modo escuro é alternado. Obrigatório para o modo controlado. |
| `themeConfig` | `OdontogramThemeConfig` | `undefined` | Sobrescritas de cor personalizadas via propriedades CSS personalizadas (`--odon-*`). |
| `plugins` | `OdontogramPlugin[]` | `undefined` | Plugins SVG personalizados para sobreposições visuais e estado personalizado por dente. |
| `readOnly` | `boolean` | `undefined` | Desativa todas as interações (clique, toque, teclado). Útil para visualizações de impressão/laudo. |
| `enableNotes` | `boolean` | `undefined` | Ativa anotações por dente. Clique duplo em um dente para adicionar/editar anotações. |

**Funções exportadas para controle externo:**

| Função | Descrição |
|---|---|
| `initOdontogram()` | Inicializa o motor e renderiza todos os dentes |
| `destroyOdontogram()` | Limpa o motor e remove os ouvintes de eventos |
| `setNumberingSystem(system)` | Alterna entre FDI, Universal, Palmer |
| `clearSelection()` | Desmarca todos os dentes |
| `setOcclusalVisible(on)` | Ativa/desativa a vista oclusal |
| `setWisdomVisible(on)` | Mostra/oculta os sisos |
| `setShowBase(on)` | Mostra/oculta a camada do osso |
| `setHealthyPulpVisible(on)` | Mostra/oculta a polpa saudável |
| `registerPlugins(plugins)` | Registra plugins SVG personalizados |
| `setPluginState(toothNo, pluginId, value)` | Define o estado personalizado de um plugin para um dente |
| `getPluginState(toothNo, pluginId)` | Obtém o estado personalizado de um plugin para um dente |
| `getToothStateSummary(toothNo)` | Obtém o resumo localizado de todos os estados ativos |
| `getOdontogramSummary()` | Obtém um resumo textual estruturado e localizado de todo o odontograma (contagens, seções) |
| `onStateChange(callback)` | Assina as mudanças de estado; retorna uma função para cancelar a assinatura |
| `setReadOnly(value)` | Ativa/desativa o modo somente leitura |
| `getReadOnly()` | Obtém o estado atual de somente leitura |
| `setNotesEnabled(value)` | Ativa/desativa as anotações por dente |
| `getNotesEnabled()` | Obtém o estado atual de ativação das anotações |
| `setPulpDetailLevel(level)` | Define o vocabulário do seletor de polpa — `"simple"`, `"aae"` ou `"latin"` |
| `getPulpDetailLevel()` | Obtém o nível de detalhe pulpar atual |
| `exportImage(format)` | Baixa o odontograma como imagem, `"png"` ou `"jpg"` |
| `exportSvg()` | Baixa o odontograma como SVG escalável (vetorial) |
| `startIntroTour()` | Inicia o tour interativo de introdução em 12 etapas |

### 💾 Formato de exportação/importação de estado
A exportação cria um arquivo JSON (versão `2.10`; as importações também aceitam as versões legadas `1.4`, `2.0`, `2.1`, `2.2`, `2.3`, `2.4`, `2.5`, `2.6`, `2.7`, `2.8` e `2.9` e migram automaticamente) contendo:

**Campos globais:**
- `wisdomVisible` - sisos visíveis
- `showBase` - camada do osso visível
- `occlusalVisible` - vista oclusal ativa
- `showHealthyPulp` - polpa saudável visível
- `edentulous` - modo edêntulo ativo

**Campos por dente (32 dentes):**
- `toothSelection` - tipo base do dente
- `toothSubstrate` - substrato dentário (natural/radix/broken/crownprep), ortogonal a qualquer restauração
- `restorationType` - tipo de restauração (none/crown/inlay/onlay/veneer/bridge)
- `restorationMaterial` - material da restauração (emax/gold/gradia/zircon/metal/metal-ceramic/telescope/temporary), pareado com `restorationType`
- `prosthesis` - eixo removível/de fixação (none/healing-abutment/locator/locator-denture/bar/bar-denture/removable-partial/removable-full), mutuamente exclusivo com um `restorationType` fixo de coroa/ponte
- `crownLeakage` - marcador de infiltração marginal de coroa, relevante apenas quando `restorationType` é coroa ou ponte
- `endo` - estado endodôntico; mutuamente exclusivo com `pulpDx` (exibidos juntos por meio de um único seletor unificado de "Estado pulpar/endodôntico" — tratar um dente normaliza `pulpDx` para `normal`)
- `rootPostType` - material do pino radicular (`none`, `glass-fiber`, `metal`), independente de `endo`
- `mods` - array de modificações (inflammation, parodontal); `inflammation` foi aposentado da interface em dentes presentes (ali `apicalDx` determina o glifo), mas continua se aplicando a dentes ausentes/alvéolo de extração
- `caries` - faces com cárie ativa
- `cariesActiveDepth` - o valor de profundidade ICDAS temporariamente definido pelo seletor de profundidade de cárie ao aplicar uma nova face (não é um valor armazenado por face; ver `cariesSeverity` para o campo por face armazenado)
- `rootCaries` - gravidade da cárie radicular (none/active/arrested/active-cavitated)
- `cariesSeverity` - gravidade unificada por face (0-6): profundidade ICDAS em uma face primária (sem restauração), pontuação CARS em uma face recorrente (com restauração)
- `radiographicDepth` - profundidade radiográfica da cárie por face (none/E1/E2/D1/D2/D3), independente da escala visual ICDAS/CARS
- `fillingMaterial` - material de restauração
- `fillingSurfaces` - faces restauradas
- `fillingSurfaceMaterials` - material de restauração por face (restaurações mistas, por exemplo amálgama vestibular + resina distal)
- `retention` - o que prende uma prótese removível a este dente (none/clasp/attachment/bar-abutment)
- `retentionSide` - o lado em que o elemento de retenção engata (none/mesial/distal/both)
- `fillingDefect` - defeito de restauração por face (none/marginal/fracture/wear), filtrado a faces restauradas, independente da cárie secundária
- `cervicalSurfaces` - as superfícies cuja restauração ou lesão de cárie se estende à região cervical (buccal/lingual); um marcador sobre a superfície em vez de uma sexta superfície
- `pulpDx` - diagnóstico pulpar AAE (normal/reversible-pulpitis/irreversible-pulpitis/necrosis); a pulpite reversível renderiza um glifo reduzido
- `pulpLatin` - subtipo pulpar em latim prático (exibido pelo seletor de polpa apenas quando `pulpDetailLevel` é `latin`)
- `apicalDx` - diagnóstico apical que determina o glifo periapical
- `periapicalType` - subtipo de lesão periapical (none/granuloma/cyst), exibido apenas sob periodontite apical sintomática/assintomática; o valor legado `abscess` ainda é aceito na importação
- `resorptionType` - tipo de reabsorção radicular (none/internal/external-cervical)
- `periImplant` - estado peri-implantar, apenas implante (none/mucositis/peri-implantitis-mild/-moderate/-severe), estadiamento do World Workshop de 2018
- `endoResection` - marcador de apicectomia
- `fissureSealing` - marcador de selante de fissura
- `calculus` - marcador de cálculo
- `contactMesial` - perda de ponto de contato mesial
- `contactDistal` - perda de ponto de contato distal
- `wearEdge` - tipo de desgaste incisal/oclusal (none/attrition/erosion)
- `wearCervical` - tipo de desgaste cervical (none/abrasion/abfraction/erosion)
- `discoloration` - causa de descoloração por dente (none/tetracycline/fluorosis/nonvital/extrinsic/other), tinge o preenchimento da coroa natural em um dente-base natural/decíduo sem restauração
- `orthoAppliance` - aparelho ortodôntico (none/bracket/band)
- `orthoDrift` - desvio ortodôntico (none/mesial/distal)
- `orthoVertical` - movimento vertical ortodôntico (none/extrusion/intrusion)
- `orthoRotation` - marcador de rotação ortodôntica
- `brokenMesial`, `brokenIncisal`, `brokenDistal` - locais de fratura
- `extractionWound` - ferida pós-extração
- `extractionPlan` - extração planejada
- `parapulpalPin` - marcador de pino parapulpar
- `bridgePillar` - dente pilar de ponte
- `mobility` - grau de mobilidade (none/m1/m2/m3)
- `crownNeeded` - indicador de coroa necessária
- `crownReplace` - indicador de substituição de coroa necessária
- `missingClosed` - espaço fechado após a extração
- `customStates` - estados personalizados de plugins (objeto, indexado por ID do plugin)
- `note` - anotação de texto por dente (string, opcional, presente apenas quando não vazia)

### 📁 Estrutura de pastas
- `src/App.tsx` - interface do shell, controles da barra superior, seletor de idioma/numeração/modo escuro/tema/plugin
- `src/odontogram.ts` - motor de camadas SVG, gerenciamento de estado do dente, interações de toque, sobreposições de plugins, ligação da interface
- `src/plugin.ts` - tipo `OdontogramPlugin`, `PluginLayer`, `getQuadrant()`, prioridades de z-index `LAYER_Z`
- `src/theme.ts` - tipo `OdontogramThemeConfig` e utilitário `applyThemeConfig()`
- `src/status_extras.ts` - 34 modelos de restauração predefinidos (pontes, próteses, construções sobre barra)
- `src/i18n/` - traduções (HU/EN/DE/ES/IT/SK/PL/RU/PT-BR) e hook de i18n
- `src/utils/numbering.ts` - conversão de numeração FDI, Universal, Palmer
- `src/registry/` - registro declarativo de eixos clínicos e da UI: metadados de eixos, ativação SVG, matriz tipo×material de restauração, catálogo de valores e listas de opções; os mapeamentos FHIR pertencem a `src/fhir/`
- `src/fhir/` - única fronteira Dental Core para HL7 FHIR R4: codec `toFhirDentalCore.ts`/`fromFhirDentalCore.ts` sobre `@cognovis/fhir-sdk`, `dentalCoreContract.ts` e os auxiliares `dentalCoreLocalCoding.ts`
- `src/bridgeOverlay.ts` - overlay de conector de vão de ponte multi-dente (geometria de vão sensível ao arco)
- `src/SettingsModal.tsx` - diálogo de Configurações por abas (Geral/Painéis/Detalhes do dente/Cárie/Polpa/Notas)
- `src/__tests__/` + `src/registry/__tests__/` - suíte de testes Vitest (864 testes aprovados, 1 ignorado, em 94 arquivos)
- `src/assets/teeth-svgs/` - modelos de dente em SVG (6 arquivos: incisivos, caninos, pré-molares, molares + vistas oclusais)
- `src/assets/icon-svgs/` - SVGs dos ícones da barra de ferramentas (5 arquivos)

### ⚙️ Stack de tecnologia
- React 18 + Vite + TypeScript
- Tailwind CSS para a estilização da interface
- Camadas SVG via manipulação do DOM (estado fora do React para desempenho)
- Sistema de i18n personalizado e leve
- Vitest + Testing Library para testes automatizados
- TypeDoc para a documentação da API
- Alias de caminho do Vite: `@` mapeado para `./src`

### 📝 Observações
- Os modelos SVG são carregados de `src/assets/teeth-svgs` e `src/assets/icon-svgs`, portanto a hospedagem estática precisa servir a pasta pública.
- O motor do odontograma usa o próprio estado interno (não o estado do React) para desempenho e simplicidade.
- Os dentes decíduos têm um conjunto reduzido de materiais disponíveis (sem restaurações de amálgama, sem endodontia com pinos).
- Os dentes com implante têm um conjunto de opções de coroa/pilar diferente dos dentes naturais.

### 📖 Como citar

Se você usar este módulo em seu trabalho, cite-o.

**Esta versão (v1.10.0):**
> Dul, Z. (2026). *React Advanced Odontogram* (v1.10.0). Zenodo. https://doi.org/10.5281/zenodo.21156788

**Todas as versões (DOI do conceito):** https://doi.org/10.5281/zenodo.21156787

Os metadados de citação legíveis por máquina estão em [`CITATION.cff`](../../../CITATION.cff).
