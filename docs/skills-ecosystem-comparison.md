# Skills ecosystem comparison — dev-workflow × mattpocock/skills × ponytail

Análise comparativa entre o `dev-workflow` e dois repositórios de referência de
skills para agentes de código — [`mattpocock/skills`](https://github.com/mattpocock/skills)
(coleção de skills "for real engineers", com distinção explícita entre invocação por
usuário e por modelo) e [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail)
(sistema de minimalismo "lazy senior developer", com decision ladder, modos de
intensidade e hooks de plataforma). O objetivo foi identificar gaps, decidir o que
adotar e integrar as adoções nas convenções do dev-workflow.

> Nota de rigor: este documento compara **padrões de design observáveis na estrutura
> dos repositórios**. Métricas de popularidade/adoção citadas por terceiros não foram
> verificadas na fonte e não são usadas aqui como argumento.

## Contexto

O dev-workflow é um scaffolder de pipeline PRD→PR: 36 comandos, ~24 skills-como-protocolo,
wrappers multi-plataforma (Claude Code, Codex, Copilot, OpenCode), constituição/spec-driven,
gate de segurança de 7 camadas, contratos de Structured Return e governança de contexto
(`load_policy`/`context_limit`). Em profundidade de pipeline e governança ele já é mais
completo que ambos os repos. Os gaps estavam em três disciplinas pontuais que esses repos
exercem bem.

## Tabela de gaps

| Dimensão | dev-workflow (antes) | mattpocock/skills | ponytail | Veredito |
|---|---|---|---|---|
| Minimalismo pré-geração (YAGNI) | parcial: `dw-search-first` (dependências) + `dw-simplification` (pós-fato) | — | **decision ladder + modos lite/full/ultra** | **Adotar** → `dw-minimalism` |
| Controle de invocação de skill | só `name`/`description` nos wrappers | **`disable-model-invocation`** | modos por toggle | **Adotar** → flag `userInvoked` + campo `invocation` |
| Enforcement no harness | prosa (`dw-git-discipline`, `dw-verify`) | `git-guardrails-claude-code` (hook) | hooks `pre_llm_call` + statusline | **Adotar** → hook git-guardrails + statusline |
| Distribuição à-la-carte | só instalador de pipeline | plugin + skills.sh | plugin multi-plataforma | **Adotar** → `.claude-plugin/` gerado do registry |
| Glossário/linguagem de domínio | `.dw/rules` + constitution + concerns | `CONTEXT.md` | — | Já coberto — skip |
| Handoff entre sessões | `/dw-pause` + `.dw/STATE.md` | `/handoff` | — | Já coberto — skip |
| Arquitetura/deep modules | já portado em `dw-simplification` | `improve-codebase-architecture` | — | Já coberto — skip |
| Versionamento multi-skill | pacote npm único | Changesets | Changesets | Não aplicável — skip |
| Definição de comando | markdown + JSON registry | markdown | TOML | Preferência — skip |

## O que foi portado

### 1. `dw-minimalism` — decision ladder pré-geração (de ponytail)

Skill nova (`scaffold/skills/dw-minimalism/SKILL.md`, `kind: protocol`, `tier: core`,
`load_policy: always-small`). Encoda o ladder YAGNI ("precisa existir? → reusar? → stdlib? →
nativo? → dep instalada? → uma linha? → só então o mínimo") e os modos de intensidade
`off`/`lite`/`full`/`ultra` lidos de `.dw/minimalism.json` (default `full`).

É a **rung que faltava** no dev-workflow: roda *antes* de escrever código, compondo com
`dw-search-first` (decisão de dependência: adopt/wrap/compose/build) e com `dw-simplification`
(limpeza preservando comportamento, *depois* que o código existe). Disparada pela seção
"Complementary Skills" de `/dw-run`, `/dw-plan` e `/dw-review`.

Princípio preservado do ponytail: minimalismo é sobre **necessidade**, nunca sobre cortar
correção, validação, segurança ou acessibilidade.

### 2. Controle de invocação (de mattpocock/skills)

No dev-workflow as skills bundled vivem em `.agents/skills/` e são lidas por path (prosa das
"Complementary Skills"); as skills *nativas* do Claude que ele instala em `.claude/skills/`
são os **wrappers de comando**. Logo, `disable-model-invocation` se aplica corretamente aos
wrappers de comando:

- Comandos hidden/internal — os runners (`dw-claude-run`, `dw-codex-run`, `dw-copilot-run`) e
  a mecânica de subtask (`dw-subtask-start/complete/resume`) — recebem `userInvoked: true` em
  `lib/constants.js`. O `PLATFORMS.claude.wrapperTemplate` emite `disable-model-invocation: true`
  no frontmatter, então o modelo nunca auto-dispara (por exemplo) um runner que cria worktree;
  o usuário continua invocando com `/<comando>`.
- O registry ganhou o campo `invocation: model|explicit` (documental para as skills bundled e
  insumo do manifest à-la-carte). Recipe/asset packs (`api-testing-recipes`,
  `docker-compose-recipes`, `remotion-best-practices`, `vercel-react-best-practices`,
  `humanizer`) são marcados `explicit`.

### 3. Hooks de enforcement + statusline (de ponytail + git-guardrails do mattpocock)

Dois scripts em `scaffold/scripts/hooks/` (copiados para `.dw/scripts/hooks/` na instalação):

- `git-guardrails.mjs` — hook `PreToolUse`/Bash que bloqueia comandos destrutivos
  (`git push --force`, `reset --hard`, `clean -f`, `branch -D`, delete de branch remoto).
  Falha *aberta* (qualquer erro permite o comando). Eleva as regras do `dw-git-discipline` de
  prosa para enforcement real.
- `statusline.mjs` — branch + spec ativa + modo de minimalismo.

A escrita em `.claude/settings.json` é feita por `lib/hooks.js` com **reconcile marker-based**:
adiciona nossas entradas se faltarem, atualiza as nossas se o caminho mudar, e **nunca** toca
hooks/statusLine que o usuário definiu (uma statusline custom é respeitada e apenas sinalizada).

### 4. Distribuição à-la-carte (de ambos)

`.claude-plugin/plugin.json` + `marketplace.json` gerados de `scaffold/skill-registry.json` por
`lib/build-plugin.js` (`npm run build:plugin`), publicando apenas as skills marcadas
`exportable: true` (standalone). `lib/validate.js` (`npm run validate`) falha se os manifests
saírem de sincronia com o registry. O instalador de pipeline (`dev-workflow init`) permanece
inalterado — a distribuição à-la-carte é um caminho paralelo, não um substituto.

## O que NÃO foi portado (e por quê)

1. **`CONTEXT.md` / glossário compartilhado (mattpocock)** — já coberto por `.dw/rules/`,
   `.dw/constitution.md` e `.dw/rules/concerns.md`, que carregam linguagem e convenções do
   projeto de forma mais rica.
2. **`/handoff` (mattpocock)** — já coberto por `/dw-pause` + `.dw/STATE.md` (decisões,
   bloqueios, todos, open loops) e `/dw-resume`.
3. **`improve-codebase-architecture` / deep modules (mattpocock)** — já portado para
   `dw-simplification/references/deep-modules.md`.
4. **Changesets (ambos)** — dev-workflow é um pacote npm único; versionamento multi-skill
   independente não se aplica.
5. **Comandos em TOML (ponytail)** — a fonte da verdade do dev-workflow é markdown +
   `skill-registry.json`/`agent-registry.json`; converter não traria ganho.
6. **Hooks por-plataforma para Codex/Copilot/OpenCode (ponytail)** — o gate de hook foi
   limitado ao Claude Code (único alvo com `settings.json` hoje). Os `*-hooks.json` por
   plataforma ficam como follow-up documentado, não nesta rodada.

## Mapeamento de arquivos

| Item | Arquivo dev-workflow | Origem |
|---|---|---|
| Skill de minimalismo | `scaffold/skills/dw-minimalism/SKILL.md` | ponytail (decision ladder + modos) |
| Entrada de registry | `scaffold/skill-registry.json` (`dw-minimalism`, `invocation`, `exportable`) | — |
| Validação de campos | `lib/skill-registry.js` (`invocation`/`exportable`) | — |
| Flag de invocação | `lib/constants.js` (`userInvoked`) + `PLATFORMS.claude.wrapperTemplate` | mattpocock (`disable-model-invocation`) |
| Propagação do wrapper | `lib/wrappers.js` | — |
| Hook git-guardrails | `scaffold/scripts/hooks/git-guardrails.mjs` | mattpocock `git-guardrails-claude-code` + `dw-git-discipline` |
| Statusline | `scaffold/scripts/hooks/statusline.mjs` | ponytail statusline |
| Reconcile de settings | `lib/hooks.js` | — |
| Seed init-only do modo | `.dw/minimalism.json` (via `lib/init.js`) | — |
| Manifests à-la-carte | `.claude-plugin/plugin.json` + `marketplace.json` via `lib/build-plugin.js` | ambos |
| Gate do repo | `lib/validate.js` (`npm run validate`) | — |
| Checagens de saúde | `lib/doctor.js` (`checkHooks`) | — |

## Segurança do update

Tudo foi desenhado para o `dev-workflow update` aplicar in-place sem quebrar o usuário:
a skill nova e os scripts de hook são recopiados (managed, sobrescritos); o registry e os
wrappers são regenerados; `.dw/minimalism.json` é seed init-only e preservado no update e no
uninstall; as entradas de hook/statusline são reconciliadas por marcador (atualizadas se nossas,
intocadas se do usuário) e removidas só as nossas no uninstall; o snapshot do `/dw-update`
agora inclui `.claude/settings.json`. Regra append-only: remoções/renames futuros entram em
`lib/removed-bundled-skills.js`.

## Licença e atribuição

Ambos os repositórios de referência são MIT. As adoções preservam os créditos:

- `DietrichGebert/ponytail` (MIT, 2026 Dietrich Gebert) — decision ladder, modos de
  intensidade e statusline, na base de `dw-minimalism` e do `statusline.mjs`.
- `mattpocock/skills` (MIT) — distinção user/model-invoked (`disable-model-invocation`) e
  `git-guardrails-claude-code`, na base do controle de invocação e do hook git-guardrails.

A atribuição também consta no `SKILL.md` de `dw-minimalism`, no `README.md` (Acknowledgements)
e nos cabeçalhos dos scripts de hook.
