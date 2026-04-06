const COMMANDS = {
  en: [
    { name: 'analyze-project', description: 'Analyze repository stack, patterns, and conventions to generate project rules' },
    { name: 'brainstorm', description: 'Explore ideas and directions before starting implementation' },
    { name: 'bugfix', description: 'Analyze and fix bugs with automatic triage (bug vs feature vs scope)' },
    { name: 'code-review', description: 'Formal code review (Level 3) with persisted report' },
    { name: 'commit', description: 'Create semantic commits following Conventional Commits' },
    { name: 'create-prd', description: 'Create a Product Requirements Document with clarification questions' },
    { name: 'create-tasks', description: 'Break down PRD and TechSpec into implementable tasks' },
    { name: 'create-techspec', description: 'Create a Technical Specification from an existing PRD' },
    { name: 'deep-research', description: 'Conduct multi-source research with citation tracking and verification' },
    { name: 'fix-qa', description: 'Fix bugs found during QA and retest until stable' },
    { name: 'generate-pr', description: 'Generate a Pull Request with structured description' },
    { name: 'help', description: 'Show complete guide of available commands and workflows' },
    { name: 'refactoring-analysis', description: 'Audit codebase for code smells and refactoring opportunities with prioritized report' },
    { name: 'review-implementation', description: 'Review if all PRD requirements were correctly implemented' },
    { name: 'run-plan', description: 'Execute ALL tasks sequentially until the plan is complete' },
    { name: 'run-qa', description: 'Run visual QA with browser automation, E2E tests, and accessibility' },
    { name: 'run-task', description: 'Execute a single task with built-in validation and testing' },
  ],
  'pt-br': [
    { name: 'analyze-project', description: 'Analisa stack, patterns e convencoes do repositorio para gerar regras do projeto' },
    { name: 'brainstorm', description: 'Explorar ideias e direcoes antes de comecar a implementacao' },
    { name: 'bugfix', description: 'Analisar e corrigir bugs com triagem automatica (bug vs feature vs escopo)' },
    { name: 'code-review', description: 'Code review formal (Nivel 3) com relatorio persistido' },
    { name: 'commit', description: 'Criar commits semanticos seguindo Conventional Commits' },
    { name: 'create-prd', description: 'Criar um Product Requirements Document com perguntas de clarificacao' },
    { name: 'create-tasks', description: 'Quebrar PRD e TechSpec em tasks implementaveis' },
    { name: 'create-techspec', description: 'Criar uma Especificacao Tecnica a partir de um PRD existente' },
    { name: 'deep-research', description: 'Pesquisa multi-fonte com rastreamento de citacoes e verificacao' },
    { name: 'fix-qa', description: 'Corrigir bugs encontrados no QA e retestar ate estabilizar' },
    { name: 'generate-pr', description: 'Gerar um Pull Request com descricao estruturada' },
    { name: 'help', description: 'Mostrar guia completo dos comandos e fluxos disponiveis' },
    { name: 'refactoring-analysis', description: 'Auditar codebase para code smells e oportunidades de refatoracao com relatorio priorizado' },
    { name: 'review-implementation', description: 'Revisar se todos os requisitos do PRD foram implementados corretamente' },
    { name: 'run-plan', description: 'Executar TODAS as tasks sequencialmente ate completar o plano' },
    { name: 'run-qa', description: 'Executar QA visual com automacao de browser, testes E2E e acessibilidade' },
    { name: 'run-task', description: 'Executar uma task com validacao e testes integrados' },
  ],
};

const PLATFORMS = {
  claude: {
    dir: '.claude/skills',
    wrapperTemplate: (name, description) => `---
name: ${name}
description: ${description}
---

Read and follow ALL instructions in \`ai/commands/${name}.md\`.
`,
  },
  codex: {
    dir: '.codex/skills',
    wrapperTemplate: (name, description) => `---
name: ${name}
description: Imported from ./ai/commands/${name}.md
---
<system_instructions>
This skill redirects to the project's source command.

Source of truth: \`ai/commands/${name}.md\`

1. Open and read \`ai/commands/${name}.md\` before executing.
2. Follow the source command entirely.
3. If divergence exists, the command file prevails.
</system_instructions>
`,
  },
  agents: {
    dir: '.agents/skills',
    wrapperTemplate: (name, description) => `---
name: ${name}
description: ${description}
---
<system_instructions>
Source of truth: \`ai/commands/${name}.md\`

Read and follow the complete instructions in the command file above.
This wrapper exists for tool discovery. All logic lives in ai/commands/.
</system_instructions>
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
    args: ['-y', '@anthropic-ai/mcp-server-playwright'],
  },
};

module.exports = { COMMANDS, PLATFORMS, MCP_SERVERS };
