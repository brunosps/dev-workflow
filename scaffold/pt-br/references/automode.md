# Automode — autorização, e como parar limpo

## O que isto não é

Isto não é um segundo runtime. Não lança processo, não infere consentimento, não autentica nada e não
acrescenta scheduler — o `docs/model-workflow-modernization.md` descarta isso de propósito, e este contrato
não reabre a questão. É prosa, como o resto do scaffold: duas regras sobre quando perguntar e como parar.

## Invocar um comando autoriza o fluxo dele

Um comando que foi invocado tem permissão para rodar os próprios passos. Não repergunte o que a invocação
já concedeu, nem o que foi aprovado a montante — a matriz de task/atribuição aprovada em `/dw-plan tasks`
atravessa execução, review e correção (`.dw/references/execution-contract.md`).

"Posso prosseguir?" no meio de um fluxo autorizado não é cautela. Interrompe trabalho que já tinha aval, e
numa execução desacompanhada interrompe na frente de ninguém.

Autorização não se estica além do escopo. Merge, push, publicação e operação destrutiva continuam exigindo
a sua própria, e uma invariante do piso (`.dw/references/invariants.md`) não é autorizada por nada.

## Paradas são enumeradas, não improvisadas

Cada comando lista as próprias paradas legítimas. Essa lista é o conjunto completo — se a situação não está
nela, o comando segue. As listas são por comando de propósito: uma lista global seria ampla demais para ser
respeitada ou estreita demais para ser verdadeira.

Parar não é falhar. Uma execução que encontra bloqueio real, registra e sai é uma **execução bem-sucedida**
que terminou cedo. O modo de falha que este contrato existe para evitar é o oposto: seguir adiante do
bloqueio inventando um contorno.

## O protocolo de parada

Três passos, nesta ordem:

1. **Persistir.** Grave o estado que a próxima execução precisa: o que foi feito, o que foi decidido, onde
   estão os artefatos e o ponto exato alcançado. Trabalho parcial é preservado, nunca resetado para
   tentar de novo.
2. **Reportar.** Diga a pergunta específica, as opções concretas e **o comando exato que retoma o
   trabalho** — algo que a pessoa possa colar. "Bloqueado numa decisão" sem o comando de retomada obriga
   quem lê a reconstruir o que você já sabia.
3. **Sair limpo.** Diga o que parou e por quê, numa linha. Não é erro, não é desculpa.

**O Status é `BLOCKED`**, preenchido de verdade — pergunta, opções, comando de retomada. Não existe status
`PARKED` e não vai existir: o vocabulário `PASS`/`FINDINGS`/`BLOCKED`/`NOT_APPLICABLE` é compartilhado por
todas as skills e validado em `lib/skill-registry.js`. Parada também não é `PASS`: um `PASS` que na verdade
parou no meio engana todo gate que lê o status.

## Repetir sem progredir

O `/dw-goal` já fixa a única regra objetiva de stall deste toolkit: o mesmo bloqueio por três turnos
consecutivos sem progresso significativo significa parar e levantar. Aplique o mesmo critério nos demais.
Repetir uma operação que falhou da mesma forma três vezes não é persistência.

## Execução desacompanhada e o canal

Quando um comando roda sem ninguém olhando — uma VM, uma frota, um job de CI, um dispatch longo em
background — uma parada vale só o que o canal que a carrega valer.

Se o único canal é este chat, diga isso uma vez, logo no início: a parada vai ser texto num terminal que
ninguém está lendo. A execução sai limpa e o trabalho fica preservado, mas nada aciona ninguém, e a tarefa
fica parada até alguém olhar por acaso. Isso é pior que uma execução que nunca começou, porque parece
terminada.

Este toolkit não tem papel de notificador e não vai criar um. Nomear a limitação é a mitigação inteira: o
dono pode então decidir acompanhar a execução, encurtá-la ou armar o `/dw-report`.

## Atribuição

O protocolo de parada e o aviso sobre canal em execução desacompanhada foram adaptados do contrato de
autonomia do [`samsantosb/ship-it`](https://github.com/samsantosb/ship-it) (MIT © Samuel Santos).
Reimplementados aqui: o mapeamento de status, as listas de parada por comando e a regra de stall vêm dos
contratos deste próprio projeto.
