# Instalação e uso

## Plataformas e dependências

O coletor exige **Linux** com `/proc`, `ss` e `lsof`. A versão validada no desenvolvimento foi Python **3.14.9** em Arch Linux, iproute2/ss 7.3 e lsof 4.99.7. Não há `pip install`, Node.js nem banco de dados necessários para executar o backend ou o frontend local. Um navegador moderno com JavaScript é obrigatório.

Comandos de dependências:

**Arch Linux:**
```bash
sudo pacman -S --needed python iproute2 lsof
```

**Debian/Ubuntu:**
```bash
sudo apt update
sudo apt install --no-install-recommends python3 iproute2 lsof
```

**Verificação:**
```bash
python3 --version
ss -V
lsof -v
```

Sem `sudo` para executar o NetWatch; privilégios maiores não são necessários nem recomendados. Sockets de outros usuários e namespaces podem não ser visíveis.

## Instalar e executar localmente

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
bash ./start.sh
```

Abra **http://127.0.0.1:9876** no computador do coletor. Para consultar e interromper o serviço:

```bash
python3 -B scripts/service_ctl.py status
bash ./stop.sh
```

O controlador só encerra um PID cuja identidade confirme o `server.py` desta instalação, incluindo `/proc/<pid>/stat`. Se a porta estiver ocupada por outro processo, o start não o assume e o stop não o encerra. Logs ficam em `.netwatch.log` (arquivo ignorado pelo Git).

## Usar somente a prévia pública

Acesse `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`. Sem instalar nada, os filtros, o gráfico, o inspetor e os exemplos funcionam **com dados fictícios**, identificados de maneira permanente. A página não identifica processos nem sockets reais sem um serviço Linux local.

## Habilitar coleta real na página GitHub Pages

1. Publique primeiro o site conforme [RELEASE.md](RELEASE.md), determinando o domínio HTTPS real.
2. No computador Linux do visitante, execute:
```bash
cd SEU_REPOSITORIO
bash ./stop.sh
NETWATCH_PAGES_ORIGIN=https://SEU_USUARIO.github.io bash ./start.sh
```
3. Leia o segredo **localmente** (não envie por email, commit, issue, print ou chat público):
```bash
cat .netwatch-pages-token
```
4. No GitHub Pages, clique em **Fonte** no cabeçalho para abrir o menu. Cole o código no campo **Código do coletor** e clique em **Conectar meu computador**. Clique em **Fonte** novamente, fora do menu ou pressione **Esc** para fechá-lo.
5. Se o Chrome solicitar permissão de acesso à rede local/loopback, permita somente se confiar no domínio e no código publicado.
6. A página muda de demonstração para leitura real. Clique em **Desconectar e mostrar demonstração** para apagar o segredo da memória da aba e retornar ao preview.

**A variável recebe somente a origem HTTPS** (sem `/REPOSITORIO`): `https://SEU_USUARIO.github.io`. Se usar um domínio personalizado, informe a origem HTTPS dele. Reinicie o serviço sempre que mudar essa configuração. O token gira a cada start e deixa de funcionar depois de um restart.

Para desligar o acesso ao GitHub Pages, reinicie **sem** `NETWATCH_PAGES_ORIGIN`:
```bash
bash ./stop.sh
bash ./start.sh
```
Isso desativa a integração e remove o arquivo local de pareamento.

## GeoIP opcional

Por padrão, o NetWatch não envia os IPs observados a serviços externos de GeoIP. Para ativar, o visitante decide:
```bash
bash ./stop.sh
NETWATCH_GEO_PROVIDER=ipwhois bash ./start.sh
```

Para combinar GeoIP e Pages:
```bash
bash ./stop.sh
NETWATCH_GEO_PROVIDER=ipwhois NETWATCH_PAGES_ORIGIN=https://SEU_USUARIO.github.io bash ./start.sh
```

Ao ativar o GeoIP, endereços IP públicos poderão ser enviados ao provedor ipwho.is. Consulte a política de privacidade do provedor antes de usar.

## Testes e build locais

Os testes backend/frontend usam Python e Node.js **24 LTS** (Node é requerido apenas para testes, não para o monitor em produção):

```bash
python3 -B -m unittest discover -s tests -v
node --check web/app.js
node --check web/pages.js
node --check web/demo.js
python3 -B scripts/build_pages.py
python3 -B scripts/check_release.py
```

O build gera `dist/pages/`, **ignorado pelo Git** e composto somente de arquivos estáticos. Ele não inicia um coletor nem acessa a rede. Para experimentar o build estático localmente:

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist/pages
```

Abra `http://127.0.0.1:8765` para testar a demonstração. Para simular o pareamento real do Chrome desde uma origem HTTPS pública, publique o Pages: o navegador impõe regras de segurança diferentes ao HTTPS remoto e ao HTTP local.

O NetWatch não aceita conexões externas automaticamente e **não deve** ser exposto usando `0.0.0.0`, firewall aberto ou proxy reverso para a API de processos.
