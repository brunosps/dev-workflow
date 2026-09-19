# Command routing

Use the installed root routing rules first. Consult this catalog only to locate a specialized command. A command suggestion is not authorization to publish, merge, or start an unrelated workflow.

## Trigger Map

| User intent (literal or paraphrased) | Auto-trigger |
|--------------------------------------|--------------|
| "Implement X" / "Build Y" / "Add feature Z" / "I need ..." / "Create ..." | `/dw-plan` / `/dw-autopilot` |
| "Autopilot this PRD" / "Take this PRD to PR" / continue a bugfix escalation autonomously | `/dw-autopilot --from-prd <slug>` (existing PRD at `.dw/spec/<slug>/`) |
| "Resume autopilot" / "continue after plan" / `autopilot-state.json` has `status: plan_complete` | `/dw-autopilot` (or `/dw-goal --from-autopilot <slug>` if the user specifically asks for the goal step) |
| Pasted error / "X is broken" / "Bug in Y" / failing test screenshot | `/dw-bugfix "X"` |
| "Plan this feature" / "Write a PRD + techspec + tasks" | `/dw-plan "X"` |
| "Write a PRD for X" / "Spec out Y" | `/dw-plan prd "X"` |
| "Design the architecture" / "Make the techspec" | `/dw-plan techspec` |
| "Break this into tasks" | `/dw-plan tasks` |
| "Run this task" (with task ID) | `/dw-run <ID>` |
| "Run all pending tasks" / "Execute the plan" | `/dw-run` |
| "Run this as a goal" / "durable goal" / "long-running objective" | `/dw-goal "<objective>"` |
| "Continue where I left off" | `/dw-run --resume` |
| "Pause work" / "End the session" / "Save where we are" | `/dw-pause` |
| "Report every N minutes" / "Keep me posted while this runs" / "Give me status reports" | `/dw-report [--every <N>m]` |
| "Create a worktree for X" / "Clean up the worktrees" / "Merge worktree X" / "How many worktrees are left?" | `/dw-worktree create <slug>` / `/dw-worktree clean --apply` / `/dw-worktree merge <slug>` / `/dw-worktree list` |
| "Resume" / "Where did we stop?" / "Pick up where we left off" | `/dw-resume` |
| "QA this feature" / "Run the test plan" | `/dw-qa` |
| "Fix the QA bugs" | `/dw-qa --fix` |
| "Evaluate the AI feature" / "Test the RAG / classifier" | `/dw-qa --ai` |
| "Walk me through this feature" / "UAT this with me" / "Let's do a manual run-through" | `/dw-qa --uat` |
| "Review this bugfix" / "Code-review fix `<slug>`" | `/dw-review --bugfix <slug>` |
| "QA this bugfix" / "Validate fix `<slug>`" | `/dw-qa --bugfix <slug>` |
| "Review my PR" / "Check code quality" / "Is this ready to ship?" | `/dw-review` |
| "Just the PRD coverage check" | `/dw-review --coverage-only` |
| "Just the code quality review" | `/dw-review --code-only` |
| "Audit what we merged since the last tag" / "Did these PRs break each other?" | `/dw-review --post-merge [<base>]` |
| "Time to commit" / changes are validated and ready | `/dw-commit` |
| "Open a PR" / "Ship this" | `/dw-generate-pr` |
| "Suggest new ideas" / "What should we build next?" / "Find opportunities" / "Roadmap ideas" | `/dw-opportunities` |
| "What security improvements should we consider?" / "Find security opportunities" | `/dw-opportunities "security"` |
| "Brainstorm X" / "Explore this idea" / "Research X" | `/dw-brainstorm "X"` (auto-dispatches grill / prototype / council / research / onepager based on signals) |
| "Code-health audit" / "Find tech debt" / "Refactor opportunities" / "Smells in X" | `/dw-refactor "X"` |
| "Where is X?" / "What uses Y?" / "How is Z structured?" | `/dw-intel "<question>"` |
| "Rebuild the codebase index" / "Refresh intel" | `/dw-intel --build` |
| "Context is heavy" / "Audit token usage" / "Why is the agent slow?" | `/dw-context-budget` |
| "Check dev-workflow install" / "Are agents/wrappers healthy?" | `/dw-harness-audit` |
| "Audit skills" / "Skills feel duplicated or bloated" | `/dw-skill-health` |
| "Redesign this UI" / "Audit and ship a new design" | `/dw-redesign-ui "<target>"` |
| "Audit dependencies" / "Are we behind on packages?" | `/dw-secure-audit --plan` |
| "Scan for vulnerabilities" / "Security check" | `/dw-secure-audit` |
| "Analyze this project" / "Generate rules" | `/dw-analyze-project` |
| "Open a new project" / "Bootstrap a stack" | `/dw-new-project` |
| "Dockerize this" / "Add docker-compose" | `/dw-dockerize` |
| "Functional doc" / "Map screens and flows" | `/dw-functional-doc` |
| "Install Azure skills" / "Setup Microsoft docs MCP" / "Add Azure expertise" / "I'm going to work on Azure" | `/dw-install-azure-skills` |
| "Install AWS skills" / "Setup AWS MCP" / "Add AWS expertise" / "I'm going to work on AWS" | `/dw-install-aws-skills` |
