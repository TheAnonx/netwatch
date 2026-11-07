# Preparação e publicação — GitHub

## Estado do projeto

O repositório inclui: licença MIT do código do NetWatch; atribuição e licença MIT do mecanismo óptico em `web/vendor/liquid-glass/`; testes Python/Node; build estático seguro; workflow GitHub Actions; prévia sem backend; pareamento local somente leitura.

Não publique o resultado de `git status` se contiver mudanças ou caches inesperados. Verifique todas as alterações e a titularidade/licenciamento do código antes de tornar o repositório público.

## Validação obrigatória antes de push

```bash
git status --short
python3 -B -m unittest discover -s tests -v
node --check web/app.js
node --check web/pages.js
node --check web/demo.js
python3 -B scripts/build_pages.py
python3 -B scripts/check_release.py
git ls-files | grep -E '(\.env|\.netwatch|\.geo_cache|\.dns_cache|\.pem|\.key)' || true
```

A última linha deve estar vazia; se exibir caminhos privados, **pare antes do push**. A auditoria prévia encontrou caminhos locais em commits de desenvolvimento antigos. **Não publique a branch local `main` diretamente**: utilize `public-release` com ancestralidade independente (veja abaixo).

O resultado `dist/pages` não contém Python, caches, logs, código de pareamento, nem dados reais. O script de build copia apenas arquivos da lista explícita e a dependência óptica já vendorizada.

## Criar repositório no GitHub

1. Na conta desejada, crie um repositório vazio, por exemplo `netwatch`. Para Pages no plano gratuito, utilize repositório público.
2. Não selecione README ou licença adicional no criador, pois eles já existem no projeto.
3. No projeto local, inspecione seus remotes, então adicione **somente se faltar**:
```bash
git remote -v
git remote add origin https://github.com/SEU_USUARIO/netwatch.git
```
4. Confira as revisões privada e pública **sem trocar a sua branch atual**:
```bash
git branch --show-current
git log -1 --oneline main
git log -1 --oneline public-release
git rev-list --count public-release
git status
```

A branch `public-release` foi criada com **um commit raiz novo**, somente com o conteúdo saneado do projeto, sem os dez commits históricos que continham caminhos da máquina de desenvolvimento. Ela não substitui, apaga ou reescreve a branch `main`. A identidade pública desse snapshot usa o nome genérico `NetWatch contributors` para evitar divulgar email pessoal. Confirme a autoria/licença antes de tornar público.

5. Faça push **somente da branch pública**, mapeando-a para `main` no novo repositório GitHub:
```bash
git push -u origin public-release:main
```

**Não use `git push origin main`:** isso exporia os commits de desenvolvimento e caminhos locais anteriores.

Se já existir `origin`, verifique o URL e use o remoto existente; **não sobrescreva sem intenção**. Não grave tokens GitHub no URL. Prefira Git Credential Manager ou SSH.

### Atualizações futuras

Depois de editar e commitar normalmente na branch local `main`, gere um novo commit **público** contendo apenas a árvore atual:
```bash
python3 -B scripts/prepare_public_branch.py
git push origin public-release:main
```
O script conserva a ancestralidade independente de `public-release`, nunca executa reset/checkout e não envia dados à rede. Se encontrar arquivos privados rastreados ou alterações sem commit, falha sem atualizar a referência.

## Ativar Pages

No repositório, abra **Settings → Pages → Build and deployment → Source: GitHub Actions**. O workflow `.github/workflows/pages.yml`:

1. Executa os testes (Python 3.14 e Node 24 LTS).
2. Monta a prévia estática com `scripts/build_pages.py`.
3. Valida ausência de dados privados com `scripts/check_release.py`.
4. Publica **somente** `dist/pages` via `actions/upload-pages-artifact` e `actions/deploy-pages`.

O resultado padrão fica em `https://SEU_USUARIO.github.io/netwatch/`. Esse URL só existirá depois de criar repositório, habilitar Pages e concluir a action.

Para proteger releases, configure proteção do environment `github-pages`, review obrigatório de pull requests e branch protection em `main`. O workflow usa permissões mínimas para leitura de código e publicação de Pages.

## Checklist de release

- [ ] Titularidade e licença do código confirmadas.
- [ ] Origem do vendor e MIT preservados, sem trocar por pacote remoto.
- [ ] Scripts de serviço não encerram PID alheio.
- [ ] 100% dos testes passam.
- [ ] Revisão de secrets, caminhos pessoais, caches e histórico Git concluída.
- [ ] GitHub Pages abre com aviso **dados fictícios** sem tentativa de conexão local.
- [ ] Nenhum código de pareamento aparece no artefato público.
- [ ] Em Chrome moderno, pareamento exige clique e permissão loopback.
- [ ] Origem incorreta e token incorreto bloqueiam CORS.
- [ ] Somente leitura no Pages; encerramento de processos indisponível.
- [ ] UI móvel e desktop sem erros no Console.
- [ ] Confirmação do URL final e documentação atualizada para o nome real do repositório.

## Rollback

Código: faça `git revert <commit>` na branch privada `main`, execute novamente `python3 -B scripts/prepare_public_branch.py` e publique com `git push origin public-release:main` (sem reescrever histórico público). Pages: também pode ser desativado em Settings → Pages.

Coletor: `bash ./stop.sh` e reinicie a versão anterior com `bash ./start.sh`. Reiniciar invalida o token de pareamento anterior. Não passe parâmetros de rede para bind `0.0.0.0`.

Referências: [GitHub Docs — Configurar Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [workflow personalizado](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
