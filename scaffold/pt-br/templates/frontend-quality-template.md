---
type: frontend-quality
schema_version: "1.0"
status: draft
---

# Baseline de qualidade do frontend

Use em uma auditoria solicitada de frontend ou plano de ferramentas de qualidade. Incorpore ao `.dw/rules/<module>.md` existente na auditoria, ou à TechSpec da funcionalidade na implementação. Uma funcionalidade precisa apenas das linhas afetadas. Este template registra decisões; não configura ferramentas nem autoriza novos gates.

- Módulo e escopo: [workspace, entradas de runtime, diff relevante]
- Observado em: [revisão e alterações na árvore de trabalho, data]
- Stack: [versões de framework/compilador/runner/gerenciador de pacotes, lockfile]
- Política existente: [instruções, rules, scripts e caminhos do CI]

## Controles

Separe observação e proposta. Preserve checks obrigatórios existentes. Valores de política: `required`, `advisory`, `deferred`, `not_applicable`. Uma proposta não adotada é `deferred`; registre execução separadamente como `passed`, `failed` ou `not_run`. Explique exclusões e evidências ausentes. Não marque ferramentas ausentes como aprovadas nem imponha silenciosamente um gate proposto.

| ID | Risco/controle a inspecionar | Configuração observada e lacunas | Política / mudança proposta | Comando exato, cwd e escopo | Evidência / execução |
|---|---|---|---|---|---|
| contract | Autoridade da API, divergência do cliente gerado, validação em runtime | | | | |
| types | Configuração efetiva de rigor do TypeScript e escapes inseguros | | | | |
| lint | Diagnósticos relevantes de framework, testes e acessibilidade | | | | |
| boundaries | Imports permitidos, separação servidor/cliente, entradas de produção | | | | |
| custom-rules | Defeito recorrente, fixtures do detector e erros acionáveis | | | | |
| feedback | Regras locais encontráveis e feedback opcional por hooks | | | | |
| mutation | Comportamento crítico, investigação de sobreviventes e validade do cache | | | | |
| dead-code | Alcançabilidade em runtime/API pública, arquivos gerados, exclusões revisadas | | | | |
| duplication | Regras de negócio compartilhadas versus markup repetido intencionalmente | | | | |
| ci | Jobs obrigatórios, falhas observáveis, dependências de deploy e regras do repositório | | | | |

## Adoção e validação

- Próxima mudança: [risco eliminado, arquivos/configurações a alterar, ferramenta compatível existente ou dependência proposta]
- Dívida existente: [local da baseline; mantenha separada de defeitos introduzidos agora]
- Condição de promoção: [evidência necessária para passar de advisory a required; responsável pela decisão]
- Exceções: [regra/caminho específico, motivo, responsável e gatilho de revisão; sem exclusões abrangentes]
- Checks do detector: [fixture propositalmente inválida, fixture legítima, casos de alias/caminhos gerados e casos não suportados]
- Limites da análise: [não executado, serviço indisponível, grafo incompleto ou configurações de CI/repositório não inspecionadas]
- Checks de entrega: [comandos obrigatórios e aceite comportamental; reutilize evidência apenas com entradas/ambiente/escopo equivalentes]

Para orientação operacional, leia `dw-ui-discipline/references/frontend-engineering.md` no local das skills instaladas. Inclua a implementação aceita na matriz de execução de tarefas; continue sob a autorização existente. Uma auditoria isolada termina com findings documentados e mudanças propostas.
