const COMMANDS = {
  en: [
    { name: 'dw-analyze-project', description: 'Analyze repository stack, patterns, and conventions to generate project rules' },
    { name: 'dw-autopilot', description: 'Full pipeline orchestrator from a wish to a PR with minimal intervention (research, PRD, tasks, execution, QA, review, commit)' },
    { name: 'dw-brainstorm', description: 'Explore ideas and directions before starting implementation' },
    { name: 'dw-bugfix', description: 'Analyze and fix bugs with automatic triage (bug vs feature vs scope)' },
    { name: 'dw-code-review', description: 'Formal code review (Level 3) with persisted report' },
    { name: 'dw-commit', description: 'Create semantic commits following Conventional Commits' },
    { name: 'dw-create-prd', description: 'Create a Product Requirements Document with clarification questions' },
    { name: 'dw-create-tasks', description: 'Break down PRD and TechSpec into implementable tasks' },
    { name: 'dw-create-techspec', description: 'Create a Technical Specification from an existing PRD' },
    { name: 'dw-deep-research', description: 'Conduct multi-source research with citation tracking and verification' },
    { name: 'dw-fix-qa', description: 'Fix bugs found during QA and retest until stable' },
    { name: 'dw-functional-doc', description: 'Generate functional documentation dossier with screen mapping, E2E flows, and Playwright validation' },
    { name: 'dw-generate-pr', description: 'Generate a Pull Request with structured description' },
    { name: 'dw-help', description: 'Show complete guide of available commands and workflows' },
    { name: 'dw-intel', description: 'Query codebase intelligence to understand patterns, conventions, and architecture' },
    { name: 'dw-quick', description: 'Execute a one-off task with workflow guarantees without requiring a full PRD' },
    { name: 'dw-redesign-ui', description: 'Analyze, propose, and implement frontend page/component redesigns with design system integration' },
    { name: 'dw-refactoring-analysis', description: 'Audit codebase for code smells and refactoring opportunities with prioritized report' },
    { name: 'dw-resume', description: 'Restore session context and suggest the next workflow step' },
    { name: 'dw-review-implementation', description: 'Review if all PRD requirements were correctly implemented' },
    { name: 'dw-run-plan', description: 'Execute ALL tasks sequentially until the plan is complete' },
    { name: 'dw-run-qa', description: 'Run visual QA with browser automation, E2E tests, and accessibility' },
    { name: 'dw-run-task', description: 'Execute a single task with built-in validation and testing' },
    { name: 'dw-update', description: 'Update dev-workflow to the latest version published on npm without leaving the agent session' },
  ],
  'pt-br': [
    { name: 'dw-analyze-project', description: 'Analisa stack, patterns e convencoes do repositorio para gerar regras do projeto' },
    { name: 'dw-autopilot', description: 'Orquestrador completo de um desejo ate o PR com minima intervencao (pesquisa, PRD, tasks, execucao, QA, review, commit)' },
    { name: 'dw-brainstorm', description: 'Explorar ideias e direcoes antes de comecar a implementacao' },
    { name: 'dw-bugfix', description: 'Analisar e corrigir bugs com triagem automatica (bug vs feature vs escopo)' },
    { name: 'dw-code-review', description: 'Code review formal (Nivel 3) com relatorio persistido' },
    { name: 'dw-commit', description: 'Criar commits semanticos seguindo Conventional Commits' },
    { name: 'dw-create-prd', description: 'Criar um Product Requirements Document com perguntas de clarificacao' },
    { name: 'dw-create-tasks', description: 'Quebrar PRD e TechSpec em tasks implementaveis' },
    { name: 'dw-create-techspec', description: 'Criar uma Especificacao Tecnica a partir de um PRD existente' },
    { name: 'dw-deep-research', description: 'Pesquisa multi-fonte com rastreamento de citacoes e verificacao' },
    { name: 'dw-fix-qa', description: 'Corrigir bugs encontrados no QA e retestar ate estabilizar' },
    { name: 'dw-functional-doc', description: 'Gerar dossie funcional com mapeamento de telas, fluxos E2E e validacao com Playwright' },
    { name: 'dw-generate-pr', description: 'Gerar um Pull Request com descricao estruturada' },
    { name: 'dw-help', description: 'Mostrar guia completo dos comandos e fluxos disponiveis' },
    { name: 'dw-intel', description: 'Consultar inteligencia do codebase para entender padroes, convencoes e arquitetura' },
    { name: 'dw-quick', description: 'Executar uma task pontual com garantias do workflow sem precisar de PRD completo' },
    { name: 'dw-redesign-ui', description: 'Analisar, propor e implementar redesign de paginas/componentes frontend com integracao de design system' },
    { name: 'dw-refactoring-analysis', description: 'Auditar codebase para code smells e oportunidades de refatoracao com relatorio priorizado' },
    { name: 'dw-resume', description: 'Restaurar contexto da sessao e sugerir o proximo passo do workflow' },
    { name: 'dw-review-implementation', description: 'Revisar se todos os requisitos do PRD foram implementados corretamente' },
    { name: 'dw-run-plan', description: 'Executar TODAS as tasks sequencialmente ate completar o plano' },
    { name: 'dw-run-qa', description: 'Executar QA visual com automacao de browser, testes E2E e acessibilidade' },
    { name: 'dw-run-task', description: 'Executar uma task com validacao e testes integrados' },
    { name: 'dw-update', description: 'Atualizar o dev-workflow para a versao mais recente publicada no npm sem sair da sessao do agente' },
  ],
};

const PLATFORMS = {
  claude: {
    dir: '.claude/skills',
    wrapperTemplate: (name, description) => `---
name: ${name}
description: "${description.replace(/"/g, '\\"')}"
---

Read and follow ALL instructions in \`.dw/commands/${name}.md\`.
`,
  },
  agents: {
    dir: '.agents/skills',
    wrapperTemplate: (name, description) => `---
name: ${name}
description: "${description.replace(/"/g, '\\"')}"
---
<system_instructions>
Source of truth: \`.dw/commands/${name}.md\`

Read and follow the complete instructions in the command file above.
This wrapper exists for tool discovery. All logic lives in .dw/commands/.
</system_instructions>
`,
  },
  opencode: {
    dir: '.opencode/commands',
    flat: true,
    wrapperTemplate: (name, description) => `---
description: ${description}
---
Follow ALL instructions in @.dw/commands/${name}.md

$ARGUMENTS
`,
  },
};

const MCP_SERVERS = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp'],
  },
  playwright: {
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
  },
};

module.exports = { COMMANDS, PLATFORMS, MCP_SERVERS };
