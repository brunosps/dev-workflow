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

### `cy-idea-factory` (council de archetypes)

Compozy tem skill `council` com 5 archetypes (pragmatic-engineer, architect-advisor, security-advocate, product-mind, devils-advocate) que debatem decisões high-stakes com *steel-manning* obrigatório e *concession tracking*.

**Status**: planejado para **Fase 4** (opcional). Será adicionado como skill bundled `dw-council` com flag `--council` em `dw-brainstorm` e `dw-create-techspec` — **não** como command visível. Decisão adiada porque:
- Fundação (verify/memory/review-rigor) precisa estabilizar primeiro
- Valor marginal para a maioria dos fluxos; valor alto só em decisões arquiteturais grandes
- Complexidade de orquestrar 3-5 subagents paralelos justifica implementação cuidadosa

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

## Contribuir para o Compozy

O projeto Compozy é mantido em aberto. Se você é usuário do dev-workflow e quer entender a inspiração profundamente, vale explorar:

- Skills: `.agents/skills/` no repositório Compozy
- Orchestrator pattern: `internal/core/kernel/`
- Archetypes: `extensions/cy-idea-factory/agents/`

## Licença e atribuição

Os ports são adaptações conceituais e textuais. Créditos ao projeto Compozy por fornecer padrões de referência bem pensados. Onde aplicável, cada skill portada inclui uma seção `## Inspired by` com link para o arquivo de origem.
