<!-- dev-workflow:start -->
# dev-workflow — Instruções do agente

Use o menor workflow que atende à intenção e ao risco. Continue o trabalho autorizado até implementar, verificar e corrigir falhas. Instruções do usuário e autorização existente prevalecem sobre padrões do workflow; as permissões da plataforma continuam valendo.

## Roteamento

| Intenção e escopo | Ação |
|---|---|
| Explicação, localização de código ou exploração | Inspecione fontes relevantes e responda diretamente. |
| Mudança pequena, clara e de baixo risco | Implemente diretamente e verifique proporcionalmente. |
| Bug que exige investigação | `/dw-bugfix`; correção pequena e conhecida pode ficar inline. |
| Feature que precisa de especificação | `/dw-plan`; em pedido de implementação completa, continue após aprovar as tasks. |
| Implementação multicomponente até validação | `/dw-autopilot`; aprove o plano de tasks/execução e continue na mesma invocação. |
| Decisões pendentes de produto ou arquitetura | `/dw-brainstorm`, depois `/dw-plan` quando alinhado. Council somente quando perspectivas diferentes ajudarem a decisão. |
| Executar tasks aprovadas | `/dw-run`; `/dw-goal` para execução durável. |
| Retomar trabalho existente | `/dw-resume` ou `/dw-run --resume`; reutilize decisões e evidências salvas. |
| Pedido explícito de review / QA / commit / PR | `/dw-review` / `/dw-qa` / `/dw-commit` / `/dw-generate-pr`. |

Não inicie outro pipeline dentro de um workflow ativo. Pedido somente de plano ou investigação termina no artefato solicitado. Mais arquivos ou esforço não exigem parada: reorganize dentro do escopo aprovado e pergunte somente sobre escopo novo material, requisitos conflitantes ou decisões ausentes.

Para comandos especializados consulte `.dw/references/command-routing.md` ou `/dw-help`. Não carregue o catálogo completo em trabalho rotineiro.

## Planejamento e delegação

Na quebra de tasks, proponha desenvolvimento local ou cruzado e modelo, esforço e agentes por task considerando ambiguidade, dependências, risco e escopo. Leia `.dw/references/execution-contract.md` nessa etapa e ao executar/retomar o plano. A aprovação abrange essas escolhas e fallbacks declarados durante a execução.

Claude pode delegar implementação por `/dw-codex-run`; Codex pode usar `/dw-claude-run`. O parent conduz review, correções e continuidade. Agentes locais herdam o modelo da sessão salvo override aprovado na task. Delegue trabalho independente e delimitado quando melhorar qualidade ou tempo; mantenha trabalho pequeno ou acoplado local. Máximo de 3 workers por fluxo e nunca escritores simultâneos no mesmo worktree.

Leia primeiro arquivos relevantes. Use `.dw/intel/` ou code-explorer quando ajudar em fluxos amplos ou desconhecidos, conferindo o índice contra o código atual. Carregue entrypoints de skills somente para tasks correspondentes e referências somente para o modo escolhido. Subagentes recebem um pacote compacto e retornam evidências e decisões, não logs completos.

## Conclusão e limites

Um plano de implementação aprovado continua por implementação, review, QA aplicável e correções. Não pare só porque a primeira implementação ficou pronta ou o runner externo retornou. Reutilize decisões resolvidas na conversa. Preserve trabalho parcial e checkpoints duráveis em interrupções.

Entrega pronta atende aos critérios de aceitação, não tem achado bloqueante pendente e possui evidência válida de verificação. Evidência continua válida enquanto insumos, ambiente e escopo permanecerem equivalentes; outra mensagem não a invalida. Aplique `dw-verify` nos gates de entrega. Não adicione testes para mudanças de baixo impacto apenas para preencher template.

Merge, push, publicação e operações destrutivas exigem autorização aplicável; não pergunte novamente quando já autorizado. Prepare e valide o resultado concreto antes de pedir autorização final ausente. Worktree isola mudanças Git, não permissões do sistema operacional.

## Contratos do projeto

- Respeite `.dw/constitution.md`; desvios high/critical seguem o processo de ADR definido. Ausência não bloqueia: use defaults não bloqueantes.
- Planos aprovados precisam de dependências válidas e `tasks-validation.md`; corrija inconsistências internas antes de pedir aprovação.
- Complete os checks exigidos pelo projeto. Gates de segurança e PR continuam aplicáveis; segredos e achados bloqueantes não podem ser escondidos por nota ou build verde.
- Execução formal de tasks mantém commits atômicos com escopo e rastreabilidade de requisitos. Edição pequena direta não implica pedido de commit ou PR.

## Personalização

Este bloco fica entre os marcadores `<!-- dev-workflow:start -->` e `<!-- dev-workflow:end -->` e é atualizado pelo pacote. Coloque instruções específicas fora dos marcadores; não duplique o bloco inteiro. Configurações e overrides explícitos do projeto prevalecem no seu escopo.
<!-- dev-workflow:end -->
