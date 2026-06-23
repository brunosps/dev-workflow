const COMMANDS = {
  en: [
    { name: 'dw-adr', description: 'Records an architectural decision and the trade-offs accepted, before they get lost.' },
    { name: 'dw-analyze-project', description: 'Scans the repo to learn its stack and conventions, then writes the rules other commands rely on.' },
    { name: 'dw-autopilot', description: 'Trigger when user asks to implement, build, create, or add a feature non-trivially. First invocation plans and stops; second invocation resumes via dw-goal, then commit and PR.' },
    { name: 'dw-brainstorm', description: 'Refine a concrete idea against the product\'s existing features. Modes: ideation, --research, --onepager, --council. Use dw-opportunities before you have an idea and dw-refactor for code-health audits.' },
    { name: 'dw-bugfix', description: 'Trigger when user reports a bug, pastes an error, or describes broken behavior. Triages with three questions, then fixes or routes to PRD.' },
    { name: 'dw-claude-run', description: 'Trigger when user asks to run/fire Claude (claude -p headless) in a dedicated worktree to implement a prepared prompt/spec. Claude adapter over the dw-cli-run protocol: durable audit log, resumable session via --session-id, 0-10 dual evaluation, STOP for the gate. Never the main checkout; never merges.' },
    { name: 'dw-codex-run', description: 'Trigger when user asks to run/fire Codex (codex exec) in a dedicated worktree to implement a prepared prompt/spec. Codex adapter over the dw-cli-run protocol: durable audit log, resumable per-task session, 0-10 dual evaluation, STOP for the gate. Never the main checkout; never merges.' },
    { name: 'dw-commit', description: 'Trigger when implementation is complete and pending changes need to be committed. Atomic commits with Conventional Commits messages.' },
    { name: 'dw-copilot-run', description: 'Trigger when user asks to run/fire GitHub Copilot CLI (copilot -p) in a dedicated worktree to implement a prepared prompt/spec. Copilot adapter over the dw-cli-run protocol: durable audit log, resumable session, 0-10 dual evaluation, STOP for the gate. Never the main checkout; never merges.' },
    { name: 'dw-dockerize', description: 'Reads a project, detects the stack and runtime deps, then proposes Dockerfile and docker-compose for dev and prod with explicit trade-offs.' },
    { name: 'dw-find-skills', description: 'Searches the npx skills ecosystem for a skill matching what you need, vets it, and installs it where you choose.' },
    { name: 'dw-functional-doc', description: 'Maps screens and user flows into a functional doc, validated end-to-end with Playwright.' },
    { name: 'dw-generate-pr', description: 'Trigger when commits are ready and the branch needs a PR. Pushes branch and opens PR with summary + test plan + hard verify gate.' },
    { name: 'dw-goal', description: 'Trigger when long-running implementation work needs a durable objective. Portable Codex-style goal contract; used by autopilot after planning.' },
    { name: 'dw-help', description: 'Lists primary commands and the flows that connect them. Pass --advanced to see internal/hidden commands.' },
    { name: 'dw-context-budget', description: 'Audits context overhead from commands, skills, agents, instructions, and MCPs; recommends token savings.' },
    { name: 'dw-harness-audit', description: 'Runs a deterministic health scorecard for dev-workflow installation, agents, MCPs, gates, and context discipline.' },
    { name: 'dw-install-aws-skills', description: 'Trigger when user asks to install AWS expertise, setup AWS MCP server, or add AWS agent skills. Opt-in: clones curated skills from aws/agent-toolkit-for-aws into .agents/skills/aws/ and registers the unified AWS MCP Server (stdio via mcp-proxy-for-aws). Requires uv, aws cli, and AWS credentials.' },
    { name: 'dw-install-azure-skills', description: 'Trigger when user asks to install Azure expertise, setup Microsoft docs MCP, or add Azure agent skills. Opt-in: clones curated skills from MicrosoftDocs/Agent-Skills into .agents/skills/azure/ and registers the Microsoft Learn MCP server.' },
    { name: 'dw-intel', description: 'Codebase intelligence: query mode (default) answers questions citing .dw/intel/ + .dw/rules/; --build mode (re)builds the index.' },
    { name: 'dw-new-project', description: 'Interviews you about stack and infra, then scaffolds a working monorepo with docker-compose for dev, .env, scripts, CI, and seeded rules.' },
    { name: 'dw-opportunities', description: 'Scans the installed project for product, UX, automation, refactor, and security opportunities, then routes each idea to the right next dw-* command.' },
    { name: 'dw-pause', description: 'Trigger when user says "pause work", "end session", or "save where we are". Consolidates open loops, decisions, blockers, and todos into .dw/STATE.md so the next session can resume.' },
    { name: 'dw-plan', description: 'Trigger when user has a feature idea and needs spec + architecture + tasks. Runs PRD → TechSpec → Tasks sequentially. Stages: prd / techspec / tasks; --from techspec; --council.' },
    { name: 'dw-qa', description: 'Trigger when user wants to validate behavior beyond unit tests. Mode-aware (UI / API / --ai / --uat). --fix enters the iterative QA + fix-retest loop. --bugfix <slug> targets a .dw/bugfixes/ entry.' },
    { name: 'dw-redesign-ui', description: 'Audits a frontend page, proposes design directions you choose from, then ships the redesign.' },
    { name: 'dw-refactor', description: 'Audits a target for refactor opportunities using the refactor-audit protocol, Fowler smells, deep-modules analysis, and behavior-preserving test gates.' },
    { name: 'dw-resume', description: 'Trigger when user says "resume work", "where did we stop?", or starts a session in a project with an existing .dw/STATE.md. Reads STATE.md, presents a TLDR, and suggests the next dw-* command.' },
    { name: 'dw-review', description: 'Trigger when user asks to review code, check quality, or verify PR readiness. Default runs L2 (PRD coverage) + L3 (code quality). Flags --coverage-only / --code-only / --bugfix <slug>.' },
    { name: 'dw-run', description: 'Trigger when user wants to execute tasks. Default runs all pending in dependency order; \'run <task-id>\' runs one; \'run --resume\' continues an interrupted plan.' },
    { name: 'dw-secure-audit', description: 'Security Gate: OWASP + Semgrep SAST (diff) + gitleaks secrets + Trivy SCA/IaC + lockfile + supply-chain + outdated. Rigoroso: secrets/CRITICAL/HIGH block. Auto-invoked by /dw-review and /dw-generate-pr, explicit phase in /dw-autopilot, and runnable standalone.' },
    { name: 'dw-skill-health', description: 'Audits installed skills and agents for bloat, duplication, missing references, and stale or unused modules.' },
    { name: 'dw-subtask-start', description: 'Creates a minimal input packet for a subagent without injecting the parent transcript.' },
    { name: 'dw-subtask-complete', description: 'Records a structured subagent handoff with result, files, decisions, risks, verification, and blockers.' },
    { name: 'dw-subtask-resume', description: 'Consumes pending subagent handoffs, summarizes them for the parent, and archives the local packets.' },
    { name: 'dw-update', description: 'Updates dev-workflow to the latest npm release in-place, with a snapshot you can roll back to.' },
  ],
  'pt-br': [
    { name: 'dw-adr', description: 'Registra uma decisao arquitetural e os trade-offs aceitos, antes que se percam.' },
    { name: 'dw-analyze-project', description: 'Escaneia o repo para aprender stack e convencoes, e escreve as regras que os outros commands usam.' },
    { name: 'dw-autopilot', description: 'Trigger quando usuario pede pra implementar, criar ou adicionar uma feature nao-trivial. Primeira invocacao planeja e para; segunda retoma via dw-goal, depois commit e PR.' },
    { name: 'dw-brainstorm', description: 'Refina uma ideia concreta contra features existentes do produto. Modos: ideacao, --research, --onepager, --council. Use dw-opportunities antes de ter uma ideia e dw-refactor para auditoria de code health.' },
    { name: 'dw-bugfix', description: 'Trigger quando usuario reporta bug, cola erro ou descreve comportamento quebrado. Tria com tres perguntas, depois corrige ou roteia pra PRD.' },
    { name: 'dw-claude-run', description: 'Trigger quando usuario pede pra rodar/disparar o Claude (claude -p headless) numa worktree dedicada pra implementar um prompt/spec preparado. Adapter Claude sobre o protocolo dw-cli-run: log de auditoria duravel, sessao resumivel via --session-id, dupla avaliacao 0-10, PARA pro gate. Nunca no checkout principal; nunca mergeia.' },
    { name: 'dw-codex-run', description: 'Trigger quando usuario pede pra rodar/disparar o Codex (codex exec) numa worktree dedicada pra implementar um prompt/spec preparado. Adapter Codex sobre o protocolo dw-cli-run: log de auditoria duravel, sessao resumivel por tarefa, dupla avaliacao 0-10, PARA pro gate. Nunca no checkout principal; nunca mergeia.' },
    { name: 'dw-commit', description: 'Trigger quando implementacao esta completa e ha mudancas pendentes pra commit. Commits atomicos com mensagens Conventional Commits.' },
    { name: 'dw-copilot-run', description: 'Trigger quando usuario pede pra rodar/disparar o GitHub Copilot CLI (copilot -p) numa worktree dedicada pra implementar um prompt/spec preparado. Adapter Copilot sobre o protocolo dw-cli-run: log de auditoria duravel, sessao resumivel, dupla avaliacao 0-10, PARA pro gate. Nunca no checkout principal; nunca mergeia.' },
    { name: 'dw-dockerize', description: 'Le um projeto, detecta stack e deps de runtime, e propoe Dockerfile e docker-compose para dev e prod com trade-offs explicitos.' },
    { name: 'dw-find-skills', description: 'Busca no ecossistema npx skills uma skill que resolva o que voce precisa, valida e instala onde voce escolher.' },
    { name: 'dw-functional-doc', description: 'Mapeia telas e fluxos em um dossie funcional, validado E2E com Playwright.' },
    { name: 'dw-generate-pr', description: 'Trigger quando commits estao prontos e branch precisa de PR. Push da branch e abre PR com summary + test plan + hard verify gate.' },
    { name: 'dw-goal', description: 'Trigger quando trabalho longo precisa de objetivo duravel. Contrato portavel estilo Codex goal; usado pelo autopilot apos o planejamento.' },
    { name: 'dw-help', description: 'Lista comandos primarios e fluxos que os conectam. Passe --advanced para ver comandos internos/escondidos.' },
    { name: 'dw-context-budget', description: 'Audita overhead de contexto em comandos, skills, agentes, instrucoes e MCPs; recomenda economia de tokens.' },
    { name: 'dw-harness-audit', description: 'Roda um scorecard deterministico da instalacao dev-workflow, agentes, MCPs, gates e disciplina de contexto.' },
    { name: 'dw-install-aws-skills', description: 'Trigger quando usuario pede pra instalar expertise AWS, configurar MCP da AWS, ou adicionar agent skills AWS. Opt-in: clona skills curadas de aws/agent-toolkit-for-aws para .agents/skills/aws/ e registra o AWS MCP Server unificado (stdio via mcp-proxy-for-aws). Requer uv, aws cli e credenciais AWS.' },
    { name: 'dw-install-azure-skills', description: 'Trigger quando usuario pede pra instalar expertise Azure, configurar MCP do Microsoft docs, ou adicionar agent skills Azure. Opt-in: clona skills curadas de MicrosoftDocs/Agent-Skills para .agents/skills/azure/ e registra o Microsoft Learn MCP server.' },
    { name: 'dw-intel', description: 'Inteligencia do codebase: modo query (default) responde citando .dw/intel/ + .dw/rules/; modo --build (re)constroi indice.' },
    { name: 'dw-new-project', description: 'Entrevista voce sobre stack e infra, depois faz scaffold de um monorepo com docker-compose para dev, .env, scripts, CI e rules seed.' },
    { name: 'dw-opportunities', description: 'Escaneia o projeto instalado por oportunidades de produto, UX, automacao, refactor e seguranca, e roteia cada ideia para o proximo comando dw-* correto.' },
    { name: 'dw-pause', description: 'Trigger quando usuario diz "pausa o trabalho", "encerra a sessao" ou "salva onde paramos". Consolida pontas soltas, decisoes, bloqueios e todos em .dw/STATE.md para a proxima sessao retomar.' },
    { name: 'dw-plan', description: 'Trigger quando usuario tem ideia de feature e precisa spec + arquitetura + tasks. Roda PRD → TechSpec → Tasks sequencial. Stages: prd / techspec / tasks; --from techspec; --council.' },
    { name: 'dw-qa', description: 'Trigger quando usuario quer validar comportamento alem de unit tests. Mode-aware (UI / API / --ai / --uat). --fix entra no loop iterativo QA + fix-retest. --bugfix <slug> aponta para uma entrada em .dw/bugfixes/.' },
    { name: 'dw-redesign-ui', description: 'Audita uma pagina frontend, propoe direcoes de design que voce escolhe, e entrega o redesign.' },
    { name: 'dw-refactor', description: 'Audita um target por oportunidades de refactor usando o protocolo refactor-audit, smells Fowler, deep-modules e gates de teste preservando comportamento.' },
    { name: 'dw-resume', description: 'Trigger quando usuario diz "retoma", "onde paramos?" ou comeca sessao num projeto com .dw/STATE.md existente. Le STATE.md, apresenta TLDR e sugere proximo comando dw-*.' },
    { name: 'dw-review', description: 'Trigger quando usuario pede pra revisar codigo, checar qualidade ou validar prontidao pra PR. Default roda L2 (cobertura PRD) + L3 (qualidade). Flags --coverage-only / --code-only / --bugfix <slug>.' },
    { name: 'dw-run', description: 'Trigger quando usuario quer executar tasks. Default roda todas pendentes em ordem de dependencia; \'run <task-id>\' roda uma; \'run --resume\' continua plan interrompido.' },
    { name: 'dw-secure-audit', description: 'Security Gate: OWASP + Semgrep SAST (diff) + gitleaks secrets + Trivy SCA/IaC + lockfile + supply-chain + outdated. Rigoroso: secrets/CRITICAL/HIGH bloqueiam. Auto-invocado por /dw-review e /dw-generate-pr, fase explicita no /dw-autopilot, e executavel standalone.' },
    { name: 'dw-skill-health', description: 'Audita skills e agentes instalados por bloat, duplicacao, referencias quebradas e modulos sem uso.' },
    { name: 'dw-subtask-start', description: 'Cria um input packet minimo para subagente sem injetar transcript bruto do parent.' },
    { name: 'dw-subtask-complete', description: 'Registra handoff estruturado do subagente com resultado, arquivos, decisoes, riscos, verificacao e bloqueios.' },
    { name: 'dw-subtask-resume', description: 'Consome handoffs pendentes de subagentes, resume para o parent e arquiva os pacotes locais.' },
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
