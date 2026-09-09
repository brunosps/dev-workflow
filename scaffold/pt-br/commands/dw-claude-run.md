<system_instructions>
# Claude runner

Use `dw-cli-run` para o protocolo compartilhado. Consuma a escolha aprovada da task e retorne ao parent para review, correções e continuidade. Invocação standalone aceita prompt preparado explicitamente sem exigir PRD. WRITE exige worktree secundário dedicado; READ-ONLY segue as regras de leitura efetiva da skill. O worker nunca faz merge ou push.

Execute exemplos com cwd definido como `<WORKTREE>` pelo lançador. Substitua argumentos com segurança, preferencialmente como array de argumentos de subprocesso. Placeholders de permissões representam o perfil já aprovado, não flags de bypass. Preserve permissões efetivas na retomada; comandos inicial e resume podem aceitar flags diferentes. Confira ambos os helps antes do dispatch.

## Claude adapter table

| Slot | Value |
|---|---|
| `DISPATCH` | `claude -p --session-id "<SESSION_ID>" --model "<MODEL>" --effort "<EFFORT>" <PERMISSIONS> --output-format stream-json --include-partial-messages --verbose < "<PROMPT>" > "<AUDIT>/<slug>.log" 2>&1` |
| `STREAM` | `--output-format stream-json --verbose` |
| `MODEL` | `--model "<MODEL>"` |
| `EFFORT` | `--effort "<EFFORT>"` |
| `AUTO` | <PERMISSIONS> — perfil não interativo aprovado; preserve configuração existente |
| `AUTO_READONLY` | `--permission-mode plan --tools "Read,Grep,Glob" --strict-mcp-config` |
| `NO_MCP` | Selecione capacidades necessárias se suportado; caso contrário preserve configuração |
| `RESUME <id>` | `claude --resume "<SESSION_ID>" -p --model "<MODEL>" --effort "<EFFORT>" <RESUME_PERMISSIONS> --output-format stream-json --include-partial-messages --verbose < "<FOLLOWUP_PROMPT>" >> "<AUDIT>/<slug>.log" 2>&1` |
| `SESSION_ID` | UUID gerado antes do dispatch (`node -e "console.log(require('node:crypto').randomUUID())"`) → `<AUDIT>/<slug>.session` |
| `DONE_SIGNAL` | `result` com seu subtype |
| `USAGE` | `result.usage` e o valor reportado de `total_cost_usd` |

Crie/reutilize por `/dw-worktree create <slug>`; após integração autorizada, `/dw-worktree merge <slug>` conduz merge e limpeza segura. Workers retornam ao parent e nunca integram por conta própria.

## Seleção de modelo e retomada

Resolva modelo/esforço concretos na quebra de tasks usando `.dw/config/routing.json`, metadados atuais do provedor e ferramenta instalada. Não fixe lista de modelos do mais forte ao mais leve neste adapter. Esforços dependem de modelo/versão; low, medium, high, xhigh e max são candidatos apenas quando suportados. Sem escalada obrigatória ao máximo.

Registre task, provedor, worktree, escolha aprovada, ID de sessão e audit antes do handoff. Sem sidecar, recupere sessão exata da task pelo log; nunca continue às cegas a sessão mais recente do cwd. Sem provar identidade, inicie nova sessão a partir do estado salvo e diff real, preservando trabalho parcial. Sessões não são portáveis entre CLIs.

Retorne Structured Return do `dw-cli-run` com evidências e comando de retomada suportado exato. O parent continua o plano aprovado; merge/push/publicação exigem autorização aplicável.

Inspeção de capacidades: Claude Code 2.1.265.
</system_instructions>
