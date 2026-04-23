# Compozy Integration

Este documento descreve quais padrões do projeto [Compozy](https://github.com/compozy/compozy) foram adotados no `dev-workflow`, por que, e o que **não** foi portado.

Compozy é um orquestrador em Go (`/tmp/compozy` no repositório-fonte da análise) com disciplina muito rigorosa de enforcement de protocolos — *hard gates*, *evidence-before-claims*, memory discipline, ADRs linkados e council multi-advisor. Ao revisar o Compozy, identificamos três primitivas de alto valor que podem ser adotadas sem reescrever o dev-workflow.

## Filosofia portada

> **Skills não são guidance — elas são protocolos executáveis.**

O dev-workflow historicamente distribui prompts e templates. O Compozy trata skills como contratos executáveis: "não é permitido chegar neste estado sem ter cumprido aquele passo". Adotamos essa filosofia onde faz sentido, sem transformar o dev-workflow em Compozy.

## O que foi portado

### Primitivas bundled (chamadas internamente)

| Skill dev-workflow | Origem Compozy | Papel |
|--------------------|----------------|-------|
| `dw-verify` | [`cy-final-verify`](https://github.com/compozy/compozy) | Iron Law — nenhuma claim de sucesso sem VERIFICATION REPORT fresco |
| `dw-memory` | [`cy-workflow-memory`](https://github.com/compozy/compozy) | Memory em dois níveis (shared + task-local) com promotion test e compaction |
| `dw-review-rigor` | [`cy-review-round`](https://github.com/compozy/compozy) | De-duplication, severity ordering, verify-intent-before-flag, signal-over-volume |
| `dw-council` | [`cy-idea-factory`](https://github.com/compozy/compozy) council + archetypes | Debate multi-advisor (3-5 archetypes) com steel-manning, concession tracking e synthesis que preserva dissent. Opt-in via `--council`. |

### Padrões injetados em commands existentes

- **Hard gates**: `dw-create-techspec` (bloqueia se PRD tem Open Questions abertas); `dw-generate-pr` (bloqueia se sessão não tem `dw-verify` PASS); `dw-fix-qa` (bloqueia mudança de status sem reteste + verify).
- **Circular dependency detection**: `dw-create-tasks` faz grafo de deps e aborta se houver ciclo — antes de escrever `tasks.md`.
- **Codebase-aware task enrichment**: `dw-create-tasks` dispatcha `Agent Explore` em paralelo para preencher Relevant Files / Dependent Files / Related Rules em cada task (aditivo, não bloqueia).
- **De-duplication em review**: `dw-code-review`, `dw-review-implementation`, `dw-refactoring-analysis` aplicam as 5 regras de `dw-review-rigor` para evitar N findings idênticos em N arquivos.
- **Memory thread**: `dw-run-task`, `dw-run-plan`, `dw-autopilot`, `dw-resume`, `dw-revert-task` usam `dw-memory` para persistir contexto cross-task com discipline.

### Novos commands

- **`dw-adr`**: inspirado em `cy-create-adr` do Compozy. Registra Architecture Decision Records em `.dw/spec/<prd>/adrs/`. Templates PRD/TechSpec/Task ganharam seção opcional "Related ADRs".
- **`dw-revert-task`**: não tem análogo no Compozy. Preencheu gap nativo do dev-workflow: rollback seguro de commits de uma task com verificação de dependências.

### Schema versioning

Templates de PRD, TechSpec, Task, Tasks-index e ADR ganharam frontmatter YAML com `schema_version: "1.0"`. Isso permite evolução futura sem breaking — mirror de como Compozy versiona artifacts v2.

## O que NÃO foi portado (e por quê)

### `the-thinker` archetype (problem-framing questioner)

Compozy tem seis archetypes; o `dw-council` foi entregue com **cinco**: pragmatic-engineer, architect-advisor, security-advocate, product-mind, devils-advocate.

**O que não foi portado**: o archetype `the-thinker` (que questiona o framing do problema antes do debate). Razões:
- Manter roster enxuto no release inicial
- Na prática, o `devils-advocate` já cobre boa parte dessa função ao expor hidden assumptions
- Pode ser adicionado em release futuro se houver demanda (basta criar `scaffold/skills/dw-council/agents/the-thinker.md` e atualizar o roster no SKILL.md)

### Host-owned `run_agent` registry

Compozy dispatcha archetypes por id através de um `run_agent` tool com registry sob `~/.compozy/agents/`. **Não portado**: dev-workflow usa o tool `Task` nativo do Claude Code/Codex para dispatchar subagents, lendo os archetypes diretamente de `scaffold/skills/dw-council/agents/*.md`. Mais simples, sem precisar de setup adicional.

### Runtime extension system (Go SDK + TypeScript SDK)

Compozy tem um sistema de extensões com HostAPIService, hooks de lifecycle, event streaming via SSE/UDS etc. **Não portado** porque:
- dev-workflow é scaffolder de prompts, não runtime de agente
- Complexidade arquitetural desproporcional ao benefício
- Hooks do Claude Code já resolvem a maior parte dos use cases de automação

### Artifact-driven daemon state

Compozy separa workspace (artifacts editáveis) de daemon (run state em SQLite). **Não portado**: dev-workflow persiste tudo em `.dw/` sem daemon. A separação só faz sentido se houver execução detach/attach com múltiplos clients, o que não é caso de uso do dev-workflow.

### Review provider abstraction (CodeRabbit bridge etc.)

Compozy tem adapters para review providers externos. **Não portado**: dev-workflow já suporta review via MCP/Playwright e `dw-code-review` manual; adicionar provider bridging seria escopo fora do PRD→PR loop.

### Executáveis e scripts binários do Compozy

**Nada** do Compozy é executado em runtime pelo dev-workflow. Todos os ports são textuais (markdown + prompts). Se em algum momento surgir a necessidade, é decisão arquitetural que será discutida com o mantenedor antes de implementar.

## Mapeamento de arquivos (referência)

| dev-workflow (novo/modificado) | Compozy (origem do padrão) |
|--------------------------------|----------------------------|
| `scaffold/skills/dw-verify/SKILL.md` | `/tmp/compozy/.agents/skills/cy-final-verify/SKILL.md` |
| `scaffold/skills/dw-memory/SKILL.md` | `/tmp/compozy/.agents/skills/cy-workflow-memory/SKILL.md` |
| `scaffold/skills/dw-review-rigor/SKILL.md` | `/tmp/compozy/.agents/skills/cy-review-round/SKILL.md` |
| `scaffold/pt-br/commands/dw-adr.md` + EN | `/tmp/compozy/.agents/skills/cy-create-adr/` (referencial) |
| `scaffold/*/commands/dw-create-tasks.md` (circular-dep + enrichment) | `/tmp/compozy/.agents/skills/cy-create-tasks/SKILL.md` |
| Templates com `schema_version` | Frontmatter v2 dos artifacts Compozy |
| `scaffold/skills/dw-council/SKILL.md` | `/tmp/compozy/.agents/skills/cy-idea-factory/references/council.md` |
| `scaffold/skills/dw-council/agents/*.md` | `/tmp/compozy/extensions/cy-idea-factory/agents/*/AGENT.md` |

## Contribuir para o Compozy

O projeto Compozy é mantido em aberto. Se você é usuário do dev-workflow e quer entender a inspiração profundamente, vale explorar:

- Skills: `.agents/skills/` no repositório Compozy
- Orchestrator pattern: `internal/core/kernel/`
- Archetypes: `extensions/cy-idea-factory/agents/`

## Licença e atribuição

Os ports são adaptações conceituais e textuais. Créditos ao projeto Compozy por fornecer padrões de referência bem pensados. Onde aplicável, cada skill portada inclui uma seção `## Inspired by` com link para o arquivo de origem.

## Commands dev-workflow-native (não Compozy-inspired)

Nem tudo no dev-workflow vem do Compozy. Alguns commands são nativos — preenchem gaps do próprio dev-workflow ou foram inspirados em skills do ecosistema skills.sh.

- **`/dw-revert-task`** — sem análogo no Compozy. Padrão próprio, motivado pela necessidade de revert seguro de task com dependency checks.
- **`/dw-security-check`** — dev-workflow-native. Conceitualmente inspirado em skills pesquisadas via `/find-skills` no skills.sh (`supercent-io/skills-template@security-best-practices`, `hoodini/ai-agents-skills@owasp-security`, `github/awesome-copilot@agent-owasp-compliance`) — mas implementado do zero com integração nativa a **Trivy** (SCA/IaC scanner não presente em Compozy), às primitivas `dw-verify`/`dw-review-rigor`/`security-review`, e a Context7 MCP para best practices de framework. Suporta **TypeScript, Python, C# e Rust** na release inicial.

- **`/dw-brainstorm` (product-aware upgrade)** — conceitualmente inspirado em [`addyosmani/agent-skills@idea-refine`](https://skills.sh/addyosmani/agent-skills/idea-refine) (Addy Osmani, Google — 1.4K+ installs), surfaced via `/find-skills`. **Adaptação crítica**: enquanto `idea-refine` lê `src/*` com Glob/Grep/Read, o `/dw-brainstorm` lê **PRDs + rules + intel** para mapear o **inventário de features do produto** — mantendo o brainstorm em nível de produto, não de código. Adicionamos classificação dev-workflow-nativa (IMPROVES/CONSOLIDATES/NEW) que força a discussão "feature nova vs consolidação vs melhoria" antes do PRD. O one-pager durável em `.dw/spec/ideas/<slug>.md` encaixa no pipeline existente: `/dw-create-prd` aceita como input e reduz perguntas de 7 para 4.
