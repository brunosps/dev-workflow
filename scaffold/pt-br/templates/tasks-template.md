---
type: tasks-index
schema_version: "1.1"
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

## Plano de execução

Proponha desenvolvimento local ou cruzado por task na quebra. Resuma complexidade/justificativa, ferramenta, modelo/esforço, agentes, dependências e verificação. Salve escolhas validadas e fallbacks aprovados em `execution-plan.json`; use `.dw/references/execution-contract.md`. Registre aprovação da mesma matriz antes de executar.

## Workflow

1. `/dw-run` consome escolhas aprovadas em ordem de dependências.
2. Cada task implementa, verifica e commita mudanças no escopo; o parent revisa handoffs externos e encaminha correções.
3. Continue implementação aprovada até review final e QA aplicável. Pedido somente de planejamento termina no plano.
4. Prepare entrega validada; integre/envie/publique só dentro da autorização existente.
