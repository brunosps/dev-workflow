<system_instructions>
# Executar tasks aprovadas

Use `/dw-run` para todas as tasks pendentes, `/dw-run <task-id>` para uma e `/dw-run --resume` para continuar. Inputs são ID da task e diretório ativo `.dw/spec/<prd>/`. Tasks e dependências precisam existir e estar aprovadas. Para investigação sem plano use `/dw-bugfix`.

## Escolha e preparação

Leia `.dw/references/execution-contract.md` e o arquivo relevante da task. Consuma `execution-plan.json` quando existir; valide com `node .dw/scripts/lib/workflow-contract.mjs validate <plan.json>`. Confira IDs/dependências contra tasks.md. Tasks legadas schema 1.0 sem escolhas executam localmente. CLIs instaladas não implicam autorização cruzada.

Respeite decisões da constitution e IDs de requisitos (`FR-N.M` / `RF-N.M`). Ausência usa defaults não bloqueantes. Inspecione código relevante e regras do projeto; consulte `.dw/intel/` somente quando útil e confira atualização. Não exija mapa completo antes de cada task.

Carregue skills conforme a necessidade: `dw-verify` para evidência, `dw-memory` para decisões/checkpoints relevantes, `dw-testing-discipline` ao projetar testes, `dw-ui-discipline` para UI, `dw-llm-eval` para AI e `dw-execute-phase` para checagem de plano/dependências. Use `dw-search-first` para dependências novas e `dw-minimalism` para decisão concreta de abstração/escopo, não antes de cada função. Use `dw-simplification` para cleanup com escopo explícito após verificar. Para TDD/test first/red-green-refactor explícito, use `dw-testing-discipline/references/tdd-loop.md` nessa task.

## Loop de execução

1. Arme `/dw-report` uma vez (idempotente, pule quando `DW_REPORT_AUTO=off`). Valide cobertura, grafo de dependências e critérios usando `dw-execute-phase`; corrija inconsistências internas antes de executar, pergunte só decisões materiais ausentes.
2. Escolha próxima task cujas dependências estejam concluídas na branch de execução. Tasks independentes podem rodar juntas apenas com agentes/worktrees aprovados e integração definida. Um escritor por worktree; tasks acopladas sequenciais.
3. Use executor/modelo/esforço/agentes aprovados. Escolhas locais executam no workflow atual. Escolhas cruzadas invocam `/dw-codex-run`, `/dw-claude-run` ou `/dw-copilot-run` com pacote preparado. O parent mantém o objetivo.
4. Implemente critérios com padrões do projeto, testes da estratégia aprovada e falhas relevantes. No retorno do worker, inspecione diff e critérios independentemente; confira/reutilize evidência válida ou rode checks afetados via `dw-verify`. Corrija falhas no escopo automaticamente, usando a mesma sessão externa quando aplicável.
5. Commite só mudanças da task após verificação válida; preserve commits atômicos e IDs de requisitos. Inclua status no commit e registre o SHA na coluna `Commit` de tasks.md e run-log.md. Inclua bookkeeping restante na próxima task ou commit final de metadados; nunca `git add .` sobre mudanças alheias.
6. Atualize `execution-state.json`, `active-session.md` e run-log.md com tasks concluídas, escolhas, branch/worktree, sessões exatas, verificação e próximo passo. Continue tasks aprovadas restantes; `--checkpoint` pede pausa explícita entre waves.
7. Após todas as tasks, rode `/dw-review` para cobertura de requisitos e qualidade. Corrija achados no escopo automaticamente; decisões do usuário só para mudança de escopo ou adiamento. Workflows completos continuam por `/dw-qa` aplicável e correções sob `/dw-goal` ou orquestrador chamador. Pedido de task única termina no handoff validado dessa task.

## Retomada e bloqueios

Pedido de resume já autoriza continuar. Inspecione estado salvo e worktree real sem perguntar “continuar?” novamente. Preserve tasks concluídas e escolhas aprovadas; confira dependências/evidência anterior. Recupere IDs ausentes só de logs da task com identidade validada; caso contrário reconstrua sessão nova no mesmo worktree sem descartar mudanças. Veja limitações entre provedores no execution-contract.

Dependência ausente: conclua primeiro a task aprovada pendente; pergunte só se fora do plano. Falha de verificação: diagnostique, corrija e reexecute checks invalidados. Framework de teste ausente: descubra runner configurado antes de perguntar. Complexidade maior: registre desvio e divida/reordene dentro do escopo. Comportamento novo de produto, conflito arquitetural ou dependência não aprovada: proponha mudança material e aguarde só no trabalho dependente. Preserve checkpoints em impasse real ou pausa do usuário.

## Relatório final

Retorne IDs concluídos e SHAs, arquivos afetados, checks válidos, achados pendentes e próximo passo. `/dw-review` escreve `<prd-path>/QA/review-consolidated.md`. Estado/logs duráveis ficam no diretório da spec; audit/sessões dos workers ficam fora de worktrees descartáveis. Gate aprovado prova só seu escopo; nunca enfraqueça assertions nem esconda bloqueios. Merge, push e publicação exigem autorização aplicável.
</system_instructions>
