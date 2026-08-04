---
schema_version: "1.0"
last_paused: ""
last_resumed: ""
---

# Estado da Sessão

Memória de trabalho entre sessões. Índice leve do que está em andamento, do que foi decidido, do que ficou parado. Atualizado por `/dw-pause` (consolida) e lido por `/dw-resume` (orienta).

Diferente do `MEMORY.md` por-PRD (memória de workflow para uma feature) ou dos ADRs (decisões arquiteturais duráveis), este arquivo vive no nível do projeto e sobrevive entre PRDs, branches e sessões. Edite livremente entre pausas.

## Open Loops (Pontas Soltas)

O que está em andamento — trabalho começado mas não terminado. Cada entrada: label curto + path/alvo + próxima ação concreta.

- _nenhum_

## Decisões

Decisões transversais que ainda não viraram ADR (porque não justificam um, ou porque a formalização foi adiada). Formato: `YYYY-MM-DD — decisao — contexto (1 linha)`.

- _nenhuma_

## Bloqueios

O que está impedindo o avanço. Externo (esperando alguém), interno (lacuna de conhecimento) ou técnico (tooling quebrado). Cada entrada: label curto + o que está bloqueado + dono / condição de desbloqueio.

- _nenhum_

## Todos

Pequenos follow-ups que não justificam um PRD ou task. Uma linha cada. Limpe conforme forem feitos ou migrados para um PRD.

- _nenhum_

## Ideias Adiadas

Ideias consideradas mas parqueadas. Capture para não perder; revisite quando o escopo mudar. Cada entrada: ideia + motivo do park + trigger de revisita (se conhecido).

- _nenhuma_

## Lições

Pequenas lições aprendidas no trabalho recente — padrões que funcionaram, pegadinhas, "da próxima vez eu...". Não são arquiteturais (essas vão para ADRs); são operacionais.

- _nenhuma_

## Preferências

Convenções acordadas durante o trabalho que afetam como o agent deve se comportar dali em diante. Exemplos: "sempre rodar `pnpm typecheck` antes do commit", "preferir named exports a default exports em utils".

- _nenhuma_

## Notas

Bloco livre. Opcional.

- _nenhuma_
