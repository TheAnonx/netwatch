# Segurança do NetWatch

## Superfície de ataque e padrão de segurança

O NetWatch inspeciona metadados potencialmente sensíveis e permite encerrar processos **somente pela interface local**. O projeto não deve ser executado como root nem exposto em interfaces de rede públicas. O padrão é `127.0.0.1:9876`; a integração GitHub Pages é desligada salvo configuração explícita de `NETWATCH_PAGES_ORIGIN`.

**Modelo de confiança:** o coletor local está no computador do visitante. A página GitHub Pages é código externo carregado via HTTPS; só recebe os metadados ao inserir um token de pareamento gerado nesse computador. O visitante precisa confiar no código publicado e no domínio autorizado. O token não substitui o controle de permissões do sistema operacional.

## Controles implementados

| Risco | Medida |
| --- | --- |
| Exposição da API na LAN | Bind exclusivo `127.0.0.1`; validação de `Host` |
| CSRF e acesso ao kill | `Origin` same-origin + CSRF token + JSON + limite de payload |
| Uso incorreto de PID | Verificação de UID, `start_ticks`, `pidfd` quando disponível |
| Processo alheio encerrado por scripts | `scripts/service_ctl.py` verifica argumentos reais, UID e início; jamais mata processo por porta |
| Origem Pages maliciosa | Lista exata via `NETWATCH_PAGES_ORIGIN`, CORS condicionado a segredo aleatório |
| Pages chamando kill | Preflight só GET/headers de leitura; POST de origem pública rejeitado |
| Exfiltração por campos de processo | Na rota Pages, `cmdline`, `exe`, `user`, `hostname` e `owners` são omitidos |
| Segredo acidental no Git | `.gitignore`, `0600`, token efêmero renovado no start, build por allowlist e check de release |
| XSS e HTML injetado | Escape de texto de origem, inspeção por dataset em vez de `onclick` inline; CSP de Pages |
| CSV formula injection | Campos perigosos escapados antes da exportação |
| Falha de coleta confundida com ausência | `sources`, `status=partial/error` e erro HTTP 503 quando aplicável |
| Acesso automático ao loopback | O Pages só faz a primeira chamada por clique explícito; `targetAddressSpace='loopback'` |
| DNS/GeoIP para terceiros | GeoIP opt-in; caches nunca entram no artifact nem no commit |

## Orientações operacionais

1. **Nunca exponha a porta 9876 na internet** usando Docker port forwarding, túnel público, reverse proxy ou `0.0.0.0`. O frontend Pages precisa da conexão ao loopback da própria máquina, não de acesso remoto.
2. **Não publique** `.netwatch-pages-token`, `.netwatch.pid`, `.netwatch.log`, `.dns_cache.json`, `.geo_cache.json`, `.env`, outputs de `/proc` ou capturas com IPs privados. Os commits antigos de desenvolvimento incluem caminhos locais, portanto publique apenas a branch isolada `public-release`, não `main`.
3. Use um domínio HTTPS **dedicado** para o Pages sempre que possível. O domínio `SEU_USUARIO.github.io` compartilha origem com outros repositórios Pages sob esse hostname; não use outro código hospedado no mesmo domínio para operações sensíveis.
4. O código de pareamento concede leitura de nomes de processos, PIDs, IPs e portas; proteja-o como segredo. Para invalidar, pare e reinicie o coletor.
5. O frontend de demonstração usa apenas IPs de documentação RFC 5737. A tela deve sempre informar visivelmente que os dados são fictícios.
6. A extensão do navegador, o provedor de GitHub Pages e o operador do repositório são parte do modelo de confiança. Não conecte cópias de páginas ou forks que você não verificou.
7. Não execute o serviço como root. Limite as permissões de processos ao usuário que o inicia.

## Questões residuais e limitações

- CORS não autentica o usuário sozinho; o token de pareamento e a permissão de rede local do navegador complementam a restrição de origem.
- O Pages ainda recebe IPs, PIDs, nomes de processo e contagens reais quando pareado. Esses dados são sensíveis por natureza. A interface não envia telemetria ao GitHub por código próprio, mas código hospedado externamente deve sempre ser revisado.
- O domínio do GitHub Pages pode carregar a fonte Public Sans de Google Fonts; o serviço externo vê uma requisição de fonte do navegador, **não o JSON do NetWatch**. Para política rigorosa de nenhuma conexão com terceiros, desligue os links da fonte ou faça self-hosting dos arquivos legalmente licenciados.
- A ativação explícita de GeoIP compartilha IPs públicos com ipwho.is. Os termos e limites do provedor são externos ao projeto.
- A aplicação não captura conteúdo de pacotes; não detecta tráfego dentro de namespaces de rede que o usuário não consegue observar.
- A segurança depende de navegador atualizado, correções do SO, e integridade dos scripts estáticos que o usuário escolheu abrir.
- A política CSP distribuída via `<meta>` protege vários recursos; ela **não** equivale a headers HTTP de CSP completos, como `frame-ancestors`, que não podem ser configurados diretamente pelo Pages sem proxy. O frontend deve permanecer somente leitura.

## Divulgação de falhas

Não abra issue pública com prova de conceito explorável, tokens, logs completos ou IPs privados. Abra um canal privado via **GitHub Security Advisories → Report a vulnerability** no repositório, quando o maintainer habilitar a opção; se não estiver disponível, solicite primeiro um canal privado ao maintainer sem revelar detalhes da vulnerabilidade.

**Classificação para revisão pré-publicação:** saída de logs/caches: alta; operação kill cross-origin: alta; divulgação de processos via pairing: alto impacto se segredo/origem comprometidos; suporte LNA dependente de navegador: risco de compatibilidade, não autorização automática. A revisão estática e os testes automatizados não substituem pentest independente.

Veja [arquitetura](docs/ARCHITECTURE.md), [instalação](docs/INSTALLATION.md) e [release](docs/RELEASE.md).
