<system_instructions>
# Codex runner

Use `dw-cli-run` para o protocolo compartilhado. Consuma a escolha aprovada da task e retorne ao parent para review, correções e continuidade. Invocação standalone aceita prompt preparado explicitamente sem exigir PRD. WRITE exige worktree secundário dedicado; READ-ONLY segue as regras de leitura efetiva da skill. O worker nunca faz merge ou push.

Execute exemplos com cwd definido como `<WORKTREE>` pelo lançador. Substitua argumentos com segurança, preferencialmente como array de argumentos de subprocesso. Placeholders de permissões representam o perfil já aprovado, não flags de bypass. Preserve permissões efetivas na retomada; comandos inicial e resume podem aceitar flags diferentes. Confira ambos os helps antes do dispatch.

## Codex adapter table

| Slot | Value |
|---|---|
| `DISPATCH` | `codex exec -m "<MODEL>" -c 'model_reasoning_effort="<EFFORT>"' <PERMISSIONS> --json -o "<AUDIT>/<slug>.last.md" - < "<PROMPT>" > "<AUDIT>/<slug>.log" 2>&1` |
| `STREAM` | `--json` |
| `MODEL` | `-m "<MODEL>"` |
| `EFFORT` | `-c 'model_reasoning_effort="<EFFORT>"'` |
| `AUTO` | <PERMISSIONS> — perfil não interativo aprovado; preserve configuração existente |
| `AUTO_READONLY` | `--sandbox read-only` |
| `NO_MCP` | Selecione capacidades necessárias se suportado; caso contrário preserve configuração |
| `RESUME <id>` | `codex exec resume "<SESSION_ID>" -m "<MODEL>" -c 'model_reasoning_effort="<EFFORT>"' <RESUME_PERMISSIONS> --json - < "<FOLLOWUP_PROMPT>" >> "<AUDIT>/<slug>.log" 2>&1` |
| `SESSION_ID` | `thread.started.thread_id` → `<AUDIT>/<slug>.session` |
| `DONE_SIGNAL` | `turn.completed` |
| `USAGE` | `turn.completed.usage` |

Crie/reutilize por `/dw-worktree create <slug>`; após integração autorizada, `/dw-worktree merge <slug>` conduz merge e limpeza segura. Workers retornam ao parent e nunca integram por conta própria.

## Seleção de modelo e retomada

Resolva modelo/esforço concretos na quebra de tasks usando `.dw/config/routing.json`, metadados atuais do provedor e ferramenta instalada. Não fixe lista de modelos do mais forte ao mais leve neste adapter. Esforços dependem de modelo/versão; low, medium, high, xhigh e max são candidatos apenas quando suportados. Sem escalada obrigatória ao máximo.

Registre task, provedor, worktree, escolha aprovada, ID de sessão e audit antes do handoff. Sem sidecar, recupere sessão exata da task pelo log; nunca continue às cegas a sessão mais recente do cwd. Sem provar identidade, inicie nova sessão a partir do estado salvo e diff real, preservando trabalho parcial. Sessões não são portáveis entre CLIs.

Retorne Structured Return do `dw-cli-run` com evidências e comando de retomada suportado exato. O parent continua o plano aprovado; merge/push/publicação exigem autorização aplicável.

Inspeção de capacidades: codex-cli 0.153.4.
O help atual de `exec resume` não expõe `--sandbox`; não copie flags iniciais às cegas nem acrescente bypass. Use perfil/configuração aprovado equivalente e suportado; caso contrário bloqueie esse modo de retomada e reconstrua sessão restrita nova. TOML `mcp_servers='{}'` sozinho não prova que entradas MCP herdadas foram desativadas.
</system_instructions>
