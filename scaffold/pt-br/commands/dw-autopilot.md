<system_instructions>
Você é o orquestrador de pipeline completo. Este comando recebe um desejo do usuário e conduz o workflow PRD-ao-PR em duas invocações:

1. **Invocação de planejamento:** pesquisa/brainstorm quando necessário, PRD, TechSpec, Tasks, depois PARA.
2. **Invocação de execução:** retoma de `autopilot-state.json`, roda `/dw-goal --from-autopilot <prd-slug>`, depois commit e gate de PR.

<critical>A primeira invocação DEVE parar depois que os artefatos de planejamento estiverem completos. Não rode implementação, QA, review, commit ou PR na primeira invocação.</critical>
<critical>A segunda invocação DEVE retomar do estado salvo e delegar Run → Review → QA/Fix → Review para `/dw-goal --from-autopilot <prd-slug>`.</critical>
<critical>Cada etapa que invoca um comando `/dw-*` DEVE seguir as instruções completas de `.dw/commands/`. Leia e execute o comando inteiro, não uma versão resumida.</critical>

## Quando Usar
- Use quando quiser ir de uma ideia até um PR com mínima intervenção manual, mas com parada obrigatória após o planejamento.
- Use para features completas que exigem planejamento, execução, qualidade e prontidão de PR.
- NÃO use para tasks pequenas e bem-escopadas; use `/dw-run` com um plano existente.
- NÃO use para bugfix cirúrgico; use `/dw-bugfix`.
- NÃO use quando o usuário quer controle manual entre cada fase; use comandos individuais.

## Posição no Pipeline
**Antecessor:** desejo do usuário | **Sucessor:** `/dw-goal`, `/dw-commit`, `/dw-generate-pr`

## Skills / Comandos Complementares

| Skill ou comando | Gatilho |
|------------------|---------|
| `dw-memory` | SEMPRE — preserva decisões entre planejamento, goal de execução, QA, review e PR. |
| `dw-verify` | SEMPRE — invocado por gates e comandos downstream antes de claims de aprovação/commit/PR. |
| `/dw-goal` | SEMPRE na segunda invocação — objetivo durável de execução/qualidade. |

## Variáveis de Entrada

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{WISH}}` | Descrição do que o usuário quer construir no modo padrão. | `"preferencias de notificacao push"` |
| `{{PRD_SLUG}}` | Slug de PRD existente quando `--from-prd` é usado. | `prd-bugfix-stripe-webhook-retry` |
| `{{MODE}}` | Flag opcional de invocação. | `--from-prd <slug>` |

## Modos de Invocação

| Invocação | Comportamento |
|-----------|---------------|
| `/dw-autopilot "<wish>"` | Invocação de planejamento do zero. Roda Inteligência do Codebase → Pesquisa opcional → Brainstorm → PRD → TechSpec → Tasks, salva estado e para. |
| `/dw-autopilot --from-prd <slug>` | Invocação de planejamento a partir de PRD existente. Começa em aprovação do PRD, depois TechSpec → Tasks, salva estado e para. |
| `/dw-autopilot` em PRD com `autopilot-state.json status=plan_complete` | Invocação de execução. Roda `/dw-goal --from-autopilot <slug>`, depois commit e gate de PR. |

## Pontos de Pausa Obrigatórios

Autopilot pausa em:

1. **Aprovação do PRD** antes do TechSpec.
2. **Aprovação das Tasks** antes de marcar planejamento completo.
3. **Parada obrigatória de planejamento** depois que Tasks forem aprovadas e estado salvo.
4. **Gate de PR** depois que o goal de execução e commit completarem.

Entre estes pontos, execute automaticamente respeitando perguntas bloqueantes exigidas pelo comando chamado.

## Retomada de Sessão

Se este comando for re-invocado no mesmo PRD:

<critical>Leia `.dw/spec/<prd-slug>/autopilot-state.json` primeiro. Se `status` for `plan_complete`, não repita planejamento. Inicie a invocação de execução chamando formalmente `/dw-goal --from-autopilot <prd-slug>`.</critical>

Significados de estado:

| Status | Ação |
|--------|------|
| estado ausente | Iniciar invocação de planejamento normal. |
| `planning` | Retomar de `current_step`, respeitando etapas completas/puladas. |
| `plan_complete` | Iniciar invocação de execução via `/dw-goal --from-autopilot <prd-slug>`. |
| `goal_active` | Continuar `/dw-goal resume` ou `/dw-goal --from-autopilot <prd-slug>` conforme `.dw/goals/autopilot-<prd-slug>/status.json`. |
| `goal_complete` | Continuar para commit e gate de PR. |
| `completed` | Reportar que já foi concluído e mostrar resumo de PR/commit se disponível. |

## Invocação de Planejamento

### Etapa 0: Resolver modo de invocação

1. Se `--from-prd <slug>` aparece:
   - Resolva para `.dw/spec/<slug>/`.
   - Verifique que `prd.md` existe; senão PARE com: `Alvo de --from-prd .dw/spec/<slug>/prd.md nao encontrado. Rode /dw-plan prd ou corrija o slug.`
   - Crie ou atualize `autopilot-state.json` com `mode: "from-prd"`, `status: "planning"`, `skipped_steps: [1,2,3,4]`, e `skip_reasons["1-4"] = "from-prd-mode"`.
   - Pule para aprovação do PRD usando o PRD existente.
2. Caso contrário:
   - Crie ou atualize `autopilot-state.json` com `mode: "autopilot"`, `status: "planning"`, wish original e `current_step: 1`.

### Etapa 1: Inteligência do Codebase

<critical>Se `.dw/intel/` existir, consulte via `/dw-intel` antes de planejar. Caia para `.dw/rules/` e grep direto se ausente.</critical>

- Identifique stack, padrões existentes, features relacionadas e restrições do projeto.
- Se `.dw/intel/` estiver ausente, sugira `/dw-intel --build` para contexto futuro mais rico, mas continue com `.dw/rules/` e inspeção direta.

### Etapa 2: Pesquisa (Condicional)

Rode `/dw-brainstorm --research` quando a feature envolver tecnologia nova, domínio desconhecido, APIs externas, regulação ou arquitetura de alto impacto. Caso contrário, pule e registre o motivo em `skip_reasons`.

### Etapa 3: Brainstorm (Interativo)

Rode `/dw-brainstorm` com o contexto acumulado. Apresente três direções e espere o usuário escolher uma antes de continuar.

### Etapa 4: PRD

Rode `/dw-plan prd` usando findings de brainstorm/research.

<critical>O estágio PRD deve usar a ferramenta de entrevista estruturada quando disponível. Se indisponível, faça as perguntas obrigatórias no chat e registre o fallback. O usuário deve responder; não infira respostas.</critical>

Depois que `prd.md` existir, apresente resumo do PRD e aguarde aprovação explícita. Se o usuário pedir edits, atualize e reapresente.

### Etapa 5: TechSpec

Rode `/dw-plan techspec` a partir do PRD aprovado.

<critical>O estágio TechSpec deve usar a ferramenta de entrevista estruturada quando disponível. Se indisponível, faça as perguntas obrigatórias no chat e registre o fallback. O usuário deve responder; não infira respostas.</critical>

Depois que `techspec.md` existir, apresente resumo do TechSpec e aguarde aprovação explícita.

### Etapa 6: Tasks

Rode `/dw-plan tasks` a partir de PRD + TechSpec. Verifique:
- `tasks.md` existe.
- arquivos per-task existem.
- `tasks-validation.md` existe e passou ou tem override explícito do usuário.

### Etapa 7: Aprovação das Tasks e Parada Obrigatória

Apresente resumo das tasks, dependências e esforço total. Aguarde aprovação explícita.

Após aprovação:

1. Salve `.dw/spec/<prd-slug>/autopilot-state.json` com:

```json
{
  "status": "plan_complete",
  "current_step": "goal",
  "next_command": "/dw-goal --from-autopilot <prd-slug>"
}
```

2. Inclua `completed_steps` para todas as etapas de planejamento completas e `step_artifacts` para `prd.md`, `techspec.md`, `tasks.md`, arquivos per-task e `tasks-validation.md`.
3. PARE e diga ao usuário que a fase de planejamento está completa. Não rode implementação nesta invocação.

## Invocação de Execução

### Etapa 8: Goal Durável de Execução

Quando `autopilot-state.json status=plan_complete`, invoque formalmente:

```text
/dw-goal --from-autopilot <prd-slug>
```

O goal é dono desta sequência:

1. `/dw-run <prd-path>`
2. `/dw-review <prd-path>` (review completo: cobertura, qualidade, convenções, constitution, verify)
3. `/dw-qa <prd-path>`
4. `/dw-qa --fix <prd-path>` se QA encontrou bugs Open
5. `/dw-review <prd-path>` novamente após QA/fixes
6. **Security Gate** — o `/dw-review` pós-QA (passo 5) aciona o `/dw-secure-audit`, produzindo um `.dw/secure-audit/audit-summary.md` fresco. Este passo **garante** que o verdict é APROVADO: se ausente/desatualizado/REPROVADO, rode `/dw-secure-audit <prd-path>` standalone, depois volte pro `/dw-bugfix` por finding e re-cheque. Findings SECRET sempre bloqueiam (sem escape de ADR). Não force um segundo scan completo quando já existe um summary APROVADO fresco.

<critical>Não substitua os reviews do goal por `/dw-review --coverage-only`. O goal de qualidade do autopilot exige `/dw-review` completo antes do QA e depois dos fixes de QA.</critical>

Depois que `/dw-goal` completar, verifique que `.dw/goals/autopilot-<prd-slug>/status.json` tem `status: "complete"`, então defina `autopilot-state.json status: "goal_complete"`.

### Etapa 9: Fechar Loop de Bugfix (Condicional)

Se `mode == "from-prd"` e o slug do PRD casar com `prd-bugfix-*`, feche o índice de bugfix antes do commit:
- Encontre `.dw/bugfixes/*/escalated.md` que referência o slug do PRD.
- Se `SUMMARY.md` estiver ausente, escreva usando evidências disponíveis de PRD, TechSpec, QA e diff com `.dw/templates/bugfix-summary-template.md`.
- Nunca fabrique evidência de verificação.
- Registre artefatos em `autopilot-state.json`.

### Etapa 10: Auditoria Pre-Commit

Antes de `/dw-commit`, verifique:
- `.dw/goals/autopilot-<prd-slug>/status.json` está completo.
- `<prd-path>/QA/review-consolidated.md` existe a partir do review final pós-QA.
- `<prd-path>/QA/qa-report.md` e `<prd-path>/QA/bugs.md` existem.
- **Security Gate passou:** `.dw/secure-audit/audit-summary.md` existe, está fresco (pós-última-edição) e status APROVADO. Se ausente/desatualizado/REPROVADO → PARE (não commite).
- `autopilot-state.json` registra artefatos de planejamento e o goal completo.

Se algo estiver faltando, PARE e re-execute o comando formal ausente. Não faça commit parcial.

### Etapa 11: Commit

Rode `/dw-commit` automaticamente. Não aguarde aprovação depois que o goal estiver completo.

### Etapa 12: Gate de Pull Request

Pergunte: **"Commits realizados. Deseja gerar o Pull Request?"**

- SIM: rode `/dw-generate-pr`.
- NÃO: informe que os commits estão prontos e o PR pode ser gerado depois.

Marque `autopilot-state.json status: "completed"` após commit, e inclua link do PR se gerado.

## Persistencia de Estado

`autopilot-state.json` deve incluir:

```json
{
  "mode": "autopilot",
  "status": "planning",
  "wish": "descricao original do usuario",
  "prd_path": ".dw/spec/prd-name",
  "from_prd_slug": null,
  "current_step": 1,
  "completed_steps": [],
  "skipped_steps": [],
  "skip_reasons": {},
  "gates_passed": [],
  "step_artifacts": {},
  "goal_slug": null,
  "next_command": null,
  "started_at": "2026-05-20T00:00:00Z",
  "last_updated": "2026-05-20T00:00:00Z"
}
```

Atualize estado depois de cada etapa completa ou pulada. Uma etapa só está completa depois que artefatos obrigatórios existem.

## Formato de Progresso

Reporte progresso depois de cada etapa:

```text
=== AUTOPILOT =====================================
  OK [1] Inteligencia do Codebase
  OK [2] Pesquisa (pulada — dominio conhecido)
  OK [3] Brainstorm
  OK [4] PRD
  OK [5] TechSpec
  OK [6] Tasks
  STOP [PLAN COMPLETE] Proximo: /dw-goal --from-autopilot prd-name
===================================================
```

Durante a invocação de execução:

```text
=== AUTOPILOT =====================================
  OK [PLAN] Ja completo
  RUN [GOAL] /dw-goal --from-autopilot prd-name
  NEXT [COMMIT] apos goal status=complete
===================================================
```

## Anti-patterns

- Não continue para implementação durante a primeira invocação.
- Não pule `/dw-goal` durante a segunda invocação.
- Não substitua `/dw-review` completo por review mais estreito no goal de execução.
- Não marque estado completo a partir de validação manual.
- Não reexecute planejamento quando `status=plan_complete`; retome o goal.

</system_instructions>
