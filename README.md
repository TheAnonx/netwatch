# NetWatch — Monitor de Conexões de Rede em Tempo Real

Dashboard local de inventário de sockets Linux TCP, UDP, RAW e Unix. Exibe o que as ferramentas do usuário conseguem observar; não é captura de pacotes nem garante visibilidade de outros namespaces ou processos sem permissão.

**Plataforma de coleta:** Linux. **Interface:** qualquer navegador moderno; GitHub Pages funciona como demonstração estática e, opcionalmente, visualizador do coletor local.

---

## Prévia no GitHub Pages

O site do GitHub Pages abre **sem instalar nada**, mas começa obrigatoriamente com **dados fictícios** para demonstração. Para ver o tráfego da própria máquina, o visitante instala e executa o coletor Linux e faz um pareamento explícito via código local. O navegador pode solicitar permissão de acesso ao loopback (Chrome Local Network Access); nenhuma coleta real acontece antes do clique.

```text
https://SEU_USUARIO.github.io/netwatch/  ->  preview estático (somente demo)
     [Fonte → Conectar meu computador]   ->  permissão + código de pareamento
http://127.0.0.1:9876                   ->  coletor Linux local e protegido
```

O Pages **não executa Python** e não hospeda o coletor. Mesmo conectado, o Pages é **somente leitura** e a API oculta linhas de comando, usuários e caminhos de executáveis. O controle de encerramento de processos continua exclusivo de `127.0.0.1:9876`.

- [Instalação e pareamento](docs/INSTALLATION.md)
- [Arquitetura e API](docs/ARCHITECTURE.md)
- [Preparação e publicação no GitHub](docs/RELEASE.md) — publicar a branch isolada `public-release`, **não** a branch de desenvolvimento `main`.
- [Diagnóstico](docs/TROUBLESHOOTING.md)
- [Política de segurança](SECURITY.md)
- [Contribuições](CONTRIBUTING.md)

A versão hospedada no GitHub só estará disponível após configurar **Settings → Pages → GitHub Actions** e executar o workflow. A URL acima é ilustrativa até escolher a conta e o repositório.

## Inicialização

```bash
cd netwatch  # pasta clonada do repositório
./start.sh
```

Dashboard disponível em: **http://localhost:9876**

Encerrar o serviço:
```bash
./stop.sh
```

---

## Funcionalidades

### Telemetria em tempo real
- **Taxas RX/TX** medidas em `/proc/net/dev`: soma interfaces físicas para evitar duplicar tráfego de VPN/bridge; quando só existem interfaces virtuais, o retorno declara `virtual_fallback`.
- **Histórico de 60 segundos reais** amostrado a cada 2 s por worker independente dos navegadores, mostrando sockets IP e taxas RX/TX. Amostras inválidas são omitidas.
- **Inventário TCP/UDP, RAW e Unix** por `ss -tupnaH`, `ss -awpnH` e `ss -xapnH`. PIDs vêm de `ss` e do fallback verificável de `lsof`; quando indisponíveis, aparecem como não identificados, nunca atribuídos por nome de porta. Cobertura e erros são informados por família.

### Classificação de conexões

| Categoria | Significado |
|:---|:---|
| Saída (Outbound) | Direção inferida pelo estado e pelos endpoints; não é um rastreamento da origem de pacotes |
| Entrada (Inbound) | Provável conexão recebida em uma porta TCP em escuta |
| Em escuta (Listen) | Apenas sockets TCP em LISTEN |
| Local (Loopback/IPC) | Sockets Unix e conexões IP de loopback |
| UDP vinculado (Bound) | Socket UDP sem destino remoto confirmado; não é TCP em escuta |
| Raw | Sockets raw disponíveis ao usuário atual |
| Não classificado | Direção que não pode ser determinada com segurança |

### Filtros e organização
- Chips de filtro rápido Web, SSH, DNS, Dev, VPN e Rede Pública, exibidos somente quando há registros correspondentes.
- Abas de direção com contadores em tempo real
- Busca textual por processo, PID, IP, porta, país ou provedor
- Filtros de protocolo (TCP/UDP/RAW/UNIX) e estado, criados a partir dos valores presentes na coleta. Abas sem registros são ocultadas.
- Ordenação interativa por qualquer coluna
- Paginação (25, 50, 100, todos)
- Modo congelamento para inspeção sem atualização
- Exportação CSV e JSON

### Inspeção detalhada
- Painel lateral (drawer) com PID, usuário, linha de comando, executável
- DNS reverso com cache local e GeoIP HTTPS opcional via ipwho.is (`NETWATCH_GEO_PROVIDER=ipwhois`). Sem opt-in não são enviados IPs a serviços externos de GeoIP; dados já presentes no cache continuam disponíveis.
- Identificação de ISP, organização e ASN
- Encerramento de processo (SIGTERM / SIGKILL) somente na interface local, com token de sessão, validação same-origin, mesma UID, PID/start_ticks e pidfd quando disponível.

---

## Design

O dashboard usa um **motor óptico Liquid Glass para navegadores**, não somente blur. O código MIT do [liquid-glass-web](https://github.com/Meapri/liquid-glass-web) está fixado no commit `1613f8311dbc31bc2331afcfe51a143c56dd6308` e distribuído localmente em `web/vendor/liquid-glass/`. Ele produz refração com `feDisplacementMap` no `backdrop-filter` do Chromium, dispersão cromática RGB, reflexos especulares ligados à geometria e iluminação das bordas conforme a posição do ponteiro. Não depende do `expo-glass-effect` (API específica de iOS).

- **Tipografia:** Public Sans com `tabular-nums`.
- **Paleta:** fundo azul-marinho escuro; painéis transparentes com reflexos frios; azul para ações; verde/vermelho/amarelo para estados.
- **Superfícies:** cabeçalho flutuante, KPIs, insights, tabela, drawer e modais com acabamento de vidro.
- **Compatibilidade:** Chrome/Chromium oferece refração real do conteúdo atrás dos controles. Browsers sem o compositor SVG-in-backdrop-filter usam a implementação alternativa com blur e reflexos, sem prometer refração idêntica. `prefers-reduced-transparency` reduz os efeitos automaticamente.
- **Performance:** a release mantém **1 superfície refrativa** no cabeçalho, com os demais componentes usando CSS leve. A coleta de rede é separada do motor óptico e o histórico é atualizado por um worker independente dos clientes HTTP.
- **Qualidade óptica:** a release fixa o modo `Leve` (1 superfície refrativa). Não existe seletor; `prefers-reduced-transparency` desativa o efeito por acessibilidade.
- **Tech Stack:** Python 3 (stdlib) para a API; HTML, CSS, JavaScript ESM e SVG no navegador; motor `liquid-glass-web` 0.1.0 compilado com Vite 6.4.2 (somente build). Dependências de navegador são self-hosted, sem CDN de JavaScript. Isto simula o comportamento óptico do material, sem reutilizar código do compositor proprietário da Apple.
- **Versionamento:** Git na branch `main`, com caches DNS/GeoIP, arquivos `.netwatch.*`, backups e credenciais ignorados via `.gitignore`. Consulte `web/vendor/liquid-glass/README.md` para licença, fonte exata e compilação.


---

## Arquitetura

```
server.py             API HTTP local e amostragem de banda (stdlib Python)
telemetry_collector.py Inventário de sockets com fontes e erros explícitos
web/index.html     Estrutura HTML semântica
web/style.css      Design system com variáveis CSS
web/app.js         Lógica frontend, filtros, canvas, drawer
start.sh           Launcher seguro com validação de PID e start_ticks
stop.sh            Encerramento seguro só do processo NetWatch identificado
```

Backend usa `http.server` com `ThreadingMixIn`, limitado a `127.0.0.1:9876` e sem CORS permissivo. Caches DNS/GeoIP são persistidos por escrita atômica. GeoIP público é desativado por padrão; com `NETWATCH_GEO_PROVIDER=ipwhois`, consulta HTTPS com intervalo mínimo e retry após falha (a API gratuita possui limites e termos próprios). Falha de fonte não é apresentada como zero: `/api/connections` retorna `status`, `sources` e `errors` (503 se todas as famílias falharem).
