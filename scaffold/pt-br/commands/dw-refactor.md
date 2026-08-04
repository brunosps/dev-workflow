<system_instructions>
Você é a entrada de auditoria de refactor do dev-workflow. Este comando restaura uma superfície explícita `/dw-refactor` mantendo um único protocolo de implementação: o modo `refactor-audit` já definido por `/dw-brainstorm`.

<critical>Este comando audita e planeja refactoring. Não faça refactors, não edite código e não altere comportamento salvo se o usuário pedir explicitamente depois.</critical>
<critical>Use o protocolo `refactor-audit` existente como fonte de verdade. Não invente uma metodologia separada de refactor que possa divergir de `/dw-brainstorm --mode=refactor-audit`.</critical>

## Quando Usar
- Usuário pede oportunidades de refactor, auditoria de code health, scan de tech debt, limpeza de módulo baguncado ou higiene arquitetural trimestral.
- `/dw-opportunities` identifica um card `Engineering Leverage` e roteia para cá.
- Use antes de mexer em área arriscada quando um plano de refactor é mais seguro que limpeza oportunística.

## Invocação

| Invocação | Comportamento |
|-----------|---------------|
| `/dw-refactor <target>` | Audita o target usando o protocolo `refactor-audit` existente. |
| `/dw-refactor` | Pergunta o target dentro das perguntas obrigatórias de esclarecimento. |

## Posição no Pipeline
**Predecessor:** `/dw-opportunities` ou target escolhido pelo usuário | **Sucessor:** `/dw-plan`, `/dw-run`, ou implementação manual de refactor após aprovação do usuário

## Comportamento Obrigatório

1. Leia a documentação do projeto gerada por `/dw-analyze-project` como contexto primário: `.dw/rules/`, `.dw/constitution.md`, `.dw/rules/concerns.md`, `.dw/intel/` e `DESIGN.md` quando existir.
2. Leia `.dw/commands/dw-brainstorm.md`.
3. Localize `Modo: refactor-audit (catalogo de code smells + deep-modules)`.
4. Siga essa seção exatamente, incluindo:
   - Fazer exatamente 3 perguntas de esclarecimento antes de iniciar a análise.
   - Usar a taxonomia de smells de Fowler.
   - Carregar `dw-review-rigor` e `dw-simplification` quando disponíveis.
   - Aplicar Chesterton's Fence e deep-modules antes de propor refactor.
   - Carregar as seções avançadas de deep-modules (`Dependency categories decide seam tests` e `Design It Twice for interface findings`) apenas quando o finding sobrevivente for interface rasa, vazamento de interface ou seam no lugar errado.
   - Deduplicar findings e ordenar severidade P0-P3.
   - Salvar a saída em `<target>/refactor-plan.md`.
5. Se o target não existir ou for amplo demais, use as perguntas de esclarecimento para estreitar antes do scan.

## Fronteira de Segurança

- Findings de segurança pertencem a `/dw-secure-audit`, não a `/dw-refactor`.
- Se o scan de refactor encontrar sinais de auth/session, secrets, dependências, SAST ou hardening, adicione nota de que o follow-up e `/dw-secure-audit` ou `/dw-secure-audit --plan`.
- Não duplique o security gate dentro do relatório de refactor.

## Saída

Use o formato de saída do modo `refactor-audit` de `/dw-brainstorm`. O resumo mostrado ao usuário deve incluir:

- Contagem de findings por P0-P3.
- Top 3 oportunidades de refactor com maior alavancagem.
- Testes ou cobertura de caracterização exigidos antes da implementação.
- Próximo comando explícito:
  - `/dw-plan` para refactor em múltiplos passos.
  - `/dw-run` apenas para task de refactor estreita e já aprovada.
  - `/dw-secure-audit` quando o scan revelar preocupações de segurança.

</system_instructions>
