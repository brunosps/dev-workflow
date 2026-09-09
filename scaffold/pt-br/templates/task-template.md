---
type: task
schema_version: "1.1"
status: pending
---

# Tarefa X.0: [Título da Tarefa Principal]

Leia as seções relevantes do PRD/TechSpec e as restrições da task; use os links abaixo.

## Visão Geral

[Breve descrição da tarefa]

**Requisitos Funcionais cobertos**: RF-X.Y, RF-X.Z
Depends on: none

<requirements>
[Lista de requisitos obrigatórios]
</requirements>

## Escolha de execução

Espelhe a entrada aprovada desta task em `execution-plan.json` (veja `.dw/references/execution-contract.md`).

| Complexidade + justificativa | Ferramenta | Modelo / esforço | Agentes | Fallbacks aprovados |
|---|---|---|---|---|
| standard — [motivo] | local | inherit / inherit | nenhum | nenhum |

## Implementação

- [ ] [Comportamento a entregar]
- [ ] [Verificações relevantes e critérios de aceitação]

## Verificação e critérios de sucesso

| Comportamento / risco | Suíte existente ou novo teste | Comando / evidência observável |
|---|---|---|
| [Resultado exigido] | [Menor camada eficaz; teste novo só se necessário] | [Comando do projeto ou inspeção] |

Use a estratégia de testes do projeto. Defina mocks só em fronteiras justificadas; não imponha percentuais de cobertura nem teste novo para toda edição. Inclua falhas relevantes quando aplicável.

## Arquivos e decisões relevantes

[Caminhos de código e seções relevantes do TechSpec/ADR; não duplique documentos inteiros.]

## Commit ao concluir

Use o protocolo de commit atômico com escopo do `/dw-run`. Faça stage apenas dos arquivos desta task, preserve IDs de requisitos, registre o SHA resultante em tasks.md/run-log e inclua os registros finais antes da entrega. Não implica push nem merge.

## Related ADRs

[ADRs que restringem decisões desta task. Deixe vazio se não houver.

- `adrs/adr-NNN.md` — [título curto, como a decisão afeta esta task]]
