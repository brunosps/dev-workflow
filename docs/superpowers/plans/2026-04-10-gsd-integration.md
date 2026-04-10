# GSD Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate get-shit-done-cc as optional runtime engine into dev-workflow, adding resume, design contracts, plan verification, quick tasks, parallel execution, and codebase intelligence.

**Architecture:** GSD is an optional npm dependency installed by `install-deps`. Each dw-* command checks for GSD availability at runtime and delegates specific features. Without GSD, all commands degrade gracefully to current behavior. New commands `/dw-resume`, `/dw-quick`, and `/dw-intel` are added.

**Tech Stack:** Node.js, Markdown-driven commands, get-shit-done-cc (MIT), multi-platform wrappers (Claude, Agents, OpenCode)

---

## Task 1: Add GSD to install-deps

**Files:**
- Modify: `lib/install-deps.js`

- [ ] **Step 1: Add GSD to the deps array**

In `lib/install-deps.js`, add after the React Doctor entry:

```javascript
{
  name: 'GSD (Get Shit Done)',
  check: null,
  install: 'npx get-shit-done-cc@latest --claude --local -y',
},
```

- [ ] **Step 2: Verify install-deps loads**

Run: `node -e "require('./lib/install-deps')"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/install-deps.js
git commit -m "feat: add get-shit-done-cc as optional dependency"
```

---

## Task 2: Create `/dw-resume` command (PT-BR + EN)

**Files:**
- Create: `scaffold/pt-br/commands/dw-resume.md`
- Create: `scaffold/en/commands/dw-resume.md`
- Modify: `lib/constants.js`

- [ ] **Step 1: Create PT-BR command**

Create `scaffold/pt-br/commands/dw-resume.md`:

```markdown
<system_instructions>
Voce e um assistente de continuidade de sessao. Este comando existe para restaurar contexto da ultima sessao e sugerir o proximo passo do workflow.

<critical>Este comando e somente leitura. NAO modifique codigo, NAO execute tasks, NAO crie arquivos. Apenas analise o estado e recomende o proximo passo.</critical>

## Quando Usar
- Use ao iniciar uma nova sessao para retomar de onde parou
- Use quando nao souber qual comando executar em seguida
- NAO use no meio de uma execucao de task ou plano

## Posicao no Pipeline
**Antecessor:** (inicio de sessao) | **Sucessor:** qualquer comando dw-*

## Comportamento Obrigatorio

1. Leia `.dw/spec/` e identifique PRDs com tasks pendentes (checkboxes `- [ ]` em tasks.md)
2. Leia `git log --oneline -10` para identificar o ultimo trabalho realizado
3. Identifique a branch ativa e se ha mudancas nao commitadas
4. Cruze: ultimo PRD ativo, ultima task completada, proxima task pendente
5. Apresente o resumo no formato abaixo
6. Sugira o proximo comando a executar

## Integracao GSD

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- Delegue para `/gsd-resume-work` para restaurar estado cross-sessao de `.planning/STATE.md`
- Incorpore contexto adicional: threads persistentes, backlog, notas

Se o GSD NAO estiver instalado:
- Use apenas `.dw/spec/` e git log como fontes de contexto
- Funcionalidade completa, apenas sem persistencia cross-sessao avancada

## Formato de Resposta

### Resumo da Sessao
- **Ultimo trabalho**: [tempo atras], branch [nome]
- **PRD ativo**: [nome do PRD]
- **Tasks**: [N completadas] de [total]
- **Ultima task completada**: [nome]
- **Proxima task pendente**: [nome]
- **Bloqueios**: [dependencias nao resolvidas, se houver]
- **Mudancas nao commitadas**: [sim/nao]

### Proximo Passo Sugerido
- Comando: `/dw-[comando] [argumentos]`
- Motivo: [por que este e o proximo passo logico]

## Heuristicas

- Se ha mudancas nao commitadas, sugira `/dw-commit` primeiro
- Se todas as tasks estao completas, sugira `/dw-code-review` ou `/dw-run-qa`
- Se nao ha PRD ativo, sugira `/dw-brainstorm` ou `/dw-create-prd`
- Se ha tasks pendentes, sugira `/dw-run-task` ou `/dw-run-plan`
- Se a ultima task falhou, sugira investigar o erro antes de continuar

## Encerramento

Ao final, deixe o usuario pronto para executar o proximo comando com um unico copy-paste.

</system_instructions>
```

- [ ] **Step 2: Create EN command**

Create `scaffold/en/commands/dw-resume.md`:

```markdown
<system_instructions>
You are a session continuity assistant. This command exists to restore context from the last session and suggest the next workflow step.

<critical>This command is read-only. Do NOT modify code, do NOT execute tasks, do NOT create files. Only analyze state and recommend the next step.</critical>

## When to Use
- Use when starting a new session to pick up where you left off
- Use when unsure which command to run next
- Do NOT use in the middle of a task or plan execution

## Pipeline Position
**Predecessor:** (session start) | **Successor:** any dw-* command

## Required Behavior

1. Read `.dw/spec/` and identify PRDs with pending tasks (`- [ ]` checkboxes in tasks.md)
2. Read `git log --oneline -10` to identify the last work performed
3. Identify the active branch and whether there are uncommitted changes
4. Cross-reference: last active PRD, last completed task, next pending task
5. Present the summary in the format below
6. Suggest the next command to execute

## GSD Integration

If GSD (get-shit-done-cc) is installed in the project:
- Delegate to `/gsd-resume-work` for cross-session state restoration from `.planning/STATE.md`
- Incorporate additional context: persistent threads, backlog, notes

If GSD is NOT installed:
- Use only `.dw/spec/` and git log as context sources
- Full functionality, just without advanced cross-session persistence

## Response Format

### Session Summary
- **Last work**: [time ago], branch [name]
- **Active PRD**: [PRD name]
- **Tasks**: [N completed] of [total]
- **Last completed task**: [name]
- **Next pending task**: [name]
- **Blockers**: [unresolved dependencies, if any]
- **Uncommitted changes**: [yes/no]

### Suggested Next Step
- Command: `/dw-[command] [arguments]`
- Reason: [why this is the logical next step]

## Heuristics

- If there are uncommitted changes, suggest `/dw-commit` first
- If all tasks are complete, suggest `/dw-code-review` or `/dw-run-qa`
- If no active PRD, suggest `/dw-brainstorm` or `/dw-create-prd`
- If there are pending tasks, suggest `/dw-run-task` or `/dw-run-plan`
- If the last task failed, suggest investigating the error before continuing

## Closing

At the end, leave the user ready to execute the next command with a single copy-paste.

</system_instructions>
```

- [ ] **Step 3: Add to constants.js**

In `lib/constants.js`, add to the `en` array (alphabetically, between `dw-redesign-ui` and `dw-refactoring-analysis`):

```javascript
{ name: 'dw-resume', description: 'Restore session context and suggest the next workflow step' },
```

Add to the `pt-br` array (same position):

```javascript
{ name: 'dw-resume', description: 'Restaurar contexto da sessao e sugerir o proximo passo do workflow' },
```

- [ ] **Step 4: Verify constants load**

Run: `node -e "const c = require('./lib/constants'); console.log(c.COMMANDS.en.find(cmd => cmd.name === 'dw-resume'))"`
Expected: `{ name: 'dw-resume', description: '...' }`

- [ ] **Step 5: Commit**

```bash
git add scaffold/pt-br/commands/dw-resume.md scaffold/en/commands/dw-resume.md lib/constants.js
git commit -m "feat: add /dw-resume command for session continuity"
```

---

## Task 3: Create `/dw-quick` command (PT-BR + EN)

**Files:**
- Create: `scaffold/pt-br/commands/dw-quick.md`
- Create: `scaffold/en/commands/dw-quick.md`
- Modify: `lib/constants.js`

- [ ] **Step 1: Create PT-BR command**

Create `scaffold/pt-br/commands/dw-quick.md`:

```markdown
<system_instructions>
Voce e um executor de tasks rapidas. Este comando existe para implementar mudancas pontuais com garantias do workflow (validacao, commit atomico) sem precisar de PRD completo.

<critical>Este comando e para mudancas pequenas e bem definidas. Se a mudanca precisar de multiplas tasks, redirecione para `/dw-create-prd`.</critical>
<critical>SEMPRE execute testes e validacao antes de commitar. Garantias do workflow sao obrigatorias mesmo para tasks rapidas.</critical>

## Quando Usar
- Use para mudancas pequenas que nao justificam o pipeline completo (PRD -> TechSpec -> Tasks)
- Use para hotfixes, ajustes de config, atualizacoes de dependencias, refatoracoes pontuais
- NAO use para features novas com multiplos requisitos (use `/dw-create-prd`)
- NAO use para bugs complexos (use `/dw-bugfix`)

## Posicao no Pipeline
**Antecessor:** (necessidade pontual do usuario) | **Sucessor:** `/dw-commit` (automatico)

## Variaveis de Entrada

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `{{DESCRIPTION}}` | Descricao da mudanca a implementar | "adicionar spinner de loading no dashboard" |

## Comportamento Obrigatorio

1. Leia `.dw/rules/` para entender padroes e convencoes do projeto
2. Resuma a mudanca em 1-2 frases e confirme escopo com o usuario
3. Se a mudanca parecer grande demais (>3 arquivos, >100 linhas), alerte e sugira `/dw-create-prd`
4. Implemente a mudanca seguindo convencoes do projeto
5. Execute testes existentes relevantes (unit, integration)
6. Execute lint se configurado no projeto
7. Crie commit atomico semantico com a mudanca

## Integracao GSD

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- Delegue para `/gsd-quick` para tracking em `.planning/quick/`
- A task fica registrada no historico para consulta futura via `/dw-intel`

Se o GSD NAO estiver instalado:
- Execute diretamente com validacao Level 1
- Sem tracking historico (apenas git log)

## Inteligencia do Codebase

Se `.planning/intel/` existir, consulte antes de implementar:
- Execute internamente: `/gsd-intel "implementation patterns in [target area]"`
- Siga os padroes encontrados

Se `.planning/intel/` NAO existir:
- Use apenas `.dw/rules/` como contexto

## Formato de Resposta

### 1. Escopo
- Mudanca: [descricao]
- Arquivos afetados: [lista]
- Estimativa: [pequena/media]

### 2. Implementacao
- Mudancas arquivo por arquivo

### 3. Validacao
- Testes executados: [resultado]
- Lint: [resultado]

### 4. Commit
- Mensagem: [commit semantico]

## Encerramento

Ao final, informe:
- Mudanca implementada e commitada
- Se deseja fazer push ou continuar com mais mudancas

</system_instructions>
```

- [ ] **Step 2: Create EN command**

Create `scaffold/en/commands/dw-quick.md`:

```markdown
<system_instructions>
You are a quick task executor. This command exists to implement one-off changes with workflow guarantees (validation, atomic commit) without requiring a full PRD.

<critical>This command is for small, well-defined changes. If the change needs multiple tasks, redirect to `/dw-create-prd`.</critical>
<critical>ALWAYS run tests and validation before committing. Workflow guarantees are mandatory even for quick tasks.</critical>

## When to Use
- Use for small changes that don't justify the full pipeline (PRD -> TechSpec -> Tasks)
- Use for hotfixes, config adjustments, dependency updates, one-off refactors
- Do NOT use for new features with multiple requirements (use `/dw-create-prd`)
- Do NOT use for complex bugs (use `/dw-bugfix`)

## Pipeline Position
**Predecessor:** (user's ad-hoc need) | **Successor:** `/dw-commit` (automatic)

## Input Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{DESCRIPTION}}` | Description of the change to implement | "add loading spinner to dashboard" |

## Required Behavior

1. Read `.dw/rules/` to understand project patterns and conventions
2. Summarize the change in 1-2 sentences and confirm scope with the user
3. If the change seems too large (>3 files, >100 lines), warn and suggest `/dw-create-prd`
4. Implement the change following project conventions
5. Run relevant existing tests (unit, integration)
6. Run lint if configured in the project
7. Create atomic semantic commit with the change

## GSD Integration

If GSD (get-shit-done-cc) is installed in the project:
- Delegate to `/gsd-quick` for tracking in `.planning/quick/`
- The task is registered in history for future lookup via `/dw-intel`

If GSD is NOT installed:
- Execute directly with Level 1 validation
- No history tracking (only git log)

## Codebase Intelligence

If `.planning/intel/` exists, query before implementing:
- Internally run: `/gsd-intel "implementation patterns in [target area]"`
- Follow the patterns found

If `.planning/intel/` does NOT exist:
- Use only `.dw/rules/` as context

## Response Format

### 1. Scope
- Change: [description]
- Affected files: [list]
- Estimate: [small/medium]

### 2. Implementation
- File-by-file changes

### 3. Validation
- Tests run: [result]
- Lint: [result]

### 4. Commit
- Message: [semantic commit]

## Closing

At the end, inform:
- Change implemented and committed
- Whether to push or continue with more changes

</system_instructions>
```

- [ ] **Step 3: Add to constants.js**

In `lib/constants.js`, add to the `en` array (alphabetically, between `dw-help` and `dw-redesign-ui`):

```javascript
{ name: 'dw-quick', description: 'Execute a one-off task with workflow guarantees without requiring a full PRD' },
```

Add to the `pt-br` array (same position):

```javascript
{ name: 'dw-quick', description: 'Executar uma task pontual com garantias do workflow sem precisar de PRD completo' },
```

- [ ] **Step 4: Verify constants load**

Run: `node -e "const c = require('./lib/constants'); console.log(c.COMMANDS.en.find(cmd => cmd.name === 'dw-quick'))"`
Expected: `{ name: 'dw-quick', description: '...' }`

- [ ] **Step 5: Commit**

```bash
git add scaffold/pt-br/commands/dw-quick.md scaffold/en/commands/dw-quick.md lib/constants.js
git commit -m "feat: add /dw-quick command for ad-hoc task execution"
```

---

## Task 4: Create `/dw-intel` command (PT-BR + EN)

**Files:**
- Create: `scaffold/pt-br/commands/dw-intel.md`
- Create: `scaffold/en/commands/dw-intel.md`
- Modify: `lib/constants.js`

- [ ] **Step 1: Create PT-BR command**

Create `scaffold/pt-br/commands/dw-intel.md`:

```markdown
<system_instructions>
Voce e um assistente de inteligencia do codebase. Este comando existe para responder perguntas sobre o projeto usando o indice de conhecimento gerado pelo `/dw-analyze-project`.

<critical>Este comando e somente leitura. NAO modifique codigo ou arquivos do projeto.</critical>
<critical>Sempre cite as fontes das informacoes (arquivo, linha, secao).</critical>

## Quando Usar
- Use para entender como algo funciona no projeto
- Use para encontrar padroes, convencoes ou decisoes arquiteturais
- Use para verificar se algo ja existe antes de implementar
- NAO use para implementar mudancas (use `/dw-quick` ou `/dw-run-task`)

## Posicao no Pipeline
**Antecessor:** `/dw-analyze-project` (gera o indice) | **Sucessor:** qualquer comando dw-*

## Variaveis de Entrada

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `{{QUERY}}` | Pergunta sobre o codebase | "como funciona a autenticacao?" |

## Comportamento Obrigatorio

1. Receba a pergunta do usuario
2. Consulte as fontes de conhecimento na ordem de prioridade:
   a. `.planning/intel/` (se existir — indice GSD, mais rico)
   b. `.dw/rules/` (rules do projeto, sempre disponivel)
   c. Busca direta no codebase (grep, glob) como complemento
3. Sintetize a resposta com referencias concretas
4. Cite fontes: arquivo, secao, linha quando aplicavel

## Integracao GSD

Se o GSD (get-shit-done-cc) estiver instalado e `.planning/intel/` existir:
- Delegue para `/gsd-intel "{{QUERY}}"` para consulta indexada
- O GSD retorna informacoes de: architectural assumptions, decision spaces, behavioral references, UI patterns
- Enriqueca com dados de `.dw/rules/` quando relevante

Se o GSD NAO estiver instalado:
- Consulte `.dw/rules/` como fonte primaria
- Complemente com busca direta no codebase (grep por padroes, leitura de arquivos chave)
- Sugira: "Para intel mais rico, execute `/dw-analyze-project` com GSD instalado"

## Formato de Resposta

### Resposta: [topico]

[Resposta estruturada baseada nas fontes consultadas]

### Fontes
- `.planning/intel/[arquivo].md` — [secao relevante]
- `.dw/rules/[arquivo].md` — [convencao referenciada]
- `src/[caminho]:[linha]` — [referencia de codigo]

### Comandos Relacionados
- [Sugestao de comando dw- para agir com base na informacao]

</system_instructions>
```

- [ ] **Step 2: Create EN command**

Create `scaffold/en/commands/dw-intel.md`:

```markdown
<system_instructions>
You are a codebase intelligence assistant. This command exists to answer questions about the project using the knowledge index generated by `/dw-analyze-project`.

<critical>This command is read-only. Do NOT modify code or project files.</critical>
<critical>Always cite information sources (file, line, section).</critical>

## When to Use
- Use to understand how something works in the project
- Use to find patterns, conventions, or architectural decisions
- Use to verify if something already exists before implementing
- Do NOT use to implement changes (use `/dw-quick` or `/dw-run-task`)

## Pipeline Position
**Predecessor:** `/dw-analyze-project` (generates the index) | **Successor:** any dw-* command

## Input Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{QUERY}}` | Question about the codebase | "how does authentication work?" |

## Required Behavior

1. Receive the user's question
2. Query knowledge sources in priority order:
   a. `.planning/intel/` (if exists — GSD index, richer)
   b. `.dw/rules/` (project rules, always available)
   c. Direct codebase search (grep, glob) as complement
3. Synthesize the answer with concrete references
4. Cite sources: file, section, line when applicable

## GSD Integration

If GSD (get-shit-done-cc) is installed and `.planning/intel/` exists:
- Delegate to `/gsd-intel "{{QUERY}}"` for indexed lookup
- GSD returns information from: architectural assumptions, decision spaces, behavioral references, UI patterns
- Enrich with `.dw/rules/` data when relevant

If GSD is NOT installed:
- Use `.dw/rules/` as primary source
- Complement with direct codebase search (grep for patterns, read key files)
- Suggest: "For richer intel, run `/dw-analyze-project` with GSD installed"

## Response Format

### Answer: [topic]

[Structured answer based on consulted sources]

### Sources
- `.planning/intel/[file].md` — [relevant section]
- `.dw/rules/[file].md` — [referenced convention]
- `src/[path]:[line]` — [code reference]

### Related Commands
- [Suggestion of dw- command to act on the information]

</system_instructions>
```

- [ ] **Step 3: Add to constants.js**

In `lib/constants.js`, add to the `en` array (alphabetically, between `dw-help` and `dw-quick`):

```javascript
{ name: 'dw-intel', description: 'Query codebase intelligence to understand patterns, conventions, and architecture' },
```

Add to the `pt-br` array (same position):

```javascript
{ name: 'dw-intel', description: 'Consultar inteligencia do codebase para entender padroes, convencoes e arquitetura' },
```

- [ ] **Step 4: Verify constants load**

Run: `node -e "const c = require('./lib/constants'); console.log(c.COMMANDS.en.length, 'commands'); console.log(c.COMMANDS.en.filter(cmd => ['dw-intel','dw-quick','dw-resume'].includes(cmd.name)).map(c=>c.name))"`
Expected: `22 commands` and `['dw-intel', 'dw-quick', 'dw-resume']`

- [ ] **Step 5: Commit**

```bash
git add scaffold/pt-br/commands/dw-intel.md scaffold/en/commands/dw-intel.md lib/constants.js
git commit -m "feat: add /dw-intel command for queryable codebase intelligence"
```

---

## Task 5: Add Design Contracts to `/dw-redesign-ui`

**Files:**
- Modify: `scaffold/pt-br/commands/dw-redesign-ui.md`
- Modify: `scaffold/en/commands/dw-redesign-ui.md`

- [ ] **Step 1: Add design contract to PT-BR**

In `scaffold/pt-br/commands/dw-redesign-ui.md`, after the line `7. **VALIDAR**: capturar estado depois, comparar, verificar acessibilidade (WCAG 2.2 via \`ui-ux-pro-max\`), rode react-doctor \`--diff\` se React.`, add:

```markdown
8. **PERSISTIR CONTRATO**: se o usuario aprovou uma direcao, gere `design-contract.md` no diretorio do PRD (`.dw/spec/prd-[nome]/design-contract.md`) com: direcao aprovada, paleta de cores, par tipografico, regras de layout, regras de acessibilidade e regras de componentes. Este contrato sera lido por `dw-run-task` e `dw-run-plan` para garantir consistencia visual.
```

In the same file, after the `## Integracao GSD` section, add a new GSD section. Find the `## Ferramentas de Analise` section and add after it:

```markdown
## Integracao GSD

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- Apos gerar o design contract, registre em `.planning/` para persistencia cross-sessao
- Consulte `.planning/intel/` na fase de auditoria para UI patterns existentes

Se o GSD NAO estiver instalado:
- O design contract funciona normalmente (file-based em `.dw/spec/`)
- Auditoria usa apenas `.dw/rules/` para contexto
```

In the `## Saidas Uteis` section, add to the list:
```markdown
- Design contract com direcao aprovada (`.dw/spec/prd-[nome]/design-contract.md`)
```

- [ ] **Step 2: Add design contract to EN**

In `scaffold/en/commands/dw-redesign-ui.md`, after the line `7. **VALIDATE**: capture after-state, compare before/after, verify accessibility (WCAG 2.2 via \`ui-ux-pro-max\`), run react-doctor \`--diff\` if React.`, add:

```markdown
8. **PERSIST CONTRACT**: if the user approved a direction, generate `design-contract.md` in the PRD directory (`.dw/spec/prd-[name]/design-contract.md`) with: approved direction, color palette, typography pairing, layout rules, accessibility rules, and component rules. This contract will be read by `dw-run-task` and `dw-run-plan` to ensure visual consistency.
```

Add after `## Analysis Tools`:

```markdown
## GSD Integration

If GSD (get-shit-done-cc) is installed in the project:
- After generating the design contract, register in `.planning/` for cross-session persistence
- Query `.planning/intel/` in the audit phase for existing UI patterns

If GSD is NOT installed:
- The design contract works normally (file-based in `.dw/spec/`)
- Audit uses only `.dw/rules/` for context
```

In the `## Useful Outputs` section, add:
```markdown
- Design contract with approved direction (`.dw/spec/prd-[name]/design-contract.md`)
```

- [ ] **Step 3: Commit**

```bash
git add scaffold/pt-br/commands/dw-redesign-ui.md scaffold/en/commands/dw-redesign-ui.md
git commit -m "feat: add design contract generation to /dw-redesign-ui"
```

---

## Task 6: Add Plan Verification + Parallel Execution to `/dw-run-plan`

**Files:**
- Modify: `scaffold/pt-br/commands/dw-run-plan.md`
- Modify: `scaffold/en/commands/dw-run-plan.md`

- [ ] **Step 1: Add GSD integration section to PT-BR**

In `scaffold/pt-br/commands/dw-run-plan.md`, find the `## Regras Importantes` section and add before it:

```markdown
## Integracao GSD

### Verificacao de Plano (Pre-Execucao)

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- Antes de iniciar a execucao, delegue para o agente plan-checker do GSD
- O verificador analisa: dependencias ciclicas, viabilidade das tasks, riscos, cobertura dos requisitos do PRD
- Se FALHAR: apresente os problemas encontrados e sugira correcoes. Maximo 3 ciclos de correcao
- Se PASSAR: prossiga para a execucao

Se o GSD NAO estiver instalado:
- Pule a verificacao e execute diretamente (comportamento atual)

### Execucao Paralela (Wave-Based)

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- Analise o campo `blockedBy` de cada task para montar o grafo de dependencias
- Agrupe tasks em waves:
  - Wave 1: tasks sem dependencias (podem executar em paralelo)
  - Wave 2: tasks que dependem de tasks da Wave 1
  - Wave N: assim por diante
- Delegue cada wave para o engine de execucao paralela do GSD (`/gsd-execute-phase`)
- Cada task executa em worktree isolado com contexto fresh
- Resultados sao mergeados apos a wave completar
- Se qualquer task de uma wave falhar: pause a wave, reporte, aguarde decisao do usuario

Se o GSD NAO estiver instalado:
- Execute sequencialmente como hoje (comportamento atual)

### Design Contracts

Se existir `design-contract.md` no diretorio do PRD:
- Inclua o contrato no contexto de cada task que envolva frontend
- Valide consistencia visual durante Level 1 de cada task
```

- [ ] **Step 2: Add GSD integration section to EN**

In `scaffold/en/commands/dw-run-plan.md`, find the `## Important Rules` or equivalent section and add before it:

```markdown
## GSD Integration

### Plan Verification (Pre-Execution)

If GSD (get-shit-done-cc) is installed in the project:
- Before starting execution, delegate to GSD's plan-checker agent
- The verifier analyzes: cyclic dependencies, task viability, risks, PRD requirements coverage
- If FAIL: present issues found and suggest fixes. Maximum 3 correction cycles
- If PASS: proceed to execution

If GSD is NOT installed:
- Skip verification and execute directly (current behavior)

### Parallel Execution (Wave-Based)

If GSD (get-shit-done-cc) is installed in the project:
- Analyze each task's `blockedBy` field to build the dependency graph
- Group tasks into waves:
  - Wave 1: tasks with no dependencies (can run in parallel)
  - Wave 2: tasks that depend on Wave 1 tasks
  - Wave N: and so on
- Delegate each wave to GSD's parallel execution engine (`/gsd-execute-phase`)
- Each task runs in an isolated worktree with fresh context
- Results are merged after the wave completes
- If any task in a wave fails: pause the wave, report, await user decision

If GSD is NOT installed:
- Execute sequentially as today (current behavior)

### Design Contracts

If `design-contract.md` exists in the PRD directory:
- Include the contract in the context of each task involving frontend
- Validate visual consistency during Level 1 of each task
```

- [ ] **Step 3: Commit**

```bash
git add scaffold/pt-br/commands/dw-run-plan.md scaffold/en/commands/dw-run-plan.md
git commit -m "feat: add plan verification gate and parallel wave execution to /dw-run-plan"
```

---

## Task 7: Add Codebase Intelligence to `/dw-analyze-project`

**Files:**
- Modify: `scaffold/pt-br/commands/dw-analyze-project.md`
- Modify: `scaffold/en/commands/dw-analyze-project.md`

- [ ] **Step 1: Add GSD intel indexing to PT-BR**

In `scaffold/pt-br/commands/dw-analyze-project.md`, find the section `#### Baseline de Saude do Frontend` (added previously for react-doctor) and add after it:

```markdown
#### Inteligencia do Codebase (GSD)

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- Apos gerar as rules em `.dw/rules/`, delegue para `/gsd-map-codebase` para criar indice rico em `.planning/intel/`
- O indice inclui: architectural assumptions, decision spaces, behavioral references, UI patterns
- O indice e incremental — re-executar adiciona ao existente, nao substitui
- Outros comandos dw-* podem consultar o indice via `/gsd-intel` internamente

Se o GSD NAO estiver instalado:
- Gere apenas `.dw/rules/` (comportamento atual)
- Sugira: "Para inteligencia queryable do codebase, instale GSD via `npx dev-workflow install-deps`"
```

- [ ] **Step 2: Add GSD intel indexing to EN**

In `scaffold/en/commands/dw-analyze-project.md`, find the section `#### Frontend Health Baseline` and add after it:

```markdown
#### Codebase Intelligence (GSD)

If GSD (get-shit-done-cc) is installed in the project:
- After generating rules in `.dw/rules/`, delegate to `/gsd-map-codebase` to create a rich index in `.planning/intel/`
- The index includes: architectural assumptions, decision spaces, behavioral references, UI patterns
- The index is incremental — re-running adds to the existing index, does not replace
- Other dw-* commands can query the index via `/gsd-intel` internally

If GSD is NOT installed:
- Generate only `.dw/rules/` (current behavior)
- Suggest: "For queryable codebase intelligence, install GSD via `npx dev-workflow install-deps`"
```

- [ ] **Step 3: Commit**

```bash
git add scaffold/pt-br/commands/dw-analyze-project.md scaffold/en/commands/dw-analyze-project.md
git commit -m "feat: add GSD codebase intelligence indexing to /dw-analyze-project"
```

---

## Task 8: Add Intel Queries to Existing Commands

**Files:**
- Modify: `scaffold/pt-br/commands/dw-create-prd.md`
- Modify: `scaffold/en/commands/dw-create-prd.md`
- Modify: `scaffold/pt-br/commands/dw-create-techspec.md`
- Modify: `scaffold/en/commands/dw-create-techspec.md`
- Modify: `scaffold/pt-br/commands/dw-run-task.md`
- Modify: `scaffold/en/commands/dw-run-task.md`
- Modify: `scaffold/pt-br/commands/dw-code-review.md`
- Modify: `scaffold/en/commands/dw-code-review.md`
- Modify: `scaffold/pt-br/commands/dw-refactoring-analysis.md`
- Modify: `scaffold/en/commands/dw-refactoring-analysis.md`

- [ ] **Step 1: Add intel to dw-create-prd (PT-BR)**

In `scaffold/pt-br/commands/dw-create-prd.md`, find the `## Skills Complementares` section (or similar) and add after it:

```markdown
## Inteligencia do Codebase

Se `.planning/intel/` existir, consulte antes de redigir os requisitos:
- Execute internamente: `/gsd-intel "features existentes no dominio de [topico do PRD]"`
- Use os findings para evitar duplicar funcionalidade existente e referenciar padroes ja estabelecidos

Se `.planning/intel/` NAO existir:
- Use `.dw/rules/` como contexto (comportamento atual)
```

- [ ] **Step 2: Add intel to dw-create-prd (EN)**

In `scaffold/en/commands/dw-create-prd.md`, find the `## Complementary Skills` section and add after it:

```markdown
## Codebase Intelligence

If `.planning/intel/` exists, query before writing requirements:
- Internally run: `/gsd-intel "existing features in the [PRD topic] domain"`
- Use findings to avoid duplicating existing functionality and reference established patterns

If `.planning/intel/` does NOT exist:
- Use `.dw/rules/` as context (current behavior)
```

- [ ] **Step 3: Add intel to dw-create-techspec (PT-BR and EN)**

In PT-BR `dw-create-techspec.md`, after `## Skills Complementares`, add:

```markdown
## Inteligencia do Codebase

Se `.planning/intel/` existir, consulte antes de propor arquitetura:
- Execute internamente: `/gsd-intel "padroes arquiteturais e decisoes tecnicas do projeto"`
- Alinhe propostas com padroes existentes; sinalize desvios explicitamente

Se `.planning/intel/` NAO existir:
- Use `.dw/rules/` como contexto (comportamento atual)
```

In EN `dw-create-techspec.md`, after `## Complementary Skills`, add:

```markdown
## Codebase Intelligence

If `.planning/intel/` exists, query before proposing architecture:
- Internally run: `/gsd-intel "architectural patterns and technical decisions in the project"`
- Align proposals with existing patterns; flag deviations explicitly

If `.planning/intel/` does NOT exist:
- Use `.dw/rules/` as context (current behavior)
```

- [ ] **Step 4: Add intel to dw-run-task (PT-BR and EN)**

In PT-BR `dw-run-task.md`, after `## Skills Complementares`, add:

```markdown
## Inteligencia do Codebase

Se `.planning/intel/` existir, consulte antes de implementar:
- Execute internamente: `/gsd-intel "padroes de implementacao em [area alvo da task]"`
- Siga convencoes encontradas para estrutura de arquivos, nomenclatura e tratamento de erros

Se `design-contract.md` existir no diretorio do PRD:
- Leia o contrato e garanta que toda implementacao frontend siga as regras de design aprovadas

Se `.planning/intel/` NAO existir:
- Use `.dw/rules/` como contexto (comportamento atual)
```

In EN `dw-run-task.md`, after `## Complementary Skills`, add:

```markdown
## Codebase Intelligence

If `.planning/intel/` exists, query before implementing:
- Internally run: `/gsd-intel "implementation patterns in [task target area]"`
- Follow conventions found for file structure, naming, and error handling

If `design-contract.md` exists in the PRD directory:
- Read the contract and ensure all frontend implementation follows the approved design rules

If `.planning/intel/` does NOT exist:
- Use `.dw/rules/` as context (current behavior)
```

- [ ] **Step 5: Add intel to dw-code-review (PT-BR and EN)**

In PT-BR `dw-code-review.md`, after `## Skills Complementares`, add:

```markdown
## Inteligencia do Codebase

Se `.planning/intel/` existir, consulte antes da analise:
- Execute internamente: `/gsd-intel "convencoes, anti-patterns e decision spaces documentados"`
- Priorize findings que violem convencoes documentadas
- Verifique se decisoes arquiteturais questionaveis sao intencionais (documentadas como decision spaces)

Se `.planning/intel/` NAO existir:
- Use `.dw/rules/` como contexto (comportamento atual)
```

In EN `dw-code-review.md`, after `## Complementary Skills`, add:

```markdown
## Codebase Intelligence

If `.planning/intel/` exists, query before analysis:
- Internally run: `/gsd-intel "documented conventions, anti-patterns, and decision spaces"`
- Prioritize findings that violate documented conventions
- Check if questionable architectural decisions are intentional (documented as decision spaces)

If `.planning/intel/` does NOT exist:
- Use `.dw/rules/` as context (current behavior)
```

- [ ] **Step 6: Add intel to dw-refactoring-analysis (PT-BR and EN)**

In PT-BR `dw-refactoring-analysis.md`, find the existing `## Ferramentas de Analise` section and add after it:

```markdown
## Inteligencia do Codebase

Se `.planning/intel/` existir, consulte antes da auditoria:
- Execute internamente: `/gsd-intel "tech debt, decision spaces e divida tecnica conhecida"`
- Contextualize findings com decisoes ja documentadas
- Evite sinalizar como smell algo que e uma decisao intencional registrada

Se `.planning/intel/` NAO existir:
- Use `.dw/rules/` como contexto (comportamento atual)
```

In EN `dw-refactoring-analysis.md`, find the existing `## Analysis Tools` section and add after it:

```markdown
## Codebase Intelligence

If `.planning/intel/` exists, query before the audit:
- Internally run: `/gsd-intel "tech debt, decision spaces, and known technical debt"`
- Contextualize findings with already documented decisions
- Avoid flagging as a smell something that is an intentional recorded decision

If `.planning/intel/` does NOT exist:
- Use `.dw/rules/` as context (current behavior)
```

- [ ] **Step 7: Commit**

```bash
git add scaffold/pt-br/commands/dw-create-prd.md scaffold/en/commands/dw-create-prd.md \
  scaffold/pt-br/commands/dw-create-techspec.md scaffold/en/commands/dw-create-techspec.md \
  scaffold/pt-br/commands/dw-run-task.md scaffold/en/commands/dw-run-task.md \
  scaffold/pt-br/commands/dw-code-review.md scaffold/en/commands/dw-code-review.md \
  scaffold/pt-br/commands/dw-refactoring-analysis.md scaffold/en/commands/dw-refactoring-analysis.md
git commit -m "feat: add codebase intelligence queries to 5 existing commands"
```

---

## Task 9: Update dw-help (PT-BR + EN)

**Files:**
- Modify: `scaffold/pt-br/commands/dw-help.md`
- Modify: `scaffold/en/commands/dw-help.md`

- [ ] **Step 1: Update PT-BR help**

In `scaffold/pt-br/commands/dw-help.md`:

1. In the **Execucao** table, add rows:
```markdown
| `/dw-quick` | Executa task pontual com garantias do workflow sem PRD | Descricao da mudanca | Codigo + commit |
| `/dw-resume` | Restaura contexto da sessao e sugere proximo passo | (nenhum) | Resumo + sugestao |
| `/dw-intel` | Consulta inteligencia do codebase sobre padroes e arquitetura | Pergunta | Resposta com fontes |
```

2. In the file structure section, add the new command files:
```
│   │   ├── dw-intel.md
│   │   ├── dw-quick.md
│   │   ├── dw-resume.md
```

3. Add a new common flow section:
```markdown
### Task Rapida
```bash
/dw-quick "descricao da mudanca"                   # Implementa + valida + commit
```

### Retomar Sessao
```bash
/dw-resume                                         # Restaura contexto + sugere proximo passo
```

### Consultar Codebase
```bash
/dw-intel "como funciona X neste projeto?"         # Resposta com fontes
```
```

4. Add FAQ entries:
```markdown
**Q: O que e o GSD e preciso instalar?**
- GSD (get-shit-done-cc) e uma engine opcional que habilita features avancadas: execucao paralela, verificacao de planos, inteligencia do codebase e persistencia cross-sessao. Instale com `npx dev-workflow install-deps`. Sem GSD, todos os comandos funcionam normalmente.

**Q: O `/dw-quick` substitui o `/dw-run-task`?**
- Nao. `/dw-quick` e para mudancas pontuais sem PRD. `/dw-run-task` executa tasks de um plano estruturado com PRD e TechSpec.
```

- [ ] **Step 2: Update EN help**

Apply the same changes to `scaffold/en/commands/dw-help.md`, translated to English:

1. Execution table rows:
```markdown
| `/dw-quick` | Execute a one-off task with workflow guarantees without PRD | Change description | Code + commit |
| `/dw-resume` | Restore session context and suggest next step | (none) | Summary + suggestion |
| `/dw-intel` | Query codebase intelligence about patterns and architecture | Question | Answer with sources |
```

2. File structure: add `dw-intel.md`, `dw-quick.md`, `dw-resume.md`

3. Common flows:
```markdown
### Quick Task
```bash
/dw-quick "change description"                     # Implement + validate + commit
```

### Resume Session
```bash
/dw-resume                                         # Restore context + suggest next step
```

### Query Codebase
```bash
/dw-intel "how does X work in this project?"       # Answer with sources
```
```

4. FAQ:
```markdown
**Q: What is GSD and do I need to install it?**
- GSD (get-shit-done-cc) is an optional engine that enables advanced features: parallel execution, plan verification, codebase intelligence, and cross-session persistence. Install with `npx dev-workflow install-deps`. Without GSD, all commands work normally.

**Q: Does `/dw-quick` replace `/dw-run-task`?**
- No. `/dw-quick` is for one-off changes without a PRD. `/dw-run-task` executes tasks from a structured plan with PRD and TechSpec.
```

- [ ] **Step 3: Commit**

```bash
git add scaffold/pt-br/commands/dw-help.md scaffold/en/commands/dw-help.md
git commit -m "docs: update dw-help with new GSD-integrated commands and FAQ"
```

---

## Task 10: Version Bump + Final Verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version**

In `package.json`, change version from `0.2.1` to `0.3.0`.

- [ ] **Step 2: Verify constants load with all new commands**

Run: `node -e "const c = require('./lib/constants'); console.log('EN:', c.COMMANDS.en.length, 'commands'); console.log('PT-BR:', c.COMMANDS['pt-br'].length, 'commands'); ['dw-intel','dw-quick','dw-resume'].forEach(n => { const cmd = c.COMMANDS.en.find(c => c.name === n); console.log(n, cmd ? 'OK' : 'MISSING') })"`

Expected: `EN: 22 commands`, `PT-BR: 22 commands`, all 3 new commands OK

- [ ] **Step 3: Test npm pack**

Run: `npm pack --dry-run 2>&1 | tail -5`

Expected: No errors, increased file count and package size

- [ ] **Step 4: Test init in temp directory**

Run:
```bash
TMPDIR=$(mktemp -d) && cd "$TMPDIR" && git init -q && node /home/bruno/ai-skills/bin/dev-workflow.js init --lang=pt-br --force 2>&1 | grep -c "dw-resume\|dw-quick\|dw-intel" && rm -rf "$TMPDIR"
```

Expected: `9` (3 commands x 3 platforms)

- [ ] **Step 5: Commit version bump**

```bash
git add package.json
git commit -m "chore: bump version to 0.3.0 — GSD integration"
```

- [ ] **Step 6: Push all changes**

```bash
git push
```
