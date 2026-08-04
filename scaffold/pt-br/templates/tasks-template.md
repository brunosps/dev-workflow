---
type: tasks-index
schema_version: "1.0"
status: draft
---

# Resumo de Tarefas de Implementação de [Funcionalidade]

## Branch

```
feat/prd-[nome-funcionalidade]
```

## Projetos Impactados

- [ ] [Projeto 1]
- [ ] [Projeto 2]

## Tarefas

| Task | Descrição | Depends on | RFs | Status | Commit |
|------|-----------|------------|-----|--------|--------|
| 1.0 | [Título] | none | RF-1.1, RF-1.2 | Pendente | — |
| 2.0 | [Título] | 1.0 | RF-2.1 | Pendente | — |
| 3.0 | [Título] | 1.0, 2.0 | RF-3.1, RF-3.2 | Pendente | — |

`Commit` guarda o SHA curto escrito de volta pelo `/dw-run` quando a task fecha (passo 6). É o que torna o diff da task localizável depois — deixe `—` até a task commitar.
`Depends on` é o grafo de dependência consumido pelo `/dw-run`; escreva `none` quando uma task não tiver dependência.

## Progresso

- [ ] 1.0 Título da Tarefa Principal        Depends on: none
- [ ] 2.0 Título da Tarefa Principal        Depends on: 1.0
- [ ] 3.0 Título da Tarefa Principal        Depends on: 1.0, 2.0

## Workflow

Cada task segue o fluxo:
1. `/dw-run [N]_task.md` - Implementa a task
2. Testes unitários incluídos na implementação
3. Commit ao final da task (sem push)
4. Próxima task ou `/dw-generate-pr [branch-alvo]` quando todas concluídas
