# Contrato de execução de tasks

Leia na quebra de tasks, no dispatch ou na retomada. O parent coordena o plano aprovado até a validação; retorno do runner é um handoff, não o fim do objetivo.

## Escolhas no planejamento

Escolha desenvolvimento local ou cruzado em `/dw-plan tasks`, não a cada dispatch. Apresente matriz por task com complexidade, justificativa, ferramenta, modelo, esforço, agentes, dependências e checks. Use `light` para trabalho mecânico de baixo risco, `standard` para padrões conhecidos com decisões delimitadas e `heavy` para arquitetura, incerteza ou superfícies sensíveis. Quantidade de arquivos e tipo de commit não determinam complexidade sozinhos.

Use `.dw/config/routing.json` como candidatos de modelo, não prova de disponibilidade. Inspecione versão/help da CLI para flags e configuração; use documentação do provedor ou metadados disponíveis para IDs de modelos. Help/version não provam autenticação ou acesso na conta. Preserve escolhas explícitas. Prefira modelos configurados que atendam à task; proponha upgrades úteis citando fonte/data. Agentes locais herdam o modelo da sessão salvo override explícito suportado e aprovado. Não escolha outro tier arbitrariamente apenas para chamar uma revisão de independente.

Claude pode propor `codex` (`/dw-codex-run`), Codex pode propor `claude` (`/dw-claude-run`). Copilot/OpenCode mantêm execução local e podem usar adapters explicitamente selecionados. Mantenha trabalho pequeno/acoplado local salvo escolha do usuário. Use apenas agentes instalados e relevantes, sem fan-out obrigatório. Valide nomes contra `.dw/agent-registry.json` e os perfis instalados.

Junto de tasks.md e dos arquivos Markdown por task, escreva `execution-plan.json`:

```json
{
  "schema_version": "1.1",
  "approved": false,
  "tasks": [{
    "id": "1.0",
    "depends_on": [],
    "execution": {
      "complexity": "standard",
      "rationale": "Padrão de serviço conhecido; mudança de comportamento delimitada",
      "tool": "local",
      "model": "inherit",
      "effort": "inherit",
      "agents": [],
      "fallbacks": []
    }
  }]
}
```

Resolva modelo/esforço concretos para ferramentas externas antes da aprovação. Fallbacks contêm `tool`, `model`, `effort`; use apenas alternativas aprovadas. Valide com `node .dw/scripts/lib/workflow-contract.mjs validate <plan.json>` e confira IDs/dependências contra tasks.md. Marque `approved: true` só depois da aprovação dessas escolhas pelo usuário; registre-a no log de decisões do plano. Mudanças exigem aprovação salvo pedido explícito ou fallback aprovado. O boolean escrito pelo agente é um registro, não prova independente de consentimento.

Precedência: instrução explícita atual → escolha aprovada da task → configuração do projeto → padrão da ferramenta. Em plano salvo, configuração/defaults servem para propor escolhas ausentes, nunca substituir silenciosamente escolhas aprovadas. Rejeição do modelo usa fallback aprovado ou bloqueia com evidência; sem troca de provedor não autorizada. Planos schema 1.0 sem metadados de execução rodam localmente; não force migração ou delegação retroativa.

## Dependências e propriedade do worktree

Para WRITE crie worktree dedicado por `/dw-worktree create`. Registre revisão inicial e branch. Tasks de uma cadeia de dependências usam a mesma branch/worktree de execução, com um escritor por vez, mesmo quando tasks sucessivas escolhem CLIs diferentes. A próxima task recebe os commits das dependências nessa branch; nunca a recrie de main. Use worktrees separados para tasks independentes somente quando o plano aprovado definir como integrar as branches antes do trabalho dependente. Não faça merge na branch do usuário só para avançar à próxima task.

Faça stage apenas de mudanças no escopo. Commite implementação e status da task juntos; depois registre o SHA resultante em tasks.md/run-log (um SHA não pode incluir a si próprio no commit). Inclua esse registro no próximo commit com escopo ou em commit final de metadados; não entregue bookkeeping sujo sem reportar. Não faça amend nem stage de arquivos alheios automaticamente.

## Estado durável e retomada

Persista `execution-state.json` junto do plano, com schema_version `1.1` e objeto `tasks` indexado por ID. Cada entrada registra escolha aprovada, worktree, branch/revisão base, ID de sessão do provedor, caminhos de audit/prompt, tentativa, status, checkpoint, SHA e registros de verificação. Guarde audit/sessão fora de worktrees descartáveis. Atualize antes do dispatch e após cada handoff; preserve trabalho concluído em interrupções.

Ao retomar, confira identidade da task salva, diff real, branch, dependências e evidência. Mantenha executor/sessão aprovados. Sem sidecar, recupere a sessão exata do audit da task e valide provedor/worktree/identidade. Nunca use `--last` ou `-c` às cegas. Se o ID não for recuperável, inicie nova sessão no mesmo worktree com task aprovada, estado, diff e logs; registre a perda de contexto conversacional. Sessão de um provedor não pode ser retomada por outro. Nunca use reset/clean para descartar trabalho parcial e tentar novamente.

## Conclusão e autorização

O worker implementa e verifica sua task, retornando evidências e achados pendentes. O parent inspeciona independentemente diff e critérios de aceitação, confere validade da evidência, encaminha correções no escopo ao mesmo worker e continua dependências. Não precisa confirmar de novo execução/retomada já aprovada nem correções rotineiras. Só escopo material novo, alternativas aprovadas indisponíveis, restrições de permissão e decisões pendentes de produto/arquitetura bloqueiam trabalho dependente; continue trabalho independente autorizado quando possível.

Qualidade da revisão depende de critérios de aceitação e achados bloqueantes, não de nota numérica. Reutilize checks verificados para insumos/ambiente/escopo equivalentes; reexecute os afetados após edições. Complete checks exigidos pelo projeto na entrega. Merge, push e publicação continuam como limites separados de autorização. Sem autorização, reporte branch/worktree preparado e resultado validado.
