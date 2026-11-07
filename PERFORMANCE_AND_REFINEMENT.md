# NetWatch — diagnóstico e proposta de refinamento (06/11/2026)

> **Registro histórico, não documentação da release atual.** Descreve experimentos e controles ópticos antigos posteriormente removidos. A release vigente usa óptica leve fixa, telemetria atualizada e prévia GitHub Pages. Para instruções atuais, consulte [README](README.md), [arquitetura](docs/ARCHITECTURE.md) e [instalação](docs/INSTALLATION.md).

## Escopo e evidências
- Projeto: `DADOS_LINUX/Antigravity`, branch `main`.
- Diagnóstico via ChatGPTConnector: Chrome 151 + Playwright/CDP, inspeção dos arquivos, Git e pressão de memória Linux.
- O dashboard original montava **20 filtros ópticos SVG** simultaneamente, mesmo nos controles menores.
- A/B no mesmo computador, Chrome headless e rolagem sintética de aproximadamente 2,3–2,6 s (amostras, não benchmark universal):
  - Motor completo: 12–16 frames, mediana do intervalo 183–200 ms;
  - Sem motor SVG: 29–36 frames, mediana 67–83 ms;
  - Orçamento equilibrado anterior (5 superfícies): 22–25 frames, mediana 83–117 ms;
  - **Orçamento equilibrado final (2 superfícies): 27 frames, mediana 83 ms** nas duas passagens;
  - Leve (1 superfície): 29 frames, mediana 83 ms.
- São números de ambiente headless já sobrecarregado. Medição de GPU e FPS da sessão gráfica real continua recomendada.
- RAM na captura de diagnóstico: ~13,6 de 15,7 GB usada, zram/swap ~3,9 de 3,9 GB ocupado; a pressão global pode tornar lentos até modos com zero filtros.
- CSS `backdrop-filter`, SVG `feDisplacementMap` e recriação visual frequente custam composição/paint. Fontes de referência: https://developer.chrome.com/docs/devtools/rendering/performance e https://web.dev/articles/animations-guide.

## Correção aplicada
- Seletor de qualidade óptica no cabeçalho: Desligada (0), Leve (1), Equilibrada (2) e Completa (20).
- Padrão desktop equilibrado: somente cabeçalho e faixa de KPIs usam filtros SVG. Padrão mobile/baixa memória: leve.
- Escolha persistida em `localStorage`; pode ser reproduzida sem persistência com `?glass=off|low|balanced|full`.
- Preferência `prefers-reduced-transparency` faz desligamento seguro.
- Mantidos: API Python, polling de conexões, filtros, tabela, congelamento, SVG original opcional e identidade visual.
- **Não** foi feita limpeza de swap, encerramento de processos de outros aplicativos ou alteração em configurações do sistema operacional.

## Skills disponíveis no ChatGPTConnector e proposta
1. **Impeccable** (`optimize`, `audit`, `polish`, `adapt`): perfilhamento de renderização, acessibilidade, revisão responsiva e refinamento visual baseado em telas reais.
2. **Superpowers/Systematic Debugging** + **Test-Driven Development** + **Verification Before Completion**: hipótese, evidências, teste que falha, correção mínima e verificação antes do commit.
3. **Obscura**: inspecionar estrutura, estados e regressões visuais como complemento. Não usá-lo como prova substituta da GPU/Compositor Chromium.
4. **Craft Anything**: estudar referências e comparar comportamento visual (Study/Build/Check/Refine), sem substituir a arquitetura funcional.
5. **Understand Anything**: mapear o fluxo `server.py` → `app.js` → HTML/CSS → motor óptico e impactos de mudanças.

## Próxima etapa proposta
- Perfilar a sessão gráfica real com Chrome DevTools Performance/Rendering (paint flashing, FPS, GPU), comparando telas e filtragem sob carga.
- Auditar custos do refresh (2 segundos), atualizações de tabela e canvas com Long Animation Frames/API de Performance.
- Corrigir outros gargalos *somente se comprovados*, com testes e commits isolados.
- Refinar contraste, estados de foco, largura mobile e convenções do design system por Impeccable.
- Reavaliar o modo completo somente após demonstrar desempenho aceitável em hardware real.

## Verificação
```bash
python3 -m unittest discover -s tests -v
node --check web/glass.js
```

Smoke tests Chrome: níveis off/low/balanced/full, seleção persistida, filtros web, congelar/retomar, viewport 390 px, ausência de erros JS e sem overflow horizontal.

## Fase II — perfilamento gráfico e refinamento (06/11/2026)

**Ambiente:** Chrome 151 em sessão gráfica X11 :1, perfil temporário próprio; backend Python, frontend JavaScript ESM e Liquid Glass Web preservados.

### Causa comprovada
- Em 4,2 s de rolagem com telemetria ativa, o primeiro perfil registrou 3 long tasks, com máxima de 316 ms; com telemetria congelada, zero long tasks.
- A API de conexões levou 163 a 309 ms em 7 coletas; JSON parse entre 0,4 e 0,8 ms e a montagem JavaScript da tela entre 3,8 e 4,7 ms. Parte relevante do tempo restante pertence à renderização/composição.
- O refresh reconstruía a tabela e redefinia o buffer do canvas a cada atualização mesmo com conteúdos e dimensões iguais. Atribuir canvas.width ou canvas.height reseta o contexto, conforme MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/width

### Correção
- Helpers setMarkupIfChanged (WeakMap) e setTextIfChanged em web/app.js: preservam DOM da tabela, painéis, KPIs e interfaces quando os dados exibidos não mudam.
- renderTimelineChart agora só redimensiona o canvas quando a largura ou altura física mudar e aplica setTransform sem acumulação de escala.
- Acessibilidade: botões de inspeção com dimensão mínima 44×28 px, KPIs acionáveis por teclado, rótulos para controles de busca/fechar e contraste corrigido em hover de ações perigosas.

### Comparação controlada — antes/depois, ambos no Chrome gráfico
| Métrica | Antes | Depois |
|---|---:|---:|
| Média de 12 renderizações do mesmo snapshot | 11,38 ms | 0,72 ms |
| Nós removidos da tabela nas 12 renderizações idênticas | 612 | 0 |
| Redefinições da largura do canvas | 12 | 0 |
| Reconstruções da tabela em 7 coletas reais | 7 | 2 |

### Perfilamento posterior
- 4,2 s de telemetria ativa: 2 long tasks, máxima 90 ms; intervalo p50/p95 entre frames 14/28 ms.
- 4,2 s de telemetria congelada: zero long tasks; p50/p95 14/21 ms.
- Medições dependem da carga do host; não são garantia de FPS constante.

### Skills e evidências
- Impeccable 4.8.0: context, optimize, audit, polish e craft-floor executados/lidos conforme aplicabilidade. Detector técnico executado; identificou baixo contraste no hover de confirmação, corrigido. Outros alertas são texto compacto (11 px), brilho óptico intencional, agrupamentos internos de inspeção e bordas de notificações semânticas; a legibilidade de 11 px sob zoom permanece um ponto de atenção.
- Obscura 0.2.6: navegador isolado bloqueou o endereço local 127.0.0.1 devido à proteção de rede privada. A opção de permitir rede privada não está disponível na chamada isolada utilizada. Não foi contornada essa política nem declarada aprovação Obscura.
- Chrome gráfico: validação de teclado, filtros, drawer, congelamento/retomada, dimensões mobile e nomes de controles, sem execução dos comandos de encerramento de processos.

### Escopo não alterado
Sem mudança em server.py, sem modificar o intervalo padrão de telemetria, sem intervenção nos processos de outros aplicativos, sem limpar swap/zram. Logs, dados DNS/GeoIP e backups permanecem fora do Git.

## Fase III — legibilidade e investigação segura do bloqueio Obscura (06/11/2026)

### Referências consultadas
- https://github.com/h4ckf0r0day/obscura/wiki/Environment-variables
- https://docs.rs/obscura-net/latest/obscura_net/
- https://docs.kernel.org/admin-guide/blockdev/zram.html
- https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
- https://www.w3.org/WAI/WCAG21/Understanding/reflow

### Investigação Obscura
- O Obscura funciona na integração MCP. No endereço público https://example.com, as tools browser_navigate, browser_snapshot, browser_markdown e browser_links passaram; skills.verify para projeto-skills/obscura / inspect retornou fullyVerified=true.
- O acesso a 127.0.0.1 via Obscura está negado pela proteção SSRF padrão. O opt-in upstream --allow-private-network ou OBSCURA_ALLOW_PRIVATE_NETWORK=1 abrange redes privadas além de loopback; **não foi ativado globalmente**.
- O ChatGPTConnector/src/tools/obscura-proxy.ts inicia o subprocesso Obscura com ambiente mínimo e mcp sem opt-in. A skill exige uso da integração MCP existente. A execução direta do binário pelo root.process.exec foi recusada pela allow-list; nenhum contorno foi realizado.
- O Craft Anything web_site_open para alvo local recusou iniciar navegador com consent_required, sem contorno do pedido.
- A auditoria local previamente realizada usa Chrome gráfico, não Obscura. **A verificação da skill em exemplo público não prova auditoria do dashboard local.**
- Evolução segura do conector deve exigir autorização auditável para um alvo loopback específico e limitar redirects, subresources e JavaScript avaliado; ativar rede privada genericamente no subprocesso compartilhado não é uma solução segura.

### Diagnóstico de memória, somente leitura
- MemTotal 16043432 kB; MemAvailable 10088656 kB; SwapTotal 4010748 kB; SwapFree 2071620 kB.
- zram0/mm_stat: orig_data_size 1797410816 bytes; compr_data_size 531402133 bytes; mem_used_total 729751552 bytes.
- /proc/pressure/memory: some e full com médias de 10, 60 e 300 segundos iguais a 0,00%.
- Conclusão: não havia pressão ativa de memória no registro. Nenhuma mudança em zram, swap, kernel, serviços ou processos externos.

### Legibilidade
- CSS original do NetWatch continha 22 declarações de 11px e uma de 10px; JavaScript, duas de 11px. Agora todas são 12px ou mais.
- A tabela de conexões usa base de 13px; hierarquia Liquid Glass e cores semânticas preservadas.
- Atualizadas URLs versionadas de style.css e app.js no web/index.html para evitar cache antigo.
- Tests test_readability.py falharam antes da alteração e passaram após. WCAG prevê 200% de ampliação e reflow, sem tamanho mínimo universal de 12px.
- **Validação de zoom nesta rodada não realizada:** o lançamento por script foi bloqueado pela política de execução e Craft exigiu consentimento explícito. A evidência anterior de 390px antecede esta alteração tipográfica; não substitui nova validação visual.

### Integridade
- Alterações restritas a tipografia CSS, estilos inline, cache-busting, testes e este documento.
- Backend Python e a segurança do ChatGPTConnector não foram alterados.

## Fase IV — validação visual real em 200% e correção de cabeçalho

**Procedimento autorizado:** o Craft Anything \`web_site_open\` continuou retornando \`consent_required\` sem apresentar ao usuário qualquer solicitação visível, apesar da aprovação expressa em chat. A permissão global do ChatGPTConnector estava em "Allow all actions", mas o provider Craft tem gate próprio. Não foi possível obter autorização interativa via este endpoint. Nenhuma permissão global foi alterada.

**Teste alternativo autorizado:** NetWatch já estava aberto no Chrome do usuário, acessível via sessão gráfica \`wayland-0\` do ChatGPTConnector; foi utilizado somente o Chrome já aberto, por interação GUI. Aumentou-se zoom de 100% até **200%** pelo menu Chrome e foram inspecionados cabeçalho, KPIs, gráficos, filtros e tabela durante rolagem.

**Falha observada:** o cabeçalho sticky ocupava cerca de 300 px de altura no zoom 200% e sobrepunha-se aos gráficos e à tabela enquanto a página era rolada.

**Correção:** em \`web/style.css\`, sob \`@media (max-width: 1024px)\`, \`.app-header\` passa a \`position: relative; top: auto;\`. Isso inclui o viewport CSS equivalente ao zoom 200% numa tela de 1920 px, mantendo sticky no desktop de largura CSS superior a 1024 px. \`web/index.html\` foi atualizado com cache-busting para o CSS. O backend, telemetria e controles de processos permanecem inalterados.

**Evidência visual após correção:** no Chrome real a 200%, após recarregar e rolar, o cabeçalho saiu da área de leitura e a tabela ficou visível, com filtros legíveis. A tabela mantém seu \`overflow-x: auto\` dedicado por conter muitas colunas, o que é esperado para dados tabulares. Zoom restaurado a 100% ao terminar.

**Regressão:** \`tests/test_zoom_reflow.py\` foi criado e falhou antes da alteração CSS; após a correção, a suíte integral passou com 17 testes.

**Limitação explícita:** este teste comprova a renderização e a rolagem observadas no Chrome do usuário com viewport físico 1920×1080 a 200% de zoom; não cobre todas as resoluções ou navegadores. A auditoria do NetWatch por Craft continua bloqueada pelo gate de consentimento próprio.
