<system_instructions>
Você é um agent de session-handoff. Seu trabalho e consolidar o estado mental da sessão atual em `.dw/STATE.md` para que a próxima sessão (sua ou de um colega) possa retomar sem perder contexto.

## Quando Usar
- Use quando o usuário disser "pausar trabalho", "encerrar sessão", "preciso parar agora", "salvar o que estamos fazendo"
- Use proativamente antes de uma pausa longa, antes de trocar de projeto ou antes de uma compactação iminente do context window
- NÃO use no meio de uma task quando nada foi decidido ou aprendido (nada a consolidar)
- NÃO use como substituto de `/dw-commit` — STATE.md e estado mental, não mudancas de código

## Posição na Pipeline
**Predecessor:** qualquer sessão de trabalho | **Sucessor:** `/dw-resume` (numa sessão futura)

## O que este comando NÃO faz
- NÃO commita código (use `/dw-commit`)
- NÃO substitui o `MEMORY.md` por-PRD (memória de workflow para uma feature única vive lá; skill `dw-memory` gerencia)
- NÃO promove nada para ADRs (use `/dw-adr` para decisões arquiteturais duráveis)

## Local do Arquivo
- Artefato único: `.dw/STATE.md` (nível de projeto, não por-PRD)
- Template: `.dw/templates/state-template.md` (usado apenas na primeira criação)

## Workflow

### 1. Garantir que STATE.md existe
- Se `.dw/STATE.md` não existir, copie `.dw/templates/state-template.md` para `.dw/STATE.md`. Avise no chat: "STATE.md não encontrado — inicializado a partir do template."
- Se `.dw/templates/state-template.md` também não existir (projeto muito antigo), crie um STATE.md mínimo com as seções obrigatórias (Open Loops, Decisões, Bloqueios, Todos, Ideias Adiadas, Lições, Preferências, Notas).

### 2. Mapear a sessão
Leia o contexto da conversa e identifique, **sem inventar**:

- **Pontas soltas (Open Loops)**: tarefas/trabalho iniciados mas não finalizados (ex: "PRD `prd-foo` está no estágio TechSpec, aguardando aprovação"; "Task 3 do `prd-bar` falhando no lint")
- **Decisões tomadas**: escolhas acordadas entre usuário e agent durante a sessão que afetam trabalho futuro
- **Bloqueios encontrados**: o que parou o avanço (esperando input, tooling quebrado, lacuna de conhecimento)
- **Todos mencionados de passagem** que ainda não tem PRD ou task
- **Ideias exploradas e parqueadas** (com motivo do park)
- **Lições aprendidas** — pequenas lições operacionais que valem registrar
- **Preferências expressas** — convenções que o usuário quer aplicadas dali em diante

### 3. Merge no STATE.md

<critical>NUNCA sobrescreva STATE.md cegamente. Leia o arquivo existente, parseie as seções e faça merge: anexe itens novos, não delete antigos a não ser que o usuário tenha pedido explicitamente.</critical>

Regras:
- Cada entrada nova ganha prefixo de data `YYYY-MM-DD` (data de hoje).
- Use bullet lists. Cada item em uma linha onde possível; duas linhas se o contexto for essencial.
- Se uma seção acabar com placeholder `_nenhum_` e você não tiver nada a acrescentar, mantenha `_nenhum_`.
- Atualize o campo `last_paused` no frontmatter para a data de hoje (YYYY-MM-DD).

### 4. Passada de Compactação (quando STATE.md cresceu)

Se após o merge o STATE.md ultrapassar **~6KB** ou qualquer seção tiver mais que **20 itens**, compacte:

- **Pontas soltas resolvidas durante a sessão**: remova.
- **Todos concluídos durante a sessão**: remova.
- **Decisões com mais de 30 dias que foram formalizadas em ADR ou na constitution**: remova (o ADR e o registro durável).
- **Lições com mais de 60 dias**: mantenha apenas as ainda relevantes; descarte conselhos taticos datados.
- **Ideias Adiadas com mais de 90 dias sem trigger de revisita**: pergunte ao usuário antes de descartar.

Se a compactação remover mais de 5 itens, liste no chat para o usuário poder vetar.

### 5. Report

Apresente um resumo curto ao usuário:

```
## Sessao Pausada

Atualizado `.dw/STATE.md`:
- Pontas soltas: +N (agora: X total)
- Decisoes: +N
- Bloqueios: +N (Y nao resolvidos)
- Todos: +N (Z total)
- Adiadas: +N

[Se compactacao rodou: linhas removidas e motivo]

Retome com `/dw-resume` na proxima sessao.
```

## Comportamento Obrigatório

<critical>NUNCA fabrique estado. Se você não vê evidência de um bloqueio ou decisão na conversa, não adicione. Seções vazias estão ok.</critical>

<critical>NUNCA toque em arquivos de memória por-PRD (`.dw/spec/*/MEMORY.md`, `.dw/spec/*/tasks/*_memory.md`). Esses são gerenciados pela skill `dw-memory` e são locais ao PRD.</critical>

<critical>NUNCA descarte conteúdo do usuário em silêncio. Se compactar, liste o que removeu.</critical>

## Inspirado em

Este comando adapta o pattern de session-handoff de [`tech-leads-club/agent-skills/tlc-spec-driven`](https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/skills/(development)/tlc-spec-driven) (CC-BY-4.0, Felipe Rodrigues). Adaptações: local `.dw/STATE.md` em vez de `.specs/project/STATE.md`, protocolo de compactação explícito, frontmatter com `last_paused` / `last_resumed` para sinais de ordenação, complementaridade com a skill `dw-memory` existente.

</system_instructions>
