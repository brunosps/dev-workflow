<system_instructions>
# Orquestrador de implementação contínua

`/dw-autopilot "<wish>"` planeja e conduz trabalho aprovado até implementação e validação. `/dw-autopilot --from-prd <slug>` parte de `.dw/spec/<slug>/prd.md`; ausência bloqueia informando o caminho. `/dw-autopilot` sem descrição retoma estado salvo. Não imponha segunda invocação após aprovar tasks. Pedido somente de plano ou modo Plan ativo da plataforma termina no artefato de planejamento.

## Planejamento

1. Inspecione código/regras relevantes e decisões existentes. Use `.dw/intel/` quando útil; pesquise tecnologias/domínios/integrações desconhecidos. Brainstorm só para escolhas pendentes, sem entrevista obrigatória de três opções.
2. Invoque `/dw-plan` ou estágios relevantes para produzir PRD, TechSpec, tasks e tasks-validation.md. Reutilize respostas e handoffs alinhados. Pergunte lacunas materiais pela ferramenta de entrevista disponível; não repita fatos descobertos.
3. Na quebra apresente desenvolvimento local/cruzado, modelo/esforço concretos e agentes relevantes por complexidade. Siga `.dw/references/execution-contract.md`, escreva/valide execution-plan.json e obtenha aprovação da mesma matriz de tasks/escolhas. Respeite aprovações de estágios existentes sem repeti-las.
4. Salve `autopilot-state.json` com `status: plan_complete`, `current_step: goal`, artefatos, caminho das escolhas aprovadas e `next_command: /dw-goal --from-autopilot <slug>`. Em pedido de implementação continue imediatamente. Em pedido somente de plano reporte-o e preserve o ponto de retomada.

## Execução e entrega

Arme `/dw-report` uma vez (idempotente, pule quando `DW_REPORT_AUTO=off`). Invoque `/dw-goal --from-autopilot <slug>` para conduzir `/dw-run` → `/dw-review` completo → `/dw-qa` aplicável → `/dw-qa --fix` para bugs Open → review pós-QA quando edições ou novos achados invalidarem review anterior. Não substitua review completo por coverage-only. Runners externos retornam ao parent para correções e continuidade, sem encerrar o goal.

Use `dw-memory` para decisões duráveis e `dw-verify` para evidência válida. Security Gate continua obrigatório quando aplicável: `/dw-secure-audit` produz `.dw/secure-audit/audit-summary.md`; evidência ausente/inválida é refeita e achados bloqueantes corrigidos. SECRET findings sempre bloqueiam (sem escape por ADR). Reutilize scan válido em outro checkpoint.

Goal conclui apenas com critérios atendidos, artefatos exigidos de review/QA e checks válidos, sem achado bloqueante pendente. Para `prd-bugfix-*` escalado, localize `.dw/bugfixes/*/escalated.md` original, produza SUMMARY.md ausente com evidências e feche o índice.

Inspecione commits com escopo e bookkeeping restante; `/dw-commit` faz commit final autorizado quando necessário. Não crie commits vazios nem exija commit extra para trabalho já commitado. Prepare branch/worktree validado e resumo de entrega. Merge, push e publicação de PR seguem só autorização existente. Se faltar autorização final, apresente resultado concreto e peça apenas essa ação; não repita permissão já concedida.

## Estado durável

Preserve campos de `autopilot-state.json`: mode, wish, prd_path, from_prd_slug, current_step, completed_steps, skipped_steps, skip_reasons, gates_passed, step_artifacts, goal_slug, next_command, started_at, last_updated. Acrescente caminhos `execution_plan` e `execution_state`. Registre evidência, não só existência de arquivo, antes de concluir etapa.

| status | Ação de retomada |
|---|---|
| ausente / planning | Continue apenas planejamento pendente; preserve decisões resolvidas. |
| plan_complete | Execute plano aprovado por `/dw-goal --from-autopilot <slug>` quando implementação for solicitada. |
| goal_active | `/dw-goal resume` com estado salvo de task/executor. |
| goal_complete | Prepare entrega e ações restantes autorizadas de commit/publicação. |
| completed | Reporte entrega validada e links/branch; publicação pode aguardar autorização. |

Atualize estado após cada checkpoint. Reporte task atual, evidência e restante de forma compacta. Preserve checkpoints em pausa ou bloqueio real; corrija falhas recuperáveis no escopo e continue.
</system_instructions>
