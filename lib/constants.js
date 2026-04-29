const COMMANDS = {
  en: [
    { name: 'dw-adr', description: 'Records an architectural decision and the trade-offs accepted, before they get lost.' },
    { name: 'dw-analyze-project', description: 'Scans the repo to learn its stack and conventions, then writes the rules other commands rely on.' },
    { name: 'dw-autopilot', description: 'Takes a wish and runs the full PRD-to-PR pipeline, stopping only at three approval gates.' },
    { name: 'dw-brainstorm', description: 'Refines an idea using the product\'s existing features as ground truth, before any PRD.' },
    { name: 'dw-bugfix', description: 'Triages a bug report, asks three sharp questions, then fixes it or routes it to a PRD.' },
    { name: 'dw-code-review', description: 'Level-3 review against PRD, rules, tests, and security; saves a verdict you can act on.' },
    { name: 'dw-commit', description: 'Groups changes by intent and writes Conventional Commits messages that read clean.' },
    { name: 'dw-create-prd', description: 'Writes a PRD after asking the questions that would otherwise haunt the techspec later.' },
    { name: 'dw-create-tasks', description: 'Breaks the PRD and techspec into tasks small enough to ship one at a time.' },
    { name: 'dw-create-techspec', description: 'Translates a finished PRD into a techspec the team can actually build from.' },
    { name: 'dw-deep-research', description: 'Researches a topic across sources, tracks citations, and flags claims that don\'t check out.' },
    { name: 'dw-deps-audit', description: 'Finds outdated and supply-chain-compromised packages, drafts a per-package update plan, and runs scoped QA after each upgrade.' },
    { name: 'dw-dockerize', description: 'Reads a project, detects the stack and runtime deps, then proposes Dockerfile and docker-compose for dev and prod with explicit trade-offs.' },
    { name: 'dw-find-skills', description: 'Searches the npx skills ecosystem for a skill matching what you need, vets it, and installs it where you choose.' },
    { name: 'dw-fix-qa', description: 'Fixes bugs found in QA and retests them with screenshot evidence until they stay fixed.' },
    { name: 'dw-functional-doc', description: 'Maps screens and user flows into a functional doc, validated end-to-end with Playwright.' },
    { name: 'dw-generate-pr', description: 'Pushes the branch and opens a PR with a body that explains what changed and how to test it.' },
    { name: 'dw-help', description: 'Lists every command and the flows that connect them. Pass a keyword for a contextual shortcut.' },
    { name: 'dw-intel', description: 'Answers questions about the codebase using its own rules and intel as the source of truth.' },
    { name: 'dw-new-project', description: 'Interviews you about stack and infra, then scaffolds a working monorepo with docker-compose for dev, .env, scripts, CI, and seeded rules.' },
    { name: 'dw-quick', description: 'Runs a small, well-defined change with workflow guarantees, no PRD needed.' },
    { name: 'dw-redesign-ui', description: 'Audits a frontend page, proposes design directions you choose from, then ships the redesign.' },
    { name: 'dw-refactoring-analysis', description: 'Catalogs code smells in Fowler\'s vocabulary and ranks them by impact, P0 to P3.' },
    { name: 'dw-resume', description: 'Picks up where you left off — reads the active PRD, the last task, and tells you what\'s next.' },
    { name: 'dw-review-implementation', description: 'Maps every PRD requirement to the code that delivers it, and lists what is still missing.' },
    { name: 'dw-revert-task', description: 'Reverts the commits of one task, but only after checking nothing downstream depends on it.' },
    { name: 'dw-run-plan', description: 'Runs every pending task in order, with PRD-compliance review at the end.' },
    { name: 'dw-run-qa', description: 'Drives the browser to test happy paths, edge cases, and accessibility, with screenshot proof.' },
    { name: 'dw-run-task', description: 'Implements one task, runs the validation that comes with it, and commits when it passes.' },
    { name: 'dw-security-check', description: 'OWASP review plus Trivy CVE/secret/IaC scan for TS, Python, C#, or Rust. CRITICAL or HIGH blocks the PR.' },
    { name: 'dw-update', description: 'Updates dev-workflow to the latest npm release in-place, with a snapshot you can roll back to.' },
  ],
  'pt-br': [
    { name: 'dw-adr', description: 'Registra uma decisao arquitetural e os trade-offs aceitos, antes que se percam.' },
    { name: 'dw-analyze-project', description: 'Escaneia o repo para aprender stack e convencoes, e escreve as regras que os outros commands usam.' },
    { name: 'dw-autopilot', description: 'Pega um desejo e roda do PRD ao PR, parando so em tres gates de aprovacao.' },
    { name: 'dw-brainstorm', description: 'Refina uma ideia usando as features existentes do produto como base, antes de qualquer PRD.' },
    { name: 'dw-bugfix', description: 'Tria um bug, faz tres perguntas certas, e entao corrige ou redireciona para PRD.' },
    { name: 'dw-code-review', description: 'Review Nivel 3 contra PRD, rules, testes e seguranca; gera um veredicto acionavel.' },
    { name: 'dw-commit', description: 'Agrupa as mudancas por intencao e escreve mensagens Conventional Commits limpas.' },
    { name: 'dw-create-prd', description: 'Escreve um PRD depois de fazer as perguntas que assombrariam o techspec depois.' },
    { name: 'dw-create-tasks', description: 'Quebra PRD e techspec em tasks pequenas o suficiente para entregar uma de cada vez.' },
    { name: 'dw-create-techspec', description: 'Traduz um PRD pronto em um techspec que o time consegue construir de fato.' },
    { name: 'dw-deep-research', description: 'Pesquisa um topico em varias fontes, rastreia citacoes e marca o que nao confere.' },
    { name: 'dw-deps-audit', description: 'Encontra pacotes desatualizados e comprometidos por supply-chain, monta plano de update por pacote e roda QA do que foi afetado.' },
    { name: 'dw-dockerize', description: 'Le um projeto, detecta stack e deps de runtime, e propoe Dockerfile e docker-compose para dev e prod com trade-offs explicitos.' },
    { name: 'dw-find-skills', description: 'Busca no ecossistema npx skills uma skill que resolva o que voce precisa, valida e instala onde voce escolher.' },
    { name: 'dw-fix-qa', description: 'Corrige bugs do QA e retesta com evidencia em screenshot ate ficarem estaveis.' },
    { name: 'dw-functional-doc', description: 'Mapeia telas e fluxos em um dossie funcional, validado E2E com Playwright.' },
    { name: 'dw-generate-pr', description: 'Faz push da branch e abre um PR com corpo explicando o que mudou e como testar.' },
    { name: 'dw-help', description: 'Lista todos os commands e os fluxos que os conectam. Passe uma keyword para atalho contextual.' },
    { name: 'dw-intel', description: 'Responde perguntas sobre o codebase usando suas proprias rules e intel como fonte.' },
    { name: 'dw-new-project', description: 'Entrevista voce sobre stack e infra, depois faz scaffold de um monorepo com docker-compose para dev, .env, scripts, CI e rules seed.' },
    { name: 'dw-quick', description: 'Roda uma mudanca pequena e bem definida com garantias do workflow, sem precisar de PRD.' },
    { name: 'dw-redesign-ui', description: 'Audita uma pagina frontend, propoe direcoes de design que voce escolhe, e entrega o redesign.' },
    { name: 'dw-refactoring-analysis', description: 'Cataloga code smells no vocabulario de Fowler e ranqueia por impacto, P0 a P3.' },
    { name: 'dw-resume', description: 'Retoma de onde voce parou — le o PRD ativo, a ultima task, e diz qual o proximo passo.' },
    { name: 'dw-review-implementation', description: 'Mapeia cada requisito do PRD ao codigo que o entrega, e lista o que ainda falta.' },
    { name: 'dw-revert-task', description: 'Reverte os commits de uma task, mas so depois de checar que nada a frente depende dela.' },
    { name: 'dw-run-plan', description: 'Roda todas as tasks pendentes em ordem, com review de PRD compliance no final.' },
    { name: 'dw-run-qa', description: 'Pilota o browser para testar fluxo feliz, edge cases e acessibilidade, com screenshot.' },
    { name: 'dw-run-task', description: 'Implementa uma task, roda a validacao que vem com ela, e commita quando passa.' },
    { name: 'dw-security-check', description: 'Review OWASP + scan Trivy CVE/secret/IaC para TS, Python, C# ou Rust. CRITICAL ou HIGH bloqueia PR.' },
    { name: 'dw-update', description: 'Atualiza o dev-workflow para o release mais recente no npm, com snapshot para rollback.' },
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
