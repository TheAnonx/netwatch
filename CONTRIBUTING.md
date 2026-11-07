# Contribuindo com NetWatch

Obrigado por contribuir. O NetWatch observa metadados de rede e processos, portanto mudanças precisam preservar segurança e exatidão da coleta.

## Ambiente de desenvolvimento

Linux, Python 3.14 (ou versão compatível validada) e Node 24 LTS para executar os testes JS. Em produção, não existe requisito de Node/npm. Veja [instalação](docs/INSTALLATION.md).

```bash
python3 -B -m unittest discover -s tests -v
node --check web/app.js
node --check web/pages.js
node --check web/demo.js
python3 -B scripts/build_pages.py
python3 -B scripts/check_release.py
```

## Política de mudanças

- Envie PRs pequenos, com justificativa e testes de regressão.
- Não invente PIDs, nomes de processo, estados ou países quando não forem observáveis; documente a fonte e a incerteza.
- Não adicione operações destrutivas ao Pages; mantenha o pareamento explicitamente somente leitura.
- Toda conexão a serviço de terceiros exige opt-in explícito e documentação de privacidade.
- Não logue ou comite segredos, histórico de navegação, endpoints privados ou caches reais.
- Não declare compatibilidade com Windows/macOS sem um coletor apropriado e testes.
- Vendored code deve manter licença, versão/commit e um processo reproduzível.
- Para mudanças de UI, valide desktop, mobile, acessibilidade, estado sem dados, erro e pausa.
- Correções de segurança devem incluir casos de origem/token inválido e prova de não execução de operações indevidas.

## Licenciamento

O projeto distribui código sob MIT em `LICENSE`. O componente `web/vendor/liquid-glass` possui licença MIT e atribuição de upstream separadas. Ao contribuir, confirme a licença e os direitos sobre suas alterações. Não inclua ativos de terceiros sem permissão apropriada.

Para vulnerabilidades, veja [SECURITY.md](SECURITY.md) e não publique provas sensíveis em issues abertas.
