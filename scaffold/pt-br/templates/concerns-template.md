---
schema_version: "1.0"
generated_by: dw-analyze-project (Step 9)
last_refreshed: ""
---

# Concerns — Mapa de Riscos

Mapa de riscos deste codebase. Não são convenções ("como fazemos as coisas" — isso e `.dw/rules/`), não é arquitetura ("como está construído" — isso e `.dw/intel/arch.md`). Este arquivo responde uma única pergunta: **onde é perigoso mexer?**

Carregado on-demand por `/dw-plan`, `/dw-run` e `/dw-bugfix` quando o alvo deles toca uma entrada abaixo. Auto-instalado pelo `/dw-analyze-project` Step 9; nunca bloqueia (ausência = nenhuma área flagada ainda).

## Hot Spots

Arquivos ou módulos com churn alto, reports frequentes de bug ou histórico repetido de "mexi aqui e quebrou algo". Mencione em PRDs que toquem a mesma área; adicione revisor extra ou passada extra de teste.

| Path | Por que é quente | Primeiro flag | Último incidente |
|------|------------------|---------------|------------------|
| _ex. `src/auth/session.ts`_ | _3 fixes de token em 60d_ | _YYYY-MM-DD_ | _YYYY-MM-DD_ |

## Integrações Fragis

Sistemas externos (APIs, filas, vendors, bancos legados) com histórico de falhas silenciosas, drift de schema, surpresas de rate-limit ou comportamento não-documentado. Código novo que toque eles precisa de tratamento explícito de retry/timeout/idempotência.

| Integração | Modo de falha | Mitigação esperada |
|------------|---------------|--------------------|
| _ex. export SAP legado_ | _200 OK silencioso com body vazio quando source está lockado_ | _checar tamanho do body; logar e alertar_ |

## Código Hostil

Funções específicas, regexes, parsers ou algoritmos difíceis de raciocinar — quem toca precisa entender 100% primeiro (ou reescrever, não remendar). Suspeitos comuns: regex artesanal, parsers de string ad-hoc, serializadores custom, async com race condition, código de transação manual.

| Path / função | Por que é hostil | Owner / contexto |
|---------------|------------------|------------------|
| _ex. `src/billing/parseInvoice.ts:parseLine`_ | _regex de 900 chars com 12 alternativas, sem comentarios_ | _Bruno escreveu em 2024; reescrever se quebrar_ |

## Histórico de Bugs Conhecidos

Agregado de `.dw/bugfixes/*/SUMMARY.md` pelo `/dw-intel --build`. Lista módulos com >=2 fixes historicos. Leia junto com Hot Spots ao planejar trabalho relacionado.

| Módulo | Contagem de bugs | Slugs recentes |
|--------|------------------|----------------|
| _ex. `src/payments/`_ | _4_ | _002-stripe-webhook-retry, 007-refund-rounding_ |

## Tech Debt — Reconhecida

Pedaços de debt que o time concorda que existem. Não são para limpar oportunisticamente sem coordenação — podem ser load-bearing de formas não óbvias.

| Área | Descrição do debt | Por que fica | Trigger de cleanup |
|------|-------------------|--------------|--------------------|
| _ex. `src/legacy/userMapper.ts`_ | _Dois codepaths paralelos de field-mapping_ | _Esperando migração v3 da API_ | _Q3 2026 após cutover do vendor_ |

---

**Como manter este arquivo:**

- `/dw-analyze-project` reescreve a cada execução. Entradas escritas a mão entre `<!-- preserved:start -->` e `<!-- preserved:end -->` são mantidas.
- Quando um bugfix descobrir uma nova área perigosa, adicione manualmente em Hot Spots e deixe a próxima análise confirmar.
- Promova entradas para `.dw/constitution.md` quando virarem regras não-negociáveis ("nunca toque X sem ADR").
