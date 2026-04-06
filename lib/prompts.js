const readline = require('readline');

function question(prompt, options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const optionsStr = options.map((o, i) => `  ${i + 1}) ${o}`).join('\n');
    rl.question(`\n${prompt}\n${optionsStr}\n\n  Choose [1-${options.length}]: `, (answer) => {
      rl.close();
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < options.length) {
        resolve(options[idx]);
      } else {
        resolve(options[0]);
      }
    });
  });
}

async function selectLanguage(flagLang) {
  if (flagLang && ['en', 'pt-br'].includes(flagLang)) {
    return flagLang;
  }

  const lang = await question('Select language / Selecione o idioma:', [
    'en',
    'pt-br',
  ]);

  return lang;
}

module.exports = { selectLanguage, question };
