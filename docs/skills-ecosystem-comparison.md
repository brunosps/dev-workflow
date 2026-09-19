# Skills ecosystem comparison — dev-workflow × mattpocock/skills × ponytail

Análise comparativa entre o `dev-workflow` e dois repositórios de referência de
skills para agentes de código — [`mattpocock/skills`](https://github.com/mattpocock/skills)
(coleção de skills "for real engineers", com distinção explícita entre invocação por
usuário e por modelo) e [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail)
(sistema de minimalismo "lazy senior developer", com decision ladder, modos de
intensidade e hooks de plataforma). O objetivo foi identificar gaps, decidir o que
adotar e integrar as adoções nas convenções do dev-workflow.

> Nota de rigor: este documento compara **padrões de design observáveis na estrutura
> dos repositórios**. Métricas de popularidade/adoção citadas por terceiros não foram
> verificadas na fonte e não são usadas aqui como argumento.

## Contexto

O dev-workflow é um scaffolder de pipeline PRD→PR: 36 comandos, ~24 skills-como-protocolo,
wrappers multi-plataforma (Claude Code, Codex, Copilot, OpenCode), constituição/spec-driven,
gate de segurança de 7 camadas, contratos de Structured Return e governança de contexto
(`load_policy`/`context_limit`). Em profundidade de pipeline e governança ele já é mais
completo que ambos os repos. Os gaps estavam em três disciplinas pontuais que esses repos
exercem bem.

## Tabela de gaps

| Dimensão | dev-workflow (antes) | mattpocock/skills | ponytail | Veredito |
|---|---|---|---|---|
| Minimalismo pré-geração (YAGNI) | parcial: `dw-search-first` (dependências) + `dw-simplification` (pós-fato) | — | **decision ladder + modos lite/full/ultra** | **Adotar** → `dw-minimalism` |
| Controle de invocação de skill | só `name`/`description` nos wrappers | **`disable-model-invocation`** | modos por toggle | **Adotar** → flag `userInvoked` + campo `invocation` |
| Enforcement no harness | prosa (`dw-git-discipline`, `dw-verify`) | `git-guardrails-claude-code` (hook) | hooks `pre_llm_call` + statusline | **Adotar** → hook git-guardrails + statusline |
| Distribuição à-la-carte | só instalador de pipeline | plugin + skills.sh | plugin multi-plataforma | **Adotar** → `.claude-plugin/` gerado do registry |
| Glossário/linguagem de domínio | `.dw/rules` + constitution + concerns | `CONTEXT.md` + `CONTEXT-MAP.md` (domain-modeling) | — | **Adotar** → Grill nativo (`dw-grilling` + `dw-domain-modeling`) + `.dw/domain/` |
| Entrevista de alinhamento (grilling) | grill como modo de prosa | `grill-with-docs` + `grilling` (skills dedicadas) | — | **Adotar** → sessão stateful nativa com decision tree + gate |
| Intake triage | `/dw-bugfix` tria bug vs feature depois que o pedido já entrou no fluxo de bugfix | `triage` como on-ramp issue-tracker-first, com labels como estado | — | **Adotar com adaptação forte** → `/dw-triage` local-first em `.dw/` |
| Handoff entre sessões | `/dw-pause` + `.dw/STATE.md` | `/handoff` | — | Já coberto — skip |
| Review avulso por ref | `/dw-review` fixo na base branch/PRD | fixed point validado antes da análise | — | **Adotar** → `/dw-review --since <ref>` |
| Arquitetura/deep modules | checklist base em `dw-simplification` | categorias de dependência + Design It Twice | — | **Adotar parcialmente** → aprofundamento condicional em deep-modules |
| Versionamento multi-skill | pacote npm único | Changesets | Changesets | Não aplicável — skip |
| Definição de comando | markdown + JSON registry | markdown | TOML | Preferência — skip |
| Fronteira de confiança do próprio agente | prompt injection só como vulnerabilidade a revisar (`security-review/references/modern-threats.md`) | — | — | **Adotar** → `.dw/references/untrusted-input.md` + âncoras nos comandos de intake/review |
| Verificação adversarial de findings | Pre-Report Gate + piso de confiança, mas o verificador é o mesmo raciocínio que produziu o candidato | — | — | **Adotar** → pipeline de 3 saídas em `dw-review-rigor` + agente `dw-finding-refuter` |
| Auditoria de faixa já mergeada | `/dw-review --since <ref>` cobre UM trabalho | — | — | **Adotar** → `/dw-review --post-merge [<base>]` |
| Rot de skill por uso real | `/dw-skill-health` audita estrutura; `/dw-context-budget` audita orçamento | — | — | **Adotar** → evidência de uso no `session-cost.mjs` + seção no `/dw-skill-health` |

## O que foi portado

### 1. `dw-minimalism` — decision ladder pré-geração (de ponytail)

Skill nova (`scaffold/skills/dw-minimalism/SKILL.md`, `kind: protocol`, `tier: core`,
`load_policy: always-small`). Encoda o ladder YAGNI ("precisa existir? → reusar? → stdlib? →
nativo? → dep instalada? → uma linha? → só então o mínimo") e os modos de intensidade
`off`/`lite`/`full`/`ultra` lidos de `.dw/minimalism.json` (default `full`).

É a **rung que faltava** no dev-workflow: roda *antes* de escrever código, compondo com
`dw-search-first` (decisão de dependência: adopt/wrap/compose/build) e com `dw-simplification`
(limpeza preservando comportamento, *depois* que o código existe). Disparada pela seção
"Complementary Skills" de `/dw-run`, `/dw-plan` e `/dw-review`.

Princípio preservado do ponytail: minimalismo é sobre **necessidade**, nunca sobre cortar
correção, validação, segurança ou acessibilidade.

### 2. Controle de invocação (de mattpocock/skills)

No dev-workflow as skills bundled vivem em `.agents/skills/` e são lidas por path (prosa das
"Complementary Skills"); as skills *nativas* do Claude que ele instala em `.claude/skills/`
são os **wrappers de comando**. Logo, `disable-model-invocation` se aplica corretamente aos
wrappers de comando:

- Comandos hidden/internal — os runners (`dw-claude-run`, `dw-codex-run`, `dw-copilot-run`) e
  a mecânica de subtask (`dw-subtask-start/complete/resume`) — recebem `userInvoked: true` em
  `lib/constants.js`. O `PLATFORMS.claude.wrapperTemplate` emite `disable-model-invocation: true`
  no frontmatter, então o modelo nunca auto-dispara (por exemplo) um runner que cria worktree;
  o usuário continua invocando com `/<comando>`.
- O registry ganhou o campo `invocation: model|explicit` (documental para as skills bundled e
  insumo do manifest à-la-carte). Recipe/asset packs (`api-testing-recipes`,
  `docker-compose-recipes`, `remotion-best-practices`, `vercel-react-best-practices`,
  `humanizer`) são marcados `explicit`.

### 3. Hooks de enforcement + statusline (de ponytail + git-guardrails do mattpocock)

Dois scripts em `scaffold/scripts/hooks/` (copiados para `.dw/scripts/hooks/` na instalação):

- `git-guardrails.mjs` — hook `PreToolUse`/Bash que bloqueia comandos destrutivos
  (`git push --force`, `reset --hard`, `clean -f`, `branch -D`, delete de branch remoto).
  Falha *aberta* (qualquer erro permite o comando). Eleva as regras do `dw-git-discipline` de
  prosa para enforcement real.
- `statusline.mjs` — branch + spec ativa + modo de minimalismo.

A escrita em `.claude/settings.json` é feita por `lib/hooks.js` com **reconcile marker-based**:
adiciona nossas entradas se faltarem, atualiza as nossas se o caminho mudar, e **nunca** toca
hooks/statusLine que o usuário definiu (uma statusline custom é respeitada e apenas sinalizada).

### 4. Distribuição à-la-carte (de ambos)

`.claude-plugin/plugin.json` + `marketplace.json` gerados de `scaffold/skill-registry.json` por
`lib/build-plugin.js` (`npm run build:plugin`), publicando apenas as skills marcadas
`exportable: true` (standalone). `lib/validate.js` (`npm run validate`) falha se os manifests
saírem de sincronia com o registry. O instalador de pipeline (`dev-workflow init`) permanece
inalterado — a distribuição à-la-carte é um caminho paralelo, não um substituto.

### 5. Grill nativo — entrevista de alinhamento + domain modeling (de mattpocock)

Reimplementação nativa (na nossa voz, sem copiar prosa upstream) de três skills do
[`mattpocock/skills`](https://github.com/mattpocock/skills) (MIT):

- [`skills/engineering/grill-with-docs`](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md)
- [`skills/productivity/grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)
- [`skills/engineering/domain-modeling`](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md)
  (+ `CONTEXT-FORMAT.md` e `ADR-FORMAT.md`)

O comportamento vira o modo `grill` do `/dw-brainstorm`, apoiado em duas skills bundled **internas e
não-exportadas**: `dw-grilling` (árvore de decisão ordenada por dependência, exatamente uma decisão por turn com
resposta recomendada, fatos descobertos e não perguntados, gate de shared-understanding) e `dw-domain-modeling`
(vocabulário canônico, desafio de termos vagos/sobrecarregados, cross-check com o código, política de ADR raro).
Ambas registradas em `skill-registry.json` com `exportable: false` (não entram no manifest à-la-carte) e o
contrato de Structured Return exigido pelo `lib/skill-registry.js`.

Diferenças intencionais do `.dw/`:

- Glossário em **`.dw/domain/**`** (`glossary.md`, ou `context-map.md` + `contexts/<slug>.md`), **não** no
  `CONTEXT.md`/`CONTEXT-MAP.md` da raiz do upstream nem no `.dw/rules/` auto-gerado (que é análise do código).
- Grill é **stateful e mutante** → exige **uma autorização explícita** antes de iniciar a sessão ou escrever;
  `grill` e `option-matrix` são mutuamente exclusivos (option-matrix vira fase posterior separada, se oferecida).
- Alinhamento produz um one-pager de ideia no **schema `1.1`** (Resolved Decisions, Evidence, Canonical
  Vocabulary, Remaining Decisions, Alignment State) consumido pelo `/dw-plan` sem re-perguntar decisões resolvidas.
- ADRs roteados por `/dw-adr --scope=repo|prd`, gated no teste 3-critérios com aprovação explícita separada.
- `/dw-analyze-project` lê e linka `.dw/domain/**` e **preserva** (nunca regenera nem sobrescreve).

### 5.1. Decision Map durável (de `wayfinder`, mattpocock)

A skill [`skills/productivity/wayfinder`](https://github.com/mattpocock/skills/blob/main/skills/productivity/wayfinder/SKILL.md)
inspirou o registro durável de progresso nebuloso: um mapa de decisões com dependências, fronteira explícita do
que pode ser feito agora e uma zona de "fog" para o que se sabe que falta descobrir mas ainda não virou decisão
formulável. No dev-workflow isso foi adotado dentro do one-pager do Grill, em `### Decision Map`, usando
`Depends on:` + `State` + `Frontier` + `Decision Fog`.

Foi deliberadamente rejeitado portar o issue tracker como substrato de persistência, transformar decisões em
tickets/issues, claim por assignee e coordenação de sessões concorrentes. O contrato local continua
single-owner/single-session e local-first, porque a lacuna corrigida é retomada durável entre sessões do Grill,
não orquestração multi-agente.

### 6. `/dw-review --since <ref>` — ponto fixo verificado antes do review (de mattpocock)

Adaptação da técnica observada em `mattpocock/skills`: antes de analisar um diff avulso, exigir um ponto de
comparação explícito e validá-lo. No dev-workflow isso virou flag opt-in no comando existente
`/dw-review --since <ref>`:

- valida o ref com `git rev-parse --verify --quiet <ref>^{commit}`;
- monta o diff reproduzível com `git diff <ref>...HEAD`;
- lista o range com `git log <ref>..HEAD --oneline`;
- aborta com mensagem acionável quando o ref não resolve ou quando o diff está vazio;
- registra o comando de diff efetivo nos relatórios de coverage, code review e consolidado.

Foi adotado o **three-dot** para preservar a semântica de review de PR: revisar o que `HEAD` mudou desde o
merge-base com o ref verificado, sem incluir mudanças que existam apenas no ref. O fluxo default de
`/dw-review` contra a base branch não foi alterado.

Rejeitado: criar comando separado para review avulso ou trocar o comportamento default de `dw-review`.

### 7. Deep-modules avançado — categoria de dependência + Design It Twice (de mattpocock)

Adaptação parcial de técnicas de arquitetura de `mattpocock/skills`, sem copiar a skill upstream e sem criar
nova skill. O material foi incorporado ao arquivo existente
`scaffold/skills/dw-simplification/references/deep-modules.md`:

- categorias de dependência (`in-process`, `local-substitutable`, `remote owned`, `true external`) que guiam a
  estratégia de teste da seam;
- alinhamento explícito com `dw-testing-discipline`: mocks isolam fronteiras, sistemas reais validam antes do
  merge, e qualquer conflito aparente é resolvido a favor de `dw-testing-discipline`;
- loop local de **Design It Twice** para gerar 3+ interfaces radicalmente diferentes antes de fechar uma seam.

`/dw-refactor` carrega esse aprofundamento apenas quando o finding sobrevivente é interface rasa, vazamento de
interface ou seam no lugar errado. O council não foi usado como mecanismo default porque `dw-council` é mais caro
e voltado a decisões de produto/arquitetura high-stakes com múltiplas prioridades; a comparação de alternativas de
interface é um loop local e específico. Council segue disponível só quando a interface também muda comportamento de
produto, fronteiras de ownership, postura de segurança ou decisão arquitetural difícil de reverter.

Rejeitado: copiar a skill completa de arquitetura, criar skill nova, reescrever `deep-modules.md`, ou exigir o
loop de alternativas para refactors simples sem finding de seam/interface.

### 8. Loop test-first sob demanda em `dw-testing-discipline` (de mattpocock)

Adotada a técnica operacional de loop TDD estrito do [`mattpocock/skills`](https://github.com/mattpocock/skills)
sem copiar a skill upstream: `scaffold/skills/dw-testing-discipline/references/tdd-loop.md`
define confirmar a seam pública com o usuário antes do primeiro teste, escrever **um** teste
vermelho por slice, executar e observar o vermelho real, implementar o mínimo para verde,
executar e observar o verde, e só então avançar para o próximo slice.

O `/dw-run` ganhou um gatilho explícito nas versões EN/PT: só usa esse modo quando a task ou o
usuário pede `TDD`, `test first` ou `red-green-refactor`. O default continua sendo a disciplina
existente: placement doctrine, seis agent guardrails, anti-patterns, testes em camada adequada e
sem teste de internals.

Rejeitado: tornar TDD o modo padrão do executor, escrever baterias de testes antes da primeira
implementação, tratar refactor como parte do ciclo red-green, afrouxar mocks para acelerar o
loop, ou testar private helpers. Onde o padrão upstream é mais estreito que o nosso, prevalecem
as seis regras centrais do `dw-testing-discipline`; o `tdd-loop` é um modo de operação dentro
delas, não uma substituição.

### 9. Loop red-capable em `dw-debug-protocol` (de mattpocock)

Adotada a técnica de não teorizar antes de existir um loop de feedback red-capable, atribuída ao
[`mattpocock/skills`](https://github.com/mattpocock/skills), dentro do passo "Reproduce" do
six-step triage. `scaffold/skills/dw-debug-protocol/references/six-step-triage.md` agora define
o contrato do loop: único, determinístico o bastante, rápido, executável pelo agente e comprovado
vermelho agora. Também inclui repertório de loops (teste focado, `curl`, CLI, browser headless,
trace replay, harness dedicado, fuzz/repeat, `git bisect`, teste diferencial) e template HITL
para pedir credencial, hardware, fixture, trace ou ação manual quando o agente não consegue rodar
o loop sozinho.

O `/dw-bugfix` EN/PT agora exige que `fix-report.md` registre `Loop command before fix` e
`Loop command after fix`, ou, quando não houver loop executável, as tentativas e o pedido explícito
de artefato/acesso. A regra vale para bug não trivial e para qualquer caso em que a primeira
tentativa de fix falhe; bug trivial com reprodução óbvia e fix cirúrgico não paga a checklist
completa.

Rejeitado: transformar todo bug de uma linha em papelada, substituir o six-step triage, seguir
no escuro quando o loop depende de input humano, instrumentar várias variáveis de uma vez, ou
deixar logs temporários sem prefixo removível. A estratégia de bugs não-reprodutíveis continua
coerente com isso: primeiro instrumenta para obter evidência/reprodução, depois corrige; guesses
só entram pelo caminho explicitamente reconhecido e monitorado.

### 10. `/dw-triage` — intake local-first antes do pipeline (de mattpocock)

Adotada a técnica da skill `triage` de [`mattpocock/skills`](https://github.com/mattpocock/skills)
(MIT): um on-ramp para trabalho que chega de fora, com categoria, estado, checagem de redundância,
checagem de rejeições anteriores, checkpoint do dono, e roteamento para o próximo fluxo. A ideia
central veio do upstream, onde `triage` move issues por uma máquina de estados baseada em papéis
como `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human` e `wontfix`; o setup do
upstream também registra que o issue tracker e as labels são a camada de estado compartilhada.

No dev-workflow a adaptação é deliberadamente diferente: o substrato canônico é `.dw/` versionado,
não labels/comentários de tracker. O novo comando escreve um registro por item em
`.dw/triage/NNN-<slug>.md`, cria memória de rejeições em `.dw/out-of-scope/<concept>.md` apenas
para conceitos rejeitados, e trata GitHub (`gh`) como enriquecimento opcional de leitura. O comando
funciona 100% offline a partir de paste, arquivo local ou argumento explícito; se `gh` não existir,
não houver autenticação ou o remote não for GitHub, ele pede texto/diff local e continua.

Vocabulário adotado:

- `ready-for-work` substitui `ready-for-agent`, porque no pipeline daqui a execução passa por
  `/dw-bugfix` ou `/dw-plan prd` antes de chegar a `/dw-run`; "agent-ready" seria preciso demais
  para o ponto errado do fluxo.
- `needs-human` substitui `ready-for-human`, porque o estado não significa "pronto para uma pessoa
  implementar", e sim "não delegável com segurança ainda" por decisão de design, acesso externo,
  julgamento, ownership ou teste manual.

Rejeitado: portar literalmente labels de GitHub como fonte da verdade, prometer Linear/Jira/GitLab
sem ferramenta instalada, sincronizar automaticamente tracker ↔ `.dw/`, criar webhook/daemon,
escrever comentários/labels/fechamentos remotos como efeito colateral, ou registrar
"já implementado" em `.dw/out-of-scope/**`. Pedido já atendido vira `wontfix` no registro de
triagem, apontando onde vive a implementação; out-of-scope fica reservado para rejeições reais com
motivo durável.


### 11. Fronteira de confiança, refutação de findings e auditoria de composição (2026-09-18)

Três técnicas adaptadas a partir da leitura de [`akitaonrails/my-skills`](https://github.com/akitaonrails/my-skills)
e do artigo [Falando um pouco sobre minhas skills de IA](https://akitaonrails.com/2026/09/17/falando-um-pouco-sobre-minhas-skills-de-ia/).

**Licenciamento — restritivo.** O repositório de origem **não declara licença** (`license: null` na API do
GitHub), o que significa todos os direitos reservados. Só a **técnica** foi adaptada, reescrita
integralmente na nossa voz e com o nosso vocabulário. **Nenhum texto, snippet, tabela, nome de arquivo ou
estrutura de headings do upstream foi reaproveitado**, e nenhuma licença de reuso é assumida. O próprio
autor recomenda não reutilizar skill dos outros literalmente — este trabalho segue esse conselho.

**11.1 — Artefato externo é evidência, nunca instrução.** O dev-workflow já tratava prompt injection como
vulnerabilidade **do código do usuário** (`security-review/references/modern-threats.md`). Faltava a metade
operacional: a regra para o **próprio agente** quando `/dw-triage` recebe uma issue/PR de terceiro ou
`/dw-review` revisa um PR externo. Verificado antes: `grep -i -e untrusted -e injection -e "never run"
-e attachment` em `dw-triage.md` voltava vazio.

A regra vive em `.dw/references/untrusted-input.md` (par EN/PT em `scaffold/{en,pt-br}/references/`), o mesmo
compartimento de `execution-contract.md`: contrato operacional do agente, **localizado** — `scaffold/skills/`
não é, e um usuário PT-BR leria a regra mais importante do fluxo em inglês — e citável por qualquer comando
sem carregar skill nenhuma. Âncoras curtas nos 7 comandos que ingerem texto externo, mais uma frase no
`agent-instructions.md`, que é o único arquivo carregado incondicionalmente: a regra precisa valer quando o
usuário cola uma issue e pergunta "o que você acha?" sem invocar comando nenhum.

Codificado: não obedecer a comando, pedido de ferramenta, troca de papel, pedido de credencial ou atalho de
auditoria vindo do artefato; reconstruir a reprodução mínima a partir de código confiável e dado sintético
em vez de executar o que veio colado; não abrir anexo, comprimido, binário, patch ou link encurtado no host;
ler `AGENTS.md`/`CLAUDE.md`/`.dw/**`/CI/hooks do branch base, porque um PR que os edita não muda as regras da
própria auditoria dele; um artefato não confiável não corrobora outro; e a tentativa de redirecionamento é
ela própria um achado a registrar, com citação literal e localização.

Variante para instalação de skill de terceiro (`/dw-find-skills`, `/dw-install-aws-skills`,
`/dw-install-azure-skills`): instalar não é tratar como dado, é **conceder autoridade de instrução
permanente, em todo turno futuro**. O vetting existente media adoção — install count ≥ 1K, stars ≥ 100,
reputação do owner, atividade recente — e **nenhuma dessas é propriedade de segurança**; não havia nenhuma
instrução de ler o `SKILL.md` antes de instalar, e o install usava `-y` sobre uma referência móvel. Agora há
checklist de autoridade e exigência de referência pinada.

Rejeitado: criar skill nova (o `## Structured Return` seria preenchimento vazio para uma restrição que não
produz artefato); duplicar a regra nos 14 arquivos de comando; hospedá-la em `scaffold/skills/`, que não é
localizado. `/dw-qa` foi deliberadamente deixado de fora e a exclusão está escrita no próprio contrato: ele
roda o nosso plano de teste contra o nosso build, e as entradas dele são artefatos nossos.

Uma segunda classe de ingestão foi coberta depois da rodada inicial, e o plano não a tinha previsto:
**texto buscado da web**. O `dw-source-grounding` declara `WebFetch` e o trabalho dele é Detect → Fetch →
Implement → Cite — a página buscada alimenta techspec e decisão de implementação. Domínio oficial prova
proveniência, não que o corpo seja seguro. A skill ganhou a seção "Fetched pages are untrusted text" (não
seguir instrução endereçada ao agente, não executar comando de instalação que a página fornece, não seguir
a página até um segundo destino que ela nomeia, e página buscada não corrobora página buscada), e os dois
pontos onde a busca começa — `/dw-brainstorm --mode=research` e o passo de web search + Context7 MCP do
`/dw-plan` — citam a regra antes de buscar.

**11.2 — Refutação adversarial antes do finding.** O `dw-review-rigor` tinha um Pre-Report Gate de quatro
checagens e piso de confiança >80%, mas quem verificava o candidato era o mesmo raciocínio que o produziu.
O gate virou um pipeline com **três saídas e nenhuma quarta**: `finding`, `needs-validation`, `rejected`.

- **Refutador fresco por candidato** — agente novo `dw-finding-refuter` (`module: core`,
  `context_mode: fresh`, read-only) recebe a alegação e o código cru **sem** o raciocínio que a produziu e
  **sem a severity** (candidato rotulado `critical` volta confirmado com mais frequência que o mesmo
  candidato rotulado `medium`), re-deriva o caminho a partir da fonte lendo a linha sinalizada por último, e
  devolve `REFUTED`/`HOLDS`/`UNRESOLVED`. O `context_mode: fresh` e o `input_budget_words` do registry são o
  que torna a separação executável, não prosa. Sem subagente, a re-derivação solo segue uma lista ordenada
  de guardas a montante.
- **Classe `needs-validation`** — lead não resolvido nunca vira finding e nunca recebe severidade; registra
  o fato exato não estabelecido, por que não deu e o que resolveria. Previne os dois modos de falha
  simétricos: inflar lead em finding e sumir com o lead em silêncio. O vocabulário de `Status`
  (`PASS`/`FINDINGS`/`BLOCKED`/`NOT_APPLICABLE`) **não foi ampliado** — é compartilhado pelas 26 skills e
  validado em `lib/skill-registry.js`; entradas abertas aparecem em `Risks` e `Next Step`.
- **Log de candidatos rejeitados** — uma linha por candidato desprovado, no relatório que a rodada já
  escreve, pendurado na máquina de Prior-Round Awareness que já existia.
- O `fp-check` do `security-review` ganhou o mesmo terceiro veredito: reachability indeterminada é
  `needs-validation`, não um dos dois extremos.

**Correção de bug pré-requisito:** o `dw-review-rigor` mandava ler rodadas anteriores em
`.dw/spec/prd-*/reviews/`, diretório que `/dw-review` **nunca escreveu** — os caminhos reais são
`<target>/QA/` e `<target>/review/`. A Prior-Round Awareness lia um diretório inexistente desde que foi
escrita. Sem essa correção o log de rejeitados nasceria morto.

Rejeitado: reusar `dw-code-reviewer` como refutador (objetivo invertido — `dw-code-reviewer.md:10` manda
"report bugs and risks", então ele produziria achados novos em vez de refutar, inflando o relatório justo na
etapa que deveria enxugá-lo); criar arquivo novo para o log de rejeitados; criar um quinto `Status`.

**11.3 — Auditoria de composição pós-merge.** `/dw-review --post-merge [<base>]` audita o estado combinado
de N PRs já mergeados: congelamento da fronteira (BASE_SHA e HEAD_SHA fixos, nunca o símbolo `HEAD`),
inventário de proveniência por merge de primeiro pai, as sete classes de interação cruzada (pontes de
invariante, deriva de helper/política, composição de defaults, ordem e ciclo de vida, recurso compartilhado,
composição de schema/API/dados, **mascaramento de teste**), o checklist de defeitos só-de-composição
(incluindo identidade de caminho e semântica por SO, que um gate de plataforma única não enxerga), o ledger
de documentação montado do **diff** com alvo em descrição desatualizada, e a recomendação de semver com os
dois perigos de changelog — entrada presa em seção já lançada (o merge resolve **limpo**, sem conflito) e
resto de resolução diff3 (`|||||||`).

Virou **modo do `/dw-review`**, não comando novo, pelo mesmo argumento da seção 6: mesmo input (range git
verificado), mesma máquina de preflight, mesma disciplina de findings. O peso foi para
`dw-review-rigor/references/composition-audit.md` (orçamento zero). O Level 2 não roda — não há PRD único
numa faixa de N PRs; a proveniência substitui. `dw-verify` roda **uma vez** no HEAD congelado, que é o
ponto: cada PR foi verificado sozinho, a composição nunca foi.

**11.4 — Rot de skill por evidência de uso.** Princípio adotado: skill encostada é dívida — regra obsoleta
continua executando e ferramenta parada ainda compete por atenção do modelo. O `session-cost.mjs` **já lia e
já fazia `JSON.parse` de cada linha do transcript**, então contar nomes de skill é uma segunda passada sobre
dados que já estavam na mão: zero I/O novo, zero configuração nova, e grava dentro do `costs.jsonl` que já
tem `.gitignore` (um arquivo novo não entraria no ignore de nenhuma instalação existente).

O escopo da varredura é deliberadamente estreito — só turnos `assistant`, só blocos `tool_use`, só o `input`
do bloco. Varrer o texto cru contaria um `tool_result` que devolveu o *conteúdo* de um SKILL.md e um prompt
que apenas menciona um nome, reportando como disparada uma skill que nunca rodou. `test/session-cost.test.js`
fixa exatamente esse falso positivo.

O discriminador de honestidade é estrutural: **presença da chave `skills`**. Ausente = linha anterior à
instrumentação, não conta para a janela; `{}` = sessão observada com zero disparos, conta. Isso segue o
precedente do `/dw-context-budget` e torna a janela auditável. O que o sinal prova é **carregamento, não
obediência**. Rejeitado: qualquer coleta de transcript além dessa contagem. A regra "janela declarada, nunca
afirmação absoluta" e a separação "sem telemetria" ≠ "sem disparo" são nossas, não da fonte.

## O que NÃO foi portado (e por quê)

1. **`CONTEXT.md` na raiz (mattpocock)** — a *disciplina* de domain-modeling FOI adotada (seção 5 acima), mas o
   glossário curado vive em `.dw/domain/**`, não num `CONTEXT.md` na raiz; `.dw/rules/`, `.dw/constitution.md` e
   `.dw/rules/concerns.md` continuam sendo análise/princípios auto-gerados, separados do vocabulário curado.
2. **`/handoff` (mattpocock)** — já coberto por `/dw-pause` + `.dw/STATE.md` (decisões,
   bloqueios, todos, open loops) e `/dw-resume`.
3. **`improve-codebase-architecture` completa (mattpocock)** — não foi copiada. O dev-workflow manteve
   `dw-simplification/references/deep-modules.md` como fonte local e adotou apenas as técnicas aprovadas:
   categorias de dependência, teste derivado da categoria e Design It Twice condicional.
4. **Changesets (ambos)** — dev-workflow é um pacote npm único; versionamento multi-skill
   independente não se aplica.
5. **Comandos em TOML (ponytail)** — a fonte da verdade do dev-workflow é markdown +
   `skill-registry.json`/`agent-registry.json`; converter não traria ganho.
6. **Hooks por-plataforma para Codex/Copilot/OpenCode (ponytail)** — o gate de hook foi
   limitado ao Claude Code (único alvo com `settings.json` hoje). Os `*-hooks.json` por
   plataforma ficam como follow-up documentado, não nesta rodada.
7. **O passo de release (akitaonrails)** — a skill `release` dele (derivar versão do changelog, CI verde no
   SHA exato, tag anotada, nunca reescrever tag publicada) NÃO foi portada, e nenhum `/dw-release` foi
   criado. Decisão explícita do dono: o pipeline do dev-workflow termina no PR. A recomendação de semver
   do `--post-merge` é uma linha de relatório, e `test/post-merge-audit.test.js` transforma isso em gate —
   os comandos não podem conter `git tag`, `npm publish`, `npm version` nem `git push --tags`.

## Mapeamento de arquivos

| Item | Arquivo dev-workflow | Origem |
|---|---|---|
| Skill de minimalismo | `scaffold/skills/dw-minimalism/SKILL.md` | ponytail (decision ladder + modos) |
| Entrada de registry | `scaffold/skill-registry.json` (`dw-minimalism`, `invocation`, `exportable`) | — |
| Validação de campos | `lib/skill-registry.js` (`invocation`/`exportable`) | — |
| Flag de invocação | `lib/constants.js` (`userInvoked`) + `PLATFORMS.claude.wrapperTemplate` | mattpocock (`disable-model-invocation`) |
| Propagação do wrapper | `lib/wrappers.js` | — |
| Hook git-guardrails | `scaffold/scripts/hooks/git-guardrails.mjs` | mattpocock `git-guardrails-claude-code` + `dw-git-discipline` |
| Statusline | `scaffold/scripts/hooks/statusline.mjs` | ponytail statusline |
| Reconcile de settings | `lib/hooks.js` | — |
| Seed init-only do modo | `.dw/minimalism.json` (via `lib/init.js`) | — |
| Manifests à-la-carte | `.claude-plugin/plugin.json` + `marketplace.json` via `lib/build-plugin.js` | ambos |
| Gate do repo | `lib/validate.js` (`npm run validate`) + suíte `node:test` (`npm test`) | — |
| Checagens de saúde | `lib/doctor.js` (`checkHooks`) | — |
| Skill de grilling | `scaffold/skills/dw-grilling/SKILL.md` (+ references) | mattpocock (grilling / grill-with-docs) |
| Skill de domain-modeling | `scaffold/skills/dw-domain-modeling/SKILL.md` (+ references) | mattpocock (domain-modeling) |
| Modo grill nativo | `scaffold/{en,pt-br}/commands/dw-brainstorm.md` | — |
| Comando de intake triage | `scaffold/{en,pt-br}/commands/dw-triage.md` + templates `triage-*` | mattpocock (`triage`) |
| Loop test-first sob demanda | `scaffold/skills/dw-testing-discipline/references/tdd-loop.md` + `scaffold/{en,pt-br}/commands/dw-run.md` | mattpocock (TDD loop estrito) |
| Loop red-capable de debug | `scaffold/skills/dw-debug-protocol/references/six-step-triage.md` + `scaffold/{en,pt-br}/commands/dw-bugfix.md` | mattpocock (feedback loop antes de teorizar) |
| Artefatos de domínio | `.dw/domain/**` (criados lazy pelo grill autorizado) | — |
| One-pager schema 1.1 | `scaffold/{en,pt-br}/templates/idea-onepager.md` | — |
| Roteamento de ADR | `scaffold/{en,pt-br}/commands/dw-adr.md` (`--scope=repo\|prd`) | mattpocock (ADR-FORMAT) |
| Contrato de entrada não confiável | `scaffold/{en,pt-br}/references/untrusted-input.md` + âncoras em `dw-triage`, `dw-review`, `dw-bugfix`, `dw-secure-audit`, `dw-find-skills`, `dw-install-*-skills` e `agent-instructions.md` | akitaonrails/my-skills (técnica; repo sem licença) |
| Fronteira para texto buscado | `scaffold/skills/dw-source-grounding/SKILL.md` + âncoras em `dw-brainstorm` e `dw-plan` (EN/PT) | akitaonrails/my-skills (técnica; repo sem licença) |
| Pipeline de candidato + refutação | `scaffold/skills/dw-review-rigor/SKILL.md` + `references/refutation-pass.md` | akitaonrails/my-skills (técnica; repo sem licença) |
| Agente refutador | `scaffold/agents/core/dw-finding-refuter.md` + `scaffold/agent-registry.json` | — |
| Auditoria de composição | `scaffold/skills/dw-review-rigor/references/composition-audit.md` + modo `--post-merge` em `scaffold/{en,pt-br}/commands/dw-review.md` | akitaonrails/my-skills (técnica; repo sem licença) |
| Sinal de uso de skill | `scaffold/scripts/hooks/session-cost.mjs` (campo `skills` em `.dw/metrics/costs.jsonl`) | — |
| Evidência de uso no audit | `scaffold/{en,pt-br}/commands/dw-skill-health.md` | akitaonrails/my-skills (princípio "skill encostada é dívida") |

## Segurança do update

Tudo foi desenhado para o `dev-workflow update` aplicar in-place sem quebrar o usuário:
a skill nova e os scripts de hook são recopiados (managed, sobrescritos); o registry e os
wrappers são regenerados; `.dw/minimalism.json` é seed init-only e preservado no update e no
uninstall; as entradas de hook/statusline são reconciliadas por marcador (atualizadas se nossas,
intocadas se do usuário) e removidas só as nossas no uninstall; o snapshot do `/dw-update`
agora inclui `.claude/settings.json`. Regra append-only: remoções/renames futuros entram em
`lib/removed-bundled-skills.js`.

## Licença e atribuição

Ambos os repositórios de referência são MIT. As adoções preservam os créditos:

- `DietrichGebert/ponytail` (MIT, 2026 Dietrich Gebert) — decision ladder, modos de
  intensidade e statusline, na base de `dw-minimalism` e do `statusline.mjs`.
- `mattpocock/skills` (MIT) — distinção user/model-invoked (`disable-model-invocation`),
  `git-guardrails-claude-code`, e as skills `grill-with-docs` / `grilling` / `domain-modeling` (com
  `CONTEXT-FORMAT.md` + `ADR-FORMAT.md`) / `triage`, na base do controle de invocação, do hook git-guardrails,
  do Grill nativo (`dw-grilling` + `dw-domain-modeling`) e da borda `/dw-triage`. Comportamento reimplementado
  na nossa voz; nenhuma prosa upstream copiada.

- `akitaonrails/my-skills` — **sem licença declarada (all rights reserved)**. Apenas a técnica foi
  adaptada, reescrita na nossa voz e no nosso vocabulário (`needs-validation`, candidate pipeline,
  Structured Return, `.dw/**`); nenhum texto, snippet, tabela, nome de arquivo ou estrutura de headings do
  upstream foi reaproveitado, e nenhuma licença de reuso é assumida. A frase de abertura desta seção
  ("ambos os repositórios de referência são MIT") vale para os dois primeiros, não para este.

A atribuição também consta no `SKILL.md` de `dw-minimalism`, no `README.md` (Acknowledgements)
e nos cabeçalhos dos scripts de hook.

## Modernization for current models (2026-09-09)

Sources: Eric Provencher's [article](https://x.com/pvncher/status/2095991462416490862) (direct X access unavailable during analysis; a third-party translation supplied initial context), official [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model), [skill authoring](https://learn.chatgpt.com/docs/build-skills), and [Claude model configuration](https://code.claude.com/docs/en/model-config). Current Codex candidates were checked against official [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol), and Astra model guidance. Model documentation does not establish account access.

Adopted: short precise discovery descriptions, conditional references, explicit completion criteria, task-level executor/model/agent choices, persistent authorization and proportional verification with reusable evidence. These are independently written workflow adaptations, not copied article text or source code; no article license is assumed.

Revised earlier imported patterns: retain GSD's outcome/dependency checks and scoped commits (MIT), but remove fixed task/file quotas, mandatory parallelism and synthetic scheduling dependencies. Retain tech-leads-club's scoped retrieval and durable handoff ideas (CC-BY-4.0, Felipe Rodrigues), but replace the four-size numeric routing matrix, universal token thresholds and unconditional anti-co-loading prohibitions. Retain Compozy-inspired evidence/verification discovery with its attribution, while replacing per-message full reruns. Existing attribution remains in the relevant skills/references.

Rejected: treating worktree isolation as permission sandboxing; blind resume-latest recovery; destructive retry resets; score-only approval; automatic escalation to maximum effort; a fixed model hierarchy embedded in each adapter. Humanizer's upstream version is preserved under supported `metadata.version` rather than an unsupported top-level frontmatter key.

See [model-workflow-modernization.md](model-workflow-modernization.md) for interfaces, compatibility, measurements and evaluation limitations.

## Frontend engineering controls (2026-09-09)

Source: Yuri Mikhin, Evil Martians, [10 anti-AI slop moves for frontend projects going faster than humans can review](https://evilmartians.com/chronicles/ten-anti-ai-slop-moves-for-frontend-projects-going-faster-than-humans-can-review), September 1, 2026. Read directly; technical tool behavior was checked against primary documentation linked in `dw-ui-discipline/references/frontend-engineering.md` and `dw-testing-discipline/references/mutation-testing.md`.

Adopted: explicit frontend control baselines, gradual enforcement, checks for the checks, and concrete evidence beyond visual quality. Existing planning, review and QA commands consume these decisions without a new command or mandatory skill bundle.

Adapted/rejected: no universal React/TypeScript dependency set, folder topology, mutation-score threshold or weekly campaign. Existing project gates remain binding. Use Knip's documented production view before proposing a bespoke reachability walker; validate any actual detector with invalid and legitimate fixtures. Existing CI already runs this repository's applicable checks, so its workflow remains unchanged.

Licensing: independently written instructions and tests; no article prose, snippets, rule implementations or tools were copied or vendored. No reuse license is assumed for the article. Referenced tools retain their own licensing and require separate compatibility review if a consumer adopts them. Existing attribution in modified skills remains intact.

See [frontend-engineering-controls.md](frontend-engineering-controls.md) for file integration, validation and limitations.
