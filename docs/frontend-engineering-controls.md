# Controles de engenharia do frontend

Implementação de 9 de setembro de 2026, motivada pelo [artigo de Yuri Mikhin, da Evil Martians](https://evilmartians.com/chronicles/ten-anti-ai-slop-moves-for-frontend-projects-going-faster-than-humans-can-review), publicado em 1º de setembro. A adaptação combina a análise do nosso scaffold com as fontes primárias vinculadas na [referência operacional](../scaffold/skills/dw-ui-discipline/references/frontend-engineering.md).

## Diagnóstico e mudanças

O dev-workflow é uma CLI JavaScript que distribui instruções, scripts e skills. Não contém uma aplicação React/TypeScript para receber os plugins do artigo. A mudança foi feita nos fluxos que orientam projetos consumidores, com testes adicionais para os validadores que este repositório realmente executa.

| Área | Situação encontrada | Implementação |
|---|---|---|
| Contratos | QA já mencionava OpenAPI; faltava orientar a cadeia contrato → cliente → validação | Referência exige identificar a autoridade, reproduzir geração e verificar o uso real do validador |
| Tipos | Revisão proibia `any`, sem estratégia para configuração efetiva e migração | Orientação considera configuração herdada e adoção por módulo |
| Lint | Rules descreviam convenções | Seleção de diagnósticos conforme framework e runner, com justificativa |
| Arquitetura | Existiam princípios declarativos | Planejamento registra configuração e evidência de limites de imports |
| Detectores próprios | Validador de instruções tinha verificação do scaffold válido | Novos testes introduzem referências ausentes e excesso de tamanho, incluindo bytes UTF-8 |
| Feedback | Skills e referências já eram carregadas sob demanda | Novos detalhes entram por rotas específicas; instruções raiz não cresceram nesta rodada |
| Mutação | Referência antiga recomendava instalação universal e priorização do score | Procedimento delimitado por comportamento, análise de sobreviventes e validade do cache |
| Código morto | Faltava procedimento específico para frontend | Orientação exige avaliar entradas reais, exports públicos, aliases e exclusões antes de remover |
| Duplicação | Revisão já evitava abstrações prematuras | Acrescentada distinção operacional entre lógica compartilhada e repetição intencional |
| CI | Já rodava testes, validação e pacote em Node 18/22/24 | Mantido; novos testes entram na suíte existente |

## Como os fluxos usam isso

- `dw-analyze-project` documenta a baseline no arquivo de rules do módulo. Continua sendo apenas documental.
- `dw-plan` inclui decisões afetadas na TechSpec e transforma trabalho aceito em tarefas da matriz de execução existente.
- `dw-review` compara mudanças com a política adotada, inclusive novas exclusões e perda de cobertura do CI.
- `dw-qa` registra evidências e investigações pertinentes; testes de mutação não viram requisito de toda edição visual.
- `dw-verify` distingue resultados obrigatórios, diagnósticos e checks não executados.

O novo `frontend-quality-template.md`, em EN e PT-BR, registra configuração observada, política, comando/cwd/escopo e evidência. `required`, `advisory`, `deferred` e `not_applicable` descrevem política; `passed`, `failed` e `not_run` descrevem execução. Essa separação impede que uma recomendação seja apresentada como ferramenta configurada ou check aprovado.

## Limites e decisões de adoção

Não foram adicionadas dependências de frontend ao pacote nem modificadas configurações de projetos consumidores. As referências orientam implementações futuras conforme a stack e a autorização da tarefa. Também não configuram hooks ou proteção de branches automaticamente.

Uma API sem especificação exige investigação da fonte disponível, sem fabricar campos. Uma alteração de texto não demanda migração de ferramentas. Uma investigação de mutação precisa distinguir defeito relevante, comportamento equivalente e falha da ferramenta. Checks já obrigatórios continuam obrigatórios, mesmo quando uma ferramenta nova começa como diagnóstico. Esses cenários foram revisados nas instruções; não representam execuções reais de agentes em aplicações frontend.

## Validação

- `npm test`: 128 testes aprovados, incluindo três novos testes do validador de instruções.
- `npm run validate`: registries, limites de instruções e manifests aprovados.
- Validador de Skill Creator: três skills alteradas aprovadas.
- Instalação e atualização em diretórios temporários EN/PT-BR: templates e referências entregues; `package.json`, `tsconfig.json` e CI do consumidor preservados.
- `npm pack --dry-run`: novos recursos incluídos no pacote.

Não houve execução de Stryker, Knip, jscpd ou geradores de API contra uma aplicação real nesta rodada. A atribuição e as escolhas de adaptação estão em [skills-ecosystem-comparison.md](skills-ecosystem-comparison.md).
