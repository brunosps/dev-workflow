<system_instructions>
Você é um assistente de ajuda do workspace. Quando invocado, apresente ao usuário um guia completo dos comandos disponíveis, seus fluxos de integração e quando usar cada um.

## Comportamento

- Se invocado sem argumentos (`/ajuda`): mostre o guia completo abaixo
- Se invocado com argumento (`/ajuda criar-prd`): mostre apenas a seção detalhada daquele comando

---

# Guia de Comandos - Dev Workflow AI

## Visão Geral

Este workspace utiliza um sistema de comandos AI que automatiza o ciclo completo de desenvolvimento: do planejamento (PRD) até o merge (PR). Os comandos estão em `ai/commands/` e são acessíveis nos CLIs suportados (ex: Claude Code, Codex, OpenCode e GitHub Copilot), usando o prefixo do CLI (`/comando`).

## Fluxo Principal de Desenvolvimento

```
┌─────────────┐     ┌────────────────┐     ┌──────────────┐
│ /criar-prd  │────>│/criar-techspec │────>│ /criar-tasks │
│ (O QUÊ)     │     │ (COMO)         │     │ (QUANDO)     │
└─────────────┘     └────────────────┘     └──────┬───────┘
                                                   │
                                     ┌─────────────┴─────────────┐
                                     ▼                           ▼
                            ┌────────────────┐         ┌─────────────────┐
                            │ /executar-task  │         │ /executar-plano │
                            │ (uma por vez)   │         │ (todas auto)    │
                            └───────┬────────┘         └────────┬────────┘
                                    │                           │
                                    └─────────┬─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Validação Nível 1│ (automática, embutida)
                                    │ critérios+testes │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                    ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐
                    │/executar-qa  │ │/revisar-impl.│ │ /code-review        │
                    │(QA visual)   │ │(PRD compliance│ │ (code review formal)│
                    └──────────────┘ │ Nível 2)     │ │ (Nível 3)           │
                                     └──────────────┘ └─────────────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                    ┌──────────────┐                 ┌────────────────┐
                    │ /commit      │                 │ /gerar-pr      │
                    │ (um projeto) │                 │ (push + PR)    │
                    └──────────────┘                 └────────────────┘
```

## Tabela de Comandos

### Planejamento

| Comando | O que faz | Input | Output |
|---------|-----------|-------|--------|
| `/brainstorm` | Facilita ideação estruturada antes do PRD ou da implementação | Problema, ideia ou contexto | Opções + trade-offs + recomendação |
| `/criar-prd` | Cria PRD com min. 7 perguntas de clarificação | Descrição da feature | `ai/tasks/prd-[nome]/prd.md` |
| `/criar-techspec` | Cria especificação técnica a partir do PRD | Path do PRD | `ai/tasks/prd-[nome]/techspec.md` |
| `/criar-tasks` | Quebra PRD+TechSpec em tasks (max 2 RFs/task) | Path do PRD | `ai/tasks/prd-[nome]/tasks.md` + `*_task.md` |

### Execução

| Comando | O que faz | Input | Output |
|---------|-----------|-------|--------|
| `/executar-task` | Implementa UMA task + validação Nível 1 + commit | Path do PRD | Código + commit |
| `/executar-plano` | Executa TODAS tasks + revisão final Nível 2 | Path do PRD | Código + commits + relatório |
| `/bugfix` | Analisa e corrige bugs (triagem bug vs feature) | Target + descrição | Fix + commit OU PRD (se feature) |
| `/corrigir-qa` | Corrige bugs documentados no QA e retesta com evidências | Path do PRD | Código + `QA/bugs.md` + `QA/qa-report.md` atualizados |

### Análise e Pesquisa

| Comando | O que faz | Input | Output |
|---------|-----------|-------|--------|
| `/analisar-projeto` | Escaneia o repo e gera rules do projeto automaticamente | (nenhum) | `ai/rules/index.md` + `ai/rules/[projeto].md` |
| `/deep-research` | Pesquisa profunda com citações e verificação multi-fonte | Tópico ou pergunta | Relatório com citações em Markdown/HTML |

### Qualidade (3 Níveis)

| Nível | Comando | Quando | Gera Relatório? |
|-------|---------|--------|-----------------|
| **1** | *(embutido no /executar-task)* | Após cada task | Não (output no terminal) |
| **2** | `/revisar-implementacao` | Após todas tasks / manual | Sim (output formatado) |
| **3** | `/code-review` | Antes do PR / manual | Sim (`code-review.md`) |

| Comando | O que faz | Input | Output |
|---------|-----------|-------|--------|
| `/executar-qa` | QA visual com Playwright MCP + acessibilidade | Path do PRD | `QA/qa-report.md` + `QA/screenshots/` |
| `/revisar-implementacao` | Compara PRD vs código (RFs, endpoints, tasks) | Path do PRD | Relatório de gaps |
| `/code-review` | Code review formal (qualidade, rules, testes) | Path do PRD | `code-review.md` |

### Versionamento

| Comando | O que faz | Input | Output |
|---------|-----------|-------|--------|
| `/commit` | Commit semântico (Conventional Commits) | - | Commit |
| `/gerar-pr` | Push + cria PR + copia body + abre URL | Branch alvo | PR no GitHub |

### Utilitários

| Comando | O que faz | Input | Output |
|---------|-----------|-------|--------|
| `/ajuda` | Este guia de comandos | (opcional) comando | Este documento |

## Fluxos Comuns

### Nova Feature (Completo)
```bash
/brainstorm "ideia inicial"                    # 0. Explora opções e trade-offs
/criar-prd                                    # 1. Descreve a funcionalidade
/criar-techspec ai/tasks/prd-nome             # 2. Gera spec técnica
/criar-tasks ai/tasks/prd-nome                # 3. Quebra em tasks
/executar-plano ai/tasks/prd-nome             # 4. Executa todas (inclui Nível 1+2)
/code-review ai/tasks/prd-nome               # 5. Code review formal (Nível 3)
/gerar-pr main                                # 6. Cria PR
```

### Nova Feature (Incremental)
```bash
/criar-prd                                    # 1. PRD
/criar-techspec ai/tasks/prd-nome             # 2. TechSpec
/criar-tasks ai/tasks/prd-nome                # 3. Tasks
/executar-task ai/tasks/prd-nome              # 4. Task 1 (com Nível 1)
/executar-task ai/tasks/prd-nome              # 5. Task 2 (com Nível 1)
# ... repete para cada task
/revisar-implementacao ai/tasks/prd-nome      # 6. Revisão PRD (Nível 2)
/code-review ai/tasks/prd-nome               # 7. Code review (Nível 3)
/gerar-pr main                                # 8. PR
```

### Bug Simples
```bash
/bugfix meu-projeto "descrição do bug"        # Analisa e corrige
/commit                                       # Commit da correção
/gerar-pr main                                # PR
```

### Bug Complexo
```bash
/bugfix meu-projeto "descrição" --análise     # Gera documento de análise
/criar-techspec ai/tasks/bugfix-nome          # TechSpec do fix
/criar-tasks ai/tasks/bugfix-nome             # Tasks do fix
/executar-plano ai/tasks/bugfix-nome          # Executa tudo
/gerar-pr main                                # PR
```

### QA Visual (Frontend)
```bash
/executar-qa ai/tasks/prd-nome                # QA com Playwright MCP
# Se encontrar bugs:
/corrigir-qa ai/tasks/prd-nome               # Corrige + retesta ciclo completo
```

### Onboarding em Projeto Novo
```bash
/analisar-projeto                             # Escaneia e gera rules automaticamente
/ajuda                                        # Mostra comandos disponíveis
```

## Estrutura de Arquivos

```
workspace/
├── ai/
│   ├── commands/              # Fonte de verdade dos comandos
│   │   ├── ajuda.md
│   │   ├── analisar-projeto.md
│   │   ├── brainstorm.md
│   │   ├── criar-prd.md
│   │   ├── criar-techspec.md
│   │   ├── criar-tasks.md
│   │   ├── executar-task.md
│   │   ├── executar-plano.md
│   │   ├── executar-qa.md
│   │   ├── code-review.md
│   │   ├── revisar-implementacao.md
│   │   ├── deep-research.md
│   │   ├── bugfix.md
│   │   ├── corrigir-qa.md
│   │   ├── commit.md
│   │   └── gerar-pr.md
│   ├── templates/             # Templates de documentos
│   │   ├── prd-template.md
│   │   ├── techspec-template.md
│   │   ├── tasks-template.md
│   │   ├── task-template.md
│   │   └── bugfix-template.md
│   ├── rules/                 # Regras por projeto (gerado por /analisar-projeto)
│   │   ├── index.md
│   │   └── [projeto].md
│   └── tasks/                 # PRDs e tasks em andamento
│       └── prd-[nome]/
│           ├── prd.md
│           ├── techspec.md
│           ├── tasks.md
│           └── *_task.md
```

## Dúvidas Frequentes

**Q: Qual a diferença entre `/executar-task` e `/executar-plano`?**
- `/executar-task` executa UMA task com controle manual entre cada uma
- `/executar-plano` executa TODAS automaticamente com revisão final

**Q: Preciso rodar `/revisar-implementacao` manualmente?**
- Não se usar `/executar-plano` (já inclui). Sim se usar `/executar-task` incremental.

**Q: Quando usar `/code-review` vs `/revisar-implementacao`?**
- `/revisar-implementacao` (Nível 2): Verifica se os RFs do PRD foram implementados
- `/code-review` (Nível 3): Além disso, analisa qualidade de código e gera relatório formal

**Q: O `/bugfix` sempre corrige direto?**
- Não. Ele faz triagem. Se for feature (não bug), redireciona para `/criar-prd`. Se for bug complexo, pode gerar documento de análise com `--análise`.

**Q: Preciso rodar `/analisar-projeto` antes de tudo?**
- Sim, é recomendado para projetos novos. Ele gera as rules em `ai/rules/` que todos os outros comandos utilizam.

</system_instructions>
