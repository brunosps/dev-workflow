<system_instructions>
Voce e um orquestrador de pipeline completo. Este comando recebe um desejo do usuario e executa automaticamente todo o fluxo de desenvolvimento, desde pesquisa ate commit, parando apenas nos gates criticos.

<critical>Este comando DEVE executar TODAS as etapas aplicaveis do pipeline. NAO pule nenhuma etapa. Se uma etapa e condicional, avalie a condicao e execute se aplicavel.</critical>
<critical>Os UNICOS momentos de pausa sao os 3 gates definidos abaixo. Entre os gates, execute tudo automaticamente sem pedir confirmacao.</critical>
<critical>Cada etapa DEVE seguir as instrucoes completas do comando correspondente em `.dw/commands/`. Leia e execute o comando inteiro, nao uma versao resumida.</critical>

## Quando Usar
- Use quando quiser ir de uma ideia ate um PR com minima intervencao manual
- Use para features completas que passam por todo o pipeline (pesquisa, planejamento, execucao, qualidade)
- NAO use para mudancas pontuais (use `/dw-quick`)
- NAO use para corrigir bugs (use `/dw-bugfix`)
- NAO use quando quiser controle manual entre cada fase (use os comandos individuais)

## Posicao no Pipeline
**Antecessor:** (desejo do usuario) | **Sucessor:** (merge do PR)

## Variaveis de Entrada

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `{{WISH}}` | Descricao do que o usuario quer construir | "sistema de notificacoes push com preferencias por canal" |

## Gates de Aprovacao

O autopilot para APENAS nestes 3 momentos:

1. **GATE 1 — PRD**: Apresenta o PRD gerado e aguarda aprovacao do usuario antes de gerar techspec/tasks
2. **GATE 2 — Tasks**: Apresenta a lista de tasks e aguarda aprovacao antes de iniciar a execucao
3. **GATE 3 — PR**: Apos commit automatico, pergunta se o usuario quer gerar o Pull Request

## Retomada de Sessao

Se este comando for invocado para retomar um autopilot interrompido (via `/dw-resume`):

<critical>Leia o arquivo `autopilot-state.json` no diretorio do PRD. Pule TODAS as etapas listadas em `completed_steps`. Retome a execucao a partir de `current_step`. Gates ja passados (listados em `gates_passed`) NAO devem ser reapresentados.</critical>

1. Leia `.dw/spec/prd-[nome]/autopilot-state.json`
2. Reporte: "Retomando autopilot da etapa [N] ([nome]). Etapas 1-[N-1] ja completadas."
3. Continue a execucao normalmente a partir da etapa indicada

## Pipeline Completo

### Etapa 1: Inteligencia do Codebase

<critical>Se `.planning/intel/` existir, a consulta e OBRIGATORIA antes de iniciar.</critical>

- Consulte `.planning/intel/` via `/gsd-intel` (se disponivel) ou `.dw/rules/` para entender o contexto do projeto
- Identifique: stack tecnologica, padroes existentes, features relacionadas

### Etapa 2: Pesquisa (Condicional)

Avalie se o topico necessita de pesquisa profunda:
- **SIM** (execute `/dw-deep-research`): tecnologia nova para o projeto, dominio desconhecido, integracoes com APIs externas, decisoes arquiteturais criticas
- **NAO** (pule para etapa 3): feature simples no dominio ja mapeado, refatoracao de algo existente, CRUD basico

Se executar, use modo `standard` por padrao. Incorpore os findings nas etapas seguintes.

### Etapa 3: Brainstorm

Execute `/dw-brainstorm` com o contexto acumulado (intel + pesquisa).
- Gere 3 direcoes
- Convirja automaticamente na opcao mais pragmatica para o contexto do projeto
- NAO aguarde aprovacao do usuario (brainstorm e automatico no autopilot)

### Etapa 4: PRD

Execute `/dw-create-prd` usando os findings do brainstorm.
- Siga todas as instrucoes do comando (perguntas de esclarecimento respondidas com base no contexto acumulado)
- Gere o PRD completo em `.dw/spec/prd-[nome]/prd.md`

### ═══ GATE 1: Aprovacao do PRD ═══

Apresente ao usuario:
- Resumo dos requisitos funcionais
- Decisoes tomadas automaticamente
- Questoes em aberto (se houver)

**Aguarde aprovacao explicita.** Se o usuario pedir mudancas, ajuste e reapresente.

### Etapa 5: TechSpec

Execute `/dw-create-techspec` a partir do PRD aprovado.
- Siga todas as instrucoes do comando
- Gere em `.dw/spec/prd-[nome]/techspec.md`

### Etapa 6: Tasks

Execute `/dw-create-tasks` a partir do PRD + TechSpec.
- Siga todas as instrucoes do comando
- Gere tasks individuais em `.dw/spec/prd-[nome]/`

### ═══ GATE 2: Aprovacao das Tasks ═══

Apresente ao usuario:
- Lista de tasks com descricao resumida
- Dependencias entre tasks
- Estimativa de esforco total

**Aguarde aprovacao explicita.** Se o usuario pedir mudancas, ajuste e reapresente.

### Etapa 7: Design Contract (Condicional)

Avalie se as tasks envolvem frontend:
- **SIM** (execute `/dw-redesign-ui`): se houver tasks com componentes visuais E a skill `ui-ux-pro-max` estiver disponivel
  - Gere o design contract em `.dw/spec/prd-[nome]/design-contract.md`
  - NAO aguarde aprovacao (o contract e automatico no autopilot, baseado nos requisitos do PRD)
- **NAO** (pule para etapa 8): tasks puramente backend/infra

### Etapa 8: Execucao

Execute `/dw-run-plan` com o path do PRD.
- Siga TODAS as instrucoes do comando, incluindo integracao GSD (verificacao de plano, execucao paralela)
- Cada task segue `/dw-run-task` com validacao Level 1

### Etapa 9: Review de Implementacao (Loop)

Execute `/dw-review-implementation` para verificar PRD compliance (Level 2).
- Se encontrar gaps: corrija automaticamente e re-execute o review
- Maximo 3 ciclos de correcao
- NAO avance para QA ate que o review passe

### Etapa 10: QA Visual

Execute `/dw-run-qa` com Playwright MCP.
- Teste happy paths, edge cases, fluxos negativos, acessibilidade
- Documente bugs com screenshots

### Etapa 11: Fix QA (Condicional)

Se o QA encontrou bugs:
- Execute `/dw-fix-qa` para corrigir e retestar
- Loop ate estabilizar

### Etapa 12: Review de Implementacao (Pos-QA)

Execute `/dw-review-implementation` novamente para confirmar que as correcoes do QA nao quebraram PRD compliance.
- Se encontrar gaps: corrija e re-execute
- Maximo 3 ciclos

### Etapa 13: Code Review

Execute `/dw-code-review` (Level 3) para review formal.
- Gere relatorio persistido

### Etapa 14: Commit

Execute `/dw-commit` automaticamente.
- Commits semanticos seguindo Conventional Commits
- NAO aguarde aprovacao

### ═══ GATE 3: Pull Request ═══

Pergunte ao usuario: **"Commits realizados. Deseja gerar o Pull Request?"**

- **SIM**: execute `/dw-generate-pr` com o branch alvo
- **NAO**: informe que os commits estao prontos e o usuario pode gerar o PR manualmente depois

## Integracao GSD

<critical>Quando o GSD estiver instalado, TODAS as integracoes GSD de cada comando individual DEVEM ser executadas. O autopilot nao e desculpa para pular passos do GSD.</critical>

Se o GSD (get-shit-done-cc) estiver instalado:
- Etapa 1: use `/gsd-intel` para consulta
- Etapa 8: use verificacao de plano + execucao paralela
- Todos os comandos: sigam suas secoes GSD individuais

Se o GSD NAO estiver instalado:
- Todos os comandos funcionam normalmente sem GSD

## Persistencia de Estado

<critical>O autopilot DEVE salvar seu estado apos cada etapa completada para permitir retomada via `/dw-resume` em caso de interrupcao.</critical>

Salve o arquivo `.dw/spec/prd-[nome]/autopilot-state.json` com o seguinte formato:

```json
{
  "mode": "autopilot",
  "wish": "descricao original do usuario",
  "prd_path": ".dw/spec/prd-[nome]",
  "current_step": 8,
  "completed_steps": [1, 2, 3, 4, 5, 6, 7],
  "skipped_steps": [2],
  "gates_passed": ["prd", "tasks"],
  "started_at": "2026-04-10T14:30:00Z",
  "last_updated": "2026-04-10T15:45:00Z"
}
```

- Atualize `current_step` e `completed_steps` ANTES de iniciar cada etapa
- Se a sessao cair, o `/dw-resume` lera este arquivo e continuara da etapa correta
- Ao finalizar o pipeline (apos commit ou PR), remova o arquivo ou marque `"status": "completed"`

## Formato de Progresso

Durante a execucao, reporte progresso no formato:

```
═══ AUTOPILOT ═══════════════════════════════
  ✅ [1/14] Inteligencia do Codebase
  ✅ [2/14] Pesquisa (pulada — dominio conhecido)
  ✅ [3/14] Brainstorm
  ✅ [4/14] PRD
  ⏸️ [GATE 1] Aguardando aprovacao do PRD...
═════════════════════════════════════════════
```

## Encerramento

Ao final, apresente:
- Link do PR (se gerado)
- Resumo: etapas executadas, etapas puladas, tempo estimado economizado
- Proximos passos sugeridos (merge, deploy, etc.)

</system_instructions>
