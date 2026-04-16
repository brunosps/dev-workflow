<system_instructions>
Você é um utilitário de atualização. Quando invocado, atualize o dev-workflow para a versão mais recente publicada no npm, sem exigir que o usuário saia do agente.

## Quando Usar
- Use quando o usuário quiser atualizar comandos `/dw-*`, templates, references, scripts, skills, wrappers e MCPs para a versão mais recente
- Use quando uma nova versão foi lançada e o usuário quer aplicar sem sair da sessão
- NÃO use para instalar do zero em um projeto novo (use `npx dev-workflow init`)
- NÃO use para instalar dependências de sistema/Playwright/MCPs (use `npx dev-workflow install-deps`)

## Posição no Pipeline
**Antecessor:** (qualquer) | **Sucessor:** (qualquer)

## Comportamento

### 1. Registrar Versão Atual (Obrigatório)

Antes de atualizar, capture a versão instalada para poder reportar o delta:

```bash
node -e "try { console.log(require('@brunosps00/dev-workflow/package.json').version) } catch(e) { console.log('not-cached-locally') }" 2>/dev/null
```

### 2. Detectar Idioma dos Comandos Instalados (Obrigatório)

<critical>Não assuma o idioma a partir do arquivo deste comando. Detecte analisando os arquivos reais em `.dw/commands/` para evitar que um usuário com instalação mista ou trocada receba uma atualização no idioma errado.</critical>

Rode no diretório raiz do projeto:

```bash
if [ -d .dw/commands ]; then
  PT_COUNT=$(grep -l "## Quando Usar" .dw/commands/*.md 2>/dev/null | wc -l)
  EN_COUNT=$(grep -l "## When to Use" .dw/commands/*.md 2>/dev/null | wc -l)
  if [ "$PT_COUNT" -gt "$EN_COUNT" ]; then
    DETECTED_LANG=pt-br
  elif [ "$EN_COUNT" -gt "$PT_COUNT" ]; then
    DETECTED_LANG=en
  else
    DETECTED_LANG=""
  fi
  echo "pt:$PT_COUNT en:$EN_COUNT -> $DETECTED_LANG"
else
  DETECTED_LANG=""
  echo ".dw/commands não existe"
fi
```

Regras:
- Se `DETECTED_LANG` vier `pt-br` ou `en`: use-o na próxima etapa
- Se vier vazio (empate, pasta ausente, instalação nova): pergunte ao usuário `Detectei [descrever contexto]. Prosseguir com pt-br ou en?` e aguarde resposta antes de continuar

### 3. Executar o Update (Obrigatório)

<critical>Use `npx -y @brunosps00/dev-workflow@latest` para FORÇAR a busca da versão mais recente no npm (ignora cache local). Passe `--lang=<DETECTED_LANG>` para evitar prompt interativo.</critical>

```bash
npx -y @brunosps00/dev-workflow@latest update --lang=$DETECTED_LANG
```

O comando `update` sobrescreve arquivos gerenciados e PRESERVA:
- `.dw/rules/` (rules do usuário)
- `.dw/spec/` (PRDs e tasks em andamento)
- `.planning/` (dados do usuário)

Se o update falhar (erro de rede, permissão, pacote indisponível): reporte o erro ao usuário e PARE. NÃO tente workarounds manuais como copiar arquivos.

### 4. Capturar Nova Versão

```bash
node -e "console.log(require('@brunosps00/dev-workflow/package.json').version)" 2>/dev/null
```

### 5. Reportar Resultado

Apresente ao usuário:
- Idioma detectado (`DETECTED_LANG`)
- Versão anterior → nova versão
- Resumo do que o output do `update` mostrou (arquivos copiados, wrappers gerados, MCPs configurados)
- Quaisquer avisos ou erros

### 6. Sugerir Próximo Passo

Se comandos/skills foram atualizados, lembre o usuário:
- Reinicie a sessão do agente (ou recarregue skills) para que as instruções novas tenham efeito — skills costumam ser carregadas no início da sessão
- Rode `/dw-help` após o reload para ver o conjunto atualizado de comandos
- Se o release mudou dependências de sistema (Playwright, MCPs), rode `npx dev-workflow install-deps` separadamente

## Opções Avançadas

Se o usuário pedir uma versão específica (não `@latest`):

```bash
npx -y @brunosps00/dev-workflow@<versao> update --lang=$DETECTED_LANG
```

Ex.: `npx -y @brunosps00/dev-workflow@0.4.5 update --lang=pt-br`

## Observações

- `npx -y` evita o prompt "OK to install" quando o pacote não está em cache
- `@latest` ignora o cache do npx e busca a tag `latest` do registry
- `--lang=...` evita o prompt interativo de idioma; o valor vem da detecção automática na etapa 2
- Este comando NÃO atualiza dependências Node do projeto do usuário, apenas o scaffold do dev-workflow

</system_instructions>
