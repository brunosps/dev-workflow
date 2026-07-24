---
type: idea-onepager
schema_version: "1.1"
status: draft | paused | aligned
date: YYYY-MM-DD
classification: improves | consolidates | new
alignment:
  confirmed_by_user: false   # true SOMENTE quando o usuário confirma explicitamente o shared understanding
  confirmed_on: null         # data ISO dessa confirmação
---

> **Schema 1.1.** O bloco `## Grill Alignment` abaixo é preenchido por uma sessão de grill do `/dw-brainstorm`. Sem
> Grill, deixe esse bloco vazio e mantenha `status: draft`. `status: aligned` é permitido SOMENTE quando cada branch
> de dependência está resolvida, contradições glossário/código estão fechadas, nenhuma decisão bloqueante resta, e o
> usuário confirmou explicitamente o shared understanding — senão use `draft` ou `paused`.

# Ideia: [Título curto e imperativo]

## Problem Statement

[Reformule a ideia bruta como uma frase "How might we":
**How might we** [verbo] **para** [usuário/segmento] **de forma que** [resultado/valor mensurável]?

Foque no problema, não na solução. Evite entrar em "como implementar".]

## Product Context (features existentes mapeadas)

[Inventário das features do produto relevantes para esta ideia. **Nível de produto, não de código.** Liste o que o produto já entrega hoje que se relaciona com a ideia.

Fontes:
- PRDs em `.dw/spec/prd-*/prd.md` (features já entregues ou em desenvolvimento)
- `.dw/rules/index.md` (overview do produto)
- `.dw/intel/` (indice queryable — construido por `/dw-intel --build`, consultado via `/dw-intel`)

Formato:]

- **[nome da feature A]** — `.dw/spec/prd-<slug>/prd.md` — status: live / em desenvolvimento
- **[nome da feature B]** — `.dw/rules/index.md#modulo-Y` — status: live
- **[nome da feature C]** — PRD em progresso, ver `tasks.md`

> Se o produto é greenfield (sem PRDs nem rules), escreva: "Feature Inventory: greenfield — nenhum artefato de produto ainda. Esta é a primeira ideia registrada."

## Classification & Rationale

**Tipo:** IMPROVES | CONSOLIDATES | NEW

[Escolha UM dos três e justifique:]

- **Se IMPROVES** — qual feature existente está sendo aprimorada e por quê aprimorar vale mais do que criar feature separada. Cite o PRD original da feature.
- **Se CONSOLIDATES** — quais features se fundem, o ganho ao unificar (UX mais coesa, menos código duplicado, dados consolidados). Liste os PRDs originais que ficam "superseded" (ou em revisão).
- **Se NEW** — por que o produto precisa dessa capacidade agora, onde ela se conecta às features existentes (mesmo sendo nova, raramente está completamente isolada), e qual gap ela preenche.

## Recommended Direction

[A abordagem recomendada, 1 parágrafo, em **linguagem de produto**:
- Jornada do usuário (quem faz o quê, quando, por quê)
- Valor entregue
- Boundary (o que essa ideia cobre e o que fica de fora)

**NÃO escreva arquitetura técnica aqui** — isso é trabalho do techspec.]

## MVP Scope

[A menor versão que entrega valor real. Pensada em **user stories**, não tasks técnicas.

- Como [persona], eu posso [ação] para [benefício]
- Como [persona], eu posso [ação] para [benefício]

Idealmente 2-4 stories. Se são mais de 5, provavelmente não é MVP.]

## Not Doing (explícito)

[Itens tentadores que ficaram FORA do escopo — e por quê. Força disciplina de scope:]

- **[item tentador 1]** — razão: [fora de escopo porque...]
- **[item tentador 2]** — razão: [pode virar v2 se hipótese X validar]

## Key Assumptions to Validate

[O que precisa ser verdade para essa direção funcionar. Cada assumption com um teste — idealmente **com usuário**, não com código.]

- **[assumption 1]** — teste: [entrevista com 5 usuários do segmento X / pesquisa de mercado / protótipo de baixa fidelidade]
- **[assumption 2]** — teste: [métrica Y aumenta em Z% em 2 semanas após release]

## Open Questions

[Questões que ainda não têm resposta e que o usuário (ou stakeholder) precisa responder antes do PRD:]

- [Pergunta 1 que afeta escopo]
- [Pergunta 2 que afeta prioridade]

## Grill Alignment

_(schema 1.1 — preenchido por uma sessão de grill do `/dw-brainstorm`; consumido pelo `/dw-plan`, que NÃO re-pergunta decisões resolvidas. Deixe vazio para um one-pager sem grill.)_

### Resolved Decisions

| Decisão | Recomendado | Escolhido | Alternativa rejeitada | Evidência |
|---------|-------------|-----------|-----------------------|-----------|
| [a decisão] | [o que o Grill recomendou] | [o que o usuário escolheu] | [a opção rejeitada + seu trade-off] | [fonte no one-pager/repo] |

### Evidence

[Fatos descobertos durante o Grill no repo/rules/intel/docs — cada um com sua fonte (`path:line`, doc, ou query de intel) — usados em vez de perguntar ao usuário.]

- **[fato]** — fonte: `[path:line ou doc]`

### Canonical Vocabulary

[Links para `.dw/domain/**` dos termos de que esta ideia depende. Não repita definições aqui — aponte para o glossário.]

- **[Termo]** → `.dw/domain/glossary.md#termo` (ou `.dw/domain/contexts/<slug>.md#termo` num projeto multi-contexto)

### Remaining Decisions

[Decisões não-bloqueantes ainda abertas após o alinhamento, com seu dono. Uma decisão bloqueante significa que o one-pager NÃO está `aligned`.]

- **[decisão aberta]** — dono: [quem] — bloqueante? [não]

### Alignment State

- **State:** `draft` | `paused` | `aligned`
- **Shared understanding confirmado pelo usuário:** [sim/não — `aligned` exige um sim explícito]
- **Por que não alinhado (se draft/paused):** [o nó bloqueante ou contradição não fechada que parou o alinhamento]

## Next Step

Escolha UM:

- **`/dw-plan prd`** com este one-pager como input — quando a direção está clara mas precisamos detalhar user stories, acceptance criteria e passar ao techspec
- **`/dw-run`** — quando é um IMPROVES tão pequeno que cabe em task única (até 3 arquivos, sem novo endpoint/tela) — escreva um PRD curto antes
- **Parar aqui** — se alguma "Open Question" é bloqueante, parar e resolver com stakeholder antes de avançar
