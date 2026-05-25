# Impeccable Integration

Este documento descreve quais padrões do projeto [impeccable](https://github.com/pbakaus/impeccable)
foram adotados no `dev-workflow`, por quê, e o que **não** foi portado.

O impeccable (Paul Bakaus) é um sistema de *design skills* para harnesses de IA, 100% focado em
qualidade de UI front-end: 7 reference files densos por domínio (typography, color/OKLCH, spatial,
motion, interaction, responsive, UX writing), 23 comandos verbais de refino, e — o diferencial mais
único — um **detector determinístico de anti-padrões** (regex + crítica via LLM) que roda como CLI sem
API key e serve de gate de CI.

## Licença e atribuição

O impeccable é licenciado sob **Apache-2.0** e, conforme seu `NOTICE.md`, deriva do *frontend-design
skill* original da Anthropic. Qualquer artefato do dev-workflow derivado do impeccable (conteúdo de
references ou lógica) credita ambos. Não vendorizamos o repositório do impeccable: o detector é chamado
sob demanda via `npx`, então não há cópia de código nem dependência instalada.

## O que foi portado

### Detector determinístico (via wrapper, sem vendoring)

- **`scaffold/scripts/lib/ui-slop-detect.mjs`** — wrapper fino sobre `npx impeccable detect --json`.
  Normaliza a saída (`{antipattern, name, severity, file, line, snippet}`) em
  `{ failOn, summary, blocking, findings }` e retorna exit code 1 quando há findings na severidade
  `--fail-on` (default `error`) ou acima. Ausência do detector não derruba o review (apenas avisa).
- **Integração:** `/dw-review` (em diffs de UI) roda o wrapper e trata findings bloqueantes como
  `REJECTED`; warnings entram no relatório. Complementa o `dw-ui-discipline` (que segue sendo o
  julgamento qualitativo — 4 grounding questions, 14 visual-slop patterns, WCAG floor).

Isso transforma "o LLM *pode* notar slop" em "o gate *pega*" — o gap mais alto que o impeccable expôs.

### References de design mais profundas

Adicionadas a `dw-ui-discipline/references/` (conteúdo autoral creditando a proveniência), e ligadas na
tabela "Required reading by context" do `SKILL.md`:
- `color-oklch.md` — OKLCH, tinted neutrals, escalas, dark mode, contraste.
- `type-scale.md` — modular scale, pairing, measure/line-length, fluid type.
- `motion.md` — easing (anti-bounce), durações, stagger, `prefers-reduced-motion`.
- `responsive.md` — mobile-first, breakpoints, container queries, fluid space, touch.
- `ux-writing.md` — labels verb-led, mensagens de erro, empty states, microcopy.

### Geração de `DESIGN.md`

`/dw-analyze-project` ganhou o **Passo 10 (autoridade de design)**: em projetos frontend, detecta design
tokens (Tailwind theme, CSS vars, MUI/Chakra, shadcn, Storybook) e sintetiza um `DESIGN.md` a partir do
que o projeto JÁ usa — fechando o loop do grounding Q1 do `dw-ui-discipline`, que antes só *lia* a
autoridade e nunca a *criava*. Respeita autoridade existente e nunca edita código de componente.

## O que NÃO foi portado (e por quê)

- **Os 23 comandos verbais separados** (`/bolder`, `/typeset`, `/colorize`, …). O dev-workflow
  consolidou 15→7 comandos na v1.0.0; adicionar 23 inflaria a superfície. Se adotados, virariam **um**
  comando com modos (`/dw-ui <verb>`), não 23 entradas.
- **A CLI publicada standalone do impeccable.** Usamos o detector via `npx` pontualmente, não como
  ferramenta de primeira classe do dev-workflow.
- **`/live` (iteração de variantes no browser) e detecção em URL via Puppeteer.** Alto esforço e
  fragilidade; o foco do dev-workflow em browser foi resiliência no WSL (ver
  [Browser on WSL em playwright-recipes.md](../scaffold/skills/dw-testing-discipline/references/playwright-recipes.md)),
  não iteração visual ao vivo.

## Relação com o dev-workflow

O impeccable cobre **uma fatia** (design/UI) do que o dev-workflow faz (pipeline PRD→PR completo). A
adoção é deliberadamente seletiva: pegamos o detector determinístico (valor único, baixo risco via
wrapper) e enriquecemos o `dw-ui-discipline`, sem transformar o dev-workflow numa ferramenta de design.
