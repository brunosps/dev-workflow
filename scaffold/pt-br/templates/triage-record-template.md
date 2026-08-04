---
type: triage-record
schema_version: "1.0"
id: "NNN-<slug>"
category: "bug | enhancement"
state: "needs-triage | needs-info | ready-for-work | needs-human | wontfix"
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
---

# Triagem: <título>

## Fonte

| Campo | Valor |
|-------|-------|
| Tipo de Fonte | paste / file / github-issue / github-pr / other |
| Referência da Fonte | <caminho, URL, número de issue, número de PR, ou marcador de sessão colada> |
| Autor | <nome ou desconhecido> |
| Reportado em | <data ou desconhecida> |
| Recuperado por | local / gh / pasted / owner-provided |

## Resumo de Intake

<Resumo curto do pedido em linguagem de domínio.>

## Classificação

| Campo | Valor |
|-------|-------|
| Categoria | bug / enhancement |
| Estado | needs-triage / needs-info / ready-for-work / needs-human / wontfix |
| Conceito de Domínio | <slug do conceito e nome humano> |
| Motivo do Desfecho | <por que este estado foi escolhido> |

## Checks do Codebase

### Busca de Redundância

| Área Pesquisada | Query / Conceito | Resultado |
|-----------------|------------------|-----------|
| `.dw/domain/**` | <concept> | <match / no match / missing> |
| `.dw/spec/**` | <concept> | <match / no match / missing> |
| `.dw/bugfixes/**` | <concept> | <match / no match / missing> |
| `.dw/rules/**` | <concept> | <match / no match / missing> |
| Código / testes / docs | <concept> | <match / no match> |

### Busca de Rejeição Anterior

| Registro | Similaridade | Decisão |
|----------|--------------|---------|
| `.dw/out-of-scope/<concept>.md` | <por que é similar> | aplica / não aplica / reaberta |

## Verificação

| Campo | Valor |
|-------|-------|
| Status da Verificação | confirmed / failed-to-reproduce / insufficient-detail |
| Método de Verificação | passos de reprodução / revisão do diff do PR / testes relevantes / check de inventário de produto |
| Comandos Rodados | <comandos ou n/a> |
| Arquivos Inspecionados | <caminhos> |
| Evidência | <o que foi observado> |

## Needs Info

<!-- Se o estado for needs-info, cole aqui o corpo de triage-needs-info-template.md. Caso contrário, escreva "n/a". -->

n/a

## Roteamento

| Condição | Rota |
|----------|------|
| ready-for-work + bug | `/dw-bugfix` |
| ready-for-work + enhancement | `/dw-plan prd` |
| pedido malformado | `/dw-brainstorm --mode=grill` |
| needs-human | ação do dono |
| wontfix | sem trabalho downstream |

Rota selecionada: <rota ou n/a>

## Link Out-of-Scope

<Se rejeitado, linke `.dw/out-of-scope/<concept>.md`. Se já implementado, linke a implementação e declare que nenhum registro out-of-scope foi escrito.>

## Histórico

- YYYY-MM-DD — needs-triage -> <state> — <actor> — <reason>
