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
| Glossário/linguagem de domínio | `.dw/rules` + constitution + concerns | `CONTEXT.md` + `CONTEXT-MAP.md` (domain-modeling) | — | **Adotar** → Grill nativo (`dw-grilling` + `dw-domain-modeling`) + `.dw/domain/` |
| Entrevista de alinhamento (grilling) | grill como modo de prosa | `grill-with-docs` + `grilling` (skills dedicadas) | — | **Adotar** → sessão stateful nativa com decision tree + gate |
| Handoff entre sessões | `/dw-pause` + `.dw/STATE.md` | `/handoff` | — | Já coberto — skip |
| Review avulso por ref | `/dw-review` fixo na base branch/PRD | fixed point validado antes da análise | — | **Adotar** → `/dw-review --since <ref>` |
| Arquitetura/deep modules | checklist base em `dw-simplification` | categorias de dependência + Design It Twice | — | **Adotar parcialmente** → aprofundamento condicional em deep-modules |
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

### 5. Grill nativo — entrevista de alinhamento + domain modeling (de mattpocock)

Reimplementação nativa (na nossa voz, sem copiar prosa upstream) de três skills do
[`mattpocock/skills`](https://github.com/mattpocock/skills) (MIT):

- [`skills/engineering/grill-with-docs`](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md)
- [`skills/productivity/grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)
- [`skills/engineering/domain-modeling`](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md)
  (+ `CONTEXT-FORMAT.md` e `ADR-FORMAT.md`)

O comportamento vira o modo `grill` do `/dw-brainstorm`, apoiado em duas skills bundled **internas e
não-exportadas**: `dw-grilling` (árvore de decisão ordenada por dependência, exatamente uma decisão por turn com
resposta recomendada, fatos descobertos e não perguntados, gate de shared-understanding) e `dw-domain-modeling`
(vocabulário canônico, desafio de termos vagos/sobrecarregados, cross-check com o código, política de ADR raro).
Ambas registradas em `skill-registry.json` com `exportable: false` (não entram no manifest à-la-carte) e o
contrato de Structured Return exigido pelo `lib/skill-registry.js`.

Diferenças intencionais do `.dw/`:

- Glossário em **`.dw/domain/**`** (`glossary.md`, ou `context-map.md` + `contexts/<slug>.md`), **não** no
  `CONTEXT.md`/`CONTEXT-MAP.md` da raiz do upstream nem no `.dw/rules/` auto-gerado (que é análise do código).
- Grill é **stateful e mutante** → exige **uma autorização explícita** antes de iniciar a sessão ou escrever;
  `grill` e `option-matrix` são mutuamente exclusivos (option-matrix vira fase posterior separada, se oferecida).
- Alinhamento produz um one-pager de ideia no **schema `1.1`** (Resolved Decisions, Evidence, Canonical
  Vocabulary, Remaining Decisions, Alignment State) consumido pelo `/dw-plan` sem re-perguntar decisões resolvidas.
- ADRs roteados por `/dw-adr --scope=repo|prd`, gated no teste 3-critérios com aprovação explícita separada.
- `/dw-analyze-project` lê e linka `.dw/domain/**` e **preserva** (nunca regenera nem sobrescreve).

### 6. `/dw-review --since <ref>` — ponto fixo verificado antes do review (de mattpocock)

Adaptação da técnica observada em `mattpocock/skills`: antes de analisar um diff avulso, exigir um ponto de
comparação explícito e validá-lo. No dev-workflow isso virou flag opt-in no comando existente
`/dw-review --since <ref>`:

- valida o ref com `git rev-parse --verify --quiet <ref>^{commit}`;
- monta o diff reproduzível com `git diff <ref>...HEAD`;
- lista o range com `git log <ref>..HEAD --oneline`;
- aborta com mensagem acionável quando o ref não resolve ou quando o diff está vazio;
- registra o comando de diff efetivo nos relatórios de coverage, code review e consolidado.

Foi adotado o **three-dot** para preservar a semântica de review de PR: revisar o que `HEAD` mudou desde o
merge-base com o ref verificado, sem incluir mudanças que existam apenas no ref. O fluxo default de
`/dw-review` contra a base branch não foi alterado.

Rejeitado: criar comando separado para review avulso ou trocar o comportamento default de `dw-review`.

### 7. Deep-modules avançado — categoria de dependência + Design It Twice (de mattpocock)

Adaptação parcial de técnicas de arquitetura de `mattpocock/skills`, sem copiar a skill upstream e sem criar
nova skill. O material foi incorporado ao arquivo existente
`scaffold/skills/dw-simplification/references/deep-modules.md`:

- categorias de dependência (`in-process`, `local-substitutable`, `remote owned`, `true external`) que guiam a
  estratégia de teste da seam;
- alinhamento explícito com `dw-testing-discipline`: mocks isolam fronteiras, sistemas reais validam antes do
  merge, e qualquer conflito aparente é resolvido a favor de `dw-testing-discipline`;
- loop local de **Design It Twice** para gerar 3+ interfaces radicalmente diferentes antes de fechar uma seam.

`/dw-refactor` carrega esse aprofundamento apenas quando o finding sobrevivente é interface rasa, vazamento de
interface ou seam no lugar errado. O council não foi usado como mecanismo default porque `dw-council` é mais caro
e voltado a decisões de produto/arquitetura high-stakes com múltiplas prioridades; a comparação de alternativas de
interface é um loop local e específico. Council segue disponível só quando a interface também muda comportamento de
produto, fronteiras de ownership, postura de segurança ou decisão arquitetural difícil de reverter.

Rejeitado: copiar a skill completa de arquitetura, criar skill nova, reescrever `deep-modules.md`, ou exigir o
loop de alternativas para refactors simples sem finding de seam/interface.

## O que NÃO foi portado (e por quê)

1. **`CONTEXT.md` na raiz (mattpocock)** — a *disciplina* de domain-modeling FOI adotada (seção 5 acima), mas o
   glossário curado vive em `.dw/domain/**`, não num `CONTEXT.md` na raiz; `.dw/rules/`, `.dw/constitution.md` e
   `.dw/rules/concerns.md` continuam sendo análise/princípios auto-gerados, separados do vocabulário curado.
2. **`/handoff` (mattpocock)** — já coberto por `/dw-pause` + `.dw/STATE.md` (decisões,
   bloqueios, todos, open loops) e `/dw-resume`.
3. **`improve-codebase-architecture` completa (mattpocock)** — não foi copiada. O dev-workflow manteve
   `dw-simplification/references/deep-modules.md` como fonte local e adotou apenas as técnicas aprovadas:
   categorias de dependência, teste derivado da categoria e Design It Twice condicional.
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
| Gate do repo | `lib/validate.js` (`npm run validate`) + suíte `node:test` (`npm test`) | — |
| Checagens de saúde | `lib/doctor.js` (`checkHooks`) | — |
| Skill de grilling | `scaffold/skills/dw-grilling/SKILL.md` (+ references) | mattpocock (grilling / grill-with-docs) |
| Skill de domain-modeling | `scaffold/skills/dw-domain-modeling/SKILL.md` (+ references) | mattpocock (domain-modeling) |
| Modo grill nativo | `scaffold/{en,pt-br}/commands/dw-brainstorm.md` | — |
| Artefatos de domínio | `.dw/domain/**` (criados lazy pelo grill autorizado) | — |
| One-pager schema 1.1 | `scaffold/{en,pt-br}/templates/idea-onepager.md` | — |
| Roteamento de ADR | `scaffold/{en,pt-br}/commands/dw-adr.md` (`--scope=repo\|prd`) | mattpocock (ADR-FORMAT) |

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
- `mattpocock/skills` (MIT) — distinção user/model-invoked (`disable-model-invocation`),
  `git-guardrails-claude-code`, e as skills `grill-with-docs` / `grilling` / `domain-modeling` (com
  `CONTEXT-FORMAT.md` + `ADR-FORMAT.md`), na base do controle de invocação, do hook git-guardrails e do Grill
  nativo (`dw-grilling` + `dw-domain-modeling`). Comportamento reimplementado na nossa voz; nenhuma prosa upstream
  copiada.

A atribuição também consta no `SKILL.md` de `dw-minimalism`, no `README.md` (Acknowledgements)
e nos cabeçalhos dos scripts de hook.
