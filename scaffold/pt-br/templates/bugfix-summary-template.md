---
schema_version: "1.0"
slug: ""
created: ""
status: "Fixed | In Review | QA Pending | Reverted"
severity: "Low | Medium | High"
related_concerns: []
---

# Bugfix Summary — {{NNN}}-{{slug}}

Registro de uma página de um bugfix. Arquivos irmãos neste diretório:

- `TASK.md` — a triagem original, respostas das perguntas de clarificação e o plano de fix que rodou
- `fix-report.md` — evidência de verificação (saída do `dw-verify` PASS, prova de reprodução, execução do teste de regressão)
- `review/` — populado por `/dw-review --bugfix {{NNN}}-{{slug}}`
- `QA/` — populado por `/dw-qa --bugfix {{NNN}}-{{slug}}` (quando aplicável)

## Sintoma

O que o usuário observou. Cite a descrição original do bug verbatim; não parafraseie.

> _"…"_

## Causa Raiz

O que estava de fato quebrado, em uma frase. Não o sintoma — a causa.

_…_

## Resolução

O que mudou, em 2-4 bullets. Paths de arquivos, não snippets.

- _mudanca 1_
- _mudanca 2_

## Arquivos Tocados

Lista completa, incluindo testes. <=5 — se mais, o safety valve deveria ter escalado para `/dw-plan`.

| Path | Mudança |
|------|---------|
| `src/foo/bar.ts` | _fix cirúrgico em X_ |
| `src/foo/bar.test.ts` | _teste de regressão adicionado_ |

## Verificação

Como o fix foi provado, além de "os testes passam".

- **Reprodução antes do fix:** _passo que disparava o bug, capturado_
- **Reprodução depois do fix:** _mesmo passo, agora passa_
- **Teste de regressão:** _nome + path_
- **Relatório de verify:** `fix-report.md`

## Relacionado

- **Concerns tocados:** _refs de `.dw/rules/concerns.md` se o fix caiu em área flagada_
- **Bugfixes adjacentes:** _slugs de fixes anteriores no mesmo módulo, se houver_
- **Contexto de PRD:** _se o bug apareceu dentro de uma feature em andamento, link para o path do PRD_

## Followups

Pontas soltas que este fix descobriu mas não resolveu. Adicione ao `.dw/STATE.md` Open-Loops ao fechar.

- _nenhum_
