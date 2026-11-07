# Arquitetura técnica — NetWatch

## Componentes e modos

O NetWatch é um inventário **de sockets Linux**, não um capturador de pacotes. A aplicação possui dois modos de apresentação independentes, com o mesmo renderer de dashboard:

| Modo | Endereço | Origem da telemetria | Capacidades |
| --- | --- | --- | --- |
| Local | `http://127.0.0.1:9876` | `server.py` na própria máquina | Leitura e encerramento controlado de processos |
| GitHub Pages (padrão) | `https://theanonx.github.io/netwatch/` | `demo.js` determinístico | Navegação, filtros, gráficos e exportação de **dados fictícios** |
| GitHub Pages pareado | mesmo endereço HTTPS | `http://127.0.0.1:9876/api/connections` via CORS autorizado | **Somente leitura** de sockets da máquina local, mediante clique e segredo |

O Pages hospeda **somente arquivos estáticos**. Python e `ss` nunca são executados no GitHub. Não existe proxy, túnel para a nuvem, banco externo nem entrega de telemetria à infraestrutura GitHub pelo código de backend.

## Fluxo de dados

```text
            PÁGINA GITHUB PAGES (HTTPS)
         HTML, CSS, JS + preview fictício
                        |
       clique + permissão de rede local + segredo
                        |
                        v
   GET http://127.0.0.1:9876/api/connections
       Origin: https://theanonx.github.io
       X-NetWatch-Read-Token: segredo efêmero
                        |
                        v
             NetWatch local (Linux)
   valida Host, Origin, token e endpoint de leitura
                        |
               coleta com ss / lsof /proc
                        |
       remove cmdline, exe, user, hostname, owners
                        |
             JSON -> navegador (CORS)
```

O JavaScript hospedado no Pages executa no navegador do visitante. A conexão requer o coletor instalado e ativo **na mesma máquina**; localhost não é o servidor GitHub. A permissão Chrome Local Network Access é acionada apenas pela ação explícita de conectar.

## Segurança e fronteiras

- `HOST=127.0.0.1` limita a escuta ao próprio computador.
- `NETWATCH_PAGES_ORIGIN` aceita apenas origem HTTPS exata, sem caminhos, portas arbitrárias ou wildcard.
- O coletor gera um segredo aleatório **a cada inicialização**, salvo em `.netwatch-pages-token`, com modo `0600`, e ignorado pelo Git.
- O código de pareamento fica na memória da aba, não é persistido no navegador, não aparece em URLs e não é enviado aos servidores GitHub.
- O preflight do navegador permite somente `GET` em `/api/connections` e `/api/interfaces` e somente o header `X-NetWatch-Read-Token` para a origem configurada.
- O endpoint `/api/kill` continua exclusivo da interface local. Exige origem local, token CSRF distinto, UID e identidade de PID (`start_ticks`/pidfd).
- O Pages **não recebe** dados de linha de comando, caminho do executável, nome de usuário, DNS reverso e owners detalhados. IPs, PIDs e nomes de processos ainda podem ser sensíveis — a ativação é voluntária.
- O Pages não é uma fronteira de confiança criptograficamente independente do domínio. Em `theanonx.github.io`, outros repositórios da mesma conta compartilham a mesma origem. Para dados sensíveis, use domínio isolado dedicado ao NetWatch e não conecte a cópias desconhecidas.
- Sem pareamento, a interface mostra apenas dados RFC 5737 reservados a documentação, sempre marcados como fictícios.

## Backend (`server.py` e `telemetry_collector.py`)

O coletor usa `ss -tupnaH` (TCP/UDP), `ss -awpnH` (raw), `ss -xapnH` (Unix) e `lsof` para enriquecimento quando disponível. O campo `sources` informa disponibilidade por família; `status=partial` distingue indisponibilidade parcial de zero verdadeiro.

- PID e nome são apresentados apenas quando observáveis; portas conhecidas não determinam identidade.
- `direction=INBOUND/OUTBOUND` é inferência de endpoints/portas, não captura de tráfego e não garante quem iniciou cada conexão.
- `/proc/net/dev` fornece taxa RX/TX. Interfaces físicas têm prioridade para reduzir contagem duplicada de bridges/VPN.
- Um worker de 2 segundos coleta as taxas e mantém histórico por 60 segundos, independente da quantidade de visitantes.
- GeoIP externo fica desligado por padrão. Se ativado, usa HTTPS com o provedor ipwho.is; o usuário autoriza enviar IPs públicos a esse terceiro.
- Permissões de sistema e namespaces do Linux limitam a cobertura; não há elevação de privilégios.

### Contrato HTTP

| Rota | Método | Local | Pages pareado |
| --- | --- | --- | --- |
| `/` | GET | UI local | Não aplicável |
| `/api/connections` | GET | Dados completos | Dados sanitizados |
| `/api/interfaces` | GET | Inventário de interfaces | Inventário de interfaces |
| `/api/session` | GET | Token CSRF para encerrar processo | Proibido |
| `/api/kill` | POST | Protegido (UID/PID/Origin/CSRF) | Proibido |

Apenas `/api/connections` e `/api/interfaces` recebem CORS, condicionado a origem exata e token de leitura. Falha de coleta total retorna HTTP 503; parcial pode retornar 200 com `status=partial`.

## Frontend e build

`web/index.html`, `web/style.css`, `web/glass.js` e `web/app.js` formam a UI comum. O modo Pages adiciona `web/demo.js`, `web/pages.js` e `web/pages.css`, injetados em cópia estática por `scripts/build_pages.py`. Os assets ópticos do fornecedor MIT ficam em `web/vendor/liquid-glass/` com procedência no README.

`scripts/build_pages.py` gera `dist/pages/` a partir de **lista permitida**. Não publica `server.py`, `tests/`, caches, logs, `.env`, token, comandos de sistema ou documentação interna. `scripts/check_release.py` verifica o inventário, proíbe links simbólicos e procura padrões sensíveis.

O workflow `.github/workflows/pages.yml` executa testes e envia somente `dist/pages` ao GitHub Pages.

## Limitações

- Não funciona como coletor nativo no Windows/macOS; eles podem visualizar o preview, mas precisam de um coletor compatível para dados próprios.
- Browsers sem suporte completo à permissão de rede local/loopback podem bloquear a conexão externa. A demonstração permanece funcional.
- GitHub Pages não executa Python, não possui acesso à máquina do visitante e não provê dados reais por si só.
- Ao conectar, o código do site recebe metadados sensíveis sobre a máquina — isso é uma decisão explícita do visitante.
- Extensões do navegador e softwares locais privilegiados não estão sob controle do NetWatch.

Referências: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) · [Chrome Local Network Access](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access).
