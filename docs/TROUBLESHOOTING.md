# Diagnóstico e solução de problemas

## Coletor não inicia

No diretório do projeto:
```bash
python3 -B scripts/service_ctl.py status
tail -n 100 .netwatch.log
ss -ltnp 'sport = :9876'
python3 --version
ss -V
```

**PORT_BUSY_UNVERIFIED**: há outro programa usando a porta, ou a instância não foi registrada por este repositório. O NetWatch **não irá encerrá-lo**. Identifique e resolva o conflito manualmente; nunca rode `kill -9` indiscriminadamente pela porta.

**PID não confere**: o arquivo antigo/stale não corresponde mais ao processo, ou o PID foi reutilizado. Não delete nem interrompa processos desconhecidos sem verificar `/proc/PID/cmdline`. Apenas remova o `.netwatch.pid` obsoleto depois de confirmar que a instância correspondente não está mais ativa.

**O serviço iniciou mas o navegador não abre**: confira que o mesmo computador Linux possui `127.0.0.1:9876` e que não está tentando abrir do celular/uma máquina remota. O bind por segurança não abre o serviço na LAN.

## Painéis ausentes e contagem parcial

A interface oculta áreas quando o backend não fornece dados. Se nem os filtros nem os gráficos aparecem, verifique o endpoint **somente local**:
```bash
python3 - <<'PY'
import json,urllib.request
with urllib.request.urlopen('http://127.0.0.1:9876/api/connections', timeout=20) as r:
    data=json.load(r)
print('status:',data.get('status'))
print('fontes:',data.get('sources'))
print('resumo:',data.get('summary'))
PY
```

`status=partial` significa fonte indisponível, **não** ausência de conexões. O NetWatch não eleva privilégios. Confirme `ss -tupnaH`, `ss -awpnH` e `ss -xapnH` no usuário atual. Alguns processos são inacessíveis por políticas de `/proc` ou namespace.

Taxas RX/TX: se ainda não há histórico, o worker pode estar formando as primeiras amostras (2 segundos). O projeto não interpreta bytes na interface como velocidade instantânea do link ou payload de pacotes.

## GitHub Pages não conecta

1. O Pages precisa estar publicado **em HTTPS**, não aberto via arquivo `file://`.
2. O computador do visitante precisa executar o coletor Linux **na mesma máquina do navegador**.
3. O coletor precisa ter sido iniciado com **a origem HTTPS exata**:
```bash
bash ./stop.sh
NETWATCH_PAGES_ORIGIN=https://SEU_USUARIO.github.io bash ./start.sh
```
4. Leia o código em `.netwatch-pages-token` e cole no campo. Não compartilhe o valor.
5. Clique em **Conectar meu computador**. No Chrome moderno, permita a requisição de acesso à rede **loopback/local** quando o navegador perguntar.
6. Se houver `TypeError: Failed to fetch`/CORS, confirme a origem, token, políticas do navegador e ausência de HTTPS bloqueado. Use DevTools → Network para verificar o preflight `OPTIONS`. Nunca sugira `--disable-web-security`, extensões de bypass de CORS ou a abertura de firewall.
7. Se reiniciar o coletor, obtenha o **novo código** e repita a conexão.
8. Se o site foi publicado em `https://SEU_USUARIO.github.io/netwatch/`, a variável usa **somente** `https://SEU_USUARIO.github.io`.

Se o navegador não implementar Local Network Access, a prévia fictícia continua funcional; conexão externa pode não ser possível naquele navegador. Confira [documentação Chrome](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access).

## GitHub Actions / Pages falha

Abra **Actions → NetWatch — tests and GitHub Pages → run**. Verifique:
- Pages habilitado com **Source: GitHub Actions** em Settings → Pages.
- `main` é a branch padrão.
- Workflow com permissão `pages: write` e `id-token: write` concedida pelo repositório.
- Arquivos de `web/vendor/liquid-glass/` presentes, inclusive licença MIT.
- `python3 -B scripts/build_pages.py` executado antes de `check_release.py`.
- Não subir a pasta `dist/pages/` para Git; ela é gerada pelo workflow.
- Se `check_release` falhar, remova do artefato o arquivo inesperado ou caminho sensível **na origem** e repita os testes.

## Exportação CSV abre fórmulas

Campos com prefixos `=,+,-,@` são protegidos antes da exportação. Não remova esse filtro; nomes de processo e hosts são dados não confiáveis.

## Coleta via GitHub não é visível no servidor

É o funcionamento esperado. O site GitHub Pages **não hospeda** Python/ss e não captura nada no GitHub. Para dados reais, execute o coletor local. O código nunca deve fingir que dados simulados são reais.

## Ajuda para auditoria

Antes de reportar um bug, colete comandos e mensagens de erro **sem copiar** cache, tokens, IPs privados, linhas de comando sensíveis e usernames. Prefira informar Python/Node/browser/OS, versão do commit, comportamento observado e apenas a saída sanitizada de `status`/`sources`.
