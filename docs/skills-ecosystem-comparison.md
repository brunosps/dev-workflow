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
| Intake triage | `/dw-bugfix` tria bug vs feature depois que o pedido já entrou no fluxo de bugfix | `triage` como on-ramp issue-tracker-first, com labels como estado | — | **Adotar com adaptação forte** → `/dw-triage` local-first em `.dw/` |
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

### 5.1. Decision Map durável (de `wayfinder`, mattpocock)

A skill [`skills/productivity/wayfinder`](https://github.com/mattpocock/skills/blob/main/skills/productivity/wayfinder/SKILL.md)
inspirou o registro durável de progresso nebuloso: um mapa de decisões com dependências, fronteira explícita do
que pode ser feito agora e uma zona de "fog" para o que se sabe que falta descobrir mas ainda não virou decisão
formulável. No dev-workflow isso foi adotado dentro do one-pager do Grill, em `### Decision Map`, usando
`Depends on:` + `State` + `Frontier` + `Decision Fog`.

Foi deliberadamente rejeitado portar o issue tracker como substrato de persistência, transformar decisões em
tickets/issues, claim por assignee e coordenação de sessões concorrentes. O contrato local continua
single-owner/single-session e local-first, porque a lacuna corrigida é retomada durável entre sessões do Grill,
não orquestração multi-agente.

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

### 8. Loop test-first sob demanda em `dw-testing-discipline` (de mattpocock)

Adotada a técnica operacional de loop TDD estrito do [`mattpocock/skills`](https://github.com/mattpocock/skills)
sem copiar a skill upstream: `scaffold/skills/dw-testing-discipline/references/tdd-loop.md`
define confirmar a seam pública com o usuário antes do primeiro teste, escrever **um** teste
vermelho por slice, executar e observar o vermelho real, implementar o mínimo para verde,
executar e observar o verde, e só então avançar para o próximo slice.

O `/dw-run` ganhou um gatilho explícito nas versões EN/PT: só usa esse modo quando a task ou o
usuário pede `TDD`, `test first` ou `red-green-refactor`. O default continua sendo a disciplina
existente: placement doctrine, seis agent guardrails, anti-patterns, testes em camada adequada e
sem teste de internals.

Rejeitado: tornar TDD o modo padrão do executor, escrever baterias de testes antes da primeira
implementação, tratar refactor como parte do ciclo red-green, afrouxar mocks para acelerar o
loop, ou testar private helpers. Onde o padrão upstream é mais estreito que o nosso, prevalecem
as seis regras centrais do `dw-testing-discipline`; o `tdd-loop` é um modo de operação dentro
delas, não uma substituição.

### 9. Loop red-capable em `dw-debug-protocol` (de mattpocock)

Adotada a técnica de não teorizar antes de existir um loop de feedback red-capable, atribuída ao
[`mattpocock/skills`](https://github.com/mattpocock/skills), dentro do passo "Reproduce" do
six-step triage. `scaffold/skills/dw-debug-protocol/references/six-step-triage.md` agora define
o contrato do loop: único, determinístico o bastante, rápido, executável pelo agente e comprovado
vermelho agora. Também inclui repertório de loops (teste focado, `curl`, CLI, browser headless,
trace replay, harness dedicado, fuzz/repeat, `git bisect`, teste diferencial) e template HITL
para pedir credencial, hardware, fixture, trace ou ação manual quando o agente não consegue rodar
o loop sozinho.

O `/dw-bugfix` EN/PT agora exige que `fix-report.md` registre `Loop command before fix` e
`Loop command after fix`, ou, quando não houver loop executável, as tentativas e o pedido explícito
de artefato/acesso. A regra vale para bug não trivial e para qualquer caso em que a primeira
tentativa de fix falhe; bug trivial com reprodução óbvia e fix cirúrgico não paga a checklist
completa.

Rejeitado: transformar todo bug de uma linha em papelada, substituir o six-step triage, seguir
no escuro quando o loop depende de input humano, instrumentar várias variáveis de uma vez, ou
deixar logs temporários sem prefixo removível. A estratégia de bugs não-reprodutíveis continua
coerente com isso: primeiro instrumenta para obter evidência/reprodução, depois corrige; guesses
só entram pelo caminho explicitamente reconhecido e monitorado.

### 10. `/dw-triage` — intake local-first antes do pipeline (de mattpocock)

Adotada a técnica da skill `triage` de [`mattpocock/skills`](https://github.com/mattpocock/skills)
(MIT): um on-ramp para trabalho que chega de fora, com categoria, estado, checagem de redundância,
checagem de rejeições anteriores, checkpoint do dono, e roteamento para o próximo fluxo. A ideia
central veio do upstream, onde `triage` move issues por uma máquina de estados baseada em papéis
como `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human` e `wontfix`; o setup do
upstream também registra que o issue tracker e as labels são a camada de estado compartilhada.

No dev-workflow a adaptação é deliberadamente diferente: o substrato canônico é `.dw/` versionado,
não labels/comentários de tracker. O novo comando escreve um registro por item em
`.dw/triage/NNN-<slug>.md`, cria memória de rejeições em `.dw/out-of-scope/<concept>.md` apenas
para conceitos rejeitados, e trata GitHub (`gh`) como enriquecimento opcional de leitura. O comando
funciona 100% offline a partir de paste, arquivo local ou argumento explícito; se `gh` não existir,
não houver autenticação ou o remote não for GitHub, ele pede texto/diff local e continua.

Vocabulário adotado:

- `ready-for-work` substitui `ready-for-agent`, porque no pipeline daqui a execução passa por
  `/dw-bugfix` ou `/dw-plan prd` antes de chegar a `/dw-run`; "agent-ready" seria preciso demais
  para o ponto errado do fluxo.
- `needs-human` substitui `ready-for-human`, porque o estado não significa "pronto para uma pessoa
  implementar", e sim "não delegável com segurança ainda" por decisão de design, acesso externo,
  julgamento, ownership ou teste manual.

Rejeitado: portar literalmente labels de GitHub como fonte da verdade, prometer Linear/Jira/GitLab
sem ferramenta instalada, sincronizar automaticamente tracker ↔ `.dw/`, criar webhook/daemon,
escrever comentários/labels/fechamentos remotos como efeito colateral, ou registrar
"já implementado" em `.dw/out-of-scope/**`. Pedido já atendido vira `wontfix` no registro de
triagem, apontando onde vive a implementação; out-of-scope fica reservado para rejeições reais com
motivo durável.


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
| Comando de intake triage | `scaffold/{en,pt-br}/commands/dw-triage.md` + templates `triage-*` | mattpocock (`triage`) |
| Loop test-first sob demanda | `scaffold/skills/dw-testing-discipline/references/tdd-loop.md` + `scaffold/{en,pt-br}/commands/dw-run.md` | mattpocock (TDD loop estrito) |
| Loop red-capable de debug | `scaffold/skills/dw-debug-protocol/references/six-step-triage.md` + `scaffold/{en,pt-br}/commands/dw-bugfix.md` | mattpocock (feedback loop antes de teorizar) |
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
  `CONTEXT-FORMAT.md` + `ADR-FORMAT.md`) / `triage`, na base do controle de invocação, do hook git-guardrails,
  do Grill nativo (`dw-grilling` + `dw-domain-modeling`) e da borda `/dw-triage`. Comportamento reimplementado
  na nossa voz; nenhuma prosa upstream copiada.

A atribuição também consta no `SKILL.md` de `dw-minimalism`, no `README.md` (Acknowledgements)
e nos cabeçalhos dos scripts de hook.
