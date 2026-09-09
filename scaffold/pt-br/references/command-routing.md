# Roteamento de comandos

Aplique primeiro as regras de roteamento da raiz. Consulte este catálogo somente para localizar um comando especializado. Uma sugestão de comando não autoriza publicação, merge ou outro workflow.

## Trigger Map

| Intenção do usuário (literal ou parafraseada) | Auto-trigger |
|------------------------------------------------|--------------|
| "Implementa X" / "Cria Y" / "Adiciona feature Z" / "Preciso de..." | `/dw-plan` / `/dw-autopilot` |
| "Autopilota esse PRD" / "Leva esse PRD pra PR" / continua escalação de bugfix autonomamente | `/dw-autopilot --from-prd <slug>` (PRD existente em `.dw/spec/<slug>/`) |
| "Retoma autopilot" / "continua depois do plan" / `autopilot-state.json` tem `status: plan_complete` | `/dw-autopilot` (ou `/dw-goal --from-autopilot <slug>` se o usuário pedir especificamente a etapa de goal) |
| Erro colado / "X está quebrado" / "Bug em Y" / screenshot de teste falhando | `/dw-bugfix "X"` |
| "Planeja essa feature" / "Escreve PRD + techspec + tasks" | `/dw-plan "X"` |
| "Escreve PRD pra X" / "Especifica Y" | `/dw-plan prd "X"` |
| "Desenha a arquitetura" / "Faz o techspec" | `/dw-plan techspec` |
| "Quebra em tasks" | `/dw-plan tasks` |
| "Roda essa task" (com ID da task) | `/dw-run <ID>` |
| "Roda todas as tasks pendentes" / "Executa o plano" | `/dw-run` |
| "Roda isso como goal" / "objetivo durável" / "long-running objective" | `/dw-goal "<objetivo>"` |
| "Continue de onde parei" | `/dw-run --resume` |
| "Pausa o trabalho" / "Encerra a sessão" / "Salva onde paramos" | `/dw-pause` |
| "Report de N em N minutos" / "Me mantém informado enquanto isso roda" / "Quero status periódico" | `/dw-report [--every <N>m]` |
| "Cria uma worktree pra X" / "Limpa as worktrees" / "Mergeia a worktree X" / "Quantas worktrees sobraram?" | `/dw-worktree create <slug>` / `/dw-worktree clean --apply` / `/dw-worktree merge <slug>` / `/dw-worktree list` |
| "Retoma" / "Onde paramos?" / "Volta de onde parei" | `/dw-resume` |
| "QA dessa feature" / "Roda o test plan" | `/dw-qa` |
| "Corrige os bugs do QA" | `/dw-qa --fix` |
| "Avalia a feature AI" / "Testa o RAG / classifier" | `/dw-qa --ai` |
| "Caminha comigo pela feature" / "UAT comigo" / "Vamos fazer um run-through manual" | `/dw-qa --uat` |
| "Revisa esse bugfix" / "Code-review do fix `<slug>`" | `/dw-review --bugfix <slug>` |
| "QA desse bugfix" / "Valida o fix `<slug>`" | `/dw-qa --bugfix <slug>` |
| "Revisa meu PR" / "Checa qualidade" / "Tá pronto pra subir?" | `/dw-review` |
| "Só checagem de cobertura PRD" | `/dw-review --coverage-only` |
| "Só code review qualidade" | `/dw-review --code-only` |
| "Hora de commitar" / mudanças validadas e prontas | `/dw-commit` |
| "Abre um PR" / "Sobe isso" | `/dw-generate-pr` |
| "Sugere ideias novas" / "O que devemos construir agora?" / "Encontra oportunidades" / "Ideias de roadmap" | `/dw-opportunities` |
| "Que melhorias de seguranca devemos considerar?" / "Encontra oportunidades de seguranca" | `/dw-opportunities "security"` |
| "Brainstorm X" / "Explora essa ideia" / "Research X" | `/dw-brainstorm "X"` (auto-dispatch dos modos grill / prototype / council / research / onepager conforme os sinais) |
| "Auditoria de saude do codigo" / "Tech debt" / "Oportunidades de refactor" / "Smells em X" | `/dw-refactor "X"` |
| "Onde está X?" / "O que usa Y?" / "Como Z é estruturado?" | `/dw-intel "<pergunta>"` |
| "Reconstrói o índice" / "Refresh do intel" | `/dw-intel --build` |
| "Contexto pesado" / "Audita uso de tokens" / "Por que o agente está lento?" | `/dw-context-budget` |
| "Checa instalação dev-workflow" / "Agentes/wrappers estão saudáveis?" | `/dw-harness-audit` |
| "Audita skills" / "Skills parecem duplicadas ou pesadas" | `/dw-skill-health` |
| "Redesign dessa UI" / "Audita e entrega novo design" | `/dw-redesign-ui "<target>"` |
| "Audita dependências" / "Estamos atrasados em pacotes?" | `/dw-secure-audit --plan` |
| "Scan de vulnerabilidades" / "Check de segurança" | `/dw-secure-audit` |
| "Analisa esse projeto" / "Gera rules" | `/dw-analyze-project` |
| "Abre um novo projeto" / "Bootstrap de stack" | `/dw-new-project` |
| "Dockeriza isso" / "Adiciona docker-compose" | `/dw-dockerize` |
| "Functional doc" / "Mapeia screens e flows" | `/dw-functional-doc` |
| "Instala skills Azure" / "Configura MCP do Microsoft docs" / "Adiciona expertise Azure" / "Vou trabalhar com Azure" | `/dw-install-azure-skills` |
| "Instala skills AWS" / "Configura MCP da AWS" / "Adiciona expertise AWS" / "Vou trabalhar com AWS" | `/dw-install-aws-skills` |
