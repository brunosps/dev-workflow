<system_instructions>
# Copilot runner

Use `dw-cli-run` para o protocolo compartilhado. Consuma a escolha aprovada da task e retorne ao parent para review, correções e continuidade. Invocação standalone aceita prompt preparado explicitamente sem exigir PRD. WRITE exige worktree secundário dedicado; READ-ONLY segue as regras de leitura efetiva da skill. O worker nunca faz merge ou push.

Execute exemplos com cwd definido como `<WORKTREE>` pelo lançador. Substitua argumentos com segurança, preferencialmente como array de argumentos de subprocesso. Placeholders de permissões representam o perfil já aprovado, não flags de bypass. Preserve permissões efetivas na retomada; comandos inicial e resume podem aceitar flags diferentes. Confira ambos os helps antes do dispatch.

## Copilot adapter table

| Slot | Value |
|---|---|
| `DISPATCH` | `copilot -p "<PROMPT_TEXT>" --model "<MODEL>" <PERMISSIONS> --output-format json > "<AUDIT>/<slug>.log" 2>&1` |
| `STREAM` | `--output-format json` (confira a CLI instalada) |
| `MODEL` | `--model "<MODEL>"` |
| `EFFORT` | Use `default` quando não houver flag de esforço; nunca invente uma flag |
| `AUTO` | <PERMISSIONS> — perfil não interativo aprovado; preserve configuração existente |
| `AUTO_READONLY` | Resolva controles efetivos de leitura pelo help instalado; bloqueie READ-ONLY se indisponíveis |
| `NO_MCP` | Selecione capacidades necessárias se suportado; caso contrário preserve configuração |
| `RESUME <id>` | `copilot --resume="<SESSION_ID>" -p "<FOLLOWUP_TEXT>" --model "<MODEL>" <RESUME_PERMISSIONS> --output-format json >> "<AUDIT>/<slug>.log" 2>&1` |
| `SESSION_ID` | Capture ID exato do stream desta task; valide schema de eventos da CLI instalada → `<AUDIT>/<slug>.session` |
| `DONE_SIGNAL` | Registro terminal do provedor mais saída do processo e relatório inspecionado |
| `USAGE` | Somente campos de uso reportados; desconhecido se ausentes |

Crie/reutilize por `/dw-worktree create <slug>`; após integração autorizada, `/dw-worktree merge <slug>` conduz merge e limpeza segura. Workers retornam ao parent e nunca integram por conta própria.

## Seleção de modelo e retomada

Resolva modelo/esforço concretos na quebra de tasks usando `.dw/config/routing.json`, metadados atuais do provedor e ferramenta instalada. Não fixe lista de modelos do mais forte ao mais leve neste adapter. Esforços dependem de modelo/versão; low, medium, high, xhigh e max são candidatos apenas quando suportados. Sem escalada obrigatória ao máximo.

Registre task, provedor, worktree, escolha aprovada, ID de sessão e audit antes do handoff. Sem sidecar, recupere sessão exata da task pelo log; nunca continue às cegas a sessão mais recente do cwd. Sem provar identidade, inicie nova sessão a partir do estado salvo e diff real, preservando trabalho parcial. Sessões não são portáveis entre CLIs.

Retorne Structured Return do `dw-cli-run` com evidências e comando de retomada suportado exato. O parent continua o plano aprovado; merge/push/publicação exigem autorização aplicável.

Inspeção de capacidades: Copilot adapter requires installed-version capability validation.
## Paradas

Este comando roda sob o `.dw/references/automode.md`: a atribuição de task aprovada autoriza o dispatch, e
as paradas abaixo são o conjunto completo. Cada uma persiste o worktree, o log de auditoria e o sidecar de
sessão, reporta a pergunta exata com o comando de retomada suportado e sai `BLOCKED`.

1. A tabela de adapter está ausente — o `dw-cli-run` devolve `BLOCKED` sem ela.
2. O perfil de permissão aprovado não pode ser resolvido pelo help da CLI instalada.
3. Um dispatch WRITE não tem worktree dedicado.
4. O diff do worker toca caminho protegido, ou nele aparece suspeita de segredo.
5. A identidade da sessão não pode ser provada na retomada e o trabalho parcial ficaria em risco.
6. Integração, merge ou push é alcançado — o worker nunca executa isso e devolve ao parent.
7. Seria preciso cruzar uma invariante do piso (`.dw/references/invariants.md`).

Não conseguir resolver um modelo não é parada quando existe fallback aprovado. Um turno concluído não prova
sucesso da task: conclusão exige o evento terminal, o desfecho do processo e os arquivos inspecionados.

</system_instructions>
